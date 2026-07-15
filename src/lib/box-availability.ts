import {
  boxTypes,
  getBoxTypeLabel,
  isBoxType,
  type BoxType,
} from "@/lib/box-types";
import { getDateKeysInRange } from "@/lib/date-utils";
import type { DayAvailability } from "@/lib/availability-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

type SettingsRow = {
  total_boxes: number | null;
  outdoor_boxes: number | null;
  indoor_boxes: number | null;
};

type BookingAvailabilityRow = {
  id: string;
  stay_type: "day_care" | "overnight";
  start_date: string;
  end_date: string;
  box_count: number | null;
  box_type: string | null;
};

type AvailabilityOverrideRow = {
  date: string;
  blocked_boxes: number | null;
  box_type: string | null;
};

type ClosedDayRow = {
  date: string;
};

type BoxCounts = Record<BoxType, number>;

type BoxAvailabilityDay = {
  day: string;
  isClosed: boolean;
  totals: BoxCounts;
  available: BoxCounts;
};

type AssignmentResult =
  | {
      ok: true;
      boxType: BoxType;
      unavailableDays: [];
      error: null;
      status: 200;
    }
  | {
      ok: false;
      boxType: null;
      unavailableDays: string[];
      error: string;
      status: 409 | 500;
    };

function getStayDays(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return [startDate];
  }

  return getDateKeysInRange(startDate, endDate, {
    includeEnd: true,
  });
}

function emptyCounts(): BoxCounts {
  return {
    outdoor: 0,
    indoor: 0,
  };
}

function getCount(value: number | null | undefined) {
  return Number.isFinite(value) && value ? Math.max(0, value) : 0;
}

function getRowBoxType(value: string | null | undefined): BoxType {
  return isBoxType(value) ? value : "outdoor";
}

function getSettingsCounts(settings: SettingsRow | null): BoxCounts {
  if (!settings) {
    return emptyCounts();
  }

  const legacyTotalBoxes = getCount(settings.total_boxes);
  const outdoorBoxes =
    settings.outdoor_boxes === null
      ? legacyTotalBoxes
      : getCount(settings.outdoor_boxes);

  return {
    outdoor: outdoorBoxes,
    indoor: getCount(settings.indoor_boxes),
  };
}

function isBookingActiveOnDay(booking: BookingAvailabilityRow, day: string) {
  if (booking.stay_type === "day_care") {
    return booking.start_date === day;
  }

  return booking.start_date <= day && booking.end_date >= day;
}

async function getBoxAvailabilityDays(
  startDate: string,
  endDate: string,
  excludeBookingId?: string,
) {
  const days = getStayDays(startDate, endDate);

  const settingsPromise = supabaseAdmin
    .from("app_settings")
    .select("total_boxes, outdoor_boxes, indoor_boxes")
    .eq("id", 1)
    .single();

  let bookingsQuery = supabaseAdmin
    .from("bookings")
    .select("id, stay_type, start_date, end_date, box_count, box_type")
    .eq("status", "confirmed")
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  if (excludeBookingId) {
    bookingsQuery = bookingsQuery.neq("id", excludeBookingId);
  }

  const [settingsResponse, bookingsResponse, overridesResponse, closedResponse] =
    await Promise.all([
      settingsPromise,
      bookingsQuery,
      supabaseAdmin
        .from("availability_overrides")
        .select("date, blocked_boxes, box_type")
        .gte("date", startDate)
        .lte("date", endDate),
      supabaseAdmin
        .from("closed_days")
        .select("date")
        .gte("date", startDate)
        .lte("date", endDate),
    ]);

  const errors = [
    settingsResponse.error,
    bookingsResponse.error,
    overridesResponse.error,
    closedResponse.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("Box availability fetch error:", errors);

    throw new Error("Errore durante la verifica della disponibilita box.");
  }

  const settingsCounts = getSettingsCounts(
    (settingsResponse.data ?? null) as SettingsRow | null,
  );
  const closedDays = new Set(
    ((closedResponse.data ?? []) as ClosedDayRow[]).map((row) => row.date),
  );
  const bookings = (bookingsResponse.data ?? []) as BookingAvailabilityRow[];
  const overrides =
    (overridesResponse.data ?? []) as AvailabilityOverrideRow[];

  return days.map((day): BoxAvailabilityDay => {
    const occupied = emptyCounts();
    const blocked = emptyCounts();

    bookings.forEach((booking) => {
      if (!isBookingActiveOnDay(booking, day)) {
        return;
      }

      occupied[getRowBoxType(booking.box_type)] += Math.max(
        1,
        getCount(booking.box_count),
      );
    });

    overrides.forEach((override) => {
      if (override.date !== day) {
        return;
      }

      blocked[getRowBoxType(override.box_type)] += getCount(
        override.blocked_boxes,
      );
    });

    const isClosed = closedDays.has(day);
    const available = emptyCounts();

    boxTypes.forEach((boxType) => {
      available[boxType] = isClosed
        ? 0
        : Math.max(
            settingsCounts[boxType] - occupied[boxType] - blocked[boxType],
            0,
          );
    });

    return {
      day,
      isClosed,
      totals: settingsCounts,
      available,
    };
  });
}

export async function getBookingEditAvailability(params: {
  startDate: string;
  endDate: string;
  excludeBookingId: string;
  requestedBoxType?: BoxType | null;
}) {
  const days = await getBoxAvailabilityDays(
    params.startDate,
    params.endDate,
    params.excludeBookingId,
  );
  const selectedTypes: readonly BoxType[] = params.requestedBoxType
    ? [params.requestedBoxType]
    : boxTypes;

  return Object.fromEntries(
    days.map((day) => {
      const totalBoxes = selectedTypes.reduce<number>(
        (total, boxType) => total + day.totals[boxType],
        0,
      );
      const availableBoxes = selectedTypes.reduce<number>(
        (total, boxType) => total + day.available[boxType],
        0,
      );
      const limitedThreshold = Math.max(1, Math.ceil(totalBoxes * 0.25));
      const status: DayAvailability["status"] = day.isClosed
        ? "closed"
        : availableBoxes <= 0
          ? "full"
          : availableBoxes <= limitedThreshold
            ? "limited"
            : "available";

      return [
        day.day,
        {
          date: day.day,
          totalBoxes,
          occupiedBoxes: Math.max(0, totalBoxes - availableBoxes),
          availableBoxes,
          status,
        } satisfies DayAvailability,
      ];
    }),
  ) as Record<string, DayAvailability>;
}

function getUnavailableDays(
  days: BoxAvailabilityDay[],
  boxType: BoxType,
  requiredBoxes: number,
) {
  return days
    .filter((day) => day.isClosed || day.available[boxType] < requiredBoxes)
    .map((day) => day.day);
}

export async function assignBoxTypeForRange(params: {
  startDate: string;
  endDate: string;
  requiredBoxes: number;
  requestedBoxType?: BoxType | null;
  excludeBookingId?: string;
}): Promise<AssignmentResult> {
  try {
    const days = await getBoxAvailabilityDays(
      params.startDate,
      params.endDate,
      params.excludeBookingId,
    );
    const candidates = params.requestedBoxType
      ? [params.requestedBoxType]
      : (["outdoor", "indoor"] as BoxType[]);

    const selectedBoxType = candidates.find(
      (boxType) =>
        getUnavailableDays(days, boxType, params.requiredBoxes).length === 0,
    );

    if (selectedBoxType) {
      return {
        ok: true,
        boxType: selectedBoxType,
        unavailableDays: [],
        error: null,
        status: 200,
      };
    }

    const unavailableDays = params.requestedBoxType
      ? getUnavailableDays(days, params.requestedBoxType, params.requiredBoxes)
      : days
          .filter(
            (day) =>
              day.isClosed ||
              candidates.every(
                (boxType) => day.available[boxType] < params.requiredBoxes,
              ),
          )
          .map((day) => day.day);

    const requestedLabel = params.requestedBoxType
      ? ` ${getBoxTypeLabel(params.requestedBoxType).toLowerCase()}`
      : "";

    return {
      ok: false,
      boxType: null,
      unavailableDays,
      error: `Non ci sono box${requestedLabel} disponibili per ${unavailableDays.join(", ")}.`,
      status: 409,
    };
  } catch (error) {
    console.error("Box type assignment error:", error);

    return {
      ok: false,
      boxType: null,
      unavailableDays: [],
      error: "Errore durante la verifica della disponibilita box.",
      status: 500,
    };
  }
}

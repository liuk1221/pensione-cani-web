import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import {
  assignBoxTypeForRange,
  getBookingEditAvailability,
} from "@/lib/box-availability";
import { normalizeOptionalBoxType } from "@/lib/box-types";
import { sendBookingStatusEmail } from "@/lib/email/booking-emails";
import { calculateBookingEstimate } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabase/admin";

const allowedStatuses = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
] as const;

type BookingStatus = (typeof allowedStatuses)[number];

type BookingCustomer = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type BookingDog = {
  id?: string | null;
  name: string | null;
  size?: string | null;
};

type SelectedExtraService = {
  id?: unknown;
};

type BookingRelation<T> = T | T[] | null;

type BookingDogLink = {
  dog_id?: string | null;
  dog?: BookingRelation<BookingDog>;
};

type CurrentBooking = {
  id: string;
  status: BookingStatus;
  stay_type: "day_care" | "overnight";
  start_date: string;
  end_date: string;
  expected_arrival_time: string | null;
  expected_pickup_time: string | null;
  box_count: number | null;
  box_type: string | null;
  selected_extra_services: SelectedExtraService[] | null;
  customer: BookingRelation<BookingCustomer>;
  dog: BookingRelation<BookingDog>;
  booking_dogs: BookingDogLink[] | null;
};

type BookingToDelete = {
  id: string;
  dog_id: string;
  customer_id: string;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  customer: BookingRelation<BookingCustomer>;
  dog: BookingRelation<BookingDog>;
  booking_dogs: BookingDogLink[] | null;
};

function isBookingStatus(value: unknown): value is BookingStatus {
  return (
    typeof value === "string" &&
    allowedStatuses.includes(value as BookingStatus)
  );
}

function isValidDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function normalizeOptionalTime(value: unknown) {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());

  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
    return undefined;
  }

  return `${match[1]}:${match[2]}`;
}

function getTodayDateKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function getStayType(startDate: string, endDate: string) {
  return startDate === endDate ? "day_care" : "overnight";
}

function getSingleRelation<T>(relation: BookingRelation<T>) {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function getCustomerDisplayName(customer: BookingCustomer | null) {
  const fullName = [customer?.first_name, customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Cliente";
}

function getBookingDogNames(
  primaryDog: BookingDog | null,
  bookingDogs: BookingDogLink[] | null,
) {
  const names =
    bookingDogs
      ?.map((link) => getSingleRelation(link.dog)?.name?.trim())
      .filter(Boolean) ?? [];

  if (names.length > 0) {
    return names.join(", ");
  }

  return primaryDog?.name ?? "il tuo cane";
}

async function getLinkedBookingDogs(
  bookingId: string,
): Promise<BookingDogLink[]> {
  const { data: links, error: linksError } = await supabaseAdmin
    .from("booking_dogs")
    .select("dog_id")
    .eq("booking_id", bookingId);

  if (linksError) {
    console.error("Booking dog links fetch error:", linksError);
    return [];
  }

  const dogIds = Array.from(
    new Set(
      ((links ?? []) as Array<{ dog_id: string | null }>)
        .map((link) => link.dog_id)
        .filter((dogId): dogId is string => Boolean(dogId)),
    ),
  );

  if (dogIds.length === 0) {
    return [];
  }

  const { data: dogs, error: dogsError } = await supabaseAdmin
    .from("dogs")
    .select("id, name, size")
    .in("id", dogIds);

  if (dogsError) {
    console.error("Linked booking dogs fetch error:", dogsError);
    return dogIds.map((dogId) => ({ dog_id: dogId }));
  }

  const dogsById = new Map(
    ((dogs ?? []) as BookingDog[]).map((dog) => [dog.id, dog]),
  );

  return dogIds.map((dogId) => ({
    dog_id: dogId,
    dog: dogsById.get(dogId) ?? null,
  }));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { id } = await context.params;
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!isValidDateKey(from) || !isValidDateKey(to) || to < from) {
    return NextResponse.json(
      { error: "Intervallo disponibilita non valido." },
      { status: 400 },
    );
  }

  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .select("id, box_type")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json(
      { error: "Prenotazione non trovata." },
      { status: 404 },
    );
  }

  try {
    const availabilityByDate = await getBookingEditAvailability({
      startDate: from,
      endDate: to,
      excludeBookingId: id,
      requestedBoxType: normalizeOptionalBoxType(booking.box_type),
    });

    return NextResponse.json({ availabilityByDate });
  } catch (availabilityError) {
    console.error("Booking edit availability error:", availabilityError);

    return NextResponse.json(
      { error: "Errore durante il caricamento della disponibilita." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { id } = await context.params;

  let body: {
    status?: unknown;
    adminNotes?: unknown;
    customerMessage?: unknown;
    updateSchedule?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    expectedArrivalTime?: unknown;
    expectedPickupTime?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON non valido." },
      { status: 400 },
    );
  }

  if (!isBookingStatus(body.status)) {
    return NextResponse.json(
      { error: "Stato prenotazione non valido." },
      { status: 400 },
    );
  }

  const { data: currentBooking, error: currentBookingError } =
    await supabaseAdmin
      .from("bookings")
      .select(
        `
        id,
        status,
        stay_type,
        start_date,
        end_date,
        expected_arrival_time,
        expected_pickup_time,
        box_count,
        box_type,
        selected_extra_services,
        customer:customers (
          first_name,
          last_name,
          email
        ),
        dog:dogs!bookings_dog_id_fkey (
          id,
          name,
          size
        )
      `,
      )
      .eq("id", id)
      .single();

  if (currentBookingError || !currentBooking) {
    console.error("Current booking fetch error:", currentBookingError);

    return NextResponse.json(
      { error: "Prenotazione non trovata." },
      { status: 404 },
    );
  }

  const booking = currentBooking as CurrentBooking;
  const bookingDogs = await getLinkedBookingDogs(booking.id);
  const isScheduleUpdate = body.updateSchedule === true;

  if (
    isScheduleUpdate &&
    (!isValidDateKey(body.startDate) || !isValidDateKey(body.endDate))
  ) {
    return NextResponse.json(
      { error: "Inserisci un intervallo di date valido." },
      { status: 400 },
    );
  }

  const nextStartDate = isScheduleUpdate
    ? (body.startDate as string)
    : booking.start_date;
  const nextEndDate = isScheduleUpdate
    ? (body.endDate as string)
    : booking.end_date;
  const nextArrivalTime = isScheduleUpdate
    ? normalizeOptionalTime(body.expectedArrivalTime)
    : booking.expected_arrival_time?.slice(0, 5) ?? null;
  const nextPickupTime = isScheduleUpdate
    ? normalizeOptionalTime(body.expectedPickupTime)
    : booking.expected_pickup_time?.slice(0, 5) ?? null;

  if (isScheduleUpdate && nextArrivalTime === undefined) {
    return NextResponse.json(
      { error: "L'orario di arrivo non e valido." },
      { status: 400 },
    );
  }

  if (isScheduleUpdate && !nextPickupTime) {
    return NextResponse.json(
      { error: "Inserisci un orario di ritiro valido." },
      { status: 400 },
    );
  }

  if (
    isScheduleUpdate &&
    nextStartDate === nextEndDate &&
    nextArrivalTime &&
    typeof nextPickupTime === "string" &&
    nextPickupTime <= nextArrivalTime
  ) {
    return NextResponse.json(
      { error: "L'orario di ritiro deve essere successivo all'orario di arrivo." },
      { status: 400 },
    );
  }

  const todayKey = getTodayDateKey();

  if (
    isScheduleUpdate &&
    booking.start_date < todayKey &&
    nextStartDate !== booking.start_date
  ) {
    return NextResponse.json(
      { error: "La data di arrivo e gia trascorsa e non puo essere modificata." },
      { status: 400 },
    );
  }

  if (nextEndDate < nextStartDate) {
    return NextResponse.json(
      { error: "La data di uscita non puo essere precedente all'arrivo." },
      { status: 400 },
    );
  }

  let assignedBoxType = normalizeOptionalBoxType(booking.box_type);

  if (
    (body.status === "confirmed" && booking.status !== "confirmed") ||
    isScheduleUpdate
  ) {
    const availabilityStartDate =
      booking.start_date < todayKey ? todayKey : nextStartDate;
    const availabilityCheck = await assignBoxTypeForRange({
      startDate: availabilityStartDate,
      endDate: nextEndDate,
      requiredBoxes: booking.box_count ?? 1,
      requestedBoxType: normalizeOptionalBoxType(booking.box_type),
      excludeBookingId: booking.id,
    });

    if (!availabilityCheck.ok) {
      return NextResponse.json(
        {
          error: availabilityCheck.error,
          unavailableDays: availabilityCheck.unavailableDays,
        },
        { status: availabilityCheck.status },
      );
    }

    assignedBoxType = availabilityCheck.boxType;
  }

  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    status: body.status,
    updated_at: now,
  };

  if (typeof body.adminNotes === "string") {
    updatePayload.admin_notes = body.adminNotes.trim() || null;
  }

  if (body.status === "confirmed") {
    if (booking.status !== "confirmed") {
      updatePayload.confirmed_at = now;
    }
    updatePayload.rejected_at = null;
    updatePayload.cancelled_at = null;
    updatePayload.start_date = nextStartDate;
    updatePayload.end_date = nextEndDate;
    updatePayload.stay_type = getStayType(nextStartDate, nextEndDate);
    updatePayload.box_type = assignedBoxType;
  }

  if (isScheduleUpdate) {
    const primaryDog = getSingleRelation(booking.dog);
    const dogs =
      bookingDogs.length > 0
        ? bookingDogs.map((link) => ({ size: getSingleRelation(link.dog)?.size ?? "" }))
        : [{ size: primaryDog?.size ?? "" }];
    const extraServiceIds = (booking.selected_extra_services ?? [])
      .map((service) => service.id)
      .filter((id): id is string => typeof id === "string");
    const estimate = calculateBookingEstimate({
      startDate: nextStartDate,
      endDate: nextEndDate,
      dogs,
      extraServiceIds,
      expectedPickupTime: nextPickupTime ?? null,
    });

    updatePayload.start_date = nextStartDate;
    updatePayload.end_date = nextEndDate;
    updatePayload.stay_type = getStayType(nextStartDate, nextEndDate);
    updatePayload.expected_arrival_time = nextArrivalTime;
    updatePayload.expected_pickup_time = nextPickupTime;
    updatePayload.estimated_price_cents = estimate.totalCents;
    updatePayload.estimated_price_details = estimate;
    updatePayload.selected_extra_services = estimate.selectedExtras;

    if (body.status === "confirmed") {
      updatePayload.box_type = assignedBoxType;
    }
  }

  if (body.status === "rejected") {
    updatePayload.rejected_at = now;
  }

  if (body.status === "cancelled") {
    updatePayload.cancelled_at = now;
  }

  if (body.status === "completed") {
    updatePayload.cancelled_at = null;
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id, status, admin_notes, stay_type, start_date, end_date, expected_arrival_time, expected_pickup_time, box_type, estimated_price_cents, estimated_price_details, selected_extra_services",
    )
    .single();

  if (error) {
    console.error("Admin booking update error:", error);

    return NextResponse.json(
      { error: "Errore durante l'aggiornamento della prenotazione." },
      { status: 500 },
    );
  }

  const shouldSendStatusEmail =
    (data.status === "confirmed" ||
      data.status === "rejected" ||
      data.status === "completed") &&
    (booking.status !== data.status ||
      booking.start_date !== data.start_date ||
      booking.end_date !== data.end_date);

  const customer = getSingleRelation(booking.customer);
  const dog = getSingleRelation(booking.dog);
  const dogName = getBookingDogNames(dog, bookingDogs);

  if (shouldSendStatusEmail && customer?.email) {
    await sendBookingStatusEmail({
      to: customer.email,
      ownerName: getCustomerDisplayName(customer),
      dogName,
      startDate: data.start_date,
      endDate: data.end_date,
      status: data.status,
      customerMessage: normalizeOptionalString(body.customerMessage),
    }).catch((emailError) => {
      console.error("Admin booking status email error:", emailError);
    });
  }

  return NextResponse.json({
    booking: data,
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { id } = await context.params;

  const { data: booking, error: bookingFetchError } = await supabaseAdmin
    .from("bookings")
    .select(
      `
      id,
      dog_id,
      customer_id,
      status,
      start_date,
      end_date,
      customer:customers (
        first_name,
        last_name,
        email
      ),
      dog:dogs!bookings_dog_id_fkey (
        id,
        name
      )
    `,
    )
    .eq("id", id)
    .single();

  if (bookingFetchError || !booking) {
    console.error("Booking delete fetch error:", bookingFetchError);

    return NextResponse.json(
      { error: "Prenotazione non trovata." },
      { status: 404 },
    );
  }

  const bookingToDelete = booking as BookingToDelete;
  const customer = getSingleRelation(bookingToDelete.customer);
  const dog = getSingleRelation(bookingToDelete.dog);
  const bookingDogs = await getLinkedBookingDogs(bookingToDelete.id);
  const dogName = getBookingDogNames(dog, bookingDogs);
  const dogIds = Array.from(
    new Set(
      [
        bookingToDelete.dog_id,
        ...bookingDogs.map((link) => link.dog_id),
      ].filter((dogId): dogId is string => Boolean(dogId)),
    ),
  );

  const { error: bookingDeleteError } = await supabaseAdmin
    .from("bookings")
    .delete()
    .eq("id", bookingToDelete.id);

  if (bookingDeleteError) {
    console.error("Booking delete error:", bookingDeleteError);

    return NextResponse.json(
      { error: "Errore durante l'eliminazione della prenotazione." },
      { status: 500 },
    );
  }

  if (bookingToDelete.status === "pending" && customer?.email) {
    await sendBookingStatusEmail({
      to: customer.email,
      ownerName: getCustomerDisplayName(customer),
      dogName,
      startDate: bookingToDelete.start_date,
      endDate: bookingToDelete.end_date,
      status: "rejected",
    }).catch((emailError) => {
      console.error("Deleted pending booking rejection email error:", emailError);
    });
  }

  await Promise.all(
    dogIds.map(async (dogId) => {
      const [{ count: directCount, error: directCountError }, { count: linkCount, error: linkCountError }] =
        await Promise.all([
          supabaseAdmin
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("dog_id", dogId),
          supabaseAdmin
            .from("booking_dogs")
            .select("booking_id", { count: "exact", head: true })
            .eq("dog_id", dogId),
        ]);

      if (directCountError) {
        console.error("Dog booking count error:", directCountError);
      }

      if (linkCountError) {
        console.error("Dog booking link count error:", linkCountError);
      }

      if (
        !directCountError &&
        !linkCountError &&
        directCount === 0 &&
        linkCount === 0
      ) {
        const { error: dogDeleteError } = await supabaseAdmin
          .from("dogs")
          .delete()
          .eq("id", dogId);

        if (dogDeleteError) {
          console.error("Dog delete error:", dogDeleteError);
        }
      }
    }),
  );

  const { count: customerBookingCount, error: customerBookingCountError } =
    await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", bookingToDelete.customer_id);

  const { count: customerDogCount, error: customerDogCountError } =
    await supabaseAdmin
      .from("dogs")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", bookingToDelete.customer_id);

  if (customerBookingCountError) {
    console.error("Customer booking count error:", customerBookingCountError);
  }

  if (customerDogCountError) {
    console.error("Customer dog count error:", customerDogCountError);
  }

  if (
    !customerBookingCountError &&
    !customerDogCountError &&
    customerBookingCount === 0 &&
    customerDogCount === 0
  ) {
    const { error: customerDeleteError } = await supabaseAdmin
      .from("customers")
      .delete()
      .eq("id", bookingToDelete.customer_id);

    if (customerDeleteError) {
      console.error("Customer delete error:", customerDeleteError);
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Prenotazione e dati collegati eliminati correttamente.",
  });
}

import { supabaseAdmin } from "@/lib/supabase/admin";
import { toDateKey } from "@/lib/date-utils";
import type { DayAvailability } from "@/lib/availability-types";

type AvailabilityRow = {
  day: string;
  total_boxes: number;
  occupied_boxes: number;
  blocked_boxes: number;
  available_boxes: number;
  status: "available" | "limited" | "full" | "closed";
};

export function getDefaultAvailabilityRange() {
  const today = new Date();

  const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const toDate = new Date(today.getFullYear(), today.getMonth() + 12, 0);

  return {
    from: toDateKey(fromDate),
    to: toDateKey(toDate),
  };
}

export function isValidDateKey(value: string | null): value is string {
  if (!value) {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function getPublicAvailability(from: string, to: string) {
  const { data, error } = await supabaseAdmin.rpc("get_public_availability", {
    from_date: from,
    to_date: to,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as AvailabilityRow[];

  return Object.fromEntries(
    rows.map((row) => [
      row.day,
      {
        date: row.day,
        totalBoxes: row.total_boxes,
        occupiedBoxes: row.occupied_boxes + row.blocked_boxes,
        availableBoxes: row.available_boxes,
        status: row.status,
      },
    ]),
  ) as Record<string, DayAvailability>;
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { isValidDateKey } from "@/lib/availability";
import { isBoxType, type BoxType } from "@/lib/box-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

type DogRow = {
  id: string;
  name: string;
  breed: string | null;
  size: string;
};

type BookingDogLinkRow = {
  booking_id: string;
  dog_id: string;
  position: number;
};

type CustomerRow = {
  first_name: string;
  last_name: string;
};

type PresenceBookingRow = {
  id: string;
  stay_type: "day_care" | "overnight";
  start_date: string;
  end_date: string;
  expected_arrival_time: string | null;
  expected_pickup_time: string | null;
  box_type: string | null;
  box_count: number | null;
  customer: CustomerRow | CustomerRow[] | null;
  dog: DogRow | DogRow[] | null;
};

function getSingleRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function getBoxType(value: string | null): BoxType {
  return isBoxType(value) ? value : "outdoor";
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get("date");

  if (!isValidDateKey(date)) {
    return NextResponse.json(
      { error: "Data non valida. Usa il formato YYYY-MM-DD." },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      `
      id,
      stay_type,
      start_date,
      end_date,
      expected_arrival_time,
      expected_pickup_time,
      box_type,
      box_count,
      customer:customers (
        first_name,
        last_name
      ),
      dog:dogs!bookings_dog_id_fkey (
        id,
        name,
        breed,
        size
      )
    `,
    )
    .eq("status", "confirmed")
    .lte("start_date", date)
    .gte("end_date", date)
    .order("expected_arrival_time", { ascending: true });

  if (error) {
    console.error("Admin presences fetch error:", error);

    return NextResponse.json(
      { error: "Errore durante il caricamento delle presenze." },
      { status: 500 },
    );
  }

  const bookings = (data ?? []) as PresenceBookingRow[];
  const bookingIds = bookings.map((booking) => booking.id);
  const linksByBookingId = new Map<string, BookingDogLinkRow[]>();
  const dogsById = new Map<string, DogRow>();

  if (bookingIds.length > 0) {
    const { data: linksData, error: linksError } = await supabaseAdmin
      .from("booking_dogs")
      .select("booking_id, dog_id, position")
      .in("booking_id", bookingIds);

    if (linksError) {
      console.error("Admin presence dog links fetch error:", linksError);
    } else {
      const links = (linksData ?? []) as BookingDogLinkRow[];

      links.forEach((link) => {
        const current = linksByBookingId.get(link.booking_id) ?? [];
        current.push(link);
        linksByBookingId.set(link.booking_id, current);
      });

      const dogIds = Array.from(new Set(links.map((link) => link.dog_id)));

      if (dogIds.length > 0) {
        const { data: dogsData, error: dogsError } = await supabaseAdmin
          .from("dogs")
          .select("id, name, breed, size")
          .in("id", dogIds);

        if (dogsError) {
          console.error("Admin presence dogs fetch error:", dogsError);
        } else {
          ((dogsData ?? []) as DogRow[]).forEach((dog) => {
            dogsById.set(dog.id, dog);
          });
        }
      }
    }
  }

  const presences = bookings.map((booking) => {
    const linkedDogs = (linksByBookingId.get(booking.id) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((link) => dogsById.get(link.dog_id))
      .filter((dog): dog is DogRow => Boolean(dog));
    const primaryDog = getSingleRelation(booking.dog);
    const dogs =
      linkedDogs.length > 0
        ? linkedDogs
        : primaryDog
          ? [primaryDog]
          : [];
    const customer = getSingleRelation(booking.customer);

    return {
      bookingId: booking.id,
      boxType: getBoxType(booking.box_type),
      boxCount: Math.max(1, Number(booking.box_count) || 1),
      stayType: booking.stay_type,
      startDate: booking.start_date,
      endDate: booking.end_date,
      expectedArrivalTime: booking.expected_arrival_time,
      expectedPickupTime: booking.expected_pickup_time,
      ownerName: customer
        ? `${customer.first_name} ${customer.last_name}`.trim()
        : "Proprietario non indicato",
      dogs,
    };
  });

  return NextResponse.json({
    date,
    presences,
  });
}

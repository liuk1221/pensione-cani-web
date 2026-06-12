import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getDateKeysInRange } from "@/lib/date-utils";
import { sendBookingStatusEmail } from "@/lib/email/booking-emails";
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
  box_count: number | null;
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

type AvailabilityRow = {
  day: string;
  total_boxes: number;
  occupied_boxes: number;
  blocked_boxes: number;
  available_boxes: number;
  status: "available" | "limited" | "full" | "closed";
};

function isBookingStatus(value: unknown): value is BookingStatus {
  return (
    typeof value === "string" &&
    allowedStatuses.includes(value as BookingStatus)
  );
}

function isValidDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
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

function getStayDays(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return [startDate];
  }

  return getDateKeysInRange(startDate, endDate, {
    includeEnd: true,
  });
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

async function getLinkedBookingDogs(bookingId: string) {
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
    .select("id, name")
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

async function checkAvailabilityBeforeConfirm(
  startDate: string,
  endDate: string,
  requiredBoxes: number,
) {
  const { data, error } = await supabaseAdmin.rpc("get_public_availability", {
    from_date: startDate,
    to_date: endDate,
  });

  if (error) {
    console.error("Availability check before confirm error:", error);

    return {
      ok: false,
      error: "Errore durante la verifica della disponibilita.",
      unavailableDays: [],
      status: 500,
    };
  }

  const rows = (data ?? []) as AvailabilityRow[];
  const rowsByDay = new Map(rows.map((row) => [row.day, row]));
  const unavailableDays = getStayDays(startDate, endDate).filter((day) => {
    const availability = rowsByDay.get(day);

    return (
      !availability ||
      availability.status === "closed" ||
      availability.available_boxes < requiredBoxes
    );
  });

  if (unavailableDays.length > 0) {
    return {
      ok: false,
      error: `Impossibile confermare: non ci sono slot disponibili per ${unavailableDays.join(", ")}.`,
      unavailableDays,
      status: 409,
    };
  }

  return {
    ok: true,
    error: null,
    unavailableDays: [],
    status: 200,
  };
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
    startDate?: unknown;
    endDate?: unknown;
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
        box_count,
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

  if (currentBookingError || !currentBooking) {
    console.error("Current booking fetch error:", currentBookingError);

    return NextResponse.json(
      { error: "Prenotazione non trovata." },
      { status: 404 },
    );
  }

  const booking = currentBooking as CurrentBooking;
  const bookingDogs = await getLinkedBookingDogs(booking.id);
  const nextStartDate =
    body.status === "confirmed" && isValidDateKey(body.startDate)
      ? body.startDate
      : booking.start_date;
  const nextEndDate =
    body.status === "confirmed" && isValidDateKey(body.endDate)
      ? body.endDate
      : booking.end_date;

  if (nextEndDate < nextStartDate) {
    return NextResponse.json(
      { error: "La data di uscita non puo essere precedente all'arrivo." },
      { status: 400 },
    );
  }

  if (body.status === "confirmed" && booking.status !== "confirmed") {
    const availabilityCheck = await checkAvailabilityBeforeConfirm(
      nextStartDate,
      nextEndDate,
      booking.box_count ?? 1,
    );

    if (!availabilityCheck.ok) {
      return NextResponse.json(
        {
          error: availabilityCheck.error,
          unavailableDays: availabilityCheck.unavailableDays,
        },
        { status: availabilityCheck.status },
      );
    }
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
    updatePayload.confirmed_at = now;
    updatePayload.rejected_at = null;
    updatePayload.cancelled_at = null;
    updatePayload.start_date = nextStartDate;
    updatePayload.end_date = nextEndDate;
    updatePayload.stay_type = getStayType(nextStartDate, nextEndDate);
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
    .select("id, status, admin_notes, stay_type, start_date, end_date")
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

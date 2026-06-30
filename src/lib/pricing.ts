import {
  bookingPricing,
  extraServices,
  type ExtraServiceId,
} from "@/lib/listino-config";
import { getDateKeysInRange } from "@/lib/date-utils";

export type EstimateDog = {
  size?: string | "";
};

export type BookingEstimate = {
  stayType: "day_care" | "overnight";
  quantity: number;
  dogCount: number;
  overnightUnitRateCents: number | null;
  overnightRateLabel: string | null;
  baseSubtotalCents: number;
  baseBeforeDiscountsCents: number;
  secondDogDiscountCents: number;
  extrasSubtotalCents: number;
  totalCents: number;
  selectedExtras: Array<{
    id: ExtraServiceId;
    service: string;
    amountCents: number;
    totalCents: number;
    billingUnit: string;
  }>;
  isComplete: boolean;
  isPickupTimeComplete: boolean;
  hasMinimumPriceServices: boolean;
};

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function getStayQuantity(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return 1;
  }

  return Math.max(1, getDateKeysInRange(startDate, endDate).length);
}

export function getStayType(startDate: string, endDate: string) {
  return startDate === endDate ? "day_care" : "overnight";
}

function getOvernightRateTier(quantity: number) {
  return bookingPricing.overnightRateTiers.reduce(
    (selectedTier, tier) =>
      quantity >= tier.minNights ? tier : selectedTier,
    bookingPricing.overnightRateTiers[0],
  );
}

export function isLatePickupTime(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const match = /^(\d{2}):(\d{2})/.exec(value.trim());

  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return false;
  }

  return hours * 60 + minutes > 11 * 60;
}

function getExtraServiceTotalCents(
  service: (typeof extraServices)[number],
  quantity: number,
  dogCount: number,
) {
  const amountCents = service.amountCents ?? 0;

  if (service.billingUnit === "per_day_per_dog") {
    return amountCents * quantity * dogCount;
  }

  if (service.billingUnit === "per_dog_once") {
    return amountCents * dogCount;
  }

  return amountCents;
}

export function calculateBookingEstimate(params: {
  startDate: string;
  endDate: string;
  dogs: EstimateDog[];
  extraServiceIds: string[];
  expectedPickupTime?: string | null;
}): BookingEstimate {
  const stayType = getStayType(params.startDate, params.endDate);
  const quantity = getStayQuantity(params.startDate, params.endDate);
  const validDogs = params.dogs.slice(0, bookingPricing.maxDogsPerBooking);
  const dogCount = validDogs.length;
  const isPickupTimeComplete =
    typeof params.expectedPickupTime === "string" &&
    params.expectedPickupTime.trim().length > 0;
  const isComplete = dogCount > 0 && isPickupTimeComplete;
  const overnightRateTier =
    stayType === "overnight" ? getOvernightRateTier(quantity) : null;
  const overnightUnitRateCents = overnightRateTier?.amountCents ?? null;

  const baseBeforeSharedBoxDiscount = validDogs.reduce((total, dog) => {
    if (!dog) {
      return total;
    }

    const unitRate =
      stayType === "day_care"
        ? bookingPricing.dayCareRateCents
        : (overnightUnitRateCents ?? bookingPricing.dayCareRateCents);

    return total + unitRate * quantity;
  }, 0);

  const secondDogDiscountCents =
    dogCount >= 2
      ? Math.round(
          ((stayType === "day_care"
            ? bookingPricing.dayCareRateCents
            : (overnightUnitRateCents ?? 0)) *
            quantity *
            bookingPricing.secondDogDiscountPercent) /
            100,
        )
      : 0;

  const baseSubtotalCents =
    baseBeforeSharedBoxDiscount - secondDogDiscountCents;

  const selectedExtraServiceIds = new Set(
    params.extraServiceIds.filter((id) => id !== "late_pickup"),
  );

  if (isLatePickupTime(params.expectedPickupTime)) {
    selectedExtraServiceIds.add("late_pickup");
  }

  const selectedExtras = extraServices
    .filter((service) => selectedExtraServiceIds.has(service.id ?? ""))
    .map((service) => {
      const amountCents = service.amountCents ?? 0;

      return {
        id: service.id as ExtraServiceId,
        service: service.service,
        amountCents,
        totalCents: getExtraServiceTotalCents(service, quantity, dogCount),
        billingUnit: service.billingUnit ?? "per_booking",
      };
    });

  const extrasSubtotalCents = selectedExtras.reduce(
    (total, service) => total + service.totalCents,
    0,
  );

  const hasMinimumPriceServices = selectedExtras.some((service) =>
    ["bath_before_pickup", "local_transport"].includes(service.id),
  );

  return {
    stayType,
    quantity,
    dogCount,
    overnightUnitRateCents,
    overnightRateLabel: overnightRateTier?.label ?? null,
    baseSubtotalCents,
    baseBeforeDiscountsCents: baseBeforeSharedBoxDiscount,
    secondDogDiscountCents,
    extrasSubtotalCents,
    totalCents: baseSubtotalCents + extrasSubtotalCents,
    selectedExtras,
    isComplete,
    isPickupTimeComplete,
    hasMinimumPriceServices,
  };
}

import {
  bookingPricing,
  extraServices,
  type DogSize,
  type ExtraServiceId,
} from "@/lib/listino-config";
import { getDateKeysInRange } from "@/lib/date-utils";

export type EstimateDog = {
  size: DogSize | "";
};

export type BookingEstimate = {
  stayType: "day_care" | "overnight";
  quantity: number;
  dogCount: number;
  baseSubtotalCents: number;
  secondDogDiscountCents: number;
  longStayDiscountCents: number;
  extrasSubtotalCents: number;
  totalCents: number;
  selectedExtras: Array<{
    id: ExtraServiceId;
    service: string;
    amountCents: number;
    billingUnit: string;
  }>;
  isComplete: boolean;
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

export function calculateBookingEstimate(params: {
  startDate: string;
  endDate: string;
  dogs: EstimateDog[];
  extraServiceIds: string[];
}): BookingEstimate {
  const stayType = getStayType(params.startDate, params.endDate);
  const quantity = getStayQuantity(params.startDate, params.endDate);
  const validDogs = params.dogs.slice(0, bookingPricing.maxDogsPerBooking);
  const dogCount = validDogs.length;
  const isComplete = dogCount > 0 && validDogs.every((dog) => dog.size);

  const baseBeforeSharedBoxDiscount = validDogs.reduce((total, dog) => {
    if (!dog.size) {
      return total;
    }

    const unitRate =
      stayType === "day_care"
        ? bookingPricing.dayCareRateCents
        : bookingPricing.overnightRatesBySize[dog.size];

    return total + unitRate * quantity;
  }, 0);

  const secondDogDiscountCents =
    dogCount >= 2
      ? Math.round(
          ((validDogs[1]?.size
            ? (stayType === "day_care"
                ? bookingPricing.dayCareRateCents
                : bookingPricing.overnightRatesBySize[validDogs[1].size]) *
              quantity
            : 0) *
            bookingPricing.secondDogDiscountPercent) /
            100,
        )
      : 0;

  const baseSubtotalCents =
    baseBeforeSharedBoxDiscount - secondDogDiscountCents;

  const longStayDiscountCents =
    stayType === "overnight" && quantity >= bookingPricing.longStayMinNights
      ? Math.round(
          (baseSubtotalCents * bookingPricing.longStayDiscountPercent) / 100,
        )
      : 0;

  const selectedExtras = extraServices
    .filter((service) => params.extraServiceIds.includes(service.id ?? ""))
    .map((service) => ({
      id: service.id as ExtraServiceId,
      service: service.service,
      amountCents: service.amountCents ?? 0,
      billingUnit: service.billingUnit ?? "per_booking",
    }));

  const extrasSubtotalCents = selectedExtras.reduce((total, service) => {
    if (service.billingUnit === "per_day_per_dog") {
      return total + service.amountCents * quantity * dogCount;
    }

    if (service.billingUnit === "per_dog_once") {
      return total + service.amountCents * dogCount;
    }

    return total + service.amountCents;
  }, 0);

  const hasMinimumPriceServices = selectedExtras.some((service) =>
    ["bath_before_pickup", "local_transport"].includes(service.id),
  );

  return {
    stayType,
    quantity,
    dogCount,
    baseSubtotalCents,
    secondDogDiscountCents,
    longStayDiscountCents,
    extrasSubtotalCents,
    totalCents: baseSubtotalCents - longStayDiscountCents + extrasSubtotalCents,
    selectedExtras,
    isComplete,
    hasMinimumPriceServices,
  };
}

export type DayAvailabilityStatus =
  | "available"
  | "limited"
  | "full"
  | "closed"
  | "unknown"
  | "past";

export type DayAvailability = {
  date: string;
  totalBoxes: number;
  occupiedBoxes: number;
  availableBoxes: number;
  status: DayAvailabilityStatus;
};

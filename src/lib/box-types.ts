export const boxTypes = ["outdoor", "indoor"] as const;

export type BoxType = (typeof boxTypes)[number];

export const boxTypeLabels: Record<BoxType, string> = {
  outdoor: "Box esterno",
  indoor: "Box interno",
};

export function isBoxType(value: unknown): value is BoxType {
  return typeof value === "string" && boxTypes.includes(value as BoxType);
}

export function normalizeOptionalBoxType(value: unknown) {
  return isBoxType(value) ? value : null;
}

export function getBoxTypeLabel(value: BoxType | string | null | undefined) {
  return isBoxType(value) ? boxTypeLabels[value] : "Non indicata";
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}/${month}/${year}`;
}

export function compareDateKeys(a: string, b: string) {
  return a.localeCompare(b);
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function getDateKeysInRange(
  startDate: string,
  endDate: string,
  options: { includeEnd?: boolean } = {},
) {
  const includeEnd = options.includeEnd ?? false;

  if (compareDateKeys(startDate, endDate) > 0) {
    return [];
  }

  const result: string[] = [];
  let currentDate = startDate;

  while (
    includeEnd
      ? compareDateKeys(currentDate, endDate) <= 0
      : compareDateKeys(currentDate, endDate) < 0
  ) {
    result.push(currentDate);
    currentDate = addDaysToDateKey(currentDate, 1);
  }

  return result;
}

export function formatWarehouseDate(value: string, timeZone = "Asia/Jakarta", dateStyle: Intl.DateTimeFormatOptions["dateStyle"] = "medium") {
  return new Intl.DateTimeFormat("id-ID", { dateStyle, timeStyle: "short", timeZone }).format(new Date(value));
}

export function formatWarehouseDay(value: string, timeZone = "Asia/Jakarta") {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone }).format(new Date(value));
}


export function warehouseDateKey(value: string, timeZone = "Asia/Jakarta") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function nextDateKey(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

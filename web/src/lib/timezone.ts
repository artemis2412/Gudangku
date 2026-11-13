export function formatWarehouseDate(value: string, timeZone = "Asia/Jakarta", dateStyle: Intl.DateTimeFormatOptions["dateStyle"] = "medium") {
  return new Intl.DateTimeFormat("id-ID", { dateStyle, timeStyle: "short", timeZone }).format(new Date(value));
}

export function formatWarehouseDay(value: string, timeZone = "Asia/Jakarta") {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone }).format(new Date(value));
}

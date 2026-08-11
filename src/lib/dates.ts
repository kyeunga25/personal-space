const HONG_KONG_DATE = new Intl.DateTimeFormat("zh-Hant-HK", {
  dateStyle: "medium",
  timeZone: "Asia/Hong_Kong",
});

const HONG_KONG_MONTH = new Intl.DateTimeFormat("zh-Hant-HK", {
  month: "long",
  timeZone: "Asia/Hong_Kong",
  year: "numeric",
});

const ARCHIVE_MONTH_PATTERN = /^(0[1-9]|1[0-2])$/;
const ARCHIVE_YEAR_PATTERN = /^(?!0000)\d{4}$/;

export function isArchiveMonth(value: string): boolean {
  return ARCHIVE_MONTH_PATTERN.test(value);
}

export function isArchiveYear(value: string): boolean {
  return ARCHIVE_YEAR_PATTERN.test(value);
}

export function formatHongKongDate(value: string | null): string {
  if (!value?.trim()) return "未發佈 · Unpublished";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? HONG_KONG_DATE.format(new Date(timestamp))
    : "日期不明 · Date unavailable";
}

export function formatHongKongMonth(value: string): string {
  return HONG_KONG_MONTH.format(new Date(`${value}-01T00:00:00+08:00`));
}

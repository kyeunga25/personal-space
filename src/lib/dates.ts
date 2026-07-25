const HONG_KONG_DATE = new Intl.DateTimeFormat("zh-Hant-HK", {
  dateStyle: "medium",
  timeZone: "Asia/Hong_Kong",
});

const HONG_KONG_MONTH = new Intl.DateTimeFormat("zh-Hant-HK", {
  month: "long",
  timeZone: "Asia/Hong_Kong",
  year: "numeric",
});

export function formatHongKongDate(value: string | null): string {
  return value ? HONG_KONG_DATE.format(new Date(value)) : "未發佈";
}

export function formatHongKongMonth(value: string): string {
  return HONG_KONG_MONTH.format(new Date(`${value}-01T00:00:00+08:00`));
}

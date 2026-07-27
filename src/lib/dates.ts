const HONG_KONG_DATE = new Intl.DateTimeFormat("zh-Hant-HK", {
  dateStyle: "medium",
  timeZone: "Asia/Hong_Kong",
});

export function formatHongKongDate(value: string | null): string {
  return value ? HONG_KONG_DATE.format(new Date(value)) : "未發佈";
}

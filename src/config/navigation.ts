export type NavigationIcon =
  | "home"
  | "short"
  | "longform"
  | "briefing"
  | "stream"
  | "note"
  | "article"
  | "edition"
  | "channel"
  | "archive"
  | "search"
  | "about";

export interface NavigationItem {
  href: string;
  icon: NavigationIcon;
  label: string;
  labelEn: string;
  mobileLabel?: string;
}

export const primaryNavigation = [
  { href: "/", icon: "home", label: "首頁", labelEn: "Home" },
  { href: "/shorts", icon: "short", label: "短內容", labelEn: "Shorts" },
  {
    href: "/longform",
    icon: "longform",
    label: "長內容",
    labelEn: "Longform",
  },
  {
    href: "/briefings",
    icon: "briefing",
    label: "新聞整理",
    labelEn: "Briefings",
    mobileLabel: "新聞",
  },
  { href: "/archive", icon: "archive", label: "封存", labelEn: "Archive" },
  { href: "/search", icon: "search", label: "搜尋", labelEn: "Search" },
  { href: "/about", icon: "about", label: "關於", labelEn: "About" },
] as const satisfies readonly NavigationItem[];

export const mobileNavigation = primaryNavigation.filter(({ href }) =>
  ["/", "/shorts", "/longform", "/briefings", "/search"].includes(href),
);

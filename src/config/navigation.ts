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
  { href: "/notes", icon: "note", label: "筆記", labelEn: "Notes" },
  {
    href: "/articles",
    icon: "article",
    label: "文章",
    labelEn: "Articles",
  },
  {
    href: "/editions",
    icon: "edition",
    label: "整理",
    labelEn: "Editions",
  },
  {
    href: "/stream",
    icon: "stream",
    label: "動態",
    labelEn: "Stream",
  },
  { href: "/archive", icon: "archive", label: "封存", labelEn: "Archive" },
  { href: "/search", icon: "search", label: "搜尋", labelEn: "Search" },
  { href: "/about", icon: "about", label: "關於", labelEn: "About" },
] as const satisfies readonly NavigationItem[];

export const mobileNavigation = primaryNavigation.filter(({ href }) =>
  ["/", "/notes", "/articles", "/stream", "/search"].includes(href),
);

export const profileNavigation = primaryNavigation.filter(
  ({ href }) =>
    href === "/notes" || href === "/articles" || href === "/editions",
);

export type NavigationIcon =
  | "home"
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
}

export const primaryNavigation = [
  { href: "/", icon: "home", label: "首頁", labelEn: "Home" },
  { href: "/stream", icon: "stream", label: "動態", labelEn: "Stream" },
  { href: "/notes", icon: "note", label: "短札", labelEn: "Notes" },
  { href: "/articles", icon: "article", label: "文章", labelEn: "Articles" },
  { href: "/editions", icon: "edition", label: "專題", labelEn: "Editions" },
  { href: "/channels", icon: "channel", label: "頻道", labelEn: "Channels" },
  { href: "/archive", icon: "archive", label: "封存", labelEn: "Archive" },
  { href: "/search", icon: "search", label: "搜尋", labelEn: "Search" },
  { href: "/about", icon: "about", label: "關於", labelEn: "About" },
] as const satisfies readonly NavigationItem[];

export const mobileNavigation = primaryNavigation.filter(({ href }) =>
  ["/", "/stream", "/editions", "/search", "/about"].includes(href),
);

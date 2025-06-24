import SYS_ICONS from "@/configs/icons";

export const SITE_CONFIG = {
  NAME: "Cashlog - Money Management Website by @hieutndev",
  DESCRIPTION: "Make beautiful websites regardless of your design experience.",
  LOGO: {
    ONLY_ICON: "/cashlog_icon.png",
    HORIZONTAL: "/cashlog_icontext_horizontal.png",
    VERTICAL: "/cashlog_icontext_vertical.png",
    ONLY_TEXT: "/cashlog_onlytext.png",
  },
  FAVICON: "/cashlog_fav.ico",
  SIDEBAR_ITEMS: [
    {
      label: "Overview",
      href: "/overview",
      icon: SYS_ICONS.OVERVIEW.LG
    },
    {
      label: "Transactions",
      href: "/transactions",
      icon: SYS_ICONS.TRANSACTIONS.LG
    },
    {
      label: "Forecasts",
      href: "/forecasts",
      icon: SYS_ICONS.FORECAST.XL
    },
    {
      label: "Settings",
      href: "/settings",
      icon: SYS_ICONS.SETTING.LG
    }
  ],
  nonAuthUrls: ["/sign-in", "/sign-up", "/forgot-password"],
};

export type TSiteConfig = typeof SITE_CONFIG;

export type TSettingMenu = {
  label: string[];
  key: string;
  urls: string[];
  icon: React.ReactNode;
};

export const SETTING_MENU: TSettingMenu[] = [
  {
    label: ["Settings", "General"],
    key: "/settings",
    urls: ["^/settings"],
    icon: SYS_ICONS.TABLE.MD
  },
  {
    label: ["Settings", "Cards"],
    key: "/settings/cards",
    urls: ["^/settings/cards"],
    icon: SYS_ICONS.CARD.MD
  },
  {
    label: ["Settings", "Categories"],
    key: "/settings/categories",
    urls: ["^/settings/categories"],
    icon: SYS_ICONS.CATEGORY.MD
  },
  {
    label: ["Settings", "Forecasts"],
    key: "/settings/forecasts",
    urls: ["^/settings/forecasts", "^/settings/forecasts/new", "^/settings/forecasts/[^/]+"],
    icon: SYS_ICONS.FORECAST.MD
  }
];

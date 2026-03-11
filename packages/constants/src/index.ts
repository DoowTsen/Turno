import type { Language } from "@turno/types";

export const SUPPORTED_LANGUAGES: Language[] = ["zh-CN", "en-US"];

export const APP_NAME = "Turno";

export const MANAGEMENT_ROLES = ["admin", "super_admin", "operator", "customer_service", "auditor"] as const;

export const ADMIN_DASHBOARD_TABS = ["products", "users", "orders", "afterSales", "homepage", "notifications", "categories", "audit"] as const;

export type AdminDashboardTab = (typeof ADMIN_DASHBOARD_TABS)[number];

export type AdminDashboardView = {
  defaultTab: AdminDashboardTab;
  tabs: readonly AdminDashboardTab[];
  showAlertCards: boolean;
  showRiskOrders: boolean;
  showRiskSellers: boolean;
  showRiskBuyers: boolean;
  canExportOrders: boolean;
  canExportAfterSales: boolean;
};

export const ADMIN_PERMISSION_MAP = {
  admin: ["users.write", "products.write", "after_sales.write", "categories.write", "notifications.write"],
  super_admin: ["users.write", "products.write", "after_sales.write", "categories.write", "notifications.write"],
  operator: ["products.write", "categories.write", "notifications.write"],
  customer_service: ["after_sales.write", "notifications.write"],
  auditor: ["products.write"],
} as const;

const FULL_ADMIN_DASHBOARD_VIEW: AdminDashboardView = {
  defaultTab: "products",
  tabs: ADMIN_DASHBOARD_TABS,
  showAlertCards: true,
  showRiskOrders: true,
  showRiskSellers: true,
  showRiskBuyers: true,
  canExportOrders: true,
  canExportAfterSales: true,
};

const ADMIN_DASHBOARD_VIEW_MAP = {
  admin: FULL_ADMIN_DASHBOARD_VIEW,
  super_admin: FULL_ADMIN_DASHBOARD_VIEW,
  operator: {
    defaultTab: "products",
    tabs: ["products", "orders", "homepage", "notifications", "categories", "audit"],
    showAlertCards: true,
    showRiskOrders: true,
    showRiskSellers: true,
    showRiskBuyers: false,
    canExportOrders: true,
    canExportAfterSales: false,
  },
  customer_service: {
    defaultTab: "afterSales",
    tabs: ["users", "orders", "afterSales", "notifications", "audit"],
    showAlertCards: true,
    showRiskOrders: true,
    showRiskSellers: false,
    showRiskBuyers: true,
    canExportOrders: false,
    canExportAfterSales: true,
  },
  auditor: {
    defaultTab: "products",
    tabs: ["products", "orders", "audit"],
    showAlertCards: true,
    showRiskOrders: false,
    showRiskSellers: true,
    showRiskBuyers: false,
    canExportOrders: false,
    canExportAfterSales: false,
  },
} as const satisfies Record<(typeof MANAGEMENT_ROLES)[number], AdminDashboardView>;

export function isManagementRole(role?: string | null) {
  return Boolean(role && MANAGEMENT_ROLES.includes(role as (typeof MANAGEMENT_ROLES)[number]));
}

export function hasAdminPermission(role: string | null | undefined, permission: string) {
  if (!role) return false;
  const permissions = ADMIN_PERMISSION_MAP[role as keyof typeof ADMIN_PERMISSION_MAP];
  return Array.isArray(permissions) && permissions.includes(permission as never);
}

export function getAdminDashboardView(role?: string | null): AdminDashboardView {
  if (!role || !isManagementRole(role)) {
    return FULL_ADMIN_DASHBOARD_VIEW;
  }
  return ADMIN_DASHBOARD_VIEW_MAP[role as keyof typeof ADMIN_DASHBOARD_VIEW_MAP] ?? FULL_ADMIN_DASHBOARD_VIEW;
}

export const ROUTES = {
  home: "/",
  admin: "/admin",
  login: "/login",
  products: "/products",
  publish: "/publish",
  favorites: "/me/favorites",
  messages: "/me/messages",
  notifications: "/me/notifications",
  addresses: "/me/addresses",
  afterSales: "/me/after-sales",
  buyOrders: "/me/orders/buy",
  sellOrders: "/me/orders/sell",
  settings: "/me/settings",
} as const;

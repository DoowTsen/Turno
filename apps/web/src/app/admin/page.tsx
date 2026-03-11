"use client";

import Link from "next/link";
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import {
  batchUpdateAdminAfterSaleStatus,
  batchUpdateAdminProductStatus,
  batchUpdateAdminUserStatus,
  createAdminNotificationTemplate,
  getAdminAlerts,
  getAdminHomeConfig,
  getAdminOverview,
  getAdminOrderDetail,
  getAdminTrends,
  exportAdminAfterSalesCsv,
  exportAdminOrdersCsv,
  listAdminNotificationTemplates,
  listAdminAfterSales,
  listAdminAuditLogs,
  listAdminActionTemplateBindings,
  listAdminCategories,
  listAdminOrders,
  listAdminProducts,
  listAdminUsers,
  saveAdminActionTemplateBindings,
  saveAdminHomeConfig,
  sendAdminNotification,
  updateAdminNotificationTemplate,
  updateAdminAfterSaleStatus,
  updateAdminCategory,
  updateAdminProductStatus,
  updateAdminUserStatus,
} from "@turno/api-sdk";
import { ROUTES, getAdminDashboardView, hasAdminPermission, isManagementRole, type AdminDashboardTab } from "@turno/constants";
import type { AdminActionTemplateBinding, AdminAfterSale, AdminAlerts, AdminAuditLog, AdminBatchResult, AdminCategory, AdminHomeConfig, AdminNotificationTemplate, AdminOrder, AdminOrderDetail, AdminOverview, AdminProduct, AdminTrends, AdminUser, AfterSaleLog } from "@turno/types";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Archive,
  Ban,
  Bell,
  Download,
  CheckCircle2,
  BarChart3,
  Clock3,
  Package2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Star,
  Send,
  Truck,
  Users2,
  XCircle,
  ExternalLink,
  FileWarning,
  ImagePlus,
  LayoutTemplate,
  Megaphone,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

type CategoryDraftMap = Record<number, Pick<AdminCategory, "status" | "sortOrder" | "nameZhCN" | "nameEnUS">>;

const productStatuses = ["active", "rejected", "archived", "sold"] as const;
const orderStatuses = ["paid", "shipped", "completed", "cancelled"] as const;
const afterSaleStatuses = ["open", "processing", "approved", "rejected", "refunded", "closed"] as const;

const emptyNotificationTemplate = {
  id: 0,
  name: "",
  type: "system",
  titleTemplate: "",
  contentTemplate: "",
  defaultLink: "",
  status: "active",
};

const emptyNotificationSend = {
  templateId: 0,
  title: "",
  content: "",
  link: "",
  targetType: "all_users",
  targetRole: "user",
  userIds: "",
};

const defaultHomeConfig: AdminHomeConfig = {
  heroBadge: "Curated by Turno Ops",
  heroTitle: "让好东西流转，让二手交易更安心。",
  heroDescription: "用更清晰的担保交易、精选推荐和履约体验，把二手商品做成真正值得逛的数字货架。",
  primaryCtaText: "逛逛商品广场",
  primaryCtaLink: "/products",
  secondaryCtaText: "立即发布闲置",
  secondaryCtaLink: "/publish",
  featuredProductIds: [3008, 3003, 3004, 3005],
  featuredCategorySlugs: ["phones-digital", "computers-office", "gaming-toys"],
  banners: [
    { id: "ops-1", title: "春季转卖激励计划", subtitle: "精选数码与办公设备正在加速流转，优先推荐高成色商品。", link: "/products", tone: "cyan" },
    { id: "ops-2", title: "优先履约卖家榜", subtitle: "发货快、评价高、售后少的卖家会得到首页更多曝光。", link: "/me/orders/sell", tone: "violet" },
    { id: "ops-3", title: "平台担保升级", subtitle: "发货、售后、通知中心已联通，买卖双方都能看到更完整的处理进度。", link: "/me/notifications", tone: "emerald" },
  ],
};

function afterSaleTypeText(type: string) {
  switch (type) {
    case "refund": return "退款";
    case "refund_partial": return "部分退款";
    case "return_refund": return "退货退款";
    case "exchange": return "换货";
    default: return type;
  }
}

function price(value: number, currency = "CNY") {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency }).format(value / 100);
}

function dateText(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function statusText(status: string) {
  switch (status) {
    case "active": return "正常";
    case "suspended": return "停用";
    case "rejected": return "驳回";
    case "archived": return "归档";
    case "sold": return "售出";
    case "completed": return "完成";
    case "paid": return "待发货";
    case "shipped": return "运输中";
    case "cancelled": return "已取消";
    case "open": return "待处理";
    case "processing": return "处理中";
    case "approved": return "已同意";
    case "refunded": return "已退款";
    case "closed": return "已关闭";
    default: return status;
  }
}

function statusTone(status: string) {
  switch (status) {
    case "active": return "bg-emerald-400/15 text-emerald-200 ring-emerald-400/25";
    case "sold":
    case "completed": return "bg-sky-400/15 text-sky-200 ring-sky-400/25";
    case "suspended":
    case "rejected": return "bg-rose-400/15 text-rose-200 ring-rose-400/25";
    case "archived": return "bg-amber-400/15 text-amber-200 ring-amber-400/25";
    case "paid":
    case "processing": return "bg-violet-400/15 text-violet-200 ring-violet-400/25";
    case "shipped":
    case "approved": return "bg-cyan-400/15 text-cyan-200 ring-cyan-400/25";
    case "cancelled":
    case "closed": return "bg-slate-400/15 text-slate-200 ring-slate-400/25";
    case "refunded": return "bg-emerald-300/20 text-emerald-100 ring-emerald-300/25";
    default: return "bg-white/10 text-white/75 ring-white/15";
  }
}

function afterSaleStageText(status: string) {
  switch (status) {
    case "open": return "待卖家与平台首轮处理";
    case "processing": return "协商处理中，等待进一步结论";
    case "approved": return "平台已同意当前方案，等待执行";
    case "refunded": return "退款执行完成，等待到账";
    case "rejected": return "当前申请已驳回，可补充证据";
    case "closed": return "工单已结束，不再继续推进";
    default: return statusText(status);
  }
}

function afterSaleSummary(item: AdminAfterSale) {
  return item.logs?.at(-1)?.note?.trim() || item.resolutionNote?.trim() || item.detail?.trim() || item.reason;
}

function orderAfterSaleSummary(item: NonNullable<AdminOrderDetail["afterSales"]>[number]) {
  return item.logs?.at(-1)?.note?.trim() || item.resolutionNote?.trim() || item.reason;
}

function afterSaleLogTitle(log: AfterSaleLog) {
  switch (log.action) {
    case "created": return `${log.actorLabel}发起售后`;
    case "seller_response": return `${log.actorLabel}已响应`;
    case "admin_status_update": return `${log.actorLabel}更新状态`;
    default: return `${log.actorLabel}更新工单`;
  }
}

function afterSaleLogTone(log: AfterSaleLog) {
  switch (log.actorRole) {
    case "buyer": return "border-amber-300/20 bg-amber-400/10 text-amber-100";
    case "seller": return "border-violet-300/20 bg-violet-400/10 text-violet-100";
    case "admin": return "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";
    default: return "border-white/10 bg-white/5 text-white/80";
  }
}

function renderAfterSaleLogItems(logs?: AfterSaleLog[], limit?: number) {
  if (!logs?.length) {
    return <p className="text-xs text-white/35">还没有处理日志。</p>;
  }

  const visibleLogs = typeof limit === "number" ? logs.slice(-limit) : logs;

  return (
    <div className="space-y-2">
      {visibleLogs.map((log) => (
        <div key={log.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("ring-1", afterSaleLogTone(log))}>{afterSaleLogTitle(log)}</Badge>
            {log.status ? <Badge className={cn("ring-1", statusTone(log.status))}>{statusText(log.status)}</Badge> : null}
            <span className="text-xs text-white/40">{dateText(log.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/70">{log.note}</p>
        </div>
      ))}
    </div>
  );
}

function auditActionText(action: string) {
  switch (action) {
    case "user.status.updated": return "用户状态更新";
    case "product.status.updated": return "商品状态更新";
    case "after_sale.status.updated": return "售后状态更新";
    case "category.updated": return "分类配置更新";
    case "notification_template.created": return "通知模板创建";
    case "notification_template.updated": return "通知模板更新";
    case "notification.broadcast.sent": return "运营通知发送";
    default: return action;
  }
}

function targetTypeText(targetType: string) {
  switch (targetType) {
    case "user": return "用户";
    case "product": return "商品";
    case "after_sale": return "售后";
    case "category": return "分类";
    case "notification_template": return "通知模板";
    default: return targetType;
  }
}

function roleText(role: string) {
  switch (role) {
    case "admin": return "管理员";
    case "super_admin": return "超级管理员";
    case "operator": return "运营";
    case "customer_service": return "客服";
    case "auditor": return "审核员";
    case "user": return "普通用户";
    default: return role;
  }
}

function adminTabText(tab: AdminDashboardTab) {
  switch (tab) {
    case "products": return "商品审核";
    case "users": return "用户管理";
    case "orders": return "订单总览";
    case "afterSales": return "售后工单";
    case "homepage": return "首页运营";
    case "notifications": return "通知运营";
    case "categories": return "分类配置";
    case "audit": return "操作日志";
    default: return tab;
  }
}

function alertTone(level: string) {
  switch (level) {
    case "high": return "border-rose-300/20 bg-rose-400/10 text-rose-100";
    case "medium": return "border-amber-300/20 bg-amber-400/10 text-amber-100";
    default: return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }
}

function actionKeyText(actionKey: string) {
  switch (actionKey) {
    case "user.status.updated": return "账号状态变更";
    case "product.status.updated": return "商品状态变更";
    case "after_sale.status.updated": return "售后状态变更";
    default: return actionKey;
  }
}

function bannerToneClass(tone: string) {
  switch (tone) {
    case "violet": return "border-violet-300/20 bg-violet-400/10 text-violet-100";
    case "emerald": return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
    case "amber": return "border-amber-300/20 bg-amber-400/10 text-amber-100";
    default: return "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";
  }
}

function BatchResultPanel({
  scope,
  status,
  result,
  onDownloadFailures,
}: {
  scope: string;
  status: string;
  result: AdminBatchResult;
  onDownloadFailures?: () => void;
}) {
  const failedCount = result.failedItems?.length ?? 0;

  return (
    <Card className="border-white/10 bg-slate-950/88 text-white shadow-[0_25px_80px_rgba(8,15,32,0.32)]">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-300/20">批量结果面板</Badge>
          <Badge className={cn("ring-1", statusTone(status))}>{scope} · {statusText(status)}</Badge>
          {failedCount > 0 ? <Badge className="bg-amber-400/10 text-amber-100 ring-1 ring-amber-300/20">包含失败项</Badge> : <Badge className="bg-emerald-400/10 text-emerald-100 ring-1 ring-emerald-300/20">全部成功</Badge>}
        </div>
        <CardTitle className="text-xl">本次共处理 {result.updatedCount} 条记录</CardTitle>
        <CardDescription className="text-white/55">如果有失败项，下面会保留失败明细，方便运营回头补处理。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">成功数</p>
            <p className="mt-3 text-3xl font-semibold text-white">{result.updatedCount}</p>
          </div>
          <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">失败数</p>
            <p className="mt-3 text-3xl font-semibold text-white">{failedCount}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">成功 ID</p>
            <p className="mt-3 text-sm leading-7 text-white/75">{result.succeededIds?.length ? result.succeededIds.join("、") : "暂无"}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <FileWarning className="size-4 text-amber-300" />失败明细
          </div>
          {failedCount === 0 ? (
            <p className="mt-3 text-sm text-white/55">没有失败项，本次批量执行已全部完成。</p>
          ) : (
            <div className="mt-3 space-y-3">
              {onDownloadFailures ? (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="rounded-full border-amber-300/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20" onClick={onDownloadFailures}>
                    <Download className="size-3.5" />导出失败明细
                  </Button>
                </div>
              ) : null}
              {result.failedItems?.map((item) => (
                <div key={`${scope}-${item.id}`} className="rounded-2xl border border-rose-300/15 bg-rose-400/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">ID #{item.id}</p>
                    <Badge className="bg-rose-400/10 text-rose-100 ring-1 ring-rose-300/20">失败</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/70">{item.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TableEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Search;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 px-5 py-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/65">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-base font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/55">{description}</p>
    </div>
  );
}

function downloadTextFile(content: string, fileName: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildBatchFailureCsv(scope: string, status: string, result: AdminBatchResult) {
  const rows = [
    ["范围", "目标状态", "记录 ID", "失败原因"],
    ...(result.failedItems ?? []).map((item) => [scope, statusText(status), String(item.id), item.reason]),
  ];
  return `﻿${rows.map((row) => row.map((value) => escapeCsvValue(value)).join(",")).join("\n")}`;
}

function safeArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}


function getAfterSaleActions(item: AdminAfterSale) {
  switch (item.status) {
    case "open":
      return [
        { label: "处理中", status: "processing", className: "border-violet-300/20 bg-violet-400/10 text-violet-100 hover:bg-violet-400/20", variant: "outline" as const },
        { label: "驳回", status: "rejected", className: "border-rose-300/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20", variant: "outline" as const },
        { label: "关闭", status: "closed", className: "border-white/10 bg-white/5 text-white hover:bg-white/10", variant: "outline" as const },
      ];
    case "processing":
      return [
        { label: "同意", status: "approved", className: "", variant: "default" as const },
        { label: "退款完成", status: "refunded", className: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20", variant: "outline" as const },
        { label: "关闭", status: "closed", className: "border-white/10 bg-white/5 text-white hover:bg-white/10", variant: "outline" as const },
      ];
    case "approved":
      return [
        { label: "退款完成", status: "refunded", className: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20", variant: "outline" as const },
        { label: "关闭", status: "closed", className: "border-white/10 bg-white/5 text-white hover:bg-white/10", variant: "outline" as const },
      ];
    default:
      return [];
  }
}

export default function AdminPage() {
  const { accessToken, isAuthenticated, isLoading, user } = useAuth();
  const canWriteUsers = hasAdminPermission(user?.role, "users.write");
  const canWriteProducts = hasAdminPermission(user?.role, "products.write");
  const canWriteAfterSales = hasAdminPermission(user?.role, "after_sales.write");
  const canWriteCategories = hasAdminPermission(user?.role, "categories.write");
  const canWriteNotifications = hasAdminPermission(user?.role, "notifications.write");
  const dashboardView = useMemo(() => getAdminDashboardView(user?.role), [user?.role]);
  const canViewProductsTab = dashboardView.tabs.includes("products");
  const canViewUsersTab = dashboardView.tabs.includes("users");
  const canViewOrdersTab = dashboardView.tabs.includes("orders");
  const canViewAfterSalesTab = dashboardView.tabs.includes("afterSales");
  const canViewHomepageTab = dashboardView.tabs.includes("homepage");
  const canViewNotificationsTab = dashboardView.tabs.includes("notifications");
  const canViewCategoriesTab = dashboardView.tabs.includes("categories");
  const canViewAuditTab = dashboardView.tabs.includes("audit");
  const canExportOrders = canViewOrdersTab && dashboardView.canExportOrders;
  const canExportAfterSales = canViewAfterSalesTab && dashboardView.canExportAfterSales;
  const visibleTabLabels = useMemo(() => dashboardView.tabs.map((item) => adminTabText(item)).join("、"), [dashboardView.tabs]);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [trends, setTrends] = useState<AdminTrends | null>(null);
  const [alerts, setAlerts] = useState<AdminAlerts | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [afterSales, setAfterSales] = useState<AdminAfterSale[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<AdminNotificationTemplate[]>([]);
  const [actionBindings, setActionBindings] = useState<AdminActionTemplateBinding[]>([]);
  const [homeConfig, setHomeConfig] = useState<AdminHomeConfig>(defaultHomeConfig);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [drafts, setDrafts] = useState<CategoryDraftMap>({});
  const [userKeyword, setUserKeyword] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [productKeyword, setProductKeyword] = useState("");
  const [productStatus, setProductStatus] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productSellerIdFilter, setProductSellerIdFilter] = useState("");
  const [productMinPrice, setProductMinPrice] = useState("");
  const [productMaxPrice, setProductMaxPrice] = useState("");
  const [orderKeyword, setOrderKeyword] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [orderMinAmount, setOrderMinAmount] = useState("");
  const [orderMaxAmount, setOrderMaxAmount] = useState("");
  const [orderStartDate, setOrderStartDate] = useState("");
  const [orderEndDate, setOrderEndDate] = useState("");
  const [orderHasAfterSale, setOrderHasAfterSale] = useState(false);
  const [orderDelayedOnly, setOrderDelayedOnly] = useState(false);
  const [afterSaleStatus, setAfterSaleStatus] = useState("");
  const [afterSaleType, setAfterSaleType] = useState("");
  const [auditKeyword, setAuditKeyword] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [tab, setTab] = useState<AdminDashboardTab>("products");
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderDetail, setOrderDetail] = useState<AdminOrderDetail | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null);
  const [notificationTemplateForm, setNotificationTemplateForm] = useState(emptyNotificationTemplate);
  const [notificationSendForm, setNotificationSendForm] = useState(emptyNotificationSend);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectedAfterSaleIds, setSelectedAfterSaleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastBatchResult, setLastBatchResult] = useState<{ scope: string; status: string; result: AdminBatchResult } | null>(null);
  const [exportingTarget, setExportingTarget] = useState<"orders" | "afterSales" | null>(null);

  const applyDrafts = useCallback((items: AdminCategory[]) => {
    setDrafts(Object.fromEntries(items.map((item) => [item.id, { status: item.status, sortOrder: item.sortOrder, nameZhCN: item.nameZhCN, nameEnUS: item.nameEnUS }])));
  }, []);

  const setVisibleTab = useCallback((nextTab: string) => {
    const candidate = nextTab as AdminDashboardTab;
    setTab(dashboardView.tabs.includes(candidate) ? candidate : dashboardView.defaultTab);
  }, [dashboardView.defaultTab, dashboardView.tabs]);

  useEffect(() => {
    setTab((current) => (dashboardView.tabs.includes(current) ? current : dashboardView.defaultTab));
  }, [dashboardView.defaultTab, dashboardView.tabs]);

  const loadDashboard = useCallback(async (options?: {
    silent?: boolean;
    userKeyword?: string; userRole?: string; userStatus?: string;
    productKeyword?: string; productStatus?: string; productCategoryId?: string; productSellerId?: string; productMinPrice?: string; productMaxPrice?: string;
    orderKeyword?: string; orderStatus?: string; orderMinAmount?: string; orderMaxAmount?: string; orderStartDate?: string; orderEndDate?: string; orderHasAfterSale?: boolean; orderDelayedOnly?: boolean;
    afterSaleStatus?: string; afterSaleType?: string;
    auditKeyword?: string; auditAction?: string;
  }) => {
    if (!accessToken) return;
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const shouldLoadCategories = canViewProductsTab || canViewCategoriesTab;
      const [overviewResult, trendResult, alertResult, userResult, productResult, orderResult, afterSaleResult, auditLogResult, categoryResult, templateResult, homeConfigResult, actionBindingResult] = await Promise.allSettled([
        getAdminOverview(accessToken),
        getAdminTrends(accessToken, 7),
        getAdminAlerts(accessToken),
        canViewUsersTab ? listAdminUsers(accessToken, { keyword: options?.userKeyword ?? userKeyword, role: options?.userRole ?? userRoleFilter, status: options?.userStatus ?? userStatusFilter }) : Promise.resolve<AdminUser[]>([]),
        canViewProductsTab ? listAdminProducts(accessToken, {
          keyword: options?.productKeyword ?? productKeyword,
          status: options?.productStatus ?? productStatus,
          categoryId: Number(options?.productCategoryId ?? productCategoryFilter) || undefined,
          sellerId: Number(options?.productSellerId ?? productSellerIdFilter) || undefined,
          minPrice: Number(options?.productMinPrice ?? productMinPrice) || undefined,
          maxPrice: Number(options?.productMaxPrice ?? productMaxPrice) || undefined,
        }) : Promise.resolve<AdminProduct[]>([]),
        canViewOrdersTab ? listAdminOrders(accessToken, {
          keyword: options?.orderKeyword ?? orderKeyword,
          status: options?.orderStatus ?? orderStatus,
          minAmount: Number(options?.orderMinAmount ?? orderMinAmount) || undefined,
          maxAmount: Number(options?.orderMaxAmount ?? orderMaxAmount) || undefined,
          startDate: (options?.orderStartDate ?? orderStartDate) || undefined,
          endDate: (options?.orderEndDate ?? orderEndDate) || undefined,
          hasAfterSale: (options?.orderHasAfterSale ?? orderHasAfterSale) ? true : undefined,
          delayedOnly: (options?.orderDelayedOnly ?? orderDelayedOnly) ? true : undefined,
        }) : Promise.resolve<AdminOrder[]>([]),
        canViewAfterSalesTab ? listAdminAfterSales(accessToken, { status: (options?.afterSaleStatus ?? afterSaleStatus) || undefined, type: (options?.afterSaleType ?? afterSaleType) || undefined }) : Promise.resolve<AdminAfterSale[]>([]),
        canViewAuditTab ? listAdminAuditLogs(accessToken, { keyword: options?.auditKeyword ?? auditKeyword, action: options?.auditAction ?? auditAction }) : Promise.resolve<AdminAuditLog[]>([]),
        shouldLoadCategories ? listAdminCategories(accessToken) : Promise.resolve<AdminCategory[]>([]),
        canViewNotificationsTab && canWriteNotifications ? listAdminNotificationTemplates(accessToken) : Promise.resolve<AdminNotificationTemplate[]>([]),
        canViewHomepageTab && canWriteCategories ? getAdminHomeConfig(accessToken) : Promise.resolve(defaultHomeConfig),
        canViewNotificationsTab && canWriteNotifications ? listAdminActionTemplateBindings(accessToken) : Promise.resolve<AdminActionTemplateBinding[]>([]),
      ]);
      const partialErrors: string[] = [];

      if (overviewResult.status === "fulfilled") setOverview(overviewResult.value);
      else partialErrors.push("总览");

      if (trendResult.status === "fulfilled") setTrends(trendResult.value);
      else partialErrors.push("趋势");

      if (alertResult.status === "fulfilled") setAlerts(alertResult.value);
      else partialErrors.push("告警");

      if (userResult.status === "fulfilled") setUsers(safeArray(userResult.value));
      else partialErrors.push("用户");

      if (productResult.status === "fulfilled") setProducts(safeArray(productResult.value));
      else partialErrors.push("商品");

      if (orderResult.status === "fulfilled") setOrders(safeArray(orderResult.value));
      else partialErrors.push("订单");

      if (afterSaleResult.status === "fulfilled") setAfterSales(safeArray(afterSaleResult.value));
      else partialErrors.push("售后");

      if (auditLogResult.status === "fulfilled") setAuditLogs(safeArray(auditLogResult.value));
      else partialErrors.push("日志");

      if (categoryResult.status === "fulfilled") {
        const nextCategories = safeArray(categoryResult.value);
        setCategories(nextCategories);
        applyDrafts(nextCategories);
      } else {
        partialErrors.push("分类");
      }

      if (templateResult.status === "fulfilled") setNotificationTemplates(safeArray(templateResult.value));
      else partialErrors.push("通知模板");

      if (homeConfigResult.status === "fulfilled") setHomeConfig(homeConfigResult.value);
      else partialErrors.push("首页运营");

      if (actionBindingResult.status === "fulfilled") setActionBindings(safeArray(actionBindingResult.value));
      else partialErrors.push("动作联动");

      if (partialErrors.length > 0) {
        setError(`部分数据加载失败：${partialErrors.join("、")}。其余内容已正常展示，可稍后刷新重试。`);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "管理台数据加载失败");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [accessToken, afterSaleStatus, afterSaleType, auditAction, auditKeyword, applyDrafts, canViewAfterSalesTab, canViewAuditTab, canViewCategoriesTab, canViewHomepageTab, canViewNotificationsTab, canViewOrdersTab, canViewProductsTab, canViewUsersTab, canWriteCategories, canWriteNotifications, orderDelayedOnly, orderEndDate, orderHasAfterSale, orderKeyword, orderMaxAmount, orderMinAmount, orderStartDate, orderStatus, productCategoryFilter, productKeyword, productMaxPrice, productMinPrice, productSellerIdFilter, productStatus, userKeyword, userRoleFilter, userStatusFilter]);

  useEffect(() => {
    if (!isLoading && accessToken && isManagementRole(user?.role)) {
      void loadDashboard();
    }
  }, [accessToken, isLoading, loadDashboard, user?.role]);

  const stats = useMemo(() => {
    if (!overview) return [];
    return [
      { label: "用户总数", value: overview.totalUsers, meta: `活跃 ${overview.activeUsers} · 停用 ${overview.suspendedUsers}`, icon: Users2 },
      { label: "商品池", value: overview.totalProducts, meta: `在售 ${overview.activeProducts} · 售出 ${overview.soldProducts}`, icon: Package2 },
      { label: "订单履约", value: overview.totalOrders, meta: `待发货 ${overview.pendingShipments} · 完成 ${overview.completedOrders}`, icon: Truck },
      { label: "评价反馈", value: overview.totalReviews, meta: `驳回 ${overview.rejectedProducts} · 售后 ${overview.openAfterSales}`, icon: Star },
    ];
  }, [overview]);

  const trendMetrics = useMemo(() => {
    if (!trends) return [];
    return [
      { label: "近 7 天新增用户", value: trends.lastPeriodUsers.toLocaleString("zh-CN"), meta: "反映站点新流量与自然增长", icon: Users2, tone: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100" },
      { label: "近 7 天商品上新", value: trends.lastPeriodProducts.toLocaleString("zh-CN"), meta: "卖家供给侧活跃度", icon: Package2, tone: "border-violet-300/20 bg-violet-400/10 text-violet-100" },
      { label: "近 7 天支付 GMV", value: price(trends.lastPeriodGMV), meta: `订单 ${trends.lastPeriodOrders} 笔 · 完成率 ${trends.completionRate.toFixed(0)}%`, icon: Wallet, tone: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" },
      { label: "近 7 天售后新单", value: trends.lastPeriodAfterSales.toLocaleString("zh-CN"), meta: `已完成 ${trends.lastPeriodCompleted} 笔订单`, icon: ShieldAlert, tone: "border-amber-300/20 bg-amber-400/10 text-amber-100" },
    ];
  }, [trends]);

  const trendBars = useMemo(() => {
    if (!trends?.points?.length) return [];
    const maxGMV = Math.max(...trends.points.map((item) => item.gmv), 1);
    return trends.points.map((item) => ({
      ...item,
      gmvHeight: Math.max(10, Math.round((item.gmv / maxGMV) * 100)),
    }));
  }, [trends]);

  const visibleAlertItems = useMemo(
    () => alerts?.items.filter((item) => dashboardView.tabs.includes(item.targetTab as AdminDashboardTab)) ?? [],
    [alerts, dashboardView.tabs],
  );
  const showAlertCardPanel = dashboardView.showAlertCards && visibleAlertItems.length > 0;
  const showRiskOrdersPanel = dashboardView.showRiskOrders;
  const showRiskSellersPanel = dashboardView.showRiskSellers && canViewProductsTab;
  const showRiskBuyersPanel = dashboardView.showRiskBuyers && canViewUsersTab;
  const shouldShowRiskSection = showAlertCardPanel || showRiskOrdersPanel || showRiskSellersPanel || showRiskBuyersPanel;

  const orderExportFilters = useMemo(() => {
    const items: string[] = [];
    if (orderKeyword.trim()) items.push(`关键词：${orderKeyword.trim()}`);
    if (orderStatus) items.push(`状态：${statusText(orderStatus)}`);
    if (orderMinAmount) items.push(`最低金额：${price(Number(orderMinAmount))}`);
    if (orderMaxAmount) items.push(`最高金额：${price(Number(orderMaxAmount))}`);
    if (orderStartDate) items.push(`开始日期：${orderStartDate}`);
    if (orderEndDate) items.push(`结束日期：${orderEndDate}`);
    if (orderHasAfterSale) items.push("仅看有售后");
    if (orderDelayedOnly) items.push("仅看超时未发货");
    return items;
  }, [orderDelayedOnly, orderEndDate, orderHasAfterSale, orderKeyword, orderMaxAmount, orderMinAmount, orderStartDate, orderStatus]);

  const afterSaleExportFilters = useMemo(() => {
    const items: string[] = [];
    if (afterSaleStatus) items.push(`状态：${statusText(afterSaleStatus)}`);
    if (afterSaleType) items.push(`类型：${afterSaleTypeText(afterSaleType)}`);
    return items;
  }, [afterSaleStatus, afterSaleType]);

  async function downloadBatchFailureReport() {
    if (!lastBatchResult || (lastBatchResult.result.failedItems?.length ?? 0) === 0) return;
    downloadTextFile(
      buildBatchFailureCsv(lastBatchResult.scope, lastBatchResult.status, lastBatchResult.result),
      `turno-batch-failures-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`,
      "text/csv;charset=utf-8",
    );
    setSuccess("失败明细 CSV 已开始下载");
  }

  function resetOrderFilters() {
    setOrderKeyword("");
    setOrderStatus("");
    setOrderMinAmount("");
    setOrderMaxAmount("");
    setOrderStartDate("");
    setOrderEndDate("");
    setOrderHasAfterSale(false);
    setOrderDelayedOnly(false);
    void loadDashboard({
      silent: true,
      orderKeyword: "",
      orderStatus: "",
      orderMinAmount: "",
      orderMaxAmount: "",
      orderStartDate: "",
      orderEndDate: "",
      orderHasAfterSale: false,
      orderDelayedOnly: false,
    });
  }

  function resetAfterSaleFilters() {
    setAfterSaleStatus("");
    setAfterSaleType("");
    void loadDashboard({ silent: true, afterSaleStatus: "", afterSaleType: "" });
  }

  async function changeUserStatus(id: number, status: string) {
    if (!accessToken) return;
    setError(null);
    setSuccess(null);
    setLastBatchResult(null);
    try {
      await updateAdminUserStatus(id, status, accessToken);
      setUsers((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      setSuccess(`用户 ${id} 已更新为${statusText(status)}`);
      void loadDashboard({ silent: true });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "用户状态更新失败");
    }
  }

  function toggleSelectedId(id: number, setter: Dispatch<SetStateAction<number[]>>) {
    setter((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAll(currentIds: number[], visibleIds: number[], setter: Dispatch<SetStateAction<number[]>>) {
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => currentIds.includes(id));
    setter(allSelected ? currentIds.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...currentIds, ...visibleIds])));
  }

  async function batchChangeUserStatus(status: string) {
    if (!accessToken || selectedUserIds.length === 0) return;
    setError(null);
    setSuccess(null);
    try {
      const result = await batchUpdateAdminUserStatus({ ids: selectedUserIds, status }, accessToken);
      setSelectedUserIds([]);
      setLastBatchResult({ scope: "用户", status, result });
      setSuccess(`已批量更新 ${result.updatedCount} 个用户为${statusText(status)}`);
      void loadDashboard({ silent: true });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "批量更新用户失败");
    }
  }

  async function changeProductStatus(id: number, status: string) {
    if (!accessToken) return;
    setError(null);
    setSuccess(null);
    setLastBatchResult(null);
    try {
      await updateAdminProductStatus(id, status, accessToken);
      setProducts((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      setSuccess(`商品 ${id} 已切换为${statusText(status)}`);
      void loadDashboard({ silent: true });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "商品状态更新失败");
    }
  }

  async function saveCategory(id: number) {
    if (!accessToken || !drafts[id]) return;
    setError(null);
    setSuccess(null);
    setLastBatchResult(null);
    try {
      const updated = await updateAdminCategory(id, drafts[id], accessToken);
      setCategories((current) => current.map((item) => (item.id === id ? updated : item)));
      setDrafts((current) => ({ ...current, [id]: { status: updated.status, sortOrder: updated.sortOrder, nameZhCN: updated.nameZhCN, nameEnUS: updated.nameEnUS } }));
      setSuccess(`分类 ${updated.slug} 已保存`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "分类保存失败");
    }
  }

  async function batchChangeProductStatus(status: string) {
    if (!accessToken || selectedProductIds.length === 0) return;
    setError(null);
    setSuccess(null);
    try {
      const result = await batchUpdateAdminProductStatus({ ids: selectedProductIds, status }, accessToken);
      setSelectedProductIds([]);
      setLastBatchResult({ scope: "商品", status, result });
      setSuccess(`已批量更新 ${result.updatedCount} 个商品为${statusText(status)}`);
      void loadDashboard({ silent: true });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "批量更新商品失败");
    }
  }

  function editNotificationTemplate(template: AdminNotificationTemplate) {
    setNotificationTemplateForm({
      id: template.id,
      name: template.name,
      type: template.type,
      titleTemplate: template.titleTemplate,
      contentTemplate: template.contentTemplate,
      defaultLink: template.defaultLink ?? "",
      status: template.status,
    });
    setVisibleTab("notifications");
  }

  function applyTemplateToSend(template: AdminNotificationTemplate) {
    setNotificationSendForm((current) => ({
      ...current,
      templateId: template.id,
      title: template.titleTemplate,
      content: template.contentTemplate,
      link: template.defaultLink ?? "",
    }));
    setSuccess(`已载入模板「${template.name}」到发送面板`);
    setVisibleTab("notifications");
  }

  async function saveNotificationTemplate() {
    if (!accessToken || !canWriteNotifications) return;
    setError(null);
    setSuccess(null);
    setLastBatchResult(null);
    try {
      const payload = {
        name: notificationTemplateForm.name,
        type: notificationTemplateForm.type,
        titleTemplate: notificationTemplateForm.titleTemplate,
        contentTemplate: notificationTemplateForm.contentTemplate,
        defaultLink: notificationTemplateForm.defaultLink || undefined,
        status: notificationTemplateForm.status,
      };
      const saved = notificationTemplateForm.id > 0
        ? await updateAdminNotificationTemplate(notificationTemplateForm.id, payload, accessToken)
        : await createAdminNotificationTemplate(payload, accessToken);
      setNotificationTemplates((current) => {
        const existing = current.find((item) => item.id === saved.id);
        if (existing) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...current];
      });
      setNotificationTemplateForm(emptyNotificationTemplate);
      setSuccess(`通知模板「${saved.name}」已保存`);
      void loadDashboard({ silent: true });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "通知模板保存失败");
    }
  }

  async function sendNotificationCampaign() {
    if (!accessToken || !canWriteNotifications) return;
    setError(null);
    setSuccess(null);
    setLastBatchResult(null);
    try {
      const userIds = notificationSendForm.userIds
        .split(/[,，\s]+/)
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item) && item > 0);
      const result = await sendAdminNotification({
        templateId: notificationSendForm.templateId > 0 ? notificationSendForm.templateId : undefined,
        title: notificationSendForm.title || undefined,
        content: notificationSendForm.content || undefined,
        link: notificationSendForm.link || undefined,
        targetType: notificationSendForm.targetType as "all_users" | "management" | "role" | "user_ids",
        targetRole: notificationSendForm.targetType === "role" ? notificationSendForm.targetRole : undefined,
        userIds: notificationSendForm.targetType === "user_ids" ? userIds : undefined,
      }, accessToken);
      setSuccess(`运营通知已发出，触达 ${result.recipientCount} 人`);
      setNotificationSendForm(emptyNotificationSend);
      void loadDashboard({ silent: true });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "运营通知发送失败");
    }
  }

  async function downloadBlob(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }

  async function exportOrders() {
    if (!accessToken) return;
    setError(null);
    setSuccess(null);
    setLastBatchResult(null);
    setExportingTarget("orders");
    try {
      const blob = await exportAdminOrdersCsv(accessToken, {
        keyword: orderKeyword || undefined,
        status: orderStatus || undefined,
        minAmount: Number(orderMinAmount) || undefined,
        maxAmount: Number(orderMaxAmount) || undefined,
        startDate: orderStartDate || undefined,
        endDate: orderEndDate || undefined,
        hasAfterSale: orderHasAfterSale ? true : undefined,
        delayedOnly: orderDelayedOnly ? true : undefined,
      });
      await downloadBlob(blob, `turno-orders-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`);
      setSuccess("订单 CSV 已开始下载，已按当前筛选条件导出");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "订单导出失败");
    } finally {
      setExportingTarget(null);
    }
  }

  async function exportAfterSales() {
    if (!accessToken) return;
    setError(null);
    setSuccess(null);
    setLastBatchResult(null);
    setExportingTarget("afterSales");
    try {
      const blob = await exportAdminAfterSalesCsv(accessToken, { status: afterSaleStatus || undefined, type: afterSaleType || undefined });
      await downloadBlob(blob, `turno-after-sales-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`);
      setSuccess("售后 CSV 已开始下载，已按当前筛选条件导出");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "售后导出失败");
    } finally {
      setExportingTarget(null);
    }
  }

  async function changeAfterSaleStatus(id: number, status: string) {
    if (!accessToken) return;
    setError(null);
    setSuccess(null);
    setLastBatchResult(null);
    try {
      const updated = await updateAdminAfterSaleStatus(id, { status, resolutionNote: `管理员在后台将工单更新为${statusText(status)}` }, accessToken);
      setAfterSales((current) => current.map((item) => (item.id === id ? updated : item)));
      setSuccess(`售后工单 ${id} 已更新为${statusText(status)}`);
      void loadDashboard({ silent: true });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "售后状态更新失败");
    }
  }

  async function batchChangeAfterSaleStatus(status: string) {
    if (!accessToken || selectedAfterSaleIds.length === 0) return;
    setError(null);
    setSuccess(null);
    try {
      const result = await batchUpdateAdminAfterSaleStatus({ ids: selectedAfterSaleIds, status, resolutionNote: `管理员批量将工单更新为${statusText(status)}` }, accessToken);
      setSelectedAfterSaleIds([]);
      setLastBatchResult({ scope: "售后工单", status, result });
      setSuccess(`已批量更新 ${result.updatedCount} 个售后工单为${statusText(status)}`);
      void loadDashboard({ silent: true });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "批量更新售后失败");
    }
  }

  async function saveHomepageConfig() {
    if (!accessToken || !canWriteCategories) return;
    setError(null);
    setSuccess(null);
    setLastBatchResult(null);
    try {
      const saved = await saveAdminHomeConfig(homeConfig, accessToken);
      setHomeConfig(saved);
      setSuccess("首页运营配置已保存，前台首页会优先读取最新内容");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "首页运营配置保存失败");
    }
  }

  async function saveActionBindings() {
    if (!accessToken || !canWriteNotifications) return;
    setError(null);
    setSuccess(null);
    setLastBatchResult(null);
    try {
      const saved = await saveAdminActionTemplateBindings(actionBindings, accessToken);
      setActionBindings(saved);
      setSuccess("后台动作联动模板已保存，后续商品/售后/账号状态更新会优先使用新绑定");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "动作联动模板保存失败");
    }
  }

  async function openOrderDetail(orderId: number) {
    if (!accessToken) return;
    setSelectedOrderId(orderId);
    setOrderDetailOpen(true);
    setOrderDetailLoading(true);
    setOrderDetailError(null);
    try {
      const detail = await getAdminOrderDetail(orderId, accessToken);
      setOrderDetail(detail);
    } catch (actionError) {
      setOrderDetail(null);
      setOrderDetailError(actionError instanceof Error ? actionError.message : "订单详情加载失败");
    } finally {
      setOrderDetailLoading(false);
    }
  }

  function jumpToOrderFilter(keyword: string) {
    setOrderKeyword(keyword);
    setVisibleTab("orders");
    setOrderDetailOpen(false);
    void loadDashboard({ silent: true, orderKeyword: keyword, orderStatus, userKeyword, productKeyword, productStatus, afterSaleStatus });
  }

  function jumpToProductFilter(keyword: string) {
    setProductKeyword(keyword);
    setVisibleTab("products");
    setOrderDetailOpen(false);
    void loadDashboard({ silent: true, productKeyword: keyword, productStatus, userKeyword, orderKeyword, orderStatus, afterSaleStatus });
  }

  function jumpToUserFilter(keyword: string) {
    setUserKeyword(keyword);
    setVisibleTab("users");
    setOrderDetailOpen(false);
    void loadDashboard({ silent: true, userKeyword: keyword, productKeyword, productStatus, orderKeyword, orderStatus, afterSaleStatus });
  }

  function jumpToAfterSales() {
    setVisibleTab("afterSales");
    setOrderDetailOpen(false);
    void loadDashboard({ silent: true, userKeyword, productKeyword, productStatus, orderKeyword, orderStatus, afterSaleStatus });
  }

  function jumpToSellerProducts(sellerId: number) {
    const value = String(sellerId);
    setProductSellerIdFilter(value);
    setVisibleTab("products");
    setOrderDetailOpen(false);
    void loadDashboard({ silent: true, productSellerId: value, productKeyword, productStatus, userKeyword, orderKeyword, orderStatus, afterSaleStatus });
  }

  function jumpToOrdersByKeyword(keyword: string) {
    setOrderKeyword(keyword);
    setVisibleTab("orders");
    setOrderDetailOpen(false);
    void loadDashboard({ silent: true, orderKeyword: keyword, orderStatus, userKeyword, productKeyword, productStatus, afterSaleStatus });
  }

  function jumpToUsersByKeyword(keyword: string) {
    setUserKeyword(keyword);
    setVisibleTab("users");
    setOrderDetailOpen(false);
    void loadDashboard({ silent: true, userKeyword: keyword, productKeyword, productStatus, orderKeyword, orderStatus, afterSaleStatus });
  }

  if (isLoading) {
    return (
      <PageShell className="pt-16">
        <Card className="border-white/10 bg-slate-950/80 text-white">
          <CardContent className="flex min-h-64 items-center justify-center gap-3 text-white/70">
            <RefreshCw className="size-4 animate-spin text-cyan-300" />正在校验管理员身份...
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell className="pt-16">
        <Card className="border-white/10 bg-slate-950 text-white shadow-[0_30px_120px_rgba(8,15,32,0.55)]">
          <CardHeader>
            <Badge className="w-fit bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">Admin Access</Badge>
            <CardTitle className="mt-3 text-3xl font-semibold tracking-tight">请先登录管理员账号</CardTitle>
            <CardDescription className="max-w-2xl text-white/60">先进入登录页，再回来查看商品审核、用户管理和分类配置。</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link href={ROUTES.login} className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}>前往登录</Link>
            <Link href={ROUTES.home} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full border-white/10 bg-white/5 px-6 text-white hover:bg-white/10")}>返回首页</Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!isManagementRole(user?.role)) {
    return (
      <PageShell className="pt-16">
        <Card className="border-rose-400/20 bg-slate-950 text-white shadow-[0_30px_120px_rgba(8,15,32,0.55)]">
          <CardHeader>
            <Badge className="w-fit bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/20">No Permission</Badge>
            <CardTitle className="mt-3 text-3xl font-semibold tracking-tight">当前账号没有管理权限</CardTitle>
            <CardDescription className="max-w-2xl text-white/60">请切换到具备后台权限的账号，例如 `admin` / `operator` / `customer_service` / `auditor`。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.home} className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}>回到首页</Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="relative space-y-8 pb-16 pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_26%),linear-gradient(180deg,rgba(2,6,23,0.94),rgba(2,6,23,0.4),transparent)]" />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">当前角色：<span className="font-semibold text-white">{user?.role ? roleText(user.role) : "-"}</span> · 可见工作区：<span className="font-medium text-white/85">{visibleTabLabels}</span> · 权限概览：{canWriteUsers ? "用户管理" : ""}{canWriteUsers && (canWriteProducts || canWriteAfterSales || canWriteCategories || canWriteNotifications) ? "、" : ""}{canWriteProducts ? "商品审核" : ""}{canWriteProducts && (canWriteAfterSales || canWriteCategories || canWriteNotifications) ? "、" : ""}{canWriteAfterSales ? "售后处理" : ""}{canWriteAfterSales && (canWriteCategories || canWriteNotifications) ? "、" : ""}{canWriteCategories ? "分类配置" : ""}{canWriteCategories && canWriteNotifications ? "、" : ""}{canWriteNotifications ? "通知运营" : ""}{!canWriteUsers && !canWriteProducts && !canWriteAfterSales && !canWriteCategories && !canWriteNotifications ? "只读后台" : ""}</div>
        <Card className="border-white/10 bg-slate-950/92 text-white shadow-[0_40px_140px_rgba(8,15,32,0.55)]">
          <CardHeader className="gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">Turno Control Center</Badge>
              <Badge className="bg-white/5 text-white/65 ring-1 ring-white/10">Admin Workspace</Badge>
              <Badge className="bg-violet-400/15 text-violet-100 ring-1 ring-violet-300/20">7-Day Trends</Badge>
            </div>
            <div>
              <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">统一管理风控、商品池与多语言分类。</CardTitle>
              <CardDescription className="mt-3 max-w-2xl text-base leading-7 text-white/60">深色高亮风格的运营台，聚焦平台交易质量、履约效率和内容治理，并把最近 7 天的增长趋势直接搬到首屏。</CardDescription>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-white/55">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><ShieldCheck className="size-4 text-cyan-300" />当前管理员：{user?.nickname ?? "-"}</div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><Sparkles className="size-4 text-violet-300" />商业化深色后台</div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><TrendingUp className="size-4 text-emerald-300" />持续跟踪近 7 天运营变化</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              {trendMetrics.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={cn("rounded-3xl border p-4", item.tone)}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-current/75">{item.label}</p>
                        <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-2 text-white/80"><Icon className="size-5" /></div>
                    </div>
                    <p className="mt-3 text-sm text-white/65">{item.meta}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-950/88 text-white shadow-[0_30px_100px_rgba(8,15,32,0.45)]">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold">近 7 天运营脉冲</CardTitle>
                <CardDescription className="text-white/55">每根柱表示当日支付 GMV，下面同步显示用户、上新与售后量。</CardDescription>
              </div>
              <BarChart3 className="size-5 text-cyan-300" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid h-48 grid-cols-7 items-end gap-3">
              {trendBars.map((item) => (
                <div key={item.date} className="flex h-full flex-col justify-end gap-3">
                  <div className="relative flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                    <div className="absolute inset-x-2 bottom-2 rounded-2xl bg-gradient-to-t from-cyan-400 via-sky-400 to-violet-400" style={{ height: `${item.gmvHeight}%` }} />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-[11px] text-white/40">{item.date.slice(5)}</p>
                    <p className="text-xs text-white/70">{price(item.gmv)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-3">
              {trendBars.slice(-3).map((item) => (
                <div key={item.date} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/35">{item.date}</p>
                  <div className="mt-3 space-y-1 text-sm text-white/70">
                    <p>新增用户 {item.newUsers}</p>
                    <p>商品上新 {item.newProducts}</p>
                    <p>新增订单 {item.createdOrders}</p>
                    <p>售后新单 {item.newAfterSales}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 p-4 text-sm text-white/70">若售后新单上升而完成率回落，建议优先回看商品描述质量和卖家响应时效。</div>
            <Button variant="outline" size="lg" className="w-full rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void loadDashboard()}>
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />刷新全站数据
            </Button>
          </CardContent>
        </Card>
      </section>
      {alerts && shouldShowRiskSection ? (
        <section className="space-y-4">
          {showAlertCardPanel || showRiskOrdersPanel ? (
            <div className={cn("grid gap-4", showAlertCardPanel && showRiskOrdersPanel ? "xl:grid-cols-[1.05fr_0.95fr]" : "xl:grid-cols-1")}>
              {showAlertCardPanel ? (
                <Card className="border-white/10 bg-slate-950/88 text-white shadow-[0_30px_100px_rgba(8,15,32,0.45)]">
                  <CardHeader>
                    <CardTitle className="text-xl">运营告警卡</CardTitle>
                    <CardDescription className="text-white/55">只保留当前角色可直达的风险入口，把需要处理的异常直接推到眼前。</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {visibleAlertItems.map((item) => (
                      <div key={item.key} className={cn("rounded-3xl border p-4", alertTone(item.level))}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-current/75">{item.title}</p>
                            <p className="mt-3 text-3xl font-semibold text-white">{item.metric}</p>
                          </div>
                          <AlertTriangle className="size-5 text-white/80" />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/70">{item.description}</p>
                        <Button size="sm" variant="outline" className="mt-4 rounded-full border-white/10 bg-black/20 text-white hover:bg-white/10" onClick={() => setVisibleTab(item.targetTab)}>
                          {item.actionLabel}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
              {showRiskOrdersPanel ? (
                <Card className="border-white/10 bg-slate-950/88 text-white shadow-[0_30px_100px_rgba(8,15,32,0.45)]">
                  <CardHeader>
                    <CardTitle className="text-xl">风险订单提示</CardTitle>
                    <CardDescription className="text-white/55">这些订单可能发货滞后，或已进入售后协商阶段，建议客服和运营优先跟进。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alerts.riskOrders.length === 0 ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">当前没有需要重点关注的风险订单。</div> : null}
                    {alerts.riskOrders.map((item) => (
                      <div key={item.orderId} className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-base font-semibold text-white">{item.orderNo}</p>
                              <Badge className={cn("ring-1", statusTone(item.status))}>{statusText(item.status)}</Badge>
                              {item.afterSaleStatus ? <Badge className={cn("ring-1", statusTone(item.afterSaleStatus))}>售后 {statusText(item.afterSaleStatus)}</Badge> : null}
                            </div>
                            <p className="mt-2 text-sm text-white/75">{item.productTitle}</p>
                            <p className="mt-1 text-xs text-white/45">卖家：{item.sellerNickname} · 创建于 {dateText(item.createdAt)}</p>
                            <p className="mt-3 text-sm leading-6 text-white/65">{item.riskReason}</p>
                          </div>
                          <Button size="sm" className="rounded-full" onClick={() => setVisibleTab("orders")}>
                            查看订单
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}
          {showRiskSellersPanel || showRiskBuyersPanel ? (
            <div className={cn("grid gap-4", showRiskSellersPanel && showRiskBuyersPanel ? "xl:grid-cols-2" : "xl:grid-cols-1")}>
              {showRiskSellersPanel ? (
                <Card className="border-white/10 bg-slate-950/88 text-white shadow-[0_30px_100px_rgba(8,15,32,0.45)]">
                  <CardHeader>
                    <CardTitle className="text-xl">风险卖家画像</CardTitle>
                    <CardDescription className="text-white/55">综合待发货积压、售后纠纷和驳回商品，识别近期需要重点辅导的卖家。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alerts.riskSellers.length === 0 ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">当前没有明显的高风险卖家。</div> : null}
                    {alerts.riskSellers.map((item) => (
                      <div key={item.sellerId} className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-base font-semibold text-white">{item.sellerNickname}</p>
                              <Badge className={cn("ring-1", alertTone(item.riskScore >= 6 ? "high" : item.riskScore >= 3 ? "medium" : "low"))}>风险分 {item.riskScore}</Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">待发货 {item.delayedShipments}</span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">售后中 {item.openAfterSales}</span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">驳回商品 {item.rejectedProducts}</span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-white/65">{item.riskReason}</p>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setVisibleTab("products")}>查看商品</Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
              {showRiskBuyersPanel ? (
                <Card className="border-white/10 bg-slate-950/88 text-white shadow-[0_30px_100px_rgba(8,15,32,0.45)]">
                  <CardHeader>
                    <CardTitle className="text-xl">风险买家画像</CardTitle>
                    <CardDescription className="text-white/55">综合取消订单和售后频率，提前识别需要客服重点沟通的买家账户。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alerts.riskBuyers.length === 0 ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">当前没有明显的高风险买家。</div> : null}
                    {alerts.riskBuyers.map((item) => (
                      <div key={item.buyerId} className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-base font-semibold text-white">{item.buyerNickname}</p>
                              <Badge className={cn("ring-1", alertTone(item.riskScore >= 4 ? "high" : item.riskScore >= 2 ? "medium" : "low"))}>风险分 {item.riskScore}</Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">取消订单 {item.cancelledOrders}</span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">售后中 {item.openAfterSales}</span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-white/65">{item.riskReason}</p>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setVisibleTab("users")}>查看用户</Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-white/10 bg-slate-950/88 text-white shadow-[0_25px_90px_rgba(8,15,32,0.35)]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardDescription className="text-white/55">{item.label}</CardDescription>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white/75"><Icon className="size-4" /></div>
                </div>
                <CardTitle className="text-3xl font-semibold tracking-tight">{item.value.toLocaleString("zh-CN")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/65">{item.meta}</CardContent>
            </Card>
          );
        })}
      </section>

      {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}
      {loading ? <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">正在同步后台最新数据，请稍候...</div> : null}
      {lastBatchResult ? <BatchResultPanel scope={lastBatchResult.scope} status={lastBatchResult.status} result={lastBatchResult.result} onDownloadFailures={() => void downloadBatchFailureReport()} /> : null}

      <Tabs value={tab} onValueChange={setVisibleTab} className="gap-6">
        <TabsList variant="line" className="rounded-full border border-white/10 bg-slate-950/65 p-1 text-white/60">
          {canViewProductsTab ? <TabsTrigger value="products" className="rounded-full px-5 py-2 data-active:bg-white data-active:text-slate-950">商品审核</TabsTrigger> : null}
          {canViewUsersTab ? <TabsTrigger value="users" className="rounded-full px-5 py-2 data-active:bg-white data-active:text-slate-950">用户管理</TabsTrigger> : null}
          {canViewOrdersTab ? <TabsTrigger value="orders" className="rounded-full px-5 py-2 data-active:bg-white data-active:text-slate-950">订单总览</TabsTrigger> : null}
          {canViewAfterSalesTab ? <TabsTrigger value="afterSales" className="rounded-full px-5 py-2 data-active:bg-white data-active:text-slate-950">售后工单</TabsTrigger> : null}
          {canViewHomepageTab && canWriteCategories ? <TabsTrigger value="homepage" className="rounded-full px-5 py-2 data-active:bg-white data-active:text-slate-950">首页运营</TabsTrigger> : null}
          {canViewNotificationsTab && canWriteNotifications ? <TabsTrigger value="notifications" className="rounded-full px-5 py-2 data-active:bg-white data-active:text-slate-950">通知运营</TabsTrigger> : null}
          {canViewCategoriesTab ? <TabsTrigger value="categories" className="rounded-full px-5 py-2 data-active:bg-white data-active:text-slate-950">分类配置</TabsTrigger> : null}
          {canViewAuditTab ? <TabsTrigger value="audit" className="rounded-full px-5 py-2 data-active:bg-white data-active:text-slate-950">操作日志</TabsTrigger> : null}
        </TabsList>
        {canViewProductsTab ? <TabsContent value="products">
          <Card className="border-white/10 bg-slate-950/88 text-white">
            <CardHeader className="gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl">商品状态管理</CardTitle>
                <CardDescription className="text-white/55">支持按类目、卖家、价格段筛选，并可批量上架、归档和驳回平台商品。</CardDescription>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                <div className="relative min-w-64"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" /><Input value={productKeyword} onChange={(event) => setProductKeyword(event.target.value)} placeholder="搜索商品标题或卖家" className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30" /></div>
                <select value={productStatus} onChange={(event) => setProductStatus(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="">全部状态</option>{productStatuses.map((item) => <option key={item} value={item} className="bg-slate-950">{statusText(item)}</option>)}</select>
                <select value={productCategoryFilter} onChange={(event) => setProductCategoryFilter(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="">全部类目</option>{categories.map((item) => <option key={item.id} value={item.id} className="bg-slate-950">{item.nameZhCN}</option>)}</select>
                <Input value={productSellerIdFilter} onChange={(event) => setProductSellerIdFilter(event.target.value)} placeholder="卖家 ID" className="h-9 w-28 border-white/10 bg-white/5 text-white placeholder:text-white/30" />
                <Input value={productMinPrice} onChange={(event) => setProductMinPrice(event.target.value)} placeholder="最低价(分)" className="h-9 w-32 border-white/10 bg-white/5 text-white placeholder:text-white/30" />
                <Input value={productMaxPrice} onChange={(event) => setProductMaxPrice(event.target.value)} placeholder="最高价(分)" className="h-9 w-32 border-white/10 bg-white/5 text-white placeholder:text-white/30" />
                <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void loadDashboard({ productKeyword, productStatus, productCategoryId: productCategoryFilter, productSellerId: productSellerIdFilter, productMinPrice, productMaxPrice })}>应用筛选</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                <div>当前筛选结果 <span className="font-semibold text-white">{products.length}</span> 个商品，已选中 <span className="font-semibold text-white">{selectedProductIds.length}</span> 个</div>
                {canWriteProducts ? <div className="flex flex-wrap gap-2"><Button size="sm" className="rounded-full" disabled={selectedProductIds.length === 0} onClick={() => void batchChangeProductStatus("active")}>批量上架</Button><Button size="sm" variant="outline" className="rounded-full border-amber-300/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15" disabled={selectedProductIds.length === 0} onClick={() => void batchChangeProductStatus("archived")}>批量归档</Button><Button size="sm" variant="destructive" className="rounded-full" disabled={selectedProductIds.length === 0} onClick={() => void batchChangeProductStatus("rejected")}>批量驳回</Button></div> : null}
              </div>
              {products.length === 0 ? <TableEmptyState icon={Package2} title="当前没有符合筛选条件的商品" description="可以放宽类目、卖家或价格过滤条件，或者切到订单与用户页做交叉排查。" /> : null}
              {products.length > 0 ? (
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                  <Table>
                    <TableHeader><TableRow className="border-white/10 hover:bg-transparent"><TableHead className="w-12 px-4 text-white/45"><input type="checkbox" checked={products.length > 0 && products.every((item) => selectedProductIds.includes(item.id))} onChange={() => toggleAll(selectedProductIds, products.map((item) => item.id), setSelectedProductIds)} className="size-4 rounded border-white/20 bg-white/5" /></TableHead><TableHead className="px-4 text-white/45">商品</TableHead><TableHead className="text-white/45">卖家</TableHead><TableHead className="text-white/45">价格</TableHead><TableHead className="text-white/45">热度</TableHead><TableHead className="text-white/45">状态</TableHead><TableHead className="text-white/45">创建时间</TableHead><TableHead className="text-right text-white/45">操作</TableHead></TableRow></TableHeader>
                    <TableBody>{products.map((item) => <TableRow key={item.id} className="border-white/10 hover:bg-white/[0.03]"><TableCell className="px-4"><input type="checkbox" checked={selectedProductIds.includes(item.id)} onChange={() => toggleSelectedId(item.id, setSelectedProductIds)} className="size-4 rounded border-white/20 bg-white/5" /></TableCell><TableCell className="px-4"><div className="font-medium text-white">{item.title}</div><div className="mt-1 text-xs text-white/40">ID #{item.id} · 分类 {item.categoryId}</div></TableCell><TableCell className="text-white/70">{item.sellerNickname}<div className="mt-1 text-xs text-white/40">卖家 ID #{item.sellerId}</div></TableCell><TableCell className="text-white/85">{price(item.price, item.currency)}</TableCell><TableCell className="text-white/65">{item.favoriteCount} 关注</TableCell><TableCell><Badge className={cn("ring-1", statusTone(item.status))}>{statusText(item.status)}</Badge></TableCell><TableCell className="text-white/55">{dateText(item.createdAt)}</TableCell><TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2">{canViewUsersTab ? <Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => jumpToUsersByKeyword(item.sellerNickname)}>卖家账号</Button> : null}<Button size="sm" variant="outline" className="rounded-full border-cyan-300/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20" onClick={() => jumpToOrdersByKeyword(item.title)}>相关订单</Button>{canWriteProducts ? <><Button size="sm" className="rounded-full" onClick={() => void changeProductStatus(item.id, "active")}><CheckCircle2 className="size-3.5" />上架</Button><Button size="sm" variant="outline" className="rounded-full border-amber-300/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15" onClick={() => void changeProductStatus(item.id, "archived")}><Archive className="size-3.5" />归档</Button><Button size="sm" variant="destructive" className="rounded-full" onClick={() => void changeProductStatus(item.id, "rejected")}><XCircle className="size-3.5" />驳回</Button></> : <span className="text-xs text-white/35">只读</span>}</div></TableCell></TableRow>)}</TableBody>
                  </Table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent> : null}
        {canViewUsersTab ? <TabsContent value="users">
          <Card className="border-white/10 bg-slate-950/88 text-white">
            <CardHeader className="gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div><CardTitle className="text-xl">用户管理</CardTitle><CardDescription className="text-white/55">查看角色、语言偏好与账号状态，并支持按角色、状态批量处理账号。</CardDescription></div>
              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                <div className="relative min-w-64"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" /><Input value={userKeyword} onChange={(event) => setUserKeyword(event.target.value)} placeholder="搜索昵称或邮箱" className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30" /></div>
                <select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="">全部角色</option>{["user", "admin", "super_admin", "operator", "customer_service", "auditor"].map((role) => <option key={role} value={role} className="bg-slate-950">{roleText(role)}</option>)}</select>
                <select value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="">全部状态</option><option value="active" className="bg-slate-950">正常</option><option value="suspended" className="bg-slate-950">停用</option></select>
                <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void loadDashboard({ userKeyword, userRole: userRoleFilter, userStatus: userStatusFilter })}>查询用户</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                <div>当前筛选结果 <span className="font-semibold text-white">{users.length}</span> 人，已选中 <span className="font-semibold text-white">{selectedUserIds.length}</span> 人</div>
                {canWriteUsers ? <div className="flex flex-wrap gap-2"><Button size="sm" className="rounded-full" disabled={selectedUserIds.length === 0} onClick={() => void batchChangeUserStatus("active")}>批量启用</Button><Button size="sm" variant="destructive" className="rounded-full" disabled={selectedUserIds.length === 0} onClick={() => void batchChangeUserStatus("suspended")}>批量停用</Button></div> : null}
              </div>
              {users.length === 0 ? <TableEmptyState icon={Users2} title="当前没有符合条件的用户" description="可以尝试切换角色、状态或关键字；若是处理售后，可直接从售后表跳转到这里追踪账号。" /> : null}
              {users.length > 0 ? (
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                  <Table>
                    <TableHeader><TableRow className="border-white/10 hover:bg-transparent"><TableHead className="w-12 px-4 text-white/45"><input type="checkbox" checked={users.length > 0 && users.every((item) => selectedUserIds.includes(item.id))} onChange={() => toggleAll(selectedUserIds, users.map((item) => item.id), setSelectedUserIds)} className="size-4 rounded border-white/20 bg-white/5" /></TableHead><TableHead className="px-4 text-white/45">用户</TableHead><TableHead className="text-white/45">邮箱</TableHead><TableHead className="text-white/45">语言</TableHead><TableHead className="text-white/45">角色</TableHead><TableHead className="text-white/45">状态</TableHead><TableHead className="text-white/45">注册时间</TableHead><TableHead className="text-right text-white/45">操作</TableHead></TableRow></TableHeader>
                    <TableBody>{users.map((item) => <TableRow key={item.id} className="border-white/10 hover:bg-white/[0.03]"><TableCell className="px-4"><input type="checkbox" checked={selectedUserIds.includes(item.id)} onChange={() => toggleSelectedId(item.id, setSelectedUserIds)} className="size-4 rounded border-white/20 bg-white/5" /></TableCell><TableCell className="px-4"><div className="font-medium text-white">{item.nickname}</div><div className="mt-1 text-xs text-white/40">UID #{item.id}</div></TableCell><TableCell className="text-white/65">{item.email ?? "-"}</TableCell><TableCell className="text-white/65">{item.preferredLanguage}</TableCell><TableCell><Badge className={cn("ring-1", isManagementRole(item.role) ? "bg-violet-400/15 text-violet-100 ring-violet-300/20" : "bg-white/10 text-white/75 ring-white/10")}>{roleText(item.role)}</Badge></TableCell><TableCell><Badge className={cn("ring-1", statusTone(item.status))}>{statusText(item.status)}</Badge></TableCell><TableCell className="text-white/55">{dateText(item.createdAt)}</TableCell><TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => jumpToOrdersByKeyword(item.nickname)}>相关订单</Button>{canViewProductsTab ? <Button size="sm" variant="outline" className="rounded-full border-cyan-300/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20" onClick={() => jumpToSellerProducts(item.id)}>卖家商品</Button> : null}{canWriteUsers ? <><Button size="sm" className="rounded-full" onClick={() => void changeUserStatus(item.id, "active")}><CheckCircle2 className="size-3.5" />启用</Button><Button size="sm" variant="destructive" className="rounded-full" onClick={() => void changeUserStatus(item.id, "suspended")}><Ban className="size-3.5" />停用</Button></> : <span className="text-xs text-white/35">只读</span>}</div></TableCell></TableRow>)}</TableBody>
                  </Table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent> : null}
        {canViewOrdersTab ? <TabsContent value="orders">
          <Card className="border-white/10 bg-slate-950/88 text-white">
            <CardHeader className="gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl">订单总览</CardTitle>
                <CardDescription className="text-white/55">查看订单状态、买卖双方、物流信息以及售后关联情况，并支持金额、日期和风险条件筛选。</CardDescription>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                <div className="relative min-w-64"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" /><Input value={orderKeyword} onChange={(event) => setOrderKeyword(event.target.value)} placeholder="搜索订单号、商品或买卖家" className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30" /></div>
                <select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="">全部状态</option>{orderStatuses.map((item) => <option key={item} value={item} className="bg-slate-950">{statusText(item)}</option>)}</select>
                <Input value={orderMinAmount} onChange={(event) => setOrderMinAmount(event.target.value)} placeholder="最低金额(分)" className="h-9 w-32 border-white/10 bg-white/5 text-white placeholder:text-white/30" />
                <Input value={orderMaxAmount} onChange={(event) => setOrderMaxAmount(event.target.value)} placeholder="最高金额(分)" className="h-9 w-32 border-white/10 bg-white/5 text-white placeholder:text-white/30" />
                <Input type="date" value={orderStartDate} onChange={(event) => setOrderStartDate(event.target.value)} className="h-9 w-40 border-white/10 bg-white/5 text-white" />
                <Input type="date" value={orderEndDate} onChange={(event) => setOrderEndDate(event.target.value)} className="h-9 w-40 border-white/10 bg-white/5 text-white" />
                <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"><input type="checkbox" checked={orderHasAfterSale} onChange={(event) => setOrderHasAfterSale(event.target.checked)} className="size-4 rounded border-white/20 bg-white/5" />仅看有售后</label>
                <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"><input type="checkbox" checked={orderDelayedOnly} onChange={(event) => setOrderDelayedOnly(event.target.checked)} className="size-4 rounded border-white/20 bg-white/5" />仅看超时未发货</label>
                <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void loadDashboard({ orderKeyword, orderStatus, orderMinAmount, orderMaxAmount, orderStartDate, orderEndDate, orderHasAfterSale, orderDelayedOnly })}>筛选订单</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {canExportOrders ? (
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-4 text-sm text-white/75">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-white">导出当前筛选结果</p>
                      <p className="mt-1 text-xs text-white/55">导出会严格复用订单列表的关键词、金额、日期和风险筛选，不再只按状态粗导。</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(orderExportFilters.length > 0 ? orderExportFilters : ["未设置筛选，将导出当前可见全部订单"]).map((item) => (
                        <Badge key={item} className="bg-black/20 text-white/80 ring-1 ring-white/10">{item}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {orderExportFilters.length > 0 ? (
                      <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={resetOrderFilters}>
                        清空筛选
                      </Button>
                    ) : null}
                    <Button variant="outline" className="rounded-full border-cyan-300/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20" onClick={() => void exportOrders()} disabled={exportingTarget === "orders"}>
                      <Download className="size-4" />{exportingTarget === "orders" ? "正在导出..." : "导出筛选订单"}
                    </Button>
                  </div>
                </div>
              ) : null}
              {alerts?.riskOrders?.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {alerts.riskOrders.slice(0, 3).map((item) => (
                    <div key={`order-alert-${item.orderId}`} className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4">
                      <div className="flex items-center gap-2 text-amber-100"><Clock3 className="size-4" />重点关注订单</div>
                      <p className="mt-3 text-base font-semibold text-white">{item.orderNo}</p>
                      <p className="mt-2 text-sm text-white/70">{item.productTitle}</p>
                      <p className="mt-2 text-xs text-white/55">{item.riskReason}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {orders.length === 0 ? <TableEmptyState icon={ClipboardList} title="当前没有符合筛选条件的订单" description="可以改用时间区间、金额区间、是否售后来缩小范围，也可以从风险订单卡片直接跳转进来。" /> : null}
              {orders.length > 0 ? <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="px-4 text-white/45">订单号</TableHead>
                      <TableHead className="text-white/45">商品</TableHead>
                      <TableHead className="text-white/45">买家 / 卖家</TableHead>
                      <TableHead className="text-white/45">金额</TableHead>
                      <TableHead className="text-white/45">状态</TableHead>
                      <TableHead className="text-white/45">物流</TableHead>
                      <TableHead className="text-white/45">售后</TableHead>
                      <TableHead className="text-white/45">创建时间</TableHead>
                      <TableHead className="text-right text-white/45">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((item) => (
                      <TableRow key={item.id} className="border-white/10 hover:bg-white/[0.03]">
                        <TableCell className="px-4">
                          <div className="font-medium text-white">{item.orderNo}</div>
                          <div className="mt-1 text-xs text-white/40">OID #{item.id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-white">{item.productTitle}</div>
                          <div className="mt-1 text-xs text-white/40">PID #{item.productId}</div>
                        </TableCell>
                        <TableCell className="text-white/70">
                          <div>买家：{item.buyerNickname}</div>
                          <div className="mt-1 text-xs text-white/45">卖家：{item.sellerNickname}</div>
                        </TableCell>
                        <TableCell className="text-white/85">{price(item.totalAmount, item.currency)}</TableCell>
                        <TableCell>
                          <Badge className={cn("ring-1", statusTone(item.status))}>{statusText(item.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-white/65">
                          {item.carrier && item.trackingNo ? (
                            <div>
                              <div>{item.carrier}</div>
                              <div className="mt-1 text-xs text-white/45">{item.trackingNo}</div>
                            </div>
                          ) : (
                            <span className="text-white/40">未录入</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.afterSaleStatus ? (
                            <Badge className={cn("ring-1", statusTone(item.afterSaleStatus))}>{statusText(item.afterSaleStatus)}</Badge>
                          ) : (
                            <span className="text-white/40">无</span>
                          )}
                        </TableCell>
                        <TableCell className="text-white/55">{dateText(item.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void openOrderDetail(item.id)}>
                            查看详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div> : null}
            </CardContent>
          </Card>
        </TabsContent> : null}
        {canViewAfterSalesTab ? <TabsContent value="afterSales">
          <Card className="border-white/10 bg-slate-950/88 text-white">
            <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div>
                  <CardTitle className="text-xl">售后工单</CardTitle>
                  <CardDescription className="text-white/55">把退款、驳回、关闭等动作收敛为清晰的执行路径，方便平台运营快速跟单。</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-white/55">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Open = 待接单</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Processing = 协商中</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Approved = 已同意方案</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Refunded / Closed = 完结态</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <select value={afterSaleStatus} onChange={(event) => setAfterSaleStatus(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none">
                  <option value="" className="bg-slate-950">全部状态</option>
                  {afterSaleStatuses.map((item) => <option key={item} value={item} className="bg-slate-950">{statusText(item)}</option>)}
                </select>
                <select value={afterSaleType} onChange={(event) => setAfterSaleType(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="" className="bg-slate-950">全部类型</option><option value="refund" className="bg-slate-950">退款</option><option value="refund_partial" className="bg-slate-950">部分退款</option><option value="return_refund" className="bg-slate-950">退货退款</option><option value="exchange" className="bg-slate-950">换货</option></select>
                <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void loadDashboard({ silent: true, afterSaleStatus, afterSaleType })}>筛选工单</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                <div>当前筛选结果 <span className="font-semibold text-white">{afterSales.length}</span> 个工单，已选中 <span className="font-semibold text-white">{selectedAfterSaleIds.length}</span> 个</div>
                {canWriteAfterSales ? <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" className="rounded-full border-violet-300/20 bg-violet-400/10 text-violet-100 hover:bg-violet-400/20" disabled={selectedAfterSaleIds.length === 0} onClick={() => void batchChangeAfterSaleStatus("processing")}>批量处理中</Button><Button size="sm" className="rounded-full" disabled={selectedAfterSaleIds.length === 0} onClick={() => void batchChangeAfterSaleStatus("approved")}>批量同意</Button><Button size="sm" variant="outline" className="rounded-full border-emerald-300/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20" disabled={selectedAfterSaleIds.length === 0} onClick={() => void batchChangeAfterSaleStatus("refunded")}>批量退款完成</Button><Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" disabled={selectedAfterSaleIds.length === 0} onClick={() => void batchChangeAfterSaleStatus("closed")}>批量关闭</Button></div> : null}
              </div>
              {canExportAfterSales ? (
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-4 text-sm text-white/75">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-white">导出当前售后筛选</p>
                      <p className="mt-1 text-xs text-white/55">会同步带上售后状态与类型过滤，方便客服把当前工单池直接交给线下处理或复盘。</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(afterSaleExportFilters.length > 0 ? afterSaleExportFilters : ["未设置筛选，将导出当前可见全部售后工单"]).map((item) => (
                        <Badge key={item} className="bg-black/20 text-white/80 ring-1 ring-white/10">{item}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {afterSaleExportFilters.length > 0 ? (
                      <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={resetAfterSaleFilters}>
                        清空筛选
                      </Button>
                    ) : null}
                    <Button variant="outline" className="rounded-full border-emerald-300/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20" onClick={() => void exportAfterSales()} disabled={exportingTarget === "afterSales"}>
                      <Download className="size-4" />{exportingTarget === "afterSales" ? "正在导出..." : "导出筛选工单"}
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "待接单", value: afterSales.filter((item) => item.status === "open").length, meta: "卖家与平台都还未给出结论", tone: "border-amber-300/20 bg-amber-400/10 text-amber-100" },
                  { label: "协商处理中", value: afterSales.filter((item) => item.status === "processing").length, meta: "正在追踪证据、留言和退款方案", tone: "border-violet-300/20 bg-violet-400/10 text-violet-100" },
                  { label: "已同意方案", value: afterSales.filter((item) => item.status === "approved").length, meta: "等待平台执行退款或退货安排", tone: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100" },
                  { label: "完结工单", value: afterSales.filter((item) => ["refunded", "rejected", "closed"].includes(item.status)).length, meta: "含已退款、已驳回和已关闭工单", tone: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" },
                ].map((item) => (
                  <div key={item.label} className={cn("rounded-3xl border p-4", item.tone)}>
                    <p className="text-xs uppercase tracking-[0.24em] text-current/70">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                    <p className="mt-2 text-sm text-white/65">{item.meta}</p>
                  </div>
                ))}
              </div>

              {afterSales.length === 0 ? <TableEmptyState icon={ShieldAlert} title="当前没有符合条件的售后工单" description="可以切换售后状态或类型；如果需要追单，也可以从订单详情抽屉直接跳到这里。" /> : null}
              {afterSales.length > 0 ? <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="w-12 px-4 text-white/45"><input type="checkbox" checked={afterSales.length > 0 && afterSales.every((item) => selectedAfterSaleIds.includes(item.id))} onChange={() => toggleAll(selectedAfterSaleIds, afterSales.map((item) => item.id), setSelectedAfterSaleIds)} className="size-4 rounded border-white/20 bg-white/5" /></TableHead>
                      <TableHead className="px-4 text-white/45">工单 / 订单</TableHead>
                      <TableHead className="text-white/45">买家 / 卖家</TableHead>
                      <TableHead className="text-white/45">类型 / 金额</TableHead>
                      <TableHead className="text-white/45">当前进展</TableHead>
                      <TableHead className="text-white/45">处理摘要</TableHead>
                      <TableHead className="text-white/45">更新时间</TableHead>
                      <TableHead className="text-right text-white/45">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {afterSales.map((item) => {
                      const actions = getAfterSaleActions(item);
                      const summary = afterSaleSummary(item);
                      const finished = actions.length === 0;

                      return (
                        <TableRow key={item.id} className="border-white/10 align-top hover:bg-white/[0.03]">
                          <TableCell className="px-4 py-4 align-top"><input type="checkbox" checked={selectedAfterSaleIds.includes(item.id)} onChange={() => toggleSelectedId(item.id, setSelectedAfterSaleIds)} className="size-4 rounded border-white/20 bg-white/5" /></TableCell>
                          <TableCell className="space-y-2 px-4 py-4">
                            <div className="font-medium text-white">#{item.id}</div>
                            <div className="text-sm text-white/80">{item.orderNo}</div>
                            <div className="text-xs text-white/45">{item.productTitle}</div>
                          </TableCell>
                          <TableCell className="space-y-2 py-4 text-white/70">
                            <div>买家：{item.buyerNickname}</div>
                            <div className="text-xs text-white/45">卖家：{item.sellerNickname}</div>
                            <div className="text-xs text-white/35">PID #{item.productId}</div>
                          </TableCell>
                          <TableCell className="space-y-2 py-4 text-white/70">
                            <div>{afterSaleTypeText(item.type)}</div>
                            <div className="text-sm font-medium text-white">{price(item.requestedAmount, item.currency)}</div>
                            <div className="text-xs text-white/45">原因：{item.reason}</div>
                          </TableCell>
                          <TableCell className="space-y-3 py-4">
                            <Badge className={cn("ring-1", statusTone(item.status))}>{statusText(item.status)}</Badge>
                            <p className="max-w-52 text-sm text-white/65">{afterSaleStageText(item.status)}</p>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-sm text-white/80">{summary}</p>
                              <p className="mt-2 text-xs text-white/40">如需补充说明，建议同步在客服备注和会话中留痕。</p>
                              <div className="mt-3 border-t border-white/10 pt-3">
                                {renderAfterSaleLogItems(item.logs, 2)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-white/55">{dateText(item.updatedAt)}</TableCell>
                          <TableCell className="py-4 text-right">
                            {actions.length > 0 && canWriteAfterSales ? (
                              <div className="flex max-w-[260px] flex-wrap justify-end gap-2">
                                <Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void openOrderDetail(item.orderId)}>订单</Button>
                                {canViewUsersTab ? <Button size="sm" variant="outline" className="rounded-full border-cyan-300/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20" onClick={() => jumpToUsersByKeyword(item.buyerNickname)}>买家</Button> : null}
                                {canViewProductsTab ? <Button size="sm" variant="outline" className="rounded-full border-violet-300/20 bg-violet-400/10 text-violet-100 hover:bg-violet-400/20" onClick={() => jumpToSellerProducts(item.sellerId)}>卖家商品</Button> : null}
                                {actions.map((action) => (
                                  <Button
                                    key={`${item.id}-${action.status}`}
                                    size="sm"
                                    variant={action.variant}
                                    className={cn("rounded-full", action.className)}
                                    onClick={() => void changeAfterSaleStatus(item.id, action.status)}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-2 text-right">
                                <Badge className={cn("ring-1", statusTone(item.status))}>{statusText(item.status)}</Badge>
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void openOrderDetail(item.orderId)}>订单</Button>
                                  {canViewUsersTab ? <Button size="sm" variant="outline" className="rounded-full border-cyan-300/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20" onClick={() => jumpToUsersByKeyword(item.buyerNickname)}>买家</Button> : null}
                                </div>
                                <p className="text-xs text-white/40">{!canWriteAfterSales ? "当前角色仅可查看工单" : finished ? "当前为完结态，无需继续操作" : "等待下一步处理"}</p>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div> : null}
            </CardContent>
          </Card>
        </TabsContent> : null}

        {canViewHomepageTab && canWriteCategories ? (
          <TabsContent value="homepage">
            <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              <Card className="border-white/10 bg-slate-950/88 text-white">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-300/20">Homepage Ops</Badge>
                    <Badge className="bg-white/10 text-white/70 ring-1 ring-white/10">Hero / CTA / Featured</Badge>
                  </div>
                  <CardTitle className="text-xl">首页 Hero 与推荐位配置</CardTitle>
                  <CardDescription className="text-white/55">直接维护首页主标题、CTA、精选商品和推荐 Banner，前台首页会优先消费这里的内容。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><label className="text-sm text-white/60">Hero Badge</label><Input value={homeConfig.heroBadge} onChange={(event) => setHomeConfig((current) => ({ ...current, heroBadge: event.target.value }))} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                    <div className="space-y-2"><label className="text-sm text-white/60">精选类目 Slugs</label><Input value={homeConfig.featuredCategorySlugs.join(", ")} onChange={(event) => setHomeConfig((current) => ({ ...current, featuredCategorySlugs: event.target.value.split(/[,，\s]+/).map((item) => item.trim()).filter(Boolean) }))} placeholder="phones-digital, computers-office" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                  </div>
                  <div className="space-y-2"><label className="text-sm text-white/60">首页主标题</label><Input value={homeConfig.heroTitle} onChange={(event) => setHomeConfig((current) => ({ ...current, heroTitle: event.target.value }))} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                  <div className="space-y-2"><label className="text-sm text-white/60">首页说明</label><Textarea value={homeConfig.heroDescription} onChange={(event) => setHomeConfig((current) => ({ ...current, heroDescription: event.target.value }))} className="min-h-28 border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><label className="text-sm text-white/60">主 CTA 文案</label><Input value={homeConfig.primaryCtaText} onChange={(event) => setHomeConfig((current) => ({ ...current, primaryCtaText: event.target.value }))} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                    <div className="space-y-2"><label className="text-sm text-white/60">主 CTA 链接</label><Input value={homeConfig.primaryCtaLink} onChange={(event) => setHomeConfig((current) => ({ ...current, primaryCtaLink: event.target.value }))} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                    <div className="space-y-2"><label className="text-sm text-white/60">次 CTA 文案</label><Input value={homeConfig.secondaryCtaText} onChange={(event) => setHomeConfig((current) => ({ ...current, secondaryCtaText: event.target.value }))} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                    <div className="space-y-2"><label className="text-sm text-white/60">次 CTA 链接</label><Input value={homeConfig.secondaryCtaLink} onChange={(event) => setHomeConfig((current) => ({ ...current, secondaryCtaLink: event.target.value }))} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                  </div>
                  <div className="space-y-2"><label className="text-sm text-white/60">精选商品 IDs</label><Input value={homeConfig.featuredProductIds.join(", ")} onChange={(event) => setHomeConfig((current) => ({ ...current, featuredProductIds: event.target.value.split(/[,，\s]+/).map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0) }))} placeholder="3008, 3003, 3004" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                  <div className="flex flex-wrap gap-3">
                    <Button className="rounded-full" onClick={() => void saveHomepageConfig()}><LayoutTemplate className="size-4" />保存首页配置</Button>
                    <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setHomeConfig(defaultHomeConfig)}>恢复默认</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-white/10 bg-slate-950/88 text-white">
                  <CardHeader>
                    <CardTitle className="text-xl">推荐 Banner 轨道</CardTitle>
                    <CardDescription className="text-white/55">控制首页顶部横幅内容，适合投放履约公告、活动位和推荐理由。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {homeConfig.banners.map((banner, index) => (
                      <div key={banner.id || index} className={cn("rounded-3xl border p-4", bannerToneClass(banner.tone))}>
                        <div className="grid gap-3">
                          <Input value={banner.title} onChange={(event) => setHomeConfig((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) }))} className="border-white/10 bg-black/20 text-white placeholder:text-white/30" />
                          <Textarea value={banner.subtitle} onChange={(event) => setHomeConfig((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, subtitle: event.target.value } : item) }))} className="min-h-24 border-white/10 bg-black/20 text-white placeholder:text-white/30" />
                          <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                            <Input value={banner.link} onChange={(event) => setHomeConfig((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, link: event.target.value } : item) }))} className="border-white/10 bg-black/20 text-white placeholder:text-white/30" />
                            <select value={banner.tone} onChange={(event) => setHomeConfig((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, tone: event.target.value } : item) }))} className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none">
                              <option value="cyan" className="bg-slate-950">Cyan</option>
                              <option value="violet" className="bg-slate-950">Violet</option>
                              <option value="emerald" className="bg-slate-950">Emerald</option>
                              <option value="amber" className="bg-slate-950">Amber</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-slate-950/88 text-white">
                  <CardHeader>
                    <CardTitle className="text-xl">运营建议</CardTitle>
                    <CardDescription className="text-white/55">把首页当成推荐位管理面板使用，而不仅是静态内容。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                      <div className="flex items-center gap-2 text-white"><Megaphone className="size-4 text-cyan-300" />推荐位建议</div>
                      <p className="mt-2 leading-7">优先把高成色、履约快、售后少的商品放入首页精选商品池，让首页承担交易信任建立的职责。</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                      <div className="flex items-center gap-2 text-white"><ImagePlus className="size-4 text-violet-300" />Banner 建议</div>
                      <p className="mt-2 leading-7">Banner 更适合承接平台公告、履约说明、运营活动，不建议堆太多营销口号，突出一个行动目标即可。</p>
                    </div>
                    <Link href={ROUTES.home} target="_blank" className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10")}>
                      预览前台首页
                      <ExternalLink className="size-4" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ) : null}

        {canViewNotificationsTab && canWriteNotifications ? (
          <TabsContent value="notifications">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="border-white/10 bg-slate-950/88 text-white">
                <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-xl">通知模板库</CardTitle>
                    <CardDescription className="text-white/55">沉淀发货提醒、平台公告、活动召回等运营模板，避免每次临时手写文案。</CardDescription>
                  </div>
                  <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setNotificationTemplateForm(emptyNotificationTemplate)}>
                    新建模板
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notificationTemplates.length === 0 ? <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/60">还没有通知模板，建议先创建“履约提醒”和“平台公告”两类常用模板。</div> : null}
                  {notificationTemplates.map((template) => (
                    <div key={template.id} className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-white">{template.name}</p>
                            <Badge className={cn("ring-1", statusTone(template.status))}>{statusText(template.status)}</Badge>
                            <Badge className="bg-white/10 text-white/70 ring-1 ring-white/10">{template.type}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-white/70">{template.titleTemplate}</p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">{template.contentTemplate}</p>
                          <p className="mt-2 text-xs text-white/35">更新时间 {dateText(template.updatedAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => editNotificationTemplate(template)}>
                            编辑
                          </Button>
                          <Button size="sm" className="rounded-full" onClick={() => applyTemplateToSend(template)}>
                            载入发送
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-white/10 bg-slate-950/88 text-white">
                  <CardHeader>
                    <CardTitle className="text-xl">后台动作联动模板</CardTitle>
                    <CardDescription className="text-white/55">把用户状态、商品审核、售后流转绑定到标准通知模板，减少运营和客服的重复输入。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {actionBindings.length === 0 ? <TableEmptyState icon={Bell} title="当前没有绑定配置" description="你可以先创建模板，再给后台动作指定默认模板。" /> : null}
                    {actionBindings.map((binding, index) => (
                      <div key={binding.actionKey} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className="bg-white/10 text-white/75 ring-1 ring-white/10">{actionKeyText(binding.actionKey)}</Badge>
                          {binding.templateName ? <Badge className="bg-cyan-400/10 text-cyan-100 ring-1 ring-cyan-300/20">当前模板：{binding.templateName}</Badge> : null}
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
                          <select value={binding.templateId ?? 0} onChange={(event) => setActionBindings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, templateId: Number(event.target.value) > 0 ? Number(event.target.value) : undefined, templateName: notificationTemplates.find((template) => template.id === Number(event.target.value))?.name } : item))} className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none">
                            <option value="0" className="bg-slate-950">使用 fallback 规则</option>
                            {notificationTemplates.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id} className="bg-slate-950">{item.name}</option>)}
                          </select>
                          <Input value={binding.fallbackNames.join(", ")} onChange={(event) => setActionBindings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, fallbackNames: event.target.value.split(/[,，\s]+/).map((name) => name.trim()).filter(Boolean) } : item))} placeholder="fallback 模板名，多个用逗号分隔" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
                        </div>
                      </div>
                    ))}
                    <Button className="w-full rounded-full" onClick={() => void saveActionBindings()}>
                      <Bell className="size-4" />保存联动模板
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-slate-950/88 text-white">
                  <CardHeader>
                    <CardTitle className="text-xl">模板编辑器</CardTitle>
                    <CardDescription className="text-white/55">统一维护标题、正文和默认跳转链接。启用状态的模板可直接进入发送面板。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><label className="text-sm text-white/60">模板名称</label><Input value={notificationTemplateForm.name} onChange={(event) => setNotificationTemplateForm((current) => ({ ...current, name: event.target.value }))} placeholder="例如：平台履约提醒" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                      <div className="space-y-2"><label className="text-sm text-white/60">通知类型</label><Input value={notificationTemplateForm.type} onChange={(event) => setNotificationTemplateForm((current) => ({ ...current, type: event.target.value }))} placeholder="system / shipment / campaign" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                    </div>
                    <div className="space-y-2"><label className="text-sm text-white/60">标题模板</label><Input value={notificationTemplateForm.titleTemplate} onChange={(event) => setNotificationTemplateForm((current) => ({ ...current, titleTemplate: event.target.value }))} placeholder="例如：本周履约提醒已更新" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                    <div className="space-y-2"><label className="text-sm text-white/60">正文模板</label><Textarea value={notificationTemplateForm.contentTemplate} onChange={(event) => setNotificationTemplateForm((current) => ({ ...current, contentTemplate: event.target.value }))} placeholder="输入通知正文模板" className="min-h-28 border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                    <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                      <div className="space-y-2"><label className="text-sm text-white/60">默认链接</label><Input value={notificationTemplateForm.defaultLink} onChange={(event) => setNotificationTemplateForm((current) => ({ ...current, defaultLink: event.target.value }))} placeholder="/me/orders/buy 或 /me/notifications" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                      <div className="space-y-2"><label className="text-sm text-white/60">状态</label><select value={notificationTemplateForm.status} onChange={(event) => setNotificationTemplateForm((current) => ({ ...current, status: event.target.value }))} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="active" className="bg-slate-950">正常</option><option value="archived" className="bg-slate-950">归档</option></select></div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button className="rounded-full" onClick={() => void saveNotificationTemplate()}>
                        <Bell className="size-4" />{notificationTemplateForm.id > 0 ? "保存模板" : "创建模板"}
                      </Button>
                      <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setNotificationTemplateForm(emptyNotificationTemplate)}>
                        清空表单
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-slate-950/88 text-white">
                  <CardHeader>
                    <CardTitle className="text-xl">运营发送面板</CardTitle>
                    <CardDescription className="text-white/55">按人群直接发送站内通知，可选择模板后微调标题与正文，再批量触达目标账号。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><label className="text-sm text-white/60">套用模板</label><select value={notificationSendForm.templateId} onChange={(event) => {
                        const templateId = Number(event.target.value || 0);
                        const template = notificationTemplates.find((item) => item.id === templateId);
                        if (template) {
                          applyTemplateToSend(template);
                        } else {
                          setNotificationSendForm((current) => ({ ...current, templateId: 0 }));
                        }
                      }} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="0" className="bg-slate-950">不使用模板</option>{notificationTemplates.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id} className="bg-slate-950">{item.name}</option>)}</select></div>
                      <div className="space-y-2"><label className="text-sm text-white/60">目标范围</label><select value={notificationSendForm.targetType} onChange={(event) => setNotificationSendForm((current) => ({ ...current, targetType: event.target.value }))} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="all_users" className="bg-slate-950">全部普通用户</option><option value="management" className="bg-slate-950">全部后台角色</option><option value="role" className="bg-slate-950">指定角色</option><option value="user_ids" className="bg-slate-950">指定用户 ID</option></select></div>
                    </div>
                    {notificationSendForm.targetType === "role" ? <div className="space-y-2"><label className="text-sm text-white/60">目标角色</label><select value={notificationSendForm.targetRole} onChange={(event) => setNotificationSendForm((current) => ({ ...current, targetRole: event.target.value }))} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none">{["user", "admin", "super_admin", "operator", "customer_service", "auditor"].map((role) => <option key={role} value={role} className="bg-slate-950">{roleText(role)}</option>)}</select></div> : null}
                    {notificationSendForm.targetType === "user_ids" ? <div className="space-y-2"><label className="text-sm text-white/60">目标用户 ID</label><Input value={notificationSendForm.userIds} onChange={(event) => setNotificationSendForm((current) => ({ ...current, userIds: event.target.value }))} placeholder="例如：1, 2, 7" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div> : null}
                    <div className="space-y-2"><label className="text-sm text-white/60">通知标题</label><Input value={notificationSendForm.title} onChange={(event) => setNotificationSendForm((current) => ({ ...current, title: event.target.value }))} placeholder="输入本次通知标题" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                    <div className="space-y-2"><label className="text-sm text-white/60">通知正文</label><Textarea value={notificationSendForm.content} onChange={(event) => setNotificationSendForm((current) => ({ ...current, content: event.target.value }))} placeholder="输入本次通知正文" className="min-h-28 border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                    <div className="space-y-2"><label className="text-sm text-white/60">跳转链接</label><Input value={notificationSendForm.link} onChange={(event) => setNotificationSendForm((current) => ({ ...current, link: event.target.value }))} placeholder="可选，输入站内跳转路径" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></div>
                    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-white/70">建议用模板统一语气，再根据目标人群细调正文。发送后，用户会在前台“通知中心”立刻看到这条站内通知。</div>
                    <Button className="w-full rounded-full" onClick={() => void sendNotificationCampaign()}>
                      <Send className="size-4" />发送运营通知
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ) : null}
        {canViewAuditTab ? <TabsContent value="audit">
          <Card className="border-white/10 bg-slate-950/88 text-white">
            <CardHeader className="gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl">后台操作日志</CardTitle>
                <CardDescription className="text-white/55">记录管理员对用户、商品、售后和分类的关键操作，便于审计和复盘。</CardDescription>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative min-w-64"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" /><Input value={auditKeyword} onChange={(event) => setAuditKeyword(event.target.value)} placeholder="搜索管理员、目标或操作说明" className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30" /></div>
                <select value={auditAction} onChange={(event) => setAuditAction(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="">全部动作</option><option value="user.status.updated" className="bg-slate-950">用户状态更新</option><option value="product.status.updated" className="bg-slate-950">商品状态更新</option><option value="after_sale.status.updated" className="bg-slate-950">售后状态更新</option><option value="category.updated" className="bg-slate-950">分类配置更新</option></select>
                <Button variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void loadDashboard({ silent: true, auditKeyword, auditAction, userKeyword, productKeyword, productStatus, orderKeyword, orderStatus, afterSaleStatus })}>筛选日志</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                  <div className="flex items-center gap-2 text-cyan-100"><ClipboardList className="size-4" />最近操作</div>
                  <p className="mt-3 text-3xl font-semibold text-white">{auditLogs.length}</p>
                  <p className="mt-2 text-sm text-white/65">当前展示最近 100 条关键后台动作</p>
                </div>
                <div className="rounded-3xl border border-violet-300/20 bg-violet-400/10 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-violet-100/75">最近动作类型</p>
                  <p className="mt-3 text-lg font-semibold text-white">{auditLogs[0] ? auditActionText(auditLogs[0].action) : "暂无"}</p>
                  <p className="mt-2 text-sm text-white/65">帮助你快速判断后台最近在处理什么事务</p>
                </div>
                <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-amber-100/75">最近执行人</p>
                  <p className="mt-3 text-lg font-semibold text-white">{auditLogs[0]?.actorNickname ?? "暂无"}</p>
                  <p className="mt-2 text-sm text-white/65">出现异常时可直接倒查到处理人</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                <Table>
                  <TableHeader><TableRow className="border-white/10 hover:bg-transparent"><TableHead className="px-4 text-white/45">时间</TableHead><TableHead className="text-white/45">管理员</TableHead><TableHead className="text-white/45">动作</TableHead><TableHead className="text-white/45">目标</TableHead><TableHead className="text-white/45">说明</TableHead></TableRow></TableHeader>
                  <TableBody>{auditLogs.map((item) => <TableRow key={item.id} className="border-white/10 hover:bg-white/[0.03]"><TableCell className="px-4 text-white/55">{dateText(item.createdAt)}</TableCell><TableCell className="text-white/75">{item.actorNickname}</TableCell><TableCell><Badge className="bg-white/10 text-white/75 ring-1 ring-white/10">{auditActionText(item.action)}</Badge></TableCell><TableCell className="text-white/70"><div>{targetTypeText(item.targetType)} #{item.targetId}</div><div className="mt-1 text-xs text-white/40">{item.targetLabel ?? "-"}</div></TableCell><TableCell className="text-white/65">{item.detail}</TableCell></TableRow>)}</TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent> : null}
        {canViewCategoriesTab ? <TabsContent value="categories">
          <Card className="border-white/10 bg-slate-950/88 text-white">
            <CardHeader><CardTitle className="text-xl">分类配置</CardTitle><CardDescription className="text-white/55">维护中英文文案、排序和启用状态。</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                <Table>
                  <TableHeader><TableRow className="border-white/10 hover:bg-transparent"><TableHead className="px-4 text-white/45">Slug</TableHead><TableHead className="text-white/45">中文名</TableHead><TableHead className="text-white/45">英文名</TableHead><TableHead className="text-white/45">排序</TableHead><TableHead className="text-white/45">状态</TableHead><TableHead className="text-right text-white/45">操作</TableHead></TableRow></TableHeader>
                  <TableBody>{categories.map((item) => { const draft = drafts[item.id] ?? { status: item.status, sortOrder: item.sortOrder, nameZhCN: item.nameZhCN, nameEnUS: item.nameEnUS }; return <TableRow key={item.id} className="border-white/10 hover:bg-white/[0.03]"><TableCell className="px-4"><div className="font-medium text-white">{item.slug}</div><div className="mt-1 text-xs text-white/40">CID #{item.id}</div></TableCell><TableCell><Input disabled={!canWriteCategories} value={draft.nameZhCN} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, nameZhCN: event.target.value } }))} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></TableCell><TableCell><Input disabled={!canWriteCategories} value={draft.nameEnUS} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, nameEnUS: event.target.value } }))} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" /></TableCell><TableCell><Input disabled={!canWriteCategories} type="number" value={draft.sortOrder} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, sortOrder: Number(event.target.value || 0) } }))} className="w-24 border-white/10 bg-white/5 text-white placeholder:text-white/30" /></TableCell><TableCell><select disabled={!canWriteCategories} value={draft.status} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, status: event.target.value } }))} className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"><option value="active" className="bg-slate-950">正常</option><option value="archived" className="bg-slate-950">归档</option></select></TableCell><TableCell className="text-right">{canWriteCategories ? <Button size="sm" className="rounded-full" onClick={() => void saveCategory(item.id)}>保存</Button> : <span className="text-xs text-white/35">只读</span>}</TableCell></TableRow>; })}</TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent> : null}
      </Tabs>

      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto border-white/10 bg-slate-950/95 p-0 text-white shadow-[0_40px_140px_rgba(8,15,32,0.7)]" showCloseButton>
          <DialogHeader className="border-b border-white/10 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge className="bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">Order Detail</Badge>
                <DialogTitle className="mt-3 text-2xl font-semibold tracking-tight">
                  {orderDetail?.orderNo ?? (selectedOrderId ? `订单 #${selectedOrderId}` : "订单详情")}
                </DialogTitle>
                <DialogDescription className="mt-2 text-white/55">
                  在这里集中查看商品、买卖家、收货、物流与售后信息，并快速跳到对应处理区。
                </DialogDescription>
              </div>
              {orderDetail ? <Badge className={cn("ring-1", statusTone(orderDetail.status))}>{statusText(orderDetail.status)}</Badge> : null}
            </div>
          </DialogHeader>

          {orderDetailLoading ? (
            <div className="flex min-h-80 items-center justify-center gap-3 px-6 py-10 text-white/65">
              <RefreshCw className="size-4 animate-spin text-cyan-300" />正在加载订单详情...
            </div>
          ) : orderDetailError ? (
            <div className="px-6 py-8">
              <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">{orderDetailError}</div>
            </div>
          ) : orderDetail ? (
            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
                <Card className="border-white/10 bg-white/[0.03] text-white">
                  <CardHeader className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">订单概览</CardTitle>
                        <CardDescription className="text-white/55">订单金额、履约状态与最近更新时间。</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-white/10 text-white/70 ring-1 ring-white/10">创建于 {dateText(orderDetail.createdAt)}</Badge>
                        <Badge className="bg-white/10 text-white/70 ring-1 ring-white/10">更新于 {dateText(orderDetail.updatedAt)}</Badge>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">订单金额</p>
                        <p className="mt-3 text-3xl font-semibold text-white">{price(orderDetail.totalAmount, orderDetail.currency)}</p>
                        <p className="mt-2 text-sm text-white/60">含运费 {price(orderDetail.shippingFee, orderDetail.currency)}</p>
                      </div>
                      <div className="rounded-3xl border border-violet-300/20 bg-violet-400/10 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-violet-100/75">履约状态</p>
                        <div className="mt-3"><Badge className={cn("ring-1", statusTone(orderDetail.status))}>{statusText(orderDetail.status)}</Badge></div>
                        <p className="mt-2 text-sm text-white/60">订单编号 {orderDetail.orderNo}</p>
                      </div>
                      <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-amber-100/75">关联售后</p>
                        <p className="mt-3 text-3xl font-semibold text-white">{orderDetail.afterSales.length}</p>
                        <p className="mt-2 text-sm text-white/60">用于判断是否需要客服重点跟进</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="border-white/10 bg-white/[0.03] text-white">
                  <CardHeader>
                    <CardTitle className="text-xl">快捷处理</CardTitle>
                    <CardDescription className="text-white/55">从订单详情一键切到后台对应工作区。</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <Button className="justify-between rounded-2xl" onClick={() => jumpToOrderFilter(orderDetail.sellerNickname)}>
                      <span>筛选同卖家订单</span>
                      <ArrowRight className="size-4" />
                    </Button>
                    {canViewProductsTab ? <Button variant="outline" className="justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => jumpToProductFilter(orderDetail.sellerNickname)}>
                      <span>查看卖家商品池</span>
                      <ArrowRight className="size-4" />
                    </Button> : null}
                    {canViewUsersTab ? <Button variant="outline" className="justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => jumpToUserFilter(orderDetail.buyerNickname)}>
                      <span>查看买家账号</span>
                      <ArrowRight className="size-4" />
                    </Button> : null}
                    {canViewAfterSalesTab ? <Button variant="outline" className="justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:text-white/30" onClick={jumpToAfterSales} disabled={orderDetail.afterSales.length === 0}>
                      <span>查看关联售后</span>
                      <ArrowRight className="size-4" />
                    </Button> : null}
                    <Link href={`${ROUTES.products}/${orderDetail.productId}`} target="_blank" className={cn(buttonVariants({ variant: "outline" }), "justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10")}>
                      <span>打开前台商品页</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <Card className="border-white/10 bg-white/[0.03] text-white">
                  <CardHeader>
                    <CardTitle className="text-xl">商品与交易主体</CardTitle>
                    <CardDescription className="text-white/55">把商品内容与买卖双方信息放在同一视图里，方便快速判断风险。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
                      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                        {orderDetail.productImageUrl ? <img src={orderDetail.productImageUrl} alt={orderDetail.productTitle} className="h-40 w-full object-cover" /> : <div className="flex h-40 items-center justify-center text-sm text-white/40">暂无图片</div>}
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{orderDetail.productTitle}</h3>
                          <Badge className={cn("ring-1", statusTone(orderDetail.productStatus))}>{statusText(orderDetail.productStatus)}</Badge>
                        </div>
                        <p className="mt-3 text-sm text-white/55">商品 ID #{orderDetail.productId}</p>
                        <p className="mt-4 text-sm leading-6 text-white/68">该订单已经关联到具体商品状态，可用于判断是否存在下架、售后或重复履约风险。</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-white/35">买家</p>
                            <p className="mt-2 text-lg font-semibold text-white">{orderDetail.buyerNickname}</p>
                          </div>
                          <Badge className={cn("ring-1", statusTone(orderDetail.buyerStatus))}>{statusText(orderDetail.buyerStatus)}</Badge>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-white/68">
                          <p>UID #{orderDetail.buyerId}</p>
                          <p>{orderDetail.buyerEmail ?? "未填写邮箱"}</p>
                        </div>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-white/35">卖家</p>
                            <p className="mt-2 text-lg font-semibold text-white">{orderDetail.sellerNickname}</p>
                          </div>
                          <Badge className={cn("ring-1", statusTone(orderDetail.sellerStatus))}>{statusText(orderDetail.sellerStatus)}</Badge>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-white/68">
                          <p>UID #{orderDetail.sellerId}</p>
                          <p>{orderDetail.sellerEmail ?? "未填写邮箱"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4">
                  <Card className="border-white/10 bg-white/[0.03] text-white">
                    <CardHeader>
                      <CardTitle className="text-xl">收货与物流</CardTitle>
                      <CardDescription className="text-white/55">查看收货信息和当前物流状态，便于客服判断是否需要催发货或回访。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/35">收货人</p>
                        <p className="mt-2 text-lg font-semibold text-white">{orderDetail.receiverName}</p>
                        <p className="mt-2">{orderDetail.receiverPhone}</p>
                        <p className="mt-2 leading-6">{orderDetail.receiverRegion} {orderDetail.receiverAddress}</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.24em] text-white/35">物流追踪</p>
                          {orderDetail.shipmentStatus ? <Badge className={cn("ring-1", statusTone(orderDetail.shipmentStatus))}>{statusText(orderDetail.shipmentStatus)}</Badge> : null}
                        </div>
                        {orderDetail.carrier && orderDetail.trackingNo ? (
                          <div className="mt-3 space-y-2">
                            <p className="text-white">{orderDetail.carrier}</p>
                            <p>{orderDetail.trackingNo}</p>
                          </div>
                        ) : (
                          <p className="mt-3 text-white/40">当前还未录入物流单号。</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/[0.03] text-white">
                    <CardHeader>
                      <CardTitle className="text-xl">关联售后</CardTitle>
                      <CardDescription className="text-white/55">展示此订单对应的售后单，方便平台快速定位处理上下文。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {orderDetail.afterSales.length === 0 ? (
                        <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-white/50">当前订单没有关联售后工单。</div>
                      ) : (
                        orderDetail.afterSales.map((item) => (
                          <div key={item.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-base font-semibold text-white">售后 #{item.id}</p>
                              <Badge className={cn("ring-1", statusTone(item.status))}>{statusText(item.status)}</Badge>
                              <Badge className="bg-white/10 text-white/70 ring-1 ring-white/10">{afterSaleTypeText(item.type)}</Badge>
                            </div>
                            <p className="mt-3 text-sm text-white/75">{orderAfterSaleSummary(item)}</p>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/45">
                              <span>申请金额 {price(item.requestedAmount, item.currency)}</span>
                              <span>更新时间 {dateText(item.updatedAt)}</span>
                            </div>
                            <div className="mt-4 border-t border-white/10 pt-4">
                              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/35">处理时间线</p>
                              {renderAfterSaleLogItems(item.logs)}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}



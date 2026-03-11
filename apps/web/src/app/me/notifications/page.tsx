"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getNotificationSummary, listNotifications, markAllNotificationsRead, markNotificationRead } from "@turno/api-sdk";
import { ROUTES } from "@turno/constants";
import type { NotificationItem } from "@turno/types";
import { Bell, CheckCheck, MessageSquare, PackageCheck, ShieldAlert, Star, Truck } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

function formatDateTime(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function notificationMeta(type: string) {
  switch (type) {
    case "message":
      return { label: "消息提醒", icon: MessageSquare, tone: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100" };
    case "order":
      return { label: "订单提醒", icon: PackageCheck, tone: "border-violet-300/20 bg-violet-400/10 text-violet-100" };
    case "shipment":
      return { label: "物流提醒", icon: Truck, tone: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" };
    case "after_sale":
      return { label: "售后提醒", icon: ShieldAlert, tone: "border-amber-300/20 bg-amber-400/10 text-amber-100" };
    case "review":
      return { label: "评价提醒", icon: Star, tone: "border-rose-300/20 bg-rose-400/10 text-rose-100" };
    default:
      return { label: "系统通知", icon: Bell, tone: "border-white/10 bg-white/5 text-white" };
  }
}

export default function NotificationsPage() {
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }

    const token = accessToken;
    let mounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [notifications, summary] = await Promise.all([
          listNotifications(token),
          getNotificationSummary(token),
        ]);
        if (!mounted) return;
        setItems(notifications);
        setUnreadCount(summary.unreadCount);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "通知加载失败");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();
    return () => {
      mounted = false;
    };
  }, [accessToken, isAuthenticated, isLoading]);

  const grouped = useMemo(() => {
    return {
      unread: items.filter((item) => !item.isRead),
      read: items.filter((item) => item.isRead),
    };
  }, [items]);

  async function handleMarkRead(item: NotificationItem) {
    if (!accessToken || item.isRead) return;
    const updated = await markNotificationRead(item.id, accessToken);
    setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  async function handleMarkAllRead() {
    if (!accessToken || unreadCount === 0) return;
    await markAllNotificationsRead(accessToken);
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      <Card className="border-white/10 bg-slate-950/90 text-white shadow-[0_35px_120px_rgba(8,15,32,0.52)]">
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-cyan-100">Notification Center</Badge>
            <CardTitle className="mt-3 text-3xl font-semibold tracking-tight">站内通知中心</CardTitle>
            <CardDescription className="mt-2 text-white/55">集中查看订单、发货、售后、评价与消息提醒，并快速跳转到对应业务页面。</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
              未读通知 <span className="ml-2 text-lg font-semibold text-white">{unreadCount}</span>
            </div>
            <Button variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]" onClick={() => void handleMarkAllRead()}>
              <CheckCheck className="size-4" />全部标记已读
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/10 bg-slate-950/88 text-white">
          <CardHeader>
            <CardTitle className="text-xl">未读通知</CardTitle>
            <CardDescription className="text-white/55">优先处理这些通知，可以显著改善交易体验。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">正在加载通知...</div> : null}
            {!loading && grouped.unread.length === 0 ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">暂无未读通知，当前处理节奏很健康。</div> : null}
            {grouped.unread.map((item) => {
              const meta = notificationMeta(item.type);
              const Icon = meta.icon;
              return (
                <div key={item.id} className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={cn("rounded-full border px-3 py-1 text-xs", meta.tone)}>
                          <Icon className="mr-1 size-3.5" />{meta.label}
                        </Badge>
                        <span className="text-xs text-white/40">{formatDateTime(item.createdAt)}</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/65">{item.content}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.link ? (
                        <Button render={<Link href={item.link} />} size="sm" className="rounded-full">去处理</Button>
                      ) : null}
                      <Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]" onClick={() => void handleMarkRead(item)}>
                        标记已读
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/88 text-white">
          <CardHeader>
            <CardTitle className="text-xl">通知归档</CardTitle>
            <CardDescription className="text-white/55">已读通知会沉淀在这里，方便回看履约节点。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!loading && grouped.read.length === 0 ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">暂无已读通知。</div> : null}
            {grouped.read.map((item) => {
              const meta = notificationMeta(item.type);
              const Icon = meta.icon;
              return (
                <div key={item.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 opacity-80">
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-2xl border p-2", meta.tone)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 truncate text-xs text-white/45">{item.content}</p>
                    </div>
                    <span className="text-xs text-white/35">{formatDateTime(item.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}

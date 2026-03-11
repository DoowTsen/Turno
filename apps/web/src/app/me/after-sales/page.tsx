"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listMyAfterSales } from "@turno/api-sdk";
import { formatPrice } from "@turno/business";
import { ROUTES } from "@turno/constants";
import type { AfterSale } from "@turno/types";
import { afterSaleStatusGuide, afterSaleStatusText, afterSaleStatusTone, afterSaleTypeText } from "@/components/after-sale/after-sale-meta";
import { AfterSaleTimeline } from "@/components/after-sale/after-sale-timeline";
import { SellerRespondAfterSaleDialog } from "@/components/after-sale/seller-respond-after-sale-dialog";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyAfterSalesPage() {
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<AfterSale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    const token = accessToken;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listMyAfterSales(token);
        if (mounted) {
          setItems(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "售后列表加载失败");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [accessToken, isAuthenticated, isLoading]);

  const openCount = useMemo(() => items.filter((item) => item.status === "open" || item.status === "processing").length, [items]);
  const sellerTodoCount = useMemo(() => items.filter((item) => item.viewerRole === "seller" && (item.status === "open" || item.status === "processing")).length, [items]);
  const completedCount = useMemo(() => items.filter((item) => ["refunded", "closed", "rejected"].includes(item.status)).length, [items]);

  function replaceItem(updated: AfterSale) {
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <PageShell className="pt-16">
        <Card className="border-white/10 bg-slate-950 text-white">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold">请先登录查看售后工单</CardTitle>
            <CardDescription className="text-white/55">登录后可以查看自己发起或参与处理的退款 / 换货申请。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href={ROUTES.login} />} className="rounded-full">前往登录</Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/10 bg-slate-950/92 text-white shadow-[0_40px_140px_rgba(8,15,32,0.55)]">
          <CardHeader>
            <Badge className="w-fit bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">After-sales Center</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight">统一查看退款、退货和换货进度。</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-white/60">这里会聚合买家发起的售后申请，以及你作为卖家需要配合处理的工单，现在已支持卖家前台响应、状态分段展示和时间线回溯。</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-slate-950/88 text-white">
          <CardHeader>
            <CardTitle className="text-lg">售后概况</CardTitle>
            <CardDescription className="text-white/55">优先处理待处理与处理中工单，能明显提升交易体验。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">总工单：<strong className="text-white">{items.length}</strong></div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">进行中：<strong className="text-white">{openCount}</strong></div>
            <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4">卖家待响应：<strong className="text-white">{sellerTodoCount}</strong></div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">已完结：<strong className="text-white">{completedCount}</strong></div>
          </CardContent>
        </Card>
      </section>

      {loading ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">正在加载售后工单...</div> : null}
      {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      {!loading && !error && items.length === 0 ? (
        <Card className="border-white/10 bg-slate-950/88 text-white">
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-semibold">目前还没有售后工单</p>
            <p className="max-w-xl text-sm text-white/55">当你在订单详情页发起售后后，这里会展示处理状态、申请原因、卖家回复和平台处理备注。</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5">
        {items.map((item) => {
          const guide = afterSaleStatusGuide(item);
          return (
            <Card key={item.id} className="border-white/10 bg-slate-950/88 text-white shadow-[0_25px_90px_rgba(8,15,32,0.35)]">
              <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-white/10 text-white ring-1 ring-white/10">#{item.id}</Badge>
                    <Badge className={`ring-1 ${afterSaleStatusTone(item.status)}`}>{afterSaleStatusText(item.status)}</Badge>
                    <Badge className="bg-white/5 text-white/70 ring-1 ring-white/10">{item.viewerRole === "buyer" ? "我是买家" : "我是卖家"}</Badge>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">{item.productTitle}</CardTitle>
                    <CardDescription className="mt-2 text-white/55">订单号 {item.orderNo} · {afterSaleTypeText(item.type)} · {formatPrice(item.requestedAmount, item.currency)}</CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button render={<Link href={`/me/orders/${item.orderId}`} />} variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
                    查看订单详情
                  </Button>
                  {accessToken && item.viewerRole === "seller" && (item.status === "open" || item.status === "processing") ? (
                    <SellerRespondAfterSaleDialog item={item} accessToken={accessToken} onUpdated={replaceItem} />
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={`ring-1 ${afterSaleStatusTone(item.status)}`}>{guide.title}</Badge>
                    <span className="text-sm text-white/55">{guide.description}</span>
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-sm text-white/45">申请原因</p>
                      <p className="mt-2 text-white/80">{item.reason}</p>
                      {item.detail ? <p className="mt-3 text-sm leading-6 text-white/55">{item.detail}</p> : null}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-sm text-white/45">参与角色</p>
                      <p className="mt-2 text-white/80">买家：{item.buyerNickname}</p>
                      <p className="mt-2 text-white/60">卖家：{item.sellerNickname}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="mb-4 text-sm text-white/45">处理时间线</p>
                    <AfterSaleTimeline item={item} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}

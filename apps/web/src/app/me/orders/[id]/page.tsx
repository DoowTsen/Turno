"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getOrderAfterSale, getOrderDetail, getOrderReviewStatus, getProductDetail } from "@turno/api-sdk";
import { formatPrice } from "@turno/business";
import { ROUTES } from "@turno/constants";
import type { AfterSale, Order, Product, Review } from "@turno/types";
import { useAuth } from "@/providers/auth-provider";
import { afterSaleStatusGuide, afterSaleStatusText, afterSaleStatusTone, afterSaleTypeText } from '@/components/after-sale/after-sale-meta';
import { AfterSaleTimeline } from '@/components/after-sale/after-sale-timeline';
import { CreateAfterSaleDialog } from '@/components/after-sale/create-after-sale-dialog';
import { PageShell } from "@/components/layout/page-shell";
import { ReviewOrderDialog } from "@/components/review/review-order-dialog";
import { ConfirmReceiptButton } from "@/components/order/confirm-receipt-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatOrderStatus(status: string) {
  switch (status) {
    case "paid":
      return "待发货";
    case "shipped":
      return "已发货";
    case "completed":
      return "已完成";
    case "cancelled":
      return "已取消";
    default:
      return status;
  }
}

function formatShipmentStatus(status: string) {
  switch (status) {
    case "pending":
      return "待揽收";
    case "shipped":
      return "运输中";
    case "delivered":
      return "已签收";
    case "cancelled":
      return "已取消";
    default:
      return status;
  }
}

function formatDateTime(value?: string) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function OrderDetailPage() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  void params;
  const { accessToken, isAuthenticated, isLoading, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [afterSale, setAfterSale] = useState<AfterSale | null>(null);
  const orderId = Number(typeof window !== "undefined" ? window.location.pathname.split("/").pop() : NaN);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated || !accessToken || Number.isNaN(orderId)) {
      setIsPageLoading(false);
      return;
    }

    let mounted = true;

    async function loadDetail(token: string) {
      setIsPageLoading(true);
      setError(null);
      try {
        const detail = await getOrderDetail(orderId, token);
        if (!mounted) {
          return;
        }
        setOrder(detail);
        try {
          const productDetail = await getProductDetail(detail.productId);
          if (mounted) {
            setProduct(productDetail);
          }
        } catch {
          if (mounted) {
            setProduct(null);
          }
        }
        try {
          const afterSaleDetail = await getOrderAfterSale(orderId, token);
          if (mounted) {
            setAfterSale(afterSaleDetail);
          }
        } catch {
          if (mounted) {
            setAfterSale(null);
          }
        }
        if (detail.status === "completed" && detail.buyerId === user?.id) {
          try {
            const status = await getOrderReviewStatus(orderId, token);
            if (mounted) {
              setHasReviewed(status.reviewed);
            }
          } catch {
            if (mounted) {
              setHasReviewed(false);
            }
          }
        } else if (mounted) {
          setHasReviewed(false);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "订单详情加载失败");
        }
      } finally {
        if (mounted) {
          setIsPageLoading(false);
        }
      }
    }

    void loadDetail(accessToken);
    return () => {
      mounted = false;
    };
  }, [accessToken, isAuthenticated, isLoading, orderId, user?.id]);

  const total = useMemo(() => (order ? formatPrice(order.totalAmount, order.currency ?? "CNY") : "--"), [order]);

  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
        <CardHeader>
          <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">Order Detail</Badge>
          <CardTitle className="text-3xl font-bold text-white">订单详情</CardTitle>
          <CardDescription className="text-white/55">查看订单金额、商品信息、收货地址与物流状态。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPageLoading ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">正在加载订单详情...</div> : null}
          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
          {!isPageLoading && !order ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">未找到订单。</div> : null}
          {order ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-4">
                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-white/45">订单号</p>
                  <p className="mt-2 text-xl font-semibold text-white">{order.orderNo}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <Badge className="bg-primary text-slate-950">{formatOrderStatus(order.status)}</Badge>
                    <span className="text-sm text-white/45">创建时间：{formatDateTime(order.createdAt)}</span>
                  </div>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-white/45">商品信息</p>
                  <div className="mt-3 flex items-center gap-4">
                    {product?.images?.[0]?.url ? <img src={product.images[0].url} alt={product.title} className="h-24 w-24 rounded-2xl object-cover" /> : null}
                    <div>
                      <p className="text-lg font-semibold text-white">{product?.title ?? `商品 #${order.productId}`}</p>
                      <p className="mt-1 text-sm text-white/50">商品 ID：{order.productId}</p>
                      <Button render={<Link href={`${ROUTES.products}/${order.productId}`} />} size="sm" variant="outline" className="mt-3 rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white">查看商品</Button>
                    </div>
                  </div>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-white/45">收货信息</p>
                  <p className="mt-2 text-white">{order.receiverName} · {order.receiverPhone}</p>
                  <p className="mt-2 text-sm text-white/60">{order.receiverRegion} {order.receiverAddress}</p>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-white/45">订单金额</p>
                  <p className="mt-2 text-3xl font-black text-white">{total}</p>
                  <p className="mt-2 text-sm text-white/50">包含商品金额与运费。</p>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-white/45">物流状态</p>
                  {order.shipment ? (
                    <div className="mt-3 space-y-2 text-white/75">
                      <p>承运公司：{order.shipment.carrier}</p>
                      <p>物流单号：{order.shipment.trackingNo}</p>
                      <p>物流状态：{formatShipmentStatus(order.shipment.status)}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-white/60">暂未发货，等待卖家处理。</p>
                  )}
                </div>
                {order.status === "shipped" && accessToken ? (
                  <div className="rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 p-5">
                    <p className="text-sm text-emerald-100/80">买家操作</p>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white">物流已发出，确认收货后订单将完成。</p>
                        <p className="mt-2 text-sm text-white/60">请确认包裹完好、商品与描述一致后再点击确认收货。</p>
                      </div>
                      <ConfirmReceiptButton order={order} accessToken={accessToken} onConfirmed={setOrder} />
                    </div>
                  </div>
                ) : null}
                {(order.status === "shipped" || order.status === "completed") && order.buyerId === user?.id ? (
                  <div className="rounded-[26px] border border-amber-300/20 bg-amber-400/10 p-5">
                    <p className="text-sm text-amber-100/80">售后保障</p>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white">
                          {afterSale ? `已提交${afterSaleTypeText(afterSale.type)}申请` : "如果商品与描述不符，可发起售后申请"}
                        </p>
                        <p className="mt-2 text-sm text-white/60">
                          {afterSale
                            ? `当前状态：${afterSaleStatusText(afterSale.status)}，申请金额 ${formatPrice(afterSale.requestedAmount, afterSale.currency)}`
                            : "你可以提交退款、部分退款、退货退款或换货申请，平台会结合聊天记录与订单信息进行处理。"}
                        </p>
                        {afterSale ? (
                          <div className="mt-4 space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <Badge className={`ring-1 ${afterSaleStatusTone(afterSale.status)}`}>{afterSaleStatusText(afterSale.status)}</Badge>
                                <span className="text-xs text-white/45">{afterSaleTypeText(afterSale.type)} · 提交于 {formatDateTime(afterSale.createdAt)}</span>
                              </div>
                              <p className="mt-3 text-base font-semibold text-white">{afterSaleStatusGuide(afterSale).title}</p>
                              <p className="mt-2 text-sm leading-6 text-white/65">{afterSaleStatusGuide(afterSale).description}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                              <AfterSaleTimeline item={afterSale} />
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {accessToken && !afterSale ? (
                          <CreateAfterSaleDialog order={order} accessToken={accessToken} onCreated={setAfterSale} />
                        ) : null}
                        <Button render={<Link href={ROUTES.afterSales} />} variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white">
                          查看我的售后
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
                {order.status === "completed" && order.buyerId === user?.id ? (
                  <div className="rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-5">
                    <p className="text-sm text-cyan-100/80">交易评价</p>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white">分享你的交易体验，帮助其他用户建立信任。</p>
                        <p className="mt-2 text-sm text-white/60">评价会展示在商品详情页中，形成真实买家口碑。</p>
                        {reviewMessage ? <p className="mt-3 text-sm text-emerald-200">{reviewMessage}</p> : null}
                      </div>
                      {accessToken && !hasReviewed ? (
                        <ReviewOrderDialog
                          orderId={order.id}
                          accessToken={accessToken}
                          onCreated={(review: Review) => {
                            setHasReviewed(true);
                            setReviewMessage(`评价已提交，评分 ${review.score} 分。`);
                          }}
                        />
                      ) : (
                        <Badge className="rounded-full border border-white/10 bg-white/10 text-white">已评价</Badge>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}



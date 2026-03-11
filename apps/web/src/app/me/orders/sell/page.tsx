"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, PackageCheck, ReceiptText, ShoppingBag, Truck } from "lucide-react";
import { getProductDetail, listSellOrders } from "@turno/api-sdk";
import { formatPrice, mockProducts } from "@turno/business";
import { ROUTES } from "@turno/constants";
import type { Order, Product } from "@turno/types";
import { useLanguage } from "@/providers/language-provider";
import { useAuth } from "@/providers/auth-provider";
import { PageShell } from "@/components/layout/page-shell";
import { ShipOrderDialog } from "@/components/order/ship-order-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

export default function SellOrdersPage() {
  const { translate } = useLanguage();
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsById, setProductsById] = useState<Record<number, Product>>(() => Object.fromEntries(mockProducts.map((item) => [item.id, item])) as Record<number, Product>);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const token = accessToken;
    if (!isAuthenticated || !token) {
      setIsPageLoading(false);
      return;
    }

    let mounted = true;

    async function loadOrders(currentToken: string) {
      setIsPageLoading(true);
      setError(null);

      try {
        const remoteOrders = await listSellOrders(currentToken);
        if (!mounted) {
          return;
        }

        setOrders(remoteOrders);
        const productIds = [...new Set(remoteOrders.map((item) => item.productId))];
        const productEntries = await Promise.all(
          productIds.map(async (productId) => {
            try {
              const product = await getProductDetail(productId);
              return [productId, product] as const;
            } catch {
              const fallback = mockProducts.find((item) => item.id === productId);
              return fallback ? ([productId, fallback] as const) : null;
            }
          }),
        );

        if (!mounted) {
          return;
        }

        setProductsById((previous) => ({
          ...previous,
          ...Object.fromEntries(productEntries.filter((item): item is readonly [number, Product] => Boolean(item))),
        }));
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "卖家订单加载失败，请稍后重试");
      } finally {
        if (mounted) {
          setIsPageLoading(false);
        }
      }
    }

    void loadOrders(token);

    return () => {
      mounted = false;
    };
  }, [accessToken, isAuthenticated, isLoading]);

  const totalAmount = useMemo(() => orders.reduce((sum, order) => sum + order.totalAmount, 0), [orders]);
  const pendingShipments = useMemo(() => orders.filter((order) => order.status === "paid").length, [orders]);

  function replaceOrder(updatedOrder: Order) {
    setOrders((previous) => previous.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)));
  }

  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      {!isAuthenticated && !isLoading ? (
        <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
          <CardContent className="flex flex-col items-start gap-4 p-8 text-white">
            <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">Seller Orders</Badge>
            <h1 className="text-3xl font-black">先登录，再处理卖家订单</h1>
            <p className="max-w-2xl text-white/60">当前页面已经接入真实卖家订单接口，登录后可以查看待发货订单并录入物流信息。</p>
            <Button render={<Link href={ROUTES.login} />} className="rounded-full">前往登录</Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ReceiptText, title: "卖家订单", value: `${orders.length} 笔`, desc: isAuthenticated ? "真实卖家订单数据" : "等待登录后读取" },
          { icon: Truck, title: "待发货", value: `${pendingShipments} 笔`, desc: "支持录入物流与状态流转" },
          { icon: PackageCheck, title: "成交金额", value: formatPrice(totalAmount), desc: orders.length > 0 ? "来自真实卖家订单统计" : "暂无成交记录" },
        ].map((item) => (
          <Card key={item.title} className="glass-panel rounded-[28px] border border-white/10 bg-white/[0.04]">
            <CardContent className="p-5">
              <item.icon className="mb-4 size-5 text-primary" />
              <p className="text-sm text-white/45">{item.title}</p>
              <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
              <p className="mt-1 text-sm text-white/55">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
        <CardHeader>
          <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">Seller Orders</Badge>
          <CardTitle className="text-3xl font-bold text-white">卖家订单台</CardTitle>
          <CardDescription className="text-white/55">这里已经接入真实卖家订单接口，并支持发货录入。后续可以继续补充批量发货、售后协商和退款处理，目前可从“我的售后”进入前台卖家处理页。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">`r`n          <div className="flex justify-end">`r`n            <Button render={<Link href={ROUTES.afterSales} />} variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white">查看我的售后</Button>`r`n          </div>
          {isPageLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">
              <LoaderCircle className="size-4 animate-spin" />
              正在加载卖家订单...
            </div>
          ) : null}

          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

          {!isPageLoading && orders.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-8 text-center text-white/60">
              <ShoppingBag className="mx-auto mb-4 size-6 text-primary" />
              当前还没有卖家订单，先发布商品并让其他账号下单试试。
            </div>
          ) : null}

          {orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/45">订单号</TableHead>
                  <TableHead className="text-white/45">商品</TableHead>
                  <TableHead className="text-white/45">买家收货信息</TableHead>
                  <TableHead className="text-white/45">金额</TableHead>
                  <TableHead className="text-white/45">物流</TableHead>
                  <TableHead className="text-white/45">状态</TableHead>
                  <TableHead className="text-white/45">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const product = productsById[order.productId];
                  return (
                    <TableRow key={order.id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="font-medium text-white"><Link href={`/me/orders/${order.id}`} className="text-primary hover:text-primary/80">{order.orderNo}</Link></TableCell>
                      <TableCell className="text-white/75">
                        <div className="space-y-1">
                          <p>{product?.title ?? `商品 #${order.productId}`}</p>
                          <p className="text-xs text-white/40">商品 ID: {order.productId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/60">
                        <div className="space-y-1">
                          <p>{order.receiverName} · {order.receiverPhone}</p>
                          <p className="text-xs text-white/40">{order.receiverRegion} {order.receiverAddress}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/75">{formatPrice(order.totalAmount, order.currency ?? "CNY")}</TableCell>
                      <TableCell className="text-white/60">
                        {order.shipment ? (
                          <div className="space-y-1">
                            <p>{order.shipment.carrier}</p>
                            <p className="text-xs text-white/40">{order.shipment.trackingNo}</p>
                          </div>
                        ) : (
                          <span className="text-white/35">尚未录入物流</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-primary text-slate-950">{formatOrderStatus(order.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        {accessToken && order.status === "paid" ? (
                          <ShipOrderDialog order={order} accessToken={accessToken} onShipped={replaceOrder} />
                        ) : (
                          <span className="text-xs text-white/35">{order.status === "shipped" ? "等待买家签收" : order.status === "completed" ? "交易已完成" : "无需操作"}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}



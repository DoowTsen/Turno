import { notFound } from "next/navigation";
import { getProductDetail } from "@turno/api-sdk";
import { MapPin, ShieldCheck, Truck } from "lucide-react";
import { formatPrice, mockProducts } from "@turno/business";
import { PageShell } from "@/components/layout/page-shell";
import { ContactSellerButton } from "@/components/chat/contact-seller-button";
import { PurchaseDialog } from "@/components/order/purchase-dialog";
import { FavoriteToggleButton } from "@/components/product/favorite-toggle-button";
import { ProductReviewSection } from "@/components/review/product-review-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);

  if (Number.isNaN(productId)) {
    notFound();
  }

  const fallbackProduct = mockProducts.find((item) => item.id === productId);
  const product = await getProductDetail(productId).catch(() => fallbackProduct ?? null);

  if (!product) {
    notFound();
  }

  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="glass-panel overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.04] p-0">
          <div className="relative">
            <img src={product.images[0]?.url} alt={product.title} className="aspect-[5/4] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/5 to-transparent" />
            <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3">
              <Badge className="rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md">
                平台担保
              </Badge>
              <Badge variant="secondary" className="rounded-full bg-white text-slate-950">
                {product.status === "sold" ? "已售出" : "在售中"}
              </Badge>
            </div>
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Premium Listing</p>
                <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {product.title}
                </h1>
              </div>
              <div className="rounded-full bg-black/35 px-4 py-2 text-sm text-white/75">
                {product.city ?? "线上发货"}
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-primary/80">Asking Price</p>
                <CardTitle className="mt-2 text-4xl font-black tracking-tight text-white">
                  {formatPrice(product.price, product.currency)}
                </CardTitle>
              </div>
              <FavoriteToggleButton
                productId={product.id}
                showLabel
                size="default"
                variant="outline"
                className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
              />
            </div>
            <CardDescription className="text-base leading-8 text-white/60">{product.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBlock
                label="商品成色"
                value={
                  product.conditionLevel === "excellent"
                    ? "成色极佳"
                    : product.conditionLevel === "fair"
                      ? "正常使用"
                      : "成色良好"
                }
              />
              <InfoBlock
                label="运费信息"
                value={product.shippingFee > 0 ? formatPrice(product.shippingFee, product.currency) : "包邮"}
              />
              <InfoBlock label="所在城市" value={product.city ?? "线上"} />
              <InfoBlock label="关注热度" value={`${product.favoriteCount} 人收藏`} />
            </div>

            <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback className="bg-primary/20 text-primary">L</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">Lin Yue</p>
                  <p className="text-sm text-white/50">实名认证卖家 · 响应速度快</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-white/65">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" /> 平台担保交易，支持订单履约记录
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-accent" /> 本地面交或快递发货均可
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" /> 支持同城看货与到手验机
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ContactSellerButton productId={product.id} />
              <PurchaseDialog product={product} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="glass-panel rounded-[30px] border border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-white">商品详情</CardTitle>
            <CardDescription className="text-white/55">当前主体信息已经直接来自后端商品详情接口。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/70">
            <p>{product.description}</p>
            <p>支持平台担保支付、订单履约追踪与二手交易售后沟通。页面下一阶段会补充真实卖家资料、物流轨迹和评价接口。</p>
          </CardContent>
        </Card>
        <Card className="glass-panel rounded-[30px] border border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-white">交易建议</CardTitle>
            <CardDescription className="text-white/55">首期帮助用户快速建立信任感。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-white/70">
            {[
              "尽量使用平台下单，保留完整履约记录。",
              "贵重数码建议同城验货或录制开箱视频。",
              "若卖家承诺附件齐全，请在下单前确认清单。",
            ].map((tip) => (
              <div key={tip} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                {tip}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <ProductReviewSection productId={product.id} />
    </PageShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-white/35">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

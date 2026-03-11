"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChartNoAxesCombined, Globe2, LoaderCircle, ShieldCheck, Sparkles, Star, TrendingUp } from "lucide-react";
import { getSiteHomeConfig, listFavorites, listProducts } from "@turno/api-sdk";
import { formatPrice, mockProducts } from "@turno/business";
import { ROUTES } from "@turno/constants";
import type { AdminHomeConfig, Product } from "@turno/types";
import { ProductCard } from "@/components/product/product-card";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const highlights = [
  { label: "担保交易", value: "Escrow Ready", icon: ShieldCheck },
  { label: "国际化", value: "CN / EN", icon: Globe2 },
  { label: "多端扩展", value: "Web · App · Miniapp", icon: TrendingUp },
];

const fallbackHomeConfig: AdminHomeConfig = {
  heroBadge: "Curated by Turno Ops",
  heroTitle: "让好东西流转，让二手交易更安心。",
  heroDescription: "用更清晰的担保交易、精选推荐和履约体验，把二手商品做成真正值得逛的数字货架。",
  primaryCtaText: "逛逛商品广场",
  primaryCtaLink: ROUTES.products,
  secondaryCtaText: "立即发布闲置",
  secondaryCtaLink: ROUTES.publish,
  featuredProductIds: [3008, 3003, 3004, 3005],
  featuredCategorySlugs: ["phones-digital", "computers-office", "gaming-toys"],
  banners: [
    { id: "ops-1", title: "春季转卖激励计划", subtitle: "精选数码与办公设备正在加速流转，优先推荐高成色商品。", link: ROUTES.products, tone: "cyan" },
    { id: "ops-2", title: "优先履约卖家榜", subtitle: "发货快、评价高、售后少的卖家会得到首页更多曝光。", link: ROUTES.sellOrders, tone: "violet" },
    { id: "ops-3", title: "平台担保升级", subtitle: "发货、售后、通知中心已联通，买卖双方都能看到更完整的处理进度。", link: ROUTES.notifications, tone: "emerald" },
  ],
};

function homeBannerTone(tone: string) {
  switch (tone) {
    case "violet": return "border-violet-300/20 bg-violet-400/10 text-violet-100";
    case "emerald": return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
    case "amber": return "border-amber-300/20 bg-amber-400/10 text-amber-100";
    default: return "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";
  }
}

export default function HomePage() {
  const { translate, language } = useLanguage();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(mockProducts.slice(0, 4));
  const [homeConfig, setHomeConfig] = useState<AdminHomeConfig>(fallbackHomeConfig);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFeatured() {
      setIsLoading(true);
      setError(null);

      try {
        const [siteConfig, result] = await Promise.all([
          getSiteHomeConfig().catch(() => fallbackHomeConfig),
          listProducts({ page: 1, pageSize: 12 }, language),
        ]);
        if (!mounted) {
          return;
        }
        setHomeConfig(siteConfig);
        const sourceItems = result.items.length > 0 ? result.items : mockProducts;
        const featuredOrder = siteConfig.featuredProductIds ?? [];
        const featured = featuredOrder.length > 0
          ? featuredOrder
              .map((id) => sourceItems.find((item) => item.id === id))
              .filter((item): item is Product => Boolean(item))
          : sourceItems.slice(0, 4);
        setFeaturedProducts((featured.length > 0 ? featured : sourceItems.slice(0, 4)).slice(0, 4));
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "首页商品加载失败");
        setHomeConfig(fallbackHomeConfig);
        setFeaturedProducts(mockProducts.slice(0, 4));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFeatured();

    return () => {
      mounted = false;
    };
  }, [language]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !accessToken) {
      setFavoriteIds([]);
      return;
    }

    let mounted = true;

    async function loadFavorites(token: string) {
      try {
        const items = await listFavorites(token);
        if (mounted) {
          setFavoriteIds(items.map((item) => item.id));
        }
      } catch {
        if (mounted) {
          setFavoriteIds([]);
        }
      }
    }

    void loadFavorites(accessToken);

    return () => {
      mounted = false;
    };
  }, [accessToken, authLoading, isAuthenticated]);

  const snapshot = useMemo(() => {
    const totalFavorites = featuredProducts.reduce((sum, product) => sum + product.favoriteCount, 0);
    const cities = new Set(featuredProducts.map((product) => product.city).filter(Boolean));

    return {
      featuredCount: featuredProducts.length,
      totalFavorites,
      cityCount: cities.size,
      recommendation: featuredProducts[0] ?? null,
    };
  }, [featuredProducts]);

  function handleFavoriteToggle(productId: number, active: boolean) {
    setFavoriteIds((current) => {
      if (active) {
        return current.includes(productId) ? current : [...current, productId];
      }
      return current.filter((id) => id !== productId);
    });

    setFeaturedProducts((current) =>
      current.map((product) =>
        product.id === productId
          ? {
              ...product,
              favoriteCount: Math.max(0, product.favoriteCount + (active ? 1 : -1)),
            }
          : product,
      ),
    );
  }

  return (
    <PageShell className="space-y-10 pb-14 pt-8 lg:space-y-14">
      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-black/25 px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:px-8 lg:px-10 lg:py-12">
        <div className="absolute inset-0 soft-grid opacity-35" />
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="rounded-full border border-primary/20 bg-primary/12 px-3 py-1 text-primary">
              <Sparkles className="mr-1 size-3.5" />
              {homeConfig.heroBadge || "Recommerce, elevated"}
            </Badge>
            <div className="space-y-4">
              <h1 className="heading-display max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                {homeConfig.heroTitle || translate("heroTitle")}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/65 sm:text-lg">{homeConfig.heroDescription || translate("heroDesc")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={homeConfig.primaryCtaLink || ROUTES.products} className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6 shadow-[0_0_48px_rgba(66,255,215,0.28)]")}>
                {homeConfig.primaryCtaText || translate("browseProducts")}
                <ArrowRight className="size-4" />
              </Link>
              <Link href={homeConfig.secondaryCtaLink || ROUTES.publish} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full border-white/15 bg-white/[0.03] px-6 text-white hover:bg-white/[0.08] hover:text-white")}>
                {homeConfig.secondaryCtaText || translate("publishNow")}
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {highlights.map((item) => (
                <div key={item.label} className="glass-panel flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
                  <item.icon className="size-4 text-primary" />
                  <span>{item.label}</span>
                  <span className="text-white/35">•</span>
                  <strong className="font-semibold text-white">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <Card className="glass-panel rounded-[30px] border border-white/10 bg-white/[0.04] p-0">
            <CardHeader className="space-y-3 border-b border-white/10 px-6 py-6">
              <Badge variant="outline" className="w-fit rounded-full border-primary/30 bg-primary/10 text-primary">
                Live marketplace pulse
              </Badge>
              <CardTitle className="text-2xl font-semibold text-white">Turno Commerce Snapshot</CardTitle>
              <CardDescription className="text-white/55">首页精选商品已经接入真实商品接口，并同步登录态下的收藏状态。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { value: `${snapshot.featuredCount}`, label: "精选商品" },
                  { value: `${snapshot.totalFavorites}`, label: "总关注量" },
                  { value: `${snapshot.cityCount}`, label: "覆盖城市" },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-2xl font-black text-white">{metric.value}</p>
                    <p className="mt-1 text-sm text-white/50">{metric.label}</p>
                  </div>
                ))}
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="text-sm text-white/45">热门品类</p>
                    <p className="text-base font-semibold text-white">数码 · 游戏 · 办公设备</p>
                  </div>
                  <ChartNoAxesCombined className="size-5 text-primary" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/16 via-white/[0.03] to-transparent p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-white/55">今日推荐成交品</p>
                      <p className="mt-2 text-lg font-semibold text-white">{snapshot.recommendation?.title ?? "等待同步"}</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-950">
                      {snapshot.recommendation ? formatPrice(snapshot.recommendation.price, snapshot.recommendation.currency) : "--"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/55">
                  <Star className="size-4 fill-accent text-accent" />
                  首页已完成真实数据驱动，可直接承接后续推荐算法和营销运营位。
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {(homeConfig.banners?.length ? homeConfig.banners : fallbackHomeConfig.banners).map((item) => (
          <Card key={item.title} className="glass-panel rounded-[28px] border border-white/10 bg-white/[0.04]">
            <CardHeader className={cn("rounded-[28px] border", homeBannerTone(item.tone))}>
              <CardTitle className="text-white">{item.title}</CardTitle>
              <CardDescription className="text-white/70">{item.subtitle}</CardDescription>
              <Link href={item.link} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-fit rounded-full border-white/10 bg-black/20 text-white hover:bg-white/10")}>
                查看推荐位
                <ArrowRight className="size-4" />
              </Link>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-primary/80">Featured</p>
            <h2 className="heading-display mt-2 text-3xl font-bold text-white">{translate("productSquare")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55">首页精选商品现在直接来自真实商品接口，已同步本地图片、价格、关注数和收藏交互。</p>
          </div>
          <Link href={ROUTES.products} className={cn(buttonVariants({ variant: "outline" }), "rounded-full border-white/15 bg-white/[0.03] px-5 text-white hover:bg-white/[0.08] hover:text-white")}>
            查看全部
          </Link>
        </div>

        {error ? <div className="rounded-[26px] border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">首页商品接口暂不可用，已回退本地样例数据：{error}</div> : null}

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="glass-panel flex h-[420px] items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] text-white/55">
                <LoaderCircle className="size-5 animate-spin" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index === 0}
                favoriteActive={favoriteIds.includes(product.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { getCategoryTree, listFavorites, listProducts } from "@turno/api-sdk";
import { mockProducts } from "@turno/business";
import type { CategoryNode, Product } from "@turno/types";
import { ProductCard } from "@/components/product/product-card";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductsPage() {
  const { translate, language } = useLanguage();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [categoryTree, productPage] = await Promise.all([
          getCategoryTree(language),
          listProducts(
            {
              keyword,
              categoryId: activeCategory === "all" ? undefined : Number(activeCategory),
              page: 1,
              pageSize: 12,
            },
            language,
          ),
        ]);

        if (!mounted) {
          return;
        }

        setCategories(categoryTree);
        setProducts(productPage.items);
      } catch (fetchError) {
        if (!mounted) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "加载商品失败");
        setProducts(mockProducts);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [activeCategory, keyword, language]);

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

  const tabs = useMemo(
    () => [{ id: "all", name: "全部" }, ...categories.map((category) => ({ id: String(category.id), name: category.name }))],
    [categories],
  );

  function handleFavoriteToggle(productId: number, active: boolean) {
    setFavoriteIds((current) => {
      if (active) {
        return current.includes(productId) ? current : [...current, productId];
      }
      return current.filter((id) => id !== productId);
    });

    setProducts((current) =>
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
    <PageShell className="space-y-8 pb-14 pt-8">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="space-y-4">
          <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
            <Sparkles className="mr-1 size-3.5" />
            Curated marketplace
          </Badge>
          <div>
            <h1 className="heading-display text-4xl font-black text-white sm:text-5xl">{translate("productSquare")}</h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-white/60">
              使用真实商品接口驱动列表，当前已经支持按分类和关键词拉取数据，并可直接在卡片上完成收藏与取消收藏。
            </p>
          </div>
        </div>
        <Card className="glass-panel rounded-[28px] border border-white/10 bg-white/[0.04]">
          <CardContent className="grid gap-3 p-5 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              <Input
                placeholder="搜索你想要的好物、品牌或型号"
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setKeyword(keywordInput.trim());
                  }
                }}
                className="h-12 rounded-full border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/30"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setKeyword(keywordInput.trim())}
              className="h-12 rounded-full border-white/10 bg-white/[0.03] px-5 text-white hover:bg-white/[0.08] hover:text-white"
            >
              <SlidersHorizontal className="size-4" />
              搜索
            </Button>
          </CardContent>
        </Card>
      </section>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
        <TabsList variant="line" className="flex w-full flex-wrap gap-2 rounded-[24px] border border-white/10 bg-black/20 p-2">
          {tabs.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="rounded-full px-4 py-2 text-sm data-active:bg-white data-active:text-slate-950"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
            <Card className="glass-panel rounded-[28px] border border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-white">市场观察</CardTitle>
                <CardDescription className="text-white/55">当前数据来自真实商品接口，若后端不可用会自动回退到本地样例数据。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-white/45">当前结果</p>
                  <p className="mt-1 font-medium text-white">{loading ? "正在同步商品..." : `${products.length} 件商品`}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-white/45">筛选条件</p>
                  <p className="mt-1 font-medium text-white">{keyword ? `关键词：${keyword}` : "未设置关键词"}</p>
                </div>
                {error ? (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-100">
                    接口暂不可用，已切回本地样例数据：{error}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="glass-panel h-[420px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    favoriteActive={favoriteIds.includes(product.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            ) : (
              <Card className="glass-panel rounded-[28px] border border-white/10 bg-white/[0.04]">
                <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <p className="text-lg font-semibold text-white">当前没有匹配的商品</p>
                  <p className="max-w-md text-sm leading-7 text-white/55">你可以尝试切换分类或清空关键词；后续这里会加推荐词和热搜联想。</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

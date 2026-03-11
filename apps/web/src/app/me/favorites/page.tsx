"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HeartHandshake, LoaderCircle, Sparkles, Trash2 } from "lucide-react";
import { listFavorites, removeFavorite } from '@turno/api-sdk';
import { formatPrice } from '@turno/business';
import { ROUTES } from "@turno/constants";
import type { Product } from "@turno/types";
import { ProductCard } from "@/components/product/product-card";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FavoritesPage() {
  const { translate } = useLanguage();
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !accessToken) {
      setItems([]);
      setIsPageLoading(false);
      return;
    }

    let mounted = true;

    async function loadFavorites(token: string) {
      setIsPageLoading(true);
      setError(null);
      try {
        const data = await listFavorites(token);
        if (mounted) {
          setItems(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "收藏加载失败");
        }
      } finally {
        if (mounted) {
          setIsPageLoading(false);
        }
      }
    }

    void loadFavorites(accessToken);

    return () => {
      mounted = false;
    };
  }, [accessToken, isAuthenticated, isLoading]);

  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);

  async function handleRemove(productId: number) {
    if (!accessToken) {
      return;
    }

    setRemovingId(productId);
    setError(null);
    try {
      await removeFavorite(productId, accessToken);
      setItems((current) => current.filter((item) => item.id !== productId));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "取消收藏失败");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                <Sparkles className="mr-1 size-3.5" />
                Wish list
              </Badge>
              <CardTitle className="mt-4 text-3xl font-bold text-white">{translate("favoritesTitle")}</CardTitle>
              <CardDescription className="mt-2 text-white/55">当前已接入真实收藏接口，可直接查看 MySQL 中的收藏商品并执行取消收藏。</CardDescription>
            </div>
            <div className="grid gap-3 sm:min-w-64">
              <div className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-right">
                <div className="inline-flex items-center gap-2 text-sm text-white/50">
                  <HeartHandshake className="size-4 text-primary" />
                  已收藏商品
                </div>
                <p className="mt-2 text-3xl font-black text-white">{items.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-right">
                <div className="text-sm text-white/50">关注商品总价</div>
                <p className="mt-2 text-2xl font-black text-white">{formatPrice(totalPrice, "CNY")}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {!isAuthenticated && !isLoading ? (
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-6 text-white/65">
              请先登录后查看收藏夹。
              <Button render={<Link href={ROUTES.login} />} className="ml-4 rounded-full">立即登录</Button>
            </div>
          ) : null}
          {isPageLoading ? (
            <div className="flex items-center gap-3 rounded-[26px] border border-white/10 bg-black/20 p-6 text-white/65">
              <LoaderCircle className="size-4 animate-spin" />
              正在加载真实收藏数据...
            </div>
          ) : null}
          {error ? <div className="rounded-[26px] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
          {!isPageLoading && isAuthenticated && items.length === 0 ? (
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-6 text-white/65">
              你还没有收藏商品，去好物广场挑几件喜欢的吧。
              <Button render={<Link href={ROUTES.products} />} variant="outline" className="ml-4 rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white">去逛逛</Button>
            </div>
          ) : null}
          {items.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((product) => (
                <div key={product.id} className="space-y-3">
                  <ProductCard product={product} />
                  <div className="flex items-center justify-between rounded-[22px] border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-sm text-white/55">已加入你的关注清单，可随时回看价格变化。</p>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={removingId === product.id}
                      onClick={() => void handleRemove(product.id)}
                      className="rounded-full"
                    >
                      {removingId === product.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      取消收藏
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}



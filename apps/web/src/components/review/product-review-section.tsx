"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, MessageSquareText, Star } from "lucide-react";
import { listProductReviews } from "@turno/api-sdk";
import type { Review } from "@turno/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatDateTime(value?: string) {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function ProductReviewSection({ productId }: { productId: number }) {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadReviews() {
      setLoading(true);
      setError(null);
      try {
        const data = await listProductReviews(productId);
        if (mounted) {
          setItems(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "评价加载失败");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadReviews();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const summary = useMemo(() => {
    if (items.length === 0) {
      return { average: 0, total: 0 };
    }
    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    return { average: totalScore / items.length, total: items.length };
  }, [items]);

  return (
    <Card className="glass-panel rounded-[30px] border border-white/10 bg-white/[0.04]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquareText className="size-5 text-primary" />
              买家评价
            </CardTitle>
            <CardDescription className="mt-2 text-white/55">展示已完成订单的真实买家评价，帮助后续用户建立交易信任。</CardDescription>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
            <p className="text-sm text-white/45">综合评分</p>
            <p className="mt-1 text-2xl font-black text-white">{summary.total > 0 ? summary.average.toFixed(1) : "--"}</p>
            <p className="text-xs text-white/40">{summary.total} 条评价</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-white/60">
            <LoaderCircle className="size-4 animate-spin" />
            正在加载买家评价...
          </div>
        ) : null}
        {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
        {!loading && !error && items.length === 0 ? <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/60">当前商品还没有评价，欢迎首位买家完成交易后分享体验。</div> : null}
        {items.map((review) => (
          <div key={review.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{review.reviewerNickname || `用户 #${review.reviewerId}`}</p>
                <p className="mt-1 text-sm text-white/45">{formatDateTime(review.createdAt)} · {review.role === "buyer" ? "买家评价" : "卖家评价"}</p>
              </div>
              <div className="flex items-center gap-1 text-amber-300">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className={index < review.score ? "size-4 fill-current" : "size-4 text-white/20"} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/70">{review.content || "该用户给出了评分，但没有填写文字评价。"}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

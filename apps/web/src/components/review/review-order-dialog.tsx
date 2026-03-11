"use client";

import { useState } from "react";
import { LoaderCircle, Star } from "lucide-react";
import { createOrderReview } from "@turno/api-sdk";
import type { Review } from "@turno/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ReviewOrderDialog({
  orderId,
  accessToken,
  onCreated,
}: {
  orderId: number;
  accessToken: string;
  onCreated: (review: Review) => void;
}) {
  const [score, setScore] = useState("5");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const review = await createOrderReview(orderId, { score: Number(score), content }, accessToken);
      onCreated(review);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交评价失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button className="rounded-full" />}>提交评价</DialogTrigger>
      <DialogContent className="max-w-xl rounded-[28px] border border-white/10 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">评价本次交易</DialogTitle>
          <DialogDescription className="text-white/55">你的评价会展示在商品详情页，帮助后续用户判断交易可信度。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm text-white/70">
            <span>评分</span>
            <select value={score} onChange={(event) => setScore(event.target.value)} className="h-11 rounded-[18px] border border-white/10 bg-black/20 px-3 text-white outline-none">
              <option value="5">5 分 · 非常满意</option>
              <option value="4">4 分 · 满意</option>
              <option value="3">3 分 · 一般</option>
              <option value="2">2 分 · 不太满意</option>
              <option value="1">1 分 · 很差</option>
            </select>
          </label>
          <div className="flex items-center gap-1 text-amber-300">
            {Array.from({ length: Number(score) }).map((_, index) => (
              <Star key={index} className="size-4 fill-current" />
            ))}
          </div>
          <label className="grid gap-2 text-sm text-white/70">
            <span>评价内容</span>
            <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} placeholder="例如：商品和描述一致，卖家发货很快，包装也比较仔细。" className="rounded-[22px] border-white/10 bg-black/20 text-white placeholder:text-white/30" />
          </label>
          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
        </div>
        <DialogFooter className="bg-white/[0.03]">
          <Button onClick={() => void handleSubmit()} disabled={submitting} className="rounded-full">
            {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            确认提交
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

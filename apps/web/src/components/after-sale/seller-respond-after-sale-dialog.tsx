"use client";

import { useState } from "react";
import { sellerRespondAfterSale } from "@turno/api-sdk";
import type { AfterSale } from "@turno/types";
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

export function SellerRespondAfterSaleDialog({
  item,
  accessToken,
  onUpdated,
}: {
  item: AfterSale;
  accessToken: string;
  onUpdated: (item: AfterSale) => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(item.status === "open" ? "processing" : item.status);
  const [sellerResponseNote, setSellerResponseNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = await sellerRespondAfterSale(item.id, { status, sellerResponseNote }, accessToken);
      onUpdated(updated);
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "卖家响应失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" />}>卖家处理</DialogTrigger>
      <DialogContent className="max-w-xl rounded-[28px] border border-white/10 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">卖家处理售后工单</DialogTitle>
          <DialogDescription className="text-white/55">向买家说明处理方案，提交后会同步展示在售后时间线中。</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-white/70">
            更新状态
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-[18px] border border-white/10 bg-black/20 px-4 text-white outline-none">
              <option value="processing" className="bg-slate-950">处理中</option>
              <option value="approved" className="bg-slate-950">同意处理</option>
              <option value="closed" className="bg-slate-950">协商关闭</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-white/70">
            响应说明
            <Textarea value={sellerResponseNote} onChange={(event) => setSellerResponseNote(event.target.value)} rows={5} placeholder="例如：已核实商品情况，愿意补偿部分退款；或请买家补充开箱照片便于确认。" className="rounded-[22px] border-white/10 bg-black/20 text-white placeholder:text-white/30" />
          </label>
          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
          <DialogFooter className="bg-white/[0.03]">
            <Button type="submit" className="rounded-full" disabled={submitting}>{submitting ? "提交中..." : "提交响应"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

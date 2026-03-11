"use client";

import { useState } from "react";
import { createAfterSale } from "@turno/api-sdk";
import { formatPrice } from "@turno/business";
import type { AfterSale, Order } from "@turno/types";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const afterSaleTypes = [
  { value: "refund", label: "整单退款" },
  { value: "refund_partial", label: "部分退款" },
  { value: "return_refund", label: "退货退款" },
  { value: "exchange", label: "换货" },
];

export function CreateAfterSaleDialog({
  order,
  accessToken,
  onCreated,
}: {
  order: Order;
  accessToken: string;
  onCreated: (item: AfterSale) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("refund");
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [requestedAmount, setRequestedAmount] = useState(String(order.totalAmount));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const item = await createAfterSale(
        order.id,
        {
          type,
          reason,
          detail,
          requestedAmount: Number(requestedAmount || 0),
        },
        accessToken,
      );
      onCreated(item);
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "售后申请提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="rounded-full" />}>申请售后</DialogTrigger>
      <DialogContent className="max-w-xl rounded-[28px] border border-white/10 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">发起售后申请</DialogTitle>
          <DialogDescription className="text-white/55">
            当前订单金额为 {formatPrice(order.totalAmount, order.currency ?? "CNY")}，提交后可在“我的售后”中查看处理进度。
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-white/70">
            售后类型
            <select value={type} onChange={(event) => setType(event.target.value)} className="h-11 rounded-[18px] border border-white/10 bg-black/20 px-4 text-white outline-none">
              {afterSaleTypes.map((item) => (
                <option key={item.value} value={item.value} className="bg-slate-950">
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-white/70">
            售后原因
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="例如：商品与描述不符、配件缺失、运输损坏" className="rounded-[18px] border-white/10 bg-black/20 text-white placeholder:text-white/30" />
          </label>
          <label className="grid gap-2 text-sm text-white/70">
            申请金额（分）
            <Input type="number" value={requestedAmount} onChange={(event) => setRequestedAmount(event.target.value)} className="rounded-[18px] border-white/10 bg-black/20 text-white placeholder:text-white/30" />
          </label>
          <label className="grid gap-2 text-sm text-white/70">
            问题描述
            <Textarea value={detail} onChange={(event) => setDetail(event.target.value)} rows={5} placeholder="补充商品问题、收到时的情况、你的诉求等，越具体越有助于平台处理。" className="rounded-[22px] border-white/10 bg-black/20 text-white placeholder:text-white/30" />
          </label>
          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
          <DialogFooter className="bg-white/[0.03]">
            <Button type="submit" className="rounded-full" disabled={submitting}>
              {submitting ? "提交中..." : "确认发起"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, PackageCheck, Truck } from "lucide-react";
import { shipOrder } from "@turno/api-sdk";
import type { Order } from "@turno/types";
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

export function ShipOrderDialog({
  order,
  accessToken,
  onShipped,
}: {
  order: Order;
  accessToken: string;
  onShipped: (order: Order) => void;
}) {
  const router = useRouter();
  const [carrier, setCarrier] = useState("顺丰速运");
  const [trackingNo, setTrackingNo] = useState(`SF${Date.now()}`);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedOrder = await shipOrder(
        order.id,
        {
          carrier: carrier.trim(),
          trackingNo: trackingNo.trim(),
        },
        accessToken,
      );
      onShipped(updatedOrder);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "发货失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" className="rounded-full" />}> 
        <Truck className="size-4" /> 发货
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[28px] border border-white/10 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">录入物流并发货</DialogTitle>
          <DialogDescription className="text-white/55">
            订单 {order.orderNo} 当前处于待发货状态，提交后会更新订单状态并生成物流信息。
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label htmlFor={`ship-carrier-${order.id}`} className="text-sm text-white/60">物流公司</label>
            <Input id={`ship-carrier-${order.id}`} name="carrier" aria-label="物流公司" value={carrier} onChange={(event) => setCarrier(event.target.value)} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white" />
          </div>
          <div className="grid gap-2">
            <label htmlFor={`ship-tracking-${order.id}`} className="text-sm text-white/60">物流单号</label>
            <Input id={`ship-tracking-${order.id}`} name="trackingNo" aria-label="物流单号" value={trackingNo} onChange={(event) => setTrackingNo(event.target.value)} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white" />
          </div>
          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
          <DialogFooter className="bg-white/[0.03]">
            <Button type="button" variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white">稍后处理</Button>
            <Button type="submit" disabled={isSubmitting || !carrier.trim() || !trackingNo.trim()} className="rounded-full">
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
              确认发货
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

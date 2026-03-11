"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, LoaderCircle } from "lucide-react";
import { confirmReceipt } from "@turno/api-sdk";
import type { Order } from "@turno/types";
import { Button } from "@/components/ui/button";

export function ConfirmReceiptButton({
  order,
  accessToken,
  onConfirmed,
}: {
  order: Order;
  accessToken: string;
  onConfirmed: (order: Order) => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedOrder = await confirmReceipt(order.id, accessToken);
      onConfirmed(updatedOrder);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "确认收货失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="sm" onClick={handleConfirm} disabled={isSubmitting} className="rounded-full">
        {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
        确认收货
      </Button>
      {error ? <div className="text-xs text-rose-300">{error}</div> : null}
    </div>
  );
}

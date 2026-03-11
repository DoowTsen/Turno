"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle, MessageCircleMore } from "lucide-react";
import { startConversation } from "@turno/api-sdk";
import { ROUTES } from "@turno/constants";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";

export function ContactSellerButton({ productId }: { productId: number }) {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated || !accessToken) {
      router.push(ROUTES.login);
      return;
    }
    setSubmitting(true);
    try {
      const conversation = await startConversation(productId, accessToken);
      router.push(`${ROUTES.messages}?conversation=${conversation.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button variant="outline" onClick={() => void handleClick()} disabled={submitting} className="h-12 rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white">
      {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <MessageCircleMore className="size-4" />}
      联系卖家
    </Button>
  );
}

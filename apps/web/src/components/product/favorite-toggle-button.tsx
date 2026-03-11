"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, LoaderCircle } from "lucide-react";
import { addFavorite, listFavorites, removeFavorite } from "@turno/api-sdk";
import { ROUTES } from "@turno/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

type FavoriteToggleButtonProps = {
  productId: number;
  initialActive?: boolean;
  showLabel?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  className?: string;
  onToggled?: (active: boolean) => void;
};

export function FavoriteToggleButton({
  productId,
  initialActive,
  showLabel = false,
  size = "sm",
  variant = "outline",
  className,
  onToggled,
}: FavoriteToggleButtonProps) {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const [isActive, setIsActive] = useState(initialActive ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialActive !== undefined) {
      setIsActive(initialActive);
    }
  }, [initialActive]);

  useEffect(() => {
    if (initialActive !== undefined || isLoading || !isAuthenticated || !accessToken) {
      if (!isAuthenticated && initialActive === undefined) {
        setIsActive(false);
      }
      return;
    }

    let mounted = true;

    async function loadStatus(token: string) {
      try {
        const items = await listFavorites(token);
        if (mounted) {
          setIsActive(items.some((item) => item.id === productId));
        }
      } catch {
      }
    }

    void loadStatus(accessToken);

    return () => {
      mounted = false;
    };
  }, [accessToken, initialActive, isAuthenticated, isLoading, productId]);

  async function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !accessToken) {
      router.push(ROUTES.login);
      return;
    }

    const next = !isActive;
    setIsActive(next);
    setIsSubmitting(true);

    try {
      if (next) {
        await addFavorite(productId, accessToken);
      } else {
        await removeFavorite(productId, accessToken);
      }
      onToggled?.(next);
    } catch {
      setIsActive(!next);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={isSubmitting}
      onClick={handleToggle}
      aria-label={isActive ? "取消收藏" : "收藏商品"}
      className={cn(className, isActive ? "border-rose-400/30 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20 hover:text-white" : undefined)}
    >
      {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Heart className={cn("size-4", isActive ? "fill-current" : undefined)} />}
      {showLabel ? (isActive ? "已收藏" : "收藏") : null}
    </Button>
  );
}

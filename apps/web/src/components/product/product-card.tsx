import Link from "next/link";
import { MapPin, MoveRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { formatPrice } from "@turno/business";
import type { Product } from "@turno/types";
import { cn } from "@/lib/utils";
import { FavoriteToggleButton } from "@/components/product/favorite-toggle-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

function getConditionLabel(conditionLevel: string) {
  if (conditionLevel === "excellent") return "成色极佳";
  if (conditionLevel === "good") return "成色良好";
  return "正常使用";
}

function getStatusLabel(status: string) {
  if (status === "sold") return "已售出";
  return "在售中";
}

export function ProductCard({
  product,
  priority = false,
  favoriteActive,
  onFavoriteToggle,
}: {
  product: Product;
  priority?: boolean;
  favoriteActive?: boolean;
  onFavoriteToggle?: (productId: number, active: boolean) => void;
}) {
  return (
    <Card className="group glass-panel h-full rounded-[28px] border border-white/10 bg-white/[0.04] p-0 transition duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_24px_80px_rgba(27,255,214,0.18)]">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-[28px]">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/5 to-transparent" />
          <img
            src={product.images[0]?.url}
            alt={product.title}
            loading={priority ? "eager" : "lazy"}
            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-3">
            <Badge className="border border-white/10 bg-black/40 text-white backdrop-blur-md">{getConditionLabel(product.conditionLevel)}</Badge>
            <Badge variant={product.status === "sold" ? "secondary" : "default"} className={cn(product.status === "sold" ? "bg-white/75 text-slate-900" : "bg-primary text-slate-950")}>
              {getStatusLabel(product.status)}
            </Badge>
          </div>
          <div className="absolute inset-x-4 bottom-4 z-20 flex items-center justify-between text-xs text-white/70">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-3 py-1.5 backdrop-blur-md">
              <ShieldCheck className="size-3.5 text-primary" />
              平台担保
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-3 py-1.5 backdrop-blur-md">
              <Truck className="size-3.5 text-accent" />
              {product.shippingFee > 0 ? "支持邮寄" : "包邮"}
            </span>
          </div>
        </div>
      </Link>
      <CardContent className="space-y-5 p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/products/${product.id}`} className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-white transition group-hover:text-primary">
                {product.title}
              </h3>
            </Link>
            <FavoriteToggleButton
              productId={product.id}
              initialActive={favoriteActive}
              size="icon"
              variant="outline"
              className="relative z-10 rounded-full border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
              onToggled={(active) => onFavoriteToggle?.(product.id, active)}
            />
          </div>
          <Link href={`/products/${product.id}`} className="block">
            <p className="line-clamp-2 text-sm leading-6 text-white/55">{product.description}</p>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/55">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5 text-primary" />
            {product.city ?? "线上发货"}
          </span>
          <span className="text-white/20">•</span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-3.5 text-accent" />
            {product.favoriteCount} 人关注
          </span>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/35">Price</p>
            <strong className="text-2xl font-black tracking-tight text-white">{formatPrice(product.price, product.currency)}</strong>
          </div>
          <Link href={`/products/${product.id}`} className={cn(buttonVariants({ variant: "secondary" }), "rounded-full bg-white text-slate-950 shadow-lg transition hover:bg-primary hover:text-slate-950")}>
            查看详情
            <MoveRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}


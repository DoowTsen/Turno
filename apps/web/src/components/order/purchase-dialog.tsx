"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { createOrder, listUserAddresses } from "@turno/api-sdk";
import { ROUTES } from "@turno/constants";
import type { Product, UserAddress } from "@turno/types";
import { formatPrice } from "@turno/business";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
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

export function PurchaseDialog({ product }: { product: Product }) {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading, user } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [receiverName, setReceiverName] = useState(user?.nickname ?? "");
  const [receiverPhone, setReceiverPhone] = useState("13800138000");
  const [receiverRegion, setReceiverRegion] = useState("上海市 浦东新区");
  const [receiverAddress, setReceiverAddress] = useState("世纪大道 100 号 18 层");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    let mounted = true;
    async function loadAddresses(token: string) {
      try {
        const items = await listUserAddresses(token);
        if (!mounted) {
          return;
        }
        setAddresses(items);
        const defaultAddress = items.find((item) => item.isDefault) ?? items[0];
        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
          setReceiverName(defaultAddress.receiverName);
          setReceiverPhone(defaultAddress.receiverPhone);
          setReceiverRegion(`${defaultAddress.province} ${defaultAddress.city} ${defaultAddress.district}`);
          setReceiverAddress(defaultAddress.detailAddress);
        }
      } catch {
      }
    }
    void loadAddresses(accessToken);
    return () => {
      mounted = false;
    };
  }, [accessToken]);

  const isOwnProduct = Boolean(user?.id && product.sellerId && user.id === product.sellerId);
  const submitDisabled = useMemo(
    () =>
      isSubmitting ||
      !accessToken ||
      !receiverName.trim() ||
      !receiverPhone.trim() ||
      !receiverRegion.trim() ||
      !receiverAddress.trim() ||
      product.status !== "active" ||
      isOwnProduct,
    [accessToken, isOwnProduct, isSubmitting, product.status, receiverAddress, receiverName, receiverPhone, receiverRegion],
  );

  function applyAddress(addressId: string) {
    setSelectedAddressId(addressId);
    const address = addresses.find((item) => String(item.id) === addressId);
    if (!address) {
      return;
    }
    setReceiverName(address.receiverName);
    setReceiverPhone(address.receiverPhone);
    setReceiverRegion(`${address.province} ${address.city} ${address.district}`);
    setReceiverAddress(address.detailAddress);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) {
      setError("请先登录后再下单。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const order = await createOrder(
        {
          productId: product.id,
          receiverName: receiverName.trim(),
          receiverPhone: receiverPhone.trim(),
          receiverRegion: receiverRegion.trim(),
          receiverAddress: receiverAddress.trim(),
        },
        accessToken,
      );
      router.push(`${ROUTES.buyOrders}?created=${order.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "下单失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button className="h-12 rounded-full text-base shadow-[0_0_44px_rgba(66,255,215,0.28)]" />}>
        立即下单
        <ArrowRight className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[28px] border border-white/10 bg-slate-950 text-white">
        <DialogHeader>
          <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
            <ShieldCheck className="mr-1 size-3.5" /> 平台担保下单
          </Badge>
          <DialogTitle className="text-xl font-semibold">确认购买 {product.title}</DialogTitle>
          <DialogDescription className="text-white/55">
            这里已经接入真实下单接口，会写入订单并把商品状态改成已售出。
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated && !isLoading ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
            当前未登录，无法下单。
            <Link href={ROUTES.login} className="ml-2 text-primary hover:text-primary/80">
              立即登录
            </Link>
          </div>
        ) : null}

        {isOwnProduct ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
            你不能购买自己发布的商品，请换一个商品试试。
          </div>
        ) : null}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {addresses.length > 0 ? (
            <div className="grid gap-2">
              <label htmlFor="order-address-select" className="text-sm text-white/60">选择地址</label>
              <select id="order-address-select" value={selectedAddressId} onChange={(event) => applyAddress(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none">
                {addresses.map((address) => (
                  <option key={address.id} value={address.id} className="bg-slate-950 text-white">
                    {address.receiverName} · {address.city} · {address.detailAddress}
                  </option>
                ))}
              </select>
              <Link href={ROUTES.addresses} className="text-sm text-primary hover:text-primary/80">去地址簿管理更多地址</Link>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="order-receiver-name" className="text-sm text-white/60">收货人</label>
              <Input id="order-receiver-name" name="receiverName" aria-label="收货人" value={receiverName} onChange={(event) => setReceiverName(event.target.value)} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="order-receiver-phone" className="text-sm text-white/60">联系电话</label>
              <Input id="order-receiver-phone" name="receiverPhone" aria-label="联系电话" value={receiverPhone} onChange={(event) => setReceiverPhone(event.target.value)} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="order-receiver-region" className="text-sm text-white/60">省市区</label>
            <Input id="order-receiver-region" name="receiverRegion" aria-label="省市区" value={receiverRegion} onChange={(event) => setReceiverRegion(event.target.value)} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
          </div>

          <div className="grid gap-2">
            <label htmlFor="order-receiver-address" className="text-sm text-white/60">详细地址</label>
            <Textarea id="order-receiver-address" name="receiverAddress" aria-label="详细地址" value={receiverAddress} onChange={(event) => setReceiverAddress(event.target.value)} rows={3} className="rounded-[22px] border-white/10 bg-black/20 text-white placeholder:text-white/30" />
          </div>

          <div className="grid gap-3 text-sm text-white/70 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">商品金额：{formatPrice(product.price, product.currency)}</div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">运费：{product.shippingFee > 0 ? formatPrice(product.shippingFee, product.currency) : "包邮"}</div>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-primary">总计：{formatPrice(product.price + product.shippingFee, product.currency)}</div>
          </div>

          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

          <DialogFooter className="bg-white/[0.03]">
            <Button type="button" variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white">
              稍后再买
            </Button>
            <Button type="submit" disabled={submitDisabled} className="rounded-full">
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              确认并支付
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

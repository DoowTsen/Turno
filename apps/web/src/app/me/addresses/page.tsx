"use client";

import { useEffect, useMemo, useState } from "react";
import { Home, LoaderCircle, MapPinned, Plus, Star, Trash2 } from "lucide-react";
import {
  createUserAddress,
  deleteUserAddress,
  listUserAddresses,
  setDefaultUserAddress,
} from "@turno/api-sdk";
import { ROUTES } from "@turno/constants";
import type { AddressInput, UserAddress } from "@turno/types";
import { useAuth } from "@/providers/auth-provider";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const EMPTY_FORM: AddressInput = {
  receiverName: "",
  receiverPhone: "",
  province: "上海市",
  city: "上海市",
  district: "浦东新区",
  detailAddress: "",
  isDefault: false,
};

export default function AddressesPage() {
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated || !accessToken) {
      setIsPageLoading(false);
      return;
    }

    let mounted = true;

    async function loadAddresses(token: string) {
      setIsPageLoading(true);
      setError(null);
      try {
        const items = await listUserAddresses(token);
        if (!mounted) {
          return;
        }
        setAddresses(items);
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "地址加载失败，请稍后重试");
      } finally {
        if (mounted) {
          setIsPageLoading(false);
        }
      }
    }

    void loadAddresses(accessToken);
    return () => {
      mounted = false;
    };
  }, [accessToken, isAuthenticated, isLoading]);

  const defaultCount = useMemo(() => addresses.filter((item) => item.isDefault).length, [addresses]);

  async function handleCreateAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) {
      setError("请先登录后再管理地址。");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createUserAddress(form, accessToken);
      setAddresses((previous) => {
        const next = created.isDefault ? previous.map((item) => ({ ...item, isDefault: false })) : previous;
        return [created, ...next];
      });
      setForm(EMPTY_FORM);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "新增地址失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSetDefault(addressId: number) {
    if (!accessToken) {
      return;
    }
    try {
      const updated = await setDefaultUserAddress(addressId, accessToken);
      setAddresses((previous) => previous.map((item) => ({ ...item, isDefault: item.id === updated.id })));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "设置默认地址失败");
    }
  }

  async function handleDelete(addressId: number) {
    if (!accessToken) {
      return;
    }
    try {
      await deleteUserAddress(addressId, accessToken);
      setAddresses((previous) => previous.filter((item) => item.id !== addressId));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "删除地址失败");
    }
  }

  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
          <CardHeader>
            <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
              <MapPinned className="mr-1 size-3.5" /> Address Book
            </Badge>
            <CardTitle className="mt-4 text-3xl font-bold text-white">地址簿</CardTitle>
            <CardDescription className="mt-2 text-base leading-8 text-white/60">当前已经接入真实地址接口。你可以新增收货地址、设置默认地址，并为后续下单提供自动填充。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-white/70">
            {[
              { icon: Home, title: "多地址管理", desc: "支持一人多地址，默认地址优先用于下单弹窗。" },
              { icon: Star, title: "默认地址", desc: "可一键切换默认地址，减少重复录入。" },
              { icon: Plus, title: "后续扩展", desc: "下一步可以增加编辑地址、城市级联选择和地址校验。" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <item.icon className="mb-3 size-5 text-primary" />
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 leading-6 text-white/55">{item.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-white">新增地址</CardTitle>
            <CardDescription className="text-white/55">创建后会立即写入 MySQL，并在下单时可直接选择。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!isAuthenticated && !isLoading ? (
              <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
                当前未登录，无法管理地址。请先前往 <a href={ROUTES.login} className="text-primary underline">登录中心</a>。
              </div>
            ) : null}

            <form className="grid gap-4" onSubmit={handleCreateAddress}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input aria-label="收货人" placeholder="收货人" value={form.receiverName} onChange={(event) => setForm((prev) => ({ ...prev, receiverName: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
                <Input aria-label="联系电话" placeholder="联系电话" value={form.receiverPhone} onChange={(event) => setForm((prev) => ({ ...prev, receiverPhone: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input aria-label="省份" placeholder="省份" value={form.province} onChange={(event) => setForm((prev) => ({ ...prev, province: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
                <Input aria-label="城市" placeholder="城市" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
                <Input aria-label="区县" placeholder="区县" value={form.district} onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
              </div>
              <Input aria-label="详细地址" placeholder="详细地址" value={form.detailAddress} onChange={(event) => setForm((prev) => ({ ...prev, detailAddress: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))} />
                设为默认地址
              </label>
              {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
              <Button type="submit" disabled={isSubmitting || !accessToken} className="rounded-full">
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
                新增地址
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-white">我的地址</CardTitle>
          <CardDescription className="text-white/55">共 {addresses.length} 条地址，默认地址 {defaultCount} 条。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPageLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">
              <LoaderCircle className="size-4 animate-spin" /> 正在加载地址...
            </div>
          ) : null}

          {!isPageLoading && addresses.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-8 text-center text-white/60">还没有地址，先新增一个默认地址吧。</div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-[26px] border border-white/10 bg-black/20 p-5 text-white/75">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-white">{address.receiverName}</p>
                      {address.isDefault ? <Badge className="bg-primary text-slate-950">默认</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-white/50">{address.receiverPhone}</p>
                  </div>
                  <div className="flex gap-2">
                    {!address.isDefault ? (
                      <Button size="sm" variant="outline" onClick={() => handleSetDefault(address.id)} className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white">
                        设为默认
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => handleDelete(address.id)} className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/65">{address.province} {address.city} {address.district} {address.detailAddress}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

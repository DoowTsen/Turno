"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle, PackagePlus, Sparkles, UploadCloud } from "lucide-react";
import { createProduct, getCategoryTree } from "@turno/api-sdk";
import type { CategoryNode } from "@turno/types";
import { useLanguage } from "@/providers/language-provider";
import { useAuth } from "@/providers/auth-provider";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...(node.children ? flattenCategories(node.children) : [])]);
}

export default function PublishPage() {
  const router = useRouter();
  const { translate, language } = useLanguage();
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("159900");
  const [city, setCity] = useState("杭州");
  const [conditionLevel, setConditionLevel] = useState("good");
  const [shippingFee, setShippingFee] = useState("0");
  const [imagesText, setImagesText] = useState("http://127.0.0.1:8080/uploads/products/camera-fujifilm.jpg");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const tree = await getCategoryTree(language);
        if (!mounted) {
          return;
        }

        const allCategories = flattenCategories(tree);
        setCategories(allCategories);
        if (!categoryId && allCategories[0]) {
          setCategoryId(String(allCategories[0].id));
        }
      } catch {
        if (mounted) {
          setError("分类加载失败，请确认后端已启动。");
        }
      }
    }

    void loadCategories();

    return () => {
      mounted = false;
    };
  }, [categoryId, language]);

  const submitDisabled = useMemo(
    () =>
      isSubmitting ||
      !accessToken ||
      !categoryId ||
      !title.trim() ||
      !description.trim() ||
      Number(price) <= 0,
    [accessToken, categoryId, description, isSubmitting, price, title],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) {
      setError("请先登录后再发布商品。");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const created = await createProduct(
        {
          categoryId: Number(categoryId),
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          currency: "CNY",
          conditionLevel,
          city: city.trim(),
          shippingFee: Number(shippingFee) || 0,
          images: imagesText
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean),
        },
        accessToken,
      );

      setSuccessMessage(`商品发布成功：${created.title}`);
      router.push(`/products/${created.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "发布失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
          <CardHeader className="space-y-4">
            <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
              <Sparkles className="mr-1 size-3.5" />
              Seller Studio
            </Badge>
            <CardTitle className="heading-display text-4xl font-black text-white">{translate("publishTitle")}</CardTitle>
            <CardDescription className="max-w-xl text-base leading-8 text-white/60">当前页面已接入真实发布接口，会用登录态携带 `Bearer Token` 提交商品。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-white/70">
            {[
              { title: "真实接口提交", desc: "点击发布后会真正写入 MySQL，并跳转到新商品详情页。", icon: Camera },
              { title: "分类动态加载", desc: "发布分类来自后端分类树接口，不再写死在前端。", icon: PackagePlus },
              { title: "图片先用 URL", desc: "当前先提交图片 URL，下一步再升级为文件上传。", icon: UploadCloud },
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
            <CardTitle className="text-2xl font-semibold text-white">快速创建商品</CardTitle>
            <CardDescription className="text-white/55">
              {isLoading ? "正在同步登录状态..." : isAuthenticated ? "你已经登录，可以直接提交商品。" : "请先登录，再提交商品。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {!isAuthenticated && !isLoading ? (
              <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
                当前未登录，发布接口会被后端拒绝。请先前往登录页获取 access token。
              </div>
            ) : null}

            <form className="grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm text-white/60">商品分类</label>
                  <select id="publish-category" name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none">
                    <option value="">请选择分类</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id} className="bg-slate-950 text-white">
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-white/60">商品成色</label>
                  <select id="publish-condition" name="conditionLevel" value={conditionLevel} onChange={(event) => setConditionLevel(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none">
                    <option value="excellent" className="bg-slate-950 text-white">成色极佳</option>
                    <option value="good" className="bg-slate-950 text-white">成色良好</option>
                    <option value="fair" className="bg-slate-950 text-white">正常使用</option>
                  </select>
                </div>
              </div>

              <Input id="publish-title" name="title" aria-label="商品标题" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="商品标题，例如：Fujifilm X-T30 II 微单机身" className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
              <Textarea id="publish-description" name="description" aria-label="商品描述" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="详细描述商品成色、附件、购买时间和使用情况……" rows={7} className="rounded-[22px] border-white/10 bg-black/20 text-white placeholder:text-white/30" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input id="publish-price" name="price" aria-label="价格" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="价格（分）" className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
                <Input id="publish-shippingFee" name="shippingFee" aria-label="运费" value={shippingFee} onChange={(event) => setShippingFee(event.target.value)} placeholder="运费（分）" className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
                <Input id="publish-city" name="city" aria-label="城市" value={city} onChange={(event) => setCity(event.target.value)} placeholder="城市" className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/30" />
              </div>
              <Textarea id="publish-images" name="images" aria-label="图片地址" value={imagesText} onChange={(event) => setImagesText(event.target.value)} placeholder="每行一个图片 URL，当前先用后端静态图片地址" rows={4} className="rounded-[22px] border-white/10 bg-black/20 text-white placeholder:text-white/30" />

              {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
              {successMessage ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{successMessage}</div> : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={submitDisabled} className="h-12 rounded-full px-6 text-base shadow-[0_0_44px_rgba(66,255,215,0.28)]">
                  {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  发布商品
                </Button>
                <Button type="button" variant="outline" className="h-12 rounded-full border-white/10 bg-white/[0.03] px-6 text-white hover:bg-white/[0.08] hover:text-white">
                  保存草稿
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}


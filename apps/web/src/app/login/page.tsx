"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chrome, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { login } from "@turno/api-sdk";
import { ROUTES } from "@turno/constants";
import { useLanguage } from "@/providers/language-provider";
import { useAuth } from "@/providers/auth-provider";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { translate } = useLanguage();
  const { setSession, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("demo@turno.local");
  const [password, setPassword] = useState("123456");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDisabled = useMemo(() => isSubmitting || !email.trim() || !password.trim(), [email, isSubmitting, password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const session = await login({
        email: email.trim(),
        password,
      });
      setSession(session);
      router.push(ROUTES.publish);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "登录失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell className="grid min-h-[calc(100vh-10rem)] items-center pb-14 pt-8">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
          <CardHeader className="space-y-4">
            <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
              <ShieldCheck className="mr-1 size-3.5" />
              Trusted access
            </Badge>
            <CardTitle className="heading-display text-4xl font-black text-white">{translate("loginTitle")}</CardTitle>
            <CardDescription className="max-w-xl text-base leading-8 text-white/60">{translate("loginDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-white/70">
            {[
              "已接入真实登录接口，成功后会持久化 access token。",
              "登录后可直接进入发布商品页，后续扩展注册与 OAuth。",
              "默认填入测试账号，便于你快速联调当前环境。",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4">{item}</div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl font-semibold text-white">欢迎回来</CardTitle>
            <CardDescription className="text-white/55">
              {isAuthenticated ? "当前已经登录，你可以直接前往发布商品。" : "继续管理你的商品、订单和偏好设置。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                  <Input id="login-email" name="email" aria-label="登录邮箱" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" className="h-12 rounded-2xl border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/30" />
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                  <Input id="login-password" name="password" aria-label="登录密码" value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="输入你的密码" className="h-12 rounded-2xl border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/30" />
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="submit" disabled={submitDisabled} className="h-12 rounded-full text-base shadow-[0_0_44px_rgba(66,255,215,0.28)]">
                  {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Sign In
                </Button>
                <Button type="button" variant="outline" className="h-12 rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white">
                  <Chrome className="size-4" />
                  Google 登录
                </Button>
              </div>
            </form>
            <p className="text-sm text-white/45">
              还没有账号？
              <Link href={ROUTES.publish} className="ml-2 text-primary hover:text-primary/80">
                先去发布体验页看看
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}



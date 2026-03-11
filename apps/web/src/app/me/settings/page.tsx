"use client";

import { Bell, Globe2, Shield, Sparkles } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@turno/constants";
import { useLanguage } from "@/providers/language-provider";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { language, setLanguage, translate } = useLanguage();

  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
          <CardHeader>
            <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
              <Sparkles className="mr-1 size-3.5" />
              Preferences hub
            </Badge>
            <CardTitle className="mt-4 text-3xl font-bold text-white">{translate("settingsTitle")}</CardTitle>
            <CardDescription className="mt-2 text-base leading-8 text-white/60">当前优先实现语言切换，但视觉上已经按真实账户中心的偏好页在组织信息。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-white/70">
            {[
              { icon: Globe2, title: "语言偏好", desc: "Web / API / 多端共享同一语言设置能力。" },
              { icon: Bell, title: "通知中心", desc: "后续接入订单、议价和履约通知。" },
              { icon: Shield, title: "安全与隐私", desc: "账号安全、设备登录和隐私授权会在下一阶段扩展。" },
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
            <CardTitle className="text-2xl font-semibold text-white">Language Switch</CardTitle>
            <CardDescription className="text-white/55">切换后会同步更新前端导航和关键业务文案。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {SUPPORTED_LANGUAGES.map((item) => (
              <button
                key={item}
                onClick={() => setLanguage(item)}
                className={item === language
                  ? "flex items-center justify-between rounded-[24px] border border-primary/30 bg-primary/15 px-5 py-4 text-left text-primary transition"
                  : "flex items-center justify-between rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-left text-white/75 transition hover:border-white/20 hover:bg-white/[0.04]"
                }
              >
                <div>
                  <p className="font-semibold">{item}</p>
                  <p className="mt-1 text-sm opacity-70">{item === "zh-CN" ? "简体中文界面" : "English interface"}</p>
                </div>
                {item === language && <Badge className="bg-primary text-slate-950">Current</Badge>}
              </button>
            ))}
            <div className="pt-2">
              <Button variant="outline" className="rounded-full border-white/10 bg-white/[0.03] px-5 text-white hover:bg-white/[0.08] hover:text-white">
                保存偏好
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}

import Link from "next/link";
import { APP_NAME, ROUTES } from "@turno/constants";

const footerLinks = [
  { href: ROUTES.products, label: "好物广场" },
  { href: ROUTES.publish, label: "发布闲置" },
  { href: ROUTES.buyOrders, label: "交易订单" },
  { href: ROUTES.settings, label: "语言设置" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-teal-300 to-cyan-200 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(80,255,224,0.35)]">
              T
            </div>
            <div>
              <p className="heading-display text-lg font-semibold text-white">{APP_NAME}</p>
              <p className="text-sm text-white/55">Premium recommerce experience</p>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/60">
            面向 Web、移动端与小程序的统一二手交易平台骨架。当前聚焦高信任商品展示、下单履约与国际化体验。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75 transition hover:border-primary/40 hover:bg-white/[0.06] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

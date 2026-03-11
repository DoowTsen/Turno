"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getNotificationSummary, listConversations } from "@turno/api-sdk";
import { Bell, Globe2, LogOut, Menu, Plus, Search, Sparkles } from "lucide-react";
import { APP_NAME, ROUTES, SUPPORTED_LANGUAGES, isManagementRole } from "@turno/constants";
import { useLanguage } from "@/providers/language-provider";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { href: ROUTES.home, key: "navHome" as const },
  { href: ROUTES.products, key: "navProducts" as const },
  { href: ROUTES.publish, key: "navPublish" as const },
  { href: ROUTES.messages, key: "navMessages" as const },
  { href: ROUTES.buyOrders, key: "navOrders" as const },
  { href: ROUTES.settings, key: "navSettings" as const },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { language, setLanguage, translate } = useLanguage();
  const { user, isAuthenticated, isLoading, accessToken, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated || !accessToken) {
      setUnreadCount(0);
      setNotificationUnreadCount(0);
      return;
    }

    const token = accessToken;
    let mounted = true;

    async function loadUnreadCount() {
      try {
        const [items, notificationSummary] = await Promise.all([
          listConversations(token),
          getNotificationSummary(token),
        ]);
        if (!mounted) {
          return;
        }
        setUnreadCount(items.reduce((sum, item) => sum + (item.unreadCount ?? 0), 0));
        setNotificationUnreadCount(notificationSummary.unreadCount ?? 0);
      } catch {
        if (mounted) {
          setUnreadCount(0);
          setNotificationUnreadCount(0);
        }
      }
    }

    void loadUnreadCount();
    const timer = window.setInterval(() => {
      void loadUnreadCount();
    }, 8000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [accessToken, isAuthenticated, isLoading, pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/72 backdrop-blur-2xl supports-[backdrop-filter]:bg-slate-950/58">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.home} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-teal-300 to-cyan-200 text-sm font-black text-slate-950 shadow-[0_0_40px_rgba(80,255,224,0.35)]">
              T
            </div>
            <div className="hidden sm:block">
              <div className="heading-display text-lg font-bold tracking-tight text-white">{APP_NAME}</div>
              <div className="text-xs text-white/45">Trade smart. Sell beautifully.</div>
            </div>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 lg:flex">
            <Sparkles className="size-3.5 text-primary" />
            商业化视觉升级中
          </div>
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href !== ROUTES.home && pathname.startsWith(item.href));
            const showUnread = item.href === ROUTES.messages && unreadCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-white text-slate-950 shadow-[0_8px_32px_rgba(255,255,255,0.18)]"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                )}
              >
                <span>{translate(item.key)}</span>
                {showUnread ? (
                  <span
                    className={cn(
                      "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                      active ? "bg-slate-950 text-white" : "bg-primary text-slate-950",
                    )}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.notifications}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-lg" }),
              "relative hidden rounded-full border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] md:inline-flex",
            )}
          >
            <Bell className="size-4" />
            {notificationUnreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-slate-950">
                {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
              </span>
            ) : null}
          </Link>
          <Link
            href={ROUTES.products}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-lg" }),
              "hidden rounded-full border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] md:inline-flex",
            )}
          >
            <Search className="size-4" />
          </Link>
          <Link
            href={ROUTES.publish}
            className={cn(
              buttonVariants({ size: "lg" }),
              "hidden rounded-full px-5 shadow-[0_0_40px_rgba(72,255,214,0.28)] md:inline-flex",
            )}
          >
            <Plus className="size-4" />
            发布商品
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/10 bg-white/[0.03] px-2.5 text-white hover:bg-white/[0.08] hover:text-white"
                />
              }
            >
              <Avatar size="sm" className="bg-primary/10">
                <AvatarFallback className="bg-white/10 text-white">
                  {user?.nickname?.slice(0, 1).toUpperCase() ?? "T"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-24 truncate sm:inline">{isAuthenticated ? user?.nickname ?? language : language}</span>
              {unreadCount > 0 ? (
                <span className="hidden rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-slate-950 sm:inline-flex">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
              <Menu className="size-4 sm:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 border border-white/10 bg-slate-950/95 text-white shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
              align="end"
            >
              <DropdownMenuLabel className="text-white/60">
                {isAuthenticated ? `Hi, ${user?.nickname}` : "Turno Workspace"}
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer text-white/80" onClick={() => setLanguage(language)}>
                  <Globe2 className="size-4 text-primary" />
                  当前语言：{language}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuLabel className="text-white/60">切换语言</DropdownMenuLabel>
              <DropdownMenuGroup>
                {SUPPORTED_LANGUAGES.map((item) => (
                  <DropdownMenuItem
                    key={item}
                    className={cn(item === language ? "bg-primary/15 text-primary" : "text-white/80", "cursor-pointer")}
                    onClick={() => setLanguage(item)}
                  >
                    {item}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuGroup>
                {isAuthenticated ? (
                  <>
                    <DropdownMenuItem render={<Link href={ROUTES.publish} />} className="cursor-pointer text-white/80">
                      发布新商品
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={ROUTES.buyOrders} />} className="cursor-pointer text-white/80">
                      买家订单
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={ROUTES.afterSales} />} className="cursor-pointer text-white/80">
                      我的售后
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={ROUTES.sellOrders} />} className="cursor-pointer text-white/80">
                      卖家订单
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={ROUTES.messages} />} className="cursor-pointer text-white/80">
                      消息中心{unreadCount > 0 ? ` (${unreadCount > 99 ? "99+" : unreadCount})` : ""}
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={ROUTES.notifications} />} className="cursor-pointer text-white/80">
                      通知中心{notificationUnreadCount > 0 ? ` (${notificationUnreadCount > 99 ? "99+" : notificationUnreadCount})` : ""}
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={ROUTES.addresses} />} className="cursor-pointer text-white/80">
                      地址簿
                    </DropdownMenuItem>
                    {isManagementRole(user?.role) ? (
                      <DropdownMenuItem render={<Link href={ROUTES.admin} />} className="cursor-pointer text-white/80">
                        管理台
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-white/80">
                      <LogOut className="size-4 text-white/60" />
                      退出登录
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem render={<Link href={ROUTES.login} />} className="cursor-pointer text-white/80">
                    登录中心
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem render={<Link href={ROUTES.settings} />} className="cursor-pointer text-white/80">
                  偏好设置
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}


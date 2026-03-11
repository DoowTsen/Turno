import type { Metadata } from "next";
import { Noto_Sans_SC, Syne } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/providers/language-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-sans",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Turno | Premium Recommerce",
  description: "Turno 二手交易平台 Web 端，专注高信任、高质感的二手流通体验。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("dark", notoSansSC.variable, syne.variable)} suppressHydrationWarning>
      <body className="relative min-h-screen overflow-x-hidden font-sans text-foreground">
        <LanguageProvider>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="relative flex-1">{children}</main>
              <SiteFooter />
            </div>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

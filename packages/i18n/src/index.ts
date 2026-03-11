import type { Language } from "@turno/types";

export const dictionaries = {
  "zh-CN": {
    navHome: "首页",
    navProducts: "商品",
    navPublish: "发布商品",
    navMessages: "消息",
    navOrders: "订单",
    navSettings: "设置",
    heroTitle: "让好东西流转，让二手交易更安心。",
    heroDesc: "Turno 第一阶段已进入可开发状态：Web 与 API 基础骨架、数据库设计和核心交易模块已经准备就绪。",
    browseProducts: "浏览商品",
    publishNow: "立即发布",
    loginTitle: "登录 Turno",
    loginDesc: "首期支持邮箱登录，后续会扩展手机号和第三方登录。",
    productSquare: "好物广场",
    publishTitle: "发布你的闲置",
    ordersTitle: "我的订单",
    settingsTitle: "语言与偏好设置",
    favoritesTitle: "我的收藏",
  },
  "en-US": {
    navHome: "Home",
    navProducts: "Products",
    navPublish: "Publish",
    navMessages: "Messages",
    navOrders: "Orders",
    navSettings: "Settings",
    heroTitle: "Let great items circulate, and make second-hand trading safer.",
    heroDesc: "Turno phase one is now development-ready with Web/API scaffolding, database design, and core trading modules in place.",
    browseProducts: "Browse Products",
    publishNow: "Publish Now",
    loginTitle: "Sign in to Turno",
    loginDesc: "Email login is available first; phone and third-party login can be added later.",
    productSquare: "Marketplace",
    publishTitle: "List Your Item",
    ordersTitle: "My Orders",
    settingsTitle: "Language & Preferences",
    favoritesTitle: "My Favorites",
  },
} as const;

export type MessageKey = keyof typeof dictionaries["zh-CN"];

export function t(language: Language, key: MessageKey): string {
  return dictionaries[language][key] ?? dictionaries["zh-CN"][key] ?? key;
}



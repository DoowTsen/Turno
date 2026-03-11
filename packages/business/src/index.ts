import type { Order, Product } from "@turno/types";

export const mockProducts: Product[] = [
  {
    id: 3001,
    title: "Fujifilm X-T30 II 微单机身",
    description: "自用一年半，快门约 7200 次，机身边角有轻微磕碰，传感器干净，功能完全正常。",
    price: 459900,
    currency: "CNY",
    conditionLevel: "excellent",
    city: "杭州",
    shippingFee: 1800,
    status: "active",
    favoriteCount: 9,
    images: [{ id: 4001, url: "http://127.0.0.1:8080/uploads/products/camera-fujifilm.jpg", sortOrder: 0 }],
  },
  {
    id: 3002,
    title: "Keychron K8 RGB 机械键盘 茶轴",
    description: "87 键热插拔版本，RGB 背光，蓝牙和有线双模。键帽成色不错，日常办公使用，无进水维修史。",
    price: 35900,
    currency: "CNY",
    conditionLevel: "good",
    city: "上海",
    shippingFee: 1200,
    status: "active",
    favoriteCount: 6,
    images: [{ id: 4002, url: "http://127.0.0.1:8080/uploads/products/keyboard-rgb.jpg", sortOrder: 0 }],
  },
  {
    id: 3003,
    title: "ThinkPad X1 Carbon Gen 9 16G/512G",
    description: "i7 + 16GB + 512GB，商务本成色 9 成新，屏幕无坏点，键盘手感好，适合办公和差旅。",
    price: 439900,
    currency: "CNY",
    conditionLevel: "good",
    city: "上海",
    shippingFee: 0,
    status: "active",
    favoriteCount: 13,
    images: [{ id: 4003, url: "http://127.0.0.1:8080/uploads/products/laptop-thinkpad.jpg", sortOrder: 0 }],
  },
  {
    id: 3004,
    title: "Nintendo Switch OLED 白色主机",
    description: "国行 OLED 版，平时接电视较多，屏幕无划痕，Joy-Con 无明显漂移。包装和底座都在。",
    price: 159900,
    currency: "CNY",
    conditionLevel: "good",
    city: "杭州",
    shippingFee: 1500,
    status: "active",
    favoriteCount: 21,
    images: [{ id: 4004, url: "http://127.0.0.1:8080/uploads/products/switch-console.jpg", sortOrder: 0 }],
  },
  {
    id: 3005,
    title: "Apple Watch Series 8 45mm GPS",
    description: "铝金属午夜色，电池健康 92%，表壳边缘有正常使用痕迹，送一条第三方编织表带。",
    price: 149900,
    currency: "CNY",
    conditionLevel: "good",
    city: "北京",
    shippingFee: 0,
    status: "sold",
    favoriteCount: 8,
    images: [{ id: 4005, url: "http://127.0.0.1:8080/uploads/products/watch-silver.jpg", sortOrder: 0 }],
  },
];

export const mockBuyOrders: Order[] = [
  {
    id: 6001,
    orderNo: "TRN202603080001",
    productId: 3005,
    totalAmount: 149900,
    status: "completed",
    receiverName: "赵明",
    receiverPhone: "13800000004",
    receiverRegion: "广东省 深圳市 南山区",
    receiverAddress: "科技园科苑路 19 号 1802",
  },
];

export function formatPrice(value: number, currency = "CNY") {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value / 100);
}

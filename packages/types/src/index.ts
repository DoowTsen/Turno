export type Language = "zh-CN" | "en-US";

export interface ProductImage {
  id: number;
  url: string;
  sortOrder: number;
}

export interface Product {
  id: number;
  sellerId?: number;
  categoryId?: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  conditionLevel: string;
  city?: string;
  shippingFee: number;
  status: string;
  viewCount?: number;
  favoriteCount: number;
  createdAt?: string;
  updatedAt?: string;
  images: ProductImage[];
}

export interface CategoryNode {
  id: number;
  parentId?: number;
  slug: string;
  name: string;
  children?: CategoryNode[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserProfile {
  id: number;
  email?: string;
  nickname: string;
  preferredLanguage: Language;
  role: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
}

export interface UserAddress {
  id: number;
  userId?: number;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressInput {
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  isDefault: boolean;
}

export interface CreateProductInput {
  categoryId: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  conditionLevel: string;
  city: string;
  shippingFee: number;
  images: string[];
}

export interface Shipment {
  id: number;
  orderId: number;
  carrier: string;
  trackingNo: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  orderNo: string;
  buyerId?: number;
  sellerId?: number;
  productId: number;
  totalAmount: number;
  shippingFee?: number;
  currency?: string;
  status: string;
  receiverName: string;
  receiverPhone: string;
  receiverRegion: string;
  receiverAddress: string;
  createdAt?: string;
  updatedAt?: string;
  shipment?: Shipment;
}

export interface CreateOrderInput {
  productId: number;
  receiverName: string;
  receiverPhone: string;
  receiverRegion: string;
  receiverAddress: string;
}

export interface Review {
  id: number;
  orderId: number;
  productId: number;
  reviewerId: number;
  revieweeId: number;
  role: string;
  score: number;
  content?: string;
  reviewerNickname: string;
  createdAt?: string;
}

export interface CreateReviewInput {
  score: number;
  content: string;
}

export interface AfterSale {
  id: number;
  orderId: number;
  orderNo: string;
  productId: number;
  productTitle: string;
  buyerId: number;
  buyerNickname: string;
  sellerId: number;
  sellerNickname: string;
  type: string;
  status: string;
  reason: string;
  detail?: string;
  requestedAmount: number;
  currency: string;
  sellerResponseNote?: string;
  sellerRespondedAt?: string;
  resolutionNote?: string;
  logs?: AfterSaleLog[];
  viewerRole: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AfterSaleLog {
  id: number;
  afterSaleId: number;
  actorId?: number;
  actorRole: string;
  actorLabel: string;
  action: string;
  status?: string;
  note: string;
  createdAt?: string;
}

export interface CreateAfterSaleInput {
  type: string;
  reason: string;
  detail: string;
  requestedAmount: number;
}

export interface SellerRespondAfterSaleInput {
  status: string;
  sellerResponseNote: string;
}

export interface Conversation {
  id: number;
  productId: number;
  productTitle: string;
  buyerId: number;
  sellerId: number;
  peerId: number;
  peerNickname: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  updatedAt?: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderNickname: string;
  content: string;
  createdAt?: string;
}

export interface SendMessageInput {
  content: string;
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalProducts: number;
  activeProducts: number;
  rejectedProducts: number;
  archivedProducts: number;
  soldProducts: number;
  totalOrders: number;
  completedOrders: number;
  pendingShipments: number;
  totalReviews: number;
  openAfterSales: number;
}

export interface AdminUser {
  id: number;
  email?: string;
  nickname: string;
  preferredLanguage: string;
  role: string;
  status: string;
  createdAt?: string;
}

export interface AdminProduct {
  id: number;
  title: string;
  sellerId: number;
  sellerNickname: string;
  categoryId: number;
  price: number;
  currency: string;
  status: string;
  favoriteCount: number;
  createdAt?: string;
}

export interface AdminCategory {
  id: number;
  parentId?: number;
  slug: string;
  status: string;
  sortOrder: number;
  nameZhCN: string;
  nameEnUS: string;
  createdAt?: string;
}

export interface AdminCategoryUpdateInput {
  status: string;
  sortOrder: number;
  nameZhCN: string;
  nameEnUS: string;
}
export interface AdminOrder {
  id: number;
  orderNo: string;
  productId: number;
  productTitle: string;
  buyerId: number;
  buyerNickname: string;
  sellerId: number;
  sellerNickname: string;
  totalAmount: number;
  shippingFee: number;
  currency: string;
  status: string;
  receiverRegion: string;
  receiverAddress: string;
  carrier?: string;
  trackingNo?: string;
  afterSaleStatus?: string;
  createdAt?: string;
}

export interface AdminAfterSale {
  id: number;
  orderId: number;
  orderNo: string;
  productId: number;
  productTitle: string;
  buyerId: number;
  buyerNickname: string;
  sellerId: number;
  sellerNickname: string;
  type: string;
  status: string;
  reason: string;
  detail?: string;
  requestedAmount: number;
  currency: string;
  resolutionNote?: string;
  logs?: AfterSaleLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAfterSaleUpdateInput {
  status: string;
  resolutionNote: string;
}

export interface AdminOrderDetailAfterSale {
  id: number;
  type: string;
  status: string;
  reason: string;
  requestedAmount: number;
  currency: string;
  resolutionNote?: string;
  logs?: AfterSaleLog[];
  updatedAt?: string;
}

export interface AdminOrderDetail {
  id: number;
  orderNo: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
  productId: number;
  productTitle: string;
  productStatus: string;
  productImageUrl?: string;
  buyerId: number;
  buyerNickname: string;
  buyerEmail?: string;
  buyerStatus: string;
  sellerId: number;
  sellerNickname: string;
  sellerEmail?: string;
  sellerStatus: string;
  receiverName: string;
  receiverPhone: string;
  receiverRegion: string;
  receiverAddress: string;
  carrier?: string;
  trackingNo?: string;
  shipmentStatus?: string;
  afterSales: AdminOrderDetailAfterSale[];
}


export interface AdminTrendPoint {
  date: string;
  newUsers: number;
  newProducts: number;
  createdOrders: number;
  completedOrders: number;
  gmv: number;
  newAfterSales: number;
}

export interface AdminTrends {
  days: number;
  points: AdminTrendPoint[];
  lastPeriodUsers: number;
  lastPeriodProducts: number;
  lastPeriodOrders: number;
  lastPeriodCompleted: number;
  lastPeriodGMV: number;
  lastPeriodAfterSales: number;
  completionRate: number;
}

export interface AdminAlert {
  key: string;
  title: string;
  description: string;
  level: string;
  metric: number;
  actionLabel: string;
  targetTab: string;
}

export interface AdminRiskOrder {
  orderId: number;
  orderNo: string;
  productTitle: string;
  sellerNickname: string;
  status: string;
  afterSaleStatus?: string;
  createdAt?: string;
  riskReason: string;
}

export interface AdminRiskSeller {
  sellerId: number;
  sellerNickname: string;
  delayedShipments: number;
  openAfterSales: number;
  rejectedProducts: number;
  riskScore: number;
  riskReason: string;
}

export interface AdminRiskBuyer {
  buyerId: number;
  buyerNickname: string;
  cancelledOrders: number;
  openAfterSales: number;
  riskScore: number;
  riskReason: string;
}

export interface AdminAlerts {
  items: AdminAlert[];
  riskOrders: AdminRiskOrder[];
  riskSellers: AdminRiskSeller[];
  riskBuyers: AdminRiskBuyer[];
}

export interface AdminAuditLog {
  id: number;
  actorId: number;
  actorNickname: string;
  action: string;
  targetType: string;
  targetId: number;
  targetLabel?: string;
  detail: string;
  createdAt?: string;
}

export interface AdminNotificationTemplate {
  id: number;
  name: string;
  type: string;
  titleTemplate: string;
  contentTemplate: string;
  defaultLink?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminNotificationTemplateInput {
  name: string;
  type: string;
  titleTemplate: string;
  contentTemplate: string;
  defaultLink?: string;
  status: string;
}

export interface AdminNotificationSendInput {
  templateId?: number;
  title?: string;
  content?: string;
  link?: string;
  targetType: "all_users" | "management" | "role" | "user_ids";
  targetRole?: string;
  userIds?: number[];
}

export interface AdminNotificationSendResult {
  templateId?: number;
  targetType: string;
  targetRole?: string;
  recipientCount: number;
  deliveredAt?: string;
}

export interface AdminBatchFailureItem {
  id: number;
  reason: string;
}

export interface AdminBatchResult {
  updatedCount: number;
  succeededIds?: number[];
  failedItems?: AdminBatchFailureItem[];
}

export interface AdminHomeBanner {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  tone: string;
}

export interface AdminHomeConfig {
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  featuredProductIds: number[];
  featuredCategorySlugs: string[];
  banners: AdminHomeBanner[];
}

export interface AdminActionTemplateBinding {
  actionKey: string;
  templateId?: number;
  templateName?: string;
  fallbackNames: string[];
}


export interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt?: string;
}

export interface NotificationSummary {
  unreadCount: number;
}

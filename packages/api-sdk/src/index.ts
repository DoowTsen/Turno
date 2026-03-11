import type {
  AddressInput,
  AdminAfterSale,
  AdminAfterSaleUpdateInput,
  AdminActionTemplateBinding,
  AdminAlerts,
  AdminAuditLog,
  AdminBatchResult,
  AdminCategory,
  AdminCategoryUpdateInput,
  AdminHomeConfig,
  AdminNotificationSendInput,
  AdminNotificationSendResult,
  AdminNotificationTemplate,
  AdminNotificationTemplateInput,
  AdminOrder,
  AdminOrderDetail,
  AdminOverview,
  AdminTrends,
  AdminProduct,
  AdminUser,
  AuthSession,
  CategoryNode,
  CreateOrderInput,
  CreateAfterSaleInput,
  SellerRespondAfterSaleInput,
  CreateProductInput,
  CreateReviewInput,
  Conversation,
  Message,
  NotificationItem,
  NotificationSummary,
  SendMessageInput,
  AfterSale,
  Language,
  Order,
  PaginatedResult,
  Product,
  Review,
  UserAddress,
  UserProfile,
} from "@turno/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type ApiPayload<T> = {
  code: string;
  message: string;
  data: T;
};

export type ProductListQuery = {
  keyword?: string;
  categoryId?: number;
  page?: number;
  pageSize?: number;
};

type RequestOptions = RequestInit & {
  accessToken?: string;
};

async function requestJSON<T>(path: string, init?: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.accessToken ? { Authorization: `Bearer ${init.accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: init?.cache ?? "no-store",
  });

  const payload = (await response.json()) as ApiPayload<T>;

  if (!response.ok) {
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export async function fetchJSON<T>(path: string, init?: RequestOptions): Promise<T> {
  return requestJSON<T>(path, init);
}

async function requestBlob(path: string, init?: RequestOptions): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.accessToken ? { Authorization: `Bearer ${init.accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: init?.cache ?? "no-store",
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const payload = (await response.json()) as ApiPayload<unknown>;
      message = payload.message || message;
    } catch {}
    throw new Error(message);
  }

  return response.blob();
}

export function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function login(input: { email: string; password: string }) {
  return requestJSON<AuthSession>(`/api/v1/auth/login`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function register(input: { email: string; password: string; nickname: string; language: Language }) {
  return requestJSON<AuthSession>(`/api/v1/auth/register`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCurrentUser(accessToken: string) {
  return requestJSON<UserProfile>(`/api/v1/auth/me`, {
    accessToken,
  });
}

export async function listProducts(query: ProductListQuery = {}, language: Language = "zh-CN") {
  return requestJSON<PaginatedResult<Product>>(
    `/api/v1/products${buildQuery({
      keyword: query.keyword,
      categoryId: query.categoryId,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 12,
    })}`,
    {
      headers: {
        "Accept-Language": language,
      },
    },
  );
}

export async function getProductDetail(id: number, language: Language = "zh-CN") {
  return requestJSON<Product>(`/api/v1/products/${id}`, {
    headers: {
      "Accept-Language": language,
    },
  });
}

export async function listProductReviews(id: number) {
  return requestJSON<Review[]>(`/api/v1/products/${id}/reviews`);
}

export async function getCategoryTree(language: Language = "zh-CN") {
  return requestJSON<CategoryNode[]>(`/api/v1/categories/tree`, {
    headers: {
      "Accept-Language": language,
    },
  });
}

export async function createProduct(input: CreateProductInput, accessToken: string) {
  return requestJSON<Product>(`/api/v1/products`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function createOrder(input: CreateOrderInput, accessToken: string) {
  return requestJSON<Order>(`/api/v1/orders`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function getOrderDetail(id: number, accessToken: string) {
  return requestJSON<Order>(`/api/v1/orders/${id}`, {
    accessToken,
  });
}

export async function getOrderAfterSale(orderId: number, accessToken: string) {
  return requestJSON<AfterSale>(`/api/v1/orders/${orderId}/after-sales`, {
    accessToken,
  });
}

export async function createAfterSale(orderId: number, input: CreateAfterSaleInput, accessToken: string) {
  return requestJSON<AfterSale>(`/api/v1/orders/${orderId}/after-sales`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function getOrderReviewStatus(orderId: number, accessToken: string) {
  return requestJSON<{ reviewed: boolean }>(`/api/v1/orders/${orderId}/review-status`, {
    accessToken,
  });
}

export async function createOrderReview(orderId: number, input: CreateReviewInput, accessToken: string) {
  return requestJSON<Review>(`/api/v1/orders/${orderId}/reviews`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function listBuyOrders(accessToken: string) {
  return requestJSON<Order[]>(`/api/v1/me/orders/buy`, {
    accessToken,
  });
}

export async function listSellOrders(accessToken: string) {
  return requestJSON<Order[]>(`/api/v1/me/orders/sell`, {
    accessToken,
  });
}

export async function listMyAfterSales(accessToken: string) {
  return requestJSON<AfterSale[]>(`/api/v1/me/after-sales`, {
    accessToken,
  });
}


export async function sellerRespondAfterSale(afterSaleId: number, input: SellerRespondAfterSaleInput, accessToken: string) {
  return requestJSON<AfterSale>(`/api/v1/after-sales/${afterSaleId}/seller-response`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function listFavorites(accessToken: string) {
  return requestJSON<Product[]>(`/api/v1/me/favorites`, {
    accessToken,
  });
}

export async function addFavorite(productId: number, accessToken: string) {
  return requestJSON<{ success: boolean }>(`/api/v1/products/${productId}/favorite`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({}),
  });
}

export async function removeFavorite(productId: number, accessToken: string) {
  return requestJSON<{ success: boolean }>(`/api/v1/products/${productId}/favorite`, {
    method: "DELETE",
    accessToken,
  });
}

export async function shipOrder(orderId: number, input: { carrier: string; trackingNo: string }, accessToken: string) {
  return requestJSON<Order>(`/api/v1/orders/${orderId}/ship`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function confirmReceipt(orderId: number, accessToken: string) {
  return requestJSON<Order>(`/api/v1/orders/${orderId}/confirm-receipt`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({}),
  });
}

export async function listConversations(accessToken: string) {
  return requestJSON<Conversation[]>(`/api/v1/me/conversations`, {
    accessToken,
  });
}

export async function startConversation(productId: number, accessToken: string) {
  return requestJSON<Conversation>(`/api/v1/products/${productId}/conversations`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({}),
  });
}

export async function listMessages(conversationId: number, accessToken: string) {
  return requestJSON<Message[]>(`/api/v1/conversations/${conversationId}/messages`, {
    accessToken,
  });
}

export async function sendMessage(conversationId: number, input: SendMessageInput, accessToken: string) {
  return requestJSON<Message>(`/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}
export async function listUserAddresses(accessToken: string) {
  return requestJSON<UserAddress[]>(`/api/v1/users/addresses`, {
    accessToken,
  });
}

export async function createUserAddress(input: AddressInput, accessToken: string) {
  return requestJSON<UserAddress>(`/api/v1/users/addresses`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function updateUserAddress(addressId: number, input: AddressInput, accessToken: string) {
  return requestJSON<UserAddress>(`/api/v1/users/addresses/${addressId}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function deleteUserAddress(addressId: number, accessToken: string) {
  return requestJSON<{ deleted: boolean }>(`/api/v1/users/addresses/${addressId}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function setDefaultUserAddress(addressId: number, accessToken: string) {
  return requestJSON<UserAddress>(`/api/v1/users/addresses/${addressId}/default`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({}),
  });
}
export async function getAdminOverview(accessToken: string) {
  return requestJSON<AdminOverview>(`/api/v1/admin/overview`, {
    accessToken,
  });
}

export async function getAdminTrends(accessToken: string, days = 7) {
  return requestJSON<AdminTrends>(`/api/v1/admin/trends${buildQuery({ days })}`, {
    accessToken,
  });
}

export async function getAdminAlerts(accessToken: string) {
  return requestJSON<AdminAlerts>(`/api/v1/admin/alerts`, {
    accessToken,
  });
}

export async function getSiteHomeConfig() {
  return requestJSON<AdminHomeConfig>(`/api/v1/site/home-config`);
}

export async function getAdminHomeConfig(accessToken: string) {
  return requestJSON<AdminHomeConfig>(`/api/v1/admin/site/home-config`, {
    accessToken,
  });
}

export async function saveAdminHomeConfig(input: AdminHomeConfig, accessToken: string) {
  return requestJSON<AdminHomeConfig>(`/api/v1/admin/site/home-config`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function listAdminActionTemplateBindings(accessToken: string) {
  return requestJSON<AdminActionTemplateBinding[]>(`/api/v1/admin/site/action-template-bindings`, {
    accessToken,
  });
}

export async function saveAdminActionTemplateBindings(input: AdminActionTemplateBinding[], accessToken: string) {
  return requestJSON<AdminActionTemplateBinding[]>(`/api/v1/admin/site/action-template-bindings`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function listAdminAuditLogs(accessToken: string, query: { keyword?: string; action?: string } = {}) {
  return requestJSON<AdminAuditLog[]>(`/api/v1/admin/audit-logs${buildQuery(query)}`, {
    accessToken,
  });
}

export async function listAdminUsers(accessToken: string, query: { keyword?: string; role?: string; status?: string } = {}) {
  return requestJSON<AdminUser[]>(`/api/v1/admin/users${buildQuery(query)}`, {
    accessToken,
  });
}

export async function batchUpdateAdminUserStatus(input: { ids: number[]; status: string }, accessToken: string) {
  return requestJSON<AdminBatchResult>(`/api/v1/admin/users/batch-status`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function updateAdminUserStatus(userId: number, status: string, accessToken: string) {
  return requestJSON<{ id: number; status: string }>(`/api/v1/admin/users/${userId}/status`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({ status }),
  });
}

export async function listAdminProducts(
  accessToken: string,
  query: {
    keyword?: string;
    status?: string;
    categoryId?: number;
    sellerId?: number;
    minPrice?: number;
    maxPrice?: number;
  } = {},
) {
  return requestJSON<AdminProduct[]>(`/api/v1/admin/products${buildQuery(query)}`, {
    accessToken,
  });
}

export async function batchUpdateAdminProductStatus(input: { ids: number[]; status: string }, accessToken: string) {
  return requestJSON<AdminBatchResult>(`/api/v1/admin/products/batch-status`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function updateAdminProductStatus(productId: number, status: string, accessToken: string) {
  return requestJSON<{ id: number; status: string }>(`/api/v1/admin/products/${productId}/status`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({ status }),
  });
}

export async function listAdminCategories(accessToken: string) {
  return requestJSON<AdminCategory[]>(`/api/v1/admin/categories`, {
    accessToken,
  });
}

export async function updateAdminCategory(categoryId: number, input: AdminCategoryUpdateInput, accessToken: string) {
  return requestJSON<AdminCategory>(`/api/v1/admin/categories/${categoryId}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(input),
  });
}
export async function listAdminOrders(
  accessToken: string,
  query: {
    keyword?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    hasAfterSale?: boolean;
    delayedOnly?: boolean;
  } = {},
) {
  return requestJSON<AdminOrder[]>(`/api/v1/admin/orders${buildQuery({
    ...query,
    hasAfterSale: query.hasAfterSale === undefined ? undefined : query.hasAfterSale ? "true" : "false",
    delayedOnly: query.delayedOnly === undefined ? undefined : query.delayedOnly ? "true" : "false",
  })}`, {
    accessToken,
  });
}

export async function getAdminOrderDetail(orderId: number, accessToken: string) {
  return requestJSON<AdminOrderDetail>(`/api/v1/admin/orders/${orderId}`, {
    accessToken,
  });
}

export async function exportAdminOrdersCsv(
  accessToken: string,
  query: {
    keyword?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    hasAfterSale?: boolean;
    delayedOnly?: boolean;
  } = {},
) {
  return requestBlob(`/api/v1/admin/orders/export${buildQuery({
    ...query,
    hasAfterSale: query.hasAfterSale === undefined ? undefined : query.hasAfterSale ? "true" : "false",
    delayedOnly: query.delayedOnly === undefined ? undefined : query.delayedOnly ? "true" : "false",
  })}`, {
    accessToken,
  });
}

export async function listAdminAfterSales(accessToken: string, query: { status?: string; type?: string } = {}) {
  return requestJSON<AdminAfterSale[]>(`/api/v1/admin/after-sales${buildQuery(query)}`, {
    accessToken,
  });
}

export async function batchUpdateAdminAfterSaleStatus(input: { ids: number[]; status: string; resolutionNote?: string }, accessToken: string) {
  return requestJSON<AdminBatchResult>(`/api/v1/admin/after-sales/batch-status`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function exportAdminAfterSalesCsv(accessToken: string, query: { status?: string; type?: string } = {}) {
  return requestBlob(`/api/v1/admin/after-sales/export${buildQuery(query)}`, {
    accessToken,
  });
}

export async function listAdminNotificationTemplates(accessToken: string, status?: string) {
  return requestJSON<AdminNotificationTemplate[]>(`/api/v1/admin/notification-templates${buildQuery({ status })}`, {
    accessToken,
  });
}

export async function createAdminNotificationTemplate(input: AdminNotificationTemplateInput, accessToken: string) {
  return requestJSON<AdminNotificationTemplate>(`/api/v1/admin/notification-templates`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function updateAdminNotificationTemplate(templateId: number, input: AdminNotificationTemplateInput, accessToken: string) {
  return requestJSON<AdminNotificationTemplate>(`/api/v1/admin/notification-templates/${templateId}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function sendAdminNotification(input: AdminNotificationSendInput, accessToken: string) {
  return requestJSON<AdminNotificationSendResult>(`/api/v1/admin/notifications/send`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export async function updateAdminAfterSaleStatus(
  afterSaleId: number,
  input: AdminAfterSaleUpdateInput,
  accessToken: string,
) {
  return requestJSON<AdminAfterSale>(`/api/v1/admin/after-sales/${afterSaleId}/status`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(input),
  });
}





export async function listNotifications(accessToken: string, unreadOnly = false) {
  return requestJSON<NotificationItem[]>(`/api/v1/me/notifications${buildQuery({ unreadOnly: unreadOnly ? "true" : undefined })}`, {
    accessToken,
  });
}

export async function getNotificationSummary(accessToken: string) {
  return requestJSON<NotificationSummary>(`/api/v1/me/notifications/summary`, {
    accessToken,
  });
}

export async function markNotificationRead(notificationId: number, accessToken: string) {
  return requestJSON<NotificationItem>(`/api/v1/notifications/${notificationId}/read`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({}),
  });
}

export async function markAllNotificationsRead(accessToken: string) {
  return requestJSON<{ success: boolean }>(`/api/v1/me/notifications/read-all`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({}),
  });
}

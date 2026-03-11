# Turno 第一阶段 API 说明

## 基础信息

- Base URL：`/api/v1`
- 鉴权方式：`Authorization: Bearer <token>`
- 返回结构：

```json
{
  "code": "OK",
  "message": "success",
  "data": {}
}
```

## 已实现接口

### Health
- `GET /api/v1/health`

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### User
- `GET /api/v1/users/profile`
- `PUT /api/v1/users/profile`
- `PUT /api/v1/users/preferences/language`

### Category
- `GET /api/v1/categories/tree`

### Product
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PUT /api/v1/products/:id`
- `PATCH /api/v1/products/:id/status`
- `GET /api/v1/me/products`

### Favorite
- `GET /api/v1/me/favorites`
- `POST /api/v1/products/:id/favorite`
- `DELETE /api/v1/products/:id/favorite`

### Order
- `POST /api/v1/orders`
- `GET /api/v1/orders/:id`
- `GET /api/v1/me/orders/buy`
- `GET /api/v1/me/orders/sell`
- `PATCH /api/v1/orders/:id/cancel`
- `PATCH /api/v1/orders/:id/ship`
- `PATCH /api/v1/orders/:id/confirm-receipt`

## 当前限制

- 第一阶段尚未接入真实支付
- Web 页面仍以静态/模拟数据为主，第二阶段再逐步对接 API
- 管理后台接口、评价接口、地址接口目前只完成规划，未全部实现

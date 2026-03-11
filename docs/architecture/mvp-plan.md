# Turno MVP 开发计划（第一阶段）

> 文档版本：v0.1  
> 日期：2026-03-08  
> 范围：Web 用户端 + Go API 服务端

## 1. 第一阶段目标

第一阶段目标是完成一个可运行的 `MVP`，打通最基础的二手交易闭环：

- 用户注册 / 登录
- 商品发布 / 编辑 / 下架
- 商品列表 / 搜索 / 详情
- 收藏商品
- 买家下单
- 卖家发货
- 买家确认收货
- 订单查询
- 中英文切换

> 暂不纳入首期：小程序端、App 端、在线支付正式接入、复杂推荐系统、官方回收、平台验货流程、复杂运营后台。

---

## 2. MVP 功能清单

### 2.1 用户侧功能

#### 账号与用户
- 手机号/邮箱注册登录
- JWT 登录态
- 查看/编辑个人资料
- 收货地址管理
- 语言偏好设置

#### 商品
- 发布商品
- 编辑商品
- 上下架商品
- 删除商品
- 商品列表页
- 商品详情页
- 商品搜索
- 分类筛选
- 价格筛选
- 我的商品

#### 收藏
- 收藏商品
- 取消收藏
- 收藏列表

#### 订单
- 创建订单
- 我的购买订单
- 我的出售订单
- 取消订单
- 发货
- 确认收货
- 查看订单详情

#### 评价
- 买家评价卖家
- 卖家评价买家
- 查看商品评价/用户评价（基础版）

#### 国际化
- 页面语言切换：`zh-CN` / `en-US`
- 用户语言偏好持久化

### 2.2 后台基础功能

- 用户列表
- 商品审核列表
- 商品上下架管理
- 分类管理
- 订单列表

---

## 3. MVP 页面清单

### 3.1 Web 用户端

- `/` 首页
- `/login` 登录页
- `/register` 注册页
- `/products` 商品列表页
- `/products/[id]` 商品详情页
- `/publish` 发布商品页
- `/me/products` 我的商品页
- `/me/favorites` 我的收藏页
- `/me/orders/buy` 我的购买订单页
- `/me/orders/sell` 我的出售订单页
- `/me/profile` 个人资料页
- `/me/settings` 设置页（语言切换）

### 3.2 管理端（可先做简版内嵌）

- `/admin` 控制台
- `/admin/users` 用户管理
- `/admin/products` 商品审核/管理
- `/admin/categories` 分类管理
- `/admin/orders` 订单管理

---

## 4. MVP API 模块清单

### 4.1 `auth`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### 4.2 `users`
- `GET /api/v1/users/profile`
- `PUT /api/v1/users/profile`
- `GET /api/v1/users/addresses`
- `POST /api/v1/users/addresses`
- `PUT /api/v1/users/addresses/:id`
- `DELETE /api/v1/users/addresses/:id`
- `PUT /api/v1/users/preferences/language`

### 4.3 `categories`
- `GET /api/v1/categories/tree`
- `GET /api/v1/categories/:id`

### 4.4 `products`
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PUT /api/v1/products/:id`
- `PATCH /api/v1/products/:id/status`
- `DELETE /api/v1/products/:id`
- `GET /api/v1/me/products`

### 4.5 `favorites`
- `GET /api/v1/me/favorites`
- `POST /api/v1/products/:id/favorite`
- `DELETE /api/v1/products/:id/favorite`

### 4.6 `orders`
- `POST /api/v1/orders`
- `GET /api/v1/orders/:id`
- `GET /api/v1/me/orders/buy`
- `GET /api/v1/me/orders/sell`
- `PATCH /api/v1/orders/:id/cancel`
- `PATCH /api/v1/orders/:id/ship`
- `PATCH /api/v1/orders/:id/confirm-receipt`

### 4.7 `reviews`
- `POST /api/v1/orders/:id/review`
- `GET /api/v1/products/:id/reviews`
- `GET /api/v1/users/:id/reviews`

### 4.8 `admin`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/products`
- `PATCH /api/v1/admin/products/:id/review`
- `GET /api/v1/admin/orders`
- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PUT /api/v1/admin/categories/:id`

---

## 5. 第一阶段数据库核心表

- `users`
- `user_profiles`
- `user_addresses`
- `categories`
- `category_i18n`
- `products`
- `product_images`
- `favorites`
- `orders`
- `order_items`
- `shipments`
- `reviews`
- `admin_users`

---

## 6. 第一阶段技术落地顺序

### 阶段 A：基础工程
- 初始化 `apps/web`
- 初始化 `services/api`
- 初始化共享包与工作区配置

### 阶段 B：服务端基础能力
- 配置系统
- MySQL / Redis 接入
- 日志 / 中间件 / 统一响应
- JWT 鉴权

### 阶段 C：用户与商品
- 用户注册登录
- 分类接口
- 商品发布、列表、详情

### 阶段 D：订单闭环
- 收藏
- 下单
- 发货
- 确认收货
- 评价

### 阶段 E：Web 页面实现
- 首页
- 登录注册
- 商品列表/详情
- 发布商品
- 订单页
- 设置页
- 国际化切换

### 阶段 F：后台与联调
- 后台商品审核
- 后台分类管理
- 联调与测试

---

## 7. 当前执行建议

当前建议立即开始：

1. 初始化工作区配置
2. 初始化 `Next.js Web` 项目
3. 初始化 `Go API` 项目
4. 补一版基础环境变量模板
5. 再进入数据库与接口实现

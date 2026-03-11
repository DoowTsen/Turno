# Turno 数据库设计（V1 / 第一阶段）

> 数据库：MySQL 5.7
> 目标：支撑 Web 端 MVP 的用户、商品、收藏、订单、评价闭环

## 核心表

- `users`
- `user_addresses`
- `categories`
- `category_i18n`
- `products`
- `product_images`
- `favorites`
- `orders`
- `shipments`
- `reviews`

## 状态约定

### users.status
- `active`
- `disabled`

### users.role
- `user`
- `admin`

### products.status
- `draft`
- `active`
- `sold`
- `off_shelf`

### orders.status
- `pending_payment`
- `paid`
- `shipped`
- `completed`
- `cancelled`

## 索引重点

- `users.email`
- `users.phone`
- `categories.parent_id`
- `category_i18n(category_id, language)`
- `products(category_id, status, created_at)`
- `products(seller_id, status)`
- `favorites(user_id, product_id)`
- `orders(order_no)`
- `orders(buyer_id, status)`
- `orders(seller_id, status)`
- `reviews(product_id)`
- `reviews(reviewee_id)`

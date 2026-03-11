# Turno 项目结构设计

> 目标：支持 `Web` 先行开发，并为后续的 `Mobile App`、`Mini Program`、后台管理端、Go 后端服务保留清晰扩展空间。

## 1. 推荐总体方案

建议采用 **Monorepo** 结构：`Turno/` 作为实际工作区根目录。

- 前端多端项目放在 `apps/`
- 可复用能力放在 `packages/`
- Go 后端放在 `services/`
- 数据库脚本、Docker、Nginx 等基础设施放在 `infra/`
- 文档统一放在 `docs/`

这样做的好处：

- Web、App、小程序可以共享一部分类型、接口 SDK、国际化、业务常量
- Go 后端可以独立演进，不受前端工程影响
- 后续增加后台管理端、worker、定时任务、风控服务时不会乱
- 对多人协作、CI/CD、部署都更友好

---

## 2. 推荐目录结构

```text
Turno/
├─ apps/
│  ├─ web/                  # Web 用户端（当前优先开发）
│  ├─ mobile/               # 未来移动端 App（建议 React Native / Expo）
│  └─ miniapp/              # 未来小程序端（建议 Taro React）
├─ services/
│  └─ api/                  # Go 后端主服务
│     ├─ cmd/
│     │  ├─ api/            # HTTP API 入口
│     │  └─ worker/         # 异步任务/队列消费者入口
│     ├─ internal/          # 服务内部业务代码
│     └─ pkg/               # 可复用的公共 Go 包
├─ packages/
│  ├─ api-sdk/              # 前端统一接口封装
│  ├─ business/             # 前端共享业务逻辑
│  ├─ constants/            # 常量、枚举、路由名、状态码映射
│  ├─ i18n/                 # 国际化语言包与工具
│  ├─ types/                # TS 类型定义
│  ├─ ui-web/               # Web 端共享 UI 组件（基于 shadcn/ui）
│  ├─ ui-mobile/            # 移动端/小程序可复用 UI 抽象（后续）
│  └─ utils/                # 工具函数
├─ docs/
│  ├─ api/                  # API 文档
│  ├─ architecture/         # 架构设计文档
│  └─ db/                   # 表结构、ER 图、迁移说明
├─ infra/
│  ├─ docker/               # Docker / Compose 配置
│  ├─ nginx/                # Nginx 配置
│  └─ sql/                  # 初始化 SQL / 手工脚本
├─ scripts/                 # 开发、构建、部署辅助脚本
└─ Turno/
   ├─ Turno-竞品调研与产品开发说明书.md
   └─ Turno-项目结构设计.md
```

---

> 说明：下文提到的 `apps/`、`services/`、`packages/` 等路径，均相对于 `Turno/` 目录。

## 3. 各目录职责说明

### 3.1 `apps/`

#### `apps/web`
当前主开发项目，建议使用：

- `Next.js`
- `React`
- `TypeScript`
- `shadcn/ui`
- `Tailwind CSS`

推荐内部结构：

```text
apps/web/
├─ src/
│  ├─ app/                  # Next.js App Router
│  ├─ components/           # 页面级组件
│  ├─ features/             # 按业务域组织，如 auth/product/order/chat
│  ├─ hooks/
│  ├─ lib/
│  ├─ services/
│  ├─ store/
│  ├─ styles/
│  └─ middleware/
├─ public/
└─ tests/
```

#### `apps/mobile`
预留给未来 App，建议后续使用：

- `React Native`
- `Expo`
- `TypeScript`

说明：
- 因为你当前 Web 已确定 `React + shadcn/ui`
- 后续 App 继续用 React 技术栈，团队切换成本最低
- 业务逻辑、接口 SDK、类型、国际化都能继续复用

#### `apps/miniapp`
预留给未来微信小程序，建议后续使用：

- `Taro React`
- `TypeScript`

说明：
- Taro 对 React 开发者更友好
- 可一定程度复用 `packages/` 中的业务逻辑、类型、接口层
- 小程序 UI 需要单独适配，不建议直接复用 Web 组件

---

### 3.2 `services/api`

Go 后端主服务，建议内部继续按“分层 + 业务域”组织。

推荐结构：

```text
services/api/
├─ cmd/
│  ├─ api/
│  │  └─ main.go
│  └─ worker/
│     └─ main.go
├─ internal/
│  ├─ app/                  # 应用初始化、依赖装配
│  ├─ config/               # 配置
│  ├─ handler/              # HTTP handler / controller
│  ├─ middleware/           # JWT、日志、限流、中间件
│  ├─ model/                # 数据库模型
│  ├─ repository/           # 数据访问层
│  ├─ service/              # 业务逻辑层
│  ├─ module/               # 按业务域拆分：auth/user/product/order/chat...
│  ├─ jobs/                 # 异步任务
│  └─ transport/            # DTO、response、request
├─ pkg/
│  ├─ logger/
│  ├─ mysql/
│  ├─ redis/
│  ├─ i18n/
│  └─ utils/
├─ go.mod
└─ go.sum
```

建议首批业务域：

- `auth`
- `user`
- `product`
- `category`
- `favorite`
- `chat`
- `order`
- `payment`
- `shipment`
- `review`
- `report`
- `admin`

---

### 3.3 `packages/`

这是多端复用的关键。

#### `packages/types`
放所有前端共享类型：

- 用户信息类型
- 商品类型
- 订单类型
- 分页返回类型
- 多语言枚举类型

#### `packages/api-sdk`
封装所有 API 请求：

- `authApi`
- `productApi`
- `orderApi`
- `chatApi`
- `adminApi`

好处：
- Web、App、小程序统一调用方式
- 后端接口变更时只需要改一层

#### `packages/i18n`
用于国际化共享：

- 语言包
- 语言枚举
- `t()` 工具封装
- 默认语言与 fallback 策略

建议结构：

```text
packages/i18n/
├─ locales/
│  ├─ zh-CN/
│  └─ en-US/
├─ index.ts
├─ keys.ts
└─ constants.ts
```

#### `packages/business`
放多端能共享的业务逻辑：

- 商品状态转换
- 订单状态文案映射
- 价格显示规则
- 风险提示规则
- 表单字段规则

#### `packages/ui-web`
专供 Web 端复用的组件层：

- 基于 `shadcn/ui` 二次封装
- 页面通用组件
- 列表、筛选器、商品卡片、状态标签等

说明：
- `shadcn/ui` 更适合 Web，不建议强行复用到小程序或 RN
- 所以 UI 共享要分平台，不要把“业务逻辑共享”和“UI 共享”混在一起

---

## 4. 为什么这样拆最适合你

结合你当前技术决策：

- 后端：`Golang`
- 数据库：`MySQL 5.7`
- 缓存：`Redis`
- 前端：`React + shadcn/ui`
- 需要国际化
- 未来要支持 `Web + App + 小程序`

最关键的原则是：

1. **后端独立**：Go 服务单独维护，不和前端工程绑死。
2. **前端多端共用业务层**：共享 `types / api-sdk / i18n / business`。
3. **UI 分平台**：Web 用 `ui-web`，移动端和小程序后续各自适配。
4. **Web 先行**：现在只需要把 `apps/web + services/api + packages/*` 跑起来就能开工。

---

## 5. 第一阶段建议实际启用的目录

虽然已经预留了多端结构，但第一阶段建议你真正开始写代码时，只启用这些：

```text
apps/web
services/api
packages/types
packages/api-sdk
packages/i18n
packages/constants
packages/utils
packages/business
packages/ui-web
infra/docker
docs/db
docs/api
```

这样不会一开始把工程搞得太重，但未来又不会推翻重来。

---

## 6. 推荐的下一步初始化顺序

### 第一步：先起 Web 项目

优先初始化：

- `apps/web`：Next.js
- `packages/ui-web`
- `packages/i18n`
- `packages/api-sdk`
- `packages/types`

### 第二步：再起 Go 后端

优先初始化：

- `services/api/go.mod`
- `cmd/api/main.go`
- `internal/config`
- `internal/handler`
- `internal/service`
- `internal/repository`
- `pkg/mysql`
- `pkg/redis`

### 第三步：补基础设施

- `infra/docker/docker-compose.yml`
- `infra/sql/init.sql`
- `docs/db/ERD.md`
- `docs/api/openapi.yaml`

---

## 7. 我给你的具体建议

如果你要兼顾“现在好开发”和“以后不推翻”，就按这个思路：

- **仓库层面**：Monorepo
- **Web**：`Next.js + shadcn/ui`
- **App**：后续 `React Native`
- **小程序**：后续 `Taro React`
- **后端**：`Golang + Gin`
- **共享层**：重点共享 `types / api-sdk / i18n / business`
- **UI 层**：按平台分别维护，不强行统一

这是对你当前阶段最稳、扩展性也最好的一种结构。





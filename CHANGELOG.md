# Changelog

本文件记录 Turno 项目的所有重要变更，格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 计划中

- 图片上传能力 & 完整商品图片流程
- 页面级 RBAC & 风控规则细化
- Docker Compose 一键部署
- 竞价 / 拍卖核心机制

## [0.1.0] - 2026-03-08

### 新增

- **用户系统**：注册、登录、JWT 鉴权、资料更新、语言偏好
- **商品模块**：发布、编辑、列表、详情、状态切换、分类树
- **交易流程**：下单、发货、确认收货、取消订单
- **互动功能**：收藏 / 取消收藏、评价提交与列表
- **聊天系统**：会话创建、消息发送、未读计数
- **通知中心**：通知列表、未读汇总、标记已读
- **售后工单**：买家申请、卖家响应、平台处理、完整时间线
- **地址管理**：新增、编辑、删除、设置默认
- **管理后台**：
  - 趋势看板 & 运营告警
  - 商品审核（批量上架 / 归档 / 驳回）
  - 用户管理（角色 / 状态筛选、批量启停）
  - 订单总览 & 售后工单管理
  - 通知模板库 & 运营推送面板
  - 首页运营配置（Hero / Banner / 精选商品）
  - 分类配置 & 操作审计日志
  - CSV 导出
- **Web 用户端**：基于 Next.js 16 + React 19 + Tailwind CSS 4
- **API 服务端**：基于 Go 1.25 + Gin + GORM
- **工程化**：Monorepo (npm Workspaces)、ESLint、Go 单元测试
- **文档**：MVP 规划、数据库设计、API 文档、贡献指南

[Unreleased]: https://github.com/your-username/Turno/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-username/Turno/releases/tag/v0.1.0

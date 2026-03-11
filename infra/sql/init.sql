CREATE DATABASE IF NOT EXISTS `turno` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `turno`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) DEFAULT NULL,
  `phone` VARCHAR(32) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `nickname` VARCHAR(64) NOT NULL,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `preferred_language` VARCHAR(16) NOT NULL DEFAULT 'zh-CN',
  `role` VARCHAR(16) NOT NULL DEFAULT 'user',
  `status` VARCHAR(16) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_phone` (`phone`),
  KEY `idx_users_role_status` (`role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_addresses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `receiver_name` VARCHAR(64) NOT NULL,
  `receiver_phone` VARCHAR(32) NOT NULL,
  `province` VARCHAR(64) NOT NULL,
  `city` VARCHAR(64) NOT NULL,
  `district` VARCHAR(64) NOT NULL,
  `detail_address` VARCHAR(255) NOT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_addresses_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` BIGINT UNSIGNED DEFAULT NULL,
  `slug` VARCHAR(128) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(16) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_slug` (`slug`),
  KEY `idx_categories_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `category_i18n` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `language` VARCHAR(16) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_i18n_category_language` (`category_id`, `language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seller_id` BIGINT UNSIGNED NOT NULL,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `price` BIGINT NOT NULL,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'CNY',
  `condition_level` VARCHAR(32) NOT NULL DEFAULT 'good',
  `city` VARCHAR(64) DEFAULT NULL,
  `shipping_fee` BIGINT NOT NULL DEFAULT 0,
  `status` VARCHAR(16) NOT NULL DEFAULT 'active',
  `view_count` BIGINT NOT NULL DEFAULT 0,
  `favorite_count` BIGINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_products_category_status_created_at` (`category_id`, `status`, `created_at`),
  KEY `idx_products_seller_status` (`seller_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `product_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_images_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `favorites` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_favorites_user_product` (`user_id`, `product_id`),
  KEY `idx_favorites_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(64) NOT NULL,
  `buyer_id` BIGINT UNSIGNED NOT NULL,
  `seller_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `total_amount` BIGINT NOT NULL,
  `shipping_fee` BIGINT NOT NULL DEFAULT 0,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'CNY',
  `status` VARCHAR(32) NOT NULL DEFAULT 'paid',
  `receiver_name` VARCHAR(64) NOT NULL,
  `receiver_phone` VARCHAR(32) NOT NULL,
  `receiver_region` VARCHAR(255) NOT NULL,
  `receiver_address` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_order_no` (`order_no`),
  KEY `idx_orders_buyer_status` (`buyer_id`, `status`),
  KEY `idx_orders_seller_status` (`seller_id`, `status`),
  KEY `idx_orders_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `shipments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `carrier` VARCHAR(64) NOT NULL,
  `tracking_no` VARCHAR(128) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'shipped',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shipments_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `reviewer_id` BIGINT UNSIGNED NOT NULL,
  `reviewee_id` BIGINT UNSIGNED NOT NULL,
  `role` VARCHAR(16) NOT NULL,
  `score` TINYINT NOT NULL,
  `content` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_product_id` (`product_id`),
  KEY `idx_reviews_reviewee_id` (`reviewee_id`),
  KEY `idx_reviews_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `buyer_id` BIGINT UNSIGNED NOT NULL,
  `seller_id` BIGINT UNSIGNED NOT NULL,
  `last_message` VARCHAR(500) DEFAULT NULL,
  `last_message_at` DATETIME DEFAULT NULL,
  `buyer_last_read_at` DATETIME DEFAULT NULL,
  `seller_last_read_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversations_product_buyer_seller` (`product_id`, `buyer_id`, `seller_id`),
  KEY `idx_conversations_buyer_id` (`buyer_id`),
  KEY `idx_conversations_seller_id` (`seller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `sender_id` BIGINT UNSIGNED NOT NULL,
  `content` VARCHAR(1000) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_conversation_id` (`conversation_id`),
  KEY `idx_messages_sender_id` (`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `after_sales` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `buyer_id` BIGINT UNSIGNED NOT NULL,
  `seller_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `type` VARCHAR(32) NOT NULL DEFAULT 'refund',
  `status` VARCHAR(32) NOT NULL DEFAULT 'open',
  `reason` VARCHAR(255) NOT NULL,
  `detail` VARCHAR(1000) DEFAULT NULL,
  `requested_amount` BIGINT NOT NULL DEFAULT 0,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'CNY',
  `resolution_note` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_after_sales_order_id` (`order_id`),
  KEY `idx_after_sales_status` (`status`),
  KEY `idx_after_sales_buyer_id` (`buyer_id`),
  KEY `idx_after_sales_seller_id` (`seller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `after_sale_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `after_sale_id` BIGINT UNSIGNED NOT NULL,
  `actor_id` BIGINT UNSIGNED DEFAULT NULL,
  `actor_role` VARCHAR(32) NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `status` VARCHAR(32) DEFAULT NULL,
  `note` VARCHAR(1000) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_after_sale_logs_after_sale_id` (`after_sale_id`),
  KEY `idx_after_sale_logs_actor_id` (`actor_id`),
  KEY `idx_after_sale_logs_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `content` VARCHAR(1000) NOT NULL,
  `link` VARCHAR(255) DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_type` (`type`),
  KEY `idx_notifications_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `notification_templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(128) NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `title_template` VARCHAR(191) NOT NULL,
  `content_template` VARCHAR(1000) NOT NULL,
  `default_link` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notification_templates_name` (`name`),
  KEY `idx_notification_templates_type` (`type`),
  KEY `idx_notification_templates_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `platform_configs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(128) NOT NULL,
  `value` TEXT NOT NULL,
  `updated_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_platform_configs_key` (`key`),
  KEY `idx_platform_configs_updated_by` (`updated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `notification_templates` (`name`, `type`, `title_template`, `content_template`, `default_link`, `status`)
VALUES
  ('平台履约提醒', 'system', '本周履约提醒已更新', '请在 24 小时内确认待发货订单，并及时回复买家咨询，保持店铺履约率稳定。', '/admin', 'active'),
  ('发货高峰公告', 'shipment', '发货高峰期服务提醒', '近期平台订单量上升，请卖家在发货后第一时间回填物流单号，减少售后争议。', '/me/orders/sell', 'active'),
  ('售后协商提示', 'after_sale', '售后协商时效提醒', '你有新的售后工单待跟进，请尽快查看协商详情并在规定时间内完成响应。', '/me/after-sales', 'active'),
  ('版本更新公告', 'campaign', 'Turno 平台体验更新说明', '我们对消息中心、通知中心和后台风控看板做了升级，欢迎登录体验最新版本。', '/me/notifications', 'active'),
  ('账号状态变更通知', 'system', '账号状态已更新', '你的 Turno 账号状态已更新为 {{status_text}}，如有疑问请联系平台客服。', '/me/settings', 'active'),
  ('商品状态更新通知', 'system', '商品状态已更新', '你的商品《{{product_title}}》状态已更新为 {{status_text}}。', '/products/{{product_id}}', 'active'),
  ('商品审核通过通知', 'system', '你的商品已通过审核', '商品《{{product_title}}》已恢复在售，可继续等待买家咨询和下单。', '/products/{{product_id}}', 'active'),
  ('商品审核驳回通知', 'system', '你的商品审核未通过', '商品《{{product_title}}》已被平台驳回，请检查描述、图片或类目后重新提交。', '/publish', 'active'),
  ('商品归档通知', 'system', '你的商品已被归档', '商品《{{product_title}}》已从公开货架移除，如需恢复请联系平台运营。', '/me/products', 'active'),
  ('售后状态更新通知', 'after_sale', '售后处理进度已更新', '订单 {{order_no}} 的售后工单已更新为 {{status_text}}，请及时查看最新处理说明。', '/me/orders/{{order_id}}', 'active')
ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `title_template` = VALUES(`title_template`),
  `content_template` = VALUES(`content_template`),
  `default_link` = VALUES(`default_link`),
  `status` = VALUES(`status`);

INSERT INTO `platform_configs` (`key`, `value`, `updated_by`)
VALUES
  ('home_page_config', JSON_OBJECT(
    'heroBadge', 'Curated by Turno Ops',
    'heroTitle', '让好东西流转，让二手交易更安心。',
    'heroDescription', '用更清晰的担保交易、精选推荐和履约体验，把二手商品做成真正值得逛的数字货架。',
    'primaryCtaText', '逛逛商品广场',
    'primaryCtaLink', '/products',
    'secondaryCtaText', '立即发布闲置',
    'secondaryCtaLink', '/publish',
    'featuredProductIds', JSON_ARRAY(3008, 3003, 3004, 3005),
    'featuredCategorySlugs', JSON_ARRAY('phones-digital', 'computers-office', 'gaming-toys'),
    'banners', JSON_ARRAY(
      JSON_OBJECT('id', 'ops-1', 'title', '春季转卖激励计划', 'subtitle', '精选数码与办公设备正在加速流转，优先推荐高成色商品。', 'link', '/products', 'tone', 'cyan'),
      JSON_OBJECT('id', 'ops-2', 'title', '优先履约卖家榜', 'subtitle', '发货快、评价高、售后少的卖家会得到首页更多曝光。', 'link', '/me/orders/sell', 'tone', 'violet'),
      JSON_OBJECT('id', 'ops-3', 'title', '平台担保升级', 'subtitle', '发货、售后、通知中心已联通，买卖双方都能看到更完整的处理进度。', 'link', '/me/notifications', 'tone', 'emerald')
    )
  ), NULL),
  ('action_notification_bindings', JSON_OBJECT(
    'user.status.updated', JSON_OBJECT('templateId', NULL, 'fallbackNames', JSON_ARRAY('账号状态变更通知')),
    'product.status.updated', JSON_OBJECT('templateId', NULL, 'fallbackNames', JSON_ARRAY('商品状态更新通知')),
    'after_sale.status.updated', JSON_OBJECT('templateId', NULL, 'fallbackNames', JSON_ARRAY('售后状态更新通知', '售后协商提示'))
  ), NULL)
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `updated_by` = VALUES(`updated_by`);


CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_id` BIGINT UNSIGNED NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `target_type` VARCHAR(64) NOT NULL,
  `target_id` BIGINT UNSIGNED NOT NULL,
  `target_label` VARCHAR(191) DEFAULT NULL,
  `detail` VARCHAR(1000) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_audit_logs_actor_id` (`actor_id`),
  KEY `idx_admin_audit_logs_action` (`action`),
  KEY `idx_admin_audit_logs_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

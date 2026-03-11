# Development Progress

[简体中文](./progress.md)

> The following progress estimates are based on the current repository state and existing documentation.

## Module Progress

| Module | Status | Progress | Notes |
|--------|--------|----------|-------|
| Product planning & docs | Continuously updated | 96% | MVP plan, schema, README, and phase documents are aligned |
| Database design & init | Expanded over multiple iterations | 95% | `init.sql` covers trade, after-sales, notifications, audit, and platform config |
| Web client | Most MVP features completed | 96% | Login, products, favorites, orders, reviews, chat, notifications, and after-sales are usable |
| Admin console | Internal-test ready | 95% | Dashboard, moderation, after-sales, notification ops, homepage ops, exports, and audit logs |
| API core transaction flow | Most MVP features completed | 96% | Auth / Product / Favorite / Order / Review / Chat / AfterSale / Admin implemented |
| Web-to-API integration | Largely completed | 92% | Major frontend and admin flows consume real APIs |
| Testing & engineering | First round completed | 75% | Key Go tests in place, deeper risk and integration tests can be added |
| Bidding / auction flow | Planned | 5% | Repository focuses on second-hand trading; auctions not yet implemented |

## Feature Details

### Web Client

- ✅ Home page with admin-managed Hero / Banner / Featured product slots
- ✅ Login page
- ✅ Product list page
- ✅ Product detail page
- ✅ Publish product page
- ✅ Favorites page
- ✅ Buyer orders / Seller orders / Order detail pages
- ✅ Address management page
- ✅ My after-sales page
- ✅ Messages & notification center
- ✅ Settings page with language switching

### Admin Console

- ✅ Dashboard: trends, alert cards, risky orders, risky sellers/buyers
- ✅ Product moderation: advanced filters, batch approve/archive/reject, quick jumps
- ✅ User management: role/status filters, batch enable/suspend, quick jumps
- ✅ Order management: amount/date/after-sale/delayed filters, detail drawer, CSV export
- ✅ After-sales management: status flow, batch operations, unified timeline, CSV export
- ✅ Notification operations: template library, campaign sender, action-template bindings
- ✅ Homepage operations: Hero, CTA, Banner, featured product configuration
- ✅ Category management & admin audit logs

### API Service

- ✅ Health check
- ✅ User registration / login / current user
- ✅ Profile update / language preference
- ✅ Address management
- ✅ Category tree query
- ✅ Product CRUD / status update / my products
- ✅ Favorite / unfavorite / favorite list
- ✅ Order create / detail / buyer orders / seller orders
- ✅ Cancel / ship / confirm receipt
- ✅ Review submit / product review list
- ✅ Chat conversations / messaging / unread counts
- ✅ Notification center / unread summary / mark-as-read
- ✅ After-sale request / seller response / my after-sales / platform workflow
- ✅ Admin overview / trends / alerts / risk insights / exports / audit logs / site operations

### Technical Highlights

- Clear separation between Web and API layers
- Core backend stack: MySQL + Redis + JWT
- SQL schema, seed data, and local product assets included
- Homepage operations, notification templates, and action-template bindings supported
- Basic Go unit tests covering home config, template binding, and batch processing
- MVP plan and phase-1 API documentation included
- Room for App/Miniapp clients, deeper admin workflows, and auction features

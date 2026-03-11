# Contributing to Turno

[简体中文](./CONTRIBUTING.md)

Thanks for contributing to Turno.

The project is still in the first MVP stage, and the most valuable contribution areas currently include:

- Real Web-to-API integration
- Product image upload and display flow
- Address management and review system
- Admin capabilities
- Bidding / auction feature design and implementation

## Prerequisites

Please make sure your local environment includes:

- `Node.js >= 24.0.0`
- `Go >= 1.25.0`
- `MySQL 5.7`
- `Redis 7.x`

For startup steps, see: `README.en.md`

## Recommended Workflow

1. Fork the repository and clone it locally
2. Create a feature branch such as `feat/product-upload` or `fix/order-status`
3. Start the project environment following the README
4. Keep your changes focused and minimal
5. Manually verify the main flow
6. Update related documentation
7. Open a PR

## Before You Submit

Before opening a PR, please check at least the following:

- The Web app starts successfully
- The API service starts successfully
- The core flow is still working: login, publish product, favorite, create order, ship, confirm receipt
- README, API docs, and config notes remain aligned with the implementation

If your changes affect database schema, APIs, or major page flows, please include in the PR description:

- What changed
- Scope of impact
- Whether config changes are required
- Whether database changes are required
- How to verify the change

## Code and Documentation Guidelines

- Prefer fixing root causes instead of surface patches
- Keep changes small and easy to review
- Update the relevant documentation when adding features
- If README information becomes outdated, update it as part of the same change

## Issue and PR Suggestions

### Bug Reports

Please include:

- Reproduction steps
- Expected result
- Actual result
- Logs or screenshots
- Local environment details

### Feature Requests

Please explain:

- What problem it solves
- Who it is for
- Expected UI or API changes
- Whether it belongs to the MVP scope

### Pull Requests

Please keep one PR focused on one main topic whenever possible to make review easier.

## High-Value Contribution Areas

- Replace frontend mock data with real API integration
- Improve product upload and image handling
- Strengthen order state transition validation
- Complete address management and review features
- Build the first version of the admin panel

Thanks again for your contribution.

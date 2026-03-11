# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | ✅ Yes             |

## Reporting a Vulnerability

If you discover a security vulnerability in Turno, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities.
2. Send an email to: **[your-email@example.com]** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within **48 hours**.
- **Assessment**: We will assess the vulnerability and provide an initial response within **7 days**.
- **Resolution**: We aim to release a fix within **30 days** of confirmation.
- **Credit**: We will credit you in the release notes (unless you prefer to remain anonymous).

### Scope

The following are in scope:

- Authentication & authorization bypass
- SQL injection / NoSQL injection
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Remote code execution
- Sensitive data exposure
- Server-side request forgery (SSRF)

### Out of Scope

- Vulnerabilities in dependencies (please report to the respective projects)
- Social engineering attacks
- Denial of service (DoS) attacks
- Issues in development/test environments only

## Security Best Practices

When contributing to Turno, please follow these guidelines:

- Never commit secrets, API keys, or passwords
- Use parameterized queries to prevent SQL injection
- Validate and sanitize all user inputs
- Keep dependencies up to date
- Use HTTPS in production environments

Thank you for helping keep Turno secure! 🔒

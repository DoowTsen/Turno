# AI Development Notes

[简体中文](./ai-development.md)

This document records the AI toolchain, collaboration approach, and lessons learned during the development of Turno.

## AI Model

- **Primary model**: `gpt-5.4`
- **Workflow**: Used via `Codex CLI` to assist with task breakdown, code generation, structure cleanup, documentation, and development collaboration

## MCP (Model Context Protocol)

The current development environment integrates the following MCP servers:

| MCP Server | Purpose |
|------------|---------|
| `mcp-mysql-server` | Inspect and operate MySQL data |
| `chrome-devtools` | Browser debugging and frontend inspection |
| `shadcn` | UI component lookup and integration |
| `pencil` | Design and layout related work |

## Skills

Skills used or available in this project:

| Skill | Description |
|-------|-------------|
| `ps-utf8-io` | Safe UTF-8 file I/O on Windows PowerShell |
| `frontend-design` | UI polishing for homepage, product pages, and dashboard |
| `collaborating-with-gemini` | Multi-model review and prototyping |

## Time Spent

- Rough estimate based on source code and documentation modification span: **~18 hours**
- Estimated time range: **2026-03-07 23:26** to **2026-03-08 17:17**
- This reflects the stage output span rather than strictly tracked coding hours

## AI's Role

AI served as a "development accelerator" in this project, primarily helping with:

- **Requirement clarification & MVP scope control** — Turning vague ideas into actionable feature lists
- **Page & API scaffolding** — Rapidly generating component structures and API endpoints
- **Database & API documentation drafting** — Automated documentation generation and updates
- **README, config notes & workflow documentation** — Keeping documentation in sync with code

## Lessons Learned

1. **AI excels at**: Structured code generation, boilerplate, documentation, task breakdown
2. **Human oversight needed for**: Architecture decisions, business logic details, edge case handling, code quality review
3. **Best practice**: AI drafts → Human review & correction → Iterative refinement

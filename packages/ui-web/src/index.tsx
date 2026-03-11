import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <div style={{ maxWidth: 1120, margin: "0 auto", padding: "24px" }}>{children}</div>;
}

export function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 24 }}>{title}</h2>
      {description ? <p style={{ marginTop: 0, color: "#64748b" }}>{description}</p> : null}
      {children}
    </section>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        background: "#ecfeff",
        color: "#0f766e",
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

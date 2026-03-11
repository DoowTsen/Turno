"use client";

import type { AfterSale, AfterSaleLog } from "@turno/types";
import { Badge } from "@/components/ui/badge";
import { afterSaleStageIndex, afterSaleStatusGuide, afterSaleStatusText, afterSaleSteps } from "@/components/after-sale/after-sale-meta";

function formatDateTime(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AfterSaleTimeline({ item }: { item: AfterSale }) {
  const guide = afterSaleStatusGuide(item);
  const stageIndex = afterSaleStageIndex(item.status);
  const events = buildTimelineEvents(item, guide.description);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge className="bg-white/10 text-white ring-1 ring-white/10">进度概览</Badge>
          <span className="text-sm text-white/55">{guide.title}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {afterSaleSteps.map((step, index) => {
            const active = index <= stageIndex;
            return (
              <div key={step} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                <div className={`absolute inset-y-0 left-0 w-1 ${active ? "bg-primary" : "bg-white/10"}`} />
                <div className="pl-2">
                  <div className={`text-xs ${active ? "text-primary" : "text-white/35"}`}>STEP {index + 1}</div>
                  <div className={`mt-1 text-sm font-medium ${active ? "text-white" : "text-white/55"}`}>{step}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="relative pl-8">
            {index < events.length - 1 ? <div className="absolute left-[9px] top-7 h-[calc(100%-10px)] w-px bg-white/10" /> : null}
            <div className="absolute left-0 top-1.5 h-5 w-5 rounded-full border border-white/10 bg-slate-950 shadow-[0_0_0_4px_rgba(255,255,255,0.03)]" />
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`ring-1 ${event.tone}`}>{event.title}</Badge>
                <span className="text-xs text-white/45">{formatDateTime(event.time)}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/70">{event.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildTimelineEvents(item: AfterSale, fallbackDescription: string) {
  if (item.logs?.length) {
    return item.logs.map((log, index) => ({
      id: `${log.id}-${index}`,
      title: timelineTitle(log),
      time: log.createdAt,
      content: log.note,
      tone: timelineTone(log),
    }));
  }

  return [
    {
      id: "created",
      title: "买家发起售后",
      time: item.createdAt,
      content: item.detail ?? item.reason,
      tone: "bg-amber-400/15 text-amber-100 ring-amber-300/20",
    },
    item.sellerResponseNote
      ? {
          id: "seller",
          title: "卖家已响应",
          time: item.sellerRespondedAt ?? item.updatedAt,
          content: item.sellerResponseNote,
          tone: "bg-violet-400/15 text-violet-100 ring-violet-300/20",
        }
      : null,
    item.resolutionNote
      ? {
          id: "platform",
          title: item.status === "approved" || item.status === "refunded" ? "平台执行结果" : "平台处理备注",
          time: item.updatedAt,
          content: item.resolutionNote,
          tone: "bg-cyan-400/15 text-cyan-100 ring-cyan-300/20",
        }
      : null,
    {
      id: "status",
      title: `当前状态：${afterSaleStatusText(item.status)}`,
      time: item.updatedAt,
      content: fallbackDescription,
      tone: "bg-emerald-400/15 text-emerald-100 ring-emerald-300/20",
    },
  ].filter(Boolean) as Array<{ id: string; title: string; time?: string; content: string; tone: string }>;
}

function timelineTitle(log: AfterSaleLog) {
  switch (log.action) {
    case "created":
      return `${log.actorLabel}发起售后`;
    case "seller_response":
      return `${log.actorLabel}已响应`;
    case "admin_status_update":
      return `${log.actorLabel}更新工单状态`;
    default:
      return `${log.actorLabel}更新了工单`;
  }
}

function timelineTone(log: AfterSaleLog) {
  switch (log.actorRole) {
    case "buyer":
      return "bg-amber-400/15 text-amber-100 ring-amber-300/20";
    case "seller":
      return "bg-violet-400/15 text-violet-100 ring-violet-300/20";
    case "admin":
      return "bg-cyan-400/15 text-cyan-100 ring-cyan-300/20";
    default:
      return "bg-emerald-400/15 text-emerald-100 ring-emerald-300/20";
  }
}

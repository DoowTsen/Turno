import type { AfterSale } from "@turno/types";

export const afterSaleSteps = ["提交申请", "商家响应", "平台处理中", "处理完成"] as const;

export function afterSaleStatusText(status: string) {
  switch (status) {
    case "open": return "待处理";
    case "processing": return "处理中";
    case "approved": return "已同意";
    case "rejected": return "已驳回";
    case "refunded": return "已退款";
    case "closed": return "已关闭";
    default: return status;
  }
}

export function afterSaleTypeText(type: string) {
  switch (type) {
    case "refund": return "整单退款";
    case "refund_partial": return "部分退款";
    case "return_refund": return "退货退款";
    case "exchange": return "换货";
    default: return type;
  }
}

export function afterSaleStatusTone(status: string) {
  switch (status) {
    case "open": return "bg-amber-400/15 text-amber-100 ring-amber-300/25";
    case "processing": return "bg-violet-400/15 text-violet-100 ring-violet-300/25";
    case "approved": return "bg-cyan-400/15 text-cyan-100 ring-cyan-300/25";
    case "refunded": return "bg-emerald-400/15 text-emerald-100 ring-emerald-300/25";
    case "rejected": return "bg-rose-400/15 text-rose-100 ring-rose-300/25";
    case "closed": return "bg-slate-400/15 text-slate-100 ring-slate-300/25";
    default: return "bg-white/10 text-white/75 ring-white/10";
  }
}

export function afterSaleStageIndex(status: string) {
  switch (status) {
    case "open": return 0;
    case "processing": return 1;
    case "approved": return 2;
    case "rejected": return 2;
    case "refunded": return 3;
    case "closed": return 3;
    default: return 0;
  }
}

export function afterSaleStatusGuide(item: AfterSale) {
  switch (item.status) {
    case "open":
      return {
        title: item.viewerRole === "seller" ? "等待你给出处理方案" : "售后已提交，等待卖家查看",
        description: item.viewerRole === "seller"
          ? "建议尽快说明你的处理意向，先回复可显著提升成交满意度。"
          : "平台已记录你的申请，卖家或平台客服会尽快跟进。",
      };
    case "processing":
      return {
        title: item.viewerRole === "seller" ? "你已进入处理中阶段" : "双方正在协商处理中",
        description: item.viewerRole === "seller"
          ? "继续补充证据或处理方案，必要时可等待平台介入。"
          : "请留意卖家回复与平台备注，当前工单仍在推进。",
      };
    case "approved":
      return {
        title: "平台已同意当前方案",
        description: "一般接下来会进入退款执行或退货安排阶段，请留意账户和订单更新。",
      };
    case "refunded":
      return {
        title: "退款流程已完成",
        description: "如退款尚未到账，通常是支付渠道处理时延，可稍后查看原支付账户。",
      };
    case "rejected":
      return {
        title: "当前申请已被驳回",
        description: "如果你还有补充证据，可以通过聊天或平台客服继续沟通。",
      };
    case "closed":
      return {
        title: "本次售后已关闭",
        description: "表示双方已协商结束或平台已结束处理，本工单不再继续推进。",
      };
    default:
      return {
        title: `当前状态：${afterSaleStatusText(item.status)}`,
        description: "系统会根据卖家响应、协商过程与平台介入情况持续更新进度。",
      };
  }
}

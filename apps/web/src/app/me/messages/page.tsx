"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, MessageCircleMore, SendHorizonal } from "lucide-react";
import { listConversations, listMessages, sendMessage } from "@turno/api-sdk";
import type { Conversation, Message } from "@turno/types";
import { useAuth } from "@/providers/auth-provider";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function formatDateTime(value?: string) {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const { accessToken, isAuthenticated, isLoading, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    const timer = window.setInterval(() => {
      setRefreshTick((current) => current + 1);
    }, 6000);

    return () => {
      window.clearInterval(timer);
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated || !accessToken) {
      setPageLoading(false);
      return;
    }

    const token = accessToken;
    let mounted = true;

    async function loadConversations() {
      if (conversations.length === 0) {
        setPageLoading(true);
      }
      setError(null);
      try {
        const items = await listConversations(token);
        if (!mounted) {
          return;
        }
        setConversations(items);
        const preferred = Number(searchParams.get("conversation"));
        setActiveId((current) => {
          if (current && items.some((item) => item.id === current)) {
            return current;
          }
          if (preferred && items.some((item) => item.id === preferred)) {
            return preferred;
          }
          return items[0]?.id ?? null;
        });
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "会话加载失败");
        }
      } finally {
        if (mounted) {
          setPageLoading(false);
        }
      }
    }

    void loadConversations();
    return () => {
      mounted = false;
    };
  }, [accessToken, conversations.length, isAuthenticated, isLoading, refreshTick, searchParams]);

  useEffect(() => {
    if (!accessToken || !activeId) {
      setMessages([]);
      return;
    }

    const token = accessToken;
    const conversationId = activeId;
    let mounted = true;

    async function loadMessages() {
      setMessageLoading(true);
      setError(null);
      try {
        const items = await listMessages(conversationId, token);
        if (mounted) {
          setMessages(items);
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
            ),
          );
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "消息加载失败");
        }
      } finally {
        if (mounted) {
          setMessageLoading(false);
        }
      }
    }

    void loadMessages();
    return () => {
      mounted = false;
    };
  }, [accessToken, activeId, refreshTick]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [activeId, conversations],
  );

  async function handleSend() {
    if (!accessToken || !activeId || !content.trim()) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      const created = await sendMessage(activeId, { content }, accessToken);
      setMessages((current) => [...current, created]);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeId
            ? {
                ...conversation,
                lastMessage: created.content,
                lastMessageAt: created.createdAt,
                unreadCount: 0,
              }
            : conversation,
        ),
      );
      setContent("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "发送消息失败");
    } finally {
      setSending(false);
    }
  }

  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
        <CardHeader>
          <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
            Messages
          </Badge>
          <CardTitle className="text-3xl font-bold text-white">消息中心</CardTitle>
          <CardDescription className="text-white/55">
            已支持会话列表、未读提醒与自动刷新，后续可继续扩展实时推送与已读回执。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
          {!isAuthenticated && !isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">
              请先登录后查看消息。
            </div>
          ) : null}
          {pageLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">
              <LoaderCircle className="size-4 animate-spin" />
              正在加载会话...
            </div>
          ) : null}
          {!pageLoading && isAuthenticated ? (
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="space-y-3">
                {conversations.length === 0 ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-white/60">
                    还没有会话，去商品详情页点击“联系卖家”开始交流吧。
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setActiveId(conversation.id)}
                      className={`w-full rounded-[24px] border p-4 text-left transition ${
                        activeId === conversation.id
                          ? "border-primary/40 bg-primary/10"
                          : "border-white/10 bg-black/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white">{conversation.peerNickname}</p>
                            {conversation.unreadCount > 0 ? (
                              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-slate-950">
                                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-white/45">{conversation.productTitle}</p>
                        </div>
                        <span className="text-xs text-white/35">
                          {formatDateTime(conversation.lastMessageAt || conversation.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-white/60">
                        {conversation.lastMessage || "刚创建的会话，开始打个招呼吧。"}
                      </p>
                    </button>
                  ))
                )}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                {activeConversation ? (
                  <>
                    <div className="border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-white">{activeConversation.peerNickname}</p>
                        {messageLoading ? <LoaderCircle className="size-4 animate-spin text-white/45" /> : null}
                      </div>
                      <p className="mt-1 text-sm text-white/45">
                        围绕商品《{activeConversation.productTitle}》的会话
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {!messageLoading && messages.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
                          还没有消息，先发一句问候吧。
                        </div>
                      ) : null}
                      {messages.map((message) => {
                        const mine = message.senderId === user?.id;
                        return (
                          <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[75%] rounded-[22px] px-4 py-3 ${
                                mine ? "bg-primary text-slate-950" : "bg-white/[0.05] text-white"
                              }`}
                            >
                              <p className={`text-xs ${mine ? "text-slate-800/70" : "text-white/45"}`}>
                                {message.senderNickname} · {formatDateTime(message.createdAt)}
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-5 grid gap-3">
                      <Textarea
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        rows={4}
                        placeholder="输入你想和卖家/买家沟通的内容，例如：能否提供更多细节图？是否支持周末自提？"
                        className="rounded-[22px] border-white/10 bg-white/[0.03] text-white placeholder:text-white/30"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={() => void handleSend()}
                          disabled={sending || !content.trim()}
                          className="rounded-full"
                        >
                          {sending ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <SendHorizonal className="size-4" />
                          )}
                          发送消息
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center text-white/55">
                    <MessageCircleMore className="size-10 text-primary" />
                    <p className="text-lg font-semibold text-white">还没有选择会话</p>
                    <p className="max-w-md text-sm leading-7">
                      从左侧选择一个已有会话，或从商品详情页点击“联系卖家”创建新的对话。
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}

function MessagesPageFallback() {
  return (
    <PageShell className="space-y-8 pb-14 pt-8">
      <Card className="glass-panel rounded-[34px] border border-white/10 bg-white/[0.04]">
        <CardContent className="flex min-h-[280px] items-center justify-center gap-3 text-sm text-white/60">
          <LoaderCircle className="size-4 animate-spin" />
          正在初始化消息中心...
        </CardContent>
      </Card>
    </PageShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesPageFallback />}>
      <MessagesPageContent />
    </Suspense>
  );
}

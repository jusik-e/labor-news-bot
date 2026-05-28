"use client";

import { useState, useRef, useEffect } from "react";

type NewsItem = { summary: string; source?: string; url?: string; category?: string };
type NewsBrief = {
  type: "news_brief";
  intro: string;
  union: NewsItem[];
  employer: NewsItem[];
  government: NewsItem[];
  court: NewsItem[];
};
type WeeklyBrief = {
  type: "weekly_brief";
  intro: string;
  items: NewsItem[];
};
type TextResponse = { type: "text"; content: string };
type ParsedResponse = NewsBrief | WeeklyBrief | TextResponse;

type Message = {
  id: string;
  role: "user" | "assistant";
  raw: string;
  parsed?: ParsedResponse;
  isLoading?: boolean;
  mode?: "daily" | "weekly";
};

const DAILY_CATS = [
  { key: "union" as const, label: "노조", icon: "👥", borderColor: "border-blue-200", headerBg: "bg-blue-50 text-blue-800", itemBg: "bg-blue-50/40" },
  { key: "employer" as const, label: "사용자", icon: "🏭", borderColor: "border-green-200", headerBg: "bg-green-50 text-green-800", itemBg: "bg-green-50/40" },
  { key: "government" as const, label: "정부", icon: "🏛️", borderColor: "border-amber-200", headerBg: "bg-amber-50 text-amber-800", itemBg: "bg-amber-50/40" },
  { key: "court" as const, label: "법원", icon: "⚖️", borderColor: "border-red-200", headerBg: "bg-red-50 text-red-800", itemBg: "bg-red-50/40" },
];

const CAT_STYLE: Record<string, { label: string; icon: string; badge: string }> = {
  union:      { label: "노조",   icon: "👥", badge: "bg-blue-100 text-blue-700" },
  employer:   { label: "사용자", icon: "🏭", badge: "bg-green-100 text-green-700" },
  government: { label: "정부",   icon: "🏛️", badge: "bg-amber-100 text-amber-700" },
  court:      { label: "법원",   icon: "⚖️", badge: "bg-red-100 text-red-700" },
};

function LinkBtn({ url }: { url?: string }) {
  if (!url) return <span className="text-xs text-gray-300">링크 없음</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
    >
      원문 보기
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  );
}

function NewsItemRow({ item, itemBg }: { item: NewsItem; itemBg: string }) {
  return (
    <div className={`px-4 py-3 border-b border-gray-100 last:border-0 ${itemBg}`}>
      <p className="text-sm text-gray-800 leading-relaxed mb-2">{item.summary}</p>
      <div className="flex items-center justify-between">
        {item.source
          ? <span className="text-xs text-gray-400">{item.source}</span>
          : <span />}
        <LinkBtn url={item.url} />
      </div>
    </div>
  );
}

function DailyBriefView({ data }: { data: NewsBrief }) {
  return (
    <div className="space-y-3 mt-2">
      {DAILY_CATS.map((cat) => {
        const items = data[cat.key] ?? [];
        if (!items.length) return null;
        return (
          <div key={cat.key} className={`rounded-xl border ${cat.borderColor} overflow-hidden`}>
            <div className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${cat.headerBg}`}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="ml-auto text-xs opacity-60">{items.length}건</span>
            </div>
            <div className="bg-white">
              {items.map((item, i) => (
                <NewsItemRow key={i} item={item} itemBg={cat.itemBg} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyBriefView({ data }: { data: WeeklyBrief }) {
  return (
    <div className="space-y-3 mt-2">
      {data.items.map((item, i) => {
        const style = CAT_STYLE[item.category ?? ""] ?? CAT_STYLE.union;
        return (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${style.badge}`}>
                {style.icon} {style.label}
              </span>
              <p className="text-sm text-gray-800 leading-relaxed mb-2">{item.summary}</p>
              <div className="flex items-center justify-between">
                {item.source
                  ? <span className="text-xs text-gray-400">{item.source}</span>
                  : <span />}
                <LinkBtn url={item.url} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-xs text-sm leading-relaxed shadow-sm">
          {msg.raw}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start w-full">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed shadow-sm w-full">
        {msg.isLoading ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-gray-400 dot-1 inline-block" />
            <span className="w-2 h-2 rounded-full bg-gray-400 dot-2 inline-block" />
            <span className="w-2 h-2 rounded-full bg-gray-400 dot-3 inline-block" />
          </div>
        ) : msg.parsed?.type === "news_brief" ? (
          <>
            <p className="text-gray-600 mb-2 text-xs">{msg.parsed.intro}</p>
            <DailyBriefView data={msg.parsed} />
          </>
        ) : msg.parsed?.type === "weekly_brief" ? (
          <>
            <p className="text-gray-600 mb-2 text-xs">{msg.parsed.intro}</p>
            <WeeklyBriefView data={msg.parsed} />
          </>
        ) : msg.parsed?.type === "text" ? (
          <p className="text-gray-700 whitespace-pre-wrap">{msg.parsed.content}</p>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">{msg.raw}</p>
        )}
      </div>
    </div>
  );
}

function parseResponse(raw: string): ParsedResponse | undefined {
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return undefined;
  }
}

type Tab = "daily" | "weekly";

export default function Home() {
  const [tab, setTab] = useState<Tab>("daily");
  const [dailyMsgs, setDailyMsgs] = useState<Message[]>([
    { id: "welcome-d", role: "assistant", raw: "", parsed: { type: "text", content: "오늘의 주요 노동뉴스를 노조 · 사용자 · 정부 · 법원으로 분류해 요약과 원문 링크와 함께 제공합니다." } },
  ]);
  const [weeklyMsgs, setWeeklyMsgs] = useState<Message[]>([
    { id: "welcome-w", role: "assistant", raw: "", parsed: { type: "text", content: "이번 주 가장 중요한 노동뉴스 6~10건을 중요도 순으로 정리해 드립니다." } },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = tab === "daily" ? dailyMsgs : weeklyMsgs;
  const setMessages = tab === "daily" ? setDailyMsgs : setWeeklyMsgs;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const QUICK: Record<Tab, { label: string; query: string }[]> = {
    daily: [
      { label: "📰 오늘 브리핑", query: "오늘의 노동뉴스 브리핑해줘" },
      { label: "👥 노조", query: "최근 노조 관련 뉴스만 알려줘" },
      { label: "🏛️ 정부", query: "최근 노동 관련 정부 정책 뉴스 알려줘" },
      { label: "⚖️ 법원", query: "최근 노동 관련 법원 판결 뉴스 알려줘" },
    ],
    weekly: [
      { label: "📋 이번 주 브리핑", query: "이번 주 주요 노동뉴스 브리핑해줘" },
      { label: "👥 이번 주 노조", query: "이번 주 노조 관련 뉴스 정리해줘" },
      { label: "🏛️ 이번 주 정부", query: "이번 주 정부 노동정책 뉴스 정리해줘" },
    ],
  };

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: Message = { id: Date.now().toString(), role: "user", raw: text, mode: tab };
    const loadingMsg: Message = { id: "loading", role: "assistant", raw: "", isLoading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    const apiMsgs = messages
      .filter((m) => !m.id.startsWith("welcome") && !m.isLoading && m.raw)
      .map((m) => ({ role: m.role, content: m.raw }));

    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...apiMsgs, { role: "user", content: text }],
          mode: tab,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "서버 오류");

      const raw: string = data.content;
      const parsed = parseResponse(raw);
      const botMsg: Message = { id: Date.now() + "_bot", role: "assistant", raw, parsed, mode: tab };
      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(botMsg));
    } catch (err: any) {
      const errMsg: Message = {
        id: Date.now() + "_err", role: "assistant", raw: `⚠️ 오류: ${err.message}`,
        parsed: { type: "text", content: `⚠️ 오류: ${err.message}` },
      };
      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(errMsg));
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#f8f7f4]">
      {/* 헤더 */}
      <header className="w-full max-w-2xl px-4 pt-6 pb-3">
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">📰</div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">노동뉴스 비서</h1>
            <p className="text-xs text-gray-500 mt-0.5">노조 · 사용자 · 정부 · 법원 — 요약 및 원문 링크 제공</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            실시간
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className="w-full max-w-2xl px-4 mb-1">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setTab("daily")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "daily" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            📅 오늘의 뉴스
          </button>
          <button
            onClick={() => setTab("weekly")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "weekly" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            📋 한 주간 뉴스
          </button>
        </div>
      </div>

      {/* 채팅 영역 */}
      <main className="w-full max-w-2xl flex-1 px-4 overflow-y-auto scrollbar-thin space-y-4 pb-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </main>

      {/* 퀵버튼 */}
      <div className="w-full max-w-2xl px-4 pt-2">
        <div className="flex flex-wrap gap-2">
          {QUICK[tab].map((btn) => (
            <button
              key={btn.label}
              onClick={() => send(btn.query)}
              disabled={loading}
              className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 shadow-sm"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 입력 */}
      <div className="w-full max-w-2xl px-4 pt-2 pb-6">
        <div className="bg-white border border-gray-200 rounded-2xl flex items-center gap-2 px-4 py-2.5 shadow-sm">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="질문을 입력하세요..."
            disabled={loading}
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Powered by Claude + Web Search</p>
      </div>
    </div>
  );
}

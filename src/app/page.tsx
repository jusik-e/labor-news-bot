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
};

type Tab = "daily" | "weekly";

const DAILY_CATS = [
  { key: "union" as const,      label: "노조",   icon: "👥", border: "border-blue-200",  header: "bg-blue-50 text-blue-800",   row: "bg-blue-50/30" },
  { key: "employer" as const,   label: "사용자", icon: "🏭", border: "border-green-200", header: "bg-green-50 text-green-800", row: "bg-green-50/30" },
  { key: "government" as const, label: "정부",   icon: "🏛️", border: "border-amber-200", header: "bg-amber-50 text-amber-800", row: "bg-amber-50/30" },
  { key: "court" as const,      label: "법원",   icon: "⚖️", border: "border-red-200",   header: "bg-red-50 text-red-800",     row: "bg-red-50/30" },
];

const CAT_BADGE: Record<string, string> = {
  union:      "bg-blue-100 text-blue-700",
  employer:   "bg-green-100 text-green-700",
  government: "bg-amber-100 text-amber-700",
  court:      "bg-red-100 text-red-700",
};
const CAT_LABEL: Record<string, string> = {
  union: "👥 노조", employer: "🏭 사용자", government: "🏛️ 정부", court: "⚖️ 법원",
};

const QUICK: Record<Tab, { label: string; query: string }[]> = {
  daily: [
    { label: "📰 오늘 브리핑", query: "오늘의 노동뉴스 브리핑해줘" },
    { label: "👥 노조",       query: "오늘 노조 관련 뉴스만 알려줘" },
    { label: "🏛️ 정부",      query: "오늘 정부 노동정책 뉴스 알려줘" },
    { label: "⚖️ 법원",      query: "오늘 법원 노동 판결 뉴스 알려줘" },
  ],
  weekly: [
    { label: "📋 이번 주 브리핑", query: "이번 주 주요 노동뉴스 브리핑해줘" },
    { label: "👥 이번 주 노조",   query: "이번 주 노조 관련 뉴스 정리해줘" },
    { label: "🏛️ 이번 주 정부",  query: "이번 주 정부 노동정책 뉴스 정리해줘" },
    { label: "⚖️ 이번 주 법원",  query: "이번 주 법원 노동 판결 정리해줘" },
  ],
};

function LinkBtn({ url }: { url?: string }) {
  if (!url) return <span className="text-xs text-gray-300">링크 없음</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium ml-auto flex-shrink-0">
      원문 보기
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  );
}

function NewsRow({ item, rowBg }: { item: NewsItem; rowBg: string }) {
  return (
    <div className={`px-4 py-3 border-b border-gray-100 last:border-0 ${rowBg}`}>
      <p className="text-sm text-gray-800 leading-relaxed mb-2">{item.summary}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400 truncate">{item.source}</span>
        <LinkBtn url={item.url} />
      </div>
    </div>
  );
}

function DailyView({ data }: { data: NewsBrief }) {
  return (
    <div className="space-y-3 mt-2">
      {DAILY_CATS.map((cat) => {
        const items = data[cat.key] ?? [];
        if (!items.length) return null;
        return (
          <div key={cat.key} className={`rounded-xl border ${cat.border} overflow-hidden`}>
            <div className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${cat.header}`}>
              <span>{cat.icon}</span><span>{cat.label}</span>
              <span className="ml-auto text-xs opacity-60">{items.length}건</span>
            </div>
            <div className="bg-white">
              {items.map((item, i) => <NewsRow key={i} item={item} rowBg={cat.row} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyView({ data }: { data: WeeklyBrief }) {
  return (
    <div className="space-y-3 mt-2">
      {data.items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3">
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 ${CAT_BADGE[item.category ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
              {CAT_LABEL[item.category ?? ""] ?? item.category}
            </span>
            <p className="text-sm text-gray-800 leading-relaxed mb-2">{item.summary}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400 truncate">{item.source}</span>
              <LinkBtn url={item.url} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BotBubble({ msg }: { msg: Message }) {
  if (msg.isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm w-full">
        <div className="flex items-center gap-1.5 py-1">
          <span className="w-2 h-2 rounded-full bg-gray-400 dot-1 inline-block" />
          <span className="w-2 h-2 rounded-full bg-gray-400 dot-2 inline-block" />
          <span className="w-2 h-2 rounded-full bg-gray-400 dot-3 inline-block" />
        </div>
      </div>
    );
  }
  const p = msg.parsed;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm w-full text-sm">
      {p?.type === "news_brief" ? (
        <><p className="text-xs text-gray-500 mb-2">{p.intro}</p><DailyView data={p} /></>
      ) : p?.type === "weekly_brief" ? (
        <><p className="text-xs text-gray-500 mb-2">{p.intro}</p><WeeklyView data={p} /></>
      ) : p?.type === "text" ? (
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{p.content}</p>
      ) : (
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.raw}</p>
      )}
    </div>
  );
}

function parseResponse(raw: string): ParsedResponse | undefined {
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch { return undefined; }
}

const WELCOME: Record<Tab, string> = {
  daily:  "오늘의 주요 노동뉴스를 노조·사용자·정부·법원으로 분류해 요약과 원문 링크와 함께 제공합니다.\n아래 버튼을 눌러 브리핑을 시작하세요.",
  weekly: "이번 주(최근 7일) 가장 중요한 노동뉴스 6~10건을 중요도 순으로 정리해 드립니다.\n아래 버튼을 눌러 브리핑을 시작하세요.",
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("daily");
  const [msgMap, setMsgMap] = useState<Record<Tab, Message[]>>({
    daily:  [{ id: "wd", role: "assistant", raw: "", parsed: { type: "text", content: WELCOME.daily } }],
    weekly: [{ id: "ww", role: "assistant", raw: "", parsed: { type: "text", content: WELCOME.weekly } }],
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = msgMap[tab];
  const setMessages = (fn: (prev: Message[]) => Message[]) =>
    setMsgMap((m) => ({ ...m, [tab]: fn(m[tab]) }));

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, tab]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: Message = { id: Date.now().toString(), role: "user", raw: text };
    const loadingMsg: Message = { id: "loading", role: "assistant", raw: "", isLoading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    const apiMsgs = messages
      .filter((m) => !m.id.startsWith("w") && !m.isLoading && m.raw)
      .map((m) => ({ role: m.role, content: m.raw }));

    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...apiMsgs, { role: "user", content: text }], mode: tab }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "서버 오류");
      const raw: string = data.content;
      const parsed = parseResponse(raw);
      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat({ id: Date.now() + "_b", role: "assistant", raw, parsed }));
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat({
        id: Date.now() + "_e", role: "assistant", raw: `⚠️ 오류: ${err.message}`,
        parsed: { type: "text", content: `⚠️ 오류: ${err.message}` },
      }));
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
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />실시간
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className="w-full max-w-2xl px-4 mb-2">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <button onClick={() => setTab("daily")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "daily" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
            📅 오늘의 뉴스
          </button>
          <button onClick={() => setTab("weekly")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "weekly" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
            📋 한 주간 뉴스
          </button>
        </div>
      </div>

      {/* 채팅 */}
      <main className="w-full max-w-2xl flex-1 px-4 overflow-y-auto scrollbar-thin space-y-4 pb-4">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-xs text-sm leading-relaxed shadow-sm">{msg.raw}</div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-start w-full">
              <BotBubble msg={msg} />
            </div>
          )
        )}
        <div ref={bottomRef} />
      </main>

      {/* 퀵버튼 */}
      <div className="w-full max-w-2xl px-4 pt-1">
        <div className="flex flex-wrap gap-2">
          {QUICK[tab].map((btn) => (
            <button key={btn.label} onClick={() => send(btn.query)} disabled={loading}
              className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 shadow-sm">
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 입력창 */}
      <div className="w-full max-w-2xl px-4 pt-2 pb-6">
        <div className="bg-white border border-gray-200 rounded-2xl flex items-center gap-2 px-4 py-2.5 shadow-sm">
          <input ref={inputRef} type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder={tab === "daily" ? "오늘 노동뉴스에 대해 질문하세요..." : "이번 주 노동뉴스에 대해 질문하세요..."}
            disabled={loading}
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent" />
          <button onClick={() => send(input)} disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors disabled:opacity-40 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Powered by Claude + Web Search</p>
      </div>
    </div>
  );
}

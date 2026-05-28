"use client";

import { useState, useRef, useEffect } from "react";

type NewsItem = { title: string; summary?: string; source?: string; url?: string };
type NewsBrief = {
  type: "news_brief";
  intro: string;
  union: NewsItem[];
  employer: NewsItem[];
  government: NewsItem[];
  court: NewsItem[];
};
type TextResponse = { type: "text"; content: string };
type ParsedResponse = NewsBrief | TextResponse;

type Message = {
  id: string;
  role: "user" | "assistant";
  raw: string;
  parsed?: ParsedResponse;
  isLoading?: boolean;
};

const CATEGORIES = [
  { key: "union" as const, label: "노조", icon: "👥", borderColor: "border-blue-200", headerBg: "bg-blue-50 text-blue-800", summaryBg: "bg-blue-50/50" },
  { key: "employer" as const, label: "사용자", icon: "🏭", borderColor: "border-green-200", headerBg: "bg-green-50 text-green-800", summaryBg: "bg-green-50/50" },
  { key: "government" as const, label: "정부", icon: "🏛️", borderColor: "border-amber-200", headerBg: "bg-amber-50 text-amber-800", summaryBg: "bg-amber-50/50" },
  { key: "court" as const, label: "법원", icon: "⚖️", borderColor: "border-red-200", headerBg: "bg-red-50 text-red-800", summaryBg: "bg-red-50/50" },
];

const QUICK_BUTTONS = [
  { label: "📰 오늘의 브리핑", query: "오늘의 노동뉴스 브리핑해줘" },
  { label: "👥 노조 뉴스", query: "최근 노조 관련 뉴스만 알려줘" },
  { label: "🏛️ 정부 정책", query: "최근 노동 관련 정부 정책 뉴스 알려줘" },
  { label: "⚖️ 법원 판결", query: "최근 노동 관련 법원 판결 뉴스 알려줘" },
];

function parseResponse(raw: string): ParsedResponse | undefined {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return undefined;
  }
}

function NewsCard({ item, summaryBg }: { item: NewsItem; summaryBg: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div
        className="px-3 py-2.5 flex gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-gray-300 mt-0.5 flex-shrink-0">·</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-800 leading-snug font-medium">{item.title}</p>
            <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">{open ? "▲" : "▼"}</span>
          </div>
          {item.source && !open && (
            <p className="text-xs text-gray-400 mt-0.5">{item.source}</p>
          )}
        </div>
      </div>

      {open && (
        <div className={`mx-3 mb-2.5 rounded-lg p-3 ${summaryBg} border border-gray-100`}>
          {item.summary && (
            <p className="text-xs text-gray-700 leading-relaxed mb-2">{item.summary}</p>
          )}
          <div className="flex items-center justify-between">
            {item.source && (
              <span className="text-xs text-gray-400">{item.source}</span>
            )}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium ml-auto"
              >
                원문 보기
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            ) : (
              <span className="text-xs text-gray-300 ml-auto">링크 없음</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NewsBriefCard({ data }: { data: NewsBrief }) {
  return (
    <div className="space-y-3 mt-2">
      {CATEGORIES.map((cat) => {
        const items = data[cat.key] ?? [];
        if (!items.length) return null;
        return (
          <div key={cat.key} className={`rounded-xl border ${cat.borderColor} overflow-hidden`}>
            <div className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${cat.headerBg}`}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="ml-auto text-xs opacity-60">{items.length}건 · 클릭하면 요약 보기</span>
            </div>
            <div className="bg-white divide-y divide-gray-50">
              {items.map((item, i) => (
                <NewsCard key={i} item={item} summaryBg={cat.summaryBg} />
              ))}
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
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 max-w-lg text-sm leading-relaxed shadow-sm w-full">
        {msg.isLoading ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-gray-400 dot-1 inline-block" />
            <span className="w-2 h-2 rounded-full bg-gray-400 dot-2 inline-block" />
            <span className="w-2 h-2 rounded-full bg-gray-400 dot-3 inline-block" />
          </div>
        ) : msg.parsed?.type === "news_brief" ? (
          <div>
            <p className="text-gray-700 mb-2">{msg.parsed.intro}</p>
            <NewsBriefCard data={msg.parsed} />
          </div>
        ) : msg.parsed?.type === "text" ? (
          <p className="text-gray-700 whitespace-pre-wrap">{msg.parsed.content}</p>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">{msg.raw}</p>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      raw: "안녕하세요! 노동뉴스 비서입니다.\n오늘의 주요 노동뉴스를 노조 · 사용자 · 정부 · 법원 4개 카테고리로 정리해 드립니다.\n\n각 뉴스를 클릭하면 요약과 원문 링크를 확인할 수 있습니다.",
      parsed: { type: "text", content: "안녕하세요! 노동뉴스 비서입니다.\n오늘의 주요 노동뉴스를 노조 · 사용자 · 정부 · 법원 4개 카테고리로 정리해 드립니다.\n\n각 뉴스를 클릭하면 요약과 원문 링크를 확인할 수 있습니다." },
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const apiMessages = messages
    .filter((m) => m.id !== "welcome" && !m.isLoading)
    .map((m) => ({ role: m.role, content: m.raw }));

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: Message = { id: Date.now().toString(), role: "user", raw: text };
    const loadingMsg: Message = { id: "loading", role: "assistant", raw: "", isLoading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...apiMessages, { role: "user", content: text }],
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "서버 오류");

      const raw: string = data.content;
      const parsed = parseResponse(raw);
      const botMsg: Message = { id: Date.now() + "_bot", role: "assistant", raw, parsed };
      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(botMsg));
    } catch (err: any) {
      const errMsg: Message = {
        id: Date.now() + "_err",
        role: "assistant",
        raw: `⚠️ 오류: ${err.message}`,
        parsed: { type: "text", content: `⚠️ 오류: ${err.message}` },
      };
      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(errMsg));
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#f8f7f4]">
      <header className="w-full max-w-2xl px-4 pt-6 pb-3">
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">📰</div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">노동뉴스 비서</h1>
            <p className="text-xs text-gray-500 mt-0.5">노조 · 사용자 · 정부 · 법원 — 클릭하면 요약 및 원문 링크 확인</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            실시간
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl flex-1 px-4 overflow-y-auto scrollbar-thin space-y-4 pb-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </main>

      <div className="w-full max-w-2xl px-4 pt-2">
        <div className="flex flex-wrap gap-2">
          {QUICK_BUTTONS.map((btn) => (
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

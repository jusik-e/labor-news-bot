import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const today = new Date().toLocaleDateString("ko-KR", {
  year: "numeric", month: "long", day: "numeric", weekday: "long",
});

const BRIEF_PROMPT = `당신은 한국의 노동뉴스 전문 비서입니다. 오늘 날짜는 ${today}입니다.

사용자가 오늘 노동뉴스나 브리핑을 요청하면, 웹 검색으로 최신 한국 노동 뉴스를 수집하고 반드시 아래 JSON 형식으로만 응답하세요.
절대 지켜야 할 규칙:
- JSON만 출력, 마크다운 코드블록 금지
- summary 안에 <cite>, <a>, <b> 등 HTML 태그 절대 사용 금지
- summary는 순수 텍스트만 (태그 없이)
- url은 웹 검색에서 찾은 실제 기사 URL, 없으면 빈 문자열 ""

{"type":"news_brief","intro":"오늘 날짜 포함 한 줄 브리핑 멘트","union":[{"summary":"2~3문장 순수 텍스트 요약","source":"출처 매체명","url":"기사 URL"}],"employer":[{"summary":"2~3문장 순수 텍스트 요약","source":"출처 매체명","url":"기사 URL"}],"government":[{"summary":"2~3문장 순수 텍스트 요약","source":"출처 매체명","url":"기사 URL"}],"court":[{"summary":"2~3문장 순수 텍스트 요약","source":"출처 매체명","url":"기사 URL"}]}

카테고리: union=노조/파업, employer=기업/사측, government=고용노동부/정책, court=법원판결/노동위원회
각 카테고리 2~4개. 일반 질문은: {"type":"text","content":"응답"}`;

const WEEKLY_PROMPT = `당신은 한국의 노동뉴스 전문 비서입니다. 오늘 날짜는 ${today}입니다.

사용자가 이번 주 노동뉴스를 요청하면, 웹 검색으로 이번 주 주요 한국 노동 뉴스를 수집하고 반드시 아래 JSON 형식으로만 응답하세요.
절대 지켜야 할 규칙:
- JSON만 출력, 마크다운 코드블록 금지
- summary 안에 HTML 태그 절대 사용 금지, 순수 텍스트만
- url은 실제 기사 URL, 없으면 빈 문자열 ""

{"type":"weekly_brief","intro":"이번 주 날짜 범위 포함 한 줄 멘트","items":[{"summary":"3~4문장 순수 텍스트 요약","source":"출처 매체명","url":"기사 URL","category":"union|employer|government|court 중 하나"}]}

이번 주 가장 중요한 노동 뉴스 6~10개를 중요도 순으로. 일반 질문은: {"type":"text","content":"응답"}`;

function stripTags(text: string): string {
  return (text ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function cleanNewsData(data: any): any {
  if (!data) return data;
  ["union", "employer", "government", "court"].forEach((k) => {
    if (Array.isArray(data[k])) {
      data[k] = data[k].map((item: any) => ({
        ...item,
        summary: stripTags(item.summary),
        source: stripTags(item.source),
      }));
    }
  });
  if (Array.isArray(data.items)) {
    data.items = data.items.map((item: any) => ({
      ...item,
      summary: stripTags(item.summary),
      source: stripTags(item.source),
    }));
  }
  return data;
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "노동뉴스 비서 API 정상 작동 중" });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages, mode } = body;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const systemPrompt = mode === "weekly" ? WEEKLY_PROMPT : BRIEF_PROMPT;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: systemPrompt,
      tools: [{ type: "web_search_20250305", name: "web_search" } as any],
      messages,
    });

    const textContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("");

    try {
      const parsed = JSON.parse(textContent.replace(/```json|```/g, "").trim());
      const cleaned = cleanNewsData(parsed);
      return NextResponse.json({ content: JSON.stringify(cleaned) });
    } catch {
      return NextResponse.json({ content: textContent });
    }
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

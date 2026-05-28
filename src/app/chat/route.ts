import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

const SYSTEM_PROMPT = `당신은 한국의 노동뉴스 전문 비서입니다. 오늘 날짜는 ${today}입니다.

사용자가 노동뉴스나 브리핑을 요청하면, 웹 검색으로 최신 한국 노동 뉴스를 수집하고 반드시 아래 JSON 형식으로만 응답하세요 (마크다운 코드블록이나 설명 텍스트 없이 JSON만):
{
  "type": "news_brief",
  "intro": "오늘 날짜를 포함한 한 줄 브리핑 멘트",
  "union": [{"title": "뉴스 제목", "summary": "2~3문장 핵심 요약", "source": "출처 매체명", "url": "기사 URL"}],
  "employer": [{"title": "뉴스 제목", "summary": "2~3문장 핵심 요약", "source": "출처 매체명", "url": "기사 URL"}],
  "government": [{"title": "뉴스 제목", "summary": "2~3문장 핵심 요약", "source": "출처 매체명", "url": "기사 URL"}],
  "court": [{"title": "뉴스 제목", "summary": "2~3문장 핵심 요약", "source": "출처 매체명", "url": "기사 URL"}]
}

카테고리 분류 기준:
- union: 노동조합, 파업, 단체교섭, 쟁의행위
- employer: 기업·사측, 인사·노무 정책, 사용자 관련
- government: 고용노동부, 정부 노동정책, 최저임금위원회
- court: 법원 판결, 노동위원회 결정, 행정소송

각 카테고리당 2~4개 항목.
- title: 핵심만 간결하게
- summary: 해당 뉴스의 배경·내용·의미를 2~3문장으로 요약
- url: 웹 검색에서 찾은 실제 기사 URL (없으면 빈 문자열 "")

특정 카테고리 질문이나 일반 노동 관련 질문은:
{"type": "text", "content": "응답 내용 (\\n 사용 가능)"}`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요." },
        { status: 500 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      tools: [{ type: "web_search_20250305", name: "web_search" } as any],
      messages,
    });

    const textContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("");

    return NextResponse.json({ content: textContent });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

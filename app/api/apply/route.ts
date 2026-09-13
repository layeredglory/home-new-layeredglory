import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

const ALLOWED_SITES = new Set(["ting", "spark", "charter", "sail", "port", "main"]);

export async function POST(req: NextRequest) {
  let body: { site?: string; data?: Record<string, unknown>; _gotcha?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 허니팟(봇 차단): 채워져 있으면 조용히 성공 처리
  if (body._gotcha) return NextResponse.json({ ok: true });

  const site = String(body.site ?? "");
  const data = body.data;
  if (!ALLOWED_SITES.has(site) || !data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 문자열 필드만, 개수·길이 제한
  const clean: Record<string, string> = {};
  let count = 0;
  for (const [k, v] of Object.entries(data)) {
    if (++count > 40) break;
    clean[String(k).slice(0, 100)] = String(v ?? "").slice(0, 4000);
  }

  try {
    await ensureSchema();
    await sql()`INSERT INTO applications (site, data) VALUES (${site}, ${JSON.stringify(clean)})`;
  } catch (e) {
    console.error("apply insert failed:", e);
    return NextResponse.json(
      { ok: false, error: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  // 이메일 알림 (선택: RESEND_API_KEY + NOTIFY_EMAIL 설정 시)
  const apiKey = process.env.RESEND_API_KEY;
  const notify = process.env.NOTIFY_EMAIL;
  if (apiKey && notify) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      const rows = Object.entries(clean)
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td style="padding:4px 0">${v.replace(/</g, "&lt;")}</td></tr>`)
        .join("");
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "LayeredGlory <onboarding@resend.dev>",
        to: notify,
        subject: `[${site}] 새 신청 접수`,
        html: `<h3>[${site}] 새 신청이 접수되었습니다</h3><table>${rows}</table><p><a href="https://admin.layeredglory.com">관리자에서 보기</a></p>`,
      });
    } catch (e) {
      console.error("notify email failed:", e); // 메일 실패해도 접수는 성공
    }
  }

  return NextResponse.json({ ok: true });
}

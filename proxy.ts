import { NextRequest, NextResponse } from "next/server";

// 서브도메인 → public/_sites/<폴더> 매핑
const SITES = new Set(["main", "sail", "port", "ting", "spark", "charter"]);

function siteForHost(hostHeader: string): string {
  const host = hostHeader.split(":")[0].toLowerCase();

  if (host === "layeredglory.com" || host === "www.layeredglory.com") return "main";
  if (host === "localhost" || host === "127.0.0.1") return "main";

  const sub = host.split(".")[0];
  if (sub === "admin") return "admin";
  if (SITES.has(sub)) return sub; // ting.layeredglory.com, ting.localhost 모두 지원

  return "main"; // *.vercel.app 프리뷰 등
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Next 내부 경로 / API / 정적 사이트 직접 접근 / 관리자 라우트는 그대로 통과
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_sites") ||
    pathname.startsWith("/admin")
  ) {
    return NextResponse.next();
  }

  const site = siteForHost(req.headers.get("host") ?? "");

  // admin.layeredglory.com → /admin 라우트로
  if (site === "admin") {
    const url = req.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 정적 사이트로 rewrite: / → index.html, /foo → /foo.html, 그 외는 그대로
  let filePath = pathname;
  if (filePath.endsWith("/")) filePath += "index.html";
  else if (!/\.[a-zA-Z0-9]+$/.test(filePath)) filePath += ".html";

  const url = req.nextUrl.clone();
  url.pathname = `/_sites/${site}${filePath}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

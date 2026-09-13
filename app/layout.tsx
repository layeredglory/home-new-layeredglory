import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "레이어드글로리",
  robots: { index: false }, // 관리자·API 등 앱 라우트는 색인 제외 (정적 사이트는 자체 meta 사용)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

import { neon } from "@neondatabase/serverless";

export type Application = {
  id: number;
  site: string;
  data: Record<string, string>;
  status: string;
  created_at: string;
};

export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  return neon(url);
}

let ensured: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await sql()`
        CREATE TABLE IF NOT EXISTS applications (
          id BIGSERIAL PRIMARY KEY,
          site TEXT NOT NULL,
          data JSONB NOT NULL,
          status TEXT NOT NULL DEFAULT 'new',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })().catch((e) => {
      ensured = null; // 실패 시 다음 요청에서 재시도
      throw e;
    });
  }
  return ensured;
}

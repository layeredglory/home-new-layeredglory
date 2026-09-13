import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { ensureSchema, sql, type Application } from "@/lib/db";
import { logout, removeApplication, setStatus } from "./actions";

export const dynamic = "force-dynamic";

const SITE_LABELS: Record<string, string> = {
  ting: "요트팅",
  spark: "불꽃 요트",
  charter: "요트 전세",
  sail: "항해(메인)",
  port: "기항지",
  main: "대문",
};
const STATUS_LABELS: Record<string, string> = { new: "신규", checked: "확인", done: "완료" };

// 표에 먼저 보여줄 대표 필드 후보
const PRIMARY_KEYS = ["이름", "담당자명", "회사 · 단체명", "연락처", "이메일"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; status?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin/login");

  const { site, status } = await searchParams;

  let rows: Application[] = [];
  let dbError: string | null = null;
  try {
    await ensureSchema();
    const q = sql();
    const result =
      site && status
        ? await q`SELECT * FROM applications WHERE site=${site} AND status=${status} ORDER BY created_at DESC LIMIT 500`
        : site
          ? await q`SELECT * FROM applications WHERE site=${site} ORDER BY created_at DESC LIMIT 500`
          : status
            ? await q`SELECT * FROM applications WHERE status=${status} ORDER BY created_at DESC LIMIT 500`
            : await q`SELECT * FROM applications ORDER BY created_at DESC LIMIT 500`;
    rows = result as Application[];
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  const filterLink = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { site, status, ...params };
    if (merged.site) p.set("site", merged.site);
    if (merged.status) p.set("status", merged.status);
    const qs = p.toString();
    return qs ? `/admin?${qs}` : "/admin";
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>신청 관리</h1>
        <form action={logout}>
          <button className="btn">로그아웃</button>
        </form>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, fontSize: 13 }}>
        <a className="btn" style={!site ? { borderColor: "#2277B8", color: "#155A8F" } : undefined} href={filterLink({ site: undefined })}>전체</a>
        {Object.entries(SITE_LABELS).map(([k, label]) => (
          <a key={k} className="btn" style={site === k ? { borderColor: "#2277B8", color: "#155A8F" } : undefined} href={filterLink({ site: k })}>{label}</a>
        ))}
        <span style={{ width: 12 }} />
        <a className="btn" style={!status ? { borderColor: "#2277B8", color: "#155A8F" } : undefined} href={filterLink({ status: undefined })}>모든 상태</a>
        {Object.entries(STATUS_LABELS).map(([k, label]) => (
          <a key={k} className="btn" style={status === k ? { borderColor: "#2277B8", color: "#155A8F" } : undefined} href={filterLink({ status: k })}>{label}</a>
        ))}
      </div>

      {dbError ? (
        <p style={{ background: "#FBE4E1", color: "#C6473B", padding: 16, borderRadius: 10, fontSize: 13.5 }}>
          데이터베이스 연결 실패: {dbError}
          <br />Vercel 프로젝트에 DATABASE_URL 환경변수가 설정됐는지 확인해 주세요.
        </p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#4A6076", fontSize: 14 }}>아직 접수된 신청이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th><th>접수일</th><th>서비스</th><th>신청자</th><th>내용</th><th>상태</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const data = r.data ?? {};
              const who = PRIMARY_KEYS.map((k) => data[k]).filter(Boolean).slice(0, 2).join(" · ") || "-";
              return (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(r.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td><span className="tag" style={{ background: "#EAF4FB", color: "#155A8F" }}>{SITE_LABELS[r.site] ?? r.site}</span></td>
                  <td>{who}</td>
                  <td style={{ maxWidth: 420 }}>
                    <details>
                      <summary>상세 보기</summary>
                      <div className="kv">
                        {Object.entries(data).map(([k, v]) => (
                          <div key={k}><b>{k}</b><span style={{ whiteSpace: "pre-wrap" }}>{v}</span></div>
                        ))}
                      </div>
                    </details>
                  </td>
                  <td>
                    <span className={`tag ${r.status}`}>{STATUS_LABELS[r.status] ?? r.status}</span>
                    <form action={setStatus} style={{ marginTop: 6 }}>
                      <input type="hidden" name="id" value={r.id} />
                      <select name="status" defaultValue={r.status} style={{ fontSize: 12, padding: "3px 6px" }}>
                        <option value="new">신규</option>
                        <option value="checked">확인</option>
                        <option value="done">완료</option>
                      </select>{" "}
                      <button className="btn" style={{ padding: "3px 10px", fontSize: 12 }}>변경</button>
                    </form>
                  </td>
                  <td>
                    <form action={removeApplication}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="btn" style={{ padding: "3px 10px", fontSize: 12, color: "#C6473B" }}>삭제</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

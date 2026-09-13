export const metadata = { title: "레이어드글로리 관리자" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        :root{--ink:#1B2B3A;--soft:#4A6076;--blue:#2277B8;--blue-deep:#155A8F;--sky:#EAF4FB;--line:#E3EBF2}
        body{font-family:'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif;background:#F6F9FC;color:var(--ink)}
        a{color:inherit;text-decoration:none}
        .adm-wrap{max-width:1080px;margin:0 auto;padding:0 20px}
        .adm-header{background:#fff;border-bottom:1px solid var(--line)}
        .adm-header .adm-wrap{display:flex;align-items:center;justify-content:space-between;height:56px}
        .adm-logo{font-weight:700;font-size:15px}
        .adm-logo span{color:var(--blue)}
        button{cursor:pointer;font:inherit}
        .btn{border:1px solid var(--line);background:#fff;border-radius:8px;padding:6px 14px;font-size:13px}
        .btn:hover{border-color:var(--blue);color:var(--blue-deep)}
        .btn-primary{background:var(--blue);border-color:var(--blue);color:#fff}
        .btn-primary:hover{background:var(--blue-deep);color:#fff}
        table{border-collapse:collapse;width:100%;background:#fff;border-radius:12px;overflow:hidden;font-size:13.5px}
        th,td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
        th{background:var(--sky);color:var(--blue-deep);font-size:12.5px;white-space:nowrap}
        .tag{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:600}
        .tag.new{background:#FBE4E1;color:#C6473B}
        .tag.checked{background:#FCEEDF;color:#B96E2C}
        .tag.done{background:#E1F2E5;color:#2E7D46}
        select,input[type=password]{font:inherit;padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:#fff}
        details summary{cursor:pointer;color:var(--blue-deep)}
        .kv{margin:6px 0 0;padding:10px;background:var(--sky);border-radius:8px}
        .kv div{display:flex;gap:8px;padding:2px 0}
        .kv b{min-width:110px;font-weight:600;color:var(--soft)}
      `}</style>
      <div className="adm-header">
        <div className="adm-wrap">
          <a className="adm-logo" href="/admin">⛵ 레이어드글로리 <span>관리자</span></a>
        </div>
      </div>
      <div className="adm-wrap" style={{ padding: "28px 20px 60px" }}>{children}</div>
    </>
  );
}

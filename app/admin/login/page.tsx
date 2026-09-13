"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <div style={{ maxWidth: 360, margin: "80px auto", textAlign: "center" }}>
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>관리자 로그인</h1>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="password" name="password" placeholder="비밀번호" autoFocus required />
        <button className="btn btn-primary" disabled={pending} style={{ padding: "10px" }}>
          {pending ? "확인 중…" : "로그인"}
        </button>
      </form>
      {state?.error && <p style={{ color: "#C6473B", fontSize: 13, marginTop: 12 }}>{state.error}</p>}
    </div>
  );
}

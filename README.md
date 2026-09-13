# 레이어드글로리 통합 홈페이지

여러 GitHub Pages 저장소로 흩어져 있던 사이트를 **하나의 Next.js 프로젝트**로 통합.
서브도메인별로 `public/_sites/<이름>/`의 정적 페이지를 서빙하고([proxy.ts](proxy.ts)의 Host 기반 rewrite),
신청 폼은 자체 API(`/api/apply`)로 받아 Postgres에 저장 + 관리자 페이지에서 관리한다.

## 도메인 ↔ 폴더 매핑

| 도메인 | 폴더 | 내용 |
|---|---|---|
| layeredglory.com | `public/_sites/main` | 대문 (항해·기항지·다른항해) |
| sail.layeredglory.com | `public/_sites/sail` | 요트 서비스 소개 (구 메인) |
| port.layeredglory.com | `public/_sites/port` | 기항지 — 홍주축산 |
| ting.layeredglory.com | `public/_sites/ting` | 요트팅 (신청 폼 → API) |
| spark.layeredglory.com | `public/_sites/spark` | 불꽃 위의 항해 |
| charter.layeredglory.com | `public/_sites/charter` | 요트 전세 (견적 폼 → API) |
| admin.layeredglory.com | `app/admin` | 신청 관리자 (비밀번호 로그인) |

**새 페이지 추가하기**: ① `public/_sites/<이름>/index.html` 생성 → ② [proxy.ts](proxy.ts)의 `SITES`에 이름 추가 → ③ Vercel 프로젝트에 `<이름>.layeredglory.com` 도메인 추가 → ④ 가비아에 CNAME 한 줄. 끝.

## 로컬 개발

```bash
npm install
npm run dev
```

- `http://localhost:3000` → 대문, `http://ting.localhost:3000` 처럼 `<이름>.localhost:3000`으로 각 서브도메인 확인
- `.env.local`에 `ADMIN_PASSWORD=...` 를 넣으면 `http://admin.localhost:3000` 로그인 테스트 가능
- DB(`DATABASE_URL`) 없이도 페이지는 모두 동작하고, 신청 접수/관리자 목록만 에러 안내가 뜬다

## 배포 (Vercel)

1. 이 저장소를 GitHub에 push → [vercel.com/new](https://vercel.com/new)에서 Import (프레임워크 자동 인식, 설정 불필요)
2. **DB**: Vercel 대시보드 → Storage → Neon(Postgres) 생성·연결 → `DATABASE_URL` 자동 주입됨. 테이블은 첫 요청 때 자동 생성(`applications`)
3. **환경변수** (Settings → Environment Variables, [.env.example](.env.example) 참고):
   - `ADMIN_PASSWORD` — 관리자 로그인 비밀번호 (필수)
   - `RESEND_API_KEY`, `NOTIFY_EMAIL` — 신청 시 이메일 알림 (선택)
4. **도메인**: Settings → Domains에 위 표의 도메인 7개(admin 포함) 모두 추가

## 가비아 DNS 전환

Vercel에 도메인을 추가하면 안내가 뜨지만, 기본값은:

| 타입 | 호스트 | 값 |
|---|---|---|
| A | @ | `76.76.21.21` |
| CNAME | www, sail, port, ting, spark, charter, admin | `cname.vercel-dns.com.` |

기존 `*.github.io` CNAME을 위 값으로 하나씩 바꾸면 된다(사이트별로 순차 전환 가능, 다운타임 없음).
전환 완료 후 기존 GitHub Pages 저장소들은 archive 처리.

## 신청 데이터 흐름

폼 제출 → `POST /api/apply` `{ site, data: {…} }` → `applications` 테이블 저장 (+ Resend 설정 시 이메일 알림) → `admin.layeredglory.com`에서 서비스/상태별 필터, 상태 변경(신규/확인/완료), 삭제.

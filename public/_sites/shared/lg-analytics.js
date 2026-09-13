/* 레이어드글로리 공통 애널리틱스 (GA4)
   모든 서브도메인이 같은 측정 ID로 수집 → GA4에서 '호스트명'으로 사이트 구분.
   자동 수집 이벤트:
   - contact_click  : mailto / tel / sms 링크 클릭 (문의하기)
   - reserve_click  : 네이버 예약 링크 클릭
   - apply_submit   : 신청·견적 폼 제출 (요트팅 applyForm, 차터 quoteForm)
   - cta_click      : 사이트 간 이동 버튼 클릭 (*.layeredglory.com 링크)
   공통 파라미터 site: main | sail | port | ting | spark | charter */
(function () {
  var ID = 'G-Q4VMK59NBL';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);

  gtag('js', new Date());
  gtag('config', ID);

  var site = location.hostname.split('.')[0];
  if (site === 'layeredglory' || site === 'www' || site === 'localhost') site = 'main';

  function label(el) { return (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60); }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('mailto:') === 0) {
      gtag('event', 'contact_click', { method: 'email', site: site, link_text: label(a) });
    } else if (h.indexOf('tel:') === 0) {
      gtag('event', 'contact_click', { method: 'phone', site: site, link_text: label(a) });
    } else if (h.indexOf('sms:') === 0) {
      gtag('event', 'contact_click', { method: 'sms', site: site, link_text: label(a) });
    } else if (h.indexOf('booking.naver.com') !== -1) {
      gtag('event', 'reserve_click', { site: site, link_text: label(a) });
    } else if (/https:\/\/[a-z]+\.layeredglory\.com/.test(h) && h.indexOf(location.hostname) === -1) {
      gtag('event', 'cta_click', { site: site, target: h.replace(/https:\/\/([a-z]+)\..*/, '$1'), link_text: label(a) });
    }
  }, true);

  document.addEventListener('submit', function (e) {
    var f = e.target;
    gtag('event', 'apply_submit', { site: site, form_id: (f && f.id) || 'form' });
  }, true);
})();

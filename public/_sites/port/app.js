'use strict';
(() => {
  const products = window.HONGJU_PRODUCTS;
  const byId = new Map(products.map(product => [product.id, product]));
  const $ = id => document.getElementById(id);
  const money = amount => amount.toLocaleString('ko-KR') + '원';
  const lines = [{ id: 1, product: 'gui20', quantity: '1' }];
  let nextId = 2;
  let toastTimer;
  let announcementTimer;
  let invalidField;
  let draftChanged = false;
  let summaryVisible = false;
  let resultVisible = false;
  let orderVisible = false;
  const mobile = window.matchMedia('(max-width: 40rem)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const dock = $('mobile-dock');
  const localDate = new Date();
  const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
  $('desired-date').min = today;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function notice(message) {
    $('toast').textContent = message;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 6000);
  }
  function bringIntoView(node, block = 'start') {
    node.scrollIntoView({ behavior: reducedMotion.matches || block === 'nearest' ? 'instant' : 'smooth', block });
  }
  function clearError() {
    if (invalidField) {
      invalidField.removeAttribute('aria-invalid');
      const descriptions = (invalidField.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== 'inline-field-error');
      if (descriptions.length) invalidField.setAttribute('aria-describedby', descriptions.join(' '));
      else invalidField.removeAttribute('aria-describedby');
    }
    $('inline-field-error')?.remove();
    invalidField = null;
    $('form-error').textContent = '';
  }
  function syncDockSpace() {
    document.documentElement.style.setProperty('--dock-height', `${dock.hidden ? 0 : dock.getBoundingClientRect().height}px`);
  }
  function updateDock() {
    const editing = document.activeElement?.matches('input, select, textarea');
    const keyboardFocus = document.activeElement?.matches('a:focus-visible, button:focus-visible, summary:focus-visible') && !dock.contains(document.activeElement);
    document.body.classList.toggle('keyboard-open', Boolean(editing));
    const shown = mobile.matches && !summaryVisible && !resultVisible && !editing && !keyboardFocus && !$('letter-dialog').open;
    dock.hidden = !shown;
    document.body.classList.toggle('has-dock', shown);
    $('dock-action').href = orderVisible ? '#summary-title' : '#order';
    $('dock-action').firstChild.textContent = orderVisible ? '합계 확인 ' : '선물 상담 ';
    syncDockSpace();
  }
  function updateProgress() {
    const quantitiesOk = lines.every(line => validQuantity(line.quantity));
    const phone = $('buyer-phone').value.trim();
    const business = document.querySelector('[name="buyer-type"]:checked').value === 'business';
    const buyerOk = Boolean($('buyer-name').value.trim()) && /^[\d\s()+-]{8,20}$/.test(phone) && phone.replace(/\D/g, '').length >= 8 && (!business || Boolean($('buyer-company').value.trim()));
    const ready = !$('inquiry-result').hidden;
    const current = !quantitiesOk ? 1 : !buyerOk ? 2 : 3;
    document.querySelectorAll('[data-step]').forEach(link => {
      const step = Number(link.dataset.step);
      if (step === current) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
      link.classList.toggle('is-complete', step === 1 ? quantitiesOk : step === 2 ? buyerOk : ready);
    });
    $('form-progress-text').textContent = ready ? '초안이 준비됐습니다. 내용을 확인한 뒤 직접 전달해 주세요.' : draftChanged ? '내용이 바뀌었습니다. 확인 후 문자 초안을 다시 만들어 주세요.' : !quantitiesOk ? '상품 수량을 먼저 확인해 주세요.' : !buyerOk ? '구성을 확인하고 성함·연락처를 입력해 주세요.' : '상담 정보를 확인하고 아래에서 문자 초안을 만들어 주세요.';
    updateDock();
  }
  function invalidate() {
    if (!$('inquiry-result').hidden) draftChanged = true;
    $('inquiry-result').hidden = true;
    $('inquiry-output').value = '';
    $('sms-woo').removeAttribute('href');
    $('sms-jung').removeAttribute('href');
  }
  function validQuantity(value) { return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 10000; }
  function renderSummary() {
    const list = $('summary-lines');
    list.replaceChildren();
    let total = 0;
    let complete = true;
    lines.forEach(line => {
      const p = byId.get(line.product);
      const row = element('div', 'summary-line');
      row.append(element('strong', '', p.name.replace('1++ 한우암소 ', '')));
      const quantityValid = validQuantity(line.quantity);
      const selection = p.addition || (p.id === 'galbi30' ? '네 가지 고정 구성' : '네 가지 기본 구성');
      row.append(element('span', '', `${selection} · ${quantityValid ? line.quantity + '개' : '수량 확인 필요'}`));
      list.append(row);
      if (quantityValid) total += p.price * Number(line.quantity); else complete = false;
    });
    $('total-price').textContent = complete ? money(total) : '수량 확인 필요';
    const setCount = lines.reduce((sum, line) => sum + (validQuantity(line.quantity) ? Number(line.quantity) : 0), 0);
    const kinds = new Set(lines.map(line => line.product)).size;
    const countText = complete ? `${kinds}종 · ${setCount.toLocaleString('ko-KR')}세트` : '수량을 확인해 주세요';
    $('dock-count').textContent = countText;
    $('dock-total').textContent = complete ? money(total) : '수량 확인';
    clearTimeout(announcementTimer);
    announcementTimer = setTimeout(() => { $('selection-status').textContent = complete ? `${countText} · 상품 금액 ${money(total)}` : '수량을 1~10,000 사이의 정수로 입력해 주세요.'; }, 200);
    document.querySelectorAll('.product-card').forEach(card => {
      const count = lines.filter(line => line.product === card.dataset.product && validQuantity(line.quantity)).reduce((sum, line) => sum + Number(line.quantity), 0);
      card.classList.toggle('is-selected', count > 0);
      const badge = card.querySelector('.selection-badge');
      badge.hidden = count === 0;
      badge.textContent = count ? `상담 구성에 포함 · ${count.toLocaleString('ko-KR')}세트` : '';
      const button = card.querySelector('[data-select]');
      if (count) button.setAttribute('aria-describedby', badge.id); else button.removeAttribute('aria-describedby');
    });
    updateProgress();
  }
  function renderLines(focusId, reveal = false) {
    const container = $('order-lines');
    if (invalidField && container.contains(invalidField)) clearError();
    container.replaceChildren();
    lines.forEach((line, index) => {
      const p = byId.get(line.product);
      const group = element('fieldset', 'order-line');
      group.dataset.lineId = String(line.id);
      group.append(element('legend', '', `선물 구성 ${index + 1}`));
      const top = element('div', 'line-top');
      const label = element('label', 'field', '상품 선택');
      const select = element('select');
      select.id = `product-${line.id}`;
      select.setAttribute('aria-label', `상품 선택, 구성 ${index + 1}`);
      products.forEach(product => { const option = element('option', '', product.name); option.value = product.id; select.append(option); });
      select.value = line.product;
      select.addEventListener('change', () => { line.product = select.value; invalidate(); renderLines(line.id); renderSummary(); });
      label.append(select);
      const quantityLabel = element('label', 'field quantity-field', '수량');
      const input = element('input');
      input.id = `quantity-${line.id}`;
      input.type = 'number'; input.min = '1'; input.max = '10000'; input.step = '1'; input.inputMode = 'numeric'; input.value = line.quantity; input.required = true;
      input.setAttribute('aria-label', `구성 ${index + 1} 수량`);
      input.addEventListener('input', () => { line.quantity = input.value; invalidate(); renderSummary(); });
      quantityLabel.append(input);
      top.append(label, quantityLabel);
      if (lines.length > 1) { const remove = element('button', 'remove-line', '삭제'); remove.type = 'button'; remove.setAttribute('aria-label', `선물 구성 ${index + 1} 삭제`); remove.addEventListener('click', () => { const index = lines.indexOf(line); lines.splice(index, 1); invalidate(); renderLines(lines[Math.max(0, index - 1)].id, true); renderSummary(); }); top.append(remove); }
      group.append(top, element('p', 'line-cuts', p.cuts.join(' · ')));
      if (p.addition) { group.append(element('p', 'fixed-note', `${p.addition}. 제공되는 추가 부위는 상담 시 확인해 주세요.`)); }
      else if (p.id === 'galbi30') { group.append(element('p', 'fixed-note', '갈비구이세트는 늑간살·꽃갈비살·살치살·치마살 고정 구성입니다.')); }
      container.append(group);
    });
    if (focusId) { const field = $(`product-${focusId}`); field.focus({ preventScroll: true }); if (reveal) bringIntoView(field, 'nearest'); }
  }
  function showError(message, field) {
    clearError();
    $('form-error').textContent = message;
    if (field) {
      invalidField = field;
      field.setAttribute('aria-invalid', 'true');
      const inline = element('span', 'field-error', message);
      inline.id = 'inline-field-error';
      (field.closest('label') || field.parentElement).append(inline);
      field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), inline.id].filter(Boolean).join(' '));
      field.focus({ preventScroll: true });
      bringIntoView(field, 'center');
    } else $('form-error').focus();
    updateDock();
    return false;
  }
  function validatedData() {
    for (const [index, line] of lines.entries()) {
      if (!validQuantity(line.quantity)) return showError(`구성 ${index + 1}의 수량을 1~10,000 사이의 정수로 입력해 주세요. 10,000개는 입력 한도이며 공급 가능 수량이 아닙니다.`, document.querySelector(`[data-line-id="${line.id}"] input[type="number"]`));
    }
    const name = $('buyer-name').value.trim();
    const phone = $('buyer-phone').value.trim();
    const company = $('buyer-company').value.trim();
    const business = document.querySelector('[name="buyer-type"]:checked').value === 'business';
    if (!name) return showError('상담받으실 분의 성함을 입력해 주세요.', $('buyer-name'));
    if (!/^[\d\s()+-]{8,20}$/.test(phone) || phone.replace(/\D/g, '').length < 8) return showError('회신받을 연락처를 확인해 주세요.', $('buyer-phone'));
    if (business && !company) return showError('회사·단체명을 입력해 주세요.', $('buyer-company'));
    const date = $('desired-date').value;
    if ($('desired-date').validity.badInput || (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today))) return showError('희망 수령일을 오늘 이후 날짜로 입력해 주세요.', $('desired-date'));
    if (!$('inquiry-confirm').checked) return showError('상담 내용 전달 안내를 확인해 주세요.', $('inquiry-confirm'));
    return { name, phone, company: business ? company : '', business, date, note: $('inquiry-note').value.trim(), shipping: $('shipping-mode').value };
  }
  $('inquiry-form').addEventListener('submit', event => {
    event.preventDefault();
    clearError();
    invalidate();
    const data = validatedData();
    if (!data) return;
    let total = 0;
    const details = lines.map((line, index) => {
      const p = byId.get(line.product); const amount = p.price * Number(line.quantity); total += amount;
      return `${index + 1}. ${p.name}\n   구성: ${p.cuts.join(' · ')}${p.addition ? ` + ${p.addition} (제공 부위 상담 시 확인)` : ''}\n   수량: ${line.quantity}개 / 상품 금액: ${money(amount)}`;
    });
    const text = ['[홍주축산 2027 설 선물 상담 요청 · 주문 확정 전]', `구매 유형: ${data.business ? '기업·단체' : '개인·가족'}`, `문의자: ${data.name}${data.company ? ` (${data.company})` : ''}`, `회신 연락처: ${data.phone}`, '', ...details, '', `상품 금액 합계: ${money(total)} (포장·배송 등 추가 비용 별도 확인)`, `발송 방식: ${data.shipping}`, `희망 수령일: ${data.date || '상담 후 결정'} (도착 확약 아님)`, ...(data.note ? [`추가 요청: ${data.note}`] : []), '', '세트별 중량·실제 공급 수량·포장/배송비·결제/증빙·가능 일정 확인 후 주문을 확정하고 싶습니다.'].join('\n');
    $('inquiry-output').value = text;
    const encoded = encodeURIComponent(text);
    const smsSeparator = /iPad|iPhone|iPod/.test(navigator.userAgent) ? '&' : '?';
    $('sms-woo').href = `sms:01023577071${smsSeparator}body=${encoded}`;
    $('sms-jung').href = `sms:01052488736${smsSeparator}body=${encoded}`;
    $('inquiry-result').hidden = false;
    draftChanged = false;
    $('result-title').focus({ preventScroll: true });
    bringIntoView($('inquiry-result'));
    updateProgress();
  });
  $('inquiry-form').addEventListener('input', event => { if (event.target === invalidField) clearError(); if (!event.target.closest('#order-lines')) invalidate(); updateProgress(); });
  $('inquiry-form').addEventListener('change', event => {
    if (event.target.name === 'buyer-type') {
      const business = event.target.value === 'business';
      $('company-field').hidden = !business;
      $('buyer-company').required = business;
      if (!business) $('buyer-company').value = '';
      if (!business && invalidField === $('buyer-company')) clearError();
    }
    invalidate();
    updateProgress();
  });
  $('add-line').addEventListener('click', () => {
    if (lines.length >= 30) return notice('이 화면에서는 30개 구성까지 정리할 수 있습니다. 더 많은 구성은 담당자에게 상담해 주세요.');
    const line = { id: nextId++, product: 'gui20', quantity: '1' };
    lines.push(line); invalidate(); renderLines(line.id, true); renderSummary();
  });
  document.querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', () => {
    lines[0].product = button.dataset.select;
    invalidate(); renderLines(lines[0].id); renderSummary();
    bringIntoView($('order'));
    notice('첫 번째 상담 구성에 선택한 상품을 반영했습니다.');
  }));
  async function copy(text, success) {
    if (!text.trim()) return notice('복사할 내용이 없습니다.');
    try { if (!navigator.clipboard) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(text); notice(success); }
    catch {
      const box = element('textarea'); box.value = text; box.className = 'clipboard-helper'; document.body.append(box); box.select();
      let copied = false; try { copied = document.execCommand('copy'); } catch { /* User can copy the visible text manually. */ }
      box.remove(); notice(copied ? success : '자동 복사가 지원되지 않습니다. 표시된 내용을 직접 선택해 복사해 주세요.');
    }
  }
  $('copy-inquiry').addEventListener('click', () => copy($('inquiry-output').value, '문자 내용을 복사했습니다. 직접 발송한 뒤 회신을 확인해 주세요.'));
  function letterText() { return [$('letter-to').value.trim(), $('letter-message').value.trim(), $('letter-from').value.trim()].filter(Boolean).join('\n\n'); }
  $('preview-letter').addEventListener('click', () => {
    const message = $('letter-message').value.trim();
    if (!message) { $('letter-message').focus(); return notice('감사 메시지를 입력해 주세요.'); }
    $('letter-preview-to').textContent = $('letter-to').value.trim();
    $('letter-preview-message').textContent = message;
    $('letter-preview-from').textContent = $('letter-from').value.trim();
    $('letter-dialog').showModal();
    document.body.classList.add('dialog-open');
    updateDock();
  });
  $('close-letter').addEventListener('click', () => $('letter-dialog').close());
  $('letter-dialog').addEventListener('click', event => { if (event.target === $('letter-dialog')) $('letter-dialog').close(); });
  $('copy-letter').addEventListener('click', () => copy(letterText(), '감사 메시지를 복사했습니다. 직접 전달해 주세요.'));
  $('letter-dialog').addEventListener('close', () => { document.body.classList.remove('dialog-open'); updateDock(); });
  document.addEventListener('focusin', updateDock);
  document.addEventListener('focusout', () => setTimeout(updateDock, 0));
  mobile.addEventListener('change', updateDock);
  if ('ResizeObserver' in window) new ResizeObserver(syncDockSpace).observe(dock);
  let textScale = 100;
  function resizeText(amount) {
    document.documentElement.classList.remove(`text-scale-${textScale}`);
    textScale = Math.max(100, Math.min(200, textScale + amount));
    if (textScale !== 100) document.documentElement.classList.add(`text-scale-${textScale}`);
    $('text-size').textContent = `${textScale}%`;
    $('text-smaller').disabled = textScale === 100;
    $('text-larger').disabled = textScale === 200;
    updateDock();
  }
  $('text-smaller').addEventListener('click', () => resizeText(-25));
  $('text-larger').addEventListener('click', () => resizeText(25));
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      setTimeout(() => target.focus({ preventScroll: true }), 0);
    });
  });
  document.querySelectorAll('.product-card').forEach(card => {
    const badge = element('p', 'selection-badge');
    badge.id = `selected-${card.dataset.product}`;
    badge.hidden = true;
    card.querySelector('[data-select]').before(badge);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.target.classList.contains('order-summary')) summaryVisible = entry.isIntersecting; else resultVisible = entry.isIntersecting; }); updateDock(); }, { threshold: 0 }).observe(document.querySelector('.order-summary'));
    const resultObserver = new IntersectionObserver(entries => { resultVisible = entries[0].isIntersecting && !$('inquiry-result').hidden; updateDock(); });
    resultObserver.observe($('inquiry-result'));
    new IntersectionObserver(entries => { orderVisible = entries[0].isIntersecting; updateDock(); }).observe($('order'));
    const visibleSections = new Set();
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) visibleSections.add(entry.target.id); else visibleSections.delete(entry.target.id); });
      const current = ['order', 'guide', 'collection'].find(id => visibleSections.has(id));
      document.querySelectorAll('.site-header nav a').forEach(link => { if (link.getAttribute('href') === `#${current}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    }, { rootMargin: '-5% 0px -55% 0px', threshold: 0 });
    ['collection', 'guide', 'order'].forEach(id => navObserver.observe($(id)));
    if (!reducedMotion.matches) {
      const reveal = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('reveal-once'); reveal.unobserve(entry.target); } }); }, { threshold: .08 });
      document.querySelectorAll('.product-card, .guide-steps li, .form-panel').forEach(node => reveal.observe(node));
    }
  }
  window.addEventListener('pageshow', event => { if (event.persisted) { invalidate(); updateProgress(); } });
  renderLines(); renderSummary();
})();

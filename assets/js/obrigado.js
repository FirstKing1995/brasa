/* =====================================================================
   BRASA · obrigado.js — confirmação do pagamento.
   obrigado.html?o=ID  (também aceita o que o Mercado Pago devolve:
   payment_id, collection_id, status, external_reference).
   Consulta `order` a cada 4 s por até ~3 min e mostra o estado.
   ===================================================================== */
(function (w, d) {
  'use strict';
  var B = w.B, root = d.getElementById('app');
  if (!B || !root) return;

  var POLL_MS = 4000, MAX_MS = 180000;
  var S = { id: '', pay: '', t0: 0, timer: 0, embers: null, view: '', busy: false, order: null, last: null, upTimer: 0 };

  function qp(k) { var v = B.qs(k); return v && v !== 'null' && v !== 'undefined' ? String(v).trim() : ''; }
  function home() { return B.base + 'index.html'; }
  function lpUrl(slug, checkout) { return B.base + 'lp.html?c=' + encodeURIComponent(slug) + (checkout ? '&checkout=1' : ''); }

  function help() {
    var br = (B.boot0 && B.boot0.brand) || {}, bits = [];
    var wa = String(br.support_whatsapp || '').replace(/\D/g, '');
    if (wa) { if (wa.length <= 11) wa = '55' + wa; bits.push('<a href="' + B.esc('https://wa.me/' + wa) + '" target="_blank" rel="noopener">WhatsApp ' + B.esc(B.fmt.phone(br.support_whatsapp) || br.support_whatsapp) + '</a>'); }
    if (br.support_email) bits.push('<a href="' + B.esc('mailto:' + br.support_email) + '">' + B.esc(br.support_email) + '</a>');
    return bits.length ? '<p class="ty-help">Precisa de ajuda? Fale com o suporte: ' + bits.join(' ou ') + '.</p>' : '';
  }
  function orderLine() { return S.id ? '<p class="ty-order">Pedido ' + B.esc(S.id) + '</p>' : ''; }

  function stopEmbers() { if (S.embers) { S.embers.stop(); S.embers = null; } }
  function stopUp() { clearInterval(S.upTimer); S.upTimer = 0; }
  function declined(id) { return !!B.sstore.get('noup:' + id); }
  function clock(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  // adicional do pedido (order bump): produto com link de entrega ou curso extra
  function bumpBlock(o) {
    var b = o.bump;
    if (!b) return '';
    if (b.delivery) {
      return '<a class="ty-bump" href="' + B.esc(B.safeUrl(b.delivery)) + '" target="_blank" rel="noopener">' + B.icon('gift') +
        '<span class="min0"><small>Seu adicional do pedido</small><b>' + B.esc(b.title) + '</b></span><span class="ty-bump__go">Abrir' + B.icon('external') + '</span></a>';
    }
    if (b.type === 'course') return '<p class="ty-p ty-also">' + B.icon('check') + '<span>Junto com ele: <b>' + B.esc(b.title) + '</b>, já na sua estante.</span></p>';
    return '';
  }
  function stopPoll() { clearTimeout(S.timer); S.timer = 0; }

  function shell() {
    root.className = 'ty';
    root.innerHTML =
      '<header class="ty__top"><a class="brand" href="' + B.esc(home()) + '">' + B.brandMark() + '</a></header>' +
      '<main class="ty__stage" id="tyStage"><div class="ty-card hud" id="tyCard" aria-live="polite"></div></main>';
  }

  function paint(view, html) {
    var card = B.$('#tyCard', root);
    if (!card) return;
    var changed = S.view !== view;
    S.view = view;
    card.innerHTML = html;
    if (changed) { card.classList.remove('is-in'); void card.offsetWidth; card.classList.add('is-in'); }
  }

  /* ---------- estados ---------- */
  function viewProcessing() {
    stopEmbers();
    d.title = 'Confirmando seu pagamento | ' + B.brand.name;
    paint('processing',
      B.sigil('brasa', 'ty-sigil') +
      '<h1 class="t-1 ty-h">Confirmando seu pagamento</h1>' +
      '<p class="ty-p">Estamos esperando o aviso do banco. No Pix leva poucos segundos; no cartão, pode levar alguns minutos. Deixe esta página aberta: o acesso libera sozinho.</p>' +
      '<p class="ty-meta"><span class="co-pulse"></span>Verificando a cada 4 segundos</p>' + orderLine());
  }

  function viewWaiting() {
    stopEmbers();
    var o = S.order || {};
    d.title = 'Aguardando o pagamento | ' + B.brand.name;
    paint('waiting',
      '<div class="ty-wait">' + B.icon('clock') + '</div>' +
      '<h1 class="t-1 ty-h">Ainda aguardando o pagamento</h1>' +
      '<p class="ty-p">Ainda não recebemos a confirmação. Se você já pagou, ela pode levar alguns minutos para chegar. Quando chegar, o acesso vai para <b>' + B.esc(o.email_masked || 'o e-mail da compra') + '</b>.</p>' +
      '<div class="ty-actions"><button type="button" class="btn btn--primary btn--lg btn--block" data-again>Verificar de novo</button>' +
      (o.course_slug ? '<a class="btn btn--ghost btn--block" href="' + B.esc(lpUrl(o.course_slug)) + '">Voltar à página do curso</a>' : '') + '</div>' +
      orderLine() + help());
  }

  function viewRejected() {
    stopEmbers();
    var o = S.order || {};
    d.title = 'O pagamento não foi aprovado | ' + B.brand.name;
    paint('rejected',
      '<div class="ty-bad">' + B.icon('alert') + '</div>' +
      '<h1 class="t-1 ty-h">O pagamento não foi aprovado</h1>' +
      '<p class="ty-p">O banco ou o Mercado Pago não aprovou esta cobrança. Confira os dados do cartão, ou escolha outra forma de pagamento, e tente de novo.</p>' +
      '<div class="ty-actions">' +
      (o.course_slug ? '<a class="btn btn--primary btn--lg btn--block" href="' + B.esc(lpUrl(o.course_slug, true)) + '">Tentar de novo</a>' : '') +
      '<a class="btn btn--ghost btn--block" href="' + B.esc(home()) + '">Ver todos os cursos</a></div>' + orderLine() + help());
  }

  function viewReversed(status) {
    stopEmbers();
    d.title = 'Pedido encerrado | ' + B.brand.name;
    paint('reversed',
      '<div class="ty-bad">' + B.icon('ban') + '</div>' +
      '<h1 class="t-1 ty-h">' + (status === 'chargeback' ? 'Este pedido foi contestado' : 'Este pedido foi reembolsado') + '</h1>' +
      '<p class="ty-p">O acesso ao curso foi encerrado. Se isso não era esperado, fale com o suporte e informe o número do pedido.</p>' +
      '<div class="ty-actions"><a class="btn btn--primary btn--lg btn--block" href="' + B.esc(home()) + '">Ver todos os cursos</a></div>' + orderLine() + help());
  }

  function viewMissing() {
    stopEmbers(); stopPoll();
    d.title = 'Pedido não encontrado | ' + B.brand.name;
    paint('missing',
      '<div class="ty-bad">' + B.icon('search') + '</div>' +
      '<h1 class="t-1 ty-h">Pedido não encontrado</h1>' +
      '<p class="ty-p">Não achamos nenhum pedido com este endereço. Abra o link que chegou no seu e-mail de compra, ou volte para o início.</p>' +
      '<div class="ty-actions"><a class="btn btn--primary btn--lg btn--block" href="' + B.esc(home()) + '">Ir para o início</a></div>' + help());
  }

  function viewError(e) {
    stopEmbers(); stopPoll();
    paint('error',
      '<div class="ty-bad">' + B.icon('alert') + '</div>' +
      '<h1 class="t-1 ty-h">Não foi possível consultar o pedido</h1>' +
      '<p class="ty-p">' + B.esc((e && e.message) || 'Verifique sua conexão e tente de novo.') + '</p>' +
      '<div class="ty-actions"><button type="button" class="btn btn--primary btn--lg btn--block" data-retry>Tentar de novo</button></div>' + orderLine() + help());
  }

  function viewApproved(r) {
    stopPoll();
    S.last = r;
    if (r.upsell && !declined(r.order.id) && r.upsell.expires_at > Date.now()) return viewUpsell(r);
    stopUp();
    var o = r.order, tok = r.first_token;
    d.title = 'Pagamento confirmado | ' + B.brand.name;
    var href = tok
      ? B.base + 'index.html?primeiro=' + encodeURIComponent(tok)
      : B.base + 'index.html#/curso/' + encodeURIComponent(o.course_slug || '');
    paint('approved',
      '<div class="ty-rune" aria-hidden="true">ᚠ</div>' +
      '<h1 class="t-hero ty-title">Pagamento confirmado</h1>' +
      '<p class="t-tag ty-course">' + B.esc(o.course_title) + '</p>' +
      '<p class="ty-p">Seu acesso está liberado. O acesso também foi para <b>' + B.esc(o.email_masked) + '</b>.</p>' +
      bumpBlock(o) +
      '<div class="ty-actions"><a class="btn btn--primary btn--lg btn--block" href="' + B.esc(href) + '">' + (tok ? 'Criar minha senha e assistir' : 'Entrar e assistir') + '</a></div>' +
      '<p class="ty-help">' + (tok ? 'Você cria a senha agora e já entra no curso.' : 'Entre com o e-mail da compra e a sua senha de sempre.') + '</p>' + orderLine());
    if (!S.embers) S.embers = B.embers(B.$('#tyStage', root), { count: w.innerWidth < 760 ? 30 : 56 });
    purchase(r);
  }

  /* ---------- oferta única logo depois da compra ---------- */
  function viewUpsell(r) {
    var o = r.order, up = r.upsell, c = up.course || {};
    d.title = 'Pagamento confirmado | ' + B.brand.name;
    var off = c.price > up.price ? Math.round((1 - up.price / c.price) * 100) : 0;
    paint('upsell',
      '<div class="ty-okline">' + B.icon('check') + '<span><b>Pagamento confirmado.</b> ' + B.esc(o.course_title) + ' já está liberado para ' + B.esc(o.email_masked) + '.</span></div>' +
      bumpBlock(o) +
      '<div class="ty-up">' +
      '<p class="t-tag ty-up__tag">Espera, tem mais</p>' +
      '<h1 class="ty-up__h">' + B.esc(up.title) + '</h1>' +
      '<div class="ty-up__art tile">' + B.art(c, { title: false }) + '</div>' +
      '<h2 class="ty-up__course">' + B.esc(c.title) + '</h2>' +
      (up.text ? '<p class="ty-p">' + B.esc(up.text) + '</p>' : '') +
      '<div class="ty-up__price">' + (c.price > up.price ? '<s class="t-num">' + B.fmt.money(c.price) + '</s>' : '') +
      '<strong class="t-num">' + B.fmt.money(up.price) + '</strong>' + (off ? '<em class="t-num">−' + off + '%</em>' : '') + '</div>' +
      '<p class="ty-up__timer">' + B.icon('clock') + '<span>Esta condição some em <b class="t-num" data-upleft>' + clock((up.expires_at - Date.now()) / 1000) + '</b> e não volta.</span></p>' +
      '<div class="ty-actions"><button type="button" class="btn btn--primary btn--lg btn--block" data-upsell>Quero por ' + B.fmt.money(up.price) + '</button>' +
      '<button type="button" class="btn btn--link btn--block ty-up__no" data-noup>Não, obrigado. Quero ir para o meu curso</button></div>' +
      '</div>' + orderLine());
    if (!S.embers) S.embers = B.embers(B.$('#tyStage', root), { count: w.innerWidth < 760 ? 24 : 44 });
    stopUp();
    S.upTimer = setInterval(function () {
      var left = (up.expires_at - Date.now()) / 1000, el = B.$('[data-upleft]', root);
      if (el) el.textContent = clock(left);
      if (left <= 0) { stopUp(); r.upsell = null; viewApproved(r); }
    }, 1000);
    purchase(r);
  }
  function openUpsell() {
    var r = S.last, up = r && r.upsell;
    if (!up || !B.checkout) return;
    B.checkout.open({
      course: up.course, upsell: up, email: up.email, name: up.name, src: 'upsell',
      onPaid: function (id) { location.href = B.base + 'obrigado.html?o=' + encodeURIComponent(id); return false; }
    });
  }
  function decline() {
    B.sstore.set('noup:' + S.id, 1);
    stopUp();
    var r = S.last;
    if (r) { r.upsell = null; viewApproved(r); }
  }

  /* ---------- Pixel: Purchase uma única vez por pedido ---------- */
  function purchase(r) {
    var o = r.order, key = 'purchased:' + o.id;
    if (B.store.get(key) || !(Number(o.amount) > 0)) return;
    B.store.set(key, 1);
    B.pixel.init(r.pixel_ids || []);
    B.pixel.track('Purchase', { value: o.amount, currency: 'BRL', content_ids: [o.course_id], content_type: 'product' }, o.id);
  }

  /* ---------- consulta ---------- */
  function apply(r) {
    S.order = r.order;
    var st = r.order.status;
    if (st === 'approved') return viewApproved(r);
    if (st === 'rejected' || st === 'expired' || st === 'failed') { stopPoll(); return viewRejected(); }
    if (st === 'refunded' || st === 'chargeback') { stopPoll(); return viewReversed(st); }
    // pendente: segue consultando até o limite
    if (Date.now() - S.t0 >= MAX_MS) { stopPoll(); return viewWaiting(); }
    if (S.view !== 'processing') viewProcessing();
    S.timer = setTimeout(check, POLL_MS);
  }

  function check() {
    stopPoll();
    return B.api('order', { order_id: S.id, payment_id: S.pay || undefined }).then(apply, function (e) {
      if (e && e.code === 'NOT_FOUND') return viewMissing();
      if (Date.now() - S.t0 >= MAX_MS) return viewError(e);
      if (S.view !== 'processing') viewProcessing();
      S.timer = setTimeout(check, POLL_MS);
    });
  }

  function begin() {
    S.t0 = Date.now();
    viewProcessing();
    return check();
  }

  function wire() {
    B.on(root, 'click', '[data-again]', function (ev, btn) {
      if (S.busy) return;
      S.busy = true; btn.classList.add('is-loading');
      B.api('order', { order_id: S.id, payment_id: S.pay || undefined }).then(function (r) {
        S.busy = false;
        if (r.order.status === 'pending') { btn.classList.remove('is-loading'); B.toast('Ainda sem confirmação. Tente de novo em alguns minutos.', 'info', 3600); S.order = r.order; return; }
        apply(r);
      }, function (e) { S.busy = false; btn.classList.remove('is-loading'); B.fail(e); });
    });
    B.on(root, 'click', '[data-retry]', function () { begin(); });
    B.on(root, 'click', '[data-upsell]', function () { openUpsell(); });
    B.on(root, 'click', '[data-noup]', function () { decline(); });
  }

  B.boot(function () {
    B.demoBar('lp');
    shell();
    wire();
    S.id = qp('o') || qp('external_reference');
    S.pay = qp('payment_id') || qp('collection_id');
    // marca e suporte em segundo plano; o pedido não espera por isso
    B.loadBrand().then(function () {
      var hd = B.$('.ty__top .brand', root); if (hd) hd.innerHTML = B.brandMark();
      if (S.view === 'waiting' || S.view === 'rejected' || S.view === 'reversed' || S.view === 'missing' || S.view === 'error') {
        var card = B.$('#tyCard', root); if (card && !B.$('.ty-help a', card)) card.insertAdjacentHTML('beforeend', help());
      }
    }, function () {});
    if (!S.id) return viewMissing();
    return begin();
  });
})(window, document);

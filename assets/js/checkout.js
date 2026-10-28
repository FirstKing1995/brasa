/* =====================================================================
   BRASA · checkout.js — checkout próprio com Mercado Pago.

   B.checkout.open(o)       abre em janela (app, LP, oferta pós-compra)
   B.checkout.mount(el, o)  desenha dentro da página (checkout.html)

   o = { course, user, aff, coupon, email, name, phone, src, checkout,
         offer, upsell, banner_id, owned, bump,
         onPaid(orderId), onStep(step), onTotal(total) }

   · Pix: QR Code e copia e cola na tela; o acesso libera sozinho.
   · Cartão: digitado aqui mesmo (Card Payment Brick do Mercado Pago),
     com a confirmação do banco (3DS) quando ele pedir. Sem Public Key,
     ou se o formulário não abrir, o cartão vai para o Mercado Pago.
   · Order bump, condição do vendedor (oferta) e oferta pós-compra.
   · Quem preenche os dados e sai sem pagar vira lead para o comercial.
   ===================================================================== */
(function (w, d) {
  'use strict';
  var B = w.B;
  var SDK = 'https://sdk.mercadopago.com/js/v2';
  var sdk = null, mpInst = null, mpKey = '';

  // carrega o MercadoPago.js uma vez (e tenta de novo se falhar)
  function loadMP(key) {
    if (!sdk) sdk = B.loadScript(SDK).then(function () { if (!w.MercadoPago) throw new Error('MercadoPago.js indisponível'); });
    return sdk.then(function () {
      if (!mpInst || mpKey !== key) { mpInst = new w.MercadoPago(key, { locale: 'pt-BR' }); mpKey = key; }
      return mpInst;
    }, function (e) { sdk = null; throw e; });
  }

  // tema escuro dos formulários do Mercado Pago, nas cores da marca
  var STYLE = {
    theme: 'dark',
    customVariables: {
      baseColor: '#e2a72e', baseColorFirstVariant: '#f4c55a', baseColorSecondVariant: '#a57412',
      formBackgroundColor: '#18110b', inputBackgroundColor: '#0b0806',
      textPrimaryColor: '#f0e6d2', textSecondaryColor: '#bba98c',
      outlinePrimaryColor: '#6e4c27', outlineSecondaryColor: '#3a2817',
      buttonTextColor: '#1a1206', errorColor: '#e57650', successColor: '#9aa84a',
      borderRadiusSmall: '3px', borderRadiusMedium: '6px', borderRadiusLarge: '10px'
    }
  };

  /* ---------- utilidades ---------- */
  function digits(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
  function r2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function clock(sec) {
    sec = Math.max(0, Math.floor(sec));
    var dd = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (dd ? dd + 'd ' : '') + (dd || h ? pad(h) + ':' : '') + pad(m) + ':' + pad(s);
  }
  function maskPhone(v) {
    var x = digits(v);
    if (x.length > 11 && x.indexOf('55') === 0) x = x.slice(2);
    x = x.slice(0, 11);
    if (x.length > 10) return '(' + x.slice(0, 2) + ') ' + x.slice(2, 7) + '-' + x.slice(7);
    if (x.length > 6) return '(' + x.slice(0, 2) + ') ' + x.slice(2, 6) + '-' + x.slice(6);
    if (x.length > 2) return '(' + x.slice(0, 2) + ') ' + x.slice(2);
    return x;
  }
  function maskDoc(v) {
    var x = digits(v).slice(0, 14);
    if (x.length <= 11) return x.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return x.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  function validCpf(c) {
    c = digits(c);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    for (var t = 9; t < 11; t++) {
      var s = 0;
      for (var i = 0; i < t; i++) s += Number(c[i]) * (t + 1 - i);
      if (((s * 10) % 11) % 10 !== Number(c[t])) return false;
    }
    return true;
  }
  function errBox(html) { return '<div class="co-err" role="alert">' + B.icon('alert') + '<div>' + html + '</div></div>'; }
  function errText(e) {
    var msg = B.esc((e && e.message) || 'Algo deu errado. Tente de novo.');
    if (e && e.code === 'OWNED') msg += ' <a href="' + B.base + 'index.html">Entrar na plataforma</a>';
    return msg;
  }

  /* =================================================================
     componente
     ================================================================= */
  function create(root, o, ui) {
    var course = o.course || {};
    var conf = Object.assign({ installment_rate: 0.0299, max_installments: 12, checkout_cpf: 'optional', card_mode: 'redirect', mp_public_key: '' }, B.boot0 || {}, o.checkout || {});
    var mode = o.upsell ? 'upsell' : o.offer ? 'offer' : 'normal';
    var methods = course.methods && course.methods.length ? course.methods.slice() : ['pix', 'card'];
    var maxInst = Math.max(1, Number(course.max_installments || conf.max_installments || 12));
    var transparent = conf.card_mode === 'transparent' && !!conf.mp_public_key;
    var owned = o.owned || [];
    var bump = mode !== 'upsell' && course.bump && !(course.bump.type === 'course' && owned.indexOf(course.bump.course_id) > -1) ? course.bump : null;
    var base = r2(mode === 'upsell' ? o.upsell.price : mode === 'offer' ? o.offer.price : course.price);
    var anchor = r2(mode === 'normal' ? course.anchor_price : course.price);
    var expiresAt = Number(mode === 'upsell' ? o.upsell.expires_at : mode === 'offer' ? o.offer.expires_at : 0) || 0;
    var user = o.user || null, mem = B.store.get('buyer') || {};
    var S = {
      step: '', method: methods.indexOf('pix') > -1 ? 'pix' : 'card', coupon: null, bump: !!o.bump && !!bump,
      orderId: '', paymentId: '', poll: 0, gen: 0, pixTimer: 0, cdTimer: 0, brick: null, brickTok: null,
      outcome: 'ok', intentSent: false, intentT: 0, closed: false, autoCoupon: false,
      f: {
        name: mode === 'upsell' ? (o.upsell.name || o.name || '') : user ? user.name : (o.name || mem.name || ''),
        email: mode === 'upsell' ? o.upsell.email : user ? user.email : (o.email || mem.email || ''),
        phone: user ? (user.phone || '') : (o.phone || mem.phone || ''),
        doc: ''
      }
    };

    function itemPrice() { return S.coupon ? r2(S.coupon.final) : base; }
    function total() { return r2(itemPrice() + (bump && S.bump ? Number(bump.price) : 0)); }
    function expired() { return !!expiresAt && expiresAt <= Date.now(); }
    function title(t) { if (ui.title) ui.title(t); }
    function step(name) { S.step = name; if (o.onStep) { try { o.onStep(name); } catch (e) {} } }

    /* ---------- limpeza ---------- */
    function stopPoll() { clearTimeout(S.poll); S.poll = 0; S.gen++; }
    function stopPix() { clearInterval(S.pixTimer); S.pixTimer = 0; }
    function dropBrick() { S.brickTok = null; if (S.brick) { try { S.brick.unmount(); } catch (e) {} S.brick = null; } }

    B.pixel.track('InitiateCheckout', { value: total(), currency: 'BRL', content_ids: [course.id], content_name: course.title, content_type: 'product' });

    /* ---------- pedaços da tela ---------- */
    function progress(n) {
      if (!ui.page) return '';
      return '<ol class="co-progress" aria-label="Etapas">' +
        ['Seus dados', 'Pagamento', 'Acesso liberado'].map(function (t, i) {
          return '<li class="' + (i + 1 < n ? 'is-done' : i + 1 === n ? 'is-on' : '') + '"><span class="t-num">' + (i + 1 < n ? B.icon('check') : i + 1) + '</span>' + t + '</li>';
        }).join('') + '</ol>';
    }
    function priceBox() {
      var p = base;
      return '<div class="co-price">' + (anchor > p ? '<span class="t-strike t-num">' + B.fmt.money(anchor) + '</span>' : '') +
        '<span class="co-price__big t-num">' + (p > 0 ? B.fmt.money(p) : 'Grátis') + '</span>' +
        (p > 0 && maxInst > 1 && methods.indexOf('card') > -1 ? '<span class="t-sm t-muted">ou ' + maxInst + 'x de ' + B.fmt.money(B.installment(p, maxInst, conf.installment_rate)) + (conf.installment_rate > 0 ? '*' : '') + '</span>' : '') + '</div>';
    }
    function head() {
      if (ui.page) return '';
      var kicker = mode === 'upsell' ? (o.upsell.title || 'Oferta única') : 'Você está garantindo';
      return '<div class="co-head"><div class="co-thumb tile">' + B.art(course, { title: false }) + '</div>' +
        '<div class="min0"><div class="t-hud t-faint">' + B.esc(kicker) + '</div><div class="co-title">' + B.esc(course.title) + '</div>' + priceBox() +
        (mode === 'upsell' && o.upsell.text ? '<p class="t-sm co-uptext">' + B.esc(o.upsell.text) + '</p>' : '') + '</div></div>';
    }
    function ribbon() {
      if (mode === 'normal') return '';
      var lbl = mode === 'upsell' ? 'Oferta única, só nesta tela' : 'Condição especial' + (o.offer.seller ? ' de ' + B.esc(o.offer.seller) : '');
      var sub = !expiresAt ? 'Preço exclusivo para você' : expired() ? 'Esta condição terminou.' : 'Termina em <b class="t-num" data-cd>' + clock((expiresAt - Date.now()) / 1000) + '</b>';
      return '<div class="co-ribbon' + (expired() ? ' is-over' : '') + '">' + B.icon(mode === 'upsell' ? 'zap' : 'star') +
        '<div class="min0"><strong>' + lbl + '</strong><span>' + sub + '</span></div>' +
        (anchor > base && !expired() ? '<em class="t-num">−' + Math.round((1 - base / anchor) * 100) + '%</em>' : '') + '</div>';
    }
    function field(id, name, label, type, val, attrs, hint) {
      return '<div class="field"><label for="' + id + '">' + label + (hint ? ' <span class="co-hint">' + B.esc(hint) + '</span>' : '') + '</label>' +
        '<input class="input" id="' + id + '" name="' + name + '" type="' + type + '" value="' + B.esc(val || '') + '" ' + (attrs || '') + '></div>';
    }
    function who() {
      var cpf = conf.checkout_cpf;
      if (user) return '<div class="co-as">' + B.avatar(user, 34) + '<div class="min0"><div class="t-sm">Comprando como <strong>' + B.esc(user.name) + '</strong></div><div class="t-xs t-faint ellipsis">' + B.esc(user.email) + '</div></div></div>' +
        (cpf === 'required' ? field('coDoc', 'doc', 'CPF', 'text', maskDoc(S.f.doc), 'inputmode="numeric" autocomplete="off" placeholder="000.000.000-00"') : '');
      var emailHint = mode === 'upsell' ? 'o mesmo da compra' : mode === 'offer' && o.offer.email_locked ? 'o que você passou para ' + (o.offer.seller || 'o vendedor') : 'o acesso chega nele';
      return '<div class="co-fields">' +
        field('coName', 'name', 'Nome completo', 'text', S.f.name, 'autocomplete="name" autocapitalize="words" required') +
        field('coEmail', 'email', 'E-mail', 'email', S.f.email, 'autocomplete="email" inputmode="email" required' + (mode === 'upsell' && S.f.email ? ' readonly' : ''), emailHint) +
        '<div class="grid-2 co-grid">' +
        field('coPhone', 'phone', 'WhatsApp', 'tel', maskPhone(S.f.phone), 'autocomplete="tel" inputmode="tel" placeholder="(00) 00000-0000"') +
        (cpf !== 'off' ? field('coDoc', 'doc', 'CPF', 'text', maskDoc(S.f.doc), 'inputmode="numeric" autocomplete="off" placeholder="000.000.000-00"', cpf === 'required' ? '' : 'opcional') : '') +
        '</div></div>';
    }
    function bumpBox() {
      if (!bump) return '';
      var art = bump.image ? '<img src="' + B.esc(B.safeUrl(bump.image)) + '" alt="" loading="lazy">'
        : bump.course ? B.art(bump.course, { title: false, mark: false }) : '<span class="co-bump__icon">' + B.icon('gift') + '</span>';
      return '<label class="co-bump' + (S.bump ? ' is-on' : '') + '" id="coBump">' +
        '<span class="co-bump__bar"><span class="check"><input type="checkbox" id="coBumpCheck"' + (S.bump ? ' checked' : '') + '></span>' +
        '<span class="co-bump__cta">Sim, quero adicionar ao pedido</span><span class="co-bump__tag">Só agora</span></span>' +
        '<span class="co-bump__body"><span class="co-bump__art">' + art + '</span>' +
        '<span class="co-bump__txt"><strong>' + B.esc(bump.title) + '</strong>' + (bump.text ? '<small>' + B.esc(bump.text) + '</small>' : '') +
        '<span class="co-bump__price">' + (bump.anchor > bump.price ? '<s class="t-num">' + B.fmt.money(bump.anchor) + '</s>' : '') +
        '<b class="t-num">+ ' + B.fmt.money(bump.price) + '</b></span></span></span></label>';
    }
    function mbtn(k, label, sub) {
      var on = S.method === k;
      return '<button type="button" class="co-method' + (on ? ' is-active' : '') + '" data-m="' + k + '" role="radio" aria-checked="' + on + '">' +
        B.icon(k) + '<span><strong>' + label + '</strong><small>' + sub + '</small></span></button>';
    }
    function methodsBox() {
      var h = '<div class="field co-pay" id="coPay"' + (total() > 0 ? '' : ' hidden') + '><span class="label">Forma de pagamento</span><div class="co-methods" role="radiogroup" aria-label="Forma de pagamento">';
      if (methods.indexOf('pix') > -1) h += mbtn('pix', 'Pix', 'Aprovação na hora');
      if (methods.indexOf('card') > -1) h += mbtn('card', 'Cartão de crédito', maxInst > 1 ? 'Em até ' + maxInst + 'x' : 'À vista');
      return h + '</div></div>';
    }
    function couponBox() {
      if (mode !== 'normal' || !(base > 0)) return '';
      if (S.coupon) return '<div class="co-coupon row row--between"><span class="chip chip--ok">' + B.icon('tag') + B.esc(S.coupon.code) + '</span><button type="button" class="btn btn--link btn--sm" data-rmcoupon>Remover cupom</button></div>';
      return '<div class="co-coupon"><details' + (o.coupon ? ' open' : '') + '><summary class="t-sm">Tenho um cupom</summary>' +
        '<div class="row row--nowrap" style="--gap:8px;margin-top:8px"><input class="input" id="coCoupon" aria-label="Código do cupom" placeholder="CÓDIGO" autocapitalize="characters" style="text-transform:uppercase" value="' + B.esc(o.coupon || '') + '">' +
        '<button type="button" class="btn btn--ghost" data-coupon>Aplicar</button></div></details></div>';
    }
    function lines() {
      var t = total(), h = '<div class="co-lines">';
      h += '<div class="co-line"><span class="min0">' + B.esc(course.title) + '</span><span class="t-num">' + (base > 0 ? B.fmt.money(base) : 'Grátis') + '</span></div>';
      if (S.coupon) h += '<div class="co-line co-line--off"><span>Cupom ' + B.esc(S.coupon.code) + '</span><span class="t-num">− ' + B.fmt.money(S.coupon.discount) + '</span></div>';
      if (bump && S.bump) h += '<div class="co-line"><span class="min0">' + B.esc(bump.title) + '</span><span class="t-num">' + B.fmt.money(bump.price) + '</span></div>';
      h += '</div><div class="co-total"><span>Total</span><div class="co-total__v"><strong class="t-num">' + (t > 0 ? B.fmt.money(t) : 'Grátis') + '</strong>' +
        (t > 0 && maxInst > 1 && methods.indexOf('card') > -1 ? '<small class="t-num">ou ' + maxInst + 'x de ' + B.fmt.money(B.installment(t, maxInst, conf.installment_rate)) + (conf.installment_rate > 0 ? '*' : '') + '</small>' : '') + '</div></div>';
      return h;
    }
    function goLabel() {
      var t = total();
      if (expired()) return 'Condição encerrada';
      if (t <= 0) return o.src === 'app' ? 'Adicionar à minha estante' : 'Garantir meu acesso';
      if (S.method === 'pix') return 'Gerar Pix de ' + B.fmt.money(t);
      return transparent ? 'Continuar para o cartão' : 'Pagar com cartão';
    }
    function trust(extra) {
      var t = total();
      return '<div class="co-trust">' + (course.guarantee_days && mode !== 'upsell' ? '<span>' + B.icon('shield') + course.guarantee_days + ' dias de garantia</span>' : '') +
        '<span>' + B.icon('lock') + (t > 0 ? 'Pagamento seguro via Mercado Pago' : 'Acesso imediato') + '</span>' + (extra || '') + '</div>' +
        (conf.installment_rate > 0 && t > 0 && methods.indexOf('card') > -1 && S.step === 'form' ? '<p class="t-xs t-faint co-note">*Parcelado com os juros do cartão. O valor de cada parcela aparece antes de você pagar.</p>' : '');
    }

    /* ---------- passo 1: dados, bump e forma de pagamento ---------- */
    function form(errMsg) {
      stopPoll(); stopPix(); dropBrick(); step('form');
      title(mode === 'upsell' ? 'Oferta única' : total() > 0 ? 'Finalizar inscrição' : 'Garantir acesso');
      root.innerHTML = progress(1) + head() + ribbon() + (errMsg ? errBox(errMsg) : '') +
        '<form class="co-form" id="coForm" novalidate>' + who() + bumpBox() + methodsBox() + couponBox() +
        '<div id="coLines">' + lines() + '</div>' +
        '<button class="btn btn--primary btn--lg btn--block co-go" type="submit" id="coGo"' + (expired() ? ' disabled' : '') + '>' + B.esc(goLabel()) + '</button>' +
        (expired() && mode === 'offer' ? '<button type="button" class="btn btn--ghost btn--block" data-normal>Ver o preço normal</button>' : '') +
        trust() + '</form>';
      wireForm();
      if (o.onTotal) { try { o.onTotal(total()); } catch (e) {} }
    }
    function refresh() {
      var ln = B.$('#coLines', root); if (ln) ln.innerHTML = lines();
      var pay = B.$('#coPay', root); if (pay) pay.hidden = !(total() > 0);
      var go = B.$('#coGo', root); if (go) go.textContent = goLabel();
      if (o.onTotal) { try { o.onTotal(total()); } catch (e) {} }
    }
    function keep() {
      var f = B.$('#coForm', root);
      if (f) ['name', 'email', 'phone', 'doc'].forEach(function (k) { var el = B.$('[name="' + k + '"]', f); if (el) S.f[k] = el.value.trim(); });
    }
    function wireForm() {
      B.$$('.co-method', root).forEach(function (b) {
        b.addEventListener('click', function () {
          S.method = b.dataset.m;
          B.$$('.co-method', root).forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-checked', String(on)); });
          refresh();
        });
      });
      var bc = B.$('#coBumpCheck', root);
      if (bc) bc.addEventListener('change', function () {
        S.bump = bc.checked;
        B.$('#coBump', root).classList.toggle('is-on', S.bump);
        if (S.bump) B.pixel.track('AddToCart', { value: bump.price, currency: 'BRL', content_name: bump.title, content_type: 'product' });
        refresh();
      });
      var cb = B.$('[data-coupon]', root); if (cb) cb.addEventListener('click', applyCoupon);
      var ci = B.$('#coCoupon', root); if (ci) ci.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } });
      var rm = B.$('[data-rmcoupon]', root); if (rm) rm.addEventListener('click', function () { keep(); S.coupon = null; form(); });
      var nm = B.$('[data-normal]', root); if (nm) nm.addEventListener('click', function () { mode = 'normal'; expiresAt = 0; base = r2(course.price); anchor = r2(course.anchor_price); keep(); form(); });
      var ph = B.$('#coPhone', root); if (ph) ph.addEventListener('input', function () { if (!/^\+/.test(ph.value)) ph.value = maskPhone(ph.value); });
      var dc = B.$('#coDoc', root); if (dc) dc.addEventListener('input', function () { dc.value = maskDoc(dc.value); });
      ['#coName', '#coEmail', '#coPhone'].forEach(function (s) { var el = B.$(s, root); if (el) el.addEventListener('blur', function () { intent(false); }); });
      B.$$('.input', root).forEach(function (el) { el.addEventListener('input', function () { el.classList.remove('is-invalid'); }); });
      B.$('#coForm', root).addEventListener('submit', submit);
      if (o.coupon && !S.coupon && !S.autoCoupon && mode === 'normal' && base > 0) { S.autoCoupon = true; applyCoupon(); }
    }
    function mark(id, msg) {
      var el = B.$('#' + id, root);
      if (el) { el.classList.add('is-invalid'); el.focus(); }
      B.toast(msg, 'bad');
    }
    function applyCoupon() {
      var inp = B.$('#coCoupon', root), code = ((inp && inp.value) || o.coupon || '').trim();
      if (!code) return;
      keep();
      var btn = B.$('[data-coupon]', root); if (btn) btn.classList.add('is-loading');
      B.api('coupon', { course_id: course.id, code: code }).then(function (r) {
        S.coupon = r; form();
        B.toast('Cupom aplicado: − ' + B.fmt.money(r.discount), 'ok', 2200);
      }, function (e) { if (btn) btn.classList.remove('is-loading'); B.toast(e.message, 'bad'); });
    }

    // quem preenche e sai sem pagar vira lead (uma vez; com WhatsApp, na hora)
    function intent(flush) {
      if (user || mode === 'upsell' || S.intentSent || S.closed && !flush) return;
      keep();
      var em = B.validEmail(S.f.email) ? S.f.email.toLowerCase() : '', ph = digits(S.f.phone);
      if (!em && ph.length < 10) return;
      clearTimeout(S.intentT);
      function send() {
        if (S.intentSent) return;
        S.intentSent = true;
        B.beacon('checkoutIntent', { course_id: course.id, name: S.f.name, email: em, phone: ph, aff: o.aff || B.attr.ref(), src: o.src || 'lp' });
      }
      if (flush || (em && ph.length >= 10)) return send();
      S.intentT = setTimeout(send, 20000);
    }

    function payload(extra) {
      var px = B.pixel.cookies(), f = S.f;
      var p = {
        course_id: course.id, name: f.name, email: f.email, phone: digits(f.phone), doc: digits(f.doc), bump: !!(bump && S.bump),
        src: o.src || 'lp', aff: o.aff || B.attr.ref(), utm: B.attr.utm(), banner_id: o.banner_id || '',
        fbp: px.fbp, fbc: px.fbc, ua: navigator.userAgent
      };
      if (mode === 'upsell') { p.upsell_from = o.upsell.from; p.upsell_exp = o.upsell.expires_at; p.upsell_sig = o.upsell.sig; }
      else if (mode === 'offer') p.offer = o.offer.code;
      else if (S.coupon) p.coupon = S.coupon.code;
      return Object.assign(p, extra || {});
    }

    function submit(e) {
      e.preventDefault();
      if (expired()) return;
      keep();
      if (!user) {
        if (S.f.name.length < 2) return mark('coName', 'Informe seu nome completo.');
        if (!B.validEmail(S.f.email)) return mark('coEmail', 'Confira seu e-mail.');
        var ph = digits(S.f.phone);
        if (ph && ph.length < 10) return mark('coPhone', 'Confira o WhatsApp com DDD.');
        B.store.set('buyer', { name: S.f.name, email: S.f.email, phone: S.f.phone });
      }
      var dd = digits(S.f.doc);
      if (conf.checkout_cpf === 'required' && !dd && !(S.method === 'card' && transparent && total() > 0)) return mark('coDoc', 'Informe seu CPF.');
      if (dd && !(dd.length === 14 || validCpf(dd))) return mark('coDoc', 'Confira o CPF.');
      S.intentSent = true; clearTimeout(S.intentT);
      var t = total();
      if (t > 0 && S.method === 'card' && transparent) return cardStep();
      var go = B.$('#coGo', root); go.classList.add('is-loading'); go.disabled = true;
      if (t > 0) B.pixel.track('AddPaymentInfo', { value: t, currency: 'BRL', content_ids: [course.id] });
      B.api('checkout', payload({ method: t > 0 ? S.method : 'pix' })).then(handle, function (er) { form(errText(er)); });
    }

    // resposta do backend → próximo passo
    function handle(r) {
      S.orderId = r.order_id;
      if (r.payment_id) S.paymentId = r.payment_id;
      if (r.bump_dropped && bump) { S.bump = false; B.toast('Você já tem ' + bump.title + ', então ele ficou fora deste pedido.', 'info', 5200); }
      if (r.free || r.status === 'approved') return success();
      if (r.pix) return pixStep(r);
      if (r.card && r.card.url) return redirectStep(r);
      if (r.status === 'challenge' && r.three_ds) return challengeStep(r);
      if (r.status === 'rejected') return cardStep(B.esc(r.message || 'O pagamento não foi aprovado.'));
      if (r.status === 'pending') return pendingStep(r);
      form('Não conseguimos confirmar o pedido. Tente de novo.');
    }

    // acompanha o pedido até aprovar, recusar ou dar o tempo
    function watch(ms, every, onTimeout) {
      stopPoll();
      var gen = S.gen, t0 = Date.now(), until = t0 + ms;
      function next() {
        if (S.closed || S.gen !== gen) return;
        if (Date.now() > until) { if (onTimeout) onTimeout(); return; }
        // começa rápido e vai espaçando (poupa a cota do Apps Script)
        var el = Date.now() - t0;
        S.poll = setTimeout(tick, el > 600000 ? 15000 : el > 120000 ? Math.max(every, 8000) : every);
      }
      function tick() {
        if (S.closed || S.gen !== gen) return;
        B.api('order', { order_id: S.orderId, payment_id: S.paymentId || undefined }).then(function (r) {
          if (S.closed || S.gen !== gen) return;
          var st = r.order.status;
          if (st === 'approved') return success();
          if (st === 'rejected' || st === 'expired' || st === 'failed') {
            if (S.step === 'pix') return form('Este Pix não foi pago a tempo. Gere um novo para continuar.');
            return cardStep(B.esc(r.order.message || 'O pagamento não foi aprovado. Tente outro cartão ou pague com Pix.'));
          }
          next();
        }, next);
      }
      next();
    }

    /* ---------- passo 2a: cartão digitado aqui (Card Payment Brick) ---------- */
    function cardStep(errMsg) {
      stopPoll(); stopPix(); dropBrick(); step('card');
      title('Cartão de crédito');
      var t = total();
      root.innerHTML = progress(2) + ribbon() +
        '<div class="co-cardhead"><button type="button" class="btn btn--link co-back" data-back>' + B.icon('left') + 'Voltar</button>' +
        '<div class="co-cardhead__total"><span>Total</span><strong class="t-num">' + B.fmt.money(t) + '</strong></div></div>' +
        (errMsg ? errBox(errMsg) : '') +
        '<div class="co-brick" id="coBrick"><div class="co-brick__wait"><div class="spinner"></div><span>Abrindo o formulário seguro do Mercado Pago</span></div></div>' +
        trust(methods.indexOf('pix') > -1 ? '<button type="button" class="btn btn--link btn--sm" data-topix>' + B.icon('pix') + 'Prefiro Pix</button>' : '');
      B.$('[data-back]', root).addEventListener('click', function () { form(); });
      var tp = B.$('[data-topix]', root); if (tp) tp.addEventListener('click', function () { S.method = 'pix'; form(); });
      if (B.demo) return demoCard();
      mountBrick(t);
    }
    function mountBrick(t) {
      var box = B.$('#coBrick', root), my = {};
      S.brickTok = my;
      loadMP(conf.mp_public_key).then(function (mp) {
        if (S.brickTok !== my || S.closed) return;
        var id = 'coBrick' + Math.random().toString(36).slice(2, 8);
        box.insertAdjacentHTML('beforeend', '<div id="' + id + '"></div>');
        return mp.bricks().create('cardPayment', id, {
          initialization: { amount: t, payer: { email: S.f.email } },
          customization: {
            visual: { style: STYLE, texts: { formSubmit: 'Pagar ' + B.fmt.money(t) } },
            paymentMethods: { maxInstallments: maxInst }
          },
          callbacks: {
            onReady: function () { var wt = B.$('.co-brick__wait', box); if (wt) wt.remove(); },
            onSubmit: function (fd) { return payCard(fd || {}); },
            onError: function (er) { if (w.console) console.warn('[Mercado Pago]', er); if (er && er.type === 'critical') brickFail(); }
          }
        }).then(function (ctrl) {
          if (S.brickTok !== my || S.closed) { try { ctrl.unmount(); } catch (e) {} return; }
          S.brick = ctrl;
        });
      }).catch(function (e) { if (w.console) console.warn(e); if (S.brickTok === my) brickFail(); });
    }
    // o formulário do cartão não abriu: pagar no Mercado Pago ou com Pix
    function brickFail() {
      dropBrick();
      var box = B.$('#coBrick', root); if (!box || S.step !== 'card') return;
      box.innerHTML = errBox('Não conseguimos abrir o formulário do cartão aqui. Você pode pagar no ambiente do Mercado Pago ou usar o Pix.') +
        '<div class="stack co-fallback"><button type="button" class="btn btn--primary btn--block" data-redirect>' + B.icon('external') + 'Pagar no Mercado Pago</button>' +
        (methods.indexOf('pix') > -1 ? '<button type="button" class="btn btn--ghost btn--block" data-pix>' + B.icon('pix') + 'Pagar com Pix</button>' : '') + '</div>';
      B.$('[data-redirect]', box).addEventListener('click', function (e) {
        e.currentTarget.classList.add('is-loading');
        B.api('checkout', payload({ method: 'card' })).then(handle, function (er) { cardStep(errText(er)); });
      });
      var px = B.$('[data-pix]', box); if (px) px.addEventListener('click', function () { S.method = 'pix'; form(); });
    }
    // dados do cartão viram um token no navegador; aqui só vai o token
    function payCard(fd) {
      B.pixel.track('AddPaymentInfo', { value: total(), currency: 'BRL', content_ids: [course.id] });
      var card = {
        token: fd.token, payment_method_id: fd.payment_method_id, issuer_id: fd.issuer_id || '', installments: Number(fd.installments) || 1,
        identification: fd.payer && fd.payer.identification ? fd.payer.identification : null
      };
      return B.api('checkout', payload({ method: 'card', card: card })).then(function (r) {
        setTimeout(function () { handle(r); }, 0);
      }, function (er) {
        setTimeout(function () { cardStep(errText(er)); }, 0);
      });
    }

    /* ---------- passo 2b: confirmação do banco (3DS) ---------- */
    function challengeStep(r) {
      dropBrick(); step('3ds');
      S.paymentId = r.payment_id || S.paymentId;
      title('Confirmação do banco');
      root.innerHTML = progress(2) +
        '<p class="co-3ds__lead">' + B.icon('shield') + '<span>Seu banco pediu uma confirmação de segurança. Conclua abaixo sem fechar esta tela.</span></p>' +
        '<div class="co-3ds" id="co3ds"><div class="co-brick__wait"><div class="spinner"></div><span>Abrindo a verificação do banco</span></div></div>' +
        '<div class="co-wait"><span class="co-pulse"></span><span>Esperando a resposta do banco</span></div>';
      if (B.demo || /^demo:/.test(r.three_ds.url || '')) demoBank();
      else mountStatus(r);
      watch(10 * 60000, 3000, function () { pendingStep({ message: 'O banco ainda não respondeu.' }); });
    }
    function mountStatus(r) {
      var box = B.$('#co3ds', root), my = {};
      S.brickTok = my;
      loadMP(conf.mp_public_key).then(function (mp) {
        if (S.brickTok !== my || S.closed) return;
        var id = 'coSt' + Math.random().toString(36).slice(2, 8);
        box.insertAdjacentHTML('beforeend', '<div id="' + id + '"></div>');
        return mp.bricks().create('statusScreen', id, {
          initialization: { paymentId: String(r.payment_id), additionalInfo: { externalResourceURL: r.three_ds.url, creq: r.three_ds.creq } },
          customization: { visual: { style: STYLE } },
          callbacks: {
            onReady: function () { var wt = B.$('.co-brick__wait', box); if (wt) wt.remove(); },
            onError: function (er) { if (w.console) console.warn('[Mercado Pago]', er); }
          }
        }).then(function (ctrl) {
          if (S.brickTok !== my || S.closed) { try { ctrl.unmount(); } catch (e) {} return; }
          S.brick = ctrl;
        });
      }).catch(function () { if (S.brickTok === my) challengeFrame(r); });
    }
    // plano B: o desafio do banco direto num iframe (POST com o creq)
    function challengeFrame(r) {
      var box = B.$('#co3ds', root); if (!box) return;
      var name = 'coAcs' + Math.random().toString(36).slice(2, 8);
      box.innerHTML = '<iframe name="' + name + '" title="Verificação do banco" class="co-3ds__frame"></iframe>';
      var f = d.createElement('form');
      f.method = 'POST'; f.action = r.three_ds.url; f.target = name; f.hidden = true;
      var i = d.createElement('input'); i.type = 'hidden'; i.name = 'creq'; i.value = r.three_ds.creq;
      f.appendChild(i); box.appendChild(f); f.submit();
    }

    /* ---------- passo 2c: Pix na tela ---------- */
    function pixStep(r) {
      dropBrick(); step('pix');
      title('Pague com Pix');
      var mime = /^PHN2Zy|^PD94/.test(r.pix.qr_base64 || '') ? 'image/svg+xml' : 'image/png';
      root.innerHTML = progress(2) +
        '<div class="co-pix">' +
        '<div class="co-pix__qr">' + (r.pix.qr_base64 ? '<img alt="QR Code do Pix" src="data:' + mime + ';base64,' + r.pix.qr_base64 + '">' : '') + '</div>' +
        '<div class="stack" style="--gap:12px"><div><div class="t-hud t-faint">Valor</div><div class="co-price__big t-num">' + B.fmt.money(r.amount) + '</div>' +
        (bump && S.bump ? '<div class="t-xs t-faint">Inclui ' + B.esc(bump.title) + '</div>' : '') + '</div>' +
        '<ol class="co-steps t-sm"><li>Abra o app do seu banco e escolha Pix.</li><li>Escaneie o QR Code ou use o copia e cola.</li><li>Confirme. O acesso libera sozinho nesta tela.</li></ol>' +
        '</div></div>' +
        '<div class="field co-pixcode"><label for="coPixCode">Pix copia e cola</label><div class="row row--nowrap" style="--gap:8px"><input class="input t-num" id="coPixCode" readonly value="' + B.esc(r.pix.qr_code) + '">' +
        '<button type="button" class="btn btn--primary" data-copy>' + B.icon('copy') + 'Copiar</button></div></div>' +
        '<div class="co-wait"><span class="co-pulse"></span><span>Aguardando o pagamento · expira em <strong class="t-num" data-left>--:--</strong></span></div>' +
        (B.demo ? '<button type="button" class="btn btn--ghost btn--block" data-sim>' + B.icon('zap') + 'Simular Pix pago (demo)</button>' : '') +
        '<button type="button" class="btn btn--link btn--sm co-back" data-back>' + B.icon('left') + 'Trocar a forma de pagamento</button>';
      B.$('[data-copy]', root).addEventListener('click', function (e) { B.copy(r.pix.qr_code, e.currentTarget); });
      B.$('#coPixCode', root).addEventListener('focus', function (e) { e.target.select(); });
      B.$('[data-back]', root).addEventListener('click', function () { form(); });
      var sim = B.$('[data-sim]', root);
      if (sim) sim.addEventListener('click', function () { sim.classList.add('is-loading'); setTimeout(function () { w.BrasaDemo.pay(S.orderId); }, 500); });
      var left = B.$('[data-left]', root), exp = Number(r.pix.expires_at) || Date.now() + 30 * 60000;
      function tick() {
        var s = Math.max(0, Math.round((exp - Date.now()) / 1000));
        left.textContent = clock(s);
        if (!s) {
          stopPix(); stopPoll();
          root.insertAdjacentHTML('beforeend', errBox('Este código expirou. <button class="btn btn--link" type="button" data-again>Gerar outro</button>'));
          B.$('[data-again]', root).addEventListener('click', function () { form(); });
        }
      }
      tick(); S.pixTimer = setInterval(tick, 1000);
      watch(Math.max(60000, exp - Date.now() + 60000), B.demo ? 1500 : 4000);
    }

    /* ---------- cartão em análise ---------- */
    function pendingStep(r) {
      dropBrick(); step('pending');
      if (r.payment_id) S.paymentId = r.payment_id;
      title('Pagamento em análise');
      root.innerHTML = '<div class="empty co-pending"><div class="co-pending__icon">' + B.icon('clock') + '</div><div class="empty__title">Pagamento em análise</div>' +
        '<p>' + B.esc(r.message || 'O Mercado Pago está analisando o pagamento.') + ' Assim que aprovar, o acesso libera sozinho e a confirmação chega por e-mail.</p></div>' +
        '<div class="co-wait"><span class="co-pulse"></span><span>Verificando o pagamento</span></div>';
      watch(5 * 60000, 5000);
    }

    /* ---------- cartão no ambiente do Mercado Pago ---------- */
    function redirectStep(r) {
      step('redirect');
      if (/^demo:/.test(r.card.url)) return demoHosted(r);
      root.innerHTML = '<div class="empty"><div class="spinner"></div><div class="empty__title">Indo para o Mercado Pago</div><p>Você volta para cá assim que o pagamento for aprovado.</p></div>';
      setTimeout(function () { location.href = r.card.url; }, 400);
    }

    /* ---------- simulações (somente na demonstração) ---------- */
    function demoCard() {
      var box = B.$('#coBrick', root), t = total(), opts = '';
      for (var i = 1; i <= maxInst; i++) opts += '<option value="' + i + '">' + i + 'x de ' + B.fmt.money(B.installment(t, i, i === 1 ? 0 : conf.installment_rate)) + (i === 1 ? ' (à vista)' : '') + '</option>';
      var outs = [['ok', 'Aprovado'], ['funds', 'Sem limite'], ['3ds', 'Pede código']];
      box.innerHTML = '<form class="co-sim" id="coSim" novalidate>' +
        '<div class="co-sim__note">' + B.icon('info') + '<span>Demonstração: nenhum cartão é cobrado. Escolha a resposta do banco.</span></div>' +
        '<div class="seg co-sim__seg" role="radiogroup" aria-label="Resposta do banco">' + outs.map(function (x) { return '<button type="button" role="radio" aria-checked="' + (S.outcome === x[0]) + '" data-out="' + x[0] + '" class="' + (S.outcome === x[0] ? 'is-active' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        '<div class="field"><label for="ccN">Número do cartão</label><div class="co-sim__num"><input class="input t-num" id="ccN" value="5031 4332 1540 6351" inputmode="numeric" autocomplete="off"><span class="co-sim__brand">mastercard</span></div></div>' +
        '<div class="field"><label for="ccH">Nome do titular</label><input class="input" id="ccH" value="' + B.esc((S.f.name || '').toUpperCase()) + '" autocomplete="off"></div>' +
        '<div class="grid-2 co-grid"><div class="field"><label for="ccE">Validade</label><input class="input t-num" id="ccE" value="11/30" autocomplete="off"></div>' +
        '<div class="field"><label for="ccC">Código de segurança</label><input class="input t-num" id="ccC" value="123" autocomplete="off"></div></div>' +
        '<div class="field"><label for="ccD">CPF do titular</label><input class="input t-num" id="ccD" value="' + B.esc(maskDoc(S.f.doc) || '123.456.789-09') + '"></div>' +
        '<div class="field"><label for="ccI">Parcelas</label><select class="select" id="ccI">' + opts + '</select></div>' +
        '<button class="btn btn--primary btn--lg btn--block" type="submit">Pagar ' + B.fmt.money(t) + '</button></form>';
      B.$$('[data-out]', box).forEach(function (b) {
        b.addEventListener('click', function () {
          S.outcome = b.dataset.out;
          B.$$('[data-out]', box).forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-checked', String(on)); });
        });
      });
      B.$('#coSim', box).addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = B.$('button[type="submit"]', box); btn.classList.add('is-loading'); btn.disabled = true;
        setTimeout(function () {
          payCard({ token: 'demo-' + S.outcome + '-' + Date.now().toString(36), payment_method_id: 'master', issuer_id: '', installments: Number(B.$('#ccI', box).value) || 1, payer: { identification: { type: 'CPF', number: digits(B.$('#ccD', box).value) } } });
        }, 700);
      });
    }
    function demoBank() {
      var box = B.$('#co3ds', root);
      box.innerHTML = '<div class="co-bank"><div class="co-bank__top"><strong>Banco Demo</strong><span>' + B.icon('lock') + 'Verificação segura</span></div>' +
        '<p>Confirme a compra de <b class="t-num">' + B.fmt.money(total()) + '</b> em <b>' + B.esc(B.brand.name) + '</b>. Enviamos um código por SMS para o celular com final 4321.</p>' +
        '<div class="field"><label for="coOtp">Código recebido</label><input class="input t-num" id="coOtp" value="482913" inputmode="numeric" maxlength="6"></div>' +
        '<div class="row" style="--gap:8px"><button type="button" class="btn btn--primary" data-ok>Confirmar compra</button><button type="button" class="btn btn--ghost" data-no>Não reconheço</button></div></div>';
      B.$('[data-ok]', box).addEventListener('click', function (e) { e.currentTarget.classList.add('is-loading'); setTimeout(function () { w.BrasaDemo.pay(S.orderId); }, 700); });
      B.$('[data-no]', box).addEventListener('click', function (e) { e.currentTarget.classList.add('is-loading'); setTimeout(function () { w.BrasaDemo.pay(S.orderId, 'rejected'); }, 500); });
    }
    function demoHosted(r) {
      title('Mercado Pago');
      root.innerHTML = '<div class="co-sim__note">' + B.icon('info') + '<span>Demonstração: aqui a pessoa iria para o ambiente do Mercado Pago.</span></div>' +
        '<div class="co-bank"><div class="co-bank__top"><strong>Mercado Pago</strong><span>' + B.icon('lock') + 'Ambiente seguro</span></div>' +
        '<p>' + B.esc(course.title) + '<br><b class="t-num">' + B.fmt.money(r.amount) + '</b> em até ' + maxInst + 'x</p>' +
        '<button type="button" class="btn btn--primary btn--block" data-ok>Pagar com cartão (simulação)</button></div>';
      B.$('[data-ok]', root).addEventListener('click', function (e) { e.currentTarget.classList.add('is-loading'); setTimeout(function () { w.BrasaDemo.pay(S.orderId); }, 700); });
      watch(10 * 60000, 1500);
    }

    /* ---------- passo 3: confirmado ---------- */
    function success() {
      if (S.step === 'done') return;
      stopPoll(); stopPix(); dropBrick(); clearInterval(S.cdTimer); step('done');
      var both = bump && S.bump;
      if (o.src === 'app') B.pixel.track('Purchase', { value: total(), currency: 'BRL', content_ids: [course.id], content_type: 'product' }, S.orderId);
      if (o.onPaid) { var go = o.onPaid(S.orderId); if (go === false) { if (ui.close) ui.close(); return; } }
      title('Tudo certo');
      root.innerHTML = progress(3) + '<div class="empty co-done"><div class="celebrate__rune" style="font-size:4.4rem">ᚠ</div><div class="empty__title">' + (total() > 0 ? 'Pagamento confirmado' : 'Está na sua estante') + '</div>' +
        '<p>' + B.esc(course.title) + (both ? ' e ' + B.esc(bump.title) : '') + (both ? ' já estão liberados.' : ' já está liberado.') + '</p></div>';
    }

    /* ---------- contagem da condição especial ---------- */
    function tickOffer() {
      var left = (expiresAt - Date.now()) / 1000;
      B.$$('[data-cd]', root).forEach(function (el) { el.textContent = clock(left); });
      if (left <= 0) {
        clearInterval(S.cdTimer);
        if (S.step === 'form' || S.step === 'card') { keep(); form(); }
      }
    }
    if (expiresAt && !expired()) S.cdTimer = setInterval(tickOffer, 1000);
    if (ui.page) w.addEventListener('pagehide', function () { if (S.step === 'form') intent(true); });

    form();
    return {
      destroy: function () {
        if (S.closed) return;
        if (S.step === 'form') intent(true);
        S.closed = true; stopPoll(); stopPix(); dropBrick(); clearInterval(S.cdTimer); clearTimeout(S.intentT);
      },
      get step() { return S.step; },
      get total() { return total(); }
    };
  }

  B.checkout = {
    open: function (o) {
      o = o || {};
      var api = null;
      var m = B.modal({ title: 'Finalizar inscrição', body: '<div class="co" id="co"></div>', onClose: function () { if (api) api.destroy(); } });
      api = create(B.$('#co', m.el), o, {
        title: function (t) { var el = B.$('.modal__title', m.el); if (el) el.textContent = t; },
        close: function () { m.close(); }
      });
      m.checkout = api;
      return m;
    },
    mount: function (el, o) {
      el.classList.add('co', 'co--page');
      return create(el, o || {}, { page: true });
    },
    loadMP: loadMP
  };
})(window, document);

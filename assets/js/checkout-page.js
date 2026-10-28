/* =====================================================================
   BRASA · checkout-page.js — página de checkout (checkout.html).

   checkout.html?c=SLUG [&ref=AFILIADO] [&cupom=CODIGO] [&email=E-MAIL]
                        [&nome=NOME] [&oferta=CODIGO] [&banner=ID] [&bump=1]

   Usada nos links de checkout dos afiliados, nas condições especiais dos
   vendedores, nos e-mails de recuperação e no link de checkout do curso.
   À esquerda o pagamento; à direita o resumo, a garantia e os depoimentos.
   ===================================================================== */
(function (w, d) {
  'use strict';
  var B = w.B, root = d.getElementById('app');
  if (!B || !root) return;

  var S = { data: null, c: null, ck: null, ref: '' };

  function clean(v) { return String(v == null ? '' : v).trim(); }
  function qp(k) { var v = B.qs(k); return v && v !== 'null' && v !== 'undefined' ? clean(v) : ''; }

  /* ---------- pedaços ---------- */
  function top() {
    return '<header class="ck-top"><a class="brand" href="' + B.esc(B.base + 'index.html') + '">' + B.brandMark() + '</a>' +
      '<span class="ck-top__safe">' + B.icon('lock') + 'Pagamento seguro</span></header>';
  }

  function includes(c) {
    var st = c.stats || {}, out = [];
    var parts = [];
    if (st.seasons > 1) parts.push(B.fmt.plural(st.seasons, 'temporada', 'temporadas'));
    if (st.lessons) parts.push(B.fmt.plural(st.lessons, 'aula', 'aulas'));
    if (st.minutes >= 30) parts.push(B.fmt.dur(st.minutes) + ' de conteúdo');
    if (parts.length) out.push(parts.join(' · '));
    out.push(c.access_days > 0 ? 'Acesso por ' + B.fmt.plural(c.access_days, 'dia', 'dias') : 'Acesso vitalício, no seu ritmo');
    (c.bonuses || []).slice(0, 3).forEach(function (b) { out.push('Bônus: ' + b.title); });
    (c.benefits || []).slice(0, Math.max(0, 5 - out.length)).forEach(function (b) { out.push(b); });
    out.push('Certificado ao concluir');
    return '<ul class="ck-inc">' + out.map(function (t) { return '<li>' + B.icon('check') + '<span>' + B.esc(t) + '</span></li>'; }).join('') + '</ul>';
  }

  function priceHtml(c, data) {
    var offer = data.offer, price = offer ? offer.price : c.price, anchor = offer ? c.price : c.anchor_price;
    var ck = data.checkout || {}, n = Number(c.max_installments || ck.max_installments || 12);
    return '<div class="ck-price">' + (anchor > price ? '<s class="t-num">' + B.fmt.money(anchor) + '</s>' : '') +
      '<strong class="t-num">' + (price > 0 ? B.fmt.money(price) : 'Grátis') + '</strong>' +
      (price > 0 && n > 1 && (c.methods || ['pix', 'card']).indexOf('card') > -1 ? '<small class="t-num">ou ' + n + 'x de ' + B.fmt.money(B.installment(price, n, ck.installment_rate)) + '</small>' : '') + '</div>';
  }

  function summary(c, data) {
    return '<section class="ck-sum" id="ckSum">' +
      '<button type="button" class="ck-sumbar" aria-expanded="false" aria-controls="ckSumBody">' + B.icon('cart') + '<span class="min0">Resumo do pedido</span>' +
      '<strong class="t-num" data-sumtotal>' + B.fmt.money(data.offer ? data.offer.price : c.price) + '</strong>' + B.icon('down') + '</button>' +
      '<div class="ck-sum__body" id="ckSumBody">' +
      '<div class="ck-art tile">' + B.art(c, { title: false }) + '</div>' +
      '<div class="ck-sum__txt"><div class="t-hud t-faint">Você está garantindo</div><h1 class="ck-title">' + B.esc(c.title) + '</h1>' +
      (c.subtitle || c.promise ? '<p class="ck-sub">' + B.esc(c.promise || c.subtitle) + '</p>' : '') + priceHtml(c, data) + '</div>' +
      includes(c) + '</div></section>';
  }

  function trustCol(c, data) {
    var h = '';
    if (c.guarantee_days > 0) {
      h += '<div class="ck-seal"><div class="ck-seal__badge"><b class="t-num">' + c.guarantee_days + '</b><span>dias</span></div>' +
        '<div class="min0"><strong>Garantia incondicional</strong><p>Entre, assista e teste. Se em ' + B.fmt.plural(c.guarantee_days, 'dia', 'dias') + ' não for para você, devolvemos 100% do valor. Sem perguntas.</p></div></div>';
    }
    var t = (c.testimonials || []).filter(function (x) { return x && x.text; }).slice(0, 2);
    if (t.length) {
      h += '<div class="ck-proof"><div class="t-hud t-faint">Quem já entrou</div>' + t.map(function (x) {
        return '<figure class="ck-quote"><blockquote>' + B.esc(x.text) + '</blockquote><figcaption>' + B.avatar({ name: x.name, avatar: x.photo }, 30) +
          '<span class="min0"><b>' + B.esc(x.name || '') + '</b>' + (x.role ? '<small>' + B.esc(x.role) + '</small>' : '') + '</span></figcaption></figure>';
      }).join('') + '</div>';
    }
    var br = data.brand || {}, wa = String(br.support_whatsapp || '').replace(/\D/g, '');
    if (wa) {
      var msg = 'Oi! Estou no checkout de ' + c.title + ' e fiquei com uma dúvida.';
      h += '<a class="ck-help" href="' + B.esc(B.wa.link(wa, msg)) + '" target="_blank" rel="noopener">' + B.icon('whatsapp') + '<span>Ficou alguma dúvida? <b>Fale com a gente no WhatsApp</b></span></a>';
    }
    return '<section class="ck-trust">' + h + '</section>';
  }

  function foot(data) {
    var br = data.brand || {};
    var links = [];
    if (br.terms_url) links.push('<a href="' + B.esc(B.safeUrl(br.terms_url)) + '" target="_blank" rel="noopener">Termos de uso</a>');
    if (br.privacy_url) links.push('<a href="' + B.esc(B.safeUrl(br.privacy_url)) + '" target="_blank" rel="noopener">Privacidade</a>');
    return '<footer class="ck-foot"><span>' + B.icon('lock') + 'Pagamentos processados pelo Mercado Pago. Seus dados de cartão não passam pelos nossos servidores.</span>' +
      '<span>© ' + new Date().getFullYear() + ' ' + B.esc(B.brand.name) + (links.length ? ' · ' + links.join(' · ') : '') + '</span></footer>';
  }

  /* ---------- página ---------- */
  function render(data) {
    var c = data.course;
    S.data = data; S.c = c;
    B.brand = Object.assign({}, B.brand, data.brand || {});
    d.title = 'Finalizar: ' + c.title + ' | ' + B.brand.name;
    var soon = c.status !== 'published';
    var notice = '';
    if (data.offer_error) notice = '<div class="ck-notice">' + B.icon('info') + '<span>' + B.esc(data.offer_error) + ' Você ainda pode garantir pelo preço normal abaixo.</span></div>';
    if (soon) notice = '<div class="ck-notice">' + B.icon('clock') + '<span>As vendas deste curso ainda não abriram. <a href="' + B.esc(B.base + 'lp.html?c=' + encodeURIComponent(c.slug)) + '">Veja a página do curso</a> e entre na lista de espera.</span></div>';
    root.className = 'ck';
    root.innerHTML = top() + notice +
      '<main class="ck-main">' +
      '<section class="ck-pay"><div class="ck-panel hud" id="ckPanel"></div></section>' +
      '<aside class="ck-side">' + summary(c, data) + trustCol(c, data) + '</aside>' +
      '</main>' + foot(data);

    var bar = B.$('.ck-sumbar', root);
    bar.addEventListener('click', function () {
      var open = !B.$('.ck-sum', root).classList.contains('is-open');
      B.$('.ck-sum', root).classList.toggle('is-open', open);
      bar.setAttribute('aria-expanded', String(open));
    });

    var panel = B.$('#ckPanel', root);
    if (soon) {
      panel.innerHTML = '<div class="empty"><div class="empty__title">Em breve</div><p>Assim que as vendas abrirem, este link passa a funcionar.</p></div>';
      return;
    }
    S.ck = B.checkout.mount(panel, {
      course: c, checkout: data.checkout, src: 'page',
      aff: S.ref || B.attr.ref(), coupon: qp('cupom'), email: qp('email'), name: qp('nome'),
      offer: data.offer || null, banner_id: qp('banner'), bump: qp('bump') === '1',
      onTotal: function (t) { var el = B.$('[data-sumtotal]', root); if (el) el.textContent = t > 0 ? B.fmt.money(t) : 'Grátis'; },
      onStep: function (step) {
        root.dataset.step = step;
        if (step === 'form') return;
        var r = panel.getBoundingClientRect();
        if (r.top < 0 || r.top > w.innerHeight * 0.5) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      onPaid: function (id) { location.href = B.base + 'obrigado.html?o=' + encodeURIComponent(id); return false; }
    });
  }

  function fail(e) {
    var gone = !e || e.code === 'NOT_FOUND';
    d.title = (gone ? 'Checkout não encontrado' : 'Não foi possível carregar') + ' | ' + B.brand.name;
    root.className = 'ck';
    root.innerHTML = top() + '<main class="ck-gone"><div class="ck-panel hud">' + B.sigil('checkout', 'ck-gone__sigil') +
      '<h1 class="t-1">' + (gone ? 'Este checkout não existe' : 'Não foi possível carregar') + '</h1>' +
      '<p>' + (gone ? 'O link pode estar incompleto ou o curso saiu do ar.' : B.esc((e && e.message) || 'Verifique sua conexão e tente de novo.')) + '</p>' +
      '<div class="row">' + (gone ? '' : '<button type="button" class="btn btn--primary" data-retry>Tentar de novo</button>') +
      '<a class="btn ' + (gone ? 'btn--primary' : 'btn--ghost') + '" href="' + B.esc(B.base + 'index.html') + '">Ver todos os cursos</a></div></div></main>';
    var r = B.$('[data-retry]', root);
    if (r) r.addEventListener('click', function () { location.reload(); });
  }

  B.boot(function () {
    d.documentElement.classList.add('no-bottomnav');
    B.demoBar('ck');
    root.className = 'ck';
    root.innerHTML = '<div class="ck-boot" role="status" aria-label="Carregando"><div class="spinner"></div></div>';
    var cap = B.attr.capture();
    S.ref = clean(cap.ref).toUpperCase().slice(0, 40);
    var slug = qp('c') || qp('slug');
    if (!slug) return fail({ code: 'NOT_FOUND' });
    return B.api('landing', { slug: slug, ref: S.ref || undefined, offer: qp('oferta') || undefined }).then(function (data) {
      if (S.ref) B.attr.setRef(S.ref, (data.checkout || {}).cookie_days);
      // o pixel entra antes do checkout para o InitiateCheckout não se perder
      B.pixel.init(data.pixel_ids || []);
      B.pixel.track('PageView');
      render(data);
      var utm = B.attr.utm();
      B.beacon('track', { type: 'checkout', slug: data.course.slug, aff: S.ref || B.attr.ref(), sid: B.attr.sid(), utm_source: utm.source || '', utm_campaign: utm.campaign || '', ref_url: d.referrer || '' });
    }, fail);
  });
})(window, document);

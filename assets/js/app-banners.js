/* =====================================================================
   BRASA · app-banners.js — banners na área do aluno e convite para
   virar afiliado.
   · home_top: logo depois do destaque · home_middle: entre os trilhos
   · lesson: abaixo do player
   Ações: affiliate (vira afiliado aqui mesmo), course (abre o curso),
   checkout (compra com cupom), link (abre o endereço).
   ===================================================================== */
(function (w, d) {
  'use strict';
  var A = w.APP, esc = B.esc;
  var KICK = { affiliate: 'Indique e ganhe', checkout: 'Condição para você', course: 'Novo na casa', link: '' };

  function hidden(id) { var t = B.store.get('bnx:' + id); return t && Date.now() - t < 7 * 864e5; }
  function list() { var h = A.state.home; return (h && h.banners) || []; }
  function course(b) { return b.course_id ? A.byId(b.course_id) : null; }
  function maxCommission() {
    var m = 0;
    ((A.state.home && A.state.home.courses) || []).forEach(function (c) { if (c.status === 'published' && c.aff_enabled) m = Math.max(m, Number(c.aff_commission) || 0); });
    return m;
  }

  /* ---------- desenho ---------- */
  A.bannerHtml = function (b, opts) {
    opts = opts || {};
    var c = course(b), bg;
    if (b.image) bg = '<img class="promo__img" src="' + esc(B.safeUrl(b.image)) + '" alt="" loading="lazy">';
    else if (c && b.action !== 'affiliate') bg = B.art(c, { title: false, mark: false });
    else bg = '<span class="promo__rune" aria-hidden="true">ᚠ</span>';
    var kicker = KICK[b.action] || '';
    return '<section class="promo promo--' + esc(b.action || 'link') + (opts.compact ? ' promo--compact' : '') + '" data-banner="' + esc(b.id) + '" aria-label="' + esc(b.title) + '">' +
      '<div class="promo__bg">' + bg + '</div><div class="promo__shade"></div>' +
      '<div class="promo__body min0">' + (kicker ? '<span class="promo__kicker t-tag">' + kicker + '</span>' : '') +
      '<h2 class="promo__title">' + esc(b.title) + '</h2>' + (b.text ? '<p class="promo__text">' + esc(b.text) + '</p>' : '') +
      '<div class="promo__acts"><button type="button" class="btn btn--primary" data-banner-go="' + esc(b.id) + '">' + esc(b.cta_label || 'Saiba mais') + B.icon('right') + '</button>' +
      (b.action === 'checkout' && b.coupon ? '<span class="chip chip--mustard promo__coupon">' + B.icon('tag') + 'Cupom ' + esc(b.coupon) + '</span>' : '') + '</div></div>' +
      '<button type="button" class="iconbtn promo__x" data-banner-x="' + esc(b.id) + '" aria-label="Dispensar este aviso">' + B.icon('x') + '</button>' +
      '</section>';
  };
  // primeiro banner ativo do lugar pedido (um por lugar, para não poluir)
  A.banners = function (placement, opts) {
    var b = list().filter(function (x) { return x.placement === placement && !hidden(x.id); })[0];
    return b ? A.bannerHtml(b, opts) : '';
  };

  /* ---------- cliques ---------- */
  function go(b) {
    B.api('bannerClick', { id: b.id }).catch(function () {});
    if (b.action === 'affiliate') return A.affJoin({ from: 'banner' });
    if (b.action === 'course' && b.course_slug) return B.router.go('/curso/' + b.course_slug);
    if (b.action === 'checkout') {
      var c = course(b);
      if (c && !c.owned) return A.buy(c, { coupon: b.coupon, banner_id: b.id });
      if (b.course_slug) return B.router.go('/curso/' + b.course_slug);
      return;
    }
    if (b.url) w.open(B.safeUrl(b.url), '_blank', 'noopener');
  }
  d.addEventListener('click', function (e) {
    var t = e.target.closest('[data-banner-go]');
    if (t) {
      e.preventDefault(); e.stopPropagation();
      var b = list().filter(function (x) { return x.id === t.dataset.bannerGo; })[0];
      if (b) go(b);
      return;
    }
    t = e.target.closest('[data-banner-x]');
    if (t) {
      e.preventDefault(); e.stopPropagation();
      B.store.set('bnx:' + t.dataset.bannerX, Date.now());
      var sec = t.closest('.promo');
      if (sec) { sec.classList.add('is-leaving'); setTimeout(function () { sec.remove(); }, 260); }
    }
  });

  /* ---------- virar afiliado ---------- */
  A.affJoin = function (opts) {
    opts = opts || {};
    var u = A.user(), pct = opts.commission || maxCommission();
    var isAff = [].concat(u.roles || []).join(',').split(',').indexOf('affiliate') > -1;
    if (isAff) return openPanel();
    var m = B.modal({
      title: 'Vire afiliado',
      body: '<div class="affj">' +
        '<div class="affj__hero"><span class="affj__rune" aria-hidden="true">ᚠ</span><div class="min0">' +
        (opts.course_title ? '<p class="t-tag affj__tag">Você concluiu ' + esc(opts.course_title) + '</p>' : '<p class="t-tag affj__tag">Indique e ganhe</p>') +
        '<p class="affj__lead">Indique os cursos da casa e ganhe ' + (pct ? 'até <b>' + pct + '%</b>' : 'comissão') + ' de cada venda. Você recebe links só seus e um painel com cliques, vendas e comissões.</p></div></div>' +
        '<ol class="affj__steps"><li><b>Ative</b> sua conta de afiliado agora</li><li><b>Compartilhe</b> seus links no Instagram, no WhatsApp ou onde quiser</li><li><b>Receba</b> as comissões no Pix</li></ol>' +
        '<form class="stack" id="affjForm" style="--gap:12px" novalidate>' +
        '<div class="field"><label for="affjPix">Chave Pix para receber</label><input class="input" id="affjPix" name="pix_key" placeholder="CPF, e-mail, celular ou chave aleatória" autocomplete="off"></div>' +
        '<div class="field"><label for="affjIg">Instagram <span class="t-faint" style="text-transform:none">(opcional)</span></label><div class="input-group"><span class="addon">@</span><input class="input" id="affjIg" name="instagram" placeholder="seuperfil" autocomplete="off"></div></div>' +
        '</form></div>',
      actions: [{ label: 'Agora não' }, { label: 'Quero ser afiliado', kind: 'primary', icon: 'users', close: false, onClick: submit }]
    });
    function submit() {
      var pix = (B.$('#affjPix', m.el).value || '').trim(), ig = (B.$('#affjIg', m.el).value || '').trim();
      if (pix.length < 4) { B.$('#affjPix', m.el).classList.add('is-invalid'); B.$('#affjPix', m.el).focus(); B.toast('Informe a chave Pix para receber as comissões.', 'bad'); return; }
      m.busy(1, true);
      B.api('affJoin', { pix_key: pix, instagram: ig }).then(function (r) {
        B.session.setUser(r.user);
        if (A.state.home) A.state.home.user = Object.assign(A.state.home.user || {}, r.user);
        // o mesmo login vale no painel de afiliado
        B.store.set('sess:aff', { token: B.session.token(), user: r.user, at: Date.now() });
        B.store.del('demo:out:aff');
        A.dropHome();
        m.close();
        done(r.user);
      }, function (e) { m.busy(1, false); B.fail(e); });
    }
    return m;
  };
  function done(user) {
    B.$$('.promo--affiliate').forEach(function (s) { s.remove(); });
    B.modal({
      title: 'Bem-vindo ao time',
      body: '<div class="affj affj--done"><span class="affj__rune" aria-hidden="true">ᚠ</span>' +
        '<p class="affj__lead">Seu código de afiliado é</p><div class="affj__code t-num">' + esc(user.aff_code || '') + '</div>' +
        '<p class="t-sm t-muted">No painel você pega os links de cada curso, acompanha as vendas e fala com o suporte dos afiliados.</p></div>',
      actions: [{ label: 'Depois' }, { label: 'Abrir meu painel', kind: 'primary', icon: 'external', onClick: openPanel }]
    });
  }
  function openPanel() { w.open(B.base + 'afiliado.html', '_blank', 'noopener'); }

  // depois de concluir um curso: convite com a comissão daquele curso
  A.affInvite = function (inv) {
    if (!inv || B.sstore.get('affinv:' + inv.course_id)) return;
    B.sstore.set('affinv:' + inv.course_id, 1);
    setTimeout(function () {
      A.affJoin({ commission: inv.commission, course_title: inv.course_title, from: 'course_done' });
    }, 2600);
  };
})(window, document);

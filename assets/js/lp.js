/* =====================================================================
   BRASA · lp.js — renderizador da página de vendas de cada curso.

   Entrada: lp.html?c=SLUG (ação `landing` da API) ou window.__LANDING__
   (versão estática publicada no GitHub, em c/<slug>/index.html).
   Parâmetros: c, ref, checkout=1, email, cupom, preview=1.

   Textos de venda vêm de data.lp. Preço, parcelas, temporadas, aulas,
   bônus com valor e depoimentos vêm de data.course (ao vivo).
   ===================================================================== */
(function (w, d) {
  'use strict';
  var B = w.B, root = d.getElementById('lp');
  if (!B || !root) return;

  var RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
  var PILLAR_RUNES = ['ᚠ', 'ᚢ', 'ᛊ', 'ᛏ', 'ᚱ', 'ᛟ'];
  var NB = ' ';

  var S = {
    data: null, c: null, lp: null, info: null,
    slug: '', ref: '', preview: false, tracked: false,
    timer: 0, embers: null, io: [], scrollBound: false, wired: false
  };

  /* ---------- utilidades ---------- */
  // textos automáticos podem trazer "1 aulas": corrige o singular na hora de mostrar
  function one(s) { return s.replace(/(^|[^\d.,])1 (aula|episódio|temporada|hora|dia|módulo)s\b/gi, function (m, pre, w) { return pre + '1 ' + w; }); }
  function clean(s) { return one(String(s == null ? '' : s).trim()); }
  function list(a) { return (Array.isArray(a) ? a : []).map(clean).filter(Boolean); }
  function norm(s) { return clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function paras(s) {
    return clean(s).split(/\n{2,}/).map(clean).filter(Boolean)
      .map(function (p) { return '<p>' + B.nl2br(p) + '</p>'; }).join('');
  }
  // 82 min -> "1h22" · 45 min -> "45min"
  function durShort(min) {
    min = Math.round(Number(min) || 0);
    if (min < 60) return min + 'min';
    var h = Math.floor(min / 60), m = min % 60;
    return h + 'h' + (m ? pad2(m) : '');
  }
  // R$ 497 (sem centavos quando é inteiro)
  function brl(v) {
    v = Number(v) || 0;
    return Math.abs(v - Math.round(v)) < 0.005 ? 'R$' + NB + B.fmt.int(v) : B.fmt.money(v).replace(/\s/g, NB);
  }
  function money(v) { return B.fmt.money(v).replace(/\s/g, NB); }
  // preço grande: símbolo pequeno, inteiro enorme, centavos só se existirem
  function bigPrice(v) {
    v = Number(v) || 0;
    var whole = Math.floor(v + 1e-9), cents = Math.round((v - whole) * 100);
    if (cents >= 100) { whole += 1; cents = 0; }
    return '<span class="lp-cur">R$</span><span class="lp-int">' + B.fmt.int(whole) + '</span>' +
      (cents ? '<span class="lp-cents">,' + pad2(cents) + '</span>' : '');
  }
  function plural(n, one, many) { return Number(n) === 1 ? one : many; }

  /* ---------- dados derivados ---------- */
  function bonusList() {
    var lpb = (S.lp.bonuses && S.lp.bonuses.items) || [], live = S.c.bonuses || [];
    var base = lpb.length ? lpb : live;
    return base.map(function (b, i) {
      if (!b || !clean(b.title)) return null;
      var match = null;
      live.forEach(function (x) { if (x && norm(x.title) === norm(b.title)) match = x; });
      if (!match && lpb.length === live.length && live[i]) match = live[i];
      var value = match && Number(match.value) > 0 ? Number(match.value) : (Number(b.value) || 0);
      return { title: clean(b.title), text: clean(b.text) || clean(match && match.text), value: value };
    }).filter(Boolean);
  }

  function computeInfo() {
    var c = S.c, ck = S.data.checkout || {};
    var price = Math.max(0, Number(c.price) || 0), anchor = Number(c.anchor_price) || 0;
    var methods = (c.methods && c.methods.length ? c.methods : ck.methods) || ['pix', 'card'];
    var n = Math.max(1, Number(c.max_installments || ck.max_installments) || 1);
    var rate = Number(ck.installment_rate) || 0;
    var bon = bonusList();
    var bonusTotal = bon.reduce(function (s, b) { return s + b.value; }, 0);
    var free = price <= 0;
    var perceived = free ? 0 : (anchor > price ? anchor : price) + bonusTotal;
    var card = methods.indexOf('card') > -1;
    return {
      price: price, free: free, soon: c.status === 'coming_soon',
      anchor: anchor > price ? anchor : 0,
      bonuses: bon, bonusTotal: bonusTotal, perceived: perceived,
      save: !free && perceived > price ? Math.round((1 - price / perceived) * 100) : 0,
      pix: methods.indexOf('pix') > -1, card: card, n: n, rate: rate,
      inst: !free && card && n > 1 ? B.installment(price, n, rate) : 0,
      star: rate > 0 ? '*' : ''
    };
  }

  // prazo da oferta: só vale se ainda estiver no futuro
  function offerClock() {
    var until = Number(S.c.scarcity_until) || 0, urgency = clean((S.lp.offer || {}).urgency);
    var live = !S.info.soon && until > Date.now();
    return { live: live, until: until, text: (!S.info.soon && (live || !until)) ? urgency : '' };
  }

  function ctaText(kind) {
    if (S.info.free) return 'Quero acessar grátis';
    var lp = S.lp, t = '';
    if (kind === 'offer') t = (lp.offer || {}).cta;
    else if (kind === 'final') t = (lp.final_cta || {}).cta;
    else t = (lp.hero || {}).cta;
    return clean(t) || clean(S.c.cta_text) || (kind === 'final' ? 'Quero entrar agora' : 'Quero começar agora');
  }

  // botão de compra: abre o checkout, ou vai para o checkout externo se existir
  function ctaBtn(where, label, mods) {
    mods = mods || '';
    if (S.info.soon) return '<button type="button" class="btn btn--ghost lp-soon ' + mods + '" disabled>Em breve</button>';
    if (clean(S.c.checkout_url)) {
      return '<a class="btn btn--primary ' + mods + '" href="' + B.esc(B.safeUrl(S.c.checkout_url)) + '" target="_blank" rel="noopener" data-cta="' + where + '">' + B.esc(label) + '</a>';
    }
    return '<button type="button" class="btn btn--primary ' + mods + '" data-cta="' + where + '">' + B.esc(label) + '</button>';
  }

  /* ---------- peças reutilizáveis ---------- */
  function sec(id, mod, inner, labelId) {
    return '<section class="lp-sec' + (mod ? ' lp-sec--' + mod : '') + '" id="' + id + '"' + (labelId ? ' aria-labelledby="' + labelId + '"' : '') + '>' +
      '<div class="wrap wrap--mid">' + inner + '</div></section>';
  }
  function head(idT, title, lead) {
    title = clean(title); lead = clean(lead);
    if (!title && !lead) return '';
    return '<div class="lp-head">' +
      (title ? '<h2 class="t-1 lp-title" id="' + idT + '">' + B.esc(title) + '</h2>' : '') +
      (lead ? '<p class="lp-lead">' + B.esc(lead) + '</p>' : '') + '</div>';
  }
  function labelOf(idT, title) { return clean(title) ? idT : ''; }

  function teaserHTML() {
    var I = S.info;
    if (I.soon) return '<p class="lp-teaser"><span class="chip chip--mustard">Em breve</span></p>';
    if (I.free) return '<p class="lp-teaser"><span class="lp-teaser__now"><b>Grátis</b></span></p>';
    return '<p class="lp-teaser">' +
      (I.anchor ? '<span class="lp-teaser__was">de <s>' + brl(I.anchor) + '</s></span>' : '') +
      '<span class="lp-teaser__now">' + (I.anchor ? 'por ' : '') + '<b>' + brl(I.price) + '</b></span>' +
      (I.inst ? '<span class="lp-teaser__inst">ou ' + I.n + 'x de ' + money(I.inst) + I.star + '</span>' : '') + '</p>';
  }

  function countHTML(kind) {
    var oc = offerClock();
    if (!oc.live) return '';
    var units = [['d', 'dias'], ['h', 'horas'], ['m', 'min'], ['s', 'seg']].map(function (u) {
      return '<span class="lp-count__u"><b data-u="' + u[0] + '">00</b><i>' + u[1] + '</i></span>';
    }).join('<span class="lp-count__sep" aria-hidden="true">:</span>');
    return '<div class="lp-count lp-count--' + kind + '" data-count role="timer" aria-live="off" aria-label="Tempo restante da oferta">' +
      (kind === 'bar' && oc.text ? '<span class="lp-count__txt">' + B.esc(oc.text) + '</span>' : '') +
      '<span class="lp-count__units">' + units + '</span></div>';
  }

  /* ---------- 1. barra fixa ---------- */
  function barHTML() {
    var I = S.info;
    return '<header class="topbar lp-bar" id="lpBar"><div class="topbar__inner">' +
      '<a class="brand" href="' + B.esc(B.base + 'index.html') + '" aria-label="' + B.esc(B.brand.name) + ', página inicial">' + B.brandMark() + '</a>' +
      '<span class="grow"></span>' + countHTML('bar') +
      (I.soon ? '<span class="chip chip--mustard">Em breve</span>' : ctaBtn('bar', I.free ? 'Acessar grátis' : 'Garantir acesso', 'btn--sm lp-bar__cta')) +
      '</div></header>';
  }

  /* ---------- 2. topo ---------- */
  function affInner(name) { return B.icon('users') + '<span>Indicação de ' + B.esc(name) + '</span>'; }

  function heroHTML() {
    var c = S.c, h = S.lp.hero || {}, I = S.info;
    var headline = clean(h.headline) || clean(c.promise) || clean(c.title);
    var n = headline.length;
    var size = n <= 40 ? 'xl' : n <= 66 ? 'l' : n <= 92 ? 'm' : 's';
    var sub = clean(h.subheadline) || clean(c.short_desc);
    var note = clean(h.note);
    var aff = S.data.aff && clean(S.data.aff.name);
    var kicker = clean(h.kicker);
    return '<section class="lp-hero" aria-labelledby="lpH1">' +
      '<div class="lp-hero__art" aria-hidden="true">' + B.art(c, { title: false, mark: false }) + '</div>' +
      '<div class="lp-hero__shade" aria-hidden="true"></div>' +
      '<div class="lp-hero__hud" aria-hidden="true"><span class="lp-hero__runes t-rune">' + RUNES + '</span></div>' +
      '<div class="wrap lp-hero__inner"><div class="lp-hero__copy">' +
        (kicker ? '<p class="lp-kicker t-tag">' + B.esc(kicker) + '</p>' : '') +
        '<h1 class="lp-h1 t-hero lp-h1--' + size + '" id="lpH1">' + B.esc(headline) + '</h1>' +
        (sub ? '<p class="lp-sub">' + B.esc(sub) + '</p>' : '') +
        '<div class="lp-hero__actions">' + ctaBtn('hero', ctaText('hero'), 'btn--lg lp-hero__cta') +
          (clean(c.trailer) ? '<button type="button" class="btn btn--glass btn--lg" data-trailer>' + B.icon('play') + 'Assistir ao trailer</button>' : '') +
        '</div>' +
        (note ? '<p class="lp-note">' + B.icon(Number(c.guarantee_days) > 0 ? 'shield' : 'check') + '<span>' + B.esc(note) + '</span></p>' : '') +
        teaserHTML() +
        '<p class="lp-aff" id="lpAff"' + (aff ? '' : ' hidden') + '>' + (aff ? affInner(aff) : '') + '</p>' +
      '</div></div></section>';
  }

  /* ---------- 3. faixa de números ---------- */
  function statsHTML() {
    var c = S.c, st = c.stats || {}, out = [];
    function stat(ic, n, l) { return '<li class="lp-stat">' + B.icon(ic) + '<b>' + B.esc(n) + '</b><span>' + B.esc(l) + '</span></li>'; }
    if (st.seasons) out.push(stat('layers', st.seasons, plural(st.seasons, 'temporada', 'temporadas')));
    if (st.lessons) out.push(stat('play', st.lessons, plural(st.lessons, 'episódio', 'episódios')));
    if (st.minutes) out.push(stat('clock', durShort(st.minutes), 'de conteúdo'));
    out.push(stat('award', 'Incluso', 'certificado'));
    out.push(stat('unlock', Number(c.access_days) > 0 ? c.access_days + ' dias' : 'Vitalício', 'acesso'));
    return '<section class="lp-stats" aria-label="O curso em números"><div class="wrap wrap--mid"><ul class="lp-stats__list">' + out.join('') + '</ul></div></section>';
  }

  /* ---------- 4. dores ---------- */
  function painHTML() {
    var p = S.lp.pain || {}, items = list(p.items);
    if (!items.length) items = list(S.c.pains);
    if (!items.length) return '';
    var title = clean(p.title);
    return sec('dores', 'pain',
      head('lpPainT', title, '') +
      '<ul class="lp-pains">' + items.map(function (t) {
        return '<li class="lp-pain"><span class="lp-pain__r t-rune" aria-hidden="true">ᚦ</span><p>' + B.esc(t) + '</p></li>';
      }).join('') + '</ul>', labelOf('lpPainT', title));
  }

  /* ---------- 5. promessa ---------- */
  function ctaRow(where) {
    var I = S.info;
    return '<div class="lp-ctarow">' + ctaBtn(where, ctaText('hero'), 'btn--lg') +
      (I.soon ? '<p class="lp-ctarow__soon">Este curso ainda não está à venda.</p>' : teaserHTML()) + '</div>';
  }

  function promiseHTML() {
    var p = S.lp.promise || {}, title = clean(p.title), text = clean(p.text);
    var pillars = (Array.isArray(p.pillars) ? p.pillars : []).filter(function (x) { return x && (clean(x.title) || clean(x.text)); }).slice(0, 6);
    if (!title && !text && !pillars.length) return '';
    return sec('promessa', 'ink',
      '<div class="lp-promise">' +
        '<div class="lp-promise__main">' + head('lpPromT', title, '') + (text ? '<div class="lp-prose">' + paras(text) + '</div>' : '') + '</div>' +
        (pillars.length ? '<ul class="lp-pillars">' + pillars.map(function (x, i) {
          return '<li class="lp-pillar"><span class="lp-pillar__r t-rune" aria-hidden="true">' + PILLAR_RUNES[i % PILLAR_RUNES.length] + '</span>' +
            '<div>' + (clean(x.title) ? '<h3 class="lp-pillar__t">' + B.esc(clean(x.title)) + '</h3>' : '') +
            (clean(x.text) ? '<p>' + B.esc(clean(x.text)) + '</p>' : '') + '</div></li>';
        }).join('') + '</ul>' : '') +
      '</div>' + ctaRow('promise'), labelOf('lpPromT', title));
  }

  /* ---------- 6. conteúdo ---------- */
  function releaseNote(s) {
    if (s.release_mode === 'days' && Number(s.release_days) > 0) return 'Libera ' + s.release_days + ' ' + plural(s.release_days, 'dia', 'dias') + ' depois da sua entrada';
    if (s.release_mode === 'date' && Number(s.release_at) > Date.now()) return 'Libera em ' + B.fmt.date(s.release_at);
    return '';
  }

  function seasonHTML(s, i) {
    var lessons = s.lessons || [];
    var mins = lessons.reduce(function (t, l) { return t + (Number(l.duration_min) || 0); }, 0);
    var rel = releaseNote(s);
    return '<details class="lp-season"' + (i === 0 ? ' open' : '') + '>' +
      '<summary><span class="lp-season__tag">Temporada ' + (s.n || i + 1) + '</span>' +
        '<span class="lp-season__title">' + B.esc(clean(s.title)) + '</span>' +
        '<span class="lp-season__meta">' + lessons.length + ' ' + plural(lessons.length, 'episódio', 'episódios') + '<span aria-hidden="true"> · </span>' + durShort(mins) + '</span>' +
        B.icon('down', 'lp-chev') + '</summary>' +
      '<div class="lp-season__body">' +
        (clean(s.description) ? '<p class="lp-season__desc">' + B.esc(clean(s.description)) + '</p>' : '') +
        (rel ? '<p class="lp-season__rel">' + B.icon('clock') + '<span>' + B.esc(rel) + '</span></p>' : '') +
        '<ul class="lp-eps">' + lessons.map(function (l) {
          return '<li class="lp-ep">' +
            '<div class="lp-ep__thumb">' + B.epArt(l, l.label, S.c) + '</div>' +
            '<div class="lp-ep__main"><span class="lp-ep__label">' + B.esc(l.label || '') + '</span>' +
              '<h4 class="lp-ep__title">' + B.esc(clean(l.title)) + '</h4>' +
              (clean(l.description) ? '<p class="lp-ep__desc">' + B.esc(clean(l.description)) + '</p>' : '') + '</div>' +
            '<div class="lp-ep__side">' +
              (l.free_preview ? '<button type="button" class="btn btn--ghost btn--sm" data-free="' + B.esc(l.id) + '">' + B.icon('play') + 'Assistir grátis</button>' : '') +
              '<span class="lp-ep__dur">' + durShort(l.duration_min) + '</span></div>' +
          '</li>';
        }).join('') + '</ul></div></details>';
  }

  function contentHTML() {
    var seasons = (S.c.seasons || []).filter(function (s) { return s && s.lessons && s.lessons.length; });
    if (!seasons.length) return '';
    var m = S.lp.modules || {}, title = clean(m.title);
    return sec('conteudo', '',
      '<div class="lp-content">' +
        '<div class="lp-content__side">' + head('lpContT', title, m.intro) + '</div>' +
        '<div class="lp-seasons">' + seasons.map(seasonHTML).join('') + '</div>' +
      '</div>', labelOf('lpContT', title));
  }

  /* ---------- 7. para quem é / não é ---------- */
  function audienceHTML() {
    var a = S.lp.audience || {}, yes = list(a.for), no = list(a.not_for);
    if (!yes.length) yes = list(S.c.audience);
    if (!yes.length && !no.length) return '';
    function col(cls, title, items, ic) {
      if (!items.length) return '';
      return '<div class="lp-aud lp-aud--' + cls + '"><h2 class="t-2 lp-aud__t">' + B.esc(title) + '</h2><ul class="lp-aud__list">' +
        items.map(function (t) { return '<li><span class="lp-mark">' + B.icon(ic) + '</span><span>' + B.esc(t) + '</span></li>'; }).join('') + '</ul></div>';
    }
    return sec('publico', 'ink',
      '<div class="lp-auds' + (yes.length && no.length ? '' : ' lp-auds--one') + '">' +
        col('yes', clean(a.title) || 'Para quem é', yes, 'check') +
        col('no', 'Não é para você', no, 'x') + '</div>');
  }

  /* ---------- 8. instrutor ---------- */
  function instructorHTML() {
    var ins = S.lp.instructor || {}, ci = S.c.instructor || {};
    var name = clean(ci.name), text = clean(ins.text) || clean(ci.bio);
    if (!name && !text) return '';
    var title = clean(ins.title) || (name ? 'Quem conduz: ' + name : 'Quem conduz');
    var sig = name && norm(title).indexOf(norm(name)) < 0;
    var photo = clean(ci.photo);
    var fig = photo
      ? '<img src="' + B.esc(B.safeUrl(photo)) + '" alt="' + B.esc(name ? 'Foto de ' + name : 'Foto do instrutor') + '" loading="lazy" decoding="async">'
      : B.avatar({ id: S.c.id, name: name || S.c.title, avatar_color: S.c.color }, 220);
    return sec('instrutor', '',
      '<div class="lp-ins">' +
        '<figure class="lp-ins__fig hud' + (photo ? '' : ' lp-ins__fig--sigil') + '">' + fig + '</figure>' +
        '<div class="lp-ins__txt"><h2 class="t-1 lp-title" id="lpInsT">' + B.esc(title) + '</h2>' +
          (text ? '<div class="lp-prose">' + paras(text) + '</div>' : '') +
          (sig ? '<p class="lp-ins__sig t-tag">' + B.esc(name) + '</p>' : '') + '</div>' +
      '</div>', 'lpInsT');
  }

  /* ---------- 9. bônus ---------- */
  function bonusesHTML() {
    var I = S.info, bon = I.bonuses;
    if (!bon.length) return '';
    var title = clean((S.lp.bonuses || {}).title) || 'Bônus inclusos';
    return sec('bonus', 'ink',
      head('lpBonT', title, '') +
      '<ul class="lp-bonuses">' + bon.map(function (b) {
        return '<li class="lp-bonus"><span class="lp-bonus__ic">' + B.icon('gift') + '</span>' +
          '<h3 class="lp-bonus__t">' + B.esc(b.title) + '</h3>' +
          (b.text ? '<p class="lp-bonus__p">' + B.esc(b.text) + '</p>' : '') +
          (b.value > 0 ? '<p class="lp-bonus__v">Vale <s>' + brl(b.value) + '</s><span class="chip chip--ok">Incluso</span></p>' : '<p class="lp-bonus__v"><span class="chip chip--ok">Incluso</span></p>') +
        '</li>';
      }).join('') + '</ul>' +
      (I.bonusTotal > 0 ? '<p class="lp-bonuses__sum">Os bônus somam <b>' + brl(I.bonusTotal) + '</b> e entram sem custo extra.</p>' : ''), 'lpBonT');
  }

  /* ---------- 10. depoimentos (nunca inventados) ---------- */
  function testimonialsHTML() {
    var t = (Array.isArray(S.c.testimonials) ? S.c.testimonials : []).filter(function (x) { return x && clean(x.text) && clean(x.name); });
    if (!t.length) return '';
    return sec('depoimentos', '',
      head('lpTestT', 'O que os alunos dizem', '') +
      '<ul class="lp-quotes">' + t.map(function (x) {
        return '<li class="lp-quote"><blockquote><p>' + B.nl2br(clean(x.text)) + '</p></blockquote>' +
          '<div class="lp-quote__by">' + B.avatar({ id: x.name, name: x.name, avatar: clean(x.photo) }, 44) +
          '<div class="min0"><b>' + B.esc(clean(x.name)) + '</b>' + (clean(x.role) ? '<span>' + B.esc(clean(x.role)) + '</span>' : '') + '</div></div></li>';
      }).join('') + '</ul>', 'lpTestT');
  }

  /* ---------- 11. oferta ---------- */
  function offerHTML() {
    var o = S.lp.offer || {}, I = S.info, c = S.c, oc = offerClock();
    var title = clean(o.title) || 'Tudo o que você leva';
    var bullets = list(o.bullets);
    var days = Number(c.guarantee_days) || 0;

    var buy = '<div class="lp-buy">';
    if (!I.free && !I.soon && I.perceived > I.price) {
      buy += '<p class="lp-buy__was"><span>Valor total do que você leva</span> <s>' + brl(I.perceived) + '</s></p>';
    }
    buy += '<p class="lp-buy__just">' + (I.soon ? 'valor previsto' : I.free ? 'acesso' : 'por apenas') + '</p>';
    buy += I.free
      ? '<p class="lp-buy__price"><span class="lp-int lp-int--word">Grátis</span></p>'
      : '<p class="lp-buy__price"><span class="sr-only">' + B.esc(brl(I.price)) + '</span><span aria-hidden="true">' + bigPrice(I.price) + '</span></p>';
    if (I.inst && !I.soon) buy += '<p class="lp-buy__inst">ou ' + I.n + 'x de ' + money(I.inst) + I.star + ' no cartão</p>';
    if (I.save && !I.soon) buy += '<span class="sticker lp-buy__save">Economia de ' + I.save + '%</span>';
    buy += '<div class="lp-buy__cta">' + ctaBtn('offer', ctaText('offer'), 'btn--lg btn--block') + '</div>';
    if (I.soon) buy += '<p class="lp-buy__fine">Este curso ainda não está à venda. Volte em breve.</p>';
    if (I.free) buy += '<p class="lp-buy__fine">Sem cartão. O acesso chega no seu e-mail.</p>';
    if (!I.free && !I.soon && (I.pix || I.card)) {
      buy += '<ul class="lp-pay">' +
        (I.pix ? '<li>' + B.icon('pix') + '<span>Pix com liberação na hora</span></li>' : '') +
        (I.card ? '<li>' + B.icon('card') + '<span>Cartão' + (I.n > 1 ? ' em até ' + I.n + 'x' : '') + '</span></li>' : '') + '</ul>';
    }
    if (!I.free && !I.soon && days > 0) buy += '<p class="lp-buy__guar">' + B.icon('shield') + '<span>' + days + ' ' + plural(days, 'dia', 'dias') + ' de garantia</span></p>';
    if (oc.text || oc.live) buy += '<div class="lp-urgency">' + (oc.text ? '<p>' + B.esc(oc.text) + '</p>' : '') + countHTML('offer') + '</div>';
    if (I.inst && I.rate > 0 && !I.soon) buy += '<p class="lp-buy__fine">*Parcelas com juros do cartão. O valor exato aparece no Mercado Pago.</p>';
    buy += '</div>';

    return '<section class="lp-sec lp-sec--offer" id="oferta" aria-labelledby="lpOfferT"><div class="wrap wrap--mid"><div class="lp-offer hud">' +
      '<div class="lp-offer__list"><h2 class="t-1 lp-title" id="lpOfferT">' + B.esc(title) + '</h2>' +
        (bullets.length ? '<ul class="lp-checks">' + bullets.map(function (b) { return '<li>' + B.icon('check') + '<span>' + B.esc(b) + '</span></li>'; }).join('') + '</ul>' : '') +
      '</div>' + buy + '</div></div></section>';
  }

  /* ---------- 12. garantia ---------- */
  function sealSVG(days) {
    var brand = clean(B.brand.name).toUpperCase().slice(0, 16);
    var ring = ('GARANTIA ' + brand + ' ᛟ ');
    ring = ring + ring;
    var fs = Math.max(6.5, Math.min(11, 424 / ring.length / 0.8));
    var ticks = '';
    for (var i = 0; i < 72; i++) {
      var a = i / 72 * Math.PI * 2, r2 = i % 6 === 0 ? 88 : 91.5;
      ticks += '<line x1="' + (100 + Math.cos(a) * 95).toFixed(1) + '" y1="' + (100 + Math.sin(a) * 95).toFixed(1) +
        '" x2="' + (100 + Math.cos(a) * r2).toFixed(1) + '" y2="' + (100 + Math.sin(a) * r2).toFixed(1) + '"/>';
    }
    return '<svg class="lp-seal" viewBox="0 0 200 200" role="img" aria-label="Selo de garantia de ' + days + ' ' + plural(days, 'dia', 'dias') + '">' +
      '<defs><path id="lpSealPath" d="M100 100 m-68 0 a68 68 0 1 1 136 0 a68 68 0 1 1 -136 0"/></defs>' +
      '<g class="s-ticks">' + ticks + '</g>' +
      '<circle class="s-ring" cx="100" cy="100" r="98"/>' +
      '<circle class="s-ring s-ring--in" cx="100" cy="100" r="50"/>' +
      '<text class="s-text" style="font-size:' + fs.toFixed(1) + 'px"><textPath href="#lpSealPath" textLength="424" lengthAdjust="spacing">' + B.esc(ring) + '</textPath></text>' +
      '<text class="s-rune" x="100" y="80" text-anchor="middle">ᛟ</text>' +
      '<text class="s-num" x="100" y="121" text-anchor="middle">' + days + '</text>' +
      '<text class="s-unit" x="100" y="138" text-anchor="middle">' + plural(days, 'DIA', 'DIAS') + '</text></svg>';
  }

  function guaranteeHTML() {
    var g = S.lp.guarantee || {}, days = Number(S.c.guarantee_days) || 0;
    if (S.info.free || days <= 0) return '';
    var title = clean(g.title) || (days + ' ' + plural(days, 'dia', 'dias') + ' de garantia');
    var text = clean(g.text) || ('Você tem ' + days + ' ' + plural(days, 'dia', 'dias') + ' para pedir o seu dinheiro de volta.');
    return sec('garantia', 'ink',
      '<div class="lp-guar"><div class="lp-guar__seal">' + sealSVG(days) + '</div>' +
      '<div class="lp-guar__txt"><h2 class="t-1 lp-title" id="lpGuarT">' + B.esc(title) + '</h2><div class="lp-prose">' + paras(text) + '</div></div></div>', 'lpGuarT');
  }

  /* ---------- 13. perguntas frequentes ---------- */
  function faqHTML() {
    var f = (Array.isArray(S.lp.faq) && S.lp.faq.length ? S.lp.faq : (S.c.faq || [])).filter(function (x) { return x && clean(x.q) && clean(x.a); });
    if (!f.length) return '';
    return sec('perguntas', '',
      '<div class="lp-faqwrap"><div class="lp-faqwrap__side">' + head('lpFaqT', 'Perguntas frequentes', '') + '</div>' +
      '<div class="lp-faq">' + f.map(function (x) {
        return '<details class="lp-q"><summary><span>' + B.esc(clean(x.q)) + '</span>' + B.icon('plus', 'lp-q__ic') + '</summary><div class="lp-q__a">' + paras(x.a) + '</div></details>';
      }).join('') + '</div></div>', 'lpFaqT');
  }

  /* ---------- 14. chamada final ---------- */
  function finalHTML() {
    var f = S.lp.final_cta || {}, c = S.c, I = S.info;
    var title = clean(f.title) || clean(c.title), text = clean(f.text);
    return '<section class="lp-final" id="final" aria-labelledby="lpFinalT">' +
      '<div class="lp-final__art" aria-hidden="true">' + B.art(c, { title: false, mark: false }) + '</div>' +
      '<div class="lp-final__shade" aria-hidden="true"></div>' +
      '<div class="wrap wrap--mid"><div class="lp-final__box hud">' +
        '<h2 class="t-hero lp-final__t" id="lpFinalT">' + B.esc(title) + '</h2>' +
        (text ? '<p class="lp-final__p">' + B.esc(text) + '</p>' : '') +
        '<div class="lp-ctarow">' + ctaBtn('final', ctaText('final'), 'btn--lg') +
          (I.soon ? '<p class="lp-ctarow__soon">Este curso ainda não está à venda.</p>' : teaserHTML()) + '</div>' +
      '</div></div></section>';
  }

  /* ---------- 15. rodapé ---------- */
  function waUrl() {
    var dg = clean((S.data.brand || {}).support_whatsapp).replace(/\D/g, '');
    if (!dg) return '';
    if (dg.length <= 11) dg = '55' + dg;
    return 'https://wa.me/' + dg + '?text=' + encodeURIComponent('Olá! Tenho uma dúvida sobre o curso ' + clean(S.c.title) + '.');
  }

  function footerHTML() {
    var br = S.data.brand || {}, c = S.c, I = S.info;
    var wa = waUrl(), phone = clean(br.support_whatsapp), mail = clean(br.support_email), sup = clean(c.support_url);
    var terms = clean(br.terms_url), priv = clean(br.privacy_url);
    var support = '';
    if (wa) support += '<li><span>WhatsApp</span><a href="' + B.esc(wa) + '" target="_blank" rel="noopener">' + B.esc(B.fmt.phone(phone) || phone) + '</a></li>';
    if (mail) support += '<li><span>E-mail</span><a href="' + B.esc('mailto:' + mail) + '">' + B.esc(mail) + '</a></li>';
    if (sup) support += '<li><span>Ajuda</span><a href="' + B.esc(B.safeUrl(sup)) + '" target="_blank" rel="noopener">Central de suporte</a></li>';
    var legal = '';
    if (terms) legal += '<li><a href="' + B.esc(B.safeUrl(terms)) + '" target="_blank" rel="noopener">Termos de uso</a></li>';
    if (priv) legal += '<li><a href="' + B.esc(B.safeUrl(priv)) + '" target="_blank" rel="noopener">Política de privacidade</a></li>';
    return '<footer class="lp-foot"><div class="wrap wrap--mid">' +
      '<div class="lp-foot__grid">' +
        '<div class="lp-foot__brand"><a class="brand" href="' + B.esc(B.base + 'index.html') + '">' + B.brandMark() + '</a>' +
          (clean(br.tagline) ? '<p>' + B.esc(clean(br.tagline)) + '</p>' : '') + '</div>' +
        (support ? '<div><h2 class="lp-foot__h">Suporte</h2><ul class="lp-foot__list">' + support + '</ul></div>' : '') +
        (legal ? '<div><h2 class="lp-foot__h">Legal</h2><ul class="lp-foot__list">' + legal + '</ul></div>' : '') +
      '</div>' +
      '<div class="lp-foot__base">' +
        (I.free || I.soon ? '<span></span>' : '<span class="lp-foot__secure">' + B.icon('lock') + 'Pagamento processado com segurança pelo Mercado Pago</span>') +
        '<span>© ' + new Date().getFullYear() + ' ' + B.esc(B.brand.name) + '</span>' +
      '</div></div></footer>';
  }

  /* ---------- extras: barra inferior (celular) e WhatsApp ---------- */
  function dockHTML() {
    var I = S.info;
    if (I.soon) return '';
    return '<div class="lp-dock" id="lpDock" aria-hidden="true"><div class="lp-dock__price">' +
      (I.free ? '<b>Grátis</b>' : (I.anchor ? '<s>' + brl(I.anchor) + '</s>' : '') + '<b>' + brl(I.price) + '</b>' +
        (I.inst ? '<small>ou ' + I.n + 'x de ' + money(I.inst) + I.star + '</small>' : '')) +
      '</div>' + ctaBtn('dock', I.free ? 'Acessar grátis' : 'Garantir acesso', 'lp-dock__cta') + '</div>';
  }

  function waHTML() {
    var wa = waUrl();
    if (!wa) return '';
    return '<a class="lp-wa" href="' + B.esc(wa) + '" target="_blank" rel="noopener" aria-label="Falar com o suporte no WhatsApp">' + B.icon('whatsapp') + '</a>';
  }

  /* ---------- modais ---------- */
  function openTrailer() {
    var c = S.c, pl = null;
    B.modal({
      title: clean(c.title), size: 'wide',
      body: '<div id="lpTrailer"></div>',
      onOpen: function (m) {
        pl = B.player.mount(B.$('#lpTrailer', m.el), c.trailer, { art: B.art(c, { title: false, mark: false }) });
      },
      onClose: function () { if (pl) pl.destroy(); }
    });
  }

  function openFree(id) {
    var found = null;
    (S.c.seasons || []).forEach(function (s) { (s.lessons || []).forEach(function (l) { if (l.id === id) found = l; }); });
    if (!found) return;
    // a URL do vídeo é protegida e não vem em `landing`: a aula grátis roda na plataforma
    var url = B.base + 'index.html#/aula/' + encodeURIComponent(found.id);
    B.modal({
      title: clean(found.title),
      body: '<div class="lp-fp">' +
        '<a class="lp-fp__frame" href="' + B.esc(url) + '" aria-label="Assistir ' + B.esc(clean(found.title)) + ' na plataforma">' +
          B.epArt(found, found.label, S.c) + '<span class="lp-fp__play">' + B.icon('play') + '</span></a>' +
        (clean(found.description) ? '<p class="t-muted">' + B.esc(clean(found.description)) + '</p>' : '') +
        '<a class="btn btn--primary btn--lg btn--block lp-btn2" href="' + B.esc(url) + '"><strong>Assista grátis na plataforma</strong><small>(crie sua conta em 30 segundos)</small></a>' +
      '</div>',
      actions: [{ label: 'Fechar' }]
    });
  }

  /* ---------- compra ---------- */
  function track(type) {
    if (S.preview) return;
    var utm = B.attr.utm() || {};
    B.beacon('track', {
      type: type, slug: S.c.slug, aff: S.ref || B.attr.ref(), sid: B.attr.sid(),
      utm_source: utm.source || '', utm_campaign: utm.campaign || '', ref_url: d.referrer || ''
    });
  }

  function openCheckout() {
    B.checkout.open({
      course: S.c, aff: S.ref || B.attr.ref(), coupon: B.qs('cupom') || '', email: B.qs('email') || '',
      src: 'lp', checkout: S.data.checkout,
      onPaid: function (id) { location.href = B.base + 'obrigado.html?o=' + encodeURIComponent(id); return false; }
    });
  }

  function onCta(ev, el) {
    if (S.info.soon) return;
    if (S.preview) {
      // a pré-visualização não cria pedidos nem rastreia
      if (el.tagName !== 'A') { ev.preventDefault(); B.toast('Pré-visualização: o checkout só abre na página publicada.', 'info', 3600); }
      return;
    }
    track('cta');
    if (el.tagName === 'A') return;   // checkout externo: o link abre em outra aba
    ev.preventDefault();
    openCheckout();
  }

  /* ---------- contagem regressiva ---------- */
  function startCountdown() {
    clearInterval(S.timer);
    var oc = offerClock(), nodes = B.$$('[data-count]', root);
    if (!oc.live || !nodes.length) return;
    function paint() {
      var s = Math.max(0, Math.floor((oc.until - Date.now()) / 1000));
      var v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
      nodes.forEach(function (n) {
        Object.keys(v).forEach(function (k) {
          var b = n.querySelector('[data-u="' + k + '"]');
          if (b) b.textContent = pad2(v[k]);
        });
      });
      if (!s) {
        clearInterval(S.timer);
        // prazo acabou com a página aberta: tira a contagem e o texto de urgência
        nodes.forEach(function (n) { n.hidden = true; });
        B.$$('.lp-urgency', root).forEach(function (n) { n.hidden = true; });
      }
    }
    paint();
    S.timer = setInterval(paint, 1000);
  }

  /* ---------- observadores: barra fixa e barra inferior ---------- */
  function unobserve() { S.io.forEach(function (o) { o.disconnect(); }); S.io = []; }

  function observe() {
    unobserve();
    if (!('IntersectionObserver' in w)) { root.classList.add('has-cta', 'dock-on'); return; }
    var st = { past: false, offer: false, final: false, foot: false };
    function apply() {
      root.classList.toggle('has-cta', st.past);
      var on = st.past && !st.offer && !st.final && !st.foot;
      root.classList.toggle('dock-on', on);
      var dock = B.$('#lpDock', root);
      if (dock) dock.setAttribute('aria-hidden', on ? 'false' : 'true');
      d.documentElement.classList.toggle('lp-dock-on', on);
    }
    function watch(el, fn, margin) {
      if (!el) return;
      var io = new IntersectionObserver(function (es) { fn(es[es.length - 1]); apply(); }, { rootMargin: margin || '0px', threshold: [0, 0.01] });
      io.observe(el);
      S.io.push(io);
    }
    watch(B.$('.lp-hero__cta', root), function (e) { st.past = !e.isIntersecting && e.boundingClientRect.top < 0; }, '-72px 0px 0px 0px');
    watch(B.$('#oferta', root), function (e) { st.offer = e.isIntersecting; }, '0px 0px -80px 0px');
    watch(B.$('#final', root), function (e) { st.final = e.isIntersecting; }, '0px 0px -80px 0px');
    watch(B.$('.lp-foot', root), function (e) { st.foot = e.isIntersecting; });
  }

  function bindScroll() {
    function upd() { var bar = B.$('#lpBar', root); if (bar) bar.classList.toggle('is-solid', w.scrollY > 40); S.tick = false; }
    upd();
    if (S.scrollBound) return;
    S.scrollBound = true;
    w.addEventListener('scroll', function () { if (!S.tick) { S.tick = true; w.requestAnimationFrame(upd); } }, { passive: true });
  }

  /* ---------- montagem ---------- */
  function seo() {
    var s = S.lp.seo || {};
    d.title = clean(s.title) || (clean(S.c.title) + ' | ' + clean(B.brand.name));
    var m = d.querySelector('meta[name="description"]');
    if (!m) { m = d.createElement('meta'); m.setAttribute('name', 'description'); d.head.appendChild(m); }
    m.setAttribute('content', clean(s.description) || clean(S.c.short_desc));
  }

  function render() {
    S.info = computeInfo();
    root.className = 'lp' + (S.preview ? ' is-preview' : '') + (S.info.soon ? ' is-soon' : '') + (S.info.free ? ' is-free' : '');
    root.innerHTML =
      (S.preview ? '<div class="lp-strip" role="status">Pré-visualização · sem rastreamento</div>' : '') +
      barHTML() +
      '<main id="lpMain">' + [heroHTML(), statsHTML(), painHTML(), promiseHTML(), contentHTML(), audienceHTML(), instructorHTML(),
        bonusesHTML(), testimonialsHTML(), offerHTML(), guaranteeHTML(), faqHTML(), finalHTML()].join('') + '</main>' +
      footerHTML() + dockHTML() + waHTML();
    seo();

    // fundo alternado entre seções (a oferta zera a sequência)
    var alt = false;
    B.$$('main .lp-sec', root).forEach(function (s) {
      if (s.id === 'oferta') { alt = false; return; }
      if (alt) s.classList.add('lp-sec--alt');
      alt = !alt;
    });

    // o desenho do sigilo no topo: todos os traços terminam juntos
    B.$$('.lp-hero .art__sigil > *', root).forEach(function (n) { if (!n.classList.contains('sg-dot')) n.setAttribute('pathLength', '100'); });

    // perguntas: uma aberta por vez
    B.$$('.lp-q', root).forEach(function (dt) {
      dt.addEventListener('toggle', function () {
        if (!dt.open) return;
        B.$$('.lp-q', root).forEach(function (o) { if (o !== dt && o.open) o.open = false; });
      });
    });

    if (S.embers) S.embers.stop();
    S.embers = B.embers(B.$('.lp-hero', root), { count: w.innerWidth < 760 ? 22 : 40 });
    bindScroll();
    observe();
    startCountdown();
  }

  function show(data) {
    S.data = data; S.c = data.course; S.lp = data.lp || {};
    B.brand = Object.assign({ name: B.cfg.BRAND, tagline: B.cfg.TAGLINE }, B.brand, data.brand || {});
    render();
  }

  /* ---------- rastreamento (nunca no preview) ---------- */
  function startTracking() {
    if (S.preview || S.tracked || !S.c) return;
    S.tracked = true;
    var c = S.c;
    if (S.ref) B.attr.setRef(S.ref, (S.data.checkout || {}).cookie_days);
    B.pixel.init(S.data.pixel_ids || []);
    B.pixel.track('PageView');
    B.pixel.track('ViewContent', { value: c.price, currency: 'BRL', content_ids: [c.id], content_name: c.title, content_type: 'product' });
    track('view');
  }

  function autoCheckout() {
    if (S.preview || S.info.soon || clean(S.c.checkout_url) || B.qs('checkout') !== '1') return;
    setTimeout(function () { track('checkout'); openCheckout(); }, 350);
  }

  /* ---------- carregamento ---------- */
  function same(a, b) {
    return ['price', 'anchor_price', 'status', 'scarcity_until', 'max_installments', 'checkout_url', 'guarantee_days', 'access_days']
      .every(function (k) { return String(a[k]) === String(b[k]); });
  }

  function fromStatic(pre) {
    S.slug = pre.course.slug;
    show(pre);
    autoCheckout();
    if (!S.ref) { startTracking(); return; }
    // com indicação: busca o pixel do afiliado (e confere o preço) em segundo plano
    var go = (function () { var done = false; return function () { if (!done) { done = true; startTracking(); } }; })();
    setTimeout(go, 1800);
    B.api('landing', { slug: S.slug, ref: S.ref }).then(function (fresh) {
      if (!fresh || !fresh.course) return go();
      if (!same(S.c, fresh.course)) { S.data = fresh; show(fresh); }
      else { S.data.aff = fresh.aff || null; S.data.pixel_ids = fresh.pixel_ids || S.data.pixel_ids; }
      var aff = S.data.aff && clean(S.data.aff.name), el = B.$('#lpAff', root);
      if (el) { el.innerHTML = aff ? affInner(aff) : ''; el.hidden = !aff; }
      go();
    }, go);
  }

  function fromApi() {
    if (!S.slug) return fail({ code: 'NOT_FOUND' });
    return B.api('landing', { slug: S.slug, ref: S.ref, preview: S.preview || undefined }).then(function (data) {
      show(data);
      autoCheckout();
      startTracking();
    }, fail);
  }

  function fail(e) {
    var gone = !e || e.code === 'NOT_FOUND';
    d.title = (gone ? 'Esta página não existe' : 'Não foi possível carregar') + ' | ' + clean(B.brand.name);
    root.className = 'lp lp--gone';
    root.innerHTML = '<main class="lp-gone"><div class="lp-gone__box hud">' +
      '<a class="brand" href="' + B.esc(B.base + 'index.html') + '">' + B.brandMark() + '</a>' +
      B.sigil('sem-pagina', 'lp-gone__sigil') +
      '<p class="lp-gone__tag t-tag">' + (gone ? 'Caminho apagado' : 'Sem sinal') + '</p>' +
      '<h1 class="t-1">' + (gone ? 'Esta página não existe' : 'Não foi possível carregar esta página') + '</h1>' +
      '<p class="lp-lead">' + (gone ? 'O endereço pode estar errado ou o curso saiu do ar.' : B.esc((e && e.message) || 'Verifique sua conexão e tente de novo.')) + '</p>' +
      '<div class="row">' +
        (gone ? '' : '<button type="button" class="btn btn--primary btn--lg" data-retry>Tentar de novo</button>') +
        '<a class="btn ' + (gone ? 'btn--primary' : 'btn--ghost') + ' btn--lg" href="' + B.esc(B.base + 'index.html') + '">Ver todos os cursos</a>' +
      '</div></div></main>';
    var r = B.$('[data-retry]', root);
    if (r) r.addEventListener('click', function () { location.reload(); });
  }

  function delegate() {
    if (S.wired) return;
    S.wired = true;
    B.on(root, 'click', '[data-cta]', onCta);
    B.on(root, 'click', '[data-trailer]', function () { openTrailer(); });
    B.on(root, 'click', '[data-free]', function (ev, el) { openFree(el.getAttribute('data-free')); });
  }

  B.boot(function () {
    S.preview = B.qs('preview') === '1';
    // na pré-visualização o token do administrador precisa ir junto (rascunhos),
    // por isso o escopo é trocado ANTES de qualquer B.api
    if (S.preview) B.session.use('admin');
    d.documentElement.classList.add('no-bottomnav');
    if (!S.preview) B.demoBar('lp');
    delegate();
    root.className = 'lp';
    root.innerHTML = '<div class="lp-boot" role="status" aria-label="Carregando"><div class="spinner"></div></div>';

    var cap = S.preview ? null : B.attr.capture();
    S.ref = clean(cap ? cap.ref : (B.qs('ref') || B.qs('aff'))).toUpperCase().slice(0, 40);
    S.slug = clean(B.qs('c') || B.qs('slug'));

    var pre = !S.preview && w.__LANDING__ && w.__LANDING__.course ? w.__LANDING__ : null;
    if (pre) return fromStatic(pre);
    // demo: a persona de ADM entra sozinha (em produção o token já vem do painel)
    var ready = S.preview && B.ensureDemoLogin ? B.ensureDemoLogin().then(null, function () {}) : Promise.resolve();
    return ready.then(fromApi);
  });
})(window, document);

/* =====================================================================
   BRASA · app-pages.js — início, curso, busca, minha lista, perfil, suporte
   ===================================================================== */
(function (w, d) {
  'use strict';
  var A = w.APP, esc = B.esc;

  // Enter abre cards que funcionam como link
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target;
    if (t && t.matches && t.matches('[role="link"][data-go]')) { e.preventDefault(); B.router.go(t.dataset.go); }
  });

  /* ---------------- cards ---------------- */
  function layers(c) {
    return '<div class="tile__layer tile__layer--wide">' + B.art(c) + '</div><div class="tile__layer tile__layer--tall">' + B.art(c, { tall: true }) + '</div>';
  }
  function badges(c) {
    var b = '', soon = c.status === 'coming_soon';
    if (soon) b += '<span class="tile__lock tile__lock--soon">' + B.icon('clock') + 'Em breve</span>';
    else if (!c.owned && c.price > 0) b += '<span class="tile__lock">' + B.icon('lock') + B.fmt.money(c.price) + '</span>';
    else if (!c.owned) b += '<span class="tile__lock tile__lock--free">Grátis</span>';
    if ((c.owned && c.new_lessons > 0) || (!c.owned && c.is_new && !soon)) b += '<span class="tile__sticker sticker">novo</span>';
    return b;
  }
  A.tile = function (c) {
    var locked = !c.owned && (c.status === 'coming_soon' || c.price > 0);
    var prog = c.owned && c.progress && c.progress.pct > 0 ? '<div class="tile__progress bar"><div class="bar__fill" style="--p:' + c.progress.pct + '%"></div></div>' : '';
    var main = c.status === 'coming_soon' ? '' : c.owned
      ? '<button type="button" class="iconbtn iconbtn--solid" data-play="' + ((c.progress && c.progress.next_lesson_id) || '') + '" data-course="' + c.slug + '" aria-label="Assistir">' + B.icon('play') + '</button>'
      : '<button type="button" class="iconbtn iconbtn--solid" data-buy="' + c.id + '" aria-label="' + (c.price > 0 ? 'Desbloquear' : 'Adicionar grátis') + '">' + B.icon(c.price > 0 ? 'unlock' : 'plus') + '</button>';
    return '<article class="tile tile--auto' + (locked ? ' is-locked' : '') + '" role="link" tabindex="0" data-go="/curso/' + esc(c.slug) + '" aria-label="' + esc(c.title) + '">' +
      layers(c) + badges(c) + prog +
      '<div class="tile__info" aria-hidden="true"><div class="tile__info-row">' + main + A.listBtn(c, { round: true }) +
      '<button type="button" class="iconbtn iconbtn--ring" data-go="/curso/' + esc(c.slug) + '" aria-label="Mais informações" tabindex="-1">' + B.icon('down') + '</button></div>' +
      '<div class="tile__info-title">' + esc(c.title) + '</div><div class="tile__info-meta">' + A.metaLine(c) + '</div></div>' +
      '</article>';
  };
  function contTile(it) {
    var c = A.byId(it.course_id) || it;
    return '<article class="tile tile--cont" role="link" tabindex="0" data-go="/aula/' + it.lesson_id + '" aria-label="Continuar ' + esc(it.title) + ', ' + esc(it.label) + '">' +
      '<div class="tile__layer">' + B.art(c, { title: false }) + '</div><span class="tile__playbig" aria-hidden="true">' + B.icon('play') + '</span>' +
      '<div class="tile__cont"><div class="tile__cont-course">' + esc(it.title) + '</div><div class="tile__cont-ep"><span class="t-hud t-mustard">' + esc(it.label) + '</span> <span class="ellipsis">' + esc(it.lesson_title) + '</span></div>' +
      '<div class="bar"><div class="bar__fill" style="--p:' + Math.max(3, it.lesson_pct || 0) + '%"></div></div></div></article>';
  }
  function rankTile(c, i) {
    return '<article class="rankcard" role="link" tabindex="0" data-go="/curso/' + esc(c.slug) + '" aria-label="' + (i + 1) + 'º: ' + esc(c.title) + '">' +
      '<span class="rankcard__num" aria-hidden="true">' + (i + 1) + '</span>' +
      '<div class="tile tile--tall' + (!c.owned && (c.price > 0 || c.status === 'coming_soon') ? ' is-locked' : '') + '">' + B.art(c, { tall: true }) + badges(c) + '</div></article>';
  }
  function rail(title, items, opts) {
    opts = opts || {};
    if (!items.length) return '';
    return '<section class="rail' + (opts.cls ? ' ' + opts.cls : '') + '" aria-label="' + esc(title) + '">' +
      '<div class="rail__head"><h2 class="rail__title">' + esc(title) + '</h2>' + (opts.sub ? '<span class="rail__sub t-sm t-faint">' + opts.sub + '</span>' : '') + '</div>' +
      '<button type="button" class="rail__nav rail__nav--prev" aria-label="Voltar">' + B.icon('left') + '</button>' +
      '<div class="rail__track">' + items.join('') + '</div>' +
      '<button type="button" class="rail__nav rail__nav--next" aria-label="Avançar">' + B.icon('right') + '</button></section>';
  }
  A.grid = function (courses) { return '<div class="tgrid">' + courses.map(A.tile).join('') + '</div>'; };

  /* =================================================================
     INÍCIO
     ================================================================= */
  function pickFeatured(list) {
    return list.filter(function (c) { return c.featured && c.status === 'published'; })[0] ||
      list.filter(function (c) { return c.status === 'published' && !c.owned && c.price > 0; })[0] || list[0];
  }
  function hero(h) {
    var cont = h.continue[0], c = cont ? A.byId(cont.course_id) : pickFeatured(h.courses);
    if (!c) return '';
    var kicker, meta, actions, price = '';
    if (cont) {
      kicker = 'continue sua jornada';
      meta = '<span class="chip chip--mustard">' + esc(cont.label) + '</span><span class="hero__ep">' + esc(cont.lesson_title) + '</span><span class="hero__pct t-faint">' + cont.course_pct + '% do curso</span>';
      actions = '<button type="button" class="btn btn--primary btn--lg" data-play="' + cont.lesson_id + '">' + B.icon('play') + 'Continuar ' + esc(cont.label) + '</button>' +
        '<button type="button" class="btn btn--glass btn--lg" data-go="/curso/' + esc(c.slug) + '">' + B.icon('info') + 'Mais informações</button>';
    } else {
      kicker = c.owned ? 'na sua estante' : c.status === 'coming_soon' ? 'vem aí' : 'destaque da casa';
      meta = '<span class="hero__ep">' + A.metaLine(c) + '</span>';
      actions = A.primaryBtn(c, { lg: true }) + (c.status === 'coming_soon' ? A.listBtn(c) : '<button type="button" class="btn btn--glass btn--lg" data-go="/curso/' + esc(c.slug) + '">' + B.icon('info') + 'Mais informações</button>');
      if (!c.owned && c.price > 0) price = '<div class="price price--hero">' + A.priceHtml(c) + '</div>';
    }
    return '<section class="hero" aria-label="Destaque">' +
      '<div class="hero__bg" aria-hidden="true">' + B.art(c, { title: false, mark: false }) + '</div><div class="hero__shade" aria-hidden="true"></div>' +
      '<div class="hero__inner wrap">' +
      '<div class="hero__poster tile tile--tall" data-go="/curso/' + esc(c.slug) + '" role="link" tabindex="0" aria-label="' + esc(c.title) + '">' + B.art(c, { tall: true }) + '</div>' +
      '<div class="hero__content">' +
      '<div class="t-tag hero__kicker">' + kicker + '</div>' +
      (c.logo ? '<img class="hero__logo" src="' + esc(B.safeUrl(c.logo)) + '" alt="' + esc(c.title) + '">' : '<h1 class="t-hero hero__title">' + esc(c.title) + '</h1>') +
      '<div class="hero__meta">' + meta + '</div>' +
      (c.short_desc ? '<p class="hero__desc">' + esc(c.short_desc) + '</p>' : '') +
      '<div class="hero__actions">' + actions + '</div>' + price +
      '</div></div></section>';
  }
  A.pages.home = function () {
    var main = A.enter('home');
    A.loadHome(true).then(function (h) {
      var cs = h.courses;
      var owned = cs.filter(function (c) { return c.owned; }).sort(function (a, b) { return ((b.progress && b.progress.last_at) || 0) - ((a.progress && a.progress.last_at) || 0); });
      var locked = cs.filter(function (c) { return !c.owned && c.status === 'published' && c.price > 0; });
      var picks = cs.filter(function (c) { return c.status === 'published'; }).slice(0, 10);
      var soon = cs.filter(function (c) { return c.status === 'coming_soon'; });
      var free = cs.filter(function (c) { return !c.owned && c.status === 'published' && !(c.price > 0); });
      // "Em breve" em um trilho por trilha, na ordem do catálogo: com dezenas de cursos, um trilho só não se navega
      var soonCats = [];
      soon.forEach(function (c) { var k = c.category || 'Outros'; if (soonCats.indexOf(k) < 0) soonCats.push(k); });
      var soonRails = soonCats.map(function (k) {
        var list = soon.filter(function (c) { return (c.category || 'Outros') === k; });
        return rail(k, list.map(A.tile), { sub: 'em breve · toque no + para ser avisado' });
      }).join('');
      var first = (h.user.name || '').split(' ')[0];
      // banners: um logo depois do destaque e outro depois do segundo trilho que aparecer
      var rs = [
        rail('Continue assistindo', h.continue.map(contTile), { cls: 'rail--wide', sub: first ? 'de onde você parou, ' + esc(first) : '' }),
        rail('Sua estante', owned.map(A.tile), { sub: B.fmt.plural(owned.length, 'curso', 'cursos') }),
        rail('Desbloqueie a próxima temporada', locked.map(A.tile), { sub: 'acesso na hora no Pix' })
      ].filter(Boolean);
      var top = A.banners ? A.banners('home_top') : '', mid = A.banners ? A.banners('home_middle') : '';
      main.innerHTML = hero(h) +
        '<div class="rails">' + top +
        rs.slice(0, 2).join('') + mid + rs.slice(2).join('') +
        (picks.length >= 3 ? rail('Escolhas da casa', picks.map(rankTile), { cls: 'rail--rank' }) : '') +
        soonRails +
        rail('Grátis para começar', free.map(A.tile)) +
        '</div>';
      var hEl = B.$('.hero', main);
      if (hEl) { var em = B.embers(hEl, { count: 34 }); A.onLeave(em.stop); }
      A.paintBell();
    }).catch(function (e) { A.fail(main, e); });
  };

  /* =================================================================
     CURSO
     ================================================================= */
  function epHtml(c, s, l) {
    var state = l.done ? '<span class="ep__state ep__state--done" title="Concluída">' + B.icon('check') + '</span>'
      : l.locked === 'not_owned' ? '<span class="ep__state" title="Bloqueada">' + B.icon('lock') + '</span>'
        : l.locked === 'drip' ? '<span class="ep__state ep__state--drip">Libera ' + B.fmt.dateShort(s.opens_at) + '</span>' : '';
    var chips = (l.free_preview && !c.owned ? '<span class="chip chip--ok">Grátis</span>' : '') + (l.is_new ? '<span class="sticker sticker--sm">novo</span>' : '');
    return '<button type="button" class="ep' + (l.locked ? ' is-locked' : '') + (l.done ? ' is-done' : '') + '" data-ep="' + l.id + '">' +
      '<span class="ep__thumb">' + B.epArt(l, l.label, c) + '<span class="ep__play" aria-hidden="true">' + B.icon(l.locked ? 'lock' : 'play') + '</span>' +
      (l.pct > 0 && !l.done ? '<span class="ep__bar bar"><span class="bar__fill" style="--p:' + l.pct + '%"></span></span>' : '') + '</span>' +
      '<span class="ep__body"><span class="ep__top"><span class="ep__label t-hud">' + esc(l.label) + '</span>' + chips + '<span class="grow"></span><span class="ep__dur t-sm t-faint">' + (l.duration_min ? B.fmt.dur(l.duration_min) : '') + '</span></span>' +
      '<span class="ep__title">' + esc(l.title) + '</span>' + (l.description ? '<span class="ep__desc t-clamp-2">' + esc(l.description) + '</span>' : '') + '</span>' + state + '</button>';
  }
  function seasonPick(c, active) {
    if (c.seasons.length <= 1) return '<div class="seasons__one t-hud t-faint">' + (c.seasons[0] ? esc(c.seasons[0].title) : '') + '</div>';
    return '<label class="sr-only" for="seasonSel">Temporada</label><select class="select seasons__select" id="seasonSel">' +
      c.seasons.map(function (s, i) { return '<option value="' + i + '"' + (i === active ? ' selected' : '') + '>Temporada ' + s.n + ' · ' + esc(s.title) + '</option>'; }).join('') + '</select>';
  }
  function seasonBody(c, i) {
    var s = c.seasons[i]; if (!s) return '<p class="t-muted">Os episódios ainda estão sendo preparados.</p>';
    var mins = s.lessons.reduce(function (a, l) { return a + (l.duration_min || 0); }, 0);
    var note = s.locked === 'drip' ? '<div class="seasons__drip">' + B.icon('clock') + '<span>Esta temporada libera em <strong>' + B.fmt.date(s.opens_at) + '</strong>, ' + B.fmt.rel(s.opens_at) + '.</span></div>' : '';
    return '<div class="seasons__info"><span class="t-sm t-faint">' + B.fmt.plural(s.lessons.length, 'episódio', 'episódios') + (mins ? ' · ' + B.fmt.dur(mins) : '') + '</span>' + (s.description ? '<p class="t-sm t-muted">' + esc(s.description) + '</p>' : '') + '</div>' + note +
      '<div class="eps">' + s.lessons.map(function (l) { return epHtml(c, s, l); }).join('') + '</div>';
  }
  function benefitsHtml(list) {
    if (!list || !list.length) return '';
    return '<section class="cblock"><h2 class="t-2">O que você vai levar</h2><div class="pillars">' + list.map(function (b, i) {
      var p = String(b).split(/[:—–]\s+/), t = p.length > 1 ? p[0] : '', x = p.length > 1 ? p.slice(1).join(' ') : b;
      x = String(x).charAt(0).toUpperCase() + String(x).slice(1);
      return '<div class="pillar"><span class="pillar__rune t-rune" aria-hidden="true">' + 'ᚠᚢᚦᚨᚱᚲᚷᚹ'[i % 8] + '</span><div>' + (t ? '<h3 class="pillar__title">' + esc(t) + '</h3>' : '') + '<p class="t-muted">' + esc(x) + '</p></div></div>';
    }).join('') + '</div></section>';
  }
  A.pages.course = function (slug) {
    var main = A.enter('course');
    Promise.all([B.api('course', { slug: slug }), A.loadHome().catch(function () { return null; })]).then(function (rs) {
      var r = rs[0], c = r.course;
      c.owned = r.owned; c.in_list = r.in_list; c.progress = r.progress;
      A.state.course = c;
      var p = r.progress || {}, sell = !c.owned && c.status === 'published';
      var active = 0;
      if (c.owned && p.next_lesson_id) c.seasons.forEach(function (s, i) { s.lessons.forEach(function (l) { if (l.id === p.next_lesson_id) active = i; }); });
      var free = c.seasons.reduce(function (a, s) { return a.concat(s.lessons.filter(function (l) { return l.free_preview; })); }, [])[0];
      var nextL = null; c.seasons.forEach(function (s) { s.lessons.forEach(function (l) { if (l.id === p.next_lesson_id) nextL = l; }); });
      var actions = A.primaryBtn(c, { lg: true }) +
        (sell && free ? '<button type="button" class="btn btn--glass btn--lg" data-play="' + free.id + '">' + B.icon('eye') + 'Assistir aula grátis</button>' : '') +
        A.listBtn(c) +
        (r.certificate ? '<a class="btn btn--ghost btn--lg" href="' + B.base + 'certificado.html?c=' + encodeURIComponent(r.certificate) + '" target="_blank" rel="noopener">' + B.icon('award') + 'Certificado</a>' : '');
      main.innerHTML =
        '<section class="chero">' +
        '<div class="chero__bg" aria-hidden="true">' + B.art(c, { title: false, mark: false }) + '</div><div class="chero__shade" aria-hidden="true"></div>' +
        '<div class="chero__inner wrap">' +
        '<button type="button" class="chero__back btn btn--link" data-back>' + B.icon('left') + 'Voltar</button>' +
        (c.category ? '<div class="t-tag chero__kicker">' + esc(c.category) + '</div>' : '') +
        (c.logo ? '<img class="hero__logo" src="' + esc(B.safeUrl(c.logo)) + '" alt="' + esc(c.title) + '">' : '<h1 class="t-1 chero__title">' + esc(c.title) + '</h1>') +
        (c.subtitle ? '<p class="chero__sub">' + esc(c.subtitle) + '</p>' : '') +
        '<div class="chero__meta t-sm">' + A.metaLine(c) + '</div>' +
        (c.owned && p.total ? '<div class="chero__prog"><div class="bar bar--thick"><div class="bar__fill" style="--p:' + p.pct + '%"></div></div><span class="t-sm"><strong class="t-mustard">' + p.pct + '% concluído</strong>' + (p.pct < 100 && nextL ? ' · a seguir ' + esc(nextL.label) + ' ' + esc(nextL.title) : p.pct >= 100 ? ' · jornada completa' : '') + '</span></div>' : '') +
        (c.short_desc ? '<p class="chero__desc">' + esc(c.short_desc) + '</p>' : '') +
        (sell && c.price > 0 ? '<div class="price price--course">' + A.priceHtml(c) + '</div>' : '') +
        '<div class="chero__actions">' + actions + '</div>' +
        (c.expires_at || (r.enrollment && r.enrollment.expires_at) ? '<p class="t-xs t-faint">Acesso até ' + B.fmt.date((r.enrollment || {}).expires_at) + '</p>' : '') +
        '</div></section>' +
        '<div class="wrap cbody">' +
        '<div class="cgrid">' +
        '<section class="seasons" aria-label="Temporadas e episódios"><div class="seasons__head"><h2 class="t-2">Episódios</h2>' + seasonPick(c, active) + '</div><div id="seasonBody">' + seasonBody(c, active) + '</div></section>' +
        '<aside class="cside">' +
        (c.description ? '<div class="cside__block"><h2 class="cside__h">Sobre o curso</h2><div class="prose">' + B.nl2br(c.description) + '</div></div>' : '') +
        (c.tags && c.tags.length ? '<div class="row" style="--gap:6px">' + c.tags.map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
        (c.instructor && c.instructor.name ? '<div class="cside__block instructor">' + (c.instructor.photo ? '<img class="instructor__photo" src="' + esc(B.safeUrl(c.instructor.photo)) + '" alt="">' : B.avatar({ id: c.instructor.name, name: c.instructor.name }, 56)) + '<div class="min0"><div class="t-hud t-faint">Quem conduz</div><div class="instructor__name">' + esc(c.instructor.name) + '</div>' + (c.instructor.bio ? '<p class="t-sm t-muted">' + esc(c.instructor.bio) + '</p>' : '') + '</div></div>' : '') +
        '</aside></div>' +
        benefitsHtml(c.benefits) +
        (c.bonuses && c.bonuses.length ? '<section class="cblock"><h2 class="t-2">Bônus inclusos</h2><div class="bonus-list">' + c.bonuses.map(function (b) { return '<div class="bonus">' + B.icon('gift') + '<div class="min0"><div class="bonus__title">' + esc(b.title) + '</div>' + (b.text ? '<p class="t-sm t-muted">' + esc(b.text) + '</p>' : '') + '</div>' + (b.value ? '<span class="t-strike t-num t-sm">' + B.fmt.money(b.value) + '</span>' : '') + '</div>'; }).join('') + '</div></section>' : '') +
        (sell && c.guarantee_days ? '<section class="cblock guarantee">' + B.icon('shield') + '<div><h2 class="t-3">' + c.guarantee_days + ' dias de garantia</h2><p class="t-muted">Assista, aplique e, se não fizer sentido, peça o reembolso dentro do prazo. Devolvemos 100%.</p></div></section>' : '') +
        (sell && c.faq && c.faq.length ? '<section class="cblock"><h2 class="t-2">Perguntas frequentes</h2><div class="faq">' + c.faq.map(function (f) { return '<details><summary>' + esc(f.q) + '</summary><p class="t-muted">' + esc(f.a) + '</p></details>'; }).join('') + '</div></section>' : '') +
        '</div>' +
        (sell && c.price > 0 ? '<div class="buybar"><div class="price price--bar">' + A.priceHtml(c, { short: true }) + '</div><button type="button" class="btn btn--primary" data-buy="' + c.id + '">' + B.icon('unlock') + 'Desbloquear</button></div>' : '');
      main.classList.toggle('has-buybar', sell && c.price > 0);
      var bodyEl = B.$('#seasonBody', main);
      var sel = B.$('#seasonSel', main);
      if (sel) sel.addEventListener('change', function () { bodyEl.innerHTML = seasonBody(c, Number(sel.value)); });
      main.addEventListener('click', function (e) {
        var ep = e.target.closest('[data-ep]');
        if (ep) {
          var lesson = null, season = null;
          c.seasons.forEach(function (s) { s.lessons.forEach(function (l) { if (l.id === ep.dataset.ep) { lesson = l; season = s; } }); });
          if (!lesson) return;
          if (lesson.locked === 'not_owned') { if (c.status === 'published') A.buy(c); else B.toast('Este curso ainda não estreou.', 'info'); return; }
          if (lesson.locked === 'drip') { B.toast('Esta temporada libera em ' + B.fmt.date(season.opens_at) + '.', 'info'); return; }
          B.router.go('/aula/' + lesson.id);
          return;
        }
        if (e.target.closest('[data-back]')) { if (history.length > 1) history.back(); else B.router.go('/'); }
      });
    }).catch(function (e) { A.fail(main, e); });
  };

  /* =================================================================
     BUSCA
     ================================================================= */
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  A.pages.search = function (q0) {
    var main = A.enter('search', { loading: false });
    main.innerHTML = '<div class="wrap page"><h1 class="t-1 page__title">Buscar</h1>' +
      '<div class="search__box">' + B.icon('search') + '<label class="sr-only" for="q">Buscar</label><input class="input search__input" id="q" type="search" placeholder="Curso, tema ou episódio" autocomplete="off" value="' + esc(q0) + '"></div>' +
      '<div id="sres" class="search__res"></div></div>';
    var input = B.$('#q', main), res = B.$('#sres', main);
    if (!('ontouchstart' in w)) input.focus();
    A.loadHome().then(function (h) {
      function run() {
        var q = norm(input.value.trim());
        if (!q) {
          var cats = []; h.courses.forEach(function (c) { if (c.category && cats.indexOf(c.category) < 0) cats.push(c.category); });
          res.innerHTML = (cats.length ? '<div class="search__cats"><span class="t-hud t-faint">Explore por tema</span><div class="row" style="--gap:8px">' + cats.map(function (c) { return '<button type="button" class="chip chip--btn" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div></div>' : '') +
            '<h2 class="t-3 search__h">Todos os cursos</h2>' + A.grid(h.courses);
          return;
        }
        var cs = h.courses.filter(function (c) { return norm([c.title, c.subtitle, c.category, (c.tags || []).join(' '), c.short_desc].join(' ')).indexOf(q) > -1; });
        var eps = [];
        h.courses.forEach(function (c) { (c.seasons || []).forEach(function (s) { s.lessons.forEach(function (l) { if (norm(l.title + ' ' + (l.description || '')).indexOf(q) > -1) eps.push({ c: c, l: l }); }); }); });
        res.innerHTML = (!cs.length && !eps.length ? '<div class="empty">' + B.sigil('busca') + '<div class="empty__title">Nada com “' + esc(input.value.trim()) + '”</div><p>Tente outra palavra, como o tema ou o nome de um episódio.</p></div>' : '') +
          (cs.length ? '<h2 class="t-3 search__h">Cursos</h2>' + A.grid(cs) : '') +
          (eps.length ? '<h2 class="t-3 search__h">Episódios</h2><div class="list sres-eps">' + eps.slice(0, 30).map(function (x) {
            var go = x.c.owned || x.l.free_preview ? '/aula/' + x.l.id : '/curso/' + x.c.slug;
            return '<button type="button" class="list__item sres-ep" data-go="' + go + '"><span class="sres-ep__thumb">' + B.epArt(x.l, x.l.label, x.c) + '</span><span class="min0"><span class="t-hud t-mustard">' + esc(x.l.label) + '</span> <span class="sres-ep__title">' + esc(x.l.title) + '</span><span class="t-xs t-faint ellipsis" style="display:block">' + esc(x.c.title) + (x.c.owned || x.l.free_preview ? '' : ' · bloqueado') + '</span></span>' + B.icon(x.c.owned || x.l.free_preview ? 'play' : 'lock') + '</button>';
          }).join('') + '</div>' : '');
      }
      input.addEventListener('input', B.debounce(function () {
        try { history.replaceState(null, '', '#/buscar' + (input.value.trim() ? '?q=' + encodeURIComponent(input.value.trim()) : '')); } catch (e) {}
        run();
      }, 180));
      res.addEventListener('click', function (e) { var c = e.target.closest('[data-cat]'); if (c) { input.value = c.dataset.cat; run(); } });
      run();
    }).catch(function (e) { A.fail(main, e); });
  };

  /* =================================================================
     MINHA LISTA
     ================================================================= */
  A.pages.list = function () {
    var main = A.enter('list');
    A.loadHome().then(function (h) {
      var ids = h.user.my_list || [];
      var cs = ids.map(function (id) { return A.byId(id); }).filter(Boolean);
      main.innerHTML = '<div class="wrap page"><h1 class="t-1 page__title">Minha lista</h1>' +
        (cs.length ? '<p class="t-muted page__lead">' + B.fmt.plural(cs.length, 'curso guardado', 'cursos guardados') + ' para assistir depois.</p>' + A.grid(cs)
          : '<div class="empty">' + B.sigil('lista') + '<div class="empty__title">Sua lista está vazia</div><p>Toque no + de qualquer curso para guardar aqui. Nos lançamentos, o + avisa quando estrear.</p><button type="button" class="btn btn--primary" data-go="/">Explorar cursos</button></div>') +
        '</div>';
    }).catch(function (e) { A.fail(main, e); });
  };

  /* =================================================================
     PERFIL
     ================================================================= */
  A.pages.profile = function () {
    var main = A.enter('profile');
    B.api('me').then(function (r) {
      A.state.me = r;
      var u = r.user, span = Math.max(1, u.next_xp - u.level_floor), into = Math.max(0, u.xp - u.level_floor), pct = Math.min(100, Math.round(into / span * 100));
      var hours = Math.round((r.stats.minutes || 0) / 6) / 10;
      main.innerHTML = '<div class="wrap page profile">' +
        '<section class="pf-head panel hud">' +
        '<div class="pf-id"><div class="pf-avatar">' + B.avatar(u, 92) + '</div>' +
        '<div class="min0"><h1 class="t-1 pf-name">' + esc(u.name) + '</h1><div class="pf-rank t-hud">' + esc(u.rank) + ' · nível ' + u.level + '</div>' +
        '<div class="pf-swatches" role="group" aria-label="Cor do avatar">' + B.PALETTES.map(function (p, i) { return '<button type="button" class="swatch' + (Number(u.avatar_color) === i ? ' is-on' : '') + '" data-color="' + i + '" style="' + B.palVars(p) + '" aria-label="Cor ' + esc(p.name) + '"></button>'; }).join('') + '</div></div></div>' +
        '<div class="pf-level"><div class="ring" style="--p:' + pct + ';--size:112px"><div class="center"><div class="pf-level__n">' + u.level + '</div><div class="t-hud t-faint">nível</div></div></div>' +
        '<div class="min0"><div class="t-sm"><strong class="t-num">' + B.fmt.int(u.xp) + '</strong> <span class="t-faint">/ ' + B.fmt.int(u.next_xp) + ' XP</span></div><p class="t-xs t-faint">Faltam ' + B.fmt.int(u.next_xp - u.xp) + ' XP para o nível ' + (u.level + 1) + '.</p>' +
        '<div class="pf-streak">' + B.icon('flame') + '<span><strong>' + (u.streak || 0) + '</strong> ' + (u.streak === 1 ? 'dia seguido' : 'dias seguidos') + '</span></div></div></div>' +
        '</section>' +
        '<section class="pf-stats">' +
        kpi('Aulas concluídas', B.fmt.int(r.stats.lessons_done)) + kpi('Cursos na estante', B.fmt.int(r.stats.courses)) + kpi('Horas assistidas', B.fmt.num(hours) + 'h') + kpi('Certificados', B.fmt.int(r.stats.certificates)) +
        '</section>' +
        '<section class="cblock"><div class="row row--between"><h2 class="t-2">Runas</h2><span class="t-sm t-faint">' + r.badges.filter(function (b) { return b.unlocked; }).length + ' de ' + r.badges.length + '</span></div>' +
        '<div class="runes">' + r.badges.map(function (b) { return '<div class="rune' + (b.unlocked ? ' is-on' : '') + '"><div class="rune__glyph t-rune" aria-hidden="true">' + esc(b.rune) + '</div><div class="rune__name">' + esc(b.name) + '</div><div class="rune__desc t-xs">' + esc(b.desc) + '</div></div>'; }).join('') + '</div></section>' +
        '<section class="cblock"><h2 class="t-2">Sua escalada</h2><div class="ranks">' + r.ranks.map(function (k, i) {
          var nextMin = r.ranks[i + 1] ? r.ranks[i + 1].min : 999, here = u.level >= k.min && u.level < nextMin, done = u.level >= nextMin;
          return '<div class="rankstep' + (here ? ' is-here' : done ? ' is-done' : '') + '"><span class="rankstep__lv t-hud">nível ' + k.min + '+</span><span class="rankstep__name">' + esc(k.name) + '</span></div>';
        }).join('') + '</div></section>' +
        '<section class="cblock"><h2 class="t-2">Certificados</h2>' + (r.certificates.length ? '<div class="list">' + r.certificates.map(function (x) { return '<div class="list__item">' + B.icon('award') + '<div class="grow"><div><strong>' + esc(x.course_title) + '</strong></div><div class="t-xs t-faint">' + B.fmt.date(x.issued_at) + ' · ' + B.fmt.num(x.hours) + 'h · código ' + esc(x.code) + '</div></div><a class="btn btn--ghost btn--sm" target="_blank" rel="noopener" href="' + B.base + 'certificado.html?c=' + encodeURIComponent(x.code) + '">Abrir</a></div>'; }).join('') + '</div>' : '<p class="t-muted">Conclua todos os episódios de um curso para ganhar o certificado.</p>') + '</section>' +
        '<section class="cblock grid-2 pf-forms">' +
        '<form class="panel stack" id="pfData" style="--gap:12px"><h2 class="t-3">Seus dados</h2>' +
        '<div class="field"><label for="pfName">Nome</label><input class="input" id="pfName" name="name" value="' + esc(u.name) + '" autocomplete="name"></div>' +
        '<div class="field"><label for="pfPhone">WhatsApp</label><input class="input" id="pfPhone" name="phone" type="tel" inputmode="tel" value="' + esc(B.fmt.phone(u.phone)) + '"></div>' +
        '<div class="field"><label>E-mail</label><input class="input" value="' + esc(u.email) + '" disabled></div>' +
        '<button class="btn btn--primary" type="submit">Salvar dados</button></form>' +
        '<form class="panel stack" id="pfPass" style="--gap:12px"><h2 class="t-3">Trocar senha</h2>' +
        (u.has_password ? '<div class="field"><label for="pfCur">Senha atual</label><input class="input" id="pfCur" name="current_password" type="password" autocomplete="current-password"></div>' : '') +
        '<div class="field"><label for="pfNew">Nova senha</label><input class="input" id="pfNew" name="password" type="password" autocomplete="new-password" minlength="6"></div>' +
        '<button class="btn btn--ghost" type="submit">Trocar senha</button></form></section>' +
        '<div class="pf-out"><button type="button" class="btn btn--danger" data-logout>' + B.icon('logout') + 'Sair da conta</button></div>' +
        '</div>';
      function kpi(l, v) { return '<div class="panel kpi"><span class="kpi__label">' + l + '</span><span class="kpi__value">' + v + '</span></div>'; }
      B.$$('[data-color]', main).forEach(function (b) {
        b.addEventListener('click', function () {
          B.api('profile', { avatar_color: Number(b.dataset.color) }).then(function (x) {
            B.session.setUser(x.user); if (A.state.home) A.state.home.user = Object.assign(A.state.home.user, x.user);
            B.$$('[data-color]', main).forEach(function (o) { o.classList.toggle('is-on', o === b); });
            B.$('.pf-avatar', main).innerHTML = B.avatar(x.user, 92); A.paintUser();
          }).catch(B.fail);
        });
      });
      B.$('#pfData', main).addEventListener('submit', function (e) {
        e.preventDefault(); var f = B.formData(e.target), btn = e.target.querySelector('[type=submit]'); btn.classList.add('is-loading');
        B.api('profile', { name: f.name, phone: f.phone }).then(function (x) {
          B.session.setUser(x.user); if (A.state.home) A.state.home.user = Object.assign(A.state.home.user, x.user);
          A.paintUser(); B.$('.pf-name', main).textContent = x.user.name; B.toast('Dados salvos', 'ok');
        }).catch(B.fail).then(function () { btn.classList.remove('is-loading'); });
      });
      B.$('#pfPass', main).addEventListener('submit', function (e) {
        e.preventDefault(); var f = B.formData(e.target), btn = e.target.querySelector('[type=submit]');
        if (String(f.password || '').length < 6) { B.toast('A nova senha precisa de 6 caracteres ou mais.', 'bad'); return; }
        btn.classList.add('is-loading');
        B.api('profile', { password: f.password, current_password: f.current_password }).then(function (x) {
          if (x.token) B.session.set(x.token, x.user);
          e.target.reset(); B.toast('Senha trocada', 'ok');
        }).catch(B.fail).then(function () { btn.classList.remove('is-loading'); });
      });
    }).catch(function (e) { A.fail(main, e); });
  };

  /* =================================================================
     SUPORTE
     ================================================================= */
  A.pages.support = function () {
    var main = A.enter('support', { loading: false });
    var b = B.brand || {};
    var wa = String(b.support_whatsapp || '').replace(/\D/g, '').replace(/^55/, '');
    main.innerHTML = '<div class="wrap page chatpage"><div class="row row--between"><h1 class="t-1 page__title">Suporte</h1>' +
      (wa ? '<a class="btn btn--ghost btn--sm" href="https://wa.me/55' + wa + '" target="_blank" rel="noopener">' + B.icon('whatsapp') + esc(b.support_whatsapp) + '</a>' : '') + '</div>' +
      '<div class="chat panel"><div class="chat__log" id="chatLog" aria-live="polite"><div class="loading-screen" style="min-height:200px"><div class="spinner"></div></div></div>' +
      '<form class="chat__form" id="chatForm"><label class="sr-only" for="chatText">Mensagem</label><textarea class="textarea chat__input" id="chatText" rows="1" placeholder="Escreva sua mensagem"></textarea><button class="btn btn--primary btn--icon" type="submit" aria-label="Enviar">' + B.icon('send') + '</button></form></div></div>';
    var log = B.$('#chatLog', main), form = B.$('#chatForm', main), text = B.$('#chatText', main), last = '';
    function paint(msgs) {
      var sig = msgs.length + ':' + (msgs.length ? msgs[msgs.length - 1].id : '');
      if (sig === last) return; last = sig;
      log.innerHTML = msgs.length ? msgs.map(function (m) {
        return '<div class="msg msg--' + (m.from === 'me' ? 'me' : 'them') + '"><div class="msg__bubble">' + B.nl2br(m.text) + '</div><div class="msg__time t-xs t-faint">' + (m.from === 'me' ? 'Você' : 'Suporte') + ' · ' + B.fmt.rel(m.ts) + '</div></div>';
      }).join('') : '<div class="empty" style="padding:28px 8px">' + B.icon('chat') + '<div>Mande sua dúvida. Respondemos por aqui.</div></div>';
      log.scrollTop = log.scrollHeight;
    }
    function load() { return B.api('chat').then(function (r) { paint(r.messages); var dot = B.$('#chatDot'); if (dot) dot.hidden = true; }).catch(function () {}); }
    load();
    var timer = setInterval(load, 8000);
    A.onLeave(function () { clearInterval(timer); });
    text.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); } });
    text.addEventListener('input', function () { text.style.height = 'auto'; text.style.height = Math.min(160, text.scrollHeight) + 'px'; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = text.value.trim(); if (!v) return;
      var btn = form.querySelector('button'); btn.classList.add('is-loading');
      B.api('chatSend', { text: v }).then(function () { text.value = ''; text.style.height = ''; return load(); }).catch(B.fail).then(function () { btn.classList.remove('is-loading'); text.focus(); });
    });
  };
})(window, document);

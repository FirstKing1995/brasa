/* =====================================================================
   BRASA · app.js — app do aluno (estrutura, autenticação, utilidades)
   As páginas ficam em app-pages.js (início, curso, busca, lista, perfil,
   suporte) e app-watch.js (aula).
   ===================================================================== */
(function (w, d) {
  'use strict';

  var A = w.APP = { state: { home: null, me: null }, pages: {}, leave: [] };
  B.session.use('app');
  var root = null;

  /* ---------------- dados ---------------- */
  A.loadHome = function (force) {
    if (A.state.home && !force) return Promise.resolve(A.state.home);
    return B.api('home').then(function (h) {
      A.state.home = h;
      B.session.setUser(h.user);
      A.paintUser();
      A.paintBell();
      return h;
    });
  };
  A.dropHome = function () { A.state.home = null; A.state.me = null; };
  A.byId = function (id) { var h = A.state.home; return h ? h.courses.filter(function (c) { return c.id === id; })[0] : null; };
  A.bySlug = function (slug) { var h = A.state.home; return h ? h.courses.filter(function (c) { return c.slug === slug; })[0] : null; };
  A.user = function () { return (A.state.home && A.state.home.user) || B.session.user() || {}; };

  /* ---------------- formatação de curso ---------------- */
  A.metaLine = function (c) {
    var s = c.stats || {}, out = [];
    if (c.level) out.push(B.esc(c.level));
    if (s.seasons) out.push(B.fmt.plural(s.seasons, 'temporada', 'temporadas'));
    if (s.lessons) out.push(B.fmt.plural(s.lessons, 'episódio', 'episódios'));
    if (s.minutes) out.push(B.fmt.dur(s.minutes));
    return out.join('<span class="dotsep" aria-hidden="true"></span>');
  };
  A.rate = function () { return (B.boot0 && B.boot0.installment_rate) || 0.0299; };
  A.priceHtml = function (c, opts) {
    opts = opts || {};
    if (!(c.price > 0)) return '<span class="price__now">Grátis</span>';
    var n = c.max_installments || 12, inst = B.installment(c.price, n, A.rate());
    return (c.anchor_price > c.price ? '<span class="price__was t-strike t-num">' + B.fmt.money(c.anchor_price) + '</span>' : '') +
      '<span class="price__now t-num">' + B.fmt.money(c.price) + '</span>' +
      (n > 1 && !opts.short ? '<span class="price__inst">ou ' + n + 'x de ' + B.fmt.money(inst) + '* no cartão</span>' : '');
  };

  /* ---------------- ações comuns ---------------- */
  A.buy = function (c, extra) {
    if (!c) return;
    extra = extra || {};
    if (c.checkout_url) { w.open(c.checkout_url, '_blank', 'noopener'); return; }
    var h = A.state.home, owned = h ? h.courses.filter(function (x) { return x.owned; }).map(function (x) { return x.id; }) : [];
    B.checkout.open({
      course: c, user: A.user(), src: 'app', owned: owned, coupon: extra.coupon || '', banner_id: extra.banner_id || '',
      checkout: { installment_rate: A.rate(), checkout_cpf: (B.boot0 && B.boot0.checkout_cpf) || 'optional' },
      onPaid: function () {
        A.dropHome();
        setTimeout(function () {
          B.toast('Liberado. Bom estudo.', 'ok', 3200);
          B.router.reload();
        }, 900);
        return true;
      }
    });
  };
  A.toggleList = function (id, btn) {
    if (btn) btn.classList.add('is-loading');
    return B.api('mylist', { course_id: id }).then(function (r) {
      var h = A.state.home;
      if (h) { h.user.my_list = r.my_list; h.courses.forEach(function (c) { if (c.id === id) c.in_list = r.in_list; }); }
      B.$$('[data-list="' + id + '"]').forEach(function (b) { A.paintListBtn(b, r.in_list); });
      var c = A.byId(id);
      B.toast(r.in_list ? (c && c.status === 'coming_soon' ? 'Vamos te avisar quando estrear.' : 'Adicionado à sua lista.') : 'Removido da sua lista.', 'ok', 1800);
      return r;
    }).catch(B.fail).then(function (r) { if (btn) btn.classList.remove('is-loading'); return r; });
  };
  A.paintListBtn = function (b, on) {
    b.classList.toggle('is-on', !!on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    var lbl = b.querySelector('[data-lbl]');
    var ic = b.querySelector('svg');
    if (ic) ic.outerHTML = B.icon(on ? 'check' : 'plus');
    if (lbl) lbl.textContent = on ? (b.dataset.on || 'Na lista') : (b.dataset.off || 'Minha lista');
    b.setAttribute('aria-label', on ? 'Remover da minha lista' : 'Adicionar à minha lista');
  };
  A.listBtn = function (c, opts) {
    opts = opts || {};
    var on = !!c.in_list, soon = c.status === 'coming_soon';
    var off = opts.off || (soon ? 'Avise-me' : 'Minha lista'), onL = opts.on || (soon ? 'Vamos avisar' : 'Na lista');
    if (opts.round) return '<button type="button" class="iconbtn iconbtn--ring list-btn' + (on ? ' is-on' : '') + '" data-list="' + c.id + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remover da minha lista' : 'Adicionar à minha lista') + '">' + B.icon(on ? 'check' : 'plus') + '</button>';
    return '<button type="button" class="btn btn--glass list-btn' + (on ? ' is-on' : '') + '" data-list="' + c.id + '" data-on="' + onL + '" data-off="' + off + '" aria-pressed="' + on + '">' + B.icon(on ? 'check' : 'plus') + '<span data-lbl>' + (on ? onL : off) + '</span></button>';
  };
  // botão principal conforme a situação do curso
  A.primaryBtn = function (c, opts) {
    opts = opts || {};
    var lg = opts.lg ? ' btn--lg' : '';
    if (c.status === 'coming_soon') return '<span class="chip chip--mustard">' + B.icon('clock') + 'Em breve</span>';
    if (c.owned) {
      var p = c.progress || {}, started = p.done > 0 || p.last_at;
      var label = p.pct >= 100 ? 'Assistir de novo' : started ? 'Continuar ' + (p.next_label || '') : 'Assistir';
      return '<button type="button" class="btn btn--primary' + lg + '" data-play="' + (p.next_lesson_id || '') + '" data-course="' + c.slug + '">' + B.icon('play') + B.esc(label.trim()) + '</button>';
    }
    if (!(c.price > 0)) return '<button type="button" class="btn btn--primary' + lg + '" data-buy="' + c.id + '">' + B.icon('plus') + 'Adicionar grátis</button>';
    return '<button type="button" class="btn btn--primary' + lg + '" data-buy="' + c.id + '">' + B.icon('unlock') + 'Desbloquear por ' + B.fmt.money(c.price) + '</button>';
  };

  /* ---------------- ciclo de vida das páginas ---------------- */
  A.onLeave = function (fn) { A.leave.push(fn); };
  function runLeave() { var l = A.leave; A.leave = []; l.forEach(function (fn) { try { fn(); } catch (e) {} }); }
  A.enter = function (key, opts) {
    opts = opts || {};
    runLeave();
    root.classList.toggle('mode-watch', key === 'watch');
    root.classList.toggle('has-bottomnav', key !== 'watch');
    B.$$('[data-nav]', root).forEach(function (a) { a.classList.toggle('is-active', a.dataset.nav === key); });
    var main = B.$('#main', root);
    main.className = 'main main--' + key;
    if (opts.loading !== false) main.innerHTML = opts.skeleton || A.skeleton(key);
    A.closeMenus();
    solidTop();
    return main;
  };
  A.skeleton = function (key) {
    if (key === 'home') return '<div class="skel skel-hero"></div>' + [1, 2, 3].map(function () { return '<div class="wrap skel-rail"><div class="skel skel-line"></div><div class="skel-row">' + [1, 2, 3, 4, 5].map(function () { return '<div class="skel skel-tile"></div>'; }).join('') + '</div></div>'; }).join('');
    if (key === 'course') return '<div class="skel skel-hero"></div><div class="wrap stack" style="--gap:12px;padding-block:20px">' + [1, 2, 3, 4].map(function () { return '<div class="skel skel-ep"></div>'; }).join('') + '</div>';
    return '<div class="loading-screen"><div class="spinner" role="status" aria-label="Carregando"></div></div>';
  };
  A.fail = function (main, e, retry) {
    main.innerHTML = '<div class="wrap"><div class="empty">' + B.sigil('erro') + '<div class="empty__title">Não deu para carregar</div><p>' + B.esc((e && e.message) || 'Tente de novo em instantes.') + '</p><button type="button" class="btn btn--primary" data-retry>' + B.icon('refresh') + 'Tentar de novo</button></div></div>';
    var b = B.$('[data-retry]', main); if (b) b.addEventListener('click', retry || function () { B.router.reload(); });
  };

  /* ---------------- estrutura (topo, navegação) ---------------- */
  function navLink(key, href, label, icon) {
    return '<a href="' + href + '" data-nav="' + key + '">' + B.icon(icon) + '<span>' + label + '</span></a>';
  }
  A.mountShell = function () {
    root.className = 'app has-bottomnav';
    root.innerHTML =
      '<header class="topbar" id="topbar"><div class="topbar__inner">' +
      '<a class="brand" href="#/" aria-label="Início">' + B.brandMark() + '</a>' +
      '<nav class="topbar__links hide-sm" aria-label="Principal"><a href="#/" data-nav="home">Início</a><a href="#/lista" data-nav="list">Minha lista</a><a href="#/suporte" data-nav="support">Suporte</a></nav>' +
      '<span class="grow"></span>' +
      '<div class="topbar__actions">' +
      '<a class="iconbtn hide-sm" href="#/buscar" aria-label="Buscar" data-nav="search">' + B.icon('search') + '</a>' +
      '<div class="menu-wrap"><button type="button" class="iconbtn bell" id="bellBtn" aria-label="Novidades" aria-haspopup="true">' + B.icon('bell') + '<span class="bell__count" id="bellCount" hidden></span></button>' +
      '<div class="menu menu--bell" id="bellMenu" hidden></div></div>' +
      '<div class="menu-wrap"><button type="button" class="avatar-btn" id="meBtn" aria-label="Sua conta" aria-haspopup="true"><span id="meAvatar"></span></button>' +
      '<div class="menu" id="meMenu" hidden>' +
      '<div class="menu__head" id="meHead"></div>' +
      '<a href="#/perfil" class="menu__item">' + B.icon('user') + 'Perfil e conquistas</a>' +
      '<a href="#/lista" class="menu__item">' + B.icon('bookmark') + 'Minha lista</a>' +
      '<a href="#/suporte" class="menu__item">' + B.icon('chat') + 'Suporte</a>' +
      '<button type="button" class="menu__item" data-logout>' + B.icon('logout') + 'Sair</button>' +
      '</div></div></div></div></header>' +
      '<main id="main" class="main" tabindex="-1"></main>' +
      '<footer class="foot" id="foot"></footer>' +
      '<nav class="bottomnav" aria-label="Navegação"><div class="bottomnav__inner">' +
      navLink('home', '#/', 'Início', 'home') + navLink('search', '#/buscar', 'Buscar', 'search') +
      navLink('list', '#/lista', 'Minha lista', 'bookmark') +
      '<a href="#/suporte" data-nav="support">' + B.icon('chat') + '<span>Suporte</span><span class="badge-dot" id="chatDot" hidden></span></a>' +
      navLink('profile', '#/perfil', 'Perfil', 'user') +
      '</div></nav>';
    paintFoot();
    A.paintUser();
    // menus
    B.$('#bellBtn').addEventListener('click', function (e) { e.stopPropagation(); toggleMenu('bellMenu'); });
    B.$('#meBtn').addEventListener('click', function (e) { e.stopPropagation(); toggleMenu('meMenu'); });
    d.addEventListener('click', function (e) { if (!e.target.closest('.menu')) A.closeMenus(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') A.closeMenus(); });
    w.addEventListener('scroll', solidTop, { passive: true });
    bindGlobal();
    pollChat();
  };
  function solidTop() { var t = B.$('#topbar'), m = B.$('#main'); if (t) t.classList.toggle('is-solid', w.scrollY > 24 || !(m && /main--(home|course)/.test(m.className))); }
  function toggleMenu(id) {
    var m = B.$('#' + id), open = m.hidden;
    A.closeMenus();
    if (!open) return;
    if (id === 'bellMenu') { fillBell(); B.store.set('notif_seen', Date.now()); A.paintBell(); }
    m.hidden = false;
  }
  A.closeMenus = function () { B.$$('.menu', root).forEach(function (m) { m.hidden = true; }); };
  A.paintUser = function () {
    var u = A.user(), el = B.$('#meAvatar'), head = B.$('#meHead');
    if (el) el.innerHTML = B.avatar(u, 34);
    if (head) head.innerHTML = '<div class="row row--nowrap" style="--gap:10px">' + B.avatar(u, 40) + '<div class="min0"><div class="ellipsis"><strong>' + B.esc(u.name || '') + '</strong></div><div class="t-xs t-faint">' + B.esc(u.rank || '') + (u.level ? ' · nível ' + u.level : '') + '</div></div></div>';
  };
  A.paintBell = function () {
    var h = A.state.home, c = B.$('#bellCount'); if (!c || !h) return;
    var seen = B.store.get('notif_seen', 0);
    var n = (h.notifications || []).filter(function (x) { return x.at > seen; }).length;
    c.hidden = !n; c.textContent = n > 9 ? '9+' : n;
  };
  function fillBell() {
    var h = A.state.home || {}, list = h.notifications || [], m = B.$('#bellMenu');
    m.innerHTML = '<div class="menu__title">Novidades</div>' + (list.length ? list.slice(0, 8).map(function (n) {
      if (n.kind === 'launch') return '<a class="menu__note" href="#/curso/' + B.esc(n.slug) + '"><span class="menu__note-label t-hud">Estreia</span><span class="min0"><span class="ellipsis" style="display:block">' + B.esc(n.course_title) + '</span><span class="t-xs t-faint">Estreou · ' + B.fmt.rel(n.at) + '</span></span></a>';
      return '<a class="menu__note" href="#/aula/' + n.lesson_id + '"><span class="menu__note-label t-hud">' + B.esc(n.label) + '</span><span class="min0"><span class="ellipsis" style="display:block">' + B.esc(n.lesson_title) + '</span><span class="t-xs t-faint">' + B.esc(n.course_title) + ' · ' + B.fmt.rel(n.at) + '</span></span></a>';
    }).join('') : '<p class="menu__empty t-sm t-faint">Episódios novos dos seus cursos e estreias que você pediu para ser avisado aparecem aqui.</p>');
  }
  function paintFoot() {
    var b = B.brand || {}, f = B.$('#foot'); if (!f) return;
    f.innerHTML = '<div class="wrap foot__inner"><a class="brand" href="#/">' + B.brandMark() + '</a>' +
      '<p class="t-sm t-faint">' + B.esc(b.tagline || '') + '</p>' +
      '<div class="foot__links t-sm">' +
      (b.support_whatsapp ? '<span>' + B.icon('whatsapp') + ' Suporte: <a href="https://wa.me/55' + String(b.support_whatsapp).replace(/\D/g, '').replace(/^55/, '') + '" target="_blank" rel="noopener">' + B.esc(b.support_whatsapp) + '</a></span>' : '') +
      (b.support_email ? '<span>' + B.icon('mail') + ' <span class="t-muted">' + B.esc(b.support_email) + '</span></span>' : '') +
      (b.terms_url ? '<a href="' + B.esc(B.safeUrl(b.terms_url)) + '" target="_blank" rel="noopener">Termos de uso</a>' : '') +
      (b.privacy_url ? '<a href="' + B.esc(B.safeUrl(b.privacy_url)) + '" target="_blank" rel="noopener">Privacidade</a>' : '') +
      '</div><p class="t-xs t-faint">© ' + new Date().getFullYear() + ' ' + B.esc(b.name || '') + '</p></div>';
  }
  function pollChat() {
    function check() {
      if (!B.session.token()) return;
      B.api('chatUnread').then(function (r) { var dot = B.$('#chatDot'); if (dot) dot.hidden = !r.unread; }).catch(function () {});
    }
    check(); setInterval(check, 60000);
  }
  // cliques delegados válidos em todo o app
  function bindGlobal() {
    root.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-logout]'))) { e.preventDefault(); A.logout(); return; }
      if ((t = e.target.closest('[data-list]'))) { e.preventDefault(); e.stopPropagation(); A.toggleList(t.dataset.list, t); return; }
      if ((t = e.target.closest('[data-buy]'))) {
        e.preventDefault(); e.stopPropagation();
        var id = t.dataset.buy, cur = A.state.course;
        A.buy(cur && cur.id === id ? cur : A.byId(id));
        return;
      }
      if ((t = e.target.closest('[data-play]'))) {
        e.preventDefault(); e.stopPropagation();
        if (t.dataset.play) B.router.go('/aula/' + t.dataset.play); else if (t.dataset.course) B.router.go('/curso/' + t.dataset.course);
        return;
      }
      if ((t = e.target.closest('[data-go]'))) { e.preventDefault(); B.router.go(t.dataset.go); return; }
      if ((t = e.target.closest('.rail__nav'))) {
        var track = t.parentNode.querySelector('.rail__track');
        track.scrollBy({ left: (t.classList.contains('rail__nav--next') ? 1 : -1) * track.clientWidth * 0.85, behavior: 'smooth' });
      }
    });
  }
  A.logout = function () {
    B.logout(); A.dropHome(); runLeave();
    showAuth('login');
  };

  /* =================================================================
     AUTENTICAÇÃO
     ================================================================= */
  var authBg = null;
  function showAuth(mode, data) {
    runLeave();
    data = data || {};
    root.className = 'app app--auth';
    root.innerHTML = '<div class="auth"><div class="auth__wall" id="authWall" aria-hidden="true"></div><div class="auth__veil" aria-hidden="true"></div>' +
      '<div class="auth__panel"><a class="brand auth__brand" href="#/">' + B.brandMark() + '</a><div class="panel hud auth__card" id="authCard"></div>' +
      '<p class="auth__foot t-xs t-faint">' + B.esc(B.brand.tagline || '') + '</p></div></div>';
    var ember = B.embers(B.$('.auth', root), { count: 30 });
    A.onLeave(ember.stop);
    paintWall();
    renderAuth(mode, data);
  }
  function paintWall() {
    var wall = B.$('#authWall'); if (!wall) return;
    var draw = function (list) {
      if (!list.length) return;
      var cells = [];
      for (var i = 0; i < 18; i++) cells.push('<div class="auth__poster tile tile--tall">' + B.art(list[i % list.length], { tall: true }) + '</div>');
      wall.innerHTML = '<div class="auth__grid">' + cells.join('') + '</div>';
    };
    if (authBg) return draw(authBg);
    B.api('catalog').then(function (r) { authBg = r.courses || []; draw(authBg); }).catch(function () {});
  }
  function demoHint() {
    return B.demo ? '<div class="auth__hint t-sm">' + B.icon('info') + '<span>Demonstração: <strong>aluno@brasa.demo</strong> · senha <strong>brasa123</strong></span></div>' : '';
  }
  function field(id, label, type, attrs, value) {
    return '<div class="field"><label for="' + id + '">' + label + '</label><input class="input" id="' + id + '" name="' + id + '" type="' + type + '" ' + (attrs || '') + ' value="' + B.esc(value || '') + '"></div>';
  }
  function renderAuth(mode, data) {
    var card = B.$('#authCard');
    var html = '';
    if (mode === 'login') {
      html = '<h1 class="t-2">Entrar</h1><p class="t-muted">Seus cursos, do jeito que você assiste série.</p>' + demoHint() +
        '<form class="stack" id="authForm" novalidate style="--gap:14px">' +
        field('email', 'E-mail', 'email', 'autocomplete="email" inputmode="email" required', data.email) +
        field('password', 'Senha', 'password', 'autocomplete="current-password" required') +
        '<button class="btn btn--primary btn--lg btn--block" type="submit">Entrar</button></form>' +
        '<div class="auth__links"><button type="button" class="btn btn--link" data-mode="forgot">Esqueci minha senha</button><button type="button" class="btn btn--link" data-mode="register">Criar conta</button></div>';
    } else if (mode === 'register') {
      html = '<h1 class="t-2">Criar conta</h1><p class="t-muted">Comece pelos cursos grátis e desbloqueie o resto quando quiser.</p>' +
        '<form class="stack" id="authForm" novalidate style="--gap:14px">' +
        field('name', 'Nome', 'text', 'autocomplete="name" required') +
        field('email', 'E-mail', 'email', 'autocomplete="email" inputmode="email" required', data.email) +
        field('password', 'Senha', 'password', 'autocomplete="new-password" minlength="6" required') +
        '<p class="hint">Mínimo de 6 caracteres.</p>' +
        '<button class="btn btn--primary btn--lg btn--block" type="submit">Criar conta</button></form>' +
        '<div class="auth__links"><span class="t-sm t-faint">Já tem conta?</span><button type="button" class="btn btn--link" data-mode="login">Entrar</button></div>';
    } else if (mode === 'forgot') {
      html = '<h1 class="t-2">Recuperar acesso</h1><p class="t-muted">Mandamos um código de 6 números para o seu e-mail. Ele serve também para quem comprou e ainda não criou a senha.</p>' +
        '<form class="stack" id="authForm" novalidate style="--gap:14px">' + field('email', 'E-mail', 'email', 'autocomplete="email" inputmode="email" required', data.email) +
        '<button class="btn btn--primary btn--lg btn--block" type="submit">Enviar código</button></form>' +
        '<div class="auth__links"><button type="button" class="btn btn--link" data-mode="login">Voltar para entrar</button></div>';
    } else if (mode === 'reset') {
      html = '<h1 class="t-2">Nova senha</h1><p class="t-muted">Digite o código que chegou em <strong>' + B.esc(data.email || '') + '</strong> e escolha a senha.</p>' +
        '<form class="stack" id="authForm" novalidate style="--gap:14px"><input type="hidden" name="email" value="' + B.esc(data.email || '') + '">' +
        field('code', 'Código', 'text', 'inputmode="numeric" autocomplete="one-time-code" maxlength="6" required', data.code) +
        field('password', 'Nova senha', 'password', 'autocomplete="new-password" minlength="6" required') +
        '<button class="btn btn--primary btn--lg btn--block" type="submit">Salvar senha e entrar</button></form>' +
        '<div class="auth__links"><button type="button" class="btn btn--link" data-mode="forgot">Mandar outro código</button></div>';
    } else if (mode === 'first') {
      html = '<h1 class="t-2">' + (data.name ? 'Bem-vindo, ' + B.esc(String(data.name).split(' ')[0]) + '.' : 'Primeiro acesso') + '</h1><p class="t-muted">Seu acesso está liberado' + (data.email_masked ? ' para <strong>' + B.esc(data.email_masked) + '</strong>' : '') + '. Crie a senha e já pode assistir.</p>' +
        '<form class="stack" id="authForm" novalidate style="--gap:14px">' +
        field('password', 'Crie sua senha', 'password', 'autocomplete="new-password" minlength="6" required') +
        field('password2', 'Repita a senha', 'password', 'autocomplete="new-password" minlength="6" required') +
        '<button class="btn btn--primary btn--lg btn--block" type="submit">Criar senha e entrar</button></form>';
    }
    card.innerHTML = html;
    B.$$('[data-mode]', card).forEach(function (b) {
      b.addEventListener('click', function () { var em = B.$('#email', card); renderAuth(b.dataset.mode, { email: em ? em.value : data.email }); });
    });
    var form = B.$('#authForm', card);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = B.formData(form), btn = form.querySelector('[type="submit"]');
      var bad = function (id, msg) { var el = B.$('#' + id, form); if (el) { el.classList.add('is-invalid'); el.focus(); } B.toast(msg, 'bad'); };
      if ((mode === 'login' || mode === 'register' || mode === 'forgot') && !B.validEmail(f.email)) return bad('email', 'Confira o e-mail.');
      if (mode === 'register' && String(f.name || '').trim().length < 2) return bad('name', 'Informe seu nome.');
      if ((mode !== 'forgot') && String(f.password || '').length < (mode === 'login' ? 1 : 6)) return bad('password', mode === 'login' ? 'Informe a senha.' : 'A senha precisa de 6 caracteres ou mais.');
      if (mode === 'first' && f.password !== f.password2) return bad('password2', 'As senhas não são iguais.');
      btn.classList.add('is-loading');
      var call = mode === 'login' ? B.api('login', { email: f.email, password: f.password })
        : mode === 'register' ? B.api('register', { name: f.name, email: f.email, password: f.password })
          : mode === 'forgot' ? B.api('forgot', { email: f.email })
            : mode === 'reset' ? B.api('reset', { email: f.email, code: f.code, password: f.password })
              : B.api('firstAccess', { first: data.first, password: f.password });
      call.then(function (r) {
        if (mode === 'forgot') {
          if (r.demo_code) B.toast('Demonstração: seu código é ' + r.demo_code, 'info', 9000);
          else B.toast('Se o e-mail tiver cadastro, o código chega em instantes.', 'ok', 5000);
          renderAuth('reset', { email: f.email, code: r.demo_code || '' });
          return;
        }
        B.loginDone(r);
        if (mode === 'first') { try { history.replaceState(null, '', location.pathname + '#/'); } catch (x) {} B.toast('Senha criada. Bom estudo.', 'ok'); }
        startApp();
      }, function (err) {
        btn.classList.remove('is-loading');
        if (err.code === 'NO_PASSWORD') { B.toast(err.message, 'info', 6000); renderAuth('forgot', { email: f.email }); return; }
        if (err.code === 'EXISTS') { B.toast(err.message, 'info', 6000); renderAuth('login', { email: f.email }); return; }
        B.fail(err);
      });
    });
    var first = form.querySelector('input:not([type="hidden"])');
    if (first && !('ontouchstart' in w)) first.focus();
  }

  /* =================================================================
     INÍCIO DO APP
     ================================================================= */
  var started = false;
  function startApp() {
    B.splash();
    A.mountShell();
    var px = B.boot0 && B.boot0.pixel_id;
    if (px) { B.pixel.init([px]); B.pixel.track('PageView'); }
    if (!started) {
      started = true;
      B.router
        .on('/', function () { A.pages.home(); })
        .on('/curso/:slug', function (p) { A.pages.course(p.slug); })
        .on('/aula/:id', function (p) { A.pages.watch(p.id); })
        .on('/buscar', function (p, q) { A.pages.search(q.get('q') || ''); })
        .on('/lista', function () { A.pages.list(); })
        .on('/perfil', function () { A.pages.profile(); })
        .on('/suporte', function () { A.pages.support(); })
        .otherwise(function () { B.router.go('/', { replace: true }); });
      B.router.start('/');
    } else B.router.go('/', { replace: true });
  }

  B.boot(function () {
    root = B.$('#app');
    B.demoBar('app');
    B.listen('auth:expired', function () { A.dropHome(); showAuth('login'); B.toast('Sua sessão expirou. Entre de novo.', 'info'); });
    if (!B.demo && 'serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js').catch(function () {}); } catch (e) {} }
    var first = B.qs('primeiro');
    if (first) {
      return B.loadBrand().then(function () {
        showAuth('first', { first: first });
        return B.api('firstInfo', { first: first }).then(function (r) { renderAuth('first', { first: first, name: r.name, email_masked: r.email_masked }); }, function (e) {
          B.toast(e.message, 'bad', 7000); renderAuth('forgot', {});
        });
      });
    }
    return B.ensureDemoLogin().then(B.loadBrand).then(function (boot) {
      if (!B.session.token() || !boot.user) { B.session.clear(); showAuth('login'); return; }
      B.session.setUser(boot.user);
      startApp();
    });
  });
})(window, document);

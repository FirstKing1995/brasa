/* =====================================================================
   BRASA · afiliado.js
   Painel do afiliado: entrada, painel, produtos, links, vendas,
   suporte e perfil. Usa só config.js e core.js. Sessão própria ("aff").
   ===================================================================== */
(function () {
  'use strict';

  B.session.use('aff');

  var E = B.esc;
  var TZ = 'America/Fortaleza';
  var app, view;

  var S = {
    mode: '',              // 'auth' | 'activate' | 'app'
    user: null,
    route: '',
    routed: false,
    days: 30,              // período do painel (7, 30, 90)
    home: null, homeAt: 0, homeReq: 0,
    market: null,
    sf: { period: 30, course: '', shown: 50, data: null, req: 0 },
    nav: 0,                // a cada tela nova, respostas atrasadas da anterior são descartadas
    leave: null,           // limpeza da tela atual (timers, ouvintes)
    unreadT: 0,
    embers: null,
    routerOn: false
  };

  var ACT = {};            // cliques: <button data-act="nome">
  var FORM = {};           // envios: <form data-form="nome">
  var LIVE = {};           // digitação: <div data-live="nome">

  var NAV = [
    ['painel', '/', 'Painel', 'chart'],
    ['produtos', '/produtos', 'Produtos', 'store'],
    ['links', '/links', 'Links', 'link'],
    ['vendas', '/vendas', 'Vendas', 'money'],
    ['suporte', '/suporte', 'Suporte', 'chat']
  ];

  /* ---------------------------------------------------------------
     utilidades
     --------------------------------------------------------------- */
  function first(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
  function ic(n, c) { return B.icon(n, c); }
  function money(v) { return '<span class="t-num aff-nw">' + E(B.fmt.money(v)) + '</span>'; }
  function dm(ts) {
    return ts ? new Date(Number(ts)).toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' }) : '';
  }
  function monthName() { return new Date().toLocaleDateString('pt-BR', { timeZone: TZ, month: 'long' }); }
  function yearNow() { return new Date().toLocaleDateString('pt-BR', { timeZone: TZ, year: 'numeric' }); }
  function dayKey(ts) { return new Date(Number(ts)).toLocaleDateString('en-CA', { timeZone: TZ }); }
  function isAff(u) { return !!(u && u.roles && u.roles.indexOf('affiliate') > -1); }
  function lpPage(slug) { return B.base + 'lp.html?c=' + encodeURIComponent(slug); }
  function cleanIg(v) {
    return String(v || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@+/, '');
  }
  function isUrl(v) { return /^https?:\/\//i.test(String(v || '').trim()); }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function isVoid(st) { return st === 'canceled' || st === 'reversed'; }
  function sk(h, cls) { return '<div class="skel ' + (cls || '') + '" style="height:' + h + 'px"></div>'; }
  function has(arr) { return arr.some(function (p) { return p.value > 0; }); }

  // erro de sessão e de papel já levam o usuário a outra tela: não repetir aviso
  function quiet(e) { return !!e && (e.code === 'AUTH' || e.code === 'NOT_AFFILIATE'); }
  function fail(e) { if (!quiet(e)) B.fail(e); }

  // chamada à API: se a conta não for de afiliado, abre a ativação
  function api(action, payload) {
    return B.api(action, payload).catch(function (e) {
      if (e && e.code === 'NOT_AFFILIATE') showActivate();
      throw e;
    });
  }

  // cada tela pede um "crachá"; se o usuário trocar de tela, o crachá antigo deixa de valer
  function begin() { var t = ++S.nav; return function () { return t === S.nav && S.mode === 'app'; }; }

  function busy(btn, on) {
    if (!btn) return;
    btn.classList.toggle('is-loading', !!on);
    if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy');
  }
  function isBusy(btn) { return !!btn && btn.classList.contains('is-loading'); }

  function pageHead(rune, title, lead, right) {
    return '<header class="aff-head">' +
      '<div class="aff-head__txt"><h1 class="t-1 aff-head__h"><span class="aff-rune t-rune" aria-hidden="true">' + rune + '</span>' + E(title) + '</h1>' +
      (lead ? '<p class="t-lead aff-head__lead">' + E(lead) + '</p>' : '') + '</div>' + (right || '') + '</header>';
  }

  function emptyBlock(title, text, action, seed) {
    return '<div class="empty aff-empty">' + B.sigil(seed || title) + '<div class="empty__title">' + E(title) + '</div>' +
      (text ? '<p>' + E(text) + '</p>' : '') + (action || '') + '</div>';
  }
  function errBlock(e) {
    return '<div class="empty aff-empty">' + ic('alert') + '<div class="empty__title">Não foi possível carregar</div>' +
      '<p>' + E((e && e.message) || 'Verifique sua conexão e tente de novo.') + '</p>' +
      '<button type="button" class="btn" data-act="retry">Tentar de novo</button></div>';
  }

  // botão de copiar com dois estados (Copiar / Copiado), alternados pela classe is-copied do B.copy
  function copyBtn(text, o) {
    o = o || {};
    return '<button type="button" class="btn ' + (o.cls || '') + ' aff-copy" data-act="copy" data-copy="' + E(text) + '"' +
      (o.aria ? ' aria-label="' + E(o.aria) + '"' : '') + '>' +
      '<span class="aff-copy__a">' + ic('copy') + '<span>' + E(o.label || 'Copiar link') + '</span></span>' +
      '<span class="aff-copy__b" aria-hidden="true">' + ic('check') + '<span>Copiado</span></span></button>';
  }

  function chip(kind, icon, text) {
    return '<span class="chip chip--' + kind + '">' + (icon ? ic(icon) : '') + E(text) + '</span>';
  }

  // estado da comissão: sempre cor + ícone + texto
  function commChip(st, releaseAt, orderSt) {
    if (st === 'pending') return chip('warn', 'clock', 'A liberar' + (releaseAt ? ' em ' + dm(releaseAt) : ''));
    if (st === 'available') return chip('ok', 'wallet', 'Disponível');
    if (st === 'paid') return chip('ok', 'check', 'Paga');
    if (st === 'canceled') return chip('bad', 'x', 'Cancelada');
    if (st === 'reversed') return chip('bad', 'refresh', 'Estornada');
    if (orderSt === 'refunded') return chip('bad', 'x', 'Reembolsada');
    if (orderSt === 'chargeback') return chip('bad', 'x', 'Contestada');
    return '<span class="t-faint t-sm">Sem comissão</span>';
  }

  /* ---------------------------------------------------------------
     eventos globais (um ouvinte por tipo, na raiz: sobrevive a qualquer re-render)
     --------------------------------------------------------------- */
  function go(path) {
    closeMenu();
    if (B.router.path === path) B.router.reload(); else B.router.go(path);
  }

  function bindGlobal() {
    // no document, para valer também dentro de modais (que ficam fora do #app)
    document.addEventListener('click', function (ev) {
      var el = ev.target;
      if (!el || !el.closest) return;
      var a = el.closest('a[href^="#/"]');
      if (a && app.contains(a) && !ev.defaultPrevented && ev.button === 0 && !(ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) && S.mode === 'app') {
        ev.preventDefault();
        go(a.getAttribute('href').slice(1));
        return;
      }
      var t = el.closest('[data-act]');
      if (t && ACT[t.getAttribute('data-act')]) ACT[t.getAttribute('data-act')](t, ev);
    });
    app.addEventListener('submit', function (ev) {
      var f = ev.target && ev.target.closest && ev.target.closest('form[data-form]');
      if (!f) return;
      ev.preventDefault();
      var fn = FORM[f.getAttribute('data-form')];
      if (fn) fn(f);
    });
    function live(ev) {
      var n = ev.target && ev.target.closest && ev.target.closest('[data-live]');
      if (n && LIVE[n.getAttribute('data-live')]) LIVE[n.getAttribute('data-live')](ev.target, n);
    }
    app.addEventListener('input', live);
    app.addEventListener('change', live);
    app.addEventListener('keydown', function (ev) {
      var t = ev.target;
      if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing && t && t.matches && t.matches('[data-enter-send]')) {
        ev.preventDefault();
        FORM.chat(t.closest('form'));
      }
    });
    document.addEventListener('click', function (ev) { if (!ev.target.closest || !ev.target.closest('.aff-user')) closeMenu(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeMenu(true); });
  }

  ACT.copy = function (t) { B.copy(t.getAttribute('data-copy'), t); };
  ACT.retry = function () { if (S.mode === 'app') B.router.reload(); else location.reload(); };
  ACT.logout = function () { doLogout(); B.toast('Você saiu da conta.', 'info', 2200); };
  ACT.eye = function (b) {
    var inp = b.parentNode.querySelector('input');
    var show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', show ? 'true' : 'false');
    b.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  };

  /* menu da conta (avatar) */
  function closeMenu(refocus) {
    var pop = B.$('[data-menu-pop]', app);
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    var b = B.$('[data-act="menu"]', app);
    if (b) { b.setAttribute('aria-expanded', 'false'); if (refocus) b.focus(); }
  }
  ACT.menu = function (btn) {
    var pop = B.$('[data-menu-pop]', app);
    if (!pop) return;
    var open = pop.hidden;
    pop.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  /* ---------------------------------------------------------------
     estrutura da página logada: topo, área da tela e barra inferior
     --------------------------------------------------------------- */
  function navLinks(kind) {
    return NAV.map(function (n) {
      var dot = n[0] === 'suporte' ? (kind === 'top' ? '<span class="aff-dot" data-dot hidden></span>' : '<span class="badge-dot" data-dot hidden></span>') : '';
      if (kind === 'top') return '<a href="#' + n[1] + '" data-nav="' + n[0] + '">' + n[2] + dot + '</a>';
      return '<a href="#' + n[1] + '" data-nav="' + n[0] + '">' + ic(n[3]) + '<span>' + n[2] + '</span>' + dot + '</a>';
    }).join('');
  }

  function shellHtml() {
    var u = S.user || {};
    return '<header class="topbar is-solid aff-top">' +
      '<div class="topbar__inner">' +
        '<a class="brand" href="#/" aria-label="' + E(B.brand.name) + ', ir ao painel">' + B.brandMark() + '</a>' +
        '<nav class="topbar__links hide-sm" aria-label="Seções do painel">' + navLinks('top') + '</nav>' +
        '<span class="grow"></span>' +
        '<button type="button" class="chip chip--mustard aff-code" data-act="copy" data-copy="' + E(u.aff_code) + '" aria-label="Copiar seu código de afiliado ' + E(u.aff_code) + '">' + ic('copy') + '<span>' + E(u.aff_code) + '</span></button>' +
        '<div class="aff-user">' +
          '<button type="button" class="aff-user__btn" data-act="menu" aria-haspopup="menu" aria-expanded="false" aria-label="Menu da conta">' + B.avatar(u, 38) + '</button>' +
          '<div class="aff-menu" role="menu" data-menu-pop hidden>' +
            '<div class="aff-menu__who"><strong class="ellipsis" data-me-name>' + E(u.name) + '</strong><span class="t-xs t-faint ellipsis">' + E(u.email) + '</span></div>' +
            '<a role="menuitem" href="#/perfil">' + ic('user') + 'Perfil</a>' +
            '<button type="button" role="menuitem" data-act="logout">' + ic('logout') + 'Sair</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</header>' +
    '<main class="wrap wrap--mid aff-main" id="view" tabindex="-1"></main>' +
    '<nav class="bottomnav" aria-label="Navegação principal"><div class="bottomnav__inner">' + navLinks('bottom') + '</div></nav>';
  }

  function setActive(name) {
    B.$$('[data-nav]', app).forEach(function (a) {
      var on = a.getAttribute('data-nav') === name;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function setDot(on) { B.$$('[data-dot]', app).forEach(function (d) { d.hidden = !on; }); }

  function checkUnread() {
    if (S.mode !== 'app' || document.hidden || S.route === 'suporte') return;
    B.api('chatUnread').then(function (r) { if (S.mode === 'app' && S.route !== 'suporte') setDot(r.unread > 0); }, function () {});
  }
  function startUnread() { stopUnread(); checkUnread(); S.unreadT = setInterval(checkUnread, 60000); }
  function stopUnread() { if (S.unreadT) clearInterval(S.unreadT); S.unreadT = 0; }

  function stopShell() {
    stopUnread();
    if (S.leave) { try { S.leave(); } catch (e) {} S.leave = null; }
    if (S.embers) { S.embers.stop(); S.embers = null; }
    S.nav++;
    S.home = null; S.market = null; S.sf.data = null; S.route = '';
  }

  function startApp() {
    stopShell();
    S.mode = 'app';
    S.routed = false;
    document.documentElement.classList.remove('no-bottomnav');
    app.className = 'aff has-bottomnav' + (B.demo ? ' is-demo' : '');
    app.innerHTML = shellHtml();
    view = B.$('#view', app);
    startUnread();
    if (!S.routerOn) { S.routerOn = true; B.router.start('/'); } else { B.router.reload(); }
  }

  function doLogout(msg) {
    B.logout();
    try { history.replaceState(null, '', '#/'); } catch (e) {}
    showAuth(msg || '', 'login');
  }

  // cada rota: limpa a tela anterior, marca o menu, ajusta o título e chama a tela
  function route(name, title, fn) {
    return function (params, query) {
      if (S.mode !== 'app' || !view) return;
      if (S.leave) { try { S.leave(); } catch (e) {} S.leave = null; }
      closeMenu();
      S.route = name;
      setActive(name);
      document.title = title + ' | ' + B.brand.name;
      try { fn(params, query); } catch (e) { console.error(e); view.innerHTML = '<div class="aff-page">' + errBlock(e) + '</div>'; }
      if (S.routed) { try { view.focus({ preventScroll: true }); } catch (e) {} }
      S.routed = true;
    };
  }

  function registerRoutes() {
    B.router
      .on('/', route('painel', 'Painel', viewHome))
      .on('/produtos', route('produtos', 'Produtos', viewMarket))
      .on('/links', route('links', 'Links', viewLinks))
      .on('/vendas', route('vendas', 'Vendas', viewSales))
      .on('/suporte', route('suporte', 'Suporte', viewSupport))
      .on('/perfil', route('perfil', 'Perfil', viewProfile))
      .otherwise(function () { if (S.mode === 'app') B.router.go('/', { replace: true }); });
  }

  // painel com cache curto: as telas Links e Vendas reaproveitam o que o Painel já buscou
  function getHome(force) {
    if (!force && S.home && S.home.days === S.days && Date.now() - S.homeAt < 60000) return Promise.resolve(S.home);
    return api('affHome', { days: S.days }).then(function (h) { S.home = h; S.homeAt = Date.now(); return h; });
  }

  /* ===============================================================
     ENTRADA: entrar, quero ser afiliado, esqueci a senha, ativar conta
     =============================================================== */
  var PERKS = [
    ['percent', 'Comissão em cada curso', 'Você ganha uma parte de cada venda feita pelo seu link.'],
    ['link', 'Links rastreados', 'Cliques e vendas ficam registrados no seu nome.'],
    ['chart', 'Painel em tempo real', 'Veja cliques, vendas e ranking sem esperar relatório.'],
    ['pix', 'Pagamento via Pix', 'A comissão libera depois da garantia e cai na sua chave.']
  ];

  function field(o) {
    var id = 'f-' + o.name;
    var inp = '<input class="input" id="' + id + '" name="' + o.name + '" type="' + (o.type || 'text') + '"' +
      (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.im ? ' inputmode="' + o.im + '"' : '') +
      (o.ph ? ' placeholder="' + E(o.ph) + '"' : '') + (o.value ? ' value="' + E(o.value) + '"' : '') +
      (o.max ? ' maxlength="' + o.max + '"' : '') + ' aria-describedby="' + id + '-e' + (o.hint ? ' ' + id + '-h' : '') + '"' + (o.extra || '') + '>';
    if (o.type === 'password') {
      inp = '<div class="aff-pw">' + inp + '<button type="button" class="iconbtn aff-pw__eye" data-act="eye" aria-pressed="false" aria-label="Mostrar senha">' + ic('eye') + '</button></div>';
    }
    if (o.addon) inp = '<div class="input-group"><span class="addon">' + o.addon + '</span>' + inp + '</div>';
    return '<div class="field"><label for="' + id + '">' + E(o.label) + (o.opt ? ' <span class="aff-opt">opcional</span>' : '') + '</label>' + inp +
      (o.hint ? '<div class="hint" id="' + id + '-h">' + E(o.hint) + '</div>' : '') +
      '<div class="err" id="' + id + '-e" role="alert" hidden></div></div>';
  }

  function fieldErr(f, name, msg) {
    var inp = B.$('[name="' + name + '"]', f), er = B.$('#f-' + name + '-e', f);
    if (inp) { inp.classList.add('is-invalid'); inp.setAttribute('aria-invalid', 'true'); inp.focus(); }
    if (er) { er.textContent = msg; er.hidden = false; }
    return false;
  }
  function clearErrs(f) {
    B.$$('.is-invalid', f).forEach(function (i) { i.classList.remove('is-invalid'); i.removeAttribute('aria-invalid'); });
    B.$$('.err', f).forEach(function (e) { e.hidden = true; e.textContent = ''; });
  }
  function formErr(f, msg, extra) {
    var er = B.$('[data-formerr]', f);
    if (!er) return B.toast(msg, 'bad', 5200);
    er.innerHTML = '<span>' + E(msg) + '</span>' + (extra || '');
    er.hidden = false;
  }

  function demoCreds() {
    var c = window.BrasaDemo && window.BrasaDemo.creds && window.BrasaDemo.creds.aff;
    return c || ['afiliado@brasa.demo', 'brasa123'];
  }
  function demoHint() {
    if (!B.demo) return '';
    var c = demoCreds();
    return '<div class="aff-demo"><div class="aff-demo__txt"><strong>Demonstração</strong><span>E-mail <code>' + E(c[0]) + '</code> e senha <code>' + E(c[1]) + '</code>.</span></div>' +
      '<button type="button" class="btn btn--sm btn--ghost" data-act="demo-fill">Preencher</button></div>';
  }
  ACT['demo-fill'] = function () {
    var c = demoCreds(), f = B.$('form[data-form="login"]', app);
    if (!f) return;
    B.$('[name="email"]', f).value = c[0];
    B.$('[name="password"]', f).value = c[1];
    clearErrs(f);
    B.$('[type="submit"]', f).focus();
  };

  function authFrame() {
    return '<div class="aff-auth">' +
      '<div class="aff-auth__glow" aria-hidden="true"></div>' +
      '<div class="wrap aff-auth__grid">' +
        '<div class="brand aff-auth__brand">' + B.brandMark() + '</div>' +
        '<div class="aff-auth__pitch">' +
          '<h1 class="aff-auth__h t-hero">Indique os cursos. Receba no Pix.</h1>' +
          '<p class="t-lead aff-auth__lead">Copie seu link, acompanhe cada clique e cada venda em tempo real e receba a comissão direto na sua chave Pix.</p>' +
        '</div>' +
        '<section class="panel hud aff-auth__card" aria-label="Acesso ao painel" data-auth-card></section>' +
        '<ul class="aff-perks">' + PERKS.map(function (p) {
          return '<li class="aff-perk"><span class="aff-perk__ic">' + ic(p[0]) + '</span><div><strong>' + p[1] + '</strong><span>' + p[2] + '</span></div></li>';
        }).join('') + '</ul>' +
      '</div></div>';
  }

  function tabsHtml(mode) {
    function tab(m, label) {
      return '<button type="button" class="tab' + (mode === m ? ' is-active' : '') + '" role="tab" aria-selected="' + (mode === m) + '" data-act="auth-mode" data-mode="' + m + '">' + label + '</button>';
    }
    return '<div class="tabs aff-tabs" role="tablist" aria-label="Acesso">' + tab('login', 'Entrar') + tab('register', 'Quero ser afiliado') + '</div>';
  }

  function noticeHtml(msg) {
    return msg ? '<div class="aff-notice" role="status">' + ic('info') + '<span>' + E(msg) + '</span></div>' : '';
  }

  function loginForm(o) {
    return '<form class="stack aff-form" data-form="login" novalidate>' + noticeHtml(o.msg) +
      field({ name: 'email', label: 'E-mail', type: 'email', ac: 'username', im: 'email', ph: 'voce@email.com', value: o.email, extra: ' autocapitalize="none" spellcheck="false"' }) +
      field({ name: 'password', label: 'Senha', type: 'password', ac: 'current-password' }) +
      '<div class="err aff-formerr" data-formerr role="alert" hidden></div>' +
      '<button type="submit" class="btn btn--primary btn--lg btn--block">Entrar</button>' +
      '<button type="button" class="btn btn--link aff-linkbtn" data-act="auth-mode" data-mode="forgot">Esqueci minha senha</button>' +
      demoHint() + '</form>';
  }

  function registerForm(o) {
    if (B.boot0 && B.boot0.affiliate_program === false) {
      return '<div class="aff-closed">' + ic('lock') + '<div><strong>Cadastros fechados por enquanto</strong><p class="t-muted t-sm">O programa de afiliados não está aceitando novas contas. Se você já tem conta, use a aba Entrar.</p></div></div>';
    }
    var terms = B.brand.terms_url && isUrl(B.brand.terms_url)
      ? '<p class="hint">Ao criar a conta você concorda com os <a href="' + E(B.safeUrl(B.brand.terms_url)) + '" target="_blank" rel="noopener">termos de uso</a>.</p>' : '';
    return '<form class="stack aff-form" data-form="register" novalidate>' +
      field({ name: 'name', label: 'Nome completo', ac: 'name', ph: 'Como você quer ser chamado', value: o.name, max: 120 }) +
      field({ name: 'email', label: 'E-mail', type: 'email', ac: 'email', im: 'email', ph: 'voce@email.com', value: o.email, extra: ' autocapitalize="none" spellcheck="false"' }) +
      field({ name: 'password', label: 'Senha', type: 'password', ac: 'new-password', hint: 'Pelo menos 6 caracteres.' }) +
      field({ name: 'pix_key', label: 'Chave Pix', ac: 'off', ph: 'CPF, e-mail, celular ou chave aleatória', hint: 'É nela que você recebe as comissões. Dá para trocar depois no Perfil.', max: 120, extra: ' autocapitalize="none" spellcheck="false"' }) +
      field({ name: 'instagram', label: 'Instagram', opt: true, ac: 'off', ph: 'seuperfil', addon: '@', max: 80, extra: ' autocapitalize="none" spellcheck="false"' }) +
      '<div class="err aff-formerr" data-formerr role="alert" hidden></div>' +
      '<button type="submit" class="btn btn--primary btn--lg btn--block">Criar conta de afiliado</button>' + terms + '</form>';
  }

  function forgotForm(o) {
    return '<form class="stack aff-form" data-form="forgot" novalidate>' +
      '<div><h2 class="aff-card-h">Recuperar acesso</h2><p class="t-muted t-sm">Informe o e-mail da sua conta. Vamos enviar um código de 6 dígitos para você criar uma nova senha.</p></div>' +
      field({ name: 'email', label: 'E-mail', type: 'email', ac: 'username', im: 'email', ph: 'voce@email.com', value: o.email, extra: ' autocapitalize="none" spellcheck="false"' }) +
      '<div class="err aff-formerr" data-formerr role="alert" hidden></div>' +
      '<button type="submit" class="btn btn--primary btn--lg btn--block">Enviar código</button>' +
      '<button type="button" class="btn btn--link aff-linkbtn" data-act="auth-mode" data-mode="login">Voltar para entrar</button></form>';
  }

  function resetForm(o) {
    var demo = o.demoCode
      ? '<div class="aff-demo"><div class="aff-demo__txt"><strong>Demonstração</strong><span>Seu código é <code>' + E(o.demoCode) + '</code>.</span></div><button type="button" class="btn btn--sm btn--ghost" data-act="code-fill" data-code="' + E(o.demoCode) + '">Usar código</button></div>'
      : '';
    return '<form class="stack aff-form" data-form="reset" data-email="' + E(o.email) + '" novalidate>' +
      '<div><h2 class="aff-card-h">Criar nova senha</h2><p class="t-muted t-sm">Enviamos um código de 6 dígitos para <strong class="aff-break">' + E(o.email) + '</strong>. Ele vale por 30 minutos.</p></div>' + demo +
      field({ name: 'code', label: 'Código', ac: 'one-time-code', im: 'numeric', ph: '000000', max: 6 }) +
      field({ name: 'password', label: 'Nova senha', type: 'password', ac: 'new-password', hint: 'Pelo menos 6 caracteres.' }) +
      '<div class="err aff-formerr" data-formerr role="alert" hidden></div>' +
      '<button type="submit" class="btn btn--primary btn--lg btn--block">Criar nova senha</button>' +
      '<button type="button" class="btn btn--link aff-linkbtn" data-act="auth-mode" data-mode="forgot">Pedir outro código</button></form>';
  }

  function activateForm() {
    var u = S.user || {};
    return '<form class="stack aff-form" data-form="activate" novalidate>' +
      '<div><h2 class="aff-card-h">Ativar minha conta de afiliado</h2>' +
      '<p class="t-muted t-sm">Você entrou como <strong class="aff-break">' + E(u.email) + '</strong>, mas esta conta ainda não participa do programa. Informe sua chave Pix para ativar.</p></div>' +
      field({ name: 'pix_key', label: 'Chave Pix', ac: 'off', ph: 'CPF, e-mail, celular ou chave aleatória', hint: 'É nela que você recebe as comissões.', max: 120, extra: ' autocapitalize="none" spellcheck="false"' }) +
      field({ name: 'instagram', label: 'Instagram', opt: true, ac: 'off', ph: 'seuperfil', addon: '@', max: 80, extra: ' autocapitalize="none" spellcheck="false"' }) +
      '<div class="err aff-formerr" data-formerr role="alert" hidden></div>' +
      '<button type="submit" class="btn btn--primary btn--lg btn--block">Ativar minha conta de afiliado</button>' +
      '<button type="button" class="btn btn--link aff-linkbtn" data-act="logout">Sair e usar outra conta</button></form>';
  }

  function authCard(mode, o) {
    o = o || {};
    var slot = B.$('[data-auth-card]', app);
    if (!slot) return;
    var h = (mode === 'login' || mode === 'register') ? tabsHtml(mode) : '';
    if (mode === 'login') h += loginForm(o);
    else if (mode === 'register') h += registerForm(o);
    else if (mode === 'forgot') h += forgotForm(o);
    else if (mode === 'reset') h += resetForm(o);
    slot.innerHTML = h;
    S.authMode = mode;
    var f = B.$('input:not([type="hidden"])', slot);
    if (f && !('ontouchstart' in window)) f.focus();
  }

  function authShell(title) {
    stopShell();
    document.documentElement.classList.add('no-bottomnav');
    app.className = 'aff aff--auth';
    app.innerHTML = authFrame();
    document.title = title + ' | ' + B.brand.name;
    S.embers = B.embers(B.$('.aff-auth', app), { count: 44 });
    window.scrollTo(0, 0);
  }

  function showAuth(message, mode) {
    S.mode = 'auth';
    S.user = null;
    authShell('Entrar');
    authCard(mode || 'login', { msg: message });
  }

  function showActivate() {
    if (S.mode === 'activate') return;
    S.mode = 'activate';
    authShell('Ativar conta de afiliado');
    B.$('[data-auth-card]', app).innerHTML = activateForm();
    var f = B.$('input', app);
    if (f && !('ontouchstart' in window)) f.focus();
  }

  function afterLogin(user) {
    S.user = user;
    B.session.setUser(user);
    if (!isAff(user)) { S.mode = ''; showActivate(); return; }
    startApp();
  }

  ACT['auth-mode'] = function (t) {
    var card = B.$('[data-auth-card]', app), f = card && B.$('form', card);
    var email = f && B.$('[name="email"]', f) ? String(B.$('[name="email"]', f).value || '').trim() : '';
    var name = f && B.$('[name="name"]', f) ? String(B.$('[name="name"]', f).value || '') : '';
    authCard(t.getAttribute('data-mode'), { email: email, name: name });
  };
  ACT['code-fill'] = function (t) {
    var f = B.$('form[data-form="reset"]', app);
    if (!f) return;
    B.$('[name="code"]', f).value = t.getAttribute('data-code');
    B.$('[name="password"]', f).focus();
  };

  FORM.login = function (f) {
    var btn = B.$('[type="submit"]', f);
    if (isBusy(btn)) return;
    clearErrs(f);
    var d = B.formData(f), email = String(d.email || '').trim();
    if (!B.validEmail(email)) return fieldErr(f, 'email', 'Informe um e-mail válido.');
    if (!d.password) return fieldErr(f, 'password', 'Informe sua senha.');
    busy(btn, true);
    B.api('login', { email: email, password: d.password }).then(function (r) {
      B.loginDone(r);
      afterLogin(r.user);
    }, function (e) {
      busy(btn, false);
      formErr(f, e.message);
    });
  };

  FORM.register = function (f) {
    var btn = B.$('[type="submit"]', f);
    if (isBusy(btn)) return;
    clearErrs(f);
    var d = B.formData(f), name = String(d.name || '').trim(), email = String(d.email || '').trim(), pix = String(d.pix_key || '').trim();
    if (name.length < 2) return fieldErr(f, 'name', 'Informe seu nome.');
    if (!B.validEmail(email)) return fieldErr(f, 'email', 'Informe um e-mail válido.');
    if (String(d.password || '').length < 6) return fieldErr(f, 'password', 'A senha precisa ter pelo menos 6 caracteres.');
    if (pix.length < 5) return fieldErr(f, 'pix_key', 'Informe sua chave Pix. É por ela que você recebe as comissões.');
    busy(btn, true);
    B.api('register', { name: name, email: email, password: d.password, as: 'affiliate', pix_key: pix, instagram: cleanIg(d.instagram) }).then(function (r) {
      B.loginDone(r);
      B.toast('Conta criada. Bem-vindo ao programa de afiliados.', 'ok', 3600);
      afterLogin(r.user);
    }, function (e) {
      busy(btn, false);
      var extra = e.code === 'EXISTS' ? '<button type="button" class="btn btn--link" data-act="auth-mode" data-mode="login">Entrar com este e-mail</button>' : '';
      formErr(f, e.message, extra);
    });
  };

  FORM.forgot = function (f) {
    var btn = B.$('[type="submit"]', f);
    if (isBusy(btn)) return;
    clearErrs(f);
    var email = String(B.formData(f).email || '').trim();
    if (!B.validEmail(email)) return fieldErr(f, 'email', 'Informe um e-mail válido.');
    busy(btn, true);
    B.api('forgot', { email: email }).then(function (r) {
      authCard('reset', { email: email, demoCode: r.demo_code || '' });
    }, function (e) {
      busy(btn, false);
      formErr(f, e.message);
    });
  };

  FORM.reset = function (f) {
    var btn = B.$('[type="submit"]', f);
    if (isBusy(btn)) return;
    clearErrs(f);
    var d = B.formData(f), code = String(d.code || '').replace(/\D/g, '');
    if (code.length < 6) return fieldErr(f, 'code', 'Digite o código de 6 dígitos.');
    if (String(d.password || '').length < 6) return fieldErr(f, 'password', 'A nova senha precisa ter pelo menos 6 caracteres.');
    busy(btn, true);
    B.api('reset', { email: f.getAttribute('data-email'), code: code, password: d.password }).then(function (r) {
      B.loginDone(r);
      B.toast('Senha criada. Você já está dentro.', 'ok', 3200);
      afterLogin(r.user);
    }, function (e) {
      busy(btn, false);
      formErr(f, e.message);
    });
  };

  FORM.activate = function (f) {
    var btn = B.$('[type="submit"]', f);
    if (isBusy(btn)) return;
    clearErrs(f);
    var d = B.formData(f), pix = String(d.pix_key || '').trim();
    if (pix.length < 5) return fieldErr(f, 'pix_key', 'Informe sua chave Pix. É por ela que você recebe as comissões.');
    busy(btn, true);
    B.api('affJoin', { pix_key: pix, instagram: cleanIg(d.instagram) }).then(function (r) {
      B.toast('Conta de afiliado ativada.', 'ok', 3200);
      afterLogin(r.user);
    }, function (e) {
      busy(btn, false);
      formErr(f, e.message);
    });
  };

  /* ===============================================================
     PAINEL (/)
     =============================================================== */
  function curAlive() { var t = S.nav; return function () { return t === S.nav && S.mode === 'app'; }; }

  function maskName(n) {
    var p = String(n || '').trim().split(/\s+/);
    return (p[0] || 'Você') + (p.length > 1 ? ' ' + p[p.length - 1].charAt(0).toUpperCase() + '.' : '');
  }

  function segHtml() {
    return '<div class="seg aff-seg" role="group" aria-label="Período">' + [7, 30, 90].map(function (d) {
      return '<button type="button" data-act="days" data-days="' + d + '" class="' + (d === S.days ? 'is-active' : '') + '" aria-pressed="' + (d === S.days) + '">' + d + ' dias</button>';
    }).join('') + '</div>';
  }

  function homeSkel() {
    return '<div class="aff-skel" aria-hidden="true">' + sk(104) +
      '<div class="aff-skel__row">' + sk(150) + sk(150) + sk(150) + '</div>' + sk(280) + sk(300) + '</div>';
  }

  function viewHome() {
    var alive = begin(), u = S.user || {};
    view.innerHTML = '<div class="aff-page">' +
      '<header class="aff-hello">' +
        '<div class="aff-head__txt">' +
          '<h1 class="t-1 aff-head__h"><span class="aff-rune t-rune" aria-hidden="true">ᚠ</span>Fala, ' + E(first(u.name)) + '.</h1>' +
          '<p class="t-muted aff-hello__sub" id="home-sub"></p>' +
        '</div>' + segHtml() +
      '</header>' +
      '<div class="aff-home" id="home-body" aria-live="polite">' + homeSkel() + '</div></div>';
    updateSub();
    S.paintedSig = '';
    var cached = S.home && S.home.days === S.days ? S.home : null;
    if (cached) paintHome(cached);
    loadHome(alive, !cached);
  }

  function updateSub() {
    var el = B.$('#home-sub');
    if (el) el.textContent = 'Seus números dos últimos ' + S.days + ' dias.';
  }

  // mantém o que está na tela (opacidade reduzida) enquanto busca; só repinta se algo mudou
  function loadHome(alive, showSkel) {
    var req = ++S.homeReq, body = B.$('#home-body');
    if (body && !showSkel) body.classList.add('is-busy');
    return api('affHome', { days: S.days }).then(function (h) {
      if (!alive() || req !== S.homeReq) return;
      S.home = h; S.homeAt = Date.now();
      if (JSON.stringify(h) !== S.paintedSig) paintHome(h);
      body = B.$('#home-body');
      if (body) body.classList.remove('is-busy');
    }, function (e) {
      if (!alive() || req !== S.homeReq) return;
      body = B.$('#home-body');
      if (body) body.classList.remove('is-busy');
      if (quiet(e)) return;
      if (showSkel && body) body.innerHTML = errBlock(e); else B.fail(e);
    });
  }

  ACT.days = function (t) {
    var d = Number(t.getAttribute('data-days'));
    if (!d || d === S.days || S.route !== 'painel') return;
    S.days = d;
    B.$$('[data-act="days"]', app).forEach(function (b) {
      var on = Number(b.getAttribute('data-days')) === d;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    updateSub();
    loadHome(curAlive(), false);
  };

  function paintHome(h) {
    var body = B.$('#home-body');
    if (!body) return;
    S.paintedSig = JSON.stringify(h);
    if (h.profile && S.user) {
      S.user.pix_key = h.profile.pix_key; S.user.instagram = h.profile.instagram;
    }
    body.innerHTML = alertHtml(h) + startHtml(h) + kpisHtml(h) + balHtml(h) + chartsHtml(h) + rankHtml(h) + affsHtml(h) + recentHtml(h);
    drawCharts(h);
  }

  function alertHtml(h) {
    if (h.profile && h.profile.pix_key) return '';
    return '<div class="aff-alert" role="alert">' + ic('alert') +
      '<div class="aff-alert__txt"><strong>Falta cadastrar sua chave Pix</strong><span>Sem ela não conseguimos pagar suas comissões.</span></div>' +
      '<a class="btn btn--sm" href="#/perfil">Cadastrar chave Pix</a></div>';
  }

  function startHtml(h) {
    if ((h.affiliations || []).length) return '';
    return '<section class="panel hud aff-start" aria-labelledby="h-start">' +
      '<div class="aff-start__txt"><h2 class="t-2" id="h-start">Comece escolhendo um curso</h2>' +
      '<p class="t-muted">Em poucos minutos o seu link está pronto para divulgar.</p></div>' +
      '<ol class="aff-steps">' +
        '<li><b>1</b><span>Peça a afiliação a um curso em Produtos.</span></li>' +
        '<li><b>2</b><span>Copie seu link em Links.</span></li>' +
        '<li><b>3</b><span>Divulgue e acompanhe os resultados aqui.</span></li>' +
      '</ol>' +
      '<a class="btn btn--primary" href="#/produtos">Ver produtos</a></section>';
  }

  function kpi(icon, label, value, sub) {
    var long = value.replace(/<[^>]*>/g, '').length > 9;
    return '<div class="kpi aff-kpi"><div class="kpi__label aff-kpi__lbl">' + ic(icon) + label + '</div>' +
      '<div class="kpi__value aff-kpi__val' + (long ? ' is-long' : '') + '">' + value + '</div>' +
      '<div class="aff-kpi__sub">' + sub + '</div></div>';
  }

  function kpisHtml(h) {
    var k = h.kpis || {};
    return '<section class="aff-kpis" aria-label="Resumo do período">' +
      kpi('click', 'Cliques', B.fmt.int(k.clicks), 'na página de vendas') +
      kpi('cart', 'Vendas', B.fmt.int(k.sales), 'pagas no período') +
      kpi('percent', 'Conversão', B.fmt.pct(k.conv), 'vendas por clique') +
      kpi('money', 'Comissão', money(k.commission), 'ganha no período') +
    '</section>';
  }

  function balHtml(h) {
    var k = h.kpis || {}, lit = Number(k.available) > 0, key = h.profile && h.profile.pix_key;
    return '<section class="aff-bal" aria-labelledby="h-bal">' +
      '<h2 class="aff-h" id="h-bal">Seu saldo</h2>' +
      '<div class="aff-bal__grid">' +
        '<article class="panel aff-bc aff-bc--pending">' +
          '<div class="aff-bc__top"><span class="aff-ico">' + ic('clock') + '</span><span class="aff-bc__lbl">A liberar</span></div>' +
          '<div class="aff-bc__val">' + money(k.pending) + '</div>' +
          '<p class="aff-bc__note">Em garantia, ainda não liberado.</p>' +
        '</article>' +
        '<article class="aff-avail' + (lit ? ' is-lit' : '') + '">' +
          '<div class="aff-avail__in">' +
            '<div class="aff-bc__top"><span class="aff-ico">' + ic('wallet') + '</span><span class="aff-bc__lbl">Disponível</span>' +
              (lit ? '<span class="aff-avail__tag">Pronto para receber</span>' : '') + '</div>' +
            '<div class="aff-avail__val">' + money(k.available) + '</div>' +
            '<p class="aff-avail__note">' + (lit ? 'Liberado. Entra no próximo pagamento via Pix.' : 'Nada liberado ainda. Suas comissões chegam aqui depois da garantia.') + '</p>' +
            '<span class="aff-avail__rune t-rune" aria-hidden="true">ᚠ</span>' +
          '</div>' +
        '</article>' +
        '<article class="panel aff-bc aff-bc--paid">' +
          '<div class="aff-bc__top"><span class="aff-ico aff-ico--ok">' + ic('check') + '</span><span class="aff-bc__lbl">Já recebido</span></div>' +
          '<div class="aff-bc__val">' + money(k.paid) + '</div>' +
          '<p class="aff-bc__note">Pago via Pix.</p>' +
        '</article>' +
      '</div>' +
      '<p class="aff-note">' + ic('info') + '<span>A comissão libera depois do prazo de garantia do curso e é paga via Pix na chave cadastrada' +
        (key ? ': <strong class="aff-break">' + E(key) + '</strong>. <a href="#/perfil">Alterar chave</a>' : '. <a href="#/perfil">Cadastrar chave Pix</a>') + '</span></p>' +
    '</section>';
  }

  function chartPanel(title, totalHtml, id, pts, col, valFmt, emptyMsg) {
    var any = has(pts), table = '';
    if (any) {
      table = '<details class="aff-twin"><summary>Ver em tabela</summary><div class="table-wrap aff-twin__wrap"><table class="table">' +
        '<thead><tr><th scope="col">Dia</th><th scope="col" class="num">' + E(col) + '</th></tr></thead><tbody>' +
        pts.filter(function (p) { return p.value > 0; }).reverse().map(function (p) {
          return '<tr><td>' + E(p.label) + '</td><td class="num">' + valFmt(p.value) + '</td></tr>';
        }).join('') + '</tbody></table></div></details>';
    }
    return '<section class="panel aff-chart"><div class="panel__head"><h2 class="panel__title">' + title + '</h2>' +
      '<span class="aff-chart__total">' + totalHtml + '</span></div>' +
      (any ? '<div class="aff-chart__plot" id="' + id + '"></div>' : '<div class="aff-chart__empty">' + emptyMsg + '</div>') + table + '</section>';
  }

  function seriesOf(h, key) {
    return (h.series || []).map(function (s) { return { label: s.label, value: Number(s[key]) || 0 }; });
  }

  function chartsHtml(h) {
    var k = h.kpis || {};
    return '<section class="aff-charts" aria-label="Evolução no período">' +
      chartPanel('Comissão por dia', money(k.commission), 'ch-com', seriesOf(h, 'commission'), 'Comissão', function (v) { return money(v); },
        'Nenhuma comissão neste período. Quando alguém comprar pelo seu link, ela aparece aqui.') +
      chartPanel('Cliques por dia', E(B.fmt.plural(k.clicks, 'clique', 'cliques')), 'ch-clk', seriesOf(h, 'clicks'), 'Cliques', function (v) { return B.fmt.int(v); },
        'Nenhum clique neste período. Copie um link e divulgue.') +
    '</section>';
  }

  function drawCharts(h) {
    var com = seriesOf(h, 'commission'), clk = seriesOf(h, 'clicks');
    var a = B.$('#ch-com'), b = B.$('#ch-clk');
    if (a) B.chart.area(a, com, { format: B.fmt.money, height: 230, label: 'Comissão por dia' });
    if (b) B.chart.area(b, clk, { format: function (v) { return B.fmt.plural(v, 'clique', 'cliques'); }, height: 170, label: 'Cliques por dia' });
  }

  /* ----- ranking do mês ----- */
  function rankMsg(h) {
    var rk = h.ranking || [], pos = h.my_pos || 0, mine = h.my_sales_month || 0;
    function vendas(n) { return n === 1 ? 'Falta 1 venda' : 'Faltam ' + B.fmt.int(n) + ' vendas'; }
    if (!pos) {
      if (!rk.length) return 'Ninguém vendeu em ' + monthName() + ' ainda. A primeira venda do mês coloca você em 1º.';
      return 'Primeira venda do mês abre seu nome no ranking. Hoje o 1º tem ' + B.fmt.plural(rk[0].sales, 'venda', 'vendas') + '.';
    }
    if (pos === 1) {
      if (rk.length < 2) return 'Você lidera o ranking do mês com ' + B.fmt.plural(mine, 'venda', 'vendas') + '.';
      var lead = mine - rk[1].sales;
      return lead > 0
        ? 'Você lidera o mês, ' + B.fmt.plural(lead, 'venda', 'vendas') + ' à frente do 2º.'
        : 'Você está em 1º, empatado com o 2º. Mais uma venda abre vantagem.';
    }
    if (pos > rk.length) {
      var gap10 = (rk[rk.length - 1] ? rk[rk.length - 1].sales : 0) - mine + 1;
      return 'Você está em ' + pos + 'º. ' + vendas(Math.max(1, gap10)) + ' para entrar no top 10.';
    }
    var gap = rk[pos - 2].sales - mine;
    return gap >= 1
      ? 'Você está em ' + pos + 'º. ' + vendas(gap) + ' para alcançar o ' + (pos - 1) + 'º.'
      : 'Você está em ' + pos + 'º, empatado com o ' + (pos - 1) + 'º. Mais uma venda e você passa.';
  }

  function rkRow(r, max) {
    var w = max > 0 && r.sales > 0 ? Math.max(3, Math.round(r.sales / max * 100)) : 0;
    var cls = 'aff-rk' + (r.me ? ' is-me' : '') + (r.pos === 1 ? ' is-first' : (r.pos === 2 || r.pos === 3) ? ' is-podium' : '');
    return '<li class="' + cls + '">' +
      '<span class="aff-rk__pos">' + (r.pos || '–') + '</span>' +
      '<div class="aff-rk__who"><div class="aff-rk__line"><span class="aff-rk__name">' + E(r.name) + '</span>' + (r.me ? '<span class="chip chip--mustard">Você</span>' : '') + '</div>' +
      '<div class="aff-rk__bar" aria-hidden="true"><i style="width:' + w + '%"></i></div></div>' +
      '<span class="aff-rk__n"><b class="t-num">' + B.fmt.int(r.sales) + '</b> ' + (r.sales === 1 ? 'venda' : 'vendas') + '</span></li>';
  }

  function rankHtml(h) {
    var rk = h.ranking || [], pos = h.my_pos || 0, mine = h.my_sales_month || 0;
    var max = rk.reduce(function (m, r) { return Math.max(m, r.sales); }, mine);
    var list = rk.map(function (r) { return rkRow(r, max); }).join('');
    if (!rk.some(function (r) { return r.me; })) {
      if (pos > rk.length) list += '<li class="aff-rk aff-rk--gap" aria-hidden="true"><span></span><span class="aff-rk__dots">···</span></li>';
      list += rkRow({ pos: pos, name: maskName(S.user && S.user.name), sales: mine, me: true }, max);
    }
    return '<section class="panel hud aff-rank" aria-labelledby="h-rank">' +
      '<div class="aff-rank__side">' +
        '<div class="aff-rank__head"><h2 class="aff-h" id="h-rank">Ranking do mês</h2><span class="aff-rank__month">' + E(cap(monthName())) + ' de ' + E(yearNow()) + '</span></div>' +
        '<div class="aff-rank__me' + (pos ? '' : ' is-none') + (pos === 1 ? ' is-first' : '') + '">' +
          (pos ? '<div class="aff-rank__big" aria-hidden="true">' + pos + 'º</div>' : '<div class="aff-rank__trophy" aria-hidden="true">' + ic('trophy') + '</div>') +
          '<p class="aff-rank__msg">' + E(rankMsg(h)) + '</p>' +
        '</div>' +
        (pos === 1 ? '<span class="sticker aff-rank__sticker">top 1</span>' : '') +
      '</div>' +
      '<ol class="aff-rank__list" aria-label="Top 10 do mês">' + list + '</ol>' +
    '</section>';
  }

  /* ----- afiliações (cartões compactos) ----- */
  function statusChip(st) {
    if (st === 'approved') return chip('ok', 'check', 'Afiliado');
    if (st === 'pending') return chip('warn', 'clock', 'Aguardando aprovação');
    if (st === 'rejected') return chip('bad', 'x', 'Pedido recusado');
    if (st === 'blocked') return chip('bad', 'ban', 'Bloqueado');
    return '';
  }

  function affCard(a) {
    var c = a.course || {}, ok = a.status === 'approved' && a.links && a.links.lp;
    var cta = ok ? copyBtn(a.links.lp, { cls: 'btn--primary btn--block', label: 'Copiar link' })
      : a.status === 'pending' ? '<button type="button" class="btn btn--block" disabled>' + ic('clock') + 'Aguardando aprovação</button>'
      : a.status === 'rejected' ? '<a class="btn btn--block" href="#/produtos">Pedir de novo em Produtos</a>'
      : '<a class="btn btn--block btn--ghost" href="#/suporte">Falar com o suporte</a>';
    return '<article class="aff-aff">' +
      '<div class="aff-art aff-aff__art">' + B.art(c, { title: false }) + '</div>' +
      '<div class="aff-aff__head">' +
        '<h3 class="aff-aff__title">' + E(c.title) + '</h3>' +
        '<div class="aff-aff__earn"><span class="aff-aff__pct">' + E(B.fmt.pct(a.commission_pct)) + ' de comissão</span>' +
          '<span class="aff-aff__per"><b>' + money(a.est_commission) + '</b> por venda</span></div>' +
        (ok || a.status === 'pending' ? '' : '<div class="aff-aff__st">' + statusChip(a.status) + '</div>') +
      '</div>' +
      '<dl class="aff-aff__stats">' +
        '<div><dt>Cliques</dt><dd class="t-num">' + B.fmt.int(a.clicks) + '</dd></div>' +
        '<div><dt>Vendas</dt><dd class="t-num">' + B.fmt.int(a.sales) + '</dd></div>' +
        '<div><dt>Comissão</dt><dd>' + money(a.commission) + '</dd></div>' +
      '</dl>' +
      '<div class="aff-aff__cta">' + cta + '</div></article>';
  }

  function affsHtml(h) {
    var list = h.affiliations || [];
    return '<section aria-labelledby="h-affs">' +
      '<div class="aff-h-row"><h2 class="aff-h" id="h-affs">Suas afiliações</h2><a class="aff-more" href="#/produtos">Ver produtos</a></div>' +
      (list.length ? '<div class="aff-grid">' + list.map(affCard).join('') + '</div>'
        : '<div class="panel aff-soft">' + emptyBlock('Nenhuma afiliação ainda', 'Você ainda não se afiliou a nenhum curso. Veja os produtos.', '<a class="btn btn--primary" href="#/produtos">Ver produtos</a>', 'afiliacoes') + '</div>') +
    '</section>';
  }

  /* ----- vendas recentes ----- */
  function recentHtml(h) {
    var list = h.recent || [];
    return '<section aria-labelledby="h-rec">' +
      '<div class="aff-h-row"><h2 class="aff-h" id="h-rec">Vendas recentes</h2>' + (list.length ? '<a class="aff-more" href="#/vendas">Ver todas</a>' : '') + '</div>' +
      (list.length ? '<ul class="aff-rs-list">' + list.map(function (r) {
        return '<li class="aff-rs">' +
          '<div class="aff-rs__main"><div class="aff-rs__course">' + E(r.course_title) + '</div>' +
            '<div class="aff-rs__sub"><span>' + E(r.buyer) + '</span><span class="t-faint">' + E(B.fmt.rel(r.at)) + '</span></div>' +
            '<div class="aff-rs__chip">' + commChip(r.commission_status, 0, r.status) + '</div></div>' +
          '<div class="aff-rs__side"><div class="aff-rs__comm' + (isVoid(r.commission_status) ? ' is-void' : '') + '">' + money(r.commission) + '</div>' +
            '<div class="aff-rs__amount">venda de ' + money(r.amount) + '</div></div></li>';
      }).join('') + '</ul>'
        : '<div class="aff-soft aff-soft--line"><p class="t-muted">Nenhuma venda ainda. Quando alguém comprar pelo seu link, ela aparece aqui.</p></div>') +
    '</section>';
  }

  /* ===============================================================
     PRODUTOS (/produtos)
     =============================================================== */
  var LINK_KINDS = [
    ['lp', 'Página de vendas', 'Use na bio, nos posts e nos comentários. Explica o curso e leva a pessoa até a compra.'],
    ['checkout', 'Checkout direto', 'Abre direto no pagamento. Ideal para stories e conversas com quem já está decidido.'],
    ['static', 'Página estática', 'Versão leve da página de vendas, que abre mais rápido. Boa para anúncios.']
  ];

  function linkRow(label, url, tip) {
    return '<div class="aff-link">' +
      '<div class="aff-link__head"><strong>' + E(label) + '</strong></div>' +
      (tip ? '<p class="aff-link__tip">' + E(tip) + '</p>' : '') +
      '<div class="aff-urlbox">' +
        '<input class="aff-urlbox__in" readonly value="' + E(url) + '" aria-label="Endereço: ' + E(label) + '" data-act="selurl">' +
        copyBtn(url, { cls: 'btn--primary', label: 'Copiar', aria: 'Copiar link: ' + label }) +
        '<a class="btn btn--icon aff-urlbox__open" href="' + E(B.safeUrl(url)) + '" target="_blank" rel="noopener" aria-label="Abrir ' + E(label) + ' em nova aba">' + ic('external') + '</a>' +
      '</div></div>';
  }
  ACT.selurl = function (t) { try { t.select(); } catch (e) {} };

  function mkSkel() {
    var one = '<div class="aff-mk__card" aria-hidden="true">' + sk(180, 'aff-skel-art') + '<div class="aff-mk__body">' + sk(22) + sk(54) + sk(44) + '</div></div>';
    return '<div class="aff-grid aff-mk">' + one + one + one + '</div>';
  }

  function viewMarket() {
    var alive = begin();
    view.innerHTML = '<div class="aff-page">' +
      pageHead('ᛟ', 'Produtos', 'Escolha o que divulgar. Cada venda pelo seu link paga uma comissão, e o link fica pronto assim que a afiliação é aprovada.') +
      '<div id="mk-body">' + mkSkel() + '</div></div>';
    api('affMarket').then(function (r) {
      if (!alive()) return;
      S.market = r.courses || [];
      paintMarket();
    }, function (e) {
      if (!alive() || quiet(e)) return;
      B.$('#mk-body').innerHTML = errBlock(e);
    });
  }

  function paintMarket() {
    var body = B.$('#mk-body');
    if (!body) return;
    if (!S.market.length) {
      body.innerHTML = '<div class="panel aff-soft">' + emptyBlock('Nenhum curso aceita afiliados agora', 'Quando o produtor abrir novos cursos para afiliação, eles aparecem aqui.', '', 'produtos') + '</div>';
      return;
    }
    body.innerHTML = '<div class="aff-grid aff-mk">' + S.market.map(mkCard).join('') + '</div>';
  }

  function mkCard(c) {
    var st = c.aff_status, cta = '';
    if (st === 'none') {
      cta = '<button type="button" class="btn btn--primary btn--block" data-act="request" data-course="' + E(c.id) + '">Quero me afiliar</button>';
    } else if (st === 'pending') {
      cta = '<button type="button" class="btn btn--block" disabled aria-disabled="true">' + ic('clock') + 'Aguardando aprovação</button>';
    } else if (st === 'approved') {
      cta = '<div class="aff-mk__row">' + chip('ok', 'check', 'Afiliado') + (c.links && c.links.lp ? copyBtn(c.links.lp, { cls: 'btn--primary', label: 'Copiar link' }) : '') + '</div>';
    } else if (st === 'rejected') {
      cta = '<div class="aff-mk__row">' + chip('bad', 'x', 'Pedido recusado') + '<button type="button" class="btn" data-act="request" data-course="' + E(c.id) + '">Tentar de novo</button></div>';
    } else if (st === 'blocked') {
      cta = '<div class="aff-mk__row">' + chip('bad', 'ban', 'Bloqueado') + '<a class="btn btn--ghost btn--sm" href="#/suporte">Falar com o suporte</a></div>';
    }
    var anchor = Number(c.anchor_price) > Number(c.price) ? '<span class="t-strike t-sm t-num aff-nw">' + E(B.fmt.money(c.anchor_price)) + '</span>' : '';
    return '<article class="aff-mk__card" data-course-card="' + E(c.id) + '">' +
      '<div class="aff-art">' + B.art(c, { title: false }) + '</div>' +
      '<div class="aff-mk__body">' +
        '<div class="aff-mk__head"><h3 class="aff-mk__title">' + E(c.title) + '</h3>' +
          '<div class="aff-mk__price">' + anchor + '<span class="t-num aff-nw">' + E(B.fmt.money(c.price)) + '</span></div></div>' +
        (c.subtitle || c.short_desc ? '<p class="aff-mk__desc t-clamp-2">' + E(c.subtitle || c.short_desc) + '</p>' : '') +
        '<div class="aff-earn">' +
          '<span class="aff-earn__lbl">Você ganha</span>' +
          '<span class="aff-earn__val">' + money(c.est_commission) + '</span>' +
          '<span class="aff-earn__per">por venda</span>' +
          '<span class="aff-earn__pct">' + E(B.fmt.pct(c.commission_pct)) + ' do valor do curso</span>' +
        '</div>' +
        '<div class="aff-mk__tags">' +
          '<span class="chip" title="Se a pessoa comprar em até ' + E(B.fmt.int(c.cookie_days)) + ' dias depois de clicar no seu link, a venda é sua.">' + ic('clock') + 'Cookie de ' + E(B.fmt.plural(c.cookie_days, 'dia', 'dias')) + '</span>' +
          (c.auto_approve ? '<span class="chip chip--mustard">' + ic('zap') + 'Aprovação automática</span>' : '') +
        '</div>' +
        '<div class="aff-mk__cta">' + cta + '</div>' +
        '<a class="aff-mk__lp" href="' + E(lpPage(c.slug)) + '" target="_blank" rel="noopener">Ver página de vendas ' + ic('external') + '</a>' +
      '</div></article>';
  }

  function refreshCard(c) {
    var old = B.$('[data-course-card="' + c.id + '"]', app);
    if (!old) return;
    var tmp = B.el('div', null, mkCard(c));
    old.replaceWith(tmp.firstElementChild);
  }

  ACT.request = function (btn) {
    if (isBusy(btn)) return;
    var id = btn.getAttribute('data-course');
    var c = (S.market || []).filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    busy(btn, true);
    api('affRequest', { course_id: id }).then(function (r) {
      c.aff_status = r.status;
      c.affiliation_id = r.affiliation_id;
      c.links = r.links || null;
      S.home = null;
      refreshCard(c);
      if (r.status === 'approved') {
        B.toast('Você já é afiliado de ' + c.title + '.', 'ok', 3800);
        showLinksModal(c);
      } else {
        B.toast('Pedido enviado. Quando o produtor aprovar, o link aparece em Links.', 'info', 5200);
      }
    }, function (e) {
      busy(btn, false);
      fail(e);
    });
  };

  function showLinksModal(c) {
    var l = c.links || {}, body = '<p class="t-muted aff-modal-lead">Seus links de ' + E(c.title) + ' estão prontos. Copie e comece a divulgar.</p><div class="stack aff-modal-links">';
    LINK_KINDS.forEach(function (k) { if (l[k[0]]) body += linkRow(k[1], l[k[0]], k[2]); });
    body += '</div>';
    B.modal({
      title: 'Afiliação aprovada',
      body: body,
      actions: [
        { label: 'Fechar' },
        { label: 'Ver em Links', kind: 'primary', icon: 'link', onClick: function () { setTimeout(function () { go('/links'); }, 0); } }
      ]
    });
  }

  /* ===============================================================
     LINKS (/links)
     =============================================================== */
  var UTM_SRC = ['instagram', 'whatsapp', 'youtube', 'tiktok', 'email'];
  var UTM_MED = ['stories', 'reels', 'bio', 'post', 'grupo'];

  function approvedAffs(h) {
    return (h.affiliations || []).filter(function (a) { return a.status === 'approved' && a.links && a.links.lp; });
  }

  function viewLinks() {
    var alive = begin();
    view.innerHTML = '<div class="aff-page">' +
      pageHead('ᛚ', 'Links', 'Copie o link certo para cada momento. Toda venda feita por eles é registrada no seu nome.') +
      '<div id="lk-body">' + sk(240) + '</div></div>';
    getHome(false).then(function (h) {
      if (alive()) paintLinks(h);
    }, function (e) {
      if (!alive() || quiet(e)) return;
      B.$('#lk-body').innerHTML = errBlock(e);
    });
  }

  function paintLinks(h) {
    var body = B.$('#lk-body');
    if (!body) return;
    var ok = approvedAffs(h), wait = (h.affiliations || []).filter(function (a) { return a.status === 'pending'; });
    S.linkAffs = ok;
    if (!ok.length) {
      body.innerHTML = '<div class="panel aff-soft">' + emptyBlock('Você ainda não tem links',
        wait.length ? 'Seu pedido está aguardando aprovação. Quando o produtor aprovar, o link aparece aqui.' : 'Peça afiliação a um curso para receber o seu link.',
        '<a class="btn btn--primary" href="#/produtos">Ver produtos</a>', 'links') + '</div>';
      return;
    }
    body.innerHTML = '<div class="aff-lk-list">' + ok.map(linkCard).join('') + '</div>' + utmPanel(ok) +
      (wait.length ? '<p class="aff-note">' + ic('clock') + '<span>' + (wait.length === 1 ? 'Um pedido aguarda aprovação' : B.fmt.int(wait.length) + ' pedidos aguardam aprovação') + '. Os links aparecem aqui assim que forem aprovados.</span></p>' : '');
    utmUpdate();
  }

  function linkCard(a) {
    var c = a.course || {}, l = a.links || {}, mat = String(a.materials || '').trim(), px = String(a.pixel_id || ''), id = E(a.id);
    var rows = LINK_KINDS.filter(function (k) { return l[k[0]]; }).map(function (k) { return linkRow(k[1], l[k[0]], k[2]); }).join('');
    var matHtml = '';
    if (mat) {
      matHtml = isUrl(mat)
        ? '<a class="btn btn--sm aff-lk__mat" href="' + E(B.safeUrl(mat)) + '" target="_blank" rel="noopener">' + ic('download') + 'Materiais de divulgação</a>'
        : '<div class="aff-lk__matxt"><strong>Materiais de divulgação</strong><p>' + B.nl2br(mat) + '</p></div>';
    }
    return '<article class="panel aff-lk" data-aff="' + id + '">' +
      '<header class="aff-lk__head">' +
        '<div class="aff-art aff-art--sm">' + B.art(c, { title: false }) + '</div>' +
        '<div class="aff-lk__ttl"><h2 class="aff-lk__h">' + E(c.title) + '</h2>' +
          '<div class="aff-lk__meta"><span class="chip chip--mustard">' + E(B.fmt.pct(a.commission_pct)) + ' de comissão</span>' +
          '<span class="aff-lk__per"><b>' + money(a.est_commission) + '</b> por venda</span></div></div>' +
        matHtml +
      '</header>' +
      '<div class="aff-lk__links">' + rows + '</div>' +
      '<form class="aff-px" data-form="pixel" data-aff="' + id + '" novalidate>' +
        '<div class="aff-px__top"><h3 class="aff-px__h">' + ic('target') + 'Seu Pixel da Meta neste produto</h3><span data-px-state>' + (px ? chip('ok', 'check', 'Pixel ativo') : '') + '</span></div>' +
        '<p class="aff-px__p">O pixel dispara na página de vendas quando o visitante chega pelo seu link. Assim você mede as vendas dos seus anúncios e cria públicos no seu Gerenciador de Anúncios.</p>' +
        '<div class="aff-px__row"><div class="field aff-px__field"><label class="sr-only" for="px-' + id + '">ID do Pixel</label>' +
          '<input class="input" id="px-' + id + '" name="pixel_id" inputmode="numeric" autocomplete="off" maxlength="24" placeholder="ID do pixel, só números" value="' + E(px) + '" aria-describedby="px-' + id + '-e"></div>' +
          '<button type="submit" class="btn">Salvar pixel</button></div>' +
        '<div class="err" id="px-' + id + '-e" role="alert" hidden></div>' +
      '</form></article>';
  }

  FORM.pixel = function (f) {
    var btn = B.$('[type="submit"]', f);
    if (isBusy(btn)) return;
    var inp = B.$('[name="pixel_id"]', f), er = B.$('.err', f), id = f.getAttribute('data-aff');
    er.hidden = true; inp.classList.remove('is-invalid'); inp.removeAttribute('aria-invalid');
    var raw = String(inp.value || '').trim(), px = raw.replace(/\D/g, '');
    if (raw && (px.length < 10 || px.length > 20)) {
      inp.classList.add('is-invalid'); inp.setAttribute('aria-invalid', 'true');
      er.textContent = 'O ID do Pixel tem entre 10 e 20 números. Copie do Gerenciador de Eventos da Meta.'; er.hidden = false;
      inp.focus();
      return;
    }
    busy(btn, true);
    api('affPixel', { affiliation_id: id, pixel_id: px }).then(function (r) {
      busy(btn, false);
      inp.value = r.pixel_id || '';
      var a = (S.linkAffs || []).filter(function (x) { return x.id === id; })[0];
      if (a) a.pixel_id = r.pixel_id || '';
      B.$('[data-px-state]', f).innerHTML = r.pixel_id ? chip('ok', 'check', 'Pixel ativo') : '';
      B.toast(r.pixel_id ? 'Pixel salvo. Ele dispara nas visitas que chegam pelo seu link.' : 'Pixel removido deste produto.', 'ok', 3600);
    }, function (e) {
      busy(btn, false);
      fail(e);
    });
  };

  /* ----- gerador de UTM ----- */
  function utmClean(v) { return String(v || '').trim().toLowerCase().replace(/\s+/g, '-').slice(0, 80); }

  function utmField(name, label, ph, picks) {
    return '<div class="field"><label for="utm-' + name + '">' + label + '</label>' +
      '<input class="input" id="utm-' + name + '" name="utm_' + name + '" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="80" placeholder="' + E(ph) + '">' +
      (picks ? '<div class="aff-picks" role="group" aria-label="Sugestões para ' + E(label.toLowerCase()) + '">' + picks.map(function (p) {
        return '<button type="button" class="aff-pick" data-act="utm-pick" data-field="utm_' + name + '" data-value="' + p + '">' + p + '</button>';
      }).join('') + '</div>' : '') + '</div>';
  }

  function kindOptions(a, cur) {
    var l = (a && a.links) || {};
    return LINK_KINDS.filter(function (k) { return l[k[0]]; }).map(function (k) {
      return '<option value="' + k[0] + '"' + (k[0] === cur ? ' selected' : '') + '>' + k[1] + '</option>';
    }).join('');
  }

  function utmPanel(ok) {
    var multi = ok.length > 1;
    return '<section class="panel hud aff-utm" aria-labelledby="h-utm" data-live="utm">' +
      '<div class="panel__head"><h2 class="panel__title" id="h-utm">Gerador de UTM</h2></div>' +
      '<p class="t-muted aff-utm__lead">Marque de onde cada clique veio (stories, bio, grupo) e descubra o que mais vende. Seu código de afiliado continua no link.</p>' +
      '<div class="aff-utm__grid">' +
        (multi
          ? '<div class="field"><label for="utm-prod">Produto</label><select class="select" id="utm-prod" name="prod">' + ok.map(function (a) { return '<option value="' + E(a.id) + '">' + E(a.course.title) + '</option>'; }).join('') + '</select></div>'
          : '<input type="hidden" name="prod" value="' + E(ok[0].id) + '">') +
        '<div class="field"><label for="utm-kind">Link de origem</label><select class="select" id="utm-kind" name="kind">' + kindOptions(ok[0], 'lp') + '</select></div>' +
        utmField('source', 'Origem', 'instagram', UTM_SRC) +
        utmField('medium', 'Mídia', 'stories', UTM_MED) +
        utmField('campaign', 'Campanha', 'lancamento-outubro') +
        utmField('content', 'Conteúdo', 'video-1') +
      '</div>' +
      '<div class="aff-utm__out"><label class="label" for="utm-out">Seu link com UTM</label>' +
        '<div class="aff-urlbox"><input class="aff-urlbox__in" id="utm-out" readonly data-act="selurl" aria-describedby="utm-hint">' +
          copyBtn('', { cls: 'btn--primary', label: 'Copiar', aria: 'Copiar link com UTM' }) +
          '<a class="btn btn--icon aff-urlbox__open" id="utm-open" href="#" target="_blank" rel="noopener" aria-label="Abrir link com UTM em nova aba">' + ic('external') + '</a></div>' +
        '<p class="hint" id="utm-hint"></p></div>' +
    '</section>';
  }

  function utmUpdate() {
    var root = B.$('.aff-utm', view);
    if (!root) return;
    var prod = B.$('[name="prod"]', root).value;
    var a = (S.linkAffs || []).filter(function (x) { return x.id === prod; })[0];
    if (!a) return;
    var kind = B.$('[name="kind"]', root).value || 'lp';
    var base = a.links[kind] || a.links.lp, url = base, filled = 0, hasRef = false;
    try {
      var u = new URL(base, location.href);
      ['source', 'medium', 'campaign', 'content'].forEach(function (k) {
        var inp = B.$('[name="utm_' + k + '"]', root), v = utmClean(inp.value);
        if (v) { u.searchParams.set('utm_' + k, v); filled++; } else u.searchParams.delete('utm_' + k);
        B.$$('.aff-pick[data-field="utm_' + k + '"]', root).forEach(function (p) {
          var on = v !== '' && p.getAttribute('data-value') === v;
          p.classList.toggle('is-active', on); p.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
      url = u.toString();
      hasRef = !!u.searchParams.get('ref');
    } catch (e) { url = base; }
    B.$('#utm-out', root).value = url;
    B.$('[data-act="copy"]', root).setAttribute('data-copy', url);
    B.$('#utm-open', root).setAttribute('href', B.safeUrl(url));
    B.$('#utm-hint', root).textContent = !filled
      ? 'Preencha pelo menos a origem para marcar o link. Sem isso, ele é igual ao link de origem.'
      : (hasRef ? 'Pronto. Seu código de afiliado (ref) continua no link.' : 'Pronto para copiar.');
  }

  LIVE.utm = function (t, root) {
    if (t && t.name === 'prod') {
      var a = (S.linkAffs || []).filter(function (x) { return x.id === t.value; })[0], sel = B.$('[name="kind"]', root);
      sel.innerHTML = kindOptions(a, sel.value);
    }
    utmUpdate();
  };
  ACT['utm-pick'] = function (b) {
    var inp = B.$('[name="' + b.getAttribute('data-field') + '"]', view);
    if (!inp) return;
    inp.value = inp.value === b.getAttribute('data-value') ? '' : b.getAttribute('data-value');
    utmUpdate();
  };

  /* ===============================================================
     VENDAS (/vendas)
     =============================================================== */
  var PERIODS = [[7, '7 dias'], [30, '30 dias'], [90, '90 dias'], [0, 'Tudo']];

  function periodSeg() {
    return '<div class="seg aff-seg" role="group" aria-label="Período">' + PERIODS.map(function (p) {
      var on = p[0] === S.sf.period;
      return '<button type="button" data-act="sf-period" data-v="' + p[0] + '" class="' + (on ? 'is-active' : '') + '" aria-pressed="' + on + '">' + p[1] + '</button>';
    }).join('') + '</div>';
  }

  function salesSkel() {
    return '<div class="aff-skel" aria-hidden="true"><div class="aff-skel__row">' + sk(86) + sk(86) + sk(86) + '</div>' + sk(300) + '</div>';
  }

  function viewSales() {
    var alive = begin(), f = S.sf;
    f.shown = 50;
    view.innerHTML = '<div class="aff-page">' +
      pageHead('ᚱ', 'Vendas', 'Cada venda feita pelo seu link e o status da comissão.') +
      '<div class="aff-filters">' + periodSeg() +
        '<div class="field aff-filters__course"><label class="sr-only" for="sf-course">Curso</label>' +
        '<select class="select" id="sf-course" data-live="sf-course"><option value="">Todos os cursos</option></select></div>' +
      '</div><div id="sl-body" aria-live="polite">' + salesSkel() + '</div></div>';
    getHome(false).then(function (h) {
      var sel = alive() && B.$('#sf-course');
      if (!sel) return;
      (h.affiliations || []).forEach(function (a) { sel.appendChild(B.el('option', { value: a.course.id }, E(a.course.title))); });
      sel.value = f.course;
    }, function () {});
    loadSales(alive, true);
  }

  function loadSales(alive, skel) {
    var f = S.sf, req = ++f.req, body = B.$('#sl-body'), p = {};
    if (f.period) p.from = Date.now() - f.period * 864e5;
    if (f.course) p.course_id = f.course;
    if (body && !skel) body.classList.add('is-busy');
    return api('affSales', p).then(function (r) {
      if (!alive() || req !== f.req) return;
      f.data = r;
      paintSales();
    }, function (e) {
      if (!alive() || req !== f.req) return;
      body = B.$('#sl-body');
      if (body) body.classList.remove('is-busy');
      if (quiet(e)) return;
      if (skel && body) body.innerHTML = errBlock(e); else B.fail(e);
    });
  }

  ACT['sf-period'] = function (t) {
    var v = Number(t.getAttribute('data-v')) || 0;
    if (v === S.sf.period) return;
    S.sf.period = v; S.sf.shown = 50;
    B.$$('[data-act="sf-period"]', view).forEach(function (b) {
      var on = (Number(b.getAttribute('data-v')) || 0) === v;
      b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    loadSales(curAlive(), false);
  };
  LIVE['sf-course'] = function (t) {
    S.sf.course = t.value; S.sf.shown = 50;
    loadSales(curAlive(), false);
  };
  ACT['sf-more'] = function () {
    S.sf.shown += 50;
    paintSales();
  };

  function orderNote(s) {
    return s.status === 'refunded' ? 'Compra reembolsada' : s.status === 'chargeback' ? 'Compra contestada' : '';
  }

  function totalsHtml(t) {
    return '<section class="aff-tot" aria-label="Totais do filtro">' +
      '<div class="kpi aff-kpi"><div class="kpi__label aff-kpi__lbl">' + ic('cart') + 'Vendas</div><div class="kpi__value aff-kpi__val">' + B.fmt.int(t.count) + '</div></div>' +
      '<div class="kpi aff-kpi"><div class="kpi__label aff-kpi__lbl">' + ic('chart') + 'Faturamento gerado</div><div class="kpi__value aff-kpi__val is-long">' + money(t.revenue) + '</div></div>' +
      '<div class="kpi aff-kpi aff-kpi--hot"><div class="kpi__label aff-kpi__lbl">' + ic('money') + 'Comissão</div><div class="kpi__value aff-kpi__val">' + money(t.commission) + '</div></div>' +
    '</section>';
  }

  function saleRow(s) {
    var note = orderNote(s);
    return '<tr>' +
      '<td class="aff-nw">' + E(B.fmt.date(s.at)) + '<div class="t-faint t-xs">' + E(B.fmt.time(s.at)) + '</div></td>' +
      '<td class="aff-tbl__course">' + E(s.course_title) + (note ? '<div class="aff-sl__note">' + E(note) + '</div>' : '') + '</td>' +
      '<td>' + E(s.buyer) + '<div class="t-faint t-xs">' + E(s.buyer_email) + '</div></td>' +
      '<td class="num">' + money(s.amount) + '</td>' +
      '<td class="num"><strong class="' + (isVoid(s.commission_status) ? 'aff-void' : '') + '">' + money(s.commission) + '</strong></td>' +
      '<td>' + commChip(s.commission_status, s.release_at, s.status) + '</td></tr>';
  }

  function saleCard(s) {
    var note = orderNote(s);
    return '<li class="aff-sl__item">' +
      '<div class="aff-sl__top"><span class="aff-sl__course">' + E(s.course_title) + '</span><span class="aff-sl__comm' + (isVoid(s.commission_status) ? ' is-void' : '') + '">' + money(s.commission) + '</span></div>' +
      '<div class="aff-sl__mid"><span>' + E(s.buyer) + '</span><span class="t-faint">' + E(B.fmt.date(s.at)) + ' às ' + E(B.fmt.time(s.at)) + '</span></div>' +
      '<div class="aff-sl__bot">' + commChip(s.commission_status, s.release_at, s.status) +
        '<span class="t-muted t-sm">venda de ' + money(s.amount) + '</span></div>' +
      (note ? '<div class="aff-sl__note">' + E(note) + '</div>' : '') + '</li>';
  }

  function payoutsHtml(list) {
    return '<section aria-labelledby="h-pay"><div class="aff-h-row"><h2 class="aff-h" id="h-pay">Pagamentos recebidos</h2></div>' +
      (list.length ? '<ul class="aff-pays">' + list.map(function (p) {
        return '<li class="aff-pay"><span class="aff-ico aff-ico--ok">' + ic('pix') + '</span>' +
          '<div class="aff-pay__main"><strong>' + money(p.amount) + '</strong>' +
          '<span class="t-faint t-sm">' + E(B.fmt.plural(p.count, 'comissão paga', 'comissões pagas')) + (p.note ? ' · ' + E(p.note) : '') + '</span></div>' +
          '<span class="aff-pay__date t-sm t-muted">' + E(B.fmt.date(p.at)) + '</span></li>';
      }).join('') + '</ul>'
        : '<div class="aff-soft aff-soft--line"><p class="t-muted">Nenhum pagamento recebido ainda. Quando houver saldo disponível, o produtor paga via Pix e o registro fica aqui.</p></div>') +
    '</section>';
  }

  function paintSales() {
    var body = B.$('#sl-body'), r = S.sf.data;
    if (!body || !r) return;
    body.classList.remove('is-busy');
    var rows = r.sales || [], t = r.totals || {}, shown = rows.slice(0, S.sf.shown);
    var odd = rows.some(function (x) { return x.status !== 'approved'; });
    var list;
    if (!rows.length) {
      list = '<div class="panel aff-soft">' + emptyBlock('Nenhuma venda neste filtro',
        S.sf.period || S.sf.course ? 'Tente um período maior ou outro curso. Também vale divulgar mais o seu link.' : 'Quando alguém comprar pelo seu link, a venda aparece aqui.',
        '<a class="btn btn--primary" href="#/links">Copiar meus links</a>', 'vendas') + '</div>';
    } else {
      list = '<div class="table-wrap aff-tbl hide-sm"><table class="table"><caption class="sr-only">Vendas feitas pelo seu link</caption>' +
        '<thead><tr><th scope="col">Data</th><th scope="col">Curso</th><th scope="col">Comprador</th><th scope="col" class="num">Valor</th><th scope="col" class="num">Comissão</th><th scope="col">Status da comissão</th></tr></thead>' +
        '<tbody>' + shown.map(saleRow).join('') + '</tbody></table></div>' +
        '<ul class="aff-sl show-sm">' + shown.map(saleCard).join('') + '</ul>' +
        (rows.length > shown.length
          ? '<div class="aff-more-row"><span class="t-muted t-sm">Mostrando ' + B.fmt.int(shown.length) + ' de ' + B.fmt.int(rows.length) + ' vendas.</span><button type="button" class="btn" data-act="sf-more">Mostrar mais vendas</button></div>' : '') +
        (odd ? '<p class="aff-note">' + ic('info') + '<span>Compras reembolsadas ou contestadas aparecem na lista, mas não entram nos totais.</span></p>' : '');
    }
    body.innerHTML = totalsHtml(t) + list + payoutsHtml(r.payouts || []);
  }

  /* ===============================================================
     SUPORTE (/suporte)
     =============================================================== */
  var CH = { req: 0, msgs: [], sig: '', timer: 0 };
  var CHAT_IDEAS = [
    'Como recebo minha comissão?',
    'Posso usar os materiais nos meus anúncios?',
    'Meu link não está registrando cliques.'
  ];

  function dayLabel(ts) {
    var k = dayKey(ts);
    if (k === dayKey(Date.now())) return 'Hoje';
    if (k === dayKey(Date.now() - 864e5)) return 'Ontem';
    return B.fmt.dateShort(ts);
  }

  function chatHtml(msgs) {
    if (!msgs.length) {
      return '<div class="aff-chat__empty">' + B.sigil('suporte') +
        '<p class="aff-chat__etitle">Dúvida sobre link, comissão ou material? Escreva aqui.</p>' +
        '<p class="t-muted t-sm">O produtor responde por esta conversa. Quando houver resposta, o Suporte ganha um ponto de aviso no menu.</p>' +
        '<div class="aff-picks aff-picks--ideas">' + CHAT_IDEAS.map(function (t) {
          return '<button type="button" class="aff-pick" data-act="chat-idea" data-text="' + E(t) + '">' + E(t) + '</button>';
        }).join('') + '</div></div>';
    }
    var out = '', last = '';
    msgs.forEach(function (m) {
      var k = dayKey(m.ts);
      if (k !== last) { out += '<div class="aff-day"><span>' + E(dayLabel(m.ts)) + '</span></div>'; last = k; }
      var me = m.from === 'me';
      out += '<div class="aff-msg ' + (me ? 'is-me' : 'is-them') + '"><div class="aff-msg__b">' + B.nl2br(m.text) + '</div>' +
        '<div class="aff-msg__t">' + (me ? '' : 'Produtor, ') + E(B.fmt.time(m.ts)) + '</div></div>';
    });
    return out;
  }

  function paintChat(stick) {
    var list = B.$('#chat-list');
    if (!list) return;
    var near = list.scrollHeight - list.scrollTop - list.clientHeight < 90, top = list.scrollTop;
    list.innerHTML = chatHtml(CH.msgs);
    list.classList.toggle('is-empty', !CH.msgs.length);
    if (stick || near) list.scrollTop = list.scrollHeight; else list.scrollTop = top;
  }

  function chatSig(msgs) { var l = msgs[msgs.length - 1]; return msgs.length + ':' + (l ? l.id : ''); }

  function pollChat(alive, first) {
    var req = ++CH.req;
    return api('chat').then(function (r) {
      if (!alive() || req !== CH.req) return;
      var msgs = r.messages || [], sig = chatSig(msgs);
      if (first || sig !== CH.sig) { CH.msgs = msgs; CH.sig = sig; paintChat(first); }
      setDot(false);
    }, function (e) {
      if (!alive() || quiet(e)) return;
      if (first) { var l = B.$('#chat-list'); if (l) l.innerHTML = errBlock(e); }
    });
  }

  function viewSupport() {
    var alive = begin();
    setDot(false);
    CH.msgs = []; CH.sig = '';
    view.innerHTML = '<div class="aff-page aff-page--chat">' +
      '<header class="aff-head aff-head--chat"><h1 class="t-1 aff-head__h"><span class="aff-rune t-rune" aria-hidden="true">ᚹ</span>Suporte</h1>' +
      '<p class="t-muted aff-head__lead2">Fale direto com o produtor.</p></header>' +
      '<section class="aff-chat" aria-label="Conversa com o produtor">' +
        '<div class="aff-chat__bar"><span class="aff-chat__av">' + B.sigil('produtor') + '</span><div><strong>Produtor</strong><span class="t-xs t-faint">Responde por aqui</span></div></div>' +
        '<div class="aff-chat__list" id="chat-list" role="log" aria-live="polite" aria-label="Mensagens" tabindex="0">' + '<div class="aff-chat__load" aria-hidden="true">' + sk(46) + sk(46) + '</div>' + '</div>' +
        '<form class="aff-chat__form" data-form="chat" novalidate>' +
          '<label class="sr-only" for="chat-in">Sua mensagem</label>' +
          '<textarea class="textarea aff-chat__in" id="chat-in" name="text" rows="1" maxlength="2000" placeholder="Escreva sua mensagem" data-enter-send data-live="chat-in"></textarea>' +
          '<button type="submit" class="btn btn--primary btn--icon aff-chat__send" aria-label="Enviar mensagem">' + ic('send') + '</button>' +
        '</form>' +
        '<p class="aff-chat__tip hide-sm">Enter envia. Shift + Enter quebra a linha.</p>' +
      '</section></div>';
    pollChat(alive, true);
    CH.timer = setInterval(function () {
      if (document.hidden || !alive()) return;
      var btn = B.$('.aff-chat__send');
      if (isBusy(btn)) return;
      pollChat(alive, false);
    }, 8000);
    S.leave = function () { clearInterval(CH.timer); CH.timer = 0; CH.req++; };
  }

  LIVE['chat-in'] = function (t) {
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight + 2, 140) + 'px';
  };

  ACT['chat-idea'] = function (b) {
    var ta = B.$('#chat-in');
    if (!ta) return;
    ta.value = b.getAttribute('data-text');
    LIVE['chat-in'](ta);
    ta.focus();
  };

  FORM.chat = function (f) {
    if (!f) return;
    var ta = B.$('textarea', f), btn = B.$('[type="submit"]', f), text = String(ta.value || '').trim();
    if (!text || isBusy(btn)) return;
    busy(btn, true);
    CH.req++;                       // consultas em andamento ficam obsoletas
    var alive = curAlive();
    api('chatSend', { text: text }).then(function (r) {
      busy(btn, false);
      if (!alive()) return;
      CH.req++;
      if (r.message && !CH.msgs.some(function (m) { return m.id === r.message.id; })) CH.msgs.push(r.message);
      CH.sig = chatSig(CH.msgs);
      ta.value = ''; ta.style.height = '';
      paintChat(true);
      if (!('ontouchstart' in window)) ta.focus();
    }, function (e) {
      busy(btn, false);
      fail(e);
    });
  };

  /* ===============================================================
     PERFIL (/perfil)
     =============================================================== */
  function viewProfile() {
    var alive = begin();
    view.innerHTML = '<div class="aff-page">' +
      pageHead('ᛉ', 'Perfil', 'Seus dados e a chave Pix onde você recebe as comissões.') +
      '<div id="pf-body">' + sk(320) + '</div></div>';
    B.api('bootstrap').then(function (r) { return r.user || S.user; }, function () { return S.user; }).then(function (u) {
      if (!alive()) return;
      S.user = Object.assign({}, S.user, u);
      B.session.setUser(S.user);
      paintProfile();
    });
  }

  function paintProfile() {
    var body = B.$('#pf-body'), u = S.user || {};
    if (!body) return;
    body.innerHTML = '<div class="aff-prof">' +
      '<section class="panel hud aff-id" aria-label="Sua conta">' +
        '<div class="aff-id__who">' + B.avatar(u, 72) +
          '<div class="min0"><h2 class="aff-id__name">' + E(u.name) + '</h2><p class="aff-id__mail ellipsis">' + E(u.email) + '</p>' +
          '<p class="t-faint t-xs">Afiliado desde ' + E(B.fmt.date(u.created_at)) + '</p></div></div>' +
        '<div class="aff-codebig"><span class="aff-codebig__lbl">Seu código de afiliado</span>' +
          '<div class="aff-codebig__row"><span class="aff-codebig__v" aria-label="Código ' + E(u.aff_code) + '">' + E(u.aff_code) + '</span>' +
          copyBtn(u.aff_code, { cls: 'btn--primary', label: 'Copiar código', aria: 'Copiar código de afiliado' }) + '</div>' +
          '<p class="hint">Ele vai em todos os seus links (ref=' + E(u.aff_code) + '). Quem comprar por eles conta para você. Seu nome no ranking: <strong>' + E(maskName(u.name)) + '</strong></p></div>' +
      '</section>' +
      '<section class="panel aff-pf" aria-labelledby="h-pf">' +
        '<h2 class="panel__title" id="h-pf">Onde você recebe</h2>' +
        '<form class="stack aff-form" data-form="settings" novalidate>' +
          field({ name: 'pix_key', label: 'Chave Pix', ac: 'off', ph: 'CPF, e-mail, celular ou chave aleatória', value: u.pix_key, hint: 'As comissões liberadas são pagas nesta chave. Confira se está certa antes de pedir pagamento.', max: 120, extra: ' autocapitalize="none" spellcheck="false"' }) +
          field({ name: 'instagram', label: 'Instagram', opt: true, ac: 'off', ph: 'seuperfil', addon: '@', value: u.instagram, max: 80, extra: ' autocapitalize="none" spellcheck="false"' }) +
          '<div class="err aff-formerr" data-formerr role="alert" hidden></div>' +
          '<button type="submit" class="btn btn--primary btn--block aff-pf__save">Salvar dados</button>' +
        '</form>' +
      '</section>' +
      '<div class="aff-prof__out"><button type="button" class="btn btn--danger" data-act="logout">' + ic('logout') + 'Sair da conta</button></div>' +
    '</div>';
  }

  FORM.settings = function (f) {
    var btn = B.$('[type="submit"]', f);
    if (isBusy(btn)) return;
    clearErrs(f);
    var d = B.formData(f), pix = String(d.pix_key || '').trim();
    if (pix.length < 5) return fieldErr(f, 'pix_key', 'Informe sua chave Pix. É por ela que você recebe as comissões.');
    busy(btn, true);
    api('affSettings', { pix_key: pix, instagram: cleanIg(d.instagram) }).then(function (r) {
      busy(btn, false);
      var p = r.profile || {};
      S.user = Object.assign({}, S.user, { pix_key: p.pix_key, instagram: p.instagram });
      B.session.setUser(S.user);
      S.home = null;
      B.$('[name="pix_key"]', f).value = p.pix_key || '';
      B.$('[name="instagram"]', f).value = p.instagram || '';
      B.toast('Dados salvos. Chave Pix atualizada.', 'ok', 3200);
    }, function (e) {
      busy(btn, false);
      if (!quiet(e)) formErr(f, e.message);
    });
  };

  /* ===============================================================
     INICIALIZAÇÃO
     =============================================================== */
  function start() {
    return B.ensureDemoLogin().then(B.loadBrand).then(function (boot) {
      if (boot && boot.user) return boot;
      if (B.session.token()) {      // sessão antiga ou inválida: limpa e tenta de novo (na demo entra sozinho)
        B.session.clear();
        return B.ensureDemoLogin().then(B.loadBrand);
      }
      return boot;
    });
  }

  B.boot(function () {
    app = B.$('#app');
    bindGlobal();
    registerRoutes();
    B.demoBar('aff');
    B.listen('auth:expired', function () {
      if (S.mode === 'app' || S.mode === 'activate') doLogout('Sua sessão expirou. Entre de novo.');
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) checkUnread(); });
    return start().then(function (boot) {
      var u = boot && boot.user;
      if (!u) { showAuth('', 'login'); return; }
      B.session.setUser(u);
      afterLogin(u);
    });
  });
})();

/* =====================================================================
   BRASA · admin.js — painel do produtor (ADM)
   Casca (menu, login), roteamento e todas as páginas do painel.
   Depende de core.js (objeto B). Sem bibliotecas, sem build.
   ===================================================================== */
(function () {
  'use strict';
  B.session.use('admin');

  var DAY = 864e5;
  var $ = B.$, $$ = B.$$;
  var app = null;

  /* ---------------------------------------------------------------
     Gabarito seguro. Tudo que entra em ${...} passa por B.esc, exceto
     o que já é HTML nosso (Safe: vindo de H`` ou raw()). Assim nenhum
     texto da API chega ao innerHTML sem escape.
     --------------------------------------------------------------- */
  function Safe(s) { this.s = s; }
  Safe.prototype.toString = function () { return this.s; };
  function raw(s) { return new Safe(s == null ? '' : String(s)); }
  function part(v) {
    if (v == null || v === false || v === true) return '';
    if (v instanceof Safe) return v.s;
    if (Array.isArray(v)) { var o = ''; for (var i = 0; i < v.length; i++) o += part(v[i]); return o; }
    return B.esc(v);
  }
  function H(s) {
    var o = s[0];
    for (var i = 1; i < arguments.length; i++) o += part(arguments[i]) + s[i];
    return new Safe(o);
  }
  function ic(n, c) { return raw(B.icon(n, c)); }
  var uidn = 0;
  function uid(p) { return (p || 'f') + (++uidn); }

  /* ---------------------------------------------------------------
     utilidades
     --------------------------------------------------------------- */
  function money(v) { return B.fmt.money(v); }
  function moneyK(v) { v = Number(v) || 0; return Math.abs(v) >= 1e6 ? B.fmt.moneyShort(v) : B.fmt.money(v); }
  function int(v) { return B.fmt.int(v); }
  function num2(v) { return (Math.round((Number(v) || 0) * 100) / 100).toFixed(2).replace('.', ','); }
  function round2(v) { return Math.round((Number(v) || 0) * 100) / 100; }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
  function trunc(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  function dayStart(ts) { return B.dateFromInput(B.dateInput(ts)); }
  function dayEnd(ts) { return B.dateFromInput(B.dateInput(ts), true); }
  function plural(n, a, b) { return B.fmt.plural(n, a, b); }
  function pageEl() { return $('#adm-page'); }
  function setTitle(t) { document.title = (t ? t + ' · ' : '') + (B.brand && B.brand.name ? B.brand.name : 'BRASA') + ' ADM'; }
  function waLink(phone, text) {
    var d = String(phone || '').replace(/\D/g, '');
    if (!d) return '';
    if (!/^55\d{10,11}$/.test(d)) d = '55' + d;
    return 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function siteLink(slug, extra) { return B.siteUrl() + 'lp.html?c=' + encodeURIComponent(slug) + (extra || ''); }
  function pageLink(slug, extra) { return B.base + 'lp.html?c=' + encodeURIComponent(slug) + (extra || ''); }
  function busy(btn, p) {
    if (btn) btn.classList.add('is-loading');
    var done = function () { if (btn) btn.classList.remove('is-loading'); };
    p.then(done, done);
    return p;
  }
  function getPath(o, path) { return String(path).split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setPath(o, path, v) {
    var ks = String(path).split('.'), cur = o;
    for (var i = 0; i < ks.length - 1; i++) { if (cur[ks[i]] == null || typeof cur[ks[i]] !== 'object') cur[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; cur = cur[ks[i]]; }
    cur[ks[ks.length - 1]] = v;
  }
  function onlyDigits(s) { return String(s || '').replace(/\D/g, ''); }
  function delta(cur, prev) {
    if (prev == null || isNaN(prev)) return null;
    if (!prev && !cur) return { t: '—', c: 'flat' };
    if (!prev) return { t: 'novo', c: 'up' };
    var p = (cur - prev) / Math.abs(prev) * 100;
    if (Math.abs(p) < 0.5) return { t: '0%', c: 'flat' };
    return { t: (p > 0 ? '▲ ' : '▼ ') + B.fmt.pct(Math.abs(p), Math.abs(p) < 10 ? 1 : 0), c: p > 0 ? 'up' : 'down' };
  }

  /* ---------------------------------------------------------------
     estado global
     --------------------------------------------------------------- */
  var S = {
    user: null, nav: 0, teardown: null, guard: null, acts: {}, on: {},
    counts: { aff: 0, msg: 0, crm: 0 }, countsAt: 0, cache: {}, routerStarted: false, lastHash: '', autoGen: ''
  };

  function cached(key, ttl, fetcher, force) {
    var c = S.cache[key];
    if (!force && c && Date.now() - c.at < ttl) return Promise.resolve(c.v);
    return fetcher().then(function (v) { S.cache[key] = { at: Date.now(), v: v }; return v; });
  }
  function getCourses(force) { return cached('courses', 30000, function () { return B.api('adminCourses').then(function (r) { return r.courses; }); }, force); }
  function getAffiliates(force) { return cached('affs', 30000, function () { return B.api('adminAffiliates'); }, force); }
  function getSellers(force) { return cached('sellers', 30000, function () { return B.api('adminSellers'); }, force); }
  function drop() { for (var i = 0; i < arguments.length; i++) delete S.cache[arguments[i]]; }

  /* ganchos para o admin-plus.js (novidades da versão 2): se o arquivo não carregar, o painel segue funcionando */
  function plus(name) {
    var f = window.ADM && window.ADM.hooks && window.ADM.hooks[name];
    return f ? f.apply(null, Array.prototype.slice.call(arguments, 1)) : undefined;
  }
  function plusHtml(name) { var r = plus.apply(null, arguments); return raw(r == null ? '' : r); }
  function plusPage(name) {
    return function (ctx) {
      var f = window.ADM && window.ADM.pages && window.ADM.pages[name];
      if (f) { f(ctx); return; }
      setTitle('Página indisponível');
      pageEl().innerHTML = String(H`${pgHead('Página indisponível')}<div class="panel">${emptyState('Não foi possível abrir esta página', 'Um arquivo do painel não carregou. Recarregue a página e tente de novo.', H`<button class="btn btn--primary" type="button" onclick="location.reload()">${ic('refresh')}Recarregar</button>`, 'alert')}</div>`);
    };
  }
  function waOpen(kind, id, btn, initial) { if (window.ADM && window.ADM.wa) window.ADM.wa(kind, id, btn, { initial: initial || '' }); }

  /* ---------------------------------------------------------------
     peças de interface reutilizáveis
     --------------------------------------------------------------- */
  var ORDER_ST = {
    approved: ['Aprovado', 'ok'], pending: ['Pendente', 'warn'], rejected: ['Recusado', 'bad'], expired: ['Expirado', ''],
    refunded: ['Reembolsado', 'info'], chargeback: ['Chargeback', 'bad'], failed: ['Falhou', 'bad']
  };
  var COURSE_ST = { draft: ['Rascunho', ''], published: ['Publicado', 'ok'], coming_soon: ['Em breve', 'mustard'], archived: ['Arquivado', ''] };
  var AFF_ST = { approved: ['Aprovado', 'ok'], pending: ['Pendente', 'warn'], rejected: ['Recusado', 'bad'], blocked: ['Bloqueado', 'bad'] };
  var ENR_ST = { active: ['Ativa', 'ok'], expired: ['Expirada', ''], revoked: ['Revogada', 'bad'], refunded: ['Reembolsada', 'info'] };
  var METHOD = { pix: 'Pix', card: 'Cartão', boleto: 'Boleto', free: 'Gratuito' };

  function chip(text, tone, icon) {
    return H`<span class="chip${tone ? ' chip--' + tone : ''}">${icon ? ic(icon) : ''}${text}</span>`;
  }
  function stChip(map, st) { var x = map[st] || [st || '—', '']; return chip(x[0], x[1]); }
  function orderChip(st) { return stChip(ORDER_ST, st); }
  function lpChip(st) {
    if (st === 'reviewed') return chip('Revisada', 'ok', 'check');
    if (st === 'generated') return chip('Gerada por IA', 'mustard', 'sparkles');
    return chip('Modelo automático', '');
  }
  function skel(h, w, extra) { return H`<div class="skel ${extra || ''}" style="height:${h}px;${w ? 'width:' + w + ';' : ''}"></div>`; }
  function emptyState(title, text, actions, icon) {
    return H`<div class="empty">${icon ? ic(icon) : raw(B.sigil('vazio-' + title))}<div class="empty__title">${title}</div><p class="t-muted">${text}</p>${actions ? H`<div class="row" style="justify-content:center">${actions}</div>` : ''}</div>`;
  }
  function errorState(e, retryAct) {
    return H`<div class="panel">${emptyState('Não foi possível carregar', (e && e.message) || 'Tente de novo em instantes.', retryAct ? H`<button class="btn" type="button" data-act="${retryAct}">${ic('refresh')}Tentar de novo</button>` : '', 'alert')}</div>`;
  }
  function pgHead(title, sub, actions, back) {
    return H`<header class="pg-head"><div class="pg-head__title">${back ? H`<a class="pg-back" href="#${back[0]}">${ic('left')}${back[1]}</a>` : ''}<h1 class="t-2">${title}</h1>${sub ? H`<p class="t-muted t-sm">${sub}</p>` : ''}</div>${actions ? H`<div class="pg-head__actions">${actions}</div>` : ''}</header>`;
  }
  function panelHead(title, right, sub) {
    return H`<div class="panel__head"><div class="min0"><h2 class="panel__title">${title}</h2>${sub ? H`<p class="t-faint t-xs">${sub}</p>` : ''}</div>${right ? H`<div class="row" style="--gap:8px">${right}</div>` : ''}</div>`;
  }
  function copyBtn(text, label) {
    return H`<button type="button" class="iconbtn iconbtn--sm" data-copy="${text}" aria-label="${label || 'Copiar'}" title="${label || 'Copiar'}">${ic('copy')}</button>`;
  }

  /* campos de formulário. f = data-f (rascunho), n = name (modais) */
  function fld(o) {
    var id = o.id || uid(), t = o.t || 'text', at = o.lp ? 'data-lp="' + o.lp + '"' : o.f ? 'data-f="' + o.f + '"' : (o.n ? 'name="' + o.n + '"' : '');
    var ctl;
    if (t === 'textarea') {
      ctl = H`<textarea class="textarea" id="${id}" ${raw(at)} rows="${o.rows || 4}" placeholder="${o.ph || ''}" ${raw(o.attrs || '')}>${raw('\n')}${o.v == null ? '' : o.v}</textarea>`;
    } else if (t === 'select') {
      ctl = H`<select class="select" id="${id}" ${raw(at)} ${raw(o.attrs || '')}>${o.opts.map(function (op) { return H`<option value="${op[0]}"${raw(String(op[0]) === String(o.v) ? ' selected' : '')}>${op[1]}</option>`; })}</select>`;
    } else {
      var inp = H`<input class="input" id="${id}" ${raw(at)} type="${t}" value="${o.v == null ? '' : o.v}" placeholder="${o.ph || ''}" ${raw(o.attrs || '')}>`;
      ctl = (o.pre || o.post)
        ? H`<div class="input-group">${o.pre ? H`<span class="addon">${o.pre}</span>` : ''}${inp}${o.post ? H`<span class="addon addon--end">${o.post}</span>` : ''}</div>`
        : inp;
    }
    return H`<div class="field${o.cls ? ' ' + o.cls : ''}"><label for="${id}">${o.l}${o.req ? H` <span class="req">*</span>` : ''}</label>${ctl}${o.hint ? H`<div class="hint">${o.hint}</div>` : ''}<div class="err" data-err="${o.f || o.lp || o.n || ''}" hidden></div></div>`;
  }
  function sw(o) {
    var at = o.f ? 'data-f="' + o.f + '"' : 'name="' + o.n + '"';
    return H`<div class="swrow${o.cls ? ' ' + o.cls : ''}"><label class="switch"><input type="checkbox" ${raw(at)}${raw(o.v ? ' checked' : '')}><span>${o.l}</span></label>${o.hint ? H`<div class="hint">${o.hint}</div>` : ''}</div>`;
  }
  function secBadge(on) { return on ? chip('configurado', 'ok', 'check') : chip('não configurado', 'bad'); }

  /* CSV: baixa fora da demo, copia na demo */
  function csvCell(v) {
    var s = v == null ? '' : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(head, rows) { return [head].concat(rows).map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n'); }
  function exportCsv(name, head, rows) {
    var text = toCsv(head, rows);
    if (B.demo) { B.copy(text); return; }
    var blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = B.el('a', { href: url, download: name + '-' + B.dateInput(Date.now()) + '.csv', style: 'display:none' });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }
  function csvButton(act) {
    return H`<button class="btn btn--sm" type="button" data-act="${act}">${ic(B.demo ? 'copy' : 'download')}${B.demo ? 'Copiar CSV' : 'Exportar CSV'}</button>`;
  }

  /* ---------------------------------------------------------------
     guarda de alterações não salvas e navegação
     --------------------------------------------------------------- */
  function dirty() { try { return !!(S.guard && S.guard()); } catch (e) { return false; } }
  function askLeave() {
    return B.confirm({ title: 'Sair sem salvar?', text: 'Você tem alterações que ainda não foram salvas. Se sair agora, elas serão perdidas.', ok: 'Sair sem salvar', cancel: 'Continuar editando', danger: true });
  }
  function go(path, opts) {
    if (!dirty()) { B.router.go(path, opts); return; }
    askLeave().then(function (ok) { if (ok) { S.guard = null; B.router.go(path, opts); } });
  }
  function stopPage() {
    var t = S.teardown;
    S.teardown = null; S.guard = null; S.acts = {}; S.on = {};
    if (t) { try { t(); } catch (e) { console.error(e); } }
  }
  function R(fn) {
    return function (params, query) {
      if (!S.user) return;
      stopPage();
      var id = ++S.nav;
      fn({ params: params, query: query, live: function () { return id === S.nav && !!S.user; } });
    };
  }

  /* ---------------------------------------------------------------
     contadores do menu (afiliações pendentes, mensagens não lidas)
     --------------------------------------------------------------- */
  function paintCounts() {
    [['aff', S.counts.aff], ['msg', S.counts.msg], ['crm', S.counts.crm]].forEach(function (x) {
      $$('[data-count="' + x[0] + '"]').forEach(function (el) { el.textContent = x[1] > 99 ? '99+' : x[1]; el.hidden = !x[1]; });
    });
    $$('[data-menu-dot]').forEach(function (el) { el.hidden = !(S.counts.aff + S.counts.msg + S.counts.crm); });
  }
  function setCounts(a) {
    if (!a) return;
    if (a.pending_affiliations != null) S.counts.aff = a.pending_affiliations;
    if (a.unread_messages != null) S.counts.msg = a.unread_messages;
    if (a.crm_failing != null) S.counts.crm = a.crm_failing || 0;
    paintCounts();
  }
  function refreshCounts(force) {
    if (!S.user || (!force && Date.now() - S.countsAt < 60000)) return;
    S.countsAt = Date.now();
    var now = Date.now();
    B.api('adminDash', { from: now - DAY, to: now }).then(function (d) { setCounts(d.alerts); }).catch(function () {});
  }

  /* ---------------------------------------------------------------
     casca: menu lateral, topo do celular e gaveta
     --------------------------------------------------------------- */
  var NAV = [
    ['/', 'Painel', 'chart', ''], ['/cursos', 'Cursos', 'cap', ''], ['/vendas', 'Vendas', 'wallet', ''],
    ['/alunos', 'Alunos', 'users', ''], ['/afiliados', 'Afiliados', 'link', 'aff'], ['/vendedores', 'Vendedores', 'target', ''],
    ['/cupons', 'Cupons', 'tag', ''], ['/banners', 'Banners', 'image', ''], ['/mensagens', 'Mensagens', 'mail', ''],
    ['/suporte', 'Suporte', 'chat', 'msg'], ['/config', 'Configurações', 'settings', 'crm']
  ];
  function renderShell() {
    app.className = 'adm';
    app.innerHTML = String(H`
      <aside class="adm-side" id="adm-side" aria-label="Menu do painel">
        <div class="adm-side__brand">
          <a class="brand" href="#/" aria-label="Ir para o painel">${raw(B.brandMark())}</a>
          <button class="iconbtn show-nav" type="button" data-shell="nav-close" aria-label="Fechar menu">${ic('x')}</button>
        </div>
        <nav class="adm-nav" aria-label="Seções">
          ${NAV.map(function (n) {
            return H`<a href="#${n[0]}" data-nav="${n[0]}">${ic(n[2])}<span>${n[1]}</span>${n[3] ? H`<span class="adm-count" data-count="${n[3]}" hidden></span>` : ''}</a>`;
          })}
        </nav>
        <div class="adm-side__foot">
          <div class="adm-me">${raw(B.avatar(S.user, 34))}<div class="min0"><div class="adm-me__name ellipsis">${S.user.name}</div><div class="t-xs t-faint ellipsis">${S.user.email}</div></div></div>
          <a class="adm-foot" href="${B.base}index.html" target="_blank" rel="noopener">${ic('external')}<span>Ver plataforma</span></a>
          <button class="adm-foot" type="button" data-shell="logout">${ic('logout')}<span>Sair</span></button>
        </div>
      </aside>
      <div class="adm-scrim" data-shell="nav-close"></div>
      <header class="adm-top">
        <button class="iconbtn" type="button" data-shell="nav-open" aria-label="Abrir menu" aria-expanded="false" aria-controls="adm-side">${ic('menu')}<span class="adm-top__dot" data-menu-dot hidden></span></button>
        <a class="brand" href="#/" aria-label="Ir para o painel">${raw(B.brandMark())}</a>
      </header>
      <main class="adm-main"><div class="wrap" id="adm-page"></div></main>`);
    var root = pageEl();
    root.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!t || !root.contains(t)) return;
      var fn = S.acts[t.dataset.act];
      if (fn) fn(t, ev);
    });
    ['input', 'change', 'keydown', 'submit'].forEach(function (type) {
      root.addEventListener(type, function (ev) { var fn = S.on[type]; if (fn) fn(ev); });
    });
  }
  function openNav() { app.classList.add('is-nav-open'); var b = $('[data-shell="nav-open"]'); if (b) b.setAttribute('aria-expanded', 'true'); }
  function closeNav() { app.classList.remove('is-nav-open'); var b = $('[data-shell="nav-open"]'); if (b) b.setAttribute('aria-expanded', 'false'); }
  function paintNav(path) {
    $$('.adm-nav a').forEach(function (a) {
      var p = a.dataset.nav, on = p === '/' ? path === '/' : (path === p || path.indexOf(p + '/') === 0 || (p === '/cursos' && path.indexOf('/curso/') === 0));
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ---------------------------------------------------------------
     login
     --------------------------------------------------------------- */
  function showLogin(msg) {
    stopPage();
    S.user = null; S.counts = { aff: 0, msg: 0, crm: 0 };
    app.className = 'adm adm--login';
    app.innerHTML = String(H`
      <div class="login">
        <form class="panel hud login__card" id="login-form" novalidate>
          <div class="stack" style="--gap:18px">
            <span class="brand">${raw(B.brandMark())}</span>
            <div><h1 class="t-2">Painel do produtor</h1><p class="t-muted t-sm" style="margin-top:6px">Entre com a conta de administrador para gerenciar cursos, vendas e alunos.</p></div>
            <div class="field"><label for="lg-email">E-mail</label><input class="input" id="lg-email" type="email" autocomplete="username" inputmode="email" required></div>
            <div class="field"><label for="lg-pass">Senha</label><input class="input" id="lg-pass" type="password" autocomplete="current-password" required></div>
            <div class="err" id="lg-err" role="alert" ${msg ? '' : raw('hidden')}>${msg || ''}</div>
            <button class="btn btn--primary btn--lg btn--block" type="submit">Entrar</button>
            ${B.demo ? H`<div class="login__demo"><div class="t-hud t-mustard">Demonstração</div><p class="t-sm t-muted">Use <b>admin@brasa.demo</b> com a senha <b>brasa123</b>.</p><button class="btn btn--sm btn--ghost" type="button" id="lg-fill">${ic('key')}Preencher e entrar</button></div>` : ''}
          </div>
        </form>
      </div>`);
    var form = $('#login-form'), err = $('#lg-err'), btn = $('[type=submit]', form);
    function fail(m) { err.textContent = m || ''; err.hidden = !m; }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = $('#lg-email').value.trim(), pass = $('#lg-pass').value;
      if (!B.validEmail(email)) { fail('Informe um e-mail válido.'); $('#lg-email').focus(); return; }
      if (!pass) { fail('Informe a senha.'); $('#lg-pass').focus(); return; }
      fail('');
      busy(btn, B.api('login', { email: email, password: pass, as: 'admin' }).then(function (r) {
        B.loginDone(r);
        return B.loadBrand().then(function () { start(r.user); });
      })).catch(function (e) { fail(e.message); });
    });
    var fill = $('#lg-fill');
    if (fill) fill.addEventListener('click', function () {
      $('#lg-email').value = 'admin@brasa.demo'; $('#lg-pass').value = 'brasa123';
      form.requestSubmit ? form.requestSubmit() : btn.click();
    });
    setTimeout(function () { var f = $('#lg-email'); if (f && !('ontouchstart' in window)) f.focus(); }, 50);
  }

  function bootError(e) {
    app.className = 'adm adm--login';
    app.innerHTML = String(H`<div class="login"><div class="panel hud login__card">${emptyState('Não foi possível abrir o painel', (e && e.message) || 'Verifique a conexão e tente de novo.', H`<button class="btn btn--primary" type="button" onclick="location.reload()">${ic('refresh')}Tentar de novo</button>`, 'alert')}</div></div>`);
  }

  function start(user) {
    S.user = user;
    renderShell();
    paintCounts();
    if (!S.routerStarted) { S.routerStarted = true; B.router.start('/'); } else B.router.reload();
    refreshCounts(true);
  }

  /* ---------------------------------------------------------------
     eventos globais (uma vez)
     --------------------------------------------------------------- */
  function initGlobal() {
    B.on(document, 'click', '[data-shell]', function (ev, el) {
      var a = el.dataset.shell;
      if (a === 'nav-open') openNav();
      else if (a === 'nav-close') closeNav();
      else if (a === 'logout') {
        var go2 = function () { B.logout(); showLogin(); };
        if (dirty()) askLeave().then(function (ok) { if (ok) { S.guard = null; go2(); } }); else go2();
      }
    });
    B.on(document, 'click', '[data-copy]', function (ev, el) { ev.preventDefault(); B.copy(el.dataset.copy, el); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    // links internos (#/rota) com alterações pendentes
    document.addEventListener('click', function (ev) {
      if (!dirty() || ev.defaultPrevented || ev.button) return;
      var a = ev.target.closest ? ev.target.closest('a[href^="#/"]') : null;
      if (!a) return;
      var path = a.getAttribute('href').slice(1);
      if (path.split('?')[0] === B.router.path) return;
      ev.preventDefault(); ev.stopPropagation();
      go(path);
    }, true);
    // botão voltar/avançar do navegador
    S.lastHash = location.hash;
    window.addEventListener('popstate', function (ev) {
      var target = location.hash;
      if (dirty() && target !== S.lastHash) {
        ev.stopImmediatePropagation();
        try { history.pushState(null, '', S.lastHash || '#/'); } catch (e) {}
        askLeave().then(function (ok) { if (ok) { S.guard = null; B.router.go(target.replace(/^#/, '') || '/'); } });
      } else S.lastHash = target;
    });
    window.addEventListener('beforeunload', function (e) { if (dirty()) { e.preventDefault(); e.returnValue = ''; return ''; } });
    B.listen('route', function (r) {
      if (!S.user) return;
      S.lastHash = location.hash;
      paintNav(r.path); closeNav(); refreshCounts(false);
    });
    B.listen('auth:expired', function () { if (S.user) showLogin('Sua sessão expirou. Entre de novo.'); });
  }

  function initRoutes() {
    B.router
      .on('/', R(pageDash))
      .on('/cursos', R(pageCourses))
      .on('/curso/novo', R(pageCourse))
      .on('/curso/:id', R(pageCourse))
      .on('/vendas', R(pageSales))
      .on('/alunos', R(pageStudents))
      .on('/afiliados', R(pageAffiliates))
      .on('/cupons', R(pageCoupons))
      .on('/vendedores', R(plusPage('vendedores')))
      .on('/comercial', R(plusPage('vendedores')))
      .on('/banners', R(plusPage('banners')))
      .on('/mensagens', R(plusPage('mensagens')))
      .on('/suporte', R(pageSupport))
      .on('/config', R(pageSettings))
      .otherwise(R(function () {
        setTitle('Página não encontrada');
        pageEl().innerHTML = String(H`${pgHead('Página não encontrada')}<div class="panel">${emptyState('Esse endereço não existe', 'Volte ao painel e siga pelo menu.', H`<a class="btn btn--primary" href="#/">Ir para o painel</a>`, 'search')}</div>`);
      }));
  }

  /* =====================================================================
     PAINEL
     ===================================================================== */
  function dashRange(days) { var now = Date.now(); return { from: dayStart(now - (days - 1) * DAY), to: now }; }

  function dashSkeleton() {
    return H`<div class="kband">${[1, 2, 3, 4, 5, 6, 7, 8].map(function () { return H`<div class="kpi">${skel(12, '60%')}${skel(30, '80%')}${skel(10, '50%')}</div>`; })}</div>
      <div class="dash-grid">${skel(220)}${skel(260)}${skel(200)}</div>`;
  }

  function pageDash(ctx) {
    setTitle('Painel');
    var days = Number(B.store.get('adm:days', 30));
    if ([7, 30, 90].indexOf(days) < 0) days = 30;
    var reqId = 0, root = pageEl(), body;
    root.innerHTML = String(H`
      ${pgHead('Painel', 'O que aconteceu na plataforma no período escolhido.', H`
        <div class="seg" role="group" aria-label="Período">${[7, 30, 90].map(function (d) { return H`<button type="button" data-act="period" data-d="${d}" class="${d === days ? 'is-active' : ''}" aria-pressed="${String(d === days)}">${d} dias</button>`; })}</div>
        <button class="btn btn--ghost btn--sm btn--icon" type="button" data-act="reload" aria-label="Atualizar números" title="Atualizar números">${ic('refresh')}</button>`)}
      <div id="dash-body"></div>`);
    body = $('#dash-body');

    S.acts = {
      period: function (el) {
        days = Number(el.dataset.d); B.store.set('adm:days', days);
        $$('[data-act="period"]', root).forEach(function (b) { var on = Number(b.dataset.d) === days; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
        load();
      },
      reload: function () { load(); }
    };

    function load() {
      var my = ++reqId, r = dashRange(days);
      body.innerHTML = String(dashSkeleton());
      B.api('adminDash', r).then(function (d) {
        if (!ctx.live() || my !== reqId) return;
        setCounts(d.alerts);
        render(d);
        B.api('adminDash', { from: d.from - days * DAY, to: d.from - 1 }).then(function (p) {
          if (ctx.live() && my === reqId) paintDeltas(d, p);
        }).catch(function () {});
      }).catch(function (e) {
        if (!ctx.live() || my !== reqId) return;
        body.innerHTML = String(errorState(e, 'reload'));
      });
    }

    function kpi(label, value, sub, key, cls) {
      return H`<div class="kpi ${cls || ''}"><div class="kpi__label">${label}</div><div class="kpi__value t-num">${value}</div><div class="kpi__sub">${key ? H`<span class="kpi__delta" data-delta="${key}"></span>` : ''}<span>${sub}</span></div></div>`;
    }

    function paintDeltas(d, p) {
      var k = d.kpis, q = p.kpis;
      [['revenue', k.revenue, q.revenue], ['sales', k.sales, q.sales], ['ticket', k.ticket, q.ticket], ['students_new', k.students_new, q.students_new]].forEach(function (x) {
        var el = $('[data-delta="' + x[0] + '"]', body), dl = delta(x[1], x[2]);
        if (el && dl) { el.textContent = dl.t; el.className = 'kpi__delta is-' + dl.c; el.title = 'Comparado com os ' + days + ' dias anteriores'; }
      });
      var el = $('[data-delta="conv"]', body), diff = Math.round((k.conv - q.conv) * 10) / 10;
      if (el) {
        el.textContent = !diff ? '0 p.p.' : (diff > 0 ? '▲ ' : '▼ ') + B.fmt.num(Math.abs(diff)) + ' p.p.';
        el.className = 'kpi__delta is-' + (!diff ? 'flat' : diff > 0 ? 'up' : 'down');
        el.title = 'Comparado com os ' + days + ' dias anteriores';
      }
    }

    function render(d) {
      var k = d.kpis, a = d.alerts, setup = a.setup || {};
      var mix = d.methods || {}, mixTotal = (mix.pix || 0) + (mix.card || 0);
      var mixTxt = mixTotal ? 'Pix ' + Math.round((mix.pix || 0) / mixTotal * 100) + '% · Cartão ' + Math.round((mix.card || 0) / mixTotal * 100) + '%' : 'sem vendas no período';
      var fromKey = B.dateInput(d.from);
      var series = (d.series || []).filter(function (s) { return s.d >= fromKey; });

      var items = [];
      if (a.pending_affiliations) items.push({ href: '#/afiliados', tone: 'warn', icon: 'users', n: a.pending_affiliations, t: a.pending_affiliations === 1 ? 'pedido de afiliação esperando resposta' : 'pedidos de afiliação esperando resposta' });
      if (a.unread_messages) items.push({ href: '#/suporte', tone: 'bad', icon: 'chat', n: a.unread_messages, t: a.unread_messages === 1 ? 'mensagem não lida no suporte' : 'mensagens não lidas no suporte' });
      if (a.courses_without_lp) items.push({ href: '#/cursos', tone: 'info', icon: 'sparkles', n: a.courses_without_lp, t: a.courses_without_lp === 1 ? 'curso à venda sem página gerada' : 'cursos à venda sem página gerada' });
      if (k.abandoned_24h) items.push({ href: '#/vendas?status=abandoned&periodo=24h', tone: 'warn', icon: 'cart', n: k.abandoned_24h, t: k.abandoned_24h === 1 ? 'carrinho abandonado nas últimas 24h' : 'carrinhos abandonados nas últimas 24h' });
      if (a.crm_failing) items.push({ href: '#/config?s=comercial', tone: 'bad', icon: 'target', n: a.crm_failing, t: a.crm_failing === 1 ? 'aviso não chegou ao BRASA CRM' : 'avisos não chegaram ao BRASA CRM' });
      var checks = [
        ['mp', 'Mercado Pago', 'Cole o token de acesso para receber', 'Pagamentos conectados'],
        ['ai', 'Inteligência artificial', 'Adicione a chave para gerar páginas', 'Chave configurada'],
        ['site_url', 'Endereço do site', 'Informe a URL pública do site', 'Endereço definido'],
        ['api_url', 'Endereço da API', 'Informe a URL do Apps Script', 'Endereço definido']
      ];
      var okN = checks.filter(function (c) { return setup[c[0]]; }).length;

      body.innerHTML = String(H`
        <section class="kband" aria-label="Resumo do período">
          ${kpi('Faturamento', moneyK(k.revenue), 'líquido ' + moneyK(k.net), 'revenue', 'kpi--hero')}
          ${kpi('Vendas', int(k.sales), mixTxt, 'sales')}
          ${kpi('Ticket médio', moneyK(k.ticket), k.sales ? 'por venda' : 'sem vendas ainda', 'ticket')}
          ${kpi('Conversão da página', B.fmt.pct(k.conv), plural(k.lp_views, 'visita', 'visitas') + ' à página', 'conv')}
          ${kpi('Alunos novos', int(k.students_new), int(k.students_total) + ' no total', 'students_new')}
          ${kpi('Ativos em 7 dias', int(k.active_7d), 'de ' + int(k.students_total) + ' alunos')}
          ${kpi('Comissões em aberto', moneyK(k.commissions_open), 'a pagar para afiliados')}
          ${kpi('Reembolsos', moneyK(k.refunds_value), plural(k.refunds, 'pedido', 'pedidos'), '', k.refunds ? 'kpi--warn' : '')}
        </section>

        <div class="dash-grid">
          <div class="dash-col">
          <section class="panel dash-chart" aria-label="Faturamento por dia">
            ${panelHead('Faturamento por dia', '', 'Vendas aprovadas, em reais · ' + days + ' dias')}
            <div id="dash-area"></div>
          </section>

          <section class="panel dash-courses" aria-label="Faturamento por curso">
            ${panelHead('Faturamento por curso')}
            <div id="dash-bars"></div>
          </section>

          ${plusHtml('dashBump', k, days)}
          </div>
          <div class="dash-col">
          <section class="panel dash-alerts" aria-label="Pendências">
            ${panelHead('Precisa de você', items.length ? chip(items.length, 'bad') : '')}
            ${items.length ? H`<ul class="alist">${items.map(function (it) {
              return H`<li><a class="alist__item" href="${it.href}"><span class="alist__ic is-${it.tone}">${ic(it.icon)}</span><span class="alist__txt"><b class="t-num">${int(it.n)}</b> ${it.t}</span>${ic('right', 'alist__go')}</a></li>`;
            })}</ul>` : H`<div class="alist-ok">${ic('check')}<span>Tudo em dia. Nenhuma pendência agora.</span></div>`}
            <div class="dash-setup${okN === checks.length ? ' is-done' : ''}">
              <div class="row row--between" style="--gap:8px"><h3 class="t-hud t-faint">Para ir ao ar</h3><span class="t-xs t-faint t-num">${okN} de ${checks.length}</span></div>
              <div class="bar" aria-hidden="true"><div class="bar__fill" style="--p:${okN / checks.length * 100}%"></div></div>
              <ul class="slist">${checks.map(function (c) {
                var on = !!setup[c[0]];
                return H`<li><a class="slist__item" href="#/config?s=${c[0] === 'mp' ? 'mercadopago' : c[0] === 'ai' ? 'ia' : 'enderecos'}"><span class="slist__mark ${on ? 'is-ok' : 'is-no'}">${ic(on ? 'check' : 'x')}</span><span class="min0"><b>${c[1]}</b><span class="t-faint t-xs"> · ${on ? c[3] : c[2]}</span></span></a></li>`;
              })}</ul>
            </div>
          </section>

          <section class="panel dash-affs" aria-label="Melhores afiliados">
            ${panelHead('Top afiliados', H`<a class="btn btn--link btn--sm" href="#/afiliados">Ver todos</a>`)}
            ${(d.top_affiliates || []).length ? H`<ol class="toplist">${d.top_affiliates.slice(0, 5).map(function (x, i) {
              return H`<li><span class="toplist__pos t-num">${i + 1}</span><div class="min0 grow"><div class="ellipsis"><b>${x.name}</b></div><div class="t-xs t-faint">${chip(x.code, 'mustard')} ${plural(x.sales, 'venda', 'vendas')} · comissão ${money(x.commission)}</div></div><div class="t-num toplist__val">${moneyK(x.revenue)}</div></li>`;
            })}</ol>` : emptyState('Sem vendas por afiliados', 'Quando alguém vender pelo link de um afiliado, o ranking aparece aqui.', '', 'users')}
          </section>

          </div>
          <section class="panel panel--flush dash-recent" aria-label="Pedidos recentes">
            <div class="dash-recent__head">${panelHead('Pedidos recentes', H`<a class="btn btn--link btn--sm" href="#/vendas">Ver todas as vendas</a>`)}</div>
            ${(d.recent || []).length ? H`<div class="table-wrap table-wrap--bare"><table class="table table--dense">
              <thead><tr><th>Quando</th><th>Cliente</th><th>Curso</th><th class="num">Valor</th><th>Status</th><th>Afiliado</th></tr></thead>
              <tbody>${d.recent.map(function (o) {
                return H`<tr class="is-click" data-act="open-order" data-id="${o.id}" tabindex="0" role="button" aria-label="Abrir pedido de ${o.name}"><td class="nowrap" title="${B.fmt.datetime(o.created_at)}">${B.fmt.rel(o.created_at)}</td><td><div class="ellipsis cell-name">${o.name}</div></td><td><div class="ellipsis cell-course">${o.course_title}</div></td><td class="num">${money(o.amount)}</td><td>${orderChip(o.status)}</td><td>${o.aff_code ? chip(o.aff_code, 'mustard') : H`<span class="t-faint">Direto</span>`}</td></tr>`;
              })}</tbody></table></div>` : emptyState('Nenhum pedido ainda', 'Divulgue o link da página de vendas para os primeiros pedidos chegarem.', H`<a class="btn btn--primary btn--sm" href="#/cursos">Ver cursos</a>`, 'cart')}
          </section>
        </div>`);

      B.chart.area($('#dash-area', body), series.map(function (s) { return { label: s.label, value: s.revenue }; }), { format: B.fmt.money, height: 240, label: 'Faturamento por dia, em reais' });
      B.chart.bars($('#dash-bars', body), (d.by_course || []).map(function (c) { return { label: c.title, value: c.revenue }; }), { format: B.fmt.money, limit: 6 });
      if (!(d.by_course || []).length) $('#dash-bars', body).innerHTML = String(emptyState('Sem vendas no período', 'Que tal divulgar o link da página de vendas?', '', 'cart'));
    }

    S.acts['open-order'] = function (el) { go('/vendas?q=' + encodeURIComponent(el.dataset.id) + '&periodo=tudo&abrir=1'); };
    load();
  }

  /* =====================================================================
     CURSOS (lista)
     ===================================================================== */
  function pageCourses(ctx) {
    setTitle('Cursos');
    var root = pageEl(), filter = 'all', list = [];
    root.innerHTML = String(H`
      ${pgHead('Cursos', 'Catálogo, ofertas e páginas de venda.', H`<a class="btn btn--primary" href="#/curso/novo">${ic('plus')}Novo curso</a>`)}
      <div id="crs-body">${[1, 2, 3].map(function () { return H`<div style="margin-bottom:12px">${skel(112)}</div>`; })}</div>`);
    var body = $('#crs-body');

    S.acts = {
      filter: function (el) { filter = el.dataset.v; paint(); },
      retry: function () { load(); }
    };

    function load() {
      body.innerHTML = String(H`${skel(112)}`);
      getCourses(true).then(function (c) { if (!ctx.live()) return; list = c; paint(); })
        .catch(function (e) { if (ctx.live()) body.innerHTML = String(errorState(e, 'retry')); });
    }

    function row(c) {
      var k = c.kpis || {}, st = c.stats || {}, open = (c.status === 'published' || c.status === 'coming_soon') ? '' : '&preview=1';
      var meta = [c.category, plural(st.seasons || 0, 'temporada', 'temporadas'), plural(st.lessons || 0, 'aula', 'aulas'), st.minutes ? B.fmt.dur(st.minutes) : ''].filter(Boolean).join(' · ');
      return H`<article class="crs${c.status === 'archived' ? ' is-archived' : ''}">
        <a class="crs__thumb tile" href="#/curso/${c.id}" aria-label="Editar ${c.title}">${raw(B.art(c))}</a>
        <div class="crs__main min0">
          <div class="crs__title"><a href="#/curso/${c.id}">${c.title}</a>${stChip(COURSE_ST, c.status)}${c.featured ? chip('Destaque', 'mustard', 'star') : ''}</div>
          <div class="crs__meta t-sm t-muted ellipsis">${meta}</div>
          <div class="crs__sub">
            <span class="crs__price">${c.price > 0 ? H`<b class="t-num">${money(c.price)}</b>${c.anchor_price > c.price ? H` <s class="t-strike t-num t-sm">${money(c.anchor_price)}</s>` : ''}` : H`<b>Gratuito</b>`}</span>
            ${lpChip(c.lp_status)}
          </div>
        </div>
        ${c.status === 'coming_soon' ? H`<dl class="crs__stats">
          <div title="Alunos que tocaram em Avise-me. Na estreia eles recebem o aviso e viram leads do comercial."><dt>Na espera</dt><dd class="t-num">${int(c.waitlist)}</dd></div>
          <div title="Aulas que já têm vídeo. Quando terminar, mude o status para Publicado."><dt>Com vídeo</dt><dd class="t-num">${int((c.videos || {}).ready)}/${int((c.videos || {}).total)}</dd></div>
          <div><dt>Visitas</dt><dd class="t-num">${int(k.views)}</dd></div>
          <div><dt>Alunos</dt><dd class="t-num">${int(k.students)}</dd></div>
        </dl>` : H`<dl class="crs__stats">
          <div><dt>Alunos</dt><dd class="t-num">${int(k.students)}</dd></div>
          <div><dt>Vendas</dt><dd class="t-num">${int(k.sales)}</dd></div>
          <div><dt>Faturamento</dt><dd class="t-num">${moneyK(k.revenue)}</dd></div>
          <div><dt>Visitas</dt><dd class="t-num">${int(k.views)}</dd></div>
        </dl>`}
        <div class="crs__acts">
          <a class="btn btn--sm" href="#/curso/${c.id}">${ic('edit')}Editar</a>
          <a class="iconbtn iconbtn--sm" href="${B.safeUrl(pageLink(c.slug, open))}" target="_blank" rel="noopener" aria-label="Abrir página de vendas de ${c.title}" title="Abrir página de vendas">${ic('external')}</a>
          ${copyBtn(siteLink(c.slug), 'Copiar link da página de vendas')}
        </div>
      </article>`;
    }

    function paint() {
      var counts = { all: list.length };
      list.forEach(function (c) { counts[c.status] = (counts[c.status] || 0) + 1; });
      var shown = list.filter(function (c) { return filter === 'all' || c.status === filter; });
      var seg = list.length > 3 ? H`<div class="seg crs-filter" role="group" aria-label="Filtrar por situação">${[['all', 'Todos'], ['published', 'Publicados'], ['draft', 'Rascunhos'], ['coming_soon', 'Em breve'], ['archived', 'Arquivados']].filter(function (x) { return x[0] === 'all' || counts[x[0]]; }).map(function (x) { return H`<button type="button" data-act="filter" data-v="${x[0]}" class="${filter === x[0] ? 'is-active' : ''}">${x[1]} <span class="t-num t-faint">${counts[x[0]] || 0}</span></button>`; })}</div>` : '';
      if (!list.length) {
        body.innerHTML = String(H`<div class="panel">${emptyState('Nenhum curso ainda', 'Crie o primeiro: a página de vendas nasce pronta, escrita pela IA a partir dos dados do curso.', H`<a class="btn btn--primary" href="#/curso/novo">${ic('plus')}Criar o primeiro curso</a>`, 'cap')}</div>`);
        return;
      }
      body.innerHTML = String(H`${seg}<div class="panel panel--flush crs-list">${shown.length ? shown.map(row) : H`<div class="empty"><p class="t-muted">Nenhum curso nesta situação.</p></div>`}</div>`);
    }
    load();
  }

  /* =====================================================================
     AUXILIARES: leitura de campos, imagens, provedor de vídeo
     ===================================================================== */
  function readInput(t) {
    if (t.type === 'checkbox') return t.checked;
    if (t.type === 'number' || t.dataset.num != null) return t.value === '' ? '' : Number(String(t.value).replace(',', '.'));
    if (t.type === 'date') return t.value ? B.dateFromInput(t.value, t.dataset.end != null) : 0;
    return t.value;
  }
  function counter(key, max, val) {
    var n = String(val == null ? '' : val).length;
    return H`<span class="counter${n > max ? ' is-over' : ''}" data-counter data-for="${key}" data-max="${max}">${n}/${max}</span>`;
  }
  function providerHint(url) {
    url = String(url || '').trim();
    if (!url) return { ok: false, text: 'Cole o link do vídeo: YouTube, Vimeo, Panda Video, Google Drive ou arquivo MP4.' };
    var p = B.player.parse(url);
    if (p.type === 'youtube') return { ok: true, name: 'YouTube', text: 'YouTube detectado. A miniatura é preenchida sozinha.' };
    if (p.type === 'vimeo') return { ok: true, name: 'Vimeo', text: 'Vimeo detectado.' };
    if (p.type === 'video') return { ok: true, name: 'MP4', text: 'Arquivo de vídeo detectado (MP4).' };
    if (p.type === 'demo') return { ok: true, name: 'Demo', text: 'Vídeo de demonstração (simulado).' };
    if (p.type === 'iframe') {
      if (/drive\.google\.com/i.test(p.src)) return { ok: true, name: 'Drive', text: 'Google Drive detectado. O arquivo precisa estar compartilhado como "qualquer pessoa com o link".' };
      if (/pandavideo/i.test(p.src)) return { ok: true, name: 'Panda', text: 'Panda Video detectado.' };
      return { ok: true, name: 'Link', text: 'Link incorporado (iframe). Confira se o provedor permite exibir em outros sites.' };
    }
    return { ok: false, text: 'Endereço não reconhecido. Use um link que comece com https://.' };
  }

  function guardForm(m) { $$('form', m.el).forEach(function (f) { f.addEventListener('submit', function (ev) { ev.preventDefault(); }); }); }

  function pickFile(accept) {
    return new Promise(function (res) {
      var inp = B.el('input', { type: 'file', accept: accept || 'image/*', style: 'display:none' });
      document.body.appendChild(inp);
      inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; inp.remove(); res(f || null); });
      inp.addEventListener('cancel', function () { inp.remove(); res(null); });
      inp.click();
    });
  }
  // Escolhe, reduz e envia uma imagem (mesmo caminho de B.uploadImage). O carregamento só aparece depois da escolha,
  // e logos PNG mantêm a transparência (o core só preserva PNG quando o nome do arquivo traz "logo" ou "title").
  function chooseAndUpload(btn, o) {
    o = o || {};
    return pickFile('image/*').then(function (f) {
      if (!f) return null;
      if (o.png && f.type === 'image/png' && !/logo|title/i.test(f.name)) f = new File([f], 'logo-' + f.name, { type: 'image/png' });
      if (btn) btn.classList.add('is-loading');
      var off = function () { if (btn) btn.classList.remove('is-loading'); };
      return B.readImage(f, o.maxW || (B.demo ? 1000 : 1800), B.demo ? 0.78 : 0.86)
        .then(function (img) { return B.api('adminUpload', { name: img.name, mime: img.mime, data: img.base64 }); })
        .then(function (r) { off(); return r.url; }, function (e) { off(); throw e; });
    });
  }
  function imgThumb(v) { return v ? H`<img src="${B.safeUrl(v)}" alt="">` : ic('image'); }
  function imgField(o) {
    var v = o.v || '', isData = /^data:/i.test(v);
    return H`<div class="field imgf" data-img="${o.f}">
      <label>${o.l}</label>
      <div class="imgf__row">
        <div class="imgf__thumb imgf__thumb--${o.shape || 'wide'}" data-thumb>${imgThumb(v)}</div>
        <div class="imgf__ctl">
          <div class="row" style="--gap:8px">
            <button class="btn btn--sm" type="button" data-act="img-up" data-f="${o.f}">${ic('upload')}Enviar imagem</button>
            <button class="btn btn--sm btn--ghost" type="button" data-act="img-rm" data-f="${o.f}" data-rm ${v ? '' : raw('hidden')}>${ic('trash')}Remover</button>
          </div>
          <input class="input" type="url" data-f="${o.f}" data-url inputmode="url" autocomplete="off" placeholder="${isData ? 'Imagem enviada. Cole um endereço para trocar.' : 'ou cole o endereço da imagem'}" value="${isData ? '' : v}" aria-label="Endereço da imagem: ${o.l}">
          ${o.hint ? H`<div class="hint">${o.hint}</div>` : ''}
        </div>
      </div>
    </div>`;
  }

  /* repetidores (perguntas, depoimentos, pilares, bônus) */
  var REPS = {
    'draft:faq': { root: 'draft', path: 'faq', label: 'Pergunta', add: 'Adicionar pergunta', empty: 'Sem perguntas ainda. Se você deixar vazio, a IA escreve as dúvidas mais comuns.', blank: { q: '', a: '' }, fields: [{ k: 'q', l: 'Pergunta' }, { k: 'a', l: 'Resposta', t: 'textarea', rows: 3 }] },
    'draft:testimonials': { root: 'draft', path: 'testimonials', label: 'Depoimento', add: 'Adicionar depoimento', empty: 'Use só depoimentos reais. A IA nunca inventa nenhum.', blank: { name: '', role: '', text: '', photo: '' }, cols: 2, fields: [{ k: 'name', l: 'Nome' }, { k: 'role', l: 'Papel ou cidade' }, { k: 'text', l: 'Depoimento', t: 'textarea', rows: 3, wide: true }, { k: 'photo', l: 'Foto (endereço da imagem)', t: 'img', wide: true }] },
    'lp:promise.pillars': { root: 'lp', path: 'promise.pillars', label: 'Pilar', add: 'Adicionar pilar', empty: 'Sem pilares.', blank: { title: '', text: '' }, fields: [{ k: 'title', l: 'Título' }, { k: 'text', l: 'Texto', t: 'textarea', rows: 2 }] },
    'lp:bonuses.items': { root: 'lp', path: 'bonuses.items', label: 'Bônus', add: 'Adicionar bônus', empty: 'Sem bônus. A seção some da página.', blank: { title: '', text: '', value: 0 }, cols: 2, fields: [{ k: 'title', l: 'Título' }, { k: 'value', l: 'Valor (R$)', t: 'number' }, { k: 'text', l: 'Descrição', t: 'textarea', rows: 2, wide: true }] },
    'lp:faq': { root: 'lp', path: 'faq', label: 'Pergunta', add: 'Adicionar pergunta', empty: 'Sem perguntas.', blank: { q: '', a: '' }, fields: [{ k: 'q', l: 'Pergunta' }, { k: 'a', l: 'Resposta', t: 'textarea', rows: 3 }] }
  };
  function repHTML(key, list) {
    var cfg = REPS[key]; list = Array.isArray(list) ? list : [];
    return H`<div class="rep" data-rep="${key}">
      ${list.length ? list.map(function (it, i) {
        return H`<div class="rep__item"><div class="rep__head"><span class="t-hud-sub">${cfg.label} ${i + 1}</span><button type="button" class="iconbtn iconbtn--sm" data-act="rep-rm" data-rep="${key}" data-i="${i}" aria-label="Remover ${cfg.label.toLowerCase()} ${i + 1}">${ic('trash')}</button></div>
          <div class="rep__fields${cfg.cols ? ' rep__fields--2' : ''}">${cfg.fields.map(function (f) {
            var path = cfg.path + '.' + i + '.' + f.k, val = it ? it[f.k] : '', id = uid('r'), o = { l: f.l, v: val, id: id, cls: f.wide ? 'is-wide' : '' };
            if (cfg.root === 'lp') o.lp = path; else o.f = path;
            if (f.t === 'img') {
              o.t = 'url'; o.attrs = 'inputmode="url" placeholder="https://…"';
              return H`<div class="field is-wide"><label for="${id}">${f.l}</label><div class="input-group"><input class="input" id="${id}" ${raw('data-f="' + path + '"')} type="url" value="${val || ''}" placeholder="https://…" inputmode="url"><button type="button" class="btn btn--sm addon-btn" data-act="rep-img" data-path="${path}" aria-label="Enviar foto">${ic('upload')}</button></div></div>`;
            }
            if (f.t) o.t = f.t; if (f.rows) o.rows = f.rows;
            if (f.t === 'number') o.attrs = 'min="0" step="0.01"';
            return fld(o);
          })}</div></div>`;
      }) : H`<p class="hint rep__empty">${cfg.empty}</p>`}
      <button type="button" class="btn btn--sm btn--ghost" data-act="rep-add" data-rep="${key}">${ic('plus')}${cfg.add}</button>
    </div>`;
  }

  var COURSE_KEYS = ['slug', 'status', 'order', 'featured', 'title', 'subtitle', 'category', 'tags', 'level', 'short_desc', 'description', 'banner', 'poster', 'logo', 'show_title', 'trailer', 'color', 'instructor_name', 'instructor_bio', 'instructor_photo', 'price', 'anchor_price', 'max_installments', 'methods', 'checkout_url', 'guarantee_days', 'access_days', 'pixel_id', 'promise', 'audience', 'pains', 'benefits', 'bonuses', 'faq', 'testimonials', 'cta_text', 'scarcity_until', 'support_url', 'aff_enabled', 'aff_commission', 'aff_auto', 'aff_cookie_days', 'aff_materials', 'seo_title', 'seo_desc',
    'bump_enabled', 'bump_type', 'bump_course_id', 'bump_title', 'bump_text', 'bump_price', 'bump_image', 'bump_delivery', 'upsell_enabled', 'upsell_course_id', 'upsell_price', 'upsell_title', 'upsell_text', 'upsell_minutes'];
  var COURSE_NUM = ['price', 'anchor_price', 'max_installments', 'guarantee_days', 'access_days', 'aff_commission', 'aff_cookie_days', 'order', 'scarcity_until', 'bump_price', 'upsell_price', 'upsell_minutes'];
  function blankCourse() {
    var b = B.boot0 || {};
    return { slug: '', status: 'draft', order: '', featured: false, title: '', subtitle: '', category: '', tags: '', level: 'Iniciante', short_desc: '', description: '', banner: '', poster: '', logo: '', show_title: true, trailer: '', color: Math.floor(Math.random() * 6), instructor_name: '', instructor_bio: '', instructor_photo: '', price: '', anchor_price: '', max_installments: b.max_installments || 12, methods: ['pix', 'card'], checkout_url: '', guarantee_days: 7, access_days: 0, pixel_id: '', promise: '', audience: '', pains: '', benefits: '', bonuses: '', faq: [], testimonials: [], cta_text: '', scarcity_until: 0, support_url: '', aff_enabled: false, aff_commission: b.aff_default_commission || 40, aff_auto: false, aff_cookie_days: 60, aff_materials: '', seo_title: '', seo_desc: '',
      bump_enabled: false, bump_type: 'course', bump_course_id: '', bump_title: '', bump_text: '', bump_price: '', bump_image: '', bump_delivery: '', upsell_enabled: false, upsell_course_id: '', upsell_price: '', upsell_title: '', upsell_text: '', upsell_minutes: 15 };
  }
  function toDraft(c) {
    var base = blankCourse(), d = {};
    COURSE_KEYS.forEach(function (k) { d[k] = c[k] === undefined || c[k] === null ? base[k] : clone(c[k]); });
    d.methods = Array.isArray(d.methods) ? d.methods : String(d.methods || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    d.faq = Array.isArray(d.faq) ? d.faq : []; d.testimonials = Array.isArray(d.testimonials) ? d.testimonials : [];
    d.tags = String(d.tags || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).join(', ');
    d.color = d.color === '' ? '' : Number(d.color);
    return d;
  }

  /* =====================================================================
     EDITOR DE CURSO
     ===================================================================== */
  function pageCourse(ctx) {
    var routeId = ctx.params.id || '', isNew = !routeId, root = pageEl();
    var TABS = [['essencial', 'Essencial'], ['visual', 'Visual'], ['oferta', 'Oferta'], ['conteudo', 'Conteúdo'], ['lp', 'Página de vendas'], ['ads', 'Anúncios'], ['afiliacao', 'Afiliação']];
    var qTab = ctx.query.get('aba'), tab = TABS.some(function (t) { return t[0] === qTab; }) ? qTab : 'essencial';
    var course = null, draft = null, snap = '', lpDraft = null, lpSnap = '', built = {}, slugTouched = !isNew;
    var openSeasons = {}, openSecs = { hero: true }, view = 'preview', device = 'mobile', genInstr = '', gen = { running: false, step: 0, warn: '', fresh: false };
    var embers = null, timers = [], ro = null, cats = [], affRows = null;
    var rate = Number(B.boot0 && B.boot0.installment_rate) || 0.0299;

    function $p(sel) { return $(sel, root); }
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function art() { return { id: course ? course.id : (draft.title || 'novo'), title: draft.title, banner: draft.banner, poster: draft.poster, color: draft.color, show_title: draft.show_title }; }
    function rootObj(name) { return name === 'lp' ? lpDraft : draft; }
    function payload() {
      var o = {};
      COURSE_KEYS.forEach(function (k) {
        var v = draft[k];
        if (COURSE_NUM.indexOf(k) > -1) { if (v === '' || v == null) { if (isNew || k === 'order') return; v = 0; } v = Number(v) || 0; }
        o[k] = v;
      });
      if (!isNew && course) o.id = course.id;
      return o;
    }
    function courseDirty() { return !!draft && JSON.stringify(payload()) !== snap; }
    function lpDirty() { return !!lpDraft && JSON.stringify(lpDraft) !== lpSnap; }
    function isDirty() { return courseDirty() || lpDirty() || adsDirty(); }
    function refreshDirty() {
      var d = isDirty(), el = $p('#ed-dirty'), b = $p('#ed-save'), lb = $p('#lp-save');
      if (el) el.hidden = !d;
      if (b) b.disabled = !(isNew || d);
      if (lb) lb.disabled = !lpDirty();
      var ab = $p('#ads-save'); if (ab) ab.disabled = !adsDirty();
    }
    function paintHead() {
      var t = $p('#ed-title'), s = $p('#ed-status');
      if (t) t.textContent = draft.title || 'Novo curso';
      if (s) s.innerHTML = String(stChip(COURSE_ST, draft.status));
      setTitle(draft.title || 'Novo curso');
    }

    /* ---------- carregamento ---------- */
    root.innerHTML = String(H`${pgHead(isNew ? 'Novo curso' : 'Curso', '', '', ['/cursos', 'Cursos'])}<div class="stack">${skel(48)}${skel(320)}</div>`);
    Promise.all([isNew ? null : B.api('adminCourse', { id: routeId }), getCourses().catch(function () { return []; })]).then(function (res) {
      if (!ctx.live()) return;
      cats = res[1] || [];
      init(res[0] ? res[0].course : null);
    }).catch(function (e) {
      if (!ctx.live()) return;
      root.innerHTML = String(H`${pgHead('Curso', '', '', ['/cursos', 'Cursos'])}<div class="panel">${emptyState(e && e.code === 'NOT_FOUND' ? 'Curso não encontrado' : 'Não foi possível abrir o curso', (e && e.message) || 'Tente de novo em instantes.', H`<a class="btn btn--primary" href="#/cursos">Voltar aos cursos</a>`, 'alert')}</div>`);
    });

    function init(c) {
      course = c || null;
      draft = c ? toDraft(c) : blankCourse();
      if (!c) draft.instructor_name = (S.user && S.user.name) || '';
      snap = JSON.stringify(payload());
      lpDraft = c && c.lp ? clone(c.lp) : null; lpSnap = lpDraft ? JSON.stringify(lpDraft) : '';
      setAds(c && c.ads && c.ads.items ? c.ads : null);
      root.innerHTML = String(shell());
      wire();
      paintHead();
      setTab(tab, true);
      S.guard = isDirty;
      S.teardown = function () {
        timers.forEach(clearTimeout); timers = [];
        if (embers) { embers.stop(); embers = null; }
        if (ro) { ro.disconnect(); ro = null; }
      };
      if (c && S.autoGen === c.id) { S.autoGen = ''; later(function () { setTab('lp'); generate({ auto: true }); }, 200); }
    }

    function shell() {
      return H`
        <header class="ed-head">
          <div class="ed-head__main min0">
            <a class="pg-back" href="#/cursos">${ic('left')}Cursos</a>
            <div class="ed-head__row"><h1 class="t-2 ed-title" id="ed-title"></h1><span id="ed-status"></span></div>
          </div>
          <div class="ed-save">
            <span class="ed-dirty" id="ed-dirty" role="status" hidden>${ic('alert')}<span>Alterações não salvas</span></span>
            <button class="btn btn--primary" type="button" id="ed-save" data-act="save">${ic('check')}<span>${isNew ? 'Criar curso' : 'Salvar curso'}</span></button>
          </div>
        </header>
        <div class="tabs ed-tabs" role="tablist" aria-label="Seções do curso">
          ${TABS.map(function (t) { return H`<button type="button" role="tab" class="tab" data-act="tab" data-tab="${t[0]}" id="tab-${t[0]}" aria-controls="pane-${t[0]}">${t[1]}</button>`; })}
        </div>
        <div class="ed-panes">
          ${TABS.map(function (t) { return H`<div class="ed-pane" role="tabpanel" id="pane-${t[0]}" data-pane="${t[0]}" aria-labelledby="tab-${t[0]}" hidden></div>`; })}
        </div>`;
    }

    function setTab(k, noUrl) {
      tab = k;
      $$('.tab', root).forEach(function (b) { var on = b.dataset.tab === k; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
      $$('.ed-pane', root).forEach(function (p) { p.hidden = p.dataset.pane !== k; });
      if (!built[k]) { built[k] = true; buildTab(k); }
      if (k === 'lp') fitPreview();
      if (k === 'ads' && built.ads && !isNew) drawAdPreviews();
      try { history.replaceState(null, '', '#/curso/' + (course ? course.id : 'novo') + '?aba=' + k); S.lastHash = location.hash; } catch (e) {}
    }
    var BUILD = { essencial: tabEssencial, visual: tabVisual, oferta: tabOferta, conteudo: tabConteudo, lp: tabLP, ads: tabAds, afiliacao: tabAfiliacao };
    function buildTab(k) {
      var pane = $p('#pane-' + k);
      pane.innerHTML = String(BUILD[k]());
      if (k === 'essencial') { paintSlug(); paintStatusHint(); }
      if (k === 'visual') { paintPalette(); paintVisual(); paintTrailer(); }
      if (k === 'oferta') paintOffer();
      if (k === 'lp') { renderInsumos(); renderGen(); renderSections(); initPreview(); }
      if (k === 'afiliacao') loadAffList();
      if (k === 'ads') { renderAdsGen(); paintAds(); }
    }
    function rebuildTabs() {
      Object.keys(built).forEach(function (k) {
        if (k === 'lp') { renderInsumos(); renderGen(); renderSections(); }
        else if (k === 'ads') { renderAdsGen(); paintAds(); }
        else buildTab(k);
      });
      paintHead(); refreshDirty();
    }

    /* =================== aba: Essencial =================== */
    function tabEssencial() {
      var levels = ['Iniciante', 'Intermediário', 'Avançado', 'Todos os níveis'];
      var catList = []; cats.forEach(function (c) { if (c.category && catList.indexOf(c.category) < 0) catList.push(c.category); });
      return H`
      <div class="ed-grid">
        <section class="panel stack" style="--gap:16px">
          ${panelHead('Identidade')}
          ${fld({ l: 'Título', f: 'title', v: draft.title, req: true, ph: 'Ex.: Tráfego Sem Romance', attrs: 'maxlength="120" autocomplete="off"' })}
          ${fld({ l: 'Subtítulo', f: 'subtitle', v: draft.subtitle, ph: 'Uma frase que completa o título', attrs: 'maxlength="160" autocomplete="off"' })}
          ${fld({ l: 'Endereço da página (slug)', f: 'slug', v: draft.slug, ph: 'gerado a partir do título', attrs: 'maxlength="60" autocomplete="off" autocapitalize="off" spellcheck="false"', hint: H`<span class="slugurl" id="slug-url"></span>` })}
          <div class="grid-2">
            ${fld({ l: 'Situação', t: 'select', f: 'status', v: draft.status, opts: [['draft', 'Rascunho'], ['published', 'Publicado'], ['coming_soon', 'Em breve'], ['archived', 'Arquivado']], hint: H`<span id="st-hint"></span>` })}
            ${fld({ l: 'Nível', f: 'level', v: draft.level, attrs: 'list="dl-level" autocomplete="off"', ph: 'Iniciante' })}
          </div>
          ${fld({ l: 'Categoria', f: 'category', v: draft.category, attrs: 'list="dl-cat" autocomplete="off"', ph: 'Ex.: Tráfego pago' })}
          ${fld({ l: 'Tags', f: 'tags', v: draft.tags, ph: 'meta ads, anúncios, captação', hint: 'Separe por vírgula.' })}
          <datalist id="dl-level">${levels.map(function (x) { return H`<option value="${x}"></option>`; })}</datalist>
          <datalist id="dl-cat">${catList.map(function (x) { return H`<option value="${x}"></option>`; })}</datalist>
        </section>
        <section class="panel stack" style="--gap:16px">
          ${panelHead('Descrição')}
          ${fld({ l: 'Resumo curto', t: 'textarea', f: 'short_desc', v: draft.short_desc, rows: 3, ph: 'Uma ou duas frases que aparecem no catálogo e na página de vendas.', hint: H`Ideal até 160 caracteres. ${counter('short_desc', 160, draft.short_desc)}` })}
          ${fld({ l: 'Descrição longa', t: 'textarea', f: 'description', v: draft.description, rows: 9, hint: 'Separe os parágrafos com uma linha em branco.' })}
          <div class="grid-2 ed-opts">
            ${sw({ l: 'Destaque na home', f: 'featured', v: draft.featured, hint: 'Aparece primeiro para os alunos.' })}
            ${fld({ l: 'Ordem na lista', f: 'order', t: 'number', v: draft.order, attrs: 'min="0" step="1" inputmode="numeric"', hint: 'Menor número aparece primeiro.' })}
          </div>
        </section>
      </div>
      ${!isNew ? H`<section class="panel danger-zone">
        <div class="min0"><h3 class="t-3">Arquivar curso</h3><p class="t-sm t-muted">O curso sai do catálogo, da página de vendas e da área dos alunos. Nada é apagado: as matrículas ficam guardadas e tudo volta se você mudar a situação para Rascunho, Publicado ou Em breve.</p></div>
        <button class="btn btn--danger" type="button" data-act="archive" ${draft.status === 'archived' ? raw('disabled') : ''}>${ic('trash')}Arquivar curso</button>
      </section>` : ''}`;
    }
    function paintSlug() {
      var el = $p('#slug-url'); if (!el) return;
      var s = draft.slug || B.slug(draft.title) || 'slug-do-curso';
      el.innerHTML = String(H`${B.siteUrl()}lp.html?c=<b>${s}</b>`);
    }
    var ST_HINT = { draft: 'Só você vê. A página de vendas fica fora do ar.', published: 'No catálogo e à venda na página de vendas.', coming_soon: 'Aparece no catálogo como “em breve”, sem compra.', archived: 'Fora do catálogo e da página de vendas.' };
    function paintStatusHint() { var el = $p('#st-hint'); if (el) el.textContent = ST_HINT[draft.status] || ''; }

    /* =================== aba: Visual =================== */
    function tabVisual() {
      return H`
      <div class="ed-grid">
        <section class="panel stack" style="--gap:18px">
          ${panelHead('Imagens', '', 'Sem imagem, o painel gera uma arte com o sigilo e o título do curso.')}
          ${imgField({ f: 'banner', l: 'Banner 16:9', v: draft.banner, shape: 'wide', hint: 'Sugestão: 1600 × 900. Aparece no catálogo e no topo da página.' })}
          ${imgField({ f: 'poster', l: 'Pôster 2:3', v: draft.poster, shape: 'tall', hint: 'Sugestão: 800 × 1200, para listas verticais.' })}
          ${imgField({ f: 'logo', l: 'Logo ou arte do título (PNG)', v: draft.logo, shape: 'logo', hint: 'PNG com fundo transparente.' })}
          ${sw({ l: 'Mostrar o título sobre a imagem', f: 'show_title', v: draft.show_title, hint: 'Desligue se a imagem já traz o título escrito.' })}
        </section>
        <div class="stack" style="--gap:20px">
          <section class="panel stack" style="--gap:16px">
            ${panelHead('Paleta e prévia ao vivo')}
            <div id="pal-box"></div>
            <div class="vis-pv">
              <figure class="vis-pv__wide"><div class="tile pv" id="pv-tile"></div><figcaption class="t-xs t-faint">Catálogo (16:9)</figcaption></figure>
              <figure class="vis-pv__tall"><div class="tile tile--tall pv" id="pv-poster"></div><figcaption class="t-xs t-faint">Pôster (2:3)</figcaption></figure>
            </div>
          </section>
          <section class="panel stack" style="--gap:16px">
            ${panelHead('Trailer e instrutor')}
            ${fld({ l: 'Trailer (endereço do vídeo)', f: 'trailer', t: 'url', v: draft.trailer, ph: 'https://www.youtube.com/watch?v=…', attrs: 'inputmode="url" autocomplete="off"', hint: H`<span id="trailer-hint"></span>` })}
            ${fld({ l: 'Instrutor', f: 'instructor_name', v: draft.instructor_name, ph: 'Nome de quem ensina', attrs: 'autocomplete="off"' })}
            ${fld({ l: 'Mini bio', t: 'textarea', f: 'instructor_bio', v: draft.instructor_bio, rows: 4, hint: 'A IA usa só o que estiver aqui para escrever a seção do instrutor.' })}
            ${imgField({ f: 'instructor_photo', l: 'Foto do instrutor', v: draft.instructor_photo, shape: 'round', hint: 'Quadrada, de preferência.' })}
          </section>
        </div>
      </div>`;
    }
    function paintPalette() {
      var box = $p('#pal-box'); if (!box) return;
      box.innerHTML = String(H`<div class="pals" role="radiogroup" aria-label="Paleta de cores">${B.PALETTES.map(function (p, i) {
        var on = draft.color !== '' && Number(draft.color) === i;
        return H`<button type="button" class="pal${on ? ' is-on' : ''}" role="radio" aria-checked="${String(on)}" data-act="pal" data-i="${i}" style="${B.palVars(p)}"><span class="pal__sw"></span><span class="pal__name">${p.name}</span></button>`;
      })}</div>`);
    }
    function paintVisual() {
      var t = $p('#pv-tile'), p = $p('#pv-poster'); if (!t || !p) return;
      t.innerHTML = B.art(art()); p.innerHTML = B.art(art(), { tall: true });
    }
    function paintTrailer() {
      var el = $p('#trailer-hint'); if (!el) return;
      var h = providerHint(draft.trailer);
      el.textContent = draft.trailer ? h.text : 'Opcional. YouTube, Vimeo, Panda Video, Google Drive ou MP4.';
      el.className = draft.trailer && !h.ok ? 't-bad' : '';
    }
    function paintImg(f) {
      var box = $p('[data-img="' + f + '"]'); if (!box) return;
      var v = getPath(draft, f) || '', inp = $('input[data-url]', box);
      $('[data-thumb]', box).innerHTML = String(imgThumb(v));
      $('[data-rm]', box).hidden = !v;
      if (document.activeElement !== inp) { inp.value = /^data:/i.test(v) ? '' : v; inp.placeholder = /^data:/i.test(v) ? 'Imagem enviada. Cole um endereço para trocar.' : 'ou cole o endereço da imagem'; }
    }

    /* =================== aba: Oferta =================== */
    function tabOferta() {
      var meth = draft.methods || [], opts = [];
      for (var i = 1; i <= 12; i++) opts.push([i, i === 1 ? '1x (à vista)' : i + 'x']);
      return H`
      <div class="ed-grid ed-grid--offer">
        <div class="stack" style="--gap:20px">
          <section class="panel stack" style="--gap:16px">
            ${panelHead('Preço e parcelas')}
            <div class="grid-2">
              ${fld({ l: 'Preço (R$)', f: 'price', t: 'number', v: draft.price, pre: 'R$', attrs: 'min="0" step="0.01" inputmode="decimal"', hint: 'Zero deixa o curso gratuito.' })}
              ${fld({ l: 'Preço âncora, o “de” (R$)', f: 'anchor_price', t: 'number', v: draft.anchor_price, pre: 'R$', attrs: 'min="0" step="0.01" inputmode="decimal"', hint: 'Aparece riscado ao lado do preço. Zero esconde.' })}
            </div>
            <div class="grid-2">
              ${fld({ l: 'Parcelas máximas no cartão', t: 'select', f: 'max_installments', v: draft.max_installments, opts: opts, attrs: 'data-num' })}
              <div class="field"><label>Formas de pagamento</label><div class="row pay-opts">${['pix', 'card'].map(function (m) { return H`<label class="check"><input type="checkbox" data-method="${m}"${raw(meth.indexOf(m) > -1 ? ' checked' : '')}><span>${m === 'pix' ? 'Pix' : 'Cartão'}</span></label>`; })}</div></div>
            </div>
            ${fld({ l: 'Oferta válida até', f: 'scarcity_until', t: 'date', v: B.dateInput(draft.scarcity_until), attrs: 'data-end', hint: 'Cria urgência real: a página mostra a data. Deixe vazio para não limitar.' })}
          </section>
          ${plusHtml('courseOffer', { draft: draft, course: course, isNew: isNew, cats: cats, rate: rate })}
          <section class="panel stack" style="--gap:16px">
            ${panelHead('Acesso e garantia')}
            <div class="grid-2">
              ${fld({ l: 'Garantia (dias)', f: 'guarantee_days', t: 'number', v: draft.guarantee_days, post: 'dias', attrs: 'min="0" max="60" step="1" inputmode="numeric"', hint: 'Até 60. Os reembolsos e as comissões respeitam esse prazo.' })}
              ${fld({ l: 'Acesso (dias)', f: 'access_days', t: 'number', v: draft.access_days, post: 'dias', attrs: 'min="0" max="3650" step="1" inputmode="numeric"', hint: 'Zero é acesso vitalício.' })}
            </div>
          </section>
          <section class="panel stack" style="--gap:16px">
            ${panelHead('Checkout e suporte')}
            ${fld({ l: 'Checkout externo (opcional)', f: 'checkout_url', t: 'url', v: draft.checkout_url, ph: 'https://pay.hotmart.com/…', attrs: 'inputmode="url" autocomplete="off"', hint: 'Se preenchido, o botão da página leva para este link (Hotmart, Kiwify…) em vez do checkout da plataforma.' })}
            ${fld({ l: 'Link de suporte', f: 'support_url', t: 'url', v: draft.support_url, ph: 'https://wa.me/55…', attrs: 'inputmode="url" autocomplete="off"', hint: 'Vazio usa o WhatsApp e o e-mail das Configurações.' })}
          </section>
        </div>
        <aside class="panel hud offer-pv" aria-label="Prévia da ancoragem">
          ${panelHead('Prévia da ancoragem', '', 'É assim que o preço aparece na página.')}
          <div id="offer-pv"></div>
        </aside>
      </div>`;
    }
    function paintOffer() {
      var el = $p('#offer-pv'); if (!el) return;
      var p = Number(draft.price) || 0, a = Number(draft.anchor_price) || 0, n = Math.max(1, Math.min(12, Number(draft.max_installments) || 1)), m = draft.methods || [];
      if (p <= 0) { el.innerHTML = String(H`<div class="opv"><div class="opv__big">Gratuito</div><p class="t-sm t-muted">Sem preço, o curso é liberado de graça no cadastro. Informe um preço para vender.</p></div>`); return; }
      var parts = [];
      parts.push(a > p ? H`De <s class="t-strike">${money(a)}</s> por <b class="opv__now">${money(p)}</b>` : H`Por <b class="opv__now">${money(p)}</b>`);
      if (m.indexOf('card') > -1 && n > 1) parts.push(H`ou <b>${n}x de ${money(B.installment(p, n, rate))}</b>* no cartão`);
      if (a > p) parts.push(H`economia de <b>${Math.round((1 - p / a) * 100)}%</b>`);
      var until = Number(draft.scarcity_until) || 0;
      el.innerHTML = String(H`<div class="opv">
        <p class="opv__line">${parts.map(function (x, i) { return H`${i ? raw('<span class="opv__sep"> · </span>') : ''}${x}`; })}</p>
        <div class="opv__chips">${m.indexOf('pix') > -1 ? chip('Pix na hora', 'ok', 'pix') : ''}${m.indexOf('card') > -1 ? chip('Cartão', '', 'card') : ''}${draft.guarantee_days ? chip(draft.guarantee_days + ' dias de garantia', '', 'shield') : ''}${chip(Number(draft.access_days) ? draft.access_days + ' dias de acesso' : 'Acesso vitalício', '', 'unlock')}</div>
        ${until ? H`<p class="t-sm ${until < Date.now() ? 't-bad' : 't-muted'}">${until < Date.now() ? 'A data da oferta já passou: a urgência não aparece.' : 'Oferta válida até ' + B.fmt.date(until) + ' (' + B.fmt.rel(until) + ').'}</p>` : ''}
        ${m.indexOf('card') > -1 && n > 1 ? H`<p class="t-xs t-faint">* Parcelas com juros de ${B.fmt.pct(rate * 100, 2)} ao mês, como no checkout. Ajuste a taxa em Configurações > Mercado Pago. No Pix não há juros.</p>` : ''}
      </div>`);
    }

    /* =================== aba: Conteúdo =================== */
    function tabConteudo() {
      if (isNew || !course) {
        return H`<div class="panel">${emptyState('Salve o curso antes de adicionar conteúdo', 'Temporadas e aulas ficam ligadas ao curso. Dê um título na aba Essencial e toque em Criar curso.', H`<button class="btn btn--primary" type="button" data-act="save">${ic('check')}Criar curso</button>`, 'layers')}</div>`;
      }
      var seasons = course.seasons || [], st = course.stats || {};
      return H`
        <div class="mini-stats">
          <div><b class="t-num">${int(st.seasons || 0)}</b><span>${(st.seasons || 0) === 1 ? 'temporada' : 'temporadas'}</span></div>
          <div><b class="t-num">${int(st.lessons || 0)}</b><span>${(st.lessons || 0) === 1 ? 'aula' : 'aulas'}</span></div>
          <div><b class="t-num">${B.fmt.dur(st.minutes || 0)}</b><span>de conteúdo</span></div>
          <div class="mini-stats__act"><button class="btn btn--primary btn--sm" type="button" data-act="season-add">${ic('plus')}Nova temporada</button></div>
        </div>
        <div class="seasons">
          ${seasons.length ? seasons.map(seasonCard) : H`<div class="panel">${emptyState('Nenhuma temporada ainda', 'Comece criando a primeira temporada. Depois adicione as aulas dentro dela.', H`<button class="btn btn--primary" type="button" data-act="season-add">${ic('plus')}Criar a primeira temporada</button>`, 'layers')}</div>`}
        </div>`;
    }
    function releaseText(s) {
      if (s.release_mode === 'days' && s.release_days > 0) return ['Libera ' + s.release_days + (s.release_days === 1 ? ' dia' : ' dias') + ' após a compra', 'clock'];
      if (s.release_mode === 'date' && s.release_at) return ['Libera em ' + B.fmt.date(s.release_at), 'calendar'];
      return ['Liberada na compra', 'unlock'];
    }
    function seasonCard(s, si, all) {
      var open = openSeasons[s.id] !== false, ls = s.lessons || [], mins = ls.reduce(function (a, l) { return a + (Number(l.duration_min) || 0); }, 0), rel = releaseText(s), n = all.length;
      return H`<section class="season${open ? ' is-open' : ''}" data-season="${s.id}">
        <header class="season__head">
          <button type="button" class="season__toggle" data-act="season-toggle" data-id="${s.id}" aria-expanded="${String(open)}">${ic('down', 'season__chev')}<span class="season__n t-num">T${si + 1}</span><span class="season__title ellipsis">${s.title}</span></button>
          <span class="season__meta t-xs t-faint hide-sm">${plural(ls.length, 'aula', 'aulas')} · ${B.fmt.dur(mins)}</span>
          ${chip(rel[0], rel[1] === 'unlock' ? '' : 'mustard', rel[1])}
          <span class="season__acts">
            <button type="button" class="iconbtn iconbtn--sm" data-act="season-up" data-id="${s.id}" ${si === 0 ? raw('disabled') : ''} aria-label="Subir temporada" title="Subir">${ic('up')}</button>
            <button type="button" class="iconbtn iconbtn--sm" data-act="season-down" data-id="${s.id}" ${si === n - 1 ? raw('disabled') : ''} aria-label="Descer temporada" title="Descer">${ic('down')}</button>
            <button type="button" class="iconbtn iconbtn--sm" data-act="season-edit" data-id="${s.id}" aria-label="Editar temporada ${s.title}" title="Editar">${ic('edit')}</button>
            <button type="button" class="iconbtn iconbtn--sm iconbtn--bad" data-act="season-del" data-id="${s.id}" aria-label="Excluir temporada ${s.title}" title="Excluir">${ic('trash')}</button>
          </span>
        </header>
        <div class="season__body" ${open ? '' : raw('hidden')}>
          ${s.description ? H`<p class="season__desc t-sm t-muted">${s.description}</p>` : ''}
          ${ls.length ? H`<ol class="lessons">${ls.map(function (l, i) { return lessonRow(l, i, ls.length, s, si); })}</ol>` : H`<p class="hint lessons__empty">Nenhuma aula nesta temporada.</p>`}
          <div class="season__foot"><button class="btn btn--sm" type="button" data-act="lesson-add" data-id="${s.id}">${ic('plus')}Adicionar aula</button></div>
        </div>
      </section>`;
    }
    function lessonRow(l, i, n, s, si) {
      var label = 'T' + (si + 1) + ':E' + (i + 1), prov = providerHint(l.video_url), mats = (l.materials || []).length;
      return H`<li class="lesson" data-lesson="${l.id}">
        <div class="lesson__order">
          <button type="button" class="iconbtn iconbtn--xs" data-act="lesson-up" data-id="${l.id}" data-s="${s.id}" ${i === 0 ? raw('disabled') : ''} aria-label="Subir aula ${l.title}">${ic('up')}</button>
          <button type="button" class="iconbtn iconbtn--xs" data-act="lesson-down" data-id="${l.id}" data-s="${s.id}" ${i === n - 1 ? raw('disabled') : ''} aria-label="Descer aula ${l.title}">${ic('down')}</button>
        </div>
        <div class="lesson__thumb">${raw(B.epArt(l, label, art()))}</div>
        <div class="lesson__main min0">
          <div class="lesson__title ellipsis"><span class="t-faint t-num">${label}</span> ${l.title}</div>
          <div class="lesson__meta">
            ${l.video_url ? (prov.ok ? chip(prov.name, '', 'video') : chip('Vídeo inválido', 'bad', 'alert')) : chip('Sem vídeo', 'warn', 'video')}
            <span class="t-xs t-faint t-num">${l.duration_min ? B.fmt.dur(l.duration_min) : 'sem duração'}</span>
            ${l.free_preview ? chip('Grátis', 'ok', 'gift') : ''}${mats ? H`<span class="t-xs t-faint">${plural(mats, 'material', 'materiais')}</span>` : ''}
          </div>
        </div>
        <div class="lesson__acts">
          <button type="button" class="iconbtn iconbtn--sm" data-act="lesson-edit" data-id="${l.id}" data-s="${s.id}" aria-label="Editar aula ${l.title}" title="Editar">${ic('edit')}</button>
          <button type="button" class="iconbtn iconbtn--sm iconbtn--bad" data-act="lesson-del" data-id="${l.id}" aria-label="Excluir aula ${l.title}" title="Excluir">${ic('trash')}</button>
        </div>
      </li>`;
    }
    function applyContent(c) {
      if (!c) return;
      course.seasons = c.seasons || []; course.stats = c.stats || course.stats;
      drop('courses');
      if (built.conteudo) buildTab('conteudo');
    }
    function findSeason(id) { return (course.seasons || []).filter(function (s) { return s.id === id; })[0]; }
    function findLesson(id) { var f = null; (course.seasons || []).forEach(function (s) { (s.lessons || []).forEach(function (l) { if (l.id === id) f = { l: l, s: s }; }); }); return f; }
    function move(table, ids, id, dir) {
      var i = ids.indexOf(id), j = i + dir; if (i < 0 || j < 0 || j >= ids.length) return Promise.resolve(false);
      var t = ids[i]; ids[i] = ids[j]; ids[j] = t;
      return B.api('adminReorder', { table: table, ids: ids }).then(function () { return B.api('adminCourse', { id: course.id }); }).then(function (r) { if (ctx.live()) applyContent(r.course); return true; });
    }

    function seasonModal(season) {
      var s = season || { title: '', description: '', release_mode: 'now', release_days: 7, release_at: 0 };
      var m = B.modal({
        title: season ? 'Editar temporada' : 'Nova temporada',
        body: String(H`<form class="stack" style="--gap:14px" novalidate>
          ${fld({ l: 'Título', n: 'title', v: s.title, req: true, ph: 'Ex.: O Campo de Batalha', attrs: 'maxlength="120" autocomplete="off"' })}
          ${fld({ l: 'Descrição', t: 'textarea', n: 'description', v: s.description, rows: 3, ph: 'Uma frase sobre o que a temporada entrega.' })}
          ${fld({ l: 'Liberação', t: 'select', n: 'release_mode', v: s.release_mode || 'now', opts: [['now', 'Imediata, junto com a compra'], ['days', 'Alguns dias depois da compra'], ['date', 'Em uma data fixa']] })}
          <div data-rel="days" ${s.release_mode === 'days' ? '' : raw('hidden')}>${fld({ l: 'Dias após a compra', n: 'release_days', t: 'number', v: s.release_days || 7, attrs: 'min="1" max="3650" step="1" inputmode="numeric"', hint: 'Conta a partir do dia em que o aluno entrou.' })}</div>
          <div data-rel="date" ${s.release_mode === 'date' ? '' : raw('hidden')}>${fld({ l: 'Data de liberação', n: 'release_at', t: 'date', v: B.dateInput(s.release_at), hint: 'Libera para todos os alunos nesse dia, a partir da meia-noite.' })}</div>
        </form>`),
        actions: [{ label: 'Cancelar' }, {
          label: season ? 'Salvar temporada' : 'Criar temporada', kind: 'primary',
          onClick: function (mm) {
            var f = B.$('form', mm.el), v = B.formData(f), err = B.$('[data-err="title"]', mm.el);
            if (String(v.title || '').trim().length < 1) { err.textContent = 'Dê um nome à temporada.'; err.hidden = false; B.$('[name=title]', mm.el).focus(); return false; }
            var o = { course_id: course.id, title: v.title, description: v.description, release_mode: v.release_mode, release_days: v.release_mode === 'days' ? Number(v.release_days) || 1 : 0, release_at: v.release_mode === 'date' ? v.release_at : 0 };
            if (o.release_mode === 'date' && !o.release_at) { var e2 = B.$('[data-err="release_at"]', mm.el); e2.textContent = 'Escolha a data de liberação.'; e2.hidden = false; return false; }
            if (season) o.id = season.id;
            return B.api('adminSeasonSave', { season: o }).then(function (r) { applyContent(r.course); B.toast(season ? 'Temporada salva' : 'Temporada criada', 'ok'); });
          }
        }]
      });
      guardForm(m);
      var sel = B.$('[name=release_mode]', m.el);
      sel.addEventListener('change', function () { B.$$('[data-rel]', m.el).forEach(function (w) { w.hidden = w.dataset.rel !== sel.value; }); });
    }

    function lessonModal(lesson, seasonId) {
      var l = lesson || { title: '', description: '', video_url: '', duration_min: '', thumb: '', materials: [], free_preview: false, xp: 50 };
      var mats = clone(l.materials || []);
      var seasonOpts = (course.seasons || []).map(function (s, i) { return [s.id, 'T' + (i + 1) + ' · ' + s.title]; });
      function matsHTML() {
        return String(H`${mats.map(function (x, i) {
          return H`<div class="mat-row"><input class="input" data-mat="name" data-i="${i}" value="${x.name || ''}" placeholder="Nome (ex.: Planilha)" aria-label="Nome do material ${i + 1}"><input class="input" data-mat="url" data-i="${i}" type="url" value="${x.url || ''}" placeholder="https://…" aria-label="Link do material ${i + 1}" inputmode="url"><button type="button" class="iconbtn iconbtn--sm" data-m="mat-rm" data-i="${i}" aria-label="Remover material ${i + 1}">${ic('trash')}</button></div>`;
        })}${mats.length ? '' : H`<p class="hint">Nenhum material. Adicione PDFs, planilhas ou links de apoio.</p>`}`);
      }
      var m = B.modal({
        title: lesson ? 'Editar aula' : 'Nova aula', size: 'wide',
        body: String(H`<form class="stack" style="--gap:14px" novalidate>
          ${fld({ l: 'Título da aula', n: 'title', v: l.title, req: true, ph: 'Ex.: Pixel e API de Conversões', attrs: 'maxlength="160" autocomplete="off"' })}
          ${fld({ l: 'Descrição', t: 'textarea', n: 'description', v: l.description, rows: 3, ph: 'O que o aluno aprende nesta aula.' })}
          ${fld({ l: 'Endereço do vídeo', n: 'video_url', t: 'url', v: l.video_url, ph: 'https://www.youtube.com/watch?v=…', attrs: 'inputmode="url" autocomplete="off"', hint: H`<span id="vhint"></span>` })}
          <div class="grid-3 les-grid">
            ${fld({ l: 'Duração (minutos)', n: 'duration_min', t: 'number', v: l.duration_min, attrs: 'min="0" max="1000" step="1" inputmode="numeric"' })}
            ${fld({ l: 'XP ao concluir', n: 'xp', t: 'number', v: l.xp == null ? 50 : l.xp, attrs: 'min="0" max="1000" step="10" inputmode="numeric"' })}
            ${fld({ l: 'Temporada', t: 'select', n: 'season_id', v: seasonId, opts: seasonOpts })}
          </div>
          <div class="field">
            <label for="les-thumb">Miniatura</label>
            <div class="input-group"><input class="input" id="les-thumb" name="thumb" type="url" value="${/^data:/i.test(l.thumb || '') ? '' : (l.thumb || '')}" placeholder="${/^data:/i.test(l.thumb || '') ? 'Imagem enviada. Cole um endereço para trocar.' : 'https://… (opcional)'}" inputmode="url"><button type="button" class="btn btn--sm addon-btn" data-m="thumb-up" aria-label="Enviar miniatura">${ic('upload')}Enviar</button></div>
            <div class="hint">No YouTube a miniatura vem sozinha. Sem miniatura, o painel gera uma arte com o número do episódio.</div>
          </div>
          <div class="field"><label>Materiais de apoio</label><div class="mats" id="mats">${raw(matsHTML())}</div><div><button type="button" class="btn btn--sm btn--ghost" data-m="mat-add">${ic('plus')}Adicionar material</button></div></div>
          ${sw({ l: 'Aula grátis para quem ainda não comprou', n: 'free_preview', v: l.free_preview, hint: 'Aparece como “Assistir grátis” na página de vendas.' })}
        </form>`),
        actions: [{ label: 'Cancelar' }, {
          label: lesson ? 'Salvar aula' : 'Criar aula', kind: 'primary',
          onClick: function (mm) {
            var f = B.$('form', mm.el), v = B.formData(f), err = B.$('[data-err="title"]', mm.el);
            if (String(v.title || '').trim().length < 1) { err.textContent = 'Dê um título à aula.'; err.hidden = false; B.$('[name=title]', mm.el).focus(); return false; }
            var keepThumb = !v.thumb && /^data:/i.test(l.thumb || '') && !thumbChanged ? l.thumb : v.thumb;
            // miniatura que veio sozinha do YouTube acompanha o vídeo: se o vídeo mudou, deixa o servidor refazer
            if (lesson && !thumbChanged && /img\.youtube\.com\/vi\//.test(keepThumb || '') && String(v.video_url || '').trim() !== String(l.video_url || '').trim()) keepThumb = '';
            var o = { season_id: v.season_id, title: v.title, description: v.description, video_url: v.video_url, duration_min: Number(v.duration_min) || 0, thumb: keepThumb, materials: mats.filter(function (x) { return String(x.url || '').trim(); }), free_preview: !!v.free_preview, xp: v.xp === '' ? 50 : Number(v.xp) };
            if (lesson) o.id = lesson.id;
            return B.api('adminLessonSave', { lesson: o }).then(function (r) { applyContent(r.course); B.toast(lesson ? 'Aula salva' : 'Aula criada', 'ok'); });
          }
        }]
      });
      guardForm(m);
      var thumbChanged = false;
      var vh = B.$('#vhint', m.el), vi = B.$('[name=video_url]', m.el);
      function hint() { var h = providerHint(vi.value); vh.textContent = h.text; vh.className = vi.value && !h.ok ? 't-bad' : (h.ok ? 't-ok' : ''); }
      vi.addEventListener('input', hint); hint();
      B.$('#les-thumb', m.el).addEventListener('input', function () { thumbChanged = true; });
      B.on(m.body, 'click', '[data-m]', function (ev, el) {
        var a = el.dataset.m;
        if (a === 'mat-add') { mats.push({ name: '', url: '' }); B.$('#mats', m.el).innerHTML = matsHTML(); var ins = B.$$('[data-mat="name"]', m.el); ins[ins.length - 1].focus(); }
        else if (a === 'mat-rm') { mats.splice(Number(el.dataset.i), 1); B.$('#mats', m.el).innerHTML = matsHTML(); }
        else if (a === 'thumb-up') { chooseAndUpload(el, { maxW: 800 }).then(function (url) { if (url) { thumbChanged = true; var t = B.$('#les-thumb', m.el); t.value = /^data:/i.test(url) ? url : url; } }).catch(B.fail); }
      });
      m.body.addEventListener('input', function (ev) {
        var t = ev.target; if (!t.dataset || !t.dataset.mat) return;
        var x = mats[Number(t.dataset.i)]; if (x) x[t.dataset.mat] = t.value;
      });
    }

    /* =================== aba: Anúncios =================== */
    var adsDraft = null, adsSnap = '', adsInstr = '', adsRun = { running: false, warn: '', fresh: false }, adsGuides = false, adsFeed = true, adsArt = null, adsArtKey = '';
    function adsDirty() { return !!adsDraft && JSON.stringify(adsDraft.items) !== adsSnap; }
    function setAds(pack) { adsDraft = pack ? clone(pack) : null; adsSnap = adsDraft ? JSON.stringify(adsDraft.items) : ''; if (course) course.ads = pack; }
    // dados do curso para a arte: preço e cores do rascunho, números do curso salvo
    function adsCourse() {
      var o = Object.assign({}, course || {}, draft);
      ['price', 'anchor_price', 'max_installments', 'guarantee_days'].forEach(function (k) { o[k] = Number(o[k]) || 0; });
      o.id = course ? course.id : 'novo'; o.slug = course ? course.slug : B.slug(draft.title || 'curso'); o.stats = (course && course.stats) || {};
      return o;
    }
    function adsArtFor(c) {
      var key = [c.id, c.color, c.banner, c.poster, B.brand.name].join('|');
      if (!adsArt || adsArtKey !== key) { adsArtKey = key; adsArt = B.ads.prepare(c); }
      return adsArt;
    }
    function tabAds() {
      return H`<div class="stack" style="--gap:20px">
        <section class="panel hud lpgen adsgen" id="ads-gen" aria-live="polite"></section>
        <div class="ads-grid" id="ads-grid"></div>
      </div>`;
    }
    function adsStateText() {
      if (isNew) return 'Salve o curso para gerar os anúncios.';
      if (!adsDraft) return 'Ainda não há anúncios para este curso.';
      var m = adsDraft.meta || {}, bits = [m.source === 'ai' ? 'Escritos por IA' + (m.model ? ' (' + m.model + ')' : '') : 'Modelo automático'];
      if (m.generated_at) bits.push('gerados em ' + B.fmt.datetime(m.generated_at));
      if (m.edited_at) bits.push('editados por você em ' + B.fmt.datetime(m.edited_at));
      return bits.join(' · ');
    }
    function renderAdsGen() {
      var el = $p('#ads-gen'); if (!el) return;
      el.classList.toggle('is-running', adsRun.running);
      if (adsRun.running) {
        el.innerHTML = String(H`<div class="lpgen__run">
          <div class="lpgen__kicker">${ic('sparkles')}<span>Escrevendo 10 anúncios</span></div>
          <h2 class="lpgen__big">Forjando os criativos</h2>
          <div class="bar bar--thick ads-run" aria-hidden="true"><div class="bar__fill"></div></div>
          <p class="hint">Um ângulo por anúncio: promessa, dor, benefícios, oferta, conteúdo, garantia, público, antes e depois, prova e chamada final.</p>
        </div>`);
        return;
      }
      var has = !!(adsDraft && adsDraft.items && adsDraft.items.length);
      el.innerHTML = String(H`
        <div class="lpgen__top">
          <span class="lpgen__icon">${ic('image')}</span>
          <div class="min0"><h2 class="panel__title">Anúncios para Instagram e Facebook</h2><p class="t-sm t-muted">${adsStateText()}</p></div>
          <div class="lpgen__chip">${has ? H`<span class="chip chip--ok">${adsDraft.items.length} prontos</span>` : ''}</div>
        </div>
        ${adsRun.warn ? H`<div class="lpgen__warn" role="alert">${ic('alert')}<span>${adsRun.warn}</span></div>` : ''}
        ${adsRun.fresh ? H`<div class="lpgen__done" role="status">${ic('check')}<span>Anúncios prontos. Ajuste o texto de qualquer um em Editar e baixe o pacote.</span></div>` : ''}
        <div class="field">
          <label for="ads-instr">Instruções para a IA <span class="t-faint">(opcional)</span></label>
          <textarea class="textarea" id="ads-instr" rows="2" placeholder="Ex.: foco em mães empreendedoras, tom mais provocador">${raw('\n')}${adsInstr}</textarea>
        </div>
        <div class="row lpgen__acts">
          <button class="btn btn--primary btn--lg" type="button" data-act="ads-gen" ${isNew ? raw('disabled') : ''}>${ic('sparkles')}${has ? 'Gerar de novo com IA' : 'Gerar 10 anúncios com IA'}</button>
          <button class="btn btn--lg" type="button" data-act="ads-zip" ${has ? '' : raw('disabled')}>${ic('download')}Baixar pacote .zip</button>
          <button class="btn btn--ghost" type="button" id="ads-save" data-act="ads-save" ${adsDirty() ? '' : raw('disabled')}>${ic('check')}Salvar textos</button>
        </div>
        <div class="row ads-opts">
          <label class="check"><input type="checkbox" id="ads-guides" ${adsGuides ? raw('checked') : ''}><span>Mostrar a área segura 1080x1080</span></label>
          <label class="check"><input type="checkbox" id="ads-feed" ${adsFeed ? raw('checked') : ''}><span>Incluir no .zip o recorte 1080x1080 para o feed</span></label>
        </div>
        <p class="hint">Cada arte sai em 1080x1920 (Stories e Reels), com toda a informação no quadrado central de 1080x1080. Assim a mesma peça serve no feed. Preço, parcelas e garantia vêm da aba Oferta. O pacote traz as imagens, um textos.csv com legenda, título, descrição e link com UTM de cada anúncio, e um LEIA-ME.</p>`);
    }
    function paintAds() {
      var grid = $p('#ads-grid'); if (!grid) return;
      if (isNew) { grid.innerHTML = String(H`<div class="panel">${emptyState('Salve o curso primeiro', 'Depois de salvar, a plataforma escreve 10 anúncios e monta as artes para você baixar.', '', 'image')}</div>`); return; }
      if (!adsDraft || !adsDraft.items || !adsDraft.items.length) {
        grid.innerHTML = String(H`<div class="panel">${emptyState('Nenhum anúncio ainda', 'Gere os 10 anúncios com IA ou comece pelo modelo automático. As artes aparecem aqui.', H`<button class="btn" type="button" data-act="ads-reset">${ic('edit')}Usar o modelo automático</button>`, 'image')}</div>`);
        return;
      }
      grid.innerHTML = String(H`${adsDraft.items.map(function (a, i) {
        return H`<article class="adcard" style="--i:${i}">
          <div class="adcard__frame"><canvas class="adcard__cv" width="540" height="960" data-ad="${i}" role="img" aria-label="${'Anúncio ' + (i + 1) + ': ' + a.hook}"></canvas></div>
          <div class="adcard__meta">
            <div class="adcard__top"><span class="adcard__n">${String(i + 1).padStart(2, '0')}</span><span class="adcard__angle">${a.label}</span></div>
            <p class="adcard__head">${a.hook}</p>
            <div class="row adcard__acts">
              <button class="btn btn--sm" type="button" data-act="ad-edit" data-i="${i}">${ic('edit')}Editar</button>
              <button class="btn btn--sm btn--ghost" type="button" data-act="ad-png" data-i="${i}" aria-label="${'Baixar a imagem do anúncio ' + (i + 1)}">${ic('download')}JPG</button>
            </div>
          </div>
        </article>`;
      })}`);
      drawAdPreviews();
    }
    // desenha em tamanho real fora da tela e copia reduzido, um por quadro, sem travar a página
    function drawAdPreviews(only) {
      var c = adsCourse(), off = document.createElement('canvas');
      adsArtFor(c).then(function (art) {
        var list = $$('#ads-grid canvas[data-ad]', root).filter(function (cv) { return only == null || Number(cv.dataset.ad) === only; });
        (function next(k) {
          if (!ctx.live() || k >= list.length) return;
          var cv = list[k], ad = adsDraft && adsDraft.items[Number(cv.dataset.ad)];
          if (ad) {
            B.ads.draw(off, ad, c, art, { guides: adsGuides, rate: rate });
            var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(off, 0, 0, cv.width, cv.height);
            cv.classList.add('is-drawn');
          }
          requestAnimationFrame(function () { next(k + 1); });
        })(0);
      });
    }
    function generateAds(o) {
      o = o || {};
      if (adsRun.running || isNew || !course) return Promise.resolve();
      var pre = courseDirty() ? saveCourse({ stay: true }) : Promise.resolve();
      return pre.then(function () {
        adsRun = { running: true, warn: '', fresh: false }; renderAdsGen();
        var req = { course_id: course.id }; if (adsInstr.trim()) req.instructions = adsInstr.trim();
        return B.api('adminAdsGenerate', req).then(function (r) {
          if (!ctx.live()) return;
          setAds(r.ads);
          adsRun = { running: false, warn: r.warning || '', fresh: !r.warning };
          renderAdsGen(); paintAds(); refreshDirty();
          if (r.warning) B.toast(r.warning, 'info', 7000);
          else B.toast(o.auto ? 'Os 10 anúncios também estão prontos na aba Anúncios' : '10 anúncios prontos', 'ok');
        }, function (e) {
          if (!ctx.live()) return;
          adsRun = { running: false, warn: (e && e.message) || 'A geração falhou. Tente de novo.', fresh: false };
          renderAdsGen(); if (!o.auto) B.fail(e);
        });
      }, function () { /* já avisou */ });
    }
    function saveAds() {
      if (!adsDraft || !course) return Promise.resolve();
      return busy($p('#ads-save'), B.api('adminAdsSave', { course_id: course.id, items: adsDraft.items })).then(function (r) {
        if (!ctx.live()) return;
        setAds(r.ads); renderAdsGen(); refreshDirty(); B.toast('Anúncios salvos', 'ok');
      });
    }
    function adModal(i) {
      var a = clone(adsDraft.items[i]), c = adsCourse(), L = a.layout, off = document.createElement('canvas');
      function f(k, label, v, rows, hint) {
        var id = 'adf-' + k;
        return H`<div class="field"><label for="${id}">${label}</label>${rows ? H`<textarea class="textarea" id="${id}" data-k="${k}" rows="${rows}">${raw('\n')}${v || ''}</textarea>` : H`<input class="input" id="${id}" data-k="${k}" value="${v || ''}" autocomplete="off">`}${hint ? H`<div class="hint">${hint}</div>` : ''}</div>`;
      }
      var body = document.createElement('div');
      body.className = 'admodal';
      body.innerHTML = String(H`
        <div class="admodal__pv"><canvas class="adcard__cv is-drawn" width="540" height="960" role="img" aria-label="Prévia do anúncio"></canvas><p class="hint">A faixa de cima e a de baixo só levam textura. Tudo o que importa fica no quadrado central.</p></div>
        <div class="admodal__f stack" style="--gap:14px">
          <h3 class="admodal__sec">Na arte</h3>
          ${L === 'statement' || L === 'pain' ? f('kicker', 'Chamada curta (acima do texto grande)', a.kicker) : f('kicker', 'Etiqueta no canto', a.kicker)}
          ${f('hook', L === 'quote' ? 'Depoimento (texto real de aluno)' : L === 'offer' ? 'Nome do produto na arte' : 'Texto grande da arte', a.hook, 3, L === 'guarantee' ? 'Neste formato o número de dias é o destaque; este texto vai só na lista de anúncios.' : '')}
          ${L === 'quote' ? f('author', 'Nome de quem deu o depoimento', a.author) : ''}
          ${L === 'versus' ? f('before', 'Antes (um por linha)', (a.before || []).join('\n'), 3) : ''}
          ${L === 'list' || L === 'versus' ? f('bullets', L === 'versus' ? 'Depois (um por linha)' : 'Itens (um por linha, até 4)', (a.bullets || []).join('\n'), 4) : f('sub', 'Texto de apoio', a.sub, 2)}
          ${f('cta', 'Texto do botão', a.cta)}
          <h3 class="admodal__sec">No Meta Ads</h3>
          ${f('primary', 'Texto principal (legenda)', a.primary, 6, 'As primeiras 125 letras aparecem antes do “ver mais”.')}
          ${f('headline', 'Título (abaixo da imagem)', a.headline, 0, 'Até 40 caracteres.')}
          ${f('description', 'Descrição', a.description, 0, 'Até 30 caracteres.')}
        </div>`);
      var cv = $('canvas', body), artP = adsArtFor(c);
      function paint() { artP.then(function (art) { B.ads.draw(off, a, c, art, { guides: true, rate: rate }); var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(off, 0, 0, cv.width, cv.height); }); }
      var repaint = B.debounce(paint, 90);
      body.addEventListener('input', function (ev) {
        var k = ev.target.dataset.k; if (!k) return;
        a[k] = k === 'bullets' || k === 'before' ? B.lines(ev.target.value) : ev.target.value;
        repaint();
      });
      paint();
      B.modal({
        title: 'Anúncio ' + (i + 1) + ' · ' + a.label, size: 'xl', body: body,
        actions: [
          { label: 'Cancelar' },
          { label: 'Aplicar', kind: 'primary', icon: 'check', onClick: function () {
            if (!String(a.hook || '').trim()) { B.toast('O texto grande da arte não pode ficar vazio.', 'bad'); return false; }
            adsDraft.items[i] = a; renderAdsGen(); refreshDirty(); drawAdPreviews(i);
            var head = $p('.adcard[style="--i:' + i + '"] .adcard__head'); if (head) head.textContent = a.hook;
          } }
        ]
      });
    }

    /* =================== aba: Página de vendas =================== */
    var LP_SECS = [
      ['seo', 'SEO (Google)', [{ k: 'title', l: 'Título que aparece no Google', max: 60 }, { k: 'description', l: 'Descrição que aparece no Google', t: 'textarea', rows: 3, max: 160 }]],
      ['hero', 'Topo', [{ k: 'kicker', l: 'Chamada curta (acima do título)' }, { k: 'headline', l: 'Título principal' }, { k: 'subheadline', l: 'Subtítulo', t: 'textarea', rows: 3 }, { k: 'cta', l: 'Texto do botão' }, { k: 'note', l: 'Nota abaixo do botão' }]],
      ['pain', 'Dores', [{ k: 'title', l: 'Título da seção' }, { k: 'items', l: 'Dores (uma por linha)', t: 'lines', rows: 6 }]],
      ['promise', 'Promessa', [{ k: 'title', l: 'Título da seção' }, { k: 'text', l: 'Texto', t: 'textarea', rows: 4 }, { k: 'pillars', t: 'rep', rep: 'lp:promise.pillars' }]],
      ['modules', 'Conteúdo', [{ k: 'title', l: 'Título da seção' }, { k: 'intro', l: 'Introdução', t: 'textarea', rows: 3 }], 'A lista de temporadas e aulas vem do curso e entra sozinha na página.'],
      ['audience', 'Para quem é', [{ k: 'title', l: 'Título da seção' }, { k: 'for', l: 'É para quem (uma por linha)', t: 'lines', rows: 5 }, { k: 'not_for', l: 'Não é para quem (uma por linha)', t: 'lines', rows: 4 }]],
      ['instructor', 'Instrutor', [{ k: 'title', l: 'Título da seção' }, { k: 'text', l: 'Texto', t: 'textarea', rows: 4 }], 'O nome e a foto vêm da aba Visual.'],
      ['bonuses', 'Bônus', [{ k: 'title', l: 'Título da seção (vazio esconde)' }, { k: 'items', t: 'rep', rep: 'lp:bonuses.items' }]],
      ['offer', 'Oferta', [{ k: 'title', l: 'Título da seção' }, { k: 'bullets', l: 'O que está incluso (uma por linha)', t: 'lines', rows: 6 }, { k: 'cta', l: 'Texto do botão' }, { k: 'urgency', l: 'Frase de urgência (vazio esconde)' }], 'Preço, ancoragem e parcelas entram sozinhos a partir da aba Oferta.'],
      ['guarantee', 'Garantia', [{ k: 'title', l: 'Título da seção' }, { k: 'text', l: 'Texto', t: 'textarea', rows: 3 }]],
      ['faq', 'Perguntas', [{ t: 'rep', rep: 'lp:faq' }]],
      ['final_cta', 'Chamada final', [{ k: 'title', l: 'Título da seção' }, { k: 'text', l: 'Texto', t: 'textarea', rows: 3 }, { k: 'cta', l: 'Texto do botão' }]]
    ];
    function tabLP() {
      return H`<div class="lp-grid">
        <div class="lp-side stack" style="--gap:20px" id="lp-insumos"></div>
        <div class="lp-main stack" style="--gap:20px">
          <section class="panel hud lpgen" id="lp-gen" aria-live="polite"></section>
          <section class="lpview">
            <div class="lpview__bar">
              <div class="seg" role="group" aria-label="O que mostrar"><button type="button" data-act="view" data-v="preview" class="${view === 'preview' ? 'is-active' : ''}">Prévia</button><button type="button" data-act="view" data-v="sections" class="${view === 'sections' ? 'is-active' : ''}">Editar seções</button></div>
              <div class="seg" id="dev-seg" role="group" aria-label="Tamanho da tela" ${view === 'preview' ? '' : raw('hidden')}><button type="button" data-act="device" data-v="mobile" class="${device === 'mobile' ? 'is-active' : ''}">${ic('phone')}Celular</button><button type="button" data-act="device" data-v="desktop" class="${device === 'desktop' ? 'is-active' : ''}">${ic('globe')}Computador</button></div>
            </div>
            <div class="lpview__pane" id="lp-preview" ${view === 'preview' ? '' : raw('hidden')}></div>
            <div class="lpview__pane" id="lp-sections" ${view === 'sections' ? '' : raw('hidden')}></div>
          </section>
        </div>
      </div>`;
    }
    function renderInsumos() {
      var el = $p('#lp-insumos'); if (!el) return;
      el.innerHTML = String(H`
        <section class="panel stack" style="--gap:16px">
          ${panelHead('O que alimenta a IA', '', 'Quanto mais específico, melhor o texto. Preço, parcelas, temporadas e pixel entram sozinhos na página.')}
          ${fld({ l: 'Promessa principal', t: 'textarea', f: 'promise', v: draft.promise, rows: 2, ph: 'O resultado concreto que o aluno leva, de preferência com prazo.' })}
          ${fld({ l: 'Para quem é', t: 'textarea', f: 'audience', v: draft.audience, rows: 4, ph: 'Uma linha por item', hint: 'Uma linha por item.' })}
          ${fld({ l: 'Dores do público', t: 'textarea', f: 'pains', v: draft.pains, rows: 4, ph: 'Uma por linha, na voz de quem sente', hint: 'Uma por linha, na voz de quem sente.' })}
          ${fld({ l: 'Benefícios', t: 'textarea', f: 'benefits', v: draft.benefits, rows: 4, ph: 'Título: texto', hint: 'Uma por linha, no formato “Título: texto”.' })}
          ${fld({ l: 'Bônus', t: 'textarea', f: 'bonuses', v: draft.bonuses, rows: 3, ph: 'Título | descrição | valor', hint: 'Uma por linha, no formato “Título | descrição | valor”.' })}
        </section>
        <section class="panel stack" style="--gap:14px">
          ${panelHead('Perguntas frequentes')}
          <div data-rep-host="draft:faq">${repHTML('draft:faq', draft.faq)}</div>
        </section>
        <section class="panel stack" style="--gap:14px">
          ${panelHead('Depoimentos')}
          <div data-rep-host="draft:testimonials">${repHTML('draft:testimonials', draft.testimonials)}</div>
        </section>
        <section class="panel stack" style="--gap:16px">
          ${panelHead('Botão, rastreamento e SEO')}
          ${fld({ l: 'Texto do botão', f: 'cta_text', v: draft.cta_text, ph: 'Quero começar agora', attrs: 'maxlength="40" autocomplete="off"' })}
          ${fld({ l: 'Pixel da Meta deste curso', f: 'pixel_id', v: draft.pixel_id, ph: '1234567890123456', attrs: 'inputmode="numeric" autocomplete="off"', hint: 'Vazio usa o pixel padrão das Configurações. Só números.' })}
          ${fld({ l: 'Título de SEO', f: 'seo_title', v: draft.seo_title, attrs: 'maxlength="90" autocomplete="off"', hint: H`Aparece na aba do navegador e no Google. ${counter('seo_title', 60, draft.seo_title)}` })}
          ${fld({ l: 'Descrição de SEO', t: 'textarea', f: 'seo_desc', v: draft.seo_desc, rows: 3, hint: H`Resumo no resultado de busca. ${counter('seo_desc', 160, draft.seo_desc)}` })}
        </section>`);
    }

    /* ---- estado e geração com IA ---- */
    var STEPS = ['Lendo o curso', 'Escrevendo a promessa', 'Montando a oferta e a ancoragem', 'Respondendo objeções', 'Configurando pixel e links'];
    function lpStateText() {
      if (isNew) return 'Salve o curso para gerar a página de vendas.';
      var lp = lpDraft && !lpDirty() ? lpDraft : (course && course.lp) || lpDraft, m = lp && lp.meta;
      if (!lp) return 'A página usa o modelo automático: o texto é montado a partir dos dados do curso, sem IA.';
      var bits = [];
      if (m && m.source === 'ai') bits.push('Escrita por IA' + (m.model ? ' (' + m.model + ')' : ''));
      else bits.push('Modelo automático');
      if (m && m.generated_at) bits.push('gerada em ' + B.fmt.datetime(m.generated_at));
      if (m && m.edited_at) bits.push('editada por você em ' + B.fmt.datetime(m.edited_at));
      return bits.join(' · ');
    }
    function renderGen() {
      var el = $p('#lp-gen'); if (!el) return;
      if (gen.running) {
        el.classList.add('is-running');
        el.innerHTML = String(H`
          <div class="lpgen__run">
            <div class="lpgen__kicker">${ic('sparkles')}<span>${gen.section ? 'Reescrevendo a seção' : 'Escrevendo a página de vendas'}</span></div>
            <h2 class="lpgen__big">Forjando a sua página</h2>
            <ol class="steps" id="gen-steps">${STEPS.map(function (s, i) { return H`<li class="steps__it" data-step="${i}"><span class="steps__mark">${ic('check')}<i class="steps__dot"></i></span><span>${s}</span></li>`; })}</ol>
            <div class="bar bar--thick" aria-hidden="true"><div class="bar__fill" id="gen-bar" style="--p:4%"></div></div>
            <p class="hint">Costuma levar de 10 a 40 segundos. Pode deixar esta tela aberta.</p>
          </div>`);
        paintSteps();
        return;
      }
      el.classList.remove('is-running');
      var lp = lpDraft || (course && course.lp), src = lp && lp.meta && lp.meta.source;
      el.innerHTML = String(H`
        <div class="lpgen__top">
          <span class="lpgen__icon">${ic('sparkles')}</span>
          <div class="min0"><h2 class="panel__title">Página de vendas</h2><p class="t-sm t-muted">${lpStateText()}</p></div>
          <div class="lpgen__chip">${lpChip(isNew ? '' : (course && course.lp_status))}</div>
        </div>
        ${gen.warn ? H`<div class="lpgen__warn" role="alert">${ic('alert')}<span>${gen.warn}</span></div>` : ''}
        ${gen.fresh ? H`<div class="lpgen__done" role="status">${ic('check')}<span>Página pronta. Confira a prévia ao lado e ajuste o que quiser nas seções.</span></div>` : ''}
        <div class="field">
          <label for="lp-instr">Instruções para a IA <span class="t-faint">(opcional)</span></label>
          <textarea class="textarea" id="lp-instr" rows="2" placeholder="Ex.: tom mais agressivo, foco em donos de loja">${raw('\n')}${genInstr}</textarea>
        </div>
        <div class="row lpgen__acts">
          <button class="btn btn--primary btn--lg" type="button" data-act="gen" ${isNew ? raw('disabled') : ''}>${ic('sparkles')}Gerar página com IA</button>
          <button class="btn btn--ghost" type="button" data-act="lp-reset" ${(!isNew && (course && (course.lp || lpDraft))) ? '' : raw('disabled')}>${ic('refresh')}Voltar ao modelo automático</button>
        </div>
        <p class="hint">A IA lê os dados do curso, as temporadas e as aulas. Preço, parcelas, temporadas e pixel entram sozinhos na página: você só cuida do texto.${src === 'template' ? ' A última tentativa usou o modelo automático.' : ''}</p>`);
    }
    function paintSteps() {
      var li = $$('#gen-steps [data-step]', root); if (!li.length) return;
      li.forEach(function (x, i) {
        var done = gen.step > i, active = gen.step === i;
        x.classList.toggle('is-done', done); x.classList.toggle('is-active', active);
        if (active) x.setAttribute('aria-current', 'step'); else x.removeAttribute('aria-current');
      });
      var bar = $p('#gen-bar'); if (bar) bar.style.setProperty('--p', Math.min(100, Math.round((gen.step + 0.4) / STEPS.length * 100)) + '%');
    }
    // avança as etapas sozinho enquanto a API trabalha e termina todas quando ela responde
    function runProgress(promise) {
      return new Promise(function (resolve, reject) {
        var finished = false, tm = null;
        gen.step = 0; paintSteps();
        function tick() { if (finished) return; if (gen.step < STEPS.length - 1) { gen.step++; paintSteps(); tm = later(tick, 1500 + gen.step * 700); } }
        tm = later(tick, 1100);
        promise.then(function (v) {
          finished = true; clearTimeout(tm);
          (function flush() {
            if (!ctx.live()) return resolve(v);
            if (gen.step < STEPS.length) { gen.step++; paintSteps(); later(flush, gen.step >= STEPS.length ? 500 : 260); }
            else resolve(v);
          })();
        }, function (e) { finished = true; clearTimeout(tm); reject(e); });
      });
    }
    function afterLPChange(lp, status) {
      course.lp = lp; if (status != null) course.lp_status = status;
      course.lp_updated_at = Date.now();
      lpDraft = lp ? clone(lp) : null; lpSnap = lpDraft ? JSON.stringify(lpDraft) : '';
      drop('courses');
    }
    function generate(o) {
      o = o || {};
      if (gen.running || isNew || !course) return;
      var go2 = function () {
        gen = { running: true, step: 0, warn: '', fresh: false, section: o.section || '' };
        renderGen();
        var host = $p('#lp-gen');
        if (host && !o.section) embers = B.embers(host, { count: 64 });
        if (host && host.scrollIntoView) host.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        var req = { course_id: course.id }; if (o.section) req.section = o.section; if (genInstr.trim()) req.instructions = genInstr.trim();
        return runProgress(B.api('adminLPGenerate', req)).then(function (r) {
          if (embers) { embers.stop(); embers = null; }
          if (!ctx.live()) return;
          afterLPChange(r.lp, 'generated');
          gen = { running: false, step: 0, warn: r.warning || '', fresh: !r.warning && r.source === 'ai', section: '' };
          if (o.section) openSecs[o.section] = true;
          renderGen(); renderSections(); reloadPreview(); refreshDirty();
          if (r.warning) B.toast(r.warning, 'info', 7000);
          else B.toast(o.section ? 'Seção reescrita' : 'Página gerada', 'ok');
          if (!o.section && view !== 'preview') setView('preview');
          if (o.auto) generateAds({ auto: true });
        }, function (e) {
          if (embers) { embers.stop(); embers = null; }
          if (!ctx.live()) return;
          if (o.auto) generateAds({ auto: true });
          gen = { running: false, step: 0, warn: (e && e.message) || 'A geração falhou. Tente de novo.', fresh: false, section: '' };
          renderGen(); B.fail(e);
        });
      };
      // a IA lê os dados salvos: grava antes se houver alterações no curso ou na página
      var pre = Promise.resolve();
      if (courseDirty()) pre = saveCourse({ stay: true });
      if (lpDirty() && o.section) pre = pre.then(function () { return B.api('adminLPSave', { course_id: course.id, lp: lpDraft }).then(function (r) { afterLPChange(r.lp, 'reviewed'); }); });
      return pre.then(go2, function () { /* já avisou */ });
    }

    /* ---- editor por seção ---- */
    function secSummary(key) {
      var v = lpDraft && lpDraft[key]; if (!v) return '';
      if (key === 'faq') return plural((v || []).length, 'pergunta', 'perguntas');
      if (key === 'pain') return plural((v.items || []).length, 'dor', 'dores');
      if (key === 'bonuses') return (v.items || []).length ? plural(v.items.length, 'bônus', 'bônus') : 'sem bônus';
      return trunc(v.headline || v.title || v.text || '', 60);
    }
    function secField(key, f) {
      if (f.t === 'rep') return H`<div data-rep-host="${f.rep}">${repHTML(f.rep, getPath(lpDraft, REPS[f.rep].path))}</div>`;
      var path = key + '.' + f.k, val = getPath(lpDraft, path);
      if (f.t === 'lines') return fld({ l: f.l, t: 'textarea', lp: path, v: (Array.isArray(val) ? val : []).join('\n'), rows: f.rows || 4, attrs: 'data-lines' });
      var o = { l: f.l, lp: path, v: val == null ? '' : val };
      if (f.t) o.t = f.t; if (f.rows) o.rows = f.rows;
      if (f.max) o.hint = H`${counter('lp:' + path, f.max, o.v)}`;
      return fld(o);
    }
    function renderSections() {
      var el = $p('#lp-sections'); if (!el) return;
      if (isNew) { el.innerHTML = String(H`<div class="panel">${emptyState('Salve o curso primeiro', 'Depois de salvar, a IA gera a página e você edita cada seção aqui.', '', 'edit')}</div>`); return; }
      if (!lpDraft) {
        el.innerHTML = String(H`<div class="panel">${emptyState('Esta página usa o modelo automático', 'Gere com IA para ter um texto sob medida ou personalize o modelo seção por seção.', H`<button class="btn" type="button" data-act="lp-template">${ic('edit')}Editar o modelo automático</button>`, 'sparkles')}</div>`);
        return;
      }
      el.innerHTML = String(H`
        <div class="lpsec-bar"><p class="t-sm t-muted">Edite o texto de cada seção. Salve para a página usar as mudanças.</p><button class="btn btn--primary btn--sm" type="button" id="lp-save" data-act="lp-save" ${lpDirty() ? '' : raw('disabled')}>${ic('check')}Salvar página</button></div>
        <div class="accs">${LP_SECS.map(function (def) {
          var key = def[0], open = !!openSecs[key];
          return H`<section class="acc${open ? ' is-open' : ''}" data-sec="${key}">
            <button type="button" class="acc__head" data-act="sec-toggle" data-k="${key}" aria-expanded="${String(open)}"><span class="acc__title">${def[1]}</span><span class="acc__sum ellipsis">${secSummary(key)}</span>${ic('down', 'acc__chev')}</button>
            <div class="acc__body" ${open ? '' : raw('hidden')}>
              ${def[2].map(function (f) { return secField(key, f); })}
              ${def[3] ? H`<p class="hint">${def[3]}</p>` : ''}
              <div class="acc__foot"><button class="btn btn--sm btn--ghost" type="button" data-act="sec-ai" data-k="${key}">${ic('sparkles')}Reescrever com IA</button></div>
            </div>
          </section>`;
        })}</div>`);
    }
    function loadTemplate(btn) {
      return busy(btn, B.api('landing', { slug: course.slug, preview: true }).then(function (r) {
        if (!ctx.live()) return;
        lpDraft = clone(r.lp); lpSnap = ''; openSecs = { hero: true };
        renderSections(); renderGen(); refreshDirty();
        B.toast('Modelo carregado. Edite e salve a página.', 'info');
      })).catch(B.fail);
    }

    /* ---- prévia ---- */
    function pvSrc() { return pageLink(course.slug, '&preview=1&_=' + Date.now()); }
    function initPreview() {
      var el = $p('#lp-preview'); if (!el) return;
      if (isNew) { el.innerHTML = String(H`<div class="panel">${emptyState('A prévia aparece depois de salvar', 'Crie o curso e a página de vendas é gerada automaticamente.', '', 'eye')}</div>`); return; }
      var visible = draft.status === 'published' || draft.status === 'coming_soon';
      el.innerHTML = String(H`
        <div class="pv-stage" id="pv-stage"><div class="pv-scaler" id="pv-scaler"><iframe id="pv-iframe" title="Prévia da página de vendas" src="${pvSrc()}"></iframe></div></div>
        <div class="pv-links">
          <a class="btn btn--sm" href="${B.safeUrl(pageLink(course.slug, visible ? '' : '&preview=1'))}" target="_blank" rel="noopener">${ic('external')}Abrir página</a>
          <button class="btn btn--sm btn--ghost" type="button" data-copy="${siteLink(course.slug)}">${ic('link')}Copiar link de vendas</button>
          <button class="btn btn--sm btn--ghost" type="button" data-copy="${siteLink(course.slug, '&checkout=1')}">${ic('cart')}Copiar link de checkout direto</button>
          <button class="btn btn--sm btn--ghost" type="button" data-act="lp-publish">${ic('upload')}Publicar versão estática no GitHub</button>
        </div>
        <div class="pv-static" id="pv-static"></div>
        ${!visible ? H`<p class="hint">Este curso ainda não está publicado. A prévia mostra a página só para você; publique na aba Essencial para vender.</p>` : ''}`);
      paintStatic();
      var stage = $p('#pv-stage');
      if (stage && 'ResizeObserver' in window) { var lw = stage.clientWidth; ro = new ResizeObserver(function () { if (Math.abs(stage.clientWidth - lw) > 4) { lw = stage.clientWidth; fitPreview(); } }); ro.observe(stage); }
      fitPreview();
    }
    function paintStatic() {
      var el = $p('#pv-static'); if (!el) return;
      var u = (course && (course.lp_static_url || (course.links && course.links.static))) || '';
      el.innerHTML = u ? String(H`<span class="t-xs t-faint">Versão estática:</span> <a class="ellipsis" href="${B.safeUrl(u)}" target="_blank" rel="noopener">${u}</a> ${copyBtn(u, 'Copiar endereço da versão estática')}`) : '';
    }
    function fitPreview() {
      var stage = $p('#pv-stage'), sc = $p('#pv-scaler'), fr = $p('#pv-iframe'); if (!stage || !sc || !fr || stage.offsetParent === null) return;
      var W = stage.clientWidth || 360, dw = device === 'mobile' ? 390 : 1280, ph = device === 'mobile' ? 700 : 560, k = Math.min(1, (W - 2) / dw);
      stage.style.height = ph + 'px';
      sc.style.width = Math.round(dw * k) + 'px'; sc.style.height = ph + 'px';
      sc.classList.toggle('is-phone', device === 'mobile');
      fr.style.width = dw + 'px'; fr.style.height = Math.round(ph / k) + 'px'; fr.style.transform = 'scale(' + k + ')';
    }
    function reloadPreview() { var fr = $p('#pv-iframe'); if (fr && course) fr.src = pvSrc(); }
    function setView(v) {
      view = v;
      $$('[data-act="view"]', root).forEach(function (b) { b.classList.toggle('is-active', b.dataset.v === v); });
      var pv = $p('#lp-preview'), sx = $p('#lp-sections'), dv = $p('#dev-seg');
      if (pv) pv.hidden = v !== 'preview'; if (sx) sx.hidden = v !== 'sections'; if (dv) dv.hidden = v !== 'preview';
      if (v === 'preview') fitPreview();
    }

    /* =================== aba: Afiliação =================== */
    function tabAfiliacao() {
      return H`<div class="ed-grid">
        <section class="panel stack" style="--gap:16px">
          ${panelHead('Programa de afiliados')}
          ${sw({ l: 'Aceitar afiliados neste curso', f: 'aff_enabled', v: draft.aff_enabled, hint: 'Ligado e com o curso publicado, o curso aparece para afiliados pedirem acesso.' })}
          <div class="grid-2">
            ${fld({ l: 'Comissão (%)', f: 'aff_commission', t: 'number', v: draft.aff_commission, post: '%', attrs: 'min="0" max="90" step="1" inputmode="numeric"', hint: 'Percentual do valor pago. Máximo 90.' })}
            ${fld({ l: 'Duração do cookie (dias)', f: 'aff_cookie_days', t: 'number', v: draft.aff_cookie_days, attrs: 'min="1" max="365" step="1" inputmode="numeric"', hint: 'Por quanto tempo a venda ainda conta para o afiliado depois do clique.' })}
          </div>
          ${sw({ l: 'Aprovar afiliações automaticamente', f: 'aff_auto', v: draft.aff_auto, hint: 'Desligado, cada pedido espera a sua aprovação em Afiliados.' })}
          ${fld({ l: 'Link dos materiais de divulgação', f: 'aff_materials', t: 'url', v: draft.aff_materials, ph: 'https://drive.google.com/…', attrs: 'inputmode="url" autocomplete="off"', hint: 'Pasta com criativos, textos e vídeos que o afiliado pode usar.' })}
        </section>
        <section class="panel panel--flush">
          <div class="aff-head">${panelHead('Afiliados deste curso', '', 'A comissão personalizada vale só para este curso. Vazio usa o padrão do curso.')}</div>
          <div id="aff-list">${skel(120)}</div>
        </section>
      </div>`;
    }
    function loadAffList(force) {
      if (isNew || !course) { var h = $p('#aff-list'); if (h) h.innerHTML = String(emptyState('Salve o curso primeiro', 'Os afiliados aparecem aqui depois que o curso for criado.', '', 'users')); return; }
      getAffiliates(force !== false).then(function (res) {
        if (!ctx.live()) return;
        S.counts.aff = (res.pending || []).length; paintCounts();
        affRows = [];
        (res.affiliates || []).forEach(function (a) { (a.affiliations || []).forEach(function (x) { if (x.course_id === course.id) affRows.push({ p: a, a: x }); }); });
        // pedidos pendentes de quem ainda não tem o papel de afiliado também aparecem aqui
        (res.pending || []).forEach(function (q) {
          if (!q.course || q.course.id !== course.id || !q.user) return;
          if (affRows.some(function (r) { return r.a.id === q.id; })) return;
          affRows.push({ p: { name: q.user.name, email: q.user.email, aff_code: q.user.aff_code }, a: { id: q.id, status: 'pending', commission: 0, default_commission: q.course.aff_commission } });
        });
        paintAffList();
      }).catch(function (e) { var h = $p('#aff-list'); if (ctx.live() && h) h.innerHTML = String(errorState(e, 'aff-retry')); });
    }
    function paintAffList() {
      var el = $p('#aff-list'); if (!el || !affRows) return;
      if (!affRows.length) { el.innerHTML = String(emptyState('Nenhum afiliado neste curso ainda', draft.aff_enabled ? 'Quando alguém pedir afiliação, o pedido aparece aqui e em Afiliados.' : 'Ligue “Aceitar afiliados” e salve para abrir o programa deste curso.', '', 'users')); return; }
      el.innerHTML = String(H`<div class="table-wrap table-wrap--bare"><table class="table table--dense">
        <thead><tr><th>Afiliado</th><th>Status</th><th class="num">Comissão</th><th></th></tr></thead>
        <tbody>${affRows.map(function (r) {
          var a = r.a, p = r.p, st = a.status;
          return H`<tr>
            <td><div class="ellipsis cell-name"><b>${p.name}</b></div><div class="t-xs t-faint ellipsis">${p.aff_code ? p.aff_code + ' · ' : ''}${p.email}</div></td>
            <td>${stChip(AFF_ST, st)}</td>
            <td class="num"><div class="input-group aff-comm"><input class="input" type="number" min="0" max="90" step="1" inputmode="numeric" data-aff-comm="${a.id}" data-orig="${a.commission || 0}" value="${a.commission > 0 ? a.commission : ''}" placeholder="${draft.aff_commission || a.default_commission}" aria-label="Comissão personalizada de ${p.name}"><span class="addon addon--end">%</span></div></td>
            <td class="num"><div class="row row--end" style="--gap:6px;justify-content:flex-end">
              ${st === 'pending' ? H`<button class="btn btn--sm" type="button" data-act="aff-set" data-id="${a.id}" data-st="approved">Aprovar</button><button class="btn btn--sm btn--danger" type="button" data-act="aff-set" data-id="${a.id}" data-st="rejected">Recusar</button>` : ''}
              ${st === 'approved' ? H`<button class="btn btn--sm btn--danger" type="button" data-act="aff-set" data-id="${a.id}" data-st="blocked">Bloquear</button>` : ''}
              ${st === 'rejected' || st === 'blocked' ? H`<button class="btn btn--sm" type="button" data-act="aff-set" data-id="${a.id}" data-st="approved">${st === 'blocked' ? 'Desbloquear' : 'Aprovar'}</button>` : ''}
            </div></td>
          </tr>`;
        })}</tbody></table></div>`);
    }

    /* =================== salvar =================== */
    function markErr(path, msg) {
      var e = $p('[data-err="' + path + '"]');
      if (e) { e.textContent = msg; e.hidden = !msg; }
      var i = $p('[data-f="' + path + '"]'); if (i) i.classList.toggle('is-invalid', !!msg);
    }
    function validate() {
      if (String(draft.title || '').trim().length < 2) {
        setTab('essencial'); markErr('title', 'Dê um título ao curso.'); var t = $p('[data-f="title"]'); if (t) t.focus();
        return 'Dê um título ao curso.';
      }
      if (!(draft.methods || []).length) { setTab('oferta'); return 'Escolha ao menos uma forma de pagamento (Pix ou Cartão).'; }
      var cu = String(draft.checkout_url || '').trim(); if (cu && !/^https?:\/\//i.test(cu)) { setTab('oferta'); return 'O checkout externo precisa começar com https://'; }
      var po = plus('courseOfferValidate', draft, course); if (po) { setTab('oferta'); return po; }
      return '';
    }
    function saveCourse(o) {
      o = o || {};
      var bad = validate();
      if (bad) { B.toast(bad, 'bad', 4500); return Promise.reject(new Error(bad)); }
      if (!draft.slug) draft.slug = B.slug(draft.title);
      var wasNew = isNew, btn = $p('#ed-save');
      return busy(btn, B.api('adminCourseSave', { course: payload() })).then(function (r) {
        drop('courses', 'affs');
        if (wasNew) {
          S.guard = null; S.autoGen = r.course.id;
          B.toast('Curso criado', 'ok');
          B.router.go('/curso/' + r.course.id + '?aba=lp', { replace: true });
          return r;
        }
        if (!ctx.live()) return r;
        course = r.course; draft = toDraft(course); snap = JSON.stringify(payload());
        if (!lpDirty()) { lpDraft = course.lp ? clone(course.lp) : null; lpSnap = lpDraft ? JSON.stringify(lpDraft) : ''; }
        rebuildTabs();
        if (!o.stay) { B.toast('Curso salvo', 'ok'); }
        if (built.lp) reloadPreview();
        return r;
      }, function (e) { B.fail(e); throw e; });
    }
    function saveAll() {
      var p = courseDirty() || isNew ? saveCourse() : Promise.resolve();
      return p.then(function () {
        if (isNew || !lpDirty()) return;
        return saveLP(true);
      }).then(function () {
        if (!isNew && adsDirty()) return saveAds();
      }).catch(function () {});
    }
    function saveLP(quiet) {
      if (!lpDraft || !course) return Promise.resolve();
      return busy($p('#lp-save'), B.api('adminLPSave', { course_id: course.id, lp: lpDraft })).then(function (r) {
        if (!ctx.live()) return;
        afterLPChange(r.lp, 'reviewed');
        renderSections(); renderGen(); reloadPreview(); refreshDirty();
        if (!quiet) B.toast('Página salva', 'ok');
      }, function (e) { B.fail(e); throw e; });
    }

    /* =================== eventos =================== */
    function afterDraft(path, t) {
      if (path === 'title') {
        if (!slugTouched) { draft.slug = B.slug(draft.title); var si = $p('[data-f="slug"]'); if (si) si.value = draft.slug; }
        markErr('title', ''); paintHead(); paintSlug(); paintVisual();
      } else if (path === 'slug') { slugTouched = true; paintSlug(); }
      else if (path === 'status') { paintHead(); paintStatusHint(); paintOffer(); }
      else if (path === 'banner' || path === 'poster' || path === 'show_title' || path === 'color') paintVisual();
      else if (path === 'trailer') paintTrailer();
      else if (/^(price|anchor_price|max_installments|scarcity_until|guarantee_days|access_days)$/.test(path)) paintOffer();
      if (/^(banner|poster|logo|instructor_photo|bump_image)$/.test(path)) paintImg(path);
      if (/^(bump|upsell)_/.test(path)) plus('courseOfferChange', path, draft);
      var c = $p('[data-counter][data-for="' + path + '"]');
      if (c) { var n = String(getPath(draft, path) || '').length; c.textContent = n + '/' + c.dataset.max; c.classList.toggle('is-over', n > Number(c.dataset.max)); }
      refreshDirty();
    }
    function onField(ev) {
      var t = ev.target; if (!t || !t.dataset) return;
      if (t.dataset.affComm != null) { return; }
      if (t.dataset.method) {
        var set = draft.methods.filter(function (m) { return m !== t.dataset.method; });
        if (t.checked) set.push(t.dataset.method);
        draft.methods = ['pix', 'card'].filter(function (m) { return set.indexOf(m) > -1; });
        paintOffer(); refreshDirty(); return;
      }
      if (t.id === 'lp-instr') { genInstr = t.value; return; }
      if (t.id === 'ads-instr') { adsInstr = t.value; return; }
      if (t.id === 'ads-guides') { adsGuides = t.checked; drawAdPreviews(); return; }
      if (t.id === 'ads-feed') { adsFeed = t.checked; return; }
      if (t.dataset.f != null) {
        var v = readInput(t);
        if (t.dataset.f === 'pixel_id') v = onlyDigits(v);
        setPath(draft, t.dataset.f, v);
        if (ev.type === 'change' && t.dataset.f === 'slug') { draft.slug = B.slug(t.value); t.value = draft.slug; paintSlug(); }
        afterDraft(t.dataset.f, t);
      } else if (t.dataset.lp != null && lpDraft) {
        var lv = t.hasAttribute('data-lines') ? B.lines(t.value) : readInput(t);
        setPath(lpDraft, t.dataset.lp, lv);
        var cc = $p('[data-counter][data-for="lp:' + t.dataset.lp + '"]');
        if (cc) { var n = String(lv).length; cc.textContent = n + '/' + cc.dataset.max; cc.classList.toggle('is-over', n > Number(cc.dataset.max)); }
        refreshDirty();
      }
    }
    function renderRep(key) {
      var host = $p('[data-rep-host="' + key + '"]'); if (!host) return;
      var cfg = REPS[key];
      host.innerHTML = String(repHTML(key, getPath(rootObj(cfg.root), cfg.path)));
    }
    function wire() {
      S.on.input = onField; S.on.change = function (ev) {
        var t = ev.target;
        if (t && t.dataset && t.dataset.affComm != null) { saveAffComm(t); return; }
        onField(ev);
      };
      S.on.keydown = function (ev) {
        if ((ev.ctrlKey || ev.metaKey) && (ev.key === 's' || ev.key === 'S')) { ev.preventDefault(); saveAll(); }
        if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('tr.is-click')) ev.target.click();
      };
      S.acts = {
        save: function (el) { saveAll(); },
        tab: function (el) { setTab(el.dataset.tab); },
        'ads-gen': function () {
          if (adsDraft && (adsDirty() || (adsDraft.meta && adsDraft.meta.edited_at))) {
            B.confirm({ title: 'Gerar os anúncios de novo?', text: 'Os 10 anúncios atuais, incluindo as suas edições, serão substituídos pelo que a IA escrever agora.', ok: 'Gerar de novo', danger: true }).then(function (ok) { if (ok) generateAds(); });
          } else generateAds();
        },
        'ads-reset': function (el) {
          busy(el, B.api('adminAdsReset', { course_id: course.id })).then(function (r) { if (!ctx.live()) return; setAds(r.ads); adsRun = { running: false, warn: '', fresh: false }; renderAdsGen(); paintAds(); refreshDirty(); }).catch(B.fail);
        },
        'ads-save': function () { saveAds().catch(B.fail); },
        'ads-zip': function (el) {
          var c = adsCourse();
          busy(el, B.ads.pack(adsDraft.items, c, { feed: adsFeed, rate: rate })).then(function (blob) {
            B.ads.download(blob, 'anuncios-' + c.slug + '.zip');
            B.toast('Pacote com ' + adsDraft.items.length + ' anúncios baixado', 'ok');
          }).catch(B.fail);
        },
        'ad-png': function (el) {
          var i = Number(el.dataset.i), c = adsCourse(), a = adsDraft.items[i];
          busy(el, B.ads.renderAll([a], c, { rate: rate }).catch(function () { return B.ads.renderAll([a], c, { rate: rate, photo: false }); })).then(function (list) {
            B.ads.download(list[0].blob, String(i + 1).padStart(2, '0') + '-' + a.angle + '-1080x1920.jpg');
          }).catch(B.fail);
        },
        'ad-edit': function (el) { adModal(Number(el.dataset.i)); },
        archive: function (el) {
          B.confirm({ title: 'Arquivar curso', text: '“' + (draft.title || 'Curso') + '” sai do catálogo, da página de vendas e da área dos alunos. Quem já comprou deixa de ver o curso enquanto ele estiver arquivado. Nada é apagado.', ok: 'Arquivar', danger: true }).then(function (ok) {
            if (!ok) return;
            busy(el, B.api('adminCourseDelete', { id: course.id })).then(function () { drop('courses'); S.guard = null; B.toast('Curso arquivado', 'ok'); B.router.go('/cursos'); }).catch(B.fail);
          });
        },
        'img-up': function (el) {
          var f = el.dataset.f;
          chooseAndUpload(el, { png: f === 'logo', maxW: f === 'logo' ? 900 : f === 'instructor_photo' ? 600 : undefined }).then(function (url) {
            if (!url) return; setPath(draft, f, url); afterDraft(f); paintImg(f);
          }).catch(B.fail);
        },
        'img-rm': function (el) { var f = el.dataset.f; setPath(draft, f, ''); afterDraft(f); paintImg(f); },
        pal: function (el) { draft.color = Number(el.dataset.i); paintPalette(); paintVisual(); refreshDirty(); },
        'rep-add': function (el) {
          var key = el.dataset.rep, cfg = REPS[key], obj = rootObj(cfg.root); if (!obj) return;
          var list = getPath(obj, cfg.path); if (!Array.isArray(list)) { list = []; setPath(obj, cfg.path, list); }
          list.push(clone(cfg.blank)); renderRep(key);
          var items = $$('.rep__item', $p('[data-rep-host="' + key + '"]')), last = items[items.length - 1], f = last && $('input,textarea', last); if (f) f.focus();
          refreshDirty();
        },
        'rep-rm': function (el) {
          var key = el.dataset.rep, cfg = REPS[key], list = getPath(rootObj(cfg.root), cfg.path);
          if (Array.isArray(list)) list.splice(Number(el.dataset.i), 1);
          renderRep(key); refreshDirty();
        },
        'rep-img': function (el) {
          var path = el.dataset.path;
          chooseAndUpload(el, { maxW: 500 }).then(function (url) {
            if (!url) return; setPath(draft, path, url);
            var i = $p('[data-f="' + path + '"]'); if (i) i.value = /^data:/i.test(url) ? '' : url;
            if (i && /^data:/i.test(url)) i.placeholder = 'Foto enviada';
            refreshDirty();
          }).catch(B.fail);
        },
        'season-add': function () { if (isNew) { B.toast('Crie o curso antes de adicionar temporadas.', 'info'); return; } seasonModal(null); },
        'season-edit': function (el) { var s = findSeason(el.dataset.id); if (s) seasonModal(s); },
        'season-toggle': function (el) {
          var id = el.dataset.id, open = openSeasons[id] === false; openSeasons[id] = open;
          var card = el.closest('.season'); card.classList.toggle('is-open', open); $('.season__body', card).hidden = !open; el.setAttribute('aria-expanded', String(open));
        },
        'season-up': function (el) { busy(el, move('Seasons', (course.seasons || []).map(function (s) { return s.id; }), el.dataset.id, -1)).catch(B.fail); },
        'season-down': function (el) { busy(el, move('Seasons', (course.seasons || []).map(function (s) { return s.id; }), el.dataset.id, 1)).catch(B.fail); },
        'season-del': function (el) {
          var s = findSeason(el.dataset.id); if (!s) return;
          B.confirm({ title: 'Excluir temporada', text: '“' + s.title + '” e ' + plural((s.lessons || []).length, 'aula', 'aulas') + ' dentro dela serão excluídas. Não dá para desfazer.', ok: 'Excluir temporada', danger: true }).then(function (ok) {
            if (!ok) return;
            B.api('adminSeasonDelete', { id: s.id }).then(function (r) { applyContent(r.course); B.toast('Temporada excluída', 'ok'); }).catch(B.fail);
          });
        },
        'lesson-add': function (el) { lessonModal(null, el.dataset.id); },
        'lesson-edit': function (el) { var f = findLesson(el.dataset.id); if (f) lessonModal(f.l, f.s.id); },
        'lesson-up': function (el) { var s = findSeason(el.dataset.s); if (s) busy(el, move('Lessons', s.lessons.map(function (l) { return l.id; }), el.dataset.id, -1)).catch(B.fail); },
        'lesson-down': function (el) { var s = findSeason(el.dataset.s); if (s) busy(el, move('Lessons', s.lessons.map(function (l) { return l.id; }), el.dataset.id, 1)).catch(B.fail); },
        'lesson-del': function (el) {
          var f = findLesson(el.dataset.id); if (!f) return;
          B.confirm({ title: 'Excluir aula', text: '“' + f.l.title + '” será excluída, junto com o progresso dos alunos nela. Não dá para desfazer.', ok: 'Excluir aula', danger: true }).then(function (ok) {
            if (!ok) return;
            B.api('adminLessonDelete', { id: f.l.id }).then(function (r) { applyContent(r.course); B.toast('Aula excluída', 'ok'); }).catch(B.fail);
          });
        },
        gen: function () {
          var lp = course && course.lp_status === 'reviewed';
          if (lp || lpDirty()) {
            B.confirm({ title: 'Gerar a página de novo?', text: 'O texto atual da página, incluindo as suas edições, será substituído pelo que a IA escrever agora.', ok: 'Gerar de novo', danger: true }).then(function (ok) { if (ok) generate({}); });
          } else generate({});
        },
        'lp-reset': function (el) {
          B.confirm({ title: 'Voltar ao modelo automático', text: 'O texto gerado e as suas edições na página de vendas serão descartados. A página volta a ser montada sozinha a partir dos dados do curso.', ok: 'Voltar ao modelo', danger: true }).then(function (ok) {
            if (!ok) return;
            busy(el, B.api('adminLPReset', { course_id: course.id })).then(function () {
              afterLPChange(null, ''); gen = { running: false, step: 0, warn: '', fresh: false };
              renderGen(); renderSections(); reloadPreview(); refreshDirty(); B.toast('Voltou ao modelo automático', 'ok');
            }).catch(B.fail);
          });
        },
        'lp-save': function () { saveLP().catch(function () {}); },
        'lp-template': function (el) { loadTemplate(el); },
        view: function (el) { setView(el.dataset.v); },
        device: function (el) { device = el.dataset.v; $$('[data-act="device"]', root).forEach(function (b) { b.classList.toggle('is-active', b.dataset.v === device); }); fitPreview(); },
        'sec-toggle': function (el) {
          var k = el.dataset.k, open = !openSecs[k]; openSecs[k] = open;
          var card = el.closest('.acc'); card.classList.toggle('is-open', open); $('.acc__body', card).hidden = !open; el.setAttribute('aria-expanded', String(open));
        },
        'sec-ai': function (el) {
          var k = el.dataset.k;
          el.classList.add('is-loading');
          generate({ section: k });
        },
        'lp-publish': function (el) {
          busy(el, B.api('adminLPPublish', { course_id: course.id })).then(function (r) {
            course.lp_static_url = r.url; course.links = course.links || {}; course.links.static = r.url; paintStatic(); B.toast('Versão estática publicada', 'ok');
          }).catch(B.fail);
        },
        'aff-set': function (el) {
          busy(el, B.api('adminAffiliation', { id: el.dataset.id, status: el.dataset.st })).then(function () {
            B.toast(el.dataset.st === 'approved' ? 'Afiliado aprovado' : el.dataset.st === 'blocked' ? 'Afiliado bloqueado' : 'Pedido recusado', 'ok');
            loadAffList(true);
          }).catch(B.fail);
        },
        'aff-retry': function () { loadAffList(true); }
      };
    }
    function saveAffComm(inp) {
      var v = inp.value === '' ? 0 : Math.max(0, Math.min(90, Number(inp.value) || 0));
      if (String(v) === String(inp.dataset.orig)) return;
      B.api('adminAffiliation', { id: inp.dataset.affComm, commission: v }).then(function () { inp.dataset.orig = String(v); B.toast(v ? 'Comissão personalizada salva' : 'Voltou à comissão padrão', 'ok'); drop('affs'); }).catch(B.fail);
    }
  }

  /* =====================================================================
     AUXILIARES DAS PÁGINAS DE LISTA
     ===================================================================== */
  function kpiTile(label, value, sub, cls) {
    return H`<div class="kpi ${cls || ''}"><div class="kpi__label">${label}</div><div class="kpi__value t-num">${value}</div><div class="kpi__sub"><span>${sub}</span></div></div>`;
  }
  function bandSkel(n) {
    var a = []; for (var i = 0; i < n; i++) a.push(i);
    return H`<div class="kband">${a.map(function () { return H`<div class="kpi">${skel(12, '60%')}${skel(28, '80%')}${skel(10, '50%')}</div>`; })}</div>`;
  }
  function dl(rows) {
    return H`<dl class="dl">${rows.filter(Boolean).map(function (r) { return H`<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`; })}</dl>`;
  }
  function progBar(pct) {
    pct = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    return H`<div class="prog" title="${pct}%"><div class="bar"><div class="bar__fill" style="--p:${pct}%"></div></div><span class="t-num">${pct}%</span></div>`;
  }
  function tabsBar(items, active, act) {
    return H`<div class="tabs" role="tablist">${items.map(function (t) {
      var on = t[0] === active;
      return H`<button type="button" role="tab" class="tab${on ? ' is-active' : ''}" aria-selected="${String(on)}" data-act="${act}" data-tab="${t[0]}">${t[1]}${t[2] ? H`<span class="tab__n">${t[2]}</span>` : ''}</button>`;
    })}</div>`;
  }
  function rowKeys(ev) { var t = ev.target; if (ev.key === 'Enter' && t && t.matches && t.matches('tr.is-click')) { ev.preventDefault(); t.click(); } }
  function igLink(v) { v = String(v || '').trim(); if (!v) return ''; return /^https?:/i.test(v) ? v : 'https://instagram.com/' + v.replace(/^@/, '').replace(/\/$/, ''); }
  function igName(v) { v = String(v || '').trim(); var m = v.match(/instagram\.com\/([\w.]+)/i); return '@' + (m ? m[1] : v.replace(/^@/, '')); }
  function openUrl(u) { if (u) { try { window.open(u, '_blank', 'noopener'); } catch (e) {} } }
  function roleChip(u) { var r = (u && u.roles) || []; return r.indexOf('admin') > -1 ? chip('Admin', 'info') : r.indexOf('affiliate') > -1 ? chip('Afiliado', 'mustard') : chip('Aluno', ''); }
  function sumBy(list, k) { return round2(list.reduce(function (s, x) { return s + (Number(x[k]) || 0); }, 0)); }
  function avgPct(u) { var c = u.courses || []; return c.length ? Math.round(c.reduce(function (s, x) { return s + (x.pct || 0); }, 0) / c.length) : 0; }

  /* =====================================================================
     VENDAS
     ===================================================================== */
  var PERIODS = [['hoje', 'Hoje'], ['24h', 'Últimas 24 horas'], ['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias'], ['tudo', 'Todo o período'], ['custom', 'Personalizado']];
  var SALE_ST = [['', 'Todos'], ['approved', 'Aprovadas'], ['pending', 'Pendentes'], ['abandoned', 'Abandonados'], ['refunded', 'Reembolsadas'], ['chargeback', 'Chargeback'], ['rejected', 'Recusadas'], ['expired', 'Expiradas']];
  var SALE_KIND = [['', 'Todos'], ['bump', 'Com order bump'], ['upsell', 'Oferta pós-compra'], ['seller', 'Vendidos por vendedor']];
  var CARD_BRAND = { visa: 'Visa', master: 'Mastercard', amex: 'American Express', elo: 'Elo', hipercard: 'Hipercard', diners: 'Diners Club', cabal: 'Cabal', debvisa: 'Visa (débito)', debmaster: 'Mastercard (débito)', maestro: 'Maestro' };
  function periodRange(F) {
    var now = Date.now(), p = F.periodo;
    if (p === 'hoje') return { from: dayStart(now), to: dayEnd(now) };
    if (p === '24h') return { from: now - DAY, to: now + 60000 };
    if (p === 'tudo') return { from: 0, to: 0 };
    if (p === 'custom') return { from: F.de ? B.dateFromInput(F.de) : 0, to: F.ate ? B.dateFromInput(F.ate, true) : 0 };
    var n = Number(p) || 30;
    return { from: dayStart(now - (n - 1) * DAY), to: dayEnd(now) };
  }
  function utmText(o) { return [o.utm_source, o.utm_medium].filter(Boolean).join(' / ') || (o.src === 'lp' ? 'Página de vendas' : ''); }

  function pageSales(ctx) {
    var root = pageEl(), qs = ctx.query;
    var DEF = { periodo: '30', status: '', curso: '', metodo: '', aff: '', kind: '', seller: '', q: '', de: '', ate: '' };
    var F = Object.assign({}, DEF, { periodo: qs.get('periodo') || '30', status: qs.get('status') || '', curso: qs.get('curso') || '', aff: qs.get('aff') || '', kind: qs.get('tipo') || '', seller: qs.get('vendedor') || '', q: qs.get('q') || '' });
    if (!PERIODS.some(function (p) { return p[0] === F.periodo; })) F.periodo = '30';
    if (!SALE_KIND.some(function (k) { return k[0] === F.kind; })) F.kind = '';
    var seq = 0, data = null, courses = [], affs = [], sellers = [], opened = qs.get('abrir') === '1';
    var deb = B.debounce(function () { load(); }, 320);

    function isFiltered() { return Object.keys(DEF).some(function (k) { return F[k] !== DEF[k]; }); }
    function slugOf(id) { var c = courses.filter(function (x) { return x.id === id; })[0]; return c ? c.slug : ''; }
    function recoveryLink(o) { var s = slugOf(o.course_id); return s ? siteLink(s, '&checkout=1&email=' + encodeURIComponent(o.email || '')) : ''; }

    setTitle('Vendas');
    root.innerHTML = String(H`${pgHead('Vendas', 'Pedidos, cobranças e carrinhos abandonados, com a origem de cada venda.', csvButton('csv'))}
      <div id="sales-filters">${skel(104)}</div>
      <div id="sales-out" class="sales-out">${bandSkel(8)}${skel(300)}</div>`);
    Promise.all([getCourses().catch(function () { return []; }), getAffiliates().catch(function () { return { affiliates: [] }; }), getSellers().catch(function () { return { sellers: [] }; })]).then(function (r) {
      if (!ctx.live()) return;
      courses = r[0] || []; affs = (r[1] && r[1].affiliates) || []; sellers = (r[2] && r[2].sellers) || [];
      paintFilters(); load();
    });

    function paintFilters() {
      var el = $('#sales-filters', root); if (!el) return;
      var cOpts = [['', 'Todos os cursos']].concat(courses.map(function (c) { return [c.id, c.title]; }));
      var aOpts = [['', 'Todos'], ['__direct', 'Direto (sem afiliado)']].concat(affs.filter(function (a) { return a.aff_code; }).map(function (a) { return [a.aff_code, a.aff_code + ' · ' + a.name]; }));
      if (F.aff && !aOpts.some(function (x) { return x[0] === F.aff; })) aOpts.push([F.aff, F.aff]);
      var sOpts = [['', 'Todos']].concat(sellers.map(function (s) { return [s.id, s.name]; }));
      if (F.seller && !sOpts.some(function (x) { return x[0] === F.seller; })) sOpts.push([F.seller, 'Vendedor removido']);
      el.innerHTML = String(H`<form class="fbar" role="search">
        ${fld({ l: 'Período', t: 'select', f: 'periodo', v: F.periodo, opts: PERIODS })}
        <div class="fbar__custom" id="f-custom" ${F.periodo === 'custom' ? '' : raw('hidden')}>
          ${fld({ l: 'De', t: 'date', f: 'de', v: F.de })}${fld({ l: 'Até', t: 'date', f: 'ate', v: F.ate })}
        </div>
        ${fld({ l: 'Curso', t: 'select', f: 'curso', v: F.curso, opts: cOpts })}
        ${fld({ l: 'Status', t: 'select', f: 'status', v: F.status, opts: SALE_ST })}
        ${fld({ l: 'Pagamento', t: 'select', f: 'metodo', v: F.metodo, opts: [['', 'Todos'], ['pix', 'Pix'], ['card', 'Cartão']] })}
        ${fld({ l: 'Afiliado', t: 'select', f: 'aff', v: F.aff, opts: aOpts })}
        ${fld({ l: 'Tipo de venda', t: 'select', f: 'kind', v: F.kind, opts: SALE_KIND })}
        ${fld({ l: 'Vendedor', t: 'select', f: 'seller', v: F.seller, opts: sOpts })}
        ${fld({ l: 'Buscar', t: 'search', f: 'q', v: F.q, ph: 'Nome, e-mail, telefone ou pedido', cls: 'fbar__q', attrs: 'autocomplete="off" enterkeyhint="search"' })}
      </form>`);
    }

    function load() {
      var my = ++seq, out = $('#sales-out', root); if (!out) return Promise.resolve();
      out.classList.add('is-busy'); out.setAttribute('aria-busy', 'true');
      var r = periodRange(F);
      return B.api('adminSales', { from: r.from, to: r.to, course_id: F.curso, status: F.status, method: F.metodo, aff: F.aff, kind: F.kind, seller_id: F.seller, q: F.q.trim() }).then(function (d) {
        if (my !== seq || !ctx.live()) return;
        data = d; paint();
        if (opened) { opened = false; if (d.orders.length) openOrder(d.orders[0].id); }
      }).catch(function (e) {
        if (my !== seq || !ctx.live()) return;
        out.classList.remove('is-busy'); out.removeAttribute('aria-busy');
        out.innerHTML = String(errorState(e, 'retry'));
      });
    }

    function saleRow(o) {
      var u = utmText(o);
      return H`<tr class="is-click" data-act="open-order" data-id="${o.id}" tabindex="0" role="button" aria-label="Abrir pedido de ${o.name}">
        <td class="nowrap" title="${B.fmt.rel(o.status === 'approved' ? o.paid_at : o.created_at)}">${B.fmt.datetime(o.status === 'approved' && o.paid_at ? o.paid_at : o.created_at)}</td>
        <td><div class="ellipsis cell-name"><b>${o.name}</b></div><div class="t-xs t-faint ellipsis cell-name">${o.email}</div></td>
        <td><div class="ellipsis cell-course">${o.course_title}</div>${plusHtml('saleTags', o)}</td>
        <td class="num"><b>${money(o.amount)}</b>${o.coupon ? H`<div class="t-xs t-faint">cupom ${o.coupon}</div>` : ''}${o.bump_type && o.bump_amount > 0 ? H`<div class="t-xs t-faint">com ${money(o.bump_amount)} de bump</div>` : ''}</td>
        <td class="nowrap">${METHOD[o.method] || o.method || '—'}${o.method === 'card' && o.installments > 1 ? H`<div class="t-xs t-faint">${o.installments}x</div>` : ''}</td>
        <td>${orderChip(o.status)}${(o.status === 'pending' || o.status === 'expired') && o.recovery_sent ? H`<div class="t-xs t-faint">e-mail enviado</div>` : ''}</td>
        <td class="nowrap">${o.aff_code ? chip(o.aff_code, 'mustard') : H`<span class="t-faint">Direto</span>`}</td>
        <td><div class="ellipsis cell-utm">${u || '—'}</div>${o.utm_campaign ? H`<div class="t-xs t-faint ellipsis cell-utm">${o.utm_campaign}</div>` : ''}</td>
      </tr>`;
    }

    function paint() {
      var out = $('#sales-out', root); if (!out || !data) return;
      var t = data.totals, os = data.orders, filtered = isFiltered();
      out.classList.remove('is-busy'); out.removeAttribute('aria-busy');
      out.innerHTML = String(H`
        <section class="kband" aria-label="Totais dos pedidos filtrados">
          ${kpiTile('Bruto', moneyK(t.gross), plural(t.approved, 'venda aprovada', 'vendas aprovadas'), 'kpi--hero')}
          ${kpiTile('Líquido', moneyK(t.net), 'após taxas e comissões')}
          ${kpiTile('Taxas', moneyK(t.fees), t.gross ? B.fmt.pct(t.fees / t.gross * 100) + ' do bruto' : 'do Mercado Pago')}
          ${kpiTile('Comissões', moneyK(t.commissions), 'para afiliados')}
          ${kpiTile('Aprovadas', int(t.approved), 'de ' + plural(data.count, 'pedido', 'pedidos'))}
          ${kpiTile('Ticket médio', moneyK(t.ticket), 'por venda aprovada')}
          ${kpiTile('Reembolsos', moneyK(t.refunded_value), plural(t.refunded, 'pedido', 'pedidos'), t.refunded ? 'kpi--warn' : '')}
          ${kpiTile('Abandonados', int(t.pending + t.abandoned), t.pending ? t.pending + ' aguardando pagamento' : 'pagamento não concluído')}
        </section>
        ${plusHtml('salesTiles', t)}
        ${os.length ? H`
          <div class="list-cap"><span class="t-sm t-muted">${data.count > os.length ? 'Mostrando os ' + int(os.length) + ' mais recentes de ' + int(data.count) + '. Refine os filtros para ver o resto.' : plural(os.length, 'pedido', 'pedidos') + (filtered ? ' com estes filtros' : ' no período')}</span>${filtered ? H`<button class="btn btn--sm btn--ghost" type="button" data-act="clear">${ic('x')}Limpar filtros</button>` : ''}</div>
          <div class="table-wrap"><table class="table sales">
            <thead><tr><th>Data</th><th>Cliente</th><th>Curso</th><th class="num">Valor</th><th>Pagamento</th><th>Status</th><th>Afiliado</th><th>Origem</th></tr></thead>
            <tbody>${os.map(saleRow)}</tbody>
          </table></div>`
        : H`<div class="panel">${emptyState(filtered ? 'Nenhum pedido com estes filtros' : 'Ainda não há pedidos no período', filtered ? 'Amplie o período ou limpe os filtros para ver mais.' : 'Quando alguém iniciar uma compra, ela aparece aqui, mesmo que o pagamento não seja concluído.', filtered ? H`<button class="btn" type="button" data-act="clear">Limpar filtros</button>` : '', 'wallet')}</div>`}`);
    }

    function orderBody(o) {
      var net = (o.net || o.amount) - (o.commission || 0) - (o.seller_commission || 0), seller = o.seller_id ? (o.seller_name || 'Vendedor removido') : '';
      return H`<div class="od">
        <div class="od__top">
          <div class="od__amt t-num">${money(o.amount)}</div>
          <div class="min0"><div class="row" style="--gap:8px">${orderChip(o.status)}${o.method ? chip(METHOD[o.method] || o.method, '') : ''}${o.aff_code ? chip('Afiliado ' + o.aff_code, 'mustard') : ''}${o.bump_type ? chip('Order bump', 'ok') : ''}${o.parent_order_id ? chip('Oferta pós-compra', 'info') : ''}${seller ? chip('Vendedor ' + firstName(seller), 'info') : ''}</div><div class="od__course ellipsis">${o.course_title}</div></div>
        </div>
        ${o.status_message ? H`<div class="note note--warn">${ic('alert')}<span><b>Pagamento recusado.</b> ${o.status_message}${o.status_detail ? H` <code>${o.status_detail}</code>` : ''}</span></div>` : ''}
        <div class="od__grid">
          <div class="od__col">
          <section style="order:1"><h4 class="t-hud-sub">Cliente</h4>${dl([
            ['Nome', o.name],
            ['E-mail', H`<span class="od__v">${o.email}</span>${copyBtn(o.email, 'Copiar e-mail')}`],
            ['Telefone', o.phone ? H`<span class="od__v">${B.fmt.phone(o.phone)}</span>${copyBtn(o.phone, 'Copiar telefone')}` : '—']
          ])}</section>
          <section style="order:3"><h4 class="t-hud-sub">Origem</h4>${dl([
            ['Fonte (utm_source)', o.utm_source || '—'],
            ['Mídia (utm_medium)', o.utm_medium || '—'],
            ['Campanha (utm_campaign)', o.utm_campaign || '—'],
            ['Conteúdo (utm_content)', o.utm_content || '—'],
            ['Afiliado', o.aff_code ? o.aff_code : 'Direto'],
            seller ? ['Vendedor', seller] : null,
            o.parent_order_id ? ['Oferta pós-compra', H`<span class="od__v">Comprada logo após outro pedido</span><button type="button" class="btn btn--sm btn--ghost" data-go="${o.parent_order_id}">Ver pedido de origem</button>`] : null,
            o.banner_id ? ['Banner', 'Veio de um banner da área do aluno'] : null,
            ['Canal', o.src === 'lp' || o.src === 'page' ? 'Página de vendas' : o.src === 'app' ? 'Área do aluno' : o.src === 'upsell' ? 'Oferta pós-compra' : o.src === 'seller' ? 'Atendimento comercial' : (o.src || '—')]
          ])}</section>
          </div>
          <div class="od__col">
          <section style="order:2"><h4 class="t-hud-sub">Valores</h4>${dl([
            ['Preço de tabela', money(o.price)],
            o.discount > 0 ? ['Desconto', H`− ${money(o.discount)}${o.coupon ? H` ${chip(o.coupon, 'mustard')}` : ''}`] : (o.coupon ? ['Cupom', chip(o.coupon, 'mustard')] : null),
            o.bump_type ? ['Order bump', H`<span class="od__v">${o.bump_title || (o.bump_type === 'course' ? 'Outro curso' : 'Produto')}</span><b>+ ${money(o.bump_amount)}</b>`] : null,
            ['Total cobrado', H`<b>${money(o.amount)}</b>`],
            o.method === 'card' ? ['Parcelas', (o.installments || 1) + 'x'] : null,
            o.method === 'card' && o.card_brand ? ['Cartão', H`<span class="od__v">${CARD_BRAND[String(o.card_brand).toLowerCase()] || o.card_brand}</span>`] : null,
            ['Taxa do Mercado Pago', o.fee ? money(o.fee) : '—'],
            ['Comissão do afiliado', o.commission ? money(o.commission) : '—'],
            seller ? ['Comissão do vendedor', o.seller_commission ? H`${money(o.seller_commission)} <span class="t-xs t-faint">${seller}</span>` : H`— <span class="t-xs t-faint">${seller}</span>`] : null,
            ['Líquido para você', o.status === 'approved' ? H`<b class="t-ok">${money(net)}</b>` : '—']
          ])}</section>
          <section style="order:4"><h4 class="t-hud-sub">Registro</h4>${dl([
            ['Pedido criado', B.fmt.datetime(o.created_at)],
            o.paid_at ? ['Pago em', B.fmt.datetime(o.paid_at)] : null,
            ['ID do pedido', H`<code class="od__v">${o.id}</code>${copyBtn(o.id, 'Copiar ID do pedido')}`],
            o.mp_payment_id ? ['ID do pagamento', H`<code class="od__v">${o.mp_payment_id}</code>${copyBtn(o.mp_payment_id, 'Copiar ID do pagamento')}`] : null,
            o.status_detail ? ['Detalhe do status', H`<code class="od__v">${o.status_detail}</code>`] : null
          ])}</section>
          </div>
        </div>
      </div>`;
    }

    function refund(o) {
      return B.confirm({
        title: 'Reembolsar pedido',
        text: 'Devolver ' + money(o.amount) + ' para ' + o.name + '? O acesso a “' + o.course_title + '” é encerrado e a comissão do afiliado (se houver) é cancelada. Não dá para desfazer.',
        ok: 'Reembolsar ' + money(o.amount), danger: true
      }).then(function (ok) {
        if (!ok) return false;
        return B.api('adminRefund', { order_id: o.id }).then(function () { B.toast('Reembolso registrado', 'ok'); drop('affs'); if (ctx.live()) load(); return true; });
      });
    }

    function openOrder(id) {
      var o = data && data.orders.filter(function (x) { return x.id === id; })[0]; if (!o) return;
      var open = o.status === 'pending' || o.status === 'expired' || o.status === 'failed';
      var link = recoveryLink(o), actions = [{ label: 'Fechar' }];
      if (o.status !== 'refunded' && o.status !== 'chargeback') actions.push({ label: 'WhatsApp com mensagem pronta', icon: 'whatsapp', kind: 'primary', onClick: function () { waOpen('order', o.id, null, open ? 'wa_order_recovery' : (o.status === 'approved' ? 'wa_order_access' : '')); return false; } });
      if (open && link) actions.push({ label: 'Copiar link de recuperação', icon: 'link', onClick: function () { B.copy(link); return false; } });
      if (o.status === 'approved') actions.push({ label: 'Reembolsar', icon: 'refresh', kind: 'danger', onClick: function () { return refund(o); } });
      var m = B.modal({ title: 'Pedido de ' + firstName(o.name), size: 'wide', body: String(orderBody(o)), actions: actions });
      B.on(m.body, 'click', '[data-go]', function (ev, el) {
        var pid = el.dataset.go, inList = data && data.orders.some(function (x) { return x.id === pid; });
        m.close();
        if (inList) { openOrder(pid); return; }
        F = Object.assign({}, DEF, { periodo: 'tudo', q: pid }); opened = true; paintFilters(); load();
      });
    }

    S.on.change = function (ev) {
      var t = ev.target, k = t && t.dataset && t.dataset.f; if (!k || !(k in F) || k === 'q') return;
      F[k] = t.value;
      if (k === 'periodo') {
        if (F.periodo === 'custom' && !F.de) {
          F.de = B.dateInput(Date.now() - 29 * DAY); F.ate = B.dateInput(Date.now());
          var a = $('[data-f=de]', root), b = $('[data-f=ate]', root); if (a) a.value = F.de; if (b) b.value = F.ate;
        }
        var c = $('#f-custom', root); if (c) c.hidden = F.periodo !== 'custom';
      }
      load();
    };
    S.on.input = function (ev) { var t = ev.target; if (t && t.dataset && t.dataset.f === 'q') { F.q = t.value; deb(); } };
    S.on.keydown = rowKeys;
    S.on.submit = function (ev) { ev.preventDefault(); };
    S.acts = {
      'open-order': function (el) { openOrder(el.dataset.id); },
      clear: function () { F = Object.assign({}, DEF); paintFilters(); load(); },
      retry: function () { load(); },
      csv: function () {
        if (!data || !data.orders.length) { B.toast('Não há pedidos para exportar.', 'info'); return; }
        exportCsv('vendas', ['Data', 'Pedido', 'Cliente', 'E-mail', 'Telefone', 'Curso', 'Valor', 'Cupom', 'Pagamento', 'Parcelas', 'Status', 'Afiliado', 'Comissão', 'Taxa', 'Líquido', 'Fonte', 'Mídia', 'Campanha', 'Order bump', 'Valor do bump', 'Oferta pós-compra', 'Vendedor', 'Comissão do vendedor', 'Bandeira', 'Motivo da recusa'],
          data.orders.map(function (o) {
            return [B.fmt.datetime(o.created_at), o.id, o.name, o.email, o.phone, o.course_title, num2(o.amount), o.coupon, METHOD[o.method] || o.method, o.installments || '', (ORDER_ST[o.status] || [o.status])[0], o.aff_code, num2(o.commission), num2(o.fee), num2((o.net || o.amount) - (o.commission || 0) - (o.seller_commission || 0)), o.utm_source, o.utm_medium, o.utm_campaign,
              o.bump_title || '', o.bump_type ? num2(o.bump_amount) : '', o.parent_order_id ? 'Sim' : '', o.seller_name || '', o.seller_id ? num2(o.seller_commission) : '', o.card_brand || '', o.status_message || ''];
          }));
      }
    };
  }

  /* =====================================================================
     ALUNOS
     ===================================================================== */
  var SRC_TXT = { purchase: 'Compra', manual: 'Liberado por você', free: 'Gratuito', affiliate: 'Afiliado' };
  function pageStudents(ctx) {
    var root = pageEl(), F = { q: '', course: '', inactive: 0 }, seq = 0, data = null, courses = [], opened = null;
    var deb = B.debounce(function () { load(); }, 320);
    setTitle('Alunos');
    root.innerHTML = String(H`${pgHead('Alunos', 'Quem comprou, quanto já assistiu e quando voltou.', H`${csvButton('csv')}<button class="btn btn--primary" type="button" data-act="grant">${ic('plus')}Liberar acesso</button>`)}
      <div id="stu-filters">${skel(70)}</div>
      <div id="stu-out" class="sales-out">${bandSkel(4)}${skel(300)}</div>`);
    getCourses().catch(function () { return []; }).then(function (cs) {
      if (!ctx.live()) return;
      courses = cs || [];
      var el = $('#stu-filters', root);
      el.innerHTML = String(H`<form class="fbar fbar--students" role="search">
        ${fld({ l: 'Buscar', t: 'search', f: 'q', v: F.q, ph: 'Nome, e-mail ou telefone', cls: 'fbar__q', attrs: 'autocomplete="off" enterkeyhint="search"' })}
        ${fld({ l: 'Curso', t: 'select', f: 'course', v: F.course, opts: [['', 'Todos os cursos']].concat(courses.map(function (c) { return [c.id, c.title]; })) })}
        <div class="field fbar__idle"><label id="idl-l">Parados há</label>
          <div class="seg" role="group" aria-labelledby="idl-l">${[[0, 'Todos'], [7, '7 dias'], [14, '14 dias'], [30, '30 dias']].map(function (x) { return H`<button type="button" data-act="idle" data-d="${x[0]}" class="${F.inactive === x[0] ? 'is-active' : ''}" aria-pressed="${String(F.inactive === x[0])}">${x[1]}</button>`; })}</div></div>
      </form>`);
      load();
    });

    function load() {
      var my = ++seq, out = $('#stu-out', root); if (!out) return Promise.resolve();
      out.classList.add('is-busy'); out.setAttribute('aria-busy', 'true');
      return B.api('adminStudents', { q: F.q.trim(), course_id: F.course, inactive_days: F.inactive }).then(function (d) {
        if (my !== seq || !ctx.live()) return;
        data = d; paint();
      }).catch(function (e) {
        if (my !== seq || !ctx.live()) return;
        out.classList.remove('is-busy'); out.removeAttribute('aria-busy');
        out.innerHTML = String(errorState(e, 'retry'));
      });
    }

    function stuRow(u) {
      var cs = u.courses || [], extra = cs.length - 2;
      return H`<tr class="is-click" data-act="open-student" data-id="${u.id}" tabindex="0" role="button" aria-label="Abrir aluno ${u.name}">
        <td><div class="cell-person">${raw(B.avatar(u, 36))}<div class="min0"><div class="ellipsis cell-name"><b>${u.name}</b></div><div class="t-xs t-faint ellipsis cell-name">${u.email}</div></div>${u.status === 'blocked' ? chip('Bloqueado', 'bad') : (!u.has_password ? chip('Sem senha', 'warn') : '')}</div></td>
        <td><div class="chips">${cs.slice(0, 2).map(function (c) { return H`<span class="chip chip--clip${c.status === 'active' ? ' chip--mustard' : ''}" title="${c.title}">${trunc(c.title, 26)}</span>`; })}${extra > 0 ? H`<span class="chip">+${extra}</span>` : ''}${cs.length ? '' : H`<span class="t-faint">—</span>`}</div></td>
        ${plusHtml('stuCells', u)}
        <td class="num">${u.spent > 0 ? money(u.spent) : H`<span class="t-faint">—</span>`}</td>
        <td class="num nowrap">Nv ${u.level}<div class="t-xs t-faint">${int(u.xp)} XP</div></td>
        ${plusHtml('stuWa', u)}
      </tr>`;
    }
    function paint() {
      var out = $('#stu-out', root); if (!out || !data) return;
      var list = data.students, now = Date.now();
      var act7 = list.filter(function (u) { return u.last_seen && u.last_seen > now - 7 * DAY; }).length;
      var idle = list.filter(function (u) { return (u.courses || []).length && (!u.last_seen || u.last_seen < now - 30 * DAY); }).length;
      var nopass = list.filter(function (u) { return !u.has_password; }).length;
      var filtered = !!(F.q.trim() || F.course || F.inactive);
      out.classList.remove('is-busy'); out.removeAttribute('aria-busy');
      out.innerHTML = String(H`
        <section class="kband" aria-label="Resumo dos alunos">
          ${kpiTile('Alunos', int(data.count), filtered ? 'com estes filtros' : 'cadastrados', 'kpi--hero')}
          ${kpiTile('Ativos em 7 dias', int(act7), list.length ? B.fmt.pct(act7 / list.length * 100, 0) + ' da lista' : '—')}
          ${kpiTile('Parados há 30+ dias', int(idle), 'com curso e sem voltar', idle ? 'kpi--warn' : '')}
          ${kpiTile('Sem senha criada', int(nopass), 'ainda não abriram o acesso', nopass ? 'kpi--warn' : '')}
        </section>
        ${list.length ? H`
          ${data.count > list.length || F.inactive ? H`<div class="list-cap"><span class="t-sm t-muted">${(F.inactive ? 'Só quem tem acesso ativo e não entra há ' + F.inactive + ' dias ou mais, dos mais antigos para os mais recentes. ' : '') + (data.count > list.length ? 'Mostrando ' + int(list.length) + ' de ' + int(data.count) + '. Use a busca para achar quem você procura.' : plural(data.count, 'aluno', 'alunos') + '.')}</span></div>` : ''}
          <div class="table-wrap"><table class="table students">
            <thead><tr><th>Aluno</th><th>Cursos</th><th>Onde parou</th><th>Último acesso</th><th>Último contato</th><th class="num">Gasto</th><th class="num">Nível</th><th class="num" aria-label="WhatsApp"></th></tr></thead>
            <tbody>${list.map(stuRow)}</tbody>
          </table></div>`
        : H`<div class="panel">${emptyState(filtered ? (F.inactive && !F.q.trim() && !F.course ? 'Ninguém parado há ' + F.inactive + ' dias' : 'Ninguém encontrado') : 'Ainda não há alunos', filtered ? (F.inactive ? 'Todo mundo com acesso ativo entrou nesse período. Mude o prazo ou os outros filtros para ver mais.' : 'Tente outro nome, e-mail ou curso.') : 'Quem comprar um curso aparece aqui. Você também pode liberar acesso manualmente.', filtered ? '' : H`<button class="btn btn--primary" type="button" data-act="grant">${ic('plus')}Liberar acesso</button>`, 'users')}</div>`}`);
    }

    function studentBody(u) {
      var cur = u.current, lc = u.last_contact;
      return H`<div class="stu">
        <div class="stu__head">${raw(B.avatar(u, 56))}
          <div class="min0"><h3 class="t-3 ellipsis">${u.name}</h3><div class="t-sm t-muted stu__contact"><span>${u.email}</span>${copyBtn(u.email, 'Copiar e-mail')}${u.phone ? H`<span>${B.fmt.phone(u.phone)}</span>` : ''}</div>
            <div class="row" style="--gap:6px;margin-top:8px">${u.status === 'blocked' ? chip('Bloqueado', 'bad', 'ban') : chip('Ativo', 'ok')}${!u.has_password ? chip('Ainda sem senha', 'warn') : ''}${u.aff_code ? chip('Afiliado ' + u.aff_code, 'mustard') : ''}</div></div>
        </div>
        ${dl([['Cadastro', B.fmt.date(u.created_at)], ['Último acesso', u.last_seen ? B.fmt.rel(u.last_seen) : 'Nunca'], ['Total gasto', u.spent > 0 ? money(u.spent) : '—'], ['Nível', 'Nv ' + u.level + ' · ' + int(u.xp) + ' XP'],
          ['Onde parou', cur ? cur.course_title + (cur.label ? ' · ' + cur.label : '') + ' · ' + cur.pct + '%' : '—'],
          ['Último contato', lc ? B.fmt.rel(lc.ts) + ' · ' + (lc.type === 'wa' ? 'WhatsApp' : 'E-mail') : 'Nunca contatado']])}
        <h4 class="t-hud-sub stu__h">Matrículas</h4>
        ${(u.courses || []).length ? H`<ul class="enr">${u.courses.map(function (c) {
          return H`<li class="enr__it"><div class="enr__main min0">
              <div class="enr__title ellipsis">${c.title}</div>
              <div class="enr__meta t-xs t-faint">${stChip(ENR_ST, c.status)}<span>${SRC_TXT[c.source] || c.source || ''}</span><span>desde ${B.fmt.date(c.created_at)}</span>${c.expires_at ? H`<span>${c.expires_at < Date.now() ? 'expirou' : 'expira'} em ${B.fmt.date(c.expires_at)}</span>` : H`<span>acesso vitalício</span>`}</div>
              ${progBar(c.pct)}
            </div>
            ${c.status === 'active' ? H`<button type="button" class="btn btn--sm btn--danger" data-m="revoke" data-id="${c.enrollment_id}">Revogar</button>` : ''}
          </li>`;
        })}</ul>` : H`<p class="hint">Esta pessoa ainda não tem nenhum curso.</p>`}
        <h4 class="t-hud-sub stu__h">Falar com ${firstName(u.name)}</h4>
        <div class="row stu__talk">
          <button type="button" class="btn btn--sm btn--primary" data-wa="student" data-id="${u.id}" data-initial="${!u.has_password ? 'wa_access' : (u.days_away >= 7 ? 'wa_inactive' : '')}">${ic('whatsapp')}WhatsApp com mensagem pronta</button>
          <button type="button" class="btn btn--sm" data-m="resend">${ic('mail')}Enviar dados de acesso por e-mail</button>
          <button type="button" class="btn btn--sm" data-m="remind">${ic('clock')}Enviar lembrete por e-mail</button>
        </div>
        <div data-plus="user-emails"></div>
        <div class="row stu__acts">
          <button type="button" class="btn btn--sm ${u.status === 'blocked' ? '' : 'btn--danger'}" data-m="block">${ic(u.status === 'blocked' ? 'unlock' : 'ban')}${u.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}</button>
        </div>
      </div>`;
    }
    function linkModal(link, u) {
      B.modal({
        title: 'Link de primeiro acesso',
        body: String(H`<p class="t-muted t-sm">Na demonstração nenhum e-mail sai de verdade. Copie o link e abra em outra aba para ver o que ${firstName(u.name)} receberia.</p>
          <div class="input-group" style="margin-top:12px"><input class="input" readonly value="${link}" aria-label="Link de acesso"><button type="button" class="btn btn--sm addon-btn" data-copy="${link}">${ic('copy')}Copiar</button></div>`),
        actions: [{ label: 'Fechar' }]
      });
    }
    function openStudent(id) {
      var u = data && data.students.filter(function (x) { return x.id === id; })[0]; if (!u) return;
      var m = B.modal({ title: 'Aluno', size: 'wide', body: String(studentBody(u)), actions: [{ label: 'Fechar' }], onClose: function () { if (opened && opened.u === u) opened = null; } });
      function repaint() { m.body.innerHTML = String(studentBody(u)); paint(); plus('studentModal', m, u); }
      opened = { u: u, m: m, repaint: repaint };
      plus('studentModal', m, u);
      B.on(m.body, 'click', '[data-m]', function (ev, el) {
        var a = el.dataset.m;
        if (a === 'revoke') {
          var e = (u.courses || []).filter(function (x) { return x.enrollment_id === el.dataset.id; })[0]; if (!e) return;
          B.confirm({ title: 'Revogar acesso', text: u.name + ' deixa de ver “' + e.title + '” agora. O pedido e o pagamento não mudam; para devolver o dinheiro, use Vendas > Reembolsar.', ok: 'Revogar acesso', danger: true }).then(function (ok) {
            if (!ok) return;
            busy(el, B.api('adminRevoke', { enrollment_id: e.enrollment_id })).then(function () { e.status = 'revoked'; repaint(); B.toast('Acesso revogado', 'ok'); }).catch(B.fail);
          });
        } else if (a === 'resend') {
          busy(el, B.api('adminEmailUser', { user_id: u.id, key: 'access' })).then(function (r) {
            u.last_contact = { ts: Date.now(), type: 'email', title: 'Dados de acesso' }; repaint();
            if (r.link) linkModal(r.link, u);
            else B.toast(r.kind === 'first_access' ? 'Enviamos o link para criar a senha.' : 'Enviamos um código para redefinir a senha.', 'ok');
          }).catch(B.fail);
        } else if (a === 'remind') {
          busy(el, B.api('adminEmailUser', { user_id: u.id, key: 'inactive' })).then(function (r) {
            u.last_contact = { ts: Date.now(), type: 'email', title: 'Lembrete de inatividade' }; repaint();
            if (r.sent === false) B.toast('O e-mail de lembrete está desativado ou não saiu. Veja o histórico abaixo e o modelo em Mensagens.', 'info', 6000);
            else B.toast('Lembrete enviado para ' + firstName(u.name) + '.', 'ok');
          }).catch(B.fail);
        } else if (a === 'block') {
          var blocking = u.status !== 'blocked';
          var run = function () {
            busy(el, B.api('adminUser', { user_id: u.id, status: blocking ? 'blocked' : 'active' })).then(function () {
              u.status = blocking ? 'blocked' : 'active'; repaint(); B.toast(blocking ? 'Aluno bloqueado' : 'Aluno desbloqueado', 'ok');
            }).catch(B.fail);
          };
          if (blocking) B.confirm({ title: 'Bloquear aluno', text: u.name + ' não consegue mais entrar na plataforma até você desbloquear. Os cursos e o histórico continuam guardados.', ok: 'Bloquear', danger: true }).then(function (ok) { if (ok) run(); });
          else run();
        }
      });
    }

    function grantModal() {
      var cs = courses.filter(function (c) { return c.status !== 'archived'; });
      if (!cs.length) { B.toast('Crie um curso antes de liberar acesso.', 'info'); return; }
      var m = B.modal({
        title: 'Liberar acesso',
        body: String(H`<form class="stack" style="--gap:14px" novalidate>
          <p class="t-sm t-muted">Dê acesso a um curso sem cobrança: bônus, parceria, troca por reembolso. Se a pessoa ainda não tem conta, criamos uma e enviamos o link para ela criar a senha.</p>
          ${fld({ l: 'E-mail', n: 'email', t: 'email', req: true, ph: 'pessoa@email.com', attrs: 'autocomplete="off" inputmode="email"' })}
          ${fld({ l: 'Nome', n: 'name', ph: 'Como a pessoa quer ser chamada', attrs: 'autocomplete="off"' })}
          ${fld({ l: 'Curso', n: 'course_id', t: 'select', v: F.course, opts: cs.map(function (c) { return [c.id, c.title]; }) })}
          ${fld({ l: 'Dias de acesso', n: 'days', t: 'number', ph: '0', post: 'dias', attrs: 'min="0" max="3650" step="1" inputmode="numeric"', hint: 'Vazio ou zero segue o prazo do curso (vitalício, se ele for assim).' })}
          ${sw({ l: 'Avisar a pessoa por e-mail', n: 'notify', v: true, hint: 'Envia o acesso, ou o link para criar a senha.' })}
        </form>`),
        actions: [{ label: 'Cancelar' }, {
          label: 'Liberar acesso', kind: 'primary',
          onClick: function (mm) {
            var v = B.formData(B.$('form', mm.el)), er = B.$('[data-err="email"]', mm.el);
            if (!B.validEmail(v.email)) { er.textContent = 'Informe um e-mail válido.'; er.hidden = false; B.$('[name=email]', mm.el).focus(); return false; }
            return B.api('adminGrant', { email: String(v.email).trim(), name: v.name, course_id: v.course_id, days: Number(v.days) || 0, notify: !!v.notify }).then(function (r) {
              var nm = (r.user && r.user.name) || v.email;
              B.toast(r.created ? 'Acesso liberado. Criamos a conta de ' + nm + '.' : 'Acesso liberado para ' + nm + '.', 'ok', 5200);
              if (ctx.live()) load();
            });
          }
        }]
      });
      guardForm(m);
    }

    function onContact(ev) {
      var d = ev.detail || {}, u = data && data.students.filter(function (x) { return x.id === d.user_id; })[0]; if (!u) return;
      u.last_contact = { ts: Date.now(), type: d.channel || 'wa', title: d.title || '' };
      if (opened && opened.u === u) opened.repaint(); else paint();
    }
    window.addEventListener('adm:contact', onContact);
    S.teardown = function () { window.removeEventListener('adm:contact', onContact); };

    S.on.change = function (ev) { var t = ev.target, k = t && t.dataset && t.dataset.f; if (k === 'course') { F.course = t.value; load(); } };
    S.on.input = function (ev) { var t = ev.target; if (t && t.dataset && t.dataset.f === 'q') { F.q = t.value; deb(); } };
    S.on.keydown = rowKeys;
    S.on.submit = function (ev) { ev.preventDefault(); };
    S.acts = {
      'open-student': function (el) { openStudent(el.dataset.id); },
      grant: function () { grantModal(); },
      retry: function () { load(); },
      idle: function (el) {
        var d = Number(el.dataset.d) || 0; if (d === F.inactive) return;
        F.inactive = d;
        $$('[data-act=idle]', root).forEach(function (b) { var on = Number(b.dataset.d) === d; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
        load();
      },
      csv: function () {
        if (!data || !data.students.length) { B.toast('Não há alunos para exportar.', 'info'); return; }
        exportCsv('alunos', ['Nome', 'E-mail', 'Telefone', 'Cursos', 'Progresso médio (%)', 'Gasto', 'Último acesso', 'Dias sem acessar', 'Onde parou', 'Último contato', 'Cadastro', 'Nível', 'Status'],
          data.students.map(function (u) {
            var cur = u.current, lc = u.last_contact;
            return [u.name, u.email, u.phone, (u.courses || []).map(function (c) { return c.title; }).join(' | '), avgPct(u), num2(u.spent), u.last_seen ? B.fmt.datetime(u.last_seen) : '', u.days_away == null ? '' : u.days_away,
              cur ? cur.course_title + (cur.label ? ' ' + cur.label : '') + ' (' + cur.pct + '%)' : '', lc ? B.fmt.datetime(lc.ts) + ' ' + (lc.type === 'wa' ? 'WhatsApp' : 'E-mail') : '',
              B.fmt.date(u.created_at), u.level, u.status === 'blocked' ? 'Bloqueado' : 'Ativo'];
          }));
      }
    };
  }

  /* =====================================================================
     AFILIADOS
     ===================================================================== */
  function pageAffiliates(ctx) {
    var root = pageEl(), data = null, tab = ctx.query.get('aba') || '';
    setTitle('Afiliados');
    root.innerHTML = String(H`${pgHead('Afiliados', 'Quem divulga os seus cursos, quanto vendeu e o que falta pagar.')}${bandSkel(4)}${skel(260)}`);
    load();

    function load() {
      return getAffiliates(true).then(function (d) {
        if (!ctx.live()) return;
        data = d; S.counts.aff = (d.pending || []).length; paintCounts();
        if (!tab) tab = d.pending.length ? 'pend' : 'affs';
        paint();
      }).catch(function (e) { if (ctx.live()) root.innerHTML = String(H`${pgHead('Afiliados')}${errorState(e, 'retry')}`); });
    }
    function byId(id) { return data.affiliates.filter(function (a) { return a.id === id; })[0]; }
    function nameOf(id) { var a = byId(id); return a ? a.name : 'Conta removida'; }

    function paint() {
      var d = data, aff = d.affiliates, avail = sumBy(aff, 'available'), wait = sumBy(aff, 'pending'), paid = sumBy(aff, 'paid');
      var withBal = aff.filter(function (a) { return a.available > 0; }).length, paidN = aff.filter(function (a) { return a.paid > 0; }).length;
      root.innerHTML = String(H`
        ${pgHead('Afiliados', 'Quem divulga os seus cursos, quanto vendeu e o que falta pagar.')}
        <section class="kband" aria-label="Resumo do programa">
          ${kpiTile('Pedidos pendentes', int(d.pending.length), d.pending.length ? 'esperando a sua resposta' : 'nada na fila', d.pending.length ? 'kpi--warn' : '')}
          ${kpiTile('Disponível para pagar', moneyK(avail), withBal ? plural(withBal, 'afiliado com saldo', 'afiliados com saldo') : 'nenhum saldo liberado', avail ? 'kpi--hero' : '')}
          ${kpiTile('Em carência', moneyK(wait), 'aguardando o prazo de garantia')}
          ${kpiTile('Já pago', moneyK(paid), plural(paidN, 'afiliado pago', 'afiliados pagos'))}
        </section>
        ${tabsBar([['pend', 'Pedidos pendentes', d.pending.length || ''], ['affs', 'Afiliados', aff.length || ''], ['pay', 'Pagamentos', '']], tab, 'tab')}
        <div class="tabpane">${tab === 'pend' ? pendPane() : tab === 'pay' ? payPane() : affPane()}</div>`);
    }

    function pendPane() {
      var p = data.pending;
      if (!p.length) return H`<div class="panel">${emptyState('Nenhum pedido pendente', 'Quando alguém pedir para divulgar um curso, o pedido aparece aqui e no número do menu. Prefere aprovar sozinho? Ligue a aprovação automática na aba Afiliação do curso.', H`<a class="btn" href="#/cursos">Ver cursos</a>`, 'check')}</div>`;
      return H`<div class="pend">${p.map(function (q) {
        var u = q.user || { name: 'Conta removida' }, c = q.course || { title: '(curso removido)', aff_commission: 0 };
        return H`<article class="panel pend__card">
          <div class="pend__who">${raw(B.avatar(u, 44))}<div class="min0"><b class="ellipsis" style="display:block">${u.name}</b><div class="t-xs t-faint ellipsis">${u.email || ''}</div>${u.instagram ? H`<a class="t-xs" href="${B.safeUrl(igLink(u.instagram))}" target="_blank" rel="noopener">${igName(u.instagram)}</a>` : ''}</div><span class="t-xs t-faint nowrap">${B.fmt.rel(q.created_at)}</span></div>
          ${dl([['Quer divulgar', c.title], ['Comissão padrão', B.fmt.pct(c.aff_commission, 0)]])}
          <div class="row pend__acts"><button type="button" class="btn btn--primary btn--sm" data-act="aff-ok" data-id="${q.id}">${ic('check')}Aprovar</button><button type="button" class="btn btn--sm btn--danger" data-act="aff-no" data-id="${q.id}">Recusar</button></div>
        </article>`;
      })}</div>`;
    }
    function affRow(a) {
      var list = a.affiliations || [], ok = list.filter(function (x) { return x.status === 'approved'; }).length;
      return H`<tr>
        <td><div class="cell-person">${raw(B.avatar(a, 34))}<div class="min0"><div class="ellipsis cell-name"><b>${a.name}</b></div><div class="t-xs t-faint ellipsis cell-name">${a.email}</div></div>${a.status === 'blocked' ? chip('Bloqueado', 'bad') : ''}</div></td>
        <td class="nowrap">${a.aff_code ? H`<span class="code">${a.aff_code}</span>${copyBtn(a.aff_code, 'Copiar código')}` : '—'}</td>
        <td class="num">${ok}<span class="t-faint"> / ${list.length}</span></td>
        <td class="num">${int(a.clicks)}</td><td class="num">${int(a.sales)}</td><td class="num">${money(a.revenue)}</td>
        <td class="num nowrap">${a.month_sales ? H`<b>${money(a.month_revenue)}</b><div class="t-xs t-faint">${plural(a.month_sales, 'venda', 'vendas')} · ${money(a.month_commission)} de comissão</div>` : H`<span class="t-faint">sem vendas</span>`}</td>
        <td class="num t-faint">${money(a.pending)}</td>
        <td class="num"><b class="${a.available > 0 ? 't-mustard' : 't-faint'}">${money(a.available)}</b></td>
        <td class="num">${money(a.paid)}</td>
        <td class="nowrap">${a.pix_key ? H`<span class="pix ellipsis" title="${a.pix_key}">${a.pix_key}</span>${copyBtn(a.pix_key, 'Copiar chave Pix')}` : chip('Sem chave Pix', 'warn')}</td>
        <td class="num"><div class="aff-acts">${a.available > 0 ? H`<button type="button" class="btn btn--primary btn--sm" data-act="pay" data-id="${a.id}">Pagar ${money(a.available)}</button>` : ''}<div class="row row--end" style="--gap:6px"><button type="button" class="iconbtn iconbtn--sm iconbtn--wa" data-wa="affiliate" data-id="${a.id}" data-initial="${a.available > 0 ? 'wa_aff_payout' : ''}" aria-label="Chamar ${a.name} no WhatsApp com mensagem pronta" title="WhatsApp com mensagem pronta">${ic('whatsapp')}</button><button type="button" class="btn btn--sm" data-act="manage" data-id="${a.id}">Gerenciar</button></div></div></td>
      </tr>`;
    }
    function affPane() {
      var aff = data.affiliates;
      if (!aff.length) return H`<div class="panel">${emptyState('Nenhum afiliado ainda', 'Abra o programa em um curso (aba Afiliação) e publique o curso. Quem pedir para divulgar aparece em Pedidos pendentes.', H`<a class="btn" href="#/cursos">Ver cursos</a>`, 'users')}</div>`;
      return H`<div class="table-wrap"><table class="table affs">
        <thead><tr><th>Afiliado</th><th>Código</th><th class="num">Cursos</th><th class="num">Cliques</th><th class="num">Vendas</th><th class="num">Receita</th><th class="num">No mês</th><th class="num">A liberar</th><th class="num">Disponível</th><th class="num">Pago</th><th>Chave Pix</th><th></th></tr></thead>
        <tbody>${aff.map(affRow)}</tbody></table></div>`;
    }
    function payPane() {
      var p = data.payouts || [];
      if (!p.length) return H`<div class="panel">${emptyState('Nenhum pagamento registrado', 'Quando você pagar uma comissão por Pix e registrar aqui, o histórico fica guardado nesta aba.', '', 'wallet')}</div>`;
      return H`<div class="table-wrap"><table class="table">
        <thead><tr><th>Data</th><th>Afiliado</th><th class="num">Valor</th><th class="num">Vendas</th><th>Chave Pix</th><th>Observação</th></tr></thead>
        <tbody>${p.map(function (y) { return H`<tr><td class="nowrap">${B.fmt.datetime(y.created_at)}</td><td><div class="ellipsis cell-name"><b>${nameOf(y.aff_id)}</b></div></td><td class="num"><b>${money(y.amount)}</b></td><td class="num">${int(y.count)}</td><td><span class="pix ellipsis" title="${y.pix_key}">${y.pix_key || '—'}</span></td><td class="t-muted"><div class="ellipsis cell-course">${y.note || '—'}</div></td></tr>`; })}</tbody></table></div>
        ${p.length >= 50 ? H`<p class="hint" style="margin-top:8px">Mostrando os 50 pagamentos mais recentes.</p>` : ''}`;
    }

    function setAff(el, id, status, msg) {
      busy(el, B.api('adminAffiliation', { id: id, status: status })).then(function () { drop('affs'); B.toast(msg, 'ok'); return load(); }).catch(B.fail);
    }
    function manageBody(p) {
      return H`<div class="stu">
        <div class="stu__head">${raw(B.avatar(p, 56))}
          <div class="min0"><h3 class="t-3 ellipsis">${p.name}</h3><div class="t-sm t-muted stu__contact"><span>${p.email}</span>${copyBtn(p.email, 'Copiar e-mail')}${p.instagram ? H`<a href="${B.safeUrl(igLink(p.instagram))}" target="_blank" rel="noopener">${igName(p.instagram)}</a>` : ''}</div>
            <div class="row" style="--gap:6px;margin-top:8px">${p.aff_code ? chip('Código ' + p.aff_code, 'mustard') : ''}${p.status === 'blocked' ? chip('Conta bloqueada', 'bad') : ''}${p.pix_key ? chip('Pix: ' + trunc(p.pix_key, 28), '') : chip('Sem chave Pix', 'warn')}</div></div>
        </div>
        ${dl([['Cliques', int(p.clicks)], ['Vendas', int(p.sales)], ['Receita', money(p.revenue)], ['Disponível', money(p.available)],
          ['Vendas no mês', int(p.month_sales)], ['Vendido no mês', money(p.month_revenue)], ['Comissão do mês', money(p.month_commission)], ['Em garantia', money(p.pending)]])}
        <div class="row stu__talk"><button type="button" class="btn btn--sm btn--primary" data-wa="affiliate" data-id="${p.id}" data-initial="${p.available > 0 ? 'wa_aff_payout' : 'wa_aff_month'}">${ic('whatsapp')}WhatsApp com mensagem pronta</button></div>
        <h4 class="t-hud-sub stu__h">Afiliações por curso</h4>
        ${(p.affiliations || []).length ? H`<ul class="enr">${p.affiliations.map(function (a) {
          return H`<li class="enr__it enr__it--wrap"><div class="enr__main min0">
              <div class="enr__title ellipsis">${a.course_title}</div>
              <div class="enr__meta t-xs t-faint">${stChip(AFF_ST, a.status)}<span>pedido ${B.fmt.date(a.created_at)}</span></div>
            </div>
            <div class="aff-ctl">
              <div class="input-group aff-comm"><input class="input" type="number" min="0" max="90" step="1" inputmode="numeric" data-comm="${a.id}" data-orig="${a.commission || 0}" value="${a.commission > 0 ? a.commission : ''}" placeholder="${a.default_commission}" aria-label="Comissão personalizada em ${a.course_title}"><span class="addon addon--end">%</span></div>
              ${a.status === 'pending' ? H`<button type="button" class="btn btn--sm" data-m="st" data-id="${a.id}" data-st="approved">Aprovar</button><button type="button" class="btn btn--sm btn--danger" data-m="st" data-id="${a.id}" data-st="rejected">Recusar</button>` : ''}
              ${a.status === 'approved' ? H`<button type="button" class="btn btn--sm btn--danger" data-m="st" data-id="${a.id}" data-st="blocked">Bloquear</button>` : ''}
              ${a.status === 'rejected' || a.status === 'blocked' ? H`<button type="button" class="btn btn--sm" data-m="st" data-id="${a.id}" data-st="approved">${a.status === 'blocked' ? 'Desbloquear' : 'Aprovar'}</button>` : ''}
            </div>
          </li>`;
        })}</ul><p class="hint">Comissão em branco usa o percentual padrão do curso (mostrado no campo).</p>` : H`<p class="hint">Sem afiliações.</p>`}
      </div>`;
    }
    function manage(id) {
      var p = byId(id); if (!p) return;
      var m = B.modal({ title: 'Gerenciar afiliado', size: 'wide', body: String(manageBody(p)), actions: [{ label: 'Fechar' }] });
      function refresh() {
        return getAffiliates(true).then(function (d) {
          data = d; S.counts.aff = d.pending.length; paintCounts();
          p = byId(id) || p; m.body.innerHTML = String(manageBody(p));
          if (ctx.live()) paint();
        });
      }
      B.on(m.body, 'click', '[data-m="st"]', function (ev, el) {
        busy(el, B.api('adminAffiliation', { id: el.dataset.id, status: el.dataset.st })).then(function () { B.toast(el.dataset.st === 'approved' ? 'Afiliação aprovada' : el.dataset.st === 'blocked' ? 'Afiliação bloqueada' : 'Pedido recusado', 'ok'); return refresh(); }).catch(B.fail);
      });
      m.body.addEventListener('change', function (ev) {
        var t = ev.target; if (!t.dataset || t.dataset.comm == null) return;
        var v = t.value === '' ? 0 : Math.max(0, Math.min(90, Number(t.value) || 0));
        if (String(v) === String(t.dataset.orig)) return;
        B.api('adminAffiliation', { id: t.dataset.comm, commission: v }).then(function () { B.toast(v ? 'Comissão personalizada salva' : 'Voltou à comissão padrão', 'ok'); return refresh(); }).catch(B.fail);
      });
    }

    S.acts = {
      tab: function (el) { tab = el.dataset.tab; paint(); },
      retry: function () { load(); },
      'aff-ok': function (el) { setAff(el, el.dataset.id, 'approved', 'Afiliado aprovado'); },
      'aff-no': function (el) { setAff(el, el.dataset.id, 'rejected', 'Pedido recusado'); },
      manage: function (el) { manage(el.dataset.id); },
      pay: function (el) {
        var a = byId(el.dataset.id); if (!a) return;
        B.confirm({
          title: 'Registrar pagamento',
          text: 'Marcar ' + money(a.available) + ' como pago para ' + a.name + (a.pix_key ? ', chave Pix ' + a.pix_key + '.' : ', que ainda não cadastrou uma chave Pix.') + ' A plataforma não move dinheiro: faça o Pix primeiro e confirme depois. As comissões liberadas viram pagas e a pessoa recebe um e-mail.',
          ok: 'Registrar pagamento'
        }).then(function (ok) {
          if (!ok) return;
          busy(el, B.api('adminPayout', { aff_id: a.id })).then(function () { drop('affs'); B.toast('Pagamento registrado', 'ok'); return load(); }).catch(B.fail);
        });
      }
    };
  }

  /* =====================================================================
     CUPONS
     ===================================================================== */
  function pageCoupons(ctx) {
    var root = pageEl(), list = null, courses = [], affs = [];
    setTitle('Cupons');
    root.innerHTML = String(H`${pgHead('Cupons', 'Códigos de desconto para anúncios, parcerias e recuperação de vendas.', H`<button class="btn btn--primary" type="button" data-act="new">${ic('plus')}Novo cupom</button>`)}
      <div id="cp-out">${skel(240)}</div>`);
    Promise.all([B.api('adminCoupons'), getCourses().catch(function () { return []; }), getAffiliates().catch(function () { return { affiliates: [] }; })]).then(function (r) {
      if (!ctx.live()) return;
      list = r[0].coupons || []; courses = r[1] || []; affs = (r[2] && r[2].affiliates) || [];
      paint();
    }).catch(function (e) { if (ctx.live()) $('#cp-out', root).innerHTML = String(errorState(e, 'retry')); });

    function byId(id) { return list.filter(function (c) { return c.id === id; })[0]; }
    function discText(c) { return c.type === 'fixed' ? money(c.value) : B.fmt.pct(c.value, 2); }
    function row(c) {
      var now = Date.now(), expired = c.expires_at && c.expires_at < now, spent = c.max_uses && (c.uses || 0) >= c.max_uses;
      return H`<tr>
        <td class="nowrap"><span class="code">${c.code}</span>${copyBtn(c.code, 'Copiar código')}</td>
        <td class="nowrap"><b>${discText(c)}</b><div class="t-xs t-faint">${c.type === 'fixed' ? 'valor fixo' : 'do valor'}</div></td>
        <td><div class="ellipsis cell-course">${c.course_title}</div></td>
        <td class="num nowrap">${int(c.uses || 0)}${c.max_uses ? H`<span class="t-faint"> / ${int(c.max_uses)}</span>` : H`<span class="t-faint"> · sem limite</span>`}${spent ? H`<div>${chip('Esgotado', 'warn')}</div>` : ''}</td>
        <td class="nowrap">${c.expires_at ? H`${B.fmt.date(c.expires_at)}${expired ? H`<div>${chip('Expirou', 'bad')}</div>` : H`<div class="t-xs t-faint">${B.fmt.rel(c.expires_at)}</div>`}` : H`<span class="t-faint">Sem prazo</span>`}</td>
        <td class="nowrap">${c.aff_code ? chip(c.aff_code, 'mustard') : H`<span class="t-faint">—</span>`}</td>
        <td><label class="switch"><input type="checkbox" data-toggle="${c.id}"${raw(c.active ? ' checked' : '')}><span class="sr-only">Cupom ${c.code} ativo</span></label></td>
        <td class="num"><div class="row row--end" style="--gap:2px;justify-content:flex-end"><button type="button" class="iconbtn iconbtn--sm" data-act="edit" data-id="${c.id}" aria-label="Editar cupom ${c.code}" title="Editar">${ic('edit')}</button><button type="button" class="iconbtn iconbtn--sm iconbtn--bad" data-act="del" data-id="${c.id}" aria-label="Excluir cupom ${c.code}" title="Excluir">${ic('trash')}</button></div></td>
      </tr>`;
    }
    function paint() {
      var out = $('#cp-out', root); if (!out) return;
      var act = list.filter(function (c) { return c.active; }).length, uses = list.reduce(function (s, c) { return s + (c.uses || 0); }, 0);
      out.innerHTML = String(H`
        <div class="note">${ic('info')}<span><b>Cupom ligado a um afiliado credita a venda a ele.</b> Mesmo que o cliente não tenha entrado pelo link, a comissão vai para quem está vinculado. Serve para código na bio, parcerias e campanhas com rastreio.</span></div>
        ${list.length ? H`
          <div class="list-cap"><span class="t-sm t-muted">${plural(list.length, 'cupom', 'cupons')} · ${act} ${act === 1 ? 'ativo' : 'ativos'} · ${plural(uses, 'uso', 'usos')} no total</span></div>
          <div class="table-wrap"><table class="table coupons">
            <thead><tr><th>Código</th><th>Desconto</th><th>Curso</th><th class="num">Usos</th><th>Validade</th><th>Afiliado</th><th>Ativo</th><th></th></tr></thead>
            <tbody>${list.map(row)}</tbody></table></div>`
        : H`<div class="panel">${emptyState('Nenhum cupom ainda', 'Crie um código para usar em anúncios, e-mails de recuperação ou parcerias.', H`<button class="btn btn--primary" type="button" data-act="new">${ic('plus')}Criar o primeiro cupom</button>`, 'tag')}</div>`}`);
    }

    function genCode() { var w = ['BRASA', 'FOGO', 'VIP', 'AMIGO', 'LANCA']; return w[Math.floor(Math.random() * w.length)] + (10 + Math.floor(Math.random() * 90)); }
    function couponModal(c) {
      var edit = !!c; c = c || { code: '', type: 'percent', value: 10, course_id: '', max_uses: 0, expires_at: 0, aff_code: '', active: true };
      var cOpts = [['', 'Todos os cursos']].concat(courses.filter(function (x) { return x.status !== 'archived' || x.id === c.course_id; }).map(function (x) { return [x.id, x.title]; }));
      var aOpts = [['', 'Nenhum']].concat(affs.filter(function (a) { return a.aff_code; }).map(function (a) { return [a.aff_code, a.aff_code + ' · ' + a.name]; }));
      if (c.aff_code && !aOpts.some(function (x) { return x[0] === c.aff_code; })) aOpts.push([c.aff_code, c.aff_code]);
      var m = B.modal({
        title: edit ? 'Editar cupom' : 'Novo cupom', size: 'wide',
        body: String(H`<form class="stack" style="--gap:14px" novalidate>
          <div class="field"><label for="cp-code">Código <span class="req">*</span></label>
            <div class="input-group"><input class="input" id="cp-code" name="code" value="${c.code}" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="BRASA20"><button type="button" class="btn btn--sm addon-btn" data-m="gen">${ic('refresh')}Gerar</button></div>
            <div class="hint">Só letras e números, sem espaços. O cliente digita no checkout, em maiúsculas.</div><div class="err" data-err="code" hidden></div></div>
          <div class="grid-2">
            ${fld({ l: 'Tipo de desconto', n: 'type', t: 'select', v: c.type, opts: [['percent', 'Porcentagem (%)'], ['fixed', 'Valor fixo (R$)']] })}
            <div class="field"><label for="cp-val">Valor <span class="req">*</span></label><div class="input-group"><span class="addon" id="cp-pre" ${c.type === 'fixed' ? '' : raw('hidden')}>R$</span><input class="input" id="cp-val" name="value" type="number" min="0" step="0.01" inputmode="decimal" value="${c.value}"><span class="addon addon--end" id="cp-post" ${c.type === 'fixed' ? raw('hidden') : ''}>%</span></div><div class="err" data-err="value" hidden></div></div>
          </div>
          ${fld({ l: 'Vale para', n: 'course_id', t: 'select', v: c.course_id, opts: cOpts })}
          <div class="grid-2">
            ${fld({ l: 'Limite de usos', n: 'max_uses', t: 'number', v: c.max_uses || '', ph: '0', attrs: 'min="0" step="1" inputmode="numeric"', hint: 'Vazio ou zero é ilimitado.' })}
            ${fld({ l: 'Válido até', n: 'expires_at', t: 'date', v: B.dateInput(c.expires_at), attrs: 'data-end', hint: 'Vazio não tem prazo. Vale até o fim desse dia.' })}
          </div>
          ${fld({ l: 'Afiliado vinculado', n: 'aff_code', t: 'select', v: c.aff_code, opts: aOpts, hint: 'A venda feita com este cupom é creditada a esse afiliado, com a comissão dele.' })}
          ${sw({ l: 'Cupom ativo', n: 'active', v: c.active, hint: 'Desligado, o código deixa de funcionar sem ser apagado.' })}
        </form>`),
        actions: [{ label: 'Cancelar' }, {
          label: edit ? 'Salvar cupom' : 'Criar cupom', kind: 'primary',
          onClick: function (mm) {
            var v = B.formData(B.$('form', mm.el)), e1 = B.$('[data-err="code"]', mm.el), e2 = B.$('[data-err="value"]', mm.el);
            e1.hidden = e2.hidden = true;
            var code = String(v.code || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
            if (code.length < 3) { e1.textContent = 'O código precisa ter pelo menos 3 letras ou números.'; e1.hidden = false; B.$('[name=code]', mm.el).focus(); return false; }
            var val = Number(v.value) || 0;
            if (val <= 0) { e2.textContent = 'Informe o valor do desconto.'; e2.hidden = false; B.$('[name=value]', mm.el).focus(); return false; }
            if (v.type === 'percent' && val > 100) { e2.textContent = 'A porcentagem vai até 100.'; e2.hidden = false; return false; }
            var o = { code: code, type: v.type, value: val, course_id: v.course_id, max_uses: Number(v.max_uses) || 0, expires_at: v.expires_at || 0, aff_code: v.aff_code, active: !!v.active };
            if (edit) o.id = c.id;
            return B.api('adminCouponSave', { coupon: o }).then(function (r) {
              var cs = courses.filter(function (x) { return x.id === r.coupon.course_id; })[0];
              var row2 = Object.assign({ course_title: cs ? cs.title : 'Todos os cursos' }, r.coupon);
              if (edit) { var i = list.indexOf(byId(c.id)); if (i > -1) list[i] = Object.assign({}, list[i], row2); }
              else list.unshift(row2);
              B.toast(edit ? 'Cupom salvo' : 'Cupom criado', 'ok'); if (ctx.live()) paint();
            });
          }
        }]
      });
      guardForm(m);
      var type = B.$('[name=type]', m.el), code = B.$('[name=code]', m.el);
      type.addEventListener('change', function () { var fx = type.value === 'fixed'; B.$('#cp-pre', m.el).hidden = !fx; B.$('#cp-post', m.el).hidden = fx; });
      code.addEventListener('input', function () { var p = code.selectionStart; code.value = code.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''); try { code.setSelectionRange(p, p); } catch (e) {} });
      B.on(m.body, 'click', '[data-m="gen"]', function () { code.value = genCode(); code.focus(); });
    }

    S.on.change = function (ev) {
      var t = ev.target; if (!t.dataset || !t.dataset.toggle) return;
      var c = byId(t.dataset.toggle); if (!c) return;
      var v = t.checked; t.disabled = true;
      B.api('adminCouponSave', { coupon: Object.assign({}, c, { active: v }) }).then(function (r) { Object.assign(c, r.coupon); t.disabled = false; B.toast(v ? 'Cupom ativado' : 'Cupom pausado', 'ok', 1800); }).catch(function (e) { t.checked = !v; t.disabled = false; B.fail(e); });
    };
    S.acts = {
      'new': function () { couponModal(null); },
      edit: function (el) { var c = byId(el.dataset.id); if (c) couponModal(c); },
      del: function (el) {
        var c = byId(el.dataset.id); if (!c) return;
        B.confirm({ title: 'Excluir cupom', text: 'O código ' + c.code + ' deixa de funcionar. Pedidos que já usaram o cupom continuam como estão. Para só pausar, desligue o cupom na lista.', ok: 'Excluir cupom', danger: true }).then(function (ok) {
          if (!ok) return;
          B.api('adminCouponDelete', { id: c.id }).then(function () { list = list.filter(function (x) { return x.id !== c.id; }); B.toast('Cupom excluído', 'ok'); paint(); }).catch(B.fail);
        });
      },
      retry: function () { pageCoupons(ctx); }
    };
  }

  /* =====================================================================
     SUPORTE
     ===================================================================== */
  function pageSupport(ctx) {
    var root = pageEl(), threads = [], sel = ctx.query.get('u') || '', msgs = [], timer = null, sending = false, listErr = '';
    setTitle('Suporte');
    root.innerHTML = String(H`${pgHead('Suporte', 'Conversas com alunos e afiliados. Quando a pessoa está fora do painel, a resposta também vai por e-mail.')}
      <div class="sup${sel ? ' is-open' : ''}" id="sup">
        <aside class="sup__list" aria-label="Conversas"><div id="sup-list" class="sup__scroll">${skel(66)}${skel(66)}${skel(66)}</div></aside>
        <section class="sup__thread" id="sup-thread" aria-label="Conversa"></section>
      </div>`);
    paintThread();
    S.teardown = function () { clearInterval(timer); };
    loadList(false).then(function () { if (sel && ctx.live()) openThread(sel); });
    timer = setInterval(tick, 10000);

    function tick() { if (document.hidden || !ctx.live()) return; loadList(true); if (sel) loadThread(sel, true); }
    function updateCount() {
      S.counts.msg = threads.reduce(function (s, t) { return s + (t.user_id === sel ? 0 : (t.unread || 0)); }, 0);
      paintCounts();
    }
    function loadList(silent) {
      return B.api('adminInbox').then(function (r) {
        if (!ctx.live()) return;
        threads = r.threads || []; listErr = '';
        paintList(); updateCount();
      }).catch(function (e) { if (!ctx.live() || silent) return; listErr = (e && e.message) || 'Tente de novo em instantes.'; paintList(); });
    }
    function thrItem(t) {
      var u = t.user || { name: 'Conta removida' }, last = t.last || {}, unread = t.user_id === sel ? 0 : (t.unread || 0), on = t.user_id === sel;
      return H`<li><button type="button" class="thr${on ? ' is-active' : ''}${unread ? ' is-unread' : ''}" data-act="open-thread" data-id="${t.user_id}" ${on ? raw('aria-current="true"') : ''}>
        ${raw(B.avatar(u, 40))}
        <span class="thr__main"><span class="thr__top"><b class="ellipsis">${u.name}</b><span class="t-xs t-faint nowrap">${B.fmt.rel(last.ts)}</span></span>
        <span class="thr__bot">${roleChip(u)}<span class="thr__prev ellipsis">${last.from === 'admin' ? 'Você: ' : ''}${trunc(last.text, 90)}</span>${unread ? H`<span class="thr__badge" aria-label="${unread} não lidas">${unread}</span>` : ''}</span></span>
      </button></li>`;
    }
    function paintList() {
      var el = $('#sup-list', root); if (!el) return;
      if (listErr) { el.innerHTML = String(emptyState('Não foi possível carregar', listErr, H`<button class="btn" type="button" data-act="retry">${ic('refresh')}Tentar de novo</button>`, 'alert')); return; }
      if (!threads.length) { el.innerHTML = String(emptyState('Nenhuma conversa ainda', 'Quando alguém escrever pelo painel do aluno ou do afiliado, a conversa aparece aqui.', '', 'chat')); return; }
      el.innerHTML = String(H`<ul class="thr-list">${threads.map(thrItem)}</ul>`);
    }
    function bubble(m) {
      return H`<div class="msg msg--${m.from === 'admin' ? 'out' : 'in'}"><div class="msg__b">${raw(B.nl2br(m.text))}</div><div class="msg__t t-xs t-faint">${m.from === 'admin' ? 'Você · ' : ''}${B.fmt.datetime(m.ts)}</div></div>`;
    }
    function paintMsgs(stick) {
      var el = $('#sup-msgs', root); if (!el) return;
      var near = stick || el.scrollHeight - el.scrollTop - el.clientHeight < 90;
      el.innerHTML = String(msgs.length ? H`${msgs.map(bubble)}` : H`<p class="t-muted t-sm" style="text-align:center;padding:24px">Sem mensagens ainda.</p>`);
      if (near) el.scrollTop = el.scrollHeight;
    }
    function currentUser() { var t = threads.filter(function (x) { return x.user_id === sel; })[0]; return (t && t.user) || { id: sel, name: 'Conversa', roles: [] }; }
    function paintThread() {
      var el = $('#sup-thread', root); if (!el) return;
      if (!sel) { el.innerHTML = String(emptyState('Escolha uma conversa', 'Selecione alguém na lista para ler e responder.', '', 'chat')); return; }
      var u = currentUser();
      el.innerHTML = String(H`
        <header class="thd__head"><button type="button" class="iconbtn show-back" data-act="back" aria-label="Voltar às conversas">${ic('left')}</button>${raw(B.avatar(u, 40))}<div class="min0"><b class="ellipsis" style="display:block">${u.name}</b><div class="t-xs t-faint ellipsis">${u.email || ''}</div></div>${roleChip(u)}</header>
        <div class="thd__msgs" id="sup-msgs" role="log" aria-live="polite" tabindex="0">${msgs.length ? '' : skel(52)}</div>
        <form class="thd__form" id="sup-form"><label class="sr-only" for="sup-text">Sua resposta</label><textarea class="textarea" id="sup-text" rows="2" maxlength="4000" placeholder="Escreva a resposta. Enter envia, Shift+Enter quebra a linha."></textarea><button class="btn btn--primary" type="button" data-act="send">${ic('send')}<span>Enviar</span></button></form>`);
      if (msgs.length) paintMsgs(true);
    }
    function loadThread(id, silent) {
      return B.api('adminThread', { user_id: id }).then(function (r) {
        if (!ctx.live() || sel !== id) return;
        var last = r.messages[r.messages.length - 1], prev = msgs[msgs.length - 1];
        var changed = !silent || r.messages.length !== msgs.length || (last && prev && last.id !== prev.id);
        msgs = r.messages;
        var t = threads.filter(function (x) { return x.user_id === id; })[0];
        if (t && t.unread) { t.unread = 0; paintList(); updateCount(); }
        if (changed) paintMsgs(!silent);
      }).catch(function (e) { if (!silent) B.fail(e); });
    }
    function openThread(id) {
      sel = id; msgs = [];
      var t = threads.filter(function (x) { return x.user_id === id; })[0]; if (t) t.unread = 0;
      var box = $('#sup', root); if (box) box.classList.add('is-open');
      paintList(); updateCount(); paintThread();
      return loadThread(id, false).then(function () { var ta = $('#sup-text', root); if (ta && !('ontouchstart' in window)) ta.focus(); });
    }
    function send() {
      var ta = $('#sup-text', root), btn = $('[data-act="send"]', root); if (!ta || !sel || sending) return;
      var text = ta.value.trim(); if (!text) { ta.focus(); return; }
      sending = true; btn.classList.add('is-loading');
      var to = sel;
      B.api('adminReply', { user_id: to, text: text }).then(function (r) {
        if (!ctx.live()) return;
        if (sel === to) { ta.value = ''; msgs.push(r.message); paintMsgs(true); }
        var t = threads.filter(function (x) { return x.user_id === to; })[0];
        if (t) { t.last = { text: r.message.text, ts: r.message.ts, from: 'admin' }; threads.sort(function (a, b) { return b.last.ts - a.last.ts; }); paintList(); }
      }).catch(B.fail).then(function () { sending = false; btn.classList.remove('is-loading'); ta.focus(); });
    }

    S.on.keydown = function (ev) {
      if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing && ev.target.id === 'sup-text') { ev.preventDefault(); send(); }
    };
    S.on.submit = function (ev) { ev.preventDefault(); };
    S.acts = {
      'open-thread': function (el) { openThread(el.dataset.id); },
      back: function () {
        sel = ''; msgs = []; var box = $('#sup', root); if (box) box.classList.remove('is-open');
        paintList(); updateCount(); paintThread();
      },
      send: function () { send(); },
      retry: function () { loadList(false); }
    };
  }

  /* =====================================================================
     CONFIGURAÇÕES
     ===================================================================== */
  var AI_MODELS = [['claude-sonnet-5-5', 'Claude Sonnet 5.5 · recomendado para textos de venda'], ['claude-haiku-5-5', 'Claude Haiku 5.5 · mais barato e rápido'], ['claude-opus-5-5', 'Claude Opus 5.5 · máxima qualidade']];
  var NUM_KEYS = ['max_installments', 'pix_expiration_min', 'commission_release_days', 'recovery_delay_min', 'aff_default_commission', 'aff_default_cookie_days', 'crm_inactive_days', 'seller_default_commission', 'seller_default_max_discount'];
  var SET_ANCHOR = { mercadopago: 'set-mercadopago', ia: 'set-ia', enderecos: 'set-enderecos', pixel: 'set-pixel', github: 'set-github', marca: 'set-marca', comercial: 'set-comercial', email: 'set-email' };

  function pageSettings(ctx) {
    var root = pageEl(), st = null, orig = '', logs = null, logLevel = '', logsOpen = false;
    setTitle('Configurações');
    root.innerHTML = String(H`${pgHead('Configurações', 'Marca, pagamentos, rastreamento e automações da plataforma.')}<div class="stack">${skel(200)}${skel(260)}</div>`);
    B.api('adminSettings').then(function (r) {
      if (!ctx.live()) return;
      st = r; render();
      var s = ctx.query.get('s'), id = SET_ANCHOR[s];
      if (id) later(function () { var el = $('#' + id, root); if (el) { el.scrollIntoView({ block: 'start', behavior: 'smooth' }); el.classList.add('is-flash'); setTimeout(function () { el.classList.remove('is-flash'); }, 2200); } }, 120);
    }).catch(function (e) { if (ctx.live()) root.innerHTML = String(H`${pgHead('Configurações')}${errorState(e, 'retry')}`); });
    function later(fn, ms) { return setTimeout(fn, ms); }

    function cv(k) {
      var v = st.config[k];
      if (k === 'installment_rate') return +(Number(v) * 100).toFixed(2);
      if (k === 'checkout_cpf' && v === 'none') return 'off';
      return v == null ? '' : v;
    }
    function cf(k, o) { return fld(Object.assign({ f: k, v: cv(k) }, o)); }
    function csw(k, o) { return sw(Object.assign({ f: k, v: !!st.config[k] }, o)); }
    function secretField(key, label, hint) {
      var on = !!st.secrets[key];
      return H`<div class="field">
        <label for="s-${key}">${label} ${secBadge(on)}</label>
        <div class="input-group"><input class="input" id="s-${key}" data-f="s:${key}" type="password" autocomplete="new-password" spellcheck="false" placeholder="${on ? 'Deixe vazio para manter a chave atual' : 'Cole a chave aqui'}"><button type="button" class="btn btn--sm addon-btn" data-act="reveal" data-k="${key}" aria-label="Mostrar ou ocultar a chave">${ic('eye')}</button></div>
        <div class="hint">${hint}</div>
        ${on ? H`<div><button type="button" class="btn btn--sm btn--ghost btn--danger" data-act="secret-clear" data-k="${key}">Remover chave salva</button></div>` : ''}
      </div>`;
    }
    function testBtn(what, label) {
      return H`<div class="test"><button type="button" class="btn btn--sm" data-act="test" data-what="${what}">${ic('zap')}${label || 'Testar conexão'}</button><div class="test-res" data-test-out="${what}" role="status" hidden></div></div>`;
    }
    function panel(id, title, sub, body) {
      return H`<section class="panel stack set-panel" id="set-${id}" style="--gap:16px">${panelHead(title, '', sub)}${body}</section>`;
    }

    function render() {
      var c = st.config, u = st.urls || {}, aiOpts = AI_MODELS.slice();
      if (!aiOpts.some(function (x) { return x[0] === c.ai_model; })) aiOpts.unshift([c.ai_model, c.ai_model]);
      var inst = []; for (var i = 1; i <= 12; i++) inst.push([i, i === 1 ? '1x (à vista)' : i + 'x']);
      var SH = { cf: cf, csw: csw, secretField: secretField, testBtn: testBtn, panel: panel, config: c, secrets: st.secrets || {}, demo: !!st.demo };
      root.innerHTML = String(H`
        ${pgHead('Configurações', 'Marca, pagamentos, rastreamento e automações da plataforma.', H`<div class="ed-save"><span class="ed-dirty" id="set-dirty" role="status" hidden>${ic('alert')}<span>Alterações não salvas</span></span><button class="btn btn--primary" type="button" id="set-save" data-act="save">${ic('check')}<span>Salvar configurações</span></button></div>`)}
        ${st.demo ? H`<div class="note">${ic('info')}<span><b>Modo demonstração.</b> Tudo fica só neste navegador e os testes de conexão são simulados. Em produção, as chaves ficam guardadas no servidor e nunca voltam para a tela.</span></div>` : ''}
        <div class="set-cols">
          ${panel('marca', 'Marca', 'Como a plataforma se apresenta.', H`
            <div class="note note--warn">${ic('alert')}<span>O nome da marca aparece em toda a plataforma: página de vendas, área do aluno, painel do afiliado, e-mails e certificados.</span></div>
            ${cf('brand_name', { l: 'Nome da marca', req: true, attrs: 'maxlength="40" autocomplete="off"' })}
            ${cf('brand_tagline', { l: 'Frase da marca', attrs: 'maxlength="120" autocomplete="off"', hint: 'Aparece sob o nome em algumas telas e nos e-mails.' })}
            <div class="field">
              <label for="set-logo">Logo (opcional)</label>
              <div class="imgf__row"><div class="imgf__thumb imgf__thumb--logo" id="logo-pv">${imgThumb(c.brand_logo)}</div>
                <div class="imgf__ctl"><input type="hidden" data-f="brand_logo" value="${c.brand_logo || ''}">
                  <div class="input-group"><input class="input" id="set-logo" data-logo-url type="url" inputmode="url" autocomplete="off" placeholder="${/^data:/i.test(c.brand_logo || '') ? 'Imagem enviada. Cole um endereço para trocar.' : 'https://… ou envie um PNG'}" value="${/^data:/i.test(c.brand_logo || '') ? '' : (c.brand_logo || '')}"><button type="button" class="btn btn--sm addon-btn" data-act="logo-up">${ic('upload')}Enviar</button></div>
                  <div class="hint">PNG com fundo transparente funciona melhor. Sem logo, a marca usa o nome com o sigilo.</div></div></div>
            </div>
            <div class="grid-2">
              ${cf('admin_email', { l: 'E-mail do administrador', t: 'email', attrs: 'autocomplete="off" inputmode="email"', hint: 'Recebe avisos de venda e testes.' })}
              ${cf('email_sender_name', { l: 'Nome do remetente', attrs: 'maxlength="60" autocomplete="off"', hint: 'Como os e-mails aparecem na caixa de entrada.' })}
            </div>`)}
          ${panel('atendimento', 'Atendimento', 'Onde o aluno pede ajuda e lê as regras.', H`
            ${cf('support_whatsapp', { l: 'WhatsApp de atendimento', ph: '5511999999999', attrs: 'inputmode="tel" autocomplete="off"', hint: 'Com DDI e DDD, só números. Vira o botão de ajuda nas páginas.' })}
            ${cf('support_email', { l: 'E-mail de atendimento', t: 'email', attrs: 'autocomplete="off" inputmode="email"' })}
            ${cf('terms_url', { l: 'Link dos Termos de uso', t: 'url', ph: 'https://…', attrs: 'inputmode="url" autocomplete="off"' })}
            ${cf('privacy_url', { l: 'Link da Política de privacidade', t: 'url', ph: 'https://…', attrs: 'inputmode="url" autocomplete="off"' })}`)}
          ${panel('enderecos', 'Endereços', 'De onde a plataforma é servida.', H`
            ${cf('site_url', { l: 'Endereço do site', t: 'url', ph: u.site || 'https://usuario.github.io/brasa/', attrs: 'inputmode="url" autocomplete="off"', hint: 'Onde a plataforma está publicada (GitHub Pages ou domínio próprio). Entra nos links dos e-mails e nos links que você copia.' })}
            ${cf('api_url', { l: 'Endereço da API (Apps Script)', t: 'url', ph: 'https://script.google.com/macros/s/…/exec', attrs: 'inputmode="url" autocomplete="off"', hint: 'O link do Web App publicado, terminado em /exec.' })}
            <div class="field"><label for="set-webhook">Webhook do Mercado Pago</label>
              <div class="input-group"><input class="input" id="set-webhook" readonly value="${u.webhook || ''}" placeholder="Preencha o endereço da API e salve" aria-label="Endereço do webhook"><button type="button" class="btn btn--sm addon-btn" ${u.webhook ? H`data-copy="${u.webhook}"` : raw('disabled')}>${ic('copy')}Copiar</button></div>
              <div class="hint">No Mercado Pago, abra <b>Suas integrações</b> &gt; sua aplicação &gt; <b>Webhooks</b>, marque o evento <b>Pagamentos</b> e cole este endereço. É por ele que o Pix e o cartão viram venda aprovada.</div></div>`)}
          ${panel('mercadopago', 'Mercado Pago', 'Cobrança por Pix e cartão.', H`
            ${secretField('MP_ACCESS_TOKEN', 'Access Token de produção', 'Em Suas integrações > Credenciais de produção. Começa com APP_USR-. Fica guardado no servidor e nunca volta para a tela.')}
            ${testBtn('mp')}
            <div class="grid-2">
              ${cf('pix_expiration_min', { l: 'Pix expira em', t: 'number', post: 'min', attrs: 'min="5" max="1440" step="5" inputmode="numeric"', hint: 'Depois disso o QR Code vence.' })}
              ${cf('max_installments', { l: 'Parcelas máximas', t: 'select', opts: inst, attrs: 'data-num', hint: 'Limite geral. Cada curso pode ter menos.' })}
            </div>
            <div class="grid-2">
              ${cf('installment_rate', { l: 'Juros do cartão ao mês', t: 'number', post: '%', attrs: 'min="0" max="20" step="0.01" inputmode="decimal"', hint: 'Repassado ao cliente nas parcelas. Zero vende sem juros.' })}
              ${cf('checkout_cpf', { l: 'CPF no checkout', t: 'select', opts: [['off', 'Não pedir'], ['optional', 'Opcional'], ['required', 'Obrigatório']], hint: 'Pedir CPF reduz recusas no cartão, mas tira conversão.' })}
            </div>
            ${plusHtml('settingsCard', SH)}`)}
          ${panel('pixel', 'Pixel e API de Conversões', 'Meta Ads.', H`
            ${cf('pixel_id', { l: 'Pixel padrão da Meta', ph: '1234567890123456', attrs: 'inputmode="numeric" autocomplete="off"', hint: 'Usado em todos os cursos sem pixel próprio. Só números.' })}
            ${secretField('META_CAPI_TOKEN', 'Token da API de Conversões', 'Gerenciador de Eventos > sua origem de dados > Configurações > API de Conversões. Sem ele, só o Pixel do navegador dispara.')}
            ${cf('meta_api_version', { l: 'Versão da Graph API', ph: 'v24.0', attrs: 'autocomplete="off"', hint: 'Troque só se a Meta descontinuar a versão atual.' })}`)}
          ${panel('ia', 'Inteligência artificial', 'Escreve as páginas de vendas.', H`
            ${secretField('AI_API_KEY', 'Chave da Anthropic', 'Gerada em console.anthropic.com. Sem ela, a página usa o modelo automático.')}
            ${cf('ai_model', { l: 'Modelo', t: 'select', opts: aiOpts, hint: 'Sonnet 5.5 escreve bem e custa pouco; Opus 5.5 é o mais caprichado, e Haiku 5.5 o mais barato.' })}
            ${testBtn('ai', 'Testar a IA')}`)}
          ${panel('github', 'GitHub', 'Publica a versão estática das páginas de vendas.', H`
            <div class="grid-2">
              ${cf('github_repo', { l: 'Repositório', ph: 'usuario/repositorio', attrs: 'autocomplete="off" autocapitalize="off" spellcheck="false"', hint: 'No formato usuario/repo.' })}
              ${cf('github_branch', { l: 'Branch', ph: 'main', attrs: 'autocomplete="off" autocapitalize="off"' })}
            </div>
            ${secretField('GITHUB_TOKEN', 'Token de acesso', 'Token com permissão de escrita em Contents no repositório acima.')}
            ${testBtn('github')}`)}
          ${panel('afiliados', 'Afiliados', 'Regras padrão do programa.', H`
            ${csw('affiliate_program', { l: 'Programa de afiliados aberto', hint: 'Desligado, ninguém novo consegue pedir afiliação.' })}
            <div class="grid-3 set-grid3">
              ${cf('aff_default_commission', { l: 'Comissão padrão', t: 'number', post: '%', attrs: 'min="0" max="90" step="1" inputmode="numeric"' })}
              ${cf('aff_default_cookie_days', { l: 'Cookie', t: 'number', post: 'dias', attrs: 'min="1" max="365" step="1" inputmode="numeric"' })}
              ${cf('commission_release_days', { l: 'Liberar após', t: 'number', post: 'dias', attrs: 'min="0" max="60" step="1" inputmode="numeric"' })}
            </div>
            ${plusHtml('settingsAffBump', SH)}
            <p class="hint">A comissão padrão vale para cursos novos. A venda só fica disponível para pagamento depois do prazo de liberação, para cobrir a garantia.</p>`)}
          ${plusHtml('settingsCrm', SH)}
          ${panel('rotinas', 'Rotinas automáticas', 'O que roda sozinho.', H`
            ${csw('notify_sales', { l: 'Avisar cada venda por e-mail', hint: 'Um e-mail para o administrador a cada venda aprovada.' })}
            ${csw('recovery_emails', { l: 'E-mail de recuperação de carrinho', hint: 'Lembra quem gerou o pagamento e não finalizou.' })}
            ${cf('recovery_delay_min', { l: 'Enviar depois de', t: 'number', post: 'min', attrs: 'min="10" max="2880" step="5" inputmode="numeric"', hint: 'Tempo entre o pedido abandonado e o e-mail.' })}
            ${window.ADM && window.ADM.hooks && window.ADM.hooks.settingsEmail ? '' : testBtn('email', 'Enviar e-mail de teste')}`)}
          ${plusHtml('settingsEmail', SH)}
        </div>
        <details class="panel logs" id="set-logs" ${logsOpen ? raw('open') : ''}>
          <summary><span class="panel__title">Registros do sistema</span><span class="t-sm t-faint">Erros, avisos e eventos recentes</span></summary>
          <div class="logs__body" id="logs-body"></div>
        </details>`);
      orig = JSON.stringify(collect().config);
      S.guard = isDirty;
      refreshDirty();
      var det = $('#set-logs', root);
      det.addEventListener('toggle', function () { logsOpen = det.open; if (det.open) loadLogs(); });
      if (logsOpen) loadLogs();
    }

    function collect() {
      var c = {}, s = {};
      $$('[data-f]', root).forEach(function (el) {
        var k = el.dataset.f; if (!k) return;
        var v = el.type === 'checkbox' ? el.checked : el.value;
        if (k.indexOf('s:') === 0) { s[k.slice(2)] = String(v).trim(); return; }
        if (k === 'installment_rate') v = Math.round((Number(String(v).replace(',', '.')) || 0) * 100) / 10000;
        else if (NUM_KEYS.indexOf(k) > -1) v = v === '' ? 0 : Number(String(v).replace(',', '.')) || 0;
        else if (typeof v === 'string') v = v.trim();
        c[k] = v;
      });
      return { config: c, secrets: s };
    }
    function isDirty() {
      if (!st) return false;
      var v = collect();
      return JSON.stringify(v.config) !== orig || Object.keys(v.secrets).some(function (k) { return v.secrets[k]; });
    }
    function refreshDirty() {
      var d = isDirty(), el = $('#set-dirty', root), b = $('#set-save', root);
      if (el) el.hidden = !d; if (b) b.disabled = !d;
    }
    function mark(k, msg) {
      var e = $('[data-err="' + k + '"]', root), i = $('[data-f="' + k + '"]', root);
      if (e) { e.textContent = msg; e.hidden = !msg; }
      if (i) i.classList.toggle('is-invalid', !!msg);
    }
    function validate(c) {
      var bad = [];
      Object.keys(c).forEach(function (k) { mark(k, ''); });
      function need(k, ok, msg) { if (!ok) { mark(k, msg); bad.push(k); } }
      var url = /^https?:\/\/\S+$/i, mail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      need('brand_name', String(c.brand_name || '').length >= 2, 'Informe o nome da marca.');
      ['site_url', 'api_url', 'terms_url', 'privacy_url'].forEach(function (k) { need(k, !c[k] || url.test(c[k]), 'O endereço precisa começar com https://'); });
      ['admin_email', 'support_email'].forEach(function (k) { need(k, !c[k] || mail.test(c[k]), 'Informe um e-mail válido.'); });
      var px = String(c.pixel_id || '').replace(/\D/g, '');
      need('pixel_id', !px || (px.length >= 10 && px.length <= 20), 'O ID do Pixel tem entre 10 e 20 números.');
      need('github_repo', !c.github_repo || /^[\w.-]+\/[\w.-]+$/.test(c.github_repo), 'Use o formato usuario/repositorio.');
      need('max_installments', c.max_installments >= 1 && c.max_installments <= 12, 'Escolha de 1 a 12 parcelas.');
      need('aff_default_commission', c.aff_default_commission >= 0 && c.aff_default_commission <= 90, 'A comissão vai de 0 a 90.');
      need('pix_expiration_min', c.pix_expiration_min >= 5 && c.pix_expiration_min <= 1440, 'Entre 5 e 1440 minutos.');
      need('installment_rate', c.installment_rate >= 0 && c.installment_rate <= 0.2, 'Entre 0% e 20%.');
      need('mp_public_key', !c.mp_public_key || /^(APP_USR|TEST)-\S+$/.test(c.mp_public_key), 'A Public Key começa com APP_USR- (produção) ou TEST- (testes).');
      need('crm_inactive_days', c.crm_inactive_days == null || (c.crm_inactive_days >= 0 && c.crm_inactive_days <= 365), 'Entre 0 e 365 dias. Zero desliga.');
      need('seller_default_commission', c.seller_default_commission == null || (c.seller_default_commission >= 0 && c.seller_default_commission <= 90), 'A comissão vai de 0 a 90.');
      need('seller_default_max_discount', c.seller_default_max_discount == null || (c.seller_default_max_discount >= 0 && c.seller_default_max_discount <= 100), 'O desconto vai de 0 a 100.');
      need('email_from', !c.email_from || mail.test(c.email_from), 'Informe um e-mail válido.');
      need('email_from', !c.email_provider || c.email_provider === 'gmail' || !!c.email_from, 'Com este provedor, informe o e-mail remetente.');
      if (bad.length) { var i = $('[data-f="' + bad[0] + '"]', root); if (i) { i.scrollIntoView({ block: 'center', behavior: 'smooth' }); i.focus({ preventScroll: true }); } }
      return !bad.length;
    }
    function applyGlobals() {
      var c = st.config;
      if (B.boot0) { B.boot0.installment_rate = c.installment_rate; B.boot0.max_installments = c.max_installments; B.boot0.checkout_cpf = c.checkout_cpf; B.boot0.pixel_id = c.pixel_id; B.boot0.aff_default_commission = c.aff_default_commission; B.boot0.affiliate_program = c.affiliate_program; }
      B.loadBrand().then(function () {
        $$('.adm-side .brand, .adm-top .brand').forEach(function (a) { a.innerHTML = B.brandMark(); });
        setTitle('Configurações');
      }).catch(function () {});
    }
    function save(quiet) {
      var v = collect();
      if (!validate(v.config)) { B.toast('Confira os campos marcados.', 'bad'); return Promise.reject(new Error('invalid')); }
      var secs = {}; Object.keys(v.secrets).forEach(function (k) { if (v.secrets[k]) secs[k] = v.secrets[k]; });
      return busy($('#set-save', root), B.api('adminSettingsSave', { config: v.config, secrets: secs })).then(function (r) {
        if (!ctx.live()) return;
        st = r; render(); applyGlobals(); drop('courses');
        if (!quiet) B.toast('Configurações salvas', 'ok');
      }, function (e) { B.fail(e); if (e) e.handled = true; throw e; });
    }

    /* ---- registros ---- */
    function loadLogs() {
      var body = $('#logs-body', root); if (!body) return;
      body.innerHTML = String(skel(120));
      B.api('adminLogs', { limit: 120 }).then(function (r) {
        if (!ctx.live()) return;
        logs = r.logs || []; paintLogs();
      }).catch(function (e) { if (ctx.live()) body.innerHTML = String(emptyState('Não foi possível carregar', (e && e.message) || 'Tente de novo.', H`<button class="btn" type="button" data-act="logs-reload">${ic('refresh')}Tentar de novo</button>`, 'alert')); });
    }
    function paintLogs() {
      var body = $('#logs-body', root); if (!body || !logs) return;
      var shown = logs.filter(function (l) { return !logLevel || l.level === logLevel; });
      var tone = { error: 'bad', warn: 'warn', info: '' }, name = { error: 'Erro', warn: 'Aviso', info: 'Info' };
      body.innerHTML = String(H`
        <div class="logs__bar"><div class="seg" role="group" aria-label="Filtrar por nível">${[['', 'Todos'], ['error', 'Erros'], ['warn', 'Avisos']].map(function (x) { return H`<button type="button" data-act="logs-level" data-v="${x[0]}" class="${logLevel === x[0] ? 'is-active' : ''}">${x[1]}</button>`; })}</div><button type="button" class="btn btn--sm btn--ghost" data-act="logs-reload">${ic('refresh')}Atualizar</button></div>
        ${shown.length ? H`<div class="table-wrap"><table class="table table--dense">
          <thead><tr><th>Quando</th><th>Nível</th><th>Onde</th><th>Mensagem</th></tr></thead>
          <tbody>${shown.map(function (l) {
            var d = String(l.data || ''), hasData = d && d !== '{}' && d !== 'null';
            return H`<tr><td class="nowrap">${B.fmt.datetime(l.ts)}</td><td>${chip(name[l.level] || l.level, tone[l.level] || '')}</td><td class="nowrap">${l.where}</td><td><div class="logs__msg">${l.msg}</div>${hasData ? H`<div class="t-xs t-faint logs__data">${trunc(d, 220)}</div>` : ''}</td></tr>`;
          })}</tbody></table></div>` : H`<p class="hint" style="padding:8px 2px">${logs.length ? 'Nada neste filtro.' : 'Nenhum registro ainda. Tudo certo por aqui.'}</p>`}`);
    }

    S.on.input = function (ev) {
      var t = ev.target; if (!t || !t.dataset) return;
      if (t.dataset.logoUrl != null) {
        var h = $('[data-f="brand_logo"]', root); h.value = t.value.trim();
        $('#logo-pv', root).innerHTML = String(imgThumb(h.value));
      }
      refreshDirty();
    };
    S.on.change = function (ev) { refreshDirty(); };
    S.on.keydown = function (ev) { if ((ev.ctrlKey || ev.metaKey) && (ev.key === 's' || ev.key === 'S')) { ev.preventDefault(); if (isDirty()) save().catch(function () {}); } };
    S.on.submit = function (ev) { ev.preventDefault(); };
    S.acts = {
      save: function () { save().catch(function () {}); },
      retry: function () { pageSettings(ctx); },
      reveal: function (el) { var i = $('#s-' + el.dataset.k, root); if (i) { i.type = i.type === 'password' ? 'text' : 'password'; } },
      'logo-up': function (el) {
        chooseAndUpload(el, { png: true, maxW: 700 }).then(function (url) {
          if (!url) return;
          var h = $('[data-f="brand_logo"]', root), vis = $('[data-logo-url]', root);
          h.value = url; vis.value = /^data:/i.test(url) ? '' : url; vis.placeholder = /^data:/i.test(url) ? 'Imagem enviada. Cole um endereço para trocar.' : 'https://… ou envie um PNG';
          $('#logo-pv', root).innerHTML = String(imgThumb(url)); refreshDirty();
        }).catch(B.fail);
      },
      'secret-clear': function (el) {
        var k = el.dataset.k;
        B.confirm({ title: 'Remover chave salva', text: 'A chave deixa de ser usada e o recurso correspondente para de funcionar até você informar outra. Você poderá colar uma nova a qualquer momento.', ok: 'Remover chave', danger: true }).then(function (ok) {
          if (!ok) return;
          var s = {}; s[k] = '__clear__';
          busy(el, B.api('adminSettingsSave', { config: {}, secrets: s })).then(function (r) { st = r; render(); B.toast('Chave removida', 'ok'); }).catch(B.fail);
        });
      },
      test: function (el) {
        var what = el.dataset.what, out = $('[data-test-out="' + what + '"]', root);
        var run = function () {
          return B.api('adminTest', { what: what }).then(function (r) {
            var o2 = $('[data-test-out="' + what + '"]', root); if (!o2) return;
            o2.className = 'test-res ' + (r.ok ? 'is-ok' : 'is-bad');
            o2.innerHTML = String(H`${ic(r.ok ? 'check' : 'alert')}<span>${r.info || (r.ok ? 'Funcionou.' : 'Falhou.')}</span>`); o2.hidden = false;
          });
        };
        if (out) out.hidden = true;
        busy(el, isDirty() ? save(true).then(run) : run()).catch(function (e) { if (!e || (!e.handled && e.message !== 'invalid')) B.fail(e); });
      },
      'logs-reload': function () { loadLogs(); },
      'logs-level': function (el) { logLevel = el.dataset.v; paintLogs(); }
    };
  }

  /* =====================================================================
     PONTE PARA O admin-plus.js (páginas e ganchos da versão 2)
     ===================================================================== */
  window.ADM = window.ADM || {};
  Object.assign(window.ADM, {
    H: H, raw: raw, ic: ic, chip: chip, stChip: stChip, orderChip: orderChip, fld: fld, sw: sw, skel: skel, bandSkel: bandSkel, kpiTile: kpiTile, dl: dl, progBar: progBar,
    emptyState: emptyState, errorState: errorState, pgHead: pgHead, panelHead: panelHead, copyBtn: copyBtn, tabsBar: tabsBar, imgField: imgField, imgThumb: imgThumb,
    chooseAndUpload: chooseAndUpload, guardForm: guardForm, secBadge: secBadge, exportCsv: exportCsv, csvButton: csvButton,
    money: money, moneyK: moneyK, int: int, num2: num2, round2: round2, clone: clone, plural: plural, trunc: trunc, firstName: firstName, uid: uid, onlyDigits: onlyDigits,
    busy: busy, pageEl: pageEl, setTitle: setTitle, S: S, go: go, drop: drop, getCourses: getCourses, getAffiliates: getAffiliates, getSellers: getSellers,
    rowKeys: rowKeys, setCounts: setCounts, paintCounts: paintCounts, readInput: readInput, getPath: getPath, setPath: setPath, waLink: waLink, siteLink: siteLink,
    dayStart: dayStart, dayEnd: dayEnd, DAY: DAY, ORDER_ST: ORDER_ST, METHOD: METHOD
  });
  window.ADM.hooks = window.ADM.hooks || {};
  window.ADM.pages = window.ADM.pages || {};

  /* =====================================================================
     INICIALIZAÇÃO
     ===================================================================== */
  B.boot(function () {
    app = $('#app');
    initGlobal();
    initRoutes();
    B.demoBar('admin');
    return B.ensureDemoLogin().then(B.loadBrand).then(function (boot) {
      if (boot.user && (boot.user.roles || []).indexOf('admin') > -1) start(boot.user);
      else showLogin();
    }).catch(bootError);
  });
})();

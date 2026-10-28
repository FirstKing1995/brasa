/* =====================================================================
   BRASA · comercial.js
   Área comercial: entrada, funil (kanban e lista), hoje, ofertas,
   resultados e perfil. A ficha do lead e os modais ficam em
   comercial-lead.js (usa a ponte window.CRM). Sessão própria ("sales").
   ===================================================================== */
(function () {
  'use strict';

  B.session.use('sales');

  var E = B.esc;
  var TZ = 'America/Fortaleza';
  var DAY = 864e5;
  var app, view;
  var CRM = window.CRM = {};

  var STAGES = ['new', 'contact', 'negotiating', 'won', 'lost'];
  var OPEN = { 'new': 1, contact: 1, negotiating: 1 };
  var RUNE = { 'new': 'ᚠ', contact: 'ᚱ', negotiating: 'ᚷ', won: 'ᛟ', lost: 'ᛁ' };
  var STAGE_NAME = { 'new': 'Novo', contact: 'Em contato', negotiating: 'Negociando', won: 'Ganho', lost: 'Perdido' };
  var SRC_ICON = { abandoned: 'cart', pix_expired: 'pix', upsell: 'rocket', inactive: 'pause', manual: 'edit' };
  var SRC_NAME = { abandoned: 'Carrinho abandonado', pix_expired: 'Pix não pago', upsell: 'Próximo curso', inactive: 'Aluno parado', manual: 'Cadastro manual' };

  var saved = B.sstore.get('com:f', null) || {};
  var S = CRM.S = {
    mode: '',              // 'auth' | 'app'
    user: null, me: null, meta: null,
    route: '', shown: '', routerOn: false, nav: 0, leave: null, leadPushed: false,
    mobile: false,
    counts: { queue: 0, mine: 0, overdue: 0, today: 0 },
    board: null, boardSig: '', boardReq: 0,
    today: null, todaySig: '', todayReq: 0, hojeScope: 'mine', done: {}, doneN: 0,
    f: { scope: saved.scope || '', seller: '', source: saved.source || '', course: saved.course || '', overdue: !!saved.overdue, stage: saved.stage || 'all', q: '' },
    lim: {},
    offers: null, offerFilter: 'all',
    days: Number(B.sstore.get('com:days', 30)) || 30, statsSeller: '', statsReq: 0,
    drag: '', pollT: 0, tickT: 0, pollAt: 0, timersOn: false
  };

  var ACT = CRM.ACT = {};     // cliques: data-act="nome"
  var FORM = CRM.FORM = {};   // envios: <form data-form="nome">
  var LIVE = CRM.LIVE = {};   // digitação: data-live="nome"

  var NAV = [
    ['funil', '/', 'Funil', 'filter'],
    ['hoje', '/hoje', 'Hoje', 'calendar'],
    ['ofertas', '/ofertas', 'Ofertas', 'tag'],
    ['resultados', '/resultados', 'Resultados', 'chart']
  ];

  /* ---------------------------------------------------------------
     utilidades
     --------------------------------------------------------------- */
  function ic(n, c) { return B.icon(n, c); }
  function first(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
  function money(v) { return E(B.fmt.money(v)); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function dayKey(ts) { return new Date(Number(ts)).toLocaleDateString('en-CA', { timeZone: TZ }); }
  function hm(ts) { return B.fmt.time(ts); }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function sk(h, cls) { return '<div class="skel ' + (cls || '') + '" style="height:' + h + 'px"></div>'; }

  /* ---------- foco do teclado: repintar uma área não pode jogar o foco para o topo ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  // seletor que reencontra o elemento depois de um repaint: tag + atributos data-* (só vale se tiver algum)
  function focusSel(el) {
    if (!el || el === document.body || !el.attributes) return '';
    var s = el.tagName.toLowerCase(), n = 0;
    Array.prototype.forEach.call(el.attributes, function (a) {
      if (a.name.indexOf('data-') !== 0 || a.name === 'data-exp' || a.name === 'data-live-exp') return;
      s += '[' + a.name + '="' + String(a.value).replace(/["\\]/g, '') + '"]'; n++;
    });
    return n ? s : '';
  }
  function refocus(root, sel) {
    if (!sel) return;
    var el = null;
    try { el = (root || document).querySelector(sel); } catch (e) {}
    if (el && el !== document.activeElement) { try { el.focus({ preventScroll: true }); } catch (e) {} }
  }
  function keepFocus(box, paint) {
    var ae = document.activeElement, had = !!(box && ae && ae !== box && box.contains(ae)), sel = had ? focusSel(ae) : '';
    paint();
    if (!had) return;
    refocus(box, sel);
    var cur = document.activeElement;
    if (!cur || cur === document.body || cur === document.documentElement) {
      var fb = box.closest ? box.closest('[tabindex="-1"]') : null;   // o elemento focado sumiu: fica na região, o Tab continua dali
      if (fb) { try { fb.focus({ preventScroll: true }); } catch (e) {} }
    }
  }
  CRM.keepFocus = keepFocus; CRM.focusSel = focusSel; CRM.refocus = refocus; CRM.FOCUSABLE = FOCUSABLE;
  function api(action, payload) { return B.api(action, payload); }
  function isAdm() { return !!(S.me && S.me.is_admin); }
  function stageName(k) { return (S.meta && S.meta.statuses && S.meta.statuses[k]) || STAGE_NAME[k] || k; }
  function srcName(k) { return (S.meta && S.meta.sources && S.meta.sources[k]) || SRC_NAME[k] || k; }
  function weekday(ts) { return cap(new Date(Number(ts)).toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'short' }).replace('.', '')); }
  function longDay(ts) { return cap(new Date(Number(ts)).toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })); }

  // "Hoje 15:30", "Amanhã 09:00", "Qui 14:00", "28 out 14:00"
  function when(ts) {
    if (!ts) return '';
    var k = dayKey(ts), now = Date.now(), diff = (ts - now) / DAY;
    if (k === dayKey(now)) return 'Hoje ' + hm(ts);
    if (k === dayKey(now + DAY)) return 'Amanhã ' + hm(ts);
    if (diff > 0 && diff < 6) return weekday(ts) + ' ' + hm(ts);
    return B.fmt.dateShort(ts) + ' ' + hm(ts);
  }
  // "12 min", "3 h", "2 d": tempo curto para os cartões estreitos
  function short(ts) {
    var m = Math.max(1, Math.round((Date.now() - ts) / 60000));
    if (m < 60) return m + ' min';
    if (m < 1440) return Math.round(m / 60) + ' h';
    return Math.floor(m / 1440) + ' d';
  }
  // estado do próximo contato: atrasado, hoje, depois ou sem data (compact: texto curto do cartão)
  function dueInfo(l, compact) {
    if (!OPEN[l.status]) return null;
    if (!l.next_at) return { kind: 'none', icon: 'calendar', text: compact ? 'Agendar contato' : 'Sem próximo contato' };
    if (l.overdue) return { kind: 'late', icon: 'alert', text: compact ? 'Atrasado ' + short(l.next_at) : 'Atrasado ' + B.fmt.rel(l.next_at) };
    if (l.due_today) return { kind: 'today', icon: 'clock', text: 'Hoje ' + hm(l.next_at) };
    return { kind: 'later', icon: 'calendar', text: when(l.next_at) };
  }
  // chip do próximo contato; é botão (abre o agendamento) quando passa act
  function dueChip(l, act) {
    var d = dueInfo(l, !!act);
    if (!d) {
      if (l.status === 'lost' && l.lost_reason) return '<span class="com-due com-due--lost">' + ic('ban') + E(l.lost_reason) + '</span>';
      if (l.status === 'won') return '<span class="com-due com-due--won">' + ic('check') + 'Ganho</span>';
      return '';
    }
    var cls = 'com-due com-due--' + d.kind;
    if (act) {
      var txt = d.kind === 'none' ? 'Agendar<span class="com-due__x"> contato</span>' : E(d.text);
      return '<button type="button" class="' + cls + ' com-due--btn" data-act="sched" data-id="' + E(l.id) + '" aria-label="' + E(dueInfo(l).text + '. Alterar o próximo contato de ' + l.name) + '">' + ic(d.icon) + '<span>' + txt + '</span></button>';
    }
    return '<span class="' + cls + '">' + ic(d.icon) + '<span>' + E(d.text) + '</span></span>';
  }
  function srcChip(l) {
    var k = l.source || 'manual';
    return '<span class="com-src com-src--' + E(k) + '">' + ic(SRC_ICON[k] || 'tag') + '<span>' + E(l.source_label || srcName(k)) + '</span></span>';
  }
  function stageChip(st) {
    return '<span class="com-stg com-stg--' + E(st) + '"><span class="t-rune" aria-hidden="true">' + (RUNE[st] || '') + '</span>' + E(stageName(st)) + '</span>';
  }
  function chip(kind, icon, text) { return '<span class="chip chip--' + kind + '">' + (icon ? ic(icon) : '') + E(text) + '</span>'; }

  function busy(btn, on) {
    if (!btn) return;
    btn.classList.toggle('is-loading', !!on);
    if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy');
  }
  function isBusy(btn) { return !!btn && btn.classList.contains('is-loading'); }
  // erros de sessão já levam à tela de entrada: não repetir aviso
  function quiet(e) { return !!e && e.code === 'AUTH'; }
  function fail(e) { if (!quiet(e)) B.fail(e); }

  // cada tela pede um "crachá"; ao trocar de tela, respostas atrasadas da anterior são descartadas
  function begin() { var t = ++S.nav; return function () { return t === S.nav && S.mode === 'app'; }; }

  function emptyBlock(title, text, action, seed) {
    return '<div class="empty com-empty">' + B.sigil(seed || title) + '<div class="empty__title">' + E(title) + '</div>' +
      (text ? '<p>' + E(text) + '</p>' : '') + (action || '') + '</div>';
  }
  function errBlock(e) {
    return '<div class="empty com-empty">' + ic('alert') + '<div class="empty__title">Não foi possível carregar</div>' +
      '<p>' + E((e && e.message) || 'Verifique sua conexão e tente de novo.') + '</p>' +
      '<button type="button" class="btn" data-act="retry">Tentar de novo</button></div>';
  }
  function head(rune, title, sub, right) {
    return '<header class="com-head"><div class="com-head__txt"><h1 class="com-h1"><span class="com-rune t-rune" aria-hidden="true">' + rune + '</span>' + E(title) + '</h1>' +
      (sub ? '<p class="com-head__sub">' + sub + '</p>' : '') + '</div>' + (right ? '<div class="com-head__acts">' + right + '</div>' : '') + '</header>';
  }

  // exporta para comercial-lead.js
  CRM.E = E; CRM.ic = ic; CRM.first = first; CRM.money = money; CRM.norm = norm; CRM.when = when; CRM.dayKey = dayKey; CRM.hm = hm;
  CRM.dueChip = dueChip; CRM.dueInfo = dueInfo; CRM.srcChip = srcChip; CRM.stageChip = stageChip; CRM.chip = chip; CRM.busy = busy; CRM.isBusy = isBusy;
  CRM.fail = fail; CRM.stageName = stageName; CRM.srcName = srcName; CRM.isAdm = isAdm; CRM.STAGES = STAGES; CRM.OPEN = OPEN; CRM.RUNE = RUNE; CRM.TZ = TZ; CRM.DAY = DAY;
  CRM.cap = cap; CRM.longDay = longDay; CRM.weekday = weekday; CRM.sk = sk;
  CRM.head = head; CRM.emptyBlock = emptyBlock; CRM.errBlock = errBlock; CRM.api = api;

  /* ---------------------------------------------------------------
     eventos globais (um ouvinte por tipo, no document: vale também nos modais)
     --------------------------------------------------------------- */
  function go(path) {
    closeMenu();
    if (path.indexOf('/lead/') === 0) S.leadPushed = true;
    if (B.router.path === path) B.router.reload(); else B.router.go(path);
  }
  CRM.go = go;

  function bindGlobal() {
    document.addEventListener('click', function (ev) {
      var el = ev.target;
      if (!el || !el.closest) return;
      var a = el.closest('a[href^="#/"]');
      if (a && S.mode === 'app' && !ev.defaultPrevented && ev.button === 0 && !(ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey)) {
        ev.preventDefault();
        go(a.getAttribute('href').slice(1));
        return;
      }
      var t = el.closest('[data-act]');
      if (t && ACT[t.getAttribute('data-act')]) ACT[t.getAttribute('data-act')](t, ev);
      if (!el.closest('.com-user')) closeMenu();
    });
    document.addEventListener('submit', function (ev) {
      var f = ev.target && ev.target.closest && ev.target.closest('form[data-form]');
      if (!f) return;
      ev.preventDefault();
      if (FORM[f.getAttribute('data-form')]) FORM[f.getAttribute('data-form')](f);
    });
    function live(ev) {
      var n = ev.target && ev.target.closest && ev.target.closest('[data-live]');
      if (n && LIVE[n.getAttribute('data-live')]) LIVE[n.getAttribute('data-live')](ev.target, n, ev);
    }
    document.addEventListener('input', live);
    document.addEventListener('change', live);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeMenu(true);
      var c = ev.target && ev.target.closest && ev.target.closest('.com-card, .com-row__main');
      if (c && ev.target === c && (ev.key === 'Enter' || ev.key === ' ')) {
        ev.preventDefault();
        go('/lead/' + c.getAttribute('data-id'));
      }
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && S.mode === 'app' && Date.now() - S.pollAt > 30000) poll(true);
    });
    if (window.matchMedia) {
      var mq = window.matchMedia('(max-width: 760px)');
      S.mobile = mq.matches;
      var onMq = function (e) {
        S.mobile = e.matches;
        if (S.mode === 'app') { if (S.shown === 'funil') paintBoardArea(); else if (S.shown === 'hoje') paintHoje(); }
      };
      if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
    }
  }

  ACT.retry = function () { if (S.mode === 'app') B.router.reload(); else location.reload(); };
  ACT.logout = function () { doLogout(); B.toast('Você saiu da conta.', 'info', 2200); };
  ACT.copy = function (t) { B.copy(t.getAttribute('data-copy'), t); };
  ACT.eye = function (b) {
    var inp = b.parentNode.querySelector('input');
    var show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', show ? 'true' : 'false');
    b.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  };

  function closeMenu(refocus) {
    var pop = B.$('[data-menu-pop]', app);
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    var b = B.$('[data-act="menu"]', app);
    if (b) { b.setAttribute('aria-expanded', 'false'); if (refocus) b.focus(); }
  }
  ACT.menu = function (btn, ev) {
    ev.stopPropagation();
    var pop = B.$('[data-menu-pop]', app);
    if (!pop) return;
    var open = pop.hidden;
    pop.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  /* ===============================================================
     ENTRADA: entrar, esqueci a senha, redefinir e primeiro acesso
     =============================================================== */
  var PERKS = [
    ['filter', 'Funil de leads', 'Carrinhos abandonados, Pix não pagos e alunos parados chegam sozinhos.'],
    ['whatsapp', 'WhatsApp com texto pronto', 'Escolha o modelo, revise e envie. O contato fica registrado.'],
    ['tag', 'Condição especial com link', 'Crie um preço com prazo e mande o link direto para o lead.'],
    ['wallet', 'Comissão à vista', 'Veja o que libera, o que está disponível e o que já foi pago.']
  ];

  function field(o) {
    var id = 'f-' + o.name;
    var inp = '<input class="input" id="' + id + '" name="' + o.name + '" type="' + (o.type || 'text') + '"' +
      (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.im ? ' inputmode="' + o.im + '"' : '') +
      (o.ph ? ' placeholder="' + E(o.ph) + '"' : '') + (o.value ? ' value="' + E(o.value) + '"' : '') +
      (o.max ? ' maxlength="' + o.max + '"' : '') + ' aria-describedby="' + id + '-e' + (o.hint ? ' ' + id + '-h' : '') + '"' + (o.extra || '') + '>';
    if (o.type === 'password') {
      inp = '<div class="com-pw">' + inp + '<button type="button" class="iconbtn com-pw__eye" data-act="eye" aria-pressed="false" aria-label="Mostrar senha">' + ic('eye') + '</button></div>';
    }
    return '<div class="field"><label for="' + id + '">' + E(o.label) + '</label>' + inp +
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
  function formErr(f, msg) {
    var er = B.$('[data-formerr]', f);
    if (!er) return B.toast(msg, 'bad', 5200);
    er.textContent = msg;
    er.hidden = false;
  }
  CRM.field = field; CRM.fieldErr = fieldErr; CRM.clearErrs = clearErrs; CRM.formErr = formErr;

  function demoCreds() {
    var c = window.BrasaDemo && window.BrasaDemo.creds && window.BrasaDemo.creds.sales;
    return c || ['vendas@brasa.demo', 'brasa123'];
  }
  function demoHint() {
    if (!B.demo) return '';
    var c = demoCreds();
    return '<div class="com-demo"><div class="com-demo__txt"><strong>Demonstração</strong><span>E-mail <code>' + E(c[0]) + '</code> e senha <code>' + E(c[1]) + '</code>.</span></div>' +
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
    return '<div class="com-auth"><div class="com-auth__glow" aria-hidden="true"></div>' +
      '<div class="wrap com-auth__grid">' +
        '<div class="brand com-auth__brand">' + B.brandMark() + '</div>' +
        '<div class="com-auth__pitch"><div class="t-hud com-auth__kicker">Área comercial</div>' +
          '<h1 class="com-auth__h t-hero">Recupere vendas. Feche mais.</h1>' +
          '<p class="t-lead com-auth__lead">Seus leads, o WhatsApp com texto pronto e as condições especiais num só lugar. Feito para usar com o celular na mão.</p></div>' +
        '<section class="panel hud com-auth__card" aria-label="Acesso à área comercial" data-auth-card></section>' +
        '<ul class="com-perks">' + PERKS.map(function (p) {
          return '<li class="com-perk"><span class="com-perk__ic">' + ic(p[0]) + '</span><div><strong>' + p[1] + '</strong><span>' + p[2] + '</span></div></li>';
        }).join('') + '</ul>' +
      '</div></div>';
  }
  function noticeHtml(msg) { return msg ? '<div class="com-notice" role="status">' + ic('info') + '<span>' + E(msg) + '</span></div>' : ''; }

  function loginForm(o) {
    return '<form class="stack com-form" data-form="login" novalidate><div><h2 class="com-card-h">Entrar</h2></div>' + noticeHtml(o.msg) +
      field({ name: 'email', label: 'E-mail', type: 'email', ac: 'username', im: 'email', ph: 'voce@email.com', value: o.email, extra: ' autocapitalize="none" spellcheck="false"' }) +
      field({ name: 'password', label: 'Senha', type: 'password', ac: 'current-password' }) +
      '<div class="err com-formerr" data-formerr role="alert" hidden></div>' +
      '<button type="submit" class="btn btn--primary btn--lg btn--block">Entrar</button>' +
      '<button type="button" class="btn btn--link com-linkbtn" data-act="auth-mode" data-mode="forgot">Esqueci minha senha</button>' +
      demoHint() + '</form>';
  }
  function forgotForm(o) {
    return '<form class="stack com-form" data-form="forgot" novalidate>' +
      '<div><h2 class="com-card-h">Recuperar acesso</h2><p class="t-muted t-sm">Informe o e-mail da sua conta. Vamos enviar um código de 6 dígitos para você criar uma nova senha.</p></div>' +
      field({ name: 'email', label: 'E-mail', type: 'email', ac: 'username', im: 'email', ph: 'voce@email.com', value: o.email, extra: ' autocapitalize="none" spellcheck="false"' }) +
      '<div class="err com-formerr" data-formerr role="alert" hidden></div>' +
      '<button type="submit" class="btn btn--primary btn--lg btn--block">Enviar código</button>' +
      '<button type="button" class="btn btn--link com-linkbtn" data-act="auth-mode" data-mode="login">Voltar para entrar</button></form>';
  }
  function resetForm(o) {
    var demo = o.demoCode
      ? '<div class="com-demo"><div class="com-demo__txt"><strong>Demonstração</strong><span>Seu código é <code>' + E(o.demoCode) + '</code>.</span></div><button type="button" class="btn btn--sm btn--ghost" data-act="code-fill" data-code="' + E(o.demoCode) + '">Usar código</button></div>'
      : '';
    return '<form class="stack com-form" data-form="reset" data-email="' + E(o.email) + '" novalidate>' +
      '<div><h2 class="com-card-h">Criar nova senha</h2><p class="t-muted t-sm">Enviamos um código de 6 dígitos para <strong class="com-break">' + E(o.email) + '</strong>. Ele vale por 30 minutos.</p></div>' + demo +
      field({ name: 'code', label: 'Código', ac: 'one-time-code', im: 'numeric', ph: '000000', max: 6 }) +
      field({ name: 'password', label: 'Nova senha', type: 'password', ac: 'new-password', hint: 'Pelo menos 6 caracteres.' }) +
      '<div class="err com-formerr" data-formerr role="alert" hidden></div>' +
      '<button type="submit" class="btn btn--primary btn--lg btn--block">Criar nova senha</button>' +
      '<button type="button" class="btn btn--link com-linkbtn" data-act="auth-mode" data-mode="forgot">Pedir outro código</button></form>';
  }
  function firstForm(o) {
    return '<form class="stack com-form" data-form="first" data-first="' + E(o.first) + '" novalidate>' +
      '<div><h2 class="com-card-h">Bem-vindo ao time</h2><p class="t-muted t-sm">Crie sua senha para entrar na área comercial' + (o.email_masked ? ' com o e-mail <strong class="com-break">' + E(o.email_masked) + '</strong>' : '') + '.</p></div>' +
      field({ name: 'name', label: 'Seu nome', ac: 'name', value: o.name, max: 120 }) +
      field({ name: 'password', label: 'Crie uma senha', type: 'password', ac: 'new-password', hint: 'Pelo menos 6 caracteres.' }) +
      '<div class="err com-formerr" data-formerr role="alert" hidden></div>' +
      '<button type="submit" class="btn btn--primary btn--lg btn--block">Criar senha e entrar</button></form>';
  }

  function authCard(mode, o) {
    o = o || {};
    var slot = B.$('[data-auth-card]', app);
    if (!slot) return;
    slot.innerHTML = mode === 'forgot' ? forgotForm(o) : mode === 'reset' ? resetForm(o) : mode === 'first' ? firstForm(o) : loginForm(o);
    var f = B.$('input:not([type="hidden"])', slot);
    if (f && !('ontouchstart' in window)) f.focus();
  }
  function authShell(title) {
    stopShell();
    document.documentElement.classList.add('no-bottomnav');
    app.className = 'com com--auth' + (B.demo ? ' is-demo' : '');
    app.innerHTML = authFrame();
    document.title = title + ' | ' + B.brand.name;
    S.embers = B.embers(B.$('.com-auth', app), { count: 40 });
    window.scrollTo(0, 0);
  }
  function showAuth(message, mode, o) {
    S.mode = 'auth';
    S.user = null; S.me = null; S.meta = null;
    authShell('Entrar');
    authCard(mode || 'login', Object.assign({ msg: message }, o || {}));
  }
  ACT['auth-mode'] = function (t) {
    var f = B.$('[data-auth-card] form', app);
    var email = f && B.$('[name="email"]', f) ? String(B.$('[name="email"]', f).value || '').trim() : '';
    authCard(t.getAttribute('data-mode'), { email: email });
  };
  ACT['code-fill'] = function (t) {
    var f = B.$('form[data-form="reset"]', app);
    if (!f) return;
    B.$('[name="code"]', f).value = t.getAttribute('data-code');
    B.$('[name="password"]', f).focus();
  };

  /* outra conta no mesmo navegador não herda escopo, filtros nem números da anterior */
  function resetView() {
    S.board = null; S.boardSig = ''; S.today = null; S.todaySig = ''; S.offers = null; S.stats = null;
    S.done = {}; S.doneN = 0; S.lim = {}; S.fOpen = false;
    S.f = { scope: '', seller: '', source: '', course: '', overdue: false, stage: 'all', q: '' };
    S.hojeScope = 'mine'; S.statsSeller = ''; S.offerFilter = 'all';
    S.counts = { queue: 0, mine: 0, overdue: 0, today: 0 };
    B.sstore.del('com:f');
  }
  function afterLogin(user) {
    if (S.uid && user && S.uid !== user.id) resetView();
    S.uid = user ? user.id : '';
    S.user = user;
    B.session.setUser(user);
    var roles = (user && user.roles) || [];
    if (roles.indexOf('seller') < 0 && roles.indexOf('admin') < 0) {
      B.logout();
      showAuth('Esta conta não faz parte do time comercial. Fale com quem administra a plataforma.', 'login');
      return;
    }
    startApp();
  }

  FORM.login = function (f) {
    var btn = B.$('[type="submit"]', f);
    if (isBusy(btn)) return;
    clearErrs(f);
    var d = B.formData(f), email = String(d.email || '').trim();
    if (!B.validEmail(email)) return fieldErr(f, 'email', 'Informe um e-mail válido.');
    if (!d.password) return fieldErr(f, 'password', 'Informe sua senha.');
    busy(btn, true);
    B.api('login', { email: email, password: d.password, as: 'seller' }).then(function (r) {
      B.loginDone(r);
      afterLogin(r.user);
    }, function (e) { busy(btn, false); formErr(f, e.message); });
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
      if (r.demo_code) B.toast('Demonstração: seu código é ' + r.demo_code, 'info', 7000);
    }, function (e) { busy(btn, false); formErr(f, e.message); });
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
    }, function (e) { busy(btn, false); formErr(f, e.message); });
  };
  FORM.first = function (f) {
    var btn = B.$('[type="submit"]', f);
    if (isBusy(btn)) return;
    clearErrs(f);
    var d = B.formData(f), name = String(d.name || '').trim();
    if (name.length < 2) return fieldErr(f, 'name', 'Informe seu nome.');
    if (String(d.password || '').length < 6) return fieldErr(f, 'password', 'A senha precisa ter pelo menos 6 caracteres.');
    busy(btn, true);
    B.api('firstAccess', { first: f.getAttribute('data-first'), password: d.password, name: name }).then(function (r) {
      B.loginDone(r);
      try { history.replaceState(null, '', location.pathname + '#/'); } catch (e) {}
      B.toast('Senha criada. Bom trabalho.', 'ok', 3200);
      afterLogin(r.user);
    }, function (e) { busy(btn, false); formErr(f, e.message); });
  };

  function doLogout(msg) {
    B.logout();
    try { history.replaceState(null, '', location.pathname + '#/'); } catch (e) {}
    resetView(); S.shown = ''; S.uid = '';
    showAuth(msg || '', 'login');
  }
  CRM.doLogout = doLogout;

  /* ===============================================================
     ESTRUTURA: topo, rotas, contadores e atualização a cada 60 s
     =============================================================== */
  function navLinks(kind) {
    return NAV.map(function (n) {
      if (kind === 'top') return '<a href="#' + n[1] + '" data-nav="' + n[0] + '">' + n[2] + '</a>';
      var dot = n[0] === 'hoje' ? '<span class="badge-dot" data-dot hidden></span>' : '';
      return '<a href="#' + n[1] + '" data-nav="' + n[0] + '">' + ic(n[3]) + '<span>' + n[2] + '</span>' + dot + '</a>';
    }).join('');
  }
  function pill(kind, icon, n, label, act) {
    return '<button type="button" class="com-count com-count--' + kind + (n ? ' is-on' : '') + '" data-act="' + act + '" aria-label="' + n + ' ' + label + '">' +
      ic(icon) + '<b class="t-num">' + n + '</b><span>' + label + '</span></button>';
  }
  function countsHtml() {
    var c = S.counts;
    return pill('late', 'alert', c.overdue, c.overdue === 1 ? 'atrasado' : 'atrasados', 'go-late') + pill('today', 'clock', c.today, 'hoje', 'go-today') + pill('queue', 'inbox', c.queue, 'fila', 'go-queue');
  }

  function shellHtml() {
    var u = S.user || {}, me = S.me || {};
    return '<header class="topbar is-solid com-top">' +
      '<div class="topbar__inner">' +
        '<a class="brand" href="#/" aria-label="' + E(B.brand.name) + ', ir ao funil">' + B.brandMark() + '</a>' +
        '<nav class="topbar__links hide-sm" aria-label="Seções">' + navLinks('top') + '</nav>' +
        '<span class="grow"></span>' +
        '<div class="com-counts" id="com-counts" aria-label="Seus números de hoje">' + countsHtml() + '</div>' +
        '<div class="com-user">' +
          '<button type="button" class="com-user__btn" data-act="menu" aria-haspopup="menu" aria-expanded="false" aria-label="Menu da conta de ' + E(first(me.name || u.name)) + '">' +
            B.avatar(u, 34) + '<span class="com-user__name hide-sm" data-me-name>' + E(first(me.name || u.name)) + '</span></button>' +
          '<div class="com-menu" role="menu" data-menu-pop hidden>' +
            '<div class="com-menu__who"><strong class="ellipsis" data-me-name2>' + E(me.name || u.name) + '</strong><span class="t-xs t-faint ellipsis">' + E(me.email || u.email) + '</span>' +
              '<span class="com-menu__role">' + (me.is_admin ? 'Administrador' : 'Vendedor') + '</span></div>' +
            '<a role="menuitem" href="#/perfil">' + ic('user') + 'Perfil</a>' +
            '<button type="button" role="menuitem" data-act="logout">' + ic('logout') + 'Sair</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</header>' +
    '<main class="com-main" id="view" tabindex="-1"></main>' +
    '<nav class="bottomnav" aria-label="Navegação principal"><div class="bottomnav__inner">' + navLinks('bottom') + '</div></nav>';
  }

  function setActive(name) {
    B.$$('[data-nav]', app).forEach(function (a) {
      var on = a.getAttribute('data-nav') === name;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function paintCounts() {
    var box = B.$('#com-counts', app);
    if (box) box.innerHTML = countsHtml();
    B.$$('[data-dot]', app).forEach(function (d) { d.hidden = !(S.counts.overdue > 0); });
    if (S.shown === 'funil') paintTabs();
  }

  ACT['go-late'] = function () { S.f.scope = 'mine'; S.f.overdue = true; S.f.source = ''; S.f.course = ''; S.f.q = ''; saveF(); S.board = null; go('/'); };
  ACT['go-today'] = function () { go('/hoje'); };
  ACT['go-queue'] = function () { S.f.scope = 'queue'; S.f.overdue = false; S.f.source = ''; S.f.course = ''; S.f.q = ''; saveF(); S.board = null; go('/'); };

  function stopTimers() {
    if (S.pollT) clearInterval(S.pollT);
    if (S.tickT) clearInterval(S.tickT);
    S.pollT = S.tickT = 0;
  }
  function startTimers() {
    stopTimers();
    S.pollT = setInterval(function () { poll(); }, 60000);
    S.tickT = setInterval(tick, 30000);
  }
  // só atualiza com a aba visível; a cada 60 s recarrega a tela atual e os contadores
  function poll(force) {
    if (S.mode !== 'app' || document.hidden) return;
    var t = Date.now();
    if (force !== true && t - S.pollAt < 20000) return;
    S.pollAt = t;
    if (S.shown === 'funil') loadBoard({ silent: true });
    else if (S.shown === 'hoje') loadToday({ silent: true });
    else if (S.shown === 'ofertas') { loadOffers(true); loadCounts(); }
    else loadCounts();
  }
  CRM.touch = function () { poll(true); };
  function loadCounts() {
    // q impossível: só os contadores interessam, a lista vem vazia
    api('crmBoard', { scope: 'mine', closed_days: 1, q: '~~sem-resultado~~' }).then(function (r) {
      if (S.mode !== 'app') return;
      S.counts = r.counts || S.counts; paintCounts();
    }, function () {});
  }
  // relógios na tela (validade das condições) seguem a cada 30 s
  function tick() {
    if (document.hidden || S.mode !== 'app') return;
    var crossed = false;
    B.$$('[data-exp]').forEach(function (el) {
      var ts = Number(el.getAttribute('data-exp'));
      el.textContent = expText(ts, false);
      if (ts <= Date.now() && el.getAttribute('data-live-exp')) crossed = true;
    });
    if (crossed && S.shown === 'ofertas') loadOffers(true);
  }
  function expText(ts, done) {
    if (done) return 'Usada';
    return ts > Date.now() ? 'Vence ' + B.fmt.rel(ts) : 'Expirou ' + B.fmt.rel(ts);
  }
  CRM.expText = expText;

  function mount(name, title, fn, params, query) {
    if (S.leave) { try { S.leave(); } catch (e) {} S.leave = null; }
    closeMenu();
    S.route = name; S.shown = name;
    setActive(name);
    document.title = title + ' | ' + B.brand.name;
    try { fn(params, query); } catch (e) { console.error(e); view.innerHTML = '<div class="com-page">' + errBlock(e) + '</div>'; }
    // Funil e Hoje já trazem os contadores junto; as outras telas pedem sozinhas
    if (name !== 'funil' && name !== 'hoje') loadCounts();
    if (S.routed) { try { view.focus({ preventScroll: true }); } catch (e) {} }
    S.routed = true;
  }
  // voltar da ficha para a tela de baixo não recria a tela: só atualiza os dados
  function route(name, title, fn) {
    return function (params, query) {
      if (S.mode !== 'app' || !view) return;
      var wasOpen = (CRM.drawerOpen && CRM.drawerOpen()) || S.softBack;
      S.softBack = false; S.leadPushed = false;
      if (CRM.drawerOpen && CRM.drawerOpen()) CRM.closeDrawer(true);
      if (wasOpen && S.shown === name) { softRefresh(); return; }
      mount(name, title, fn, params, query);
    };
  }
  function softRefresh() {
    if (S.shown === 'funil') loadBoard({ force: true });
    else if (S.shown === 'hoje') loadToday({ force: true });
    else if (S.shown === 'ofertas') loadOffers(true);
    else if (S.shown === 'resultados') loadStats(true);
    else loadCounts();
  }
  function registerRoutes() {
    B.router
      .on('/', route('funil', 'Funil', viewFunil))
      .on('/hoje', route('hoje', 'Hoje', viewHoje))
      .on('/ofertas', route('ofertas', 'Ofertas', viewOfertas))
      .on('/resultados', route('resultados', 'Resultados', viewStats))
      .on('/perfil', route('perfil', 'Perfil', viewPerfil))
      .on('/lead/:id', function (p) {
        if (S.mode !== 'app' || !view) return;
        if (!S.shown) mount('funil', 'Funil', viewFunil);   // entrou direto pelo link: monta o funil por baixo
        CRM.openLead(p.id);
      })
      .otherwise(function () { if (S.mode === 'app') B.router.go('/', { replace: true }); });
  }

  function stopShell() {
    stopTimers();
    if (CRM.closeDrawer) CRM.closeDrawer(true);
    if (S.leave) { try { S.leave(); } catch (e) {} S.leave = null; }
    if (S.embers) { S.embers.stop(); S.embers = null; }
    S.nav++; S.shown = ''; S.route = '';
  }

  function startApp() {
    stopShell();
    S.mode = 'loading';
    S.board = null; S.today = null; S.offers = null;
    document.documentElement.classList.remove('no-bottomnav');
    app.className = 'com has-bottomnav' + (B.demo ? ' is-demo' : '');
    app.innerHTML = '<div class="com-boot" aria-busy="true"><div class="spinner" role="status" aria-label="Carregando"></div></div>';
    document.title = 'Área comercial | ' + B.brand.name;
    api('crmMe').then(function (r) {
      S.meta = r; S.me = r.me;
      S.mode = 'app';
      app.innerHTML = shellHtml();
      view = B.$('#view', app);
      startTimers();
      S.pollAt = Date.now();
      if (!S.routerOn) { S.routerOn = true; registerRoutes(); B.router.start('/'); } else B.router.reload();
    }, function (e) {
      if (e.code === 'FORBIDDEN') { B.logout(); showAuth('Esta conta não faz parte do time comercial. Fale com quem administra a plataforma.', 'login'); return; }
      if (e.code === 'AUTH') return;
      S.mode = 'auth';
      app.innerHTML = '<div class="com-boot">' + errBlock(e) + '</div>';
    });
  }

  /* ===============================================================
     FUNIL (/): kanban no desktop, lista agrupada no celular
     =============================================================== */
  function defaultScope() { return isAdm() ? 'all' : 'mine'; }
  function boardScope() {
    var s = S.f.scope;
    if (s === 'all' && !isAdm()) s = '';
    if (s !== 'mine' && s !== 'queue' && s !== 'all') s = defaultScope();
    S.f.scope = s;
    return s;
  }
  function saveF() { B.sstore.set('com:f', { scope: S.f.scope, source: S.f.source, course: S.f.course, overdue: S.f.overdue, stage: S.f.stage }); }
  function sumValue(arr) { return arr.reduce(function (a, l) { return a + (Number(l.value) || 0); }, 0); }
  function findLead(id) {
    var lists = [S.board, S.today].filter(Boolean);
    for (var k = 0; k < lists.length; k++) for (var i = 0; i < lists[k].leads.length; i++) if (lists[k].leads[i].id === id) return lists[k].leads[i];
    return null;
  }
  CRM.findLead = findLead;

  function activeFilters() {
    return (S.f.source ? 1 : 0) + (S.f.course ? 1 : 0) + (S.f.overdue ? 1 : 0) + (S.f.q ? 1 : 0) + (S.f.seller ? 1 : 0);
  }
  function leadsFiltered(o) {
    o = o || {};
    var all = (S.board && S.board.leads) || [], q = norm(S.f.q), qd = S.f.q.replace(/\D/g, '');
    var sellerOn = isAdm() && boardScope() === 'all' && S.f.seller;
    return all.filter(function (l) {
      if (o.skip !== 'source' && S.f.source && l.source !== S.f.source) return false;
      if (S.f.course && l.course_id !== S.f.course) return false;
      if (S.f.overdue && !l.overdue) return false;
      if (sellerOn && l.seller_id !== S.f.seller) return false;
      if (q) {
        var hay = norm(l.name + ' ' + l.email + ' ' + l.course_title);
        if (hay.indexOf(q) < 0 && !(qd.length >= 3 && String(l.phone || '').indexOf(qd) > -1)) return false;
      }
      return true;
    });
  }
  function groupBy(leads) {
    var by = {};
    STAGES.forEach(function (s) { by[s] = []; });
    leads.forEach(function (l) { (by[l.status] || (by[l.status] = [])).push(l); });
    by.won.sort(function (a, b) { return b.updated_at - a.updated_at; });
    by.lost.sort(function (a, b) { return b.updated_at - a.updated_at; });
    return by;
  }

  function viewFunil() {
    boardScope();
    var right = (isAdm() ? '<button type="button" class="btn btn--sm btn--ghost com-sync" data-act="sync">' + ic('refresh') + '<span class="com-sync__t">Atualizar leads agora</span></button>' : '') +
      '<button type="button" class="btn btn--sm btn--primary" data-act="new-lead">' + ic('plus') + 'Novo lead</button>';
    view.innerHTML = '<div class="com-page com-funil">' + head('ᚠ', 'Funil', '', right) +
      '<div id="fx-tabs"></div><div class="com-filters" id="fx-filters"></div>' +
      '<div class="com-board" id="fx-board" aria-live="polite">' + boardSkel() + '</div></div>';
    paintTabs(); paintFilters();
    if (S.board && S.board.scope === boardScope()) { paintChips(); paintBoardArea(); }
    loadBoard({ force: true });
  }
  function boardSkel() {
    if (S.mobile) return '<div class="com-skel">' + sk(44) + sk(96) + sk(96) + sk(96) + '</div>';
    return '<div class="com-kanban">' + STAGES.map(function () { return '<div class="com-col"><div class="com-col__body">' + sk(88) + sk(88) + sk(88) + '</div></div>'; }).join('') + '</div>';
  }

  function paintTabs() { keepFocus(B.$('#fx-tabs'), paintTabsRaw); }
  function paintTabsRaw() {
    var box = B.$('#fx-tabs');
    if (!box) return;
    var sc = boardScope(), c = S.counts;
    var tabs = [['mine', 'Meus', c.mine], ['queue', 'Fila', c.queue]];
    if (isAdm()) tabs.unshift(['all', 'Todos', null]);
    box.innerHTML = '<div class="tabs com-tabs" role="tablist" aria-label="Escopo do funil">' + tabs.map(function (t) {
      return '<button type="button" class="tab' + (sc === t[0] ? ' is-active' : '') + '" role="tab" aria-selected="' + (sc === t[0]) + '" data-act="scope" data-scope="' + t[0] + '">' + t[1] +
        (t[2] != null ? '<span class="com-tab__n t-num">' + t[2] + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function paintFilters() { keepFocus(B.$('#fx-filters'), paintFiltersRaw); }
  function paintFiltersRaw() {
    var box = B.$('#fx-filters');
    if (!box) return;
    var courses = (S.meta && S.meta.courses) || [], n = activeFilters() - (S.f.q ? 1 : 0);
    var selCourse = '<select class="select com-sel" data-live="course" aria-label="Filtrar por curso"><option value="">Todos os cursos</option>' +
      courses.map(function (c) { return '<option value="' + E(c.id) + '"' + (S.f.course === c.id ? ' selected' : '') + '>' + E(c.title) + '</option>'; }).join('') + '</select>';
    var selSeller = '';
    if (isAdm() && boardScope() === 'all') {
      selSeller = '<select class="select com-sel" data-live="seller" aria-label="Filtrar por vendedor"><option value="">Todos os vendedores</option>' +
        ((S.meta && S.meta.sellers) || []).map(function (s) { return '<option value="' + E(s.id) + '"' + (S.f.seller === s.id ? ' selected' : '') + '>' + E(s.name) + '</option>'; }).join('') + '</select>';
    }
    box.innerHTML = '<div class="com-fbar"><label class="com-search"><span class="sr-only">Buscar lead</span><span class="com-search__ic">' + ic('search') + '</span>' +
      '<input class="input" type="search" data-live="q" value="' + E(S.f.q) + '" placeholder="Nome, e-mail ou telefone" autocomplete="off"></label>' +
      '<button type="button" class="btn btn--sm btn--ghost com-fbtn show-sm" data-act="filt-toggle" aria-expanded="' + (!!S.fOpen) + '">' + ic('filter') + 'Filtros' + (n ? '<span class="com-fbtn__n t-num">' + n + '</span>' : '') + '</button></div>' +
      '<div class="com-fmore' + (S.fOpen ? ' is-open' : '') + '">' + selCourse + selSeller +
      '<button type="button" class="com-tog' + (S.f.overdue ? ' is-on' : '') + '" data-act="overdue" aria-pressed="' + S.f.overdue + '">' + ic('alert') + 'Só atrasados</button>' +
      '<div class="com-chips" id="fx-chips" role="group" aria-label="Origem do lead"></div></div>';
    paintChips();
  }
  function paintChips() { keepFocus(B.$('#fx-chips'), paintChipsRaw); }
  function paintChipsRaw() {
    var box = B.$('#fx-chips');
    if (!box) return;
    var base = leadsFiltered({ skip: 'source' }), cnt = {};
    base.forEach(function (l) { cnt[l.source] = (cnt[l.source] || 0) + 1; });
    var keys = Object.keys((S.meta && S.meta.sources) || SRC_NAME);
    box.innerHTML = '<button type="button" class="com-chipf' + (!S.f.source ? ' is-on' : '') + '" data-act="source" data-source="" aria-pressed="' + !S.f.source + '">Todas as origens<b class="t-num">' + base.length + '</b></button>' +
      keys.filter(function (k) { return cnt[k] || S.f.source === k; }).map(function (k) {
        return '<button type="button" class="com-chipf com-src--' + E(k) + (S.f.source === k ? ' is-on' : '') + '" data-act="source" data-source="' + E(k) + '" aria-pressed="' + (S.f.source === k) + '">' + ic(SRC_ICON[k] || 'tag') + E(srcName(k)) + '<b class="t-num">' + (cnt[k] || 0) + '</b></button>';
      }).join('');
  }

  ACT.scope = function (t) {
    var sc = t.getAttribute('data-scope');
    if (sc === S.f.scope) return;
    S.f.scope = sc; S.f.seller = ''; S.lim = {}; S.board = null; S.boardSig = '';
    saveF(); paintTabs(); paintFilters();
    var box = B.$('#fx-board'); if (box) box.innerHTML = boardSkel();
    loadBoard({ force: true });
  };
  ACT.source = function (t) { S.f.source = t.getAttribute('data-source') || ''; saveF(); S.lim = {}; paintFilters(); paintBoardArea(); };
  ACT.overdue = function () { S.f.overdue = !S.f.overdue; saveF(); S.lim = {}; paintFilters(); paintBoardArea(); };
  ACT['filt-toggle'] = function () { S.fOpen = !S.fOpen; var m = B.$('.com-fmore'); if (m) m.classList.toggle('is-open', !!S.fOpen); var b = B.$('[data-act="filt-toggle"]'); if (b) b.setAttribute('aria-expanded', !!S.fOpen); };
  ACT.stage = function (t) { S.f.stage = t.getAttribute('data-stage'); saveF(); paintBoardArea(); };
  ACT.more = function (t) { var s = t.getAttribute('data-stage'); S.lim[s] = (S.lim[s] || limitFor(s)) + 40; paintBoardArea(); };
  ACT['clear-filters'] = function () { S.f.source = ''; S.f.course = ''; S.f.overdue = false; S.f.q = ''; S.f.seller = ''; S.lim = {}; saveF(); paintFilters(); paintBoardArea(); };
  LIVE.course = function (el) { S.f.course = el.value; saveF(); S.lim = {}; paintChips(); paintBoardArea(); paintFilterBadge(); };
  LIVE.seller = function (el) { S.f.seller = el.value; S.lim = {}; paintChips(); paintBoardArea(); paintFilterBadge(); };
  LIVE.q = B.debounce(function (el) { S.f.q = el.value.trim(); S.lim = {}; paintChips(); paintBoardArea(); }, 140);
  function paintFilterBadge() {
    var b = B.$('[data-act="filt-toggle"]');
    if (!b) return;
    var n = activeFilters() - (S.f.q ? 1 : 0);
    b.innerHTML = ic('filter') + 'Filtros' + (n ? '<span class="com-fbtn__n t-num">' + n + '</span>' : '');
  }
  ACT.sync = function (t) {
    if (isBusy(t)) return;
    busy(t, true);
    api('crmSync').then(function (r) {
      busy(t, false);
      if (r.skipped) B.toast('Os leads já foram atualizados há instantes. Tente de novo em um minuto.', 'info', 3600);
      else {
        var p = [];
        if (r.created) p.push(B.fmt.plural(r.created, 'lead novo', 'leads novos'));
        if (r.reopened) p.push(B.fmt.plural(r.reopened, 'reaberto', 'reabertos'));
        if (r.won) p.push(B.fmt.plural(r.won, 'fechado sozinho', 'fechados sozinhos'));
        B.toast(p.length ? 'Atualizado: ' + p.join(', ') + '.' : 'Atualizado. Nenhuma novidade.', 'ok', 3600);
      }
      poll(true);
    }, function (e) { busy(t, false); fail(e); });
  };
  ACT.open = function (t) { go('/lead/' + t.getAttribute('data-id')); };

  function limitFor(s) { return OPEN[s] ? 40 : 15; }

  function loadBoard(o) {
    o = o || {};
    var scope = boardScope(), req = ++S.boardReq;
    return api('crmBoard', { scope: scope, closed_days: 30 }).then(function (r) {
      if (req !== S.boardReq || S.mode !== 'app') return;
      S.counts = r.counts || S.counts;
      var sig = JSON.stringify(r.leads);
      var same = !!S.board && S.board.scope === scope && S.boardSig === sig;
      S.board = { leads: r.leads || [], scope: scope, at: Date.now() };
      S.boardSig = sig;
      paintCounts();
      if (S.shown === 'funil' && !S.drag && (!same || o.force || !o.silent)) { paintChips(); paintBoardArea(); }
    }, function (e) {
      if (req !== S.boardReq || quiet(e)) return;
      if (S.shown !== 'funil') return;
      if (!S.board) { var box = B.$('#fx-board'); if (box) box.innerHTML = errBlock(e); }
      else if (!o.silent) B.fail(e);
    });
  }

  /* ---------- quadro: cartões, kanban, lista ---------- */
  function emptyBoard(total) {
    var sc = boardScope();
    if (total && activeFilters()) return emptyBlock('Nada com esses filtros', 'Nenhum lead combina com a busca. Tire um filtro para ver mais.', '<button type="button" class="btn" data-act="clear-filters">Limpar filtros</button>', 'filtro');
    if (sc === 'queue') return emptyBlock('A fila está vazia', 'Quando entrar um carrinho abandonado, um Pix sem pagar ou um aluno parado, ele aparece aqui para você assumir.', '', 'fila');
    if (sc === 'mine') return emptyBlock('Você ainda não tem leads', 'Assuma um lead da fila ou cadastre um contato novo.',
      '<div class="row com-empty__acts"><button type="button" class="btn btn--primary" data-act="scope" data-scope="queue">Ver a fila</button><button type="button" class="btn" data-act="new-lead">Novo lead</button></div>', 'meus');
    return emptyBlock('Nenhum lead por aqui', 'Os leads chegam sozinhos quando alguém abandona o carrinho ou para de assistir. Você também pode cadastrar um.', '<button type="button" class="btn btn--primary" data-act="new-lead">Novo lead</button>', 'todos');
  }

  function waBtn(l) {
    return '<button type="button" class="com-act com-act--wa" data-act="wa" data-id="' + E(l.id) + '" aria-label="Enviar WhatsApp para ' + E(l.name) + '">' + ic('whatsapp') + '</button>';
  }
  function openBtn(l) {
    return '<button type="button" class="com-act" data-act="open" data-id="' + E(l.id) + '" aria-label="Abrir a ficha de ' + E(l.name) + '">' + ic('right') + '</button>';
  }

  function cardHtml(l) {
    var d = dueInfo(l), queue = boardScope() === 'queue';
    var cls = d && d.kind === 'late' ? ' is-late' : d && d.kind === 'today' ? ' is-today' : '';
    var drag = !S.mobile && !queue;
    var who = isAdm() && boardScope() === 'all' ? (first(l.seller_name) || 'Fila') + ' · ' : '';
    var last = queue ? 'chegou ' + B.fmt.rel(l.created_at) : l.last_at ? B.fmt.rel(l.last_at) : '';
    var foot = queue
      ? '<button type="button" class="btn btn--sm com-claim" data-act="claim" data-id="' + E(l.id) + '">' + ic('plus') + 'Assumir</button>'
      : dueChip(l, true);
    return '<article class="com-card' + cls + '" data-act="open" data-id="' + E(l.id) + '" tabindex="0"' + (drag ? ' draggable="true"' : '') +
      ' aria-label="' + E(l.name + (l.course_title ? ', ' + l.course_title : '')) + '">' +
      '<div class="com-card__top"><span class="com-card__name">' + E(l.name) + '</span>' + (l.value > 0 ? '<span class="com-card__val t-num">' + money(l.value) + '</span>' : '') + '</div>' +
      '<div class="com-card__course">' + E(l.course_title || 'Sem curso definido') + '</div>' +
      '<div class="com-card__tags">' + srcChip(l) + '<span class="com-card__last" title="Última atividade">' + E(who + last) + '</span></div>' +
      '<div class="com-card__foot">' + foot + '<div class="com-card__acts">' + waBtn(l) + openBtn(l) + '</div></div></article>';
  }

  function moreBtn(st, hidden) {
    return hidden > 0 ? '<button type="button" class="btn btn--sm btn--ghost com-more" data-act="more" data-stage="' + st + '">Mostrar mais ' + hidden + '</button>' : '';
  }
  function kanbanHtml(leads) {
    var by = groupBy(leads), queue = boardScope() === 'queue';
    return '<div class="com-kanban' + (queue ? ' is-queue' : '') + '">' + STAGES.map(function (st) {
      var arr = by[st], shown = arr.slice(0, S.lim[st] || limitFor(st));
      return '<section class="com-col com-col--' + st + '" data-stage="' + st + '" aria-label="' + E(stageName(st)) + ', ' + arr.length + ' leads">' +
        '<header class="com-col__head"><span class="com-col__rune t-rune" aria-hidden="true">' + RUNE[st] + '</span><h2 class="com-col__name">' + E(stageName(st)) + '</h2><span class="com-col__n t-num">' + arr.length + '</span></header>' +
        '<div class="com-col__sum t-num">' + money(sumValue(arr)) + (OPEN[st] ? '' : '<span>últimos 30 dias</span>') + '</div>' +
        '<div class="com-col__body">' + (shown.length ? shown.map(cardHtml).join('') : '<div class="com-col__empty">Nenhum lead nesta etapa.</div>') + moreBtn(st, arr.length - shown.length) + '</div></section>';
    }).join('') + '</div>';
  }
  function listHtml(leads) {
    var by = groupBy(leads), st = STAGES.indexOf(S.f.stage) > -1 ? S.f.stage : 'all';
    var pills = [['all', 'Todas', leads.length]].concat(STAGES.map(function (s) { return [s, stageName(s), by[s].length]; }));
    var h = '<div class="com-stages" role="tablist" aria-label="Etapa do funil">' + pills.map(function (p) {
      return '<button type="button" class="com-stage' + (p[0] !== 'all' ? ' com-stage--' + p[0] : '') + (st === p[0] ? ' is-on' : '') + '" role="tab" aria-selected="' + (st === p[0]) + '" data-act="stage" data-stage="' + p[0] + '">' + E(p[1]) + '<b class="t-num">' + p[2] + '</b></button>';
    }).join('') + '</div>';
    (st === 'all' ? STAGES : [st]).forEach(function (s) {
      var arr = by[s], shown = arr.slice(0, S.lim[s] || limitFor(s));
      if (!arr.length && st === 'all') return;
      h += '<section class="com-grp com-grp--' + s + '"><header class="com-grp__head"><span class="com-grp__rune t-rune" aria-hidden="true">' + RUNE[s] + '</span><h2>' + E(stageName(s)) + '</h2>' +
        '<span class="com-grp__n t-num">' + arr.length + '</span><span class="grow"></span><span class="com-grp__sum t-num">' + money(sumValue(arr)) + '</span></header>' +
        '<div class="com-grp__list">' + (shown.length ? shown.map(cardHtml).join('') : '<div class="com-col__empty">Nenhum lead nesta etapa.</div>') + moreBtn(s, arr.length - shown.length) + '</div></section>';
    });
    return h;
  }
  function paintBoardArea() { keepFocus(B.$('#fx-board'), paintBoardAreaRaw); }
  function paintBoardAreaRaw() {
    var box = B.$('#fx-board');
    if (!box || !S.board) return;
    var leads = leadsFiltered(), sc = {}, left = 0, kb;
    B.$$('.com-col', box).forEach(function (c) { var b = B.$('.com-col__body', c); sc[c.getAttribute('data-stage')] = b ? b.scrollTop : 0; });
    kb = B.$('.com-kanban', box);
    if (kb) left = kb.scrollLeft;
    box.classList.toggle('is-list', S.mobile);
    if (!leads.length) { box.innerHTML = emptyBoard(S.board.leads.length); return; }
    box.innerHTML = S.mobile ? listHtml(leads) : kanbanHtml(leads);
    B.$$('.com-col', box).forEach(function (c) { var b = B.$('.com-col__body', c), y = sc[c.getAttribute('data-stage')]; if (b && y) b.scrollTop = y; });
    kb = B.$('.com-kanban', box);
    if (kb && left) kb.scrollLeft = left;
  }

  ACT.claim = function (t, ev) {
    ev.stopPropagation();
    if (isBusy(t)) return;
    busy(t, true);
    api('crmClaim', { id: t.getAttribute('data-id') }).then(function (r) {
      B.toast('Você assumiu ' + r.lead.name + '.', 'ok', 2600);
      if (S.board) S.board.leads = S.board.leads.filter(function (l) { return l.id !== r.lead.id || boardScope() !== 'queue'; });
      CRM.applyLead(r.lead);
      poll(true);
    }, function (e) { busy(t, false); fail(e); });
  };
  ACT['new-lead'] = function () { CRM.newLead(); };
  ACT.wa = function (t, ev) { ev.stopPropagation(); CRM.wa(t.getAttribute('data-id'), t); };
  ACT.sched = function (t, ev) { ev.stopPropagation(); CRM.schedule(t.getAttribute('data-id')); };

  /* ---------- arrastar e soltar (desktop) ---------- */
  function endDrag() {
    S.drag = '';
    app.classList.remove('is-dragging');
    B.$$('.is-drag, .is-over', app).forEach(function (el) { el.classList.remove('is-drag', 'is-over'); });
  }
  function bindDnD() {
    app.addEventListener('dragstart', function (ev) {
      var c = ev.target && ev.target.closest && ev.target.closest('.com-card[draggable="true"]');
      if (!c) return;
      S.drag = c.getAttribute('data-id');
      c.classList.add('is-drag');
      app.classList.add('is-dragging');
      try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', S.drag); } catch (e) {}
    });
    app.addEventListener('dragend', endDrag);
    app.addEventListener('dragover', function (ev) {
      if (!S.drag) return;
      var col = ev.target && ev.target.closest && ev.target.closest('.com-col');
      if (!col) return;
      ev.preventDefault();
      try { ev.dataTransfer.dropEffect = 'move'; } catch (e) {}
      if (!col.classList.contains('is-over')) {
        B.$$('.com-col.is-over', app).forEach(function (c) { c.classList.remove('is-over'); });
        col.classList.add('is-over');
      }
    });
    app.addEventListener('drop', function (ev) {
      if (!S.drag) return;
      var col = ev.target && ev.target.closest && ev.target.closest('.com-col');
      if (!col) return;
      ev.preventDefault();
      var id = S.drag, st = col.getAttribute('data-stage');
      endDrag();
      CRM.moveLead(id, st);
    });
  }

  CRM.applyLead = function (nl) {
    if (!nl || !nl.id) return;
    [S.board, S.today].forEach(function (b) {
      if (!b) return;
      for (var i = 0; i < b.leads.length; i++) if (b.leads[i].id === nl.id) { b.leads[i] = nl; return; }
    });
    CRM.repaint();
  };
  CRM.repaint = function () {
    if (S.shown === 'funil') { paintChips(); paintBoardArea(); }
    else if (S.shown === 'hoje') paintHoje();
  };
  // mover de etapa: ganho pede confirmação, perdido pede o motivo; a tela muda na hora e volta atrás se der erro
  CRM.moveLead = function (id, st) {
    var l = findLead(id);
    if (!l || l.status === st || STAGES.indexOf(st) < 0) return Promise.resolve(false);
    if (st === 'lost') return CRM.askLost(l).then(function (reason) { if (reason) doMove(l, st, reason); });
    if (st === 'won') {
      return B.confirm({ title: 'Marcar como ganho?', text: l.name + ' vai para Ganho. Use quando a venda já foi fechada.', ok: 'Marcar como ganho' }).then(function (ok) { if (ok) doMove(l, st, ''); });
    }
    doMove(l, st, '');
    return Promise.resolve(true);
  };
  function doMove(l, st, reason) {
    var prev = Object.assign({}, l), closed = !OPEN[st];
    CRM.applyLead(Object.assign({}, l, { status: st, status_label: stageName(st), lost_reason: st === 'lost' ? reason : '', overdue: closed ? false : l.overdue, due_today: closed ? false : l.due_today }));
    api('crmLeadSave', { lead: { id: l.id, status: st, lost_reason: reason } }).then(function (r) {
      CRM.applyLead(r.lead);
      B.toast(l.name + ' foi para ' + stageName(st) + '.', 'ok', 2400);
      CRM.touch();
    }, function (e) { CRM.applyLead(prev); fail(e); });
  }

  /* ===============================================================
     HOJE (/hoje): a lista de trabalho do dia
     =============================================================== */
  function hojeScope() { return isAdm() && S.hojeScope === 'all' ? 'all' : 'mine'; }

  function viewHoje() {
    var seg = isAdm() ? '<div class="seg" role="group" aria-label="Quem">' + [['mine', 'Meus'], ['all', 'Todos']].map(function (x) {
      return '<button type="button" data-act="hoje-scope" data-scope="' + x[0] + '" class="' + (hojeScope() === x[0] ? 'is-active' : '') + '" aria-pressed="' + (hojeScope() === x[0]) + '">' + x[1] + '</button>';
    }).join('') + '</div>' : '';
    view.innerHTML = '<div class="com-page com-hoje">' + head('ᚱ', 'Hoje', '<span id="hj-sub">' + E(longDay(Date.now())) + '</span>', seg) +
      '<div id="hj-body" aria-live="polite"><div class="com-skel">' + sk(84) + sk(84) + sk(84) + '</div></div></div>';
    if (S.today && S.today.scope === hojeScope()) paintHoje();
    loadToday({ force: true });
  }
  ACT['hoje-scope'] = function (t) {
    var sc = t.getAttribute('data-scope');
    if (sc === S.hojeScope) return;
    S.hojeScope = sc; S.today = null; S.todaySig = '';
    B.$$('[data-act="hoje-scope"]').forEach(function (b) { var on = b.getAttribute('data-scope') === sc; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
    var body = B.$('#hj-body'); if (body) body.innerHTML = '<div class="com-skel">' + sk(84) + sk(84) + '</div>';
    loadToday({ force: true });
  };

  function loadToday(o) {
    o = o || {};
    var scope = hojeScope(), req = ++S.todayReq;
    return api('crmBoard', { scope: scope, closed_days: 1 }).then(function (r) {
      if (req !== S.todayReq || S.mode !== 'app') return;
      S.counts = r.counts || S.counts;
      var sig = JSON.stringify(r.leads);
      var same = !!S.today && S.today.scope === scope && S.todaySig === sig;
      S.today = { leads: r.leads || [], scope: scope, at: Date.now() };
      S.todaySig = sig;
      paintCounts();
      if (S.shown === 'hoje' && (!same || o.force || !o.silent)) paintHoje();
    }, function (e) {
      if (req !== S.todayReq || quiet(e) || S.shown !== 'hoje') return;
      if (!S.today) { var body = B.$('#hj-body'); if (body) body.innerHTML = errBlock(e); }
      else if (!o.silent) B.fail(e);
    });
  }

  function hojeGroups() {
    var ls = ((S.today && S.today.leads) || []).filter(function (l) { return OPEN[l.status]; });
    var late = ls.filter(function (l) { return l.overdue; }).sort(function (a, b) { return a.next_at - b.next_at; });
    var today = ls.filter(function (l) { return l.due_today && !l.overdue; }).sort(function (a, b) { return a.next_at - b.next_at; });
    var seen = {};
    late.concat(today).forEach(function (l) { seen[l.id] = 1; });
    var fresh = ls.filter(function (l) { return l.status === 'new' && !seen[l.id]; }).sort(function (a, b) { return a.created_at - b.created_at; });
    return { late: late, today: today, fresh: fresh };
  }
  function rowHtml(l, kind) {
    var done = !!S.done[l.id], note = String(l.note || '').trim();
    var tag = kind === 'fresh' ? chip('', 'clock', 'Chegou ' + B.fmt.rel(l.created_at)) : dueChip(l);
    var who = hojeScope() === 'all' ? '<span class="com-row__who">' + E(first(l.seller_name) || 'Fila') + '</span>' : '';
    return '<article class="com-row com-row--' + kind + (done ? ' is-done' : '') + '" data-id="' + E(l.id) + '">' +
      '<div class="com-row__main" data-act="open" data-id="' + E(l.id) + '" tabindex="0" role="button" aria-label="Abrir a ficha de ' + E(l.name) + '">' +
        '<div class="com-row__top"><strong class="com-row__name">' + E(l.name) + '</strong>' + tag + '</div>' +
        '<div class="com-row__sub"><span class="com-row__course">' + E(l.course_title || 'Sem curso definido') + '</span>' + srcChip(l) + who + (l.value > 0 ? '<span class="com-row__val t-num">' + money(l.value) + '</span>' : '') + '</div>' +
        (note ? '<div class="com-row__note">' + ic('note') + '<span>' + E(note) + '</span></div>' : '') +
      '</div>' +
      '<div class="com-row__acts">' + (done ? '<span class="chip chip--ok com-row__done">' + ic('check') + 'Mensagem registrada</span>' : '') +
        '<button type="button" class="btn btn--sm ' + (done ? 'btn--ghost' : 'btn--primary') + '" data-act="wa" data-id="' + E(l.id) + '">' + ic('whatsapp') + 'WhatsApp</button>' +
        '<button type="button" class="btn btn--sm ' + (done ? 'btn--primary' : 'btn--ghost') + '" data-act="sched" data-id="' + E(l.id) + '">' + ic('check') + 'Feito: reagendar</button>' +
        openBtn(l) + '</div></article>';
  }
  function hojeSection(kind, title, icon, arr, hint) {
    if (!arr.length) return '';
    return '<section class="com-sec com-sec--' + kind + '"><header class="com-sec__head">' + ic(icon) + '<h2>' + E(title) + '</h2><span class="com-sec__n t-num">' + arr.length + '</span>' +
      (hint ? '<span class="com-sec__hint">' + E(hint) + '</span>' : '') + '</header><div class="com-sec__list">' + arr.map(function (l) { return rowHtml(l, kind); }).join('') + '</div></section>';
  }
  function paintHoje() { keepFocus(B.$('#hj-body'), paintHojeRaw); }
  function paintHojeRaw() {
    var body = B.$('#hj-body');
    if (!body || !S.today) return;
    var g = hojeGroups(), total = g.late.length + g.today.length + g.fresh.length;
    var sub = B.$('#hj-sub');
    if (sub) sub.innerHTML = E(longDay(Date.now())) + (S.doneN ? ' <span class="com-head__done">' + ic('check') + B.fmt.plural(S.doneN, 'lead tratado', 'leads tratados') + ' hoje</span>' : '');
    if (!total) {
      body.innerHTML = '<div class="com-zero hud"><div class="com-zero__rune t-rune" aria-hidden="true">ᛟ</div><h2 class="com-zero__t">Dia em ordem.</h2>' +
        '<p>Nenhum contato atrasado, nada marcado para hoje e nenhum lead novo esperando. Aproveite para puxar alguém da fila ou cadastrar um contato.</p>' +
        '<div class="row com-empty__acts"><button type="button" class="btn btn--primary" data-act="go-queue">' + ic('inbox') + 'Ver a fila</button><button type="button" class="btn" data-act="new-lead">' + ic('plus') + 'Novo lead</button></div></div>';
      return;
    }
    body.innerHTML = hojeSection('late', 'Atrasados', 'alert', g.late, 'Comece por aqui') +
      hojeSection('today', 'Para hoje', 'clock', g.today, '') +
      hojeSection('fresh', 'Novos sem contato', 'sparkles', g.fresh, 'Quem chegou primeiro, fala primeiro');
  }

  /* ===============================================================
     RESULTADOS (/resultados)
     =============================================================== */
  function viewOfertas() { CRM.viewOfertas(); }
  function loadOffers(silent) { CRM.loadOffers(silent); }

  function viewStats() {
    var sel = isAdm() ? '<select class="select com-sel" data-live="stats-seller" aria-label="Ver resultados de">' +
      '<option value="">Time todo</option>' + ((S.meta && S.meta.sellers) || []).map(function (s) { return '<option value="' + E(s.id) + '"' + (S.statsSeller === s.id ? ' selected' : '') + '>' + E(s.name) + '</option>'; }).join('') + '</select>' : '';
    var seg = '<div class="seg" role="group" aria-label="Período">' + [7, 30, 90].map(function (d) {
      return '<button type="button" data-act="days" data-days="' + d + '" class="' + (d === S.days ? 'is-active' : '') + '" aria-pressed="' + (d === S.days) + '">' + d + ' dias</button>';
    }).join('') + '</div>';
    view.innerHTML = '<div class="com-page com-stats">' + head('ᛊ', 'Resultados', '<span id="st-sub"></span>', '<div class="com-head__filters">' + sel + seg + '</div>') +
      '<div id="st-body" aria-live="polite">' + statsSkel() + '</div></div>';
    subStats();
    if (S.stats && S.stats.days === S.days && S.stats.seller === S.statsSeller) paintStats();
    loadStats(false);
  }
  function statsSkel() { return '<div class="com-skel"><div class="com-kpis">' + [1, 2, 3, 4, 5, 6, 7, 8].map(function () { return sk(86); }).join('') + '</div>' + sk(150) + sk(260) + '</div>'; }
  function subStats() {
    var el = B.$('#st-sub');
    if (el) el.textContent = (isAdm() && S.statsSeller ? 'Resultados de ' + (((S.meta.sellers || []).filter(function (s) { return s.id === S.statsSeller; })[0] || {}).name || 'vendedor') : isAdm() ? 'Resultados do time' : 'Seus números') + ' nos últimos ' + S.days + ' dias.';
  }
  ACT.days = function (t) {
    var d = Number(t.getAttribute('data-days'));
    if (!d || d === S.days || S.shown !== 'resultados') return;
    S.days = d; B.sstore.set('com:days', d);
    B.$$('[data-act="days"]').forEach(function (b) { var on = Number(b.getAttribute('data-days')) === d; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
    subStats();
    var body = B.$('#st-body'); if (body) body.classList.add('is-busy');
    loadStats(false);
  };
  LIVE['stats-seller'] = function (el) {
    S.statsSeller = el.value; subStats();
    var body = B.$('#st-body'); if (body) body.classList.add('is-busy');
    loadStats(false);
  };
  function loadStats(silent) {
    var req = ++S.statsReq, payload = { days: S.days };
    if (isAdm() && S.statsSeller) payload.seller_id = S.statsSeller;
    return api('crmStats', payload).then(function (r) {
      if (req !== S.statsReq || S.shown !== 'resultados') return;
      r.seller = isAdm() ? S.statsSeller : '';
      S.stats = r;
      paintStats();
    }, function (e) {
      if (req !== S.statsReq || quiet(e) || S.shown !== 'resultados') return;
      var body = B.$('#st-body');
      if (body) body.classList.remove('is-busy');
      if (!S.stats && body) body.innerHTML = errBlock(e); else if (!silent) B.fail(e);
    });
  }
  function kpi(label, value, sub, o) {
    o = o || {};
    return '<div class="com-kpi' + (o.cls ? ' ' + o.cls : '') + '"><span class="com-kpi__l">' + (o.icon ? ic(o.icon) : '') + E(label) + '</span><span class="com-kpi__v t-num">' + value + '</span>' +
      (sub ? '<span class="com-kpi__s">' + sub + '</span>' : '') + '</div>';
  }
  function commHtml(k, r) {
    var adm = isAdm(), pix = S.me && S.me.pix_key, one = !!(r && r.seller);
    var any = k.commission_pending > 0 || k.commission_available > 0 || k.commission_paid > 0;
    if (!adm && !any && !(S.me && S.me.commission > 0)) {
      return '<section class="com-comm com-comm--none"><div class="com-note">' + ic('info') + '<span>Sua conta não tem comissão por venda. As vendas aparecem nos números e no ranking.</span></div></section>';
    }
    var availSub = adm ? 'Pronta para pagar ' + (one ? 'ao vendedor.' : 'aos vendedores.') : (pix ? 'Será paga na sua chave Pix.' : 'Cadastre sua chave Pix para receber.');
    return '<section class="com-comm" aria-label="Comissão"><div class="com-bal com-bal--pend"><div class="com-bal__l">' + ic('clock') + 'A liberar</div><div class="com-bal__v t-num">' + money(k.commission_pending) + '</div><div class="com-bal__s">Libera depois do prazo de garantia.</div></div>' +
      '<div class="com-bal com-bal--avail hud"><div class="com-bal__l">' + ic('wallet') + 'Disponível</div><div class="com-bal__v t-num">' + money(k.commission_available) + '</div>' +
      '<div class="com-bal__s">' + availSub + '</div>' +
      (adm || pix ? '' : '<a class="btn btn--sm btn--primary com-bal__cta" href="#/perfil">' + ic('pix') + 'Cadastrar chave Pix</a>') + '</div>' +
      '<div class="com-bal com-bal--paid"><div class="com-bal__l">' + ic('check') + (adm ? 'Já pago' : 'Já recebido') + '</div><div class="com-bal__v t-num">' + money(k.commission_paid) + '</div><div class="com-bal__s">' + (adm ? 'Comissões já pagas ' + (one ? 'ao vendedor.' : 'aos vendedores.') : 'Comissões já pagas a você.') + '</div></div></section>';
  }
  function rankHtml(r) {
    var rk = r.ranking || [];
    if (!rk.length) return '<p class="com-mute">Ninguém fechou venda neste período ainda. A primeira entra aqui.</p>';
    var max = Math.max.apply(null, rk.map(function (x) { return x.revenue; })) || 1;
    return '<ol class="com-rank">' + rk.map(function (x, i) {
      return '<li class="com-rank__i' + (x.me ? ' is-me' : '') + '"><span class="com-rank__pos t-num">' + (i + 1) + '</span><div class="com-rank__main">' +
        '<div class="com-rank__row"><strong class="ellipsis">' + E(x.name) + '</strong>' + (x.me ? '<span class="chip chip--mustard">Você</span>' : '') + '<span class="grow"></span><span class="com-rank__rev t-num">' + money(x.revenue) + '</span></div>' +
        '<div class="com-rank__bar" aria-hidden="true"><span style="width:' + Math.max(3, x.revenue / max * 100).toFixed(1) + '%"></span></div>' +
        '<div class="com-rank__sub">' + E(B.fmt.plural(x.sales, 'venda', 'vendas')) + '</div></div></li>';
    }).join('') + '</ol>';
  }
  function payoutsHtml(r) {
    var ps = r.payouts || [];
    if (!ps.length) return '<p class="com-mute">' + (r.payouts_team ? 'Nenhum pagamento feito ao time ainda.' : isAdm() ? 'Nenhum pagamento feito a este vendedor ainda.' : 'Nenhum pagamento ainda. Quando uma comissão liberada for paga, ela aparece aqui.') + '</p>';
    return '<ul class="com-pays">' + ps.map(function (p) {
      return '<li class="com-pays__i"><span class="com-pays__ic">' + ic('pix') + '</span><div class="com-pays__txt"><strong class="t-num">' + money(p.amount) + '</strong><span>' + (r.payouts_team && p.name ? E(p.name) + ' · ' : '') + E(B.fmt.date(p.created_at)) + ' · ' + E(B.fmt.plural(p.count, 'comissão', 'comissões')) + (p.note ? ' · ' + E(p.note) : '') + '</span></div></li>';
    }).join('') + '</ul>';
  }
  function paintStats() {
    var body = B.$('#st-body'), r = S.stats;
    if (!body || !r) return;
    var k = r.kpis, rate = k.offers_sent ? Math.round(k.offers_used / k.offers_sent * 100) : 0;
    var pays = !isAdm() || !!r.seller || !!r.payouts_team;   // na visão do time vêm os pagamentos de todos os vendedores
    body.classList.remove('is-busy');
    body.innerHTML = '<div class="com-kpis">' +
      kpi('Vendas', B.fmt.int(k.sales), '', { icon: 'cart' }) + kpi('Receita', money(k.revenue), '', { icon: 'money', cls: 'is-hot' }) +
      kpi('Ticket médio', money(k.ticket), '', { icon: 'tag' }) + kpi('Conversão', E(B.fmt.pct(k.conv)), E(B.fmt.plural(k.won, 'lead ganho', 'leads ganhos')) + ' · ' + E(B.fmt.plural(k.lost, 'perdido', 'perdidos')), { icon: 'target' }) +
      kpi('Leads abertos', B.fmt.int(k.open), E(B.fmt.int(k.today)) + ' para hoje', { icon: 'inbox' }) +
      kpi('Atrasados', B.fmt.int(k.overdue), k.overdue ? 'Fale com eles primeiro' : 'Nenhum atraso', { icon: 'alert', cls: k.overdue ? 'is-late' : '' }) +
      kpi('Condições enviadas', B.fmt.int(k.offers_sent), '', { icon: 'send' }) + kpi('Condições usadas', B.fmt.int(k.offers_used), k.offers_sent ? E(B.fmt.int(rate)) + '% das enviadas' : '', { icon: 'check' }) +
      '</div>' + commHtml(k, r) +
      '<div class="com-cols"><section class="panel com-panel"><div class="panel__head"><h2 class="panel__title">Receita por dia</h2></div><div id="st-rev"></div></section>' +
      '<section class="panel com-panel"><div class="panel__head"><h2 class="panel__title">Leads abertos por origem</h2></div><div id="st-src"></div></section></div>' +
      '<div class="com-cols' + (pays ? '' : ' com-cols--one') + '"><section class="panel com-panel"><div class="panel__head"><h2 class="panel__title">Ranking do time</h2></div>' + rankHtml(r) + '</section>' +
      (pays ? '<section class="panel com-panel"><div class="panel__head"><h2 class="panel__title">' + (isAdm() ? 'Pagamentos feitos' : 'Pagamentos recebidos') + '</h2></div>' + payoutsHtml(r) + '</section>' : '') + '</div>';
    B.chart.area(B.$('#st-rev'), (r.series || []).map(function (s) { return { label: s.label, value: s.revenue }; }), { format: B.fmt.money, height: 220, label: 'Receita por dia' });
    var src = Object.keys(r.by_source || {}).map(function (key) { return { label: (r.sources && r.sources[key]) || srcName(key), value: r.by_source[key] }; }).sort(function (a, b) { return b.value - a.value; });
    B.chart.bars(B.$('#st-src'), src, { format: B.fmt.int, limit: 6 });
  }

  /* ===============================================================
     PERFIL (/perfil)
     =============================================================== */
  function viewPerfil() {
    var me = S.me || {}, adm = isAdm();
    var comm = me.commission > 0 ? B.fmt.pct(me.commission) + ' sobre cada venda' : 'Sem comissão por venda';
    var disc = adm ? 'Sem limite (administrador)' : 'Até ' + B.fmt.pct(me.max_discount) + ' do preço normal';
    view.innerHTML = '<div class="com-page com-perfil">' + head('ᛗ', 'Perfil', 'Seus dados e as regras da sua conta.', '') +
      '<div class="com-perfil__grid"><form class="panel com-panel stack com-form" data-form="perfil" novalidate>' +
        '<div class="panel__head"><h2 class="panel__title">Seus dados</h2></div>' +
        field({ name: 'name', label: 'Nome', ac: 'name', value: me.name, max: 120 }) +
        '<div class="field"><label for="f-email-ro">E-mail</label><input class="input" id="f-email-ro" value="' + E(me.email) + '" readonly aria-readonly="true"><div class="hint">O e-mail é o seu acesso. Para trocar, fale com o administrador.</div></div>' +
        field({ name: 'phone', label: 'WhatsApp', type: 'tel', ac: 'tel', im: 'tel', ph: '(00) 00000-0000', value: B.fmt.phone(me.phone), max: 20 }) +
        field({ name: 'pix_key', label: 'Chave Pix para receber a comissão', ac: 'off', ph: 'CPF, e-mail, celular ou chave aleatória', value: me.pix_key, max: 120, hint: 'É nela que você recebe a comissão liberada.', extra: ' autocapitalize="none" spellcheck="false"' }) +
        '<div class="err com-formerr" data-formerr role="alert" hidden></div>' +
        '<div class="row com-perfil__acts"><button type="submit" class="btn btn--primary">' + ic('check') + 'Salvar perfil</button></div></form>' +
      '<aside class="stack"><section class="panel com-panel"><div class="panel__head"><h2 class="panel__title">Suas regras</h2></div>' +
        '<dl class="com-kv"><div><dt>Papel</dt><dd>' + (adm ? 'Administrador (vê todos os leads)' : 'Vendedor') + '</dd></div>' +
        '<div><dt>Comissão</dt><dd>' + E(comm) + '</dd></div><div><dt>Limite de desconto</dt><dd>' + E(disc) + '</dd></div></dl>' +
        '<p class="hint">Comissão e limite de desconto são definidos pelo administrador e não podem ser alterados aqui.</p></section>' +
      '<section class="panel com-panel"><div class="panel__head"><h2 class="panel__title">Conta</h2></div>' +
        '<button type="button" class="btn btn--danger btn--block" data-act="logout">' + ic('logout') + 'Sair da conta</button></section></aside></div></div>';
  }
  FORM.perfil = function (f) {
    var btn = B.$('[type="submit"]', f);
    if (isBusy(btn)) return;
    clearErrs(f);
    var d = B.formData(f), name = String(d.name || '').trim(), phone = String(d.phone || '').replace(/\D/g, '');
    if (name.length < 2) return fieldErr(f, 'name', 'Informe seu nome.');
    if (phone && (phone.length < 10 || phone.length > 13)) return fieldErr(f, 'phone', 'Informe o WhatsApp com DDD. Exemplo: (85) 99999-0000.');
    busy(btn, true);
    api('crmProfile', { name: name, phone: phone, pix_key: String(d.pix_key || '').trim() }).then(function (r) {
      busy(btn, false);
      S.me = Object.assign({}, S.me, r.me);
      if (S.user) { S.user.name = S.me.name; B.session.setUser(S.user); }
      B.$$('[data-me-name]').forEach(function (n) { n.textContent = first(S.me.name); });
      B.$$('[data-me-name2]').forEach(function (n) { n.textContent = S.me.name; });
      var ph = B.$('[name="phone"]', f); if (ph) ph.value = B.fmt.phone(S.me.phone);   // o campo mostra o número já formatado
      B.toast('Perfil salvo.', 'ok', 2400);
    }, function (e) { busy(btn, false); formErr(f, e.message); });
  };

  /* ===============================================================
     modais: o núcleo não devolve o foco a quem abriu nem prende o Tab.
     Aqui isso é feito só nesta página, por cima do B.modal (sem tocar no core.js).
     =============================================================== */
  function isShown(n) { return !!(n.offsetWidth || n.offsetHeight || (n.getClientRects && n.getClientRects().length)); }
  function isTextEntry(n) { return !!n && /^(input|textarea|select)$/i.test(n.tagName); }
  function giveBack(opener, sel) {
    var ae = document.activeElement;
    if (ae && ae !== document.body && ae !== document.documentElement && ae.isConnected) return;   // alguém já pôs o foco em outro lugar
    var target = opener && opener.isConnected ? opener : null;
    if (!target && sel) { try { target = document.querySelector(sel); } catch (e) {} }
    var roots = document.querySelectorAll('.modal-root'), top = roots.length ? roots[roots.length - 1] : null;
    if (top && (!target || !top.contains(target))) {                  // ainda há um modal aberto por baixo: o foco fica nele
      var inner = Array.prototype.filter.call(top.querySelectorAll(FOCUSABLE), isShown)[0];
      target = inner || null;
    }
    if (!target || (isTextEntry(target) && 'ontouchstart' in window)) return;   // em tela de toque não reabre o teclado virtual
    try { target.focus({ preventScroll: true }); } catch (e) {}
  }
  function patchModal() {
    var raw = B.modal;
    if (!raw || raw.__com) return;
    var wrapped = function () {
      var from = document.activeElement, sel = focusSel(from);
      if (from === document.body || from === document.documentElement) from = null;
      var m = raw.apply(this, arguments);
      var close = m.close;
      m.close = function () {
        var first = !m.closed;
        var r = close.apply(m, arguments);
        if (first) giveBack(from, sel);
        return r;
      };
      return m;
    };
    wrapped.__com = true;
    B.modal = wrapped;
    // Tab e Shift+Tab não saem do modal que está por cima
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Tab' || ev.defaultPrevented) return;
      var roots = document.querySelectorAll('.modal-root');
      if (!roots.length) return;
      var root = roots[roots.length - 1], items = Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), isShown), cur = document.activeElement;
      if (!items.length) { ev.preventDefault(); return; }
      var a = items[0], z = items[items.length - 1];
      if (!root.contains(cur)) { ev.preventDefault(); (ev.shiftKey ? z : a).focus(); }
      else if (ev.shiftKey && cur === a) { ev.preventDefault(); z.focus(); }
      else if (!ev.shiftKey && cur === z) { ev.preventDefault(); a.focus(); }
    }, true);
  }

  /* ===============================================================
     início
     =============================================================== */
  B.boot(function () {
    app = B.$('#app');
    patchModal();
    bindGlobal();
    bindDnD();
    B.demoBar('sales');
    B.listen('auth:expired', function () {
      if (S.mode === 'auth') return;
      showAuth('Sua sessão expirou. Entre de novo.', 'login');
    });
    var token = B.qs('primeiro');
    if (token) {
      return B.loadBrand().then(function () {
        authShell('Primeiro acesso');
        B.$('[data-auth-card]', app).innerHTML = '<div class="com-boot com-boot--mini"><div class="spinner" role="status" aria-label="Carregando"></div></div>';
        S.mode = 'auth';
        return B.api('firstInfo', { first: token }).then(function (r) {
          authCard('first', { first: token, name: r.name, email_masked: r.email_masked });
        }, function (e) {
          try { history.replaceState(null, '', location.pathname + '#/'); } catch (x) {}
          authCard('forgot', {});
          B.toast(e.message, 'bad', 7000);
        });
      });
    }
    return B.ensureDemoLogin().then(B.loadBrand).then(function (boot) {
      if (!B.session.token() || !boot.user) { B.session.clear(); showAuth('', 'login'); return; }
      S.user = boot.user;
      afterLogin(boot.user);
    });
  });
})();

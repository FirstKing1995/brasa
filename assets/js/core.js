/* =====================================================================
   BRASA · core.js
   Utilitários compartilhados por todas as telas (aluno, ADM, afiliado, LP).
   Expõe o objeto global B. Sem dependências, sem build.
   ===================================================================== */
(function (w, d) {
  'use strict';

  var B = w.B = w.B || {};

  /* ---------- configuração e modo ---------- */
  var cfg = B.cfg = Object.assign({
    API_URL: '',        // URL do Web App do Apps Script; vazio = modo demonstração
    SITE_URL: '',       // URL pública do GitHub Pages (com / no final)
    BRAND: 'BRASA',
    TAGLINE: 'Cursos para quem quer viver de verdade',
    DEMO: false
  }, w.BRASA_CONFIG || {});

  var params0 = new URLSearchParams(location.search);
  B.demo = cfg.DEMO === true || !cfg.API_URL || params0.get('demo') === '1';

  // pasta base do site (para carregar scripts e montar links)
  (function () {
    var s = d.currentScript && d.currentScript.src;
    B.base = s ? s.replace(/assets\/js\/core\.js.*$/, '') : '';
  })();
  B.siteUrl = function () {
    if (cfg.SITE_URL) return cfg.SITE_URL.replace(/\/?$/, '/');
    return location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  };

  /* ---------- DOM ---------- */
  B.$ = function (sel, root) { return (root || d).querySelector(sel); };
  B.$$ = function (sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); };
  B.el = function (tag, attrs, html) {
    var e = d.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    if (html != null) e.innerHTML = html;
    return e;
  };
  // evento delegado: B.on(root, 'click', '[data-x]', fn(ev, matchedEl))
  B.on = function (root, type, sel, fn) {
    root.addEventListener(type, function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest(sel) : null;
      if (t && root.contains(t)) fn(ev, t);
    });
  };

  /* ---------- texto seguro ---------- */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  B.esc = function (s) { return s == null ? '' : String(s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); };
  // quebra de linha -> <br>, com escape
  B.nl2br = function (s) { return B.esc(s).replace(/\n/g, '<br>'); };
  B.safeUrl = function (u) {
    u = String(u || '').trim();
    if (/^(https?:|mailto:|tel:|data:image\/)/i.test(u) || /^[\w./?#=&%-]+$/.test(u)) return u;
    return '#';
  };
  B.slug = function (s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  };
  B.lines = function (s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); };

  /* ---------- formatação ---------- */
  var nfMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var nfInt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  var TZ = 'America/Fortaleza';
  B.fmt = {
    money: function (v) { return nfMoney.format(Number(v) || 0).replace(/ /g, ' '); },
    moneyShort: function (v) {
      v = Number(v) || 0;
      if (Math.abs(v) >= 1e6) return 'R$ ' + nf1.format(v / 1e6) + ' mi';
      if (Math.abs(v) >= 1e4) return 'R$ ' + nf1.format(v / 1e3) + ' mil';
      return B.fmt.money(v);
    },
    int: function (v) { return nfInt.format(Number(v) || 0); },
    num: function (v) { return nf1.format(Number(v) || 0); },
    pct: function (v, digits) { return (Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: digits == null ? 1 : digits }) + '%'; },
    date: function (ts) { return ts ? new Date(Number(ts)).toLocaleDateString('pt-BR', { timeZone: TZ }) : '—'; },
    dateShort: function (ts) { return ts ? new Date(Number(ts)).toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: 'short' }).replace('.', '') : '—'; },
    datetime: function (ts) { return ts ? new Date(Number(ts)).toLocaleString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'; },
    time: function (ts) { return ts ? new Date(Number(ts)).toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : ''; },
    rel: function (ts) {
      if (!ts) return '—';
      var s = (Date.now() - Number(ts)) / 1000;
      if (s < 0) { var f = -s; if (f < 3600) return 'em ' + Math.ceil(f / 60) + ' min'; if (f < 86400) return 'em ' + Math.round(f / 3600) + ' h'; return 'em ' + Math.ceil(f / 86400) + ' dias'; }
      if (s < 60) return 'agora';
      if (s < 3600) return 'há ' + Math.floor(s / 60) + ' min';
      if (s < 86400) return 'há ' + Math.floor(s / 3600) + ' h';
      if (s < 172800) return 'ontem';
      if (s < 86400 * 30) return 'há ' + Math.floor(s / 86400) + ' dias';
      return B.fmt.date(ts);
    },
    dur: function (min) {
      min = Math.round(Number(min) || 0);
      if (min < 60) return min + 'min';
      var h = Math.floor(min / 60), m = min % 60;
      return h + 'h' + (m ? ' ' + m + 'min' : '');
    },
    clock: function (sec) {
      sec = Math.max(0, Math.floor(Number(sec) || 0));
      var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
      return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
    },
    phone: function (v) {
      var x = String(v || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
      if (x.length === 11) return '(' + x.slice(0, 2) + ') ' + x.slice(2, 7) + '-' + x.slice(7);
      if (x.length === 10) return '(' + x.slice(0, 2) + ') ' + x.slice(2, 6) + '-' + x.slice(6);
      return v || '';
    },
    maskEmail: function (e) {
      e = String(e || ''); var p = e.split('@'); if (p.length < 2) return e;
      return p[0].slice(0, 2) + '***@' + p[1];
    },
    plural: function (n, one, many) { return B.fmt.int(n) + ' ' + (Number(n) === 1 ? one : many); }
  };
  // datas para <input type="date"> no fuso do Brasil (-03:00)
  B.dateInput = function (ts) {
    if (!ts) return '';
    var dt = new Date(Number(ts) - 3 * 3600e3);
    return dt.toISOString().slice(0, 10);
  };
  B.dateFromInput = function (str, endOfDay) {
    if (!str) return 0;
    return new Date(str + (endOfDay ? 'T23:59:59.999-03:00' : 'T00:00:00.000-03:00')).getTime();
  };
  // parcela pela tabela Price; rate = juros ao mês (ex.: 0.0299)
  B.installment = function (price, n, rate) {
    price = Number(price) || 0; n = Math.max(1, Number(n) || 1); rate = Number(rate) || 0;
    if (n === 1 || rate <= 0) return price / n;
    return price * rate / (1 - Math.pow(1 + rate, -n));
  };

  /* ---------- armazenamento seguro ---------- */
  var mem = {};
  function stor(kind) {
    return {
      get: function (k, def) {
        try { var v = w[kind].getItem('brasa:' + k); if (v != null) return JSON.parse(v); } catch (e) { if (('m' + kind + k) in mem) return mem['m' + kind + k]; }
        return def;
      },
      set: function (k, v) {
        try { w[kind].setItem('brasa:' + k, JSON.stringify(v)); return true; } catch (e) { mem['m' + kind + k] = v; return false; }
      },
      del: function (k) { try { w[kind].removeItem('brasa:' + k); } catch (e) { delete mem['m' + kind + k]; } }
    };
  }
  B.store = stor('localStorage');
  B.sstore = stor('sessionStorage');
  B.storageOk = (function () { try { localStorage.setItem('brasa:t', '1'); localStorage.removeItem('brasa:t'); return true; } catch (e) { return false; } })();

  /* ---------- sessão (uma por superfície: app, admin, aff) ---------- */
  B.session = {
    scope: 'app',
    use: function (scope) { this.scope = scope; return this; },
    key: function () { return 'sess:' + this.scope; },
    token: function () { var s = B.store.get(this.key()); return s && s.token || ''; },
    user: function () { var s = B.store.get(this.key()); return s && s.user || null; },
    set: function (token, user) { B.store.set(this.key(), { token: token, user: user, at: Date.now() }); },
    setUser: function (user) { var s = B.store.get(this.key()) || {}; s.user = user; B.store.set(this.key(), s); },
    clear: function () { B.store.del(this.key()); }
  };

  // sair: limpa a sessão desta superfície (na demo, evita o login automático)
  B.logout = function () {
    B.session.clear();
    if (B.demo) B.store.set('demo:out:' + B.session.scope, true);
  };
  // na demo, entra sozinho com a persona da superfície (aluno, ADM, afiliado)
  B.ensureDemoLogin = function () {
    var scope = B.session.scope;
    if (!B.demo || B.session.token() || B.store.get('demo:out:' + scope)) return Promise.resolve(false);
    return B.demoReady.then(function () {
      var c = w.BrasaDemo.creds[scope]; if (!c) return false;
      return B.api('login', { email: c[0], password: c[1], as: scope === 'admin' ? 'admin' : scope === 'sales' ? 'seller' : undefined }).then(function (r) {
        B.session.set(r.token, r.user); return true;
      });
    });
  };
  B.loginDone = function (r) {
    B.session.set(r.token, r.user);
    if (B.demo) B.store.del('demo:out:' + B.session.scope);
  };

  /* ---------- eventos ---------- */
  var bus = {};
  B.listen = function (ev, fn) { (bus[ev] = bus[ev] || []).push(fn); };
  B.emit = function (ev, data) { (bus[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ---------- carregamento (modo demo carrega o backend local) ---------- */
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = d.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('Falha ao carregar ' + src)); };
      d.head.appendChild(s);
    });
  }
  B.loadScript = loadScript;
  B.demoReady = B.demo
    ? loadScript(B.base + 'assets/js/logic.js').then(function () { return loadScript(B.base + 'assets/js/catalog.js'); }).then(function () { return loadScript(B.base + 'assets/js/demo.js'); })
    : Promise.resolve();
  B.boot = function (fn) {
    var dom = d.readyState === 'loading' ? new Promise(function (r) { d.addEventListener('DOMContentLoaded', r); }) : Promise.resolve();
    Promise.all([dom, B.demoReady]).then(function () {
      if (B.demo && w.BrasaDemo && w.BrasaDemo.onBoot) w.BrasaDemo.onBoot();
      return fn();
    }).catch(function (e) { console.error(e); B.toast(e.message || 'Não foi possível iniciar a página.', 'bad', 6000); });
  };

  /* ---------- API ---------- */
  function handle(res) {
    if (res && res.ok) return res.data;
    var e = new Error((res && res.error) || 'Algo deu errado. Tente de novo.');
    e.code = res && res.code;
    e.data = res && res.data;
    if (e.code === 'AUTH') { B.session.clear(); B.emit('auth:expired', e); }
    throw e;
  }
  B.api = function (action, payload) {
    var body = Object.assign({}, payload || {}, { action: action });
    var tok = B.session.token();
    if (tok && !body.token) body.token = tok;
    if (B.demo) {
      return B.demoReady.then(function () {
        return new Promise(function (res) {
          var delay = /^(track|chat|chatUnread|adminThread)$/.test(action) ? 40 : action === 'adminLPGenerate' ? 2400 + Math.random() * 900 : 140 + Math.random() * 260;
          setTimeout(function () { res(w.BrasaDemo.call(body)); }, delay);
        });
      }).then(handle);
    }
    return fetch(cfg.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow'
    }).then(function (r) {
      if (!r.ok) throw new Error('O servidor não respondeu (' + r.status + '). Tente de novo em instantes.');
      return r.json();
    }, function () {
      throw new Error('Sem conexão com o servidor. Verifique sua internet e tente de novo.');
    }).then(handle);
  };
  // envio sem esperar resposta (rastreamento)
  B.beacon = function (action, payload) {
    var body = Object.assign({}, payload || {}, { action: action });
    if (B.demo) { B.api(action, payload).catch(function () {}); return; }
    try {
      var blob = new Blob([JSON.stringify(body)], { type: 'text/plain;charset=utf-8' });
      if (navigator.sendBeacon && navigator.sendBeacon(cfg.API_URL, blob)) return;
    } catch (e) {}
    fetch(cfg.API_URL, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, keepalive: true }).catch(function () {});
  };

  /* ---------- marca (vem do backend; cache local para abrir instantâneo) ---------- */
  B.brand = Object.assign({ name: cfg.BRAND, tagline: cfg.TAGLINE }, B.store.get('brand') || {});
  B.loadBrand = function () {
    return B.api('bootstrap').then(function (data) {
      B.boot0 = data;
      B.brand = Object.assign({ name: cfg.BRAND, tagline: cfg.TAGLINE }, data.brand || {});
      B.store.set('brand', B.brand);
      B.$$('[data-brand-name]').forEach(function (el) { el.textContent = B.brand.name; });
      return data;
    });
  };
  B.brandMark = function (opts) {
    opts = opts || {};
    return '<span class="brand__sigil">' + B.sigil(B.brand.name || 'brasa', '', 'brand') + '</span>' +
      (opts.noName ? '' : '<span class="brand__name" data-brand-name>' + B.esc(B.brand.name) + '</span>');
  };

  /* ---------- ícones (traço 2px, estilo Lucide) ---------- */
  var IC = {
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.75-1.4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0z"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.29 1.29L3 12l5.8 1.9a2 2 0 0 1 1.29 1.29L12 21l1.9-5.8a2 2 0 0 1 1.29-1.29L21 12l-5.8-1.9a2 2 0 0 1-1.29-1.29z"/><path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    arrowUp: '<path d="m5 12 7-7 7 7M12 19V5"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    next: '<path d="M5 4.5v15l10-7.5z" fill="currentColor" stroke="none"/><path d="M19 5v14"/>',
    prev: '<path d="M19 19.5v-15L9 12z" fill="currentColor" stroke="none"/><path d="M5 19V5"/>',
    back10: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    fwd10: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    thumb: '<path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z"/>',
    note: '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><path d="M21.38 5.62a1 1 0 0 0 0-3 1 1 0 0 0-3 0L13 8l-1 4 4-1z"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    pix: '<path d="M12 2.6 21.4 12 12 21.4 2.6 12z"/><path d="m7.2 9.6 2.4 2.4-2.4 2.4M16.8 9.6 14.4 12l2.4 2.4"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    whatsapp: '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9z"/><path d="M9 10.5c.5 2 2.5 4 4.5 4.5l1.2-1.2 2 1-.5 1.7c-3.5.6-8-3.9-7.4-7.4l1.7-.5 1 2z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    video: '<path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20v3a2 2 0 0 1-2 2 2.5 2.5 0 0 1-2-1 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-2 1 2 2 0 0 1-2-2z"/>',
    click: '<path d="m9 9 5 12 1.8-5.2L21 14z"/><path d="M7.2 2.2 8 5.1M5.1 8l-2.9-.8M14 4.1 12 6M6 12l-1.9 2"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    cap: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    rune: '<path d="M12 2v20M12 7l5-4M12 7 7 3M12 15l5 4M12 15l-5 4"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>'
  };
  B.icon = function (name, cls) {
    return '<svg class="i ' + (cls || '') + '" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[name] || IC.info) + '</svg>';
  };
  B.icons = IC;

  /* ---------- PRNG e paletas ---------- */
  function hash(str) {
    str = String(str || ''); var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  B.hash = hash;
  B.rng = rng;
  var PALETTES = [
    { name: 'Brasa', a: '#e2a72e', b1: '#3f2810', b2: '#0b0805' },
    { name: 'Ferrugem', a: '#ec7a42', b1: '#47190b', b2: '#0c0605' },
    { name: 'Musgo', a: '#cdbb47', b1: '#2a2c10', b2: '#090905' },
    { name: 'Couro', a: '#dcaa68', b1: '#3a291b', b2: '#0a0807' },
    { name: 'Sangue', a: '#e2a72e', b1: '#3e100d', b2: '#0b0505' },
    { name: 'Erva', a: '#b3c45e', b1: '#1e2414', b2: '#080906' }
  ];
  B.PALETTES = PALETTES;
  B.palette = function (seedOrIndex) {
    if (typeof seedOrIndex === 'number' && seedOrIndex >= 0) return PALETTES[seedOrIndex % PALETTES.length];
    return PALETTES[hash(seedOrIndex) % PALETTES.length];
  };
  function palVars(p) { return '--a:' + p.a + ';--b1:' + p.b1 + ';--b2:' + p.b2 + ';'; }
  B.palVars = palVars;

  /* ---------- sigilo rúnico gerado (identidade de cada curso/pessoa) ---------- */
  var MOTIFS = [
    [[50, 24], [33, 37]], [[50, 24], [67, 37]],
    [[50, 38], [33, 50], [50, 62]], [[50, 38], [67, 50], [50, 62]],
    [[50, 60], [33, 73]], [[50, 60], [67, 73]],
    [[36, 30], [50, 16], [64, 30]], [[36, 70], [50, 84], [64, 70]],
    [[50, 30], [62, 42], [50, 54], [38, 42], [50, 30]],
    [[37, 58], [63, 80]], [[63, 58], [37, 80]],
    [[50, 46], [66, 34]], [[50, 46], [34, 34]],
    [[38, 50], [62, 50]]
  ];
  B.sigil = function (seed, cls, mode) {
    var r = rng(hash('sg:' + seed));
    var p = [];
    var fx = function (n) { return Math.round(n * 10) / 10; };
    if (mode !== 'brand') {
      p.push('<circle class="sg-ring" cx="50" cy="50" r="47" fill="none"/>');
      var ticks = 40;
      for (var i = 0; i < ticks; i++) {
        if (r() < 0.5) continue;
        var a = i / ticks * Math.PI * 2, L = r() < 0.18 ? 6 : 3;
        p.push('<line class="sg-tick" x1="' + fx(50 + Math.cos(a) * 47) + '" y1="' + fx(50 + Math.sin(a) * 47) + '" x2="' + fx(50 + Math.cos(a) * (47 - L)) + '" y2="' + fx(50 + Math.sin(a) * (47 - L)) + '"/>');
      }
      var a0 = r() * Math.PI * 2, a1 = a0 + Math.PI * (0.5 + r() * 0.7);
      p.push('<path class="sg-arc" fill="none" d="M' + fx(50 + Math.cos(a0) * 40) + ' ' + fx(50 + Math.sin(a0) * 40) + ' A40 40 0 0 1 ' + fx(50 + Math.cos(a1) * 40) + ' ' + fx(50 + Math.sin(a1) * 40) + '"/>');
    }
    p.push('<line x1="50" y1="14" x2="50" y2="86"/>');
    var pool = MOTIFS.slice(), k = 2 + Math.floor(r() * 3);
    for (var j = 0; j < k && pool.length; j++) {
      var m = pool.splice(Math.floor(r() * pool.length), 1)[0];
      p.push('<polyline fill="none" points="' + m.map(function (pt) { return pt.join(','); }).join(' ') + '"/>');
    }
    p.push('<circle class="sg-dot" cx="50" cy="14" r="2.6" fill="currentColor"/><circle class="sg-dot" cx="50" cy="86" r="2.6" fill="currentColor"/>');
    return '<svg class="sigil ' + (cls || '') + '" viewBox="0 0 100 100" fill="none" aria-hidden="true">' + p.join('') + '</svg>';
  };

  /* ---------- arte do curso (imagem enviada ou pôster gerado) ---------- */
  // opts: {tall:boolean, title:boolean(default true), mark:boolean}
  B.art = function (course, opts) {
    course = course || {}; opts = opts || {};
    var pal = (course.color !== '' && course.color != null && !isNaN(course.color)) ? B.palette(Number(course.color)) : B.palette(course.id || course.title);
    var img = opts.tall ? (course.poster || course.banner) : (course.banner || course.poster);
    var showTitle = opts.title !== false && !(img && course.show_title === false);
    var title = B.esc(course.title || '');
    var h = '<div class="art ' + (opts.tall ? 'art--tall ' : '') + (img ? 'art--img' : '') + '" style="' + palVars(pal) + '">';
    if (img) h += '<img class="art__img" src="' + B.esc(B.safeUrl(img)) + '" alt="" loading="lazy" decoding="async">';
    else h += B.sigil(course.id || course.title, 'art__sigil');
    if (opts.mark !== false && !img) h += '<div class="art__mark">' + B.sigil(B.brand.name, '', 'brand').replace('class="sigil ', 'style="width:1.5em;height:1.5em" class="sigil ') + '<span>' + B.esc(B.brand.name) + '</span></div>';
    if (showTitle) h += '<div class="art__title">' + title + '</div>';
    return h + '</div>';
  };
  // miniatura de episódio
  B.epArt = function (lesson, label, course) {
    lesson = lesson || {};
    var pal = B.palette(course && course.color !== '' && course.color != null && !isNaN(course.color) ? Number(course.color) : (course && (course.id || course.title)) || lesson.id);
    if (lesson.thumb) return '<div class="ep-art" style="' + palVars(pal) + '"><img src="' + B.esc(B.safeUrl(lesson.thumb)) + '" alt="" loading="lazy"></div>';
    var num = String(label || '').replace(/^T\d+:/, '') || 'E';
    return '<div class="ep-art" style="' + palVars(pal) + '">' + B.sigil(lesson.id || lesson.title) + '<div class="ep-art__num">' + B.esc(num) + '</div></div>';
  };
  B.avatar = function (user, size) {
    user = user || {};
    var pal = B.palette(user.avatar_color != null && user.avatar_color !== '' ? Number(user.avatar_color) : (user.id || user.email || user.name));
    var st = palVars(pal) + (size ? '--size:' + size + 'px;' : '');
    if (user.avatar && /^(https?:|data:image)/.test(user.avatar)) return '<span class="avatar" style="' + st + '"><img src="' + B.esc(user.avatar) + '" alt=""></span>';
    return '<span class="avatar" style="' + st + '">' + B.sigil(user.avatar || user.id || user.email || user.name) + '</span>';
  };

  /* ---------- toasts ---------- */
  B.toast = function (msg, type, ms) {
    var root = B.$('.toasts');
    if (!root) { root = B.el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); d.body.appendChild(root); }
    var ic = type === 'ok' ? 'check' : type === 'bad' ? 'alert' : 'info';
    var t = B.el('div', { class: 'toast toast--' + (type || 'info') }, B.icon(ic) + '<div>' + B.esc(msg) + '</div>');
    root.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 260); }, ms || 3200);
    return t;
  };
  B.fail = function (e) { B.toast((e && e.message) || 'Algo deu errado. Tente de novo.', 'bad', 5200); };

  /* ---------- modal ---------- */
  var openModals = [];
  B.modal = function (o) {
    o = o || {};
    var root = B.el('div', { class: 'modal-root' });
    var acts = (o.actions || []).map(function (a, i) {
      return '<button type="button" class="btn ' + (a.kind === 'primary' ? 'btn--primary' : a.kind === 'danger' ? 'btn--danger' : 'btn--ghost') + '" data-act="' + i + '">' + (a.icon ? B.icon(a.icon) : '') + B.esc(a.label) + '</button>';
    }).join('');
    root.innerHTML = '<div class="modal-backdrop"></div>' +
      '<div class="modal ' + (o.size === 'wide' ? 'modal--wide' : o.size === 'xl' ? 'modal--xl' : '') + '" role="dialog" aria-modal="true" aria-label="' + B.esc(o.title || '') + '">' +
      (o.title != null ? '<div class="modal__head"><div class="modal__title">' + B.esc(o.title) + '</div><button type="button" class="iconbtn" data-close aria-label="Fechar">' + B.icon('x') + '</button></div>' : '') +
      '<div class="modal__body"></div>' + (acts ? '<div class="modal__foot">' + acts + '</div>' : '') + '</div>';
    var body = B.$('.modal__body', root);
    if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
    var opener = d.activeElement && d.activeElement !== d.body && d.activeElement !== d.documentElement ? d.activeElement : null;
    d.body.appendChild(root);
    d.documentElement.style.overflow = 'hidden';
    var api = {
      el: root, body: body, closed: false,
      close: function (v) {
        if (api.closed) return; api.closed = true;
        root.remove();
        openModals = openModals.filter(function (m) { return m !== api; });
        if (!openModals.length) d.documentElement.style.overflow = '';
        // o foco volta para quem abriu a janela (se ainda estiver na tela)
        if (opener && opener.isConnected && opener.focus && !root.contains(opener)) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
        if (o.onClose) o.onClose(v);
      },
      busy: function (i, on) { var b = B.$('[data-act="' + i + '"]', root); if (b) b.classList.toggle('is-loading', on !== false); }
    };
    openModals.push(api);
    if (o.dismissible !== false) {
      B.$('.modal-backdrop', root).addEventListener('click', function () { api.close(); });
    }
    B.$$('[data-close]', root).forEach(function (b) { b.addEventListener('click', function () { api.close(); }); });
    (o.actions || []).forEach(function (a, i) {
      B.$('[data-act="' + i + '"]', root).addEventListener('click', function (ev) {
        var r = a.onClick ? a.onClick(api, ev.currentTarget) : undefined;
        if (r && typeof r.then === 'function') {
          api.busy(i, true);
          r.then(function (v) { api.busy(i, false); if (v !== false && a.close !== false) api.close(v); }, function (e) { api.busy(i, false); B.fail(e); });
        } else if (r !== false && a.close !== false) api.close();
      });
    });
    setTimeout(function () {
      var f = B.$('[autofocus]', root) || B.$('.modal__body input, .modal__body textarea, .modal__body select', root);
      if (f && !('ontouchstart' in w)) f.focus();
    }, 60);
    if (o.onOpen) o.onOpen(api);
    return api;
  };
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openModals.length) openModals[openModals.length - 1].close();
  });
  // Tab e Shift+Tab ficam dentro da janela que está por cima
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || e.defaultPrevented || !openModals.length) return;
    var top = openModals[openModals.length - 1].el;
    var items = Array.prototype.filter.call(top.querySelectorAll(FOCUSABLE), function (x) { return x.getClientRects().length > 0; });
    if (!items.length) { e.preventDefault(); return; }
    var a = items[0], z = items[items.length - 1], cur = d.activeElement;
    if (!top.contains(cur)) { e.preventDefault(); (e.shiftKey ? z : a).focus(); }
    else if (e.shiftKey && cur === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && cur === z) { e.preventDefault(); a.focus(); }
  });
  B.confirm = function (o) {
    o = o || {};
    return new Promise(function (res) {
      var done = false;
      B.modal({
        title: o.title || 'Confirmar',
        body: '<p class="t-muted">' + B.esc(o.text || 'Tem certeza?') + '</p>',
        actions: [
          { label: o.cancel || 'Cancelar', onClick: function () { done = true; res(false); } },
          { label: o.ok || 'Confirmar', kind: o.danger ? 'danger' : 'primary', onClick: function () { done = true; res(true); } }
        ],
        onClose: function () { if (!done) res(false); }
      });
    });
  };
  B.prompt = function (o) {
    o = o || {};
    return new Promise(function (res) {
      var done = false;
      var field = o.multiline
        ? '<textarea class="textarea" id="bpr" placeholder="' + B.esc(o.placeholder || '') + '">' + B.esc(o.value || '') + '</textarea>'
        : '<input class="input" id="bpr" value="' + B.esc(o.value || '') + '" placeholder="' + B.esc(o.placeholder || '') + '">';
      B.modal({
        title: o.title || 'Informe',
        body: '<div class="field">' + (o.label ? '<label for="bpr">' + B.esc(o.label) + '</label>' : '') + field + (o.hint ? '<div class="hint">' + B.esc(o.hint) + '</div>' : '') + '</div>',
        actions: [
          { label: 'Cancelar', onClick: function () { done = true; res(null); } },
          { label: o.ok || 'Salvar', kind: 'primary', onClick: function (m) { done = true; res(B.$('#bpr', m.el).value); } }
        ],
        onClose: function () { if (!done) res(null); }
      });
    });
  };

  /* ---------- copiar ---------- */
  B.copy = function (text, btn) {
    function ok() {
      B.toast('Copiado', 'ok', 1500);
      if (btn) { btn.classList.add('is-copied'); setTimeout(function () { btn.classList.remove('is-copied'); }, 1500); }
    }
    function fallback() {
      var ta = B.el('textarea', { readonly: true, style: 'position:fixed;top:0;left:0;opacity:0' });
      ta.value = text; d.body.appendChild(ta); ta.select();
      var good = false; try { good = d.execCommand('copy'); } catch (e) {}
      ta.remove();
      if (good) return ok();
      B.modal({ title: 'Copie o texto', body: '<textarea class="textarea" readonly onclick="this.select()">' + B.esc(text) + '</textarea><p class="hint" style="margin-top:8px">Toque e segure no texto para copiar.</p>', actions: [{ label: 'Fechar' }] });
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok, fallback); return; }
    } catch (e) {}
    fallback();
  };

  /* ---------- modelos de mensagem e WhatsApp ---------- */
  B.tpl = {
    // troca {variavel} pelo valor; variáveis sem valor ficam visíveis para a pessoa notar
    render: function (text, vars) {
      vars = vars || {};
      return String(text == null ? '' : text).replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(vars, k) && vars[k] != null ? String(vars[k]) : m; });
    },
    missing: function (text) { var out = []; String(text || '').replace(/\{(\w+)\}/g, function (m, k) { if (out.indexOf(k) < 0) out.push(k); return m; }); return out; }
  };
  B.wa = {
    number: function (phone) {
      var d = String(phone || '').replace(/\D/g, '');
      if (!d) return '';
      if (d.length <= 11) d = '55' + d.replace(/^0+/, '');
      return d;
    },
    link: function (phone, text) {
      var d = B.wa.number(phone);
      return 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '');
    }
  };
  // modal para escolher um modelo, revisar o texto e abrir no WhatsApp
  // o: { name, phone, templates:[{key,title,body}], vars, initial (key), onSent({template,title,text}), title }
  B.waComposer = function (o) {
    o = o || {};
    var tpls = o.templates || [], cur = null;
    var first = tpls.filter(function (t) { return t.key === o.initial; })[0] || tpls[0] || null;
    var body = B.el('div', { class: 'wac' });
    body.innerHTML =
      (tpls.length ? '<div class="wac__tpls" role="listbox" aria-label="Modelos de mensagem">' + tpls.map(function (t) { return '<button type="button" class="wac__tpl" role="option" data-k="' + B.esc(t.key) + '">' + B.esc(t.title) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="field"><label for="wacPhone">WhatsApp</label><input class="input" id="wacPhone" type="tel" inputmode="tel" value="' + B.esc(B.fmt.phone(o.phone || '')) + '" placeholder="(00) 00000-0000"></div>' +
      '<div class="field"><label for="wacText">Mensagem</label><textarea class="textarea wac__text" id="wacText" rows="8"></textarea><div class="wac__warn" hidden></div></div>' +
      '<div class="wac__foot"><button type="button" class="btn btn--ghost" data-wcopy>' + B.icon('copy') + 'Copiar texto</button>' +
      '<a class="btn btn--primary" data-wgo href="#" target="_blank" rel="noopener">' + B.icon('whatsapp') + 'Abrir no WhatsApp</a></div>' +
      '<p class="hint">O WhatsApp abre com o texto pronto. Você confere e envia.</p>';
    var m = B.modal({ title: o.title || ('WhatsApp para ' + (o.name ? String(o.name).split(' ')[0] : 'contato')), body: body });
    var text = B.$('#wacText', body), phone = B.$('#wacPhone', body), go = B.$('[data-wgo]', body), warn = B.$('.wac__warn', body);
    function sync() {
      var miss = B.tpl.missing(text.value), num = B.wa.number(phone.value);
      warn.hidden = !miss.length;
      if (miss.length) warn.textContent = 'Sem valor para: ' + miss.map(function (k) { return '{' + k + '}'; }).join(', ') + '. Edite antes de enviar.';
      go.href = num ? B.wa.link(num, text.value) : '#';
      go.classList.toggle('is-disabled', !num || !text.value.trim());
    }
    function pick(t) {
      cur = t;
      B.$$('.wac__tpl', body).forEach(function (b) { var on = t && b.dataset.k === t.key; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
      text.value = t ? B.tpl.render(t.body, o.vars) : (o.text || '');
      sync();
    }
    B.$$('.wac__tpl', body).forEach(function (b) { b.addEventListener('click', function () { pick(tpls.filter(function (t) { return t.key === b.dataset.k; })[0]); }); });
    text.addEventListener('input', sync); phone.addEventListener('input', sync);
    B.$('[data-wcopy]', body).addEventListener('click', function (e) { B.copy(text.value, e.currentTarget); });
    go.addEventListener('click', function (e) {
      if (go.classList.contains('is-disabled')) { e.preventDefault(); B.toast(B.wa.number(phone.value) ? 'Escreva a mensagem.' : 'Informe o WhatsApp com DDD.', 'bad'); return; }
      if (o.onSent) { try { o.onSent({ template: cur ? cur.key : '', title: cur ? cur.title : 'Mensagem livre', text: text.value, phone: B.wa.number(phone.value) }); } catch (x) {} }
      setTimeout(function () { m.close(); }, 300);
    });
    pick(first);
    return m;
  };

  /* ---------- formulários ---------- */
  B.formData = function (form) {
    var o = {};
    B.$$('input, select, textarea', form).forEach(function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else if (el.type === 'number' || el.dataset.num != null) o[el.name] = el.value === '' ? '' : Number(String(el.value).replace(',', '.'));
      else if (el.type === 'date') o[el.name] = el.value ? B.dateFromInput(el.value, el.dataset.end != null) : 0;
      else o[el.name] = el.value;
    });
    return o;
  };
  B.fill = function (form, obj) {
    B.$$('input, select, textarea', form).forEach(function (el) {
      if (!el.name || !(el.name in obj)) return;
      var v = obj[el.name];
      if (el.type === 'checkbox') el.checked = v === true || v === 'TRUE' || v === 'true';
      else if (el.type === 'radio') el.checked = String(el.value) === String(v);
      else if (el.type === 'date') el.value = B.dateInput(v);
      else el.value = v == null ? '' : v;
    });
  };
  B.debounce = function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms || 250); }; };
  B.qs = function (k) { return new URLSearchParams(location.search).get(k); };
  B.validEmail = function (e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()); };

  /* ---------- imagens: escolher, reduzir e enviar ---------- */
  B.readImage = function (file, maxW, quality) {
    maxW = maxW || 1600; quality = quality || 0.85;
    return new Promise(function (res, rej) {
      if (!file || !/^image\//.test(file.type)) return rej(new Error('Escolha um arquivo de imagem (JPG, PNG ou WEBP).'));
      var fr = new FileReader();
      fr.onerror = function () { rej(new Error('Não foi possível ler a imagem.')); };
      fr.onload = function () {
        var img = new Image();
        img.onload = function () {
          var s = Math.min(1, maxW / img.width), cw = Math.round(img.width * s), ch = Math.round(img.height * s);
          var c = d.createElement('canvas'); c.width = cw; c.height = ch;
          c.getContext('2d').drawImage(img, 0, 0, cw, ch);
          var keepPng = file.type === 'image/png' && /logo|title/i.test(file.name);
          var mime = keepPng ? 'image/png' : 'image/jpeg';
          var url = c.toDataURL(mime, quality);
          res({ dataUrl: url, base64: url.split(',')[1], mime: mime, name: file.name.replace(/\.\w+$/, '') + (keepPng ? '.png' : '.jpg'), width: cw, height: ch });
        };
        img.onerror = function () { rej(new Error('Imagem inválida.')); };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  };
  // abre o seletor de arquivo e devolve a URL publicada
  B.uploadImage = function (opts) {
    opts = opts || {};
    return new Promise(function (res, rej) {
      var inp = B.el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
      d.body.appendChild(inp);
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0]; inp.remove();
        if (!f) return res(null);
        B.readImage(f, opts.maxW || (B.demo ? 1000 : 1800), opts.quality || (B.demo ? 0.78 : 0.86))
          .then(function (img) { return B.api('adminUpload', { name: img.name, mime: img.mime, data: img.base64 }); })
          .then(function (r) { res(r.url); }, rej);
      });
      inp.click();
    });
  };

  /* ---------- roteador por hash (#/rota/:param) ---------- */
  B.router = (function () {
    var routes = [], scrolls = {}, current = null, notFound = null;
    function parse(hash) {
      var h = String(hash || '').replace(/^#/, '');
      if (!h || h[0] !== '/') h = '/' + h.replace(/^\/?/, '');
      var qi = h.indexOf('?');
      return { path: qi > -1 ? h.slice(0, qi) : h, query: new URLSearchParams(qi > -1 ? h.slice(qi + 1) : '') };
    }
    function run(hash, isPop) {
      var p = parse(hash);
      if (current) scrolls[current] = w.scrollY;
      for (var i = 0; i < routes.length; i++) {
        var m = routes[i].re.exec(p.path);
        if (m) {
          var params = {};
          routes[i].keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); });
          current = p.path;
          routes[i].fn(params, p.query);
          B.emit('route', { path: p.path, params: params });
          if (isPop && scrolls[p.path] != null) { var y = scrolls[p.path]; setTimeout(function () { w.scrollTo(0, y); }, 30); }
          else w.scrollTo(0, 0);
          return;
        }
      }
      if (notFound) notFound(p.path);
    }
    return {
      on: function (pattern, fn) {
        var keys = [];
        var re = new RegExp('^' + pattern.replace(/\/:([\w]+)/g, function (_, k) { keys.push(k); return '/([^/]+)'; }) + '/?$');
        routes.push({ re: re, keys: keys, fn: fn });
        return this;
      },
      otherwise: function (fn) { notFound = fn; return this; },
      go: function (path, opts) {
        opts = opts || {};
        try { history[opts.replace ? 'replaceState' : 'pushState'](null, '', '#' + path); } catch (e) {}
        run('#' + path, false);
      },
      start: function (def) {
        w.addEventListener('popstate', function () { run(location.hash || '#' + def, true); });
        run(location.hash && location.hash.length > 1 ? location.hash : '#' + def, false);
      },
      reload: function () { run(location.hash || '#/', true); },
      get path() { return current; }
    };
  })();

  /* ---------- atribuição: UTM, afiliado, sessão ---------- */
  B.attr = {
    capture: function () {
      var q = new URLSearchParams(location.search), utm = {};
      ['source', 'medium', 'campaign', 'content', 'term'].forEach(function (k) { var v = q.get('utm_' + k); if (v) utm[k] = v.slice(0, 120); });
      if (Object.keys(utm).length) B.store.set('utm', { v: utm, t: Date.now() });
      return { utm: utm, ref: (q.get('ref') || q.get('aff') || '').trim().toUpperCase() };
    },
    utm: function () { var s = B.store.get('utm'); return s && Date.now() - s.t < 30 * 864e5 ? s.v : {}; },
    setRef: function (code, days) { if (code) B.store.set('ref', { code: String(code).toUpperCase(), exp: Date.now() + (Number(days) || 60) * 864e5 }); },
    ref: function () { var r = B.store.get('ref'); return r && r.exp > Date.now() ? r.code : ''; },
    sid: function () { var s = B.sstore.get('sid'); if (!s) { s = Math.random().toString(36).slice(2, 12); B.sstore.set('sid', s); } return s; }
  };

  /* ---------- Pixel da Meta (no modo demo, só registra na tela) ---------- */
  B.pixel = {
    ids: [],
    init: function (ids) {
      var fresh = (ids || []).filter(function (x) { return x && B.pixel.ids.indexOf(String(x)) < 0; }).map(String);
      if (!fresh.length) return;
      B.pixel.ids = B.pixel.ids.concat(fresh);
      if (B.demo) { fresh.forEach(function (id) { B.pixel._log('init', { id: id }); }); return; }
      if (!w.fbq) {
        /* eslint-disable */
        !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(w, d, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
      }
      fresh.forEach(function (id) { w.fbq('init', id); });
    },
    track: function (ev, params, eventId) {
      if (!B.pixel.ids.length) return;
      if (B.demo) { B.pixel._log(ev, params); return; }
      try { w.fbq('track', ev, params || {}, eventId ? { eventID: eventId } : undefined); } catch (e) {}
    },
    cookies: function () {
      var c = {}; (d.cookie || '').split(';').forEach(function (p) { var kv = p.trim().split('='); c[kv[0]] = kv.slice(1).join('='); });
      var fbc = c._fbc || '';
      var clid = B.qs('fbclid');
      if (!fbc && clid) fbc = 'fb.1.' + Date.now() + '.' + clid;
      return { fbp: c._fbp || '', fbc: fbc };
    },
    _log: function (ev, params) {
      var root = B.$('.pixlog');
      if (!root) { root = B.el('div', { class: 'pixlog', 'aria-hidden': 'true' }); d.body.appendChild(root); }
      var label = ev === 'init' ? 'Pixel <b>' + B.esc(params.id) + '</b> carregado' : 'Pixel · <b>' + B.esc(ev) + '</b>' + (params && params.value ? ' · ' + B.esc(B.fmt.money(params.value)) : '');
      var it = B.el('div', { class: 'pixlog__item' }, label);
      root.appendChild(it);
      setTimeout(function () { it.remove(); }, 2700);
    }
  };

  /* ---------- player de vídeo (YouTube, Vimeo, Panda, Drive, MP4, demo) ---------- */
  B.player = (function () {
    var ytReady = null;
    function loadYT() {
      if (ytReady) return ytReady;
      ytReady = new Promise(function (res) {
        if (w.YT && w.YT.Player) return res();
        var prev = w.onYouTubeIframeAPIReady;
        w.onYouTubeIframeAPIReady = function () { if (prev) prev(); res(); };
        loadScript('https://www.youtube.com/iframe_api').catch(function () {});
      });
      return ytReady;
    }
    function parse(url) {
      url = String(url || '').trim();
      var m;
      if (!url) return { type: 'none' };
      if (/^demo:/.test(url)) return { type: 'demo' };
      if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/))) return { type: 'youtube', id: m[1] };
      if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/))) {
        var hq = (url.match(/[?&]h=(\w+)/) || [])[1] || m[2] || '';
        return { type: 'vimeo', id: m[1], src: 'https://player.vimeo.com/video/' + m[1] + '?' + (hq ? 'h=' + hq + '&' : '') + 'title=0&byline=0&portrait=0&dnt=1&api=1' };
      }
      if ((m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/))) return { type: 'iframe', src: 'https://drive.google.com/file/d/' + m[1] + '/preview' };
      if (/\.(mp4|webm|m3u8|mov)(\?|$)/i.test(url)) return { type: 'video', src: url };
      if (/^https:\/\//.test(url)) return { type: 'iframe', src: url };
      return { type: 'none' };
    }
    // monta o player em `el`. o: {onEnded, onTime(sec,dur), start, art(html), durationMin, label}
    function mount(el, url, o) {
      o = o || {};
      var info = parse(url), timer = null, dead = false, handle = { type: info.type, destroy: destroy };
      el.classList.add('player');
      function destroy() { dead = true; clearInterval(timer); w.removeEventListener('message', onMsg); el.innerHTML = ''; }
      var onMsg = function () {};
      if (info.type === 'none') {
        el.innerHTML = '<div class="simplayer" style="cursor:default">' + (o.art || '') + '<div class="simplayer__veil"></div><div class="empty" style="position:relative;z-index:2">' + B.icon('video') + '<div>Vídeo ainda não disponível.</div></div></div>';
      } else if (info.type === 'youtube') {
        var holder = B.el('div'); el.innerHTML = ''; el.appendChild(holder);
        loadYT().then(function () {
          if (dead) return;
          var yt = new w.YT.Player(holder, {
            videoId: info.id, host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%',
            playerVars: { rel: 0, modestbranding: 1, playsinline: 1, start: Math.floor(o.start || 0), iv_load_policy: 3 },
            events: {
              onStateChange: function (e) { if (e.data === 0 && o.onEnded) o.onEnded(); }
            }
          });
          handle.yt = yt;
          timer = setInterval(function () { try { if (o.onTime && yt.getCurrentTime) o.onTime(yt.getCurrentTime(), yt.getDuration()); } catch (e) {} }, 5000);
        });
      } else if (info.type === 'vimeo') {
        el.innerHTML = '<iframe src="' + B.esc(info.src) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Vídeo da aula"></iframe>';
        var fr = el.querySelector('iframe');
        onMsg = function (ev) {
          if (!/vimeo\.com$/.test(new URL(ev.origin).hostname)) return;
          var data = ev.data; try { if (typeof data === 'string') data = JSON.parse(data); } catch (e) { return; }
          if (!data) return;
          if (data.event === 'ready') {
            ['ended', 'timeupdate'].forEach(function (evn) { fr.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: evn }), '*'); });
            if (o.start) fr.contentWindow.postMessage(JSON.stringify({ method: 'setCurrentTime', value: o.start }), '*');
          }
          if (data.event === 'ended' && o.onEnded) o.onEnded();
          if (data.event === 'timeupdate' && o.onTime && data.data && Math.floor(data.data.seconds) % 5 === 0) o.onTime(data.data.seconds, data.data.duration);
        };
        w.addEventListener('message', onMsg);
      } else if (info.type === 'video') {
        el.innerHTML = '<video controls playsinline preload="metadata" src="' + B.esc(info.src) + '"></video>';
        var v = el.querySelector('video');
        if (o.start) v.addEventListener('loadedmetadata', function () { v.currentTime = o.start; }, { once: true });
        v.addEventListener('ended', function () { if (o.onEnded) o.onEnded(); });
        var last = 0;
        v.addEventListener('timeupdate', function () { if (o.onTime && Math.abs(v.currentTime - last) > 5) { last = v.currentTime; o.onTime(v.currentTime, v.duration); } });
      } else if (info.type === 'iframe') {
        el.innerHTML = '<iframe src="' + B.esc(info.src) + '" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen title="Vídeo da aula"></iframe>';
      } else if (info.type === 'demo') {
        simulated(el, o, handle);
      }
      return handle;
    }
    // player simulado (modo demonstração): 14 s representam a aula inteira
    function simulated(el, o, handle) {
      var total = Math.max(60, (Number(o.durationMin) || 10) * 60), pos = Math.min(o.start || 0, total - 1), playing = false, raf = 0, lastT = 0;
      var speed = total / 14;
      el.innerHTML = '<div class="simplayer">' + (o.art || '') + '<div class="simplayer__veil"></div>' +
        '<span class="chip chip--mustard simplayer__note">Vídeo simulado na demonstração</span>' +
        '<button class="simplayer__play" type="button" aria-label="Reproduzir">' + B.icon('play') + '</button>' +
        '<div class="simplayer__hud"><div class="bar"><div class="bar__fill"></div></div><div class="simplayer__row">' +
        '<button type="button" data-sp="toggle" aria-label="Reproduzir ou pausar">' + B.icon('play') + '</button>' +
        '<button type="button" data-sp="back" aria-label="Voltar 10 segundos">' + B.icon('back10') + '</button>' +
        '<button type="button" data-sp="fwd" aria-label="Avançar">' + B.icon('fwd10') + '</button>' +
        '<span class="t-num" data-sp="time">0:00 / 0:00</span><span class="grow"></span>' +
        '<button type="button" data-sp="end" aria-label="Ir para o final" title="Ir para o final">' + B.icon('next') + '</button>' +
        '</div></div></div>';
      var box = el.querySelector('.simplayer'), fill = el.querySelector('.bar__fill'), time = el.querySelector('[data-sp="time"]'),
        big = el.querySelector('.simplayer__play'), tog = el.querySelector('[data-sp="toggle"]');
      function paint() {
        fill.style.setProperty('--p', (pos / total * 100) + '%');
        time.textContent = B.fmt.clock(pos) + ' / ' + B.fmt.clock(total);
        tog.innerHTML = B.icon(playing ? 'pause' : 'play');
        big.hidden = playing;
      }
      function tick(t) {
        if (!playing) return;
        if (lastT) pos += (t - lastT) / 1000 * speed;
        lastT = t;
        if (pos >= total) { pos = total; playing = false; paint(); if (o.onEnded) o.onEnded(); return; }
        if (o.onTime && Math.floor(pos / 30) !== Math.floor((pos - speed / 60) / 30)) o.onTime(pos, total);
        paint(); raf = requestAnimationFrame(tick);
      }
      function play() { if (pos >= total) pos = 0; playing = true; lastT = 0; raf = requestAnimationFrame(tick); paint(); }
      function pause() { playing = false; cancelAnimationFrame(raf); paint(); if (o.onTime) o.onTime(pos, total); }
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-sp]');
        var act = b ? b.dataset.sp : 'toggle';
        if (act === 'time') return;
        if (act === 'toggle') { playing ? pause() : play(); }
        if (act === 'back') { pos = Math.max(0, pos - total * 0.1); paint(); }
        if (act === 'fwd') { pos = Math.min(total - 1, pos + total * 0.1); paint(); }
        if (act === 'end') { pos = Math.max(0, total - speed * 1.2); if (!playing) play(); else paint(); }
      });
      handle.destroy = function () { playing = false; cancelAnimationFrame(raf); el.innerHTML = ''; };
      paint();
    }
    return { parse: parse, mount: mount };
  })();

  /* ---------- brasas flutuando (canvas leve, para em segundo plano) ---------- */
  B.embers = function (container, opts) {
    opts = opts || {};
    if (w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) return { stop: function () {} };
    var c = B.el('canvas', { class: 'embers', 'aria-hidden': 'true' });
    container.appendChild(c);
    var ctx = c.getContext('2d'), parts = [], N = opts.count || 38, raf = 0, visible = true, W = 0, H = 0, dpr = Math.min(2, w.devicePixelRatio || 1);
    function size() { W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(p, init) {
      p.x = Math.random() * W; p.y = init ? Math.random() * H : H + 10;
      p.r = .6 + Math.random() * 1.9; p.vy = .25 + Math.random() * .8; p.vx = (Math.random() - .5) * .3;
      p.life = 0; p.max = 220 + Math.random() * 380; p.hue = 32 + Math.random() * 16; p.w = Math.random() * 6.28;
      return p;
    }
    size();
    for (var i = 0; i < N; i++) parts.push(spawn({}, true));
    function frame() {
      if (!visible) { raf = 0; return; }
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.life++; p.w += .03; p.x += p.vx + Math.sin(p.w) * .25; p.y -= p.vy;
        if (p.y < -10 || p.life > p.max) spawn(p, false);
        var a = Math.max(0, Math.min(1, p.life / 40)) * Math.max(0, 1 - p.life / p.max) * (.55 + Math.random() * .45);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, 'hsla(' + p.hue + ',95%,62%,' + a + ')');
        g.addColorStop(1, 'hsla(' + p.hue + ',95%,50%,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    var io = 'IntersectionObserver' in w ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }) : null;
    if (io) io.observe(c);
    w.addEventListener('resize', size);
    raf = requestAnimationFrame(frame);
    return { stop: function () { visible = false; cancelAnimationFrame(raf); if (io) io.disconnect(); w.removeEventListener('resize', size); c.remove(); } };
  };

  /* ---------- abertura (1x por sessão) ---------- */
  /* ---------- revelação no scroll ----------
     Marca seções com .rv e acende .is-in quando entram na tela. Observa a
     página inteira, então telas novas (rotas, LP) entram sem código extra. */
  B.reveal = (function () {
    var SEL = '.lp-sec, .lp-stats, .lp-final, .rail, .cblock';
    if (!('IntersectionObserver' in w) || !('MutationObserver' in w)) return function () {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    function scan(root) {
      (root.matches && root.matches(SEL) ? [root] : []).concat(B.$$(SEL, root)).forEach(function (el) {
        if (el.__rv) return; el.__rv = 1;
        // o que já está na tela não pisca: entra direto
        var r = el.getBoundingClientRect();
        if (r.top < w.innerHeight * 0.92 && r.bottom > 0 && d.readyState === 'complete' && performance.now() > 2500) return;
        el.classList.add('rv'); io.observe(el);
      });
    }
    // rolagem rápida ou link âncora pode pular uma seção sem o observador ver: revela tudo que já passou da dobra
    var last = 0;
    function sweep() {
      var t = Date.now(); if (t - last < 120) return; last = t;
      B.$$('.rv:not(.is-in)').forEach(function (el) { if (el.getBoundingClientRect().top < w.innerHeight * 0.95) { el.classList.add('is-in'); io.unobserve(el); } });
    }
    w.addEventListener('scroll', sweep, { passive: true });
    w.addEventListener('hashchange', function () { last = 0; setTimeout(sweep, 50); });
    w.addEventListener('load', function () { last = 0; setTimeout(sweep, 120); });
    function start() {
      scan(d.body);
      new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) scan(n); }); }); })
        .observe(d.body, { childList: true, subtree: true });
    }
    if (d.body) start(); else d.addEventListener('DOMContentLoaded', start);
    return scan;
  })();

  B.splash = function () {
    try { if (sessionStorage.getItem('brasa:splash')) return; sessionStorage.setItem('brasa:splash', '1'); } catch (e) { return; }
    if (w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var s = B.el('div', { class: 'splash', 'aria-hidden': 'true' }, '<div class="splash__inner">' + B.sigil(B.brand.name, '', 'brand') + '<div class="splash__name">' + B.esc(B.brand.name) + '</div></div>');
    d.body.appendChild(s);
    s.addEventListener('click', function () { s.remove(); });
    setTimeout(function () { s.remove(); }, 2200);
  };

  /* ---------- celebração (XP, nível, runas, curso concluído) ---------- */
  var celebQ = [], celebOn = false;
  function nextCeleb() {
    if (!celebQ.length) { celebOn = false; return; }
    celebOn = true;
    var c = celebQ.shift();
    var el = B.el('div', { class: 'celebrate', role: 'dialog', 'aria-label': c.title },
      '<div class="celebrate__card">' +
      (c.rune ? '<div class="celebrate__rune">' + B.esc(c.rune) + '</div>' : '') +
      (c.sub ? '<div class="celebrate__sub">' + B.esc(c.sub) + '</div>' : '') +
      '<div class="celebrate__title">' + B.esc(c.title) + '</div>' +
      (c.text ? '<p class="t-muted">' + B.esc(c.text) + '</p>' : '') +
      (c.cta ? '<a class="btn btn--primary" href="' + B.esc(c.cta.href) + '" target="' + (c.cta.blank ? '_blank' : '_self') + '">' + B.esc(c.cta.label) + '</a>' : '') +
      '<p class="t-faint t-xs">Toque para continuar</p></div>');
    d.body.appendChild(el);
    var gone = false;
    function close() { if (gone) return; gone = true; el.remove(); setTimeout(nextCeleb, 120); }
    el.addEventListener('click', function (e) { if (!e.target.closest('a')) close(); });
    setTimeout(close, c.ms || 4200);
  }
  B.celebrate = function (r) {
    if (!r) return;
    if (r.xp_gained) B.toast('+' + r.xp_gained + ' XP', 'ok', 1800);
    if (r.level_up) celebQ.push({ rune: 'ᛏ', sub: 'subiu de nível', title: 'Nível ' + r.level, text: 'Agora você é ' + r.rank + '.' });
    (r.badges_new || []).forEach(function (b) { celebQ.push({ rune: b.rune, sub: 'runa conquistada', title: b.name, text: b.desc }); });
    if (r.course_done) celebQ.push({ rune: 'ᛊ', sub: 'jornada completa', title: 'Curso concluído', text: 'Seu certificado está pronto.', cta: r.certificate_code ? { label: 'Ver certificado', href: B.base + 'certificado.html?c=' + encodeURIComponent(r.certificate_code), blank: true } : null, ms: 7000 });
    if (!celebOn) nextCeleb();
  };

  /* ---------- gráficos (área de 1 série e barras horizontais) ---------- */
  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * p;
  }
  B.chart = {
    // pts: [{label:'19 out', value: 123}] · o: {format, height}
    area: function (el, pts, o) {
      o = o || {}; el.classList.add('chart');
      var fmt = o.format || B.fmt.int;
      if (!pts || !pts.length || !pts.some(function (p) { return p.value; })) { el.innerHTML = '<div class="chart__empty">Sem dados no período.</div>'; return; }
      function draw() {
        var W = Math.max(280, el.clientWidth || 600), H = o.height || 220, L = 52, R = 14, T = 14, Bm = 28;
        var max = niceMax(Math.max.apply(null, pts.map(function (p) { return p.value; })));
        var x = function (i) { return L + (pts.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (pts.length - 1)); };
        var y = function (v) { return T + (H - T - Bm) * (1 - v / max); };
        var gid = 'g' + Math.random().toString(36).slice(2, 8);
        var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + B.esc(o.label || 'Gráfico') + '">';
        s += '<defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#b98420" stop-opacity=".32"/><stop offset="1" stop-color="#b98420" stop-opacity="0"/></linearGradient></defs>';
        for (var k = 0; k <= 4; k++) {
          var gv = max * k / 4, gy = y(gv);
          s += '<line class="c-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '"/>';
          s += '<text class="c-axis" x="' + (L - 8) + '" y="' + (gy + 4) + '" text-anchor="end">' + B.esc(o.axisFormat ? o.axisFormat(gv) : (max < 10 ? B.fmt.num(gv) : gv >= 10000 ? B.fmt.num(gv / 1000) + ' mil' : B.fmt.int(gv))) + '</text>';
        }
        var idx = [0, Math.floor((pts.length - 1) / 2), pts.length - 1].filter(function (v, i, a) { return a.indexOf(v) === i; });
        idx.forEach(function (i) { s += '<text class="c-axis" x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="' + (i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle') + '">' + B.esc(pts[i].label) + '</text>'; });
        var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.value).toFixed(1); }).join(' ');
        s += '<path class="c-area" fill="url(#' + gid + ')" d="' + line + ' L' + x(pts.length - 1).toFixed(1) + ' ' + y(0) + ' L' + x(0).toFixed(1) + ' ' + y(0) + ' Z"/>';
        s += '<path class="c-line" d="' + line + '"/>';
        var li = pts.length - 1;
        s += '<circle class="c-end" cx="' + x(li) + '" cy="' + y(pts[li].value) + '" r="4.5"/>';
        s += '<line class="c-cross" x1="0" x2="0" y1="' + T + '" y2="' + (H - Bm) + '" visibility="hidden"/><circle class="c-end c-hover" r="5" visibility="hidden"/>';
        s += '<rect class="c-hit" x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '"/></svg><div class="chart__tip" hidden></div>';
        el.innerHTML = s;
        var svg = el.querySelector('svg'), tip = el.querySelector('.chart__tip'), cross = el.querySelector('.c-cross'), dot = el.querySelector('.c-hover');
        function at(ev) {
          var r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left) * W / r.width;
          var i = Math.max(0, Math.min(pts.length - 1, Math.round((sx - L) / ((W - L - R) / Math.max(1, pts.length - 1)))));
          var px = x(i), py = y(pts[i].value);
          cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
          dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.setAttribute('visibility', 'visible');
          tip.hidden = false; tip.innerHTML = B.esc(pts[i].label) + '<b>' + B.esc(fmt(pts[i].value)) + '</b>';
          tip.style.left = (px * r.width / W) + 'px'; tip.style.top = (py * r.height / H) + 'px';
        }
        svg.addEventListener('pointermove', at);
        svg.addEventListener('pointerdown', at);
        svg.addEventListener('pointerleave', function () { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); });
      }
      draw();
      if ('ResizeObserver' in w) { var lw = el.clientWidth; new ResizeObserver(function () { if (Math.abs(el.clientWidth - lw) > 20) { lw = el.clientWidth; draw(); } }).observe(el); }
    },
    // items: [{label, value}] · barras horizontais com rótulo direto
    bars: function (el, items, o) {
      o = o || {}; el.classList.add('chart');
      var fmt = o.format || B.fmt.int;
      items = (items || []).filter(function (i) { return i.value > 0; }).slice(0, o.limit || 8);
      if (!items.length) { el.innerHTML = '<div class="chart__empty">Sem dados no período.</div>'; return; }
      var max = Math.max.apply(null, items.map(function (i) { return i.value; }));
      var h = '<div class="stack" style="--gap:12px">';
      items.forEach(function (it, i) {
        var pct = Math.max(2, it.value / max * 100);
        h += '<div class="stack" style="--gap:5px" title="' + B.esc(it.label + ': ' + fmt(it.value)) + '"><div class="row row--between row--nowrap" style="--gap:10px"><span class="t-sm ellipsis t-muted">' + B.esc(it.label) + '</span><span class="t-hud t-num" style="font-size:.78rem;color:var(--bone)">' + B.esc(fmt(it.value)) + '</span></div>' +
          '<svg viewBox="0 0 100 8" preserveAspectRatio="none" style="width:100%;height:8px"><rect x="0" y="0" width="100" height="8" rx="4" fill="rgba(240,230,210,.06)"/><rect class="c-bar' + (i === 0 ? ' is-hot' : '') + '" x="0" y="0" width="' + pct.toFixed(2) + '" height="8" rx="4"/></svg></div>';
      });
      el.innerHTML = h + '</div>';
    }
  };

  /* ---------- barra da demonstração ---------- */
  B.demoBar = function (active) {
    if (!B.demo) return;
    var firstSlug = w.BrasaDemo && w.BrasaDemo.firstSlug ? w.BrasaDemo.firstSlug() : '';
    var items = [
      ['app', 'index.html', 'Aluno', 'Aluno', 'play'],
      ['admin', 'admin.html', 'ADM', 'ADM', 'grid'],
      ['aff', 'afiliado.html', 'Afiliado', 'Afiliado', 'users'],
      ['crm', 'crm/?demo=1', 'BRASA CRM', 'CRM', 'target'],
      ['lp', 'lp.html?c=' + encodeURIComponent(firstSlug), 'Página de vendas', 'LP', 'globe'],
      ['ck', 'checkout.html?c=' + encodeURIComponent(firstSlug), 'Checkout', 'Pagar', 'cart']
    ];
    d.body.classList.add('is-demo');
    var bar = B.el('nav', { class: 'demobar', 'aria-label': 'Navegação da demonstração' },
      '<span class="demobar__label">demo</span>' +
      items.map(function (it) { return '<a href="' + B.base + it[1] + '" class="' + (it[0] === active ? 'is-active' : '') + '">' + B.icon(it[4]) + '<span class="hide-sm">' + it[2] + '</span><span class="show-sm">' + it[3] + '</span></a>'; }).join('') +
      '<button type="button" data-demo-reset title="Restaurar dados de exemplo">' + B.icon('refresh') + '<span class="hide-sm">Restaurar</span></button>');
    d.body.appendChild(bar);
    bar.querySelector('[data-demo-reset]').addEventListener('click', function () {
      B.confirm({ title: 'Restaurar demonstração', text: 'Apaga tudo o que você criou ou alterou na demo e volta aos dados de exemplo.', ok: 'Restaurar' }).then(function (ok) {
        if (!ok) return;
        w.BrasaDemo.reset();
        // a demo do BRASA CRM e a fila entre as duas recomeçam juntas
        ['brasa_crm_demo_v1', 'brasa_crm_ponte', 'brasa_ponte_ofertas'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
        ['app', 'admin', 'aff', 'sales'].forEach(function (s) { B.store.del('sess:' + s); B.store.del('demo:out:' + s); });
        location.reload();
      });
    });
  };

})(window, document);

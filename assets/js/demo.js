/* =====================================================================
   BRASA · demo.js — backend local para o modo demonstração
   Implementa o mesmo `env` que o Apps Script implementa, só que no
   navegador: banco no localStorage, Mercado Pago e IA simulados.
   Só é carregado quando não há API_URL configurada (ou com ?demo=1).
   ===================================================================== */
(function (w) {
  'use strict';
  var KEY = 'brasa:demo:db:v9';
  // ponte com a demo do BRASA CRM (mesma origem): eventos para lá, condições especiais para cá
  var PONTE_CRM = 'brasa_crm_ponte', PONTE_OFERTAS = 'brasa_ponte_ofertas', PONTE_CHAVE = 'demo-ponte-brasa-crm-2026-0000000000000000';
  var seeding = false;
  var DAY = 864e5;

  /* ---------- SHA-256 síncrono (UTF-8) ---------- */
  function sha256(ascii) {
    ascii = unescape(encodeURIComponent(String(ascii)));
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, max = mp(2, 32), result = '', words = [], bitLen = ascii.length * 8, i, j;
    var hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [], pl = k.length, isC = {};
    for (var cand = 2; pl < 64; cand++) {
      if (!isC[cand]) {
        for (i = 0; i < 313; i += cand) isC[i] = cand;
        hash[pl] = (mp(cand, .5) * max) | 0; k[pl++] = (mp(cand, 1 / 3) * max) | 0;
      }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = ((bitLen / max) | 0); words[words.length] = (bitLen);
    hash = hash.slice(0, 8);
    for (j = 0; j < words.length;) {
      var wd = words.slice(j, j += 16), old = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = wd[i - 15], w2 = wd[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (wd[i] = (i < 16) ? wd[i] : (wd[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + wd[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += ((b < 16) ? 0 : '') + b.toString(16); }
    return result;
  }
  function b64enc(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64dec(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function uuid() {
    if (w.crypto && w.crypto.randomUUID) return w.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }

  /* ---------- banco local ---------- */
  var db = null, dirty = false;
  function drainOffers() {
    var q = []; try { q = JSON.parse(localStorage.getItem(PONTE_OFERTAS) || '[]'); } catch (e) {}
    if (!q.length || !w.BrasaLogic) return;
    try { localStorage.removeItem(PONTE_OFERTAS); } catch (e) {}
    var app = w.BrasaLogic(env);
    q.forEach(function (o) { try { app.handle(Object.assign({}, o, { action: 'bridgeOffer', key: PONTE_CHAVE })); } catch (e) { if (w.console) console.warn('ponte', e); } });
    save();
  }
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { db = JSON.parse(raw); drainOffers(); return; } } catch (e) {}
    if (!db) {
      seeding = true; db = seed(); dirty = true;
      try { postSeed(); } catch (e) { if (w.console) console.error('postSeed', e); }
      seeding = false; save();
    }
  }
  function save() {
    if (!dirty) return;
    dirty = false;
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) {
      // estourou o espaço: corta cliques antigos e tenta de novo
      try { db.Clicks = db.Clicks.slice(-300); db.Logs = (db.Logs || []).slice(-40); localStorage.setItem(KEY, JSON.stringify(db)); } catch (e2) {}
    }
  }
  function table(t) { db[t] = db[t] || []; return db[t]; }
  var memCache = {};

  var env = {
    isDemo: true,
    now: function () { return Date.now(); },
    uuid: uuid,
    sha256: sha256,
    hmac: function (msg, key) { return sha256(key + '|' + msg + '|' + key); },
    b64enc: b64enc, b64dec: b64dec,
    db: {
      rows: function (t) { return table(t).map(function (r) { return Object.assign({}, r); }); },
      insert: function (t, row) { table(t).push(Object.assign({}, row)); dirty = true; if (t === 'Logs' && db.Logs.length > 200) db.Logs.splice(0, db.Logs.length - 200); },
      update: function (t, id, row) { var a = table(t); for (var i = 0; i < a.length; i++) if (String(a[i].id) === String(id)) { a[i] = Object.assign({}, row); dirty = true; return; } },
      insertMany: function (t, rows) { var a = table(t); rows.forEach(function (row) { a.push(Object.assign({}, row)); }); dirty = true; },
      remove: function (t, id) { db[t] = table(t).filter(function (r) { return String(r.id) !== String(id); }); dirty = true; }
    },
    config: function () { return Object.assign({}, db.__config || {}); },
    setConfig: function (o) { db.__config = Object.assign({}, db.__config || {}, o); dirty = true; },
    secret: function (k) { return (db.__secrets || {})[k] || ''; },
    setSecret: function (k, v) { db.__secrets = db.__secrets || {}; db.__secrets[k] = v; dirty = true; },
    lock: function (fn) { return fn(); },
    cache: {
      get: function (k) { var c = memCache[k]; return c && c.exp > Date.now() ? c.v : null; },
      put: function (k, v, sec) { memCache[k] = { v: v, exp: Date.now() + (sec || 60) * 1000 }; },
      del: function (k) { delete memCache[k]; }
    },
    pay: {
      pix: function (o) {
        var id = 'demo' + Math.floor(Math.random() * 1e10);
        var p = { id: id, status: 'pending', status_detail: 'pending_waiting_transfer', external_reference: o.order_id, transaction_amount: o.amount, payment_method_id: 'pix', payment_type_id: 'bank_transfer', installments: 1, fee_details: [{ amount: Math.round(o.amount * 0.0099 * 100) / 100 }], date_of_expiration: o.expires_at };
        db.__payments = db.__payments || {}; db.__payments[id] = p; dirty = true;
        var code = '00020126580014BR.GOV.BCB.PIX0136' + uuid() + '5204000053039865406' + Number(o.amount).toFixed(2) + '5802BR5913BRASA DEMO6009FORTALEZA62070503***6304' + sha256(id).slice(0, 4).toUpperCase();
        return { id: id, status: 'pending', status_detail: p.status_detail, qr_code: code, qr_base64: fakeQR(code), ticket_url: '' };
      },
      preference: function (o) {
        var id = 'pref' + Math.floor(Math.random() * 1e9);
        db.__prefs = db.__prefs || {}; db.__prefs[id] = { order_id: o.order_id, amount: o.amount, max_installments: o.max_installments }; dirty = true;
        return { id: id, init_point: 'demo:card:' + o.order_id };
      },
      get: function (id) { var p = (db.__payments || {})[id]; if (!p) throw new Error('Pagamento não encontrado'); return Object.assign({}, p); },
      search: function (ref) { var all = db.__payments || {}; return Object.keys(all).map(function (k) { return all[k]; }).filter(function (p) { return p.external_reference === ref; }).reverse(); },
      refund: function (id) { var p = (db.__payments || {})[id]; if (p) { p.status = 'refunded'; dirty = true; } return true; },
      ping: function () { return 'Conta de demonstração (pagamentos simulados).'; },
      // cartão dentro da página: o "token" da demo decide o resultado
      card: function (o) {
        var id = 'demo' + Math.floor(Math.random() * 1e10), tok = String(o.token || '');
        var p = { id: id, external_reference: o.order_id, transaction_amount: o.amount, payment_method_id: o.payment_method_id || 'master', payment_type_id: 'credit_card', installments: o.installments || 1, fee_details: [{ amount: Math.round(o.amount * 0.0498 * 100) / 100 }] };
        if (/funds/.test(tok)) { p.status = 'rejected'; p.status_detail = 'cc_rejected_insufficient_amount'; }
        else if (/fail/.test(tok)) { p.status = 'rejected'; p.status_detail = 'cc_rejected_other_reason'; }
        else if (/3ds/.test(tok)) { p.status = 'pending'; p.status_detail = 'pending_challenge'; p.three_ds_info = { external_resource_url: 'demo://3ds', creq: 'demo' }; }
        else { p.status = 'approved'; p.status_detail = 'accredited'; }
        db.__payments = db.__payments || {}; db.__payments[id] = p; dirty = true;
        return Object.assign({}, p);
      }
    },
    mail: function (to, subject, html) {
      db.__outbox = db.__outbox || [];
      db.__outbox.unshift({ ts: Date.now(), to: to, subject: subject, html: html });
      db.__outbox = db.__outbox.slice(0, 30); dirty = true;
      if (!seeding && w.B && w.B.toast) setTimeout(function () { w.B.toast('E-mail simulado para ' + to + ': ' + subject, 'info', 4200); }, 300);
    },
    ai: function (system, user) { return fakeAI(user); },
    // BRASA CRM: as duas demos ficam no mesmo site, então a "rede" é o localStorage
    crm: function (url, payload) {
      var q = []; try { q = JSON.parse(localStorage.getItem(PONTE_CRM) || '[]'); } catch (e) {}
      q.push(payload); if (q.length > 300) q = q.slice(-300);
      try { localStorage.setItem(PONTE_CRM, JSON.stringify(q)); } catch (e) {}
      return { code: 200, text: '{"ok":true}' };
    },
    capi: function (pixel, token, ver, payload) { env.log('info', 'capi', 'Purchase enviado ao Pixel ' + pixel + ' (simulado)', {}); },
    github: function (path) { return env.siteUrl() + 'lp.html?c=' + encodeURIComponent(path.split('/')[1] || ''); },
    upload: function (name, mime, data) { return 'data:' + mime + ';base64,' + data; },
    log: function (level, where, msg, data) {
      env.db.insert('Logs', { id: 'z_' + Math.random().toString(36).slice(2, 10), ts: Date.now(), level: level, where: where, msg: msg, data: JSON.stringify(data || {}) });
    },
    apiUrl: function () { return 'https://script.google.com/macros/s/SEU-DEPLOY/exec'; },
    siteUrl: function () { return (w.B && w.B.siteUrl) ? w.B.siteUrl() : location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, ''); }
  };

  /* QR "de mentira" (SVG) só para ilustrar o Pix na demo */
  function fakeQR(text) {
    var n = 29, cell = 8, s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n * cell + 32) + ' ' + (n * cell + 32) + '"><rect width="100%" height="100%" fill="#fff"/><g transform="translate(16 16)" fill="#120c07">';
    var h = sha256(text) + sha256(text + '1') + sha256(text + '2') + sha256(text + '3');
    var bits = ''; for (var i = 0; i < h.length; i++) bits += parseInt(h[i], 16).toString(2).padStart(4, '0');
    function finder(x, y) { s += '<rect x="' + x * cell + '" y="' + y * cell + '" width="' + 7 * cell + '" height="' + 7 * cell + '"/><rect x="' + (x + 1) * cell + '" y="' + (y + 1) * cell + '" width="' + 5 * cell + '" height="' + 5 * cell + '" fill="#fff"/><rect x="' + (x + 2) * cell + '" y="' + (y + 2) * cell + '" width="' + 3 * cell + '" height="' + 3 * cell + '"/>'; }
    var bi = 0;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (inF) continue;
      if (bits[bi++ % bits.length] === '1') s += '<rect x="' + x * cell + '" y="' + y * cell + '" width="' + cell + '" height="' + cell + '"/>';
    }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    s += '</g></svg>';
    return btoa(s);
  }

  /* ---------- "IA" simulada: escreve a LP a partir dos dados do curso ---------- */
  function fakeAI(user) {
    var m = String(user).match(/Dados do curso \(JSON\):\n([\s\S]*?)\n\nEscreva/);
    if (!m) return '{"ok":"OK"}';
    var d = JSON.parse(m[1]);
    var keys = (String(user).match(/Formato exato da resposta:\n(\{[\s\S]*?\})(\n|$)/) || [])[1] || '';
    var want = {}; keys.replace(/"(\w+)":/g, function (_, k) { want[k] = 1; });
    if (want.ads) {
      // simula a IA reaproveitando os rascunhos de cada ângulo (a arte e os textos saem do modelo)
      var brief = []; try { brief = JSON.parse((String(user).match(/nesta ordem: (\[[\s\S]*?\])\n/) || [])[1] || '[]'); } catch (e) {}
      return JSON.stringify({ ads: brief.map(function (b) { return { angle: b.angle, hook: b.rascunho_hook }; }) });
    }
    var t = d.curso, horas = d.totais.horas, aulas = d.totais.aulas, temps = d.totais.temporadas;
    var pl = function (n, one, many) { return n + ' ' + (n === 1 ? one : many); };
    var promessa = d.promessa || d.subtitulo || t;
    var dores = (d.dores && d.dores.length ? d.dores : ['Você já tentou aprender sozinho e se perdeu no meio de tanto conteúdo solto.', 'Tem a sensação de que está sempre começando do zero.', 'Sabe que precisa mudar a forma como faz, mas não sabe por onde.']).slice(0, 5);
    var ben = (d.beneficios && d.beneficios.length ? d.beneficios : [promessa]);
    var out = {};
    if (want.seo) out.seo = { title: (t + ' · método direto ao ponto').slice(0, 60), description: (promessa + '. ' + pl(aulas, 'aula', 'aulas') + ', ' + horas + 'h de conteúdo e garantia de ' + (d.garantia_dias || 7) + ' dias.').slice(0, 155) };
    if (want.hero) out.hero = { kicker: (d.categoria || 'Curso online'), headline: promessa.length > 72 ? promessa.slice(0, 70).replace(/\s+\S*$/, '') + '…' : promessa, subheadline: (d.resumo || d.subtitulo || '') + (d.resumo ? '' : ' Em ' + pl(aulas, 'aula objetiva', 'aulas objetivas') + ', do primeiro passo ao resultado.'), cta: 'Quero começar hoje', note: (d.garantia_dias || 7) + ' dias de garantia · acesso ' + d.acesso };
    if (want.pain) out.pain = { title: 'Você se reconhece em alguma destas?', items: dores };
    if (want.promise) out.promise = { title: 'O que muda quando você termina', text: 'Este não é mais um curso para assistir e esquecer. Cada temporada fecha um ciclo prático: você aprende, aplica e vê o efeito na semana seguinte. ' + promessa + '.', pillars: ben.slice(0, 3).map(function (b) { var p = b.split(/[:—–-]\s+/); return p.length > 1 ? { title: p[0].slice(0, 32), text: p.slice(1).join(' ') } : { title: b.split(/\s+/).slice(0, 3).join(' '), text: b }; }) };
    if (want.modules) out.modules = { title: 'Temporadas e episódios', intro: pl(temps, 'temporada', 'temporadas') + ' e ' + pl(aulas, 'episódio curto', 'episódios curtos') + ', para assistir no celular entre uma reunião e outra.' };
    if (want.audience) out.audience = { title: 'Feito para você se…', for: (d.publico && d.publico.length ? d.publico : ['Você quer aplicar já na primeira semana.', 'Você prefere método a motivação.', 'Você tem pouco tempo e quer foco.', 'Você está disposto a fazer a sua parte.']).slice(0, 4), not_for: ['Você procura atalho mágico ou resultado sem esforço.', 'Você não pretende assistir às aulas nem aplicar.'] };
    if (want.instructor) out.instructor = { title: d.instrutor && d.instrutor.nome ? 'Quem vai com você: ' + d.instrutor.nome : 'Quem conduz', text: d.instrutor && d.instrutor.bio ? d.instrutor.bio : '' };
    if (want.bonuses) out.bonuses = { title: d.bonus && d.bonus.length ? 'Bônus que entram junto' : '', items: d.bonus || [] };
    if (want.offer) out.offer = { title: 'Tudo o que entra na sua estante', bullets: [pl(aulas, 'episódio', 'episódios') + ' em ' + pl(temps, 'temporada', 'temporadas'), 'Acesso ' + d.acesso + ' no celular e no computador', 'Materiais de apoio para baixar', 'Certificado ao concluir', 'Atualizações sem custo extra'].concat((d.bonus || []).map(function (b) { return 'Bônus: ' + b.title; })).slice(0, 8), cta: 'Garantir meu acesso', urgency: d.prazo_oferta ? 'Condição especial até ' + d.prazo_oferta + '.' : '' };
    if (want.guarantee) out.guarantee = { title: (d.garantia_dias || 7) + ' dias para decidir', text: 'Entre, assista, aplique. Se em ' + (d.garantia_dias || 7) + ' dias não fizer sentido, você pede e recebe 100% do valor de volta.' };
    if (want.faq) out.faq = (d.faq_existente && d.faq_existente.length ? d.faq_existente : []).concat([
      { q: 'Quando recebo o acesso?', a: 'Pix libera na hora. No cartão, assim que o banco aprovar. O acesso chega no seu e-mail.' },
      { q: 'Preciso de experiência?', a: 'Não. As temporadas começam do básico e sobem de nível aos poucos.' },
      { q: 'Por quanto tempo posso assistir?', a: 'Acesso ' + d.acesso + '. Assista no seu ritmo, quantas vezes quiser.' },
      { q: 'Dá para parcelar?', a: 'Sim, em até ' + d.parcelas + 'x no cartão.' },
      { q: 'E se eu não gostar?', a: 'Garantia de ' + (d.garantia_dias || 7) + ' dias. Pediu, devolvemos tudo.' }
    ]).slice(0, 7);
    if (want.final_cta) out.final_cta = { title: 'A próxima temporada é sua', text: 'Daqui a ' + (d.garantia_dias || 7) + ' dias você pode estar no mesmo lugar ou com ' + pl(aulas, 'episódio aplicado', 'episódios aplicados') + '. A decisão é só sua.', cta: 'Começar agora' };
    if (want.ok) return 'OK';
    return JSON.stringify(out);
  }

  /* =================================================================
     DADOS DE EXEMPLO (relativos à data de hoje)
     ================================================================= */
  function seed() {
    var now = Date.now(), r = (function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(20261019);
    var ago = function (d, h) { return now - d * DAY - (h || 0) * 3600e3; };
    var id = function (p) { return p + '_' + Math.floor(r() * 1e12).toString(36); };
    var S = { Users: [], Courses: [], Seasons: [], Lessons: [], Enrollments: [], Progress: [], Orders: [], Affiliations: [], Clicks: [], Commissions: [], Payouts: [], Coupons: [], Messages: [], Certificates: [], Logs: [] };
    var pepper = 'demo-pepper-' + Math.floor(r() * 1e9);
    function pw(p, salt) { var h = sha256(salt + '::' + p + '::' + pepper); for (var i = 0; i < 120; i++) h = sha256(h + ':' + salt); return h; }
    function user(o) {
      var salt = 's' + Math.floor(r() * 1e9);
      var u = Object.assign({ id: id('u'), created_at: ago(60), updated_at: now, phone: '', salt: salt, pass_hash: '', roles: 'student', status: 'active', avatar: '', avatar_color: '', aff_code: '', pix_key: '', instagram: '', xp: 0, streak: 0, streak_day: '', badges: '', my_list: '', last_seen: ago(2), reset_code: '', reset_exp: 0, first_token: '', notes: '' }, o);
      if (o.password) { u.pass_hash = pw(o.password, salt); delete u.password; }
      S.Users.push(u); return u;
    }

    var admin = user({ name: 'Dhione Cambraia', email: 'admin@brasa.demo', password: 'brasa123', roles: 'admin,student', created_at: ago(120), last_seen: now });
    var iara = user({ name: 'Iara Soares', email: 'aluno@brasa.demo', password: 'brasa123', phone: '88999990001', created_at: ago(46), xp: 1340, streak: 4, streak_day: '', badges: 'primeiro-passo,investidor,conquista', avatar_color: 1 });
    var luna = user({ name: 'Luna Ferraz', email: 'afiliado@brasa.demo', password: 'brasa123', roles: 'student,affiliate', aff_code: 'LUNA', pix_key: 'luna.ferraz@pix.demo', instagram: 'luna.ferraz', phone: '85988887777', created_at: ago(70), xp: 220, avatar_color: 4 });
    var caio = user({ name: 'Caio Ribeiro', email: 'caio@brasa.demo', password: 'brasa123', roles: 'student,affiliate', aff_code: 'CAIO', pix_key: '11.222.333/0001-44', instagram: 'caiotrafego', created_at: ago(55) });
    var bia = user({ name: 'Bia Nogueira', email: 'bia@brasa.demo', password: 'brasa123', roles: 'student,affiliate', aff_code: 'BIA', pix_key: '+5585977776666', instagram: 'bianogueira.mkt', created_at: ago(30) });
    // streak de hoje para Iara (ontem foi o último dia)
    iara.streak_day = new Date(now - DAY - 3 * 3600e3).toISOString().slice(0, 10);

    /* ----- cursos: saem do catálogo inicial (catalog.js). Seis já estão "gravados" na demo; o resto é Em breve ----- */
    var CATALOG = (typeof w.brasaCatalogo === 'function' ? w.brasaCatalogo() : null) || { courses: [] }, INS = CATALOG.instructor || {};
    function course(o) {
      var c = Object.assign({
        id: id('c'), created_at: ago(90), updated_at: ago(2), status: 'published', order: S.Courses.length + 1, featured: false, subtitle: '', category: '', tags: '', level: 'Iniciante',
        short_desc: '', description: '', banner: '', poster: '', logo: '', show_title: true, trailer: '', color: 0,
        instructor_name: INS.name || 'Dhione Cambraia', instructor_bio: INS.bio || '', instructor_photo: '',
        price: 0, anchor_price: 0, max_installments: 12, methods: 'pix,card', checkout_url: '', guarantee_days: 7, access_days: 0, pixel_id: '',
        promise: '', audience: '', pains: '', benefits: '', bonuses: '', faq: '[]', testimonials: '[]', cta_text: '', scarcity_until: 0, support_url: '',
        aff_enabled: false, aff_commission: 40, aff_auto: false, aff_cookie_days: 60, aff_materials: '', lp: '', lp_status: '', lp_updated_at: 0, lp_static_url: '', seo_title: '', seo_desc: '', released_at: 0
      }, o);
      c.slug = c.slug || String(c.title).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      S.Courses.push(c); return c;
    }
    // nos cursos publicados as aulas têm vídeo de demonstração; nos "Em breve", só título e descrição
    function season(c, s, opt) {
      opt = opt || {};
      var ss = { id: id('s'), created_at: c.created_at, course_id: c.id, order: S.Seasons.filter(function (x) { return x.course_id === c.id; }).length + 1, title: s.title, description: s.description || '', release_mode: opt.drip ? 'days' : 'now', release_days: opt.drip || 0, release_at: 0 };
      S.Seasons.push(ss);
      var live = c.status === 'published';
      (s.lessons || []).forEach(function (l, i) {
        var first = live && !S.Lessons.some(function (x) { return x.course_id === c.id; });
        S.Lessons.push({ id: id('l'), created_at: opt.fresh && opt.fresh[i] != null ? ago(opt.fresh[i]) : c.created_at, updated_at: c.created_at, course_id: c.id, season_id: ss.id, order: i + 1, title: l.title, description: l.description || '', video_url: live ? 'demo://aula' : '', duration_min: l.duration_min || 0, thumb: '', materials: live && i === 0 ? JSON.stringify([{ name: 'Roteiro da aula (PDF)', url: 'https://example.com/roteiro.pdf' }]) : '[]', free_preview: first, xp: 50 });
      });
      return ss;
    }
    function lns(v) { return Array.isArray(v) ? v.join('\n') : (v || ''); }
    // o que muda nos cursos que a demo trata como já gravados
    var LIVE = {
      'aula-zero-o-mapa': { created_at: ago(100) },
      'trafego-sem-romance': {
        created_at: ago(95), fresh: { 'Escala Sem Queimar Dinheiro': [5, 5, 2, 2] },
        extra: {
          faq: JSON.stringify([{ q: 'Quanto preciso investir em anúncios?', a: 'Dá para começar com R$ 20 a R$ 30 por dia. O curso mostra como testar barato antes de escalar.' }]),
          testimonials: JSON.stringify([{ name: 'Marina A.', role: 'Loja de roupas, Sobral', text: 'Parei de impulsionar e montei a primeira campanha de conversão. Em três semanas o anúncio já se pagava.' }, { name: 'Rodrigo P.', role: 'Gestor de tráfego', text: 'A planilha de leitura diária mudou meu jeito de reportar para cliente.' }]),
          aff_auto: true, aff_materials: 'https://drive.google.com/drive/folders/demo-materiais', scarcity_until: now + 3 * DAY + 5 * 3600e3, pixel_id: '1234567890123456'
        }
      },
      'funil-perpetuo': { created_at: ago(80) },
      'design-que-vende': { created_at: ago(70), extra: { aff_auto: true } },
      'respira': { created_at: ago(40), drip: { 'Raiz': 7 } },
      'apps-sem-mensalidade': { created_at: ago(30), released_at: ago(3), extra: { aff_auto: true } }
    };
    var C = {};
    (CATALOG.courses || []).forEach(function (k, i) {
      var live = LIVE[k.slug];
      var c = course(Object.assign({
        slug: k.slug, title: k.title, subtitle: k.subtitle || '', category: k.category || '', tags: k.tags || '', level: k.level || 'Iniciante',
        short_desc: k.short_desc || '', description: k.description || '', promise: k.promise || '', audience: lns(k.audience), pains: lns(k.pains), benefits: lns(k.benefits),
        bonuses: (k.bonuses || []).map(function (b) { return b.title + ' | ' + b.text + ' | ' + b.value; }).join('\n'), cta_text: k.cta_text || '',
        price: k.price || 0, anchor_price: k.anchor_price || 0, color: k.color || 0, featured: !!k.featured, aff_enabled: !!k.aff_enabled, aff_commission: k.aff_commission || 0,
        guarantee_days: k.price > 0 ? 7 : 0, order: i + 1, status: live ? 'published' : 'coming_soon',
        created_at: live ? live.created_at : ago(6), released_at: live && live.released_at ? live.released_at : 0
      }, live && live.extra || {}));
      C[k.slug] = c;
      (k.seasons || []).forEach(function (s) {
        season(c, s, { drip: live && live.drip && live.drip[s.title], fresh: live && live.fresh && live.fresh[s.title] });
      });
    });
    var trafego = C['trafego-sem-romance'], funil = C['funil-perpetuo'], design = C['design-que-vende'], respira = C['respira'];
    var apps = C['apps-sem-mensalidade'], casa = C['sem-sumir-de-casa'], zero = C['aula-zero-o-mapa'];
    var nT = S.Lessons.filter(function (l) { return l.course_id === trafego.id; }).length, sT = S.Seasons.filter(function (x) { return x.course_id === trafego.id; }).length;

    /* LP gerada para o curso principal (copy revisada) */
    trafego.lp = JSON.stringify({
      seo: { title: 'Tráfego Sem Romance · Meta Ads que se pagam', description: 'Monte, leia e escale campanhas no Meta Ads com método de gestor. ' + nT + ' aulas, planilha de leitura diária e 7 dias de garantia.' },
      hero: { kicker: 'Meta Ads com método', headline: 'Anúncio que se paga. Sem sorte, sem agência, sem romance.', subheadline: 'O método de quem roda captação perpétua todos os dias, em ' + nT + ' episódios diretos: da conta organizada à escala sem queimar dinheiro.', cta: 'Quero anúncios que se pagam', note: '7 dias de garantia · acesso vitalício · certificado' },
      pain: { title: 'Se você anuncia hoje, provavelmente…', items: ['Impulsiona post, gasta e não sabe dizer se voltou alguma coisa.', 'Sente que cada campanha é uma aposta: um dia vende, no outro some.', 'Olha CPM, CTR e CPA e decide no achismo, porque ninguém te ensinou a ler junto.', 'Já pagou agência e recebeu relatório bonito sem venda nenhuma.'] },
      promise: { title: 'O que muda quando você termina', text: 'Você deixa de apostar e passa a gerir. Cada real colocado no Meta Ads tem um motivo, um teste e um número que diz se ele fica ou sai.', pillars: [{ title: 'Conta organizada', text: 'Uma estrutura de campanha que você entende, explica e replica em qualquer negócio.' }, { title: 'Criativo que vende', text: 'Roteiros e formatos que param o dedo e trazem o clique de quem compra.' }, { title: 'Número na mão', text: 'Uma planilha de 10 minutos por dia para cortar, manter ou escalar sem medo.' }] },
      modules: { title: sT + ' temporadas, ' + nT + ' episódios', intro: 'Episódios curtos para assistir no celular e aplicar no mesmo dia.' },
      audience: { title: 'É para você se…', for: ['Você já vende e quer previsibilidade em vez de sorte.', 'Você está começando como gestor de tráfego e quer método.', 'Você é infoprodutor e cansou de depender de lançamento.', 'Você já perdeu dinheiro com anúncio e quer entender o porquê.'], not_for: ['Você procura um truque de algoritmo que funcione sozinho.', 'Você não pretende colocar nada em prática.'] },
      instructor: { title: 'Quem vai com você: Dhione Cambraia', text: 'Designer há mais de 10 anos e coordenador de marketing de uma consultoria de gestão, onde gerencia campanhas de captação perpétua e eventos presenciais. Ensina o que usa na rotina, com a planilha aberta.' },
      bonuses: { title: 'Bônus que entram junto', items: [{ title: 'Planilha de gestão de tráfego', text: 'A mesma planilha usada na rotina de captação perpétua.', value: 197 }, { title: 'Biblioteca de 40 roteiros de anúncio', text: 'Ganchos e estruturas testadas em nichos diferentes.', value: 147 }] },
      offer: { title: 'Tudo o que entra na sua estante', bullets: [nT + ' episódios em ' + sT + ' temporadas', 'Acesso vitalício, no celular e no computador', 'Planilha de leitura diária', 'Biblioteca com 40 roteiros de anúncio', 'Certificado de conclusão', 'Atualizações sem custo extra'], cta: 'Garantir meu acesso', urgency: 'Condição de lançamento por tempo limitado.' },
      guarantee: { title: '7 dias para decidir', text: 'Entre, assista e monte sua primeira campanha. Se em 7 dias não fizer sentido, você pede e recebe 100% do valor de volta.' },
      faq: [{ q: 'Quanto preciso investir em anúncios?', a: 'Dá para começar com R$ 20 a R$ 30 por dia. O curso mostra como testar barato antes de escalar.' }, { q: 'Serve para negócio local?', a: 'Sim. Os exemplos vão de loja de bairro a infoproduto.' }, { q: 'Quando recebo o acesso?', a: 'Pix libera na hora; no cartão, assim que o banco aprova. O acesso chega no seu e-mail.' }, { q: 'Dá para parcelar?', a: 'Sim, em até 12x no cartão.' }, { q: 'E se eu não gostar?', a: 'Garantia de 7 dias. Pediu, devolvemos tudo.' }],
      final_cta: { title: 'Seu próximo anúncio pode ser o primeiro que se paga', text: nT + ' episódios, uma planilha e um método. O resto é decisão sua.', cta: 'Começar agora' },
      meta: { source: 'ai', model: 'demonstração', generated_at: ago(2) }
    });
    trafego.lp_status = 'reviewed'; trafego.lp_updated_at = ago(2);

    /* ----- configuração ----- */
    S.__config = { brand_name: 'BRASA', brand_tagline: 'Cursos para quem quer viver de verdade', support_whatsapp: '(88) 90000-0000', support_email: 'suporte@brasa.demo', pixel_id: '1234567890123456', admin_email: 'admin@brasa.demo', email_sender_name: 'BRASA', github_repo: 'seuusuario/brasa', mp_public_key: 'TEST-demo-0000-0000', card_mode: 'transparent' };
    S.__secrets = { TOKEN_SECRET: pepper, MP_ACCESS_TOKEN: 'APP_USR-demo', AI_API_KEY: 'sk-ant-demo', GITHUB_TOKEN: 'ghp_demo', CRM_WEBHOOK_URL: 'demo://brasa-crm', CRM_BRIDGE_KEY: PONTE_CHAVE };

    /* ----- afiliações ----- */
    function aff(u, c, status, commission, days) { var a = { id: id('a'), created_at: ago(days || 30), updated_at: ago(days || 30), user_id: u.id, course_id: c.id, status: status, commission: commission || 0, pixel_id: '', note: '' }; S.Affiliations.push(a); return a; }
    aff(luna, trafego, 'approved', 45, 60); aff(luna, design, 'approved', 0, 40); aff(luna, funil, 'pending', 0, 1);
    aff(caio, trafego, 'approved', 0, 50); aff(caio, funil, 'approved', 0, 45);
    aff(bia, trafego, 'approved', 0, 28); aff(bia, apps, 'approved', 0, 2); aff(bia, design, 'pending', 0, 0.2);

    /* ----- alunos e vendas ----- */
    var first = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Heitor', 'Ingrid', 'João', 'Kelly', 'Lucas', 'Marta', 'Nando', 'Olívia', 'Paulo', 'Rafa', 'Sara', 'Téo', 'Vera', 'Wesley', 'Yara', 'Zeca', 'Lia', 'Davi', 'Nina', 'Igor', 'Malu', 'Otto', 'Rita'];
    var last = ['Lima', 'Sousa', 'Pereira', 'Alves', 'Costa', 'Rocha', 'Martins', 'Barros', 'Freitas', 'Cardoso', 'Teixeira', 'Moura', 'Dias', 'Melo', 'Araújo'];
    var buyers = [];
    for (var i = 0; i < 46; i++) {
      var fn = first[i % first.length], ln = last[Math.floor(r() * last.length)];
      buyers.push(user({ name: fn + ' ' + ln, email: (fn + '.' + ln).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + i + '@mail.demo', phone: '85' + (900000000 + Math.floor(r() * 99999999)), created_at: ago(2 + r() * 44), last_seen: i % 7 === 3 ? ago(16 + r() * 25) : ago(r() * 12), xp: Math.floor(r() * 2200), password: 'brasa123' }));
    }
    var catalog = [[trafego, 9], [funil, 4], [design, 5], [respira, 4], [apps, 3]];
    var weighted = []; catalog.forEach(function (x) { for (var k = 0; k < x[1]; k++) weighted.push(x[0]); });
    var affPick = [luna, luna, luna, caio, caio, bia];
    function order(o) {
      var x = Object.assign({ id: 'o_' + Math.floor(r() * 1e14).toString(36), updated_at: o.created_at, paid_at: 0, data_br: '', status: 'approved', user_id: '', phone: '', doc: '', discount: 0, coupon: '', method: 'pix', installments: 1, mp_payment_id: 'demo' + Math.floor(r() * 1e10), mp_preference_id: '', status_detail: 'accredited', fee: 0, net: 0, aff_id: '', aff_code: '', commission: 0, utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '', src: 'lp', fbp: '', fbc: '', ua: '', recovery_sent: false, capi_sent: true, checked_at: 0 }, o);
      S.Orders.push(x); return x;
    }
    function enroll(u, c, at, source, orderId, status) { S.Enrollments.push({ id: id('e'), created_at: at, user_id: u.id, course_id: c.id, expires_at: 0, source: source, order_id: orderId || '', status: status || 'active' }); }
    var sources = [['facebook', 'cpc', 'perpetuo-frio'], ['facebook', 'cpc', 'remarketing-7d'], ['instagram', 'organic', 'bio'], ['google', 'organic', ''], ['', '', '']];
    buyers.forEach(function (b, bi) {
      var c = weighted[Math.floor(r() * weighted.length)];
      var at = Math.min(now - 3600e3, b.created_at + 600e3);
      var viaAff = r() < 0.32 ? affPick[Math.floor(r() * affPick.length)] : null;
      if (viaAff) {
        var okAff = S.Affiliations.some(function (a) { return a.user_id === viaAff.id && a.course_id === c.id && a.status === 'approved'; });
        if (!okAff) viaAff = null;
      }
      var method = r() < 0.62 ? 'pix' : 'card';
      var coupon = r() < 0.12 ? 'BRASA10' : '';
      var amount = coupon ? Math.round(c.price * 0.9 * 100) / 100 : c.price;
      var fee = Math.round(amount * (method === 'pix' ? 0.0099 : 0.0498) * 100) / 100;
      var src = sources[Math.floor(r() * sources.length)];
      var refunded = bi === 7 || bi === 29;
      var o = order({ created_at: at, paid_at: at + 120e3, data_br: '', status: refunded ? 'refunded' : 'approved', course_id: c.id, course_title: c.title, user_id: b.id, name: b.name, email: b.email, phone: b.phone, price: c.price, discount: c.price - amount, coupon: coupon, amount: amount, method: method, installments: method === 'card' ? 1 + Math.floor(r() * 10) : 1, card_brand: method === 'card' ? ['visa', 'master', 'elo', 'master', 'visa'][bi % 5] : '', fee: fee, net: amount - fee, aff_id: viaAff ? viaAff.id : '', aff_code: viaAff ? viaAff.aff_code : '', utm_source: viaAff ? 'afiliado' : src[0], utm_medium: viaAff ? 'link' : src[1], utm_campaign: viaAff ? viaAff.aff_code.toLowerCase() : src[2] });
      enroll(b, c, o.paid_at, 'purchase', o.id, refunded ? 'refunded' : 'active');
      var bumpOn = (c === trafego && r() < 0.34) || (c === funil && r() < 0.3);
      if (bumpOn) {
        var bumpAmt = c === trafego ? 37 : 97;
        o.amount = Math.round((o.amount + bumpAmt) * 100) / 100; o.fee = Math.round(o.amount * (method === 'pix' ? 0.0099 : 0.0498) * 100) / 100; o.net = Math.round((o.amount - o.fee) * 100) / 100;
        if (c === trafego) { o.bump_type = 'product'; o.bump_title = 'Pack de 30 criativos editáveis'; o.bump_amount = 37; o.bump_delivery = 'https://drive.google.com/drive/folders/demo-criativos'; }
        else { o.bump_type = 'course'; o.bump_ref = design.id; o.bump_title = 'Design Que Vende por R$ 97'; o.bump_amount = 97; if (!refunded) enroll(b, design, o.paid_at, 'bump', o.id); }
        amount = o.amount;
      }
      if (viaAff) {
        var a = S.Affiliations.filter(function (x) { return x.user_id === viaAff.id && x.course_id === c.id; })[0];
        var pct = a.commission > 0 ? a.commission : c.aff_commission;
        var com = Math.round(amount * pct / 100 * 100) / 100;
        o.commission = refunded ? com : com;
        var release = o.paid_at + 8 * DAY;
        S.Commissions.push({ id: id('m'), created_at: o.paid_at, updated_at: o.paid_at, order_id: o.id, aff_id: viaAff.id, course_id: c.id, amount: com, status: refunded ? 'canceled' : 'pending', release_at: release, paid_at: 0, payout_id: '' });
      }
      // progresso aleatório dos compradores
      var seqL = S.Lessons.filter(function (l) { return l.course_id === c.id; });
      var nDone = Math.floor(r() * seqL.length);
      for (var k = 0; k < nDone; k++) S.Progress.push({ id: id('p'), created_at: at, updated_at: at + k * DAY / 2, user_id: b.id, course_id: c.id, lesson_id: seqL[k].id, status: 'done', position: seqL[k].duration_min * 60, completed_at: at + k * DAY / 2, note: '', liked: r() < 0.3 });
    });
    // pagamentos de comissão já feitos (as mais antigas)
    [luna, caio].forEach(function (af) {
      var old = S.Commissions.filter(function (m) { return m.aff_id === af.id && m.status === 'pending' && m.release_at < now - 6 * DAY; });
      if (!old.length) return;
      var half = old.slice(0, Math.ceil(old.length * 0.6));
      var p = { id: id('y'), created_at: ago(5), aff_id: af.id, amount: Math.round(half.reduce(function (s, m) { return s + m.amount; }, 0) * 100) / 100, count: half.length, pix_key: af.pix_key, note: 'Pagamento quinzenal' };
      S.Payouts.push(p);
      half.forEach(function (m) { m.status = 'paid'; m.paid_at = p.created_at; m.payout_id = p.id; });
    });
    // carrinhos abandonados
    for (var j = 0; j < 7; j++) {
      var c2 = weighted[Math.floor(r() * weighted.length)], at2 = ago(r() * 4, r() * 12);
      order({ created_at: at2, status: j < 2 ? 'pending' : 'expired', status_detail: j < 2 ? 'pending_waiting_transfer' : 'expired', course_id: c2.id, course_title: c2.title, name: first[(j * 7) % first.length] + ' ' + last[j % last.length], email: 'lead' + j + '@mail.demo', phone: '85' + (911110000 + j), price: c2.price, amount: c2.price, method: 'pix', mp_payment_id: '', recovery_sent: j > 3, utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'perpetuo-frio' });
    }
    S.Orders.forEach(function (o) { var d = new Date(o.created_at - 3 * 3600e3); o.data_br = d.toISOString().slice(8, 10) + '/' + d.toISOString().slice(5, 7) + '/' + d.toISOString().slice(0, 4) + ' ' + d.toISOString().slice(11, 16); });

    /* ----- a aluna da demo ----- */
    var oz = order({ created_at: ago(45), paid_at: ago(45), status: 'approved', course_id: zero.id, course_title: zero.title, user_id: iara.id, name: iara.name, email: iara.email, price: 0, amount: 0, method: 'free', mp_payment_id: '', src: 'app' });
    enroll(iara, zero, ago(45), 'free', oz.id);
    var ot = order({ created_at: ago(40), paid_at: ago(40), status: 'approved', course_id: trafego.id, course_title: trafego.title, user_id: iara.id, name: iara.name, email: iara.email, price: 497, amount: 497, method: 'card', installments: 6, card_brand: 'master', fee: 24.75, net: 472.25, aff_id: luna.id, aff_code: 'LUNA', commission: 223.65, utm_source: 'afiliado', utm_medium: 'link', utm_campaign: 'luna' });
    enroll(iara, trafego, ago(40), 'purchase', ot.id);
    S.Commissions.push({ id: id('m'), created_at: ago(40), updated_at: ago(40), order_id: ot.id, aff_id: luna.id, course_id: trafego.id, amount: 223.65, status: 'pending', release_at: ago(32), paid_at: 0, payout_id: '' });
    var od = order({ created_at: ago(12), paid_at: ago(12), status: 'approved', course_id: design.id, course_title: design.title, user_id: iara.id, name: iara.name, email: iara.email, price: 297, amount: 297, method: 'pix', fee: 2.94, net: 294.06, src: 'app' });
    enroll(iara, design, ago(12), 'purchase', od.id);
    function done(u, c, n, startAgo, partialPos) {
      var seqL = S.Lessons.filter(function (l) { return l.course_id === c.id; });
      seqL.sort(function (a, b) { var sa = S.Seasons.filter(function (s) { return s.id === a.season_id; })[0].order, sb = S.Seasons.filter(function (s) { return s.id === b.season_id; })[0].order; return sa - sb || a.order - b.order; });
      for (var k = 0; k < n && k < seqL.length; k++) {
        var at = ago(startAgo - k * (startAgo / Math.max(n, 1)) * 0.9);
        S.Progress.push({ id: id('p'), created_at: at, updated_at: at, user_id: u.id, course_id: c.id, lesson_id: seqL[k].id, status: 'done', position: seqL[k].duration_min * 60, completed_at: at, note: k === 1 ? 'Lembrar: testar 3 criativos por conjunto antes de escalar.' : '', liked: k % 3 === 0 });
      }
      if (partialPos != null && seqL[n]) S.Progress.push({ id: id('p'), created_at: ago(1, 3), updated_at: ago(0, 20), user_id: u.id, course_id: c.id, lesson_id: seqL[n].id, status: 'started', position: Math.round(seqL[n].duration_min * 60 * partialPos), completed_at: 0, note: '', liked: false });
    }
    done(iara, zero, 3, 44);
    done(iara, trafego, 7, 38, 0.42);
    done(iara, design, 1, 10, 0.3);
    S.Certificates.push({ id: id('x'), code: 'BRZ7KQ4M', created_at: ago(42), user_id: iara.id, course_id: zero.id, name: iara.name, course_title: zero.title, hours: 1 });
    iara.my_list = apps.id + ',' + casa.id;

    /* ----- cliques nas páginas de venda ----- */
    var views = [[trafego, 14], [funil, 6], [design, 7], [respira, 5], [apps, 9]];
    for (var dday = 30; dday >= 0; dday--) {
      views.forEach(function (v) {
        if (v[0] === apps && dday > 3) return;
        var n = Math.round(v[1] * (0.6 + r() * 0.8));
        for (var k = 0; k < n; k++) {
          var affc = r() < 0.3 ? (r() < 0.6 ? 'LUNA' : r() < 0.5 ? 'CAIO' : 'BIA') : '';
          S.Clicks.push({ id: 'k_' + Math.floor(r() * 1e12).toString(36), ts: ago(dday, r() * 23), course_id: v[0].id, aff_code: affc, type: 'view', sid: '', utm_source: affc ? 'afiliado' : 'facebook', utm_campaign: affc.toLowerCase(), ref_url: '' });
        }
      });
    }

    /* ----- cupons ----- */
    S.Coupons.push({ id: id('q'), created_at: ago(30), code: 'BRASA10', course_id: '', type: 'percent', value: 10, max_uses: 0, uses: 6, expires_at: 0, active: true, aff_code: '' });
    S.Coupons.push({ id: id('q'), created_at: ago(20), code: 'LUNA15', course_id: trafego.id, type: 'percent', value: 15, max_uses: 100, uses: 3, expires_at: now + 20 * DAY, active: true, aff_code: 'LUNA' });
    S.Coupons.push({ id: id('q'), created_at: ago(2), code: 'CASA20', course_id: funil.id, type: 'percent', value: 20, max_uses: 0, uses: 1, expires_at: now + 5 * DAY, active: true, aff_code: '' });
    S.Coupons.push({ id: id('q'), created_at: ago(60), code: 'PERPETUO50', course_id: funil.id, type: 'fixed', value: 50, max_uses: 20, uses: 20, expires_at: ago(10), active: false, aff_code: '' });

    /* ----- suporte ----- */
    function msg(thread, from, text, at, readA, readU) { S.Messages.push({ id: id('g'), ts: at, thread: thread.id, from: from, text: text, read_admin: readA, read_user: readU }); }
    msg(luna, 'user', 'Oi! Posso usar os criativos da pasta de materiais nos meus Reels também?', ago(2, 5), true, true);
    msg(luna, 'admin', 'Pode sim, Luna. Só não altere a oferta nem o preço. Bora pra cima.', ago(2, 3), true, true);
    msg(luna, 'user', 'Pedi afiliação no Funil Perpétuo. Tem previsão de aprovação?', ago(0, 2), false, true);
    msg(iara, 'user', 'O certificado da Aula Zero saiu com meu nome certinho, valeu!', ago(40), true, true);
    msg(iara, 'admin', 'Que bom, Iara! Agora é terminar o Tráfego Sem Romance.', ago(39), true, true);
    msg(caio, 'user', 'Qual a data do próximo pagamento das comissões?', ago(1, 8), false, true);

    /* ----- order bump e oferta pós-compra ----- */
    trafego.bump_enabled = true; trafego.bump_type = 'product'; trafego.bump_title = 'Pack de 30 criativos editáveis';
    trafego.bump_text = 'Os 30 anúncios que mais converteram nas campanhas de captação, em arquivos editáveis no Canva. Troque o texto e suba hoje.';
    trafego.bump_price = 37; trafego.bump_delivery = 'https://drive.google.com/drive/folders/demo-criativos';
    trafego.upsell_enabled = true; trafego.upsell_course_id = funil.id; trafego.upsell_price = 397; trafego.upsell_minutes = 15;
    trafego.upsell_title = 'Espere: o próximo passo com 43% de desconto';
    trafego.upsell_text = 'Quem domina o tráfego precisa de um funil para onde mandar as pessoas. Adicione o Funil Perpétuo agora por R$ 397 (de R$ 697). Essa condição só aparece nesta tela.';
    funil.bump_enabled = true; funil.bump_type = 'course'; funil.bump_course_id = design.id; funil.bump_price = 97;
    funil.bump_title = 'Design Que Vende por R$ 97'; funil.bump_text = 'Os estilos de anúncio que mais vendem no feed, para alimentar o seu funil. Só nesta compra, de R$ 197 por R$ 97.';

    /* ----- time comercial ----- */
    user({ name: 'Rafa Monteiro', email: 'vendas@brasa.demo', password: 'brasa123', roles: 'seller', phone: '85999112233', pix_key: 'rafa.monteiro@pix.demo', seller_commission: 10, seller_max_discount: 30, created_at: ago(25), last_seen: ago(0, 1) });
    user({ name: 'Duda Lins', email: 'duda@brasa.demo', password: 'brasa123', roles: 'seller', phone: '85999445566', seller_commission: 0, seller_max_discount: 15, created_at: ago(12), last_seen: ago(1) });

    /* ----- banners da área do aluno ----- */
    S.Banners = []; S.Templates = []; S.Emails = []; S.Leads = []; S.Activities = []; S.Offers = [];
    S.Banners.push({ id: id('b'), created_at: ago(10), updated_at: ago(10), active: true, title: 'Indique e ganhe até {comissao} por venda', text: 'Você já conhece os cursos por dentro. Indique para os amigos e receba comissão por cada venda, direto no Pix.', cta_label: 'Quero ser afiliado', action: 'affiliate', url: '', course_id: '', coupon: '', image: '', placement: 'home_middle', audience: 'not_affiliate', audience_course_id: '', starts_at: 0, ends_at: 0, priority: 10, clicks: 14 });
    S.Banners.push({ id: id('b'), created_at: ago(2), updated_at: ago(2), active: true, title: 'Tráfego pronto? Agora o funil.', text: 'Quem é da casa leva o Funil Perpétuo com 20% de desconto. Cupom CASA20 já aplicado, só até domingo.', cta_label: 'Quero o funil', action: 'checkout', url: '', course_id: funil.id, coupon: 'CASA20', image: '', placement: 'home_top', audience: 'owns', audience_course_id: trafego.id, starts_at: 0, ends_at: now + 5 * DAY, priority: 20, clicks: 9 });
    S.Banners.push({ id: id('b'), created_at: ago(1), updated_at: ago(1), active: true, title: 'Em breve: Sem Sumir de Casa', text: 'Rotina, limites e acordos para crescer o negócio sem sumir da própria casa. Toque para ser avisado na estreia.', cta_label: 'Ver o curso', action: 'course', url: '', course_id: casa.id, coupon: '', image: '', placement: 'lesson', audience: 'all', audience_course_id: '', starts_at: 0, ends_at: 0, priority: 5, clicks: 3 });

    /* ----- modelo de mensagem criado pelo produtor ----- */
    S.Templates.push({ id: id('t'), created_at: ago(6), updated_at: ago(6), channel: 'wa', audience: 'student', key: 'custom_live', title: 'Convite para a live', subject: '', heading: '', body: 'Oi, {primeiro_nome}! Hoje às 20h tem live tirando dúvidas de {curso_atual}. Mando o link aqui 10 minutos antes. Bora?', cta: '', active: true, order: 50 });

    /* ----- histórico de e-mails ----- */
    S.Emails.push({ id: id('w'), ts: ago(45), to: iara.email, user_id: iara.id, key: 'welcome', subject: 'Seu acesso a Aula Zero: O Mapa está liberado', status: 'sent', error: '' });
    S.Emails.push({ id: id('w'), ts: ago(40), to: iara.email, user_id: iara.id, key: 'welcome', subject: 'Seu acesso a Tráfego Sem Romance está liberado', status: 'sent', error: '' });
    S.Emails.push({ id: id('w'), ts: ago(26), to: iara.email, user_id: iara.id, key: 'code', subject: 'Seu código de acesso: 482913', status: 'failed', error: 'Cota diária de e-mails do Gmail esgotada. Os próximos saem amanhã.' });
    S.Emails.push({ id: id('w'), ts: ago(12), to: iara.email, user_id: iara.id, key: 'welcome', subject: 'Seu acesso a Design Que Vende está liberado', status: 'sent', error: '' });

    // cartões recusados (aparecem em Vendas com o motivo e viram leads de recuperação)
    function br(ts) { var dd = new Date(ts - 3 * 3600e3).toISOString(); return dd.slice(8, 10) + '/' + dd.slice(5, 7) + '/' + dd.slice(0, 4) + ' ' + dd.slice(11, 16); }
    [['Bruno Teles', 'bruno.teles@mail.demo', '85987776655', funil, 'cc_rejected_insufficient_amount', 'visa', 1.2],
     ['Carla Nunes', 'carla.nunes@mail.demo', '88996554433', trafego, 'cc_rejected_bad_filled_security_code', 'master', 2.6]].forEach(function (x) {
      var at = ago(x[6]);
      order({ created_at: at, data_br: br(at), status: 'rejected', status_detail: x[4], course_id: x[3].id, course_title: x[3].title, name: x[0], email: x[1], phone: x[2], price: x[3].price, amount: x[3].price, method: 'card', installments: 3, card_brand: x[5], src: 'page', utm_source: 'instagram', utm_medium: 'stories', utm_campaign: 'perpetuo-quente' });
    });
    // lista de espera dos cursos "Em breve": alguns alunos já tocaram em Avise-me (sem sorteio, para não mexer no resto da demo)
    var INTEREST = { 'isca-que-pesca': 9, 'lancamento-workshop': 8, 'produto-do-zero': 7, 'automacoes-com-ia': 7, 'leitura-de-campanha': 7, 'criativo-em-escala': 6, 'canva-que-vende': 6, 'edicao-que-segura': 6, 'linha-editorial': 6, 'agencia-de-bolso': 6, 'evento-presencial': 6, 'pagina-que-converte': 5, 'roteiro-que-prende': 5, 'imagem-com-ia': 5, 'paginas-com-ia': 5, 'grana-em-ordem': 5, 'dado-nao-mente': 4, 'lancamento-desafio': 4, 'um-por-cento-ao-dia': 4, 'jogos-com-ia': 4, 'mei-sem-misterio': 4, 'obs-na-pratica': 3, 'sem-sumir-de-casa': 3 };
    var soonList = S.Courses.filter(function (c) { return c.status === 'coming_soon'; });
    S.Users.forEach(function (u, ui) {
      if (u === iara || u === admin || !/student/.test(u.roles)) return;
      var mine = (u.my_list || '').split(',').filter(Boolean);
      soonList.forEach(function (c, ci) { if (((ui * 31 + ci * 17) % 20) < (INTEREST[c.slug] || 2) && mine.indexOf(c.id) < 0) mine.push(c.id); });
      u.my_list = mine.join(',');
    });
    return S;
  }

  /* ---------- depois de semear: os leads vão para o BRASA CRM e um vendedor fecha com condição especial ---------- */
  function postSeed() {
    var app = w.BrasaLogic(env);
    app.syncLeads();
    function tok(email, as) { var r = app.handle({ action: 'login', email: email, password: 'brasa123', as: as }); return r.ok ? r.data.token : ''; }
    var adm = tok('admin@brasa.demo', 'admin');
    // um carrinho abandonado que o closer do CRM recuperou com uma condição especial
    var cart = (db.Leads || []).filter(function (l) { return (l.source === 'abandoned' || l.source === 'pix_expired') && l.email; })[0];
    var c = cart && (db.Courses || []).filter(function (x) { return x.id === cart.course_id; })[0];
    if (cart && c && c.status === 'published') {
      var off = app.handle({ action: 'bridgeOffer', key: PONTE_CHAVE, course: c.slug, price: Math.ceil(c.price * 0.8 / 10) * 10 - 3, hours: 24, seller_email: 'vendas@brasa.demo', seller_name: 'Rafa Monteiro', email: cart.email, name: cart.name, note: 'Recuperação de carrinho' });
      if (off.ok) {
        var co = app.handle({ action: 'checkout', course_id: c.id, name: cart.name, email: cart.email, phone: cart.phone, method: 'pix', offer: off.data.code, src: 'page' });
        if (co.ok) w.BrasaDemo.pay(co.data.order_id);
      }
    }
    var inactive = (app.handle({ action: 'adminStudents', token: adm, inactive_days: 14 }).data || {}).students || [];
    if (inactive[0]) app.handle({ action: 'adminLogContact', token: adm, user_id: inactive[0].id, channel: 'wa', template: 'wa_inactive', title: 'Faz tempo que não acessa', text: 'Oi! Faz um tempo que você não entra na plataforma. Posso te ajudar a retomar?' });
  }

  /* ---------- API pública da demo ---------- */
  var CREDS = { app: ['aluno@brasa.demo', 'brasa123'], admin: ['admin@brasa.demo', 'brasa123'], aff: ['afiliado@brasa.demo', 'brasa123'] };
  w.BrasaDemo = {
    creds: CREDS,
    call: function (body) {
      load();
      var app = w.BrasaLogic(env);
      var res = app.handle(body);
      save();
      return JSON.parse(JSON.stringify(res));
    },
    // aprova (ou recusa) o pagamento de um pedido como se o Mercado Pago tivesse avisado
    pay: function (orderId, status) {
      load();
      var app = w.BrasaLogic(env);
      var o = (db.Orders || []).filter(function (x) { return x.id === orderId; })[0];
      if (!o) return { ok: false };
      db.__payments = db.__payments || {};
      var pid = o.mp_payment_id && db.__payments[o.mp_payment_id] ? o.mp_payment_id : 'demo' + Math.floor(Math.random() * 1e10);
      var isCard = o.method === 'card';
      db.__payments[pid] = Object.assign(db.__payments[pid] || {}, {
        id: pid, status: status || 'approved', status_detail: status === 'rejected' ? 'cc_rejected_other_reason' : 'accredited', external_reference: orderId,
        transaction_amount: o.amount, payment_method_id: isCard ? 'master' : 'pix', payment_type_id: isCard ? 'credit_card' : 'bank_transfer',
        installments: isCard ? 3 : 1, fee_details: [{ amount: Math.round(o.amount * (isCard ? 0.0498 : 0.0099) * 100) / 100 }]
      });
      dirty = true;
      var r = app.webhook(pid);
      save();
      return r;
    },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} db = null; load(); },
    firstSlug: function () { load(); var c = (db.Courses || []).filter(function (x) { return x.status === 'published' && x.price > 0; }).sort(function (a, b) { return a.order - b.order; })[0]; return c ? c.slug : ''; },
    outbox: function () { load(); return (db.__outbox || []).slice(); },
    onBoot: function () { load(); }
  };
  load();
})(window);

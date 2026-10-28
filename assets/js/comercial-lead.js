/* =====================================================================
   BRASA · comercial-lead.js
   Ficha do lead (painel lateral / tela cheia no celular) e os modais do
   comercial: WhatsApp, agendar, anotar, condição especial, motivo de perda,
   novo lead. Também a tela Ofertas. Depende de comercial.js (window.CRM).
   ===================================================================== */
(function () {
  'use strict';

  var CRM = window.CRM, S = CRM.S;
  var E = CRM.E, ic = CRM.ic, money = CRM.money, first = CRM.first, busy = CRM.busy, isBusy = CRM.isBusy, fail = CRM.fail;
  var ACT = CRM.ACT, FORM = CRM.FORM, LIVE = CRM.LIVE, OPEN = CRM.OPEN, STAGES = CRM.STAGES, DAY = CRM.DAY;
  var api = CRM.api;

  var D = null;            // ficha aberta: { id, data, opener, req }
  var drawer = null;
  var cache = {};          // crmLead por id (20 s), para o WhatsApp dos cartões abrir rápido

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function sellerName(id) {
    if (!id) return '';
    if (S.me && id === S.me.id) return S.me.name;
    var s = ((S.meta && S.meta.sellers) || []).filter(function (x) { return x.id === id; })[0];
    return s ? s.name : '';
  }
  // aceita 397, 397,90, 1.234,56 e 397.90
  function parseMoney(v) {
    var s = String(v == null ? '' : v).replace(/[^\d.,]/g, '');
    if (!s) return NaN;
    if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
    else if (/\.\d{3}$/.test(s) && s.split('.').length > 1) s = s.replace(/\./g, '');
    return Math.round(parseFloat(s) * 100) / 100;
  }
  function inputMoney(v) { return v ? String(Number(v).toFixed(2)).replace('.', ',') : ''; }
  function localInput(ts) { return new Date(ts - 3 * 3600e3).toISOString().slice(0, 16); }
  function atTz(day, h, m) { return new Date(day + 'T' + pad(h) + ':' + pad(m) + ':00-03:00').getTime(); }

  function getLead(id, force) {
    var c = cache[id];
    if (!force && c && Date.now() - c.at < 20000) return Promise.resolve(c.data);
    return api('crmLead', { id: id }).then(function (d) { cache[id] = { at: Date.now(), data: d }; return d; });
  }
  CRM.getLead = getLead;

  // vendedor que mexe num lead da fila assume o lead antes (o ADM edita direto)
  function ensureOwned(l) {
    if (l && !l.seller_id && !CRM.isAdm()) {
      return api('crmClaim', { id: l.id }).then(function (r) {
        CRM.applyLead(r.lead);
        B.toast('Você assumiu ' + r.lead.name + '.', 'info', 2200);
        return r.lead;
      });
    }
    return Promise.resolve(l);
  }
  // depois de qualquer mudança: limpa o cache, atualiza a ficha aberta e os contadores
  function after(id) {
    delete cache[id];
    if (D && D.id === id) reload(true);
    CRM.touch();
  }
  function saveLead(l, patch, okMsg) {
    return ensureOwned(l).then(function () {
      return api('crmLeadSave', { lead: Object.assign({ id: l.id }, patch) });
    }).then(function (r) {
      CRM.applyLead(r.lead);
      if (D && D.id === l.id && D.data) { D.data.lead = r.lead; paint(); }
      if (okMsg) B.toast(okMsg, 'ok', 2400);
      after(l.id);
      return r.lead;
    }, function (e) { fail(e); throw e; });
  }
  CRM.saveLead = saveLead;

  /* ---------------------------------------------------------------
     WhatsApp: compositor do core, com os modelos e variáveis do lead
     --------------------------------------------------------------- */
  var BY_SOURCE = { abandoned: 'wa_lead_cart', pix_expired: 'wa_lead_cart', upsell: 'wa_lead_upsell', inactive: 'wa_lead_inactive' };
  function initialTpl(d) {
    var l = d.lead, keys = (d.templates || []).map(function (t) { return t.key; });
    var live = (d.offers || []).some(function (o) { return o.status === 'active'; });
    var pick = live && l.status === 'negotiating' ? 'wa_lead_offer' : BY_SOURCE[l.source] || '';
    return keys.indexOf(pick) > -1 ? pick : keys[0];
  }
  function logSent(id, x) {
    api('crmLog', { id: id, channel: 'wa', template: x.template, title: x.title, text: x.text }).then(function (r) {
      S.done[id] = true;
      CRM.applyLead(r.lead);
      B.toast('Contato registrado na ficha.', 'ok', 2400);
      // lead sem telefone: o número digitado no compositor fica guardado na ficha
      var nat = String(x.phone || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
      if (!r.lead.phone && /^\d{10,11}$/.test(nat)) {
        return api('crmLeadSave', { lead: { id: id, phone: nat } }).then(function (sv) {
          CRM.applyLead(sv.lead);
          B.toast('Número salvo na ficha.', 'ok', 2400);
        }, noop);
      }
    }).then(function () { after(id); }, fail);
  }
  CRM.openComposer = function (d, o) {
    o = o || {};
    return B.waComposer({
      name: d.lead.name, phone: d.lead.phone, templates: d.templates || (S.meta && S.meta.templates) || [],
      vars: o.vars || d.vars, initial: o.initial || initialTpl(d),
      onSent: function (x) { logSent(d.lead.id, x); }
    });
  };
  CRM.wa = function (id, btn) {
    if (btn && isBusy(btn)) return;
    if (btn) busy(btn, true);
    getLead(id).then(function (d) { if (btn) busy(btn, false); CRM.openComposer(d); }, function (e) { if (btn) busy(btn, false); fail(e); });
  };

  /* ---------------------------------------------------------------
     agendar o próximo contato (atalhos que salvam num toque)
     --------------------------------------------------------------- */
  function shortcuts() {
    var now = Date.now(), today = CRM.dayKey(now), tomorrow = CRM.dayKey(now + DAY), d3 = CRM.dayKey(now + 3 * DAY);
    return [
      { label: 'Em 1 hora', ts: now + 3600e3 },
      { label: 'Hoje, 18h', ts: atTz(today, 18, 0) },
      { label: 'Amanhã, 9h', ts: atTz(tomorrow, 9, 0) },
      { label: 'Em 3 dias', ts: atTz(d3, 9, 0) }
    ];
  }
  CRM.schedule = function (id, o) {
    var l = CRM.findLead(id) || (D && D.id === id && D.data && D.data.lead);
    if (l) openSched(l, id, o || {});
    else getLead(id).then(function (d) { openSched(d.lead, id, o || {}); }, fail);
  };
  function openSched(l, id, o) {
    var sc = shortcuts(), cur = l.next_at;
    var body = '<div class="com-sched"><p class="com-sched__who"><strong>' + E(l.name) + '</strong>' + (cur ? '<span>Marcado para ' + E(CRM.when(cur)) + '</span>' : '<span>Sem próximo contato marcado</span>') + '</p>' +
      '<div class="com-sched__grid">' + sc.map(function (s) {
        var past = s.ts <= Date.now() + 60000;
        return '<button type="button" class="com-sc" data-ts="' + s.ts + '"' + (past ? ' disabled' : '') + '><strong>' + E(s.label) + '</strong><span>' + E(past ? 'Já passou' : CRM.when(s.ts)) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="field"><label for="sc-dt">Outra data e hora</label><div class="com-sched__custom"><input class="input" id="sc-dt" type="datetime-local" value="' + localInput(sc[0].ts) + '" min="' + localInput(Date.now()) + '">' +
      '<button type="button" class="btn btn--primary" data-custom>Agendar</button></div><div class="err" data-err hidden></div></div>' +
      (cur ? '<button type="button" class="btn btn--link com-sched__none" data-none>Tirar o próximo contato</button>' : '') + '</div>';
    var m = B.modal({ title: o.title || 'Próximo contato', body: body, actions: [{ label: 'Fechar' }] });
    function save(ts) {
      var btns = B.$$('button', m.body);
      btns.forEach(function (b) { b.disabled = true; });
      saveLead(l, { next_at: ts }, ts ? 'Próximo contato: ' + CRM.when(ts) + '.' : 'Próximo contato removido.').then(function () {
        if (S.shown === 'hoje') { S.doneN++; delete S.done[id]; CRM.repaint(); }
        m.close();
        if (o.onDone) o.onDone();
      }, function () { btns.forEach(function (b) { b.disabled = false; }); });
    }
    B.on(m.body, 'click', '[data-ts]', function (ev, el) { save(Number(el.getAttribute('data-ts'))); });
    B.on(m.body, 'click', '[data-none]', function () { save(0); });
    B.on(m.body, 'click', '[data-custom]', function () {
      var v = B.$('#sc-dt', m.body).value, err = B.$('[data-err]', m.body);
      var ts = v ? new Date(v + ':00-03:00').getTime() : 0;
      if (!ts || isNaN(ts)) { err.textContent = 'Escolha a data e a hora.'; err.hidden = false; return; }
      if (ts <= Date.now()) { err.textContent = 'Escolha um horário que ainda não passou.'; err.hidden = false; return; }
      err.hidden = true;
      save(ts);
    });
  }

  /* ---------------------------------------------------------------
     motivo da perda
     --------------------------------------------------------------- */
  CRM.askLost = function (l) {
    return new Promise(function (res) {
      var chosen = '', done = false, reasons = (S.meta && S.meta.lost_reasons) || ['Outro motivo'];
      var m = B.modal({
        title: 'Por que perdeu?',
        body: '<p class="t-muted com-mb">Escolha o motivo para <strong>' + E(l.name) + '</strong>. Isso ajuda a ver onde as vendas escapam.</p>' +
          '<div class="com-reasons" role="radiogroup" aria-label="Motivo da perda">' + reasons.map(function (r) {
            return '<button type="button" class="com-reason" role="radio" aria-checked="false" data-r="' + E(r) + '">' + E(r) + '</button>';
          }).join('') + '</div><div class="err" data-err hidden>Escolha um motivo para continuar.</div>',
        actions: [
          { label: 'Cancelar', onClick: function () { done = true; res(null); } },
          { label: 'Marcar como perdido', kind: 'danger', icon: 'ban', onClick: function (mm) {
            if (!chosen) { B.$('[data-err]', mm.el).hidden = false; return false; }
            done = true; res(chosen);
          } }
        ],
        onClose: function () { if (!done) res(null); }
      });
      B.on(m.body, 'click', '.com-reason', function (ev, el) {
        chosen = el.getAttribute('data-r');
        B.$$('.com-reason', m.body).forEach(function (b) { var on = b === el; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
        B.$('[data-err]', m.body).hidden = true;
      });
    });
  };
  // mudar a etapa pela ficha: ganho confirma, perdido pede o motivo
  function stageChange(l, st) {
    if (st === l.status) return Promise.resolve();
    if (st === 'lost') return CRM.askLost(l).then(function (reason) { if (reason) return saveLead(l, { status: 'lost', lost_reason: reason }, l.name + ' foi para Perdido.'); });
    if (st === 'won') {
      return B.confirm({ title: 'Marcar como ganho?', text: l.name + ' vai para Ganho. Use quando a venda já foi fechada.', ok: 'Marcar como ganho' })
        .then(function (ok) { if (ok) return saveLead(l, { status: 'won' }, l.name + ' foi para Ganho.'); });
    }
    return saveLead(l, { status: st }, l.name + ' foi para ' + CRM.stageName(st) + '.');
  }

  /* ---------------------------------------------------------------
     novo lead e edição de dados
     --------------------------------------------------------------- */
  function leadModal(l) {
    var edit = !!l, adm = CRM.isAdm(), courses = (S.meta && S.meta.courses) || [];
    var sellerSel = '';
    if (adm && !edit) {
      sellerSel = '<div class="field"><label for="lf-seller">Responsável</label><select class="select" id="lf-seller"><option value="' + E(S.me.id) + '">Eu (administrador)</option><option value="">Fila (sem responsável)</option>' +
        ((S.meta.sellers || []).map(function (s) { return '<option value="' + E(s.id) + '">' + E(s.name) + '</option>'; }).join('')) + '</select></div>';
    }
    var body = '<form class="stack com-form" id="lf-form" novalidate>' +
      CRM.field({ name: 'name', label: 'Nome', ac: 'off', value: l && l.name, max: 120, ph: 'Nome completo' }) +
      CRM.field({ name: 'phone', label: 'WhatsApp', type: 'tel', ac: 'off', im: 'tel', value: l && B.fmt.phone(l.phone), max: 20, ph: '(00) 00000-0000' }) +
      CRM.field({ name: 'email', label: 'E-mail', type: 'email', ac: 'off', im: 'email', value: l && l.email, max: 120, ph: 'nome@email.com', extra: ' autocapitalize="none" spellcheck="false"' }) +
      '<div class="field"><label for="lf-course">Curso de interesse</label><select class="select" id="lf-course" name="course_id"><option value="">Sem curso definido</option>' +
        courses.map(function (c) { return '<option value="' + E(c.id) + '"' + (l && l.course_id === c.id ? ' selected' : '') + '>' + E(c.title) + ' · ' + E(B.fmt.money(c.price)) + '</option>'; }).join('') + '</select></div>' +
      (edit ? CRM.field({ name: 'value', label: 'Valor do negócio (R$)', im: 'decimal', value: inputMoney(l.value), max: 14, ph: '0,00' }) : '') + sellerSel +
      '<div class="err com-formerr" data-formerr role="alert" hidden></div>' +
      (edit ? '' : '<p class="hint">Informe o WhatsApp ou o e-mail. O valor do negócio vem do preço do curso.</p>') + '</form>';
    var m = B.modal({
      title: edit ? 'Editar dados' : 'Novo lead', body: body,
      actions: [{ label: 'Cancelar' }, { label: edit ? 'Salvar dados' : 'Criar lead', kind: 'primary', icon: 'check', onClick: function () { return submit(); } }]
    });
    var f = B.$('#lf-form', m.el);
    f.addEventListener('submit', function (ev) { ev.preventDefault(); B.$('[data-act="1"]', m.el).click(); });
    function submit() {
      CRM.clearErrs(f);
      var d = B.formData(f), name = String(d.name || '').trim(), phone = String(d.phone || '').replace(/\D/g, ''), email = String(d.email || '').trim();
      if (name.length < 2) { CRM.fieldErr(f, 'name', 'Informe o nome.'); return false; }
      if (!phone && !email) { CRM.fieldErr(f, 'phone', 'Informe o WhatsApp ou o e-mail.'); return false; }
      if (phone && (phone.length < 10 || phone.length > 13)) { CRM.fieldErr(f, 'phone', 'Informe o WhatsApp com DDD. Exemplo: (85) 99999-0000.'); return false; }
      if (email && !B.validEmail(email)) { CRM.fieldErr(f, 'email', 'Esse e-mail parece incompleto. Exemplo: nome@email.com.'); return false; }
      var lead = { name: name, phone: phone, email: email, course_id: B.$('#lf-course', m.el).value };
      if (edit) {
        var v = parseMoney(d.value);
        if (String(d.value || '').trim() && (isNaN(v) || v < 0)) { CRM.fieldErr(f, 'value', 'Informe um valor válido. Exemplo: 497,00.'); return false; }
        lead.id = l.id; if (!isNaN(v)) lead.value = v;
        return ensureOwned(l).then(function () { return api('crmLeadSave', { lead: lead }); }).then(function (r) {
          CRM.applyLead(r.lead);
          if (D && D.id === l.id && D.data) { D.data.lead = r.lead; paint(); }
          B.toast('Dados salvos.', 'ok', 2200); after(l.id);
        }, function (e) { CRM.formErr(f, e.message); return false; });
      }
      var sel = B.$('#lf-seller', m.el);
      if (sel) lead.seller_id = sel.value;
      return api('crmLeadSave', { lead: lead }).then(function (r) {
        B.toast('Lead criado. Agora é só chamar.', 'ok', 2600);
        CRM.touch();
        setTimeout(function () { CRM.go('/lead/' + r.lead.id); }, 60);
      }, function (e) { CRM.formErr(f, e.message); return false; });
    }
  }
  CRM.newLead = function () { leadModal(null); };

  /* ---------------------------------------------------------------
     anotação
     --------------------------------------------------------------- */
  CRM.note = function (id) {
    var l = (D && D.id === id && D.data && D.data.lead) || CRM.findLead(id);
    var m = B.modal({
      title: 'Anotação',
      body: '<div class="field"><label for="nt-text">O que aconteceu' + (l ? ' com ' + E(first(l.name)) : '') + '?</label>' +
        '<textarea class="textarea" id="nt-text" rows="5" maxlength="2000" placeholder="Ex.: pediu para ligar depois das 18h. Quer pagar no cartão."></textarea>' +
        '<div class="hint">Fica na linha do tempo do lead, com o seu nome. Ctrl + Enter salva.</div><div class="err" data-err hidden></div></div>',
      actions: [{ label: 'Cancelar' }, { label: 'Salvar anotação', kind: 'primary', icon: 'check', onClick: function () { return save(); } }]
    });
    var ta = B.$('#nt-text', m.el);
    ta.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); B.$('[data-act="1"]', m.el).click(); } });
    function save() {
      var text = ta.value.trim(), err = B.$('[data-err]', m.el);
      if (!text) { err.textContent = 'Escreva a anotação.'; err.hidden = false; ta.focus(); return false; }
      return api('crmNote', { id: id, text: text }).then(function (r) {
        B.toast('Anotação salva.', 'ok', 2000);
        if (D && D.id === id && D.data) { D.data.activities.unshift(r.activity); D.data.lead.note = text; paint(); }
        after(id);
      }, function (e) { err.textContent = e.message; err.hidden = false; return false; });
    }
  };

  /* ---------------------------------------------------------------
     condição especial: preço dentro do limite, validade, link
     --------------------------------------------------------------- */
  CRM.offer = function (id) {
    var p = D && D.id === id && D.data ? Promise.resolve(D.data) : getLead(id);
    p.then(offerModal, fail);
  };
  function offerModal(d) {
    var l = d.lead, me = S.me, courses = (S.meta && S.meta.courses) || [], adm = !!me.is_admin;
    var maxD = adm ? 100 : Number(me.max_discount) || 0;
    if (!courses.length) { B.toast('Não há cursos publicados para criar a condição.', 'bad'); return; }
    var cid = courses.some(function (c) { return c.id === l.course_id; }) ? l.course_id : courses[0].id;
    var pcts = [5, 10, 15, 20, 25, 30, 40, 50].filter(function (p) { return p <= maxD; });
    var body = '<div class="stack com-offerform">' +
      '<div class="field"><label for="of-course">Curso</label><select class="select" id="of-course">' + courses.map(function (c) {
        return '<option value="' + E(c.id) + '"' + (c.id === cid ? ' selected' : '') + '>' + E(c.title) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="com-ofnums"><div class="field com-ofnums__n"><span class="label">Preço normal</span><strong class="t-num" id="of-normal"></strong></div>' +
        '<div class="field"><label for="of-price">Preço da condição</label><div class="input-group"><span class="addon">R$</span><input class="input" id="of-price" inputmode="decimal" autocomplete="off" placeholder="0,00"></div></div></div>' +
      (pcts.length ? '<div class="com-pcts" role="group" aria-label="Aplicar desconto pronto">' + pcts.map(function (p) { return '<button type="button" class="com-pct" data-p="' + p + '">-' + p + '%</button>'; }).join('') +
        (!adm && pcts.indexOf(maxD) < 0 ? '<button type="button" class="com-pct com-pct--max" data-p="' + maxD + '">Máximo -' + B.fmt.num(maxD) + '%</button>' : '') + '</div>' : '') +
      '<div class="com-meter" id="of-meter" aria-hidden="true"><span></span></div><div class="com-ofinfo" id="of-info" role="status" aria-live="polite"></div>' +
      '<div class="field"><span class="label">Validade</span><div class="seg com-hours" role="group" aria-label="Validade da condição">' +
        [24, 48, 72].map(function (h) { return '<button type="button" data-h="' + h + '" class="' + (h === 48 ? 'is-active' : '') + '" aria-pressed="' + (h === 48) + '">' + h + ' horas</button>'; }).join('') +
        '<button type="button" data-h="0" aria-pressed="false">Outro</button></div>' +
        '<div class="com-hours__custom" hidden><div class="input-group"><input class="input" id="of-hours" inputmode="numeric" maxlength="3" placeholder="Quantas horas?" aria-label="Validade em horas"><span class="addon addon--end">horas</span></div></div>' +
        '<div class="hint" id="of-until"></div></div>' +
      (l.email ? '<label class="check"><input type="checkbox" id="of-lock" checked><span>Só vale para o e-mail <strong>' + E(l.email) + '</strong></span></label>'
        : '<p class="hint">Este lead não tem e-mail cadastrado. O link vale para qualquer pessoa que receber.</p>') +
      '<div class="field"><label for="of-note">Observação interna <span class="com-opt">opcional</span></label><input class="input" id="of-note" maxlength="200" placeholder="Ex.: combinado pelo WhatsApp"></div>' +
      '<div class="co-err" id="of-err" role="alert" hidden></div></div>';
    var m = B.modal({
      title: 'Condição especial', body: body,
      actions: [{ label: 'Cancelar' }, { label: 'Criar condição', kind: 'primary', icon: 'tag', onClick: function () { return create(); } }]
    });
    var hours = 48;
    function $(s) { return B.$(s, m.el); }
    function course() { return courses.filter(function (c) { return c.id === $('#of-course').value; })[0] || courses[0]; }
    function setPrice(v) { $('#of-price').value = String(v.toFixed(2)).replace('.', ','); }
    function pctPrice(p) { return Math.ceil(course().price * (1 - p / 100)); }
    function calc() {
      var c = course(), normal = Number(c.price) || 0, price = parseMoney($('#of-price').value);
      var disc = normal > 0 && price > 0 ? (normal - price) / normal * 100 : 0;
      var min = Math.ceil(normal * (1 - maxD / 100) * 100) / 100, st = 'ok', msg, fix = 0;
      $('#of-normal').textContent = B.fmt.money(normal);
      if (isNaN(price) || price <= 0) { st = 'idle'; msg = 'Informe o valor da condição ou use um desconto pronto.'; }
      else if (price > normal) { st = 'bad'; fix = normal; msg = 'A condição não pode passar do preço normal.'; }
      else if (disc > maxD + 0.01) { st = 'bad'; fix = min; msg = 'Passou do seu limite de ' + B.fmt.num(maxD) + '%.'; }
      else msg = (disc > 0 ? B.fmt.num(disc) + '% de desconto. O lead economiza ' + B.fmt.money(normal - price) + '.' : 'Sem desconto: o lead paga o preço normal, mas com prazo para decidir.');
      var info = $('#of-info');
      info.className = 'com-ofinfo is-' + st;
      info.innerHTML = '<div class="com-ofinfo__m">' + ic(st === 'bad' ? 'alert' : st === 'ok' ? 'check' : 'info') + '<span>' + E(msg) + '</span>' +
        (fix ? '<button type="button" class="btn btn--sm com-fix" data-fix="' + fix + '">Usar ' + E(B.fmt.money(fix)) + '</button>' : '') + '</div>' +
        '<div class="com-ofinfo__l">' + (adm ? 'Administrador: sem limite de desconto.' : 'Seu limite: <b class="t-num">' + E(B.fmt.num(maxD)) + '%</b> · menor preço permitido: <b class="t-num">' + E(B.fmt.money(min)) + '</b>') + '</div>';
      var meter = $('#of-meter');
      meter.hidden = adm || !(maxD > 0);
      meter.className = 'com-meter' + (st === 'bad' ? ' is-bad' : '');
      B.$('span', meter).style.width = (maxD > 0 ? Math.max(0, Math.min(100, disc / maxD * 100)) : 0) + '%';
      var h = hours || Number($('#of-hours').value) || 0;
      $('#of-until').textContent = h >= 1 && h <= 720 ? 'Vale até ' + B.fmt.datetime(Date.now() + h * 3600e3) + '.' : 'Informe de 1 a 720 horas.';
      return { st: st, msg: msg, price: price };
    }
    function defaults() { var p = Math.min(10, maxD); if (p > 0) setPrice(pctPrice(p)); else setPrice(Number(course().price) || 0); calc(); }
    m.body.addEventListener('input', function (ev) { if (ev.target.id === 'of-price' || ev.target.id === 'of-hours') calc(); });
    $('#of-course').addEventListener('change', defaults);
    B.on(m.body, 'click', '.com-pct', function (ev, el) { setPrice(pctPrice(Number(el.getAttribute('data-p')))); calc(); });
    B.on(m.body, 'click', '[data-h]', function (ev, el) {
      hours = Number(el.getAttribute('data-h'));
      B.$$('[data-h]', m.body).forEach(function (b) { var on = b === el; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
      B.$('.com-hours__custom', m.body).hidden = hours !== 0;
      if (!hours) $('#of-hours').focus();
      calc();
    });
    defaults();
    function show(msg) {
      var err = $('#of-err');
      err.innerHTML = ic('alert') + '<span>' + E(msg) + '</span>';
      err.hidden = false;
      try { err.scrollIntoView({ block: 'nearest' }); } catch (e) {}
      return false;
    }
    B.on(m.body, 'click', '[data-fix]', function (ev, el) {
      setPrice(Number(el.getAttribute('data-fix')));
      $('#of-err').hidden = true;
      calc();
      $('#of-price').focus();
    });
    function create() {
      $('#of-err').hidden = true;
      var r = calc(), h = hours || Number($('#of-hours').value);
      if (r.st === 'idle') return show('Informe o valor da condição.');
      if (r.st === 'bad') {
        var box = $('#of-info');
        box.classList.remove('is-flash'); void box.offsetWidth; box.classList.add('is-flash');
        try { box.scrollIntoView({ block: 'nearest' }); } catch (e) {}
        $('#of-price').focus();
        return false;
      }
      if (!(h >= 1 && h <= 720)) return show('Informe a validade em horas, de 1 a 720.');
      var lock = $('#of-lock');
      return api('crmOffer', { lead_id: l.id, course_id: course().id, price: r.price, hours: h, lock_email: !!(lock && lock.checked), note: $('#of-note').value.trim() }).then(function (res) {
        delete cache[l.id];
        showResult(d, res);
        after(l.id);
      }, function (e) { return show(e.message); });
    }
  }
  function emailOffer(offerId, btn) {
    if (isBusy(btn)) return;
    busy(btn, true);
    api('crmOfferEmail', { offer_id: offerId }).then(function (r) {
      busy(btn, false);
      if (r.sent) { B.toast('E-mail enviado com a condição.', 'ok', 2800); if (D) reload(true); }
      else B.toast('O e-mail não saiu agora. Copie o link e envie pelo WhatsApp.', 'bad', 5200);
    }, function (e) { busy(btn, false); fail(e); });
  }
  function showResult(d, r) {
    var of = r.offer, l = d.lead, off = of.normal_price > 0 ? Math.round((of.normal_price - of.price) / of.normal_price * 1000) / 10 : 0;
    var m = B.modal({
      title: 'Condição criada',
      body: '<div class="stack com-ofr"><div class="com-ofr__sum"><span class="com-ofr__ok">' + ic('check') + 'Link pronto para enviar</span><strong class="com-ofr__c">' + E(of.course_title) + '</strong>' +
        '<div class="com-ofr__price"><b class="t-num">' + money(of.price) + '</b>' + (of.normal_price > of.price ? '<s class="t-num">' + money(of.normal_price) + '</s><span class="chip chip--ok">' + E(B.fmt.num(off)) + '% off</span>' : '') + '</div>' +
        '<div class="com-ofr__meta">Vale até ' + E(B.fmt.datetime(of.expires_at)) + ' · uso único' + (of.email ? ' · só para o e-mail de ' + E(first(l.name)) : '') + '</div></div>' +
        '<div class="field"><label for="ofr-link">Link da condição</label><div class="com-ofr__link"><input class="input" id="ofr-link" readonly value="' + E(of.link) + '"><button type="button" class="btn" data-copy-link>' + ic('copy') + 'Copiar link</button></div></div>' +
        '<div class="com-ofr__btns"><button type="button" class="btn btn--primary" data-wa>' + ic('whatsapp') + 'Enviar pelo WhatsApp</button>' +
        '<button type="button" class="btn" data-mail' + (l.email ? '' : ' disabled') + '>' + ic('mail') + 'Enviar por e-mail</button></div>' +
        (l.email ? '' : '<p class="hint">Sem e-mail cadastrado: copie o link ou use o WhatsApp.</p>') + '</div>',
      actions: [{ label: 'Fechar', kind: 'primary' }]
    });
    var vars = r.vars || d.vars;
    B.$('#ofr-link', m.el).addEventListener('focus', function (ev) { ev.target.select(); });
    B.on(m.body, 'click', '[data-copy-link]', function (ev, el) { B.copy(of.link, el); });
    B.on(m.body, 'click', '[data-wa]', function () { CRM.openComposer(d, { vars: vars, initial: 'wa_lead_offer' }); });
    B.on(m.body, 'click', '[data-mail]', function (ev, el) { emailOffer(of.id, el); });
    B.toast('Condição criada. O lead foi para Negociando.', 'ok', 3200);
    CRM.openComposer(d, { vars: vars, initial: 'wa_lead_offer' });
  }
  ACT['o-mail'] = function (t) { emailOffer(t.getAttribute('data-id'), t); };

  /* ===============================================================
     FICHA DO LEAD (/lead/:id)
     =============================================================== */
  var ORDER_ST = { approved: ['ok', 'check', 'Pago'], pending: ['warn', 'clock', 'Pendente'], expired: ['', 'clock', 'Expirado'], rejected: ['bad', 'x', 'Recusado'], refunded: ['bad', 'refresh', 'Reembolsado'], chargeback: ['bad', 'alert', 'Contestado'], failed: ['bad', 'x', 'Falhou'] };
  var METHOD = { pix: 'Pix', card: 'Cartão', free: 'Grátis' };
  var ENROLL = { purchase: 'Compra', grant: 'Liberado', admin: 'Liberado', free: 'Grátis', bonus: 'Bônus', bump: 'Bônus', upsell: 'Compra' };
  var TL_ICON = { created: 'sparkles', assign: 'user', status: 'layers', note: 'note', wa: 'whatsapp', email: 'mail', link: 'tag', sale: 'money', followup: 'calendar' };
  var TL_LABEL = { created: 'Lead criado', assign: 'Responsável', status: 'Etapa', note: 'Anotação', wa: 'WhatsApp', email: 'E-mail', link: 'Condição especial', sale: 'Venda', followup: 'Próximo contato' };
  function noop() {}

  function build() {
    drawer = B.el('div', { class: 'com-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'd-title', hidden: true });
    drawer.innerHTML = '<div class="com-drawer__veil" data-act="d-close"></div><div class="com-drawer__panel" tabindex="-1"></div>';
    document.body.appendChild(drawer);
    drawer.addEventListener('keydown', trap);
  }
  function panel() { return drawer ? B.$('.com-drawer__panel', drawer) : null; }
  function trap(ev) {
    if (ev.key !== 'Tab') return;
    var items = B.$$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', drawer)
      .filter(function (n) { return n.offsetParent !== null; });
    if (!items.length) return;
    var a = items[0], z = items[items.length - 1], cur = document.activeElement;
    if (ev.shiftKey && (cur === a || cur === panel())) { ev.preventDefault(); z.focus(); }
    else if (!ev.shiftKey && cur === z) { ev.preventDefault(); a.focus(); }
  }
  // Esc fecha a ficha, mas só se não houver modal por cima (o modal fecha primeiro)
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && CRM.drawerOpen() && !document.querySelector('.modal-root')) { ev.preventDefault(); CRM.closeDrawer(false); }
  }, true);

  CRM.drawerOpen = function () { return !!(drawer && !drawer.hidden); };
  CRM.openLead = function (id) {
    if (!drawer) build();
    var same = D && D.id === id && CRM.drawerOpen();
    if (!same) {
      D = { id: id, data: null, req: 0, opener: document.activeElement };
      drawer.hidden = false;
      document.documentElement.classList.add('com-lead-open');
      var c = cache[id] && Date.now() - cache[id].at < 20000 ? cache[id].data : null;
      if (c) { D.data = c; paint(); } else loadingPaint();
      try { panel().focus({ preventScroll: true }); } catch (e) {}
    }
    reload(!!(D && D.data));
  };
  CRM.closeDrawer = function (silent) {
    if (!drawer || drawer.hidden) return;
    drawer.hidden = true;
    document.documentElement.classList.remove('com-lead-open');
    var op = D && D.opener, id = D && D.id;
    D = null;
    if (!silent) {
      S.softBack = true;
      if (S.leadPushed) { S.leadPushed = false; history.back(); } else B.router.go('/', { replace: true });
    }
    setTimeout(function () {
      var again = id && document.querySelector('.com-card[data-id="' + id + '"], .com-row__main[data-id="' + id + '"]');
      var el = op && document.body.contains(op) && op !== document.body ? op : again;
      if (el && el.focus) { try { el.focus({ preventScroll: true }); } catch (e) {} }
    }, 200);
  };
  function reload(silent) {
    if (!D) return;
    var id = D.id, req = ++D.req;
    api('crmLead', { id: id }).then(function (d) {
      cache[id] = { at: Date.now(), data: d };
      if (!D || D.id !== id || req !== D.req) return;
      D.data = d;
      paint();
    }, function (e) {
      if (!D || D.id !== id || req !== D.req || e.code === 'AUTH') return;
      if (!D.data) { B.toast(e.code === 'NOT_FOUND' ? 'Esse lead não existe mais ou é de outro vendedor.' : e.message, 'bad', 5200); CRM.closeDrawer(false); }
      else if (!silent) fail(e);
    });
  }
  function loadingPaint() {
    panel().innerHTML = '<header class="com-dh"><button type="button" class="iconbtn com-dh__back" data-act="d-close" aria-label="Voltar para a lista">' + ic('left') + '</button>' +
      '<div class="com-dh__txt"><h2 class="com-dh__name" id="d-title">Carregando ficha</h2></div><div class="com-dh__end"><button type="button" class="iconbtn com-dh__x" data-act="d-close" aria-label="Fechar a ficha">' + ic('x') + '</button></div></header>' +
      '<div class="com-db" aria-busy="true"><div class="com-db__in"><div class="com-skel">' + CRM.sk(70) + CRM.sk(220) + CRM.sk(180) + '</div></div></div>';
  }
  function paint() {
    var d = D && D.data, p = panel();
    if (!d || !p) return;
    CRM.keepFocus(p, function () {
      var old = B.$('.com-db', p), top = old ? old.scrollTop : 0;
      p.innerHTML = headHtml(d) + actsHtml() + bodyHtml(d);
      var nb = B.$('.com-db', p);
      if (nb && top) nb.scrollTop = top;
    });
  }

  function headHtml(d) {
    var l = d.lead, res = OPEN[l.status]
      ? '<button type="button" class="btn btn--sm com-res com-res--won" data-act="d-won">' + ic('check') + 'Ganho</button><button type="button" class="btn btn--sm com-res com-res--lost" data-act="d-lost">' + ic('ban') + 'Perdido</button>' : '';
    return '<header class="com-dh"><button type="button" class="iconbtn com-dh__back" data-act="d-close" aria-label="Voltar para a lista">' + ic('left') + '</button>' +
      '<div class="com-dh__txt"><div class="com-dh__chips">' + CRM.stageChip(l.status) + CRM.srcChip(l) + CRM.dueChip(l) + '</div>' +
      '<h2 class="com-dh__name" id="d-title">' + E(l.name) + '</h2>' +
      '<p class="com-dh__sub">' + E(l.course_title || 'Sem curso definido') + (l.value > 0 ? ' · <b class="t-num">' + money(l.value) + '</b>' : '') + '</p></div>' +
      '<div class="com-dh__end">' + res + '<button type="button" class="iconbtn com-dh__x" data-act="d-close" aria-label="Fechar a ficha">' + ic('x') + '</button></div></header>';
  }
  function big(act, icon, label, cls) { return '<button type="button" class="com-big ' + (cls || '') + '" data-act="' + act + '">' + ic(icon) + '<span>' + label + '</span></button>'; }
  function actsHtml() {
    return '<div class="com-acts" role="group" aria-label="Ações principais">' + big('d-wa', 'whatsapp', 'WhatsApp', 'com-big--wa') + big('d-offer', 'tag', 'Condição especial') +
      big('d-sched', 'calendar', 'Agendar contato') + big('d-note', 'note', 'Anotação') + '</div>';
  }
  function sec(cls, title, icon, inner, right) {
    return '<section class="com-blk ' + cls + '"><header class="com-blk__head">' + ic(icon) + '<h3>' + E(title) + '</h3>' + (right || '') + '</header>' + inner + '</section>';
  }
  function mini(act, icon, label, extra) { return '<button type="button" class="com-mini" data-act="' + act + '" aria-label="' + E(label) + '" ' + (extra || '') + '>' + ic(icon) + '</button>'; }
  function copyMini(text, label) { return mini('copy', 'copy', label, 'data-copy="' + E(text) + '"'); }

  function bannerHtml(d) {
    var l = d.lead;
    if (!l.seller_id && !CRM.isAdm()) {
      return '<div class="com-banner com-banner--claim">' + ic('inbox') + '<div><strong>Este lead está na fila</strong><span>Assuma para trabalhar nele. Se você mandar uma mensagem, ele já fica com você.</span></div>' +
        '<button type="button" class="btn btn--sm btn--primary" data-act="d-claim">' + ic('plus') + 'Assumir lead</button></div>';
    }
    if (l.status === 'won') {
      return '<div class="com-banner com-banner--won">' + ic('check') + '<div><strong>Lead ganho</strong><span>' + (l.order_id ? 'A venda está nos pedidos abaixo.' : 'Marcado como ganho.') + '</span></div><button type="button" class="btn btn--sm btn--ghost" data-act="d-reopen">Reabrir</button></div>';
    }
    if (l.status === 'lost') {
      return '<div class="com-banner com-banner--lost">' + ic('ban') + '<div><strong>Lead perdido</strong><span>Motivo: ' + E(l.lost_reason || 'não informado') + '. Uma condição especial pode reabrir a conversa.</span></div><button type="button" class="btn btn--sm btn--ghost" data-act="d-reopen">Reabrir</button></div>';
    }
    return '';
  }
  function kvRow(label, html) { return '<div class="com-kv__r"><dt>' + E(label) + '</dt><dd>' + html + '</dd></div>'; }
  function dataBlk(d) {
    var l = d.lead, adm = CRM.isAdm();
    var phone = l.phone ? '<span class="com-seltxt">' + E(B.fmt.phone(l.phone)) + '</span><span class="com-kv__btns">' + copyMini(B.fmt.phone(l.phone), 'Copiar o WhatsApp') + mini('d-wa', 'whatsapp', 'Abrir o WhatsApp de ' + l.name, '') + '</span>' : '<span class="t-faint">Não informado</span>';
    var mail = l.email ? '<span class="com-seltxt">' + E(l.email).replace(/@/g, '@<wbr>') + '</span><span class="com-kv__btns">' + copyMini(l.email, 'Copiar o e-mail') + '<a class="com-mini" href="mailto:' + E(l.email) + '" aria-label="Escrever para ' + E(l.name) + ' por e-mail">' + ic('mail') + '</a></span>' : '<span class="t-faint">Não informado</span>';
    var stage = '<select class="select com-sel-sm" data-live="d-stage" aria-label="Etapa do lead">' + STAGES.map(function (s) { return '<option value="' + s + '"' + (l.status === s ? ' selected' : '') + '>' + E(CRM.stageName(s)) + '</option>'; }).join('') + '</select>';
    var owner;
    if (adm) {
      var opts = [['', 'Sem responsável (fila)'], [S.me.id, 'Eu (administrador)']].concat(((S.meta && S.meta.sellers) || []).map(function (s) { return [s.id, s.name]; }));
      if (l.seller_id && !opts.some(function (o) { return o[0] === l.seller_id; })) opts.push([l.seller_id, l.seller_name || 'Outro responsável']);
      owner = '<select class="select com-sel-sm" data-live="d-seller" aria-label="Responsável pelo lead">' + opts.map(function (o) { return '<option value="' + E(o[0]) + '"' + ((l.seller_id || '') === o[0] ? ' selected' : '') + '>' + E(o[1]) + '</option>'; }).join('') + '</select>';
    } else owner = l.seller_id ? E(l.seller_name || 'Você') : '<span class="t-faint">Ninguém ainda</span>';
    var due = OPEN[l.status] ? (CRM.dueChip(l) || '') + '<button type="button" class="btn btn--sm btn--ghost com-kv__go" data-act="d-sched">' + ic('calendar') + (l.next_at ? 'Mudar' : 'Agendar') + '</button>' : '<span class="t-faint">Encerrado</span>';
    return sec('com-blk--dados', 'Dados do lead', 'file',
      '<dl class="com-kv">' + kvRow('WhatsApp', phone) + kvRow('E-mail', mail) + kvRow('Etapa', stage) + kvRow('Responsável', owner) + kvRow('Próximo contato', due) +
      kvRow('Origem', CRM.srcChip(l) + '<span class="t-faint t-xs">entrou ' + E(B.fmt.rel(l.created_at)) + '</span>') +
      kvRow('Valor', l.value > 0 ? '<b class="t-num">' + money(l.value) + '</b>' : '<span class="t-faint">Sem valor</span>') + '</dl>',
      '<button type="button" class="btn btn--sm btn--ghost" data-act="d-edit">' + ic('edit') + 'Editar</button>');
  }
  function resultBlk(d) {
    if (!OPEN[d.lead.status]) return '';
    return '<section class="com-blk com-blk--result"><div class="com-result"><button type="button" class="btn com-res com-res--won" data-act="d-won">' + ic('check') + 'Marcar como ganho</button>' +
      '<button type="button" class="btn com-res com-res--lost" data-act="d-lost">' + ic('ban') + 'Marcar como perdido</button></div></section>';
  }
  function offerRow(o, l) {
    var st = o.status, off = o.normal_price > o.price ? Math.round((o.normal_price - o.price) / o.normal_price * 100) : 0;
    var chip = st === 'active' ? CRM.chip('warn', 'clock', 'Ativa') : st === 'used' ? CRM.chip('ok', 'check', 'Usada') : CRM.chip('', 'x', 'Expirada');
    var exp = st === 'active' ? '<span data-exp="' + Number(o.expires_at) + '" data-live-exp="1">' + E(CRM.expText(o.expires_at)) + '</span>' : st === 'used' ? 'Usada em uma venda' : E(CRM.expText(o.expires_at));
    return '<li class="com-of com-of--' + st + '"><div class="com-of__main"><strong>' + E(o.course_title) + '</strong>' +
      '<span class="com-of__price"><b class="t-num">' + money(o.price) + '</b>' + (off ? ' <s class="t-num">' + money(o.normal_price) + '</s> · ' + off + '% off' : '') + '</span>' +
      '<span class="com-of__exp">' + exp + '</span></div><div class="com-of__end">' + chip +
      (st === 'active' ? copyMini(o.link, 'Copiar o link da condição') + (l.email ? mini('o-mail', 'mail', 'Enviar a condição por e-mail', 'data-id="' + E(o.id) + '"') : '') : '') + '</div></li>';
  }
  function offersBlk(d) {
    var of = d.offers || [];
    return sec('com-blk--ofertas', 'Condições enviadas', 'tag',
      of.length ? '<ul class="com-list">' + of.map(function (o) { return offerRow(o, d.lead); }).join('') + '</ul>' : '<p class="com-mute">Nenhuma condição enviada ainda. Um preço com prazo dá um motivo para fechar hoje.</p>',
      '<button type="button" class="btn btn--sm btn--ghost" data-act="d-offer">' + ic('plus') + 'Nova</button>');
  }
  function personBlk(d) {
    var p = d.person;
    if (!p) return sec('com-blk--pessoa', 'Quem é', 'user', '<p class="com-mute">Ainda não tem cadastro na plataforma. Quando comprar, os cursos e o progresso aparecem aqui.</p>');
    var meta = [p.last_seen ? 'Último acesso ' + B.fmt.rel(p.last_seen) : 'Nunca acessou', 'Nível ' + p.level, 'Cadastro em ' + B.fmt.date(p.created_at)];
    var cs = (p.courses || []).map(function (c) {
      return '<li class="com-pc"><div class="com-pc__top"><strong>' + E(c.title) + '</strong><span class="t-num">' + E(B.fmt.pct(c.pct, 0)) + '</span></div>' +
        '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(c.pct) + '" aria-label="Progresso em ' + E(c.title) + '"><div class="bar__fill" style="--p:' + Math.min(100, Math.max(0, c.pct)) + '%"></div></div>' +
        '<div class="com-pc__sub">' + (c.pct >= 100 ? 'Concluído' : c.next_label ? 'Próxima aula: ' + E(c.next_label) : 'Ainda não começou') + ' · ' + E(ENROLL[c.source] || 'Acesso') + '</div></li>';
    }).join('');
    return sec('com-blk--pessoa', 'Quem é', 'user', '<div class="com-pp__meta">' + meta.map(function (x) { return '<span>' + E(x) + '</span>'; }).join('') +
      (p.has_password ? '' : CRM.chip('warn', 'key', 'Ainda sem senha')) + '</div>' + (cs ? '<ul class="com-pcs">' + cs + '</ul>' : '<p class="com-mute">Tem cadastro, mas nenhum curso liberado.</p>'));
  }
  function ordersBlk(d) {
    var os = d.orders || [];
    return sec('com-blk--pedidos', 'Pedidos', 'cart', os.length ? '<ul class="com-list">' + os.map(function (o) {
      var s = ORDER_ST[o.status] || ['', 'info', o.status];
      return '<li class="com-oi"><div class="com-oi__main"><strong>' + E(o.course_title) + '</strong><span class="t-faint t-xs">' + E(B.fmt.dateShort(o.created_at)) + ' · ' + E(METHOD[o.method] || o.method || '') + '</span></div>' +
        '<div class="com-oi__end"><span class="t-num">' + money(o.amount) + '</span>' + CRM.chip(s[0], s[1], s[2]) + '</div></li>';
    }).join('') + '</ul>' : '<p class="com-mute">Nenhum pedido com este e-mail.</p>');
  }
  function tlItem(a) {
    var t = a.type, txt = String(a.text || ''), long = txt.length > 170 || txt.split('\n').length > 3;
    return '<li class="com-tl__i com-tl__i--' + E(t) + '"><span class="com-tl__ic" aria-hidden="true">' + ic(TL_ICON[t] || 'info') + '</span><div class="com-tl__b">' +
      '<div class="com-tl__meta"><b>' + E(TL_LABEL[t] || 'Registro') + '</b><span class="com-tl__who">' + E(a.by || 'Sistema') + '</span><time title="' + E(B.fmt.datetime(a.ts)) + '">' + E(B.fmt.rel(a.ts)) + '</time></div>' +
      '<div class="com-tl__txt' + (long ? ' is-clamp' : '') + '">' + B.nl2br(txt) + '</div>' +
      (long ? '<button type="button" class="btn btn--link com-tl__more" data-act="tl-more" aria-expanded="false">Ver tudo</button>' : '') + '</div></li>';
  }
  function timelineBlk(d) {
    var as = d.activities || [];
    return sec('com-blk--tl', 'Linha do tempo', 'clock', as.length ? '<ol class="com-tl">' + as.map(tlItem).join('') + '</ol>' : '<p class="com-mute">Sem histórico ainda.</p>');
  }
  function bodyHtml(d) {
    return '<div class="com-db"><div class="com-db__in">' + bannerHtml(d) + '<div class="com-db__grid"><div class="com-db__left">' +
      dataBlk(d) + resultBlk(d) + offersBlk(d) + personBlk(d) + ordersBlk(d) + '</div><div class="com-db__right">' + timelineBlk(d) + '</div></div></div></div>';
  }

  function curLead() { return D && D.data && D.data.lead; }
  ACT['d-close'] = function () { CRM.closeDrawer(false); };
  ACT['d-wa'] = function () { if (D && D.data) CRM.openComposer(D.data); };
  ACT['d-offer'] = function () { if (D) CRM.offer(D.id); };
  ACT['d-sched'] = function () { if (D) CRM.schedule(D.id); };
  ACT['d-note'] = function () { if (D) CRM.note(D.id); };
  ACT['d-edit'] = function () { var l = curLead(); if (l) leadModal(l); };
  ACT['d-won'] = function () { var l = curLead(); if (l) stageChange(l, 'won').catch(noop); };
  ACT['d-lost'] = function () { var l = curLead(); if (l) stageChange(l, 'lost').catch(noop); };
  ACT['d-reopen'] = function () { var l = curLead(); if (l) saveLead(l, { status: 'contact' }, l.name + ' foi reaberto e voltou para Em contato.').catch(noop); };
  ACT['d-claim'] = function (t) {
    var l = curLead();
    if (!l || isBusy(t)) return;
    busy(t, true);
    api('crmClaim', { id: l.id }).then(function (r) {
      CRM.applyLead(r.lead);
      if (D && D.data) { D.data.lead = r.lead; paint(); }
      B.toast('Você assumiu ' + r.lead.name + '.', 'ok', 2400);
      after(l.id);
    }, function (e) { busy(t, false); fail(e); });
  };
  ACT['tl-more'] = function (t) {
    var txt = t.previousElementSibling, open = txt.classList.contains('is-clamp');
    txt.classList.toggle('is-clamp', !open);
    t.textContent = open ? 'Ver menos' : 'Ver tudo';
    t.setAttribute('aria-expanded', open);
  };
  LIVE['d-stage'] = function (el) {
    var l = curLead();
    if (!l) return;
    var st = el.value;
    el.value = l.status;
    stageChange(l, st).catch(noop);
  };
  LIVE['d-seller'] = function (el) {
    var l = curLead();
    if (!l) return;
    var v = el.value;
    el.value = l.seller_id || '';
    if (v === (l.seller_id || '')) return;
    saveLead(l, { seller_id: v }, v ? 'Lead passado para ' + (sellerName(v) || 'o novo responsável') + '.' : 'Lead devolvido para a fila.').catch(noop);
  };

  /* ===============================================================
     OFERTAS (/ofertas): as condições especiais criadas
     =============================================================== */
  var OF_FILTERS = [['all', 'Todas'], ['active', 'Ativas'], ['used', 'Usadas'], ['expired', 'Expiradas']];
  var OF_RANK = { active: 0, used: 1, expired: 2 };

  CRM.viewOfertas = function () {
    var view = B.$('#view');
    if (!view) return;
    var sel = '';
    if (CRM.isAdm()) {
      sel = '<select class="select com-sel" data-live="of-seller" aria-label="Ver condições de">' + '<option value="">Time todo</option>' +
        ((S.meta && S.meta.sellers) || []).map(function (s) { return '<option value="' + E(s.id) + '"' + (S.offerSeller === s.id ? ' selected' : '') + '>' + E(s.name) + '</option>'; }).join('') + '</select>';
    }
    view.innerHTML = '<div class="com-page com-ofertas">' +
      CRM.head('ᛏ', 'Ofertas', CRM.isAdm() ? 'Condições especiais criadas pelo time.' : 'Condições especiais que você enviou. A que vence primeiro fica no topo.', sel) +
      '<div class="com-ofbar" id="of-bar"></div><div id="of-body" aria-live="polite"><div class="com-skel">' + CRM.sk(104) + CRM.sk(104) + CRM.sk(104) + '</div></div></div>';
    if (S.offers) paintOffers();
    CRM.loadOffers(false);
  };

  CRM.loadOffers = function (silent) {
    var req = S.offersReq = (S.offersReq || 0) + 1, adm = CRM.isAdm();
    return Promise.all([
      api('crmOffers', {}),
      // os nomes dos leads vêm do quadro (as condições só guardam o id do lead)
      api('crmBoard', { scope: adm ? 'all' : 'mine', closed_days: 365 }).then(function (r) { return r.leads || []; }, function () { return []; })
    ]).then(function (r) {
      if (req !== S.offersReq || S.mode !== 'app' || S.shown !== 'ofertas') return;
      var by = {};
      r[1].forEach(function (l) { by[l.id] = l; });
      S.offers = { list: r[0].offers || [], leads: by, at: Date.now() };
      paintOffers();
    }, function (e) {
      if (req !== S.offersReq || e.code === 'AUTH' || S.shown !== 'ofertas') return;
      var body = B.$('#of-body');
      if (!S.offers && body) body.innerHTML = CRM.errBlock(e); else if (!silent) fail(e);
    });
  };

  function ofScoped() {
    var sel = CRM.isAdm() ? (S.offerSeller || '') : '';
    return S.offers.list.filter(function (o) { return !sel || o.seller_id === sel; });
  }
  function ofSorted(arr) {
    return arr.slice().sort(function (a, b) {
      return (OF_RANK[a.status] - OF_RANK[b.status]) || (a.status === 'active' ? a.expires_at - b.expires_at : b.created_at - a.created_at);
    });
  }
  function ofCard(o) {
    var l = S.offers.leads[o.lead_id], st = o.status, adm = CRM.isAdm();
    var off = o.normal_price > o.price ? Math.round((o.normal_price - o.price) / o.normal_price * 100) : 0;
    var chip = st === 'active' ? CRM.chip('warn', 'clock', 'Ativa') : st === 'used' ? CRM.chip('ok', 'check', 'Usada na venda') : CRM.chip('', 'x', 'Expirada');
    var exp = st === 'active' ? '<span data-exp="' + Number(o.expires_at) + '" data-live-exp="1">' + E(CRM.expText(o.expires_at)) + '</span>'
      : st === 'used' ? '<span>Virou venda</span>' : '<span>' + E(CRM.expText(o.expires_at)) + '</span>';
    var who = l ? '<button type="button" class="com-linkbtn com-ofc__who" data-act="open" data-id="' + E(o.lead_id) + '" aria-label="Abrir a ficha de ' + E(l.name) + '">' + E(l.name) + '</button>'
      : '<span class="com-ofc__who t-faint">Lead sem ficha</span>';
    var mailTo = (l && l.email) || o.email;
    var acts = '';
    if (st === 'active') {
      acts = '<button type="button" class="btn btn--sm btn--primary" data-act="copy" data-copy="' + E(o.link) + '">' + ic('copy') + 'Copiar link</button>' +
        (l ? '<button type="button" class="btn btn--sm" data-act="wa" data-id="' + E(o.lead_id) + '">' + ic('whatsapp') + 'WhatsApp</button>' : '') +
        (mailTo ? '<button type="button" class="btn btn--sm" data-act="o-mail" data-id="' + E(o.id) + '">' + ic('mail') + 'E-mail</button>' : '');
    } else if (st === 'expired' && l) {
      acts = '<button type="button" class="btn btn--sm btn--primary" data-act="of-renew" data-id="' + E(o.lead_id) + '">' + ic('refresh') + 'Criar nova</button>';
    }
    if (l) acts += '<button type="button" class="btn btn--sm btn--ghost" data-act="open" data-id="' + E(o.lead_id) + '">Abrir ficha' + ic('right') + '</button>';
    return '<article class="com-ofc com-ofc--' + st + '"><div class="com-ofc__main">' +
      '<div class="com-ofc__top"><strong class="com-ofc__course">' + E(o.course_title || 'Curso') + '</strong>' + chip + '</div>' +
      '<div class="com-ofc__sub">' + who + (adm && o.seller_id ? '<span class="com-ofc__sel">' + E(sellerName(o.seller_id) || 'Outro vendedor') + '</span>' : '') +
        '<span class="t-faint">criada ' + E(B.fmt.rel(o.created_at)) + '</span><span class="com-ofc__code t-num" title="Código da condição">' + E(o.code) + '</span></div>' +
      '<div class="com-ofc__price"><b class="t-num">' + money(o.price) + '</b>' + (off ? '<s class="t-num">' + money(o.normal_price) + '</s><span class="chip chip--ok">' + off + '% off</span>' : '<span class="t-faint">sem desconto</span>') + '</div>' +
      '<div class="com-ofc__exp" title="' + E(B.fmt.datetime(o.expires_at)) + '">' + ic(st === 'used' ? 'check' : 'clock') + exp + '</div></div>' +
      (acts ? '<div class="com-ofc__acts">' + acts + '</div>' : '') + '</article>';
  }
  function paintOffers() { CRM.keepFocus(B.$('#view'), paintOffersRaw); }
  function paintOffersRaw() {
    var body = B.$('#of-body'), bar = B.$('#of-bar');
    if (!body || !bar || !S.offers) return;
    var base = ofScoped(), cnt = { all: base.length, active: 0, used: 0, expired: 0 };
    base.forEach(function (o) { cnt[o.status]++; });
    bar.innerHTML = '<div class="seg" role="group" aria-label="Situação da condição">' + OF_FILTERS.map(function (f) {
      return '<button type="button" data-act="of-filter" data-f="' + f[0] + '" class="' + (S.offerFilter === f[0] ? 'is-active' : '') + '" aria-pressed="' + (S.offerFilter === f[0]) + '">' + f[1] + ' <span class="t-num">' + cnt[f[0]] + '</span></button>';
    }).join('') + '</div>' + (cnt.all ? '<span class="com-ofbar__rate">' + (cnt.used ? E(B.fmt.plural(cnt.used, 'condição virou venda', 'condições viraram venda')) : 'Nenhuma virou venda ainda') + '</span>' : '');
    var arr = ofSorted(S.offerFilter === 'all' ? base : base.filter(function (o) { return o.status === S.offerFilter; }));
    if (!cnt.all) {
      body.innerHTML = CRM.emptyBlock('Nenhuma condição criada', 'Abra a ficha de um lead e use Condição especial. O link com preço e prazo aparece aqui, com a contagem regressiva.',
        '<a class="btn btn--primary" href="#/">' + ic('filter') + 'Ir para o funil</a>', 'ofertas');
    } else if (!arr.length) {
      body.innerHTML = CRM.emptyBlock('Nada nessa situação', 'Nenhuma condição está como "' + (OF_FILTERS.filter(function (f) { return f[0] === S.offerFilter; })[0] || ['', ''])[1].toLowerCase() + '" agora.',
        '<button type="button" class="btn" data-act="of-filter" data-f="all">Ver todas</button>', 'ofertas-vazio');
    } else {
      body.innerHTML = '<div class="com-ofgrid">' + arr.map(ofCard).join('') + '</div>';
    }
  }
  ACT['of-filter'] = function (t) {
    S.offerFilter = t.getAttribute('data-f') || 'all';
    paintOffers();
  };
  ACT['of-renew'] = function (t) { CRM.offer(t.getAttribute('data-id')); };
  LIVE['of-seller'] = function (el) { S.offerSeller = el.value; paintOffers(); };
})();

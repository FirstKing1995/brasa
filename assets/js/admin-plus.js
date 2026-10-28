/* =====================================================================
   BRASA · admin-plus.js — novidades da versão 2 do painel do produtor
   Páginas novas (Mensagens, Banners, Comercial) e os ganchos que o
   admin.js chama: WhatsApp com mensagem pronta, contatos do aluno,
   ofertas do curso (order bump e oferta pós-compra), indicadores e
   configurações. Depende de core.js (B) e do window.ADM do admin.js.
   ===================================================================== */
(function () {
  'use strict';
  var B = window.B, A = window.ADM;
  if (!B || !A || !A.H) { if (window.console) console.error('admin-plus.js: o admin.js precisa carregar antes.'); return; }

  var H = A.H, raw = A.raw, ic = A.ic, chip = A.chip, fld = A.fld, sw = A.sw, skel = A.skel, S = A.S;
  var money = A.money, moneyK = A.moneyK, int = A.int, plural = A.plural, trunc = A.trunc, firstName = A.firstName;
  var $ = B.$, $$ = B.$$, DAY = A.DAY, hooks = A.hooks, pages = A.pages;
  function str(x) { return String(x); }
  function brandName() { return (B.brand && B.brand.name) || 'BRASA'; }
  function pctOff(normal, special) { return normal > 0 && special < normal ? Math.round((1 - special / normal) * 100) : 0; }

  /* =====================================================================
     WHATSAPP COM MENSAGEM PRONTA
     Qualquer botão com data-wa="student|affiliate|order" data-id="…"
     abre o compositor com os modelos da pessoa e registra o contato.
     ===================================================================== */
  function openWa(kind, id, btn, opts) {
    opts = opts || {};
    if (!id) { B.toast('Não encontramos essa pessoa para chamar.', 'bad'); return Promise.resolve(); }
    if (btn) btn.classList.add('is-loading');
    var off = function () { if (btn) btn.classList.remove('is-loading'); };
    return B.api('adminContext', { kind: kind, id: id }).then(function (c) {
      off();
      B.waComposer({
        title: 'WhatsApp para ' + (firstName(c.name) || 'contato'), name: c.name, phone: c.phone,
        templates: c.templates || [], vars: c.vars || {}, initial: opts.initial || '',
        onSent: function (s) {
          if (!c.user_id) return;
          B.api('adminLogContact', { user_id: c.user_id, channel: 'wa', template: s.template, title: s.title, text: s.text })
            .then(function () { window.dispatchEvent(new CustomEvent('adm:contact', { detail: { user_id: c.user_id, channel: 'wa', title: s.title } })); })
            .catch(function () {});
        }
      });
      if (!(c.templates || []).length) B.toast('Não há modelos ativos para este público. Veja em Mensagens.', 'info', 4800);
    }, function (e) { off(); B.fail(e); });
  }
  A.wa = openWa;
  // captura antes dos cliques de linha da tabela, para o botão não abrir o aluno junto
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-wa]') : null;
    if (!t) return;
    ev.preventDefault(); ev.stopPropagation();
    openWa(t.dataset.wa, t.dataset.id, t, { initial: t.dataset.initial || '' });
  }, true);

  /* =====================================================================
     ALUNOS: onde parou, último acesso, último contato, e-mails enviados
     ===================================================================== */
  hooks.stuCells = function (u) {
    var cur = u.current, lc = u.last_contact, da = u.days_away || 0;
    var where = cur
      ? H`<div class="stuw" title="${cur.course_title}${cur.lesson_title ? ' · ' + cur.lesson_title : ''}"><div class="stuw__top"><b class="t-num">${cur.label || 'Início'}</b><span class="stuw__course ellipsis">${trunc(cur.course_title, 30)}</span></div>${A.progBar(cur.pct)}</div>`
      : H`<span class="t-faint">—</span>`;
    var seen = u.last_seen
      ? H`<div title="${B.fmt.datetime(u.last_seen)}">${B.fmt.rel(u.last_seen)}</div>${da >= 7 ? H`<div class="t-xs ${da >= 30 ? 't-bad' : 't-mustard'}">${da} dias parado</div>` : ''}`
      : H`<div class="t-faint">Nunca entrou</div>${da >= 7 ? H`<div class="t-xs t-mustard">${da} dias desde o cadastro</div>` : ''}`;
    var contact = lc
      ? H`<div class="stuc" title="${lc.title || (lc.type === 'wa' ? 'WhatsApp' : 'E-mail')} · ${B.fmt.datetime(lc.ts)}"><span class="stuc__ic stuc__ic--${lc.type === 'wa' ? 'wa' : 'mail'}">${ic(lc.type === 'wa' ? 'whatsapp' : 'mail')}</span><span class="min0"><span class="stuc__when">${B.fmt.rel(lc.ts)}</span>${lc.title ? H`<span class="stuc__t t-xs t-faint ellipsis">${trunc(lc.title, 26)}</span>` : ''}</span></div>`
      : H`<span class="t-faint">Nunca</span>`;
    return str(H`<td>${where}</td><td>${seen}</td><td>${contact}</td>`);
  };
  hooks.stuWa = function (u) {
    var init = !u.has_password ? 'wa_access' : (u.days_away >= 7 ? 'wa_inactive' : '');
    return str(H`<td class="num"><button type="button" class="iconbtn iconbtn--sm iconbtn--wa" data-wa="student" data-id="${u.id}" data-initial="${init}" aria-label="Chamar ${u.name} no WhatsApp com mensagem pronta" title="WhatsApp com mensagem pronta">${ic('whatsapp')}</button></td>`);
  };

  function emailItem(m) {
    var bad = m.status === 'failed';
    return H`<li class="ctl__it"><span class="ctl__ic ctl__ic--mail">${ic('mail')}</span><div class="ctl__main"><b class="ctl__t">${m.subject || m.label}</b><span class="t-xs t-faint">${m.label}${m.label && m.subject ? ' · ' : ''}${B.fmt.datetime(m.ts)}</span>${bad && m.error ? H`<span class="t-xs t-bad ctl__err">${trunc(m.error, 140)}</span>` : ''}</div>${chip(bad ? 'Falhou' : 'Enviado', bad ? 'bad' : 'ok')}</li>`;
  }
  function contactItem(c) {
    var wa = c.type === 'wa';
    return H`<li class="ctl__it"><span class="ctl__ic ctl__ic--${wa ? 'wa' : 'mail'}">${ic(wa ? 'whatsapp' : 'mail')}</span><div class="ctl__main"><b class="ctl__t">${c.title || (wa ? 'WhatsApp' : 'E-mail')}</b><span class="t-xs t-faint">${B.fmt.datetime(c.ts)}${c.by ? ' · por ' + c.by : ''}</span>${c.text ? H`<span class="t-xs t-muted ctl__txt">${trunc(c.text, 150)}</span>` : ''}</div></li>`;
  }
  function paintContacts(host, r, all) {
    var em = r.emails || [], ct = r.contacts || [], lim = 5;
    host.innerHTML = str(H`
      <h4 class="t-hud-sub stu__h">E-mails e contatos</h4>
      <div class="ctl">
        <section class="ctl__col" aria-label="E-mails enviados"><h5 class="ctl__h">${ic('mail')}E-mails enviados<span class="t-faint">${em.length}</span></h5>
          ${em.length ? H`<ul class="ctl__list">${(all ? em : em.slice(0, lim)).map(emailItem)}</ul>` : H`<p class="hint">Nenhum e-mail enviado para esta pessoa até agora.</p>`}</section>
        <section class="ctl__col" aria-label="Contatos registrados"><h5 class="ctl__h">${ic('whatsapp')}Contatos registrados<span class="t-faint">${ct.length}</span></h5>
          ${ct.length ? H`<ul class="ctl__list">${(all ? ct : ct.slice(0, lim)).map(contactItem)}</ul>` : H`<p class="hint">Nenhum contato ainda. Ao abrir o WhatsApp por aqui, o contato fica registrado.</p>`}</section>
      </div>
      ${!all && (em.length > lim || ct.length > lim) ? H`<button type="button" class="btn btn--sm btn--ghost ctl__more" data-ctl-all>Mostrar tudo</button>` : ''}`);
    var more = $('[data-ctl-all]', host);
    if (more) more.addEventListener('click', function () { paintContacts(host, r, true); });
  }
  hooks.studentModal = function (m, u) {
    var host = $('[data-plus="user-emails"]', m.body); if (!host) return;
    var load = function () {
      host.innerHTML = str(H`<h4 class="t-hud-sub stu__h">E-mails e contatos</h4>${skel(70)}`);
      B.api('adminUserEmails', { user_id: u.id }).then(function (r) {
        if (m.closed || !host.isConnected) return;
        paintContacts(host, r);
      }).catch(function (e) {
        if (m.closed || !host.isConnected) return;
        host.innerHTML = str(H`<h4 class="t-hud-sub stu__h">E-mails e contatos</h4><p class="hint">${(e && e.message) || 'Não foi possível carregar o histórico.'} <button type="button" class="btn btn--link btn--sm" data-ctl-retry>Tentar de novo</button></p>`);
        var b = $('[data-ctl-retry]', host); if (b) b.addEventListener('click', load);
      });
    };
    load();
  };

  /* =====================================================================
     VENDAS: etiquetas na linha e faixa de indicadores
     ===================================================================== */
  hooks.saleTags = function (o) {
    var t = [];
    if (o.bump_type) t.push(chip('+ bump', 'ok'));
    if (o.parent_order_id) t.push(chip('upsell', 'info'));
    if (o.seller_id) t.push(chip(firstName(o.seller_name) || 'Vendedor', 'mustard'));
    return t.length ? str(H`<div class="stags">${t}</div>`) : '';
  };
  hooks.salesTiles = function (t) {
    return str(H`<section class="kband kband--3" aria-label="Order bump, oferta pós-compra e vendedores">
      ${A.kpiTile('Aceitação do order bump', B.fmt.pct(t.bump_rate || 0), plural(t.bumps || 0, 'aceite', 'aceites') + ' · ' + moneyK(t.bump_revenue || 0) + ' de receita', t.bumps ? 'kpi--hero' : '')}
      ${A.kpiTile('Oferta pós-compra', int(t.upsells || 0), moneyK(t.upsell_revenue || 0) + ' em vendas')}
      ${A.kpiTile('Vendas de vendedores', moneyK(t.seller_revenue || 0), plural(t.seller_sales || 0, 'venda', 'vendas') + ' · ' + moneyK(t.seller_commissions || 0) + ' de comissão')}
    </section>`);
  };

  /* =====================================================================
     PAINEL: venda extra (order bump + oferta pós-compra)
     ===================================================================== */
  hooks.dashBump = function (k, days) {
    var extra = (k.bump_revenue || 0) + (k.upsell_revenue || 0);
    return str(H`<section class="panel dash-bump" aria-label="Order bump e oferta pós-compra">
      ${A.panelHead('Venda extra', H`<a class="btn btn--link btn--sm" href="#/vendas?tipo=bump&periodo=${days}">Ver vendas</a>`, 'Order bump e oferta pós-compra · ' + days + ' dias')}
      <div class="dbx">
        <div class="dbx__it"><span class="dbx__l">Aceitação do bump</span><b class="dbx__v t-num">${B.fmt.pct(k.bump_rate || 0)}</b><span class="dbx__s">${plural(k.bumps || 0, 'aceite', 'aceites')}</span></div>
        <div class="dbx__it dbx__it--hero"><span class="dbx__l">Receita extra</span><b class="dbx__v t-num">${moneyK(extra)}</b><span class="dbx__s">bump + oferta pós-compra</span></div>
      </div>
      <p class="hint dbx__foot">${(k.bumps || k.upsells) ? plural(k.upsells || 0, 'oferta pós-compra aceita', 'ofertas pós-compra aceitas') + ' no período.' : 'Ainda sem ofertas aceitas. Ligue o order bump ou a oferta pós-compra na aba Oferta de um curso.'}</p>
    </section>`);
  };

  /* =====================================================================
     CONFIGURAÇÕES: cartão na página, comissão sobre o bump, comercial, e-mail
     ===================================================================== */
  function cardEff(key, mode) {
    var on = String(key || '').trim() && mode !== 'redirect';
    return on
      ? H`${chip('Cartão na própria página', 'ok', 'card')}<span class="t-xs t-faint">O cliente digita o cartão sem sair do checkout.</span>`
      : H`${chip('Página do Mercado Pago', '', 'external')}<span class="t-xs t-faint">${!String(key || '').trim() ? 'Sem a Public Key, o cliente é levado ao Mercado Pago para pagar.' : 'Você escolheu levar o cliente ao Mercado Pago.'}</span>`;
  }
  function syncCardEff(ev) {
    var t = ev.target; if (!t || !t.dataset || (t.dataset.f !== 'mp_public_key' && t.dataset.f !== 'card_mode')) return;
    var host = $('#card-eff'), k = $('[data-f="mp_public_key"]'), m = $('[data-f="card_mode"]');
    if (host && k && m) host.innerHTML = str(cardEff(k.value, m.value));
  }
  document.addEventListener('input', syncCardEff);
  document.addEventListener('change', syncCardEff);

  hooks.settingsCard = function (h) {
    var c = h.config;
    return str(H`<div class="set-sub">
      <h3 class="t-hud-sub">Cartão dentro da página</h3>
      ${h.cf('mp_public_key', { l: 'Public Key do Mercado Pago', ph: 'APP_USR-…', attrs: 'autocomplete="off" spellcheck="false" autocapitalize="off"', hint: 'Fica em Suas integrações > Credenciais de produção. Com ela, o cliente paga no cartão sem sair da página; sem ela, é levado à página do Mercado Pago. Diferente do Access Token, esta chave não é secreta.' })}
      <div class="grid-2">
        ${h.cf('card_mode', { l: 'Como cobrar no cartão', t: 'select', opts: [['transparent', 'Na própria página'], ['redirect', 'Na página do Mercado Pago']], hint: 'Na página só funciona com a Public Key preenchida.' })}
        <div class="field"><label>Como vai funcionar agora</label><div class="set-eff" id="card-eff">${cardEff(c.mp_public_key, c.card_mode)}</div></div>
      </div>
      ${h.csw('card_3ds', { l: 'Confirmação no banco (3DS)', hint: 'O banco pede uma confirmação extra (app ou SMS) em algumas compras. Reduz fraude e chargeback, mas pode derrubar um pouco a conversão no cartão.' })}
    </div>`);
  };
  hooks.settingsAffBump = function (h) {
    return str(h.csw('aff_on_bump', { l: 'Comissão também sobre o order bump', hint: 'Ligado, o afiliado ganha comissão sobre o total, incluindo o bump. Desligado, só sobre o curso principal.' }));
  };
  hooks.settingsCrm = function (h) {
    return str(h.panel('comercial', 'Comercial', 'Leads e vendedores.', H`
      ${h.csw('crm_auto_assign', { l: 'Distribuir leads automaticamente', hint: 'Cada lead novo vai para o vendedor ativo com menos leads abertos. Desligado, ele fica na fila para você atribuir.' })}
      ${h.cf('crm_inactive_days', { l: 'Aluno parado depois de', t: 'number', post: 'dias', attrs: 'min="0" max="365" step="1" inputmode="numeric"', hint: 'Quem tem acesso ativo e não entra nesse prazo vira lead de reativação para os vendedores. Zero desliga.' })}
      <div class="grid-2">
        ${h.cf('seller_default_commission', { l: 'Comissão do vendedor', t: 'number', post: '%', attrs: 'min="0" max="90" step="1" inputmode="numeric"' })}
        ${h.cf('seller_default_max_discount', { l: 'Desconto máximo', t: 'number', post: '%', attrs: 'min="0" max="100" step="1" inputmode="numeric"' })}
      </div>
      <p class="hint">Valem para vendedores novos. Cada vendedor pode ter os seus em Comercial.</p>`));
  };
  hooks.settingsEmail = function (h) {
    return str(h.panel('email', 'E-mail', 'Por onde saem os e-mails da plataforma.', H`
      ${h.cf('email_provider', { l: 'Provedor', t: 'select', opts: [['gmail', 'Gmail (conta do Apps Script)'], ['resend', 'Resend'], ['brevo', 'Brevo']], hint: 'O Gmail envia pela conta que publicou o Apps Script e tem limite diário baixo. Resend e Brevo escalam melhor e pedem uma chave de API e um remetente verificado.' })}
      ${h.cf('email_from', { l: 'E-mail do remetente', t: 'email', ph: 'contato@seudominio.com', attrs: 'autocomplete="off" inputmode="email"', hint: 'Com Resend ou Brevo, use um endereço do domínio verificado no provedor. No Gmail, vazio usa a conta do Apps Script.' })}
      ${h.secretField('EMAIL_API_KEY', 'Chave de API do provedor', 'Resend: em API Keys. Brevo: em SMTP e API > Chaves de API. Fica guardada no servidor e nunca volta para a tela. O Gmail não usa chave.')}
      ${h.testBtn('email', 'Enviar e-mail de teste')}`));
  };

  /* =====================================================================
     CURSO > OFERTA: order bump e oferta pós-compra
     O admin.js chama courseOffer (HTML), courseOfferChange (a cada campo
     bump_* / upsell_*) e courseOfferValidate (antes de salvar).
     ===================================================================== */
  var OFF = null; // { cats, selfId, d }

  function catOf(id) { return ((OFF && OFF.cats) || []).filter(function (c) { return c.id === id; })[0] || null; }
  function offeredOpts(current) {
    var out = [['', 'Escolha o curso']], seen = {};
    ((OFF && OFF.cats) || []).forEach(function (c) {
      if (c.id === OFF.selfId || c.status !== 'published') return;
      seen[c.id] = 1; out.push([c.id, c.title + ' · ' + money(c.price)]);
    });
    if (current && current !== OFF.selfId && !seen[current]) {
      var c = catOf(current);
      out.push([current, c ? c.title + (c.status !== 'published' ? ' (não publicado: não aparece)' : '') : 'Curso removido']);
    }
    return out;
  }
  // k = 'bump' | 'upsell'
  function priceInfo(d, k) {
    var type = k === 'bump' ? (d.bump_type === 'product' ? 'product' : 'course') : 'course';
    var oc = type === 'course' ? catOf(k === 'bump' ? d.bump_course_id : d.upsell_course_id) : null;
    var price = Number(d[k + '_price']) || 0, normal = oc ? Number(oc.price) || 0 : 0;
    var special = type === 'product' ? price : (price > 0 ? price : normal);
    return { type: type, oc: oc, normal: normal, special: special, set: price > 0, off: pctOff(normal, special) };
  }
  function noteHtml(p) {
    if (p.type === 'product') return p.set ? H`<span class="offx__ok">Soma <b>${money(p.special)}</b> ao pedido de quem marcar a caixa.</span>` : H`<span class="offx__warn">Informe o preço do produto.</span>`;
    if (!p.oc) return H`<span class="t-faint">Escolha o curso para ver o preço normal e a economia.</span>`;
    if (!p.set) return H`<span>Sem preço especial, cobra o preço normal: <b>${money(p.normal)}</b>.</span>`;
    if (p.special > p.normal) return H`<span class="offx__warn">O preço especial (${money(p.special)}) está acima do preço normal (${money(p.normal)}).</span>`;
    if (p.special === p.normal) return H`<span>Mesmo valor do preço normal: sem desconto.</span>`;
    return H`<span class="offx__ok">Preço normal <s>${money(p.normal)}</s> · economia de <b>${money(p.normal - p.special)}</b> (${p.off}%)</span>`;
  }
  function bumpPv(d) {
    var p = priceInfo(d, 'bump'), prod = p.type === 'product';
    var title = String(d.bump_title || '').trim() || (p.oc ? p.oc.title : (prod ? 'Nome do produto' : 'Escolha o curso oferecido'));
    var text = String(d.bump_text || '').trim() || (p.oc ? (p.oc.short_desc || '') : (prod ? 'Diga em uma frase o que a pessoa recebe.' : ''));
    var art = d.bump_image ? H`<img src="${B.safeUrl(d.bump_image)}" alt="">` : (p.oc ? raw(B.art(p.oc, { title: false, mark: false })) : H`<span class="co-bump__icon">${ic('gift')}</span>`);
    return H`<label class="co-bump"><span class="co-bump__bar"><span class="check"><input type="checkbox" aria-label="Marcar para ver o estado ligado da prévia"></span><span class="co-bump__cta">Sim, quero adicionar ao pedido</span><span class="co-bump__tag">Só agora</span></span><span class="co-bump__body"><span class="co-bump__art">${art}</span><span class="co-bump__txt"><strong>${title}</strong>${text ? H`<small>${text}</small>` : ''}<span class="co-bump__price">${p.normal > p.special && p.special > 0 ? H`<s class="t-num">${money(p.normal)}</s>` : ''}<b class="t-num">+ ${money(p.special)}</b></span></span></span></label>`;
  }
  function upsellPv(d) {
    var p = priceInfo(d, 'upsell'), oc = p.oc;
    var mins = Math.max(5, Math.min(1440, Number(d.upsell_minutes) || 15));
    var title = String(d.upsell_title || '').trim() || 'Oferta única para quem acabou de entrar';
    var text = String(d.upsell_text || '').trim() || (oc ? (oc.short_desc || '') : '');
    return H`<div class="upp">
      <div class="upp__ok">${ic('check')}<span><b>Pagamento confirmado.</b> ${String(d.title || '').trim() || 'Este curso'} já está liberado.</span></div>
      <p class="upp__tag t-tag">Espera, tem mais</p>
      <h5 class="upp__h">${title}</h5>
      <div class="upp__art">${oc ? raw(B.art(oc, { title: false })) : H`<span class="upp__ph">${ic('image')}</span>`}</div>
      <div class="upp__course">${oc ? oc.title : 'Escolha o curso oferecido'}</div>
      ${text ? H`<p class="upp__p">${text}</p>` : ''}
      <div class="upp__price">${p.normal > p.special && p.special > 0 ? H`<s class="t-num">${money(p.normal)}</s>` : ''}<strong class="t-num">${money(p.special)}</strong>${p.off ? H`<em class="t-num">−${p.off}%</em>` : ''}</div>
      <p class="upp__timer">${ic('clock')}<span>Esta condição some em <b class="t-num">${B.fmt.clock(mins * 60)}</b> e não volta.</span></p>
      <span class="btn btn--primary btn--block upp__btn" aria-hidden="true">Quero por ${money(p.special)}</span>
      <span class="upp__no">Não, obrigado. Quero ir para o meu curso</span>
    </div>`;
  }
  function onlyBlocks(panel, type) {
    $$('[data-offx-only]', panel).forEach(function (el) { el.hidden = el.dataset.offxOnly !== type; });
  }

  hooks.courseOffer = function (x) {
    OFF = { cats: x.cats || [], selfId: x.course ? x.course.id : '', d: x.draft };
    var d = x.draft, bt = d.bump_type === 'product' ? 'product' : 'course', bOn = !!d.bump_enabled, uOn = !!d.upsell_enabled;
    var bp = priceInfo(d, 'bump'), up = priceInfo(d, 'upsell');
    var hid = function (c) { return c ? '' : raw('hidden'); };
    return str(H`
      <section class="panel stack offx" id="offx-bump" style="--gap:16px">
        ${A.panelHead('Order bump', '', 'Uma caixa de marcação no checkout, logo acima do pagamento: com um clique, a pessoa leva outro curso ou produto no mesmo pedido.')}
        ${sw({ l: 'Oferecer order bump neste curso', f: 'bump_enabled', v: bOn })}
        <div class="offx__body" data-offx-body ${hid(bOn)}>
          <div class="offx__pv"><h4 class="t-hud-sub">Como o comprador vê</h4><div class="offx__pvbox" id="offx-bump-pv">${bumpPv(d)}</div></div>
          <div class="offx__form stack" style="--gap:16px">
          ${fld({ l: 'O que oferecer', f: 'bump_type', t: 'select', v: bt, opts: [['course', 'Outro curso da plataforma'], ['product', 'Produto avulso, com link de entrega']] })}
          <div data-offx-only="course" ${hid(bt === 'course')}>${fld({ l: 'Curso oferecido', f: 'bump_course_id', t: 'select', v: d.bump_course_id, opts: offeredOpts(d.bump_course_id), hint: 'Só cursos publicados aparecem para o comprador, e o próprio curso não entra na lista. Quem já tem o curso não vê o bump.' })}</div>
          ${fld({ l: 'Título', f: 'bump_title', v: d.bump_title, ph: 'Ex.: Pack de 30 criativos editáveis', attrs: 'maxlength="120" autocomplete="off"', hint: 'Em branco, o bump de curso usa o nome do curso. No produto avulso o título é obrigatório.' })}
          ${fld({ l: 'Texto', f: 'bump_text', t: 'textarea', rows: 3, v: d.bump_text, attrs: 'maxlength="400"', hint: 'Uma ou duas frases. Em branco, o bump de curso usa a descrição curta do curso.' })}
          <div class="offx__prices">
            ${fld({ l: 'Preço especial', f: 'bump_price', t: 'number', v: d.bump_price, pre: 'R$', ph: bp.normal ? String(bp.normal) : '0', attrs: 'min="0" step="0.01" inputmode="decimal"', hint: 'Em curso, em branco ou zero cobra o preço normal. Em produto avulso, é obrigatório.' })}
            <div class="field" data-offx-only="course" ${hid(bt === 'course')}><label>Preço normal</label><div class="offx__normal t-num" id="offx-bump-normal">${bp.oc ? money(bp.normal) : '—'}</div></div>
          </div>
          <div class="offx__note" id="offx-bump-note" role="status">${noteHtml(bp)}</div>
          <div data-offx-only="product" ${hid(bt === 'product')}>${fld({ l: 'Link de entrega', f: 'bump_delivery', t: 'url', v: d.bump_delivery, ph: 'https://…', attrs: 'inputmode="url" autocomplete="off"', hint: 'Para onde a pessoa vai para acessar o produto (Drive, Notion, Hotmart…). Enviamos este link por e-mail depois do pagamento.' })}</div>
          ${A.imgField({ l: 'Imagem (opcional)', f: 'bump_image', v: d.bump_image, shape: 'sq' })}
          </div>
        </div>
      </section>
      <section class="panel stack offx" id="offx-upsell" style="--gap:16px">
        ${A.panelHead('Oferta pós-compra', '', 'Logo depois que o pagamento é aprovado, a pessoa vê uma oferta única de outro curso, com tempo limitado, e pode comprar com um clique.')}
        ${sw({ l: 'Fazer oferta depois da compra', f: 'upsell_enabled', v: uOn })}
        <div class="offx__body" data-offx-body ${hid(uOn)}>
          <div class="offx__form stack" style="--gap:16px">
          ${fld({ l: 'Curso oferecido', f: 'upsell_course_id', t: 'select', v: d.upsell_course_id, opts: offeredOpts(d.upsell_course_id), hint: 'Só cursos publicados aparecem. Quem já tem o curso não vê a oferta.' })}
          <div class="offx__prices">
            ${fld({ l: 'Preço especial', f: 'upsell_price', t: 'number', v: d.upsell_price, pre: 'R$', ph: up.normal ? String(up.normal) : '0', attrs: 'min="0" step="0.01" inputmode="decimal"', hint: 'Em branco ou zero cobra o preço normal do curso.' })}
            <div class="field"><label>Preço normal</label><div class="offx__normal t-num" id="offx-upsell-normal">${up.oc ? money(up.normal) : '—'}</div></div>
          </div>
          <div class="offx__note" id="offx-upsell-note" role="status">${noteHtml(up)}</div>
          ${fld({ l: 'Título da oferta', f: 'upsell_title', v: d.upsell_title, ph: 'Oferta única para quem acabou de entrar', attrs: 'maxlength="120" autocomplete="off"', hint: 'Em branco usa o texto padrão.' })}
          ${fld({ l: 'Texto', f: 'upsell_text', t: 'textarea', rows: 3, v: d.upsell_text, attrs: 'maxlength="400"', hint: 'Em branco usa a descrição curta do curso oferecido.' })}
          ${fld({ l: 'Validade da oferta', f: 'upsell_minutes', t: 'number', v: d.upsell_minutes, post: 'min', attrs: 'min="5" max="1440" step="1" inputmode="numeric"', hint: 'Quanto tempo a oferta fica de pé depois do pagamento, de 5 a 1440 minutos. Vazio vale 15.' })}
          </div>
          <div class="offx__pv offx__pv--up"><h4 class="t-hud-sub">Como o comprador vê</h4><div class="offx__pvbox" id="offx-upsell-pv">${upsellPv(d)}</div></div>
        </div>
      </section>`);
  };

  hooks.courseOfferChange = function (path, d) {
    if (!OFF || !d) return;
    OFF.d = d;
    var k = path.indexOf('bump_') === 0 ? 'bump' : 'upsell', panel = $('#offx-' + k); if (!panel) return;
    if (path === k + '_enabled') { var body = $('[data-offx-body]', panel); if (body) body.hidden = !d[k + '_enabled']; return; }
    if (path === 'bump_type') onlyBlocks(panel, d.bump_type === 'product' ? 'product' : 'course');
    var p = priceInfo(d, k), nm = $('#offx-' + k + '-normal'), nt = $('#offx-' + k + '-note'), pr = $('[data-f="' + k + '_price"]', panel), pv = $('#offx-' + k + '-pv');
    if (nm) nm.textContent = p.oc ? money(p.normal) : '—';
    if (nt) nt.innerHTML = str(noteHtml(p));
    if (pr) pr.placeholder = p.normal ? String(p.normal) : '0';
    if (pv) {
      var on = k === 'bump' && $('.co-bump input', pv) ? $('.co-bump input', pv).checked : false;
      pv.innerHTML = str(k === 'bump' ? bumpPv(d) : upsellPv(d));
      if (on) { var cb = $('.co-bump input', pv); if (cb) { cb.checked = true; cb.closest('.co-bump').classList.add('is-on'); } }
    }
  };
  // a caixa da prévia liga e desliga como no checkout
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.closest || !t.matches('.offx .co-bump input')) return;
    t.closest('.co-bump').classList.toggle('is-on', t.checked);
  });

  hooks.courseOfferValidate = function (d, course) {
    var self = course ? course.id : '';
    if (d.bump_enabled) {
      if (d.bump_type === 'product') {
        if (!String(d.bump_title || '').trim()) return 'Dê um nome ao produto do order bump.';
        if (!(Number(d.bump_price) > 0)) return 'Informe o preço do order bump.';
        if (String(d.bump_delivery || '').trim() && !/^https?:\/\//i.test(String(d.bump_delivery).trim())) return 'O link de entrega do bump precisa começar com https://';
      } else if (!d.bump_course_id || d.bump_course_id === self) return 'Escolha o curso oferecido no order bump (diferente deste).';
    }
    if (d.upsell_enabled) {
      if (!d.upsell_course_id || d.upsell_course_id === self) return 'Escolha o curso da oferta pós-compra (diferente deste).';
      var m = d.upsell_minutes;
      if (m !== '' && m != null && (Number(m) < 5 || Number(m) > 1440)) return 'A validade da oferta pós-compra vai de 5 a 1440 minutos.';
    }
    return '';
  };

  /* =====================================================================
     MENSAGENS (/mensagens): modelos de WhatsApp e de e-mail
     ===================================================================== */
  var AUD = [['student', 'Alunos'], ['affiliate', 'Afiliados'], ['lead', 'Leads'], ['order', 'Pedidos']];
  var AUD_HINT = {
    student: 'Para quem já comprou: acesso, lembrete de quem parou, boas-vindas.',
    affiliate: 'Para quem divulga: resultado do mês, comissão, ranking.',
    lead: 'Usados pelos vendedores na área comercial.',
    order: 'Para o pedido: pagamento que não saiu ou compra já liberada.'
  };
  // dados de exemplo só para a prévia (os reais vêm de cada pessoa na hora do envio)
  function sampleVars() {
    return {
      primeiro_nome: 'Iara', nome: 'Iara Soares', email: 'iara@exemplo.com', telefone: '(11) 99999-0000', marca: brandName(),
      link_acesso: 'https://seusite.com/index.html?primeiro=k3m9x', instrucao_senha: 'No primeiro acesso você cria a sua senha.', link_app: 'https://seusite.com/index.html', link_afiliacao: 'https://seusite.com/afiliado.html',
      cursos: 'Tráfego Sem Romance, Copy que Vende', curso_atual: 'Tráfego Sem Romance', episodio_atual: 'T2:E3 · Estáticos e carrosséis', progresso: '58%', dias_sem_acessar: '12', ultimo_acesso: '08/10/2026',
      codigo: 'IARA10', mes: 'outubro de 2026', vendas_mes: '7', valor_vendido_mes: 'R$ 2.079,00', comissao_mes: 'R$ 831,60', comissao_disponivel: 'R$ 412,00', comissao_a_liberar: 'R$ 419,60', comissao_paga_total: 'R$ 1.980,00',
      cliques_mes: '312', ranking_posicao: '3º lugar', cursos_afiliados: 'Tráfego Sem Romance', link_principal: 'https://seusite.com/lp.html?c=trafego&aff=IARA10', link_painel: 'https://seusite.com/afiliado.html', chave_pix: 'iara@exemplo.com',
      curso: 'Tráfego Sem Romance', valor: 'R$ 497,00', valor_oferta: 'R$ 397,00', link_oferta: 'https://seusite.com/checkout.html?c=trafego&oferta=K7Q2', validade: '22/10/2026 20:00',
      link_checkout: 'https://seusite.com/checkout.html?c=trafego', link_curso: 'https://seusite.com/lp.html?c=trafego', curso_concluido: 'Copy que Vende', vendedor: 'Rafa', origem: 'Carrinho abandonado',
      metodo: 'Pix', link_recuperacao: 'https://seusite.com/lp.html?c=trafego&checkout=1'
    };
  }
  // o e-mail vem como trecho de HTML (sem <body>): dentro do iframe sobrava a margem branca padrão do navegador em volta
  function mailDoc(h) {
    h = String(h || '');
    if (/<html[\s>]/i.test(h)) return h;
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:#100b07}</style></head><body>' + h + '</body></html>';
  }
  function insertAt(el, text) {
    var s = el.selectionStart, e = el.selectionEnd, v = el.value;
    if (s == null) el.value = v + text;
    else { el.value = v.slice(0, s) + text + v.slice(e); var p = s + text.length; try { el.setSelectionRange(p, p); } catch (x) {} }
    el.focus();
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function varChips(vars, docs) {
    if (!vars || !vars.length) return H`<p class="hint">Este modelo não usa variáveis.</p>`;
    return H`<div class="mx-vars" role="group" aria-label="Variáveis disponíveis">${vars.map(function (v) {
      return H`<button type="button" class="mx-var" data-ins="{${v}}" title="${(docs && docs[v]) || ''}"><code>{${v}}</code><span>${(docs && docs[v]) || ''}</span></button>`;
    })}</div>`;
  }
  function byOrder(a, b) { return (a.order || 0) - (b.order || 0) || String(a.title).localeCompare(String(b.title)); }
  function putTpl(list, t) {
    var i = -1; list.forEach(function (x, n) { if (x.key === t.key) i = n; });
    if (i > -1) list[i] = t; else list.push(t);
    list.sort(byOrder);
  }

  pages.mensagens = function (ctx) {
    var root = A.pageEl(), tab = ctx.query.get('aba') === 'email' ? 'email' : 'wa', data = null;
    A.setTitle('Mensagens');
    root.innerHTML = str(H`${A.pgHead('Mensagens', 'Os textos prontos que a plataforma usa no WhatsApp e nos e-mails automáticos.')}${skel(46)}<div style="margin-top:18px">${skel(300)}</div>`);
    load();

    function load() {
      return B.api('adminTemplates').then(function (d) { if (!ctx.live()) return; data = d; paint(); })
        .catch(function (e) { if (ctx.live()) root.innerHTML = str(H`${A.pgHead('Mensagens')}${A.errorState(e, 'retry')}`); });
    }
    function paint() {
      root.innerHTML = str(H`
        ${A.pgHead('Mensagens', 'Os textos prontos que a plataforma usa no WhatsApp e nos e-mails automáticos.', tab === 'wa' ? H`<button class="btn btn--primary" type="button" data-act="wa-new">${ic('plus')}Novo modelo</button>` : '')}
        ${A.tabsBar([['wa', 'WhatsApp', (data.wa || []).length || ''], ['email', 'E-mails do sistema', (data.email || []).length || '']], tab, 'tab')}
        <div class="tabpane">${tab === 'wa' ? waPane() : emailPane()}</div>`);
    }

    /* ---------- WhatsApp ---------- */
    function waCard(t) {
      var state = !t.is_default ? chip('Personalizado', 'mustard') : (t.custom ? chip('Editado', 'info') : chip('Padrão', ''));
      return H`<article class="panel mx-card${t.active ? '' : ' is-off'}">
        <div class="mx-card__top"><h3 class="mx-card__t">${t.title}</h3><div class="row" style="--gap:6px">${t.active ? '' : chip('Desativado', 'warn')}${state}</div></div>
        <p class="mx-card__b">${trunc(String(t.body || '').replace(/\s+/g, ' '), 180)}</p>
        <div class="mx-card__acts">
          <button type="button" class="btn btn--sm" data-act="wa-edit" data-key="${t.key}">${ic('edit')}Editar</button>
          ${t.custom && t.is_default ? H`<button type="button" class="btn btn--sm btn--ghost" data-act="wa-reset" data-key="${t.key}">${ic('refresh')}Restaurar padrão</button>` : ''}
          ${!t.is_default ? H`<button type="button" class="iconbtn iconbtn--sm iconbtn--bad" data-act="wa-del" data-key="${t.key}" aria-label="Excluir o modelo ${t.title}" title="Excluir">${ic('trash')}</button>` : ''}
        </div>
      </article>`;
    }
    function waPane() {
      var list = data.wa || [];
      return H`<div class="note">${ic('info')}<span>Estes modelos aparecem quando você toca em <b>WhatsApp</b> em Alunos, Afiliados, Vendas e Comercial. O que está entre chaves, como <code>{primeiro_nome}</code>, vira o dado real de cada pessoa.</span></div>
        ${AUD.map(function (a) {
          var items = list.filter(function (t) { return t.audience === a[0]; });
          return H`<section class="mx-group" aria-label="Modelos para ${a[1]}">
            <div class="mx-group__head"><h2 class="mx-group__t">${a[1]}</h2><span class="t-xs t-faint">${AUD_HINT[a[0]]}</span></div>
            ${items.length ? H`<div class="mx-grid">${items.map(waCard)}</div>` : H`<div class="panel mx-none"><p class="t-sm t-muted">Nenhum modelo para ${a[1].toLowerCase()} ainda.</p><button class="btn btn--sm" type="button" data-act="wa-new" data-aud="${a[0]}">${ic('plus')}Criar o primeiro</button></div>`}
          </section>`;
        })}`;
    }

    function waEditor(t, aud) {
      var isNew = !t, def = !!(t && t.is_default);
      t = t || { channel: 'wa', key: '', title: '', audience: aud || 'student', body: '', active: true };
      var docs = data.var_docs || {}, avars = data.audience_vars || {};
      var m = B.modal({
        title: isNew ? 'Novo modelo de WhatsApp' : 'Editar modelo', size: 'xl',
        body: str(H`<div class="mx-ed">
          <form class="mx-ed__form stack" style="--gap:14px" novalidate>
            ${fld({ l: 'Nome do modelo', n: 'title', v: t.title, req: true, ph: 'Ex.: Convite para a turma nova', attrs: 'maxlength="80" autocomplete="off"', hint: 'Só você vê o nome; ele aparece como botão na hora de escolher.' })}
            ${fld({ l: 'Para quem', n: 'audience', t: 'select', v: t.audience, opts: AUD, attrs: def ? 'disabled' : '', hint: def ? 'Os modelos de fábrica não mudam de público. Se precisar, crie um novo modelo.' : 'Define em quais telas o modelo aparece e quais variáveis ele pode usar.' })}
            ${fld({ l: 'Texto da mensagem', n: 'body', t: 'textarea', rows: 9, v: t.body, req: true, attrs: 'maxlength="6000"' })}
            <div class="field"><label>Variáveis (toque para inserir no cursor)</label><div id="mx-vars">${varChips(avars[t.audience], docs)}</div></div>
            ${sw({ l: 'Modelo ativo', n: 'active', v: t.active, hint: 'Desativado, ele some da lista na hora de chamar a pessoa.' })}
          </form>
          <aside class="mx-ed__pv" aria-label="Prévia">
            <div class="mx-ed__pvhead"><h4 class="t-hud-sub">Prévia com dados de exemplo</h4></div>
            <div class="mx-wa"><div class="mx-wa__bubble" id="mx-wa-pv"></div></div>
            <div class="mx-warn" id="mx-wa-warn" hidden></div>
          </aside>
        </div>`),
        actions: [{ label: 'Cancelar' }, {
          label: isNew ? 'Criar modelo' : 'Salvar modelo', kind: 'primary',
          onClick: function (mm) {
            var v = B.formData($('form', mm.el)), e1 = $('[data-err="title"]', mm.el), e2 = $('[data-err="body"]', mm.el);
            e1.hidden = e2.hidden = true;
            if (!String(v.title || '').trim()) { e1.textContent = 'Dê um nome ao modelo.'; e1.hidden = false; $('[name=title]', mm.el).focus(); return false; }
            if (!String(v.body || '').trim()) { e2.textContent = 'Escreva o texto da mensagem.'; e2.hidden = false; $('[name=body]', mm.el).focus(); return false; }
            return B.api('adminTemplateSave', { template: { channel: 'wa', key: t.key, title: v.title, audience: def ? t.audience : v.audience, body: v.body, active: !!v.active } }).then(function (r) {
              putTpl(data.wa, r.template); B.toast(isNew ? 'Modelo criado' : 'Modelo salvo', 'ok'); if (ctx.live()) paint();
            });
          }
        }]
      });
      A.guardForm(m);
      var form = $('form', m.el), bodyEl = $('[name=body]', m.el), audEl = $('[name=audience]', m.el), pv = $('#mx-wa-pv', m.el), warn = $('#mx-wa-warn', m.el);
      function curAud() { return def ? t.audience : audEl.value; }
      function draw() {
        var txt = B.tpl.render(bodyEl.value, sampleVars());
        pv.innerHTML = bodyEl.value.trim() ? B.nl2br(txt) : '<span class="t-faint">Escreva a mensagem para ver a prévia.</span>';
        var allowed = avars[curAud()] || [], bad = B.tpl.missing(bodyEl.value).filter(function (k) { return allowed.indexOf(k) < 0; });
        warn.hidden = !bad.length;
        if (bad.length) warn.textContent = 'Para ' + (AUD.filter(function (a) { return a[0] === curAud(); })[0] || ['', 'este público'])[1].toLowerCase() + ', estas variáveis não existem e ficariam sem valor: ' + bad.map(function (k) { return '{' + k + '}'; }).join(', ') + '.';
      }
      bodyEl.addEventListener('input', draw);
      audEl.addEventListener('change', function () { $('#mx-vars', m.el).innerHTML = str(varChips(avars[audEl.value], docs)); draw(); });
      B.on(m.body, 'click', '[data-ins]', function (ev, el) { insertAt(bodyEl, el.dataset.ins); });
      draw();
    }

    /* ---------- e-mails ---------- */
    function emailRow(t) {
      var label = (data.email_labels || {})[t.key] || t.title || t.key;
      return H`<article class="panel mx-mail${t.active ? '' : ' is-off'}">
        <div class="mx-mail__main min0">
          <div class="row" style="--gap:8px"><h3 class="mx-mail__t">${label}</h3>${t.custom ? chip('Editado', 'info') : chip('Padrão', '')}</div>
          <p class="mx-mail__s ellipsis" title="${t.subject}">Assunto: ${t.subject}</p>
        </div>
        <label class="switch mx-mail__sw"><input type="checkbox" data-mx-active="${t.key}"${raw(t.active ? ' checked' : '')}><span>${t.active ? 'Enviando' : 'Desligado'}</span></label>
        <button type="button" class="btn btn--sm" data-act="em-edit" data-key="${t.key}">${ic('edit')}Editar</button>
      </article>`;
    }
    function emailPane() {
      return H`<div class="note">${ic('info')}<span>São os e-mails que a plataforma envia sozinha: acesso, recuperação de carrinho, comissões e outros. Edite o texto, confira a prévia e desligue o que não quiser enviar.</span></div>
        <div class="mx-mails">${(data.email || []).map(emailRow)}</div>`;
    }
    function tplPayload(t, over) {
      return { channel: 'email', key: t.key, subject: t.subject, heading: t.heading, body: t.body, cta: t.cta, active: t.active, title: t.title };
    }

    function emailEditor(t) {
      var label = (data.email_labels || {})[t.key] || t.title || t.key, vars = (data.email_vars || {})[t.key] || [], docs = data.var_docs || {};
      var m = B.modal({
        title: label, size: 'xl',
        body: str(H`<div class="mx-ed">
          <form class="mx-ed__form stack" style="--gap:14px" novalidate>
            ${fld({ l: 'Assunto', n: 'subject', v: t.subject, req: true, attrs: 'maxlength="200" autocomplete="off"' })}
            ${fld({ l: 'Título dentro do e-mail', n: 'heading', v: t.heading, attrs: 'maxlength="200" autocomplete="off"', hint: 'A frase grande no topo da mensagem.' })}
            ${fld({ l: 'Texto', n: 'body', t: 'textarea', rows: 9, v: t.body, req: true, attrs: 'maxlength="6000"', hint: 'Use **negrito** para destacar. Uma linha em branco começa um novo parágrafo.' })}
            ${fld({ l: 'Texto do botão', n: 'cta', v: t.cta, attrs: 'maxlength="60" autocomplete="off"', hint: 'Em branco, vale o botão padrão deste e-mail (alguns não têm botão). O endereço do botão o sistema define.' })}
            <div class="field"><label>Variáveis (toque para inserir no cursor)</label>${varChips(vars, docs)}</div>
            ${sw({ l: 'Enviar este e-mail', n: 'active', v: t.active, hint: 'Desligado, a plataforma deixa de mandar este e-mail.' })}
          </form>
          <aside class="mx-ed__pv" aria-label="Prévia do e-mail">
            <div class="mx-ed__pvhead"><h4 class="t-hud-sub">Como a pessoa recebe</h4><span class="t-xs t-faint ellipsis" id="mx-pv-sub"></span></div>
            <iframe class="mx-frame" id="mx-frame" title="Prévia do e-mail" sandbox=""></iframe>
          </aside>
        </div>`),
        actions: [{ label: 'Cancelar' }].concat(t.custom ? [{
          label: 'Restaurar padrão', icon: 'refresh', kind: 'danger',
          onClick: function () {
            return B.confirm({ title: 'Restaurar o e-mail padrão', text: 'O texto que você editou em “' + label + '” é descartado e volta a mensagem de fábrica.', ok: 'Restaurar padrão', danger: true }).then(function (ok) {
              if (!ok) return false;
              return B.api('adminTemplateReset', { channel: 'email', key: t.key }).then(function (r) {
                if (r.template) putTpl(data.email, r.template); B.toast('Voltou ao texto padrão', 'ok'); if (ctx.live()) paint();
              });
            });
          }
        }] : []).concat([{
          label: 'Salvar e-mail', kind: 'primary',
          onClick: function (mm) {
            var v = B.formData($('form', mm.el)), e1 = $('[data-err="subject"]', mm.el), e2 = $('[data-err="body"]', mm.el);
            e1.hidden = e2.hidden = true;
            if (!String(v.subject || '').trim()) { e1.textContent = 'Informe o assunto do e-mail.'; e1.hidden = false; $('[name=subject]', mm.el).focus(); return false; }
            if (!String(v.body || '').trim()) { e2.textContent = 'Escreva o texto do e-mail.'; e2.hidden = false; $('[name=body]', mm.el).focus(); return false; }
            return B.api('adminTemplateSave', { template: { channel: 'email', key: t.key, title: t.title, subject: v.subject, heading: v.heading, body: v.body, cta: v.cta, active: !!v.active } }).then(function (r) {
              putTpl(data.email, r.template); B.toast('E-mail salvo', 'ok'); if (ctx.live()) paint();
            });
          }
        }])
      });
      A.guardForm(m);
      var form = $('form', m.el), frame = $('#mx-frame', m.el), sub = $('#mx-pv-sub', m.el), last = $('[name=body]', m.el), seq = 0;
      var draw = B.debounce(function () {
        var v = B.formData(form), my = ++seq;
        B.api('adminEmailPreview', { template: { subject: v.subject, heading: v.heading, body: v.body, cta: v.cta } }).then(function (r) {
          if (my !== seq || m.closed) return;
          frame.srcdoc = mailDoc(r.html); sub.textContent = r.subject ? 'Assunto: ' + r.subject : '';
        }).catch(function () { if (my === seq && !m.closed) sub.textContent = 'Não foi possível montar a prévia agora.'; });
      }, 380);
      form.addEventListener('input', draw);
      form.addEventListener('focusin', function (ev) { var e = ev.target; if (e && e.name && /^(subject|heading|body|cta)$/.test(e.name)) last = e; });
      B.on(m.body, 'click', '[data-ins]', function (ev, el) { insertAt(last, el.dataset.ins); });
      draw();
    }

    S.on.change = function (ev) {
      var t = ev.target, key = t && t.dataset && t.dataset.mxActive; if (!key) return;
      var tpl = (data.email || []).filter(function (x) { return x.key === key; })[0]; if (!tpl) return;
      var v = t.checked; t.disabled = true;
      B.api('adminTemplateSave', { template: Object.assign(tplPayload(tpl), { active: v }) }).then(function (r) {
        putTpl(data.email, r.template); B.toast(v ? 'E-mail ligado' : 'E-mail desligado', 'ok', 1800); if (ctx.live()) paint();
      }).catch(function (e) { t.checked = !v; t.disabled = false; B.fail(e); });
    };
    S.acts = {
      tab: function (el) { tab = el.dataset.tab === 'email' ? 'email' : 'wa'; paint(); try { history.replaceState(null, '', '#/mensagens?aba=' + tab); S.lastHash = location.hash; } catch (e) {} },
      retry: function () { pages.mensagens(ctx); },
      'wa-new': function (el) { waEditor(null, el.dataset.aud); },
      'wa-edit': function (el) { var t = (data.wa || []).filter(function (x) { return x.key === el.dataset.key; })[0]; if (t) waEditor(t); },
      'wa-reset': function (el) {
        var t = (data.wa || []).filter(function (x) { return x.key === el.dataset.key; })[0]; if (!t) return;
        B.confirm({ title: 'Restaurar o modelo padrão', text: 'O texto que você editou em “' + t.title + '” é descartado e volta a mensagem de fábrica.', ok: 'Restaurar padrão', danger: true }).then(function (ok) {
          if (!ok) return;
          A.busy(el, B.api('adminTemplateReset', { channel: 'wa', key: t.key })).then(function (r) { if (r.template) putTpl(data.wa, r.template); B.toast('Voltou ao texto padrão', 'ok'); paint(); }).catch(B.fail);
        });
      },
      'wa-del': function (el) {
        var t = (data.wa || []).filter(function (x) { return x.key === el.dataset.key; })[0]; if (!t) return;
        B.confirm({ title: 'Excluir modelo', text: '“' + t.title + '” deixa de aparecer na hora de chamar as pessoas. Não dá para desfazer.', ok: 'Excluir modelo', danger: true }).then(function (ok) {
          if (!ok) return;
          A.busy(el, B.api('adminTemplateReset', { channel: 'wa', key: t.key })).then(function () {
            data.wa = data.wa.filter(function (x) { return x.key !== t.key; }); B.toast('Modelo excluído', 'ok'); paint();
          }).catch(B.fail);
        });
      },
      'em-edit': function (el) { var t = (data.email || []).filter(function (x) { return x.key === el.dataset.key; })[0]; if (t) emailEditor(t); }
    };
  };

  /* =====================================================================
     BANNERS (/banners): avisos e ofertas dentro da área do aluno
     ===================================================================== */
  var PLACE = [['home_top', 'Topo da home'], ['home_middle', 'Meio da home'], ['lesson', 'Abaixo da aula']];
  var BN_AUD = [['all', 'Todos os alunos'], ['not_affiliate', 'Quem ainda não é afiliado'], ['affiliate', 'Só afiliados'], ['owns', 'Quem tem um curso'], ['not_owns', 'Quem ainda não tem um curso'], ['completed', 'Quem concluiu um curso']];
  var BN_ACT = [['link', 'Abrir um link'], ['affiliate', 'Convidar para virar afiliado'], ['course', 'Abrir a página de um curso'], ['checkout', 'Levar direto para a compra']];
  var BN_KICK = { affiliate: 'Indique e ganhe', checkout: 'Condição para você', course: 'Novo na casa', link: '' };
  var BN_DOCS = { primeiro_nome: 'Primeiro nome do aluno', curso: 'Nome do curso do banner', preco: 'Preço do curso', comissao: 'Comissão de afiliado', marca: 'Nome da plataforma' };
  var BN_BLANK = { active: true, title: '', text: '', cta_label: 'Saiba mais', action: 'link', url: '', course_id: '', coupon: '', image: '', placement: 'home_middle', audience: 'all', audience_course_id: '', starts_at: 0, ends_at: 0, priority: 0 };
  var BN_IDEAS = {
    aff: { title: 'Indique e ganhe até {comissao}', text: 'Vire afiliado da {marca}: você recebe links só seus e ganha comissão em cada venda.', cta_label: 'Quero ser afiliado', action: 'affiliate', audience: 'not_affiliate', placement: 'home_middle' },
    next: { title: '{primeiro_nome}, {curso} com condição especial', text: 'Quem já é aluno paga menos. Use o cupom e garanta o seu.', cta_label: 'Garantir com desconto', action: 'checkout', audience: 'not_owns', placement: 'home_top' }
  };
  function labelOf(list, key) { var x = list.filter(function (r) { return r[0] === key; })[0]; return x ? x[1] : key; }
  function bnStatus(b, now) {
    if (!b.active) return { key: 'off', label: 'Desativado', tone: '' };
    if (b.starts_at && b.starts_at > now) return { key: 'scheduled', label: 'Agendado', tone: 'info' };
    if (b.ends_at && b.ends_at <= now) return { key: 'ended', label: 'Encerrado', tone: 'warn' };
    return { key: 'live', label: 'No ar', tone: 'ok' };
  }
  function bnAudText(b) {
    var c = b.audience_course_title;
    return { not_affiliate: 'Quem ainda não é afiliado', affiliate: 'Só afiliados', owns: 'Quem tem ' + (c || 'o curso'), not_owns: 'Quem ainda não tem ' + (c || 'o curso'), completed: c ? 'Quem concluiu ' + c : 'Quem concluiu algum curso' }[b.audience] || 'Todos os alunos';
  }
  function bnValidText(b) {
    if (b.starts_at && b.ends_at) return B.fmt.date(b.starts_at) + ' a ' + B.fmt.date(b.ends_at);
    if (b.starts_at) return 'A partir de ' + B.fmt.date(b.starts_at);
    if (b.ends_at) return 'Até ' + B.fmt.date(b.ends_at);
    return 'Sem prazo';
  }
  function bnActText(b) {
    if (b.action === 'affiliate') return 'Abre o convite para virar afiliado';
    if (b.action === 'course') return 'Abre a página de ' + (b.course_title || 'um curso');
    if (b.action === 'checkout') return 'Compra de ' + (b.course_title || 'um curso') + (b.coupon ? ' com o cupom ' + b.coupon : '');
    return 'Abre ' + trunc(String(b.url || '').replace(/^https?:\/\/(www\.)?/, ''), 40);
  }
  // mesmas variáveis que a plataforma troca na hora de mostrar o banner, com dados de exemplo
  function bnVars(b, courses) {
    var by = {}, maxAff = 0;
    courses.forEach(function (c) { by[c.id] = c; if (c.status === 'published' && c.aff_enabled) maxAff = Math.max(maxAff, Number(c.aff_commission) || 0); });
    var c = by[b.course_id] || by[b.audience_course_id] || null, def = Number(B.boot0 && B.boot0.aff_default_commission) || 0;
    var pct = b.action === 'affiliate' && c && c.aff_enabled ? Number(c.aff_commission) || 0 : (maxAff || def);
    return { primeiro_nome: 'Iara', curso: c ? c.title : '', preco: c ? money(c.price) : '', comissao: pct + '%', marca: brandName() };
  }
  function bnWarnings(b, courses) {
    var v = bnVars(b, courses), out = [], blank = false;
    B.tpl.missing([b.title, b.text, b.cta_label].join(' ')).forEach(function (k) {
      if (!Object.prototype.hasOwnProperty.call(v, k)) out.push('{' + k + '} não existe e apareceria escrito assim para o aluno.');
      else if (v[k] === '') blank = true;
    });
    if (blank) out.push('{curso} e {preco} ficam em branco porque o banner não está ligado a nenhum curso. Escolha um curso na ação ou no público.');
    return out;
  }
  function bannerPv(b, courses, o) {
    o = o || {};
    var v = bnVars(b, courses), act = b.action || 'link', cc = null, bg;
    courses.forEach(function (c) { if (c.id === b.course_id) cc = c; });
    var title = String(b.title || '').trim() ? B.tpl.render(b.title, v) : 'Título do banner';
    var text = B.tpl.render(b.text || '', v), cta = B.tpl.render(b.cta_label || 'Saiba mais', v), kick = BN_KICK[act] || '';
    if (b.image) bg = H`<img class="bnp__img" src="${B.safeUrl(b.image)}" alt="">`;
    else if (cc && act !== 'affiliate') bg = raw(B.art(cc, { title: false, mark: false }));
    else bg = H`<span class="bnp__rune" aria-hidden="true">ᚠ</span>`;
    return str(H`<div class="bnp bnp--${act}${o.sm ? ' bnp--sm' : ''}" role="img" aria-label="Prévia do banner: ${title}">
      <div class="bnp__bg">${bg}</div><div class="bnp__shade"></div>
      <div class="bnp__body">
        ${kick ? H`<span class="bnp__kicker">${kick}</span>` : ''}
        <div class="bnp__title${String(b.title || '').trim() ? '' : ' is-empty'}">${title}</div>
        ${text.trim() ? H`<p class="bnp__text">${text}</p>` : ''}
        <div class="bnp__acts"><span class="btn btn--primary btn--sm bnp__cta">${cta}${ic('right')}</span>${act === 'checkout' && b.coupon ? H`<span class="chip chip--mustard bnp__coupon">${ic('tag')}Cupom ${b.coupon}</span>` : ''}</div>
      </div></div>`);
  }
  function bnCard(b, courses, now) {
    var st = bnStatus(b, now);
    return H`<article class="panel bnr bnr--${st.key}" aria-label="Banner: ${b.title}">
      <div class="bnr__pv">${raw(bannerPv(b, courses, { sm: true }))}</div>
      <div class="bnr__main">
        <div class="bnr__chips">${chip(st.label, st.tone)}${chip(labelOf(PLACE, b.placement), '', 'image')}${b.priority ? chip('Prioridade ' + b.priority, 'mustard') : ''}</div>
        <dl class="bnr__dl">
          <div><dt>Quem vê</dt><dd>${bnAudText(b)}</dd></div>
          <div><dt>Validade</dt><dd>${bnValidText(b)}</dd></div>
          <div class="bnr__wide"><dt>Ao tocar</dt><dd>${bnActText(b)}</dd></div>
        </dl>
        <div class="bnr__stats">
          <div><b class="t-num">${int(b.clicks || 0)}</b><span>${(b.clicks || 0) === 1 ? 'Clique' : 'Cliques'}</span></div>
          <div><b class="t-num">${int(b.sales || 0)}</b><span>${(b.sales || 0) === 1 ? 'Venda' : 'Vendas'}</span></div>
          <div><b class="t-num">${money(b.revenue || 0)}</b><span>Receita</span></div>
        </div>
        <div class="bnr__foot">
          <label class="switch"><input type="checkbox" data-bn-active="${b.id}"${raw(b.active ? ' checked' : '')}><span>${b.active ? 'Ativo' : 'Desativado'}</span></label>
          <div class="row" style="--gap:6px"><button type="button" class="btn btn--sm" data-act="bn-edit" data-id="${b.id}">${ic('edit')}Editar</button><button type="button" class="iconbtn iconbtn--sm iconbtn--bad" data-act="bn-del" data-id="${b.id}" aria-label="Excluir o banner ${b.title}" title="Excluir">${ic('trash')}</button></div>
        </div>
      </div>
    </article>`;
  }

  pages.banners = function (ctx) {
    var root = A.pageEl(), data = null, courses = [], coupons = [], filter = 'all';
    A.setTitle('Banners');
    var HEAD_SUB = 'Avisos e ofertas que o aluno vê dentro da plataforma, no lugar e para o público que você escolher.';
    root.innerHTML = str(H`${A.pgHead('Banners', HEAD_SUB)}${A.bandSkel(4)}${skel(220)}`);
    load();

    function load(silent) {
      return Promise.all([B.api('adminBanners'), A.getCourses().catch(function () { return []; }), B.api('adminCoupons').catch(function () { return { coupons: [] }; })]).then(function (r) {
        if (!ctx.live()) return;
        data = r[0].banners || []; courses = r[1] || []; coupons = (r[2] && r[2].coupons) || [];
        paint();
      }).catch(function (e) {
        if (!ctx.live()) return;
        if (silent) B.fail(e); else root.innerHTML = str(H`${A.pgHead('Banners', HEAD_SUB)}${A.errorState(e, 'retry')}`);
      });
    }
    function byId(id) { return data.filter(function (b) { return b.id === id; })[0]; }

    function paint() {
      var now = Date.now(), counts = { all: data.length, live: 0, scheduled: 0, off: 0, ended: 0 }, tot = { clicks: 0, sales: 0, revenue: 0 };
      data.forEach(function (b) { counts[bnStatus(b, now).key]++; tot.clicks += b.clicks || 0; tot.sales += b.sales || 0; tot.revenue += b.revenue || 0; });
      if (filter !== 'all' && !counts[filter]) filter = 'all';
      var list = data.filter(function (b) { return filter === 'all' || bnStatus(b, now).key === filter; });
      var FL = [['all', 'Todos'], ['live', 'No ar'], ['scheduled', 'Agendados'], ['off', 'Desativados'], ['ended', 'Encerrados']].filter(function (x) { return x[0] === 'all' || counts[x[0]]; });
      root.innerHTML = str(H`
        ${A.pgHead('Banners', HEAD_SUB, data.length ? H`<button class="btn btn--primary" type="button" data-act="bn-new">${ic('plus')}Novo banner</button>` : '')}
        ${data.length ? H`
          <section class="kband" aria-label="Resultado dos banners">
            ${A.kpiTile('No ar agora', int(counts.live), 'de ' + plural(data.length, 'banner', 'banners'), counts.live ? 'kpi--hero' : '')}
            ${A.kpiTile('Cliques', int(tot.clicks), 'em todos os banners')}
            ${A.kpiTile('Vendas pelos banners', int(tot.sales), tot.clicks ? B.fmt.pct(tot.sales / tot.clicks * 100, 1) + ' dos cliques' : 'ainda sem cliques')}
            ${A.kpiTile('Receita pelos banners', moneyK(tot.revenue), 'vendas aprovadas')}
          </section>
          <div class="note">${ic('info')}<span>Cada lugar mostra um banner por vez para cada aluno: o de <b>maior prioridade</b> entre os que valem para ele. As vendas aparecem aqui quando o aluno compra a partir do banner.</span></div>
          ${FL.length > 2 ? H`<div class="seg bnr-filter" role="group" aria-label="Filtrar por situação">${FL.map(function (x) { return H`<button type="button" data-act="bn-filter" data-v="${x[0]}" class="${filter === x[0] ? 'is-active' : ''}" aria-pressed="${String(filter === x[0])}">${x[1]} <span class="t-num t-faint">${counts[x[0]]}</span></button>`; })}</div>` : ''}
          <div class="bnr-list">${list.map(function (b) { return bnCard(b, courses, now); })}</div>`
        : H`<div class="panel">${A.emptyState('Nenhum banner ainda', 'Use banners para convidar alunos a virar afiliados, oferecer o próximo curso com cupom ou avisar de uma novidade. Eles aparecem na home e abaixo das aulas.',
            H`<button class="btn btn--primary" type="button" data-act="bn-new">${ic('plus')}Criar o primeiro banner</button><button class="btn" type="button" data-act="bn-idea" data-idea="aff">${ic('users')}Convite para afiliação</button><button class="btn" type="button" data-act="bn-idea" data-idea="next">${ic('tag')}Oferta do próximo curso</button>`, 'image')}</div>`}`);
    }

    function setErr(m, name, msg) {
      var e = $('[data-err="' + name + '"]', m.el), f = $('[name="' + name + '"]', m.el);
      if (e) { e.textContent = msg; e.hidden = false; }
      if (f) f.focus();
      return false;
    }

    function editor(b0, seed) {
      var isNew = !b0, first = courses.filter(function (c) { return c.status === 'published'; })[0];
      var d0 = Object.assign({}, BN_BLANK, seed || {}, b0 || {});
      if (isNew && seed && first) {
        if (seed.action === 'checkout') d0.course_id = first.id;
        if (seed.audience === 'not_owns') d0.audience_course_id = first.id;
      }
      var STN = { draft: 'rascunho', coming_soon: 'em breve', archived: 'arquivado' };
      var cOpts = [['', 'Escolha o curso']].concat(courses.filter(function (c) { return c.status !== 'archived' || c.id === d0.course_id || c.id === d0.audience_course_id; })
        .map(function (c) { return [c.id, c.title + (STN[c.status] ? ' · ' + STN[c.status] : '')]; }));
      var qOpts = [['', 'Sem cupom']].concat(coupons.filter(function (q) { return q.active || q.code === d0.coupon; })
        .map(function (q) { return [q.code, q.code + ' · ' + (q.type === 'fixed' ? money(q.value) : B.fmt.pct(q.value, 2)) + (q.course_id ? ' · ' + q.course_title : '')]; }));
      if (d0.coupon && !qOpts.some(function (x) { return x[0] === d0.coupon; })) qOpts.push([d0.coupon, d0.coupon]);
      var img = d0.image || '';
      var m = B.modal({
        title: isNew ? 'Novo banner' : 'Editar banner', size: 'xl',
        body: str(H`<div class="mx-ed bn-ed">
          <form class="mx-ed__form stack" style="--gap:14px" novalidate>
            ${fld({ l: 'Título', n: 'title', v: d0.title, req: true, attrs: 'maxlength="120" autocomplete="off"', ph: 'Ex.: Indique e ganhe até {comissao}' })}
            ${fld({ l: 'Texto', n: 'text', t: 'textarea', rows: 3, v: d0.text, attrs: 'maxlength="400"', hint: 'Opcional. Uma ou duas frases bastam.' })}
            <div class="field"><label>Variáveis (toque para inserir no cursor)</label>${varChips(Object.keys(BN_DOCS), BN_DOCS)}<div class="hint">Funcionam no título, no texto e no botão. Cada aluno vê o próprio nome e o curso do banner.</div></div>
            <div class="grid-2">
              ${fld({ l: 'Texto do botão', n: 'cta_label', v: d0.cta_label, attrs: 'maxlength="40" autocomplete="off"', ph: 'Saiba mais' })}
              ${fld({ l: 'Ao tocar no botão', n: 'action', t: 'select', v: d0.action, opts: BN_ACT })}
            </div>
            <div data-bn-show="link">${fld({ l: 'Endereço do link', n: 'url', t: 'url', v: d0.url, req: true, ph: 'https://', attrs: 'inputmode="url" autocomplete="off"', hint: 'Abre em outra aba. Precisa começar com https://.' })}</div>
            <div data-bn-show="course checkout">${fld({ l: 'Curso', n: 'course_id', t: 'select', v: d0.course_id, opts: cOpts, req: true, hint: 'Só aparece para quem ainda pode ver o curso. Se o aluno já tem o curso, a compra não é oferecida.' })}</div>
            <div data-bn-show="checkout">${fld({ l: 'Cupom aplicado na compra', n: 'coupon', t: 'select', v: d0.coupon, opts: qOpts, hint: 'Opcional. Só cupons ativos aparecem. Crie ou edite em Cupons.' })}</div>
            <div class="field imgf" data-bn-img>
              <label>Imagem de fundo</label>
              <div class="imgf__row">
                <div class="imgf__thumb imgf__thumb--wide" data-thumb>${A.imgThumb(img)}</div>
                <div class="imgf__ctl">
                  <div class="row" style="--gap:8px"><button class="btn btn--sm" type="button" data-bn="img-up">${ic('upload')}Enviar imagem</button><button class="btn btn--sm btn--ghost" type="button" data-bn="img-rm" ${img ? '' : raw('hidden')}>${ic('trash')}Remover</button></div>
                  <input class="input" type="url" data-bn-url inputmode="url" autocomplete="off" placeholder="${/^data:/i.test(img) ? 'Imagem enviada. Cole um endereço para trocar.' : 'ou cole o endereço da imagem'}" value="${/^data:/i.test(img) ? '' : img}" aria-label="Endereço da imagem do banner">
                  <div class="hint">Opcional. Sem imagem, o banner usa a capa do curso ou o símbolo da casa.</div>
                </div>
              </div>
            </div>
            <h4 class="t-hud-sub mx-sep">Onde aparece e para quem</h4>
            <div class="grid-2">
              ${fld({ l: 'Lugar', n: 'placement', t: 'select', v: d0.placement, opts: PLACE })}
              ${fld({ l: 'Prioridade', n: 'priority', t: 'number', v: d0.priority || '', ph: '0', attrs: 'min="0" max="100" step="1" inputmode="numeric"', hint: 'De 0 a 100. Maior aparece primeiro.' })}
            </div>
            ${fld({ l: 'Quem vê', n: 'audience', t: 'select', v: d0.audience, opts: BN_AUD })}
            <div data-bn-aud>${fld({ l: 'Curso do público', n: 'audience_course_id', t: 'select', v: d0.audience_course_id, opts: cOpts })}</div>
            <div class="grid-2">
              ${fld({ l: 'Começa em', n: 'starts_at', t: 'date', v: B.dateInput(d0.starts_at), hint: 'Vazio começa na hora.' })}
              ${fld({ l: 'Termina em', n: 'ends_at', t: 'date', v: B.dateInput(d0.ends_at), attrs: 'data-end', hint: 'Vazio não tem prazo. Vale até o fim desse dia.' })}
            </div>
            ${sw({ l: 'Banner ativo', n: 'active', v: d0.active, hint: 'Desligado, o banner sai do ar sem ser apagado.' })}
          </form>
          <aside class="mx-ed__pv bn-ed__pv" aria-label="Prévia do banner">
            <div class="mx-ed__pvhead"><h4 class="t-hud-sub">Prévia na plataforma</h4><span class="t-xs t-faint">dados de exemplo</span></div>
            <div class="bn-ed__stage" id="bn-pv"></div>
            <div class="mx-warn" id="bn-warn" hidden></div>
          </aside>
        </div>`),
        actions: [{ label: 'Cancelar' }, {
          label: isNew ? 'Criar banner' : 'Salvar banner', kind: 'primary',
          onClick: function (mm) {
            $$('.err', mm.el).forEach(function (e) { e.hidden = true; });
            var d = collect();
            if (!d.title) return setErr(mm, 'title', 'Dê um título ao banner.');
            if (d.action === 'link' && !/^https?:\/\/\S+/i.test(d.url)) return setErr(mm, 'url', 'Informe o link do botão, começando com https://.');
            if ((d.action === 'course' || d.action === 'checkout') && !d.course_id) return setErr(mm, 'course_id', 'Escolha o curso do banner.');
            if ((d.audience === 'owns' || d.audience === 'not_owns') && !d.audience_course_id) return setErr(mm, 'audience_course_id', 'Escolha o curso que define o público.');
            if (d.starts_at && d.ends_at && d.ends_at < d.starts_at) return setErr(mm, 'ends_at', 'O fim não pode ser antes do começo.');
            if (d.image && !/^(data:|https?:\/\/)/i.test(d.image)) { B.toast('O endereço da imagem precisa começar com https://.', 'bad'); urlIn.focus(); return false; }
            if (b0) d.id = b0.id;
            return B.api('adminBannerSave', { banner: d }).then(function () {
              B.toast(isNew ? 'Banner criado' : 'Banner salvo', 'ok');
              if (ctx.live()) return load(true);
            });
          }
        }]
      });
      A.guardForm(m);
      var form = $('form', m.el), pv = $('#bn-pv', m.el), warn = $('#bn-warn', m.el), thumb = $('[data-thumb]', m.el), rm = $('[data-bn="img-rm"]', m.el), urlIn = $('[data-bn-url]', m.el);
      var audLbl = $('[data-bn-aud] label', m.el), audSel = $('[name=audience_course_id]', m.el), last = $('[name=title]', m.el);
      function collect() {
        var v = B.formData(form), act = v.action, aud = v.audience;
        return {
          active: !!v.active, title: String(v.title || '').trim(), text: String(v.text || '').trim(), cta_label: String(v.cta_label || '').trim(),
          action: act, url: act === 'link' ? String(v.url || '').trim() : '',
          course_id: act === 'course' || act === 'checkout' ? v.course_id : '', coupon: act === 'checkout' ? v.coupon : '',
          image: img, placement: v.placement, audience: aud, audience_course_id: /^(owns|not_owns|completed)$/.test(aud) ? v.audience_course_id : '',
          starts_at: v.starts_at || 0, ends_at: v.ends_at || 0, priority: Math.max(0, Math.min(100, Math.round(Number(v.priority) || 0)))
        };
      }
      function repaint() {
        var d = collect();
        $$('[data-bn-show]', form).forEach(function (el) { el.hidden = el.dataset.bnShow.split(' ').indexOf(d.action) < 0; });
        var needAud = /^(owns|not_owns|completed)$/.test(d.audience);
        $('[data-bn-aud]', form).hidden = !needAud;
        if (needAud) {
          audLbl.textContent = { owns: 'Curso que a pessoa precisa ter', not_owns: 'Curso que a pessoa ainda não tem', completed: 'Curso concluído (opcional)' }[d.audience];
          audSel.options[0].text = d.audience === 'completed' ? 'Qualquer curso' : 'Escolha o curso';
        }
        pv.innerHTML = bannerPv(d, courses);
        var w = bnWarnings(d, courses);
        warn.hidden = !w.length; warn.innerHTML = w.map(function (x) { return '<div>' + B.esc(x) + '</div>'; }).join('');
      }
      function setImg(u) {
        img = u || '';
        thumb.innerHTML = str(A.imgThumb(img)); rm.hidden = !img;
        urlIn.value = /^data:/i.test(img) ? '' : img;
        urlIn.placeholder = /^data:/i.test(img) ? 'Imagem enviada. Cole um endereço para trocar.' : 'ou cole o endereço da imagem';
        repaint();
      }
      form.addEventListener('input', repaint);
      form.addEventListener('change', repaint);
      form.addEventListener('focusin', function (ev) { var e = ev.target; if (e && e.name && /^(title|text|cta_label)$/.test(e.name)) last = e; });
      urlIn.addEventListener('input', function () { img = urlIn.value.trim(); thumb.innerHTML = str(A.imgThumb(/^https?:\/\//i.test(img) ? img : '')); rm.hidden = !img; repaint(); });
      B.on(m.body, 'click', '[data-ins]', function (ev, el) { insertAt(last, el.dataset.ins); });
      B.on(m.body, 'click', '[data-bn]', function (ev, el) {
        if (el.dataset.bn === 'img-rm') { setImg(''); return; }
        A.chooseAndUpload(el, { maxW: 1600 }).then(function (u) { if (u && !m.closed) setImg(u); }).catch(B.fail);
      });
      repaint();
    }

    S.on.change = function (ev) {
      var t = ev.target, id = t && t.dataset && t.dataset.bnActive; if (!id) return;
      var b = byId(id); if (!b) return;
      var v = t.checked; t.disabled = true;
      B.api('adminBannerSave', { banner: Object.assign({}, b, { active: v }) }).then(function (r) {
        Object.assign(b, r.banner); B.toast(v ? 'Banner ativado' : 'Banner desativado', 'ok', 1800); if (ctx.live()) paint();
      }).catch(function (e) { t.checked = !v; t.disabled = false; B.fail(e); });
    };
    S.acts = {
      retry: function () { pages.banners(ctx); },
      'bn-new': function () { editor(null); },
      'bn-idea': function (el) { editor(null, BN_IDEAS[el.dataset.idea]); },
      'bn-edit': function (el) { var b = byId(el.dataset.id); if (b) editor(b); },
      'bn-filter': function (el) { filter = el.dataset.v; paint(); },
      'bn-del': function (el) {
        var b = byId(el.dataset.id); if (!b) return;
        B.confirm({ title: 'Excluir banner', text: '“' + b.title + '” sai do ar para todos e os cliques e as vendas dele deixam de aparecer aqui. Para só tirar do ar por um tempo, desative o banner.', ok: 'Excluir banner', danger: true }).then(function (ok) {
          if (!ok) return;
          A.busy(el, B.api('adminBannerDelete', { id: b.id })).then(function () { data = data.filter(function (x) { return x.id !== b.id; }); B.toast('Banner excluído', 'ok'); paint(); }).catch(B.fail);
        });
      }
    };
  };

  /* =====================================================================
     COMERCIAL (/comercial): o time de vendas
     ===================================================================== */
  function selFlag(s) {
    if (s.status === 'blocked') return chip('Bloqueado', 'bad');
    if (!s.has_password) return chip('Convite pendente', 'warn');
    return '';
  }
  function selSeen(s) { return s.last_seen ? 'Visto ' + B.fmt.rel(s.last_seen) : (s.has_password ? 'Nunca entrou' : 'Ainda não criou a senha'); }
  function selWa(s) {
    var link = A.waLink(s.phone, '');
    return link ? H`<a class="iconbtn iconbtn--sm iconbtn--wa" href="${link}" target="_blank" rel="noopener" aria-label="Chamar ${s.name} no WhatsApp" title="WhatsApp">${ic('whatsapp')}</a>` : '';
  }
  function selWho(s) {
    return H`<div class="sel">${raw(B.avatar(s, 38))}<div class="min0">
      <div class="sel__name"><b class="ellipsis">${s.name}</b>${selFlag(s)}</div>
      <div class="t-xs t-faint ellipsis">${s.email}</div>
      <div class="t-xs t-faint">${s.phone ? B.fmt.phone(s.phone) : 'Sem WhatsApp'} · ${selSeen(s)}</div>
    </div></div>`;
  }
  function selRules(s) {
    return H`${(s.seller_commission || 0) > 0 ? H`<b class="t-num">${B.fmt.pct(s.seller_commission, 1)}</b> de comissão` : H`<b>Sem comissão</b>`}<div class="t-xs t-faint">desconto até ${B.fmt.pct(s.seller_max_discount || 0, 1)}</div>`;
  }
  function selLeads(s) {
    return H`<b class="t-num">${int(s.open_leads || 0)}</b> <span class="t-faint">${(s.open_leads || 0) === 1 ? 'aberto' : 'abertos'}</span><div>${s.overdue ? chip(plural(s.overdue, 'atrasado', 'atrasados'), 'warn') : H`<span class="t-xs t-faint">em dia</span>`}</div>`;
  }
  function selMonth(s) { return H`<b class="t-num">${plural(s.won_month || 0, 'venda', 'vendas')}</b><div class="t-xs t-faint t-num">${money(s.revenue_month || 0)}</div>`; }
  function selComm(s) {
    return H`<dl class="sel__comm">
      <div><dt>A liberar</dt><dd class="t-num">${money(s.pending || 0)}</dd></div>
      <div class="${s.available > 0 ? 'is-hot' : ''}"><dt>Disponível</dt><dd class="t-num">${money(s.available || 0)}</dd></div>
      <div><dt>Pago</dt><dd class="t-num">${money(s.paid || 0)}</dd></div>
    </dl>`;
  }
  function selPay(s) {
    return s.available > 0 ? H`<button type="button" class="btn btn--sm btn--primary sel__pay" data-act="sel-pay" data-id="${s.id}">${ic('pix')}Pagar ${money(s.available)}</button>` : '';
  }
  function selActs(s, noPay) {
    return H`<div class="sel__acts">
      ${noPay ? '' : selPay(s)}
      <button type="button" class="iconbtn iconbtn--sm" data-act="sel-edit" data-id="${s.id}" aria-label="Editar ${s.name}" title="Editar">${ic('edit')}</button>
      <button type="button" class="iconbtn iconbtn--sm" data-act="sel-invite" data-id="${s.id}" aria-label="Reenviar convite para ${s.name}" title="Reenviar convite">${ic('mail')}</button>
      <a class="iconbtn iconbtn--sm" href="${B.base}comercial.html" target="_blank" rel="noopener" aria-label="Abrir o funil de vendas" title="Abrir o funil de vendas">${ic('target')}</a>
      ${selWa(s)}
    </div>`;
  }
  function selRow(s) {
    return H`<tr class="${s.status === 'blocked' ? 'is-off' : ''}">
      <td>${selWho(s)}</td><td class="nowrap">${selRules(s)}</td><td class="nowrap">${selLeads(s)}</td><td class="nowrap">${selMonth(s)}</td><td>${selComm(s)}${selPay(s)}</td><td class="num">${selActs(s, true)}</td>
    </tr>`;
  }
  function selCard(s) {
    return H`<article class="panel sel-card${s.status === 'blocked' ? ' is-off' : ''}" aria-label="Vendedor ${s.name}">
      ${selWho(s)}
      <div class="sel-card__rules t-sm">${selRules(s)}</div>
      <div class="sel-card__grid">
        <div><span>Leads abertos</span><b class="t-num">${int(s.open_leads || 0)}</b></div>
        <div class="${s.overdue ? 'is-warn' : ''}"><span>Atrasados</span><b class="t-num">${int(s.overdue || 0)}</b></div>
        <div><span>Vendas no mês</span><b class="t-num">${int(s.won_month || 0)}</b></div>
        <div><span>Receita no mês</span><b class="t-num">${moneyK(s.revenue_month || 0)}</b></div>
      </div>
      ${selComm(s)}
      ${selActs(s)}
    </article>`;
  }

  pages.comercial = function (ctx) {
    var root = A.pageEl(), data = null;
    var SUB = 'O time de vendas: quem está vendendo, quanto cada um deixou de comissão e o que ainda falta pagar.';
    var HEAD_ACTS = H`<a class="btn btn--ghost" href="${B.base}comercial.html" target="_blank" rel="noopener">${ic('external')}Abrir área comercial</a><button class="btn btn--primary" type="button" data-act="sel-new">${ic('plus')}Novo vendedor</button>`;
    A.setTitle('Comercial');
    root.innerHTML = str(H`${A.pgHead('Comercial', SUB)}${A.bandSkel(4)}${skel(260)}`);
    load();

    function load(silent) {
      return A.getSellers(true).then(function (r) {
        if (!ctx.live()) return;
        data = r; paint();
      }).catch(function (e) {
        if (!ctx.live()) return;
        if (silent) B.fail(e); else root.innerHTML = str(H`${A.pgHead('Comercial', SUB)}${A.errorState(e, 'retry')}`);
      });
    }
    function byId(id) { return ((data && data.sellers) || []).filter(function (s) { return s.id === id; })[0]; }
    function sumOf(ss, k) { return ss.reduce(function (a, s) { return a + (Number(s[k]) || 0); }, 0); }

    function paint() {
      var ss = data.sellers || [], dflt = data.defaults || {}, act = ss.filter(function (s) { return s.status === 'active'; }).length;
      var overdue = sumOf(ss, 'overdue'), sales = sumOf(ss, 'won_month'), rev = sumOf(ss, 'revenue_month'), free = data.unassigned || 0;
      var avail = sumOf(ss, 'available');
      root.innerHTML = str(H`
        ${A.pgHead('Comercial', SUB, HEAD_ACTS)}
        <section class="kband" aria-label="Resumo do time comercial">
          ${A.kpiTile('Leads sem dono', int(free), free ? 'esperando na fila' : 'fila zerada', free ? 'kpi--warn' : '')}
          ${A.kpiTile('Follow-ups atrasados', int(overdue), overdue ? 'nos leads dos vendedores' : 'tudo em dia', overdue ? 'kpi--warn' : '')}
          ${A.kpiTile('Vendas no mês', int(sales), 'fechadas por vendedores')}
          ${A.kpiTile('Receita no mês', moneyK(rev), avail > 0 ? money(avail) + ' de comissão para pagar' : plural(act, 'vendedor ativo', 'vendedores ativos'), 'kpi--hero')}
        </section>
        <div class="note">${ic('info')}<span><b>Como funciona.</b> Quem quase comprou (carrinho abandonado, Pix vencido, aluno que parou) vira um lead. O lead cai na fila, vai para um vendedor, que chama no WhatsApp e pode mandar um link com condição especial. A comissão dele fica <b>a liberar</b> durante a garantia e depois <b>disponível</b> para você pagar. A distribuição automática está <b>${dflt.auto_assign ? 'ligada' : 'desligada'}</b>${dflt.auto_assign ? ': cada lead novo vai para o vendedor com menos leads abertos.' : ': os leads esperam na fila até alguém assumir.'} <a href="#/config?s=comercial">Ajustar em Configurações</a>.</span></div>
        ${ss.length ? H`
          <div class="list-cap"><span class="t-sm t-muted">${plural(ss.length, 'vendedor', 'vendedores')} · ${act} ${act === 1 ? 'ativo' : 'ativos'}</span></div>
          <div class="sel-wide table-wrap"><table class="table sel-table">
            <thead><tr><th>Vendedor</th><th>Regras</th><th>Leads</th><th>No mês</th><th>Comissões</th><th><span class="sr-only">Ações</span></th></tr></thead>
            <tbody>${ss.map(selRow)}</tbody></table></div>
          <div class="sel-narrow">${ss.map(selCard)}</div>`
        : H`<div class="panel">${A.emptyState('Nenhum vendedor ainda', 'Cadastre quem vai atender os leads. Ele recebe um convite por e-mail, cria a senha e já entra na área comercial. Você define a comissão e o maior desconto que ele pode dar.', H`<button class="btn btn--primary" type="button" data-act="sel-new">${ic('plus')}Cadastrar o primeiro vendedor</button>`, 'target')}</div>`}`);
    }

    function inviteModal(link, name, what) {
      B.modal({
        title: what, size: 'wide',
        body: str(H`<p class="t-muted t-sm">Na demonstração nenhum e-mail sai de verdade. Copie o link e abra em outra aba para ver o que ${firstName(name)} receberia.</p>
          <div class="input-group" style="margin-top:12px"><input class="input" readonly value="${link}" aria-label="Link do convite"><button type="button" class="btn btn--sm addon-btn" data-copy="${link}">${ic('copy')}Copiar</button></div>`),
        actions: [{ label: 'Fechar' }]
      });
    }

    function editor(s0) {
      var isNew = !s0, dflt = data.defaults || {};
      var s = s0 || { name: '', email: '', phone: '', pix_key: '', seller_commission: dflt.commission == null ? 10 : dflt.commission, seller_max_discount: dflt.max_discount == null ? 20 : dflt.max_discount, status: 'active' };
      var m = B.modal({
        title: isNew ? 'Novo vendedor' : 'Editar vendedor', size: 'wide',
        body: str(H`<form class="stack" style="--gap:14px" novalidate>
          ${fld({ l: 'Nome', n: 'name', v: s.name, req: true, attrs: 'maxlength="120" autocomplete="off"' })}
          <div class="grid-2">
            ${fld({ l: 'E-mail', n: 'email', t: 'email', v: s.email, req: isNew, attrs: (isNew ? '' : 'disabled ') + 'inputmode="email" autocomplete="off" spellcheck="false"', hint: isNew ? 'É o login dele. O convite com o link para criar a senha vai para este e-mail.' : 'É o login dele e não muda por aqui.' })}
            ${fld({ l: 'WhatsApp', n: 'phone', t: 'tel', v: s.phone ? B.fmt.phone(s.phone) : '', ph: '(11) 99999-0000', attrs: 'inputmode="tel" autocomplete="off"' })}
          </div>
          <div class="grid-2">
            ${fld({ l: 'Comissão', n: 'seller_commission', t: 'number', v: s.seller_commission, post: '%', attrs: 'min="0" max="90" step="0.5" inputmode="decimal"', hint: 'Sobre cada venda que ele fechar, de 0 a 90. Padrão da casa: ' + (dflt.commission == null ? 10 : dflt.commission) + '%.' })}
            ${fld({ l: 'Desconto máximo', n: 'seller_max_discount', t: 'number', v: s.seller_max_discount, post: '%', attrs: 'min="0" max="100" step="1" inputmode="numeric"', hint: 'O maior desconto que ele pode dar numa condição especial. Padrão da casa: ' + (dflt.max_discount == null ? 20 : dflt.max_discount) + '%.' })}
          </div>
          ${fld({ l: 'Chave Pix', n: 'pix_key', v: s.pix_key, ph: 'CPF, e-mail, celular ou chave aleatória', attrs: 'maxlength="120" autocomplete="off"', hint: 'Usada para pagar as comissões.' })}
          ${isNew ? '' : sw({ l: 'Vendedor ativo', n: 'active', v: s.status !== 'blocked', hint: 'Desligado, ele não entra na área comercial e deixa de receber leads.' })}
        </form>`),
        actions: [{ label: 'Cancelar' }, {
          label: isNew ? 'Cadastrar e enviar convite' : 'Salvar vendedor', kind: 'primary',
          onClick: function (mm) {
            $$('.err', mm.el).forEach(function (e) { e.hidden = true; });
            var v = B.formData($('form', mm.el));
            function bad(name, msg) { var e = $('[data-err="' + name + '"]', mm.el), f = $('[name="' + name + '"]', mm.el); if (e) { e.textContent = msg; e.hidden = false; } if (f) f.focus(); return false; }
            if (String(v.name || '').trim().length < 2) return bad('name', 'Informe o nome do vendedor.');
            if (isNew && !B.validEmail(v.email)) return bad('email', 'Informe um e-mail válido.');
            var com = Number(v.seller_commission), dsc = Number(v.seller_max_discount);
            if (v.seller_commission === '' || isNaN(com) || com < 0 || com > 90) return bad('seller_commission', 'A comissão vai de 0 a 90.');
            if (v.seller_max_discount === '' || isNaN(dsc) || dsc < 0 || dsc > 100) return bad('seller_max_discount', 'O desconto vai de 0 a 100.');
            var o = { name: String(v.name).trim(), phone: A.onlyDigits(v.phone), seller_commission: com, seller_max_discount: dsc, pix_key: String(v.pix_key || '').trim() };
            if (isNew) o.email = String(v.email).trim(); else { o.id = s.id; o.status = v.active ? 'active' : 'blocked'; }
            return B.api('adminSellerSave', { seller: o }).then(function (r) {
              A.drop('sellers');
              if (!isNew) B.toast('Vendedor salvo', 'ok');
              else if (r.invite_link) { B.toast('Vendedor cadastrado', 'ok'); setTimeout(function () { inviteModal(r.invite_link, o.name, 'Convite do vendedor'); }, 320); }
              else B.toast(r.created ? 'Vendedor cadastrado. O convite foi enviado por e-mail.' : 'Esse e-mail já tinha cadastro. Agora a pessoa também é vendedora e recebeu o convite.', 'ok', 5200);
              if (ctx.live()) return load(true);
            });
          }
        }]
      });
      A.guardForm(m);
    }

    function payModal(s) {
      B.modal({
        title: 'Registrar pagamento', size: 'wide',
        body: str(H`<div class="pay">
          <div class="pay__amt"><span class="t-hud-sub">Valor disponível</span><b class="t-num">${money(s.available)}</b></div>
          ${A.dl([['Vendedor', s.name], ['Chave Pix', s.pix_key ? H`<span class="code">${s.pix_key}</span> ${A.copyBtn(s.pix_key, 'Copiar a chave Pix')}` : H`<span class="t-bad">Ainda não cadastrada</span>`]])}
          ${s.pix_key ? '' : H`<div class="note note--warn">${ic('alert')}<span>${firstName(s.name)} não cadastrou uma chave Pix. Peça a chave e registre em Editar antes de pagar.</span></div>`}
          <p class="t-sm t-muted">A plataforma não move dinheiro: faça o Pix primeiro e confirme depois. As comissões liberadas viram pagas e ${firstName(s.name)} recebe um e-mail.</p>
        </div>`),
        actions: [{ label: 'Cancelar' }, {
          label: 'Registrar pagamento de ' + money(s.available), kind: 'primary',
          onClick: function () {
            return B.api('adminPayout', { aff_id: s.id }).then(function () {
              A.drop('sellers', 'affs'); B.toast('Pagamento registrado', 'ok'); if (ctx.live()) return load(true);
            });
          }
        }]
      });
    }

    S.acts = {
      retry: function () { pages.comercial(ctx); },
      'sel-new': function () { editor(null); },
      'sel-edit': function (el) { var s = byId(el.dataset.id); if (s) editor(s); },
      'sel-pay': function (el) { var s = byId(el.dataset.id); if (s) payModal(s); },
      'sel-invite': function (el) {
        var s = byId(el.dataset.id); if (!s) return;
        A.busy(el, B.api('adminSellerInvite', { id: s.id })).then(function (r) {
          if (r.invite_link) inviteModal(r.invite_link, s.name, 'Convite do vendedor');
          else B.toast('Convite enviado para ' + s.email, 'ok', 3200);
        }).catch(B.fail);
      }
    };
  };

})();

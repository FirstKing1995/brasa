/* =====================================================================
   BRASA · certificado.js — certificado de conclusão e verificação.
   certificado.html?c=CODIGO  →  ação `certificate {code}`.
   Sem código ou com código inválido: campo para digitar e verificar.
   ===================================================================== */
(function (w, d) {
  'use strict';
  var B = w.B, root = d.getElementById('app');
  if (!B || !root) return;

  var RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
  var S = { cert: null };

  function normCode(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12); }
  function home() { return B.base + 'index.html'; }
  function longDate(ts) {
    try { return new Date(Number(ts)).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' }); }
    catch (e) { return B.fmt.date(ts); }
  }
  function hoursText(h) { h = Number(h) || 0; return Number(h) === 1 ? '1 hora' : B.fmt.num(h) + ' horas'; }
  function verifyUrl(code) { return B.siteUrl() + 'certificado.html?c=' + encodeURIComponent(code); }
  function bare(u) { return String(u).replace(/^https?:\/\//, ''); }
  // o tamanho da letra acompanha o comprimento, para nunca estourar o quadro
  function nameSize(n) { return n <= 15 ? 'xl' : n <= 22 ? 'l' : n <= 30 ? 'm' : 's'; }
  function courseSize(n) { return n <= 22 ? 'l' : n <= 40 ? 'm' : 's'; }

  function shell() {
    root.className = 'cp';
    root.innerHTML =
      '<header class="cp-top no-print"><a class="brand" href="' + B.esc(home()) + '">' + B.brandMark() + '</a>' +
      '<a class="btn btn--ghost btn--sm" href="' + B.esc(home()) + '">Ver cursos</a></header>' +
      '<main class="cp-main" id="cpMain"><div class="lp-boot" role="status" aria-label="Carregando"><div class="spinner"></div></div></main>';
  }
  function main() { return B.$('#cpMain', root); }

  /* ---------- verificar um código ---------- */
  function formView(code, msg) {
    d.title = 'Verificar certificado | ' + B.brand.name;
    main().innerHTML =
      '<section class="cp-form hud" aria-labelledby="cpFormT">' +
      '<h1 class="t-1" id="cpFormT">Verificar certificado</h1>' +
      '<p class="t-lead">Digite o código que aparece no rodapé do certificado. Ele tem 8 letras e números.</p>' +
      '<form class="stack" id="cpForm" novalidate style="--gap:14px">' +
      '<div class="field"><label for="cpCode">Código do certificado</label>' +
      '<input class="input t-num" id="cpCode" name="code" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ex.: BRZ7KQ4M" value="' + B.esc(code || '') + '"' + (msg ? ' aria-describedby="cpErr" aria-invalid="true"' : '') + '></div>' +
      '<p class="err" id="cpErr" role="alert"' + (msg ? '' : ' hidden') + '>' + B.esc(msg || '') + '</p>' +
      '<button class="btn btn--primary btn--lg" type="submit">Verificar</button></form></section>';
    var f = B.$('#cpForm', root), inp = B.$('#cpCode', root);
    inp.addEventListener('input', function () { var p = inp.selectionStart; inp.value = normCode(inp.value); try { inp.setSelectionRange(p, p); } catch (e) {} });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = normCode(inp.value), err = B.$('#cpErr', root);
      if (c.length < 4) { err.hidden = false; err.textContent = 'Digite o código completo do certificado.'; inp.classList.add('is-invalid'); inp.focus(); return; }
      var btn = B.$('button[type="submit"]', f); btn.classList.add('is-loading');
      lookup(c, false).then(function () {}, function () {}).then(function () { btn.classList.remove('is-loading'); });
    });
    if (msg) inp.focus();
  }

  function lookup(code, first) {
    return B.api('certificate', { code: code }).then(function (c) {
      S.cert = c;
      if (!first) { try { history.replaceState(null, '', '?c=' + encodeURIComponent(c.code)); } catch (e) {} }
      certView(c);
    }, function (e) {
      if (e && e.code && e.code !== 'NOT_FOUND') B.fail(e);
      formView(code, (e && e.message) || 'Certificado não encontrado. Confira o código.');
    });
  }

  /* ---------- o certificado ---------- */
  function certHTML(c) {
    var name = String(c.name || '').trim(), title = String(c.course_title || '').trim();
    var brand = c.brand || B.brand.name, inst = String(c.instructor || '').trim();
    var url = verifyUrl(c.code);
    return '<div class="cert-scroll" tabindex="0" role="group" aria-label="Certificado de ' + B.esc(name) + '. Role para os lados para ver inteiro.">' +
      '<div class="cert-wrap"><article class="cert" aria-label="Certificado de conclusão">' +
      '<div class="cert__bg" aria-hidden="true">' + B.sigil(c.code + title, 'cert__mark') + '</div>' +
      '<div class="cert__frame" aria-hidden="true"></div>' +
      '<div class="cert__runes cert__runes--t" aria-hidden="true">' + RUNES + RUNES + '</div>' +
      '<div class="cert__runes cert__runes--b" aria-hidden="true">' + RUNES + RUNES + '</div>' +
      '<div class="cert__in">' +
      '<header class="cert__head"><div class="cert__brand">' + B.sigil(brand, '', 'brand') + '<span>' + B.esc(brand) + '</span></div>' +
      '<p class="cert__date">Emitido em ' + B.esc(longDate(c.issued_at)) + '</p></header>' +
      '<div class="cert__body">' +
      '<h1 class="cert__kind">Certificado de conclusão</h1>' +
      '<p class="cert__name cert__name--' + nameSize(name.length) + '">' + B.esc(name) + '</p>' +
      '<p class="cert__lead">concluiu o curso</p>' +
      '<p class="cert__course cert__course--' + courseSize(title.length) + '">' + B.esc(title) + '</p>' +
      '<p class="cert__hours">Carga horária de ' + B.esc(hoursText(c.hours)) + '</p></div>' +
      '<footer class="cert__foot">' +
      '<div class="cert__sign"><p class="cert__sig">' + B.esc(inst || brand) + '</p><p class="cert__signlbl">' + (inst ? 'Instrutor' : 'Direção') + '</p></div>' +
      '<div class="cert__verify"><p class="cert__vl">Verifique em</p><p class="cert__url">' + B.esc(bare(url)) + '</p>' +
      '<p class="cert__code">Código <b>' + B.esc(c.code) + '</b></p></div></footer>' +
      '</div></article></div></div>';
  }

  function certView(c) {
    d.title = 'Certificado de ' + c.name + ' | ' + (c.brand || B.brand.name);
    var url = verifyUrl(c.code);
    main().innerHTML =
      '<div class="cp-status no-print"><span class="chip chip--ok">' + B.icon('check') + 'Certificado verificado</span>' +
      '<span class="t-sm t-muted">Emitido por ' + B.esc(c.brand || B.brand.name) + ' em ' + B.esc(B.fmt.date(c.issued_at)) + '</span></div>' +
      certHTML(c) +
      '<p class="hint no-print cp-scrollhint" aria-hidden="true">Deslize para os lados para ver o certificado inteiro.</p>' +
      '<div class="cp-actions no-print">' +
      (B.demo ? '' : '<button type="button" class="btn btn--primary btn--lg" data-print>' + B.icon('download') + 'Imprimir ou salvar em PDF</button>') +
      '<button type="button" class="btn ' + (B.demo ? 'btn--primary btn--lg' : 'btn--ghost') + '" data-copy>' + B.icon('link') + 'Copiar link de verificação</button>' +
      (c.course_slug ? '<a class="btn btn--ghost" href="' + B.esc(B.base + 'lp.html?c=' + encodeURIComponent(c.course_slug)) + '">Ver o curso</a>' : '') +
      '</div>' +
      (B.demo ? '<p class="hint no-print cp-hint">Na demonstração a impressão fica desativada. Na versão publicada aparece o botão Imprimir ou salvar em PDF.</p>' : '') +
      '<details class="cp-other no-print"><summary>Verificar outro código</summary>' +
      '<form class="row row--nowrap" id="cpAgain" novalidate style="--gap:8px"><label class="sr-only" for="cpCode2">Código do certificado</label>' +
      '<input class="input t-num" id="cpCode2" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Código">' +
      '<button class="btn btn--ghost" type="submit">Verificar</button></form></details>';

    var pr = B.$('[data-print]', root);
    if (pr) pr.addEventListener('click', function () { w.print(); });
    B.$('[data-copy]', root).addEventListener('click', function (e) { B.copy(url, e.currentTarget); });
    var again = B.$('#cpAgain', root);
    again.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = normCode(B.$('#cpCode2', root).value);
      if (v.length < 4) { B.toast('Digite o código completo do certificado.', 'bad'); return; }
      lookup(v, false);
    });
  }

  B.boot(function () {
    B.demoBar('lp');
    shell();
    var code = normCode(B.qs('c') || B.qs('code'));
    return B.loadBrand().then(function () {
      var hd = B.$('.cp-top .brand', root); if (hd) hd.innerHTML = B.brandMark();
    }, function () {}).then(function () {
      if (!code) return formView('', '');
      return lookup(code, true);
    });
  });
})(window, document);

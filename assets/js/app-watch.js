/* =====================================================================
   BRASA · app-watch.js — página da aula (player, próximo episódio,
   anotações, materiais, playlist)
   ===================================================================== */
(function (w, d) {
  'use strict';
  var A = w.APP, esc = B.esc;

  A.pages.watch = function (id) {
    var main = A.enter('watch');
    Promise.all([B.api('lesson', { lesson_id: id }), A.loadHome().catch(function () { return null; })]).then(function (rs) {
      render(main, rs[0]);
    }).catch(function (e) {
      if (e.code === 'LOCKED') { B.toast(e.message, 'info', 5000); if (history.length > 1) history.back(); else B.router.go('/'); return; }
      A.fail(main, e);
    });
  };

  function tab(key, label, on, cls) {
    return '<button type="button" class="tab' + (on ? ' is-active' : '') + (cls ? ' ' + cls : '') + '" role="tab" aria-selected="' + !!on + '" data-tab="' + key + '">' + label + '</button>';
  }
  function mats(list) {
    if (!list || !list.length) return '<p class="t-muted">Esta aula não tem materiais de apoio.</p>';
    return '<div class="list">' + list.map(function (m) {
      return '<a class="list__item mat" href="' + esc(B.safeUrl(m.url)) + '" target="_blank" rel="noopener">' + B.icon('file') + '<span class="grow ellipsis">' + esc(m.name || 'Material') + '</span>' + B.icon('external') + '</a>';
    }).join('') + '</div>';
  }
  function playlist(r, co) {
    return '<div class="pl">' + r.playlist.map(function (s) {
      return '<div class="pl__season"><div class="pl__stitle t-hud">Temporada ' + s.n + ' · ' + esc(s.title) + '</div>' + s.lessons.map(function (x) {
        var cur = x.id === r.lesson.id;
        return '<button type="button" class="pl__item' + (cur ? ' is-current' : '') + (x.locked ? ' is-locked' : '') + (x.done ? ' is-done' : '') + '" data-lesson="' + x.id + '"' + (cur ? ' aria-current="true"' : '') + '>' +
          '<span class="pl__thumb">' + B.epArt(x, x.label, co) + '</span>' +
          '<span class="pl__text min0"><span class="pl__label t-hud">' + esc(x.label) + (cur ? ' · assistindo' : '') + '</span><span class="pl__title">' + esc(x.title) + '</span><span class="t-xs t-faint">' + (x.duration_min ? B.fmt.dur(x.duration_min) : '') + '</span></span>' +
          '<span class="pl__state">' + (x.done ? B.icon('check') : x.locked ? B.icon('lock') : '') + '</span></button>';
      }).join('') + '</div>';
    }).join('') + '</div>';
  }
  function upsell(c) {
    var full = A.byId(c.id) || c;
    var n = full.stats ? full.stats.lessons : 0;
    return '<div class="upsell panel hud"><div class="min0"><div class="t-tag">aula grátis</div><p>Você está assistindo uma amostra de <strong>' + esc(c.title) + '</strong>.' + (n ? ' Desbloqueie as ' + n + ' aulas, os materiais e o certificado.' : '') + '</p><div class="price">' + A.priceHtml(full) + '</div></div>' +
      '<button type="button" class="btn btn--primary btn--lg" data-buy="' + c.id + '">' + B.icon('unlock') + 'Desbloquear o curso</button></div>';
  }

  function render(main, r) {
    var l = r.lesson, c = r.course, owned = r.owned, co = A.byId(c.id) || c;
    A.state.course = A.byId(c.id) || c;
    main.innerHTML =
      '<header class="wbar"><button type="button" class="iconbtn" data-wback aria-label="Voltar ao curso">' + B.icon('left') + '</button>' +
      '<div class="min0 wbar__text"><div class="wbar__course ellipsis">' + esc(c.title) + '</div><div class="wbar__ep t-hud">' + esc(l.label) + (r.season ? ' · ' + esc(r.season.title) : '') + '</div></div>' +
      '<span class="grow"></span><a class="brand brand--mini" href="#/" aria-label="Início">' + B.brandMark({ noName: true }) + '</a></header>' +
      '<div class="watch wrap">' +
      '<div class="watch__main min0">' +
      '<div class="watch__stage"><div id="player"></div><div class="nextup" id="nextup" hidden></div></div>' +
      '<div class="watch__head"><div class="min0">' +
      '<div class="t-hud t-mustard">' + esc(l.label) + (r.season ? ' · Temporada ' + r.season.n : '') + (l.free_preview && !owned ? ' · aula grátis' : '') + '</div>' +
      '<h1 class="t-2 watch__title">' + esc(l.title) + '</h1>' +
      (l.duration_min ? '<div class="t-sm t-faint">' + B.fmt.dur(l.duration_min) + '</div>' : '') + '</div>' +
      '<div class="watch__actions">' +
      (owned ? '<button type="button" class="btn ' + (l.done ? 'btn--ghost is-done' : 'btn--primary') + '" id="doneBtn">' + B.icon('check') + '<span>' + (l.done ? 'Concluída' : 'Concluir aula') + '</span></button>' : '') +
      (owned ? '<button type="button" class="btn btn--ghost like' + (l.liked ? ' is-on' : '') + '" id="likeBtn" aria-pressed="' + !!l.liked + '">' + B.icon('thumb') + 'Gostei</button>' : '') +
      (r.next ? '<button type="button" class="btn btn--ghost" id="nextBtn">Próxima' + B.icon(r.next.locked ? 'lock' : 'right') + '</button>' : '') +
      '</div></div>' +
      (!owned ? upsell(c) : '') +
      (A.banners ? A.banners('lesson', { compact: true }) : '') +
      '<div class="tabs" role="tablist">' + tab('about', 'Sobre', true) + tab('mats', 'Materiais' + (l.materials.length ? ' · ' + l.materials.length : '')) + (owned ? tab('notes', 'Anotações') : '') + tab('eps', 'Episódios', false, 'tab--eps') + '</div>' +
      '<div class="wpanels">' +
      '<div class="wpanel" data-panel="about">' + (l.description ? '<div class="prose">' + B.nl2br(l.description) + '</div>' : '<p class="t-muted">Sem descrição para esta aula.</p>') + '</div>' +
      '<div class="wpanel" data-panel="mats" hidden>' + mats(l.materials) + '</div>' +
      (owned ? '<div class="wpanel" data-panel="notes" hidden><label class="label" for="noteText">Suas anotações</label><textarea class="textarea note" id="noteText" placeholder="O que vale lembrar desta aula? Salva sozinho.">' + esc(l.note) + '</textarea><div class="t-xs t-faint" id="noteState">' + (l.note ? 'Salvo' : 'Só você vê.') + '</div></div>' : '') +
      '<div class="wpanel" data-panel="eps" hidden>' + playlist(r, co) + '</div>' +
      '</div></div>' +
      '<aside class="watch__side" aria-label="Episódios"><div class="watch__side-head"><span class="t-hud t-faint">Episódios</span><a class="btn btn--link btn--sm" href="#/curso/' + esc(c.slug) + '">Ver curso</a></div>' + playlist(r, co) + '</aside>' +
      '</div>';

    /* ---------- player ---------- */
    var lastPos = l.position || 0, lastSaved = Date.now(), timer = 0;
    var player = B.player.mount(B.$('#player', main), l.video_url, {
      art: B.epArt(l, l.label, co), durationMin: l.duration_min, start: l.done ? 0 : l.position,
      onTime: function (sec) {
        lastPos = sec;
        if (owned && Date.now() - lastSaved > 30000) { lastSaved = Date.now(); B.api('progress', { lesson_id: l.id, position: Math.round(sec) }).catch(function () {}); }
      },
      onEnded: function () { finish(true); }
    });
    A.onLeave(function () {
      clearInterval(timer);
      try { player.destroy(); } catch (e) {}
      if (owned && !l.done && Math.abs(lastPos - (l.position || 0)) > 5) B.api('progress', { lesson_id: l.id, position: Math.round(lastPos) }).catch(function () {});
    });

    /* ---------- concluir e próximo episódio ---------- */
    var doneBtn = B.$('#doneBtn', main), nextup = B.$('#nextup', main);
    function paintDone() {
      if (!doneBtn) return;
      doneBtn.className = 'btn ' + (l.done ? 'btn--ghost is-done' : 'btn--primary');
      doneBtn.querySelector('span').textContent = l.done ? 'Concluída' : 'Concluir aula';
      B.$$('[data-lesson="' + l.id + '"]', main).forEach(function (b) {
        b.classList.toggle('is-done', l.done);
        var st = b.querySelector('.pl__state'); if (st) st.innerHTML = l.done ? B.icon('check') : '';
      });
    }
    function finish(auto) {
      if (!owned) {
        nextup.innerHTML = '<div class="nextup__card"><div class="min0"><div class="t-tag">gostou?</div><div class="nextup__title">Desbloqueie o curso completo</div><div class="nextup__btns"><button type="button" class="btn btn--primary" data-buy="' + c.id + '">' + B.icon('unlock') + 'Desbloquear</button><button type="button" class="btn btn--ghost" data-nclose>Fechar</button></div></div></div>';
        nextup.hidden = false; return;
      }
      if (l.done) { if (auto) showNext(true); return; }
      if (doneBtn) doneBtn.classList.add('is-loading');
      B.api('progress', { lesson_id: l.id, done: true, position: Math.round(lastPos) }).then(function (res) {
        l.done = true; A.dropHome(); paintDone();
        var big = res.level_up || (res.badges_new && res.badges_new.length) || res.course_done;
        B.celebrate(res);
        if (res.user) { B.session.setUser(res.user); A.paintUser(); }
        if (res.aff_invite && A.affInvite) A.affInvite(res.aff_invite);
        if (auto) showNext(!big);
        else if (r.next && !r.next.locked) { var nb = B.$('#nextBtn', main); if (nb) { nb.classList.remove('btn--ghost'); nb.classList.add('btn--primary'); } }
      }).catch(B.fail).then(function () { if (doneBtn) doneBtn.classList.remove('is-loading'); });
    }
    function showNext(countdown) {
      clearInterval(timer);
      var n = r.next;
      if (!n) {
        nextup.innerHTML = '<div class="nextup__card"><div class="min0"><div class="t-tag">fim do curso</div><div class="nextup__title">Você chegou ao último episódio</div><div class="nextup__btns"><button type="button" class="btn btn--primary" data-go="/curso/' + esc(c.slug) + '">Voltar ao curso</button><button type="button" class="btn btn--ghost" data-go="/">Ir para o início</button></div></div></div>';
        nextup.hidden = false; return;
      }
      if (n.locked) {
        nextup.innerHTML = '<div class="nextup__card"><div class="min0"><div class="t-hud t-faint">Próximo episódio</div><div class="nextup__title">' + esc(n.label) + ' · ' + esc(n.title) + '</div><p class="t-sm t-muted">Este episódio ainda não está liberado para você.</p><div class="nextup__btns"><button type="button" class="btn btn--ghost" data-nclose>Fechar</button></div></div></div>';
        nextup.hidden = false; return;
      }
      nextup.innerHTML = '<div class="nextup__card"><div class="nextup__thumb">' + B.epArt(n, n.label, co) + '</div><div class="min0"><div class="t-hud t-faint">Próximo episódio</div><div class="nextup__title">' + esc(n.label) + ' · ' + esc(n.title) + '</div>' +
        '<div class="nextup__btns"><button type="button" class="btn btn--primary" data-go="/aula/' + n.id + '">' + B.icon('play') + (countdown ? 'Assistir em <span data-count>5</span>' : 'Assistir agora') + '</button><button type="button" class="btn btn--ghost" data-nclose>Cancelar</button></div></div></div>';
      nextup.hidden = false;
      if (countdown && !(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        var k = 5, span = nextup.querySelector('[data-count]');
        timer = setInterval(function () {
          k--; if (span) span.textContent = k;
          if (k <= 0) { clearInterval(timer); B.router.go('/aula/' + n.id); }
        }, 1000);
      }
    }
    nextup.addEventListener('click', function (e) { if (e.target.closest('[data-nclose]')) { clearInterval(timer); nextup.hidden = true; } });
    if (doneBtn) doneBtn.addEventListener('click', function () {
      if (!l.done) return finish(false);
      doneBtn.classList.add('is-loading');
      B.api('progress', { lesson_id: l.id, done: false }).then(function () { l.done = false; A.dropHome(); paintDone(); B.toast('Aula marcada como não concluída.', 'info', 1800); })
        .catch(B.fail).then(function () { doneBtn.classList.remove('is-loading'); });
    });
    var nextBtn = B.$('#nextBtn', main);
    if (nextBtn) nextBtn.addEventListener('click', function () { goLesson(r.next); });

    /* ---------- gostei ---------- */
    var likeBtn = B.$('#likeBtn', main);
    if (likeBtn) likeBtn.addEventListener('click', function () {
      var v = !likeBtn.classList.contains('is-on');
      likeBtn.classList.toggle('is-on', v); likeBtn.setAttribute('aria-pressed', v);
      B.api('like', { lesson_id: l.id, value: v }).catch(function (e) { likeBtn.classList.toggle('is-on', !v); B.fail(e); });
    });

    /* ---------- anotações ---------- */
    var note = B.$('#noteText', main), noteState = B.$('#noteState', main);
    if (note) note.addEventListener('input', B.debounce(function () {
      noteState.textContent = 'Salvando…';
      B.api('note', { lesson_id: l.id, text: note.value }).then(function (res) {
        noteState.textContent = 'Salvo às ' + B.fmt.time(Date.now());
        if (res.badges_new && res.badges_new.length) B.celebrate({ badges_new: res.badges_new });
      }).catch(function (e) { noteState.textContent = 'Não salvou: ' + e.message; });
    }, 1200));

    /* ---------- abas e playlist ---------- */
    main.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]');
      if (t) {
        B.$$('[data-tab]', main).forEach(function (b) { var on = b === t; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
        B.$$('[data-panel]', main).forEach(function (p) { p.hidden = p.dataset.panel !== t.dataset.tab; });
        return;
      }
      var it = e.target.closest('[data-lesson]');
      if (it) {
        var x = null; r.playlist.forEach(function (s) { s.lessons.forEach(function (y) { if (y.id === it.dataset.lesson) x = y; }); });
        if (x && x.id !== l.id) goLesson(x);
        return;
      }
      if (e.target.closest('[data-wback]')) B.router.go('/curso/' + c.slug);
    });
    function goLesson(x) {
      if (!x) return;
      if (x.locked) {
        if (!owned) A.buy(A.state.course);
        else B.toast('Este episódio ainda não foi liberado para você.', 'info');
        return;
      }
      B.router.go('/aula/' + x.id);
    }
    var cur = B.$('.watch__side .pl__item.is-current', main);
    if (cur && cur.scrollIntoView) setTimeout(function () { try { cur.scrollIntoView({ block: 'center', behavior: 'instant' }); w.scrollTo(0, 0); } catch (e) {} }, 50);
  }
})(window, document);

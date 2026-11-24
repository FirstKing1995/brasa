/* ==========================================================================
   BRASA CRM — Conteúdo e campanhas: calendário de posts feito pela equipe de
   Marketing IA, artes com a marca, publicação no Instagram, campanhas e lives
   ========================================================================== */
(function () {
  'use strict';
  var S = C.S, esc = C.esc, ic = C.ic;
  var dados = null, filtro = 'proximos';
  var TIPOS = { feed: 'Feed (foto)', carrossel: 'Carrossel', reels: 'Reels', stories: 'Stories' };
  var STATUS = { rascunho: ['Rascunho', 'st-off'], agendado: ['Agendado', 'st-aviso'], publicado: ['Publicado', 'st-on'], manual: ['Postar no celular', 'st-roxo'], erro: ['Erro', 'st-erro'], agendado_meta: ['Agendado no Meta', 'st-on'] };

  C.views.conteudo = {
    titulo: 'Conteúdo e campanhas',
    acoes: function () { return '<button class="btn" data-a="novo">' + ic('plus') + '<span class="txt"> Post</span></button><button class="btn pri" data-a="cal">' + ic('calendario') + '<span class="txt"> Montar a semana</span></button>'; },
    ligarAcoes: function (el) {
      el.querySelector('[data-a=novo]').onclick = function () { editar({ tipo: 'feed', status: 'rascunho', agendar_em: C.isoLocal(new Date(Date.now() + 86400000)).slice(0, 11) + '19:00:00' }); };
      el.querySelector('[data-a=cal]').onclick = pedirCalendario;
    },
    render: function (el) { el.innerHTML = '<div id="ct-raiz"><div style="text-align:center;padding:50px"><span class="spin" style="color:var(--pri)"></span></div></div>'; carregar(); }
  };
  function carregar() {
    return C.api('marketing.painel').then(function (d) { dados = d; pintar(); }).catch(function (e) { var r = C.$('#ct-raiz'); if (r) r.innerHTML = '<div class="aviso">' + ic('alerta') + '<div>' + esc(e.message) + '</div></div>'; });
  }

  /* --------------------------------------------------- arte com a marca */
  function cor(v, p) { var s = getComputedStyle(document.documentElement).getPropertyValue(v).trim(); return s || p; }
  function quebrar(ctx, texto, larg) {
    var palavras = String(texto || '').split(/\s+/).filter(Boolean), linhas = [], l = '';
    palavras.forEach(function (w) { var t = l ? l + ' ' + w : w; if (ctx.measureText(t).width > larg && l) { linhas.push(l); l = w; } else l = t; });
    if (l) linhas.push(l);
    return linhas;
  }
  /** Desenha a arte 1080x1350 (formato do feed) com as cores e fontes da BRASA. */
  C.arte = function (p) {
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d'), pri = cor('--pri', '#E2A72E'), dest = cor('--acc', '#C9592F');
    var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1a120c'); g.addColorStop(1, '#0d0907');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var rg = ctx.createRadialGradient(W * 0.85, H * 0.12, 20, W * 0.85, H * 0.12, 620); rg.addColorStop(0, 'rgba(226,167,46,.28)'); rg.addColorStop(1, 'rgba(226,167,46,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(226,167,46,.35)'; ctx.lineWidth = 3; ctx.strokeRect(48, 48, W - 96, H - 96);
    ctx.fillStyle = dest; ctx.fillRect(96, 150, 120, 10);
    ctx.fillStyle = pri; ctx.font = '600 34px "Chakra Petch", sans-serif'; ctx.textBaseline = 'top';
    ctx.fillText(String(p.curso || 'BRASA').toUpperCase().slice(0, 48), 96, 190);
    ctx.fillStyle = '#F5EBDD'; var tam = 150;
    var titulo = String(p.arte_titulo || p.titulo || '').toUpperCase(), linhas;
    do { ctx.font = tam + 'px "Bebas Neue", Impact, sans-serif'; linhas = quebrar(ctx, titulo, W - 192); tam -= 8; } while ((linhas.length > 5 || linhas.length * tam * 0.95 > 640) && tam > 70);
    var y = 290; linhas.forEach(function (l) { ctx.fillText(l, 96, y); y += tam * 0.98; });
    ctx.font = '500 44px Barlow, sans-serif'; ctx.fillStyle = 'rgba(245,235,221,.82)';
    quebrar(ctx, p.arte_texto || '', W - 192).slice(0, 4).forEach(function (l) { y += 8; ctx.fillText(l, 96, y + 30); y += 56; });
    ctx.fillStyle = pri; ctx.font = '56px "Bebas Neue", Impact, sans-serif'; ctx.fillText('BRASA', 96, H - 170);
    ctx.font = '30px "Sedgwick Ave Display", cursive'; ctx.fillStyle = dest; ctx.fillText('aprenda de verdade', 96, H - 112);
    return cv;
  };
  function gerarArte(p) {
    var fontes = ['150px "Bebas Neue"', '600 34px "Chakra Petch"', '500 44px Barlow', '30px "Sedgwick Ave Display"'];
    return Promise.all(fontes.map(function (f) { return document.fonts ? document.fonts.load(f) : null; })).catch(function () { }).then(function () {
      var cv = C.arte(p);
      return C.api('midia.salvar', { base64: cv.toDataURL('image/jpeg', 0.9), nome: p.arte_titulo || p.titulo || 'arte' });
    });
  }

  /* ---------------------------------------------------------- tela */
  function pintar() {
    var raiz = C.$('#ct-raiz'), d = dados, k = d.config;
    var h = '';
    if (!d.ia) h += '<div class="aviso info" style="margin-bottom:14px">' + ic('robo') + '<div>Ligue a equipe IA em <b>Equipe IA</b> para o Marketing montar calendários, campanhas e roteiros.</div></div>';
    var prontos = d.posts.filter(function (p) { return p.status === 'agendado' && (p.tipo === 'feed' || p.tipo === 'stories') && /^https:/.test(p.imagem_url); }).length;
    if (!d.instagram) h += '<div class="aviso" style="margin-bottom:14px">' + ic('instagram') + '<div>O Instagram não está ligado pela API. Sem problema: aprove os posts e clique em <b>Mandar o Claude agendar</b>. O executor no seu PC abre o Meta Business Suite no seu Chrome (já logado) e programa tudo, sem custo.' + (prontos ? ' <button class="btn peq pri" id="ct-claude" style="margin-left:8px">' + ic('robo') + ' Mandar o Claude agendar ' + prontos + ' post' + (prontos > 1 ? 's' : '') + '</button>' : '') + '</div></div>';
    h += '<div class="card"><div class="card-pad" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<button class="btn" data-ped="campanha">' + ic('alvo') + ' Planejar campanha de anúncios</button><button class="btn" data-ped="live">' + ic('play') + ' Roteiro de live</button><button class="btn" data-ped="perfil">' + ic('usuarioMais') + ' Melhorar o perfil</button>' +
      '<span style="flex:1"></span><label class="check"><input type="checkbox" id="ct-auto"' + (k.MKT_ATIVO !== 'NAO' ? ' checked' : '') + '> Montar a semana toda segunda</label>' +
      '<label class="check"><input type="checkbox" id="ct-com"' + (k.IG_COMENTARIOS === 'SIM' ? ' checked' : '') + '> IA responde comentários (' + C.inteiro(d.comentarios) + ' até agora)</label></div></div>';
    if (d.fila.length) h += '<div class="aviso info" style="margin-top:14px">' + ic('relogio') + '<div>' + d.fila.map(function (f) { return '<div>' + esc({ 'marketing.calendario': 'Calendário da semana', 'marketing.campanha': 'Campanha', 'marketing.live': 'Roteiro de live', 'marketing.perfil': 'Sugestões de perfil' }[f.tipo] || f.tipo) + ': ' + (f.status === 'erro' ? '<b style="color:var(--vermelho)">erro</b> (' + esc(f.erro) + ') <a href="#" data-rep="' + f.id + '">tentar de novo</a>' : 'a equipe está preparando, fica pronto em 1 ou 2 minutos') + '</div>'; }).join('') + '</div></div>';
    var agora = C.isoLocal();
    var lista = d.posts.filter(function (p) { return filtro === 'todos' ? true : filtro === 'publicados' ? p.status === 'publicado' || p.status === 'manual' : p.status === 'rascunho' || p.status === 'agendado' || p.status === 'erro'; })
      .sort(function (a, b) { return filtro === 'publicados' ? (a.agendar_em < b.agendar_em ? 1 : -1) : (a.agendar_em < b.agendar_em ? -1 : 1); });
    h += '<div style="display:flex;align-items:center;gap:10px;margin:22px 0 10px;flex-wrap:wrap"><h3 style="margin:0">Posts</h3><div class="seg">' + [['proximos', 'Próximos'], ['publicados', 'Publicados'], ['todos', 'Todos']].map(function (x) { return '<button data-flt="' + x[0] + '" class="' + (filtro === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
    h += lista.length ? '<div class="ia-grade">' + lista.map(function (p) {
      var st = STATUS[p.status] || [p.status, 'st-off'];
      return '<div class="card ia-card"><div class="ct-arte" data-arte="' + p.id + '">' + (p.imagem_url ? '<img src="' + esc(p.imagem_url) + '" alt="" loading="lazy">' : '') + '</div>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="chip">' + esc(TIPOS[p.tipo] || p.tipo) + '</span><span class="status ' + st[1] + '">' + st[0] + '</span><span class="small muted" style="margin-left:auto">' + (p.agendar_em ? C.fmtData(p.agendar_em) : 'sem data') + '</span></div>' +
        '<b>' + esc(p.titulo) + '</b><div class="small muted" style="white-space:pre-wrap;max-height:4.5em;overflow:hidden">' + esc(p.legenda) + '</div>' +
        (p.erro ? '<div class="small" style="color:var(--vermelho)">' + esc(p.erro) + '</div>' : '') +
        '<div class="pe">' + (p.status !== 'publicado' ? '<button class="btn peq" data-p="editar" data-id="' + p.id + '">' + ic('lapis') + ' Editar</button>' : '') +
        (p.status === 'rascunho' || p.status === 'erro' ? '<button class="btn peq pri" data-p="aprovar" data-id="' + p.id + '">' + ic('check') + ' Aprovar</button>' : '') +
        (p.status === 'agendado' ? '<button class="btn peq" data-p="voltar" data-id="' + p.id + '">Voltar a rascunho</button>' : '') +
        (p.tipo === 'feed' && p.status !== 'publicado' && p.imagem_url && d.instagram ? '<button class="btn peq" data-p="agora" data-id="' + p.id + '">' + ic('enviar') + ' Publicar agora</button>' : '') +
        (p.permalink ? '<a class="btn peq" href="' + esc(p.permalink) + '" target="_blank" rel="noopener">' + ic('externo') + ' Ver no Instagram</a>' : '') +
        (p.status !== 'publicado' ? '<button class="btn peq fantasma perigo" data-p="descartar" data-id="' + p.id + '" aria-label="Descartar">' + ic('lixo') + '</button>' : '') + '</div></div>';
    }).join('') + '</div>' : '<div class="card"><div class="vazio">' + ic('calendario') + '<h3>Nenhum post ' + (filtro === 'publicados' ? 'publicado' : 'na fila') + '</h3><p>Clique em <b>Montar a semana</b>: a equipe de Marketing usa os cursos, os depoimentos autorizados e o que os clientes contam nas conversas para montar os posts.</p></div></div>';
    h += '<h3 style="margin:22px 0 10px">Planos e roteiros</h3>' + (d.documentos.length ? '<div class="lista-cards">' + d.documentos.map(function (x) {
      return '<button class="card item-card" style="text-align:left;cursor:pointer;width:100%" data-doc="' + x.id + '">' + ic('nota') + '<div class="meio"><h3>' + esc(x.titulo) + '</h3><span class="small muted">' + C.fmtData(x.criado_em) + ' · ' + esc(x.conteudo.replace(/\s+/g, ' ').slice(0, 110)) + '…</span></div></button>';
    }).join('') + '</div>' : '<p class="muted small">Campanhas, roteiros de live e sugestões de perfil aparecem aqui.</p>');
    raiz.innerHTML = h;
    // miniaturas desenhadas para quem ainda não tem imagem
    C.$$('[data-arte]', raiz).forEach(function (box) {
      if (box.querySelector('img')) return;
      var p = d.posts.filter(function (x) { return x.id === box.dataset.arte; })[0], cv = C.arte(p);
      box.appendChild(cv); box.classList.add('sem-img');
    });
    var cc = C.$('#ct-claude'); if (cc) cc.onclick = function () { C.comBotao(cc, function () { return C.mandarClaude({ tipo: 'instagram.agendar' }, 'O Claude vai agendar no Meta Business Suite'); }); };
    C.$('#ct-auto').onchange = function () { C.api('config.salvar', { config: { MKT_ATIVO: this.checked ? 'SIM' : 'NAO' } }).then(function () { C.toast('Salvo', 'ok'); }); };
    C.$('#ct-com').onchange = function () { C.api('config.salvar', { config: { IG_COMENTARIOS: this.checked ? 'SIM' : 'NAO' } }).then(function () { C.toast('Salvo', 'ok'); }); };
    C.$$('[data-flt]', raiz).forEach(function (b) { b.onclick = function () { filtro = b.dataset.flt; pintar(); }; });
    C.$$('[data-rep]', raiz).forEach(function (x) { x.onclick = function (e) { e.preventDefault(); C.api('trabalho.repetir', { id: x.dataset.rep }).then(carregar); }; });
    C.$$('[data-ped]', raiz).forEach(function (b) { b.onclick = function () { pedir(b.dataset.ped); }; });
    C.$$('[data-doc]', raiz).forEach(function (x) { x.onclick = function () { verDoc(d.documentos.filter(function (y) { return y.id === x.dataset.doc; })[0]); }; });
    C.$$('[data-p]', raiz).forEach(function (b) {
      var p = d.posts.filter(function (x) { return x.id === b.dataset.id; })[0];
      b.onclick = function () {
        if (b.dataset.p === 'editar') return editar(p);
        if (b.dataset.p === 'descartar') return C.confirmar('Descartar o post <b>' + esc(p.titulo) + '</b>?', { perigo: true, botao: 'Descartar' }).then(function (s) { if (s) C.api('post.status', { id: p.id, status: 'descartado' }).then(carregar); });
        var acao = b.dataset.p === 'agora' ? C.api('post.publicar', { id: p.id }) : C.api('post.status', { id: p.id, status: b.dataset.p === 'aprovar' ? 'aprovado' : 'rascunho' });
        C.comBotao(b, function () { return acao.then(function () { C.toast(b.dataset.p === 'agora' ? 'Publicado no Instagram' : b.dataset.p === 'aprovar' ? (p.tipo === 'feed' ? 'Agendado: sai sozinho na hora marcada' : 'Agendado: na hora, você recebe um lembrete para postar no celular') : 'Voltou para rascunho', 'ok'); return carregar(); }); });
      };
    });
  }

  function pedirCalendario() {
    var seg = new Date(); seg.setDate(seg.getDate() + ((8 - seg.getDay()) % 7 || 7));
    C.modal({
      titulo: 'Montar o calendário da semana',
      corpo: '<div class="campo"><label>Começa em</label><input class="inp" type="date" id="cl-de" value="' + C.isoLocal(seg).slice(0, 10) + '"></div>' +
        '<div class="campo"><label>Quantos posts</label><input class="inp" type="number" id="cl-qtd" min="1" max="14" value="' + esc(dados.config.MKT_POSTS_SEMANA || 5) + '"></div>' +
        '<div class="campo"><label>Foco da semana (opcional)</label><textarea class="inp" id="cl-foco" rows="2" placeholder="Ex.: lançamento do curso X, aquecer a lista de espera, mostrar resultados de alunos"></textarea></div>',
      pe: '<button class="btn" data-fechar>Cancelar</button><button class="btn pri" id="cl-ok">' + ic('calendario') + ' Pedir ao Marketing</button>',
      aoAbrir: function (el) {
        el.querySelector('#cl-ok').onclick = function () {
          C.comBotao(this, function () { return C.api('trabalho.criar', { tipo: 'marketing.calendario', de: el.querySelector('#cl-de').value, qtd: el.querySelector('#cl-qtd').value, foco: el.querySelector('#cl-foco').value }).then(function () { el.fechar(); C.toast('O Marketing está montando a semana. Os posts aparecem em 1 ou 2 minutos.', 'ok'); carregar(); }); });
        };
      }
    });
  }
  function pedir(tipo) {
    var cursos = (dados.cursos || []).map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
    var corpo = tipo === 'campanha' ? '<div class="campo"><label>Curso</label><select class="inp" id="pd-curso"><option value="">Toda a BRASA</option>' + cursos + '</select></div><div class="campo"><label>Objetivo</label><input class="inp" id="pd-obj" value="vendas"></div><div class="campo"><label>Verba</label><input class="inp" id="pd-verba" placeholder="Ex.: R$ 30 por dia"></div>'
      : tipo === 'live' ? '<div class="campo"><label>Tema da live</label><input class="inp" id="pd-tema"></div><div class="campo"><label>Data (opcional)</label><input class="inp" id="pd-data" type="date"></div>'
        : '<p style="margin:0">O Marketing sugere bio, nome, link, destaques e os primeiros posts fixos. A mudança no perfil você faz no aplicativo do Instagram.</p>';
    C.modal({
      titulo: { campanha: 'Planejar campanha de anúncios', live: 'Roteiro de live', perfil: 'Melhorar o perfil' }[tipo], corpo: corpo,
      pe: '<button class="btn" data-fechar>Cancelar</button><button class="btn pri" id="pd-ok">Pedir ao Marketing</button>',
      aoAbrir: function (el) {
        var v = function (id) { var x = el.querySelector(id); return x ? x.value : ''; };
        el.querySelector('#pd-ok').onclick = function () {
          C.comBotao(this, function () { return C.api('trabalho.criar', { tipo: 'marketing.' + tipo, curso: v('#pd-curso'), objetivo: v('#pd-obj'), verba: v('#pd-verba'), tema: v('#pd-tema'), data: v('#pd-data') }).then(function () { el.fechar(); C.toast('Pedido enviado ao Marketing.', 'ok'); carregar(); }); });
        };
      }
    });
  }
  function verDoc(x) {
    C.modal({ titulo: x.titulo, tamanho: 'xl', corpo: '<textarea class="inp" id="vd-txt" rows="20" style="font-family:inherit;line-height:1.5">' + esc(x.conteudo) + '</textarea>',
      pe: (x.tipo === 'marketing.perfil' ? '<button class="btn" id="vd-bio">' + ic('robo') + ' Mandar o Claude trocar a bio</button>' : x.tipo === 'marketing.campanha' ? '<button class="btn" id="vd-ads">' + ic('robo') + ' Mandar o Claude montar (pausada)</button>' : '') + '<button class="btn" id="vd-copiar">' + ic('copiar') + ' Copiar</button><button class="btn pri" id="vd-ok">' + ic('check') + ' Salvar</button>',
      aoAbrir: function (el) {
        el.querySelector('#vd-copiar').onclick = function () { C.copiar(el.querySelector('#vd-txt').value); };
        var vb = el.querySelector('#vd-bio'); if (vb) vb.onclick = function () { C.pedirTexto('Nova bio do Instagram', 'Texto da bio (até 150 caracteres)', '', { botao: 'Mandar o Claude' }).then(function (bio) { if (bio) C.mandarClaude({ tipo: 'instagram.bio', bio: bio }, 'O Claude vai trocar a bio').catch(function (e) { C.toast(e.message, 'erro'); }); }); };
        var va = el.querySelector('#vd-ads'); if (va) va.onclick = function () { C.confirmar('O Claude vai montar esta campanha no Gerenciador de Anúncios, tudo <b>pausado</b>. Ele não ativa nada nem mexe em pagamento: você revisa e ativa quando quiser.', { botao: 'Mandar o Claude' }).then(function (s) { if (s) C.mandarClaude({ tipo: 'meta_ads.campanha', documento_id: x.id }, 'O Claude vai montar a campanha pausada').catch(function (e) { C.toast(e.message, 'erro'); }); }); };
        el.querySelector('#vd-ok').onclick = function () { C.api('documento.salvar', { id: x.id, conteudo: el.querySelector('#vd-txt').value, status: 'revisado' }).then(function () { el.fechar(); C.toast('Salvo', 'ok'); carregar(); }).catch(function (e) { C.toast(e.message, 'erro'); }); };
      } });
  }
  function editar(p) {
    var cursos = (dados.cursos || []).map(function (c) { return '<option' + (c === p.curso ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    C.modal({
      titulo: p.id ? 'Editar post' : 'Novo post', tamanho: 'xl',
      corpo: '<div class="ct-editor"><div><div class="ct-arte grande" id="ed-arte"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn peq pri" id="ed-gerar" data-carregando=" Gerando...">' + ic('imagem') + ' Gerar arte com a marca</button></div>' +
        '<div class="campo" style="margin-top:10px"><label>Ou cole o link de uma imagem (https)</label><input class="inp" id="ed-img" value="' + esc(p.imagem_url || '') + '" placeholder="https://..."></div>' +
        '<p class="small muted" style="margin:0">Feed sai sozinho no Instagram. Carrossel, reels e stories viram lembrete com o roteiro para você postar pelo celular.</p></div>' +
        '<div><div class="grade" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="campo"><label>Tipo</label><select class="inp" id="ed-tipo">' + Object.keys(TIPOS).map(function (k) { return '<option value="' + k + '"' + (p.tipo === k ? ' selected' : '') + '>' + TIPOS[k] + '</option>'; }).join('') + '</select></div>' +
        '<div class="campo"><label>Dia e hora</label><input class="inp" type="datetime-local" id="ed-quando" value="' + esc(String(p.agendar_em || '').slice(0, 16)) + '"></div></div>' +
        '<div class="campo"><label>Curso</label><select class="inp" id="ed-curso"><option value="">Nenhum</option>' + cursos + '</select></div>' +
        '<div class="campo"><label>Nome interno</label><input class="inp" id="ed-tit" value="' + esc(p.titulo || '') + '"></div>' +
        '<div class="campo"><label>Texto grande da arte</label><input class="inp" id="ed-at" maxlength="120" value="' + esc(p.arte_titulo || '') + '"></div>' +
        '<div class="campo"><label>Frase de apoio da arte</label><input class="inp" id="ed-ax" maxlength="240" value="' + esc(p.arte_texto || '') + '"></div>' +
        '<div class="campo"><label>Legenda</label><textarea class="inp" id="ed-leg" rows="6" maxlength="2200">' + esc(p.legenda || '') + '</textarea></div>' +
        '<div class="campo"><label>Hashtags</label><input class="inp" id="ed-hash" value="' + esc(p.hashtags || '') + '"></div>' +
        '<div class="campo"><label>Roteiro (carrossel, reels e stories)</label><textarea class="inp" id="ed-rot" rows="4">' + esc(p.roteiro || '') + '</textarea></div></div></div>',
      pe: '<button class="btn" data-fechar>Cancelar</button><button class="btn pri" id="ed-ok">' + ic('check') + ' Salvar</button>',
      aoAbrir: function (el) {
        var ler = function () { return { id: p.id, tipo: el.querySelector('#ed-tipo').value, agendar_em: el.querySelector('#ed-quando').value ? el.querySelector('#ed-quando').value + ':00' : '', curso: el.querySelector('#ed-curso').value, titulo: el.querySelector('#ed-tit').value,
          arte_titulo: el.querySelector('#ed-at').value, arte_texto: el.querySelector('#ed-ax').value, legenda: el.querySelector('#ed-leg').value, hashtags: el.querySelector('#ed-hash').value, roteiro: el.querySelector('#ed-rot').value, imagem_url: el.querySelector('#ed-img').value.trim() }; };
        var previa = function () {
          var box = el.querySelector('#ed-arte'), url = el.querySelector('#ed-img').value.trim();
          box.innerHTML = '';
          if (url) { var im = document.createElement('img'); im.src = url; im.alt = ''; box.appendChild(im); } else box.appendChild(C.arte(ler()));
        };
        previa();
        ['#ed-at', '#ed-ax', '#ed-curso', '#ed-img'].forEach(function (id) { el.querySelector(id).addEventListener('input', C.debounce(previa, 250)); });
        el.querySelector('#ed-gerar').onclick = function () {
          var b = this;
          C.comBotao(b, function () { el.querySelector('#ed-img').value = ''; return gerarArte(ler()).then(function (r) { el.querySelector('#ed-img').value = r.url; previa(); C.toast('Arte pronta. Salve o post para guardar.', 'ok'); }); });
        };
        el.querySelector('#ed-ok').onclick = function () {
          C.comBotao(this, function () { return C.api('post.salvar', { post: ler() }).then(function () { el.fechar(); C.toast('Post salvo', 'ok'); carregar(); }); });
        };
      }
    });
  }
})();

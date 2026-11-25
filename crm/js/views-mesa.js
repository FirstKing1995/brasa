/* ==========================================================================
   BRASA CRM — Minha mesa: tudo o que depende do dono num lugar só.
   Pedidos de material das equipes (vídeo, foto, gravação), aprovações,
   missões paradas, conversas esperando uma pessoa, tarefas e posts manuais.
   ========================================================================== */
(function () {
  'use strict';
  var S = C.S, esc = C.esc, ic = C.ic;
  var dados = null;
  var TIPOS = { video: ['Vídeo', 'camera'], foto: ['Foto', 'imagem'], gravacao: ['Gravação de aulas', 'play'], audio: ['Áudio', 'fone'], depoimento: ['Depoimento', 'estrela'], texto: ['Texto', 'nota'], outro: ['Outro', 'clipe'] };
  var LIMITE = 20 * 1024 * 1024;
  var dataBr = function (d) { d = String(d || ''); return d ? d.slice(8, 10) + '/' + d.slice(5, 7) + (d.length > 10 ? ' ' + d.slice(11, 16) : '') : ''; };

  C.views.mesa = {
    titulo: 'Minha mesa',
    render: function (el) {
      el.innerHTML = '<div class="cab-pagina" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:16px">' +
        '<p class="muted" style="margin:0;max-width:640px">O que a equipe precisa de você. A IA cuida do resto; aqui ficam só as coisas que pedem uma pessoa: gravar, fotografar, aprovar e responder.</p>' +
        '<button class="btn" id="ms-novo">' + ic('plus') + ' Anotar um pedido</button></div>' +
        '<div id="ms-raiz"><div style="text-align:center;padding:50px"><span class="spin" style="color:var(--pri)"></span></div></div>';
      C.$('#ms-novo', el).onclick = novoPedido;
      carregar();
    }
  };

  function carregar() {
    return C.api('mesa.resumo', {}).then(function (d) {
      dados = d;
      S.pedidosAbertos = d.pedidos.length; S.aprovacoesPendentes = d.aprovacoes.length; C.renderNav();
      pintar();
    }).catch(function (e) { var r = C.$('#ms-raiz'); if (r) r.innerHTML = '<div class="aviso">' + ic('alerta') + '<div>' + esc(e.message) + '</div></div>'; });
  }

  function bloco(titulo, icone, qtd, corpo, acao) {
    return '<section class="card card-pad" style="margin-bottom:16px"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px">' +
      '<h3 style="margin:0;display:flex;align-items:center;gap:8px">' + ic(icone) + esc(titulo) + (qtd ? ' <span class="status st-aviso">' + qtd + '</span>' : '') + '</h3>' + (acao || '') + '</div>' + corpo + '</section>';
  }
  function vazio(t) { return '<p class="muted small" style="margin:0">' + esc(t) + '</p>'; }

  function pintar() {
    var r = C.$('#ms-raiz'); if (!r) return;
    var d = dados, h = '';
    var total = d.pedidos.length + d.aprovacoes.length + d.missoes.length + d.esperando.length + d.tarefas.length + d.posts_celular.length + (d.notas ? 1 : 0);
    h += '<label class="check" style="margin:0 0 14px;display:flex;gap:8px;align-items:center"><input type="checkbox" id="ms-estudio"' + (d.estudio_auto ? ' checked' : '') + '> Estúdio: quando você entregar o vídeo de um reels, o Claude Code do PC edita sozinho (corte, 9:16, áudio, título) e devolve pronto</label>';
    if (d.ia_erro) h += '<div class="aviso" style="margin-bottom:16px">' + ic('alerta') + '<div><b>A IA parou com erro:</b> ' + esc(d.ia_erro) + '. Veja em Ajustes &gt; IA.</div></div>';
    if (!total) h += '<div class="card" style="text-align:center;padding:40px 20px;margin-bottom:16px">' + ic('check') + '<h3 style="margin:10px 0 4px">Mesa limpa</h3><p class="muted" style="margin:0">Nada esperando por você agora. A equipe avisa quando precisar.</p></div>';

    h += bloco('Pedidos de material', 'camera', d.pedidos.length, d.pedidos.length ? d.pedidos.map(cartaoPedido).join('') : vazio('Nenhum pedido aberto. Quando o Marketing montar um reels ou o Produto criar um curso, o pedido de gravação aparece aqui.'));
    if (d.aprovacoes.length) h += bloco('Aprovações', 'check', d.aprovacoes.length, lista(d.aprovacoes.map(function (a) { return [a.titulo, a.tipo + ' · ' + dataBr(a.criado_em)]; })), '<button class="btn peq" data-ir="vendedoras">Abrir a caixa</button>');
    if (d.esperando.length) h += bloco('Conversas esperando uma pessoa', 'conversas', d.esperando.length, lista(d.esperando.map(function (c) { return [c.nome, (c.ultima_msg || '') + ' · ' + dataBr(c.ultima_msg_em)]; })), '<button class="btn peq" data-ir="conversas">Abrir conversas</button>');
    if (d.missoes.length || (d.executor_configurado && !d.executor_online)) h += bloco('Missões do Claude no PC', 'robo', d.missoes.length,
      (d.executor_configurado && !d.executor_online ? '<p class="small" style="margin:0 0 10px">' + ic('info') + ' O executor do PC está desligado. Abra <b>iniciar-executor.cmd</b> para as missões andarem.</p>' : '') +
      lista(d.missoes.map(function (m) { return [m.titulo, m.status === 'erro' ? 'Erro: ' + (m.erro || '') : 'Esperando sua aprovação']; })), '<button class="btn peq" data-ir="escritorio">Ver no Escritório</button>');
    if (d.posts_celular.length) h += bloco('Posts para publicar no celular', 'instagram', d.posts_celular.length, lista(d.posts_celular.map(function (p) { return [p.titulo, p.tipo + ' · ' + dataBr(p.agendar_em) + (p.material_url ? ' · material pronto' : '')]; })), '<button class="btn peq" data-ir="conteudo">Abrir o calendário</button>');
    if (d.tarefas.length) h += bloco('Tarefas vencidas', 'tarefas', d.tarefas.length, lista(d.tarefas.map(function (t) { return [t.titulo, 'Venceu em ' + dataBr(t.vence_em)]; })), '<button class="btn peq" data-ir="tarefas">Abrir tarefas</button>');
    if (d.notas) h += bloco('Notas fiscais', 'nota', d.notas, vazio(d.notas + ' nota(s) para emitir ou cancelar no Emissor Nacional.'), '<button class="btn peq" data-ir="escritorio">Abrir o Financeiro</button>');
    if (d.entregues.length) h += bloco('Entregues recentemente', 'upload', 0, lista(d.entregues.map(function (p) { return [p.titulo, 'Entregue em ' + dataBr(p.entregue_em)]; })));
    r.innerHTML = h;
    var ce = C.$('#ms-estudio', r); if (ce) ce.onchange = function () { C.api('config.salvar', { config: { ESTUDIO_AUTO: ce.checked ? 'SIM' : 'NAO' } }).then(function () { C.toast('Salvo', 'ok'); }).catch(function (e) { C.toast(e.message, 'erro'); }); };
    C.$$('[data-ir]', r).forEach(function (b) { b.onclick = function () { C.ir(b.dataset.ir); }; });
    C.$$('[data-pd-entregar]', r).forEach(function (b) { b.onclick = function () { entregar(d.pedidos.filter(function (x) { return x.id === b.dataset.pdEntregar; })[0]); }; });
    C.$$('[data-pd-ver]', r).forEach(function (b) { b.onclick = function () { verPedido(d.pedidos.filter(function (x) { return x.id === b.dataset.pdVer; })[0]); }; });
    C.$$('[data-pd-cancelar]', r).forEach(function (b) {
      b.onclick = function () {
        C.confirmar('Cancelar este pedido? A equipe segue sem esse material.', { botao: 'Cancelar pedido', perigo: true }).then(function (s) {
          if (s) C.api('pedido.situacao', { id: b.dataset.pdCancelar, status: 'cancelado' }).then(function () { C.toast('Pedido cancelado'); carregar(); }).catch(function (e) { C.toast(e.message, 'erro'); });
        });
      };
    });
  }
  function lista(itens) {
    return '<div style="display:grid;gap:8px">' + itens.slice(0, 8).map(function (x) { return '<div style="padding:8px 10px;border:1px solid var(--borda);border-radius:8px"><b>' + esc(x[0]) + '</b><div class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(x[1]) + '</div></div>'; }).join('') +
      (itens.length > 8 ? '<p class="small muted" style="margin:0">e mais ' + (itens.length - 8) + '</p>' : '') + '</div>';
  }
  function cartaoPedido(p) {
    var t = TIPOS[p.tipo] || TIPOS.outro;
    return '<div style="border:1px solid var(--borda);border-radius:10px;padding:12px;margin-bottom:10px">' +
      '<div style="display:flex;gap:10px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap">' +
      '<div style="min-width:0;flex:1"><div class="small muted" style="display:flex;gap:6px;align-items:center">' + ic(t[1]) + esc(t[0]) + ' · pedido por ' + esc(p.criado_por) + '</div>' +
      '<b style="display:block;margin-top:4px">' + esc(p.titulo) + '</b>' +
      (p.prazo ? '<span class="status ' + (p.atrasado ? 'st-erro' : 'st-aviso') + '" style="margin-top:6px;display:inline-block">' + (p.atrasado ? 'Atrasado: ' : 'Até ') + esc(dataBr(p.prazo)) + '</span>' : '') + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn peq" data-pd-ver="' + esc(p.id) + '">' + ic('olho') + ' Briefing</button>' +
      '<button class="btn pri peq" data-pd-entregar="' + esc(p.id) + '">' + ic('upload') + ' Entregar</button>' +
      '<button class="btn fantasma peq ic" title="Cancelar pedido" aria-label="Cancelar pedido" data-pd-cancelar="' + esc(p.id) + '">' + ic('x') + '</button></div></div></div>';
  }
  function verPedido(p) {
    C.modal({ titulo: p.titulo, tamanho: 'largo',
      corpo: (p.formato ? '<div class="aviso" style="margin-bottom:12px">' + ic('info') + '<div><b>Formato:</b> ' + esc(p.formato) + '</div></div>' : '') +
        '<pre style="white-space:pre-wrap;font-family:inherit;margin:0;line-height:1.5">' + esc(p.briefing || 'Sem briefing.') + '</pre>',
      pe: '<button class="btn" id="pv-copiar">' + ic('copiar') + ' Copiar roteiro</button><button class="btn pri" id="pv-ent">' + ic('upload') + ' Entregar</button>',
      aoAbrir: function (el) {
        el.querySelector('#pv-copiar').onclick = function () { C.copiar(p.briefing || ''); };
        el.querySelector('#pv-ent').onclick = function () { el.fechar(); entregar(p); };
      } });
  }
  function lerBase64(file) {
    return new Promise(function (ok, erro) {
      var fr = new FileReader();
      fr.onload = function () { ok(String(fr.result).replace(/^data:[^,]*,/, '')); };
      fr.onerror = function () { erro(new Error('Não consegui ler o arquivo.')); };
      fr.readAsDataURL(file);
    });
  }
  function entregar(p) {
    C.modal({ titulo: 'Entregar: ' + p.titulo, tamanho: 'largo',
      corpo: '<div class="campo"><label>Arquivos do celular ou do PC (até 20 MB cada)</label><input class="inp" type="file" id="en-arq" multiple accept="video/*,image/*,audio/*"></div>' +
        '<div class="campo"><label>Ou cole links (um por linha): Google Drive, YouTube não listado, WeTransfer</label><textarea class="inp" id="en-links" rows="3" placeholder="https://"></textarea></div>' +
        '<div class="campo"><label>Recado para a equipe (opcional)</label><input class="inp" id="en-nota" placeholder="Ex.: gravei duas versões, a segunda ficou melhor"></div>' +
        '<p class="small muted" style="margin:0">Vídeo grande? Suba no Google Drive pelo celular e cole o link aqui: é mais rápido.</p><div id="en-prog" class="small" style="margin-top:8px"></div>',
      pe: '<button class="btn" data-fechar>Cancelar</button><button class="btn pri" id="en-ok" data-carregando=" Enviando...">' + ic('upload') + ' Entregar</button>',
      aoAbrir: function (el) {
        el.querySelector('#en-ok').onclick = function () {
          var files = Array.prototype.slice.call(el.querySelector('#en-arq').files || []);
          var links = el.querySelector('#en-links').value.split(/\s+/).filter(function (l) { return /^https:\/\//.test(l); }).map(function (l) { return { nome: 'link', url: l }; });
          var grande = files.filter(function (f) { return f.size > LIMITE; })[0];
          if (grande) return C.toast(grande.name + ' passa de 20 MB. Suba no Drive e cole o link.', 'erro');
          if (!files.length && !links.length) return C.toast('Escolha um arquivo ou cole um link.', 'erro');
          var prog = el.querySelector('#en-prog');
          C.comBotao(this, function () {
            var feitos = [];
            return files.reduce(function (pr, f, i) {
              return pr.then(function () {
                prog.textContent = 'Enviando ' + (i + 1) + ' de ' + files.length + ': ' + f.name;
                return lerBase64(f).then(function (b64) { return C.api('pedido.arquivo', { id: p.id, base64: b64, nome: f.name, mime: f.type }); }).then(function (r) { feitos.push(r); });
              });
            }, Promise.resolve()).then(function () {
              return C.api('pedido.entregar', { id: p.id, links: feitos.concat(links), nota: el.querySelector('#en-nota').value });
            }).then(function () { el.fechar(); C.toast('Material entregue. A equipe já pode usar.', 'ok'); carregar(); });
          });
        };
      } });
  }
  function novoPedido() {
    C.modal({ titulo: 'Anotar um pedido de material',
      corpo: '<div class="campo"><label>Tipo</label><select class="inp" id="np-tipo">' + Object.keys(TIPOS).map(function (k) { return '<option value="' + k + '">' + TIPOS[k][0] + '</option>'; }).join('') + '</select></div>' +
        '<div class="campo"><label>O que é</label><input class="inp" id="np-tit" placeholder="Ex.: fotos do espaço de trabalho para o perfil"></div>' +
        '<div class="campo"><label>Detalhes</label><textarea class="inp" id="np-brief" rows="4"></textarea></div>' +
        '<div class="campo"><label>Prazo (opcional)</label><input class="inp" type="date" id="np-prazo"></div>',
      pe: '<button class="btn" data-fechar>Cancelar</button><button class="btn pri" id="np-ok">Anotar</button>',
      aoAbrir: function (el) {
        el.querySelector('#np-ok').onclick = function () {
          C.comBotao(this, function () {
            return C.api('pedido.criar', { tipo: el.querySelector('#np-tipo').value, titulo: el.querySelector('#np-tit').value, briefing: el.querySelector('#np-brief').value, prazo: el.querySelector('#np-prazo').value })
              .then(function () { el.fechar(); C.toast('Pedido anotado', 'ok'); carregar(); });
          });
        };
      } });
  }
})();

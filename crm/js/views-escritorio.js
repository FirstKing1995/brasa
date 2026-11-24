/* ==========================================================================
   BRASA CRM — Escritório: Diretoria, Financeiro (metas, MEI, DAS, notas
   fiscais), Sucesso do Cliente e Jurídico
   ========================================================================== */
(function () {
  'use strict';
  var S = C.S, esc = C.esc, ic = C.ic;
  var aba = 'diretoria', filtroNota = 'abertas', dados = null;
  var ABAS = [['diretoria', 'Diretoria', 'relatorios'], ['financeiro', 'Financeiro e notas', 'financeiro'], ['sucesso', 'Sucesso do cliente', 'relatorios'], ['produto', 'Produto', 'relatorios'], ['juridico', 'Jurídico', 'relatorios']];
  var DOCS_JUR = ['Termos de uso', 'Política de privacidade (LGPD)', 'Política de reembolso e garantia', 'Contrato de afiliados', 'Contrato de prestação de serviço', 'Resposta a reclamação (Reclame Aqui / Procon)', 'Aviso de direitos autorais do conteúdo', 'Outro'];
  var dataBr = function (d) { d = String(d || ''); return d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : ''; };
  var pct = function (v) { return v === null || v === undefined ? '—' : v + '%'; };

  C.views.escritorio = {
    titulo: 'Escritório',
    render: function (el) {
      var abas = ABAS.filter(function (a) { return C.pode(a[2]); });
      if (!abas.some(function (a) { return a[0] === aba; })) aba = abas[0] ? abas[0][0] : 'diretoria';
      el.innerHTML = '<div class="abas" style="margin-bottom:16px">' + abas.map(function (a) { return '<button data-eab="' + a[0] + '" class="' + (aba === a[0] ? 'on' : '') + '">' + a[1] + '</button>'; }).join('') + '</div>' +
        '<div id="es-raiz"><div style="text-align:center;padding:50px"><span class="spin" style="color:var(--pri)"></span></div></div>';
      C.$$('[data-eab]', el).forEach(function (b) { b.onclick = function () { aba = b.dataset.eab; C.render(); }; });
      carregar();
    }
  };
  function carregar() {
    return C.api('escritorio.painel', { aba: aba }).then(function (d) {
      dados = d;
      ({ diretoria: pintarDocs, juridico: pintarDocs, produto: pintarDocs, financeiro: pintarFinanceiro, sucesso: pintarSucesso })[aba]();
    }).catch(function (e) { var r = C.$('#es-raiz'); if (r) r.innerHTML = '<div class="aviso">' + ic('alerta') + '<div>' + esc(e.message) + '</div></div>'; });
  }
  function kpi(i, rot, val, sub, cor) { return '<div class="card kpi"><div class="rot">' + ic(i) + rot + '</div><div class="val"' + (cor ? ' style="color:' + cor + '"' : '') + '>' + val + '</div><div class="sub">' + sub + '</div></div>'; }
  function semIA() { return '<div class="aviso info" style="margin-bottom:14px">' + ic('robo') + '<div>Esta área usa a equipe IA. Ligue-a em <b>Equipe IA</b> (chave da API do Claude) para gerar relatórios e documentos.</div></div>'; }

  /* ---------------------------------------------- Diretoria e Jurídico */
  function pintarDocs() {
    var raiz = C.$('#es-raiz'), d = dados, jur = aba === 'juridico', prod = aba === 'produto';
    var h = d.ia ? '' : semIA();
    if (prod) {
      h += '<div class="grid-2" style="align-items:start"><div class="card"><div class="card-cab"><h3>' + ic('estrela') + ' Planejar um curso novo</h3></div><div class="card-pad">' +
        '<p class="small muted" style="margin:0 0 10px">A equipe de Produto monta promessa, público, preço e a grade de temporadas e aulas, usando o que os alunos pedem. Depois, um clique cria o curso como rascunho na BRASA.</p>' +
        '<div class="campo"><label>Tema</label><input class="inp" id="pr-tema" placeholder="Ex.: copy para anúncios"></div><div class="campo"><label>Público (opcional)</label><input class="inp" id="pr-pub"></div><div class="campo"><label>Faixa de preço (opcional)</label><input class="inp" id="pr-preco" placeholder="Ex.: R$ 297 a R$ 497"></div>' +
        '<button class="btn pri" id="pr-ok">' + ic('nota') + ' Pedir o plano</button></div></div>' +
        '<div class="card"><div class="card-cab"><h3>' + ic('lista') + ' Ideias do mês</h3></div><div class="card-pad"><p class="small muted" style="margin:0 0 10px">Na primeira segunda de cada mês, a equipe de Produto lê vendas, feedbacks, melhorias e objeções e propõe ajustes nos cursos, produtos novos, bônus e as 3 prioridades do mês.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn" id="pr-ideias">' + ic('atualizar') + ' Pedir agora</button><label class="check" style="margin-left:auto"><input type="checkbox" id="pr-auto"' + (d.config.PRODUTO_AUTO !== 'NAO' ? ' checked' : '') + '> Todo mês</label></div></div></div></div>';
    } else if (jur) {
      h += '<div class="card"><div class="card-cab"><h3>' + ic('escudo') + ' Pedir um documento</h3></div><div class="card-pad">' +
        '<p class="small muted" style="margin:0 0 10px">O Jurídico escreve um rascunho com base no Código de Defesa do Consumidor, na LGPD e nos dados da BRASA, e deixa [PREENCHER] no que não souber. <b>Todo documento é rascunho: revise com um advogado antes de publicar ou assinar.</b> Reclamações com Procon, processo ou chargeback são analisadas sozinhas, com uma sugestão de resposta.</p>' +
        '<div class="grade" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px"><div class="campo"><label>Documento</label><select class="inp" id="jd-tipo">' + DOCS_JUR.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></div>' +
        '<div class="campo" style="grid-column:span 2"><label>Contexto e instruções</label><textarea class="inp" id="jd-ctx" rows="3" placeholder="Ex.: garantia de 7 dias em todos os cursos, acesso por 12 meses, afiliados ganham 40%."></textarea></div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn pri" id="jd-ok">' + ic('nota') + ' Pedir ao Jurídico</button>' +
        '<label class="check" style="margin-left:auto"><input type="checkbox" id="jd-auto"' + (d.config.JURIDICO_AUTO !== 'NAO' ? ' checked' : '') + '> Analisar sozinho as reclamações graves</label></div></div></div>';
    } else {
      h += '<div class="card"><div class="card-cab"><h3>' + ic('relatorios') + ' Relatório da semana</h3><span class="acoes"><span class="status ' + (d.config.DIRETORIA_ATIVA !== 'NAO' ? 'st-on' : 'st-off') + '">' + (d.config.DIRETORIA_ATIVA !== 'NAO' ? 'Toda segunda' : 'Desligado') + '</span></span></div><div class="card-pad">' +
        '<p class="small muted" style="margin:0 0 10px">Toda segunda-feira, na hora do resumo do Assistente, a Diretoria junta vendas, financeiro, teto do MEI, satisfação dos clientes, desempenho da equipe IA e melhorias mais pedidas, e traz as decisões que precisam de você. O relatório fica aqui e chega por e-mail.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn pri" id="dr-gerar">' + ic('atualizar') + ' Gerar o relatório agora</button>' +
        '<label class="check" style="margin-left:auto"><input type="checkbox" id="dr-auto"' + (d.config.DIRETORIA_ATIVA !== 'NAO' ? ' checked' : '') + '> Gerar toda segunda</label></div></div></div>';
    }
    if (d.fila.length) h += '<div class="aviso info" style="margin-top:14px">' + ic('relogio') + '<div>' + d.fila.map(function (f) { var e = C.json(f.entrada, {}); return '<div>' + esc(e.tipo_doc || (f.tipo === 'diretoria.semanal' ? 'Relatório da semana' : f.tipo === 'juridico.caso' ? 'Análise de reclamação: ' + (e.nome || '') : f.tipo)) + ': ' + (f.status === 'erro' ? '<b style="color:var(--vermelho)">erro</b> (' + esc(f.erro) + ') <a href="#" data-rep="' + f.id + '">tentar de novo</a>' : 'na fila, fica pronto em 1 ou 2 minutos') + '</div>'; }).join('') + '</div></div>';
    h += '<h3 style="margin:22px 0 10px">' + (jur ? 'Documentos' : prod ? 'Planos e ideias' : 'Relatórios') + '</h3>';
    h += d.documentos.length ? '<div class="lista-cards">' + d.documentos.map(function (x) {
      return '<button class="card item-card" style="text-align:left;cursor:pointer;width:100%" data-doc="' + x.id + '">' + ic(jur ? 'escudo' : 'relatorios') + '<div class="meio"><h3>' + esc(x.titulo) + '</h3><span class="small muted">' + C.fmtData(x.criado_em) + ' · ' + esc(x.conteudo.replace(/\s+/g, ' ').slice(0, 120)) + '…</span></div><span class="status ' + (x.status === 'revisado' ? 'st-on' : 'st-off') + '">' + (x.status === 'revisado' ? 'Revisado' : x.status === 'arquivado' ? 'Arquivado' : 'Rascunho') + '</span></button>';
    }).join('') + '</div>' : '<div class="card"><div class="vazio">' + ic(jur ? 'escudo' : 'relatorios') + '<h3>Nada por aqui ainda</h3></div></div>';
    raiz.innerHTML = h;
    var bp = C.$('#pr-ok');
    if (bp) bp.onclick = function () { C.comBotao(bp, function () { return C.api('trabalho.criar', { tipo: 'produto.curso', tema: C.$('#pr-tema').value, publico: C.$('#pr-pub').value, preco: C.$('#pr-preco').value }).then(function () { C.toast('A equipe de Produto está montando o plano.', 'ok'); return carregar(); }); }); };
    var bi = C.$('#pr-ideias');
    if (bi) bi.onclick = function () { C.comBotao(bi, function () { return C.api('trabalho.criar', { tipo: 'produto.ideias' }).then(function () { C.toast('Pedido enviado à equipe de Produto.', 'ok'); return carregar(); }); }); };
    var pa = C.$('#pr-auto'); if (pa) pa.onchange = function () { C.api('config.salvar', { config: { PRODUTO_AUTO: pa.checked ? 'SIM' : 'NAO' } }).then(function () { C.toast('Salvo', 'ok'); }); };
    var b1 = C.$('#jd-ok');
    if (b1) b1.onclick = function () { C.comBotao(b1, function () { return C.api('trabalho.criar', { tipo: 'juridico.documento', tipo_doc: C.$('#jd-tipo').value, contexto: C.$('#jd-ctx').value }).then(function () { C.toast('Pedido enviado ao Jurídico. Fica pronto em 1 ou 2 minutos.', 'ok'); return carregar(); }); }); };
    var b2 = C.$('#dr-gerar');
    if (b2) b2.onclick = function () { C.comBotao(b2, function () { return C.api('trabalho.criar', { tipo: 'diretoria.semanal' }).then(function () { C.toast('A Diretoria está preparando o relatório.', 'ok'); return carregar(); }); }); };
    var a1 = C.$('#jd-auto'); if (a1) a1.onchange = function () { C.api('config.salvar', { config: { JURIDICO_AUTO: a1.checked ? 'SIM' : 'NAO' } }).then(function () { C.toast('Salvo', 'ok'); }); };
    var a2 = C.$('#dr-auto'); if (a2) a2.onchange = function () { C.api('config.salvar', { config: { DIRETORIA_ATIVA: a2.checked ? 'SIM' : 'NAO' } }).then(function () { C.toast('Salvo', 'ok'); carregar(); }); };
    C.$$('[data-rep]', raiz).forEach(function (x) { x.onclick = function (e) { e.preventDefault(); C.api('trabalho.repetir', { id: x.dataset.rep }).then(carregar); }; });
    C.$$('[data-doc]', raiz).forEach(function (x) { x.onclick = function () { abrirDoc(d.documentos.filter(function (y) { return y.id === x.dataset.doc; })[0]); }; });
  }
  function abrirDoc(x) {
    C.modal({
      titulo: x.titulo, tamanho: 'xl',
      corpo: (x.time === 'juridico' ? '<div class="aviso" style="margin-bottom:10px">' + ic('alerta') + '<div>Rascunho feito por IA. Revise com um advogado antes de publicar, assinar ou enviar.</div></div>' : '') +
        '<textarea class="inp" id="dc-txt" rows="20" style="font-family:inherit;line-height:1.5">' + esc(x.conteudo) + '</textarea>',
      pe: (function () { var dj = C.json(x.dados, null); return x.tipo === 'produto.curso' && dj && dj.title ? (dj.brasa ? '<a class="btn" href="' + esc(dj.brasa.admin_link) + '" target="_blank" rel="noopener">' + ic('externo') + ' Abrir o curso na BRASA</a>' : '<button class="btn" id="dc-brasa">' + ic('plus') + ' Criar rascunho na BRASA</button>') : ''; })() + '<button class="btn" id="dc-copiar">' + ic('copiar') + ' Copiar</button><button class="btn" id="dc-arq">Arquivar</button><button class="btn pri" id="dc-ok">' + ic('check') + ' Salvar como revisado</button>',
      aoAbrir: function (el) {
        el.querySelector('#dc-copiar').onclick = function () { C.copiar(el.querySelector('#dc-txt').value); };
        var cb = el.querySelector('#dc-brasa');
        if (cb) cb.onclick = function () { C.comBotao(cb, function () { return C.api('produto.criarNaBrasa', { id: x.id }).then(function (r) { el.fechar(); C.toast('Rascunho criado na BRASA: ' + r.title + ' (' + r.lessons + ' aulas). Revise e publique pelo ADM.', 'ok'); window.open(r.admin_link, '_blank', 'noopener'); carregar(); }); }); };
        var salvar = function (st) { return C.api('documento.salvar', { id: x.id, conteudo: el.querySelector('#dc-txt').value, status: st }).then(function () { el.fechar(); C.toast('Documento salvo', 'ok'); carregar(); }).catch(function (e) { C.toast(e.message, 'erro'); }); };
        el.querySelector('#dc-ok').onclick = function () { salvar('revisado'); };
        el.querySelector('#dc-arq').onclick = function () { salvar('arquivado'); };
      }
    });
  }

  /* -------------------------------------------------------- Financeiro */
  function pintarFinanceiro() {
    var raiz = C.$('#es-raiz'), f = dados, k = f.config;
    var corTeto = f.pct_teto >= 100 ? 'var(--vermelho)' : f.pct_teto >= 80 ? 'var(--amarelo)' : '';
    var h = '<div class="kpis">' +
      kpi('dinheiro', 'Receita do mês', C.brl(f.receita_mes), 'projeção: ' + C.brl(f.projecao_mes)) +
      kpi('alvo', 'Meta do mês', f.meta_mes ? pct(f.pct_meta) : '—', f.meta_mes ? 'de ' + C.brl(f.meta_mes) : 'defina a meta abaixo') +
      kpi('escudo', 'Teto do MEI no ano', pct(f.pct_teto), C.brl(f.receita_ano) + ' de ' + C.brl(f.teto_mei) + ' · projeção ' + C.brl(f.projecao_ano), corTeto) +
      kpi('calendario', 'DAS do mês', f.das_pago ? 'Pago' : f.das_atrasado ? 'Atrasado' : 'A pagar', 'vence dia 20', f.das_pago ? 'var(--verde)' : f.das_atrasado ? 'var(--vermelho)' : '') +
      kpi('nota', 'Notas a emitir', C.inteiro(f.notas_pendentes), 'no Emissor Nacional') + '</div>';
    if (f.pct_teto >= 80 || f.projecao_ano > f.teto_mei) h += '<div class="aviso" style="margin-top:14px">' + ic('alerta') + '<div><b>Atenção ao teto do MEI.</b> Pelo ritmo atual, o ano deve fechar em ' + C.brl(f.projecao_ano) + '. Passar do teto obriga a mudar de enquadramento; converse com um contador antes de chegar lá.</div></div>';
    h += '<div class="card" style="margin-top:14px"><div class="card-cab"><h3>' + ic('ajustes') + ' Metas e regras</h3></div><div class="card-pad"><div class="grade" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">' +
      '<div class="campo"><label>Meta de receita do mês (R$)</label><input class="inp" id="fn-meta" inputmode="decimal" value="' + esc(k.META_MES || '') + '"></div>' +
      '<div class="campo"><label>Teto anual do MEI (R$)</label><input class="inp" id="fn-teto" inputmode="decimal" value="' + esc(k.MEI_LIMITE || '81000') + '"></div>' +
      '<div class="campo"><label>Quando emitir nota</label><select class="inp" id="fn-nf"><option value="pedido">Só empresa (CNPJ) e quem pedir</option><option value="todas"' + (k.NF_EMITIR === 'todas' ? ' selected' : '') + '>Em toda venda</option></select></div>' +
      '<div class="campo"><label>Descrição do serviço na nota</label><input class="inp" id="fn-desc" value="' + esc(k.NF_DESCRICAO || 'Curso online: {curso}') + '"></div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="fn-salvar">' + ic('check') + ' Salvar</button>' + (f.das_pago ? '' : '<button class="btn" id="fn-das">' + ic('check') + ' Já paguei o DAS deste mês</button>') +
      '<a class="btn" href="https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao" target="_blank" rel="noopener">' + ic('externo') + ' Gerar o DAS</a></div>' +
      '<p class="small muted" style="margin:12px 0 0">MEI só é obrigado a emitir nota para empresa (CNPJ). Para pessoa física, a nota é opcional, a não ser que o cliente peça. Emitir para todas ajuda a comprovar a receita na declaração anual (DASN-SIMEI).</p></div></div>';
    var lista = f.notas.filter(function (n) { return filtroNota === 'todas' ? true : filtroNota === 'emitidas' ? n.status === 'emitida' : n.status === 'pendente' || n.status === 'cancelar'; });
    h += '<div style="display:flex;align-items:center;gap:10px;margin:22px 0 10px;flex-wrap:wrap"><h3 style="margin:0">Notas fiscais</h3><div class="seg">' + [['abertas', 'A emitir'], ['emitidas', 'Emitidas'], ['todas', 'Todas']].map(function (x) { return '<button data-fnf="' + x[0] + '" class="' + (filtroNota === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<a class="btn peq" style="margin-left:auto" href="' + esc(f.emissor) + '" target="_blank" rel="noopener">' + ic('externo') + ' Abrir o Emissor Nacional</a></div>';
    h += lista.length ? '<div class="lista-cards">' + lista.map(function (n) {
      var st = { pendente: ['A emitir', 'st-aviso'], cancelar: ['Cancelar no emissor', 'st-erro'], emitida: ['Emitida', 'st-on'], dispensada: ['Dispensada', 'st-off'], cancelada: ['Cancelada', 'st-off'] }[n.status] || [n.status, 'st-off'];
      return '<div class="card item-card">' + ic('nota') + '<div class="meio"><h3>' + esc(n.tomador_nome || n.contato_nome) + ' · ' + C.brl(n.valor) + '</h3><span class="small muted">' + esc(n.curso) + ' · ' + esc(n.motivo) + ' · ' + dataBr(n.criado_em) + (n.numero ? ' · nº ' + esc(n.numero) : '') + '</span></div><span class="status ' + st[1] + '">' + st[0] + '</span>' +
        (n.status === 'pendente' ? '<button class="btn peq pri" data-nf="' + n.id + '">Emitir</button>' : '') + '</div>';
    }).join('') + '</div>' : '<div class="card"><div class="vazio">' + ic('check') + '<h3>' + (filtroNota === 'abertas' ? 'Nenhuma nota a emitir' : 'Nada por aqui') + '</h3></div></div>';
    raiz.innerHTML = h;
    C.$('#fn-salvar').onclick = function () {
      var cfg = { META_MES: String(C.num(C.$('#fn-meta').value) || ''), MEI_LIMITE: String(C.num(C.$('#fn-teto').value) || 81000), NF_EMITIR: C.$('#fn-nf').value, NF_DESCRICAO: C.$('#fn-desc').value.trim() || 'Curso online: {curso}' };
      C.comBotao(this, function () { return C.api('config.salvar', { config: cfg }).then(function () { C.toast('Salvo', 'ok'); return carregar(); }); });
    };
    var bd = C.$('#fn-das'); if (bd) bd.onclick = function () { C.comBotao(bd, function () { return C.api('config.salvar', { config: { DAS_PAGO: C.hoje().slice(0, 7) } }).then(carregar); }); };
    C.$$('[data-fnf]', raiz).forEach(function (b) { b.onclick = function () { filtroNota = b.dataset.fnf; pintarFinanceiro(); }; });
    C.$$('[data-nf]', raiz).forEach(function (b) { b.onclick = function () { emitir(f.notas.filter(function (n) { return n.id === b.dataset.nf; })[0], f.emissor); }; });
  }
  function emitir(n, emissor) {
    var doc = String(n.tomador_doc || ''), docFmt = doc.length === 14 ? doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    var linha = function (rot, v) { return '<div class="campo"><label>' + rot + '</label>' + (v ? C.copiavel(String(v)) : '<span class="muted small">não informado: peça ao cliente</span>') + '</div>'; };
    C.modal({
      titulo: 'Emitir nota fiscal', tamanho: 'largo',
      corpo: '<ol class="small" style="margin:0 0 14px;padding-left:18px;line-height:1.6"><li>Abra o <a href="' + esc(emissor) + '" target="_blank" rel="noopener">Emissor Nacional</a> e entre com a conta gov.br do MEI.</li><li>Em "Emitir NFS-e", copie os dados abaixo.</li><li>Depois de emitir, cole o número e o link do PDF aqui: o cliente recebe a nota sozinho.</li></ol>' +
        linha(doc.length === 14 ? 'CNPJ do tomador' : 'CPF do tomador', docFmt) + linha('Nome ou razão social', n.tomador_nome) + linha('E-mail', n.tomador_email) +
        linha('Valor do serviço', C.num(n.valor).toFixed(2).replace('.', ',')) + linha('Descrição', n.descricao) + linha('Data da venda', dataBr(n.criado_em)) +
        '<div class="grade" style="display:grid;grid-template-columns:1fr 2fr;gap:12px;margin-top:8px"><div class="campo"><label>Número da nota</label><input class="inp" id="nf-num"></div><div class="campo"><label>Link do PDF (https://...)</label><input class="inp" id="nf-link" inputmode="url"></div></div>',
      pe: '<button class="btn" id="nf-disp">Dispensar</button><button class="btn" data-fechar>Fechar</button><button class="btn pri" id="nf-ok">' + ic('enviar') + ' Marcar como emitida e enviar</button>',
      aoAbrir: function (el) {
        el.querySelector('#nf-ok').onclick = function () {
          var b = this;
          C.comBotao(b, function () { return C.api('nota.emitida', { id: n.id, numero: el.querySelector('#nf-num').value.trim(), link: el.querySelector('#nf-link').value.trim() }).then(function (r) { el.fechar(); C.toast('Nota registrada' + (r.aviso ? ' e ' + r.aviso : ''), 'ok'); carregar(); }); });
        };
        el.querySelector('#nf-disp').onclick = function () { C.api('nota.situacao', { id: n.id, status: 'dispensada' }).then(function () { el.fechar(); carregar(); }).catch(function (e) { C.toast(e.message, 'erro'); }); };
      }
    });
  }

  /* ------------------------------------------------- Sucesso do cliente */
  var MOMENTOS = { boas_vindas: 'Boas-vindas', experiencia: 'Experiência', metade: 'Metade do curso', conclusao: 'Conclusão', nps: '30 dias', parado: 'Parado', espontaneo: 'Espontâneo' };
  var STATUS_ME = { nova: 'Nova', planejada: 'Planejada', feita: 'Feita', descartada: 'Descartada' };
  function pintarSucesso() {
    var raiz = C.$('#es-raiz'), d = dados, k = d.config;
    var h = '';
    if (!d.tem_agente) h += '<div class="aviso info" style="margin-bottom:14px">' + ic('robo') + '<div>Crie um agente de <b>Sucesso do cliente</b> em Equipe IA para os acompanhamentos começarem. Ele conversa depois da compra, na metade e na conclusão do curso, registra tudo aqui e transforma o que ouve em melhorias.</div></div>';
    var npsCor = d.nps === null ? '' : d.nps >= 50 ? 'var(--verde)' : d.nps >= 0 ? 'var(--amarelo)' : 'var(--vermelho)';
    h += '<div class="kpis">' + kpi('estrela', 'NPS (90 dias)', d.nps === null ? '—' : d.nps, d.respostas_nps + ' notas · ' + d.promotores + ' promotores, ' + d.detratores + ' detratores', npsCor) +
      kpi('conversas', 'Feedbacks', C.inteiro(d.feedbacks.length), d.feedbacks.filter(function (f) { return f.sentimento === 'negativo'; }).length + ' negativos') +
      kpi('lista', 'Melhorias abertas', C.inteiro(d.melhorias.filter(function (m) { return m.status === 'nova' || m.status === 'planejada'; }).length), 'pedidas pelos clientes e pela equipe') +
      kpi('usuarioMais', 'Depoimentos autorizados', C.inteiro(d.depoimentos.length), 'prontos para o Marketing') +
      kpi('calendario', 'Conversas agendadas', C.inteiro(d.agendados), 'acompanhamentos na fila') + '</div>';
    h += '<div class="card" style="margin-top:14px"><div class="card-pad" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">' +
      '<div class="campo" style="margin:0"><label>Acompanhamentos</label><select class="inp" id="sc-ativo"><option value="SIM">Ligados</option><option value="NAO"' + (k.SUCESSO_ATIVO === 'NAO' ? ' selected' : '') + '>Desligados</option></select></div>' +
      '<div class="campo" style="margin:0"><label>Dias depois da compra (boas-vindas, experiência, nota)</label><input class="inp" id="sc-dias" value="' + esc(k.SUCESSO_DIAS || '2, 6, 30') + '"></div>' +
      '<button class="btn pri" id="sc-salvar">' + ic('check') + ' Salvar</button></div></div>';
    h += '<div class="grid-2" style="margin-top:14px;align-items:start"><div class="card"><div class="card-cab"><h3>Melhorias mais pedidas</h3><span class="acoes"><button class="btn peq" id="sc-nova">' + ic('plus') + ' Nova</button></span></div><div class="card-pad">' +
      (d.melhorias.length ? d.melhorias.slice(0, 40).map(function (m) {
        return '<div style="padding:10px 0;border-bottom:1px solid var(--borda)"><div style="display:flex;gap:8px;align-items:center"><span class="chip">' + C.inteiro(m.votos) + ' ' + (m.votos === '1' ? 'voto' : 'votos') + '</span><b style="flex:1">' + esc(m.titulo) + '</b>' +
          '<select class="inp" style="width:auto;padding:4px 8px" data-me="' + m.id + '">' + Object.keys(STATUS_ME).map(function (s) { return '<option value="' + s + '"' + (m.status === s ? ' selected' : '') + '>' + STATUS_ME[s] + '</option>'; }).join('') + '</select></div>' +
          '<div class="small muted" style="margin-top:4px">' + esc(m.area) + (m.curso ? ' · ' + esc(m.curso) : '') + ' · ' + esc(m.origem) + '</div><div class="small" style="white-space:pre-wrap;margin-top:4px">' + esc(m.descricao.slice(0, 400)) + '</div></div>';
      }).join('') : '<p class="muted small" style="margin:0">Nenhuma melhoria ainda.</p>') + '</div></div>' +
      '<div class="card"><div class="card-cab"><h3>Por curso</h3></div><div class="card-pad">' + (d.cursos.length ? '<table class="tab"><thead><tr><th>Curso</th><th>Feedbacks</th><th>Nota média</th><th>Negativos</th></tr></thead><tbody>' + d.cursos.map(function (c) { return '<tr style="cursor:default"><td>' + esc(c.curso) + '</td><td class="num">' + c.feedbacks + '</td><td class="num">' + (c.media === null ? '—' : c.media) + '</td><td class="num">' + c.negativos + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="muted small" style="margin:0">Sem dados ainda.</p>') + '</div>' +
      '<div class="card-cab"><h3>Depoimentos autorizados</h3></div><div class="card-pad">' + (d.depoimentos.length ? d.depoimentos.map(function (x) { return '<blockquote style="margin:0 0 12px;padding-left:12px;border-left:3px solid var(--pri)">' + esc(x.texto) + '<div class="small muted">' + esc(x.nome) + (x.curso ? ' · ' + esc(x.curso) : '') + '</div></blockquote>'; }).join('') : '<p class="muted small" style="margin:0">Quando um aluno autorizar, o depoimento aparece aqui.</p>') + '</div></div></div>';
    h += '<h3 style="margin:22px 0 10px">Últimos feedbacks</h3>' + (d.feedbacks.length ? '<div class="lista-cards">' + d.feedbacks.map(function (f) {
      var cor = f.sentimento === 'positivo' ? 'st-on' : f.sentimento === 'negativo' ? 'st-erro' : 'st-off';
      var itens = [['Travou', f.travou], ['Esperava', f.esperava], ['Sentiu falta', f.faltou], ['Como ajudou', f.ajudou], ['Comentário', f.comentario]].filter(function (x) { return x[1]; });
      return '<div class="card" style="padding:14px 16px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><a href="#" data-ct="' + f.contato_id + '"><b>' + esc(f.contato_nome || 'Cliente') + '</b></a><span class="small muted">' + esc(f.curso) + ' · ' + (MOMENTOS[f.momento] || f.momento) + ' · ' + C.fmtData(f.atualizado_em) + '</span>' +
        (f.nps !== '' ? '<span class="chip" style="margin-left:auto">nota ' + esc(f.nps) + '</span>' : '<span style="margin-left:auto"></span>') + (f.sentimento ? '<span class="status ' + cor + '">' + esc(f.sentimento) + '</span>' : '') + '</div>' +
        itens.map(function (x) { return '<div class="small" style="margin-top:4px"><b>' + x[0] + ':</b> ' + esc(x[1]) + '</div>'; }).join('') + '</div>';
    }).join('') + '</div>' : '<div class="card"><div class="vazio">' + ic('conversas') + '<h3>Nenhum feedback ainda</h3></div></div>');
    raiz.innerHTML = h;
    C.$('#sc-salvar').onclick = function () { C.comBotao(this, function () { return C.api('config.salvar', { config: { SUCESSO_ATIVO: C.$('#sc-ativo').value, SUCESSO_DIAS: C.$('#sc-dias').value } }).then(function () { C.toast('Salvo', 'ok'); }); }); };
    C.$$('[data-me]', raiz).forEach(function (s) { s.onchange = function () { C.api('melhoria.salvar', { id: s.dataset.me, status: s.value }).then(function () { C.toast('Melhoria: ' + STATUS_ME[s.value], 'ok'); }).catch(function (e) { C.toast(e.message, 'erro'); }); }; });
    C.$$('[data-ct]', raiz).forEach(function (x) { x.onclick = function (e) { e.preventDefault(); C.abrirContato(x.dataset.ct); }; });
    C.$('#sc-nova').onclick = function () {
      C.modal({ titulo: 'Nova melhoria', corpo: '<div class="campo"><label>Área</label><select class="inp" id="nm-area"><option value="curso">Curso</option><option value="plataforma">Plataforma</option><option value="atendimento">Atendimento</option><option value="preco">Preço</option><option value="outro">Outro</option></select></div>' +
        '<div class="campo"><label>Curso (opcional)</label><input class="inp" id="nm-curso"></div><div class="campo"><label>Título</label><input class="inp" id="nm-tit" maxlength="140"></div><div class="campo"><label>Descrição</label><textarea class="inp" id="nm-desc" rows="3"></textarea></div>',
        pe: '<button class="btn" data-fechar>Cancelar</button><button class="btn pri" id="nm-ok">Salvar</button>',
        aoAbrir: function (el) { el.querySelector('#nm-ok').onclick = function () { C.comBotao(this, function () { return C.api('melhoria.salvar', { area: el.querySelector('#nm-area').value, curso: el.querySelector('#nm-curso').value, titulo: el.querySelector('#nm-tit').value, descricao: el.querySelector('#nm-desc').value }).then(function (r) { if (r.erro) throw new Error(r.erro); el.fechar(); carregar(); }); }); }; } });
    };
  }
})();

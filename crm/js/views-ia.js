/* ==========================================================================
   BRASA CRM — Vendedoras IA: equipe de vendedoras com o Claude (Anthropic)
   que atendem WhatsApp, Instagram e o chat do site, vendem com os links da
   BRASA e passam para uma pessoa quando precisa.
   ========================================================================== */
(function () {
  'use strict';
  var S = C.S, esc = C.esc, ic = C.ic;
  var dados = null, aba = 'equipe', filtroAp = 'pendente', conversaAssist = [];

  var PAPEIS = {
    vendas: ['Vendas', 'Atende quem chega com interesse e conduz até a matrícula'],
    recuperacao: ['Recuperação', 'Carrinho abandonado, Pix vencido e aluno parado'],
    suporte: ['Suporte', 'Acesso, senha, pagamento, cancelamento, reembolso e reclamações'],
    consultor: ['Consultoria', 'Ajuda o aluno a aplicar o método das aulas (chat da área do aluno)'],
    sucesso: ['Sucesso do cliente', 'Acompanha a jornada, ouve a experiência e transforma em melhorias']
  };
  var CANAIS = { whatsapp: 'WhatsApp', instagram: 'Instagram', site: 'Chat do site', aluno: 'Área do aluno' };
  var ESFORCOS = [['low', 'Rápida e econômica (recomendado)'], ['medium', 'Equilibrada'], ['high', 'Pensa mais antes de responder']];
  var SUGESTOES = [
    { nome: 'Luna', papel: 'vendas', canais: 'whatsapp, instagram, site', cor: '#C9592F', desconto_max: 10,
      personalidade: 'Calorosa, segura e objetiva. Fala como uma consultora que já ajudou muita gente a escolher o curso certo. Faz perguntas curtas para entender o momento da pessoa antes de indicar qualquer coisa. Não força a venda: mostra o caminho e convida.' },
    { nome: 'Mel', papel: 'recuperacao', canais: 'whatsapp, instagram', cor: '#E2A72E', desconto_max: 15,
      personalidade: 'Leve e prestativa. Puxa assunto sem cobrar: quer entender o que travou (dúvida, preço, momento) e resolver. Se for preço, mostra parcelamento e garantia antes de pensar em condição especial.' },
    { nome: 'Tati', papel: 'suporte', canais: 'whatsapp, aluno, site, instagram', cor: '#86B7B2', desconto_max: 0,
      personalidade: 'Paciente, calma e resolutiva. Explica o passo a passo sem jargão, confirma se deu certo e nunca discute com o cliente. Em reclamação, acolhe primeiro e resolve depois.' },
    { nome: 'Clara', papel: 'sucesso', canais: 'whatsapp, aluno', cor: '#DCAA68', desconto_max: 0,
      personalidade: 'Acolhedora e curiosa. Pergunta como a pessoa está de verdade, escuta, aprofunda com "me conta mais" e agradece cada resposta. Nunca vende nem pressiona.' },
    { nome: 'Iara', papel: 'consultor', canais: 'aluno', cor: '#9AA84A', desconto_max: 0,
      personalidade: 'Mentora experiente e encorajadora. Faz perguntas sobre o caso do aluno, responde com passos práticos baseados nas aulas e comemora cada avanço. Direta, sem enrolação.' }
  ];

  C.views.vendedoras = {
    titulo: 'Equipe IA',
    acoes: function () { return '<button class="btn pri" data-a="nova">' + ic('plus') + '<span class="txt"> Novo agente</span></button>'; },
    ligarAcoes: function (el) { el.querySelector('[data-a=nova]').onclick = function () { editar(null); }; },
    render: function (el) {
      el.innerHTML = '<div class="abas" style="margin-bottom:16px">' + [['equipe', 'Equipe'], ['aprovacoes', 'Aprovações' + (S.aprovacoesPendentes ? ' (' + S.aprovacoesPendentes + ')' : '')], ['assistente', 'Assistente']].map(function (a) { return '<button data-ab="' + a[0] + '" class="' + (aba === a[0] ? 'on' : '') + '">' + a[1] + '</button>'; }).join('') + '</div>' +
        '<div id="ia-raiz"><div style="text-align:center;padding:50px"><span class="spin" style="color:var(--pri)"></span></div></div>';
      C.$$('[data-ab]', el).forEach(function (b) { b.onclick = function () { aba = b.dataset.ab; C.render(); }; });
      if (aba === 'aprovacoes') return pintarAprovacoes();
      carregar();
    }
  };

  function carregar() {
    return C.api('ia.painel').then(function (d) {
      dados = d;
      S.agentes = d.agentes.map(function (a) { return { id: a.id, nome: a.nome, usuario_id: a.usuario_id, cor: a.cor, ativo: a.ativo, papel: a.papel }; });
      S.aprovacoesPendentes = d.pendentes || 0;
      if (aba === 'assistente') pintarAssistente(); else pintar();
    }).catch(function (e) { var r = C.$('#ia-raiz'); if (r) r.innerHTML = '<div class="aviso">' + ic('alerta') + '<div>' + esc(e.message) + '</div></div>'; });
  }

  function kpi(i, rot, val, sub) { return '<div class="card kpi"><div class="rot">' + ic(i) + rot + '</div><div class="val">' + val + '</div><div class="sub">' + sub + '</div></div>'; }

  function pintar() {
    var raiz = C.$('#ia-raiz');
    if (!raiz || !dados) return;
    var d = dados, k = d.config, ags = d.agentes;
    var soma = function (c) { return ags.reduce(function (s, a) { return s + C.num(a[c]); }, 0); };
    var ligada = k.IA_ATIVA === 'SIM' && k.IA_CHAVE;
    var semCanal = !d.canais.whatsapp && !d.canais.instagram && !d.canais.site;

    var h = '';
    if (!ligada) h += '<div class="aviso info" style="margin-bottom:14px">' + ic('robo') + '<div><b>Monte sua equipe com IA: vendas, recuperação, suporte e consultoria.</b> Elas respondem em segundos, de dia e de noite, conhecem os cursos e as aulas da BRASA, vendem com os links oficiais, resolvem acesso e senha, pedem sua aprovação para reembolso e exceções, e chamam uma pessoa quando precisa. ' +
      'Para ligar: crie uma chave em <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>, cole abaixo, teste e marque "Ligada".</div></div>';
    if (k.IA_ERRO) h += '<div class="aviso" style="margin-bottom:14px">' + ic('alerta') + '<div><b>Último erro:</b> ' + esc(k.IA_ERRO) + '</div></div>';
    if (semCanal) h += '<div class="aviso" style="margin-bottom:14px">' + ic('alerta') + '<div>Nenhum canal pronto para a equipe IA: ligue o WhatsApp por API (Evolution, WAHA ou oficial da Meta), o Instagram ou o chat do site em Integrações. No modo "link" do WhatsApp elas não conseguem enviar sozinhas.</div></div>';

    h += '<div class="kpis">' +
      kpi('conversas', 'Respostas hoje', C.inteiro(d.hoje), 'limite de ' + C.inteiro(C.num(k.IA_LIMITE_DIA) || 300) + ' por dia') +
      kpi('contatos', 'Conversas', C.inteiro(soma('conversas')), C.inteiro(soma('ativas')) + ' nas últimas 24h') +
      kpi('dinheiro', 'Vendas no mês', C.inteiro(soma('vendas_mes')), C.brl(soma('receita_mes'))) +
      kpi('estrela', 'Vendas no total', C.inteiro(soma('vendas')), C.brl(soma('receita'))) +
      kpi('usuarioMais', 'Passadas para a equipe', C.inteiro(soma('passadas')), 'reembolso, reclamação, pedido de pessoa') +
      kpi('relatorios', 'Custo da IA (estimado)', 'US$ ' + soma('custo').toFixed(2), C.inteiro(soma('mensagens')) + ' mensagens enviadas') + '</div>';

    // configuração geral
    h += '<div class="card" style="margin-top:14px"><div class="card-cab"><h3>' + ic('ajustes') + ' Configuração</h3><span class="acoes"><span class="status ' + (ligada ? 'st-on' : 'st-off') + '">' + (ligada ? 'Ligada' : 'Desligada') + '</span></span></div><div class="card-pad">' +
      '<div class="grade" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">' +
      '<div class="campo"><label>Situação</label><select class="inp" id="ia-ativa"><option value="NAO">Desligada</option><option value="SIM"' + (k.IA_ATIVA === 'SIM' ? ' selected' : '') + '>Ligada</option></select></div>' +
      '<div class="campo" style="grid-column:span 2"><label>Chave da API do Claude</label><input class="inp" id="ia-chave" autocomplete="off" spellcheck="false" placeholder="sk-ant-..." value="' + esc(k.IA_CHAVE) + '"></div>' +
      '<div class="campo"><label>Modelo</label><select class="inp" id="ia-modelo">' + d.modelos.map(function (m) { return '<option value="' + m.id + '"' + (m.id === k.IA_MODELO ? ' selected' : '') + '>' + esc(m.nome) + '</option>'; }).join('') + '</select></div>' +
      '<div class="campo"><label>Raciocínio</label><select class="inp" id="ia-esforco">' + ESFORCOS.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === k.IA_ESFORCO ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="campo"><label>Quem elas atendem</label><select class="inp" id="ia-atende"><option value="todos">Todas as conversas</option><option value="sem_dono"' + (k.IA_ATENDE === 'sem_dono' ? ' selected' : '') + '>Só contatos sem vendedor humano</option></select></div>' +
      '<div class="campo"><label>Espera antes de responder (segundos)</label><input class="inp" id="ia-espera" type="number" min="5" max="600" value="' + esc(k.IA_ESPERA_SEG || 25) + '"><small class="muted">Junta mensagens seguidas e deixa a resposta com ritmo de pessoa.</small></div>' +
      '<div class="campo"><label>Recuperação ativa</label><select class="inp" id="ia-recup"><option value="SIM">Ligada: chama carrinho, Pix, cartão recusado, aluno parado e estreia</option><option value="NAO"' + (k.IA_RECUPERAR === 'NAO' ? ' selected' : '') + '>Desligada</option></select><small class="muted">Só no WhatsApp com API. Se uma automação cuidar do mesmo evento, a automação tem prioridade.</small></div>' +
      '<div class="campo"><label>Esperar antes de chamar (minutos)</label><input class="inp" id="ia-recup-min" type="number" min="0" max="1440" value="' + esc(k.IA_RECUPERAR_MIN || 20) + '"></div>' +
      '<div class="campo"><label>Limite de respostas por dia</label><input class="inp" id="ia-limite" type="number" min="1" max="5000" value="' + esc(k.IA_LIMITE_DIA || 300) + '"><small class="muted">Trava de segurança de custo.</small></div>' +
      '</div>' +
      '<div class="ia-canais">' + Object.keys(CANAIS).map(function (c) { return '<span class="chip' + (d.canais[c] ? ' sel' : '') + '">' + ic(d.canais[c] ? 'check' : 'x') + CANAIS[c] + (d.canais[c] ? '' : ' (desligado)') + '</span>'; }).join('') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn pri" id="ia-salvar">' + ic('check') + ' Salvar</button><button class="btn" id="ia-testar" data-carregando=" Testando...">' + ic('raio') + ' Testar chave</button><button class="btn" id="ia-base" data-carregando=" Buscando...">' + ic('atualizar') + ' Atualizar cursos da BRASA</button></div>' +
      '<p class="small muted" style="margin:12px 0 0">Os agentes dizem que são assistentes virtuais da equipe quando alguém pergunta com sinceridade, falam só da BRASA (regra do WhatsApp para robôs de empresa), não prometem renda, não pedem cartão nem CPF e só vendem pelos links oficiais. A cada resposta elas releem a conversa inteira e os dados do contato no CRM.</p>' +
      '</div></div>';

    // equipe
    h += '<h3 style="margin:22px 0 10px">Equipe</h3>';
    if (!ags.length) {
      h += '<div class="card"><div class="vazio">' + ic('robo') + '<h3>Nenhum agente ainda</h3><p>Comece com a equipe sugerida: Luna (vendas), Mel (recuperação), Tati (suporte), Clara (sucesso do cliente) e Iara (consultoria na área do aluno). Você pode editar tudo depois.</p>' +
        '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn pri" id="ia-sugeridas" data-carregando=" Criando...">' + ic('plus') + ' Criar a equipe sugerida</button><button class="btn" id="ia-nova2">Criar do zero</button></div></div></div>';
    } else {
      h += '<div class="ia-grade">' + ags.map(cartao).join('') + '</div>';
    }
    raiz.innerHTML = h;

    C.$('#ia-salvar').onclick = function () {
      var cfg = { IA_ATIVA: C.$('#ia-ativa').value, IA_CHAVE: C.$('#ia-chave').value.trim(), IA_MODELO: C.$('#ia-modelo').value, IA_ESFORCO: C.$('#ia-esforco').value,
        IA_ATENDE: C.$('#ia-atende').value, IA_ESPERA_SEG: String(Math.max(5, C.num(C.$('#ia-espera').value) || 25)), IA_LIMITE_DIA: String(Math.max(1, C.num(C.$('#ia-limite').value) || 300)), IA_RECUPERAR: C.$('#ia-recup').value, IA_RECUPERAR_MIN: String(Math.max(0, C.num(C.$('#ia-recup-min').value))) };
      if (cfg.IA_ATIVA === 'SIM' && !cfg.IA_CHAVE) return C.toast('Cole a chave da API antes de ligar.', 'erro');
      if (cfg.IA_ATIVA === 'SIM' && !ags.some(function (a) { return a.ativo === 'SIM'; })) C.toast('Ligada, mas ainda não há agente ativo.', 'aviso');
      C.comBotao(this, function () { return C.api('config.salvar', { config: cfg }).then(function () { C.toast('Configuração salva', 'ok'); return carregar(); }); });
    };
    C.$('#ia-testar').onclick = function () {
      var chave = C.$('#ia-chave').value.trim(), modelo = C.$('#ia-modelo').value;
      C.comBotao(this, function () { return C.api('ia.testar', { chave: chave, modelo: modelo }).then(function (r) { C.toast('Funcionando: ' + r.modelo + ' respondeu "' + r.resposta + '"', 'ok'); }); });
    };
    C.$('#ia-base').onclick = function () {
      C.comBotao(this, function () { return C.api('ia.atualizarBase').then(function (r) { C.toast(r.cursos ? r.cursos + ' cursos carregados da ' + (r.marca || 'BRASA') : 'Nenhum curso recebido. Confira a ligação com a BRASA em Integrações.', r.cursos ? 'ok' : 'aviso'); }); });
    };
    var bs = C.$('#ia-sugeridas');
    if (bs) bs.onclick = function () {
      C.comBotao(bs, function () {
        return SUGESTOES.reduce(function (p, a) { return p.then(function () { return C.api('ia.agente.salvar', { agente: a }); }); }, Promise.resolve())
          .then(function () { C.toast('Equipe criada. Revise e teste cada uma.', 'ok'); return carregar(); });
      });
    };
    var b2 = C.$('#ia-nova2'); if (b2) b2.onclick = function () { editar(null); };
    C.$$('[data-ia]', raiz).forEach(function (b) {
      var a = ags.filter(function (x) { return x.id === b.dataset.id; })[0];
      b.onclick = function () {
        if (b.dataset.ia === 'editar') editar(a);
        else if (b.dataset.ia === 'testar') simular(a);
        else if (b.dataset.ia === 'ativo') C.comBotao(b, function () { return C.api('ia.agente.salvar', { agente: Object.assign({}, a, { ativo: a.ativo === 'SIM' ? 'NAO' : 'SIM' }) }).then(carregar); });
        else if (b.dataset.ia === 'excluir') C.confirmar('Remover <b>' + esc(a.nome) + '</b>? As conversas dela ficam no histórico e voltam para o rodízio.', { perigo: true, botao: 'Remover' }).then(function (sim) {
          if (sim) C.api('ia.agente.excluir', { id: a.id }).then(function () { C.toast('Vendedora removida', 'ok'); carregar(); }).catch(function (e) { C.toast(e.message, 'erro'); });
        });
      };
    });
  }

  function cartao(a) {
    var p = PAPEIS[a.papel] || PAPEIS.vendas;
    return '<div class="card ia-card"><div class="topo">' + C.av(a.nome, 'gde', a.cor) + '<div class="meio"><h3>' + esc(a.nome) + '</h3><span class="small muted">' + esc(p[0]) + ' · até ' + C.inteiro(a.desconto_max) + '% de desconto</span></div>' +
      '<button class="btn peq" data-ia="ativo" data-id="' + a.id + '" title="Ligar ou pausar este agente"><span class="status ' + (a.ativo === 'SIM' ? 'st-on' : 'st-off') + '">' + (a.ativo === 'SIM' ? 'Ativa' : 'Pausada') + '</span></button></div>' +
      '<div class="chips">' + C.tags(a.canais).map(function (c) { return '<span class="chip">' + esc(CANAIS[c] || c) + '</span>'; }).join('') + '</div>' +
      '<div class="ia-nums"><div><b>' + C.inteiro(a.conversas) + '</b><span>conversas</span></div><div><b>' + C.inteiro(a.vendas_mes) + '</b><span>vendas no mês</span></div><div><b>' + C.brlCurto(a.receita_mes) + '</b><span>receita no mês</span></div>' +
      '<div><b>' + C.inteiro(a.mensagens) + '</b><span>mensagens</span></div><div><b>' + C.inteiro(a.passadas) + '</b><span>passadas</span></div><div><b>US$ ' + C.num(a.custo).toFixed(2) + '</b><span>custo</span></div></div>' +
      '<div class="pe"><button class="btn peq pri" data-ia="testar" data-id="' + a.id + '">' + ic('conversas') + ' Testar conversa</button><button class="btn peq" data-ia="editar" data-id="' + a.id + '">' + ic('lapis') + ' Editar</button><button class="btn peq fantasma perigo" data-ia="excluir" data-id="' + a.id + '" aria-label="Remover">' + ic('lixo') + '</button></div></div>';
  }

  /* -------------------------------------------------------- aprovações */
  var TIPOS_AP = { reembolso: ['Reembolso', 'dinheiro'], mensagem: ['Exceção', 'alerta'] };
  function pintarAprovacoes() {
    var raiz = C.$('#ia-raiz');
    raiz.innerHTML = '<div class="barra-ferr"><div class="seg">' + [['pendente', 'Esperando você'], ['decididas', 'Decididas']].map(function (f) { return '<button data-fap="' + f[0] + '" class="' + (filtroAp === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join('') + '</div></div><div id="ap-lista"><div style="text-align:center;padding:40px"><span class="spin" style="color:var(--pri)"></span></div></div>';
    C.$$('[data-fap]', raiz).forEach(function (b) { b.onclick = function () { filtroAp = b.dataset.fap; pintarAprovacoes(); }; });
    C.api('aprovacao.listar', { status: filtroAp }).then(function (l) {
      var box = C.$('#ap-lista');
      if (!box) return;
      if (filtroAp === 'pendente') { S.aprovacoesPendentes = l.length; C.renderNav(); var ab = C.$('[data-ab=aprovacoes]'); if (ab) ab.textContent = 'Aprovações' + (l.length ? ' (' + l.length + ')' : ''); }
      if (!l.length) { box.innerHTML = '<div class="card"><div class="vazio">' + ic('check') + '<h3>' + (filtroAp === 'pendente' ? 'Nada esperando você' : 'Nenhuma decisão ainda') + '</h3><p>Quando a equipe IA precisar de um sim (reembolso, prazo, desconto acima do limite), o pedido aparece aqui com o contexto e a mensagem que o cliente vai receber.</p></div></div>'; return; }
      box.innerHTML = '<div class="lista-cards">' + l.map(function (a) {
        var t = TIPOS_AP[a.tipo] || ['Pedido', 'info'], d = a.dados || {};
        return '<div class="card" style="padding:16px"><div style="display:flex;gap:12px;align-items:flex-start"><span class="chip">' + ic(t[1]) + t[0] + '</span><div style="flex:1;min-width:0"><h3 style="margin:0 0 4px;font-size:15px">' + esc(a.titulo) + '</h3>' +
          '<div class="small muted">' + (a.agente_nome ? 'Pedido por ' + esc(a.agente_nome) + ' · ' : '') + C.fmtData(a.criado_em) + (a.contato_nome ? ' · <a href="#" data-ct="' + a.contato_id + '">' + esc(a.contato_nome) + '</a>' : '') + '</div>' +
          '<p style="margin:8px 0 0;white-space:pre-wrap">' + esc(a.descricao) + '</p>' +
          (d.msg_aprovado || d.msg_recusado ? '<div class="small" style="margin-top:8px"><b>Se aprovar:</b> ' + esc(d.msg_aprovado || '') + '<br><b>Se recusar:</b> ' + esc(d.msg_recusado || '') + '</div>' : '') +
          (a.status !== 'pendente' ? '<div class="small" style="margin-top:8px"><span class="status ' + (a.status === 'aprovada' ? 'st-on' : 'st-off') + '">' + (a.status === 'aprovada' ? 'Aprovada' : 'Recusada') + '</span> por ' + esc(a.decidido_por) + ' em ' + C.fmtData(a.decidido_em) + (a.resultado ? '. ' + esc(a.resultado) : '') + '</div>' : '') +
          '</div></div>' + (a.status === 'pendente' ? '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn" data-dec="nao" data-id="' + a.id + '">' + ic('x') + ' Recusar</button><button class="btn pri" data-dec="sim" data-id="' + a.id + '">' + ic('check') + ' Aprovar</button></div>' : '') + '</div>';
      }).join('') + '</div>';
      C.$$('[data-ct]', box).forEach(function (x) { x.onclick = function (e) { e.preventDefault(); C.abrirContato(x.dataset.ct); }; });
      C.$$('[data-dec]', box).forEach(function (b) {
        var a = l.filter(function (x) { return x.id === b.dataset.id; })[0], sim = b.dataset.dec === 'sim';
        b.onclick = function () {
          var aviso = sim && a.tipo === 'reembolso' ? 'O dinheiro volta para o cliente pelo Mercado Pago e o acesso ao curso é retirado. <b>Não dá para desfazer.</b>' : sim ? 'O cliente recebe a mensagem combinada.' : 'O cliente recebe a mensagem de recusa.';
          C.pedirTexto(sim ? 'Aprovar: ' + a.titulo : 'Recusar: ' + a.titulo, 'Observação interna (opcional)', '', { botao: sim ? 'Aprovar' : 'Recusar' }).then(function (nota) {
            if (nota === null) return;
            C.confirmar(aviso, { titulo: sim ? 'Confirmar aprovação' : 'Confirmar recusa', botao: sim ? 'Aprovar' : 'Recusar', perigo: sim && a.tipo === 'reembolso' }).then(function (okk) {
              if (!okk) return;
              C.comBotao(b, function () { return C.api('aprovacao.decidir', { id: a.id, aprovar: sim, nota: nota }).then(function (r) { C.toast((sim ? 'Aprovado' : 'Recusado') + (r.resultado ? ': ' + r.resultado : ''), 'ok'); pintarAprovacoes(); }); });
            });
          });
        };
      });
    }).catch(function (e) { C.toast(e.message, 'erro'); });
  }

  /* -------------------------------------------------------- assistente */
  function pintarAssistente() {
    var raiz = C.$('#ia-raiz'), k = dados.config;
    raiz.innerHTML = '<div class="grid-2" style="align-items:start">' +
      '<div class="card"><div class="card-cab"><h3>' + ic('conversas') + ' Pergunte ao assistente</h3></div><div class="card-pad">' +
      '<p class="small muted" style="margin:0 0 10px">Ele consulta o CRM antes de responder: vendas, receita, quem espera atendimento, aprovações, desempenho da equipe IA. Só lê, não muda nada.</p>' +
      '<div class="ia-sim" id="as-msgs" style="min-height:260px">' + (conversaAssist.length ? '' : '<div class="dia-sep">Ex.: "como foram as vendas desta semana?" ou "quem está esperando resposta?"</div>') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px"><textarea class="inp" id="as-txt" rows="2" placeholder="Sua pergunta"></textarea><button class="btn pri ic" id="as-env" aria-label="Perguntar" data-carregando=" ">' + ic('enviar') + '</button></div></div></div>' +
      '<div class="card"><div class="card-cab"><h3>' + ic('calendario') + ' Resumo diário</h3><span class="acoes"><span class="status ' + (k.ASSIST_ATIVO === 'SIM' ? 'st-on' : 'st-off') + '">' + (k.ASSIST_ATIVO === 'SIM' ? 'Ligado' : 'Desligado') + '</span></span></div><div class="card-pad">' +
      '<p class="small muted" style="margin:0 0 10px">Todo dia, na hora marcada, chega um resumo do dia anterior com vendas, o que precisa de você e as 3 prioridades do dia.' + (k.ASSIST_ULTIMO ? ' Último envio: ' + C.fmtData(k.ASSIST_ULTIMO, false) + '.' : '') + '</p>' +
      '<div class="campo"><label>Situação</label><select class="inp" id="as-ativo"><option value="NAO">Desligado</option><option value="SIM"' + (k.ASSIST_ATIVO === 'SIM' ? ' selected' : '') + '>Ligado</option></select></div>' +
      '<div class="campo"><label>Horário</label><input class="inp" id="as-hora" type="time" value="' + esc(k.ASSIST_HORA || '08:00') + '"></div>' +
      '<div class="campo"><label>E-mail (vazio = e-mail do administrador)</label><input class="inp" id="as-email" type="email" value="' + esc(k.ASSIST_EMAIL || '') + '"></div>' +
      '<div class="campo"><label>WhatsApp (opcional, precisa da API ligada)</label><input class="inp" id="as-whats" inputmode="tel" placeholder="DDD + número" value="' + esc(k.ASSIST_WHATS || '') + '"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="as-salvar">' + ic('check') + ' Salvar</button><button class="btn" id="as-previa" data-carregando=" Gerando...">' + ic('olho') + ' Ver o resumo de ontem</button></div>' +
      '<div id="as-previa-txt" class="small" style="white-space:pre-wrap;margin-top:12px"></div></div></div></div>';
    var box = C.$('#as-msgs'), ta = C.$('#as-txt'), bt = C.$('#as-env');
    var add = function (h) { box.insertAdjacentHTML('beforeend', h); box.scrollTop = box.scrollHeight; };
    conversaAssist.forEach(function (m) { add('<div class="msg' + (m.de === 'eu' ? ' out' : '') + '">' + esc(m.texto) + '</div>'); });
    var enviar = function () {
      var t = ta.value.trim();
      if (!t || bt.disabled) return;
      ta.value = '';
      var sep = box.querySelector('.dia-sep'); if (sep) sep.remove();
      conversaAssist.push({ de: 'eu', texto: t });
      add('<div class="msg out">' + esc(t) + '</div><div class="ferr" id="as-dig"><span class="spin"></span> consultando o CRM...</div>');
      C.comBotao(bt, function () {
        return C.api('assistente.perguntar', { conversa: conversaAssist }).then(function (r) {
          var dg = C.$('#as-dig'); if (dg) dg.remove();
          conversaAssist.push({ de: 'assistente', texto: r.resposta });
          add('<div class="msg">' + esc(r.resposta) + '</div>');
        }).catch(function (e) { var dg = C.$('#as-dig'); if (dg) dg.remove(); conversaAssist.pop(); throw e; });
      });
    };
    bt.onclick = enviar;
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } });
    C.$('#as-salvar').onclick = function () {
      var cfg = { ASSIST_ATIVO: C.$('#as-ativo').value, ASSIST_HORA: C.$('#as-hora').value || '08:00', ASSIST_EMAIL: C.$('#as-email').value.trim(), ASSIST_WHATS: C.$('#as-whats').value.trim() };
      if (cfg.ASSIST_ATIVO === 'SIM' && !(k.IA_ATIVA === 'SIM' && k.IA_CHAVE)) return C.toast('Ligue a equipe IA (chave da API) na aba Equipe antes.', 'erro');
      C.comBotao(this, function () { return C.api('config.salvar', { config: cfg }).then(function () { C.toast('Resumo diário salvo', 'ok'); return carregar(); }); });
    };
    C.$('#as-previa').onclick = function () {
      C.comBotao(this, function () { return C.api('assistente.resumo').then(function (r) { C.$('#as-previa-txt').textContent = r.resposta; }); });
    };
  }

  /* ------------------------------------------------------------ editor */
  function editar(a) {
    a = a || { nome: '', papel: 'vendas', canais: 'whatsapp, instagram, site', cor: '#C9592F', desconto_max: 10, ativo: 'SIM', personalidade: '', regras: '', conhecimento: '' };
    var canais = C.tags(a.canais);
    C.modal({
      titulo: a.id ? 'Editar ' + a.nome : 'Novo agente da equipe', tamanho: 'largo',
      corpo: '<div class="grade" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">' +
        '<div class="campo"><label>Nome</label><input class="inp" id="ag-nome" maxlength="60" value="' + esc(a.nome) + '" placeholder="Ex.: Luna"></div>' +
        '<div class="campo"><label>Função</label><select class="inp" id="ag-papel">' + Object.keys(PAPEIS).map(function (k) { return '<option value="' + k + '"' + (k === a.papel ? ' selected' : '') + '>' + PAPEIS[k][0] + '</option>'; }).join('') + '</select><small class="muted" id="ag-papel-d"></small></div>' +
        '<div class="campo"><label>Desconto máximo (%)</label><input class="inp" id="ag-desc" type="number" min="0" max="50" value="' + esc(a.desconto_max || 0) + '"><small class="muted">Ela nunca oferece abaixo disso. 0 = sem desconto.</small></div>' +
        '<div class="campo"><label>Cor</label><input class="inp inp-cor" id="ag-cor" type="color" value="' + esc(a.cor || '#C9592F') + '"></div></div>' +
        '<div class="campo"><label>Canais</label><div class="chips">' + Object.keys(CANAIS).map(function (c) { return '<button type="button" class="chip' + (canais.indexOf(c) >= 0 ? ' sel' : '') + '" data-canal="' + c + '">' + CANAIS[c] + '</button>'; }).join('') + '</div></div>' +
        '<div class="campo"><label>Personalidade e jeito de falar</label><textarea class="inp" id="ag-pers" rows="4" maxlength="3000" placeholder="Ex.: Calorosa e objetiva. Fala como uma consultora experiente. Usa frases curtas e faz uma pergunta por vez.">' + esc(a.personalidade) + '</textarea></div>' +
        '<div class="campo"><label>Regras da empresa para ela (opcional)</label><textarea class="inp" id="ag-regras" rows="3" maxlength="4000" placeholder="Ex.: Em lançamento, sempre falar do bônus de quem compra nas primeiras 48h. Não falar de cursos de outras empresas.">' + esc(a.regras) + '</textarea></div>' +
        '<div class="campo"><label>Conhecimento extra (opcional)</label><textarea class="inp" id="ag-conh" rows="4" maxlength="20000" placeholder="Políticas, perguntas frequentes, campanhas do mês, respostas prontas. Os cursos já vêm da BRASA sozinhos.">' + esc(a.conhecimento) + '</textarea></div>' +
        '<label class="check"><input type="checkbox" id="ag-ativo"' + (a.ativo !== 'NAO' ? ' checked' : '') + '> Ativa (atende os canais marcados)</label>',
      pe: '<button class="btn" data-fechar>Cancelar</button><button class="btn pri" id="ag-ok">' + ic('check') + ' Salvar</button>',
      aoAbrir: function (el) {
        var pd = function () { el.querySelector('#ag-papel-d').textContent = PAPEIS[el.querySelector('#ag-papel').value][1]; };
        el.querySelector('#ag-papel').onchange = pd; pd();
        C.$$('[data-canal]', el).forEach(function (b) { b.onclick = function () { b.classList.toggle('sel'); }; });
        el.querySelector('#ag-ok').onclick = function () {
          var ag = { id: a.id, nome: el.querySelector('#ag-nome').value.trim(), papel: el.querySelector('#ag-papel').value, desconto_max: el.querySelector('#ag-desc').value, cor: el.querySelector('#ag-cor').value,
            canais: C.$$('[data-canal].sel', el).map(function (b) { return b.dataset.canal; }).join(', '), personalidade: el.querySelector('#ag-pers').value, regras: el.querySelector('#ag-regras').value,
            conhecimento: el.querySelector('#ag-conh').value, ativo: el.querySelector('#ag-ativo').checked ? 'SIM' : 'NAO' };
          C.comBotao(this, function () { return C.api('ia.agente.salvar', { agente: ag }).then(function () { el.fechar(); C.toast('Vendedora salva', 'ok'); return carregar(); }); });
        };
      }
    });
  }

  /* --------------------------------------------------- conversa de teste */
  var NOMES_FERR = { detalhes_do_curso: 'consultou o curso', link_de_compra: 'gerou link de compra', passar_para_humano: 'passaria para a equipe', anotar: 'anotou no CRM', mover_no_funil: 'moveria no funil', agendar_retorno: 'agendaria um retorno' };
  function simular(a) {
    var conversa = [], custo = 0;
    C.modal({
      titulo: 'Testar conversa com ' + a.nome, tamanho: 'largo',
      corpo: '<p class="small muted" style="margin:0 0 10px">Você faz o papel do cliente. Nada é gravado nem enviado: as ferramentas que mexem no CRM só são simuladas. Cada resposta usa a API (custo de alguns centavos).</p>' +
        '<div class="ia-sim" id="sim-msgs"><div class="dia-sep">Comece como um cliente: "oi, vi o anúncio do curso"</div></div>' +
        '<div style="display:flex;gap:8px;margin-top:10px"><textarea class="inp" id="sim-txt" rows="2" placeholder="Mensagem do cliente"></textarea><button class="btn verde ic" id="sim-env" aria-label="Enviar" data-carregando=" ">' + ic('enviar') + '</button></div>' +
        '<div class="small muted" id="sim-custo" style="margin-top:6px"></div>',
      pe: '<button class="btn" id="sim-limpar">Recomeçar</button><button class="btn pri" data-fechar>Fechar</button>',
      aoAbrir: function (el) {
        var box = el.querySelector('#sim-msgs'), ta = el.querySelector('#sim-txt'), bt = el.querySelector('#sim-env');
        var add = function (html) { box.insertAdjacentHTML('beforeend', html); box.scrollTop = box.scrollHeight; };
        var enviar = function () {
          var t = ta.value.trim();
          if (!t || bt.disabled) return;
          ta.value = '';
          conversa.push({ de: 'cliente', texto: t });
          add('<div class="msg">' + esc(t) + '</div>');
          add('<div class="ferr" id="sim-dig"><span class="spin"></span> ' + esc(a.nome) + ' está digitando...</div>');
          C.comBotao(bt, function () {
            return C.api('ia.simular', { agente_id: a.id, conversa: conversa }).then(function (r) {
              var dg = el.querySelector('#sim-dig'); if (dg) dg.remove();
              (r.ferramentas || []).forEach(function (f) { add('<div class="ferr">' + ic('raio') + ' ' + esc(NOMES_FERR[f.nome] || f.nome) + (f.entrada && f.entrada.curso ? ': ' + esc(f.entrada.curso) : '') + (f.entrada && f.entrada.valor_especial ? ' por ' + C.brl(f.entrada.valor_especial) : '') + '</div>'); });
              if (!r.baloes.length) add('<div class="ferr">' + ic('info') + ' ' + esc(a.nome) + ' preferiu não responder</div>');
              r.baloes.forEach(function (b) { conversa.push({ de: 'ia', texto: b }); add('<div class="msg out ia">' + esc(b) + '</div>'); });
              custo += C.num(r.custo);
              el.querySelector('#sim-custo').textContent = 'Custo deste teste: US$ ' + custo.toFixed(4);
            }).catch(function (e) { var dg = el.querySelector('#sim-dig'); if (dg) dg.remove(); conversa.pop(); throw e; });
          });
        };
        bt.onclick = enviar;
        ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } });
        el.querySelector('#sim-limpar').onclick = function () { conversa = []; custo = 0; box.innerHTML = '<div class="dia-sep">Conversa nova</div>'; el.querySelector('#sim-custo').textContent = ''; ta.focus(); };
      }
    });
  }
})();

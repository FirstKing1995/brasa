/* ==========================================================================
   BRASA CRM: modo demonstração
   Roda a MESMA lógica do servidor (logica.js) dentro do navegador, guardando
   os dados no localStorage. Serve para apresentar o sistema a clientes sem
   instalar nada. O WhatsApp é simulado: contatos "respondem" sozinhos.
   ========================================================================== */
(function () {
  'use strict';
  var CHAVE = 'brasa_crm_demo_v1';
  // ponte com a demo da BRASA (mesmo site): eventos chegam por PONTE_CRM; condições especiais vão por PONTE_OFERTAS
  var PONTE_CRM = 'brasa_crm_ponte', PONTE_OFERTAS = 'brasa_ponte_ofertas', PONTE_CHAVE = 'demo-ponte-brasa-crm-2026-0000000000000000', BRASA_DB = 'brasa:demo:db:v9';
  var CURSOS_RESERVA = [['trafego-sem-romance', 'Tráfego Sem Romance', 597], ['funil-perpetuo', 'Funil Perpétuo', 697], ['apps-sem-mensalidade', 'Apps Sem Mensalidade', 597], ['design-que-vende', 'Design Que Vende', 197], ['respira', 'Respira', 97]];
  function brasaCursos() {
    var b = null; try { b = JSON.parse(localStorage.getItem(BRASA_DB) || 'null'); } catch (e) {}
    var cs = b && b.Courses ? b.Courses.filter(function (c) { return c.status === 'published' && Number(c.price) > 0; }).sort(function (a, c) { return a.order - c.order; })
      .map(function (c) { return { slug: c.slug, title: c.title, price: Number(c.price), anchor_price: Number(c.anchor_price) || 0, category: c.category }; }) : [];
    return cs.length ? cs : CURSOS_RESERVA.map(function (x) { return { slug: x[0], title: x[1], price: x[2], anchor_price: x[2] * 2, category: '' }; });
  }
  function brasaPonte(body) {
    if (body.key !== PONTE_CHAVE) return { ok: false, error: 'Chave da ponte com o CRM inválida.' };
    if (body.action === 'bridgeCourses') return { ok: true, data: { brand: 'BRASA', courses: brasaCursos() } };
    if (body.action === 'bridgeCustomer') {
      var cs0 = brasaCursos()[0] || { title: 'Tráfego Sem Romance', price: 597 };
      var dpg = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
      return { ok: true, data: { found: true, name: 'Cliente da demonstração', email: body.email || 'aluno@brasa.demo', status: 'ativa', has_password: true, created: '2026-10-01', last_seen: dpg,
        courses: [{ course: cs0.title, slug: cs0.slug, since: dpg, access_until: 'vitalício', status: 'active', progress: '35% (7 de 20 aulas)' }],
        orders: [{ id: 'oDEMO1', course: cs0.title, amount: cs0.price, status: 'approved', method: 'pix', date: dpg, paid: dpg, in_guarantee: true, days_since_payment: 3, guarantee_days: 7 }] } };
    }
    if (body.action === 'bridgeResend') return { ok: true, data: { sent: true } };
    if (body.action === 'bridgeCourseDraft') {
      var cd = body.course || {}, nl = 0;
      (cd.seasons || []).forEach(function (s) { nl += (s.lessons || []).length; });
      return { ok: true, data: { id: 'cDEMO' + Date.now().toString(36), slug: String(cd.title || 'curso').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-'), title: cd.title, lessons: nl, admin_link: new URL('../admin.html#/cursos', location.href).href } };
    }
    if (body.action === 'bridgeRefund') return { ok: true, data: { ok: true, order_id: body.order_id, amount: (brasaCursos()[0] || { price: 597 }).price } };
    if (body.action === 'bridgeChatReply') return { ok: true, data: { id: 'g' + Date.now() } };
    if (body.action === 'bridgeSearch') return { ok: true, data: { results: [{ course: (brasaCursos()[0] || { title: 'Tráfego Sem Romance' }).title, lesson: 'T1:E3 Público e orçamento', text: 'Comece com um público amplo, orçamento baixo por 3 dias e só então corte o que não converte. O erro mais comum é mexer na campanha antes de ela aprender.', link: new URL('../index.html#/', location.href).href }] } };
    if (body.action === 'bridgeKnowledge') {
      var base = new URL('../', location.href).href;
      return { ok: true, data: { brand: 'BRASA', tagline: 'Cursos para quem quer viver de verdade', site: base, support_email: 'suporte@brasa.demo',
        courses: brasaCursos().map(function (c) { return { slug: c.slug, title: c.title, category: c.category, status: 'à venda', price: c.price, anchor_price: c.anchor_price,
          installments: '12x de ' + (c.price / 12 * 1.12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), guarantee_days: 7, promise: 'Do zero ao resultado, com aulas curtas e práticas',
          link_page: base + 'lp.html?c=' + c.slug, link_checkout: base + 'checkout.html?c=' + c.slug, faq: [{ q: 'Tem certificado?', a: 'Sim, ao concluir.' }, { q: 'Por quanto tempo tenho acesso?', a: '12 meses.' }] }; }) } };
    }
    if (body.action === 'bridgeOffer') {
      var c = brasaCursos().filter(function (x) { return x.slug === body.course; })[0];
      if (!c) return { ok: false, error: 'Curso não encontrado ou ainda não publicado na BRASA.' };
      var price = Math.round(Number(String(body.price).replace(',', '.')) * 100) / 100;
      if (!(price > 0) || price > c.price) return { ok: false, error: 'O valor precisa ficar entre R$ 1 e o preço normal do curso.' };
      var code = ''; for (var i = 0; i < 8; i++) code += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)];
      var q = []; try { q = JSON.parse(localStorage.getItem(PONTE_OFERTAS) || '[]'); } catch (e) {}
      q.push(Object.assign({}, body, { code: code })); try { localStorage.setItem(PONTE_OFERTAS, JSON.stringify(q)); } catch (e) {}
      var link = new URL('../checkout.html', location.href).href + '?c=' + encodeURIComponent(c.slug) + '&oferta=' + code + (body.email ? '&email=' + encodeURIComponent(body.email) : '') + (body.name ? '&nome=' + encodeURIComponent(body.name) : '');
      return { ok: true, data: { code: code, link: link, price: price, normal_price: c.price, course_title: c.title, expires_at: Date.now() + (Number(body.hours) || 48) * 3600e3, seller_commission: 10 } };
    }
    return { ok: false, error: 'Ação desconhecida.' };
  }
  // eventos que a demo da BRASA deixou na fila viram contatos, tags e negócios aqui
  function drenarBrasa() {
    var q = []; try { q = JSON.parse(localStorage.getItem(PONTE_CRM) || '[]'); } catch (e) {}
    if (!q.length || !L) return 0;
    try { localStorage.removeItem(PONTE_CRM); } catch (e) {}
    q.forEach(function (ev) { try { L.receberWebhook({ src: 'vendas', k: db.cfg.VENDAS_CHAVE, fonte: 'brasa' }, ev); } catch (e) { console.warn('BRASA', e.message); } });
    return q.length;
  }
  var db = null;
  /* Claude simulado: responde por regras simples, no formato da API de verdade (tool_use, end_turn, usage). */
  var iaEnviando = false;
  function claudeDemo(req) {
    var msgs = req.messages || [], ult = msgs[msgs.length - 1] || {}, sys = (req.system || []).map(function (b) { return b.text; }).join('\n');
    var nome = (sys.match(/^Você é ([^,]+),/) || [])[1] || 'Luna';
    var cursos = []; sys.replace(/^- ([\w-]+) \| ([^|]+) \|[^|]*\| à venda \| R\$ ([\d.,]+)/gm, function (m, slug, t, p) { cursos.push({ slug: slug, titulo: t.trim(), preco: Number(p.replace(/\./g, '').replace(',', '.')) }); });
    var cli = ((sys.match(/Cliente: ([^,.]+)/) || [])[1] || '').split(' ')[0];
    if (/nome ainda/.test(cli)) cli = '';
    var resp = function (content, stop) { return { id: 'msg_demo', type: 'message', role: 'assistant', model: req.model, stop_reason: stop || 'end_turn', content: content, usage: { input_tokens: 400 + Math.floor(Math.random() * 300), output_tokens: 60 + Math.floor(Math.random() * 80), cache_read_input_tokens: 5200, cache_creation_input_tokens: 0 } }; };
    var tx = function (t) { return resp([{ type: 'text', text: t }]); };
    var ferr = function (n, inp) { return resp([{ type: 'tool_use', id: 'tu_' + Date.now() + Math.random().toString(36).slice(2, 6), name: n, input: inp }], 'tool_use'); };
    var c0 = cursos[0] || { slug: 'curso', titulo: 'o curso', preco: 497 };
    if (/equipe de marketing/.test(sys)) {
      var pm = JSON.stringify(ult.content || '');
      if (/Comentário público/.test(pm)) return tx(/golpe|absurdo|reclama|lixo/i.test(pm) ? '{"acao":"humano","resposta":"","motivo":"reclamação"}' : '{"acao":"responder","resposta":"Obrigada pelo carinho! Se quiser saber mais, te espero no Direct.","motivo":"engajamento"}');
      if (/calendário do Instagram/.test(pm)) {
        var cn = (pm.match(/Cursos à venda: ([^(;]+?) \(/) || [])[1] || c0.titulo;
        return tx(JSON.stringify({ resumo: 'Semana para aquecer o público e levar para o ' + cn + '.', posts: [
          { dia: 0, hora: '19:00', tipo: 'feed', curso: cn, titulo: 'Dor do público', arte_titulo: 'Pare de impulsionar no escuro', arte_texto: 'Anúncio bom começa antes do botão azul', legenda: 'Você impulsiona, gasta e nada acontece? O problema quase nunca é o botão. É o que vem antes dele: público, oferta e mensagem.\n\nNo ' + cn + ' a gente arruma isso do zero. Link na bio.', hashtags: '#trafegopago #marketingdigital #empreendedorismo #anuncios #brasa' },
          { dia: 2, hora: '12:30', tipo: 'carrossel', curso: cn, titulo: 'Passo a passo', arte_titulo: '3 erros que queimam sua verba', arte_texto: 'Salve para revisar antes do próximo anúncio', legenda: 'Salve este post e confira antes de subir o próximo anúncio.', hashtags: '#trafegopago #dicas #marketing', roteiro: 'Slide 1: capa\nSlide 2: público pequeno demais\nSlide 3: mexer na campanha todo dia\nSlide 4: oferta confusa\nSlide 5: chamada para o curso' },
          { dia: 4, hora: '18:00', tipo: 'feed', curso: cn, titulo: 'Convite', arte_titulo: 'Seu primeiro anúncio que vende', arte_texto: 'Aulas curtas, do zero ao primeiro resultado', legenda: 'Se você quer parar de depender de impulsionar e montar um anúncio de verdade, o ' + cn + ' é o caminho. Garantia de 7 dias.', hashtags: '#trafegopago #cursoonline #brasa' },
          { dia: 5, hora: '20:00', tipo: 'reels', curso: cn, titulo: 'Bastidor', arte_titulo: 'Bastidor', arte_texto: '', legenda: 'Um pouco de como a gente prepara as aulas.', hashtags: '#bastidores #brasa', roteiro: 'Cena 1: mesa de gravação\nCena 2: tela com o gerenciador\nCena 3: fala final convidando para o curso' }] }));
      }
      return tx(/live/i.test(pm) ? 'Roteiro de live\n\n0-5 min: abertura e promessa da live\n5-25 min: conteúdo em 3 blocos\n25-35 min: perguntas\n35-40 min: oferta do ' + c0.titulo + '\n\nDivulgação: 3 posts e 5 stories nos dias anteriores.' : /perfil/i.test(pm) ? 'Bio, opção 1: Cursos práticos para quem quer viver de verdade. Comece grátis.\n\nDestaques: Comece aqui, Cursos, Alunos, Bastidores, Dúvidas.' : 'Campanha: ' + c0.titulo + '\n\nPúblico: empreendedores que já impulsionam sem resultado.\nÂngulos: dor, prova e oferta.\n10 títulos e 5 textos prontos.\nVerba: começar com R$ 30 por dia por 7 dias e cortar o que não vende.');
    }
    if (/equipe de produto/.test(sys)) {
      if (/plano de um curso/.test(JSON.stringify(ult.content || ''))) return tx(JSON.stringify({ curso: { title: 'Copy para Anúncios', subtitle: 'Textos curtos que fazem clicar e comprar', category: 'Marketing', level: 'Iniciante', price: 297, anchor_price: 597, promise: 'Escreva anúncios que param a rolagem e levam à compra', short_desc: 'Do gancho à chamada para ação, com modelos prontos.', description: '', audience: ['Quem já anuncia e não converte', 'Quem vende pelo Instagram'], pains: ['Anúncio que ninguém clica', 'Texto que não vende'], benefits: ['Modelos de gancho', 'Revisão em 5 passos'], seasons: [{ title: 'Fundamentos', lessons: [{ title: 'O gancho', description: 'Como parar a rolagem' }, { title: 'A promessa', description: 'O que prometer sem exagero' }] }, { title: 'Prática', lessons: [{ title: 'Seu primeiro anúncio', description: 'Passo a passo' }, { title: 'Testes', description: 'Como testar 3 textos' }] }], racional: 'Alunos do Tráfego pedem mais exemplos de texto.' } }));
      return tx('O que os dados mostram\n- Alunos pedem mais exemplos práticos.\n\nNovos produtos\n- Copy para Anúncios (R$ 297)\n- Mentoria em grupo mensal\n\nPrioridades do mês\n1. Gravar aulas extras de exemplos\n2. Lançar Copy para Anúncios\n3. Criar bônus de modelos');
    }
    if (/assessoria jurídica/.test(sys)) return tx('RASCUNHO PARA REVISÃO DE UM ADVOGADO\n\n' + (/reclamação que pode ter risco/.test(JSON.stringify(ult.content || '')) ? 'Risco: médio. O cliente pode exercer o direito de arrependimento em 7 dias (CDC, art. 49).\n\nRecomendação: oferecer o reembolso dentro da garantia e registrar a conversa.\n\nMensagem sugerida: Oi! Entendemos sua insatisfação e já encaminhamos seu reembolso. Qualquer dúvida, estamos aqui.' : 'Documento de exemplo gerado na demonstração.\n\n1. Objeto\n- [PREENCHER]\n\n2. Garantia e reembolso\n- O aluno pode pedir o reembolso em até 7 dias (CDC, art. 49).\n\n3. Dados pessoais (LGPD)\n- Usamos seus dados só para entregar o curso e o atendimento.'));
    if (/diretoria executiva/.test(sys)) {
      if (Array.isArray(ult.content) && ult.content[0] && ult.content[0].type === 'tool_result') { var fx = {}; try { fx = JSON.parse(ult.content[0].content); } catch (e) {} return tx('Resultado da semana\n- Receita do mês: ' + (fx.receita_mes || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + (fx.meta_mes ? ' (' + fx.pct_meta + '% da meta)' : '') + '\n- Teto do MEI: ' + (fx.pct_teto || 0) + '% usado no ano\n\nDecisões para você\n- Definir a meta do mês, se ainda não definiu.\n- Revisar as melhorias mais pedidas pelos alunos.'); }
      return ferr('financeiro', {});
    }
    var papel = /SUCESSO DO CLIENTE/.test(sys) ? 'sucesso' : /CONSULTORA/.test(sys) ? 'consultor' : /equipe de SUPORTE/.test(sys) ? 'suporte' : /assistente pessoal do dono/.test(sys) ? 'assistente' : 'vendas';
    var textoDe = function (m) { return m ? String(Array.isArray(m.content) ? m.content.map(function (b) { return b.text || ''; }).join(' ') : m.content || '').toLowerCase() : ''; };
    var pedidoOriginal = textoDe(msgs.filter(function (m) { return m.role === 'user' && !(Array.isArray(m.content) && m.content[0] && m.content[0].type === 'tool_result'); }).pop());
    if (papel === 'assistente') {
      if (Array.isArray(ult.content) && ult.content[0] && ult.content[0].type === 'tool_result') {
        var mt = {}; try { mt = JSON.parse(ult.content[0].content); } catch (e) {}
        return tx('Vendas: ' + (mt.vendas || 0) + ' (' + (mt.receita || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + '). Contatos novos: ' + (mt.novos_contatos || 0) + '. A IA respondeu ' + (mt.respostas_da_ia || 0) + ' mensagens.\n\nPrecisa de você: ' + ((mt.aprovacoes_pendentes || []).length) + ' aprovação(ões) e ' + ((mt.esperando_pessoa || []).length) + ' conversa(s) esperando uma pessoa.\n\nPrioridades: decidir as aprovações, responder quem espera e revisar a equipe IA.');
      }
      var hoje = new Date(); hoje = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      var de = /semana/.test(textoDe(ult)) ? new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10) : /ontem|resumo/.test(textoDe(ult)) ? new Date(Date.now() - 864e5).toISOString().slice(0, 10) : hoje;
      return ferr('metricas', { de: de, ate: /ontem|resumo/.test(textoDe(ult)) ? de : hoje });
    }
    if (Array.isArray(ult.content) && ult.content[0] && ult.content[0].type === 'tool_result' && papel !== 'vendas') {
      var rr = {}; try { rr = JSON.parse(ult.content[0].content); } catch (e) {}
      if (rr.results) return tx('Isso a gente vê na aula ' + rr.results[0].lesson + ': ' + rr.results[0].text + '\n\nMe conta como está a sua campanha hoje que eu te ajudo a aplicar.');
      if (rr.orders && /reembols|cancel|dinheiro de volta/.test(pedidoOriginal)) return ferr('pedir_reembolso', { pedido_id: rr.orders[0].id, motivo: 'Cliente pediu no chat' });
      if (rr.orders) return tx('Achei sua conta: você está com ' + (rr.courses[0] ? rr.courses[0].course + ' (' + rr.courses[0].progress + ')' : 'acesso ativo') + '. Me conta o que está acontecendo?');
      if (rr.dentro_da_garantia !== undefined) return tx('Pronto, registrei seu pedido de reembolso. A equipe confirma em breve e eu te aviso por aqui.');
      if (rr.para) return tx('Vou te passar para a ' + rr.para + ', da equipe de ' + rr.equipe + ', ela continua com você agora.');
      if (rr.instrucao && /código|acesso/.test(rr.instrucao)) return tx('Pronto! Mandei para o seu e-mail um código para criar uma senha nova. Ele vale 30 minutos; olha também no spam.');
    }
    if (papel === 'suporte' && !(Array.isArray(ult.content) && ult.content[0] && ult.content[0].type === 'tool_result')) {
      var ts = textoDe(ult);
      if (/receber esta conversa/.test(ts) && /reembols|cancel|senha|acesso/.test(ts)) return ferr('consultar_cliente', {});
      if (/receber esta conversa/.test(ts) || /receber esta conversa/.test(sys)) return tx('Oi! Aqui é a ' + nome + ', do suporte. Me passa o e-mail da sua conta que eu já resolvo.');
      if (/senha|acesso|entrar|login/.test(ts)) return ferr('reenviar_acesso', { email: (ts.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] || 'aluno@brasa.demo' });
      if (/reembols|cancel|dinheiro de volta/.test(ts)) return ferr('consultar_cliente', {});
      if (/@/.test(ts)) return ferr('consultar_cliente', {});
    }
    if (papel === 'sucesso') {
      var tsu = textoDe(ult);
      if (Array.isArray(ult.content) && ult.content[0] && ult.content[0].type === 'tool_result') return tx('Obrigada por contar, de verdade! Isso ajuda muito a gente a melhorar.');
      if (/nota do sistema/.test(tsu)) return tx('Oi! Aqui é a ' + nome + ', da BRASA. Passando para saber como está sendo a sua experiência com o ' + c0.titulo + '. Conseguiu acessar tudo direitinho?');
      var nota = (tsu.match(/\b(10|[0-9])\b/) || [])[1];
      return ferr('registrar_feedback', { curso: c0.titulo, momento: 'espontaneo', nps: nota !== undefined ? Number(nota) : undefined, sentimento: /ruim|difícil|dificil|travei|não gostei|nao gostei|faltou/.test(tsu) ? 'negativo' : /amei|gostei|ótimo|otimo|top|bom/.test(tsu) ? 'positivo' : 'neutro', comentario: tsu.slice(0, 200), faltou: /faltou|senti falta/.test(tsu) ? tsu.slice(0, 200) : '' });
    }
    if (papel === 'consultor' && !(Array.isArray(ult.content) && ult.content[0] && ult.content[0].type === 'tool_result')) {
      var tc = textoDe(ult);
      if (/senha|acesso|pagamento|reembols|cancel/.test(tc)) return ferr('transferir', { equipe: 'suporte', resumo: 'Aluno com problema de acesso ou pagamento: ' + tc.slice(0, 120) });
      if (/receber esta conversa/.test(tc)) return tx('Oi! Aqui é a ' + nome + ', consultora da BRASA. Em que parte do método você travou?');
      if (tc.length > 3) return ferr('buscar_nas_aulas', { pergunta: tc.slice(0, 80) });
    }
    if (Array.isArray(ult.content) && ult.content[0] && ult.content[0].type === 'tool_result') {
      var r = {}; try { r = JSON.parse(ult.content[0].content); } catch (e) {}
      if (r.erro) return tx('Deixa eu confirmar isso com a equipe e já te falo.');
      if (r.quem) return tx('Entendi. Já chamei ' + (r.quem === 'alguém' ? 'alguém' : 'a ' + r.quem) + ' da equipe, a conversa continua com ela por aqui.');
      if (r.preco_especial) return tx('Consegui uma condição pra você: ' + r.preco_especial + ' (de ' + r.preco_normal + '), válida até ' + r.validade + '.\n\nÉ só garantir por aqui: ' + r.link);
      if (r.link) return tx('Perfeito! Sai por ' + r.preco + (r.parcelamento ? ' ou ' + r.parcelamento : '') + ', com ' + (r.garantia_dias || 7) + ' dias de garantia.\n\nGaranta por aqui: ' + r.link);
      if (r.slug) return tx('O ' + r.title + ' tem aulas curtas e práticas, acesso por 12 meses e certificado.\n\nQuer que eu te mande o link?');
      return tx('Anotado!');
    }
    var t = String(Array.isArray(ult.content) ? ult.content.map(function (b) { return b.text || ''; }).join(' ') : ult.content || '').toLowerCase();
    var jaOfereceu = msgs.some(function (m) { return Array.isArray(m.content) && m.content.some(function (b) { return b.type === 'tool_use' && b.input && b.input.valor_especial; }); });
    if (/nota do sistema/.test(t)) return tx('Oi' + (cli ? ', ' + cli : '') + '! Passando pra saber se ficou alguma dúvida sobre o ' + c0.titulo + '.');
    if (/reembolso|cancelar|reclama|absurdo|procon/.test(t)) return ferr('passar_para_humano', { motivo: 'Pedido de reembolso ou reclamação', resumo: 'Cliente escreveu: ' + t.slice(0, 160), urgente: true });
    if (/rob[oô]|\bia\b|intelig[eê]ncia|humano|pessoa de verdade/.test(t)) return tx('Sou a ' + nome + ', assistente virtual da equipe BRASA.\n\nSe preferir falar com alguém da equipe, é só me dizer que eu chamo agora.');
    if (/caro|desconto|sem grana|apertad|mais barato/.test(t) && !jaOfereceu) return ferr('link_de_compra', { curso: c0.slug, valor_especial: Math.ceil(c0.preco * 0.9), horas_validade: 24 });
    if (/link|quero|comprar|fechar|garantir|bora|pode mandar|pode sim/.test(t)) return ferr('link_de_compra', { curso: c0.slug });
    if (/parcel|garantia|certificado|acesso|como funciona/.test(t)) return ferr('detalhes_do_curso', { curso: c0.slug });
    if (/depois|vou ver|pensar|retorno/.test(t)) return resp([{ type: 'tool_use', id: 'tu_r' + Date.now(), name: 'agendar_retorno', input: { horas: 6, motivo: 'ver se decidiu sobre o ' + c0.titulo } }], 'tool_use');
    if (/obrigad|valeu|^ok$|beleza/.test(t)) return tx('Imagina' + (cli ? ', ' + cli : '') + '! Qualquer coisa é só chamar.');
    return tx('Oi' + (cli ? ', ' + cli : '') + '! Aqui é a ' + nome + ', da BRASA.\n\nMe conta: o que você quer destravar agora? Assim eu te indico o caminho certo, tipo o ' + c0.titulo + '.');
  }

  function carregar() {
    try { db = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { db = null; }
    if (!db || !db.t) { db = { t: {}, cfg: {}, cache: {}, arq: {} }; semearDemo(); }
    if (!db.arq) db.arq = {};
  }
  var salvarPend = null;
  function salvar() {
    clearTimeout(salvarPend);
    salvarPend = setTimeout(function () { try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch (e) { /* cheio */ } }, 150);
  }
  function t(nome) { if (!db.t[nome]) db.t[nome] = []; return db.t[nome]; }
  var pad = function (n) { return ('0' + n).slice(-2); };
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  var seq = 0;
  function hashSimples(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return 'd' + h.toString(16); }
  function uuid() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }
  function limpa(o) { var c = {}; Object.keys(o).forEach(function (k) { c[k] = o[k] === undefined || o[k] === null ? '' : String(o[k]); }); return c; }

  var respostasPendentes = [];
  var P = {
    tabela: function (n) { return t(n); },
    filtrar: function (n, campo, v) { return t(n).filter(function (o) { return o[campo] === v; }); },
    inserir: function (n, o) { t(n).push(limpa(o)); salvar(); },
    inserirVarios: function (n, arr) { arr.forEach(function (o) { t(n).push(limpa(o)); }); salvar(); },
    atualizar: function (n, id, campos) { var m = {}; m[id] = campos; P.atualizarVarios(n, m); },
    atualizarVarios: function (n, mapa) {
      t(n).forEach(function (o) {
        var c = mapa[o.id];
        if (c) Object.keys(c).forEach(function (k) { o[k] = c[k] === undefined || c[k] === null ? '' : String(c[k]); });
      });
      salvar();
    },
    excluir: function (n, id) { P.excluirVarios(n, [id]); },
    substituir: function (n, objs) { db.t[n] = objs.map(limpa); salvar(); },
    // arquivo mensal simulado: cada mês vira um bloco guardado no navegador
    arquivo: {
      criar: function (nome) { var id = 'ARQ' + Date.now().toString(36) + (++seq); db.arq[id] = { nome: nome, t: {} }; salvar(); return { id: id, url: '' }; },
      anexar: function (id, aba, cab, objs) { var a = db.arq[id].t[aba] = db.arq[id].t[aba] || []; var ja = {}; a.forEach(function (o) { ja[o.id] = 1; }); objs.forEach(function (o) { if (!ja[o.id]) a.push(limpa(o)); }); salvar(); },
      ler: function (id, aba) { return ((db.arq[id] || { t: {} }).t[aba] || []).slice(); },
      filtrar: function (id, aba, campo, v) { return P.arquivo.ler(id, aba).filter(function (o) { return o[campo] === v; }); }
    },
    excluirVarios: function (n, ids) { var s = {}; ids.forEach(function (i) { s[i] = 1; }); db.t[n] = t(n).filter(function (o) { return !s[o.id]; }); salvar(); },
    config: function () { return db.cfg; },
    salvarConfig: function (o) { Object.keys(o).forEach(function (k) { db.cfg[k] = String(o[k]); }); salvar(); },
    agora: function () { return iso(new Date()); },
    id: function (p) { return p + Date.now().toString(36).toUpperCase() + (++seq); },
    uuid: uuid,
    hash: function (s, salt) { return hashSimples(salt + '|' + s); },
    cache: {
      get: function (k) { var v = db.cache[k]; if (!v) return null; if (v.e < Date.now()) { delete db.cache[k]; return null; } return v.v; },
      put: function (k, v, s) { db.cache[k] = { v: String(v), e: Date.now() + (s || 600) * 1000 }; salvar(); },
      del: function (k) { delete db.cache[k]; salvar(); }
    },
    // WhatsApp simulado: toda URL "responde" como uma Evolution API conectada.
    http: function (url, o) {
      if (/graph\.instagram\.com/.test(url)) return { code: 200, text: /media_publish/.test(url) ? '{"id":"DEMOPOST' + Date.now() + '"}' : /\/media$/.test(url) ? '{"id":"DEMOCONT"}' : /permalink/.test(url) ? '{"permalink":"https://www.instagram.com/"}' : '{"id":"DEMO"}' };
      if (/api\.anthropic\.com/.test(url)) { var rq = {}; try { rq = JSON.parse(o.body || '{}'); } catch (e) { /* nada */ } return { code: 200, text: JSON.stringify(claudeDemo(rq)) }; }
      if (/^demo:\/\/brasa/.test(url)) { var bb = {}; try { bb = JSON.parse(o.body || '{}'); } catch (e) { /* nada */ } return { code: 200, text: JSON.stringify(brasaPonte(bb)) }; }
      if (/connectionState/.test(url)) return { code: 200, text: JSON.stringify({ instance: { state: 'open' } }) };
      if (/fetchAllGroups/.test(url)) return { code: 200, text: JSON.stringify([{ id: '120363000000001@g.us', subject: 'Comunidade BRASA', size: 187 }, { id: '120363000000002@g.us', subject: 'Alunos Tráfego Sem Romance', size: 214 }]) };
      if (/inviteCode/.test(url)) return { code: 200, text: JSON.stringify({ inviteUrl: 'https://chat.whatsapp.com/DEMO' + Math.random().toString(36).slice(2, 8) }) };
      if (/\/instance\/(create|connect)/.test(url)) return { code: 200, text: JSON.stringify({ instance: { state: 'open' } }) };
      if (/mercadopago\.com\/checkout\/preferences/.test(url)) return { code: 201, text: JSON.stringify({ init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=DEMO' + Date.now().toString(36) }) };
      if (/mercadopago\.com\/users\/me/.test(url)) return { code: 200, text: '{"nickname":"BRASA"}' };
      if (/\/message\//.test(url)) {
        var corpo = {}; try { corpo = JSON.parse(o.body || '{}'); } catch (e) { /* nada */ }
        if (corpo.number && !/@g\.us$/.test(corpo.number) && !iaEnviando) agendarResposta(corpo.number, corpo.text || corpo.caption || '');
        return { code: 200, text: JSON.stringify({ key: { id: 'DEMO' + Date.now() + Math.random().toString(36).slice(2, 6) }, status: 'PENDING' }) };
      }
      return { code: 200, text: '{}' };
    },
    urlApp: function () { return 'https://script.google.com/macros/s/SEU-ID-DEMO/exec'; },
    demo: true,
    midia: { salvar: function (b64) { var bin = atob(b64), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([arr], { type: 'image/jpeg' })); } },
    // e-mail simulado: nada sai de verdade; parte das pessoas "abre" e "clica" sozinha
    email: {
      gmail: function (m) { simularLeitura(m.html); },
      cotaGmail: function () { return 100; }
    }
  };

  var L = null;
  function simularLeitura(html) {
    var m = String(html || '').match(/t=o&amp;f=([\w-]+)&amp;s=([0-9a-f]+)/);
    if (!m || Math.random() > 0.6) return;
    setTimeout(function () {
      try {
        if (Math.random() < 0.4) L.receberRastreio({ t: 'c', f: m[1], s: m[2], u: 'https://exemplo.com.br/oferta' });
        else L.receberRastreio({ t: 'o', f: m[1], s: m[2] });
      } catch (e) { console.warn(e); }
    }, 4000 + Math.random() * 12000);
  }
  var RESPOSTAS = ['Oi! Tudo bem sim', 'Quero saber mais do curso', 'Dá para parcelar?', '1', 'Tem garantia?', 'Obrigado!', 'Vou ver e te retorno', 'Tenho interesse sim'];
  function agendarResposta(numero, texto) {
    if (Math.random() < 0.35) return;
    var c = L && L.filtrarContatos({}).filter(function (x) { return L.U.telChave(x.telefone) === L.U.telChave(numero); })[0];
    if (!c) return;
    var resp;
    if (/\*1\*/.test(texto)) resp = String(1 + Math.floor(Math.random() * 3));
    else if (/e-?mail/i.test(texto)) resp = L.U.primeiroNome(c.nome).toLowerCase() + '@exemplo.com.br';
    else if (/seu nome|qual é o seu nome/i.test(texto)) resp = c.nome;
    else resp = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];
    respostasPendentes.push({ em: Date.now() + 3000 + Math.random() * 5000, m: { telefone: numero, nome: c.nome, texto: resp, tipo: 'texto', wa_id: 'IN' + Date.now() + Math.random() } });
  }
  setInterval(function () {
    if (!L) return;
    var agora = Date.now();
    var prontas = respostasPendentes.filter(function (r) { return r.em <= agora; });
    respostasPendentes = respostasPendentes.filter(function (r) { return r.em > agora; });
    prontas.forEach(function (r) { try { L.receber(r.m); } catch (e) { console.warn(e); } });
  }, 1500);
  setInterval(function () { if (L) try { L.trabalhar(4); } catch (e) { console.warn(e); } if (L) { iaEnviando = true; try { L.trabalharIA(null, 3); } catch (e2) { console.warn(e2); } iaEnviando = false; } }, 8000);

  /* ------------------------------------------------- dados de exemplo */
  function semearDemo() {
    L = PrumoLogica(P);
    P.salvarConfig({
      NOME: 'BRASA CRM', SLOGAN: 'O comercial da BRASA', COR_PRIMARIA: '#E2A72E', COR_DESTAQUE: '#C9592F', CONFIGURADO: 'SIM', SEGMENTO: 'brasa',
      WA_PROVEDOR: 'evolution', EVOLUTION_URL: 'https://evolution.demo', EVOLUTION_APIKEY: 'demo', EVOLUTION_INSTANCIA: 'demo',
      HORARIO_INICIO: '00:00', HORARIO_FIM: '23:59', DIAS_ENVIO: '0,1,2,3,4,5,6',
      CAMPOS_PERSONALIZADOS: JSON.stringify([{ chave: 'curso', rotulo: 'Curso', tipo: 'texto' }, { chave: 'situacao', rotulo: 'Situação', tipo: 'texto' }]),
      TAGS: 'Lead quente, Aluno, Afiliado, Lista de espera, Retornar', ARQUIVO_FEITO: iso(new Date()).slice(0, 7),
      EMAIL_NOME: 'BRASA', EMAIL_RODAPE: 'BRASA - Cursos para quem quer viver de verdade',
      MP_TOKEN: 'APP_USR-demonstracao', CHAT_ATIVO: 'SIM', FIN_VERIFICADO: iso(new Date()).slice(0, 10), BRASA_URL: 'demo://brasa', BRASA_CHAVE: PONTE_CHAVE
    });
    L.semear({ nome: 'Dhione Cambraia', email: 'admin@brasa.demo', senha: 'brasa123' });
    var salt = uuid();
    P.inserirVarios('Usuarios', [
      { id: 'U2', nome: 'Duda Lins', email: 'duda@brasa.demo', senha_hash: P.hash('brasa123', salt), salt: salt, perfil: 'sdr', ativo: 'SIM', recebe_leads: 'SIM', cor: '#7C3AED', criado_em: P.agora(), meta_reunioes: '20' },
      { id: 'U3', nome: 'Juliana Prado', email: 'gestao@brasa.demo', senha_hash: P.hash('brasa123', salt), salt: salt, perfil: 'gestor', ativo: 'SIM', recebe_leads: 'NAO', cor: '#DB2777', criado_em: P.agora() },
      { id: 'U4', nome: 'Rafa Monteiro', email: 'vendas@brasa.demo', senha_hash: P.hash('brasa123', salt), salt: salt, perfil: 'closer', ativo: 'SIM', recebe_leads: 'SIM', cor: '#0EA5E9', criado_em: P.agora(), meta_valor: '15000' }
    ]);
    P.atualizar('Usuarios', 'U1', { meta_valor: '20000' });
    // aplica o funil do segmento
    var mod = PRUMO_MODELOS_SEGMENTO.brasa;
    P.excluirVarios('Etapas', t('Etapas').map(function (e) { return e.id; }));
    P.atualizar('Funis', 'FU1', { nome: mod.funil });
    P.inserirVarios('Etapas', mod.etapas.map(function (e, i) { return { id: 'ET' + (i + 1), funil_id: 'FU1', nome: e[0], cor: e[1], ordem: i + 1, tipo: e[2] || 'aberto' }; }));
    P.inserir('Funis', { id: 'FU2', nome: 'Jornada do aluno', ordem: 2 });
    [['Começou', '#86B7B2'], ['Parou no meio', '#EC7A42'], ['Concluiu', '#DCAA68'], ['Comprou o próximo', '#9AA84A', 'ganho'], ['Sumiu', '#C9592F', 'perdido']]
      .forEach(function (e, i) { P.inserir('Etapas', { id: 'EP' + (i + 1), funil_id: 'FU2', nome: e[0], cor: e[1], ordem: i + 1, tipo: e[2] || 'aberto' }); });

    var nomes = ['Ana Beatriz Souza', 'Carlos Henrique', 'Fernanda Alves', 'Gustavo Pereira', 'Helena Martins', 'Igor Santos', 'Juliana Rocha', 'Leonardo Dias',
      'Mariana Freitas', 'Natália Gomes', 'Otávio Ribeiro', 'Paula Teixeira', 'Rodrigo Nunes', 'Sabrina Lopes', 'Thiago Barros', 'Vanessa Cardoso',
      'Bruno Azevedo', 'Camila Duarte', 'Diego Moreira', 'Eduarda Campos', 'Felipe Araújo', 'Gabriela Pinto', 'Hugo Fernandes', 'Isabela Ramos',
      'João Victor Melo', 'Larissa Cunha', 'Marcelo Viana', 'Patrícia Lemos', 'Renata Farias', 'Sérgio Castro', 'Tatiane Moura', 'Vinícius Rezende'];
    var origens = ['BRASA', 'Instagram', 'Página de vendas', 'Indicação', 'Anúncio'];
    var tagsPool = ['Lead quente', 'Aluno', 'Lista de espera', 'Retornar', 'BRASA: Carrinho abandonado'];
    var conversas = [
      ['in', 'Oi, vi o anúncio do Tráfego Sem Romance'], ['out', 'Oi! Que bom que chegou até aqui. Você já anuncia hoje ou está começando?'], ['in', 'Impulsiono uns posts, mas não vejo retorno'],
      ['out', 'É exatamente o que a primeira temporada resolve. Posso te mandar uma condição especial?'], ['in', 'Pode sim!']
    ];
    var agora = Date.now();
    var r = 11;
    var rnd = function () { r = (r * 16807) % 2147483647; return r / 2147483647; };
    nomes.forEach(function (n, i) {
      var dias = Math.floor(rnd() * 40);
      var criado = iso(new Date(agora - dias * 86400000 - rnd() * 36000000));
      var tags = tagsPool.filter(function () { return rnd() < 0.25; });
      var tel = '55' + ['11', '21', '31', '41', '48', '61', '71', '85'][i % 8] + '9' + String(80000000 + Math.floor(rnd() * 19999999));
      var c = {
        id: 'C' + (100 + i), nome: n, telefone: tel, email: n.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + i + '@exemplo.com.br',
        empresa: rnd() < 0.3 ? 'Empresa ' + n.split(' ').pop() : '', cargo: '', cidade: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Florianópolis'][i % 5],
        origem: origens[Math.floor(rnd() * origens.length)], tags: tags.join(', '), responsavel_id: ['U1', 'U2', 'U3', ''][i % 4], status: tags.indexOf('Aluno') >= 0 ? 'cliente' : 'lead',
        campos: JSON.stringify({ curso: ['Tráfego Sem Romance', 'Funil Perpétuo', 'Canva Que Vende', 'Isca Que Pesca'][i % 4] }), notas: '', optout: 'NAO', bot_pausado_ate: '',
        ultima_msg: '', ultima_msg_em: '', ultima_direcao: '', nao_lidas: '0', total_msgs: '0', criado_em: criado, atualizado_em: criado
      };
      var nMsg = i < 14 ? 2 + Math.floor(rnd() * 4) : 0;
      var base = new Date(agora - Math.min(dias, 6) * 86400000 - rnd() * 20000000);
      for (var k = 0; k < nMsg; k++) {
        var cv = conversas[k];
        var quando = iso(new Date(base.getTime() + k * 420000));
        t('Mensagens').push(limpa({ id: 'M' + i + '_' + k, contato_id: c.id, direcao: cv[0], tipo: 'texto', texto: cv[1].replace('{n}', n), status: cv[0] === 'in' ? 'recebida' : 'enviada', usuario_id: cv[0] === 'out' ? (c.responsavel_id || 'U1') : '', origem: cv[0] === 'out' ? 'manual' : 'whatsapp', criado_em: quando }));
        c.ultima_msg = cv[1]; c.ultima_msg_em = quando; c.ultima_direcao = cv[0]; c.atualizado_em = quando;
      }
      c.total_msgs = String(nMsg);
      c.nao_lidas = nMsg && c.ultima_direcao === 'in' && i % 3 === 0 ? '1' : '0';
      t('Contatos').push(limpa(c));
      if (i < 22) {
        var et = ['ET1', 'ET2', 'ET3', 'ET4', 'ET5', 'ET6'][Math.floor(rnd() * 6)];
        var tipo = et === 'ET5' ? 'ganho' : et === 'ET6' ? 'perdido' : 'aberto';
        // parte dos leads foi qualificada pelo SDR (Rafael) e passada para a closer (Camila)
        var passado = i % 3 === 1 && et !== 'ET1';
        if (passado) { var salvo = t('Contatos')[t('Contatos').length - 1]; salvo.responsavel_id = c.responsavel_id = 'U4'; salvo.sdr_id = 'U2'; }
        var reuniao = passado ? iso(new Date(agora + (i % 2 ? 1 : -2) * 86400000 + 3600000 * (i % 5))) : '';
        t('Negocios').push(limpa({
          id: 'N' + (100 + i), titulo: ['Tráfego Sem Romance', 'Funil Perpétuo', 'Canva Que Vende', 'Isca Que Pesca'][i % 4] + ' - ' + n.split(' ')[0], contato_id: c.id, funil_id: 'FU1', etapa_id: et,
          valor: String([597, 697, 97, 197][i % 4]), responsavel_id: c.responsavel_id || 'U1', status: tipo,
          motivo_perda: tipo === 'perdido' ? ['Preço', 'Sem resposta', 'Comprou do concorrente'][i % 3] : '', previsao: '', notas: '',
          criado_em: criado, atualizado_em: criado, fechado_em: tipo !== 'aberto' ? iso(new Date(agora - Math.floor(rnd() * 25) * 86400000)) : '',
          sdr_id: passado ? 'U2' : '', passado_em: passado ? iso(new Date(agora - (2 + i % 7) * 86400000)) : '', reuniao_em: reuniao,
          reuniao_status: passado ? (reuniao < iso(new Date()) ? (i % 4 ? 'realizada' : 'no_show') : 'agendada') : ''
        }));
      }
      // conversas antigas (mês passado) para mostrar o arquivo mensal
      if (i < 8) {
        var velho = new Date(agora - (35 + i * 3) * 86400000);
        [['in', 'O acesso ao curso é vitalício?'], ['out', 'É sim, e as atualizações entram sem custo. Quer o link?'], ['in', 'Vou ver e volto a falar']].forEach(function (cv, k) {
          t('Mensagens').push(limpa({ id: 'MV' + i + '_' + k, contato_id: c.id, direcao: cv[0], tipo: 'texto', texto: cv[1], status: cv[0] === 'in' ? 'recebida' : 'enviada', usuario_id: cv[0] === 'out' ? 'U1' : '', origem: cv[0] === 'out' ? 'manual' : 'whatsapp', criado_em: iso(new Date(velho.getTime() + k * 600000)), canal: 'whatsapp' }));
        });
        t('Historico').push(limpa({ id: 'HV' + i, data: iso(velho), contato_id: c.id, negocio_id: '', usuario_nome: 'Sistema', acao: 'contato_criado', detalhe: 'Chegou pela BRASA' }));
      }
    });
    var hoje = iso(new Date()).slice(0, 10);
    P.inserirVarios('Tarefas', [
      { id: 'T1', titulo: 'Mandar condição especial do Tráfego', tipo: 'whatsapp', contato_id: 'C100', responsavel_id: 'U1', vence_em: hoje + 'T10:00:00', feita: 'NAO', criado_em: P.agora() },
      { id: 'T2', titulo: 'Ligar para quem parou na T2', tipo: 'ligacao', contato_id: 'C103', responsavel_id: 'U2', vence_em: iso(new Date(agora - 86400000)), feita: 'NAO', criado_em: P.agora() },
      { id: 'T3', titulo: 'Reunião de alinhamento da equipe', tipo: 'reuniao', contato_id: '', responsavel_id: 'U1', vence_em: iso(new Date(agora + 2 * 86400000)), feita: 'NAO', criado_em: P.agora() }
    ]);
    P.inserirVarios('Grupos', [
      { id: 'G1', nome: 'Comunidade BRASA 1', jid: '120363000000011@g.us', link: 'https://chat.whatsapp.com/DEMOGRUPO1', slug: 'comunidade', limite: '250', cliques: '250', ordem: '1', ativo: 'SIM', criado_em: P.agora() },
      { id: 'G2', nome: 'Comunidade BRASA 2', jid: '120363000000012@g.us', link: 'https://chat.whatsapp.com/DEMOGRUPO2', slug: 'comunidade', limite: '250', cliques: '96', ordem: '2', ativo: 'SIM', criado_em: P.agora() }
    ]);
    P.inserir('Campanhas', {
      id: 'D1', nome: 'Estreia do Funil Perpétuo', destino: 'contatos', filtro: JSON.stringify({ tags: ['Aluno'] }), grupos: '[]',
      texto: '{Oi|Olá} {primeiro_nome}! O Funil Perpétuo estreou na BRASA e quem já é aluno entra com 20% de desconto até domingo. Responda QUERO para receber o link.',
      velocidade: 'normal', status: 'concluida', total: '9', enviados: '9', erros: '0', respostas: '4', criado_por: 'Dhione Cambraia',
      criado_em: iso(new Date(agora - 5 * 86400000)), iniciada_em: iso(new Date(agora - 5 * 86400000)), concluida_em: iso(new Date(agora - 5 * 86400000 + 900000))
    });
    // e-mail marketing de exemplo
    var blocos = JSON.stringify([{ tipo: 'titulo', texto: '{primeiro_nome}, seu próximo curso começa aqui' }, { tipo: 'texto', texto: 'Quem já é aluno da BRASA entra no *Funil Perpétuo* com *20% de desconto* até domingo.\n\nSão quatro temporadas para montar o produto que vende todo dia, sem lançamento.' }, { tipo: 'botao', texto: 'Quero agendar', url: 'https://exemplo.com.br/agendar' }, { tipo: 'texto', texto: 'Qualquer dúvida, é só responder este e-mail.' }]);
    P.inserirVarios('Emails', [
      { id: 'EM1', nome: 'Estreia do Funil Perpétuo', tipo: 'campanha', assunto: '{primeiro_nome}, 20% no Funil Perpétuo', assunto_b: 'Estreou: o curso que vende todo dia', preheader: 'Só para quem já é aluno', blocos: blocos, filtro: '{}', status: 'concluida', total: '30', enviados: '30', enviados_b: '15', aberturas: '17', aberturas_b: '10', cliques: '6', descadastros: '1', erros: '0', criado_por: 'Dhione Cambraia', criado_em: iso(new Date(agora - 6 * 86400000)), iniciada_em: iso(new Date(agora - 6 * 86400000)), concluida_em: iso(new Date(agora - 6 * 86400000 + 3600000)) },
      { id: 'EM2', nome: 'Boas-vindas por e-mail', tipo: 'automacao', assunto: 'Bem-vindo(a) à BRASA, {primeiro_nome}', preheader: 'Tudo o que você precisa saber', blocos: JSON.stringify([{ tipo: 'titulo', texto: 'Que bom ter você aqui, {primeiro_nome}!' }, { tipo: 'texto', texto: 'Separamos nossos tratamentos mais procurados para você conhecer.' }, { tipo: 'botao', texto: 'Ver tratamentos', url: 'https://exemplo.com.br/tratamentos' }]), filtro: '{}', status: 'ativo', total: '0', enviados: '0', aberturas: '0', cliques: '0', descadastros: '0', erros: '0', criado_por: 'Dhione Cambraia', criado_em: P.agora() }
    ]);
    P.inserir('Automacoes', { id: 'A9', nome: 'Boas-vindas por e-mail para lead do site', ativo: 'SIM', gatilho: JSON.stringify({ tipo: 'webhook', origem: '' }), passos: JSON.stringify([{ id: 'e1', tipo: 'email', email_id: 'EM2' }, { id: 'e2', tipo: 'esperar', valor: 2, unidade: 'dias' }, { id: 'e3', tipo: 'condicao', se: 'email', op: 'nao_abriu', valor: 'EM2', sim: 'e4', nao: 'fim' }, { id: 'e4', tipo: 'mensagem', texto: 'Oi {primeiro_nome}! Te mandei um e-mail com nossos tratamentos. Quer que eu te mande por aqui?' }]), uma_vez: 'SIM', disparos: '0', concluidas: '0', criado_em: P.agora(), atualizado_em: P.agora() });
    // financeiro: pacotes parcelados, pagos, em aberto, atrasados e um reembolso
    var dia = function (n) { return iso(new Date(agora + n * 86400000)).slice(0, 10); };
    var cobs = [];
    var parc = function (cid, desc, valor, n, venc0, pagas, forma) {
      for (var k = 0; k < n; k++) {
        var v = dia(venc0 + k * 30), paga = k < pagas;
        cobs.push({ id: 'CB' + cid + k, tipo: 'parcela', ref_id: '', contato_id: cid, negocio_id: '', descricao: desc, valor: String(valor), vencimento: v, status: paga ? 'paga' : 'pendente', pago_em: paga ? v + 'T10:30:00' : '', forma: forma,
          parcela: String(k + 1), parcelas: String(n), link: paga ? '' : 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=DEMO' + cid + k, mp_id: '', origem: 'manual', lembrete_em: '', atraso_avisado: !paga && v < dia(0) ? iso(new Date()) : '', reembolsado_em: '', reembolso_valor: '', criado_em: iso(new Date(agora - 150 * 86400000)), atualizado_em: P.agora() });
      }
    };
    parc('C100', 'Mentoria de tráfego', 290, 6, -125, 5, 'Pix');
    parc('C101', 'Mentoria de lançamento', 480, 5, -95, 3, 'Cartão');
    parc('C102', 'Mentoria de tráfego', 290, 4, -64, 2, 'Pix');
    parc('C104', 'Consultoria de funil (3 encontros)', 160, 3, -40, 1, 'Boleto');
    parc('C105', 'Mentoria de tráfego', 290, 6, -20, 1, 'Pix');
    parc('C107', 'Revisão de campanha', 220, 1, -8, 1, 'Cartão');
    parc('C109', 'Mentoria de lançamento', 480, 5, -10, 0, 'Boleto');
    parc('C110', 'Mentoria de tráfego', 290, 3, 2, 0, 'Pix');
    parc('C111', 'Consultoria de funil (3 encontros)', 160, 3, 5, 0, 'Pix');
    cobs.filter(function (x) { return x.contato_id === 'C107'; }).forEach(function (x) { x.status = 'reembolsada'; x.reembolsado_em = iso(new Date(agora - 2 * 86400000)); x.reembolso_valor = '220'; });
    P.inserirVarios('Cobrancas', cobs);
    ['C101', 'C102', 'C104', 'C109'].forEach(function (id) { var c = t('Contatos').filter(function (x) { return x.id === id; })[0]; if (c) { c.tags = c.tags ? c.tags + ', Inadimplente' : 'Inadimplente'; c.status = 'cliente'; } });
    ['C100', 'C105', 'C110', 'C111'].forEach(function (id) { var c = t('Contatos').filter(function (x) { return x.id === id; })[0]; if (c) c.status = 'cliente'; });
    P.inserir('Cobrancas', { id: 'LK1', tipo: 'link', ref_id: '', contato_id: '', negocio_id: '', descricao: 'Revisão de campanha avulsa', valor: '150', vencimento: '', status: 'ativo', pago_em: '', forma: '', parcela: '7', parcelas: '1', link: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=DEMOVALE', mp_id: '', origem: 'link', lembrete_em: '', atraso_avisado: '', reembolsado_em: '', reembolso_valor: '', criado_em: P.agora(), atualizado_em: P.agora() });
    // conversa que chegou pelo chat do site
    var cs = { id: 'C900', nome: 'Patrícia Visitante', telefone: '5511988776655', email: '', empresa: '', cargo: '', cidade: '', origem: 'Chat do site', tags: '', responsavel_id: '', status: 'lead', campos: '{}', notas: '', optout: 'NAO', bot_pausado_ate: '', canal: 'site', chat_id: 'vdemo-site-1', ultima_msg: 'Tem aula grátis para testar antes?', ultima_msg_em: iso(new Date(agora - 6 * 60000)), ultima_direcao: 'in', nao_lidas: '1', total_msgs: '2', criado_em: iso(new Date(agora - 8 * 60000)), atualizado_em: iso(new Date(agora - 6 * 60000)) };
    t('Contatos').push(limpa(cs));
    t('Mensagens').push(limpa({ id: 'MS1', contato_id: 'C900', direcao: 'in', tipo: 'texto', texto: 'Oi! O Canva Que Vende serve para quem nunca abriu o Canva?', status: 'recebida', origem: 'site', canal: 'site', criado_em: iso(new Date(agora - 8 * 60000)) }));
    t('Mensagens').push(limpa({ id: 'MS2', contato_id: 'C900', direcao: 'in', tipo: 'texto', texto: 'Tem aula grátis para testar antes?', status: 'recebida', origem: 'site', canal: 'site', criado_em: iso(new Date(agora - 6 * 60000)) }));
    // acesso personalizado: gestor de tráfego
    P.inserir('Usuarios', { id: 'U5', nome: 'Diego Tráfego', email: 'trafego@brasa.demo', senha_hash: P.hash('brasa123', salt), salt: salt, perfil: 'personalizado', permissoes: 'todos,relatorios,integracoes', ativo: 'SIM', recebe_leads: 'NAO', cor: '#EA580C', criado_em: P.agora() });
    // plano de suporte (código de exemplo)
    var jsup = JSON.stringify({ p: 'anual', a: dia(300), c: 'WhatsApp do suporte: (11) 90000-0000', n: 'BRASA', d: dia(-65) });
    P.salvarConfig({ SUPORTE_CODIGO: L.SUP.b64(jsup, true) + '.' + L.SUP.soma(jsup) });
    // deixa as automações de exemplo ligadas na demonstração
    t('Automacoes').forEach(function (a, i) { if (i < 2) a.ativo = 'SIM'; });
    salvar();
  }

  carregar();
  // ?nome=Minha%20Empresa&cor=1F6FEB: a página de vendas abre a demonstração já com a marca do visitante
  (function () {
    var q = new URLSearchParams(location.search), nome = (q.get('nome') || '').trim().slice(0, 40), cor = (q.get('cor') || '').replace(/[^0-9a-f]/gi, '');
    if (nome) db.cfg.NOME = nome;
    if (cor.length === 6) db.cfg.COR_PRIMARIA = '#' + cor;
    if (nome || cor.length === 6) salvar();
  })();
  L = PrumoLogica(P);
  // equipe IA ligada na demonstração (com o Claude simulado acima): um de cada time
  if (!db.cfg.IA_CHAVE) { db.cfg.IA_CHAVE = 'sk-ant-demonstracao-0000'; db.cfg.IA_ATIVA = 'SIM'; db.cfg.IA_ESPERA_SEG = '6'; db.cfg.IA_RECUPERAR_MIN = '1'; salvar(); }
  if (!db.cfg.IG_TOKEN) { db.cfg.IG_TOKEN = 'demo-instagram'; db.cfg.IG_ID = 'demo'; salvar(); }
  try {
    var papeisDemo = {}; (db.t.Agentes || []).forEach(function (a) { papeisDemo[a.papel] = 1; });
    var faltam = [
      { nome: 'Luna', papel: 'vendas', canais: 'whatsapp, instagram, site', cor: '#C9592F', desconto_max: 10, personalidade: 'Calorosa, segura e objetiva.' },
      { nome: 'Mel', papel: 'recuperacao', canais: 'whatsapp', cor: '#E2A72E', desconto_max: 15, personalidade: 'Leve e prestativa.' },
      { nome: 'Tati', papel: 'suporte', canais: 'whatsapp, aluno, site, instagram', cor: '#86B7B2', desconto_max: 0, personalidade: 'Paciente, calma e resolutiva.' },
      { nome: 'Iara', papel: 'consultor', canais: 'aluno', cor: '#9AA84A', desconto_max: 0, personalidade: 'Mentora experiente e encorajadora.' },
      { nome: 'Clara', papel: 'sucesso', canais: 'whatsapp, aluno', cor: '#DCAA68', desconto_max: 0, personalidade: 'Acolhedora e curiosa.' },
      { nome: 'Nina', papel: 'social', canais: 'instagram', cor: '#EC7A42', desconto_max: 0, personalidade: 'Simpática e rápida.' }
    ].filter(function (a) { return !papeisDemo[a.papel]; });
    if (faltam.length) {
      var sa = L.rotear({ action: 'login', email: 'admin@brasa.demo', senha: 'brasa123' });
      faltam.forEach(function (a) { L.rotear({ action: 'ia.agente.salvar', token: sa.token, agente: a }); });
    }
  } catch (e) { console.warn('IA demo', e.message); }
  drenarBrasa();
  setInterval(function () { try { if (drenarBrasa()) window.dispatchEvent(new Event('brasa-ponte')); } catch (e) { console.warn(e); } }, 5000);

  window.PrumoDemo = {
    call: function (body) {
      return new Promise(function (ok) {
        setTimeout(function () {
          try { ok({ ok: true, data: JSON.parse(JSON.stringify(L.rotear(body))) }); }
          catch (e) { ok({ ok: false, error: e.message, auth: e.message === 'SESSAO_EXPIRADA' }); }
        }, 120 + Math.random() * 180);
      });
    },
    /** Simula uma mensagem chegando pelo WhatsApp (botão na tela de conversas). */
    /** Simula um aluno escrevendo no chat da área do aluno da BRASA. */
    simularAluno: function (email, nome, texto) { L.receberWebhook({ src: 'vendas', k: db.cfg.VENDAS_CHAVE, fonte: 'brasa' }, { plataforma: 'BRASA', evento: 'chat_aluno', email: email, nome: nome, texto: texto, msg_id: 'g' + Date.now() }); },
    simularEntrada: function (telefone, nome, texto) { L.receber({ telefone: telefone, nome: nome, texto: texto, tipo: 'texto', wa_id: 'SIM' + Date.now() }); },
    resetar: function () { localStorage.removeItem(CHAVE); location.reload(); }
  };
})();

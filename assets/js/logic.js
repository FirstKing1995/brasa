/* =====================================================================
   BRASA · logic.js — regras de negócio
   O MESMO arquivo roda em dois lugares:
     • Google Apps Script (copiado como Logic.gs) — produção
     • navegador, no modo demonstração (demo.js fornece um "env" local)
   Nada aqui conhece planilha, Mercado Pago ou IA diretamente: tudo passa
   pelo objeto `env`, que cada ambiente implementa.

   env = {
     now(), uuid(), sha256(str)->hex, hmac(str,key)->hex, b64enc(str), b64dec(str),
     db: { rows(table), insert(table,row), update(table,id,row), remove(table,id) },
     config()->{k:v}, setConfig({k:v}), secret(name), setSecret(name,value),
     lock(fn), cache: { get(k), put(k,v,sec), del(k) },
     pay: { pix(o), preference(o), get(id), search(ref), refund(id), ping() },
     mail(to, subject, html), ai(system, user, maxTokens)->text,
     capi(pixelId, token, version, payload), github(path, content, message)->url,
     upload(name, mime, base64)->url, log(level, where, msg, data),
     apiUrl(), siteUrl(), isDemo
   }
   Sintaxe compatível com o runtime V8 do Apps Script (sem ?. e ??).
   ===================================================================== */
var BrasaLogic = (function () {
  'use strict';

  /* ---------------- esquema das abas ---------------- */
  var SCHEMA = {
    Users: ['id', 'created_at', 'updated_at', 'name', 'email', 'phone', 'pass_hash', 'salt', 'roles', 'status', 'avatar', 'avatar_color', 'aff_code', 'pix_key', 'instagram', 'xp', 'streak', 'streak_day', 'badges', 'my_list', 'last_seen', 'reset_code', 'reset_exp', 'first_token', 'notes', 'seller_commission', 'seller_max_discount'],
    Courses: ['id', 'created_at', 'updated_at', 'slug', 'status', 'order', 'featured', 'title', 'subtitle', 'category', 'tags', 'level', 'short_desc', 'description', 'banner', 'poster', 'logo', 'show_title', 'trailer', 'color', 'instructor_name', 'instructor_bio', 'instructor_photo', 'price', 'anchor_price', 'max_installments', 'methods', 'checkout_url', 'guarantee_days', 'access_days', 'pixel_id', 'promise', 'audience', 'pains', 'benefits', 'bonuses', 'faq', 'testimonials', 'cta_text', 'scarcity_until', 'support_url', 'aff_enabled', 'aff_commission', 'aff_auto', 'aff_cookie_days', 'aff_materials', 'lp', 'lp_status', 'lp_updated_at', 'lp_static_url', 'seo_title', 'seo_desc', 'bump_enabled', 'bump_type', 'bump_course_id', 'bump_title', 'bump_text', 'bump_price', 'bump_image', 'bump_delivery', 'upsell_enabled', 'upsell_course_id', 'upsell_price', 'upsell_title', 'upsell_text', 'upsell_minutes', 'released_at', 'ads', 'ads_updated_at'],
    Seasons: ['id', 'created_at', 'course_id', 'order', 'title', 'description', 'release_mode', 'release_days', 'release_at'],
    Lessons: ['id', 'created_at', 'updated_at', 'course_id', 'season_id', 'order', 'title', 'description', 'video_url', 'duration_min', 'thumb', 'materials', 'free_preview', 'xp'],
    Enrollments: ['id', 'created_at', 'user_id', 'course_id', 'expires_at', 'source', 'order_id', 'status'],
    Progress: ['id', 'created_at', 'updated_at', 'user_id', 'course_id', 'lesson_id', 'status', 'position', 'completed_at', 'note', 'liked'],
    Orders: ['id', 'created_at', 'updated_at', 'paid_at', 'data_br', 'status', 'course_id', 'course_title', 'user_id', 'name', 'email', 'phone', 'doc', 'price', 'discount', 'coupon', 'amount', 'method', 'installments', 'mp_payment_id', 'mp_preference_id', 'status_detail', 'fee', 'net', 'aff_id', 'aff_code', 'commission', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'fbp', 'fbc', 'ua', 'recovery_sent', 'capi_sent', 'checked_at', 'bump_type', 'bump_ref', 'bump_title', 'bump_amount', 'bump_delivery', 'parent_order_id', 'offer_id', 'seller_id', 'seller_commission', 'banner_id', 'card_brand'],
    Affiliations: ['id', 'created_at', 'updated_at', 'user_id', 'course_id', 'status', 'commission', 'pixel_id', 'note'],
    Clicks: ['id', 'ts', 'course_id', 'aff_code', 'type', 'sid', 'utm_source', 'utm_campaign', 'ref_url'],
    Commissions: ['id', 'created_at', 'updated_at', 'order_id', 'aff_id', 'course_id', 'amount', 'status', 'release_at', 'paid_at', 'payout_id', 'kind'],
    Payouts: ['id', 'created_at', 'aff_id', 'amount', 'count', 'pix_key', 'note'],
    Coupons: ['id', 'created_at', 'code', 'course_id', 'type', 'value', 'max_uses', 'uses', 'expires_at', 'active', 'aff_code'],
    Messages: ['id', 'ts', 'thread', 'from', 'text', 'read_admin', 'read_user'],
    Certificates: ['id', 'code', 'created_at', 'user_id', 'course_id', 'name', 'course_title', 'hours'],
    Logs: ['id', 'ts', 'level', 'where', 'msg', 'data'],
    Templates: ['id', 'created_at', 'updated_at', 'channel', 'audience', 'key', 'title', 'subject', 'heading', 'body', 'cta', 'active', 'order'],
    Emails: ['id', 'ts', 'to', 'user_id', 'key', 'subject', 'status', 'error'],
    Banners: ['id', 'created_at', 'updated_at', 'active', 'title', 'text', 'cta_label', 'action', 'url', 'course_id', 'coupon', 'image', 'placement', 'audience', 'audience_course_id', 'starts_at', 'ends_at', 'priority', 'clicks'],
    Leads: ['id', 'created_at', 'updated_at', 'user_id', 'name', 'email', 'phone', 'source', 'ref', 'course_id', 'status', 'seller_id', 'value', 'next_at', 'last_at', 'lost_reason', 'order_id', 'note'],
    Activities: ['id', 'ts', 'lead_id', 'user_id', 'actor_id', 'type', 'text', 'data'],
    Offers: ['id', 'created_at', 'code', 'seller_id', 'lead_id', 'course_id', 'email', 'price', 'expires_at', 'max_uses', 'uses', 'order_id', 'note'],
    Intents: ['id', 'ts', 'course_id', 'name', 'email', 'phone', 'aff_code', 'src', 'done']
  };
  var NUM = {};
  ['created_at', 'updated_at', 'paid_at', 'order', 'price', 'anchor_price', 'max_installments', 'guarantee_days', 'access_days',
    'aff_commission', 'aff_cookie_days', 'lp_updated_at', 'ads_updated_at', 'scarcity_until', 'release_days', 'release_at', 'duration_min', 'xp',
    'expires_at', 'position', 'completed_at', 'discount', 'amount', 'installments', 'fee', 'net', 'commission', 'ts', 'value',
    'max_uses', 'uses', 'hours', 'streak', 'last_seen', 'reset_exp', 'count', 'checked_at', 'seller_commission', 'seller_max_discount', 'bump_price', 'upsell_price', 'upsell_minutes', 'bump_amount', 'starts_at', 'ends_at', 'priority', 'clicks', 'next_at', 'last_at', 'released_at'].forEach(function (k) { NUM[k] = 1; });
  var BOOL = {};
  ['featured', 'show_title', 'free_preview', 'aff_enabled', 'aff_auto', 'active', 'liked', 'read_admin', 'read_user', 'recovery_sent', 'capi_sent', 'bump_enabled', 'upsell_enabled', 'done'].forEach(function (k) { BOOL[k] = 1; });
  var ID_PREFIX = { Users: 'u', Courses: 'c', Seasons: 's', Lessons: 'l', Enrollments: 'e', Progress: 'p', Orders: 'o', Affiliations: 'a', Clicks: 'k', Commissions: 'm', Payouts: 'y', Coupons: 'q', Messages: 'g', Certificates: 'x', Logs: 'z', Templates: 't', Emails: 'w', Banners: 'b', Leads: 'd', Activities: 'v', Offers: 'f', Intents: 'i' };

  var DEFAULT_CONFIG = {
    brand_name: 'BRASA',
    brand_tagline: 'Cursos para quem quer viver de verdade',
    brand_logo: '',
    support_whatsapp: '',
    support_email: '',
    site_url: '',
    api_url: '',
    pixel_id: '',
    installment_rate: 0.0299,
    max_installments: 12,
    pix_expiration_min: 60,
    commission_release_days: 8,
    notify_sales: true,
    recovery_emails: true,
    recovery_delay_min: 60,
    ai_model: 'claude-sonnet-5-5',
    meta_api_version: 'v24.0',
    github_repo: '',
    github_branch: 'main',
    email_sender_name: 'BRASA',
    admin_email: '',
    checkout_cpf: 'optional',
    terms_url: '',
    privacy_url: '',
    affiliate_program: true,
    aff_default_commission: 40,
    aff_default_cookie_days: 60,
    mp_public_key: '',
    card_mode: 'transparent',
    card_3ds: true,
    aff_on_bump: true,
    crm_auto_assign: true,
    crm_inactive_days: 14,
    seller_default_commission: 10,
    seller_default_max_discount: 20,
    email_provider: 'gmail',
    email_from: ''
  };
  var SECRET_KEYS = ['MP_ACCESS_TOKEN', 'AI_API_KEY', 'GITHUB_TOKEN', 'META_CAPI_TOKEN', 'EMAIL_API_KEY'];

  var RANKS = [
    { min: 1, name: 'Iniciado' }, { min: 3, name: 'Andarilho' }, { min: 5, name: 'Guerreiro' },
    { min: 8, name: 'Berserker' }, { min: 11, name: 'Skald' }, { min: 15, name: 'Jarl' }, { min: 20, name: 'Lenda' }
  ];
  var BADGES = [
    { id: 'primeiro-passo', rune: 'ᚱ', name: 'Primeiro passo', desc: 'Concluiu a primeira aula.' },
    { id: 'investidor', rune: 'ᚠ', name: 'Investidor', desc: 'Garantiu o primeiro curso.' },
    { id: 'maratona', rune: 'ᚢ', name: 'Maratonista', desc: 'Cinco aulas concluídas no mesmo dia.' },
    { id: 'coruja', rune: 'ᛞ', name: 'Coruja', desc: 'Concluiu uma aula entre meia-noite e 5h.' },
    { id: 'chama', rune: 'ᚲ', name: 'Chama acesa', desc: 'Sete dias seguidos estudando.' },
    { id: 'escriba', rune: 'ᚨ', name: 'Escriba', desc: 'Fez anotações em cinco aulas.' },
    { id: 'conquista', rune: 'ᛊ', name: 'Conquistador', desc: 'Concluiu o primeiro curso.' },
    { id: 'veterano', rune: 'ᛏ', name: 'Veterano', desc: 'Cinquenta aulas concluídas.' },
    { id: 'colheita', rune: 'ᛃ', name: 'Colheita', desc: 'Concluiu três cursos.' },
    { id: 'colecionador', rune: 'ᛟ', name: 'Colecionador', desc: 'Tem três cursos na estante.' }
  ];
  var DAY = 86400000;
  var VISIBLE = { published: 1, coming_soon: 1 };

  /* ---------------- comercial, mensagens e modelos ---------------- */
  var SOURCE_LABEL = { abandoned: 'Carrinho abandonado', pix_expired: 'Pix não pago', upsell: 'Próximo curso', inactive: 'Aluno parado', waitlist: 'Lista de espera', manual: 'Cadastro manual' };
  var STATUS_LABEL = { 'new': 'Novo', contact: 'Em contato', negotiating: 'Negociando', won: 'Ganho', lost: 'Perdido' };
  var LOST_REASONS = ['Sem dinheiro agora', 'Achou caro', 'Sem tempo agora', 'Comprou em outro lugar', 'Parou de responder', 'Não é o público', 'Outro motivo'];
  var MONTHS_FULL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var EMAIL_LABELS = {
    welcome: 'Boas-vindas após a compra', access: 'Reenvio de acesso (quem ainda não tem senha)', code: 'Código para criar ou trocar a senha',
    recovery: 'Recuperação de carrinho', inactive: 'Lembrete para quem parou de assistir', bump_delivery: 'Entrega do produto do order bump',
    aff_sale: 'Afiliado: venda confirmada', aff_approved: 'Afiliado: afiliação aprovada', aff_rejected: 'Afiliado: afiliação recusada',
    payout: 'Comissão paga', support_reply: 'Resposta do suporte', seller_invite: 'Convite para vendedor',
    seller_sale: 'Vendedor: venda fechada', offer: 'Condição especial enviada pelo vendedor', launch: 'Estreia de curso (lista de espera)'
  };
  var EMAIL_VARS = {
    welcome: ['primeiro_nome', 'nome', 'curso', 'itens', 'instrucao_acesso', 'cta_acesso', 'marca'],
    access: ['primeiro_nome', 'nome', 'marca'],
    code: ['primeiro_nome', 'codigo', 'codigo_html', 'marca'],
    recovery: ['primeiro_nome', 'nome', 'curso', 'motivo', 'marca'],
    inactive: ['primeiro_nome', 'dias_sem_acessar', 'episodio_atual', 'curso_atual', 'progresso', 'marca'],
    bump_delivery: ['primeiro_nome', 'produto', 'curso', 'marca'],
    aff_sale: ['primeiro_nome', 'curso', 'comissao', 'marca'],
    aff_approved: ['primeiro_nome', 'curso', 'marca'],
    aff_rejected: ['primeiro_nome', 'curso', 'marca'],
    payout: ['primeiro_nome', 'valor', 'quantidade', 'marca'],
    support_reply: ['primeiro_nome', 'mensagem', 'marca'],
    seller_invite: ['primeiro_nome', 'comissao_info', 'cta_acesso', 'marca'],
    seller_sale: ['primeiro_nome', 'curso', 'valor', 'comissao_frase', 'marca'],
    offer: ['primeiro_nome', 'curso', 'valor', 'valor_oferta', 'validade', 'vendedor', 'marca'],
    launch: ['primeiro_nome', 'nome', 'curso', 'valor', 'marca']
  };
  var AUDIENCE_VARS = {
    student: ['primeiro_nome', 'nome', 'email', 'link_acesso', 'instrucao_senha', 'cursos', 'curso_atual', 'episodio_atual', 'progresso', 'dias_sem_acessar', 'ultimo_acesso', 'link_app', 'link_afiliacao', 'marca'],
    affiliate: ['primeiro_nome', 'nome', 'codigo', 'mes', 'vendas_mes', 'valor_vendido_mes', 'comissao_mes', 'comissao_disponivel', 'comissao_a_liberar', 'comissao_paga_total', 'cliques_mes', 'ranking_posicao', 'cursos_afiliados', 'link_principal', 'link_painel', 'chave_pix', 'marca'],
    lead: ['primeiro_nome', 'nome', 'curso', 'valor', 'valor_oferta', 'link_oferta', 'validade', 'link_checkout', 'link_curso', 'curso_concluido', 'episodio_atual', 'dias_sem_acessar', 'link_acesso', 'vendedor', 'origem', 'marca'],
    order: ['primeiro_nome', 'nome', 'curso', 'valor', 'metodo', 'link_recuperacao', 'link_acesso', 'marca']
  };
  var VAR_DOCS = {
    primeiro_nome: 'Primeiro nome', nome: 'Nome completo', email: 'E-mail', telefone: 'WhatsApp', marca: 'Nome da plataforma',
    link_acesso: 'Link de acesso (cria a senha se ainda não tiver)', instrucao_senha: 'Instrução de senha conforme o caso', link_app: 'Link da plataforma',
    link_afiliacao: 'Link para virar afiliado', cursos: 'Cursos que a pessoa tem', curso_atual: 'Curso que está assistindo',
    episodio_atual: 'Próximo episódio (ex.: T2:E3 · título)', progresso: 'Progresso no curso atual', dias_sem_acessar: 'Dias desde o último acesso',
    ultimo_acesso: 'Data do último acesso', codigo: 'Código de afiliado', mes: 'Mês atual', vendas_mes: 'Vendas no mês',
    valor_vendido_mes: 'Valor vendido no mês', comissao_mes: 'Comissão do mês', comissao_disponivel: 'Comissão disponível para receber',
    comissao_a_liberar: 'Comissão em garantia', comissao_paga_total: 'Total já recebido', cliques_mes: 'Cliques no mês',
    ranking_posicao: 'Posição no ranking do mês', cursos_afiliados: 'Cursos que divulga', link_principal: 'Link de divulgação principal',
    link_painel: 'Link do painel do afiliado', chave_pix: 'Chave Pix cadastrada', curso: 'Curso', valor: 'Preço normal ou valor do pedido',
    valor_oferta: 'Preço da condição especial', link_oferta: 'Link da condição especial', validade: 'Validade da condição',
    link_checkout: 'Link do checkout', link_curso: 'Link da página de vendas', curso_concluido: 'Último curso concluído',
    vendedor: 'Primeiro nome de quem vende', origem: 'Origem do lead', metodo: 'Forma de pagamento', link_recuperacao: 'Link para concluir o pagamento',
    itens: 'Itens liberados na compra', instrucao_acesso: 'Instrução de acesso conforme o caso', cta_acesso: 'Texto do botão de acesso',
    codigo_html: 'Código em destaque', motivo: 'Motivo do pagamento não concluído', produto: 'Produto do order bump', comissao: 'Valor da comissão',
    quantidade: 'Quantidade de vendas', mensagem: 'Texto da resposta', comissao_info: 'Frase sobre a comissão do vendedor', comissao_frase: 'Frase com a comissão da venda'
  };
  var SAMPLE_VARS = {
    primeiro_nome: 'Iara', nome: 'Iara Soares', email: 'iara@exemplo.com', curso: 'Tráfego Sem Romance',
    itens: '**Tráfego Sem Romance**\n**Pack de 30 criativos editáveis**', instrucao_acesso: 'No primeiro acesso você cria a sua senha. Leva menos de um minuto.',
    cta_acesso: 'Criar senha e assistir', codigo: '482913', codigo_html: '<div style="font-size:34px;letter-spacing:10px;color:#e2a72e;font-weight:bold;margin:6px 0">482913</div>',
    motivo: ' (o código Pix expira por segurança)', dias_sem_acessar: '12', episodio_atual: 'T2:E3 · Estáticos e carrosséis', curso_atual: 'Tráfego Sem Romance',
    progresso: '58%', produto: 'Pack de 30 criativos editáveis', comissao: 'R$ 198,80', valor: 'R$ 497,00', quantidade: '3',
    mensagem: 'Pode sim! Os criativos da pasta podem ser usados nos seus Reels.', comissao_info: '\n\nSua comissão é de **10%** sobre cada venda que você fechar.',
    comissao_frase: 'Sua comissão: **R$ 39,70**, liberada depois do período de garantia.', valor_oferta: 'R$ 397,00', validade: '22/10/2026 20:00', vendedor: 'Rafa'
  };
  function E(key, subject, heading, body, cta, order) { return { channel: 'email', audience: 'system', key: key, title: EMAIL_LABELS[key], subject: subject, heading: heading, body: body, cta: cta, order: order }; }
  function W(audience, key, title, body, order) { return { channel: 'wa', audience: audience, key: key, title: title, subject: '', heading: '', body: body, cta: '', order: order }; }
  var DEFAULT_TEMPLATES = [
    E('welcome', 'Seu acesso a {curso} está liberado', 'Bem-vindo, {primeiro_nome}.', 'Pagamento confirmado. Já está na sua estante:\n\n{itens}\n\n{instrucao_acesso}', '{cta_acesso}', 1),
    E('access', 'Seu acesso à {marca} está pronto', 'Crie sua senha, {primeiro_nome}.', 'Seus cursos já estão liberados. Falta só criar a sua senha. Leva menos de um minuto.', 'Criar senha e entrar', 2),
    E('code', 'Seu código de acesso: {codigo}', 'Código de acesso', 'Use este código para criar uma nova senha. Ele vale por 30 minutos.\n\n{codigo_html}\n\nSe não foi você que pediu, ignore este e-mail.', '', 3),
    E('recovery', 'Sua vaga em {curso} ainda está aqui', '{primeiro_nome}, faltou só o pagamento.', 'Você começou a garantir **{curso}**, mas o pagamento não foi concluído{motivo}.\n\nSe ainda faz sentido para você, é só gerar um novo pagamento. Leva um minuto.', 'Concluir minha inscrição', 4),
    E('inactive', '{primeiro_nome}, sua próxima aula está te esperando', 'Bora voltar?', 'Faz {dias_sem_acessar} dias que você não aparece por aqui. Você parou em **{episodio_atual}**, de {curso_atual}.\n\nDez minutos hoje já colocam você de volta no ritmo.', 'Continuar de onde parei', 5),
    E('bump_delivery', 'Seu adicional: {produto}', 'Aqui está: {produto}', 'Obrigado por adicionar **{produto}** à sua compra de {curso}.\n\nO acesso é pelo botão abaixo. Guarde este e-mail.', 'Acessar agora', 6),
    E('aff_sale', 'Venda confirmada: {curso}', 'Você vendeu, {primeiro_nome}.', '**{curso}** acabou de ser comprado pelo seu link.\n\nComissão: **{comissao}**, liberada depois do período de garantia.', 'Ver meu painel', 7),
    E('aff_approved', 'Afiliação aprovada: {curso}', 'Pode divulgar.', 'Sua afiliação a **{curso}** foi aprovada. Seus links já estão no painel.', 'Abrir painel', 8),
    E('aff_rejected', 'Pedido de afiliação: {curso}', 'Pedido não aprovado', 'Desta vez sua afiliação a {curso} não foi aprovada. Fale com o suporte se quiser entender o motivo.', 'Abrir painel', 9),
    E('payout', 'Pagamento de comissões: {valor}', 'Comissão paga', 'Enviamos **{valor}** referentes a {quantidade} venda(s) para a sua chave Pix.', 'Ver extrato', 10),
    E('support_reply', 'Nova resposta do suporte', 'Você tem uma resposta', '{mensagem}', 'Responder', 11),
    E('seller_invite', 'Seu acesso à área comercial da {marca}', 'Bem-vindo ao time, {primeiro_nome}.', 'Você foi cadastrado como vendedor. Na área comercial você recebe os leads, conversa pelo WhatsApp e gera links de pagamento com condição especial.{comissao_info}', '{cta_acesso}', 12),
    E('seller_sale', 'Venda fechada: {curso}', 'Fechou, {primeiro_nome}.', '**{curso}** foi pago com a sua condição especial: {valor}.\n\n{comissao_frase}', 'Abrir área comercial', 13),
    E('offer', 'Condição especial para {curso}', '{primeiro_nome}, separei uma condição para você', '**{curso}** por **{valor_oferta}** (de {valor}).\n\nA condição vale até {validade} e é só sua.\n\n{vendedor}', 'Garantir com desconto', 14),
    E('launch', 'Estreou: {curso}', '{primeiro_nome}, chegou a hora.', 'Você pediu para ser avisado e o dia chegou: **{curso}** acabou de estrear na {marca}.\n\nOs episódios já estão no ar, esperando por você.', 'Ver o curso', 15),
    W('student', 'wa_access', 'Dados de acesso', 'Oi, {primeiro_nome}! Aqui é da {marca}. Seu acesso está liberado.\n\nEntre por aqui: {link_acesso}\nSeu login é o e-mail {email}. {instrucao_senha}\n\nQualquer dúvida, é só responder esta mensagem.', 1),
    W('student', 'wa_inactive', 'Faz tempo que não acessa', 'Oi, {primeiro_nome}! Tudo certo? Faz {dias_sem_acessar} dias que você não entra na {marca}.\n\nVocê parou em {episodio_atual}, de {curso_atual} ({progresso} concluído). Que tal 10 minutos hoje?\n\n{link_app}', 2),
    W('student', 'wa_welcome', 'Boas-vindas', 'Oi, {primeiro_nome}! Seja bem-vindo à {marca}. Seu acesso a {cursos} já está liberado: {link_acesso}\n\nSe travar em qualquer coisa, me chama aqui.', 3),
    W('student', 'wa_invite_aff', 'Convite para afiliação', 'Oi, {primeiro_nome}! Você já conhece os nossos cursos por dentro. Quer ganhar comissão indicando para os amigos? O cadastro de afiliado leva um minuto: {link_afiliacao}', 4),
    W('affiliate', 'wa_aff_month', 'Resultado do mês', 'Oi, {primeiro_nome}! Seu resumo de {mes}:\n\nVendas: {vendas_mes}\nValor vendido: {valor_vendido_mes}\nComissão do mês: {comissao_mes}\nDisponível para receber: {comissao_disponivel}\nEm garantia: {comissao_a_liberar}\n\nSeu painel: {link_painel}', 1),
    W('affiliate', 'wa_aff_payout', 'Comissão disponível', 'Oi, {primeiro_nome}! Você tem {comissao_disponivel} liberado para receber. Vou pagar na chave Pix {chave_pix}. Confere se está certa?', 2),
    W('affiliate', 'wa_aff_push', 'Incentivo do ranking', 'Oi, {primeiro_nome}! Você está em {ranking_posicao} no ranking de {mes}, com {vendas_mes} vendas. Bora buscar o topo? Seu link: {link_principal}', 3),
    W('lead', 'wa_lead_cart', 'Pagamento não concluído', 'Oi, {primeiro_nome}! Aqui é {vendedor}, da {marca}. Vi que você começou a garantir {curso} e o pagamento não foi concluído. Ficou alguma dúvida? Posso te ajudar a finalizar.', 1),
    W('lead', 'wa_lead_offer', 'Condição especial', 'Oi, {primeiro_nome}! Consegui uma condição especial para você: {curso} por {valor_oferta} (de {valor}). Vale até {validade}.\n\nGaranta por aqui: {link_oferta}', 2),
    W('lead', 'wa_lead_upsell', 'Próximo curso', 'Oi, {primeiro_nome}! Parabéns por concluir {curso_concluido}. O próximo passo natural é {curso}. Quer que eu te conte como funciona?', 3),
    W('lead', 'wa_lead_inactive', 'Reativação', 'Oi, {primeiro_nome}! Senti sua falta na {marca}. Você parou em {episodio_atual}. Tem alguma coisa travando? Posso te ajudar a retomar.', 4),
    W('lead', 'wa_lead_waitlist', 'Estreia (lista de espera)', 'Oi, {primeiro_nome}! Aqui é {vendedor}, da {marca}. Você pediu para ser avisado quando {curso} estreasse, e estreou. Dá uma olhada: {link_curso}\n\nSe quiser, te passo a condição de estreia.', 5),
    W('order', 'wa_order_recovery', 'Recuperar pagamento', 'Oi, {primeiro_nome}! Vi que você tentou garantir {curso} e o pagamento não foi concluído. Deixei um link para você finalizar em 1 minuto: {link_recuperacao}', 1),
    W('order', 'wa_order_access', 'Acesso da compra', 'Oi, {primeiro_nome}! Obrigado por garantir {curso}. Seu acesso: {link_acesso}\n\nQualquer dúvida, é só chamar.', 2)
  ];
  var CARD_MSG = {
    cc_rejected_insufficient_amount: 'Saldo ou limite insuficiente. Tente outro cartão ou pague com Pix.',
    cc_rejected_bad_filled_security_code: 'Código de segurança inválido. Confira e tente de novo.',
    cc_rejected_bad_filled_date: 'Data de validade inválida. Confira e tente de novo.',
    cc_rejected_bad_filled_card_number: 'Número do cartão inválido. Confira e tente de novo.',
    cc_rejected_bad_filled_other: 'Algum dado do cartão está incorreto. Confira e tente de novo.',
    cc_rejected_call_for_authorize: 'O banco pediu autorização. Ligue para o seu banco, libere a compra e tente de novo.',
    cc_rejected_card_disabled: 'Este cartão está desabilitado. Ative com o banco ou use outro cartão.',
    cc_rejected_duplicated_payment: 'Você já fez um pagamento igual há pouco. Se precisa pagar de novo, use outro cartão ou o Pix.',
    cc_rejected_high_risk: 'O pagamento foi recusado por segurança. Tente o Pix ou outro cartão.',
    cc_rejected_max_attempts: 'Você atingiu o limite de tentativas. Use outro cartão ou o Pix.',
    cc_rejected_3ds_challenge: 'A confirmação do banco não foi concluída. Tente de novo.',
    cc_rejected_card_error: 'Não deu para processar o cartão. Tente de novo ou use o Pix.',
    pending_contingency: 'Estamos processando o pagamento. A confirmação chega no seu e-mail em até 2 dias úteis.',
    pending_review_manual: 'O pagamento está em análise. A confirmação chega no seu e-mail em até 2 dias úteis.'
  };

  /* =================================================================== */
  function factory(env) {
    var memo = {};
    var cfgCache = null;

    /* ---------- utilidades ---------- */
    function now() { return env.now(); }
    function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
    function J(s, def) { if (s && typeof s === 'object') return s; try { return s ? JSON.parse(s) : def; } catch (e) { return def; } }
    function trim(s) { return String(s == null ? '' : s).trim(); }
    function lines(s) { return String(s || '').split(/\r?\n/).map(trim).filter(Boolean); }
    function digits(s) { return String(s || '').replace(/\D/g, ''); }
    function normEmail(e) { return trim(e).toLowerCase(); }
    function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function slugify(s) {
      return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'curso';
    }
    function rand(n, alphabet) {
      alphabet = alphabet || 'abcdefghijkmnpqrstuvwxyz23456789';
      var out = '', pool = '';
      while (out.length < n) {
        if (!pool.length) pool = env.uuid().replace(/-/g, '');
        var byte = parseInt(pool.slice(0, 2), 16); pool = pool.slice(2);
        if (isNaN(byte)) continue;
        out += alphabet[byte % alphabet.length];
      }
      return out;
    }
    function err(msg, code, data) { var e = new Error(msg); e.code = code || 'VALIDATION'; e.isPublic = true; e.data = data; return e; }
    function need(cond, msg, code) { if (!cond) throw err(msg, code); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function br(ts) { return new Date(Number(ts) - 3 * 3600e3); } // Brasil (-03:00, sem horário de verão)
    function dayKey(ts) { return br(ts).toISOString().slice(0, 10); }
    function fmtDate(ts) { var d = br(ts); return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(); }
    function fmtDateTime(ts) { var d = br(ts); return fmtDate(ts) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
    var MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    function dayLabel(key) { var p = key.split('-'); return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1]; }
    function money(v) {
      v = round2(v); var neg = v < 0; v = Math.abs(v);
      var s = v.toFixed(2).split('.'); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (neg ? '-' : '') + 'R$ ' + s[0] + ',' + s[1];
    }
    function pl(n, one, many) { return n + ' ' + (Number(n) === 1 ? one : many); }
    function firstName(n) { return trim(n).split(/\s+/)[0] || ''; }
    function maskName(n) { var p = trim(n).split(/\s+/); return p[0] + (p.length > 1 ? ' ' + p[p.length - 1][0] + '.' : ''); }
    function maskEmail(e) { var p = String(e || '').split('@'); return p.length < 2 ? e : p[0].slice(0, 2) + '***@' + p[1]; }
    function byOrder(a, b) { return (a.order - b.order) || (a.created_at - b.created_at); }
    function clamp(n, a, b) { n = Number(n); if (isNaN(n)) n = a; return Math.max(a, Math.min(b, n)); }
    function safe(fn, where) { try { return fn(); } catch (e) { env.log('error', where || 'safe', String(e && e.message || e), {}); return null; } }

    /* ---------- configuração ---------- */
    function cfg() {
      if (cfgCache) return cfgCache;
      var raw = env.config() || {}, out = {};
      Object.keys(DEFAULT_CONFIG).forEach(function (k) {
        var d = DEFAULT_CONFIG[k], v = raw[k];
        if (v === undefined || v === null || v === '') { out[k] = d; return; }
        if (typeof d === 'number') { var n = Number(String(v).replace(',', '.')); out[k] = isNaN(n) ? d : n; }
        else if (typeof d === 'boolean') out[k] = v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1' || v === 'sim';
        else out[k] = String(v);
      });
      cfgCache = out;
      return out;
    }
    function siteUrl() {
      var s = cfg().site_url || (env.siteUrl ? env.siteUrl() : '');
      return s ? s.replace(/\/?$/, '/') : '';
    }
    function apiUrl() { return cfg().api_url || (env.apiUrl ? env.apiUrl() : ''); }
    function webhookUrl() { var a = apiUrl(); return a ? a + (a.indexOf('?') > -1 ? '&' : '?') + 'hook=mp' : ''; }

    /* ---------- tabelas ---------- */
    function T(name) {
      var cols = SCHEMA[name];
      var has = {}; cols.forEach(function (c) { has[c] = 1; });
      function norm(r) {
        var o = {};
        for (var i = 0; i < cols.length; i++) {
          var k = cols[i], v = r[k];
          if (NUM[k]) { v = (v === '' || v == null) ? 0 : (v instanceof Date ? v.getTime() : Number(v)); if (isNaN(v)) v = 0; }
          else if (BOOL[k]) v = v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1';
          else v = v == null ? '' : (v instanceof Date ? String(v.getTime()) : String(v));
          o[k] = v;
        }
        return o;
      }
      function clean(o) {
        var out = {};
        cols.forEach(function (k) {
          var v = o[k];
          if (NUM[k]) out[k] = (v === '' || v == null || isNaN(Number(v))) ? 0 : Number(v);
          else if (BOOL[k]) out[k] = v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1';
          else out[k] = v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
        });
        return out;
      }
      function invalidate() { delete memo[name]; if (name === 'Courses' || name === 'Seasons' || name === 'Lessons') { delete memo.__idx; safe(function () { if (env.cache) env.cache.put('catver', String(now()), 21600); }); } }
      var api = {
        all: function () { if (!memo[name]) memo[name] = env.db.rows(name).map(norm); return memo[name].map(function (r) { return Object.assign({}, r); }); },
        where: function (fn) { return api.all().filter(fn); },
        find: function (fn) { var a = api.all(); for (var i = 0; i < a.length; i++) if (fn(a[i])) return a[i]; return null; },
        get: function (id) { if (!id) return null; id = String(id); return api.find(function (r) { return r.id === id; }); },
        insert: function (o) {
          var r = Object.assign({}, o);
          if (has.id && !r.id) r.id = ID_PREFIX[name] + '_' + rand(name === 'Orders' || name === 'Users' ? 16 : 12);
          if (has.created_at && !r.created_at) r.created_at = now();
          if (has.updated_at) r.updated_at = now();
          if (has.ts && !r.ts) r.ts = now();
          r = clean(r);
          env.db.insert(name, r);
          invalidate();
          return norm(r);
        },
        // várias linhas de uma vez (na planilha vira uma única escrita)
        insertMany: function (list) {
          var out = (list || []).map(function (o) {
            var r = Object.assign({}, o);
            if (has.id && !r.id) r.id = ID_PREFIX[name] + '_' + rand(12);
            if (has.created_at && !r.created_at) r.created_at = now();
            if (has.updated_at) r.updated_at = now();
            return clean(r);
          });
          if (!out.length) return [];
          if (env.db.insertMany) env.db.insertMany(name, out); else out.forEach(function (r) { env.db.insert(name, r); });
          invalidate();
          return out.map(norm);
        },
        update: function (id, patch) {
          var cur = api.get(id); if (!cur) return null;
          var r = Object.assign(cur, patch);
          if (has.updated_at) r.updated_at = now();
          r = clean(r);
          env.db.update(name, String(id), r);
          invalidate();
          return norm(r);
        },
        remove: function (id) { env.db.remove(name, String(id)); invalidate(); }
      };
      return api;
    }

    /* ---------- índice do catálogo ---------- */
    function idx() {
      if (memo.__idx) return memo.__idx;
      var courses = T('Courses').all(), seasons = T('Seasons').all().sort(byOrder), lessons = T('Lessons').all().sort(byOrder);
      var I = { courses: courses, byId: {}, bySlug: {}, seasonsOf: {}, lessonsOf: {}, seasonById: {}, lessonById: {}, seq: {} };
      courses.forEach(function (c) { I.byId[c.id] = c; I.bySlug[c.slug] = c; I.seasonsOf[c.id] = []; I.seq[c.id] = []; });
      seasons.forEach(function (s) { I.seasonById[s.id] = s; I.lessonsOf[s.id] = []; if (I.seasonsOf[s.course_id]) I.seasonsOf[s.course_id].push(s); });
      lessons.forEach(function (l) { if (I.lessonsOf[l.season_id]) { I.lessonsOf[l.season_id].push(l); I.lessonById[l.id] = l; } });
      courses.forEach(function (c) {
        I.seasonsOf[c.id].forEach(function (s, si) {
          I.lessonsOf[s.id].forEach(function (l, li) { l.label = 'T' + (si + 1) + ':E' + (li + 1); l.season_n = si + 1; l.ep = li + 1; I.seq[c.id].push(l); });
        });
      });
      memo.__idx = I;
      return I;
    }
    function statsOf(c, I) {
      var seq = I.seq[c.id] || [], min = 0;
      seq.forEach(function (l) { min += l.duration_min || 0; });
      return { seasons: (I.seasonsOf[c.id] || []).length, lessons: seq.length, minutes: min };
    }
    function parseBonuses(t) {
      return lines(t).map(function (ln) {
        var p = ln.split('|').map(trim);
        return { title: p[0] || '', text: p[1] || '', value: p[2] ? Number(String(p[2]).replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')) || 0 : 0 };
      }).filter(function (b) { return b.title; });
    }
    function splitList(s) { return String(s || '').split(',').map(trim).filter(Boolean); }

    // visão pública do curso (sem links de vídeo nem materiais)
    function coursePub(c, I, opt) {
      opt = opt || {};
      var o = {
        id: c.id, slug: c.slug, status: c.status, title: c.title, subtitle: c.subtitle, category: c.category,
        tags: splitList(c.tags), level: c.level, short_desc: c.short_desc, description: c.description,
        banner: c.banner, poster: c.poster, logo: c.logo, show_title: c.show_title, trailer: c.trailer,
        color: c.color === '' ? '' : Number(c.color),
        instructor: { name: c.instructor_name, bio: c.instructor_bio, photo: c.instructor_photo },
        price: c.price, anchor_price: c.anchor_price, max_installments: c.max_installments || cfg().max_installments,
        methods: splitList(c.methods || 'pix,card'), checkout_url: c.checkout_url, guarantee_days: c.guarantee_days,
        access_days: c.access_days, featured: c.featured, order: c.order, created_at: c.created_at, updated_at: c.updated_at,
        scarcity_until: c.scarcity_until, support_url: c.support_url,
        aff_enabled: c.aff_enabled, aff_commission: c.aff_commission,
        stats: statsOf(c, I), bump: bumpOf(c, I)
      };
      if (opt.marketing) {
        o.promise = c.promise; o.audience = lines(c.audience); o.pains = lines(c.pains); o.benefits = lines(c.benefits);
        o.bonuses = parseBonuses(c.bonuses); o.faq = J(c.faq, []); o.testimonials = J(c.testimonials, []); o.cta_text = c.cta_text;
      }
      if (opt.seasons !== false) {
        o.seasons = (I.seasonsOf[c.id] || []).map(function (s, si) {
          return {
            id: s.id, n: si + 1, title: s.title, description: s.description, order: s.order,
            release_mode: s.release_mode || 'now', release_days: s.release_days, release_at: s.release_at,
            lessons: (I.lessonsOf[s.id] || []).map(function (l) {
              return { id: l.id, title: l.title, description: l.description, duration_min: l.duration_min, free_preview: l.free_preview, order: l.order, thumb: l.thumb, label: l.label, created_at: l.created_at };
            })
          };
        });
      }
      return o;
    }

    /* ---------- usuários, senhas e sessão ---------- */
    function pepper() {
      var s = env.secret('TOKEN_SECRET');
      if (!s) { s = rand(48); env.setSecret('TOKEN_SECRET', s); }
      return s;
    }
    function hashPw(pw, salt) {
      var h = env.sha256(salt + '::' + pw + '::' + pepper());
      for (var i = 0; i < 120; i++) h = env.sha256(h + ':' + salt);
      return h;
    }
    function tokenKey(u) { return String(u.pass_hash || u.salt || '').slice(0, 10); }
    function makeToken(u, days) {
      var b = env.b64enc(JSON.stringify({ u: u.id, k: tokenKey(u), e: now() + (days || 30) * DAY }));
      return b + '.' + env.hmac(b, pepper()).slice(0, 40);
    }
    function readToken(t) {
      if (!t) return null;
      var p = String(t).split('.');
      if (p.length !== 2 || env.hmac(p[0], pepper()).slice(0, 40) !== p[1]) return null;
      var o = J(env.b64dec(p[0]), null);
      if (!o || !o.e || o.e < now()) return null;
      return o;
    }
    function hasRole(u, r) { return (',' + (u.roles || '') + ',').indexOf(',' + r + ',') > -1; }
    function withRole(u, r) { return hasRole(u, r) ? u.roles : (u.roles ? u.roles + ',' + r : r); }
    function userFromToken(t) {
      var p = readToken(t); if (!p) return null;
      var u = T('Users').get(p.u);
      if (!u || u.status === 'blocked' || tokenKey(u) !== p.k) return null;
      return u;
    }
    function auth(req, role) {
      var u = userFromToken(req.token);
      if (!u) throw err('Sua sessão expirou. Entre de novo.', 'AUTH');
      if (role && !hasRole(u, role)) throw err(role === 'admin' ? 'Esta área é só para administradores.' : role === 'affiliate' ? 'Esta conta ainda não participa do programa de afiliados.' : 'Você não tem permissão para isso.', role === 'affiliate' ? 'NOT_AFFILIATE' : 'FORBIDDEN');
      if (now() - (u.last_seen || 0) > 10 * 60000) { safe(function () { T('Users').update(u.id, { last_seen: now() }); }); u.last_seen = now(); }
      return u;
    }
    function xpFor(level) { var n = level - 1; return 60 * n * n + 40 * n; }
    function levelOf(xp) { var L = 1; while (L < 99 && xpFor(L + 1) <= xp) L++; return L; }
    function rankOf(level) { var r = RANKS[0].name; RANKS.forEach(function (x) { if (level >= x.min) r = x.name; }); return r; }
    function list(u) { return splitList(u.my_list); }
    function badgesOf(u) { return splitList(u.badges); }
    function publicUser(u) {
      var lv = levelOf(u.xp || 0);
      return {
        id: u.id, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar, avatar_color: u.avatar_color === '' ? '' : Number(u.avatar_color),
        roles: splitList(u.roles), status: u.status, xp: u.xp || 0, level: lv, rank: rankOf(lv),
        level_floor: xpFor(lv), next_xp: xpFor(lv + 1), streak: u.streak || 0, streak_day: u.streak_day,
        badges: badgesOf(u), my_list: list(u), aff_code: u.aff_code, pix_key: u.pix_key, instagram: u.instagram,
        created_at: u.created_at, has_password: !!u.pass_hash
      };
    }
    function findUserByEmail(email) { email = normEmail(email); return T('Users').find(function (u) { return u.email === email; }); }
    function uniqueAffCode(name) {
      var base = slugify(firstName(name)).replace(/-/g, '').toUpperCase().slice(0, 6) || 'AFI';
      var code = base, i = 0;
      while (T('Users').find(function (u) { return u.aff_code === code; })) { i++; code = base + (i < 10 ? rand(2, '0123456789') : rand(3, '0123456789')); }
      return code;
    }
    function rateLimit(key, max, sec) {
      if (!env.cache) return;
      var n = Number(env.cache.get(key) || 0);
      if (n >= max) throw err('Muitas tentativas. Espere alguns minutos e tente de novo.', 'RATE');
      env.cache.put(key, String(n + 1), sec);
    }

    /* ---------- matrículas e progresso ---------- */
    function activeEnrollment(e) { return e && e.status === 'active' && (!e.expires_at || e.expires_at > now()); }
    function enrollMap(userId) {
      var m = {};
      T('Enrollments').where(function (e) { return e.user_id === userId; }).forEach(function (e) { if (activeEnrollment(e)) m[e.course_id] = e; });
      return m;
    }
    function owns(userId, courseId) { var m = enrollMap(userId); return m[courseId] || null; }
    function seasonOpensAt(s, en) {
      if (!en) return 0;
      if (s.release_mode === 'days' && s.release_days > 0) return en.created_at + s.release_days * DAY;
      if (s.release_mode === 'date' && s.release_at) return s.release_at;
      return 0;
    }
    function progressRows(userId) { return T('Progress').where(function (p) { return p.user_id === userId; }); }
    function courseProgress(c, I, rows) {
      var seq = I.seq[c.id] || [], done = {}, last = null, total = seq.length, n = 0;
      rows.forEach(function (p) {
        if (p.course_id !== c.id) return;
        if (p.status === 'done') done[p.lesson_id] = 1;
        if (!last || p.updated_at > last.updated_at) last = p;
      });
      seq.forEach(function (l) { if (done[l.id]) n++; });
      var nextL = null;
      if (last) {
        var li = -1; seq.forEach(function (l, i) { if (l.id === last.lesson_id) li = i; });
        if (li > -1 && !done[seq[li].id]) nextL = seq[li];
        else for (var i = li + 1; i < seq.length; i++) { if (!done[seq[i].id]) { nextL = seq[i]; break; } }
      }
      if (!nextL) for (var j = 0; j < seq.length; j++) { if (!done[seq[j].id]) { nextL = seq[j]; break; } }
      var lastLesson = last ? I.lessonById[last.lesson_id] : null;
      return {
        done: n, total: total, pct: total ? Math.round(n / total * 100) : 0,
        last_at: last ? last.updated_at : 0, last_lesson_id: last ? last.lesson_id : '',
        next_lesson_id: nextL ? nextL.id : (seq[0] ? seq[0].id : ''), next_label: nextL ? nextL.label : '', next_title: nextL ? nextL.title : '',
        last_position: last && lastLesson && !done[last.lesson_id] ? last.position : 0,
        last_pct: last && lastLesson && lastLesson.duration_min && !done[last.lesson_id] ? Math.min(100, Math.round(last.position / (lastLesson.duration_min * 60) * 100)) : 0
      };
    }
    function grant(user, course, source, orderId, days) {
      var exp = days ? now() + days * DAY : (course.access_days ? now() + course.access_days * DAY : 0);
      var e = T('Enrollments').find(function (x) { return x.user_id === user.id && x.course_id === course.id; });
      if (e) return T('Enrollments').update(e.id, { status: 'active', expires_at: exp, order_id: orderId || e.order_id, source: source || e.source });
      return T('Enrollments').insert({ user_id: user.id, course_id: course.id, expires_at: exp, source: source || 'manual', order_id: orderId || '', status: 'active' });
    }
    function certificateFor(u, c, I) {
      var cert = T('Certificates').find(function (x) { return x.user_id === u.id && x.course_id === c.id; });
      if (cert) return cert;
      var st = statsOf(c, I);
      return T('Certificates').insert({ code: rand(8, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), user_id: u.id, course_id: c.id, name: u.name, course_title: c.title, hours: Math.max(1, Math.round(st.minutes / 60 * 10) / 10) });
    }

    /* ---------- runas (conquistas) ---------- */
    function evalBadges(u, ctx) {
      var have = {}; badgesOf(u).forEach(function (b) { have[b] = 1; });
      var rows = ctx.rows || progressRows(u.id), doneRows = rows.filter(function (p) { return p.status === 'done'; });
      var today = dayKey(now()), fresh = [];
      var certs = T('Certificates').where(function (x) { return x.user_id === u.id; }).length;
      var ens = Object.keys(enrollMap(u.id));
      var purchased = T('Enrollments').where(function (e) { return e.user_id === u.id && e.source === 'purchase'; }).length;
      var rules = {
        'primeiro-passo': doneRows.length >= 1,
        'investidor': purchased >= 1,
        'maratona': doneRows.filter(function (p) { return dayKey(p.completed_at) === today; }).length >= 5,
        'coruja': !!ctx.justCompleted && br(now()).getUTCHours() < 5,
        'chama': (ctx.streak || u.streak || 0) >= 7,
        'escriba': rows.filter(function (p) { return trim(p.note); }).length >= 5,
        'conquista': certs >= 1,
        'veterano': doneRows.length >= 50,
        'colheita': certs >= 3,
        'colecionador': ens.length >= 3
      };
      BADGES.forEach(function (b) { if (rules[b.id] && !have[b.id]) { fresh.push(b.id); have[b.id] = 1; } });
      return { all: Object.keys(have), fresh: fresh };
    }
    function badgeObjs(ids) { return BADGES.filter(function (b) { return ids.indexOf(b.id) > -1; }); }

    /* ---------- e-mails ---------- */
    function mailLayout(title, body, cta) {
      var c = cfg(), brand = esc(c.brand_name);
      return '<div style="background:#100b07;padding:32px 14px;font-family:Arial,Helvetica,sans-serif;color:#f0e6d2">' +
        '<div style="max-width:540px;margin:0 auto;background:#18110b;border:1px solid #3a2817;border-radius:8px;padding:28px 26px">' +
        '<div style="font-family:Impact,\'Arial Narrow\',Arial,sans-serif;font-size:30px;letter-spacing:4px;color:#e2a72e">' + brand + '</div>' +
        '<h1 style="font-size:22px;line-height:1.25;color:#f0e6d2;margin:22px 0 12px;font-weight:bold">' + esc(title) + '</h1>' +
        '<div style="font-size:15px;line-height:1.65;color:#d9ccb4">' + body + '</div>' +
        (cta ? '<p style="margin:26px 0 10px"><a href="' + esc(cta.url) + '" style="display:inline-block;background:#e2a72e;color:#1a1206;padding:14px 24px;text-decoration:none;font-weight:bold;letter-spacing:1px;border-radius:3px;text-transform:uppercase;font-size:14px">' + esc(cta.label) + '</a></p>' +
          '<p style="font-size:12px;color:#84725c;word-break:break-all">Se o botão não abrir, copie este endereço: ' + esc(cta.url) + '</p>' : '') +
        '</div><p style="text-align:center;font-size:12px;color:#84725c;margin-top:16px">' + brand +
        (c.support_whatsapp ? ' · WhatsApp ' + esc(c.support_whatsapp) : '') + (c.support_email ? ' · ' + esc(c.support_email) : '') + '</p></div>';
    }
    function send(to, subject, html, meta) {
      if (!to) return false;
      meta = meta || {};
      var status = 'sent', error = '';
      try { env.mail(to, subject, html); }
      catch (e) { status = 'failed'; error = String((e && e.message) || e).slice(0, 300); env.log('error', 'email', error, { to: to, key: meta.key || '' }); }
      safe(function () { T('Emails').insert({ to: to, user_id: meta.user_id || '', key: meta.key || '', subject: String(subject).slice(0, 200), status: status, error: error }); }, 'email-log');
      return status === 'sent';
    }
    function codeHtml(code) { return '<div style="font-size:34px;letter-spacing:10px;color:#e2a72e;font-weight:bold;margin:6px 0">' + esc(code) + '</div>'; }
    function cardMode() { var c = cfg(); return c.mp_public_key && c.card_mode !== 'redirect' ? 'transparent' : 'redirect'; }
    function adminEmail() {
      var c = cfg(); if (c.admin_email) return c.admin_email;
      var a = T('Users').find(function (u) { return hasRole(u, 'admin'); });
      return a ? a.email : '';
    }
    function sendWelcome(u, course, order) {
      var site = siteUrl(), first = !u.pass_hash;
      if (first && !u.first_token) u = T('Users').update(u.id, { first_token: rand(32) });
      var url = first ? site + 'index.html?primeiro=' + u.first_token : site + 'index.html#/curso/' + course.slug;
      var items = [course.title];
      if (order && order.bump_title) items.push(order.bump_title);
      sendTpl('welcome', u.email, {
        nome: u.name, primeiro_nome: firstName(u.name), email: u.email, curso: course.title,
        itens: items.map(function (t) { return '**' + t + '**'; }).join('\n'),
        instrucao_acesso: first ? 'No primeiro acesso você cria a sua senha. Leva menos de um minuto.' : 'Entre com o seu e-mail e a senha de sempre.',
        cta_acesso: first ? 'Criar senha e assistir' : 'Assistir agora'
      }, url, u.id);
    }

    /* ---------- landing page: modelo e IA ---------- */
    function lpTemplate(c, I) {
      var st = statsOf(c, I), brand = cfg().brand_name;
      var pains = lines(c.pains), benefits = lines(c.benefits), aud = lines(c.audience), bon = parseBonuses(c.bonuses), faq = J(c.faq, []);
      var promise = trim(c.promise) || trim(c.subtitle) || c.title;
      var hours = Math.max(1, Math.round(st.minutes / 60));
      var access = c.access_days ? 'Acesso por ' + pl(c.access_days, 'dia', 'dias') : 'Acesso vitalício';
      var pillars = (benefits.length ? benefits : [promise]).slice(0, 3).map(function (b) {
        var p = b.split(/[:—–-]\s+/);
        return p.length > 1 ? { title: p[0].slice(0, 40), text: p.slice(1).join(' ') } : { title: b.split(/\s+/).slice(0, 4).join(' '), text: b };
      });
      return {
        seo: { title: (c.seo_title || c.title + ' | ' + brand).slice(0, 70), description: (c.seo_desc || c.short_desc || promise).slice(0, 160) },
        hero: {
          kicker: c.category || 'Curso online', headline: promise,
          subheadline: c.short_desc || c.subtitle || '',
          cta: c.cta_text || 'Quero começar agora',
          note: (c.guarantee_days ? c.guarantee_days + ' dias de garantia · ' : '') + access
        },
        pain: { title: 'Se você chegou até aqui, talvez seja porque…', items: pains.length ? pains : ['Você já consumiu muito conteúdo solto e continua sem um caminho claro.', 'Sabe que precisa agir, mas não sabe por onde começar.', 'Quer resultado prático, sem enrolação e sem teoria vazia.'] },
        promise: { title: 'O que muda depois de ' + c.title, text: lines(c.description).slice(0, 2).join(' ') || promise, pillars: pillars },
        modules: { title: 'O que você vai assistir', intro: pl(st.seasons, 'temporada', 'temporadas') + ', ' + pl(st.lessons, 'aula', 'aulas') + ' e cerca de ' + hours + 'h de conteúdo direto ao ponto.' },
        audience: {
          title: 'Para quem é',
          for: aud.length ? aud : ['Quem quer aplicar no mesmo dia o que aprendeu.', 'Quem prefere método a motivação.', 'Quem está disposto a fazer a sua parte.'],
          not_for: ['Quem procura fórmula mágica ou resultado sem esforço.', 'Quem não vai assistir às aulas.']
        },
        instructor: { title: c.instructor_name ? 'Quem conduz: ' + c.instructor_name : 'Quem conduz', text: c.instructor_bio || '' },
        bonuses: { title: bon.length ? 'Bônus inclusos' : '', items: bon },
        offer: {
          title: 'Tudo o que você leva',
          bullets: [pl(st.lessons, 'aula', 'aulas') + ' em ' + pl(st.seasons, 'temporada', 'temporadas'), access + ', no celular ou no computador', 'Certificado de conclusão', 'Atualizações do curso sem custo extra']
            .concat(bon.map(function (b) { return 'Bônus: ' + b.title; })),
          cta: c.cta_text || 'Garantir minha vaga',
          urgency: c.scarcity_until && c.scarcity_until > now() ? 'Condição especial válida até ' + fmtDate(c.scarcity_until) + '.' : ''
        },
        guarantee: { title: (c.guarantee_days || 7) + ' dias de garantia', text: 'Entre, assista e aplique. Se em até ' + (c.guarantee_days || 7) + ' dias você sentir que não é para você, devolvemos 100% do valor, sem perguntas.' },
        faq: faq.length ? faq : [
          { q: 'Como recebo o acesso?', a: 'Assim que o pagamento é confirmado, você recebe um e-mail para criar sua senha e já pode assistir.' },
          { q: 'Por quanto tempo posso assistir?', a: access + '. Você assiste no seu ritmo, quantas vezes quiser.' },
          { q: 'Quais as formas de pagamento?', a: 'Pix com liberação na hora ou cartão de crédito em até ' + (c.max_installments || cfg().max_installments) + 'x.' },
          { q: 'E se eu não gostar?', a: 'Você tem ' + (c.guarantee_days || 7) + ' dias de garantia. Pediu, devolvemos.' }
        ],
        final_cta: { title: 'Sua próxima temporada começa agora', text: promise, cta: c.cta_text || 'Quero entrar agora' },
        meta: { source: 'template', generated_at: now() }
      };
    }
    var LP_SECTIONS = ['seo', 'hero', 'pain', 'promise', 'modules', 'audience', 'instructor', 'bonuses', 'offer', 'guarantee', 'faq', 'final_cta'];
    var LP_SHAPE = {
      seo: '{"title":"até 60 caracteres","description":"até 155 caracteres"}',
      hero: '{"kicker":"2 a 4 palavras","headline":"promessa específica, até 70 caracteres","subheadline":"até 170 caracteres","cta":"verbo de ação, até 26 caracteres","note":"até 70 caracteres, reduz o risco (garantia, acesso)"}',
      pain: '{"title":"até 60 caracteres","items":["4 ou 5 dores reais do público, até 110 caracteres cada"]}',
      promise: '{"title":"até 60 caracteres","text":"2 a 3 frases","pillars":[{"title":"até 32 caracteres","text":"até 120 caracteres"}]}',
      modules: '{"title":"até 50 caracteres","intro":"1 frase sobre o conteúdo e o formato"}',
      audience: '{"title":"até 40 caracteres","for":["4 itens"],"not_for":["2 ou 3 itens"]}',
      instructor: '{"title":"até 50 caracteres","text":"2 a 3 frases usando só a bio fornecida; vazio se não houver bio"}',
      bonuses: '{"title":"vazio se não houver bônus","items":[{"title":"","text":"","value":0}]}',
      offer: '{"title":"até 50 caracteres","bullets":["5 a 7 entregáveis concretos"],"cta":"até 26 caracteres","urgency":"vazio se não houver prazo"}',
      guarantee: '{"title":"até 40 caracteres","text":"2 frases"}',
      faq: '[{"q":"pergunta real de quem está em dúvida","a":"resposta curta e honesta"}] (5 a 7 itens)',
      final_cta: '{"title":"até 60 caracteres","text":"1 a 2 frases","cta":"até 26 caracteres"}'
    };
    function aiSystem() {
      var c = cfg();
      return 'Você é copywriter sênior de páginas de vendas de cursos online no Brasil. Escreve para a marca "' + c.brand_name + '": voz direta, intensa e humana, com estética sombria e terrosa. ' +
        'Português do Brasil, frases curtas e concretas, falando com uma pessoa (você). ' +
        'Proibido: clichês como "revolucionário", "transforme sua vida", "incrível", "jornada transformadora", "desbloqueie seu potencial", "nível", "segredo"; emojis; promessas de renda. ' +
        'Nunca invente números, depoimentos, prêmios, alunos ou resultados que não estejam nos dados. ' +
        'Estrutura de persuasão: dor real, promessa específica, mecanismo (o conteúdo), oferta, garantia, objeções e chamada final. ' +
        'Responda SOMENTE com um objeto JSON válido, sem markdown e sem texto fora do JSON.';
    }
    function aiPayload(c, I) {
      var st = statsOf(c, I);
      return {
        curso: c.title, subtitulo: c.subtitle, categoria: c.category, nivel: c.level, resumo: c.short_desc, descricao: c.description,
        promessa: c.promise, publico: lines(c.audience), dores: lines(c.pains), beneficios: lines(c.benefits), bonus: parseBonuses(c.bonuses),
        faq_existente: J(c.faq, []), depoimentos: J(c.testimonials, []), instrutor: { nome: c.instructor_name, bio: c.instructor_bio },
        preco: c.price, preco_ancora: c.anchor_price, parcelas: c.max_installments || cfg().max_installments, garantia_dias: c.guarantee_days,
        acesso: c.access_days ? pl(c.access_days, 'dia', 'dias') : 'vitalício', certificado: true, prazo_oferta: c.scarcity_until ? fmtDate(c.scarcity_until) : '',
        conteudo: (I.seasonsOf[c.id] || []).map(function (s) { return { temporada: s.title, aulas: (I.lessonsOf[s.id] || []).map(function (l) { return l.title; }) }; }),
        totais: { temporadas: st.seasons, aulas: st.lessons, horas: Math.max(1, Math.round(st.minutes / 60)) }
      };
    }
    function extractJSON(txt) {
      txt = String(txt || '').replace(/^```(?:json)?/i, '').replace(/```\s*$/, '');
      var a = txt.indexOf('{'), b = txt.lastIndexOf('}');
      if (a < 0 || b < a) throw new Error('A IA não devolveu JSON.');
      return JSON.parse(txt.slice(a, b + 1));
    }
    function aiCall(c, I, keys, instructions) {
      var shape = '{' + keys.map(function (k) { return '"' + k + '":' + LP_SHAPE[k]; }).join(',') + '}';
      var user = 'Dados do curso (JSON):\n' + JSON.stringify(aiPayload(c, I)) +
        '\n\nEscreva as seções abaixo da página de vendas. Formato exato da resposta:\n' + shape +
        (instructions ? '\n\nInstruções extras do produtor: ' + String(instructions).slice(0, 800) : '');
      return extractJSON(env.ai(aiSystem(), user, 2600));
    }
    function mergeLP(base, gen) {
      var out = Object.assign({}, base);
      LP_SECTIONS.forEach(function (k) {
        var g = gen[k];
        if (k === 'faq') { if (Array.isArray(g) && g.length) out.faq = g.filter(function (x) { return x && x.q && x.a; }).slice(0, 10); return; }
        if (g && typeof g === 'object' && !Array.isArray(g)) out[k] = Object.assign({}, base[k], g);
      });
      if (out.bonuses && (!out.bonuses.items || !out.bonuses.items.length)) out.bonuses = base.bonuses;
      return out;
    }

    /* ---------- anúncios: 10 criativos por curso (modelo e IA) ----------
       Cada anúncio é texto puro. A arte 1080x1920 é desenhada no navegador
       (assets/js/ads.js) e preço, parcelas, garantia e números do curso
       entram na hora do desenho, para nunca ficarem desatualizados. */
    var AD_MAX = { kicker: 28, hook: 96, sub: 150, cta: 22, primary: 700, headline: 40, description: 30, author: 40 };
    var AD_LAYOUTS = { statement: 1, pain: 1, list: 1, offer: 1, stats: 1, guarantee: 1, versus: 1, quote: 1 };
    function cutTxt(s, n) { s = trim(s).replace(/\s+/g, ' '); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; }
    function adsTemplate(c, I) {
      var st = statsOf(c, I);
      var pains = lines(c.pains), aud = lines(c.audience), bon = parseBonuses(c.bonuses);
      var bens = lines(c.benefits).map(function (b) { var p = b.split(/:\s+|\s[—–-]\s/); return p.length > 1 ? p[0] : b; });
      var tst = J(c.testimonials, []).filter(function (t) { return t && trim(t.text); });
      var promise = trim(c.promise) || trim(c.subtitle) || c.title;
      var free = !(Number(c.price) > 0), g = c.guarantee_days || 7, parc = c.max_installments || cfg().max_installments;
      var cta = free ? 'Assistir de graça' : 'Quero entrar';
      // curso ainda sem aulas cadastradas: nada de "0 aulas" no anúncio
      var has = st.lessons > 0, aulas = has ? pl(st.lessons, 'aula', 'aulas') : 'aulas curtas', temps = has ? pl(st.seasons, 'temporada', 'temporadas') : 'temporadas';
      var grade = has ? aulas + ' em ' + temps : 'Aulas curtas e práticas', cap = function (t) { return t.charAt(0).toUpperCase() + t.slice(1); };
      var pain1 = pains[0] || 'Você consome conteúdo todo dia e continua sem saber o próximo passo.';
      var pain2 = pains[1] || 'Você já tentou sozinho e parou no meio do caminho.';
      var price = free ? 'Grátis' : (c.anchor_price > c.price ? 'De ' + money(c.anchor_price) + ' por ' : 'Por ') + money(c.price) + (parc > 1 ? ' ou em até ' + parc + 'x' : '') + '.';
      var close = free ? 'Acesso liberado na hora, sem cartão.' : g + ' dias de garantia. Pix libera o acesso na hora.';
      var ads = [];
      function ad(o) { ads.push(Object.assign({ kicker: '', hook: '', sub: '', bullets: [], before: [], cta: cta, author: '', primary: '', headline: cutTxt(c.title, AD_MAX.headline), description: free ? 'Comece de graça' : g + ' dias de garantia' }, o)); }
      ad({ angle: 'promessa', label: 'Promessa', layout: 'statement', kicker: c.category || 'Curso online', hook: promise, sub: cutTxt(c.short_desc || c.subtitle, 140),
        primary: promise + '.\n\n' + (trim(c.short_desc) ? trim(c.short_desc) + '\n\n' : '') + grade + ', para assistir no seu ritmo. ' + close });
      ad({ angle: 'dor', label: 'Dor', layout: 'pain', kicker: 'Isso é com você?', hook: pain1, sub: c.title + ' mostra o caminho em ' + aulas + '.',
        primary: pain1 + '\n\n' + c.title + ' foi feito para esse momento: ' + promise.charAt(0).toLowerCase() + promise.slice(1) + '.\n\n' + close });
      ad({ angle: 'beneficios', label: 'Benefícios', layout: 'list', kicker: 'O que você leva', hook: 'Ao terminar, você vai ter', bullets: (bens.length ? bens : [promise]).slice(0, 4),
        primary: 'O que muda quando você termina ' + c.title + ':\n\n' + (bens.length ? bens : [promise]).slice(0, 4).map(function (b) { return '• ' + b; }).join('\n') + '\n\n' + close });
      ad({ angle: 'oferta', label: 'Oferta', layout: 'offer', kicker: free ? 'Aula aberta' : 'Oferta', hook: c.title, sub: free ? 'Acesso liberado agora, sem cartão.' : 'Pix libera na hora. Cartão em até ' + parc + 'x.', cta: free ? 'Assistir de graça' : 'Garantir acesso',
        primary: c.title + ': ' + promise.charAt(0).toLowerCase() + promise.slice(1) + '.\n\n' + price + '\n' + cap(aulas) + ', certificado e ' + (c.access_days ? 'acesso por ' + pl(c.access_days, 'dia', 'dias') : 'acesso vitalício') + '.\n\n' + close,
        description: free ? 'Grátis' : money(c.price) });
      ad({ angle: 'conteudo', label: 'Conteúdo', layout: has ? 'stats' : 'statement', kicker: 'Por dentro', hook: cap(aulas) + ' para assistir no seu ritmo', sub: (I.seasonsOf[c.id] || []).slice(0, 3).map(function (s) { return s.title; }).join(' · '),
        primary: 'Por dentro de ' + c.title + ': ' + (has ? temps + ', ' + aulas + ' e cerca de ' + Math.max(1, Math.round(st.minutes / 60)) + 'h de conteúdo.' : 'aulas curtas e práticas, para assistir no celular.') + '\n\n' + (I.seasonsOf[c.id] || []).slice(0, 4).map(function (s, i) { return 'T' + (i + 1) + ': ' + s.title; }).join('\n') + '\n\n' + close });
      if (free) ad({ angle: 'gratis', label: 'Sem custo', layout: 'statement', kicker: 'Sem custo', hook: 'Comece hoje sem pagar nada', sub: has ? aulas + ' liberadas assim que você entra.' : 'Acesso liberado assim que você entra.', primary: c.title + ' é gratuito.\n\n' + cap(aulas) + ' para você começar hoje. Entre com o seu e-mail e assista.' });
      else ad({ angle: 'garantia', label: 'Garantia', layout: 'guarantee', kicker: 'Sem risco', hook: g + ' dias para testar', sub: 'Assista, aplique e decida. Se não servir, você recebe 100% do valor de volta.',
        primary: 'Você tem ' + g + ' dias para testar ' + c.title + '.\n\nAssista, aplique e decida. Se não fizer sentido, pede o reembolso e recebe tudo de volta.\n\n' + price, description: 'Garantia de ' + g + ' dias' });
      ad({ angle: 'publico', label: 'Para quem é', layout: 'list', kicker: 'Para quem é', hook: 'Feito para quem', bullets: (aud.length ? aud : ['Quer aplicar já na primeira semana', 'Prefere método a motivação', 'Tem pouco tempo e quer foco']).slice(0, 4),
        primary: c.title + ' é para você se:\n\n' + (aud.length ? aud : ['Quer aplicar já na primeira semana', 'Prefere método a motivação', 'Tem pouco tempo e quer foco']).slice(0, 4).map(function (b) { return '• ' + b; }).join('\n') + '\n\n' + close });
      ad({ angle: 'antes-depois', label: 'Antes e depois', layout: 'versus', kicker: 'Antes e depois', hook: c.title, before: [pain1, pain2].map(function (p) { return cutTxt(p, 70); }), bullets: (bens.length ? bens : [promise]).slice(0, 2).map(function (p) { return cutTxt(p, 70); }),
        primary: 'Antes: ' + pain1 + '\n\nDepois de ' + c.title + ': ' + (bens[0] || promise) + '.\n\n' + close });
      if (tst.length) ad({ angle: 'prova', label: 'Prova', layout: 'quote', kicker: 'Quem já fez', hook: cutTxt(tst[0].text, 190), author: cutTxt(tst[0].name || '', AD_MAX.author),
        primary: '“' + trim(tst[0].text) + '”' + (tst[0].name ? '\n' + trim(tst[0].name) : '') + '\n\n' + c.title + ': ' + promise + '.\n\n' + close });
      else if (bon.length) ad({ angle: 'bonus', label: 'Bônus', layout: 'list', kicker: 'Bônus', hook: 'Entra junto no seu acesso', bullets: bon.slice(0, 4).map(function (b) { return b.title; }),
        primary: 'Quem entra em ' + c.title + ' leva também:\n\n' + bon.slice(0, 4).map(function (b) { return '• ' + b.title + (b.value ? ' (vale ' + money(b.value) + ')' : ''); }).join('\n') + '\n\n' + close });
      else ad({ angle: 'objecao', label: 'Objeção', layout: 'pain', kicker: 'Já tentou antes?', hook: pain2, sub: 'Desta vez com método, aula por aula.', primary: pain2 + '\n\n' + c.title + ' organiza o caminho em ' + temps + ', com aulas curtas e práticas.\n\n' + close });
      ad({ angle: 'urgencia', label: 'Chamada final', layout: 'statement', kicker: c.scarcity_until > now() ? 'Até ' + fmtDate(c.scarcity_until) : 'Acesso na hora', hook: 'Sua próxima temporada começa hoje', sub: cutTxt(promise, 140), cta: free ? 'Assistir agora' : 'Começar agora',
        primary: (c.scarcity_until > now() ? 'A condição especial de ' + c.title + ' vale até ' + fmtDate(c.scarcity_until) + '.\n\n' : '') + promise + '.\n\n' + price + ' ' + close });
      return ads.map(cleanAd);
    }
    function cleanAd(a) {
      a = a || {};
      var o = { angle: slugify(a.angle || 'anuncio').slice(0, 30), label: cutTxt(a.label || a.angle || 'Anúncio', 30), layout: AD_LAYOUTS[a.layout] ? a.layout : 'statement' };
      ['kicker', 'hook', 'sub', 'cta', 'headline', 'description', 'author'].forEach(function (k) { o[k] = cutTxt(a[k] || '', o.layout === 'quote' && k === 'hook' ? 200 : AD_MAX[k]); });
      o.primary = String(a.primary || '').replace(/\r/g, '').trim().slice(0, AD_MAX.primary);
      ['bullets', 'before'].forEach(function (k) { o[k] = (Array.isArray(a[k]) ? a[k] : lines(a[k])).map(function (x) { return cutTxt(x, 72); }).filter(Boolean).slice(0, 4); });
      return o;
    }
    function aiAds(c, I, base, instructions) {
      var brief = base.map(function (a) { return { angle: a.angle, layout: a.layout, rascunho_hook: a.hook }; });
      var user = 'Dados do curso (JSON):\n' + JSON.stringify(aiPayload(c, I)) +
        '\n\nEscreva 10 anúncios estáticos para Instagram e Facebook (Meta Ads), um por ângulo, nesta ordem: ' + JSON.stringify(brief) +
        '\nRegras: hook é o texto grande da arte (até 70 caracteres, específico, sem ponto final; no layout quote use o depoimento real fornecido, sem inventar); kicker até 24 caracteres; sub até 120; bullets até 4 itens de até 60 caracteres (só nos layouts list e versus; no versus, before são as dores e bullets o depois); cta até 20 caracteres; primary é a legenda: 2 a 4 parágrafos curtos, a primeira frase prende em até 125 caracteres; headline até 40; description até 30. Sem travessão. Preço, parcelas e garantia só se estiverem nos dados.' +
        '\n\nFormato exato da resposta:\n{"ads":[{"angle":"","kicker":"","hook":"","sub":"","bullets":[],"before":[],"cta":"","primary":"","headline":"","description":""}]}' +
        (instructions ? '\n\nInstruções extras do produtor: ' + String(instructions).slice(0, 800) : '');
      var got = extractJSON(env.ai(aiSystem(), user, 5000));
      return Array.isArray(got.ads) ? got.ads : [];
    }

    /* ---------- pagamentos ---------- */
    function mapStatus(s) {
      return ({ approved: 'approved', authorized: 'pending', in_process: 'pending', in_mediation: 'pending', pending: 'pending', rejected: 'rejected', cancelled: 'expired', refunded: 'refunded', charged_back: 'chargeback' })[s] || 'pending';
    }
    function methodOf(p, fallback) {
      if (p.payment_method_id === 'pix' || p.payment_type_id === 'bank_transfer') return 'pix';
      if (p.payment_type_id === 'credit_card' || p.payment_type_id === 'debit_card') return 'card';
      if (p.payment_type_id === 'ticket') return 'boleto';
      return fallback || 'pix';
    }
    function findCoupon(course, code) {
      code = trim(code).toUpperCase(); if (!code) return null;
      var q = T('Coupons').find(function (r) { return r.code.toUpperCase() === code; });
      need(q && q.active, 'Cupom inválido.');
      need(!q.course_id || q.course_id === course.id, 'Este cupom não vale para este curso.');
      need(!q.expires_at || q.expires_at > now(), 'Este cupom expirou.');
      need(!q.max_uses || q.uses < q.max_uses, 'Este cupom esgotou.');
      var disc = q.type === 'fixed' ? q.value : course.price * q.value / 100;
      disc = round2(Math.min(course.price, Math.max(0, disc)));
      return { coupon: q, discount: disc, final: round2(course.price - disc) };
    }
    function resolveAffiliate(code, courseId, buyerEmail) {
      code = trim(code).toUpperCase(); if (!code) return null;
      var u = T('Users').find(function (x) { return x.aff_code === code; });
      if (!u || u.status === 'blocked' || !hasRole(u, 'affiliate') || u.email === normEmail(buyerEmail)) return null;
      var a = T('Affiliations').find(function (x) { return x.user_id === u.id && x.course_id === courseId && x.status === 'approved'; });
      return a ? { user: u, affiliation: a } : null;
    }
    function ensureUser(order) {
      var u = findUserByEmail(order.email);
      if (u) {
        if (!u.phone && order.phone) u = T('Users').update(u.id, { phone: order.phone });
        return { user: u, created: false };
      }
      u = T('Users').insert({ name: order.name, email: normEmail(order.email), phone: order.phone, roles: 'student', status: 'active', salt: rand(16), first_token: rand(32), xp: 0 });
      return { user: u, created: true };
    }
    function createCommissions(order, course) {
      var out = { aff: 0, seller: 0 }, conf = cfg();
      var existing = T('Commissions').where(function (m) { return m.order_id === order.id; });
      if (existing.length) { existing.forEach(function (m) { if (m.kind === 'seller') out.seller += m.amount; else out.aff += m.amount; }); return out; }
      var release = now() + Math.max(conf.commission_release_days, course.guarantee_days || 0) * DAY;
      if (order.seller_id) {
        var s = T('Users').get(order.seller_id), pct = s && hasRole(s, 'seller') ? (s.seller_commission || 0) : 0, amt = round2(order.amount * pct / 100);
        if (amt > 0) { T('Commissions').insert({ order_id: order.id, aff_id: s.id, course_id: order.course_id, amount: amt, status: 'pending', release_at: release, kind: 'seller' }); out.seller = amt; }
        return out;
      }
      if (order.aff_id) {
        var a = T('Affiliations').find(function (x) { return x.user_id === order.aff_id && x.course_id === order.course_id && x.status === 'approved'; });
        if (!a) return out;
        var pctA = a.commission > 0 ? a.commission : course.aff_commission;
        var base = order.amount - (conf.aff_on_bump ? 0 : (order.bump_amount || 0));
        var amtA = round2(base * pctA / 100);
        if (amtA > 0) { T('Commissions').insert({ order_id: order.id, aff_id: order.aff_id, course_id: order.course_id, amount: amtA, status: 'pending', release_at: release, kind: 'aff' }); out.aff = amtA; }
      }
      return out;
    }
    function commStatus(m) { return m.status === 'pending' && m.release_at <= now() ? 'available' : m.status; }
    function sendCapi(order, course) {
      var token = env.secret('META_CAPI_TOKEN'), pixel = course.pixel_id || cfg().pixel_id;
      if (!token || !pixel || order.capi_sent || !env.capi) return;
      var ud = { em: [env.sha256(normEmail(order.email))], country: [env.sha256('br')] };
      var ph = digits(order.phone); if (ph) ud.ph = [env.sha256(ph.length <= 11 ? '55' + ph : ph)];
      var fn = firstName(order.name).toLowerCase(); if (fn) ud.fn = [env.sha256(fn)];
      if (order.ua) ud.client_user_agent = order.ua;
      if (order.fbp) ud.fbp = order.fbp;
      if (order.fbc) ud.fbc = order.fbc;
      env.capi(pixel, token, cfg().meta_api_version, {
        data: [{
          event_name: 'Purchase', event_time: Math.floor((order.paid_at || now()) / 1000), event_id: order.id, action_source: 'website',
          event_source_url: siteUrl() + 'lp.html?c=' + course.slug, user_data: ud,
          custom_data: { currency: 'BRL', value: order.amount, content_ids: [course.id], content_name: course.title, content_type: 'product' }
        }]
      });
      T('Orders').update(order.id, { capi_sent: true });
    }
    function approveOrder(order, p) {
      return env.lock(function () {
        memo = {};
        var cur = T('Orders').get(order.id);
        if (!cur || cur.status === 'approved') return cur;
        var I = idx(), course = I.byId[cur.course_id], c = cfg();
        var fee = 0; (p.fee_details || []).forEach(function (f) { fee += Number(f.amount) || 0; });
        var net = p.net_received_amount != null ? Number(p.net_received_amount) : (p.transaction_details && p.transaction_details.net_received_amount != null ? Number(p.transaction_details.net_received_amount) : cur.amount - fee);
        var r = ensureUser(cur);
        if (course) grant(r.user, course, cur.amount > 0 ? (cur.parent_order_id ? 'upsell' : 'purchase') : 'free', cur.id);
        var bc = cur.bump_type === 'course' ? I.byId[cur.bump_ref] : null;
        if (bc) grant(r.user, bc, 'bump', cur.id);
        var comm = course ? createCommissions(cur, course) : { aff: 0, seller: 0 };
        if (cur.coupon) {
          var q = T('Coupons').find(function (x) { return x.code.toUpperCase() === cur.coupon.toUpperCase(); });
          if (q) T('Coupons').update(q.id, { uses: q.uses + 1 });
        }
        var upd = T('Orders').update(cur.id, {
          status: 'approved', paid_at: now(), user_id: r.user.id, mp_payment_id: p.id ? String(p.id) : cur.mp_payment_id,
          status_detail: p.status_detail || 'accredited', method: cur.amount > 0 ? methodOf(p, cur.method) : 'free',
          installments: p.installments || 1, fee: round2(fee), net: round2(net), commission: comm.aff, seller_commission: comm.seller
        });
        var b = evalBadges(r.user, {});
        if (b.fresh.length) T('Users').update(r.user.id, { badges: b.all.join(',') });
        safe(function () { resolveLeadsFor(upd); }, 'crm');
        if (course) {
          sendWelcome(T('Users').get(r.user.id), course, upd);
          if (upd.bump_type === 'product' && upd.bump_delivery) safe(function () {
            sendTpl('bump_delivery', upd.email, { nome: upd.name, primeiro_nome: firstName(upd.name), produto: upd.bump_title, curso: course.title }, upd.bump_delivery, r.user.id);
          }, 'mail-bump');
          if (comm.aff) safe(function () {
            var aff = T('Users').get(upd.aff_id);
            sendTpl('aff_sale', aff.email, { nome: aff.name, primeiro_nome: firstName(aff.name), curso: course.title, comissao: money(comm.aff) }, siteUrl() + 'afiliado.html', aff.id);
          }, 'mail-aff');
          if (upd.seller_id) safe(function () {
            var sl = T('Users').get(upd.seller_id);
            sendTpl('seller_sale', sl.email, { nome: sl.name, primeiro_nome: firstName(sl.name), curso: course.title, valor: money(upd.amount), comissao_frase: comm.seller ? 'Sua comissão: **' + money(comm.seller) + '**, liberada depois do período de garantia.' : '' }, siteUrl() + 'comercial.html', sl.id);
          }, 'mail-seller');
          if (c.notify_sales) safe(function () {
            var sname = upd.seller_id ? ((T('Users').get(upd.seller_id) || {}).name || '') : '';
            var lines = '<p><strong style="color:#f0e6d2">' + esc(course.title) + '</strong> · ' + money(upd.amount) + ' via ' + esc(upd.method) + '</p>' +
              (upd.bump_title ? '<p>Order bump: ' + esc(upd.bump_title) + ' (' + money(upd.bump_amount) + ')</p>' : '') +
              (upd.parent_order_id ? '<p>Oferta pós-compra aceita.</p>' : '') +
              '<p>Comprador: ' + esc(upd.name) + ' · ' + esc(upd.email) + (upd.phone ? ' · ' + esc(upd.phone) : '') + '</p>' +
              (upd.aff_code ? '<p>Afiliado: ' + esc(upd.aff_code) + ' · comissão ' + money(comm.aff) + '</p>' : '') +
              (sname ? '<p>Vendedor: ' + esc(sname) + (comm.seller ? ' · comissão ' + money(comm.seller) : '') + '</p>' : '') +
              (upd.utm_source ? '<p>Origem: ' + esc(upd.utm_source) + ' / ' + esc(upd.utm_campaign) + '</p>' : '');
            send(adminEmail(), 'Nova venda · ' + course.title + ' · ' + money(upd.amount), mailLayout('Nova venda confirmada', lines, { url: siteUrl() + 'admin.html#/vendas', label: 'Abrir vendas' }), { key: 'admin_sale' });
          }, 'mail-admin');
          safe(function () { sendCapi(upd, course); }, 'capi');
        }
        return T('Orders').get(cur.id);
      });
    }
    function reverseOrder(o, st, p) {
      return env.lock(function () {
        var cur = T('Orders').get(o.id);
        if (cur.status === st) return cur;
        T('Enrollments').where(function (e) { return e.order_id === cur.id; }).forEach(function (en) { T('Enrollments').update(en.id, { status: st === 'chargeback' ? 'revoked' : 'refunded' }); });
        T('Commissions').where(function (m) { return m.order_id === cur.id; }).forEach(function (m) {
          T('Commissions').update(m.id, { status: m.status === 'paid' ? 'reversed' : 'canceled' });
        });
        return T('Orders').update(cur.id, { status: st, status_detail: (p && p.status_detail) || st });
      });
    }
    function applyPayment(o, p) {
      if (!p || String(p.external_reference || '') !== o.id) return o;
      var st = mapStatus(p.status);
      if (st === 'approved') {
        if (Math.abs(Number(p.transaction_amount) - o.amount) > 0.05) {
          env.log('warn', 'pagamento', 'Valor pago diferente do pedido', { order: o.id, pago: p.transaction_amount, pedido: o.amount });
          return T('Orders').update(o.id, { status_detail: 'valor_divergente', mp_payment_id: String(p.id) });
        }
        return approveOrder(o, p);
      }
      if ((st === 'refunded' || st === 'chargeback') && o.status === 'approved') return reverseOrder(o, st, p);
      if (o.status === 'approved' || o.status === 'refunded' || o.status === 'chargeback') return o;
      if (o.status !== st || o.status_detail !== (p.status_detail || '')) {
        return T('Orders').update(o.id, { status: st, status_detail: p.status_detail || '', mp_payment_id: String(p.id || o.mp_payment_id), method: methodOf(p, o.method) });
      }
      return o;
    }
    function refreshOrder(o, paymentId) {
      if (o.status !== 'pending' && !paymentId) return o;
      if (env.cache && !paymentId) {
        var k = 'chk:' + o.id;
        if (env.cache.get(k)) return o;
        env.cache.put(k, '1', 4);
      }
      var p = null;
      try {
        if (paymentId) p = env.pay.get(paymentId);
        else if (o.mp_payment_id) p = env.pay.get(o.mp_payment_id);
        if ((!p || mapStatus(p.status) !== 'approved') && o.method === 'card') {
          var found = env.pay.search(o.id) || [];
          var appr = found.filter(function (x) { return x.status === 'approved'; })[0];
          p = appr || found[0] || p;
        }
      } catch (e) { env.log('warn', 'pagamento', 'Falha ao consultar o Mercado Pago: ' + e.message, { order: o.id }); return o; }
      return p ? applyPayment(o, p) : o;
    }

    /* ---------- LP estática (GitHub Pages) ---------- */
    function staticLP(land) {
      var c = land.course, lp = land.lp, site = siteUrl(), title = (lp.seo && lp.seo.title) || c.title, desc = (lp.seo && lp.seo.description) || c.short_desc || '';
      var img = c.banner || c.poster || '';
      var data = JSON.stringify(land).replace(/</g, '\\u003c');
      var assets = '../../assets/';
      return '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
        '<title>' + esc(title) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n' +
        '<meta property="og:type" content="website">\n<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n' +
        (img ? '<meta property="og:image" content="' + esc(img) + '">\n' : '') + '<meta property="og:url" content="' + esc(site + 'c/' + c.slug + '/') + '">\n' +
        '<meta name="theme-color" content="#100b07">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Bebas+Neue&family=Chakra+Petch:wght@500;600;700&family=Noto+Sans+Runic&family=Sedgwick+Ave+Display&display=swap">\n' +
        '<link rel="stylesheet" href="' + assets + 'css/brasa.css">\n<link rel="stylesheet" href="' + assets + 'css/lp.css">\n</head>\n<body>\n<div id="lp"></div>\n' +
        '<script>window.__LANDING__ = ' + data + ';</script>\n' +
        '<script src="' + assets + 'js/config.js"></script>\n<script src="' + assets + 'js/core.js"></script>\n<script src="' + assets + 'js/checkout.js"></script>\n<script src="' + assets + 'js/lp.js"></script>\n</body>\n</html>\n';
    }

    /* ---------- montagem da resposta da LP ---------- */
    function landingFor(c, ref) {
      var I = idx(), conf = cfg();
      var lp = J(c.lp, null) || lpTemplate(c, I);
      var out = {
        course: coursePub(c, I, { marketing: true }), lp: lp,
        pixel_ids: [c.pixel_id || conf.pixel_id].filter(Boolean), aff: null,
        checkout: { methods: splitList(c.methods || 'pix,card'), max_installments: c.max_installments || conf.max_installments, installment_rate: conf.installment_rate, checkout_cpf: conf.checkout_cpf, cookie_days: c.aff_cookie_days || conf.aff_default_cookie_days, mp_public_key: conf.mp_public_key, card_mode: cardMode() },
        brand: { name: conf.brand_name, tagline: conf.brand_tagline, support_whatsapp: conf.support_whatsapp, support_email: conf.support_email, terms_url: conf.terms_url, privacy_url: conf.privacy_url }
      };
      if (ref) {
        var a = resolveAffiliate(ref, c.id, '');
        if (a) { out.aff = { code: a.user.aff_code, name: firstName(a.user.name) }; if (a.affiliation.pixel_id) out.pixel_ids.push(a.affiliation.pixel_id); }
      }
      return out;
    }

    /* =================================================================
       AÇÕES
       ================================================================= */
    var A = {};

    /* ----- públicas ----- */
    A.bootstrap = function (req) {
      var c = cfg();
      var out = {
        brand: { name: c.brand_name, tagline: c.brand_tagline, logo: c.brand_logo, support_whatsapp: c.support_whatsapp, support_email: c.support_email, terms_url: c.terms_url, privacy_url: c.privacy_url },
        pixel_id: c.pixel_id, installment_rate: c.installment_rate, max_installments: c.max_installments, checkout_cpf: c.checkout_cpf, mp_public_key: c.mp_public_key, card_mode: cardMode(),
        affiliate_program: c.affiliate_program, aff_default_commission: c.aff_default_commission, demo: !!env.isDemo, site_url: siteUrl()
      };
      var u = userFromToken(req.token);
      if (u) out.user = publicUser(u);
      return out;
    };

    A.catalog = function () {
      var I = idx();
      return {
        courses: I.courses.filter(function (c) { return VISIBLE[c.status]; })
          .sort(function (a, b) { return (b.featured - a.featured) || byOrder(a, b); })
          .map(function (c) { return coursePub(c, I); })
      };
    };

    A.landing = function (req) {
      var I = idx(), c = I.bySlug[trim(req.slug)] || I.byId[trim(req.course_id)];
      var preview = false;
      if (c && !VISIBLE[c.status] && req.preview) { var u = userFromToken(req.token); preview = !!(u && hasRole(u, 'admin')); }
      need(c && (VISIBLE[c.status] || preview), 'Esta página não existe ou o curso não está à venda.', 'NOT_FOUND');
      var ref = trim(req.ref).toUpperCase();
      if (!ref && !req.offer && env.cache && !preview) {
        var key = 'land:' + c.slug + ':' + (env.cache.get('catver') || '0');
        var hit = env.cache.get(key);
        if (hit) return J(hit, null);
        var fresh = landingFor(c, '');
        safe(function () { var s = JSON.stringify(fresh); if (s.length < 90000) env.cache.put(key, s, 600); });
        return fresh;
      }
      var land = landingFor(c, ref);
      if (req.offer) {
        var fo = findOffer(req.offer, c);
        if (fo.offer) { var sl = T('Users').get(fo.offer.seller_id); land.offer = { code: fo.offer.code, price: fo.offer.price, expires_at: fo.offer.expires_at, seller: sl ? firstName(sl.name) : '', email_locked: !!fo.offer.email }; }
        else land.offer_error = fo.error;
      }
      return land;
    };

    A.track = function (req) {
      var type = { view: 1, cta: 1, checkout: 1 }[req.type] ? req.type : '';
      if (!type) return { ok: false };
      var I = idx(), c = I.bySlug[trim(req.slug)] || I.byId[trim(req.course_id)];
      if (!c) return { ok: false };
      var sid = trim(req.sid).slice(0, 24);
      if (sid && env.cache) {
        var k = 'tk:' + type + ':' + c.id + ':' + sid;
        if (env.cache.get(k)) return { ok: true, dup: true };
        env.cache.put(k, '1', 1800);
      }
      T('Clicks').insert({ course_id: c.id, aff_code: trim(req.aff).toUpperCase().slice(0, 20), type: type, sid: sid, utm_source: trim(req.utm_source).slice(0, 80), utm_campaign: trim(req.utm_campaign).slice(0, 80), ref_url: trim(req.ref_url).slice(0, 200) });
      return { ok: true };
    };

    // checkout começado: vira lead se a pessoa sair sem gerar o pagamento
    A.checkoutIntent = function (req) {
      var I = idx(), c = I.byId[trim(req.course_id)];
      if (!c || c.status !== 'published') return { ok: false };
      var email = normEmail(req.email), phone = digits(req.phone);
      if (!validEmail(email)) email = '';
      if (!email && phone.length < 10) return { ok: false };
      if (env.cache) {
        var key = 'it:' + c.id + ':' + (email || phone); if (env.cache.get(key)) return { ok: true, dup: true }; env.cache.put(key, '1', 3600);
        // teto geral contra abuso: no máximo 300 registros a cada 10 minutos
        var win = 'it:n:' + Math.floor(now() / 600000), n = Number(env.cache.get(win)) || 0;
        if (n >= 300) return { ok: false }; env.cache.put(win, String(n + 1), 900);
      }
      var u = email ? findUserByEmail(email) : null;
      if (u && owns(u.id, c.id)) return { ok: false };
      T('Intents').insert({ course_id: c.id, name: trim(req.name).slice(0, 120), email: email, phone: phone, aff_code: trim(req.aff).toUpperCase().slice(0, 20), src: trim(req.src).slice(0, 20), done: false });
      return { ok: true };
    };

    A.coupon = function (req) {
      var c = idx().byId[trim(req.course_id)];
      need(c, 'Curso não encontrado.', 'NOT_FOUND');
      var r = findCoupon(c, req.code);
      need(r, 'Informe o cupom.');
      return { code: r.coupon.code, type: r.coupon.type, value: r.coupon.value, discount: r.discount, final: r.final };
    };

    A.checkout = function (req) {
      var conf = cfg(), I = idx(), c = I.byId[trim(req.course_id)] || I.bySlug[trim(req.slug)];
      need(c && c.status === 'published', 'Este curso não está à venda no momento.', 'NOT_FOUND');
      var me = userFromToken(req.token);
      var cd = req.card && typeof req.card === 'object' ? req.card : null;
      var name = trim(req.name) || (me ? me.name : ''), email = me ? me.email : normEmail(req.email);
      var phone = digits(req.phone) || (me ? me.phone : '');
      var doc = digits(req.doc) || (cd && cd.identification ? digits(cd.identification.number) : '');
      need(name.length >= 2, 'Informe seu nome.');
      need(validEmail(email), 'Informe um e-mail válido.');
      if (conf.checkout_cpf === 'required') need(doc.length === 11 || doc.length === 14, 'Informe um CPF válido.');
      if (doc && doc.length !== 11 && doc.length !== 14) doc = '';
      var method = req.method === 'card' ? 'card' : 'pix';
      var existing = me || findUserByEmail(email);
      if (existing && owns(existing.id, c.id)) throw err('Este e-mail já tem acesso a este curso. Entre na plataforma para assistir.', 'OWNED');
      // preço: oferta pós-compra > condição do vendedor > cupom > preço normal
      var price = round2(c.price), cp = null, offer = null, parent = null, sellerId = '', affCode = '', aff = null;
      var src = req.src === 'app' ? 'app' : req.src === 'page' ? 'page' : 'lp';
      if (req.upsell_from) {
        parent = T('Orders').get(trim(req.upsell_from));
        need(parent && parent.status === 'approved' && parent.email === email, 'Esta oferta não está disponível para este e-mail.', 'NOT_FOUND');
        var pc = I.byId[parent.course_id], exp = Number(req.upsell_exp) || 0;
        need(pc && pc.upsell_enabled && pc.upsell_course_id === c.id && exp > now() && trim(req.upsell_sig) === upsellSig(parent.id, c.id, exp), 'Esta oferta única expirou.', 'EXPIRED');
        price = round2(pc.upsell_price > 0 ? pc.upsell_price : c.price);
        sellerId = parent.seller_id; affCode = parent.aff_code; src = 'upsell';
      } else if (req.offer) {
        var fo = findOffer(req.offer, c);
        need(fo.offer, fo.error, 'OFFER');
        offer = fo.offer;
        need(!offer.email || offer.email === email, 'Esta condição especial é exclusiva para outro e-mail.', 'OFFER');
        price = round2(offer.price); sellerId = offer.seller_id; src = 'seller';
      } else {
        cp = req.coupon ? findCoupon(c, req.coupon) : null;
        if (cp) price = cp.final;
        affCode = (cp && cp.coupon.aff_code) || trim(req.aff).toUpperCase();
      }
      if (affCode && !sellerId) aff = resolveAffiliate(affCode, c.id, email);
      var bump = null, bumpDropped = false;
      if (req.bump && !parent) {
        bump = bumpOf(c, I);
        if (bump && bump.type === 'course' && existing && owns(existing.id, bump.course_id)) { bump = null; bumpDropped = true; }
      }
      var amount = round2(price + (bump ? bump.price : 0));
      if (amount > 0) need(splitList(c.methods || 'pix,card').indexOf(method) > -1, 'Esta forma de pagamento não está disponível para este curso.');
      var utm = req.utm || {};
      var order = T('Orders').insert({
        status: 'pending', data_br: fmtDateTime(now()), course_id: c.id, course_title: c.title, user_id: existing ? existing.id : '',
        name: name.slice(0, 120), email: email, phone: phone, doc: doc, price: c.price, discount: round2(Math.max(0, c.price - price)), coupon: cp ? cp.coupon.code : '',
        amount: amount, method: amount > 0 ? method : 'free', installments: 1, aff_id: aff ? aff.user.id : '', aff_code: aff ? aff.user.aff_code : '',
        utm_source: trim(utm.source).slice(0, 120), utm_medium: trim(utm.medium).slice(0, 120), utm_campaign: trim(utm.campaign).slice(0, 120),
        utm_content: trim(utm.content).slice(0, 120), utm_term: trim(utm.term).slice(0, 120), src: src,
        fbp: trim(req.fbp).slice(0, 120), fbc: trim(req.fbc).slice(0, 200), ua: trim(req.ua).slice(0, 250),
        bump_type: bump ? bump.type : '', bump_ref: bump && bump.type === 'course' ? bump.course_id : '', bump_title: bump ? bump.title : '',
        bump_amount: bump ? bump.price : 0, bump_delivery: bump && bump.type === 'product' ? c.bump_delivery : '',
        parent_order_id: parent ? parent.id : '', offer_id: offer ? offer.id : '', seller_id: sellerId || '', banner_id: trim(req.banner_id).slice(0, 40)
      });
      var out = { order_id: order.id, amount: amount, bump_dropped: bumpDropped };
      if (amount <= 0) {
        approveOrder(order, { id: '', status: 'approved', status_detail: 'free', transaction_amount: 0, external_reference: order.id });
        return Object.assign(out, { status: 'approved', method: 'free', free: true });
      }
      var desc = c.title + (bump ? ' + ' + bump.title : ''), p = null;
      try {
        if (method === 'pix') {
          var expAt = now() + Math.max(30, conf.pix_expiration_min) * 60000;
          var px = env.pay.pix({ amount: amount, description: desc, email: email, name: name, doc: doc, order_id: order.id, notification_url: webhookUrl(), expires_at: expAt });
          T('Orders').update(order.id, { mp_payment_id: String(px.id), status_detail: px.status_detail || 'pending_waiting_transfer' });
          return Object.assign(out, { status: 'pending', method: 'pix', pix: { qr_code: px.qr_code, qr_base64: px.qr_base64, ticket_url: px.ticket_url, expires_at: expAt } });
        }
        if (!(cd && cd.token)) {
          var pref = env.pay.preference({
            order_id: order.id, title: desc, amount: amount, email: email, name: name,
            max_installments: c.max_installments || conf.max_installments, notification_url: webhookUrl(),
            back_url: siteUrl() + 'obrigado.html?o=' + order.id, statement: conf.brand_name
          });
          T('Orders').update(order.id, { mp_preference_id: String(pref.id) });
          return Object.assign(out, { status: 'pending', method: 'card', card: { url: pref.init_point } });
        }
        p = env.pay.card({
          order_id: order.id, amount: amount, description: desc, email: email, name: name, doc: doc, token: String(cd.token),
          payment_method_id: trim(cd.payment_method_id), issuer_id: cd.issuer_id ? String(cd.issuer_id) : '',
          installments: clamp(cd.installments || 1, 1, c.max_installments || conf.max_installments), identification: cd.identification || null,
          notification_url: webhookUrl(), three_ds: conf.card_3ds, statement: conf.brand_name
        });
      } catch (e) {
        env.log('error', 'checkout', String(e.message || e), { order: order.id });
        T('Orders').update(order.id, { status: 'failed', status_detail: String(e.message || e).slice(0, 180) });
        throw err(cd && cd.token ? 'Não deu para processar o cartão. Confira os dados ou pague com Pix.' : 'Não conseguimos gerar o pagamento agora. Tente de novo em instantes ou fale com o suporte.', 'PAYMENT');
      }
      // cartão dentro da página: a cobrança já existe, então o resultado é tratado fora do try
      T('Orders').update(order.id, { mp_payment_id: String(p.id || ''), card_brand: trim(cd.payment_method_id).slice(0, 20), installments: Number(p.installments) || Number(cd.installments) || 1, status_detail: p.status_detail || '' });
      if (p.status === 'approved') {
        var ok = applyPayment(T('Orders').get(order.id), p);
        return Object.assign(out, { status: ok && ok.status === 'approved' ? 'approved' : 'pending', method: 'card' });
      }
      if (p.status_detail === 'pending_challenge' && p.three_ds_info) {
        return Object.assign(out, { status: 'challenge', method: 'card', payment_id: String(p.id), three_ds: { url: p.three_ds_info.external_resource_url, creq: p.three_ds_info.creq } });
      }
      if (mapStatus(p.status) === 'rejected') {
        T('Orders').update(order.id, { status: 'rejected', status_detail: p.status_detail || 'rejected' });
        return Object.assign(out, { status: 'rejected', method: 'card', status_detail: p.status_detail, message: cardMessage(p.status_detail) });
      }
      return Object.assign(out, { status: 'pending', method: 'card', payment_id: String(p.id), status_detail: p.status_detail, message: cardMessage(p.status_detail) });
    };

    A.order = function (req) {
      var o = T('Orders').get(trim(req.order_id));
      need(o, 'Pedido não encontrado.', 'NOT_FOUND');
      // consulta o Mercado Pago no máximo a cada 15 s por pedido (o webhook já aprova na hora)
      var fresh = true;
      if (!req.payment_id && env.cache) { var rk = 'rf:' + o.id; if (env.cache.get(rk)) fresh = false; else env.cache.put(rk, '1', 15); }
      if ((o.status === 'pending' && fresh) || req.payment_id) o = refreshOrder(o, trim(req.payment_id)) || o;
      var c = idx().byId[o.course_id];
      var out = {
        order: {
          id: o.id, status: o.status, amount: o.amount, method: o.method, course_id: o.course_id, course_slug: c ? c.slug : '', course_title: o.course_title,
          email_masked: maskEmail(o.email), created_at: o.created_at, paid_at: o.paid_at, aff_code: o.aff_code, status_detail: o.status_detail,
          message: o.method === 'card' && (o.status === 'rejected' || o.status === 'pending') && o.status_detail ? cardMessage(o.status_detail) : '',
          bump: o.bump_type ? { type: o.bump_type, title: o.bump_title, amount: o.bump_amount, delivery: o.status === 'approved' && o.bump_type === 'product' ? o.bump_delivery : '' } : null,
          parent_order_id: o.parent_order_id
        },
        pixel_ids: c ? [c.pixel_id || cfg().pixel_id].filter(Boolean) : []
      };
      if (o.status === 'approved') {
        var u = T('Users').get(o.user_id);
        out.has_password = !!(u && u.pass_hash);
        if (u && !u.pass_hash && u.first_token && now() - o.paid_at < 2 * 3600e3) out.first_token = u.first_token;
        var up = upsellFor(o);
        if (up) out.upsell = up;
      }
      return out;
    };

    A.register = function (req) {
      var conf = cfg();
      var name = trim(req.name), email = normEmail(req.email), pw = String(req.password || '');
      need(name.length >= 2, 'Informe seu nome.');
      need(validEmail(email), 'Informe um e-mail válido.');
      need(pw.length >= 6, 'A senha precisa ter pelo menos 6 caracteres.');
      rateLimit('reg:' + email, 5, 900);
      var ex = findUserByEmail(email);
      if (ex) throw err(ex.pass_hash ? 'Já existe uma conta com este e-mail. Entre com sua senha.' : 'Este e-mail já tem compras. Use "Esqueci minha senha" para criar sua senha.', 'EXISTS');
      var asAff = req.as === 'affiliate' && conf.affiliate_program;
      var salt = rand(16);
      var u = T('Users').insert({
        name: name.slice(0, 120), email: email, phone: digits(req.phone), salt: salt, pass_hash: hashPw(pw, salt),
        roles: asAff ? 'student,affiliate' : 'student', status: 'active', xp: 0, last_seen: now(),
        aff_code: asAff ? uniqueAffCode(name) : '', pix_key: asAff ? trim(req.pix_key).slice(0, 120) : '', instagram: asAff ? trim(req.instagram).slice(0, 60) : ''
      });
      return { token: makeToken(u), user: publicUser(u) };
    };

    A.login = function (req) {
      var email = normEmail(req.email), pw = String(req.password || '');
      need(validEmail(email) && pw, 'Informe e-mail e senha.');
      rateLimit('rl:' + email, 8, 900);
      var u = findUserByEmail(email);
      if (u && !u.pass_hash) throw err('Você ainda não criou sua senha. Toque em "Esqueci minha senha" para receber um código por e-mail.', 'NO_PASSWORD');
      need(u && u.pass_hash === hashPw(pw, u.salt), 'E-mail ou senha incorretos.', 'BAD_LOGIN');
      need(u.status !== 'blocked', 'Esta conta está bloqueada. Fale com o suporte.', 'FORBIDDEN');
      if (req.as === 'admin') need(hasRole(u, 'admin'), 'Esta conta não é de administrador.', 'FORBIDDEN');
      if (req.as === 'seller') need(isSeller(u) || hasRole(u, 'admin'), 'Esta conta não faz parte do time comercial.', 'FORBIDDEN');
      if (env.cache) safe(function () { env.cache.del('rl:' + email); });
      u = T('Users').update(u.id, { last_seen: now() });
      return { token: makeToken(u, req.as === 'admin' ? 7 : 30), user: publicUser(u) };
    };

    A.forgot = function (req) {
      var email = normEmail(req.email);
      need(validEmail(email), 'Informe um e-mail válido.');
      rateLimit('fg:' + email, 4, 1800);
      var u = findUserByEmail(email), out = { sent: true };
      if (u && u.status !== 'blocked') {
        var code = rand(6, '0123456789');
        T('Users').update(u.id, { reset_code: env.sha256(code + u.salt), reset_exp: now() + 30 * 60000 });
        sendTpl('code', u.email, { nome: u.name, primeiro_nome: firstName(u.name), codigo: code, codigo_html: codeHtml(code) }, '', u.id);
        if (env.isDemo) out.demo_code = code;
      }
      return out;
    };

    A.reset = function (req) {
      var email = normEmail(req.email), code = digits(req.code), pw = String(req.password || '');
      need(pw.length >= 6, 'A nova senha precisa ter pelo menos 6 caracteres.');
      rateLimit('rs:' + email, 6, 1800);
      var u = findUserByEmail(email);
      need(u && u.reset_code && u.reset_exp > now() && u.reset_code === env.sha256(code + u.salt), 'Código inválido ou expirado. Peça um novo.');
      var salt = rand(16);
      u = T('Users').update(u.id, { salt: salt, pass_hash: hashPw(pw, salt), reset_code: '', reset_exp: 0, first_token: '', last_seen: now() });
      return { token: makeToken(u), user: publicUser(u) };
    };

    A.firstAccess = function (req) {
      var tok = trim(req.first), pw = String(req.password || '');
      need(tok.length >= 20, 'Link de primeiro acesso inválido.');
      need(pw.length >= 6, 'A senha precisa ter pelo menos 6 caracteres.');
      var u = T('Users').find(function (x) { return x.first_token === tok; });
      need(u, 'Este link já foi usado ou expirou. Use "Esqueci minha senha".', 'NOT_FOUND');
      var salt = rand(16), patch = { salt: salt, pass_hash: hashPw(pw, salt), first_token: '', last_seen: now() };
      if (trim(req.name).length >= 2) patch.name = trim(req.name).slice(0, 120);
      u = T('Users').update(u.id, patch);
      return { token: makeToken(u), user: publicUser(u) };
    };

    A.firstInfo = function (req) {
      var tok = trim(req.first);
      var u = tok.length >= 20 ? T('Users').find(function (x) { return x.first_token === tok; }) : null;
      need(u, 'Este link já foi usado ou expirou. Use "Esqueci minha senha".', 'NOT_FOUND');
      return { name: u.name, email_masked: maskEmail(u.email) };
    };

    A.certificate = function (req) {
      var code = trim(req.code).toUpperCase();
      var x = T('Certificates').find(function (r) { return r.code === code; });
      need(x, 'Certificado não encontrado. Confira o código.', 'NOT_FOUND');
      var c = idx().byId[x.course_id];
      return { code: x.code, name: x.name, course_title: x.course_title, hours: x.hours, issued_at: x.created_at, course_slug: c ? c.slug : '', instructor: c ? c.instructor_name : '', brand: cfg().brand_name };
    };

    /* ----- aluno ----- */
    A.me = function (req) {
      var u = auth(req), I = idx(), rows = progressRows(u.id);
      var have = badgesOf(u);
      var certs = T('Certificates').where(function (x) { return x.user_id === u.id; });
      return {
        user: publicUser(u),
        badges: BADGES.map(function (b) { return Object.assign({ unlocked: have.indexOf(b.id) > -1 }, b); }),
        ranks: RANKS,
        stats: {
          lessons_done: rows.filter(function (p) { return p.status === 'done'; }).length,
          courses: Object.keys(enrollMap(u.id)).length,
          certificates: certs.length,
          minutes: rows.filter(function (p) { return p.status === 'done'; }).reduce(function (s, p) { var l = I.lessonById[p.lesson_id]; return s + (l ? l.duration_min : 0); }, 0)
        },
        certificates: certs.map(function (x) { return { code: x.code, course_title: x.course_title, hours: x.hours, issued_at: x.created_at, course_id: x.course_id }; })
      };
    };

    A.home = function (req) {
      var u = auth(req), I = idx(), ens = enrollMap(u.id), rows = progressRows(u.id), mine = list(u), t = now();
      var courses = I.courses.filter(function (c) { return VISIBLE[c.status]; })
        .sort(function (a, b) { return (b.featured - a.featured) || byOrder(a, b); })
        .map(function (c) {
          var o = coursePub(c, I);
          o.owned = !!ens[c.id];
          o.in_list = mine.indexOf(c.id) > -1;
          o.is_new = t - (c.released_at || c.created_at) < 14 * DAY;
          o.progress = o.owned ? courseProgress(c, I, rows) : null;
          o.new_lessons = o.owned ? (I.seq[c.id] || []).filter(function (l) { return t - l.created_at < 7 * DAY && l.created_at > ens[c.id].created_at; }).length : 0;
          o.expires_at = o.owned ? ens[c.id].expires_at : 0;
          return o;
        });
      var cont = courses.filter(function (c) { return c.owned && c.progress && c.progress.last_at && c.progress.pct < 100; })
        .sort(function (a, b) { return b.progress.last_at - a.progress.last_at; })
        .map(function (c) {
          var l = I.lessonById[c.progress.next_lesson_id] || {};
          return { course_id: c.id, slug: c.slug, title: c.title, banner: c.banner, poster: c.poster, color: c.color, show_title: c.show_title, lesson_id: l.id || '', lesson_title: l.title || '', label: l.label || '', lesson_pct: l.id === c.progress.last_lesson_id ? c.progress.last_pct : 0, course_pct: c.progress.pct, at: c.progress.last_at };
        });
      var notes = [];
      courses.forEach(function (c) {
        if (!c.owned) return;
        (I.seq[c.id] || []).forEach(function (l) { if (t - l.created_at < 14 * DAY && l.created_at > ens[c.id].created_at) notes.push({ course_id: c.id, slug: c.slug, course_title: c.title, lesson_id: l.id, lesson_title: l.title, label: l.label, at: l.created_at }); });
      });
      courses.forEach(function (c) {
        var raw = I.byId[c.id], at = raw && raw.released_at;
        if (c.status === 'published' && !c.owned && c.in_list && at && t - at < 14 * DAY) notes.push({ kind: 'launch', course_id: c.id, slug: c.slug, course_title: c.title, at: at });
      });
      notes.sort(function (a, b) { return b.at - a.at; });
      return { user: publicUser(u), courses: courses, continue: cont, notifications: notes.slice(0, 20), banners: safe(function () { return bannersFor(u, I, ens); }, 'banners') || [] };
    };

    A.course = function (req) {
      var u = auth(req), I = idx(), c = I.bySlug[trim(req.slug)] || I.byId[trim(req.id)];
      need(c && VISIBLE[c.status], 'Curso não encontrado.', 'NOT_FOUND');
      var en = owns(u.id, c.id), rows = progressRows(u.id), pm = {};
      rows.forEach(function (p) { if (p.course_id === c.id) pm[p.lesson_id] = p; });
      var o = coursePub(c, I, { marketing: true }), t = now();
      o.seasons.forEach(function (s) {
        var opens = seasonOpensAt(I.seasonById[s.id], en);
        s.opens_at = opens;
        s.locked = !en ? 'not_owned' : (opens > t ? 'drip' : '');
        s.lessons.forEach(function (l) {
          var p = pm[l.id];
          l.done = !!(p && p.status === 'done');
          l.position = p ? p.position : 0;
          l.pct = l.done ? 100 : (p && l.duration_min ? Math.min(99, Math.round(p.position / (l.duration_min * 60) * 100)) : 0);
          l.locked = l.free_preview ? '' : s.locked;
          l.is_new = !!(en && t - l.created_at < 7 * DAY && l.created_at > en.created_at);
        });
      });
      var cert = en ? T('Certificates').find(function (x) { return x.user_id === u.id && x.course_id === c.id; }) : null;
      return {
        course: o, owned: !!en, in_list: list(u).indexOf(c.id) > -1,
        enrollment: en ? { created_at: en.created_at, expires_at: en.expires_at, source: en.source } : null,
        progress: courseProgress(c, I, rows), certificate: cert ? cert.code : ''
      };
    };

    A.lesson = function (req) {
      var u = auth(req), I = idx(), l = I.lessonById[trim(req.lesson_id)];
      need(l, 'Aula não encontrada.', 'NOT_FOUND');
      var c = I.byId[l.course_id], s = I.seasonById[l.season_id];
      need(c && VISIBLE[c.status], 'Curso indisponível.', 'NOT_FOUND');
      var en = owns(u.id, c.id);
      if (!l.free_preview) {
        need(en, 'Desbloqueie o curso para assistir esta aula.', 'LOCKED');
        var opens = seasonOpensAt(s, en);
        need(opens <= now(), 'Esta temporada libera em ' + fmtDate(opens) + '.', 'LOCKED');
      }
      var seq = I.seq[c.id], i = seq.indexOf(l);
      var p = T('Progress').find(function (x) { return x.user_id === u.id && x.lesson_id === l.id; });
      if (!p && en) p = T('Progress').insert({ user_id: u.id, course_id: c.id, lesson_id: l.id, status: 'started', position: 0 });
      else if (p && en) T('Progress').update(p.id, {});
      var rows = progressRows(u.id), pm = {};
      rows.forEach(function (r) { if (r.course_id === c.id) pm[r.lesson_id] = r; });
      function isLocked(x) {
        if (x.free_preview) return false;
        if (!en) return true;
        return seasonOpensAt(I.seasonById[x.season_id], en) > now();
      }
      function brief(x) { return x ? { id: x.id, title: x.title, label: x.label, duration_min: x.duration_min, locked: isLocked(x), done: !!(pm[x.id] && pm[x.id].status === 'done'), thumb: x.thumb } : null; }
      return {
        lesson: {
          id: l.id, title: l.title, description: l.description, video_url: l.video_url, duration_min: l.duration_min, materials: J(l.materials, []),
          free_preview: l.free_preview, thumb: l.thumb, label: l.label, season_id: l.season_id, course_id: c.id,
          done: !!(p && p.status === 'done'), position: p ? p.position : 0, note: p ? p.note : '', liked: !!(p && p.liked)
        },
        course: { id: c.id, slug: c.slug, title: c.title, banner: c.banner, poster: c.poster, color: c.color === '' ? '' : Number(c.color), show_title: c.show_title, price: c.price, anchor_price: c.anchor_price },
        owned: !!en,
        season: s ? { id: s.id, title: s.title, n: l.season_n } : null,
        prev: brief(seq[i - 1]), next: brief(seq[i + 1]),
        playlist: (I.seasonsOf[c.id] || []).map(function (ss, si) {
          return { id: ss.id, n: si + 1, title: ss.title, lessons: (I.lessonsOf[ss.id] || []).map(brief) };
        })
      };
    };

    A.progress = function (req) {
      var u = auth(req), I = idx(), l = I.lessonById[trim(req.lesson_id)];
      need(l, 'Aula não encontrada.', 'NOT_FOUND');
      var c = I.byId[l.course_id], en = owns(u.id, c.id);
      if (!en) return { xp_gained: 0, saved: false };
      var p = T('Progress').find(function (x) { return x.user_id === u.id && x.lesson_id === l.id; });
      if (!p) p = T('Progress').insert({ user_id: u.id, course_id: c.id, lesson_id: l.id, status: 'started', position: 0 });
      var patch = {};
      if (req.position != null && !isNaN(Number(req.position))) patch.position = Math.max(0, Math.round(Number(req.position)));
      var res = { xp_gained: 0, level_up: false, badges_new: [], course_done: false, saved: true };
      if (req.done === false && p.status === 'done') { patch.status = 'started'; patch.completed_at = 0; }
      if (req.done && p.status !== 'done') {
        patch.status = 'done'; patch.completed_at = now();
        var gain = l.xp || 50, up = {}, today = dayKey(now());
        if (u.streak_day !== today) {
          var st = u.streak_day === dayKey(now() - DAY) ? (u.streak || 0) + 1 : 1;
          up.streak = st; up.streak_day = today; gain += Math.min(10 * st, 100);
        }
        T('Progress').update(p.id, patch);
        var rows = progressRows(u.id), prog = courseProgress(c, I, rows);
        if (prog.total && prog.done === prog.total) {
          var cert = T('Certificates').find(function (x) { return x.user_id === u.id && x.course_id === c.id; });
          if (!cert) { gain += 500; cert = certificateFor(u, c, I); res.course_done = true; }
          res.certificate_code = cert.code;
          if (res.course_done && !hasRole(u, 'affiliate') && cfg().affiliate_program && c.aff_enabled) res.aff_invite = { course_id: c.id, course_title: c.title, commission: c.aff_commission };
        }
        var lvBefore = levelOf(u.xp || 0), xp = (u.xp || 0) + gain, lvAfter = levelOf(xp);
        up.xp = xp;
        var b = evalBadges(u, { rows: rows, justCompleted: true, streak: up.streak });
        if (b.fresh.length) up.badges = b.all.join(',');
        u = T('Users').update(u.id, up);
        res.xp_gained = gain; res.level_up = lvAfter > lvBefore; res.level = lvAfter; res.rank = rankOf(lvAfter);
        res.badges_new = badgeObjs(b.fresh); res.progress = prog; res.user = publicUser(u);
        return res;
      }
      if (Object.keys(patch).length) T('Progress').update(p.id, patch);
      return res;
    };

    A.note = function (req) {
      var u = auth(req), l = idx().lessonById[trim(req.lesson_id)];
      need(l, 'Aula não encontrada.', 'NOT_FOUND');
      need(owns(u.id, l.course_id) || l.free_preview, 'Desbloqueie o curso para fazer anotações.', 'LOCKED');
      var p = T('Progress').find(function (x) { return x.user_id === u.id && x.lesson_id === l.id; });
      var text = String(req.text || '').slice(0, 5000);
      if (p) T('Progress').update(p.id, { note: text }); else T('Progress').insert({ user_id: u.id, course_id: l.course_id, lesson_id: l.id, status: 'started', note: text });
      var b = evalBadges(u, {});
      if (b.fresh.length) T('Users').update(u.id, { badges: b.all.join(',') });
      return { saved: true, badges_new: badgeObjs(b.fresh) };
    };

    A.like = function (req) {
      var u = auth(req), l = idx().lessonById[trim(req.lesson_id)];
      need(l, 'Aula não encontrada.', 'NOT_FOUND');
      var p = T('Progress').find(function (x) { return x.user_id === u.id && x.lesson_id === l.id; });
      var v = !!req.value;
      if (p) T('Progress').update(p.id, { liked: v }); else T('Progress').insert({ user_id: u.id, course_id: l.course_id, lesson_id: l.id, status: 'started', liked: v });
      return { liked: v };
    };

    A.mylist = function (req) {
      var u = auth(req), id = trim(req.course_id), l = list(u);
      need(idx().byId[id], 'Curso não encontrado.', 'NOT_FOUND');
      var i = l.indexOf(id);
      if (i > -1) l.splice(i, 1); else l.unshift(id);
      T('Users').update(u.id, { my_list: l.join(',') });
      return { in_list: i < 0, my_list: l };
    };

    A.profile = function (req) {
      var u = auth(req), patch = {}, out = {};
      if (req.name != null) { need(trim(req.name).length >= 2, 'Informe seu nome.'); patch.name = trim(req.name).slice(0, 120); }
      if (req.phone != null) patch.phone = digits(req.phone).slice(0, 13);
      if (req.avatar != null) patch.avatar = trim(req.avatar).slice(0, 400);
      if (req.avatar_color != null) patch.avatar_color = req.avatar_color === '' ? '' : clamp(req.avatar_color, 0, 5);
      if (req.password) {
        need(String(req.password).length >= 6, 'A nova senha precisa ter pelo menos 6 caracteres.');
        if (u.pass_hash) need(hashPw(String(req.current_password || ''), u.salt) === u.pass_hash, 'A senha atual não confere.');
        var salt = rand(16); patch.salt = salt; patch.pass_hash = hashPw(String(req.password), salt); patch.first_token = '';
      }
      u = T('Users').update(u.id, patch);
      if (req.password) out.token = makeToken(u);
      out.user = publicUser(u);
      return out;
    };

    /* ----- suporte (aluno e afiliado) ----- */
    A.chat = function (req) {
      var u = auth(req);
      var msgs = T('Messages').where(function (m) { return m.thread === u.id; }).sort(function (a, b) { return a.ts - b.ts; });
      msgs.forEach(function (m) { if (m.from === 'admin' && !m.read_user) T('Messages').update(m.id, { read_user: true }); });
      return { messages: msgs.slice(-200).map(function (m) { return { id: m.id, ts: m.ts, from: m.from === 'admin' ? 'admin' : 'me', text: m.text }; }) };
    };
    A.chatUnread = function (req) {
      var u = auth(req);
      return { unread: T('Messages').where(function (m) { return m.thread === u.id && m.from === 'admin' && !m.read_user; }).length };
    };
    A.chatSend = function (req) {
      var u = auth(req), text = trim(req.text).slice(0, 2000);
      need(text, 'Escreva sua mensagem.');
      rateLimit('msg:' + u.id, 20, 300);
      var m = T('Messages').insert({ thread: u.id, from: 'user', text: text, read_admin: false, read_user: true });
      return { message: { id: m.id, ts: m.ts, from: 'me', text: m.text } };
    };

    /* ----- afiliado ----- */
    A.affJoin = function (req) {
      var u = auth(req), conf = cfg();
      need(conf.affiliate_program, 'O programa de afiliados está fechado no momento.');
      var patch = { roles: withRole(u, 'affiliate') };
      if (!u.aff_code) patch.aff_code = uniqueAffCode(u.name);
      if (req.pix_key != null) patch.pix_key = trim(req.pix_key).slice(0, 120);
      if (req.instagram != null) patch.instagram = trim(req.instagram).replace(/^@/, '').slice(0, 60);
      u = T('Users').update(u.id, patch);
      return { user: publicUser(u) };
    };

    function affLinks(c, code) {
      var base = siteUrl() + 'lp.html?c=' + encodeURIComponent(c.slug) + '&ref=' + encodeURIComponent(code);
      return { lp: base, checkout: siteUrl() + 'checkout.html?c=' + encodeURIComponent(c.slug) + '&ref=' + encodeURIComponent(code), static: c.lp_static_url ? c.lp_static_url + '?ref=' + encodeURIComponent(code) : '' };
    }

    A.affHome = function (req) {
      var u = auth(req, 'affiliate'), I = idx(), days = clamp(req.days || 30, 7, 365), t = now(), since = t - days * DAY;
      var affs = T('Affiliations').where(function (a) { return a.user_id === u.id; });
      var clicks = T('Clicks').where(function (k) { return k.aff_code === u.aff_code && k.ts >= since && k.type === 'view'; });
      var orders = T('Orders').where(function (o) { return o.aff_id === u.id; });
      var comms = T('Commissions').where(function (m) { return m.aff_id === u.id && m.kind !== 'seller'; });
      var commByOrder = {}; comms.forEach(function (m) { commByOrder[m.order_id] = m; });
      var sold = orders.filter(function (o) { return o.status === 'approved' && o.paid_at >= since; });
      var k = { clicks: clicks.length, sales: sold.length, revenue: 0, commission: 0, pending: 0, available: 0, paid: 0 };
      sold.forEach(function (o) { k.revenue += o.amount; k.commission += commByOrder[o.id] ? commByOrder[o.id].amount : 0; });
      comms.forEach(function (m) { var st = commStatus(m); if (st === 'pending') k.pending += m.amount; else if (st === 'available') k.available += m.amount; else if (st === 'paid') k.paid += m.amount; });
      ['revenue', 'commission', 'pending', 'available', 'paid'].forEach(function (x) { k[x] = round2(k[x]); });
      k.conv = k.clicks ? Math.round(k.sales / k.clicks * 1000) / 10 : 0;
      var series = [], map = {};
      for (var i = days - 1; i >= 0; i--) { var key = dayKey(t - i * DAY); map[key] = { d: key, label: dayLabel(key), clicks: 0, sales: 0, commission: 0 }; series.push(map[key]); }
      clicks.forEach(function (c) { var s = map[dayKey(c.ts)]; if (s) s.clicks++; });
      sold.forEach(function (o) { var s = map[dayKey(o.paid_at)]; if (s) { s.sales++; s.commission = round2(s.commission + (commByOrder[o.id] ? commByOrder[o.id].amount : 0)); } });
      // ranking do mês (vendas aprovadas)
      var mk = dayKey(t).slice(0, 7), counts = {};
      T('Orders').where(function (o) { return o.status === 'approved' && o.aff_id && dayKey(o.paid_at).slice(0, 7) === mk; }).forEach(function (o) { counts[o.aff_id] = (counts[o.aff_id] || 0) + 1; });
      var ranking = Object.keys(counts).map(function (id) { var x = T('Users').get(id); return { id: id, name: x ? maskName(x.name) : 'Afiliado', sales: counts[id], me: id === u.id }; })
        .sort(function (a, b) { return b.sales - a.sales; });
      var myPos = 0; ranking.forEach(function (r, ix) { r.pos = ix + 1; if (r.me) myPos = r.pos; });
      return {
        profile: { name: u.name, email: u.email, aff_code: u.aff_code, pix_key: u.pix_key, instagram: u.instagram },
        days: days, kpis: k, series: series,
        ranking: ranking.slice(0, 10).map(function (r) { return { pos: r.pos, name: r.name, sales: r.sales, me: r.me }; }), my_pos: myPos, my_sales_month: counts[u.id] || 0,
        affiliations: affs.map(function (a) {
          var c = I.byId[a.course_id]; if (!c) return null;
          var pct = a.commission > 0 ? a.commission : c.aff_commission;
          var cl = clicks.filter(function (x) { return x.course_id === c.id; }).length;
          var so = sold.filter(function (o) { return o.course_id === c.id; });
          return {
            id: a.id, status: a.status, created_at: a.created_at, pixel_id: a.pixel_id, commission_pct: pct,
            est_commission: round2(c.price * pct / 100),
            course: { id: c.id, slug: c.slug, title: c.title, banner: c.banner, poster: c.poster, color: c.color === '' ? '' : Number(c.color), show_title: c.show_title, price: c.price, status: c.status },
            links: a.status === 'approved' ? affLinks(c, u.aff_code) : null,
            materials: a.status === 'approved' ? c.aff_materials : '',
            clicks: cl, sales: so.length, commission: round2(so.reduce(function (s, o) { return s + (commByOrder[o.id] ? commByOrder[o.id].amount : 0); }, 0))
          };
        }).filter(Boolean),
        recent: orders.filter(function (o) { return o.status === 'approved' || o.status === 'refunded' || o.status === 'chargeback'; })
          .sort(function (a, b) { return (b.paid_at || b.created_at) - (a.paid_at || a.created_at); }).slice(0, 10)
          .map(function (o) { var m = commByOrder[o.id]; return { id: o.id, at: o.paid_at || o.created_at, course_title: o.course_title, buyer: maskName(o.name), amount: o.amount, commission: m ? m.amount : 0, status: o.status, commission_status: m ? commStatus(m) : '' }; })
      };
    };

    A.affMarket = function (req) {
      var u = auth(req, 'affiliate'), I = idx(), conf = cfg();
      var mine = {}; T('Affiliations').where(function (a) { return a.user_id === u.id; }).forEach(function (a) { mine[a.course_id] = a; });
      return {
        courses: I.courses.filter(function (c) { return c.status === 'published' && c.aff_enabled; }).sort(byOrder).map(function (c) {
          var a = mine[c.id], pct = a && a.commission > 0 ? a.commission : c.aff_commission;
          var o = coursePub(c, I, { seasons: false });
          o.commission_pct = pct; o.est_commission = round2(c.price * pct / 100);
          o.cookie_days = c.aff_cookie_days || conf.aff_default_cookie_days; o.auto_approve = c.aff_auto;
          o.aff_status = a ? a.status : 'none'; o.affiliation_id = a ? a.id : '';
          o.materials = a && a.status === 'approved' ? c.aff_materials : '';
          o.links = a && a.status === 'approved' ? affLinks(c, u.aff_code) : null;
          return o;
        })
      };
    };

    A.affRequest = function (req) {
      var u = auth(req, 'affiliate'), c = idx().byId[trim(req.course_id)];
      need(c && c.status === 'published' && c.aff_enabled, 'Este curso não aceita afiliados no momento.');
      var a = T('Affiliations').find(function (x) { return x.user_id === u.id && x.course_id === c.id; });
      if (a) {
        need(a.status !== 'blocked', 'Sua afiliação a este curso foi bloqueada. Fale com o suporte.');
        if (a.status === 'rejected') a = T('Affiliations').update(a.id, { status: c.aff_auto ? 'approved' : 'pending' });
      } else {
        a = T('Affiliations').insert({ user_id: u.id, course_id: c.id, status: c.aff_auto ? 'approved' : 'pending', commission: 0 });
      }
      return { status: a.status, affiliation_id: a.id, links: a.status === 'approved' ? affLinks(c, u.aff_code) : null };
    };

    A.affSales = function (req) {
      var u = auth(req, 'affiliate'), from = Number(req.from) || 0, to = Number(req.to) || now() + DAY;
      var comms = {}; T('Commissions').where(function (m) { return m.aff_id === u.id && m.kind !== 'seller'; }).forEach(function (m) { comms[m.order_id] = m; });
      var rows = T('Orders').where(function (o) {
        var at = o.paid_at || o.created_at;
        return o.aff_id === u.id && at >= from && at <= to && (!req.course_id || o.course_id === req.course_id) && (o.status === 'approved' || o.status === 'refunded' || o.status === 'chargeback');
      }).sort(function (a, b) { return (b.paid_at || b.created_at) - (a.paid_at || a.created_at); });
      var tot = { count: 0, revenue: 0, commission: 0 };
      var out = rows.map(function (o) {
        var m = comms[o.id];
        if (o.status === 'approved') { tot.count++; tot.revenue += o.amount; tot.commission += m ? m.amount : 0; }
        return { id: o.id, at: o.paid_at || o.created_at, course_title: o.course_title, buyer: maskName(o.name), buyer_email: maskEmail(o.email), amount: o.amount, method: o.method, status: o.status, commission: m ? m.amount : 0, commission_status: m ? commStatus(m) : '', release_at: m ? m.release_at : 0 };
      });
      tot.revenue = round2(tot.revenue); tot.commission = round2(tot.commission);
      var pays = T('Payouts').where(function (p) { return p.aff_id === u.id; }).sort(function (a, b) { return b.created_at - a.created_at; });
      return { sales: out, totals: tot, payouts: pays.map(function (p) { return { id: p.id, at: p.created_at, amount: p.amount, count: p.count, note: p.note }; }) };
    };

    A.affSettings = function (req) {
      var u = auth(req, 'affiliate'), patch = {};
      if (req.pix_key != null) patch.pix_key = trim(req.pix_key).slice(0, 120);
      if (req.instagram != null) patch.instagram = trim(req.instagram).replace(/^@/, '').slice(0, 60);
      if (req.name != null && trim(req.name).length >= 2) patch.name = trim(req.name).slice(0, 120);
      u = T('Users').update(u.id, patch);
      return { profile: { name: u.name, email: u.email, aff_code: u.aff_code, pix_key: u.pix_key, instagram: u.instagram } };
    };

    A.affPixel = function (req) {
      var u = auth(req, 'affiliate'), a = T('Affiliations').get(trim(req.affiliation_id));
      need(a && a.user_id === u.id, 'Afiliação não encontrada.', 'NOT_FOUND');
      var px = digits(req.pixel_id);
      need(!px || (px.length >= 10 && px.length <= 20), 'O ID do Pixel tem entre 10 e 20 números.');
      T('Affiliations').update(a.id, { pixel_id: px });
      return { pixel_id: px };
    };

    /* ----- administrador ----- */
    function adminCourseView(c, I) {
      var o = Object.assign({}, c);
      o.faq = J(c.faq, []); o.testimonials = J(c.testimonials, []); o.lp = J(c.lp, null); o.ads = J(c.ads, null);
      o.bump_preview = bumpOf(c, I);
      o.color = c.color === '' ? '' : Number(c.color);
      o.methods = splitList(c.methods || 'pix,card');
      o.stats = statsOf(c, I);
      o.seasons = (I.seasonsOf[c.id] || []).map(function (s, si) {
        return Object.assign({ n: si + 1 }, s, { lessons: (I.lessonsOf[s.id] || []).map(function (l) { return Object.assign({}, l, { materials: J(l.materials, []) }); }) });
      });
      var site = siteUrl();
      o.links = { lp: site + 'lp.html?c=' + encodeURIComponent(c.slug), checkout: site + 'checkout.html?c=' + encodeURIComponent(c.slug), app: site + 'index.html#/curso/' + encodeURIComponent(c.slug), static: c.lp_static_url };
      return o;
    }

    A.adminDash = function (req) {
      auth(req, 'admin');
      var t = now(), to = Number(req.to) || t, from = Number(req.from) || (to - 29 * DAY), I = idx();
      var orders = T('Orders').all();
      var paid = orders.filter(function (o) { return o.status === 'approved' && o.paid_at >= from && o.paid_at <= to; });
      var refunds = orders.filter(function (o) { return (o.status === 'refunded' || o.status === 'chargeback') && o.updated_at >= from && o.updated_at <= to; });
      var views = T('Clicks').where(function (k) { return k.type === 'view' && k.ts >= from && k.ts <= to; });
      var users = T('Users').all();
      var k = {
        revenue: round2(paid.reduce(function (s, o) { return s + o.amount; }, 0)),
        net: round2(paid.reduce(function (s, o) { return s + (o.net || o.amount) - (o.commission || 0) - (o.seller_commission || 0); }, 0)),
        sales: paid.length, refunds: refunds.length, refunds_value: round2(refunds.reduce(function (s, o) { return s + o.amount; }, 0)),
        students_new: users.filter(function (u) { return hasRole(u, 'student') && u.created_at >= from && u.created_at <= to; }).length,
        students_total: users.filter(function (u) { return hasRole(u, 'student'); }).length,
        active_7d: users.filter(function (u) { return u.last_seen > t - 7 * DAY; }).length,
        lp_views: views.length,
        commissions_open: round2(T('Commissions').where(function (m) { return m.status === 'pending'; }).reduce(function (s, m) { return s + m.amount; }, 0)),
        abandoned_24h: orders.filter(function (o) { return (o.status === 'pending' || o.status === 'expired') && o.created_at > t - DAY; }).length
      };
      k.ticket = k.sales ? round2(k.revenue / k.sales) : 0;
      k.conv = k.lp_views ? Math.round(paid.filter(function (o) { return o.src === 'lp' || o.src === 'page'; }).length / k.lp_views * 1000) / 10 : 0;
      var bumpBase = paid.filter(function (o) { var cc = I.byId[o.course_id]; return !o.parent_order_id && cc && cc.bump_enabled; });
      k.bumps = paid.filter(function (o) { return o.bump_type; }).length;
      k.bump_revenue = round2(paid.reduce(function (s, o) { return s + (o.bump_amount || 0); }, 0));
      k.bump_rate = bumpBase.length ? Math.round(bumpBase.filter(function (o) { return o.bump_type; }).length / bumpBase.length * 1000) / 10 : 0;
      k.upsells = paid.filter(function (o) { return o.parent_order_id; }).length;
      k.upsell_revenue = round2(paid.filter(function (o) { return o.parent_order_id; }).reduce(function (s, o) { return s + o.amount; }, 0));
      k.seller_sales = paid.filter(function (o) { return o.seller_id; }).length;
      k.seller_revenue = round2(paid.filter(function (o) { return o.seller_id; }).reduce(function (s, o) { return s + o.amount; }, 0));
      var nd = Math.min(120, Math.max(1, Math.round((to - from) / DAY) + 1)), series = [], map = {};
      for (var i = nd - 1; i >= 0; i--) { var key = dayKey(to - i * DAY); if (!map[key]) { map[key] = { d: key, label: dayLabel(key), revenue: 0, sales: 0 }; series.push(map[key]); } }
      paid.forEach(function (o) { var s = map[dayKey(o.paid_at)]; if (s) { s.revenue = round2(s.revenue + o.amount); s.sales++; } });
      var bc = {}; paid.forEach(function (o) { bc[o.course_id] = bc[o.course_id] || { course_id: o.course_id, title: o.course_title, revenue: 0, sales: 0 }; bc[o.course_id].revenue = round2(bc[o.course_id].revenue + o.amount); bc[o.course_id].sales++; });
      var ba = {}; paid.forEach(function (o) { if (!o.aff_id) return; ba[o.aff_id] = ba[o.aff_id] || { aff_id: o.aff_id, code: o.aff_code, revenue: 0, sales: 0, commission: 0 }; ba[o.aff_id].revenue = round2(ba[o.aff_id].revenue + o.amount); ba[o.aff_id].sales++; ba[o.aff_id].commission = round2(ba[o.aff_id].commission + (o.commission || 0)); });
      Object.keys(ba).forEach(function (id) { var x = T('Users').get(id); ba[id].name = x ? x.name : ba[id].code; });
      var methods = {}; paid.forEach(function (o) { methods[o.method] = (methods[o.method] || 0) + 1; });
      return {
        from: from, to: to, kpis: k, series: series,
        by_course: Object.keys(bc).map(function (x) { return bc[x]; }).sort(function (a, b) { return b.revenue - a.revenue; }),
        top_affiliates: Object.keys(ba).map(function (x) { return ba[x]; }).sort(function (a, b) { return b.revenue - a.revenue; }).slice(0, 8),
        methods: methods,
        recent: orders.sort(function (a, b) { return b.created_at - a.created_at; }).slice(0, 8).map(function (o) { return { id: o.id, created_at: o.created_at, paid_at: o.paid_at, name: o.name, email: o.email, course_title: o.course_title, amount: o.amount, method: o.method, status: o.status, aff_code: o.aff_code }; }),
        alerts: {
          pending_affiliations: T('Affiliations').where(function (a) { return a.status === 'pending'; }).length,
          unread_messages: T('Messages').where(function (m) { return m.from === 'user' && !m.read_admin; }).length,
          courses_without_lp: I.courses.filter(function (c) { return VISIBLE[c.status] && !c.lp; }).length,
          drafts: I.courses.filter(function (c) { return c.status === 'draft'; }).length,
          leads_unassigned: safe(function () { return T('Leads').where(function (l) { return OPEN[l.status] && !l.seller_id; }).length; }, 'dash') || 0,
          followups_overdue: safe(function () { return T('Leads').where(function (l) { return OPEN[l.status] && l.next_at && l.next_at < t; }).length; }, 'dash') || 0,
          setup: { mp: !!env.secret('MP_ACCESS_TOKEN'), ai: !!env.secret('AI_API_KEY'), site_url: !!cfg().site_url, api_url: !!apiUrl() }
        }
      };
    };

    A.adminCourses = function (req) {
      auth(req, 'admin');
      var I = idx(), orders = T('Orders').where(function (o) { return o.status === 'approved'; }), ens = T('Enrollments').where(activeEnrollment), views = T('Clicks').where(function (k) { return k.type === 'view'; });
      var wait = {}; T('Users').all().forEach(function (u) { list(u).forEach(function (id) { wait[id] = (wait[id] || 0) + 1; }); });
      return {
        courses: I.courses.slice().sort(function (a, b) { return (a.status === 'archived') - (b.status === 'archived') || byOrder(a, b); }).map(function (c) {
          var o = coursePub(c, I, { seasons: false });
          var so = orders.filter(function (x) { return x.course_id === c.id; });
          o.has_lp = !!c.lp; o.lp_status = c.lp_status; o.lp_updated_at = c.lp_updated_at;
          o.kpis = { students: ens.filter(function (e) { return e.course_id === c.id; }).length, sales: so.length, revenue: round2(so.reduce(function (s, x) { return s + x.amount; }, 0)), views: views.filter(function (k) { return k.course_id === c.id; }).length };
          var seq = I.seq[c.id] || [];
          o.waitlist = wait[c.id] || 0;
          o.videos = { ready: seq.filter(function (l) { return !!trim(l.video_url); }).length, total: seq.length };
          o.released_at = c.released_at || 0;
          return o;
        })
      };
    };

    A.adminCourse = function (req) {
      auth(req, 'admin');
      var I = idx(), c = I.byId[trim(req.id)] || I.bySlug[trim(req.slug)];
      need(c, 'Curso não encontrado.', 'NOT_FOUND');
      return { course: adminCourseView(c, I) };
    };

    var COURSE_EDITABLE = ['slug', 'status', 'order', 'featured', 'title', 'subtitle', 'category', 'tags', 'level', 'short_desc', 'description', 'banner', 'poster', 'logo', 'show_title', 'trailer', 'color', 'instructor_name', 'instructor_bio', 'instructor_photo', 'price', 'anchor_price', 'max_installments', 'methods', 'checkout_url', 'guarantee_days', 'access_days', 'pixel_id', 'promise', 'audience', 'pains', 'benefits', 'bonuses', 'faq', 'testimonials', 'cta_text', 'scarcity_until', 'support_url', 'aff_enabled', 'aff_commission', 'aff_auto', 'aff_cookie_days', 'aff_materials', 'seo_title', 'seo_desc', 'bump_enabled', 'bump_type', 'bump_course_id', 'bump_title', 'bump_text', 'bump_price', 'bump_image', 'bump_delivery', 'upsell_enabled', 'upsell_course_id', 'upsell_price', 'upsell_title', 'upsell_text', 'upsell_minutes'];
    A.adminCourseSave = function (req) {
      auth(req, 'admin');
      var d = req.course || {}, conf = cfg(), cur = d.id ? T('Courses').get(d.id) : null;
      need(!d.id || cur, 'Curso não encontrado.', 'NOT_FOUND');
      var patch = {};
      COURSE_EDITABLE.forEach(function (k) { if (d[k] !== undefined) patch[k] = d[k]; });
      if (patch.title !== undefined) need(trim(patch.title).length >= 2, 'Dê um título ao curso.');
      if (!cur) need(trim(d.title).length >= 2, 'Dê um título ao curso.');
      if (Array.isArray(patch.methods)) patch.methods = patch.methods.join(',');
      if (Array.isArray(patch.tags)) patch.tags = patch.tags.join(',');
      ['audience', 'pains', 'benefits'].forEach(function (k) { if (Array.isArray(patch[k])) patch[k] = patch[k].join('\n'); });
      if (Array.isArray(patch.faq)) patch.faq = JSON.stringify(patch.faq.filter(function (x) { return x && trim(x.q) && trim(x.a); }));
      if (Array.isArray(patch.testimonials)) patch.testimonials = JSON.stringify(patch.testimonials.filter(function (x) { return x && trim(x.text); }));
      if (patch.price !== undefined) { patch.price = round2(patch.price); need(patch.price >= 0, 'O preço não pode ser negativo.'); }
      if (patch.anchor_price !== undefined) patch.anchor_price = round2(Math.max(0, Number(patch.anchor_price) || 0));
      if (patch.aff_commission !== undefined) patch.aff_commission = clamp(patch.aff_commission, 0, 90);
      if (patch.max_installments !== undefined) patch.max_installments = clamp(patch.max_installments, 1, 12);
      if (patch.guarantee_days !== undefined) patch.guarantee_days = clamp(patch.guarantee_days, 0, 60);
      if (patch.access_days !== undefined) patch.access_days = clamp(patch.access_days, 0, 3650);
      if (patch.pixel_id !== undefined) patch.pixel_id = digits(patch.pixel_id);
      if (patch.status !== undefined && !{ draft: 1, published: 1, coming_soon: 1, archived: 1 }[patch.status]) patch.status = 'draft';
      if (patch.slug !== undefined || !cur) {
        var base = slugify(patch.slug || d.title), slug = base, n = 1;
        while (T('Courses').find(function (x) { return x.slug === slug && (!cur || x.id !== cur.id); })) { n++; slug = base + '-' + n; }
        patch.slug = slug;
      }
      if (patch.bump_price !== undefined) patch.bump_price = round2(Math.max(0, Number(patch.bump_price) || 0));
      if (patch.upsell_price !== undefined) patch.upsell_price = round2(Math.max(0, Number(patch.upsell_price) || 0));
      if (patch.upsell_minutes !== undefined) patch.upsell_minutes = clamp(patch.upsell_minutes || 15, 5, 1440);
      if (patch.bump_type !== undefined) patch.bump_type = patch.bump_type === 'product' ? 'product' : 'course';
      var merged = Object.assign({}, cur || {}, patch);
      if (merged.bump_enabled === true || merged.bump_enabled === 'true') {
        if (merged.bump_type === 'product') { need(trim(merged.bump_title), 'Dê um nome ao produto do order bump.'); need(Number(merged.bump_price) > 0, 'Informe o preço do order bump.'); }
        else need(merged.bump_course_id && (!cur || merged.bump_course_id !== cur.id) && T('Courses').get(merged.bump_course_id), 'Escolha o curso oferecido no order bump (diferente deste).');
      }
      if (merged.upsell_enabled === true || merged.upsell_enabled === 'true') need(merged.upsell_course_id && (!cur || merged.upsell_course_id !== cur.id) && T('Courses').get(merged.upsell_course_id), 'Escolha o curso da oferta pós-compra (diferente deste).');
      // primeira vez publicado: marca a estreia (avisa quem pediu "Avise-me")
      if (patch.status === 'published' && (!cur || cur.status !== 'published') && !(cur && cur.released_at)) patch.released_at = now();
      var saved;
      if (cur) saved = T('Courses').update(cur.id, patch);
      else {
        var maxOrder = T('Courses').all().reduce(function (m, x) { return Math.max(m, x.order); }, 0);
        saved = T('Courses').insert(Object.assign({
          status: 'draft', order: maxOrder + 1, featured: false, show_title: true, color: Math.floor(Math.random() * 6),
          max_installments: conf.max_installments, methods: 'pix,card', guarantee_days: 7, access_days: 0,
          aff_enabled: false, aff_commission: conf.aff_default_commission, aff_auto: false, aff_cookie_days: conf.aff_default_cookie_days, lp_status: ''
        }, patch));
      }
      return { course: adminCourseView(saved, idx()) };
    };

    A.adminCourseDelete = function (req) {
      auth(req, 'admin');
      var c = T('Courses').get(trim(req.id)); need(c, 'Curso não encontrado.', 'NOT_FOUND');
      T('Courses').update(c.id, { status: 'archived', featured: false });
      return { archived: true };
    };

    A.adminSeasonSave = function (req) {
      auth(req, 'admin');
      var s = req.season || {}, c = T('Courses').get(trim(s.course_id));
      need(c, 'Curso não encontrado.', 'NOT_FOUND');
      need(trim(s.title), 'Dê um nome à temporada.');
      var patch = { course_id: c.id, title: trim(s.title).slice(0, 120), description: String(s.description || '').slice(0, 2000), release_mode: { now: 1, days: 1, date: 1 }[s.release_mode] ? s.release_mode : 'now', release_days: clamp(s.release_days || 0, 0, 3650), release_at: Number(s.release_at) || 0 };
      var saved;
      if (s.id) { need(T('Seasons').get(s.id), 'Temporada não encontrada.', 'NOT_FOUND'); saved = T('Seasons').update(s.id, patch); }
      else {
        var mx = T('Seasons').where(function (x) { return x.course_id === c.id; }).reduce(function (m, x) { return Math.max(m, x.order); }, 0);
        saved = T('Seasons').insert(Object.assign({ order: mx + 1 }, patch));
      }
      return { season: saved, course: adminCourseView(T('Courses').get(c.id), idx()) };
    };

    A.adminSeasonDelete = function (req) {
      auth(req, 'admin');
      var s = T('Seasons').get(trim(req.id)); need(s, 'Temporada não encontrada.', 'NOT_FOUND');
      T('Lessons').where(function (l) { return l.season_id === s.id; }).forEach(function (l) { T('Lessons').remove(l.id); });
      T('Seasons').remove(s.id);
      return { course: adminCourseView(T('Courses').get(s.course_id), idx()) };
    };

    A.adminLessonSave = function (req) {
      auth(req, 'admin');
      var l = req.lesson || {}, s = T('Seasons').get(trim(l.season_id));
      need(s, 'Escolha a temporada da aula.', 'NOT_FOUND');
      need(trim(l.title), 'Dê um título à aula.');
      var video = trim(l.video_url), thumb = trim(l.thumb);
      var yt = video.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
      if (!thumb && yt) thumb = 'https://img.youtube.com/vi/' + yt[1] + '/hqdefault.jpg';
      var mats = Array.isArray(l.materials) ? l.materials.filter(function (m) { return m && trim(m.url); }).map(function (m) { return { name: trim(m.name) || 'Material', url: trim(m.url) }; }) : J(l.materials, []);
      var patch = { course_id: s.course_id, season_id: s.id, title: trim(l.title).slice(0, 160), description: String(l.description || '').slice(0, 4000), video_url: video, duration_min: clamp(l.duration_min || 0, 0, 1000), thumb: thumb, materials: JSON.stringify(mats), free_preview: !!l.free_preview, xp: clamp(l.xp || 50, 0, 1000) };
      var saved;
      if (l.id) { need(T('Lessons').get(l.id), 'Aula não encontrada.', 'NOT_FOUND'); saved = T('Lessons').update(l.id, patch); }
      else {
        var mx = T('Lessons').where(function (x) { return x.season_id === s.id; }).reduce(function (m, x) { return Math.max(m, x.order); }, 0);
        saved = T('Lessons').insert(Object.assign({ order: mx + 1 }, patch));
      }
      return { lesson: Object.assign({}, saved, { materials: mats }), course: adminCourseView(T('Courses').get(s.course_id), idx()) };
    };

    A.adminLessonDelete = function (req) {
      auth(req, 'admin');
      var l = T('Lessons').get(trim(req.id)); need(l, 'Aula não encontrada.', 'NOT_FOUND');
      T('Lessons').remove(l.id);
      return { course: adminCourseView(T('Courses').get(l.course_id), idx()) };
    };

    A.adminReorder = function (req) {
      auth(req, 'admin');
      var tbl = { Seasons: 1, Lessons: 1, Courses: 1 }[req.table] ? req.table : '';
      need(tbl && Array.isArray(req.ids), 'Pedido inválido.');
      req.ids.forEach(function (id, i) { if (T(tbl).get(id)) T(tbl).update(id, { order: i + 1 }); });
      return { ok: true };
    };

    A.adminLPGenerate = function (req) {
      auth(req, 'admin');
      var I = idx(), c = I.byId[trim(req.course_id)];
      need(c, 'Curso não encontrado.', 'NOT_FOUND');
      var tpl = lpTemplate(c, I), cur = J(c.lp, null), section = trim(req.section), lp, source = 'ai', warning = '';
      need(!section || LP_SECTIONS.indexOf(section) > -1, 'Seção desconhecida.');
      try {
        if (section) {
          var g = aiCall(c, I, [section], req.instructions);
          lp = Object.assign({}, cur || tpl);
          lp = mergeLP(lp, g);
        } else {
          var g1 = aiCall(c, I, ['seo', 'hero', 'pain', 'promise', 'modules', 'audience'], req.instructions);
          var g2 = aiCall(c, I, ['instructor', 'bonuses', 'offer', 'guarantee', 'faq', 'final_cta'], req.instructions);
          lp = mergeLP(tpl, Object.assign({}, g1, g2));
        }
      } catch (e) {
        source = 'template';
        warning = /configur|chave|key/i.test(String(e.message)) ? 'A IA não está configurada. Usei o modelo padrão; adicione a chave em Configurações.' : 'A IA não respondeu (' + String(e.message).slice(0, 120) + '). Usei o modelo padrão.';
        env.log('warn', 'ia', String(e.message || e), { course: c.id });
        lp = section ? (cur || tpl) : tpl;
      }
      lp.meta = { source: source, model: source === 'ai' ? (env.isDemo ? 'demonstração' : cfg().ai_model) : '', generated_at: now() };
      T('Courses').update(c.id, { lp: JSON.stringify(lp), lp_status: 'generated', lp_updated_at: now() });
      return { lp: lp, source: source, warning: warning };
    };

    A.adminLPSave = function (req) {
      auth(req, 'admin');
      var c = T('Courses').get(trim(req.course_id)); need(c, 'Curso não encontrado.', 'NOT_FOUND');
      var lp = J(req.lp, null);
      need(lp && typeof lp === 'object' && lp.hero, 'Conteúdo da página inválido.');
      lp.meta = Object.assign({}, lp.meta || {}, { edited_at: now() });
      T('Courses').update(c.id, { lp: JSON.stringify(lp), lp_status: 'reviewed', lp_updated_at: now() });
      return { lp: lp };
    };

    A.adminLPReset = function (req) {
      auth(req, 'admin');
      var c = T('Courses').get(trim(req.course_id)); need(c, 'Curso não encontrado.', 'NOT_FOUND');
      T('Courses').update(c.id, { lp: '', lp_status: '', lp_updated_at: now() });
      return { lp: lpTemplate(T('Courses').get(c.id), idx()) };
    };

    A.adminLPPublish = function (req) {
      auth(req, 'admin');
      var I = idx(), c = I.byId[trim(req.course_id)]; need(c, 'Curso não encontrado.', 'NOT_FOUND');
      need(c.status === 'published' || c.status === 'coming_soon', 'Publique o curso antes de gerar a página estática.');
      need(cfg().github_repo && env.secret('GITHUB_TOKEN'), 'Configure o repositório e o token do GitHub em Configurações.');
      var html = staticLP(landingFor(c, ''));
      var url;
      try { url = env.github('c/' + c.slug + '/index.html', html, 'Página de vendas: ' + c.title); }
      catch (e) { throw err('O GitHub recusou a publicação: ' + String(e.message).slice(0, 160), 'GITHUB'); }
      url = url || siteUrl() + 'c/' + c.slug + '/';
      T('Courses').update(c.id, { lp_static_url: url });
      return { url: url };
    };

    A.adminAdsGenerate = function (req) {
      auth(req, 'admin');
      var I = idx(), c = I.byId[trim(req.course_id)];
      need(c, 'Curso não encontrado.', 'NOT_FOUND');
      var base = adsTemplate(c, I), ads = base, source = 'template', warning = '';
      try {
        var got = aiAds(c, I, base, req.instructions), used = 0;
        ads = base.map(function (b, i) {
          var g = got.filter(function (x) { return x && slugify(x.angle || '') === b.angle; })[0] || got[i];
          if (!g || !trim(g.hook)) return b;
          used++;
          var m = Object.assign({}, b);
          ['kicker', 'sub', 'cta', 'primary', 'headline', 'description'].forEach(function (k) { if (trim(g[k])) m[k] = g[k]; });
          if (b.layout !== 'quote') m.hook = g.hook; // depoimento é sempre o texto real
          if ((b.layout === 'list' || b.layout === 'versus') && Array.isArray(g.bullets) && g.bullets.length) m.bullets = g.bullets;
          if (b.layout === 'versus' && Array.isArray(g.before) && g.before.length) m.before = g.before;
          return cleanAd(m);
        });
        if (used) source = 'ai';
        else if (!env.isDemo) warning = 'A IA não devolveu anúncios utilizáveis. Usei o modelo padrão.';
      } catch (e) {
        warning = /configur|chave|key/i.test(String(e.message)) ? 'A IA não está configurada. Usei o modelo padrão; adicione a chave em Configurações.' : 'A IA não respondeu (' + String(e.message).slice(0, 120) + '). Usei o modelo padrão.';
        env.log('warn', 'ia-ads', String(e.message || e), { course: c.id });
      }
      var pack = { items: ads, meta: { source: source, model: source === 'ai' ? (env.isDemo ? 'demonstração' : cfg().ai_model) : '', generated_at: now() } };
      T('Courses').update(c.id, { ads: JSON.stringify(pack), ads_updated_at: now() });
      return { ads: pack, source: source, warning: warning };
    };

    A.adminAdsSave = function (req) {
      auth(req, 'admin');
      var c = T('Courses').get(trim(req.course_id)); need(c, 'Curso não encontrado.', 'NOT_FOUND');
      var items = J(req.items, null);
      need(Array.isArray(items) && items.length && items.length <= 12, 'Lista de anúncios inválida.');
      var cur = J(c.ads, {}) || {};
      var pack = { items: items.map(cleanAd), meta: Object.assign({}, cur.meta || {}, { edited_at: now() }) };
      T('Courses').update(c.id, { ads: JSON.stringify(pack), ads_updated_at: now() });
      return { ads: pack };
    };

    A.adminAdsReset = function (req) {
      auth(req, 'admin');
      var I = idx(), c = I.byId[trim(req.course_id)]; need(c, 'Curso não encontrado.', 'NOT_FOUND');
      var pack = { items: adsTemplate(c, I), meta: { source: 'template', generated_at: now() } };
      T('Courses').update(c.id, { ads: JSON.stringify(pack), ads_updated_at: now() });
      return { ads: pack };
    };

    A.adminSales = function (req) {
      auth(req, 'admin');
      var from = Number(req.from) || 0, to = Number(req.to) || now() + DAY, q = trim(req.q).toLowerCase(), st = trim(req.status), I = idx(), pm = peopleMap();
      var rows = T('Orders').where(function (o) {
        var at = o.status === 'approved' ? o.paid_at : o.created_at;
        if (at < from || at > to) return false;
        if (req.course_id && o.course_id !== req.course_id) return false;
        if (st === 'abandoned') { if (!(o.status === 'pending' || o.status === 'expired' || o.status === 'failed' || o.status === 'rejected')) return false; }
        else if (st && o.status !== st) return false;
        if (req.method && o.method !== req.method) return false;
        if (req.aff === '__direct') { if (o.aff_id) return false; }
        else if (req.aff && o.aff_code !== String(req.aff).toUpperCase()) return false;
        if (req.seller_id && o.seller_id !== req.seller_id) return false;
        if (req.kind === 'bump' && !o.bump_type) return false;
        if (req.kind === 'upsell' && !o.parent_order_id) return false;
        if (req.kind === 'seller' && !o.seller_id) return false;
        if (q && (o.name + ' ' + o.email + ' ' + o.phone + ' ' + o.id).toLowerCase().indexOf(q) < 0) return false;
        return true;
      }).sort(function (a, b) { return b.created_at - a.created_at; });
      var tot = { approved: 0, gross: 0, net: 0, fees: 0, commissions: 0, seller_commissions: 0, refunded: 0, refunded_value: 0, pending: 0, abandoned: 0, bumps: 0, bump_revenue: 0, upsells: 0, upsell_revenue: 0, seller_sales: 0, seller_revenue: 0 };
      var bumpBase = 0;
      rows.forEach(function (o) {
        if (o.status === 'approved') {
          tot.approved++; tot.gross += o.amount; tot.fees += o.fee; tot.commissions += o.commission; tot.seller_commissions += o.seller_commission || 0;
          tot.net += (o.net || o.amount) - o.commission - (o.seller_commission || 0);
          var cc = I.byId[o.course_id];
          if (!o.parent_order_id && cc && cc.bump_enabled) bumpBase++;
          if (o.bump_type) { tot.bumps++; tot.bump_revenue += o.bump_amount || 0; }
          if (o.parent_order_id) { tot.upsells++; tot.upsell_revenue += o.amount; }
          if (o.seller_id) { tot.seller_sales++; tot.seller_revenue += o.amount; }
        }
        if (o.status === 'refunded' || o.status === 'chargeback') { tot.refunded++; tot.refunded_value += o.amount; }
        if (o.status === 'pending') tot.pending++;
        if (o.status === 'expired' || o.status === 'failed' || o.status === 'rejected') tot.abandoned++;
      });
      Object.keys(tot).forEach(function (k) { tot[k] = round2(tot[k]); });
      tot.ticket = tot.approved ? round2(tot.gross / tot.approved) : 0;
      tot.bump_rate = bumpBase ? Math.round(rows.filter(function (o) { var cc = I.byId[o.course_id]; return o.status === 'approved' && o.bump_type && !o.parent_order_id && cc && cc.bump_enabled; }).length / bumpBase * 1000) / 10 : 0;
      return {
        totals: tot, count: rows.length,
        orders: rows.slice(0, 600).map(function (o) {
          return {
            id: o.id, created_at: o.created_at, paid_at: o.paid_at, status: o.status, status_detail: o.status_detail, course_id: o.course_id, course_title: o.course_title, user_id: o.user_id,
            name: o.name, email: o.email, phone: o.phone, price: o.price, discount: o.discount, coupon: o.coupon, amount: o.amount, method: o.method, installments: o.installments,
            fee: o.fee, net: o.net, aff_code: o.aff_code, commission: o.commission, utm_source: o.utm_source, utm_medium: o.utm_medium, utm_campaign: o.utm_campaign,
            utm_content: o.utm_content, src: o.src, mp_payment_id: o.mp_payment_id, recovery_sent: o.recovery_sent,
            bump_type: o.bump_type, bump_title: o.bump_title, bump_amount: o.bump_amount, parent_order_id: o.parent_order_id, offer_id: o.offer_id,
            seller_id: o.seller_id, seller_name: pm[o.seller_id] ? pm[o.seller_id].name : '', seller_commission: o.seller_commission, banner_id: o.banner_id, card_brand: o.card_brand,
            status_message: o.method === 'card' && o.status === 'rejected' ? cardMessage(o.status_detail) : ''
          };
        })
      };
    };

    A.adminRefund = function (req) {
      auth(req, 'admin');
      var o = T('Orders').get(trim(req.order_id)); need(o, 'Pedido não encontrado.', 'NOT_FOUND');
      need(o.status === 'approved', 'Só é possível reembolsar pedidos aprovados.');
      if (o.amount > 0 && o.mp_payment_id) {
        try { env.pay.refund(o.mp_payment_id); }
        catch (e) { throw err('O Mercado Pago recusou o reembolso: ' + String(e.message).slice(0, 160), 'PAYMENT'); }
      }
      return { order: reverseOrder(o, 'refunded', { status_detail: 'reembolso pelo painel' }) };
    };

    A.adminStudents = function (req) {
      auth(req, 'admin');
      var I = idx(), q = trim(req.q).toLowerCase(), t = now(), inact = clamp(req.inactive_days || 0, 0, 365);
      var ens = T('Enrollments').all(), progAll = T('Progress').all(), orders = T('Orders').where(function (o) { return o.status === 'approved'; });
      var lastContact = {};
      T('Activities').all().forEach(function (a) { if (a.user_id && (a.type === 'wa' || a.type === 'email') && (!lastContact[a.user_id] || a.ts > lastContact[a.user_id].ts)) lastContact[a.user_id] = a; });
      var users = T('Users').where(function (u) {
        var mineE = ens.filter(function (e) { return e.user_id === u.id; });
        if (!hasRole(u, 'student') && !mineE.length) return false;
        if (q && (u.name + ' ' + u.email + ' ' + u.phone).toLowerCase().indexOf(q) < 0) return false;
        if (req.course_id && !mineE.some(function (e) { return e.course_id === req.course_id; })) return false;
        if (inact) { if (!mineE.some(activeEnrollment)) return false; if ((u.last_seen || u.created_at) > t - inact * DAY) return false; }
        return true;
      }).sort(function (a, b) { return inact ? ((a.last_seen || a.created_at) - (b.last_seen || b.created_at)) : (b.created_at - a.created_at); });
      return {
        count: users.length,
        students: users.slice(0, 800).map(function (u) {
          var mine = ens.filter(function (e) { return e.user_id === u.id; }), rows = progAll.filter(function (p) { return p.user_id === u.id; }), cur = null;
          var courses = mine.map(function (e) {
            var c = I.byId[e.course_id], pr = c ? courseProgress(c, I, rows) : { pct: 0, last_at: 0, next_label: '', next_title: '' };
            if (c && activeEnrollment(e) && pr.pct < 100 && (!cur || pr.last_at > cur.last_at)) cur = { course_title: c.title, label: pr.next_label, lesson_title: pr.next_title, pct: pr.pct, last_at: pr.last_at };
            return { enrollment_id: e.id, course_id: e.course_id, title: c ? c.title : '(curso removido)', status: activeEnrollment(e) ? 'active' : (e.status === 'active' ? 'expired' : e.status), source: e.source, created_at: e.created_at, expires_at: e.expires_at, pct: pr.pct };
          });
          var lc = lastContact[u.id], lcd = lc ? (J(lc.data, {}) || {}) : null;
          return {
            id: u.id, name: u.name, email: u.email, phone: u.phone, created_at: u.created_at, last_seen: u.last_seen, status: u.status, roles: splitList(u.roles),
            xp: u.xp, level: levelOf(u.xp), has_password: !!u.pass_hash, aff_code: u.aff_code,
            spent: round2(orders.filter(function (o) { return o.email === u.email; }).reduce(function (s, o) { return s + o.amount; }, 0)),
            days_away: Math.max(0, Math.floor((t - (u.last_seen || u.created_at)) / DAY)),
            current: cur, last_contact: lc ? { ts: lc.ts, type: lc.type, title: lcd.title || '' } : null,
            courses: courses
          };
        })
      };
    };

    A.adminGrant = function (req) {
      auth(req, 'admin');
      var email = normEmail(req.email), c = T('Courses').get(trim(req.course_id));
      need(validEmail(email), 'Informe um e-mail válido.');
      need(c, 'Escolha o curso.', 'NOT_FOUND');
      var r = ensureUser({ email: email, name: trim(req.name) || email.split('@')[0], phone: digits(req.phone) });
      var en = grant(r.user, c, 'manual', '', Number(req.days) || 0);
      if (req.notify !== false) sendWelcome(T('Users').get(r.user.id), c, null);
      return { created: r.created, user: publicUser(T('Users').get(r.user.id)), enrollment: en };
    };

    A.adminRevoke = function (req) {
      auth(req, 'admin');
      var e = T('Enrollments').get(trim(req.enrollment_id)); need(e, 'Matrícula não encontrada.', 'NOT_FOUND');
      return { enrollment: T('Enrollments').update(e.id, { status: 'revoked' }) };
    };

    A.adminUser = function (req) {
      var me = auth(req, 'admin'), u = T('Users').get(trim(req.user_id));
      need(u, 'Pessoa não encontrada.', 'NOT_FOUND');
      var patch = {};
      if (req.status) { need(u.id !== me.id, 'Você não pode bloquear a própria conta.'); patch.status = req.status === 'blocked' ? 'blocked' : 'active'; }
      if (Array.isArray(req.roles)) {
        var roles = req.roles.filter(function (r) { return { student: 1, affiliate: 1, admin: 1, seller: 1 }[r]; });
        if (u.id === me.id && roles.indexOf('admin') < 0) roles.push('admin');
        patch.roles = roles.join(',');
        if (roles.indexOf('affiliate') > -1 && !u.aff_code) patch.aff_code = uniqueAffCode(u.name);
      }
      return { user: publicUser(T('Users').update(u.id, patch)) };
    };

    A.adminResend = function (req) {
      auth(req, 'admin');
      var u = T('Users').get(trim(req.user_id)); need(u, 'Pessoa não encontrada.', 'NOT_FOUND');
      if (!u.pass_hash) {
        var link = linkAccess(u);
        sendTpl('access', u.email, { nome: u.name, primeiro_nome: firstName(u.name) }, link, u.id);
        return { sent: true, kind: 'first_access', link: env.isDemo ? link : '' };
      }
      var code = rand(6, '0123456789');
      T('Users').update(u.id, { reset_code: env.sha256(code + u.salt), reset_exp: now() + 30 * 60000 });
      sendTpl('code', u.email, { nome: u.name, primeiro_nome: firstName(u.name), codigo: code, codigo_html: codeHtml(code) }, '', u.id);
      return { sent: true, kind: 'reset' };
    };

    A.adminAffiliates = function (req) {
      auth(req, 'admin');
      var I = idx(), affs = T('Affiliations').all(), comms = T('Commissions').where(function (m) { return m.kind !== 'seller'; }), orders = T('Orders').where(function (o) { return o.status === 'approved' && o.aff_id; });
      var clicks = T('Clicks').where(function (k) { return k.aff_code && k.type === 'view'; });
      var people = T('Users').where(function (u) { return hasRole(u, 'affiliate'); }).map(function (u) {
        var mine = comms.filter(function (m) { return m.aff_id === u.id; });
        var sum = function (st) { return round2(mine.filter(function (m) { return commStatus(m) === st; }).reduce(function (s, m) { return s + m.amount; }, 0)); };
        var so = orders.filter(function (o) { return o.aff_id === u.id; }), mk = dayKey(now()).slice(0, 7), sm = so.filter(function (o) { return dayKey(o.paid_at).slice(0, 7) === mk; });
        return {
          month_sales: sm.length, month_revenue: round2(sm.reduce(function (s, o) { return s + o.amount; }, 0)), month_commission: round2(sm.reduce(function (s, o) { return s + (o.commission || 0); }, 0)),
          id: u.id, name: u.name, email: u.email, phone: u.phone, aff_code: u.aff_code, pix_key: u.pix_key, instagram: u.instagram, status: u.status, created_at: u.created_at,
          clicks: clicks.filter(function (k) { return k.aff_code === u.aff_code; }).length, sales: so.length, revenue: round2(so.reduce(function (s, o) { return s + o.amount; }, 0)),
          pending: sum('pending'), available: sum('available'), paid: sum('paid'),
          affiliations: affs.filter(function (a) { return a.user_id === u.id; }).map(function (a) { var c = I.byId[a.course_id]; return { id: a.id, course_id: a.course_id, course_title: c ? c.title : '(removido)', status: a.status, commission: a.commission, default_commission: c ? c.aff_commission : 0, created_at: a.created_at }; })
        };
      }).sort(function (a, b) { return b.revenue - a.revenue || b.created_at - a.created_at; });
      var pending = affs.filter(function (a) { return a.status === 'pending'; }).map(function (a) {
        var u = T('Users').get(a.user_id), c = I.byId[a.course_id];
        return { id: a.id, created_at: a.created_at, user: u ? { id: u.id, name: u.name, email: u.email, instagram: u.instagram, aff_code: u.aff_code } : null, course: c ? { id: c.id, title: c.title, aff_commission: c.aff_commission } : null };
      });
      return { affiliates: people, pending: pending, payouts: T('Payouts').all().sort(function (a, b) { return b.created_at - a.created_at; }).slice(0, 50) };
    };

    A.adminAffiliation = function (req) {
      auth(req, 'admin');
      var a = T('Affiliations').get(trim(req.id)); need(a, 'Afiliação não encontrada.', 'NOT_FOUND');
      var patch = {};
      if (req.status) patch.status = { pending: 1, approved: 1, rejected: 1, blocked: 1 }[req.status] ? req.status : a.status;
      if (req.commission != null && req.commission !== '') patch.commission = clamp(req.commission, 0, 90);
      var saved = T('Affiliations').update(a.id, patch);
      if (patch.status && patch.status !== a.status && (patch.status === 'approved' || patch.status === 'rejected')) safe(function () {
        var u = T('Users').get(a.user_id), c = T('Courses').get(a.course_id);
        sendTpl(patch.status === 'approved' ? 'aff_approved' : 'aff_rejected', u.email, { nome: u.name, primeiro_nome: firstName(u.name), curso: c.title }, siteUrl() + 'afiliado.html', u.id);
      }, 'mail-aff-status');
      return { affiliation: saved };
    };

    A.adminPayout = function (req) {
      auth(req, 'admin');
      var u = T('Users').get(trim(req.aff_id)); need(u, 'Afiliado não encontrado.', 'NOT_FOUND');
      var open = T('Commissions').where(function (m) { return m.aff_id === u.id && commStatus(m) === 'available' && (!req.ids || req.ids.indexOf(m.id) > -1); });
      need(open.length, 'Não há comissões liberadas para pagar.');
      var amount = round2(open.reduce(function (s, m) { return s + m.amount; }, 0));
      var p = T('Payouts').insert({ aff_id: u.id, amount: amount, count: open.length, pix_key: u.pix_key, note: trim(req.note).slice(0, 300) });
      open.forEach(function (m) { T('Commissions').update(m.id, { status: 'paid', paid_at: now(), payout_id: p.id }); });
      sendTpl('payout', u.email, { nome: u.name, primeiro_nome: firstName(u.name), valor: money(amount), quantidade: String(open.length) }, siteUrl() + (hasRole(u, 'seller') && !hasRole(u, 'affiliate') ? 'comercial.html' : 'afiliado.html'), u.id);
      return { payout: p };
    };

    A.adminCoupons = function (req) {
      auth(req, 'admin');
      var I = idx();
      return { coupons: T('Coupons').all().sort(function (a, b) { return b.created_at - a.created_at; }).map(function (q) { var c = I.byId[q.course_id]; return Object.assign({ course_title: c ? c.title : 'Todos os cursos' }, q); }) };
    };
    A.adminCouponSave = function (req) {
      auth(req, 'admin');
      var q = req.coupon || {}, code = trim(q.code).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      need(code.length >= 3, 'O código precisa ter pelo menos 3 letras ou números.');
      need(!T('Coupons').find(function (x) { return x.code.toUpperCase() === code && x.id !== q.id; }), 'Já existe um cupom com este código.');
      var patch = { code: code, course_id: trim(q.course_id), type: q.type === 'fixed' ? 'fixed' : 'percent', value: Math.max(0, Number(q.value) || 0), max_uses: Math.max(0, Number(q.max_uses) || 0), expires_at: Number(q.expires_at) || 0, active: q.active !== false, aff_code: trim(q.aff_code).toUpperCase() };
      need(patch.value > 0, 'Informe o valor do desconto.');
      if (patch.type === 'percent') need(patch.value <= 100, 'O desconto em porcentagem vai até 100.');
      return { coupon: q.id ? T('Coupons').update(q.id, patch) : T('Coupons').insert(Object.assign({ uses: 0 }, patch)) };
    };
    A.adminCouponDelete = function (req) {
      auth(req, 'admin');
      need(T('Coupons').get(trim(req.id)), 'Cupom não encontrado.', 'NOT_FOUND');
      T('Coupons').remove(trim(req.id));
      return { ok: true };
    };

    A.adminInbox = function (req) {
      auth(req, 'admin');
      var threads = {};
      T('Messages').all().forEach(function (m) {
        var t = threads[m.thread] = threads[m.thread] || { user_id: m.thread, last: null, unread: 0, count: 0 };
        t.count++;
        if (!t.last || m.ts > t.last.ts) t.last = { text: m.text, ts: m.ts, from: m.from };
        if (m.from === 'user' && !m.read_admin) t.unread++;
      });
      return {
        threads: Object.keys(threads).map(function (id) {
          var u = T('Users').get(id), t = threads[id];
          t.user = u ? { id: u.id, name: u.name, email: u.email, roles: splitList(u.roles), aff_code: u.aff_code } : { id: id, name: 'Conta removida', roles: [] };
          return t;
        }).sort(function (a, b) { return b.last.ts - a.last.ts; })
      };
    };
    A.adminThread = function (req) {
      auth(req, 'admin');
      var u = T('Users').get(trim(req.user_id)); need(u, 'Conversa não encontrada.', 'NOT_FOUND');
      var msgs = T('Messages').where(function (m) { return m.thread === u.id; }).sort(function (a, b) { return a.ts - b.ts; });
      msgs.forEach(function (m) { if (m.from === 'user' && !m.read_admin) T('Messages').update(m.id, { read_admin: true }); });
      return { user: { id: u.id, name: u.name, email: u.email, phone: u.phone, roles: splitList(u.roles), aff_code: u.aff_code }, messages: msgs.map(function (m) { return { id: m.id, ts: m.ts, from: m.from === 'admin' ? 'admin' : 'user', text: m.text }; }) };
    };
    A.adminReply = function (req) {
      auth(req, 'admin');
      var u = T('Users').get(trim(req.user_id)); need(u, 'Conversa não encontrada.', 'NOT_FOUND');
      var text = trim(req.text).slice(0, 4000); need(text, 'Escreva a resposta.');
      var m = T('Messages').insert({ thread: u.id, from: 'admin', text: text, read_admin: true, read_user: false });
      if (now() - (u.last_seen || 0) > 30 * 60000) sendTpl('support_reply', u.email, { nome: u.name, primeiro_nome: firstName(u.name), mensagem: text }, siteUrl() + (hasRole(u, 'affiliate') ? 'afiliado.html#/suporte' : 'index.html#/suporte'), u.id);
      return { message: { id: m.id, ts: m.ts, from: 'admin', text: m.text } };
    };

    A.adminSettings = function (req) {
      auth(req, 'admin');
      var sec = {}; SECRET_KEYS.forEach(function (k) { sec[k] = !!env.secret(k); });
      return { config: cfg(), secrets: sec, urls: { api: apiUrl(), webhook: webhookUrl(), site: siteUrl() }, demo: !!env.isDemo, defaults: DEFAULT_CONFIG };
    };
    A.adminSettingsSave = function (req) {
      auth(req, 'admin');
      var inc = req.config || {}, patch = {};
      Object.keys(DEFAULT_CONFIG).forEach(function (k) { if (inc[k] !== undefined) patch[k] = typeof inc[k] === 'object' ? JSON.stringify(inc[k]) : inc[k]; });
      if (patch.site_url) patch.site_url = String(patch.site_url).trim().replace(/\/?$/, '/');
      if (patch.pixel_id !== undefined) patch.pixel_id = digits(patch.pixel_id);
      if (Object.keys(patch).length) env.setConfig(patch);
      var s = req.secrets || {};
      SECRET_KEYS.forEach(function (k) { if (s[k] !== undefined && s[k] !== null && String(s[k]).trim() !== '') env.setSecret(k, String(s[k]).trim()); if (s[k] === '__clear__') env.setSecret(k, ''); });
      cfgCache = null;
      if (env.cache) safe(function () { env.cache.put('catver', String(now()), 21600); });
      return A.adminSettings(req);
    };
    A.adminTest = function (req) {
      var me = auth(req, 'admin'), what = trim(req.what);
      try {
        if (what === 'mp') return { ok: true, info: env.pay.ping() };
        if (what === 'ai') { var t = env.ai('Responda apenas com a palavra OK.', 'Teste de conexão.', 20); return { ok: /ok/i.test(t), info: 'Modelo ' + cfg().ai_model + ' respondeu: ' + String(t).slice(0, 40) }; }
        if (what === 'email') { env.mail(me.email, 'Teste de e-mail · ' + cfg().brand_name, mailLayout('Funcionou.', '<p>Os e-mails da plataforma estão saindo normalmente.</p>')); return { ok: true, info: 'Enviado para ' + me.email }; }
        if (what === 'github') { var url = env.github('c/.teste.txt', 'ok ' + new Date(now()).toISOString(), 'Teste de conexão'); return { ok: true, info: url || 'Repositório acessível.' }; }
      } catch (e) { return { ok: false, info: String(e.message || e).slice(0, 240) }; }
      throw err('Teste desconhecido.');
    };
    A.adminUpload = function (req) {
      auth(req, 'admin');
      var mime = trim(req.mime), data = String(req.data || '');
      need(/^image\/(png|jpe?g|webp|gif)$/.test(mime), 'Envie uma imagem PNG, JPG, WEBP ou GIF.');
      need(data.length > 100 && data.length < 7000000, 'A imagem precisa ter menos de 5 MB.');
      return { url: env.upload(trim(req.name).slice(0, 80) || 'imagem', mime, data) };
    };
    A.adminLogs = function (req) {
      auth(req, 'admin');
      return { logs: T('Logs').all().sort(function (a, b) { return b.ts - a.ts; }).slice(0, clamp(req.limit || 100, 1, 500)) };
    };

    /* =================================================================
       ORDER BUMP, OFERTA PÓS-COMPRA E CONDIÇÃO DO VENDEDOR
       ================================================================= */
    function bumpOf(c, I) {
      if (!c || !c.bump_enabled) return null;
      if (c.bump_type === 'product') {
        if (!trim(c.bump_title) || !(c.bump_price > 0)) return null;
        return { type: 'product', title: c.bump_title, text: c.bump_text, price: round2(c.bump_price), anchor: 0, image: c.bump_image, course: null };
      }
      var bc = I.byId[c.bump_course_id];
      if (!bc || bc.id === c.id || bc.status !== 'published') return null;
      return {
        type: 'course', course_id: bc.id, title: c.bump_title || bc.title, text: c.bump_text || bc.short_desc,
        price: round2(c.bump_price > 0 ? c.bump_price : bc.price), anchor: bc.price, image: c.bump_image || '',
        course: { id: bc.id, slug: bc.slug, title: bc.title, banner: bc.banner, poster: bc.poster, color: bc.color === '' ? '' : Number(bc.color), show_title: bc.show_title }
      };
    }
    function upsellSig(orderId, courseId, exp) { return env.hmac('up|' + orderId + '|' + courseId + '|' + exp, pepper()).slice(0, 32); }
    function upsellFor(o) {
      if (!o || o.status !== 'approved' || o.parent_order_id) return null;
      var I = idx(), c = I.byId[o.course_id];
      if (!c || !c.upsell_enabled) return null;
      var uc = I.byId[c.upsell_course_id];
      if (!uc || uc.status !== 'published' || uc.id === c.id) return null;
      var exp = o.paid_at + Math.max(5, c.upsell_minutes || 15) * 60000;
      if (exp <= now()) return null;
      var u = o.user_id ? T('Users').get(o.user_id) : null;
      if (u && owns(u.id, uc.id)) return null;
      if (T('Orders').find(function (x) { return x.parent_order_id === o.id && x.status === 'approved'; })) return null;
      return {
        from: o.id, sig: upsellSig(o.id, uc.id, exp), expires_at: exp,
        price: round2(c.upsell_price > 0 ? c.upsell_price : uc.price),
        title: c.upsell_title || 'Oferta única para quem acabou de entrar', text: c.upsell_text || uc.short_desc,
        course: coursePub(uc, I, { seasons: false }), email: o.email, name: o.name
      };
    }
    function offerLink(of, c) { return siteUrl() + 'checkout.html?c=' + encodeURIComponent(c.slug) + '&oferta=' + of.code; }
    function offerPub(of, I) {
      var c = I.byId[of.course_id];
      return {
        id: of.id, code: of.code, created_at: of.created_at, course_id: of.course_id, course_title: c ? c.title : '', lead_id: of.lead_id,
        price: of.price, normal_price: c ? c.price : 0, expires_at: of.expires_at, uses: of.uses, max_uses: of.max_uses, email: of.email,
        order_id: of.order_id, seller_id: of.seller_id, link: c ? offerLink(of, c) : '',
        status: of.order_id ? 'used' : (of.expires_at && of.expires_at <= now() ? 'expired' : 'active')
      };
    }
    function findOffer(code, course) {
      code = trim(code).toUpperCase();
      if (!code) return { error: 'Condição especial não encontrada.' };
      var of = T('Offers').find(function (x) { return x.code === code; });
      if (!of) return { error: 'Condição especial não encontrada. Confira o link.' };
      if (course && of.course_id !== course.id) return { error: 'Esta condição especial é de outro curso.' };
      if (of.order_id && of.max_uses && of.uses >= of.max_uses) return { error: 'Esta condição especial já foi usada.' };
      if (of.expires_at && of.expires_at <= now()) return { error: 'Esta condição especial expirou. Fale com quem te enviou o link.' };
      return { offer: of };
    }
    function cardMessage(d) {
      d = String(d || '');
      return CARD_MSG[d] || (d.indexOf('cc_rejected') === 0 || d.indexOf('rejected') > -1 ? 'O banco recusou o pagamento. Tente outro cartão ou o Pix.' : 'Pagamento em processamento.');
    }
    function recoveryLink(o) {
      var c = idx().byId[o.course_id];
      if (!c) return siteUrl();
      return siteUrl() + 'checkout.html?c=' + encodeURIComponent(c.slug) + '&email=' + encodeURIComponent(o.email) +
        (o.aff_code ? '&ref=' + encodeURIComponent(o.aff_code) : '') + (o.coupon ? '&cupom=' + encodeURIComponent(o.coupon) : '');
    }

    /* =================================================================
       MODELOS DE MENSAGEM (e-mail e WhatsApp)
       ================================================================= */
    function tplRows() { try { return T('Templates').all(); } catch (e) { return []; } }
    function tplGet(channel, key) {
      var def = null, i;
      for (i = 0; i < DEFAULT_TEMPLATES.length; i++) if (DEFAULT_TEMPLATES[i].channel === channel && DEFAULT_TEMPLATES[i].key === key) def = DEFAULT_TEMPLATES[i];
      var row = tplRows().filter(function (r) { return r.channel === channel && r.key === key; })[0];
      if (!row && !def) return null;
      var out = Object.assign({ active: true, order: 100 }, def || {});
      if (row) {
        ['title', 'subject', 'heading', 'body', 'cta', 'audience'].forEach(function (k) { if (row[k] !== '' || !def) out[k] = row[k]; });
        out.active = row.active; out.id = row.id; out.order = row.order || out.order; out.custom = true; out.updated_at = row.updated_at;
      }
      out.channel = channel; out.key = key; out.is_default = !!def;
      return out;
    }
    function tplList(channel, audience) {
      var keys = {}, out = [];
      DEFAULT_TEMPLATES.forEach(function (d) { if (d.channel === channel && (!audience || d.audience === audience)) keys[d.key] = 1; });
      tplRows().forEach(function (r) { if (r.channel === channel && (!audience || r.audience === audience)) keys[r.key] = 1; });
      Object.keys(keys).forEach(function (k) { var t = tplGet(channel, k); if (t) out.push(t); });
      return out.sort(function (a, b) { return (a.order || 0) - (b.order || 0) || String(a.title).localeCompare(String(b.title)); });
    }
    function fillPlain(text, vars) {
      return String(text == null ? '' : text).replace(/\{(\w+)\}/g, function (m, k) {
        return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k] == null ? '' : vars[k]) : m;
      });
    }
    function mdHtml(text, vars) {
      var s = esc(String(text || '')).replace(/\{(\w+)\}/g, function (m, k) {
        if (!Object.prototype.hasOwnProperty.call(vars, k)) return m;
        return /_html$/.test(k) ? String(vars[k]) : esc(vars[k] == null ? '' : vars[k]);
      });
      s = s.replace(/\*\*([^*\n](?:[^*\n]|\*(?!\*))*?)\*\*/g, '<strong style="color:#f0e6d2">$1</strong>');
      return s.split(/\n{2,}/).map(function (p) { return p.trim() ? '<p style="margin:0 0 14px">' + p.replace(/\n/g, '<br>') + '</p>' : ''; }).join('');
    }
    function baseVars() {
      var c = cfg(), site = siteUrl();
      return { marca: c.brand_name, suporte_whatsapp: c.support_whatsapp, suporte_email: c.support_email, link_app: site + 'index.html', link_afiliacao: site + 'afiliado.html' };
    }
    function sendTpl(key, to, vars, ctaUrl, userId) {
      var t = tplGet('email', key);
      if (!t || !t.active || !to) return false;
      vars = Object.assign(baseVars(), vars || {});
      var cta = ctaUrl && t.cta ? { url: ctaUrl, label: fillPlain(t.cta, vars) } : null;
      return send(to, fillPlain(t.subject, vars), mailLayout(fillPlain(t.heading, vars), mdHtml(t.body, vars), cta), { key: key, user_id: userId });
    }
    function linkAccess(u) {
      var site = siteUrl();
      if (!u.pass_hash) {
        if (!u.first_token) u = T('Users').update(u.id, { first_token: rand(32) });
        return site + 'index.html?primeiro=' + u.first_token;
      }
      return site + 'index.html';
    }
    function ctxStudent(u) {
      var I = idx(), rows = progressRows(u.id), ens = enrollMap(u.id), v = baseVars();
      v.nome = u.name; v.primeiro_nome = firstName(u.name); v.email = u.email; v.telefone = u.phone;
      v.link_acesso = linkAccess(u);
      v.instrucao_senha = u.pass_hash ? 'Se esqueceu a senha, toque em "Esqueci minha senha" na tela de entrada.' : 'No primeiro acesso você cria a sua senha.';
      var owned = Object.keys(ens).map(function (id) { return I.byId[id]; }).filter(Boolean);
      v.cursos = owned.map(function (c) { return c.title; }).join(', ') || 'os cursos';
      var best = null;
      owned.forEach(function (c) { var p = courseProgress(c, I, rows); if (p.pct < 100 && (!best || p.last_at > best.p.last_at)) best = { c: c, p: p }; });
      if (!best && owned.length) best = { c: owned[0], p: courseProgress(owned[0], I, rows) };
      if (best) {
        var nl = I.lessonById[best.p.next_lesson_id];
        v.curso_atual = best.c.title; v.episodio_atual = nl ? nl.label + ' · ' + nl.title : 'o primeiro episódio';
        v.progresso = best.p.pct + '%'; v.link_curso_atual = siteUrl() + 'index.html#/curso/' + best.c.slug;
      } else { v.curso_atual = ''; v.episodio_atual = ''; v.progresso = '0%'; v.link_curso_atual = v.link_app; }
      var away = u.last_seen ? Math.max(0, Math.floor((now() - u.last_seen) / DAY)) : 0;
      v.dias_sem_acessar = String(away); v.ultimo_acesso = u.last_seen ? fmtDate(u.last_seen) : 'ainda não acessou';
      return v;
    }
    function affRanking(mk) {
      var counts = {};
      T('Orders').where(function (o) { return o.status === 'approved' && o.aff_id && dayKey(o.paid_at).slice(0, 7) === mk; }).forEach(function (o) { counts[o.aff_id] = (counts[o.aff_id] || 0) + 1; });
      return Object.keys(counts).map(function (id) { return { id: id, sales: counts[id] }; }).sort(function (a, b) { return b.sales - a.sales; });
    }
    function ctxAffiliate(u) {
      var v = baseVars(), t = now(), mk = dayKey(t).slice(0, 7), I = idx();
      v.nome = u.name; v.primeiro_nome = firstName(u.name); v.email = u.email; v.telefone = u.phone;
      v.codigo = u.aff_code; v.chave_pix = u.pix_key || '(sem chave cadastrada)'; v.link_painel = siteUrl() + 'afiliado.html';
      v.mes = MONTHS_FULL[Number(mk.slice(5, 7)) - 1];
      var month = T('Orders').where(function (o) { return o.aff_id === u.id && o.status === 'approved' && dayKey(o.paid_at).slice(0, 7) === mk; });
      var comms = T('Commissions').where(function (m) { return m.aff_id === u.id && m.kind !== 'seller'; });
      var sum = function (st) { return comms.filter(function (m) { return commStatus(m) === st; }).reduce(function (a, m) { return a + m.amount; }, 0); };
      v.vendas_mes = String(month.length);
      v.valor_vendido_mes = money(month.reduce(function (a, o) { return a + o.amount; }, 0));
      v.comissao_mes = money(month.reduce(function (a, o) { return a + (o.commission || 0); }, 0));
      v.comissao_disponivel = money(sum('available')); v.comissao_a_liberar = money(sum('pending')); v.comissao_paga_total = money(sum('paid'));
      v.cliques_mes = String(T('Clicks').where(function (k) { return k.aff_code === u.aff_code && k.type === 'view' && dayKey(k.ts).slice(0, 7) === mk; }).length);
      var rk = affRanking(mk), pos = 0; rk.forEach(function (r, i) { if (r.id === u.id) pos = i + 1; });
      v.ranking_posicao = pos ? pos + 'º lugar' : 'fora do ranking';
      var affs = T('Affiliations').where(function (a) { return a.user_id === u.id && a.status === 'approved'; }).map(function (a) { return I.byId[a.course_id]; }).filter(Boolean);
      v.cursos_afiliados = affs.map(function (c) { return c.title; }).join(', ') || 'nenhum curso ainda';
      v.link_principal = affs[0] ? siteUrl() + 'lp.html?c=' + encodeURIComponent(affs[0].slug) + '&ref=' + encodeURIComponent(u.aff_code) : v.link_painel;
      return v;
    }
    function ctxOrder(o) {
      var v = baseVars(), u = findUserByEmail(o.email);
      v.nome = o.name; v.primeiro_nome = firstName(o.name); v.email = o.email; v.telefone = o.phone;
      v.curso = o.course_title; v.valor = money(o.amount);
      v.metodo = o.method === 'pix' ? 'Pix' : o.method === 'card' ? 'cartão' : o.method === 'free' ? 'acesso grátis' : o.method;
      v.link_recuperacao = recoveryLink(o);
      v.link_acesso = u ? linkAccess(u) : siteUrl() + 'index.html';
      return v;
    }
    function ctxLead(l, seller) {
      var I = idx(), c = I.byId[l.course_id], v = baseVars();
      v.nome = l.name; v.primeiro_nome = firstName(l.name); v.email = l.email; v.telefone = l.phone;
      v.curso = c ? c.title : ''; v.valor = c ? money(c.price) : '';
      v.link_curso = c ? siteUrl() + 'lp.html?c=' + encodeURIComponent(c.slug) : siteUrl();
      v.link_checkout = c ? siteUrl() + 'checkout.html?c=' + encodeURIComponent(c.slug) + (l.email ? '&email=' + encodeURIComponent(l.email) : '') : siteUrl();
      v.vendedor = seller ? firstName(seller.name) : cfg().brand_name;
      v.origem = SOURCE_LABEL[l.source] || '';
      var of = T('Offers').where(function (o) { return o.lead_id === l.id && !o.order_id && o.expires_at > now(); }).sort(function (a, b) { return b.created_at - a.created_at; })[0];
      var oc = of ? I.byId[of.course_id] : null;
      v.valor_oferta = of ? money(of.price) : v.valor;
      v.link_oferta = of && oc ? offerLink(of, oc) : v.link_checkout;
      v.validade = of ? fmtDateTime(of.expires_at) : '';
      v.curso_concluido = ''; v.episodio_atual = ''; v.curso_atual = ''; v.dias_sem_acessar = ''; v.link_acesso = siteUrl() + 'index.html';
      var u = l.user_id ? T('Users').get(l.user_id) : (l.email ? findUserByEmail(l.email) : null);
      if (u) {
        var sv = ctxStudent(u);
        v.episodio_atual = sv.episodio_atual; v.curso_atual = sv.curso_atual; v.dias_sem_acessar = sv.dias_sem_acessar; v.link_acesso = sv.link_acesso;
        var cert = T('Certificates').where(function (x) { return x.user_id === u.id; }).sort(function (a, b) { return b.created_at - a.created_at; })[0];
        if (cert) v.curso_concluido = cert.course_title;
      }
      return v;
    }
    function waTemplates(audience) {
      return tplList('wa', audience).filter(function (t) { return t.active; }).map(function (t) { return { key: t.key, title: t.title, body: t.body }; });
    }

    /* =================================================================
       BANNERS DA ÁREA DO ALUNO
       ================================================================= */
    function bannerVars(b, u, I) {
      var conf = cfg(), c = I.byId[b.course_id] || I.byId[b.audience_course_id] || null, maxAff = 0;
      I.courses.forEach(function (x) { if (x.status === 'published' && x.aff_enabled) maxAff = Math.max(maxAff, x.aff_commission || 0); });
      var pct = b.action === 'affiliate' && c && c.aff_enabled ? c.aff_commission : (maxAff || conf.aff_default_commission);
      return { primeiro_nome: firstName(u.name), curso: c ? c.title : '', preco: c ? money(c.price) : '', comissao: pct + '%', marca: conf.brand_name };
    }
    function bannersFor(u, I, ens) {
      var t = now(), conf = cfg(), isAff = hasRole(u, 'affiliate'), certs = null;
      function done(cid) {
        if (!certs) certs = T('Certificates').where(function (x) { return x.user_id === u.id; });
        return cid ? certs.some(function (x) { return x.course_id === cid; }) : certs.length > 0;
      }
      var rows; try { rows = T('Banners').all(); } catch (e) { return []; }
      return rows.filter(function (b) {
        if (!b.active || (b.starts_at && b.starts_at > t) || (b.ends_at && b.ends_at <= t)) return false;
        var aud = b.audience || 'all', cid = b.audience_course_id;
        if (aud === 'not_affiliate' && (isAff || !conf.affiliate_program)) return false;
        if (aud === 'affiliate' && !isAff) return false;
        if (aud === 'owns' && !ens[cid]) return false;
        if (aud === 'not_owns' && (ens[cid] || !I.byId[cid])) return false;
        if (aud === 'completed' && !done(cid)) return false;
        if (b.action === 'affiliate' && !conf.affiliate_program) return false;
        if (b.action === 'course' || b.action === 'checkout') {
          var c = I.byId[b.course_id];
          if (!c || !VISIBLE[c.status]) return false;
          if (b.action === 'checkout' && (ens[c.id] || c.status !== 'published')) return false;
        }
        return true;
      }).sort(function (a, b) { return (b.priority - a.priority) || (b.created_at - a.created_at); }).map(function (b) {
        var v = bannerVars(b, u, I), c = I.byId[b.course_id];
        return {
          id: b.id, title: fillPlain(b.title, v), text: fillPlain(b.text, v), cta_label: fillPlain(b.cta_label || 'Saiba mais', v),
          action: b.action || 'link', url: b.url, course_id: b.course_id, course_slug: c ? c.slug : '', coupon: b.coupon, image: b.image,
          placement: b.placement || 'home_middle', is_affiliate: isAff
        };
      });
    }

    /* =================================================================
       COMERCIAL (leads, vendedores, condições especiais)
       ================================================================= */
    var OPEN = { 'new': 1, contact: 1, negotiating: 1 };
    function isSeller(u) { return !!(u && hasRole(u, 'seller') && u.status !== 'blocked'); }
    function authCrm(req) {
      var u = auth(req);
      if (!(isSeller(u) || hasRole(u, 'admin'))) throw err('Esta área é só para o time comercial.', 'FORBIDDEN');
      return u;
    }
    function canSee(u, l) { return hasRole(u, 'admin') || l.seller_id === u.id || !l.seller_id; }
    function activity(leadId, userId, actorId, type, text, data) {
      return T('Activities').insert({ lead_id: leadId || '', user_id: userId || '', actor_id: actorId || '', type: type, text: String(text || '').slice(0, 2000), data: data ? JSON.stringify(data) : '' });
    }
    function sellersAll() { return T('Users').where(function (x) { return hasRole(x, 'seller'); }); }
    function peopleMap() { var m = {}; T('Users').all().forEach(function (u) { if (hasRole(u, 'seller') || hasRole(u, 'admin')) m[u.id] = u; }); return m; }
    function pickSeller(leads) {
      if (!cfg().crm_auto_assign) return '';
      var ss = sellersAll().filter(isSeller);
      if (!ss.length) return '';
      var load = {};
      ss.forEach(function (s) { load[s.id] = 0; });
      leads.forEach(function (l) { if (OPEN[l.status] && load[l.seller_id] != null) load[l.seller_id]++; });
      ss.sort(function (a, b) { return (load[a.id] - load[b.id]) || (a.created_at - b.created_at); });
      return ss[0].id;
    }
    function nextCourseFor(c, I, ens) {
      if (c.upsell_enabled && c.upsell_course_id) {
        var u1 = I.byId[c.upsell_course_id];
        if (u1 && u1.status === 'published' && !ens[u1.id]) return u1;
      }
      var list = I.courses.filter(function (x) { return x.status === 'published' && x.price > 0 && !ens[x.id] && x.id !== c.id; }).sort(byOrder);
      return list.filter(function (x) { return x.category && x.category === c.category; })[0] || list[0] || null;
    }
    function leadPub(l, I, pm) {
      var c = I.byId[l.course_id], s = pm[l.seller_id], t = now();
      return {
        id: l.id, created_at: l.created_at, updated_at: l.updated_at, user_id: l.user_id, name: l.name, email: l.email, phone: l.phone,
        source: l.source, source_label: SOURCE_LABEL[l.source] || l.source, course_id: l.course_id, course_title: c ? c.title : '', course_slug: c ? c.slug : '',
        status: l.status, status_label: STATUS_LABEL[l.status] || l.status, seller_id: l.seller_id, seller_name: s ? s.name : '',
        value: l.value, next_at: l.next_at, last_at: l.last_at, lost_reason: l.lost_reason, order_id: l.order_id, note: l.note,
        overdue: !!(OPEN[l.status] && l.next_at && l.next_at < t), due_today: !!(OPEN[l.status] && l.next_at && dayKey(l.next_at) === dayKey(t))
      };
    }
    function syncLeads() {
      var conf = cfg(), t = now(), I = idx(), res = { created: 0, reopened: 0, won: 0 };
      var leads = T('Leads').all(), byRef = {};
      leads.forEach(function (l) { byRef[l.ref] = l; });
      var orders = T('Orders').all(), paid = {};
      orders.forEach(function (o) { if (o.status === 'approved') paid[o.email + '|' + o.course_id] = o; });
      function upsert(ref, data, eventAt) {
        var l = byRef[ref];
        if (!l) {
          data.ref = ref; data.status = 'new'; data.last_at = t; data.seller_id = pickSeller(leads);
          l = T('Leads').insert(data); leads.push(l); byRef[ref] = l;
          activity(l.id, l.user_id, '', 'created', SOURCE_LABEL[data.source] || 'Lead novo');
          if (l.seller_id) activity(l.id, l.user_id, '', 'assign', 'Distribuído automaticamente', { seller_id: l.seller_id });
          res.created++;
        } else if (l.status === 'lost' && eventAt && eventAt > l.updated_at) {
          l = T('Leads').update(l.id, { status: 'new', last_at: t, value: data.value || l.value });
          byRef[ref] = l;
          activity(l.id, l.user_id, '', 'status', 'Reaberto: tentou comprar de novo');
          res.reopened++;
        }
        return l;
      }
      // 1. carrinhos abandonados e Pix não pagos
      orders.forEach(function (o) {
        if (!(o.amount > 0) || o.parent_order_id || t - o.created_at > 15 * DAY) return;
        var stale = (o.status === 'pending' && t - o.created_at > conf.recovery_delay_min * 60000) || o.status === 'expired' || o.status === 'failed' || o.status === 'rejected';
        if (!stale || paid[o.email + '|' + o.course_id]) return;
        var u = findUserByEmail(o.email);
        if (u && owns(u.id, o.course_id)) return;
        upsert('cart:' + o.email + ':' + o.course_id, {
          user_id: u ? u.id : '', name: o.name, email: o.email, phone: o.phone, course_id: o.course_id, value: o.amount, note: '',
          source: o.method === 'pix' && o.status !== 'rejected' ? 'pix_expired' : 'abandoned'
        }, o.created_at);
      });
      // 1b. preencheu o checkout e saiu sem gerar o pagamento
      safe(function () {
        T('Intents').where(function (it) { return !it.done && t - it.ts > conf.recovery_delay_min * 60000; }).forEach(function (it) {
          T('Intents').update(it.id, { done: true });
          if (t - it.ts > 7 * DAY) return;
          var hasOrder = orders.some(function (o) { return o.course_id === it.course_id && ((it.email && o.email === it.email) || (it.phone && o.phone === it.phone)) && o.created_at >= it.ts - 3600e3; });
          if (hasOrder) return;
          var u = it.email ? findUserByEmail(it.email) : null;
          if (u && owns(u.id, it.course_id)) return;
          upsert('cart:' + (it.email || it.phone) + ':' + it.course_id, { user_id: u ? u.id : '', name: it.name || 'Sem nome', email: it.email, phone: it.phone, source: 'abandoned', course_id: it.course_id, value: (I.byId[it.course_id] || {}).price || 0, note: 'Preencheu o checkout e saiu sem gerar o pagamento' }, it.ts);
        });
      }, 'intents');
      // 2. concluiu um curso e ainda não tem o próximo
      T('Certificates').all().forEach(function (x) {
        if (t - x.created_at > 60 * DAY) return;
        var u = T('Users').get(x.user_id), c = I.byId[x.course_id];
        if (!u || !c || u.status === 'blocked') return;
        var target = nextCourseFor(c, I, enrollMap(u.id));
        if (!target) return;
        upsert('upsell:' + u.id + ':' + target.id, { user_id: u.id, name: u.name, email: u.email, phone: u.phone, source: 'upsell', course_id: target.id, value: target.price, note: 'Concluiu ' + c.title });
      });
      // 3. alunos pagantes que pararam no meio
      if (conf.crm_inactive_days > 0) {
        var limit = t - conf.crm_inactive_days * DAY;
        T('Users').where(function (u) { return u.status !== 'blocked' && hasRole(u, 'student') && u.last_seen && u.last_seen < limit && t - u.last_seen < 120 * DAY; }).forEach(function (u) {
          var ens = enrollMap(u.id), paidIds = Object.keys(ens).filter(function (id) { return ens[id].source === 'purchase'; });
          if (!paidIds.length) return;
          var rows = progressRows(u.id), cur = null;
          paidIds.forEach(function (id) { var c = I.byId[id]; if (!c) return; var p = courseProgress(c, I, rows); if (p.pct < 100 && (!cur || p.last_at > cur.p.last_at)) cur = { c: c, p: p }; });
          if (!cur) return;
          upsert('inactive:' + u.id + ':' + dayKey(u.last_seen), { user_id: u.id, name: u.name, email: u.email, phone: u.phone, source: 'inactive', course_id: cur.c.id, value: 0, note: 'Parou em ' + cur.p.pct + '% de ' + cur.c.title });
        });
      }
      // 3b. estreias: quem pediu "Avise-me" recebe o e-mail e vira lead (até 40 por rodada, por causa da cota de e-mail)
      var sentLaunch = 0;
      I.courses.filter(function (c) { return c.status === 'published' && c.released_at && t - c.released_at < 14 * DAY; }).forEach(function (c) {
        T('Users').where(function (u) { return u.status !== 'blocked' && list(u).indexOf(c.id) > -1; }).forEach(function (u) {
          if (sentLaunch >= 40 || byRef['wait:' + u.id + ':' + c.id] || owns(u.id, c.id)) return;
          upsert('wait:' + u.id + ':' + c.id, { user_id: u.id, name: u.name, email: u.email, phone: u.phone, source: 'waitlist', course_id: c.id, value: c.price, note: 'Pediu para ser avisado da estreia' });
          sentLaunch++;
          safe(function () { sendTpl('launch', u.email, { primeiro_nome: firstName(u.name), nome: u.name, curso: c.title, valor: money(c.price) }, siteUrl() + 'index.html#/curso/' + c.slug, u.id); }, 'launch mail');
        });
      });
      // 4. fecha o que já se resolveu sozinho
      leads.forEach(function (l) {
        if (!OPEN[l.status]) return;
        if (l.source === 'inactive') {
          var u = T('Users').get(l.user_id);
          if (u && u.last_seen > l.created_at + 3600e3) { T('Leads').update(l.id, { status: 'won', last_at: t }); activity(l.id, l.user_id, '', 'status', 'Voltou a assistir'); res.won++; }
          return;
        }
        var o = paid[l.email + '|' + l.course_id];
        if (o && o.paid_at >= l.created_at - DAY) {
          T('Leads').update(l.id, { status: 'won', order_id: o.id, value: o.amount, last_at: t });
          activity(l.id, l.user_id, o.seller_id || '', 'sale', 'Comprou ' + o.course_title + ' por ' + money(o.amount), { order_id: o.id });
          res.won++;
        }
      });
      return res;
    }
    function resolveLeadsFor(o) {
      var t = now(), done = {};
      if (o.offer_id) {
        var of = T('Offers').get(o.offer_id);
        if (of) {
          T('Offers').update(of.id, { uses: (of.uses || 0) + 1, order_id: o.id });
          var lo = of.lead_id ? T('Leads').get(of.lead_id) : null;
          if (lo && OPEN[lo.status]) {
            T('Leads').update(lo.id, { status: 'won', order_id: o.id, value: o.amount, last_at: t });
            activity(lo.id, lo.user_id, of.seller_id, 'sale', 'Fechou com a condição especial: ' + o.course_title + ' por ' + money(o.amount), { order_id: o.id });
            done[lo.id] = 1;
          }
        }
      }
      T('Leads').where(function (l) { return OPEN[l.status] && !done[l.id] && l.email && l.email === o.email && l.course_id === o.course_id; }).forEach(function (l) {
        T('Leads').update(l.id, { status: 'won', order_id: o.id, value: o.amount, last_at: t });
        activity(l.id, l.user_id, o.seller_id || '', 'sale', 'Comprou ' + o.course_title + ' por ' + money(o.amount), { order_id: o.id });
      });
    }
    function sendSellerInvite(u) {
      var site = siteUrl(), link;
      if (!u.pass_hash) {
        if (!u.first_token) u = T('Users').update(u.id, { first_token: rand(32) });
        link = site + 'comercial.html?primeiro=' + u.first_token;
      } else link = site + 'comercial.html';
      sendTpl('seller_invite', u.email, {
        nome: u.name, primeiro_nome: firstName(u.name),
        comissao_info: u.seller_commission > 0 ? '\n\nSua comissão é de **' + u.seller_commission + '%** sobre cada venda que você fechar.' : '',
        cta_acesso: u.pass_hash ? 'Entrar na área comercial' : 'Criar senha e começar'
      }, link, u.id);
      return link;
    }
    function sellerPub(s) {
      return { id: s.id, name: s.name, email: s.email, phone: s.phone, status: s.status, pix_key: s.pix_key, seller_commission: s.seller_commission, seller_max_discount: s.seller_max_discount, last_seen: s.last_seen, created_at: s.created_at, has_password: !!s.pass_hash, is_seller: hasRole(s, 'seller') };
    }

    /* ----- ações: modelos de mensagem ----- */
    A.adminTemplates = function (req) {
      auth(req, 'admin');
      return { wa: tplList('wa'), email: tplList('email'), audience_vars: AUDIENCE_VARS, email_vars: EMAIL_VARS, email_labels: EMAIL_LABELS, var_docs: VAR_DOCS };
    };
    A.adminTemplateSave = function (req) {
      auth(req, 'admin');
      var t = req.template || {}, channel = t.channel === 'email' ? 'email' : 'wa', key = trim(t.key);
      need(trim(t.body), 'Escreva o texto da mensagem.');
      if (channel === 'email') { need(EMAIL_LABELS[key], 'Modelo de e-mail desconhecido.'); need(trim(t.subject), 'Informe o assunto do e-mail.'); }
      else {
        need(trim(t.title), 'Dê um nome ao modelo.');
        need({ student: 1, affiliate: 1, lead: 1, order: 1 }[t.audience], 'Escolha para quem é o modelo.');
        if (!key) key = 'custom_' + rand(6);
      }
      var row = T('Templates').find(function (r) { return r.channel === channel && r.key === key; });
      var def = tplGet(channel, key);
      var patch = {
        channel: channel, key: key, audience: channel === 'email' ? 'system' : t.audience,
        title: trim(t.title || (def && def.title)).slice(0, 80), subject: trim(t.subject).slice(0, 200), heading: trim(t.heading).slice(0, 200),
        body: String(t.body).slice(0, 6000), cta: trim(t.cta).slice(0, 60), active: t.active !== false,
        order: Number(t.order) || (row ? row.order : (def ? def.order : 100))
      };
      if (row) T('Templates').update(row.id, patch); else T('Templates').insert(patch);
      return { template: tplGet(channel, key) };
    };
    A.adminTemplateReset = function (req) {
      auth(req, 'admin');
      var channel = req.channel === 'email' ? 'email' : 'wa', key = trim(req.key);
      var row = T('Templates').find(function (r) { return r.channel === channel && r.key === key; });
      if (row) T('Templates').remove(row.id);
      return { template: tplGet(channel, key) };
    };
    A.adminEmailPreview = function (req) {
      auth(req, 'admin');
      var t = req.template || {}, vars = Object.assign(baseVars(), SAMPLE_VARS);
      return { subject: fillPlain(t.subject, vars), html: mailLayout(fillPlain(t.heading, vars), mdHtml(t.body, vars), t.cta ? { url: siteUrl() || 'https://seusite.github.io/', label: fillPlain(t.cta, vars) } : null) };
    };
    A.adminContext = function (req) {
      auth(req, 'admin');
      var kind = trim(req.kind), id = trim(req.id);
      if (kind === 'order') {
        var o = T('Orders').get(id); need(o, 'Pedido não encontrado.', 'NOT_FOUND');
        return { name: o.name, phone: o.phone, email: o.email, user_id: o.user_id, vars: ctxOrder(o), templates: waTemplates('order') };
      }
      var u = T('Users').get(id); need(u, 'Pessoa não encontrada.', 'NOT_FOUND');
      return { name: u.name, phone: u.phone, email: u.email, user_id: u.id, vars: kind === 'affiliate' ? ctxAffiliate(u) : ctxStudent(u), templates: waTemplates(kind === 'affiliate' ? 'affiliate' : 'student') };
    };
    A.adminLogContact = function (req) {
      var me = auth(req, 'admin');
      activity(trim(req.lead_id), trim(req.user_id), me.id, req.channel === 'email' ? 'email' : 'wa', trim(req.text).slice(0, 2000), { template: trim(req.template), title: trim(req.title) });
      return { ok: true };
    };
    A.adminEmailUser = function (req) {
      var me = auth(req, 'admin'), u = T('Users').get(trim(req.user_id));
      need(u, 'Pessoa não encontrada.', 'NOT_FOUND');
      var key = trim(req.key);
      if (key === 'access') return A.adminResend(req);
      need(key === 'inactive', 'Este e-mail não pode ser enviado manualmente.');
      var v = ctxStudent(u), ok = sendTpl('inactive', u.email, v, v.link_curso_atual || v.link_app, u.id);
      activity('', u.id, me.id, 'email', 'Lembrete de inatividade por e-mail', { template: 'inactive' });
      return { sent: ok };
    };
    A.adminUserEmails = function (req) {
      auth(req, 'admin');
      var u = T('Users').get(trim(req.user_id)); need(u, 'Pessoa não encontrada.', 'NOT_FOUND');
      var pm = peopleMap(), emails = [];
      try { emails = T('Emails').where(function (m) { return m.user_id === u.id || m.to === u.email; }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 50); } catch (e) {}
      return {
        emails: emails.map(function (m) { return { id: m.id, ts: m.ts, key: m.key, label: EMAIL_LABELS[m.key] || m.key, subject: m.subject, status: m.status, error: m.error }; }),
        contacts: T('Activities').where(function (a) { return a.user_id === u.id && (a.type === 'wa' || a.type === 'email'); }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 30)
          .map(function (a) { var d = J(a.data, {}) || {}; return { ts: a.ts, type: a.type, title: d.title || '', text: a.text, by: pm[a.actor_id] ? firstName(pm[a.actor_id].name) : '' }; })
      };
    };

    /* ----- ações: banners ----- */
    A.adminBanners = function (req) {
      auth(req, 'admin');
      var I = idx(), orders = T('Orders').where(function (o) { return o.status === 'approved' && o.banner_id; });
      return {
        banners: T('Banners').all().sort(function (a, b) { return (b.priority - a.priority) || (b.created_at - a.created_at); }).map(function (b) {
          var so = orders.filter(function (o) { return o.banner_id === b.id; }), c = I.byId[b.course_id], ac = I.byId[b.audience_course_id];
          return Object.assign({}, b, { course_title: c ? c.title : '', audience_course_title: ac ? ac.title : '', sales: so.length, revenue: round2(so.reduce(function (s, o) { return s + o.amount; }, 0)) });
        })
      };
    };
    A.adminBannerSave = function (req) {
      auth(req, 'admin');
      var b = req.banner || {}, I = idx();
      need(trim(b.title), 'Dê um título ao banner.');
      var action = { link: 1, affiliate: 1, course: 1, checkout: 1 }[b.action] ? b.action : 'link';
      if (action === 'link') need(/^https?:\/\//.test(trim(b.url)), 'Informe o link do botão, começando com https://.');
      if (action === 'course' || action === 'checkout') need(I.byId[trim(b.course_id)], 'Escolha o curso do banner.');
      var aud = { all: 1, not_affiliate: 1, affiliate: 1, owns: 1, not_owns: 1, completed: 1 }[b.audience] ? b.audience : 'all';
      if (aud === 'owns' || aud === 'not_owns') need(I.byId[trim(b.audience_course_id)], 'Escolha o curso que define o público.');
      if (b.coupon) need(T('Coupons').find(function (q) { return q.code.toUpperCase() === trim(b.coupon).toUpperCase(); }), 'Cupom não encontrado. Crie o cupom antes em Cupons.');
      var patch = {
        active: b.active !== false, title: trim(b.title).slice(0, 120), text: String(b.text || '').slice(0, 400), cta_label: trim(b.cta_label).slice(0, 40) || 'Saiba mais',
        action: action, url: trim(b.url), course_id: trim(b.course_id), coupon: trim(b.coupon).toUpperCase(), image: trim(b.image),
        placement: { home_top: 1, home_middle: 1, lesson: 1 }[b.placement] ? b.placement : 'home_middle', audience: aud, audience_course_id: trim(b.audience_course_id),
        starts_at: Number(b.starts_at) || 0, ends_at: Number(b.ends_at) || 0, priority: clamp(b.priority || 0, 0, 100)
      };
      var saved;
      if (b.id) { need(T('Banners').get(b.id), 'Banner não encontrado.', 'NOT_FOUND'); saved = T('Banners').update(b.id, patch); }
      else saved = T('Banners').insert(Object.assign({ clicks: 0 }, patch));
      return { banner: saved };
    };
    A.adminBannerDelete = function (req) {
      auth(req, 'admin');
      need(T('Banners').get(trim(req.id)), 'Banner não encontrado.', 'NOT_FOUND');
      T('Banners').remove(trim(req.id));
      return { ok: true };
    };
    A.bannerClick = function (req) {
      var u = auth(req), b = T('Banners').get(trim(req.id));
      if (!b) return { ok: false };
      if (env.cache) { var k = 'bc:' + b.id + ':' + u.id; if (env.cache.get(k)) return { ok: true, dup: true }; env.cache.put(k, '1', 3600); }
      T('Banners').update(b.id, { clicks: (b.clicks || 0) + 1 });
      return { ok: true };
    };

    /* ----- ações: vendedores (ADM) ----- */
    A.adminSellers = function (req) {
      auth(req, 'admin');
      var t = now(), mk = dayKey(t).slice(0, 7);
      var orders = T('Orders').where(function (o) { return o.status === 'approved' && o.seller_id; });
      var comms = T('Commissions').where(function (m) { return m.kind === 'seller'; }), leads = T('Leads').all();
      return {
        sellers: sellersAll().map(function (s) {
          var so = orders.filter(function (o) { return o.seller_id === s.id; }), sm = so.filter(function (o) { return dayKey(o.paid_at).slice(0, 7) === mk; });
          var mc = comms.filter(function (m) { return m.aff_id === s.id; }), sl = leads.filter(function (l) { return l.seller_id === s.id; });
          var sum = function (st) { return round2(mc.filter(function (m) { return commStatus(m) === st; }).reduce(function (a, m) { return a + m.amount; }, 0)); };
          return Object.assign(sellerPub(s), {
            open_leads: sl.filter(function (l) { return OPEN[l.status]; }).length,
            overdue: sl.filter(function (l) { return OPEN[l.status] && l.next_at && l.next_at < t; }).length,
            won_month: sm.length, revenue_month: round2(sm.reduce(function (a, o) { return a + o.amount; }, 0)),
            revenue_total: round2(so.reduce(function (a, o) { return a + o.amount; }, 0)),
            pending: sum('pending'), available: sum('available'), paid: sum('paid')
          });
        }).sort(function (a, b) { return (b.status === 'active') - (a.status === 'active') || b.revenue_month - a.revenue_month; }),
        unassigned: leads.filter(function (l) { return OPEN[l.status] && !l.seller_id; }).length,
        defaults: { commission: cfg().seller_default_commission, max_discount: cfg().seller_default_max_discount, auto_assign: cfg().crm_auto_assign }
      };
    };
    A.adminSellerSave = function (req) {
      auth(req, 'admin');
      var s = req.seller || {}, conf = cfg(), created = false, u, isNew = !s.id;
      if (s.id) { u = T('Users').get(s.id); need(u, 'Vendedor não encontrado.', 'NOT_FOUND'); }
      else {
        var email = normEmail(s.email);
        need(trim(s.name).length >= 2, 'Informe o nome do vendedor.');
        need(validEmail(email), 'Informe um e-mail válido.');
        u = findUserByEmail(email);
        if (!u) { u = T('Users').insert({ name: trim(s.name).slice(0, 120), email: email, phone: digits(s.phone), roles: 'seller', status: 'active', salt: rand(16), first_token: rand(32), xp: 0 }); created = true; }
      }
      var has = function (v) { return v != null && v !== ''; };
      var patch = {
        roles: withRole(u, 'seller'),
        seller_commission: clamp(has(s.seller_commission) ? s.seller_commission : (has(u.seller_commission) && !isNew ? u.seller_commission : conf.seller_default_commission), 0, 90),
        seller_max_discount: clamp(has(s.seller_max_discount) ? s.seller_max_discount : (!isNew ? u.seller_max_discount : conf.seller_default_max_discount), 0, 100)
      };
      if (trim(s.name).length >= 2) patch.name = trim(s.name).slice(0, 120);
      if (s.phone != null) patch.phone = digits(s.phone);
      if (s.pix_key != null) patch.pix_key = trim(s.pix_key).slice(0, 120);
      if (s.status) patch.status = s.status === 'blocked' ? 'blocked' : 'active';
      u = T('Users').update(u.id, patch);
      var link = isNew ? sendSellerInvite(u) : '';
      return { seller: sellerPub(u), created: created, invite_link: env.isDemo ? link : '' };
    };
    A.adminSellerInvite = function (req) {
      auth(req, 'admin');
      var u = T('Users').get(trim(req.id));
      need(u && hasRole(u, 'seller'), 'Vendedor não encontrado.', 'NOT_FOUND');
      var link = sendSellerInvite(u);
      return { sent: true, invite_link: env.isDemo ? link : '' };
    };

    /* ----- ações: área comercial (vendedor ou ADM) ----- */
    A.crmMe = function (req) {
      var u = authCrm(req), isAdm = hasRole(u, 'admin');
      return {
        me: { id: u.id, name: u.name, email: u.email, phone: u.phone, pix_key: u.pix_key, is_admin: isAdm, is_seller: hasRole(u, 'seller'), commission: u.seller_commission || 0, max_discount: isAdm ? 100 : (u.seller_max_discount || 0) },
        sources: SOURCE_LABEL, statuses: STATUS_LABEL, lost_reasons: LOST_REASONS,
        courses: idx().courses.filter(function (c) { return c.status === 'published'; }).sort(byOrder).map(function (c) { return { id: c.id, title: c.title, slug: c.slug, price: c.price, anchor_price: c.anchor_price, banner: c.banner, poster: c.poster, color: c.color === '' ? '' : Number(c.color), show_title: c.show_title }; }),
        sellers: isAdm ? sellersAll().filter(isSeller).map(function (s) { return { id: s.id, name: s.name }; }) : [],
        templates: waTemplates('lead')
      };
    };
    A.crmBoard = function (req) {
      var u = authCrm(req), I = idx(), isAdm = hasRole(u, 'admin'), pm = peopleMap(), t = now();
      var scope = trim(req.scope) || (isAdm ? 'all' : 'mine'), q = trim(req.q).toLowerCase(), closedDays = clamp(req.closed_days || 30, 1, 365);
      var all = T('Leads').all();
      var list = all.filter(function (l) {
        if (scope === 'queue') { if (l.seller_id) return false; }
        else if (!isAdm || scope === 'mine') { if (l.seller_id !== u.id) return false; }
        if (isAdm && req.seller_id && l.seller_id !== req.seller_id) return false;
        if (!OPEN[l.status] && t - l.updated_at > closedDays * DAY) return false;
        if (req.source && l.source !== req.source) return false;
        if (req.course_id && l.course_id !== req.course_id) return false;
        if (req.overdue && !(OPEN[l.status] && l.next_at && l.next_at < t)) return false;
        if (q && (l.name + ' ' + l.email + ' ' + l.phone).toLowerCase().indexOf(q) < 0) return false;
        return true;
      }).map(function (l) { return leadPub(l, I, pm); });
      list.sort(function (a, b) { return (b.overdue - a.overdue) || ((a.next_at || 9e15) - (b.next_at || 9e15)) || (b.created_at - a.created_at); });
      var mine = all.filter(function (l) { return l.seller_id === u.id && OPEN[l.status]; });
      return {
        leads: list.slice(0, 800),
        counts: {
          queue: all.filter(function (l) { return OPEN[l.status] && !l.seller_id; }).length,
          mine: mine.length,
          overdue: mine.filter(function (l) { return l.next_at && l.next_at < t; }).length,
          today: mine.filter(function (l) { return l.next_at && dayKey(l.next_at) === dayKey(t); }).length
        }
      };
    };
    A.crmLead = function (req) {
      var u = authCrm(req), I = idx(), l = T('Leads').get(trim(req.id)), pm = peopleMap();
      need(l && canSee(u, l), 'Lead não encontrado.', 'NOT_FOUND');
      var pu = l.user_id ? T('Users').get(l.user_id) : (l.email ? findUserByEmail(l.email) : null), person = null;
      if (pu) {
        var ens = enrollMap(pu.id), rows = progressRows(pu.id);
        person = {
          id: pu.id, name: pu.name, email: pu.email, phone: pu.phone, last_seen: pu.last_seen, created_at: pu.created_at, has_password: !!pu.pass_hash, level: levelOf(pu.xp || 0),
          courses: Object.keys(ens).map(function (id) { var c = I.byId[id]; if (!c) return null; var p = courseProgress(c, I, rows); return { id: id, title: c.title, pct: p.pct, source: ens[id].source, next_label: p.next_label }; }).filter(Boolean)
        };
      }
      var orders = l.email ? T('Orders').where(function (o) { return o.email === l.email; }).sort(function (a, b) { return b.created_at - a.created_at; }).slice(0, 15)
        .map(function (o) { return { id: o.id, created_at: o.created_at, paid_at: o.paid_at, course_title: o.course_title, amount: o.amount, method: o.method, status: o.status }; }) : [];
      var acts = T('Activities').where(function (a) { return a.lead_id === l.id || (l.user_id && a.user_id === l.user_id && !a.lead_id); }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 80)
        .map(function (a) { return { id: a.id, ts: a.ts, type: a.type, text: a.text, by: pm[a.actor_id] ? firstName(pm[a.actor_id].name) : '', data: J(a.data, null) }; });
      var offers = T('Offers').where(function (o) { return o.lead_id === l.id; }).sort(function (a, b) { return b.created_at - a.created_at; }).map(function (o) { return offerPub(o, I); });
      var seller = l.seller_id ? T('Users').get(l.seller_id) : u;
      return { lead: leadPub(l, I, pm), person: person, orders: orders, activities: acts, offers: offers, vars: ctxLead(l, seller), templates: waTemplates('lead') };
    };
    A.crmLeadSave = function (req) {
      var u = authCrm(req), isAdm = hasRole(u, 'admin'), d = req.lead || {}, I = idx(), l = null, patch = {};
      if (d.id) {
        l = T('Leads').get(d.id);
        need(l && canSee(u, l), 'Lead não encontrado.', 'NOT_FOUND');
        need(isAdm || l.seller_id === u.id, 'Assuma o lead antes de editar.');
      }
      if (d.name != null) patch.name = trim(d.name).slice(0, 120);
      if (d.email != null) { var e = normEmail(d.email); need(!e || validEmail(e), 'E-mail inválido.'); patch.email = e; }
      if (d.phone != null) patch.phone = digits(d.phone).slice(0, 13);
      if (d.course_id != null) { need(!d.course_id || I.byId[d.course_id], 'Curso não encontrado.'); patch.course_id = d.course_id; }
      if (d.value != null && d.value !== '') patch.value = round2(Math.max(0, Number(d.value) || 0));
      if (d.next_at != null) patch.next_at = Number(d.next_at) || 0;
      if (d.status) {
        need(STATUS_LABEL[d.status], 'Etapa inválida.');
        patch.status = d.status;
        if (d.status === 'lost') { need(trim(d.lost_reason), 'Escolha o motivo da perda.'); patch.lost_reason = trim(d.lost_reason).slice(0, 120); }
      }
      if (isAdm && d.seller_id != null) {
        var ns = d.seller_id ? T('Users').get(d.seller_id) : null;
        need(!d.seller_id || isSeller(ns) || (ns && hasRole(ns, 'admin')), 'Vendedor inválido.');
        patch.seller_id = d.seller_id;
      }
      patch.last_at = now();
      var pm;
      if (!l) {
        need(trim(patch.name || '').length >= 2, 'Informe o nome do lead.');
        need(patch.email || patch.phone, 'Informe o WhatsApp ou o e-mail.');
        var ex = patch.email ? findUserByEmail(patch.email) : null, c0 = I.byId[patch.course_id];
        l = T('Leads').insert(Object.assign({ status: 'new', source: 'manual', ref: 'manual:' + rand(10), user_id: ex ? ex.id : '', seller_id: isAdm ? (patch.seller_id || '') : u.id, value: patch.value || (c0 ? c0.price : 0), note: trim(d.note).slice(0, 2000) }, patch));
        activity(l.id, l.user_id, u.id, 'created', 'Lead cadastrado por ' + firstName(u.name));
      } else {
        var before = l;
        l = T('Leads').update(l.id, patch);
        pm = peopleMap();
        if (patch.status && patch.status !== before.status) activity(l.id, l.user_id, u.id, 'status', STATUS_LABEL[before.status] + ' → ' + STATUS_LABEL[patch.status] + (patch.status === 'lost' ? ': ' + patch.lost_reason : ''));
        if (patch.seller_id != null && patch.seller_id !== before.seller_id) activity(l.id, l.user_id, u.id, 'assign', patch.seller_id ? 'Passado para ' + firstName((pm[patch.seller_id] || {}).name || '') : 'Devolvido para a fila');
        if (patch.next_at && patch.next_at !== before.next_at) activity(l.id, l.user_id, u.id, 'followup', 'Próximo contato marcado para ' + fmtDateTime(patch.next_at));
      }
      return { lead: leadPub(l, I, pm || peopleMap()) };
    };
    A.crmClaim = function (req) {
      var u = authCrm(req), l = T('Leads').get(trim(req.id));
      need(l, 'Lead não encontrado.', 'NOT_FOUND');
      need(!l.seller_id || l.seller_id === u.id || hasRole(u, 'admin'), 'Este lead já tem responsável.');
      l = T('Leads').update(l.id, { seller_id: u.id, last_at: now() });
      activity(l.id, l.user_id, u.id, 'assign', firstName(u.name) + ' assumiu o lead');
      return { lead: leadPub(l, idx(), peopleMap()) };
    };
    A.crmNote = function (req) {
      var u = authCrm(req), l = T('Leads').get(trim(req.id)), text = trim(req.text);
      need(l && canSee(u, l), 'Lead não encontrado.', 'NOT_FOUND');
      need(text, 'Escreva a anotação.');
      T('Leads').update(l.id, { note: text.slice(0, 2000), last_at: now() });
      var a = activity(l.id, l.user_id, u.id, 'note', text);
      return { activity: { id: a.id, ts: a.ts, type: 'note', text: a.text, by: firstName(u.name) } };
    };
    A.crmLog = function (req) {
      var u = authCrm(req), l = T('Leads').get(trim(req.id));
      need(l && canSee(u, l), 'Lead não encontrado.', 'NOT_FOUND');
      activity(l.id, l.user_id, u.id, req.channel === 'email' ? 'email' : 'wa', trim(req.text).slice(0, 2000), { template: trim(req.template), title: trim(req.title) });
      var patch = { last_at: now() };
      if (l.status === 'new') patch.status = 'contact';
      if (!l.seller_id && !hasRole(u, 'admin')) patch.seller_id = u.id;
      l = T('Leads').update(l.id, patch);
      if (patch.status) activity(l.id, l.user_id, u.id, 'status', 'Novo → Em contato');
      return { lead: leadPub(l, idx(), peopleMap()) };
    };
    A.crmOffer = function (req) {
      var u = authCrm(req), I = idx(), isAdm = hasRole(u, 'admin');
      var l = req.lead_id ? T('Leads').get(trim(req.lead_id)) : null;
      if (req.lead_id) need(l && canSee(u, l), 'Lead não encontrado.', 'NOT_FOUND');
      var c = I.byId[trim(req.course_id) || (l ? l.course_id : '')];
      need(c && c.status === 'published', 'Escolha um curso publicado.');
      var price = round2(Number(String(req.price).replace(',', '.')));
      need(price > 0, 'Informe o valor da condição.');
      need(price <= c.price, 'A condição não pode passar do preço normal (' + money(c.price) + ').');
      var disc = c.price > 0 ? (c.price - price) / c.price * 100 : 0, maxD = isAdm ? 100 : (u.seller_max_discount || 0);
      need(disc <= maxD + 0.01, 'Seu limite de desconto é ' + maxD + '%: o menor valor permitido é ' + money(Math.ceil(c.price * (1 - maxD / 100) * 100) / 100) + '.');
      var hours = clamp(req.hours || 48, 1, 720);
      var of = T('Offers').insert({
        code: rand(8, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), seller_id: u.id, lead_id: l ? l.id : '', course_id: c.id,
        email: req.lock_email && l && l.email ? l.email : '', price: price, expires_at: now() + hours * 3600e3, max_uses: 1, uses: 0, order_id: '', note: trim(req.note).slice(0, 200)
      });
      if (l) {
        var patch = { last_at: now() };
        if (OPEN[l.status] && l.status !== 'negotiating') patch.status = 'negotiating';
        if (!l.seller_id) patch.seller_id = u.id;
        var before = l.status;
        l = T('Leads').update(l.id, patch);
        activity(l.id, l.user_id, u.id, 'link', 'Condição especial: ' + c.title + ' por ' + money(price) + ', válida até ' + fmtDateTime(of.expires_at), { offer_id: of.id });
        if (patch.status) activity(l.id, l.user_id, u.id, 'status', STATUS_LABEL[before] + ' → Negociando');
      }
      return { offer: offerPub(of, I), vars: l ? ctxLead(l, u) : null };
    };
    A.crmOfferEmail = function (req) {
      var u = authCrm(req), of = T('Offers').get(trim(req.offer_id));
      need(of && (of.seller_id === u.id || hasRole(u, 'admin')), 'Condição não encontrada.', 'NOT_FOUND');
      var l = of.lead_id ? T('Leads').get(of.lead_id) : null, to = (l && l.email) || of.email, c = idx().byId[of.course_id];
      need(validEmail(to), 'Este lead não tem e-mail cadastrado.');
      var ok = sendTpl('offer', to, { nome: l ? l.name : '', primeiro_nome: firstName(l ? l.name : ''), curso: c.title, valor: money(c.price), valor_oferta: money(of.price), validade: fmtDateTime(of.expires_at), vendedor: firstName(u.name) }, offerLink(of, c), l ? l.user_id : '');
      if (l) activity(l.id, l.user_id, u.id, 'email', 'Condição especial enviada por e-mail', { offer_id: of.id });
      return { sent: ok };
    };
    A.crmOffers = function (req) {
      var u = authCrm(req), I = idx(), isAdm = hasRole(u, 'admin');
      return { offers: T('Offers').where(function (o) { return isAdm ? (!req.seller_id || o.seller_id === req.seller_id) : o.seller_id === u.id; }).sort(function (a, b) { return b.created_at - a.created_at; }).slice(0, 200).map(function (o) { return offerPub(o, I); }) };
    };
    A.crmStats = function (req) {
      var u = authCrm(req), isAdm = hasRole(u, 'admin'), t = now(), days = clamp(req.days || 30, 1, 365), from = t - days * DAY;
      var target = isAdm ? trim(req.seller_id) : u.id;
      var leads = T('Leads').where(function (l) { return !target || l.seller_id === target; });
      var orders = T('Orders').where(function (o) { return o.status === 'approved' && o.seller_id && (!target || o.seller_id === target) && o.paid_at >= from; });
      var comms = T('Commissions').where(function (m) { return m.kind === 'seller' && (!target || m.aff_id === target); });
      var offers = T('Offers').where(function (o) { return (!target || o.seller_id === target) && o.created_at >= from; });
      var won = leads.filter(function (l) { return l.status === 'won' && l.updated_at >= from; }).length;
      var lost = leads.filter(function (l) { return l.status === 'lost' && l.updated_at >= from; }).length;
      var sum = function (st) { return round2(comms.filter(function (m) { return commStatus(m) === st; }).reduce(function (a, m) { return a + m.amount; }, 0)); };
      var revenue = round2(orders.reduce(function (a, o) { return a + o.amount; }, 0));
      var series = [], map = {};
      for (var i = days - 1; i >= 0; i--) { var key = dayKey(t - i * DAY); map[key] = { d: key, label: dayLabel(key), revenue: 0, sales: 0 }; series.push(map[key]); }
      orders.forEach(function (o) { var s = map[dayKey(o.paid_at)]; if (s) { s.revenue = round2(s.revenue + o.amount); s.sales++; } });
      var bySource = {};
      leads.filter(function (l) { return OPEN[l.status]; }).forEach(function (l) { bySource[l.source] = (bySource[l.source] || 0) + 1; });
      var team = {};
      T('Orders').where(function (o) { return o.status === 'approved' && o.seller_id && o.paid_at >= from; }).forEach(function (o) { team[o.seller_id] = team[o.seller_id] || { sales: 0, revenue: 0 }; team[o.seller_id].sales++; team[o.seller_id].revenue = round2(team[o.seller_id].revenue + o.amount); });
      var pm = peopleMap();
      return {
        days: days,
        kpis: {
          open: leads.filter(function (l) { return OPEN[l.status]; }).length,
          overdue: leads.filter(function (l) { return OPEN[l.status] && l.next_at && l.next_at < t; }).length,
          today: leads.filter(function (l) { return OPEN[l.status] && l.next_at && dayKey(l.next_at) === dayKey(t); }).length,
          won: won, lost: lost, conv: won + lost ? Math.round(won / (won + lost) * 1000) / 10 : 0,
          sales: orders.length, revenue: revenue, ticket: orders.length ? round2(revenue / orders.length) : 0,
          commission_pending: sum('pending'), commission_available: sum('available'), commission_paid: sum('paid'),
          offers_sent: offers.length, offers_used: offers.filter(function (o) { return o.order_id; }).length
        },
        series: series, by_source: bySource, sources: SOURCE_LABEL,
        ranking: Object.keys(team).map(function (id) { return { id: id, name: pm[id] ? maskName(pm[id].name) : 'Vendedor', sales: team[id].sales, revenue: team[id].revenue, me: id === u.id }; }).sort(function (a, b) { return b.revenue - a.revenue; }),
        // ADM sem vendedor escolhido: pagamentos de todo o time (com o nome de quem recebeu)
        payouts: T('Payouts').where(function (p) { return target ? p.aff_id === target : isAdm ? !!(pm[p.aff_id] && hasRole(pm[p.aff_id], 'seller')) : p.aff_id === u.id; })
          .sort(function (a, b) { return b.created_at - a.created_at; }).slice(0, 20)
          .map(function (p) { return Object.assign({}, p, { name: pm[p.aff_id] ? pm[p.aff_id].name : '' }); }),
        payouts_team: !!(isAdm && !target)
      };
    };
    A.crmProfile = function (req) {
      var u = authCrm(req), patch = {};
      if (req.pix_key != null) patch.pix_key = trim(req.pix_key).slice(0, 120);
      if (req.phone != null) patch.phone = digits(req.phone).slice(0, 13);
      if (req.name != null && trim(req.name).length >= 2) patch.name = trim(req.name).slice(0, 120);
      u = T('Users').update(u.id, patch);
      return { me: { id: u.id, name: u.name, email: u.email, phone: u.phone, pix_key: u.pix_key } };
    };
    A.crmSync = function (req) {
      authCrm(req);
      if (env.cache) { if (env.cache.get('crmsync')) return { skipped: true }; env.cache.put('crmsync', '1', 60); }
      return syncLeads();
    };

    function seedBanners() {
      if (T('Banners').all().length) return 0;
      T('Banners').insert({ active: true, title: 'Indique e ganhe até {comissao} por venda', text: 'Você já conhece os cursos por dentro. Indique para os amigos e receba comissão por cada venda, direto no Pix.', cta_label: 'Quero ser afiliado', action: 'affiliate', placement: 'home_middle', audience: 'not_affiliate', priority: 10, clicks: 0 });
      return 1;
    }

    /* =================================================================
       entrada
       ================================================================= */
    function handle(req) {
      req = req || {};
      var name = String(req.action || ''), fn = A[name];
      if (!fn || !Object.prototype.hasOwnProperty.call(A, name)) return { ok: false, error: 'Ação desconhecida.', code: 'NOT_FOUND' };
      try { return { ok: true, data: fn(req) }; }
      catch (e) {
        if (e && e.isPublic) return { ok: false, error: e.message, code: e.code, data: e.data };
        env.log('error', name, String((e && e.message) || e), { stack: e && e.stack ? String(e.stack).slice(0, 900) : '' });
        return { ok: false, error: env.isDemo ? 'Erro interno: ' + ((e && e.message) || e) : 'Erro interno. Tente de novo em instantes.', code: 'INTERNAL' };
      }
    }

    function webhook(paymentId) {
      if (!paymentId) return { ok: false };
      var p = env.pay.get(paymentId);
      var o = p && p.external_reference ? T('Orders').get(String(p.external_reference)) : null;
      if (!o) { env.log('info', 'webhook', 'Pagamento sem pedido correspondente', { payment: paymentId }); return { ok: true, ignored: true }; }
      var r = applyPayment(o, p);
      return { ok: true, status: r ? r.status : o.status };
    }

    function hourly() {
      var conf = cfg(), t = now(), res = { checked: 0, approved: 0, recovery: 0 };
      T('Orders').where(function (o) { return (o.status === 'pending' || o.status === 'expired') && t - o.created_at < 3 * DAY; }).forEach(function (o) {
        try {
          var o2 = o.status === 'pending' ? refreshOrder(o) : o;
          res.checked++;
          if (o2.status === 'approved') { res.approved++; return; }
          if (conf.recovery_emails && !o2.recovery_sent && t - o2.created_at > conf.recovery_delay_min * 60000 && (o2.status === 'pending' || o2.status === 'expired')) {
            var bought = T('Orders').find(function (x) { return x.email === o2.email && x.course_id === o2.course_id && x.status === 'approved'; });
            var c = idx().byId[o2.course_id];
            if (!bought && c && c.status === 'published' && !o2.parent_order_id) {
              sendTpl('recovery', o2.email, { nome: o2.name, primeiro_nome: firstName(o2.name), curso: c.title, motivo: o2.method === 'pix' ? ' (o código Pix expira por segurança)' : '' }, recoveryLink(o2), o2.user_id);
              T('Orders').update(o2.id, { recovery_sent: true });
              res.recovery++;
            }
          }
        } catch (e) { env.log('error', 'rotina', String(e.message || e), { order: o.id }); }
      });
      res.crm = safe(syncLeads, 'crm') || {};
      return res;
    }

    // cria (ou promove) o administrador — usado pelo setup() da planilha
    function bootstrapAdmin(email, name, password) {
      email = normEmail(email);
      need(validEmail(email), 'E-mail do administrador inválido.');
      var u = findUserByEmail(email), salt = rand(16);
      var patch = { roles: u ? withRole(withRole(u, 'admin'), 'student') : 'admin,student', status: 'active' };
      if (password) { patch.salt = salt; patch.pass_hash = hashPw(password, salt); }
      if (u) u = T('Users').update(u.id, patch);
      else u = T('Users').insert(Object.assign({ name: name || email.split('@')[0], email: email, xp: 0 }, patch));
      return publicUser(u);
    }

    // curso de exemplo (rascunho) para ver a estrutura na planilha
    /* ---------- catálogo inicial: cria cursos, temporadas e aulas (pula slugs que já existem) ---------- */
    function seedCatalog(cat, opts) {
      opts = opts || {};
      var src = (cat && cat.courses) || cat || [], ins = (cat && cat.instructor) || {}, conf = cfg(), I = idx();
      var have = {}, maxOrder = 0;
      I.courses.forEach(function (c) { have[c.slug] = 1; maxOrder = Math.max(maxOrder, c.order || 0); });
      var courses = [], seasons = [], lessons = [], skipped = [];
      function lines(v) { return Array.isArray(v) ? v.map(trim).filter(Boolean).join('\n') : trim(v); }
      src.forEach(function (k, i) {
        var slug = slugify(k.slug || k.title);
        if (!slug || have[slug]) { skipped.push(slug); return; }
        have[slug] = 1;
        var cid = 'c_' + rand(12), price = round2(Math.max(0, Number(k.price) || 0));
        courses.push(Object.assign({
          id: cid, slug: slug, status: opts.status || 'coming_soon', order: maxOrder + i + 1, featured: !!k.featured,
          title: trim(k.title), subtitle: trim(k.subtitle), category: trim(k.category), tags: Array.isArray(k.tags) ? k.tags.join(', ') : trim(k.tags), level: trim(k.level),
          short_desc: trim(k.short_desc), description: trim(k.description), banner: '', poster: '', logo: '', show_title: true, trailer: '',
          color: k.color === '' || k.color == null ? Math.floor(Math.random() * 6) : clamp(k.color, 0, 5),
          instructor_name: trim(ins.name), instructor_bio: trim(ins.bio), instructor_photo: trim(ins.photo),
          price: price, anchor_price: round2(Math.max(0, Number(k.anchor_price) || 0)), max_installments: conf.max_installments, methods: 'pix,card', checkout_url: '',
          guarantee_days: price > 0 ? 7 : 0, access_days: 0, pixel_id: '', promise: trim(k.promise), audience: lines(k.audience), pains: lines(k.pains), benefits: lines(k.benefits),
          bonuses: (k.bonuses || []).map(function (b) { return trim(b.title) + ' | ' + trim(b.text) + ' | ' + (Number(b.value) || 0); }).join('\n'),
          faq: JSON.stringify(k.faq || []), testimonials: '[]', cta_text: trim(k.cta_text), scarcity_until: 0, support_url: '',
          aff_enabled: !!k.aff_enabled && price > 0, aff_commission: k.aff_commission != null ? clamp(k.aff_commission, 0, 90) : conf.aff_default_commission, aff_auto: false,
          aff_cookie_days: conf.aff_default_cookie_days, aff_materials: '', lp: '', lp_status: '', lp_updated_at: 0, lp_static_url: '', seo_title: '', seo_desc: '', released_at: 0
        }, opts.patch && opts.patch[slug] || {}));
        (k.seasons || []).forEach(function (s, si) {
          var sid = 's_' + rand(12);
          seasons.push({ id: sid, course_id: cid, order: si + 1, title: trim(s.title), description: trim(s.description), release_mode: 'now', release_days: 0, release_at: 0 });
          (s.lessons || []).forEach(function (l, li) {
            lessons.push({ course_id: cid, season_id: sid, order: li + 1, title: trim(l.title), description: trim(l.description), video_url: '', duration_min: Math.max(0, Number(l.duration_min) || 0), thumb: '', materials: '[]', free_preview: false, xp: 50 });
          });
        });
      });
      T('Courses').insertMany(courses);
      T('Seasons').insertMany(seasons);
      T('Lessons').insertMany(lessons);
      return { courses: courses.length, seasons: seasons.length, lessons: lessons.length, skipped: skipped };
    }

    function seedExample() {
      var c = T('Courses').insert({
        slug: 'curso-de-exemplo-' + rand(4), status: 'draft', order: 99, featured: false, title: 'Curso de Exemplo', subtitle: 'Apague ou edite à vontade',
        category: 'Exemplo', level: 'Iniciante', short_desc: 'Um curso de exemplo para você ver como temporadas e aulas aparecem na plataforma.',
        description: 'Edite este curso no painel ADM ou apague-o quando criar o seu.', show_title: true, color: 0, price: 97, anchor_price: 197,
        max_installments: 12, methods: 'pix,card', guarantee_days: 7, access_days: 0, promise: 'Entender a estrutura da plataforma em 5 minutos',
        pains: 'Não sabe por onde começar\nTem medo de errar a configuração', benefits: 'Clareza: ver tudo funcionando\nConfiança: testar antes de vender',
        aff_enabled: false, aff_commission: cfg().aff_default_commission, aff_auto: false, aff_cookie_days: cfg().aff_default_cookie_days
      });
      [['Temporada 1', ['Boas-vindas', 'Como funciona']], ['Temporada 2', ['Primeiro passo', 'Próximo nível']]].forEach(function (s, si) {
        var season = T('Seasons').insert({ course_id: c.id, order: si + 1, title: s[0], description: '', release_mode: 'now' });
        s[1].forEach(function (t, li) { T('Lessons').insert({ course_id: c.id, season_id: season.id, order: li + 1, title: t, description: 'Descrição da aula.', video_url: '', duration_min: 10, materials: '[]', free_preview: si === 0 && li === 0, xp: 50 }); });
      });
      return c;
    }

    return { handle: handle, webhook: webhook, hourly: hourly, bootstrapAdmin: bootstrapAdmin, seedExample: seedExample, seedCatalog: seedCatalog, syncLeads: syncLeads, seedBanners: seedBanners, lpTemplate: function (c) { return lpTemplate(c, idx()); }, actions: A };
  }

  factory.SCHEMA = SCHEMA;
  factory.DEFAULT_CONFIG = DEFAULT_CONFIG;
  factory.SECRET_KEYS = SECRET_KEYS;
  factory.BADGES = BADGES;
  factory.RANKS = RANKS;
  factory.TEMPLATES = DEFAULT_TEMPLATES;
  factory.SOURCE_LABEL = SOURCE_LABEL;
  return factory;
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BrasaLogic;

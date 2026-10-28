/* =====================================================================
   BRASA · catalog.js — catálogo inicial: 59 cursos, 164 temporadas, 515 aulas (cerca de 121h).
   Um tema por curso. 8 grátis (iscas), 19 low ticket, 27 médio ticket, 5 semi high ticket.
   A demonstração monta os cursos a partir daqui, e o Apps Script recebe
   uma cópia (Catalogo.gs) para a função criarCatalogoInicial(), que cria
   tudo na planilha como "Em breve". Gerado por catalogo/build.py: edite lá.
   ===================================================================== */
function brasaCatalogo() {
  return {
 "version": 2,
 "instructor": {
  "name": "Dhione Cambraia",
  "bio": "Designer há mais de 10 anos, coordenador de marketing de uma consultoria de gestão e empreendedor digital. Toca captação perpétua e eventos presenciais, lidera um time de marketing e constrói os próprios sistemas sem mensalidade."
 },
 "courses": [
  {
   "slug": "aula-zero-o-mapa",
   "title": "Aula Zero: O Mapa",
   "subtitle": "Comece por aqui",
   "category": "Comece aqui",
   "level": "Iniciante",
   "tags": "introdução, mapa, primeiros passos, grátis",
   "price": 0,
   "anchor_price": 0,
   "color": 0,
   "featured": false,
   "short_desc": "Quatro episódios gratuitos para entender o caminho: atrair, converter, entregar e escolher por onde começar. O mapa antes da viagem.",
   "description": "Esta é a porta de entrada da plataforma. Em poucos episódios, você enxerga o caminho inteiro de quem vende online: atrair a pessoa certa, conversar até a compra e entregar de um jeito que faz o cliente voltar.\n\nNo fim, você sabe em qual dessas etapas o seu negócio mais trava e por qual trilha da plataforma começar. Sem pressa e sem pegadinha.",
   "promise": "O mapa do que importa para vender online e a trilha certa para começar",
   "audience": [
    "Quem está começando a vender online e não sabe por onde começar",
    "Quem já tem negócio e quer entender como as peças se encaixam",
    "Quem quer conhecer a plataforma antes de escolher uma trilha"
   ],
   "pains": [
    "Você vê dica solta demais e não sabe qual vem primeiro.",
    "Já comprou curso, assistiu metade e não aplicou nada.",
    "Sente que falta alguém para dizer qual é o passo seguinte."
   ],
   "benefits": [
    "Visão do caminho: atrair, converter e entregar explicados em linguagem de quem vende.",
    "Diagnóstico rápido: você identifica em qual etapa o seu negócio mais trava hoje.",
    "Próximo passo claro: você sai sabendo por qual trilha da plataforma começar."
   ],
   "bonuses": [],
   "cta_text": "Assistir de graça",
   "aff_enabled": false,
   "aff_commission": 0,
   "seasons": [
    {
     "title": "O Mapa",
     "description": "Quatro episódios para começar.",
     "lessons": [
      {
       "title": "Atrair",
       "description": "De onde vem o cliente certo.",
       "duration_min": 9
      },
      {
       "title": "Converter",
       "description": "A conversa que transforma interesse em compra.",
       "duration_min": 11
      },
      {
       "title": "Entregar",
       "description": "Por que a entrega é o melhor marketing.",
       "duration_min": 8
      },
      {
       "title": "Seu primeiro passo",
       "description": "Descubra por qual trilha começar, conforme o seu objetivo: atrair clientes, criar conteúdo ou organizar a vida e a grana.",
       "duration_min": 7
      }
     ]
    }
   ]
  },
  {
   "slug": "pare-de-impulsionar",
   "title": "Pare de Impulsionar",
   "subtitle": "O botão azul custa caro",
   "category": "Tráfego pago",
   "level": "Iniciante",
   "tags": "grátis, meta ads, impulsionar, primeiros passos, grátis",
   "price": 0,
   "anchor_price": 0,
   "color": 0,
   "featured": false,
   "short_desc": "Quatro episódios para entender por que o botão impulsionar queima dinheiro e o que fazer no lugar dele, ainda esta semana.",
   "description": "O botão impulsionar é a porta mais cara do Meta Ads. Ele escolhe o público, o objetivo e o lance por você, e quase sempre escolhe o que entrega curtida em vez de cliente.\n\nNestes episódios você vê a diferença entre impulsionar e anunciar, monta o mínimo para sair do botão e descobre se vale ir para o Tráfego Sem Romance.",
   "promise": "Sair do botão impulsionar e montar o seu primeiro anúncio pelo Gerenciador",
   "audience": [
    "Quem impulsiona post e não sabe dizer se voltou alguma coisa",
    "Quem tem negócio local e quer começar a anunciar direito",
    "Quem quer testar o método antes de investir em um curso completo"
   ],
   "pains": [
    "Você impulsiona, ganha curtida e o caixa continua igual.",
    "O Gerenciador de Anúncios parece um painel de avião.",
    "Já ouviu falar de pixel, mas não sabe se o seu está funcionando."
   ],
   "benefits": [
    "Diagnóstico: você entende o que o impulsionar escolhe por você e por que isso custa caro.",
    "Primeiro passo: você sai com o Gerenciador aberto e o objetivo certo escolhido.",
    "Próximo nível: você sabe se o Tráfego Sem Romance faz sentido para o seu momento."
   ],
   "bonuses": [],
   "cta_text": "Assistir de graça",
   "aff_enabled": false,
   "aff_commission": 0,
   "seasons": [
    {
     "title": "Fora do Botão",
     "description": "Quatro episódios curtos para trocar o impulsionar pelo Gerenciador.",
     "lessons": [
      {
       "title": "O que o impulsionar escolhe por você",
       "description": "Objetivo, público e lance que o botão define sem perguntar.",
       "duration_min": 8
      },
      {
       "title": "Curtida não paga boleto",
       "description": "A diferença entre alcance, engajamento e venda.",
       "duration_min": 7
      },
      {
       "title": "O Gerenciador sem susto",
       "description": "As três telas que você vai usar de verdade.",
       "duration_min": 10
      },
      {
       "title": "Seu primeiro anúncio do jeito certo",
       "description": "Objetivo, público amplo e um criativo para testar.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "quanto-investir-em-anuncio",
   "title": "Quanto Investir em Anúncio",
   "subtitle": "A conta antes do primeiro real",
   "category": "Tráfego pago",
   "level": "Iniciante",
   "tags": "meta ads, orçamento, investimento, cpa, low ticket",
   "price": 47,
   "anchor_price": 97,
   "color": 0,
   "featured": false,
   "short_desc": "A conta para decidir quanto colocar em anúncio em cada fase, a partir do preço do seu produto e do custo que você aguenta pagar por venda.",
   "description": "Investir pouco demais não dá dado. Investir muito cedo queima caixa. A verba certa sai de uma conta simples com o preço do produto, a margem e a conversão da página.\n\nVocê sai com uma planilha preenchida dizendo quanto investir no teste, na validação e na escala.",
   "promise": "Saber quanto investir em anúncio em cada fase, com uma conta que fecha",
   "audience": [
    "Quem vai começar a anunciar e não sabe quanto separar",
    "Quem já anuncia e não sabe se está gastando demais",
    "Gestor que precisa justificar a verba para o cliente"
   ],
   "pains": [
    "Você chuta o orçamento diário e torce.",
    "Não sabe quanto pode pagar por lead ou por venda.",
    "Fica com medo de aumentar a verba e perder o que já funciona."
   ],
   "benefits": [
    "CPA máximo: quanto você pode pagar por venda sem ter prejuízo.",
    "Verba por fase: teste, validação e escala com valores definidos.",
    "Planilha pronta: a conta feita para o seu produto."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Conta",
     "description": "De onde sai o número.",
     "lessons": [
      {
       "title": "Margem e CPA máximo",
       "description": "O teto do que você pode pagar por venda.",
       "duration_min": 12
      },
      {
       "title": "Da conversão da página ao custo do lead",
       "description": "A conta de trás para frente.",
       "duration_min": 13
      },
      {
       "title": "A planilha preenchida",
       "description": "Seu produto dentro da conta.",
       "duration_min": 15
      }
     ]
    },
    {
     "title": "As Fases",
     "description": "Quanto investir em cada momento.",
     "lessons": [
      {
       "title": "Teste: comprar dado barato",
       "description": "O mínimo para o Meta aprender.",
       "duration_min": 11
      },
      {
       "title": "Validação: confirmar o que funcionou",
       "description": "Quando e quanto aumentar.",
       "duration_min": 10
      },
      {
       "title": "Escala: crescer sem quebrar o CPA",
       "description": "Aumentos que o algoritmo aguenta.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "trafego-sem-romance",
   "title": "Tráfego Sem Romance",
   "subtitle": "Meta Ads para quem vende de verdade",
   "category": "Tráfego pago",
   "level": "Do zero ao avançado",
   "tags": "meta ads, anúncios, captação, tráfego pago, semi high ticket",
   "price": 597,
   "anchor_price": 1197,
   "color": 0,
   "featured": true,
   "short_desc": "Monte, leia e escale campanhas no Meta Ads com método. Do pixel ao orçamento certo, sem depender de sorte nem de agência.",
   "description": "Você vai montar, ler e escalar campanhas no Meta Ads com critério de gestor: estrutura de conta, objetivo, criativos que param o dedo, públicos, orçamento e a leitura de números que separa quem queima dinheiro de quem investe.\n\nNada de truque de algoritmo. É método, planilha e rotina, com a primeira campanha no ar passo a passo e uma conta clara de quanto investir em cada fase.",
   "promise": "Montar, ler e escalar campanhas no Meta Ads sem depender de sorte",
   "audience": [
    "Donos de negócio que já vendem e querem previsibilidade",
    "Gestores de tráfego iniciantes que querem método",
    "Infoprodutores cansados de depender de lançamento",
    "Quem já perdeu dinheiro com anúncio e quer entender o porquê"
   ],
   "pains": [
    "Você impulsiona post, gasta e não sabe dizer se deu retorno.",
    "Cada campanha parece uma aposta: às vezes vende, às vezes some.",
    "Você não sabe ler CPM, CTR e CPA, então decide no achismo.",
    "Já pagou agência e recebeu relatório bonito sem venda nenhuma."
   ],
   "benefits": [
    "Conta organizada: estrutura de campanha que você entende, replica e sobe passo a passo.",
    "Criativo que vende: roteiros e formatos que param o dedo e geram clique qualificado.",
    "Números na mão: leitura diária e semanal para cortar, manter ou escalar com o investimento na medida certa."
   ],
   "bonuses": [
    {
     "title": "Planilha de gestão de tráfego",
     "text": "A mesma planilha de leitura usada na rotina de captação perpétua, pronta para copiar.",
     "value": 197
    },
    {
     "title": "Banco de roteiros de anúncio",
     "text": "Ganchos e estruturas para adaptar ao seu nicho e gravar no celular.",
     "value": 147
    }
   ],
   "cta_text": "Quero campanhas que se pagam",
   "aff_enabled": true,
   "aff_commission": 50,
   "seasons": [
    {
     "title": "O Campo de Batalha",
     "description": "Conta, pixel e estrutura: o terreno antes da guerra.",
     "lessons": [
      {
       "title": "Por que impulsionar não é anunciar",
       "description": "A diferença entre gastar com alcance e investir em conversão. O mapa do que vem pela frente.",
       "duration_min": 12
      },
      {
       "title": "Business Manager sem dor de cabeça",
       "description": "Conta de anúncios, página, Instagram e permissões no lugar certo.",
       "duration_min": 18
      },
      {
       "title": "Pixel e API de Conversões",
       "description": "Instalar, testar e confiar nos eventos que o algoritmo usa para encontrar comprador.",
       "duration_min": 22
      },
      {
       "title": "A estrutura de campanha que se repete",
       "description": "Campanha, conjunto e anúncio: o modelo de três camadas para não se perder.",
       "duration_min": 16
      },
      {
       "title": "Escolhendo o objetivo da campanha",
       "description": "Vendas, cadastros ou tráfego: como escolher o objetivo que orienta o algoritmo a buscar o resultado que você precisa.",
       "duration_min": 14
      },
      {
       "title": "Orçamento: quanto, onde e quando",
       "description": "CBO, ABO e a regra para começar pequeno sem matar o aprendizado.",
       "duration_min": 14
      },
      {
       "title": "Sua primeira campanha, passo a passo",
       "description": "Do zero ao botão de publicar: campanha, conjunto e anúncio configurados na ordem certa e conferidos antes de ligar.",
       "duration_min": 24
      }
     ]
    },
    {
     "title": "Criativo É Rei",
     "description": "O anúncio que para o dedo e traz o clique certo.",
     "lessons": [
      {
       "title": "Anatomia de um anúncio que vende",
       "description": "Gancho, desenvolvimento e chamada. Por que os três primeiros segundos decidem tudo.",
       "duration_min": 19
      },
      {
       "title": "Roteiros para vídeo curto",
       "description": "Cinco estruturas de roteiro para gravar no celular sem estúdio.",
       "duration_min": 24
      },
      {
       "title": "Estáticos e carrosséis",
       "description": "Quando a imagem bate o vídeo e como desenhar um carrossel que segura a atenção.",
       "duration_min": 15
      },
      {
       "title": "Testando criativos com método",
       "description": "Como testar 6 criativos com pouco orçamento e achar o vencedor em 72 horas.",
       "duration_min": 17
      }
     ]
    },
    {
     "title": "Escala Sem Queimar Dinheiro",
     "description": "Ler número, cortar, manter e escalar.",
     "lessons": [
      {
       "title": "A planilha de leitura diária",
       "description": "CPM, CTR, CPC, CPA e ROAS lidos juntos, em 10 minutos por dia.",
       "duration_min": 21
      },
      {
       "title": "Quando cortar, quando insistir",
       "description": "Critérios objetivos para desligar anúncio sem ansiedade.",
       "duration_min": 13
      },
      {
       "title": "Sua rotina semanal de otimização",
       "description": "O que olhar toda semana, o que mexer e o que deixar quieto para a conta melhorar sem virar bagunça.",
       "duration_min": 16
      },
      {
       "title": "Teste A/B dentro do Meta Ads",
       "description": "Como montar um teste de verdade na plataforma, mudando uma variável por vez e lendo o resultado sem se enganar.",
       "duration_min": 19
      },
      {
       "title": "Escala vertical e horizontal",
       "description": "Subir orçamento e abrir públicos sem derrubar o resultado.",
       "duration_min": 18
      }
     ]
    },
    {
     "title": "O Dinheiro Certo",
     "description": "Quanto investir, quando subir e qual meta perseguir em cada fase.",
     "lessons": [
      {
       "title": "Quanto investir em cada fase",
       "description": "Quanto investir conforme o objetivo e a fase, como dividir o orçamento entre teste e escala e quando aumentar.",
       "duration_min": 17
      },
      {
       "title": "CPL e CPA alvo do seu produto",
       "description": "Use preço, margem e taxa de conversão do seu produto para descobrir quanto pode pagar por lead e por venda.",
       "duration_min": 20
      },
      {
       "title": "Três metas: mínima, audaciosa e agressiva",
       "description": "Defina três níveis de meta para o mesmo investimento e decida, com os números na mesa, quando subir de nível.",
       "duration_min": 15
      }
     ]
    }
   ]
  },
  {
   "slug": "leitura-de-campanha",
   "title": "Leitura de Campanha",
   "subtitle": "O que cada número está dizendo",
   "category": "Tráfego pago",
   "level": "Intermediário",
   "tags": "meta ads, métricas, análise, ctr, cpm, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 0,
   "featured": false,
   "short_desc": "Aprenda a ler uma campanha do Meta Ads do anúncio até a venda e a decidir, com número, o que corta, o que mantém e o que escala.",
   "description": "CPM, CTR, CPC, CPL e CPA só ajudam quando você sabe em que ordem ler e o que cada um aponta. Lidos soltos, viram ansiedade.\n\nO curso mostra a leitura de cima para baixo, os sinais de criativo cansado, de público saturado e de página que vaza, e a rotina diária de dez minutos.",
   "promise": "Ler uma campanha em dez minutos por dia e saber exatamente onde está o problema",
   "audience": [
    "Quem já roda anúncio e se perde nas métricas",
    "Gestor de tráfego começando a atender clientes",
    "Empreendedor que quer acompanhar o gestor de perto"
   ],
   "pains": [
    "Você olha o painel e não sabe se a campanha está boa ou ruim.",
    "Desliga anúncio cedo demais ou deixa rodando tempo demais.",
    "Culpa o criativo quando o problema é a página."
   ],
   "benefits": [
    "Ordem de leitura: do CPM ao CPA, sem pular etapa.",
    "Diagnóstico: criativo, público ou página, com o sinal de cada um.",
    "Rotina: dez minutos por dia com uma planilha de acompanhamento."
   ],
   "bonuses": [
    {
     "title": "Planilha de acompanhamento diário",
     "text": "A planilha usada na rotina de leitura, pronta para copiar.",
     "value": 97
    }
   ],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Os Números",
     "description": "O que cada métrica mede de verdade.",
     "lessons": [
      {
       "title": "CPM: o preço da atenção",
       "description": "Leilão, público e época do ano.",
       "duration_min": 12
      },
      {
       "title": "CTR e CPC: o criativo falando",
       "description": "Quando o problema é o anúncio.",
       "duration_min": 13
      },
      {
       "title": "CPL e CPA: a página e a oferta",
       "description": "Quando o problema está depois do clique.",
       "duration_min": 14
      },
      {
       "title": "Frequência e saturação",
       "description": "O sinal de que o público cansou.",
       "duration_min": 10
      }
     ]
    },
    {
     "title": "O Diagnóstico",
     "description": "Achar o gargalo antes de mexer.",
     "lessons": [
      {
       "title": "A leitura de cima para baixo",
       "description": "Um roteiro fixo para cada análise.",
       "duration_min": 15
      },
      {
       "title": "Criativo cansado ou público errado",
       "description": "Como separar um do outro.",
       "duration_min": 13
      },
      {
       "title": "A página que vaza",
       "description": "Taxa de conversão e velocidade.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "A Rotina",
     "description": "Dez minutos por dia.",
     "lessons": [
      {
       "title": "A planilha de acompanhamento",
       "description": "Os campos que importam e mais nada.",
       "duration_min": 16
      },
      {
       "title": "Cortar, manter ou escalar",
       "description": "Regras de decisão escritas.",
       "duration_min": 13
      },
      {
       "title": "O relatório semanal",
       "description": "Uma página para você ou para o cliente.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "teste-e-otimizacao",
   "title": "Teste e Otimização",
   "subtitle": "Uma variável por vez",
   "category": "Tráfego pago",
   "level": "Intermediário",
   "tags": "meta ads, teste a/b, otimização, escala, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 0,
   "featured": false,
   "short_desc": "Como testar criativo, público e oferta no Meta Ads sem bagunçar o aprendizado da campanha, e como otimizar com base no que o teste mostrou.",
   "description": "Testar tudo ao mesmo tempo é o jeito mais rápido de não aprender nada. Um teste bom muda uma coisa, tem tempo e verba definidos e termina com uma decisão.\n\nVocê monta um calendário de testes, aprende a ler o resultado e a transformar o vencedor em escala.",
   "promise": "Um calendário de testes que gera aprendizado toda semana e campanhas que melhoram com o tempo",
   "audience": [
    "Quem já roda anúncio e quer melhorar resultado com método",
    "Gestor que precisa mostrar evolução ao cliente",
    "Infoprodutor com perpétuo rodando"
   ],
   "pains": [
    "Você mexe em tudo de uma vez e não sabe o que deu certo.",
    "Toda mudança derruba a campanha para a fase de aprendizado.",
    "Acha um anúncio bom e não sabe como escalar sem estragar."
   ],
   "benefits": [
    "Hipótese: um teste que pode perder e por isso ensina.",
    "Estrutura: onde testar sem matar a campanha que funciona.",
    "Escala: como levar o vencedor adiante."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Teste Bom",
     "description": "Antes de subir qualquer variação.",
     "lessons": [
      {
       "title": "Hipótese que pode perder",
       "description": "O que você espera, em qual métrica e contra o quê.",
       "duration_min": 11
      },
      {
       "title": "Uma variável por vez",
       "description": "Criativo, público, oferta ou página.",
       "duration_min": 12
      },
      {
       "title": "Tempo e verba do teste",
       "description": "Quando o resultado vale.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "Onde Testar",
     "description": "Sem atrapalhar o que já vende.",
     "lessons": [
      {
       "title": "Campanha de teste e campanha de escala",
       "description": "Duas casas, duas funções.",
       "duration_min": 14
      },
      {
       "title": "Teste A/B nativo do Meta",
       "description": "Quando usar e quando evitar.",
       "duration_min": 13
      },
      {
       "title": "Testando oferta e página",
       "description": "O teste que mais mexe no caixa.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "Do Vencedor à Escala",
     "description": "O que fazer com o resultado.",
     "lessons": [
      {
       "title": "Lendo o resultado sem viés",
       "description": "Diferença real ou sorte.",
       "duration_min": 12
      },
      {
       "title": "Escala vertical e horizontal",
       "description": "Mais verba ou mais públicos.",
       "duration_min": 14
      },
      {
       "title": "O calendário de testes",
       "description": "Um teste por semana, por escrito.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "id-de-campanha",
   "title": "ID de Campanha",
   "subtitle": "Cada lead com nome e sobrenome",
   "category": "Campanhas",
   "level": "Iniciante",
   "tags": "id de campanha, utm, nomenclatura, organização, low ticket",
   "price": 47,
   "anchor_price": 97,
   "color": 1,
   "featured": false,
   "short_desc": "Uma nomenclatura de campanha e de UTM que deixa claro, em qualquer relatório, de onde veio cada lead e cada venda.",
   "description": "Sem um padrão de nomes, a conta de anúncios vira uma gaveta bagunçada e o relatório não fecha. Com um ID por campanha, você cruza anúncio, planilha e venda sem esforço.\n\nVocê sai com o padrão de nomes, o gerador de UTM e a planilha de controle prontos.",
   "promise": "Saber de onde veio cada lead e cada venda, em qualquer campanha",
   "audience": [
    "Quem roda várias campanhas e se perde nos nomes",
    "Time de marketing que precisa falar a mesma língua",
    "Quem quer montar painel e não consegue cruzar os dados"
   ],
   "pains": [
    "Seus anúncios se chamam \"campanha nova 3\".",
    "O relatório de vendas não bate com o Gerenciador.",
    "Ninguém do time sabe qual campanha trouxe aquele lead."
   ],
   "benefits": [
    "Padrão de nomes: campanha, conjunto e anúncio com regra fixa.",
    "UTM certa: origem, mídia, campanha e conteúdo em todo link.",
    "Controle: uma planilha com todos os IDs ativos."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Padrão",
     "description": "Nomes que se explicam sozinhos.",
     "lessons": [
      {
       "title": "Por que nomear é medir",
       "description": "O que se perde sem padrão.",
       "duration_min": 8
      },
      {
       "title": "O ID de campanha",
       "description": "Data, produto, objetivo e versão.",
       "duration_min": 12
      },
      {
       "title": "Conjunto e anúncio",
       "description": "Público, ângulo e formato no nome.",
       "duration_min": 10
      }
     ]
    },
    {
     "title": "Os Links",
     "description": "A origem de cada clique.",
     "lessons": [
      {
       "title": "UTM sem mistério",
       "description": "As cinco partes e quando usar cada uma.",
       "duration_min": 11
      },
      {
       "title": "Gerador de UTM na planilha",
       "description": "Um link certo em dez segundos.",
       "duration_min": 12
      },
      {
       "title": "A planilha de controle",
       "description": "Todos os IDs ativos em um lugar.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "isca-que-pesca",
   "title": "Isca Que Pesca",
   "subtitle": "Iscas digitais para captar contatos que valem a pena",
   "category": "Campanhas",
   "level": "Iniciante",
   "tags": "isca digital, lead magnet, captação, página de captura, quiz, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 1,
   "featured": false,
   "short_desc": "Crie uma isca digital, coloque no ar e leia os números. Do ebook ao quiz, para juntar contatos que combinam com o que você vende.",
   "description": "Isca é o que você oferece de graça em troca do contato de alguém. Uma isca bem pensada monta a sua lista, separa os interessados e mostra quem está perto de comprar.\n\nNeste curso você escolhe o tipo de isca, produz rápido com Canva e IA, coloca no ar com anúncio e entrega automática, e aprende a ler o que importa: custo por lead, qualidade do lead e venda por lead.",
   "promise": "Uma isca no ar, entregando sozinha, com os números para saber se funciona",
   "audience": [
    "Donos de negócio que querem uma lista de contatos própria",
    "Infoprodutores que precisam captar leads antes de vender",
    "Gestores de marketing que montam campanhas de captação",
    "Quem já tem tráfego e não sabe o que oferecer em troca do contato"
   ],
   "pains": [
    "Você paga anúncio, mas o lead que chega nunca responde.",
    "Fez um ebook que ninguém baixa nem lê.",
    "Tem uma lista cheia de contatos que não compram nada.",
    "Não sabe se a isca está ruim ou se o problema é o anúncio."
   ],
   "benefits": [
    "Isca com propósito: você escolhe o formato pelo objetivo, não pelo que está na moda.",
    "Produção rápida: da ideia à página no ar, com Canva, IA e entrega automática.",
    "Leitura honesta: custo por lead, lead qualificado e venda por lead no mesmo painel."
   ],
   "bonuses": [
    {
     "title": "Checklist de lançamento da isca",
     "text": "Tudo o que conferir antes de ligar o anúncio: página, entrega, UTMs e integração.",
     "value": 97
    },
    {
     "title": "Planilha de leitura da isca",
     "text": "Modelo para registrar custo por lead, qualificação e vendas de cada isca.",
     "value": 147
    }
   ],
   "cta_text": "Quero minha isca no ar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Por Que Isca",
     "description": "Antes de produzir, entenda o que a isca precisa fazer por você.",
     "lessons": [
      {
       "title": "Para que serve uma isca",
       "description": "O que uma isca bem pensada faz: monta a lista, separa interessados e começa a qualificar quem chega.",
       "duration_min": 11
      },
      {
       "title": "Ebook, checklist, aula e planilha",
       "description": "Os formatos clássicos de isca, o que cada um entrega bem e o esforço de produzir cada um.",
       "duration_min": 13
      },
      {
       "title": "Quiz e diagnóstico que direcionam",
       "description": "Como um questionário com resultado separa os leads por perfil e leva cada grupo para a oferta que faz sentido.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "Montando a Isca",
     "description": "Promessa, produção, página e entrega: tudo pronto antes de investir em anúncio.",
     "lessons": [
      {
       "title": "Promessa e formato da isca",
       "description": "Escolha uma promessa pequena, específica e fácil de cumprir, e o formato que a entrega do jeito mais rápido.",
       "duration_min": 12
      },
      {
       "title": "Produzindo rápido com Canva e IA",
       "description": "Tire a isca do papel em uma tarde: roteiro com IA, diagramação no Canva e revisão humana no final.",
       "duration_min": 18
      },
      {
       "title": "A página de captura da isca",
       "description": "Título, benefício, formulário e botão: o mínimo que a página precisa ter para pedir o contato sem afastar ninguém.",
       "duration_min": 16
      },
      {
       "title": "Entrega automática",
       "description": "Configure o envio imediato da isca por e-mail e a mensagem de boas-vindas, sem precisar mandar nada na mão.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "Isca no Ar",
     "description": "Anúncio, público, orçamento e integração para a isca começar a trazer contatos.",
     "lessons": [
      {
       "title": "O anúncio de captação",
       "description": "Imagem, texto e chamada de um anúncio feito para pedir o contato, não para vender o produto final.",
       "duration_min": 15
      },
      {
       "title": "Públicos e orçamento para começar",
       "description": "Quem vai ver o anúncio e quanto investir no primeiro teste, sem comprometer o caixa nem ficar no escuro.",
       "duration_min": 15
      },
      {
       "title": "ID de campanha e UTMs",
       "description": "Etiquete cada anúncio para saber depois de qual campanha veio cada lead e quanto ele custou.",
       "duration_min": 13
      },
      {
       "title": "Isca ligada ao e-mail e ao WhatsApp",
       "description": "Integre a página à ferramenta de e-mail e ao WhatsApp para o lead entrar na lista e ser atendido na hora.",
       "duration_min": 17
      }
     ]
    },
    {
     "title": "Lendo a Isca",
     "description": "Os números que dizem se a isca está pescando bem ou se é hora de trocar.",
     "lessons": [
      {
       "title": "CPL e conversão da página",
       "description": "Calcule o custo por lead e a taxa de conversão da página, e entenda o que cada número está dizendo.",
       "duration_min": 14
      },
      {
       "title": "Lead qualificado e venda por lead",
       "description": "Meça a taxa de lead qualificado e quantas vendas cada contato gera, para saber se a isca traz o público certo.",
       "duration_min": 16
      },
      {
       "title": "Hora de trocar a isca",
       "description": "Os sinais de que a isca cansou, o que ajustar primeiro e como testar uma nova sem zerar a lista.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "pagina-que-converte",
   "title": "Página Que Converte",
   "subtitle": "Páginas de captação e de venda que levam a pessoa a agir",
   "category": "Campanhas",
   "level": "Intermediário",
   "tags": "landing page, página de vendas, conversão, elementor, github pages, teste a/b, médio ticket",
   "price": 297,
   "anchor_price": 597,
   "color": 1,
   "featured": false,
   "short_desc": "O que toda página que converte tem, como montar páginas de captação, venda e remarketing e como testar com método. Elementor, GitHub Pages e IA.",
   "description": "Página boa não é a mais bonita. É a que deixa claro o que você oferece, mostra por que acreditar e facilita o próximo clique, inclusive no celular.\n\nVocê vê a anatomia de uma página que converte e monta cada tipo: captação, venda e remarketing. Depois aprende a testar, acelerar e produzir mais rápido com Elementor, GitHub Pages e IA.",
   "promise": "Páginas de captação e de venda que explicam, convencem e levam ao clique",
   "audience": [
    "Donos de negócio que têm tráfego e a página não converte",
    "Gestores de marketing que montam páginas de campanha",
    "Designers que querem entender o que faz uma página vender",
    "Quem usa Elementor ou quer publicar páginas sem pagar mensalidade"
   ],
   "pains": [
    "O anúncio traz clique, mas a página não gera cadastro nem venda.",
    "Você muda cor e botão no escuro, sem saber o que realmente pesa.",
    "A página fica linda no computador e quebra no celular.",
    "Cada página nova leva dias e depende de alguém para publicar."
   ],
   "benefits": [
    "Anatomia clara: promessa, prova, chamada e velocidade no lugar certo de cada página.",
    "Modelos por objetivo: captação, venda e remarketing, cada um com a sua estrutura.",
    "Teste com método: mude uma coisa por vez, meça e publique mais rápido com Elementor, GitHub Pages e IA."
   ],
   "bonuses": [
    {
     "title": "Checklist de página que converte",
     "text": "Lista de conferência para revisar promessa, prova, chamada, velocidade e celular antes de publicar.",
     "value": 97
    },
    {
     "title": "Modelos de estrutura de página",
     "text": "Esqueletos de página de captura, venda e obrigado para adaptar ao seu produto.",
     "value": 197
    }
   ],
   "cta_text": "Quero páginas que convertem",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Anatomia",
     "description": "O que toda página que converte tem em comum.",
     "lessons": [
      {
       "title": "Promessa e prova",
       "description": "A frase que diz o que a pessoa ganha e os elementos que a fazem acreditar.",
       "duration_min": 15
      },
      {
       "title": "A chamada para ação",
       "description": "Onde colocar o botão, o que escrever nele e como evitar que a página ofereça mais de um caminho.",
       "duration_min": 13
      },
      {
       "title": "Velocidade e celular",
       "description": "Teste a página no celular e numa conexão lenta e corrija o que atrasa ou atrapalha a leitura.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "Captação",
     "description": "Páginas que pedem o contato e entregam o que prometeram.",
     "lessons": [
      {
       "title": "Página de captura para isca",
       "description": "Estrutura enxuta para trocar o contato pela isca digital: título, benefício, prova e formulário.",
       "duration_min": 17
      },
      {
       "title": "Página de inscrição de evento",
       "description": "O que mostrar para quem vai se inscrever em um workshop, desafio ou evento presencial.",
       "duration_min": 16
      },
      {
       "title": "Formulário: quantos campos pedir",
       "description": "O equilíbrio entre pedir pouco para converter mais e pedir o suficiente para qualificar o lead.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "Venda",
     "description": "A página que leva da dúvida à decisão.",
     "lessons": [
      {
       "title": "Página longa ou curta",
       "description": "Como escolher o tamanho da página de vendas de acordo com o preço, o produto e o público.",
       "duration_min": 17
      },
      {
       "title": "A oferta na página",
       "description": "Como apresentar o que está incluso, o preço e os bônus de modo que o valor fique evidente.",
       "duration_min": 18
      },
      {
       "title": "FAQ e garantia",
       "description": "Use as perguntas frequentes e a garantia para responder objeções reais e reduzir o risco de comprar.",
       "duration_min": 15
      },
      {
       "title": "Checkout sem atrito",
       "description": "O caminho da página ao pagamento: o que tirar do checkout, o que manter e como lidar com Pix e cartão.",
       "duration_min": 16
      }
     ]
    },
    {
     "title": "Remarketing",
     "description": "Páginas e ofertas para quem viu e não comprou.",
     "lessons": [
      {
       "title": "A página de obrigado que vende",
       "description": "Transforme a página de agradecimento em um próximo passo: confirmação, orientação e uma oferta que faz sentido.",
       "duration_min": 14
      },
      {
       "title": "Oferta única depois da compra",
       "description": "Como montar uma oferta complementar logo após a compra, sem confundir nem pressionar quem acabou de pagar.",
       "duration_min": 15
      },
      {
       "title": "Página de recuperação",
       "description": "Páginas e mensagens para quem abriu o checkout e não finalizou, com uma oferta ou uma resposta às dúvidas.",
       "duration_min": 17
      }
     ]
    },
    {
     "title": "Teste e Velocidade",
     "description": "Medir, testar e publicar mais rápido.",
     "lessons": [
      {
       "title": "Teste A/B de páginas",
       "description": "O que testar primeiro, como dividir o tráfego e quando o resultado já permite escolher a página vencedora.",
       "duration_min": 18
      },
      {
       "title": "Página rápida de verdade",
       "description": "Imagens leves, menos plugins e scripts sob controle: ajustes simples que fazem a página abrir mais rápido.",
       "duration_min": 16
      },
      {
       "title": "Elementor, GitHub Pages e IA",
       "description": "Quando usar cada ferramenta e como pedir à IA o código de uma página para publicar sem mensalidade.",
       "duration_min": 22
      }
     ]
    }
   ]
  },
  {
   "slug": "funil-de-mensagens",
   "title": "Funil de Mensagens",
   "subtitle": "Automação, pesquisa e o fluxo certo",
   "category": "Campanhas",
   "level": "Intermediário",
   "tags": "funil, automação, e-mail, whatsapp, pesquisa, médio ticket",
   "price": 297,
   "anchor_price": 597,
   "color": 1,
   "featured": false,
   "short_desc": "Monte o funil por trás da campanha: automações, pesquisas e o fluxo de mensagens por e-mail e WhatsApp que leva o lead até a compra.",
   "description": "A campanha traz o lead. O funil decide se ele compra. Sem automação, cada lead depende de alguém lembrar de mandar mensagem.\n\nVocê desenha o fluxo, escreve as mensagens, cria pesquisas que qualificam e liga tudo nas ferramentas, sem bagunça.",
   "promise": "Um funil automático que conversa com cada lead no tempo certo até a compra",
   "audience": [
    "Quem capta lead e não sabe o que mandar depois",
    "Quem usa WhatsApp e e-mail sem estratégia",
    "Infoprodutor montando o primeiro funil"
   ],
   "pains": [
    "O lead entra na lista e nunca mais ouve falar de você.",
    "Suas mensagens parecem spam e o descadastro sobe.",
    "Você não sabe quem está pronto para comprar."
   ],
   "benefits": [
    "Desenho: o mapa do funil, do cadastro à compra.",
    "Mensagens: e-mail e WhatsApp com papel definido em cada etapa.",
    "Pesquisa: perguntas que separam curioso de comprador."
   ],
   "bonuses": [
    {
     "title": "Mapa de funil editável",
     "text": "O desenho do funil completo para adaptar ao seu produto.",
     "value": 97
    }
   ],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Desenho",
     "description": "O mapa antes da ferramenta.",
     "lessons": [
      {
       "title": "As etapas do funil",
       "description": "Entrada, aquecimento, oferta e recuperação.",
       "duration_min": 13
      },
      {
       "title": "Gatilhos e esperas",
       "description": "O que dispara cada mensagem.",
       "duration_min": 12
      },
      {
       "title": "Tags e segmentos",
       "description": "Separar quem está em cada ponto.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "As Mensagens",
     "description": "O que dizer em cada etapa.",
     "lessons": [
      {
       "title": "Boas-vindas que entregam",
       "description": "A primeira mensagem define a relação.",
       "duration_min": 12
      },
      {
       "title": "Sequência de aquecimento",
       "description": "Conteúdo que prepara a venda.",
       "duration_min": 15
      },
      {
       "title": "Oferta e recuperação",
       "description": "Abrir carrinho e buscar quem não pagou.",
       "duration_min": 15
      },
      {
       "title": "WhatsApp sem ser chato",
       "description": "Frequência, tom e permissão.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "Pesquisas",
     "description": "Perguntar para vender melhor.",
     "lessons": [
      {
       "title": "Pesquisa de entrada",
       "description": "Três perguntas que qualificam.",
       "duration_min": 12
      },
      {
       "title": "Pesquisa de objeção",
       "description": "Por que quem não comprou não comprou.",
       "duration_min": 11
      },
      {
       "title": "Usando as respostas no funil",
       "description": "Mensagem diferente para cada perfil.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "Na Ferramenta",
     "description": "Ligar tudo.",
     "lessons": [
      {
       "title": "Escolhendo a ferramenta",
       "description": "O que é preciso e o que é luxo.",
       "duration_min": 11
      },
      {
       "title": "Montando a automação",
       "description": "Do mapa para os fluxos.",
       "duration_min": 18
      },
      {
       "title": "Testando antes de ligar",
       "description": "O lead teste que percorre tudo.",
       "duration_min": 10
      }
     ]
    }
   ]
  },
  {
   "slug": "dado-nao-mente",
   "title": "Dado Não Mente",
   "subtitle": "Rastro, painel e metas para decidir com número",
   "category": "Campanhas",
   "level": "Intermediário",
   "tags": "métricas, painel, utm, id de campanha, google planilhas, looker studio, análise, médio ticket",
   "price": 297,
   "anchor_price": 597,
   "color": 1,
   "featured": false,
   "short_desc": "Rastreie cada campanha, monte um painel no Google Planilhas e defina metas por produto. Depois, leia os números e use a IA como apoio, sem expor dados.",
   "description": "Sem rastro, não tem análise. Este curso começa pelo padrão de nomes e pelas UTMs que dão origem a cada lead, passa pelo painel que mostra o funil inteiro e termina na leitura que aponta onde ajustar.\n\nTudo roda em Google Planilhas e Looker Studio, com metas que fazem sentido para cada produto e a IA como ajudante de análise, com cuidado com os dados.",
   "promise": "Rastrear cada campanha e ler o painel para saber o que ajustar primeiro",
   "audience": [
    "Gestores de marketing e de tráfego que precisam reportar resultado",
    "Donos de negócio que querem entender os próprios números",
    "Quem roda funis e eventos ao mesmo tempo e perde o controle",
    "Analistas iniciantes que querem um método de leitura"
   ],
   "pains": [
    "Você olha cinco painéis e nenhum bate com o outro.",
    "Não sabe de qual campanha veio cada lead nem cada venda.",
    "As metas parecem chutadas: ninguém sabe se o resultado foi bom ou ruim.",
    "O relatório sai pronto na sexta e não muda nenhuma decisão."
   ],
   "benefits": [
    "Rastro limpo: padrão de nomes, UTMs e eventos para ligar cada lead à campanha de origem.",
    "Painel que decide: métricas por etapa, metas e cores de semáforo numa planilha simples.",
    "Leitura com método: conta do funil, gargalo e apoio da IA para chegar ao ajuste certo."
   ],
   "bonuses": [
    {
     "title": "Planilha de controle de campanhas",
     "text": "Modelo com padrão de nomes, gerador de UTMs e registro de cada campanha.",
     "value": 197
    },
    {
     "title": "Painel de funil no Google Planilhas",
     "text": "Painel com metas e cores de semáforo para copiar e adaptar ao seu produto.",
     "value": 247
    }
   ],
   "cta_text": "Quero ler meus números",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Rastro",
     "description": "Sem rastro não há análise: o padrão que liga cada lead à sua origem.",
     "lessons": [
      {
       "title": "ID de campanha e planilha de controle",
       "description": "Crie o padrão de nomes que identifica cada campanha e registre tudo em uma planilha única de controle.",
       "duration_min": 17
      },
      {
       "title": "UTMs: a origem de cada lead",
       "description": "Monte links com UTMs sem se perder e leve a origem do clique até a lista de leads e a venda.",
       "duration_min": 15
      },
      {
       "title": "Pixel e eventos que importam",
       "description": "Escolha os eventos que valem a pena medir, confira se estão disparando e evite contar a mesma coisa duas vezes.",
       "duration_min": 18
      }
     ]
    },
    {
     "title": "O Painel",
     "description": "Um painel simples que mostra o funil inteiro de relance.",
     "lessons": [
      {
       "title": "Os números de cada etapa",
       "description": "Do investimento à venda, as métricas que entram no painel e a pergunta que cada uma responde.",
       "duration_min": 14
      },
      {
       "title": "O painel no Google Planilhas",
       "description": "Monte o painel com fórmulas simples, ligue as metas e use cores de semáforo para ler o estado em segundos.",
       "duration_min": 24
      },
      {
       "title": "Levando o painel ao Looker Studio",
       "description": "Conecte a planilha ao Looker Studio, monte as visões e saiba quando vale mais manter só a planilha.",
       "duration_min": 20
      }
     ]
    },
    {
     "title": "Metas Que Fazem Sentido",
     "description": "Meta que nasce do histórico e do produto, não do chute.",
     "lessons": [
      {
       "title": "O custo do lead qualificado",
       "description": "CPL, custo por lead qualificado e taxa de qualificação: o que cada número mede e quando o CPL sozinho engana.",
       "duration_min": 16
      },
      {
       "title": "ROI por produto",
       "description": "Calcule o retorno de cada produto e entenda por que a meta de um não serve para o outro.",
       "duration_min": 15
      },
      {
       "title": "Metas em três níveis",
       "description": "Mínima, audaciosa e agressiva: como montar cada uma a partir do histórico e revisar todo mês.",
       "duration_min": 16
      }
     ]
    },
    {
     "title": "A Leitura",
     "description": "Da conta do funil ao ajuste: como ler os números e o que fazer em seguida.",
     "lessons": [
      {
       "title": "A conta do funil",
       "description": "Taxa de cada etapa, custo acumulado e a conta que mostra quanto cada venda custou de verdade.",
       "duration_min": 16
      },
      {
       "title": "Onde está o gargalo",
       "description": "Compare períodos, encontre a etapa que mais perde gente e saia com ajustes possíveis para testar.",
       "duration_min": 19
      },
      {
       "title": "Cruzando listas de leads",
       "description": "Junte listas de ferramentas diferentes, cruze por e-mail ou telefone e descubra de onde vieram os compradores.",
       "duration_min": 20
      }
     ]
    },
    {
     "title": "IA Analista",
     "description": "A IA como ajudante de análise, com os dados protegidos.",
     "lessons": [
      {
       "title": "Prompts para analisar números",
       "description": "Como pedir à IA uma leitura do painel com contexto, perguntas claras e uma conferência humana no final.",
       "duration_min": 17
      },
      {
       "title": "Relatório automático com IA",
       "description": "Monte um fluxo que transforma o painel em um relatório escrito, pronto para enviar ao time ou ao cliente.",
       "duration_min": 20
      },
      {
       "title": "Cuidado com os dados",
       "description": "O que tirar da planilha antes de enviá-la à IA e como conferir as respostas antes de agir.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "funil-perpetuo",
   "title": "Funil Perpétuo",
   "subtitle": "Vender todo dia, sem depender de lançamento",
   "category": "Campanhas",
   "level": "Intermediário",
   "tags": "funil perpétuo, automação, e-mail, whatsapp, recuperação de venda, semi high ticket",
   "price": 697,
   "anchor_price": 1497,
   "color": 1,
   "featured": false,
   "short_desc": "A máquina que capta, aquece e vende enquanto você cuida do resto: página, isca, e-mails, WhatsApp e anúncio trabalhando juntos.",
   "description": "Lançamento cansa. Este curso monta o funil perpétuo completo: oferta, página, sequência de e-mails, automação, pesquisas, recuperação de venda e tráfego, com os números para saber se ele está saudável.\n\nVocê começa entendendo o que é um produto perpétuo e quando ele faz sentido, e termina com o funil no ar, a rotina dos primeiros 30 dias e um painel que mostra qual etapa ajustar.",
   "promise": "Um funil perpétuo no ar, com números claros para saber onde ajustar",
   "audience": [
    "Infoprodutores que vivem de lançamento e estão exaustos",
    "Prestadores de serviço com oferta validada",
    "Gestores de marketing que precisam de captação previsível"
   ],
   "pains": [
    "Cada lançamento é uma montanha-russa de energia e faturamento.",
    "Você tem leads, mas eles esfriam antes de comprar.",
    "Não sabe em qual etapa do funil o dinheiro está vazando.",
    "Suas automações viraram uma teia de regras que ninguém entende."
   ],
   "benefits": [
    "Oferta afiada: a promessa e a ancoragem que fazem o preço parecer pequeno.",
    "Automação que conversa: e-mail e WhatsApp com timing de quem entende de gente.",
    "Funil medido: os indicadores de cada etapa num painel simples."
   ],
   "bonuses": [
    {
     "title": "Modelos de sequência de e-mails",
     "text": "Sequências prontas para adaptar ao seu produto, da captação ao pós-venda.",
     "value": 297
    },
    {
     "title": "Checklist de entrada no ar",
     "text": "Tudo o que testar antes de ligar o anúncio do funil, do pixel ao e-mail de boas-vindas.",
     "value": 97
    }
   ],
   "cta_text": "Quero meu funil no ar",
   "aff_enabled": true,
   "aff_commission": 50,
   "seasons": [
    {
     "title": "A Oferta",
     "description": "Sem oferta boa, funil nenhum salva.",
     "lessons": [
      {
       "title": "O que é um produto perpétuo",
       "description": "O que é um produto perpétuo (PER), como ele se diferencia do lançamento e quando vale a pena montar um.",
       "duration_min": 14
      },
      {
       "title": "O que faz alguém comprar sem lançamento",
       "description": "Urgência real, prova e clareza. As três forças do perpétuo.",
       "duration_min": 16
      },
      {
       "title": "Promessa e ancoragem",
       "description": "Como apresentar preço para que ele pareça pequeno perto do valor.",
       "duration_min": 20
      },
      {
       "title": "Isca que atrai comprador",
       "description": "A diferença entre lead curioso e lead que compra.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "A Máquina",
     "description": "Página, automação e sequência.",
     "lessons": [
      {
       "title": "Página de captura que converte",
       "description": "Estrutura, texto e teste A/B sem programador.",
       "duration_min": 22
      },
      {
       "title": "Sequência de e-mails que vende",
       "description": "Os 7 e-mails que todo funil perpétuo precisa.",
       "duration_min": 25
      },
      {
       "title": "WhatsApp no funil sem ser chato",
       "description": "Mensagens que ajudam a decidir, no momento certo.",
       "duration_min": 18
      },
      {
       "title": "Automação sem bagunça",
       "description": "Tags, gatilhos e fluxos organizados para que cada contato receba a mensagem certa e você saiba o porquê.",
       "duration_min": 21
      },
      {
       "title": "Pesquisas que vendem",
       "description": "Formulários de qualificação no cadastro e de pós-venda que mostram quem é o comprador e o que ele quer.",
       "duration_min": 17
      },
      {
       "title": "Recuperando carrinho e Pix",
       "description": "Mensagens e e-mails que trazem de volta quem abandonou o carrinho ou deixou o Pix sem pagar.",
       "duration_min": 18
      }
     ]
    },
    {
     "title": "No Ar",
     "description": "Tráfego, orçamento e rotina para o funil começar a rodar.",
     "lessons": [
      {
       "title": "Checklist antes de ligar o anúncio",
       "description": "Teste o caminho inteiro como se fosse um cliente: página, evento de compra, e-mails, WhatsApp e pagamento.",
       "duration_min": 15
      },
      {
       "title": "Tráfego para o perpétuo",
       "description": "Como estruturar a campanha que alimenta o funil todos os dias, com públicos e criativos que se sustentam.",
       "duration_min": 20
      },
      {
       "title": "Orçamento do funil",
       "description": "Quanto investir no começo, como dividir o valor entre os públicos e quando aumentar sem desestabilizar a conta.",
       "duration_min": 14
      },
      {
       "title": "ID de campanha no perpétuo",
       "description": "Nomeie campanhas e marque links para saber, em cada etapa do funil, de qual anúncio veio cada lead e cada venda.",
       "duration_min": 13
      },
      {
       "title": "Rotina dos primeiros 30 dias",
       "description": "O que olhar todo dia, o que mexer só uma vez por semana e o que esperar do funil no começo.",
       "duration_min": 19
      }
     ]
    },
    {
     "title": "O Painel",
     "description": "Números de cada etapa e onde ajustar.",
     "lessons": [
      {
       "title": "Métricas do funil inteiro",
       "description": "Do clique à venda: taxa de cada etapa e o que é saudável.",
       "duration_min": 19
      },
      {
       "title": "Achando o vazamento",
       "description": "Diagnóstico em 15 minutos: onde o dinheiro está escapando.",
       "duration_min": 15
      },
      {
       "title": "Otimizando a etapa mais fraca",
       "description": "Com o vazamento à vista, escolha uma etapa, mude uma coisa por vez e meça se o ajuste funcionou.",
       "duration_min": 17
      }
     ]
    }
   ]
  },
  {
   "slug": "qual-lancamento-e-o-seu",
   "title": "Qual Lançamento É o Seu",
   "subtitle": "Workshop, maratona, desafio ou meteórico",
   "category": "Lançamentos",
   "level": "Iniciante",
   "tags": "grátis, lançamento, estratégia, diagnóstico, grátis",
   "price": 0,
   "anchor_price": 0,
   "color": 1,
   "featured": false,
   "short_desc": "Um diagnóstico rápido para escolher o modelo de lançamento que combina com o seu produto, a sua base e o seu tempo.",
   "description": "Cada modelo de lançamento tem uma nuance. O workshop pede um dia forte, a maratona pede conteúdo para vários dias, o desafio pede tarefa e o meteórico pede uma base que já confia em você.\n\nNestes episódios você compara os modelos, responde a cinco perguntas e sai sabendo qual deles fazer primeiro.",
   "promise": "Saber qual modelo de lançamento fazer primeiro, com base no seu produto e na sua base",
   "audience": [
    "Quem quer lançar e não sabe por qual modelo começar",
    "Quem já lançou uma vez e quer escolher melhor a próxima",
    "Quem tem base pequena e quer saber se dá para lançar"
   ],
   "pains": [
    "Todo mundo fala de lançamento, mas cada um defende um modelo.",
    "Você tem medo de montar um evento e ninguém aparecer.",
    "Não sabe se a sua base aguenta um lançamento."
   ],
   "benefits": [
    "Comparação: o que cada modelo exige de tempo, verba e base.",
    "Diagnóstico: cinco perguntas que apontam o modelo certo.",
    "Próximo passo: o curso da trilha de Lançamentos que você assiste depois."
   ],
   "bonuses": [],
   "cta_text": "Assistir de graça",
   "aff_enabled": false,
   "aff_commission": 0,
   "seasons": [
    {
     "title": "O Diagnóstico",
     "description": "Quatro episódios para escolher o modelo.",
     "lessons": [
      {
       "title": "As cinco fases de qualquer lançamento",
       "description": "Planejar, captar, aquecer, vender e fechar.",
       "duration_min": 10
      },
      {
       "title": "Workshop, maratona e desafio lado a lado",
       "description": "Duração, esforço e tipo de produto de cada um.",
       "duration_min": 12
      },
      {
       "title": "Meteórico, Black Friday e presencial",
       "description": "Quando a base, a data ou a sala fazem a diferença.",
       "duration_min": 11
      },
      {
       "title": "As cinco perguntas",
       "description": "Responda e veja qual modelo fazer primeiro.",
       "duration_min": 9
      }
     ]
    }
   ]
  },
  {
   "slug": "lancamento-meteorico",
   "title": "Lançamento Meteórico",
   "subtitle": "A base, o WhatsApp e poucos dias",
   "category": "Lançamentos",
   "level": "Intermediário",
   "tags": "lançamento, meteórico, whatsapp, base, médio ticket",
   "price": 297,
   "anchor_price": 597,
   "color": 1,
   "featured": false,
   "short_desc": "Um lançamento curto feito só com a sua base e o WhatsApp, sem verba de anúncio, para vender em poucos dias para quem já confia em você.",
   "description": "O meteórico aproveita a confiança que você já construiu. Sem anúncio e sem evento longo, você junta a base em um grupo, aquece em poucos dias e abre a oferta.\n\nO curso mostra quando ele funciona, como montar o ciclo e como ler o resultado rápido.",
   "promise": "Vender para a sua base em poucos dias, só com WhatsApp e sem verba de anúncio",
   "audience": [
    "Quem tem base no Instagram, na lista ou no WhatsApp",
    "Quem precisa de caixa rápido",
    "Quem quer testar uma oferta antes de lançar grande"
   ],
   "pains": [
    "Você tem seguidores, mas nunca vendeu para eles.",
    "Não tem verba para anúncio agora.",
    "Tem medo de cansar a base com venda."
   ],
   "benefits": [
    "Ciclo curto: chamada, grupo, aquecimento e abertura em dias.",
    "Mensagens: o roteiro do grupo do primeiro ao último dia.",
    "Leitura: entrada no grupo, cliques e vendas."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Ciclo",
     "description": "Quando e como.",
     "lessons": [
      {
       "title": "Quando usar o meteórico",
       "description": "Tamanho e temperatura da base.",
       "duration_min": 11
      },
      {
       "title": "Montando o ciclo curto",
       "description": "Chamada, grupo, aquecimento e oferta.",
       "duration_min": 15
      },
      {
       "title": "A oferta do meteórico",
       "description": "Condição que justifica a pressa.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "No Grupo",
     "description": "Do convite à venda.",
     "lessons": [
      {
       "title": "Chamando a base para o grupo",
       "description": "Stories, lista e mensagem direta.",
       "duration_min": 13
      },
      {
       "title": "Roteiro de mensagens",
       "description": "Dia a dia, sem cansar.",
       "duration_min": 16
      },
      {
       "title": "Abertura e fechamento",
       "description": "Horário, prazo e última chamada.",
       "duration_min": 13
      },
      {
       "title": "Disparo e leitura rápida",
       "description": "Os números que importam em poucos dias.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "black-friday-que-vende",
   "title": "Black Friday Que Vende",
   "subtitle": "A data mais cheia do ano",
   "category": "Lançamentos",
   "level": "Intermediário",
   "tags": "black friday, oferta, data comemorativa, vendas, médio ticket",
   "price": 297,
   "anchor_price": 597,
   "color": 1,
   "featured": false,
   "short_desc": "Planeje a Black Friday com meta, oferta e comunicação próprias, para vender na semana mais disputada do ano sem destruir o seu preço.",
   "description": "Na Black Friday todo mundo grita desconto. Quem vende bem chega com lista aquecida, oferta clara e calendário pronto antes de novembro.\n\nVocê define o que quer da data, monta a oferta, planeja a semana e fecha com recuperação e números.",
   "promise": "Uma Black Friday planejada, com oferta que vende sem queimar o preço do ano todo",
   "audience": [
    "Infoprodutor ou loja que quer aproveitar a data",
    "Quem já fez Black Friday e não gostou do resultado",
    "Quem quer formar lista antes de novembro"
   ],
   "pains": [
    "Você dá desconto e vende igual a qualquer mês.",
    "O anúncio fica caro demais na semana da data.",
    "Depois da Black Friday ninguém compra pelo preço cheio."
   ],
   "benefits": [
    "Objetivo: caixa, base nova ou produto parado, com meta para cada um.",
    "Oferta: condição forte com prazo real.",
    "Calendário: esquenta, semana e recuperação."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Estratégia",
     "description": "Antes de novembro.",
     "lessons": [
      {
       "title": "O que você quer da Black Friday",
       "description": "Caixa, base ou giro de produto.",
       "duration_min": 12
      },
      {
       "title": "Lista de espera antes da data",
       "description": "Captar quando o anúncio é barato.",
       "duration_min": 14
      },
      {
       "title": "A oferta da data",
       "description": "Desconto, bônus ou pacote.",
       "duration_min": 15
      }
     ]
    },
    {
     "title": "A Semana",
     "description": "Comunicação na semana cheia.",
     "lessons": [
      {
       "title": "O calendário da semana",
       "description": "Esquenta, abertura, meio e fim.",
       "duration_min": 13
      },
      {
       "title": "Mensagens que furam o barulho",
       "description": "E-mail, WhatsApp e anúncio.",
       "duration_min": 15
      },
      {
       "title": "Anúncio na semana mais cara",
       "description": "Quanto e para quem anunciar.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "O Fechamento",
     "description": "Depois da data.",
     "lessons": [
      {
       "title": "Recuperação e última chamada",
       "description": "Quem quase comprou.",
       "duration_min": 11
      },
      {
       "title": "Números da Black Friday",
       "description": "O que repetir no ano que vem.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "lancamento-workshop",
   "title": "Lançamento por Workshop",
   "subtitle": "Um dia forte, uma venda clara",
   "category": "Lançamentos",
   "level": "Intermediário",
   "tags": "lançamento, workshop, evento online, vendas, médio ticket",
   "price": 397,
   "anchor_price": 797,
   "color": 1,
   "featured": false,
   "short_desc": "Planeje, lote e venda em um workshop online de um dia, com grade, captação, aquecimento e oferta no final.",
   "description": "O workshop concentra tudo em um dia: a pessoa reserva a agenda, aprende algo útil e recebe a oferta enquanto está quente.\n\nVocê monta a grade do dia, a campanha de inscrição, as mensagens até o evento e a virada para a venda.",
   "promise": "Um workshop online lotado, com uma oferta clara no final e números para comparar",
   "audience": [
    "Quem tem produto de médio ou alto valor e quer vender em evento",
    "Quem já faz live e quer transformar em lançamento",
    "Expert com base pequena que quer resultado rápido"
   ],
   "pains": [
    "Você faz live, entrega conteúdo e ninguém compra.",
    "Inscreve muita gente e pouca aparece.",
    "Não sabe a hora nem o jeito de fazer a oferta."
   ],
   "benefits": [
    "Grade: a ordem do dia que leva naturalmente à oferta.",
    "Comparecimento: as mensagens que fazem o inscrito aparecer.",
    "Oferta: a virada de conteúdo para venda sem constrangimento."
   ],
   "bonuses": [
    {
     "title": "Modelo de grade do workshop",
     "text": "A grade do dia com tempos e roteiro de transição.",
     "value": 97
    }
   ],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Planejamento",
     "description": "Antes de abrir inscrição.",
     "lessons": [
      {
       "title": "Quando o workshop é a escolha",
       "description": "Produto, base e tempo que combinam.",
       "duration_min": 12
      },
      {
       "title": "Metas mínima, audaciosa e agressiva",
       "description": "Os três números do lançamento.",
       "duration_min": 13
      },
      {
       "title": "Calendário e papéis",
       "description": "Quem faz o quê até o dia.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "A Captação",
     "description": "Encher a sala.",
     "lessons": [
      {
       "title": "Página de inscrição do workshop",
       "description": "Promessa do dia e data clara.",
       "duration_min": 14
      },
      {
       "title": "Campanha de inscrição",
       "description": "Verba, criativos e ID de campanha.",
       "duration_min": 16
      },
      {
       "title": "Mensagens até o dia",
       "description": "E-mail, WhatsApp e lembretes.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "O Dia",
     "description": "Conteúdo que leva à oferta.",
     "lessons": [
      {
       "title": "Montando a grade",
       "description": "Abertura, blocos de conteúdo e intervalo.",
       "duration_min": 18
      },
      {
       "title": "A transição para a oferta",
       "description": "O momento e as palavras.",
       "duration_min": 15
      },
      {
       "title": "Oferta, bônus e prazo",
       "description": "O que entra e até quando vale.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "O Fechamento",
     "description": "Depois do evento.",
     "lessons": [
      {
       "title": "Carrinho aberto e recuperação",
       "description": "Os dias depois do workshop.",
       "duration_min": 14
      },
      {
       "title": "Lendo os números do workshop",
       "description": "Inscrição, presença e conversão.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "lancamento-maratona",
   "title": "Lançamento por Maratona",
   "subtitle": "Três dias ou mais de conteúdo",
   "category": "Lançamentos",
   "level": "Intermediário",
   "tags": "lançamento, maratona, aulas ao vivo, vendas, médio ticket",
   "price": 397,
   "anchor_price": 797,
   "color": 1,
   "featured": false,
   "short_desc": "Quando o assunto pede mais de um dia: monte uma maratona de conteúdo que segura gente até o fim e abre o carrinho no momento certo.",
   "description": "A maratona dá tempo para construir confiança e mostrar resultado aos poucos. O desafio é manter as pessoas até o último dia, onde a oferta acontece.\n\nVocê desenha os dias, cria os ganchos entre um dia e outro, cuida da presença e prepara a abertura de carrinho.",
   "promise": "Uma maratona com presença alta até o último dia e carrinho aberto na hora certa",
   "audience": [
    "Quem tem assunto que não cabe em um dia",
    "Expert que vende produto de valor mais alto",
    "Quem já fez workshop e quer ir além"
   ],
   "pains": [
    "As pessoas aparecem no primeiro dia e somem no segundo.",
    "Você entrega tanto conteúdo que ninguém sente que precisa comprar.",
    "Não sabe quantos dias fazer."
   ],
   "benefits": [
    "Arco dos dias: cada dia com um papel na decisão de compra.",
    "Retenção: ganchos e tarefas que trazem a pessoa de volta.",
    "Abertura: o último dia preparado para vender."
   ],
   "bonuses": [
    {
     "title": "Roteiro dia a dia",
     "text": "Estrutura editável para uma maratona de três dias.",
     "value": 97
    }
   ],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Desenho",
     "description": "Quantos dias e para quê.",
     "lessons": [
      {
       "title": "Quando esticar o conteúdo",
       "description": "Assuntos que pedem tempo.",
       "duration_min": 11
      },
      {
       "title": "O arco da maratona",
       "description": "Problema, caminho, prova e oferta.",
       "duration_min": 15
      },
      {
       "title": "Metas e calendário",
       "description": "Os números e as datas.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "Os Dias",
     "description": "Conteúdo que constrói a venda.",
     "lessons": [
      {
       "title": "Montando cada dia",
       "description": "Abertura, conteúdo e gancho para o próximo.",
       "duration_min": 18
      },
      {
       "title": "Tarefas entre os dias",
       "description": "Pequenas vitórias que prendem.",
       "duration_min": 13
      },
      {
       "title": "O dia da oferta",
       "description": "Do último conteúdo à abertura do carrinho.",
       "duration_min": 16
      }
     ]
    },
    {
     "title": "A Presença",
     "description": "Gente até o fim.",
     "lessons": [
      {
       "title": "Grupo e lembretes",
       "description": "WhatsApp, e-mail e horário fixo.",
       "duration_min": 13
      },
      {
       "title": "Segurando quem faltou",
       "description": "Replay com prazo e resumo.",
       "duration_min": 11
      },
      {
       "title": "Lendo a maratona",
       "description": "Presença por dia e conversão final.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "lancamento-desafio",
   "title": "Lançamento por Desafio",
   "subtitle": "Tarefa todo dia, resultado no fim",
   "category": "Lançamentos",
   "level": "Intermediário",
   "tags": "lançamento, desafio, engajamento, comunidade, médio ticket",
   "price": 397,
   "anchor_price": 797,
   "color": 1,
   "featured": false,
   "short_desc": "Um desafio de alguns dias em que o participante faz uma tarefa por dia, sente o resultado e chega à oferta já em movimento.",
   "description": "O desafio vende pela experiência: a pessoa aplica, vê que funciona e quer continuar. A oferta é o próximo passo natural de quem já começou.\n\nVocê desenha as tarefas, monta a inscrição, cuida da comunidade durante os dias e fecha com a venda.",
   "promise": "Um desafio que faz o participante agir todos os dias e comprar para continuar",
   "audience": [
    "Quem ensina algo prático, que dá para aplicar em pouco tempo",
    "Quem quer comunidade engajada em volta do produto",
    "Expert que gosta de acompanhar de perto"
   ],
   "pains": [
    "Seu público assiste conteúdo e não aplica.",
    "O grupo fica silencioso depois do primeiro dia.",
    "Não sabe como ligar a tarefa à oferta."
   ],
   "benefits": [
    "Tarefas: uma por dia, curta e com resultado visível.",
    "Comunidade: o grupo que se ajuda e se mostra.",
    "Oferta: a continuação natural do desafio."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Desenho",
     "description": "O resultado que o desafio entrega.",
     "lessons": [
      {
       "title": "Por que o desafio funciona",
       "description": "Ação gera crença.",
       "duration_min": 11
      },
      {
       "title": "Desenhando as tarefas diárias",
       "description": "Pequenas, possíveis e ligadas ao produto.",
       "duration_min": 17
      },
      {
       "title": "Duração e regras",
       "description": "Quantos dias e o que conta.",
       "duration_min": 11
      }
     ]
    },
    {
     "title": "As Inscrições",
     "description": "Gente comprometida desde o início.",
     "lessons": [
      {
       "title": "Página e promessa do desafio",
       "description": "O resultado em poucos dias.",
       "duration_min": 13
      },
      {
       "title": "Campanha de inscrição",
       "description": "Criativos que mostram a tarefa.",
       "duration_min": 15
      },
      {
       "title": "Pago ou gratuito",
       "description": "O que muda no compromisso.",
       "duration_min": 11
      }
     ]
    },
    {
     "title": "Os Dias",
     "description": "Movimento e comunidade.",
     "lessons": [
      {
       "title": "Rotina do desafio",
       "description": "Tarefa, ao vivo e feedback.",
       "duration_min": 14
      },
      {
       "title": "Comunidade que se mostra",
       "description": "Provas e conquistas no grupo.",
       "duration_min": 12
      },
      {
       "title": "O dia da oferta",
       "description": "Continuar com você.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "A Leitura",
     "description": "O que o desafio revela.",
     "lessons": [
      {
       "title": "Quem fez as tarefas compra mais",
       "description": "Engajamento e conversão.",
       "duration_min": 12
      },
      {
       "title": "Ajustes para o próximo",
       "description": "O que manter e o que trocar.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "evento-presencial",
   "title": "Evento Presencial Que Vende",
   "subtitle": "Do ingresso à venda no palco",
   "category": "Lançamentos",
   "level": "Avançado",
   "tags": "evento presencial, palco, vendas, imersão, semi high ticket",
   "price": 797,
   "anchor_price": 1597,
   "color": 1,
   "featured": false,
   "short_desc": "Planeje um evento presencial lucrativo: ingresso, sala cheia, formulário de levantada de mão, venda no palco e follow-up depois.",
   "description": "O evento presencial vende o que o online não consegue: presença, confiança e decisão no calor do momento. Também é o que mais pode dar prejuízo se a sala ficar vazia.\n\nEste curso cobre o ciclo inteiro, da conta do ingresso à última ligação depois do evento, com base na rotina de quem produz eventos de captação.",
   "promise": "Um evento presencial com sala cheia, venda organizada e follow-up que fecha depois",
   "audience": [
    "Expert ou empresa que quer vender em evento físico",
    "Quem já faz evento e quer converter mais",
    "Produtor que organiza eventos para clientes"
   ],
   "pains": [
    "Você vende ingresso e metade não aparece.",
    "A venda no palco acontece no improviso.",
    "Depois do evento ninguém liga para quem levantou a mão."
   ],
   "benefits": [
    "Ingresso e presença: a conta e as mensagens que lotam a sala.",
    "Palco: oferta, formulário de levantada de mão e time de vendas.",
    "Follow-up: o roteiro dos dias seguintes."
   ],
   "bonuses": [
    {
     "title": "Planilha do evento",
     "text": "Orçamento, ponto de equilíbrio e metas do evento presencial.",
     "value": 197
    },
    {
     "title": "Modelo de formulário de levantada de mão",
     "text": "Perguntas que qualificam quem quer comprar.",
     "value": 97
    }
   ],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 50,
   "seasons": [
    {
     "title": "A Conta",
     "description": "Antes de reservar o local.",
     "lessons": [
      {
       "title": "O evento como produto",
       "description": "Ingresso, patrocínio e venda no palco.",
       "duration_min": 15
      },
      {
       "title": "Orçamento e ponto de equilíbrio",
       "description": "Quantas pessoas pagam o evento.",
       "duration_min": 16
      },
      {
       "title": "Metas mínima, audaciosa e agressiva",
       "description": "Os três cenários.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "A Sala Cheia",
     "description": "Do ingresso à cadeira ocupada.",
     "lessons": [
      {
       "title": "Campanha de ingresso",
       "description": "Lotes, prazos e anúncio.",
       "duration_min": 17
      },
      {
       "title": "Confirmação de presença",
       "description": "Mensagens até a véspera.",
       "duration_min": 13
      },
      {
       "title": "Experiência do participante",
       "description": "Credenciamento, sala e intervalo.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "O Palco",
     "description": "Venda organizada.",
     "lessons": [
      {
       "title": "A oferta do evento",
       "description": "Condição exclusiva e prazo.",
       "duration_min": 15
      },
      {
       "title": "Formulário que levanta a mão",
       "description": "Quem quer conversar com o time.",
       "duration_min": 14
      },
      {
       "title": "Time de vendas na sala",
       "description": "Quem atende, como e onde.",
       "duration_min": 16
      },
      {
       "title": "Logística da venda",
       "description": "Maquininha, link e contrato.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "O Depois",
     "description": "O evento continua.",
     "lessons": [
      {
       "title": "Follow-up depois do evento",
       "description": "O roteiro dos sete dias seguintes.",
       "duration_min": 15
      },
      {
       "title": "Números do evento",
       "description": "Presença, mãos levantadas e vendas.",
       "duration_min": 13
      },
      {
       "title": "O próximo evento",
       "description": "O que repetir e o que mudar.",
       "duration_min": 11
      }
     ]
    },
    {
     "title": "Operação",
     "description": "Bastidores que evitam crise.",
     "lessons": [
      {
       "title": "Checklist de produção",
       "description": "Do contrato do local ao som.",
       "duration_min": 14
      },
      {
       "title": "Equipe e papéis no dia",
       "description": "Cada pessoa com uma função.",
       "duration_min": 12
      },
      {
       "title": "Plano B",
       "description": "Quando algo quebra no meio.",
       "duration_min": 10
      }
     ]
    }
   ]
  },
  {
   "slug": "seu-primeiro-criativo",
   "title": "Seu Primeiro Criativo",
   "subtitle": "Um anúncio pronto em uma tarde",
   "category": "Design",
   "level": "Iniciante",
   "tags": "grátis, canva, criativo, anúncio, grátis",
   "price": 0,
   "anchor_price": 0,
   "color": 3,
   "featured": false,
   "short_desc": "Do zero ao primeiro anúncio estático pronto para subir, usando o Canva gratuito e uma estrutura que já vende.",
   "description": "Você não precisa ser designer para fazer um anúncio que para o dedo. Precisa de hierarquia clara, uma promessa legível no celular e um botão que diga o que fazer.\n\nEm quatro episódios você monta o seu primeiro criativo no Canva, na medida certa para Stories e Feed, e sabe o que testar depois.",
   "promise": "Um anúncio estático pronto para subir, feito por você no Canva gratuito",
   "audience": [
    "Quem nunca fez um anúncio e quer sair do zero",
    "Quem depende de outra pessoa para cada arte",
    "Quem quer conhecer a trilha de Design antes de escolher um curso"
   ],
   "pains": [
    "Você abre o Canva, vê mil modelos e não sabe qual usar.",
    "Suas artes ficam bonitas, mas ninguém clica.",
    "Você não sabe qual tamanho usar em cada lugar."
   ],
   "benefits": [
    "Estrutura: a ordem de leitura que faz um anúncio funcionar.",
    "Medidas: Stories, Feed e a área segura que serve para os dois.",
    "Teste: a primeira variação que vale a pena fazer."
   ],
   "bonuses": [],
   "cta_text": "Assistir de graça",
   "aff_enabled": false,
   "aff_commission": 0,
   "seasons": [
    {
     "title": "A Primeira Arte",
     "description": "Do quadro em branco ao arquivo exportado.",
     "lessons": [
      {
       "title": "Por que o anúncio precisa ser feio às vezes",
       "description": "Clareza vence enfeite no feed.",
       "duration_min": 7
      },
      {
       "title": "Promessa, prova e botão",
       "description": "As três camadas de todo anúncio que vende.",
       "duration_min": 9
      },
      {
       "title": "Montando no Canva",
       "description": "Medida, fonte, cor e área segura, passo a passo.",
       "duration_min": 14
      },
      {
       "title": "Exportar e testar a variação",
       "description": "O formato certo e a primeira troca que você testa.",
       "duration_min": 8
      }
     ]
    }
   ]
  },
  {
   "slug": "canva-que-vende",
   "title": "Canva Que Vende",
   "subtitle": "Profissional dentro do Canva",
   "category": "Design",
   "level": "Iniciante",
   "tags": "canva, design, criativo, kit de marca, low ticket",
   "price": 97,
   "anchor_price": 197,
   "color": 3,
   "featured": false,
   "short_desc": "Use o Canva como ferramenta de produção profissional: kit de marca, modelos próprios, atalhos e exportação certa para anúncio.",
   "description": "O Canva deixa qualquer pessoa fazer uma arte. O que separa amador de profissional é o sistema: marca configurada, modelos próprios e produção em lote.\n\nVocê monta o seu kit de marca, cria modelos reaproveitáveis e passa a produzir peças em minutos, com a IA do Canva usada com critério.",
   "promise": "Produzir artes com cara de marca no Canva em minutos, a partir dos seus próprios modelos",
   "audience": [
    "Quem já usa Canva e quer resultado profissional",
    "Empreendedor que faz as próprias artes",
    "Social media que precisa produzir rápido"
   ],
   "pains": [
    "Cada arte sua parece de uma marca diferente.",
    "Você perde tempo procurando modelo toda vez.",
    "A arte fica borrada ou cortada quando sobe no anúncio."
   ],
   "benefits": [
    "Kit de marca: cores, fontes e logo configurados uma vez.",
    "Modelos próprios: peças que você reaproveita para sempre.",
    "Exportação: tamanho e formato certos para cada lugar."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Base",
     "description": "Configurar uma vez.",
     "lessons": [
      {
       "title": "Kit de marca dentro do Canva",
       "description": "Cores, fontes e logo no lugar certo.",
       "duration_min": 14
      },
      {
       "title": "Grade, margem e área segura",
       "description": "O esqueleto de toda peça.",
       "duration_min": 12
      },
      {
       "title": "Fontes que funcionam no celular",
       "description": "Tamanho mínimo e contraste.",
       "duration_min": 10
      }
     ]
    },
    {
     "title": "A Produção",
     "description": "Rápido sem perder qualidade.",
     "lessons": [
      {
       "title": "Modelos e atalhos de produção",
       "description": "Seu acervo de peças prontas.",
       "duration_min": 16
      },
      {
       "title": "Produção em lote",
       "description": "Dez variações de uma vez.",
       "duration_min": 15
      },
      {
       "title": "IA do Canva com critério",
       "description": "Onde ajuda e onde atrapalha.",
       "duration_min": 13
      },
      {
       "title": "Exportar para anúncio",
       "description": "Formato, qualidade e tamanho.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "design-que-vende",
   "title": "Design Que Vende",
   "subtitle": "Estilos de anúncio que convertem",
   "category": "Design",
   "level": "Intermediário",
   "tags": "design, anúncio, criativo, estilos de ads, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 3,
   "featured": false,
   "short_desc": "Os estilos de anúncio que mais vendem no feed, por que funcionam e como montar cada um, com hierarquia, prova e chamada certas.",
   "description": "Anúncio bonito e anúncio que vende são coisas diferentes. Os estilos que convertem seguem regras de leitura, de prova e de contraste que dá para aprender e repetir.\n\nVocê estuda os formatos que funcionam, entende o porquê de cada um e sai com uma biblioteca de estruturas para usar em qualquer ferramenta.",
   "promise": "Montar anúncios nos estilos que vendem, sabendo por que cada um funciona",
   "audience": [
    "Quem faz criativo para anúncio e quer converter mais",
    "Gestor de tráfego que briefa designer",
    "Designer que quer trabalhar com performance"
   ],
   "pains": [
    "Seus anúncios são bonitos e não vendem.",
    "Você copia referência sem saber por que ela funciona.",
    "Não sabe qual estilo testar primeiro."
   ],
   "benefits": [
    "Leitura: hierarquia, tipografia e cor a favor da mensagem.",
    "Estilos: direto, prova, nativo, antes e depois e mais.",
    "Teste: qual estilo testar primeiro em cada fase."
   ],
   "bonuses": [
    {
     "title": "Biblioteca de estruturas de anúncio",
     "text": "Esqueletos dos estilos do curso, prontos para adaptar.",
     "value": 97
    }
   ],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Olhar",
     "description": "O que faz alguém ler.",
     "lessons": [
      {
       "title": "Hierarquia: o que ler primeiro",
       "description": "O caminho do olho no anúncio.",
       "duration_min": 14
      },
      {
       "title": "Tipografia sem medo",
       "description": "Fonte, peso e tamanho para o celular.",
       "duration_min": 15
      },
      {
       "title": "Cor que comunica",
       "description": "Contraste e destaque com intenção.",
       "duration_min": 13
      },
      {
       "title": "Composição e respiro",
       "description": "Espaço vazio que dá foco.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "Os Estilos",
     "description": "Formatos que vendem.",
     "lessons": [
      {
       "title": "Estático direto e carrossel",
       "description": "A promessa sem rodeio.",
       "duration_min": 16
      },
      {
       "title": "Print, depoimento e antes e depois",
       "description": "Prova no centro do anúncio.",
       "duration_min": 17
      },
      {
       "title": "Nativo, meme e feio que vende",
       "description": "Quando parecer anúncio atrapalha.",
       "duration_min": 15
      },
      {
       "title": "Lista, comparação e pergunta",
       "description": "Estruturas que organizam a decisão.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "Do Estilo ao Teste",
     "description": "Escolher e testar.",
     "lessons": [
      {
       "title": "O que testar primeiro",
       "description": "O estilo certo para cada fase.",
       "duration_min": 14
      },
      {
       "title": "Biblioteca de referências",
       "description": "Como guardar e estudar anúncios.",
       "duration_min": 12
      },
      {
       "title": "Briefing para designer ou IA",
       "description": "Pedir o anúncio certo.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "criativo-em-escala",
   "title": "Criativo em Escala",
   "subtitle": "Anúncios em volume, com método e imagem por IA",
   "category": "Design",
   "level": "Intermediário",
   "tags": "criativos, anúncios, volume, canva, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 3,
   "featured": false,
   "short_desc": "Um método para produzir dezenas de anúncios por campanha: matriz de ideias, lotes no Canva e leitura de quais criativos merecem escala.",
   "description": "O anúncio perfeito não existe, e esperar por ele custa caro. Aqui você troca o perfeccionismo por volume com critério: muitas variações bem pensadas, produzidas em lote e testadas com método.\n\nVocê monta a matriz de ângulos, formatos e ganchos, produz as peças em lote e aprende a nomear, subir e ler os criativos até separar o campeão do resto.",
   "promise": "Montar 30 variações de anúncio em um dia e saber qual delas escalar",
   "audience": [
    "Gestores de tráfego que travam na hora de produzir criativo novo",
    "Donos de negócio que rodam os próprios anúncios e vivem com poucas peças",
    "Designers e social media que entram na rotina de uma campanha",
    "Times de marketing que precisam alimentar campanhas toda semana"
   ],
   "pains": [
    "Você sobe poucos anúncios e o resultado depende da sorte.",
    "Gasta dias refinando uma peça que o público ignora em horas.",
    "O público enjoa porque seus anúncios são sempre parecidos.",
    "Você não sabe dizer qual criativo venceu, porque nomes e testes viraram bagunça."
   ],
   "benefits": [
    "Matriz de criativos: ângulos, formatos e ganchos cruzados numa planilha que gera as ideias por você",
    "Produção em lote: modelos e rotina para fechar dezenas de peças em um dia",
    "Leitura de campeão: nomes, métricas e critério para reciclar o que funciona e cortar o resto"
   ],
   "bonuses": [
    {
     "title": "Planilha da Matriz de Criativos",
     "text": "Ângulos, formatos e ganchos em colunas, com a lógica de cruzamento pronta para você preencher.",
     "value": 97
    }
   ],
   "cta_text": "Quero produzir em escala",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Volume Vence",
     "description": "Por que várias boas variações costumam ganhar de um anúncio perfeito.",
     "lessons": [
      {
       "title": "Por que o perfeito perde",
       "description": "Por que várias versões testadas costumam vencer um anúncio lapidado, e como mudar a cabeça do perfeccionista.",
       "duration_min": 11
      },
      {
       "title": "Variação de verdade",
       "description": "A diferença entre mudar ângulo, formato e gancho e só trocar a cor da mesma peça.",
       "duration_min": 12
      },
      {
       "title": "Quantos criativos por fase",
       "description": "Quantas peças subir por campanha, no teste, na validação e na escala, sem estourar o orçamento nem a equipe.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "A Matriz",
     "description": "Ângulos, formatos e ganchos cruzados para nunca ficar sem ideia.",
     "lessons": [
      {
       "title": "Ângulos: por que alguém compra",
       "description": "Dor, desejo, prova, objeção e urgência: os motivos de compra que viram a base de cada anúncio.",
       "duration_min": 15
      },
      {
       "title": "Formatos e ganchos",
       "description": "Os formatos de peça e os ganchos que abrem cada um, listados para você cruzar com os ângulos.",
       "duration_min": 14
      },
      {
       "title": "A matriz de 30 variações",
       "description": "Cruzar ângulos, formatos e ganchos numa planilha e sair com 30 peças planejadas em um único dia.",
       "duration_min": 19
      },
      {
       "title": "Produção em lote no Canva",
       "description": "Páginas duplicadas, modelos travados e criação em massa para transformar a matriz em arquivos prontos.",
       "duration_min": 22
      }
     ]
    },
    {
     "title": "Do Teste ao Campeão",
     "description": "Subir, ler e reciclar: o caminho do criativo até a escala.",
     "lessons": [
      {
       "title": "Nomes e upload em lote",
       "description": "Um padrão de nomes que você entende meses depois e o jeito de subir dezenas de anúncios de uma vez.",
       "duration_min": 17
      },
      {
       "title": "Lendo métricas de criativo",
       "description": "Retenção do vídeo, CTR, custo por resultado e frequência lidos juntos para saber qual peça está ganhando.",
       "duration_min": 20
      },
      {
       "title": "Reciclando o campeão",
       "description": "Como derivar novas versões do criativo vencedor, trocando um elemento por vez, e quando aposentá-lo.",
       "duration_min": 14
      }
     ]
    }
   ]
  },
  {
   "slug": "corel-sem-medo",
   "title": "Corel Sem Medo",
   "subtitle": "Vetor, logo e impressão",
   "category": "Design",
   "level": "Intermediário",
   "tags": "coreldraw, vetor, logo, impressão, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 3,
   "featured": false,
   "short_desc": "O CorelDRAW do zero ao arquivo de gráfica: vetor, logo, peças para impressão e fechamento de arquivo sem susto.",
   "description": "Quando a peça vai para gráfica, para fachada ou precisa de um logo que aguenta qualquer tamanho, o Canva não basta. O Corel resolve, desde que você saiba onde mexer.\n\nVocê aprende as ferramentas que importam, desenha um logo em vetor e fecha arquivos de impressão que a gráfica aceita na primeira vez.",
   "promise": "Criar vetores, logos e peças de impressão no CorelDRAW e fechar o arquivo certo para a gráfica",
   "audience": [
    "Quem faz design no Canva e precisa ir além",
    "Quem trabalha com gráfica, comunicação visual ou brindes",
    "Iniciante que quer aprender uma ferramenta profissional"
   ],
   "pains": [
    "Você manda o arquivo e a gráfica devolve dizendo que está errado.",
    "Seu logo pixela quando aumenta.",
    "A tela do Corel parece complicada demais."
   ],
   "benefits": [
    "Ferramentas: as poucas que você usa todo dia.",
    "Vetor e logo: desenho que escala sem perder qualidade.",
    "Arquivo de gráfica: cor, sangria e curva."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Primeiros Passos",
     "description": "O Corel sem susto.",
     "lessons": [
      {
       "title": "Corel ou Canva: qual abrir",
       "description": "O trabalho certo para cada um.",
       "duration_min": 10
      },
      {
       "title": "A tela e os atalhos",
       "description": "O que você usa de verdade.",
       "duration_min": 14
      },
      {
       "title": "Formas, nós e soldar",
       "description": "A base de todo vetor.",
       "duration_min": 16
      }
     ]
    },
    {
     "title": "Vetor e Logo",
     "description": "Desenho que escala.",
     "lessons": [
      {
       "title": "Vetorizando uma imagem",
       "description": "Do rabisco à curva limpa.",
       "duration_min": 18
      },
      {
       "title": "Logo do zero",
       "description": "Símbolo, fonte e versões.",
       "duration_min": 22
      },
      {
       "title": "Manual simples da marca",
       "description": "Cores, usos e proibições.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "Impressão",
     "description": "O arquivo que a gráfica aceita.",
     "lessons": [
      {
       "title": "Cor para impressão",
       "description": "RGB, CMYK e Pantone sem confusão.",
       "duration_min": 14
      },
      {
       "title": "Sangria, margem e curvas",
       "description": "O fechamento de arquivo.",
       "duration_min": 15
      },
      {
       "title": "Peças do dia a dia",
       "description": "Cartão, banner, adesivo e fachada.",
       "duration_min": 18
      }
     ]
    }
   ]
  },
  {
   "slug": "gancho-de-3-segundos",
   "title": "Gancho de 3 Segundos",
   "subtitle": "O começo que segura o vídeo",
   "category": "Vídeo",
   "level": "Iniciante",
   "tags": "grátis, vídeo, roteiro, gancho, reels, grátis",
   "price": 0,
   "anchor_price": 0,
   "color": 4,
   "featured": false,
   "short_desc": "Quatro episódios sobre os três primeiros segundos de um vídeo: o momento que decide se a pessoa fica ou rola o feed.",
   "description": "A maioria dos vídeos morre antes do segundo três. Não por falta de conteúdo, mas porque o começo não dá motivo para ficar.\n\nVocê aprende os tipos de gancho, escreve dez para a mesma ideia e sabe se vale seguir para o Roteiro Que Prende.",
   "promise": "Escrever ganchos que fazem a pessoa assistir até o fim",
   "audience": [
    "Quem grava vídeo e vê a retenção cair logo no começo",
    "Quem faz anúncio em vídeo",
    "Quem quer conhecer a trilha de Vídeo"
   ],
   "pains": [
    "Seus vídeos têm visualização e quase ninguém assiste inteiro.",
    "Você começa todo vídeo do mesmo jeito.",
    "Não sabe o que dizer no primeiro segundo."
   ],
   "benefits": [
    "Tipos de gancho: os padrões que funcionam.",
    "Prática: dez ganchos para a mesma ideia.",
    "Próximo passo: o roteiro completo."
   ],
   "bonuses": [],
   "cta_text": "Assistir de graça",
   "aff_enabled": false,
   "aff_commission": 0,
   "seasons": [
    {
     "title": "O Gancho",
     "description": "Os três segundos que decidem.",
     "lessons": [
      {
       "title": "Por que o começo decide tudo",
       "description": "Retenção e algoritmo.",
       "duration_min": 7
      },
      {
       "title": "Os tipos de gancho",
       "description": "Pergunta, contraste, resultado e cena.",
       "duration_min": 10
      },
      {
       "title": "Imagem, texto e fala juntos",
       "description": "O gancho em três camadas.",
       "duration_min": 9
      },
      {
       "title": "Dez ganchos para uma ideia",
       "description": "Exercício guiado.",
       "duration_min": 10
      }
     ]
    }
   ]
  },
  {
   "slug": "roteiro-que-prende",
   "title": "Roteiro Que Prende",
   "subtitle": "Ganchos e estruturas para vídeo curto, anúncio e aula",
   "category": "Vídeo",
   "level": "Iniciante",
   "tags": "roteiro, vídeo curto, gancho, reels, ia, low ticket",
   "price": 97,
   "anchor_price": 197,
   "color": 4,
   "featured": false,
   "short_desc": "Aprenda a escrever o início que segura a pessoa e a estrutura que a leva até o fim, em reels, anúncios, vídeos de venda, YouTube e aulas.",
   "description": "Todo vídeo disputa atenção nos primeiros segundos. Aqui você aprende a escrever o gancho que segura e a estrutura que mantém a pessoa assistindo, sem depender de talento para falar.\n\nVocê vai ver estruturas para reels, anúncios, vídeos curtos de venda, YouTube e aulas, e usar a IA para ganhar tempo: gerar ideias, escrever rascunhos e adaptar um roteiro que já funcionou.",
   "promise": "Escrever roteiros que seguram a atenção desde os primeiros segundos",
   "audience": [
    "Quem grava vídeo para a própria marca e trava na hora de escrever",
    "Gestores de tráfego e social media que precisam de roteiros para anúncios e reels",
    "Professores e produtores de curso que querem aulas mais claras",
    "Quem já grava, mas vê o público sair nos primeiros segundos"
   ],
   "pains": [
    "Você liga a câmera e não sabe por onde começar.",
    "Seu vídeo abre com um oi demorado e a pessoa já foi embora.",
    "Você grava, regrava e o texto ainda soa decorado.",
    "Cada roteiro nasce do zero, e as ideias acabam antes do fim da semana."
   ],
   "benefits": [
    "Gancho que segura: tipos de abertura para os três primeiros segundos de qualquer vídeo",
    "Estrutura certa: esqueleto pronto para reels, anúncio, vídeo de venda, YouTube e aula",
    "IA como apoio de escrita: prompts e banco de ideias para escrever mais rápido sem perder a sua voz"
   ],
   "bonuses": [
    {
     "title": "Banco de ganchos",
     "text": "Aberturas organizadas por tipo e por objetivo, para adaptar ao seu assunto em poucos minutos.",
     "value": 67
    },
    {
     "title": "Modelos de roteiro",
     "text": "Uma página por formato, com os campos para preencher: reels, anúncio, vídeo de venda, YouTube e aula.",
     "value": 47
    }
   ],
   "cta_text": "Quero roteiros que prendem",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Gancho",
     "description": "Os três primeiros segundos decidem se o resto será visto.",
     "lessons": [
      {
       "title": "Os três primeiros segundos",
       "description": "O que a pessoa decide logo no início do vídeo e por que a abertura merece mais tempo de roteiro.",
       "duration_min": 9
      },
      {
       "title": "Tipos de gancho",
       "description": "Curiosidade, dor, promessa, contraste, prova e pergunta: cada tipo de abertura e quando usar.",
       "duration_min": 12
      },
      {
       "title": "Dez ganchos para a mesma ideia",
       "description": "Um exercício para escrever várias aberturas da mesma ideia e escolher a mais forte antes de gravar.",
       "duration_min": 10
      }
     ]
    },
    {
     "title": "Estruturas",
     "description": "O esqueleto de cada formato, para você só preencher com o seu assunto.",
     "lessons": [
      {
       "title": "Reels que seguram até o fim",
       "description": "A estrutura do vídeo curto, do gancho ao fechamento, para a pessoa assistir até o final e agir.",
       "duration_min": 14
      },
      {
       "title": "Roteiro de anúncio em vídeo",
       "description": "Gancho, problema, solução, prova e chamada: o roteiro do anúncio que vende sem parecer propaganda.",
       "duration_min": 15
      },
      {
       "title": "Vídeo curto de venda",
       "description": "Como apresentar uma oferta em poucos minutos: promessa, para quem é, o que inclui e a chamada.",
       "duration_min": 15
      },
      {
       "title": "Roteiro para YouTube",
       "description": "Como estruturar um vídeo mais longo, com abertura, blocos e pontos que renovam a atenção.",
       "duration_min": 16
      },
      {
       "title": "Roteiro de aula",
       "description": "Objetivo, explicação, exemplo e exercício: o roteiro de uma aula que a pessoa consegue acompanhar.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "Roteiro com IA",
     "description": "A IA como parceira de escrita, com você no comando.",
     "lessons": [
      {
       "title": "Prompt de roteiro que funciona",
       "description": "Como passar tema, público, formato e tom para a IA devolver um rascunho que você consegue usar.",
       "duration_min": 14
      },
      {
       "title": "Banco de ideias com IA",
       "description": "Montar uma lista de pautas e ganchos a partir do seu público, das dúvidas que você recebe e do produto.",
       "duration_min": 12
      },
      {
       "title": "Adaptando um roteiro campeão",
       "description": "Pegar um roteiro que já deu certo e gerar versões novas sem copiar, mudando ângulo, tema e formato.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "grava-com-o-celular",
   "title": "Grava com o Celular",
   "subtitle": "Câmera, luz e som sem estúdio",
   "category": "Vídeo",
   "level": "Iniciante",
   "tags": "vídeo, gravação, celular, luz, áudio, low ticket",
   "price": 67,
   "anchor_price": 147,
   "color": 4,
   "featured": false,
   "short_desc": "Grave vídeos com cara profissional usando só o celular: enquadramento, luz natural, áudio limpo e presença diante da câmera.",
   "description": "O celular que está no seu bolso grava melhor do que muita câmera de dez anos atrás. O que estraga o vídeo quase sempre é luz, som e posição.\n\nVocê ajusta a câmera, resolve luz e áudio com pouco dinheiro e perde a trava de falar para a lente.",
   "promise": "Gravar vídeos com imagem e som limpos usando só o celular",
   "audience": [
    "Quem grava conteúdo ou anúncio no celular",
    "Quem trava na frente da câmera",
    "Quem quer melhorar o vídeo sem comprar equipamento caro"
   ],
   "pains": [
    "Seu vídeo fica escuro ou estourado.",
    "O áudio tem eco e barulho de rua.",
    "Você trava e regrava dez vezes."
   ],
   "benefits": [
    "Câmera: configurações e enquadramento certos.",
    "Luz e som: soluções baratas que resolvem.",
    "Presença: falar para a lente com naturalidade."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Imagem",
     "description": "O celular como câmera.",
     "lessons": [
      {
       "title": "Configurando o celular",
       "description": "Resolução, quadros e foco.",
       "duration_min": 11
      },
      {
       "title": "Luz natural e luz barata",
       "description": "Janela, rebatedor e ring light.",
       "duration_min": 11
      },
      {
       "title": "Enquadramento que funciona",
       "description": "Altura, distância e fundo.",
       "duration_min": 10
      }
     ]
    },
    {
     "title": "O Som e a Presença",
     "description": "O que mais pesa.",
     "lessons": [
      {
       "title": "Áudio limpo com lapela",
       "description": "Microfone barato que resolve.",
       "duration_min": 12
      },
      {
       "title": "Falando para a lente",
       "description": "Olhar, ritmo e energia.",
       "duration_min": 13
      },
      {
       "title": "Teleprompter e roteiro",
       "description": "Ler sem parecer leitura.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "edicao-que-segura",
   "title": "Edição Que Segura",
   "subtitle": "Corte, ritmo e legenda",
   "category": "Vídeo",
   "level": "Intermediário",
   "tags": "edição de vídeo, capcut, premiere, reels, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 4,
   "featured": false,
   "short_desc": "Edite vídeos curtos que seguram atenção: corte seco, ritmo, legenda legível, B-roll, trilha e exportação certa para cada rede.",
   "description": "A edição é onde o vídeo ganha ritmo. Um corte no lugar certo e uma legenda bem feita valem mais do que qualquer efeito.\n\nVocê escolhe a ferramenta, aprende o corte que segura, monta legendas e trilha, e cria um fluxo para editar rápido toda semana.",
   "promise": "Editar vídeos curtos com ritmo e acabamento profissional, em pouco tempo",
   "audience": [
    "Quem grava e não sabe editar",
    "Social media que edita para clientes",
    "Quem edita, mas leva horas em cada vídeo"
   ],
   "pains": [
    "Seus vídeos ficam arrastados.",
    "Legenda pequena, mal sincronizada ou difícil de ler.",
    "Você leva uma tarde para editar um minuto de vídeo."
   ],
   "benefits": [
    "Corte e ritmo: o vídeo sem respiros mortos.",
    "Acabamento: legenda, B-roll, trilha e cor básica.",
    "Fluxo: editar rápido toda semana."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Ferramenta",
     "description": "Escolher e configurar.",
     "lessons": [
      {
       "title": "CapCut ou Premiere",
       "description": "O que cada um resolve.",
       "duration_min": 10
      },
      {
       "title": "Projeto organizado",
       "description": "Pastas, nomes e atalhos.",
       "duration_min": 11
      }
     ]
    },
    {
     "title": "O Corte",
     "description": "Ritmo que segura.",
     "lessons": [
      {
       "title": "Corte seco e ritmo",
       "description": "Tirando o que sobra.",
       "duration_min": 16
      },
      {
       "title": "Jump cut e zoom",
       "description": "Movimento sem exagero.",
       "duration_min": 12
      },
      {
       "title": "Legendas fáceis de ler",
       "description": "Tamanho, posição e sincronia.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "O Acabamento",
     "description": "O vídeo pronto.",
     "lessons": [
      {
       "title": "B-roll e trilha",
       "description": "Imagem de apoio e música certa.",
       "duration_min": 15
      },
      {
       "title": "Cor e áudio básicos",
       "description": "Ajustes que fazem diferença.",
       "duration_min": 13
      },
      {
       "title": "Exportação para cada rede",
       "description": "Formato, tamanho e capa.",
       "duration_min": 11
      }
     ]
    },
    {
     "title": "O Fluxo",
     "description": "Toda semana sem sofrer.",
     "lessons": [
      {
       "title": "Modelos de edição",
       "description": "Reaproveitar o que já funciona.",
       "duration_min": 12
      },
      {
       "title": "Edição em lote",
       "description": "Vários vídeos de uma vez.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "obs-na-pratica",
   "title": "OBS na Prática",
   "subtitle": "Tela, câmera e áudio gravados juntos",
   "category": "Vídeo",
   "level": "Iniciante",
   "tags": "obs studio, gravação de tela, aula, live, low ticket",
   "price": 47,
   "anchor_price": 97,
   "color": 4,
   "featured": false,
   "short_desc": "Configure o OBS Studio do zero para gravar aula com tela, câmera e áudio juntos, em boa qualidade e sem travar o computador.",
   "description": "O OBS é gratuito e grava qualquer coisa, mas a primeira tela assusta. Com as cenas certas configuradas, gravar uma aula vira apertar um botão.\n\nVocê instala, monta suas cenas e acerta qualidade e áudio para gravar sem retrabalho.",
   "promise": "Gravar aula com tela, câmera e áudio no OBS, sem travar e sem retrabalho",
   "audience": [
    "Quem vai gravar aula ou tutorial",
    "Quem já tentou o OBS e desistiu",
    "Quem quer preparar o computador para live"
   ],
   "pains": [
    "O OBS parece complicado demais.",
    "Sua gravação fica travando ou com áudio fora de sincronia.",
    "Você grava e descobre depois que o microfone estava mudo."
   ],
   "benefits": [
    "Configuração: o OBS ajustado para o seu computador.",
    "Cenas: tela, câmera e combinações prontas.",
    "Qualidade: gravação local leve e nítida."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Configurar",
     "description": "O OBS do zero.",
     "lessons": [
      {
       "title": "Instalar e configurar o OBS",
       "description": "O assistente e os ajustes que importam.",
       "duration_min": 14
      },
      {
       "title": "Cenas e fontes",
       "description": "Tela, câmera, imagem e texto.",
       "duration_min": 16
      },
      {
       "title": "Áudio que não falha",
       "description": "Microfone, filtros e medidor.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "Gravar",
     "description": "Aula pronta.",
     "lessons": [
      {
       "title": "Tela, câmera e áudio juntos",
       "description": "A cena principal da aula.",
       "duration_min": 15
      },
      {
       "title": "Qualidade e gravação local",
       "description": "Formato, taxa e pasta certa.",
       "duration_min": 13
      },
      {
       "title": "Checklist antes do gravar",
       "description": "Os cinco itens que evitam regravar.",
       "duration_min": 8
      }
     ]
    }
   ]
  },
  {
   "slug": "ao-vivo-sem-travar",
   "title": "Ao Vivo Sem Travar",
   "subtitle": "Aula e live com tranquilidade",
   "category": "Vídeo",
   "level": "Iniciante",
   "tags": "live, aula ao vivo, youtube, zoom, instagram, low ticket",
   "price": 67,
   "anchor_price": 147,
   "color": 4,
   "featured": false,
   "short_desc": "Prepare e conduza aulas e lives sem susto: plataforma certa, checklist técnico, plano para quando algo quebra e venda ao vivo.",
   "description": "A live dá proximidade e vende, mas tudo acontece em tempo real: internet, áudio, chat e oferta. O segredo é preparar o que dá para preparar e ter plano para o resto.\n\nVocê escolhe a plataforma, monta o checklist, aprende a interagir com o chat e a fazer a oferta ao vivo.",
   "promise": "Fazer aulas e lives tranquilas, com plano para imprevistos e venda no final",
   "audience": [
    "Quem vai fazer a primeira live ou aula ao vivo",
    "Quem já fez live e passou aperto",
    "Quem quer vender ao vivo"
   ],
   "pains": [
    "Você tem medo da internet cair no meio.",
    "O chat anda rápido e você se perde.",
    "Não sabe como fazer a oferta sem ficar estranho."
   ],
   "benefits": [
    "Plataforma: YouTube, Zoom ou Instagram para cada objetivo.",
    "Preparação: checklist técnico e plano B.",
    "Condução: chat, ritmo e oferta ao vivo."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Antes",
     "description": "Preparação.",
     "lessons": [
      {
       "title": "YouTube, Zoom ou Instagram",
       "description": "A plataforma certa para cada live.",
       "duration_min": 14
      },
      {
       "title": "Checklist técnico e internet",
       "description": "Testes de véspera e do dia.",
       "duration_min": 11
      },
      {
       "title": "Quando a live quebra",
       "description": "O plano B pronto.",
       "duration_min": 10
      }
     ]
    },
    {
     "title": "Durante",
     "description": "Conduzir com calma.",
     "lessons": [
      {
       "title": "Moderar e interagir",
       "description": "Chat, perguntas e moderador.",
       "duration_min": 12
      },
      {
       "title": "Ritmo da aula ao vivo",
       "description": "Blocos, pausas e retomadas.",
       "duration_min": 11
      },
      {
       "title": "Vender ao vivo",
       "description": "A oferta no tempo certo.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "aula-que-ensina",
   "title": "Aula Que Ensina",
   "subtitle": "Montar uma aula do objetivo ao exercício",
   "category": "Vídeo",
   "level": "Iniciante",
   "tags": "aula, didática, curso online, roteiro de aula, médio ticket",
   "price": 147,
   "anchor_price": 297,
   "color": 4,
   "featured": false,
   "short_desc": "Monte aulas que ensinam de verdade: objetivo claro, roteiro com exemplo, exercício e duração certa para o aluno terminar.",
   "description": "Uma aula boa não é a que tem mais conteúdo. É a que leva o aluno a fazer algo novo no final. Isso se planeja antes de apertar o gravar.\n\nVocê aprende a montar a aula em blocos, a escolher exemplos que fixam e a fechar com uma tarefa que o aluno consegue cumprir.",
   "promise": "Montar aulas curtas que o aluno termina e aplica",
   "audience": [
    "Quem vai gravar o primeiro curso",
    "Expert que sabe muito e não sabe por onde começar a aula",
    "Quem tem curso com aluno que não termina"
   ],
   "pains": [
    "Suas aulas ficam longas e o aluno abandona.",
    "Você explica tudo e o aluno não consegue aplicar.",
    "Não sabe quanto conteúdo cabe em uma aula."
   ],
   "benefits": [
    "Objetivo: o que o aluno faz ao final de cada aula.",
    "Roteiro: abertura, explicação, exemplo e tarefa.",
    "Duração: aulas curtas que mantêm o ritmo do curso."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Planejamento",
     "description": "Antes de gravar.",
     "lessons": [
      {
       "title": "O objetivo da aula",
       "description": "Uma ação por aula.",
       "duration_min": 10
      },
      {
       "title": "Do curso à aula",
       "description": "Quebrando o conteúdo em partes.",
       "duration_min": 13
      },
      {
       "title": "Duração ideal",
       "description": "Quanto cabe e quando dividir.",
       "duration_min": 9
      }
     ]
    },
    {
     "title": "O Roteiro",
     "description": "Aula que fixa.",
     "lessons": [
      {
       "title": "Abertura que situa",
       "description": "Onde estamos e para onde vamos.",
       "duration_min": 10
      },
      {
       "title": "Explicação com exemplo",
       "description": "O exemplo que vale mais que a teoria.",
       "duration_min": 14
      },
      {
       "title": "Exercício e material de apoio",
       "description": "A tarefa que prova o aprendizado.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "A Gravação",
     "description": "Do roteiro à aula pronta.",
     "lessons": [
      {
       "title": "Formato: tela, rosto ou os dois",
       "description": "O jeito certo para cada aula.",
       "duration_min": 11
      },
      {
       "title": "Revisão antes de publicar",
       "description": "O checklist da aula boa.",
       "duration_min": 10
      }
     ]
    }
   ]
  },
  {
   "slug": "prompt-que-funciona",
   "title": "Prompt Que Funciona",
   "subtitle": "Pedir bem para a IA",
   "category": "Inteligência artificial",
   "level": "Iniciante",
   "tags": "grátis, ia, prompt, chatgpt, claude, grátis",
   "price": 0,
   "anchor_price": 0,
   "color": 2,
   "featured": false,
   "short_desc": "Quatro episódios para escrever pedidos que a IA entende: contexto, objetivo, exemplo e revisão.",
   "description": "A diferença entre a resposta genérica e a resposta que você usa está no pedido. Quem dá contexto, exemplo e critério recebe trabalho pronto.\n\nVocê aprende a estrutura de um bom prompt, testa na prática e descobre qual curso da trilha de IA faz mais sentido para você.",
   "promise": "Escrever pedidos para a IA que voltam com trabalho utilizável",
   "audience": [
    "Quem usa IA e acha as respostas genéricas",
    "Quem ainda não usa IA no trabalho",
    "Quem quer conhecer a trilha de IA"
   ],
   "pains": [
    "A IA responde o óbvio.",
    "Você reescreve tudo o que ela entrega.",
    "Não sabe o que pedir para ela."
   ],
   "benefits": [
    "Estrutura: contexto, objetivo, formato e critério.",
    "Exemplo: mostrar o que você quer.",
    "Revisão: pedir ajuste em vez de recomeçar."
   ],
   "bonuses": [],
   "cta_text": "Assistir de graça",
   "aff_enabled": false,
   "aff_commission": 0,
   "seasons": [
    {
     "title": "Pedir Bem",
     "description": "O básico que muda tudo.",
     "lessons": [
      {
       "title": "Contexto e objetivo",
       "description": "Quem você é e o que precisa.",
       "duration_min": 9
      },
      {
       "title": "Formato e exemplo",
       "description": "Mostrar como deve sair.",
       "duration_min": 9
      },
      {
       "title": "Revisar em conversa",
       "description": "Ajustar sem recomeçar.",
       "duration_min": 8
      },
      {
       "title": "Escolher a ferramenta certa",
       "description": "Texto, imagem, código ou planilha.",
       "duration_min": 9
      }
     ]
    }
   ]
  },
  {
   "slug": "conteudo-com-ia",
   "title": "Conteúdo com IA",
   "subtitle": "Pautas, posts, iscas e pesquisas",
   "category": "Inteligência artificial",
   "level": "Iniciante",
   "tags": "ia, conteúdo, posts, e-mail, pesquisa, low ticket",
   "price": 97,
   "anchor_price": 197,
   "color": 2,
   "featured": false,
   "short_desc": "Use IA para planejar pautas, escrever posts e e-mails com a sua voz, criar iscas e montar pesquisas, sem soar como robô.",
   "description": "A IA escreve rápido, mas sozinha escreve igual a todo mundo. Com o seu jeito de falar, exemplos reais e revisão, ela vira uma redatora que acelera a sua semana.\n\nVocê monta o guia da sua voz, produz conteúdo em lote e aprende a tirar os vícios de texto de IA.",
   "promise": "Produzir conteúdo, iscas e pesquisas com IA mantendo a sua voz",
   "audience": [
    "Quem precisa postar e não tem tempo",
    "Infoprodutor que escreve e-mail e isca",
    "Social media que atende vários clientes"
   ],
   "pains": [
    "O texto da IA tem cara de IA.",
    "Você não sabe sobre o que postar esta semana.",
    "Gasta horas para fazer uma isca simples."
   ],
   "benefits": [
    "Voz: um guia que faz a IA escrever como você.",
    "Produção: pautas, posts e e-mails em lote.",
    "Iscas e pesquisas: do rascunho ao material pronto."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Sua Voz",
     "description": "Antes de pedir texto.",
     "lessons": [
      {
       "title": "O guia de voz",
       "description": "Como você fala, o que evita e exemplos.",
       "duration_min": 13
      },
      {
       "title": "Vícios de texto de IA",
       "description": "O que cortar na revisão.",
       "duration_min": 11
      }
     ]
    },
    {
     "title": "A Produção",
     "description": "Conteúdo em lote.",
     "lessons": [
      {
       "title": "Pautas do mês com IA",
       "description": "Do tema ao calendário.",
       "duration_min": 13
      },
      {
       "title": "Posts e roteiros",
       "description": "Formatos diferentes, mesma voz.",
       "duration_min": 14
      },
      {
       "title": "E-mails que parecem seus",
       "description": "Sequências sem cara de robô.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "Iscas e Pesquisas",
     "description": "Material que capta.",
     "lessons": [
      {
       "title": "Isca com IA",
       "description": "Checklist, guia e planilha.",
       "duration_min": 15
      },
      {
       "title": "Pesquisa com IA",
       "description": "Perguntas certas e leitura das respostas.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "analise-com-ia",
   "title": "Análise com IA",
   "subtitle": "Números, respostas e concorrência",
   "category": "Inteligência artificial",
   "level": "Intermediário",
   "tags": "ia, análise de dados, planilha, relatório, low ticket",
   "price": 97,
   "anchor_price": 197,
   "color": 2,
   "featured": false,
   "short_desc": "Use IA para analisar planilhas, relatórios de campanha, respostas abertas de pesquisa e concorrência, com cuidado com os dados.",
   "description": "A IA lê em segundos o que você levaria uma tarde para ler. O valor está em saber o que perguntar e em conferir a resposta antes de decidir.\n\nVocê aprende a preparar os dados, a pedir a análise certa e a transformar o resultado em decisão.",
   "promise": "Analisar números e respostas com IA e chegar a decisões que você confere",
   "audience": [
    "Quem tem dado e não tem tempo de analisar",
    "Gestor que monta relatório toda semana",
    "Quem faz pesquisa e não lê as respostas abertas"
   ],
   "pains": [
    "Você exporta relatório e não sabe o que procurar.",
    "Tem centenas de respostas de pesquisa paradas.",
    "Fica em dúvida se pode confiar no que a IA disse."
   ],
   "benefits": [
    "Preparação: dado limpo e pergunta clara.",
    "Análise: campanha, pesquisa e concorrência.",
    "Conferência: checar antes de decidir."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Preparar",
     "description": "Dado bom, análise boa.",
     "lessons": [
      {
       "title": "Limpando a planilha",
       "description": "Colunas, nomes e formatos.",
       "duration_min": 12
      },
      {
       "title": "A pergunta da análise",
       "description": "O que você quer decidir.",
       "duration_min": 10
      },
      {
       "title": "Cuidado com os dados",
       "description": "O que não colar na IA.",
       "duration_min": 10
      }
     ]
    },
    {
     "title": "Analisar",
     "description": "Na prática.",
     "lessons": [
      {
       "title": "Relatório de campanha",
       "description": "Onde está o gargalo.",
       "duration_min": 15
      },
      {
       "title": "Respostas abertas de pesquisa",
       "description": "Temas, objeções e frases do cliente.",
       "duration_min": 15
      },
      {
       "title": "Concorrência sob lupa",
       "description": "Ofertas, ângulos e lacunas.",
       "duration_min": 13
      },
      {
       "title": "Conferindo a resposta",
       "description": "Números que a IA inventa.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "imagem-com-ia",
   "title": "Imagem com IA",
   "subtitle": "Do prompt à peça pronta",
   "category": "Inteligência artificial",
   "level": "Iniciante",
   "tags": "ia, imagem, prompt, criativo, low ticket",
   "price": 97,
   "anchor_price": 197,
   "color": 2,
   "featured": false,
   "short_desc": "Gere e edite imagens com IA para anúncio e conteúdo: prompt, estilo, consistência de personagem e produto, ampliação e direitos.",
   "description": "Gerar uma imagem bonita é fácil. Gerar a imagem que a sua peça precisa, no seu estilo, com o mesmo personagem toda vez, pede método.\n\nVocê escreve prompts de imagem, mantém consistência, edita imagens prontas e sabe o que pode usar comercialmente.",
   "promise": "Criar imagens com IA consistentes e prontas para uso comercial",
   "audience": [
    "Quem faz criativo e quer imagens próprias",
    "Empreendedor sem verba para fotógrafo",
    "Designer que quer acelerar a produção"
   ],
   "pains": [
    "Suas imagens de IA parecem todas iguais.",
    "O personagem muda de rosto a cada geração.",
    "Não sabe se pode usar a imagem no anúncio."
   ],
   "benefits": [
    "Prompt: assunto, estilo, luz e enquadramento.",
    "Consistência: personagem e produto iguais em várias peças.",
    "Direitos: o que pode e o que evitar."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Gerar",
     "description": "O prompt de imagem.",
     "lessons": [
      {
       "title": "Gerar imagem com prompt",
       "description": "As partes de um bom pedido.",
       "duration_min": 15
      },
      {
       "title": "Estilos e ferramentas",
       "description": "Qual usar para cada peça.",
       "duration_min": 14
      },
      {
       "title": "Prompt de imagem para anúncio",
       "description": "Espaço para texto e foco no produto.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "Refinar",
     "description": "Do rascunho à peça.",
     "lessons": [
      {
       "title": "Editar uma imagem pronta",
       "description": "Trocar fundo, objeto e cor.",
       "duration_min": 14
      },
      {
       "title": "Personagem e produto consistentes",
       "description": "A mesma cara em todas as peças.",
       "duration_min": 18
      },
      {
       "title": "Ampliar sem estragar",
       "description": "Resolução para anúncio e impressão.",
       "duration_min": 11
      },
      {
       "title": "Direitos e cuidados",
       "description": "Uso comercial, marcas e pessoas reais.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "video-com-ia",
   "title": "Vídeo com IA",
   "subtitle": "Texto, imagem e avatar em movimento",
   "category": "Inteligência artificial",
   "level": "Intermediário",
   "tags": "ia, vídeo, b-roll, avatar, low ticket",
   "price": 97,
   "anchor_price": 197,
   "color": 2,
   "featured": false,
   "short_desc": "Gere vídeos com IA para anúncio e conteúdo: texto para vídeo, imagem para vídeo, B-roll, avatar e edição, do roteiro ao arquivo final.",
   "description": "A IA de vídeo já resolve cenas de apoio, animações de produto e vídeos sem rosto. O cuidado está em escolher a ferramenta certa e não depender dela para tudo.\n\nVocê monta um fluxo do roteiro ao vídeo final, com custo controlado e transparência com o público.",
   "promise": "Produzir vídeos com IA para anúncio e conteúdo, do roteiro ao arquivo final",
   "audience": [
    "Quem não quer ou não pode aparecer no vídeo",
    "Quem precisa de B-roll e cenas de apoio",
    "Quem produz muito anúncio em vídeo"
   ],
   "pains": [
    "Gravar tudo toma tempo demais.",
    "Os vídeos de IA saem estranhos.",
    "Não sabe quanto vai gastar com as ferramentas."
   ],
   "benefits": [
    "Geração: texto e imagem viram cena.",
    "Avatar: quando usar e com que cuidado.",
    "Fluxo: roteiro, cenas, voz e edição."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Gerar Cenas",
     "description": "As ferramentas de vídeo.",
     "lessons": [
      {
       "title": "Texto para vídeo",
       "description": "Descrever a cena que você quer.",
       "duration_min": 15
      },
      {
       "title": "Imagem para vídeo",
       "description": "Dar movimento a uma imagem pronta.",
       "duration_min": 14
      },
      {
       "title": "B-roll com IA",
       "description": "Cenas de apoio para o seu vídeo.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "Montar",
     "description": "Do roteiro ao arquivo.",
     "lessons": [
      {
       "title": "Avatar falante",
       "description": "Quando faz sentido e quando afasta.",
       "duration_min": 15
      },
      {
       "title": "Do roteiro ao vídeo final",
       "description": "O fluxo completo.",
       "duration_min": 20
      },
      {
       "title": "Custo, direitos e transparência",
       "description": "Quanto gasta e o que avisar.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "audio-com-ia",
   "title": "Áudio com IA",
   "subtitle": "Narração, limpeza e trilha",
   "category": "Inteligência artificial",
   "level": "Iniciante",
   "tags": "ia, áudio, narração, voz, low ticket",
   "price": 67,
   "anchor_price": 147,
   "color": 2,
   "featured": false,
   "short_desc": "Use IA para narrar vídeos, limpar gravações, criar trilhas e usar voz clonada com consentimento.",
   "description": "Áudio ruim derruba qualquer vídeo. A IA limpa ruído, narra com naturalidade e cria trilha sem problema de direito autoral, se você souber onde usar cada recurso.\n\nVocê aprende narração, limpeza e trilha, com as regras de consentimento para voz.",
   "promise": "Áudio limpo, narração natural e trilha própria com IA",
   "audience": [
    "Quem grava em lugar com barulho",
    "Quem faz vídeo sem aparecer",
    "Quem precisa de trilha para conteúdo e anúncio"
   ],
   "pains": [
    "Sua gravação tem eco e barulho.",
    "Narração de IA soa robótica.",
    "Tem medo de usar música e tomar bloqueio."
   ],
   "benefits": [
    "Narração: voz natural com ritmo e pausa.",
    "Limpeza: ruído e eco fora da gravação.",
    "Trilha e voz clonada com regras claras."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Voz",
     "description": "Narração com IA.",
     "lessons": [
      {
       "title": "Narração com IA",
       "description": "Texto, ritmo e pausa.",
       "duration_min": 14
      },
      {
       "title": "Voz clonada, só com consentimento",
       "description": "Regras e cuidados.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "O Som",
     "description": "Acabamento.",
     "lessons": [
      {
       "title": "Áudio limpo",
       "description": "Tirar ruído e eco.",
       "duration_min": 12
      },
      {
       "title": "Trilha com IA",
       "description": "Música própria para o vídeo.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "paginas-com-ia",
   "title": "Páginas com IA",
   "subtitle": "Da ideia à página no ar",
   "category": "Inteligência artificial",
   "level": "Intermediário",
   "tags": "ia, página, landing page, github pages, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 2,
   "featured": false,
   "short_desc": "Crie páginas de captura e de venda com IA, do texto ao código, e publique de graça, sem depender de construtor pago.",
   "description": "Hoje a IA escreve a página e o código. O que faz a página vender continua sendo estrutura, promessa e velocidade, e isso você decide.\n\nVocê estrutura a página, pede o código para a IA, ajusta, publica e liga o formulário e o pixel.",
   "promise": "Páginas de captura e venda feitas com IA e publicadas sem mensalidade",
   "audience": [
    "Quem paga construtor de página todo mês",
    "Quem quer testar páginas rápido",
    "Quem tem ideia e não sabe programar"
   ],
   "pains": [
    "Construtor de página caro e lento.",
    "Você depende de alguém para cada ajuste.",
    "Sua página demora para abrir no celular."
   ],
   "benefits": [
    "Estrutura: as seções que vendem.",
    "Código com IA: página leve, feita sob medida.",
    "Publicação: no ar de graça, com formulário e pixel."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Estrutura",
     "description": "Antes do código.",
     "lessons": [
      {
       "title": "O esqueleto da página",
       "description": "Seções de captura e de venda.",
       "duration_min": 13
      },
      {
       "title": "Texto com IA",
       "description": "Promessa, prova e chamada.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "O Código",
     "description": "A IA programando.",
     "lessons": [
      {
       "title": "Pedindo a página para a IA",
       "description": "O prompt de página completo.",
       "duration_min": 16
      },
      {
       "title": "Ajustes e celular",
       "description": "Corrigir sem saber programar.",
       "duration_min": 15
      },
      {
       "title": "Página rápida de verdade",
       "description": "Imagem leve e carregamento.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "No Ar",
     "description": "Publicar e medir.",
     "lessons": [
      {
       "title": "Publicar de graça",
       "description": "GitHub Pages e Netlify.",
       "duration_min": 16
      },
      {
       "title": "Formulário ligado à planilha",
       "description": "Lead caindo no lugar certo.",
       "duration_min": 15
      },
      {
       "title": "Pixel e UTM na página",
       "description": "Medir desde o primeiro dia.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "diagnostico-com-ia",
   "title": "Diagnóstico com IA",
   "subtitle": "Quiz que qualifica e vende",
   "category": "Inteligência artificial",
   "level": "Intermediário",
   "tags": "ia, quiz, diagnóstico, isca, lead, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 2,
   "featured": false,
   "short_desc": "Crie quizzes e diagnósticos com nota e resultado personalizado, que captam lead, qualificam e direcionam para a oferta certa.",
   "description": "O diagnóstico é a isca que mais conversa com o lead: ele responde, recebe um resultado sobre ele mesmo e já chega segmentado na sua lista.\n\nVocê desenha as perguntas, monta a lógica de pontuação, gera o código com IA e liga tudo a uma planilha.",
   "promise": "Um diagnóstico no ar que capta, qualifica e direciona cada lead",
   "audience": [
    "Quem quer uma isca que gere mais lead",
    "Quem vende produtos diferentes para perfis diferentes",
    "Consultor que faz diagnóstico manual"
   ],
   "pains": [
    "Sua isca não diz nada sobre o lead.",
    "Todo lead recebe a mesma mensagem.",
    "Fazer quiz exige ferramenta paga."
   ],
   "benefits": [
    "Perguntas: o que medir e como pontuar.",
    "Resultado: relatório personalizado para cada perfil.",
    "Integração: planilha, segmento e oferta."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Desenho",
     "description": "O que o diagnóstico mede.",
     "lessons": [
      {
       "title": "Quiz e diagnóstico que direcionam",
       "description": "Para que serve cada um.",
       "duration_min": 12
      },
      {
       "title": "Perguntas e pontuação",
       "description": "A lógica da nota.",
       "duration_min": 16
      },
      {
       "title": "Perfis de resultado",
       "description": "Um texto para cada faixa.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "A Construção",
     "description": "Do desenho ao código.",
     "lessons": [
      {
       "title": "Código do quiz com IA",
       "description": "Pedir e ajustar.",
       "duration_min": 20
      },
      {
       "title": "Relatório personalizado",
       "description": "O resultado que a pessoa salva.",
       "duration_min": 16
      }
     ]
    },
    {
     "title": "A Ligação",
     "description": "Do resultado à venda.",
     "lessons": [
      {
       "title": "Respostas na planilha",
       "description": "Cada lead com nota e perfil.",
       "duration_min": 15
      },
      {
       "title": "Mensagem para cada perfil",
       "description": "Oferta certa para cada resultado.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "dashboards-com-ia",
   "title": "Dashboards com IA",
   "subtitle": "Painel ao vivo sem mensalidade",
   "category": "Inteligência artificial",
   "level": "Intermediário",
   "tags": "ia, dashboard, painel, google planilhas, looker studio, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 2,
   "featured": false,
   "short_desc": "Monte painéis de acompanhamento de campanha e de negócio com Google Planilhas, Looker Studio e IA, atualizados sozinhos.",
   "description": "Um bom painel responde em dez segundos se está tudo bem. A IA ajuda a montar as fórmulas, o visual e até o código de um painel próprio.\n\nVocê escolhe os números, organiza os dados, monta o painel e cria uma rotina de leitura.",
   "promise": "Um painel que mostra em segundos como estão as suas campanhas e vendas",
   "audience": [
    "Gestor que monta relatório na mão",
    "Empreendedor que quer acompanhar o negócio",
    "Time de marketing sem painel único"
   ],
   "pains": [
    "Seus números estão espalhados em várias telas.",
    "Montar relatório toma horas.",
    "Ninguém olha a planilha que você fez."
   ],
   "benefits": [
    "Números certos: os indicadores que importam.",
    "Painel: Planilhas, Looker Studio ou código próprio.",
    "Rotina: leitura e decisão toda semana."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Os Dados",
     "description": "Antes do gráfico.",
     "lessons": [
      {
       "title": "Os números de cada etapa",
       "description": "Do anúncio à venda.",
       "duration_min": 13
      },
      {
       "title": "Dados organizados na planilha",
       "description": "Uma aba por fonte.",
       "duration_min": 15
      },
      {
       "title": "Fórmulas com IA",
       "description": "Pedir a fórmula certa.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "O Painel",
     "description": "Visual que se lê rápido.",
     "lessons": [
      {
       "title": "Painel no Google Planilhas",
       "description": "Gráficos e indicadores.",
       "duration_min": 18
      },
      {
       "title": "Levando o painel ao Looker Studio",
       "description": "Atualização automática.",
       "duration_min": 18
      },
      {
       "title": "Painel próprio com código",
       "description": "Quando vale construir.",
       "duration_min": 17
      }
     ]
    },
    {
     "title": "A Rotina",
     "description": "O painel em uso.",
     "lessons": [
      {
       "title": "Leitura semanal",
       "description": "Dez minutos que valem a semana.",
       "duration_min": 11
      },
      {
       "title": "Alertas automáticos",
       "description": "Avisos quando algo sai do normal.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "automacoes-com-ia",
   "title": "Automações com IA",
   "subtitle": "O trabalho repetitivo fora da sua mesa",
   "category": "Inteligência artificial",
   "level": "Intermediário",
   "tags": "ia, automação, zapier, make, apps script, médio ticket",
   "price": 297,
   "anchor_price": 597,
   "color": 2,
   "featured": false,
   "short_desc": "Automatize tarefas repetitivas de marketing e vendas com Zapier, Make, Apps Script e IA, com segurança para os dados.",
   "description": "Copiar lead de um lugar para outro, avisar o time, gerar relatório: tudo isso pode rodar sozinho. A IA ajuda a escrever a automação e a decidir no meio dela.\n\nVocê mapeia o que automatizar, monta fluxos sem código e com código, coloca IA no meio e cuida dos dados.",
   "promise": "Automações rodando sozinhas no marketing e nas vendas, com IA onde faz sentido",
   "audience": [
    "Quem perde horas com tarefa repetitiva",
    "Time pequeno que precisa render mais",
    "Quem já usa ferramentas e quer conectar tudo"
   ],
   "pains": [
    "Você copia e cola dados o dia inteiro.",
    "Lead novo demora horas para ser atendido.",
    "Tem medo de quebrar algo ao automatizar."
   ],
   "benefits": [
    "Mapa: o que vale automatizar primeiro.",
    "Fluxos: sem código e com Apps Script.",
    "IA no meio: classificar, resumir e responder."
   ],
   "bonuses": [
    {
     "title": "Biblioteca de fluxos prontos",
     "text": "Fluxos de captação e atendimento para importar e adaptar.",
     "value": 97
    }
   ],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Mapa",
     "description": "Escolher o que automatizar.",
     "lessons": [
      {
       "title": "Automação sem código",
       "description": "Gatilho, ação e condição.",
       "duration_min": 13
      },
      {
       "title": "O que automatizar primeiro",
       "description": "Tempo gasto contra risco.",
       "duration_min": 11
      }
     ]
    },
    {
     "title": "Os Fluxos",
     "description": "Na prática.",
     "lessons": [
      {
       "title": "Zapier e Make na prática",
       "description": "O primeiro fluxo do zero.",
       "duration_min": 22
      },
      {
       "title": "Apps Script com IA ao lado",
       "description": "Código pedido para a IA.",
       "duration_min": 20
      },
      {
       "title": "Webhooks: formulário, planilha e CRM",
       "description": "Tudo conversando.",
       "duration_min": 18
      }
     ]
    },
    {
     "title": "IA no Meio",
     "description": "Decidir sozinho.",
     "lessons": [
      {
       "title": "Classificar e resumir com IA",
       "description": "Lead quente, frio e dúvida.",
       "duration_min": 15
      },
      {
       "title": "Respostas automáticas com revisão",
       "description": "Rascunho que alguém aprova.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "Segurança",
     "description": "Sem dor de cabeça.",
     "lessons": [
      {
       "title": "Agentes e cuidado com dados",
       "description": "O que a automação pode acessar.",
       "duration_min": 14
      },
      {
       "title": "Monitorar e corrigir",
       "description": "Quando o fluxo falha.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "apps-sem-mensalidade",
   "title": "Apps Sem Mensalidade",
   "subtitle": "Sistemas reais com Planilha, Apps Script e IA",
   "category": "Inteligência artificial",
   "level": "Intermediário",
   "tags": "apps script, google sheets, ia, no-code, github pages, semi high ticket",
   "price": 597,
   "anchor_price": 1197,
   "color": 2,
   "featured": false,
   "short_desc": "Crie sistemas de verdade com Google Planilhas como banco, Apps Script como servidor e GitHub Pages como site. Custo zero de infraestrutura.",
   "description": "Dashboards, quizzes, áreas de membros e checkouts com Mercado Pago, tudo sem pagar mensalidade de ferramenta. Você aprende a arquitetura e usa IA para escrever o código mais rápido.\n\nAlém dos projetos, você aprende a pedir código para a IA, achar e corrigir erros, versionar no GitHub e publicar no GitHub Pages. E monta diagnósticos, páginas de captura, integrações com CRM, uma área de membros simples e testes A/B.",
   "promise": "Seus próprios sistemas no ar, sem pagar mensalidade de ferramenta",
   "audience": [
    "Profissionais de marketing que dependem de programador para cada ideia",
    "Donos de negócio que pagam várias ferramentas e usam pouco de cada",
    "Quem já mexe em planilhas e quer dar o próximo passo",
    "Gestores que querem montar dashboards e formulários próprios"
   ],
   "pains": [
    "Você paga várias ferramentas por mês para fazer o que uma planilha faria.",
    "Tem ideias de sistemas mas depende de programador.",
    "Já tentou usar IA para programar e se perdeu.",
    "Seu sistema funciona no computador, mas você não sabe como colocar no ar."
   ],
   "benefits": [
    "Arquitetura simples: planilha, script e página trabalhando juntos",
    "IA como copiloto: prompts para gerar e corrigir código",
    "Sistemas reais: quiz, diagnóstico, dashboard e checkout prontos para adaptar"
   ],
   "bonuses": [
    {
     "title": "Modelos de planilha e script",
     "text": "Estruturas de planilha e códigos de Apps Script prontos para adaptar aos seus projetos.",
     "value": 147
    },
    {
     "title": "Banco de prompts para programar",
     "text": "Pedidos prontos para gerar, corrigir e explicar código com a IA.",
     "value": 97
    }
   ],
   "cta_text": "Quero meus próprios sistemas",
   "aff_enabled": true,
   "aff_commission": 50,
   "seasons": [
    {
     "title": "A Arquitetura",
     "description": "Planilha, script e página.",
     "lessons": [
      {
       "title": "O stack de custo zero",
       "description": "Por que Sheets + Apps Script + GitHub Pages resolve tanto.",
       "duration_min": 15
      },
      {
       "title": "Planilha como banco de dados",
       "description": "Abas, colunas e regras para não virar bagunça.",
       "duration_min": 18
      },
      {
       "title": "Seu primeiro Web App",
       "description": "doGet, doPost e uma API que responde JSON.",
       "duration_min": 23
      }
     ]
    },
    {
     "title": "IA Programadora",
     "description": "A IA escrevendo o código, e você no comando.",
     "lessons": [
      {
       "title": "Pedir código para a IA",
       "description": "Como descrever o que o sistema precisa fazer, com entradas, saídas e regras, para receber um código que roda.",
       "duration_min": 20
      },
      {
       "title": "Achando e corrigindo erros",
       "description": "Ler a mensagem de erro, passar o contexto certo para a IA e testar a correção sem quebrar o resto.",
       "duration_min": 22
      },
      {
       "title": "Versionando no GitHub",
       "description": "Guardar cada versão do projeto, voltar atrás quando algo quebra e trabalhar sem medo de perder código.",
       "duration_min": 18
      },
      {
       "title": "Publicando no GitHub Pages",
       "description": "Colocar a página no ar, ligar ao Apps Script e atualizar o site a cada nova versão.",
       "duration_min": 20
      }
     ]
    },
    {
     "title": "Projetos Reais",
     "description": "Do quiz ao checkout.",
     "lessons": [
      {
       "title": "Quiz com resultado personalizado",
       "description": "Captura de lead, pontuação e resultado na tela.",
       "duration_min": 26
      },
      {
       "title": "Dashboard ao vivo",
       "description": "Indicadores da planilha num painel bonito.",
       "duration_min": 22
      },
      {
       "title": "Checkout com Mercado Pago",
       "description": "Pix na tela, confirmação automática e acesso liberado.",
       "duration_min": 28
      }
     ]
    },
    {
     "title": "Mais Projetos",
     "description": "Mais cinco sistemas para tirar do papel e adaptar ao seu negócio.",
     "lessons": [
      {
       "title": "Diagnóstico com nota e relatório",
       "description": "Perguntas, pontuação por área e um relatório de resultado que o lead recebe no final.",
       "duration_min": 26
      },
      {
       "title": "Página de captura ligada à planilha",
       "description": "Um formulário em página própria que grava cada lead na planilha, com origem e data.",
       "duration_min": 21
      },
      {
       "title": "Formulário, planilha e CRM com webhooks",
       "description": "Enviar o lead da planilha para o CRM automaticamente usando webhooks, sem copiar e colar.",
       "duration_min": 24
      },
      {
       "title": "Área de membros simples",
       "description": "Login por e-mail, lista de aulas e acesso liberado só para quem comprou.",
       "duration_min": 28
      },
      {
       "title": "Teste A/B de páginas",
       "description": "Sortear a versão da página que cada visitante vê e registrar na planilha qual converte mais.",
       "duration_min": 22
      }
     ]
    }
   ]
  },
  {
   "slug": "jogos-com-ia",
   "title": "Jogos com IA",
   "subtitle": "Da ideia ao jogo jogável no navegador",
   "category": "Inteligência artificial",
   "level": "Iniciante",
   "tags": "ia, jogos, game design, navegador, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 2,
   "featured": false,
   "short_desc": "Crie um jogo de navegador com IA: ideia em uma frase, documento de design, protótipo jogável, arte, som e ranking.",
   "description": "Fazer um jogo pequeno virou possível para quem não é programador. A IA escreve o código, gera arte e som, e você cuida do que importa: a diversão.\n\nVocê sai com um jogo publicado, que roda no celular e no computador.",
   "promise": "Um jogo seu publicado na internet, feito com IA",
   "audience": [
    "Quem sempre quis criar um jogo",
    "Quem quer usar jogo como isca ou engajamento",
    "Pais e educadores que querem criar com crianças"
   ],
   "pains": [
    "Você tem ideias de jogo e nunca saem do papel.",
    "Acha que precisa saber programar.",
    "Começa e se perde no meio."
   ],
   "benefits": [
    "Design: a ideia virando regras jogáveis.",
    "Protótipo: o jogo funcionando com IA.",
    "Publicação: arte, som, ranking e link para compartilhar."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Ideia",
     "description": "Antes do código.",
     "lessons": [
      {
       "title": "Uma ideia em uma frase",
       "description": "O núcleo do jogo.",
       "duration_min": 11
      },
      {
       "title": "O documento de design",
       "description": "Regras, objetivo e progressão.",
       "duration_min": 17
      }
     ]
    },
    {
     "title": "O Protótipo",
     "description": "Jogável no navegador.",
     "lessons": [
      {
       "title": "Protótipo jogável com IA",
       "description": "O primeiro jogo rodando.",
       "duration_min": 25
      },
      {
       "title": "Sensação de jogo",
       "description": "Feedback que deixa divertido.",
       "duration_min": 15
      },
      {
       "title": "Testando com outras pessoas",
       "description": "O que ajustar.",
       "duration_min": 11
      }
     ]
    },
    {
     "title": "O Acabamento",
     "description": "Pronto para o mundo.",
     "lessons": [
      {
       "title": "Arte e som do jogo",
       "description": "Gerando com IA.",
       "duration_min": 19
      },
      {
       "title": "Ranking com planilha",
       "description": "Pontuação salva sem servidor.",
       "duration_min": 20
      },
      {
       "title": "Publicando o jogo",
       "description": "Link no ar de graça.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "musica-com-ia",
   "title": "Música com IA",
   "subtitle": "Da letra à primeira faixa",
   "category": "Inteligência artificial",
   "level": "Iniciante",
   "tags": "ia, música, letra, composição, low ticket",
   "price": 97,
   "anchor_price": 197,
   "color": 2,
   "featured": false,
   "short_desc": "Componha músicas com IA: letra com a sua cara, do pedido à faixa pronta, edição e direitos de uso.",
   "description": "A IA de música transforma uma letra e um estilo em uma faixa completa. A parte humana continua sendo a história, o refrão e as escolhas.\n\nVocê escreve a letra, gera e edita a faixa e entende o que pode publicar e usar comercialmente.",
   "promise": "Uma música sua, pronta para ouvir e publicar, feita com IA",
   "audience": [
    "Quem gosta de música e nunca compôs",
    "Criador de conteúdo que quer trilha própria",
    "Quem quer presentear alguém com uma música"
   ],
   "pains": [
    "Você tem letras guardadas e nenhuma virou música.",
    "As faixas de IA saem genéricas.",
    "Não sabe se pode publicar."
   ],
   "benefits": [
    "Letra: a sua história com estrutura de música.",
    "Faixa: estilo, voz e arranjo pedidos com clareza.",
    "Direitos: publicar e usar sem problema."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Letra",
     "description": "A parte que é sua.",
     "lessons": [
      {
       "title": "Letra com a sua cara",
       "description": "História, verso e refrão.",
       "duration_min": 14
      },
      {
       "title": "Estrutura da música",
       "description": "Partes e repetições.",
       "duration_min": 11
      }
     ]
    },
    {
     "title": "A Faixa",
     "description": "Da letra ao arquivo.",
     "lessons": [
      {
       "title": "Do pedido à primeira faixa",
       "description": "Estilo, voz e clima.",
       "duration_min": 17
      },
      {
       "title": "Editando a faixa",
       "description": "Cortar, estender e mixar.",
       "duration_min": 16
      },
      {
       "title": "Direitos e uso comercial",
       "description": "O que pode e o que não pode.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "livros-com-ia",
   "title": "Livros com IA",
   "subtitle": "Da ideia ao livro publicado",
   "category": "Inteligência artificial",
   "level": "Iniciante",
   "tags": "ia, livro, escrita, amazon kdp, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 2,
   "featured": false,
   "short_desc": "Escreva e publique um livro com IA sem perder a sua voz: ideia, estrutura, escrita, capa e publicação na Amazon KDP.",
   "description": "A IA ajuda a organizar, destravar e revisar. O livro continua sendo seu: a ideia, a voz e as escolhas.\n\nVocê estrutura o livro, escreve com a IA como parceira, cria a capa e publica na Amazon.",
   "promise": "Um livro seu publicado na Amazon, escrito com IA e com a sua voz",
   "audience": [
    "Quem quer escrever um livro e trava",
    "Expert que quer um livro como autoridade ou isca",
    "Quem escreve ficção e quer terminar a obra"
   ],
   "pains": [
    "Você começa e não passa do primeiro capítulo.",
    "Texto de IA sem alma.",
    "Não sabe como publicar."
   ],
   "benefits": [
    "Estrutura: o livro planejado do início ao fim.",
    "Escrita: IA como parceira, voz sua.",
    "Publicação: capa, arquivo e Amazon KDP."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Plano",
     "description": "Antes de escrever.",
     "lessons": [
      {
       "title": "Ideia e leitor",
       "description": "Para quem é o livro.",
       "duration_min": 12
      },
      {
       "title": "A estrutura do livro",
       "description": "Capítulos e arco.",
       "duration_min": 15
      }
     ]
    },
    {
     "title": "A Escrita",
     "description": "Com a IA ao lado.",
     "lessons": [
      {
       "title": "Escrever com IA sem perder a voz",
       "description": "Rascunho, reescrita e revisão.",
       "duration_min": 22
      },
      {
       "title": "Revisão e leitura crítica",
       "description": "O que a IA aponta e o que você decide.",
       "duration_min": 15
      }
     ]
    },
    {
     "title": "A Publicação",
     "description": "O livro no mundo.",
     "lessons": [
      {
       "title": "A capa do livro",
       "description": "Do conceito ao arquivo.",
       "duration_min": 15
      },
      {
       "title": "Publicando na Amazon KDP",
       "description": "Passo a passo.",
       "duration_min": 20
      },
      {
       "title": "Livro como isca ou produto",
       "description": "O que fazer depois.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "dez-posts-em-uma-tarde",
   "title": "10 Posts em Uma Tarde",
   "subtitle": "Uma semana de conteúdo pronta",
   "category": "Redes sociais",
   "level": "Iniciante",
   "tags": "grátis, redes sociais, conteúdo, produção em lote, grátis",
   "price": 0,
   "anchor_price": 0,
   "color": 5,
   "featured": false,
   "short_desc": "Quatro episódios para sair de uma tarde com dez posts prontos: pautas, formatos e produção em lote.",
   "description": "O problema de quem não posta raramente é falta de assunto. É sentar todo dia para decidir o que postar. Produzir em lote resolve isso.\n\nVocê escolhe as pautas, define os formatos e produz dez posts em uma tarde. Depois sabe qual curso da trilha de Redes faz mais sentido.",
   "promise": "Dez posts prontos em uma tarde e a próxima semana resolvida",
   "audience": [
    "Quem quer postar com constância e não consegue",
    "Empreendedor que cuida das próprias redes",
    "Quem quer conhecer a trilha de Redes sociais"
   ],
   "pains": [
    "Você abre o Instagram todo dia sem saber o que postar.",
    "Some por semanas e depois volta com tudo.",
    "Cada post leva uma hora para sair."
   ],
   "benefits": [
    "Pautas: dez assuntos em quinze minutos.",
    "Formatos: o post certo para cada assunto.",
    "Lote: produzir tudo de uma vez."
   ],
   "bonuses": [],
   "cta_text": "Assistir de graça",
   "aff_enabled": false,
   "aff_commission": 0,
   "seasons": [
    {
     "title": "A Tarde",
     "description": "Do zero aos dez posts.",
     "lessons": [
      {
       "title": "Dez pautas em quinze minutos",
       "description": "De onde tirar assunto.",
       "duration_min": 9
      },
      {
       "title": "O formato de cada pauta",
       "description": "Carrossel, reels ou stories.",
       "duration_min": 9
      },
      {
       "title": "Produzindo em lote",
       "description": "Escrever tudo, depois desenhar tudo.",
       "duration_min": 12
      },
      {
       "title": "Agendar e esquecer",
       "description": "A semana pronta.",
       "duration_min": 7
      }
     ]
    }
   ]
  },
  {
   "slug": "tipos-de-post",
   "title": "Tipos de Post",
   "subtitle": "O formato certo para cada objetivo",
   "category": "Redes sociais",
   "level": "Iniciante",
   "tags": "redes sociais, reels, carrossel, stories, low ticket",
   "price": 47,
   "anchor_price": 97,
   "color": 5,
   "featured": false,
   "short_desc": "Reels, carrossel, stories, estático e collab: quando usar cada formato e como montar cada um para o objetivo certo.",
   "description": "Cada formato tem uma função. Reels alcança gente nova, carrossel ensina e salva, stories cria vínculo e vende. Usar o formato errado desperdiça um bom assunto.\n\nVocê aprende o papel de cada tipo de post e a estrutura que funciona em cada um.",
   "promise": "Escolher o formato certo para cada post e montar cada um do jeito que funciona",
   "audience": [
    "Quem posta sempre no mesmo formato",
    "Quem não sabe por que um post vai bem e outro não",
    "Social media iniciante"
   ],
   "pains": [
    "Você só posta foto com legenda.",
    "Seus reels não alcançam ninguém.",
    "Os stories não geram resposta."
   ],
   "benefits": [
    "Função: o objetivo de cada formato.",
    "Estrutura: o esqueleto de reels, carrossel e stories.",
    "Mistura: a proporção de formatos na semana."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Os Formatos",
     "description": "Para que serve cada um.",
     "lessons": [
      {
       "title": "Reels: alcance",
       "description": "Gancho, ritmo e final.",
       "duration_min": 12
      },
      {
       "title": "Carrossel: ensinar e salvar",
       "description": "Capa, sequência e chamada.",
       "duration_min": 12
      },
      {
       "title": "Stories: vínculo e venda",
       "description": "Sequências que geram resposta.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "A Mistura",
     "description": "A semana equilibrada.",
     "lessons": [
      {
       "title": "Estático e collab",
       "description": "Quando valem a pena.",
       "duration_min": 9
      },
      {
       "title": "A proporção da semana",
       "description": "Formatos por objetivo.",
       "duration_min": 9
      }
     ]
    }
   ]
  },
  {
   "slug": "calendario-de-postagem",
   "title": "Calendário de Postagem",
   "subtitle": "Organização, ferramentas e constância",
   "category": "Redes sociais",
   "level": "Iniciante",
   "tags": "redes sociais, cronograma, organização, ferramentas, low ticket",
   "price": 67,
   "anchor_price": 147,
   "color": 5,
   "featured": false,
   "short_desc": "Monte um cronograma de postagens que você cumpre: calendário da semana, produção em lote, ferramentas de organização e agendamento.",
   "description": "Constância não é força de vontade, é sistema. Um calendário simples, um lugar para guardar ideias e um dia fixo de produção resolvem a maior parte do problema.\n\nVocê monta o seu calendário, organiza as ferramentas e cria a rotina que mantém as redes vivas sem tomar a sua semana.",
   "promise": "Um cronograma de postagens organizado, agendado e possível de cumprir",
   "audience": [
    "Quem posta no impulso e some",
    "Social media com vários clientes",
    "Quem quer organizar as redes da empresa"
   ],
   "pains": [
    "Você esquece de postar ou posta tudo no mesmo dia.",
    "Ideias se perdem em prints e anotações soltas.",
    "Usa ferramentas demais e nenhuma direito."
   ],
   "benefits": [
    "Calendário: a semana planejada por objetivo.",
    "Ferramentas: onde organizar, criar e agendar.",
    "Rotina: produção em lote sem esgotar."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Calendário",
     "description": "A semana planejada.",
     "lessons": [
      {
       "title": "O calendário da semana",
       "description": "Dias, horários e objetivos.",
       "duration_min": 12
      },
      {
       "title": "Banco de ideias",
       "description": "Um lugar para cada pauta.",
       "duration_min": 10
      },
      {
       "title": "Constância sem esgotar",
       "description": "O ritmo que você aguenta.",
       "duration_min": 10
      }
     ]
    },
    {
     "title": "As Ferramentas",
     "description": "Organizar e agendar.",
     "lessons": [
      {
       "title": "Onde organizar",
       "description": "Planilha, Notion ou Trello.",
       "duration_min": 12
      },
      {
       "title": "Onde agendar",
       "description": "Meta Business Suite e alternativas.",
       "duration_min": 12
      },
      {
       "title": "Produção em lote",
       "description": "Um dia que resolve a semana.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "linha-editorial",
   "title": "Linha Editorial",
   "subtitle": "Sobre o que você fala e por quê",
   "category": "Redes sociais",
   "level": "Intermediário",
   "tags": "redes sociais, linha editorial, persona, pilares, médio ticket",
   "price": 147,
   "anchor_price": 297,
   "color": 5,
   "featured": false,
   "short_desc": "Defina a linha editorial das suas redes: persona, tom de voz, pilares de conteúdo e o equilíbrio entre educar, conectar, provar e vender.",
   "description": "Sem linha editorial, as redes viram uma colagem de assuntos soltos e o seguidor não sabe por que te segue. Com ela, cada post tem um papel.\n\nVocê define para quem fala, como fala e sobre o que fala, e transforma isso em pilares que rendem pauta para meses.",
   "promise": "Uma linha editorial clara que dá identidade e direção para todo post",
   "audience": [
    "Quem posta muito e não vê resultado",
    "Marca que quer se posicionar",
    "Social media que precisa apresentar estratégia ao cliente"
   ],
   "pains": [
    "Seu perfil fala de tudo e de nada.",
    "Os seguidores não compram.",
    "Cada pessoa do time posta de um jeito."
   ],
   "benefits": [
    "Persona e voz: para quem e como você fala.",
    "Pilares: os temas que sustentam o perfil.",
    "Equilíbrio: educar, conectar, provar e vender."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Para Quem",
     "description": "A base de tudo.",
     "lessons": [
      {
       "title": "Persona de verdade",
       "description": "Quem é, o que sente, o que quer.",
       "duration_min": 14
      },
      {
       "title": "Tom de voz",
       "description": "Como você fala e como não fala.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "Sobre o Quê",
     "description": "Os pilares.",
     "lessons": [
      {
       "title": "Pilares de conteúdo",
       "description": "Os temas que sustentam o perfil.",
       "duration_min": 13
      },
      {
       "title": "Educar, conectar, provar e vender",
       "description": "O papel de cada post.",
       "duration_min": 15
      },
      {
       "title": "Pautas a partir dos pilares",
       "description": "Meses de assunto.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "No Papel",
     "description": "O documento da linha.",
     "lessons": [
      {
       "title": "O guia editorial",
       "description": "Uma página para o time inteiro.",
       "duration_min": 12
      },
      {
       "title": "Revisando a linha",
       "description": "Quando e como ajustar.",
       "duration_min": 10
      }
     ]
    }
   ]
  },
  {
   "slug": "analise-de-redes",
   "title": "Análise de Redes",
   "subtitle": "Pesquisa, métricas e ajuste mensal",
   "category": "Redes sociais",
   "level": "Intermediário",
   "tags": "redes sociais, métricas, pesquisa, análise, médio ticket",
   "price": 147,
   "anchor_price": 297,
   "color": 5,
   "featured": false,
   "short_desc": "Pesquise pautas e referências com método, leia as métricas que importam e faça um ajuste mensal baseado em número.",
   "description": "Seguidor e curtida são números de vaidade quando estão sozinhos. O que mostra se as redes funcionam é alcance novo, salvamento, resposta e clique.\n\nVocê aprende a pesquisar o que funciona no seu nicho, a ler as métricas certas e a ajustar o plano todo mês.",
   "promise": "Decidir o conteúdo do próximo mês com base em pesquisa e número",
   "audience": [
    "Quem posta e não sabe o que está funcionando",
    "Social media que precisa de relatório",
    "Marca que quer crescer com método"
   ],
   "pains": [
    "Você não sabe qual post trouxe cliente.",
    "Copia o que viu no concorrente sem saber se funciona.",
    "Relatório de redes que ninguém lê."
   ],
   "benefits": [
    "Pesquisa: pautas e referências com método.",
    "Métricas: as que mostram resultado de verdade.",
    "Ajuste: o plano do mês seguinte."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Pesquisa",
     "description": "Antes de postar.",
     "lessons": [
      {
       "title": "Pesquisa de pautas e referências",
       "description": "Onde procurar e o que anotar.",
       "duration_min": 13
      },
      {
       "title": "Ouvindo o público",
       "description": "Comentários, directs e perguntas.",
       "duration_min": 11
      },
      {
       "title": "Olhando o concorrente",
       "description": "O que funciona e o que falta.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "As Métricas",
     "description": "O que olhar.",
     "lessons": [
      {
       "title": "Métricas que importam",
       "description": "Alcance, salvamento e clique.",
       "duration_min": 14
      },
      {
       "title": "Do post à venda",
       "description": "Medir o que vira cliente.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "O Ajuste",
     "description": "Todo mês.",
     "lessons": [
      {
       "title": "O relatório de uma página",
       "description": "Para você ou para o cliente.",
       "duration_min": 11
      },
      {
       "title": "Ajuste mensal",
       "description": "Manter, cortar e testar.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "produto-do-zero",
   "title": "Produto do Zero",
   "subtitle": "Da ideia à primeira venda do seu produto digital",
   "category": "Produto",
   "level": "Iniciante",
   "tags": "produto digital, infoproduto, pesquisa de mercado, oferta, pré-venda, médio ticket",
   "price": 397,
   "anchor_price": 797,
   "color": 4,
   "featured": false,
   "short_desc": "Transforme o que você sabe em um produto digital: ideia, pesquisa, oferta e entrega enxuta. Do primeiro rascunho à primeira venda, sem gravar nada antes de testar.",
   "description": "Muita gente grava um curso inteiro e só depois descobre que ninguém queria. Aqui a ordem é outra: primeiro a ideia, depois a pesquisa, depois a oferta, e só então a gravação.\n\nVocê sai com uma ideia testada, uma oferta clara, um preço definido e um plano mínimo de entrega, pronto para tentar a primeira venda antes de passar semanas produzindo.",
   "promise": "Uma ideia testada, uma oferta clara e um plano para a primeira venda",
   "audience": [
    "Quem tem conhecimento e nunca transformou isso em produto",
    "Profissionais que querem uma oferta que não dependa só do próprio tempo",
    "Quem já tentou criar um curso e travou na ideia ou na gravação",
    "Donos de negócio que querem lançar um produto sem apostar tudo"
   ],
   "pains": [
    "Você tem mil ideias e não sabe qual vale a pena.",
    "Tem medo de gravar meses de conteúdo e ninguém comprar.",
    "Não sabe definir preço nem o que colocar dentro do produto.",
    "Sente que todo mundo já ensina o que você sabe."
   ],
   "benefits": [
    "Ideia com base: você escolhe o produto pelo que sabe, pelo que perguntam e pelo que as pessoas pagam.",
    "Oferta clara: promessa, formato, preço, bônus e garantia definidos antes de produzir.",
    "Teste antes da gravação: pré-venda e entrega mínima para descobrir se alguém compra."
   ],
   "bonuses": [
    {
     "title": "Planilha de avaliação de ideias",
     "text": "Modelo para comparar ideias de produto por conhecimento, demanda e disposição de pagar.",
     "value": 147
    },
    {
     "title": "Roteiro de entrevista com o público",
     "text": "Perguntas prontas para conversar com possíveis compradores e descobrir o que eles de fato querem.",
     "value": 97
    }
   ],
   "cta_text": "Quero criar meu produto",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "A Ideia",
     "description": "De onde vêm as boas ideias e por que criar este produto.",
     "lessons": [
      {
       "title": "O que você já sabe",
       "description": "Faça o inventário do que você domina, do que já resolveu para outras pessoas e do que gosta de ensinar.",
       "duration_min": 13
      },
      {
       "title": "O que perguntam e o que pagam",
       "description": "Cruze as dúvidas que as pessoas te trazem com os problemas pelos quais elas já gastam dinheiro hoje.",
       "duration_min": 14
      },
      {
       "title": "Por que criar este produto",
       "description": "Escolha uma ideia entre as candidatas, com critérios claros, e defina a pergunta que o produto vai responder.",
       "duration_min": 16
      }
     ]
    },
    {
     "title": "A Pesquisa",
     "description": "Ouvir o público, olhar o mercado e medir a demanda antes de produzir.",
     "lessons": [
      {
       "title": "Perguntando ao público",
       "description": "Monte um formulário curto e conduza entrevistas para entender o problema nas palavras de quem o sente.",
       "duration_min": 18
      },
      {
       "title": "Olhando a concorrência",
       "description": "Veja o que já existe, o que está faltando e onde o seu produto pode ser diferente sem inventar moda.",
       "duration_min": 17
      },
      {
       "title": "Medindo a demanda",
       "description": "Use comentários, perguntas e buscas na internet para ver se há gente procurando a solução que você pensa em vender.",
       "duration_min": 16
      }
     ]
    },
    {
     "title": "A Oferta",
     "description": "Promessa, formato, preço e validação: a ideia vira oferta.",
     "lessons": [
      {
       "title": "A promessa em uma frase",
       "description": "Escreva o que a pessoa vai conseguir fazer depois do produto, de um jeito específico e crível.",
       "duration_min": 14
      },
      {
       "title": "Curso, mentoria, comunidade ou modelo",
       "description": "Compare curso, mentoria, comunidade e modelos prontos pelo esforço de produzir, pelo acompanhamento que exigem e pelo problema que resolvem.",
       "duration_min": 17
      },
      {
       "title": "Preço, bônus e garantia",
       "description": "Como chegar a um preço defensável, escolher bônus que fazem sentido e oferecer uma garantia sem se expor demais.",
       "duration_min": 19
      },
      {
       "title": "Validando com pré-venda",
       "description": "Venda antes de gravar: monte a página, combine a entrega e use as primeiras respostas para decidir se segue.",
       "duration_min": 18
      }
     ]
    },
    {
     "title": "A Entrega",
     "description": "Gravar o mínimo, entregar bem e fazer a primeira venda.",
     "lessons": [
      {
       "title": "Estrutura de módulos e aulas",
       "description": "Organize o conteúdo em módulos curtos, com um objetivo por aula, e corte tudo o que não leva ao resultado.",
       "duration_min": 16
      },
      {
       "title": "Gravação mínima e plataforma",
       "description": "Grave com o celular e um bom áudio, e escolha onde hospedar as aulas sem complicar a operação.",
       "duration_min": 18
      },
      {
       "title": "Sua primeira venda",
       "description": "Convide as pessoas certas, converse com quem demonstrou interesse e entregue com cuidado para colher o primeiro feedback.",
       "duration_min": 15
      }
     ]
    }
   ]
  },
  {
   "slug": "agencia-de-bolso",
   "title": "Agência de Bolso",
   "subtitle": "Venda serviços digitais para negócios da sua cidade",
   "category": "Negócios",
   "level": "Intermediário",
   "tags": "agência, serviços, prospecção, freelancer, clientes locais, semi high ticket",
   "price": 697,
   "anchor_price": 1397,
   "color": 0,
   "featured": false,
   "short_desc": "Monte um cardápio de serviços digitais, encontre clientes locais, feche com proposta e entregue com processo, sem virar escravo do próprio negócio.",
   "description": "Pequenos negócios da sua cidade precisam de identidade visual, posts, vídeo, anúncios e sistemas simples. Muita gente sabe fazer, mas não sabe vender nem entregar sem se afogar. Este curso organiza as duas pontas.\n\nVocê monta o cardápio e o preço, acha clientes pelo Google Maps e pelo WhatsApp, fecha com diagnóstico e proposta e cria um processo de entrega que cabe em você e, depois, em um time pequeno.",
   "promise": "Um cardápio, um jeito de vender e uma entrega organizada para atender clientes locais",
   "audience": [
    "Designers, editores de vídeo e social medias que querem vender melhor o próprio serviço",
    "Gestores de tráfego e criadores de sistemas simples que querem clientes mais perto",
    "Freelancers que vivem de indicação e de épocas boas e ruins",
    "Quem quer começar uma pequena agência sem montar uma estrutura pesada"
   ],
   "pains": [
    "Você sabe fazer, mas trava na hora de falar de preço.",
    "Cada cliente pede uma coisa diferente e você cobra diferente a cada vez.",
    "Você nunca sabe onde achar o próximo cliente.",
    "Entrega tudo sozinho, a qualquer hora, e o cliente ainda reclama."
   ],
   "benefits": [
    "Cardápio claro: serviços, pacotes e preço montados com lógica, e uma regra de pagamento que protege você.",
    "Clientes no radar: um método para achar, abordar e fechar negócios locais sem depender só de indicação.",
    "Entrega com processo: rotina, time pequeno e relatório mensal para não virar escravo do cliente."
   ],
   "bonuses": [
    {
     "title": "Modelos de proposta e contrato",
     "text": "Uma proposta e um contrato simples para adaptar aos seus pacotes; revise com um profissional da sua região.",
     "value": 197
    },
    {
     "title": "Planilha de prospecção",
     "text": "Controle de contatos, abordagens, respostas e fechamentos em um só lugar.",
     "value": 97
    }
   ],
   "cta_text": "Quero montar minha agência",
   "aff_enabled": true,
   "aff_commission": 50,
   "seasons": [
    {
     "title": "O Cardápio",
     "description": "O que você vende, por quanto e em que condições.",
     "lessons": [
      {
       "title": "O que vender e em que pacote",
       "description": "Escolher os serviços que você entrega bem e agrupá-los em pacotes com nome, escopo e limite claros.",
       "duration_min": 18
      },
      {
       "title": "A lógica do preço",
       "description": "Calcular seu preço pelo tempo, pelo valor para o cliente e pelo custo de entregar, sem copiar a concorrência.",
       "duration_min": 18
      },
      {
       "title": "Metade no início, metade na entrega",
       "description": "Aplicar a regra de receber metade para começar e metade na entrega, protegida por um contrato simples.",
       "duration_min": 16
      }
     ]
    },
    {
     "title": "Prospecção",
     "description": "Achar o cliente certo na sua cidade e conseguir a primeira conversa.",
     "lessons": [
      {
       "title": "Clientes no Google Maps",
       "description": "Usar o Google Maps para listar negócios locais com presença digital fraca e escolher quem abordar primeiro.",
       "duration_min": 20
      },
      {
       "title": "Abordagem presencial e no WhatsApp",
       "description": "Escrever e dizer a primeira mensagem de um jeito que gera conversa, sem parecer spam nem pedir favor.",
       "duration_min": 18
      },
      {
       "title": "Portfólio com poucos trabalhos",
       "description": "Montar um portfólio convincente mesmo sem clientes grandes, usando trabalhos próprios, antes e depois e demonstrações.",
       "duration_min": 14
      }
     ]
    },
    {
     "title": "Proposta e Fechamento",
     "description": "Da primeira conversa ao contrato fechado e ao cliente mensal.",
     "lessons": [
      {
       "title": "Diagnóstico rápido",
       "description": "Fazer em poucos minutos uma análise do negócio do cliente que mostra o problema e abre a venda.",
       "duration_min": 16
      },
      {
       "title": "Proposta que fecha",
       "description": "Montar uma proposta de uma página com problema, solução, pacote, prazo e forma de pagamento.",
       "duration_min": 17
      },
      {
       "title": "Objeções sem discussão",
       "description": "Responder 'está caro', 'vou pensar' e 'meu primo faz' com perguntas, não com argumento.",
       "duration_min": 14
      },
      {
       "title": "Recorrência mensal",
       "description": "Transformar o trabalho único em acompanhamento mensal que o cliente enxerga como parte do próprio negócio.",
       "duration_min": 15
      }
     ]
    },
    {
     "title": "Entrega Sem Virar Escravo",
     "description": "Entregar com processo, ajuda e relatório, sem trabalhar a qualquer hora.",
     "lessons": [
      {
       "title": "Processo de entrega e ferramentas",
       "description": "Montar o passo a passo da entrega, do briefing à aprovação, e escolher poucas ferramentas para acompanhar tudo.",
       "duration_min": 18
      },
      {
       "title": "Time pequeno com comissão",
       "description": "Chamar parceiros para produzir e combinar comissão por entrega, com regras claras de qualidade e prazo.",
       "duration_min": 16
      },
      {
       "title": "White-label sem dor de cabeça",
       "description": "Revender o trabalho de outros profissionais com a sua marca, cuidando de qualidade, sigilo e responsabilidade.",
       "duration_min": 15
      },
      {
       "title": "Relatório mensal ao cliente",
       "description": "Montar um relatório simples todo mês que mostra o que foi feito, o que mudou e o próximo passo.",
       "duration_min": 16
      }
     ]
    }
   ]
  },
  {
   "slug": "time-que-entrega",
   "title": "Time Que Entrega",
   "subtitle": "Como gerir um time de marketing sem apagar incêndio",
   "category": "Negócios",
   "level": "Avançado",
   "tags": "gestão, equipe, kpis, metas, marketing, médio ticket",
   "price": 397,
   "anchor_price": 797,
   "color": 0,
   "featured": false,
   "short_desc": "Passe de executor a gestor: papéis claros, metas e KPIs, rotina enxuta e várias campanhas rodando em paralelo sem caos.",
   "description": "Quando o time cresce, o que te trouxe até aqui deixa de bastar. Este curso mostra como sair do operacional, definir quem responde pelo quê e medir o time por números que fazem sentido.\n\nVocê monta indicadores e metas em três níveis, uma rotina com reuniões curtas e quadro de tarefas, e um jeito de rodar funis perpétuos e eventos ao mesmo tempo, com marketing e vendas remando juntos.",
   "promise": "Um time de marketing com papéis claros, metas medidas e rotina que roda sem você",
   "audience": [
    "Coordenadores e líderes de marketing que ainda executam metade do trabalho",
    "Donos de negócio que montaram um time e não sabem cobrar nem medir",
    "Quem gerencia várias campanhas ao mesmo tempo e vive apagando incêndio",
    "Profissionais promovidos a gestor sem nunca terem aprendido a gerir"
   ],
   "pains": [
    "Você virou chefe do time, mas continua fazendo o trabalho de todo mundo.",
    "Ninguém sabe ao certo de quem é cada entrega.",
    "As reuniões são longas e as tarefas continuam atrasadas.",
    "Marketing culpa vendas, vendas culpa marketing e o número não melhora."
   ],
   "benefits": [
    "Papéis claros: cada pessoa sabe o que entrega, para quem e até quando.",
    "Metas que orientam: indicadores por etapa e por produto, com meta mínima, audaciosa e agressiva.",
    "Rotina que roda: reuniões curtas, quadro de tarefas e revisões que mantêm várias campanhas em pé."
   ],
   "bonuses": [
    {
     "title": "Modelo de painel de KPIs do time",
     "text": "Uma planilha com indicadores por etapa, metas em três níveis e cores de semáforo, pronta para adaptar.",
     "value": 197
    },
    {
     "title": "Roteiros de reunião e pós-mortem",
     "text": "Pautas curtas para a reunião semanal, a revisão de campanha e o pós-mortem sem caça a culpado.",
     "value": 97
    }
   ],
   "cta_text": "Quero um time que entrega",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Papel do Gestor",
     "description": "Sair do operacional e deixar claro o que cada pessoa entrega.",
     "lessons": [
      {
       "title": "Do executor ao gestor",
       "description": "Entender o que muda quando o seu resultado passa a depender do trabalho dos outros.",
       "duration_min": 16
      },
      {
       "title": "O que você para de fazer",
       "description": "Listar as tarefas que só você faz hoje e decidir o que fica, o que passa e o que acaba.",
       "duration_min": 15
      },
      {
       "title": "Papéis claros por pessoa",
       "description": "Definir para cada pessoa a responsabilidade, a entrega esperada e quem decide o quê.",
       "duration_min": 18
      }
     ]
    },
    {
     "title": "Metas e KPIs",
     "description": "Os números que o time acompanha, por etapa e por produto.",
     "lessons": [
      {
       "title": "Indicadores de captação",
       "description": "Escolher os poucos indicadores, do clique ao lead qualificado e à venda, que dizem se a captação vai bem.",
       "duration_min": 20
      },
      {
       "title": "Metas por etapa e por produto",
       "description": "Definir metas diferentes para cada etapa do funil e para cada produto, em vez de uma meta única.",
       "duration_min": 18
      },
      {
       "title": "Meta mínima, audaciosa e agressiva",
       "description": "Montar três níveis de meta para saber o que garante o básico, o que desafia e o que exige tudo.",
       "duration_min": 16
      },
      {
       "title": "O painel do time",
       "description": "Montar um painel simples com metas, resultados e cores de semáforo que todos entendem em segundos.",
       "duration_min": 22
      }
     ]
    },
    {
     "title": "Rotina do Time",
     "description": "Reunião curta, tarefa visível e entrega revisada.",
     "lessons": [
      {
       "title": "Reunião curta que funciona",
       "description": "Estruturar a reunião semanal em pauta fixa e tempo curto, com decisões e responsáveis anotados.",
       "duration_min": 14
      },
      {
       "title": "Quadro de tarefas",
       "description": "Montar um quadro de tarefas onde qualquer pessoa vê o que está em andamento, travado e entregue.",
       "duration_min": 15
      },
      {
       "title": "Entregáveis e revisões",
       "description": "Definir o que é uma entrega pronta, quem revisa e como dar retorno sem retrabalho nem melindre.",
       "duration_min": 17
      },
      {
       "title": "Passando a responsabilidade",
       "description": "Delegar uma responsabilidade inteira, com contexto, critério de sucesso e acompanhamento sem microgerenciar.",
       "duration_min": 18
      }
     ]
    },
    {
     "title": "Campanhas em Paralelo",
     "description": "Funis e eventos ao mesmo tempo, com marketing e vendas no mesmo ritmo.",
     "lessons": [
      {
       "title": "Funil e evento ao mesmo tempo",
       "description": "Dividir o time, o calendário e o orçamento para rodar campanhas perpétuas e eventos sem que um atropele o outro.",
       "duration_min": 22
      },
      {
       "title": "Marketing e vendas juntos",
       "description": "Alinhar com vendas o que é lead qualificado, o tempo de resposta e o retorno sobre cada lista.",
       "duration_min": 20
      },
      {
       "title": "Pós-mortem sem culpado",
       "description": "Fazer a análise depois de cada campanha para registrar o que funcionou, o que falhou e o que muda.",
       "duration_min": 16
      }
     ]
    }
   ]
  },
  {
   "slug": "um-por-cento-ao-dia",
   "title": "1% ao Dia",
   "subtitle": "Melhorar pouco, todo dia, sem drama",
   "category": "Mente e corpo",
   "level": "Todos os níveis",
   "tags": "mentalidade, hábitos, rotina, constância, low ticket",
   "price": 97,
   "anchor_price": 197,
   "color": 5,
   "featured": false,
   "short_desc": "Mentalidade sem frase de efeito: como começar mal, aprender rápido e melhorar um pouco por dia com rotina, análise e cuidado com o corpo.",
   "description": "Este curso não vende motivação. Ele mostra o que acontece depois que a empolgação passa: o começo desajeitado, a semana bagunçada, o dia em que você pensa em largar tudo.\n\nEm episódios curtos, você monta um sistema pequeno para melhorar um pouco todo dia: uma semana organizada, uma revisão honesta da rotina e o básico de sono, movimento e descanso para aguentar o caminho.",
   "promise": "Um sistema simples para melhorar um pouco todo dia e não largar no meio do caminho",
   "audience": [
    "Quem está começando algo novo e já se cobra para ser bom desde o primeiro dia",
    "Empreendedores e profissionais que vivem apagando incêndio e não têm rotina",
    "Quem já começou e parou várias vezes e quer entender o motivo",
    "Quem sente que trabalha muito e evolui pouco"
   ],
   "pains": [
    "Você começa empolgado, tropeça nas primeiras semanas e acha que não nasceu para isso.",
    "Sua semana é reação: o que aparece primeiro é o que você faz.",
    "Você trabalha o tempo todo, mas não sabe dizer o que melhorou no mês.",
    "Está cansado, dorme mal e acha que descansar é perder tempo."
   ],
   "benefits": [
    "Começo sem culpa: entenda por que todo início é ruim e como atravessar essa fase sem desistir.",
    "Sistema semanal: uma rotina simples de planejar, executar e revisar que cabe na vida real.",
    "Combustível em dia: motivo claro, tempo offline e hábitos básicos de corpo para sustentar o ritmo."
   ],
   "bonuses": [
    {
     "title": "Planilha de revisão semanal",
     "text": "Uma aba para planejar a semana e outra para revisar o que funcionou, pronta para copiar.",
     "value": 67
    },
    {
     "title": "Checklist do dia mínimo",
     "text": "Uma página com as ações mínimas do dia, para os dias em que tudo desanda.",
     "value": 47
    }
   ],
   "cta_text": "Quero começar pelo 1%",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Começo",
     "description": "Todo começo é ruim, e isso não é sinal de que você errou o caminho.",
     "lessons": [
      {
       "title": "Todo começo é ruim",
       "description": "Entender por que o primeiro resultado sai torto e por que isso não diz nada sobre o seu futuro.",
       "duration_min": 9
      },
      {
       "title": "Tudo é aprendizado",
       "description": "Trocar a pergunta 'deu certo ou errado' por 'o que isso me ensinou' e anotar a resposta.",
       "duration_min": 11
      },
      {
       "title": "Não desista cedo",
       "description": "Reconhecer o ponto em que muita gente larga e combinar com você mesmo o que fazer nesse dia.",
       "duration_min": 10
      }
     ]
    },
    {
     "title": "O Sistema",
     "description": "Uma semana organizada e uma revisão honesta valem mais que motivação.",
     "lessons": [
      {
       "title": "Um por cento por dia",
       "description": "Entender a lógica da melhora pequena e escolher uma única coisa para melhorar esta semana.",
       "duration_min": 12
      },
      {
       "title": "A semana organizada",
       "description": "Montar o planejamento semanal em três passos: prioridades, blocos de tempo e o que fica de fora.",
       "duration_min": 15
      },
      {
       "title": "Organizar e analisar",
       "description": "Por que organização e análise pesam mais que esforço bruto, e como escolher o que acompanhar toda semana.",
       "duration_min": 14
      },
      {
       "title": "Revisando a própria rotina",
       "description": "Fazer a revisão da semana: o que funcionou, o que travou e o que muda na próxima.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "Combustível",
     "description": "O que sustenta o ritmo: um motivo, tempo offline e um corpo cuidado.",
     "lessons": [
      {
       "title": "Seu porquê",
       "description": "Descobrir por que você faz o que faz e escrever isso de um jeito que ainda sirva num dia ruim.",
       "duration_min": 12
      },
      {
       "title": "Offline também é resultado",
       "description": "Por que desligar faz parte do trabalho e como criar janelas sem celular, sem culpa.",
       "duration_min": 10
      },
      {
       "title": "Dormir é parte do plano",
       "description": "Hábitos gerais de sono que ajudam a render no dia seguinte, sem diagnóstico nem receita.",
       "duration_min": 11
      },
      {
       "title": "Movimento e comida simples",
       "description": "Caminhar, mexer o corpo e comer sem complicar: hábitos gerais que cabem na rotina de quem trabalha.",
       "duration_min": 12
      }
     ]
    }
   ]
  },
  {
   "slug": "respira",
   "title": "Respira",
   "subtitle": "Presença para quem vive no corre",
   "category": "Mente e corpo",
   "level": "Todos os níveis",
   "tags": "respiração, meditação, presença, pausa, low ticket",
   "price": 97,
   "anchor_price": 197,
   "color": 5,
   "featured": false,
   "short_desc": "Práticas curtas de respiração e meditação para desacelerar a mente sem largar o que você constrói. Dez minutos por dia.",
   "description": "Um curso de prática, não de teoria. Respiração, atenção e silêncio em doses curtas, para encaixar entre as reuniões, antes de dormir ou antes de uma decisão difícil.\n\nVocê começa pelo básico, ganha práticas para o meio do expediente, para antes de gravar ou falar em público e para o fim do dia, e termina com um ritual só seu. É hábito, não tratamento: nada aqui substitui o cuidado de um profissional de saúde.",
   "promise": "Dez minutos por dia para desacelerar a mente e estar presente no que importa",
   "audience": [
    "Empreendedores e profissionais que vivem no corre e não conseguem desligar",
    "Quem já tentou meditar, achou difícil e largou",
    "Quem precisa gravar, apresentar ou falar em público e sente o corpo travar",
    "Quem quer um ritual curto, que caiba entre uma tarefa e outra"
   ],
   "pains": [
    "Sua cabeça não desliga nem na hora de dormir.",
    "Você vive no automático e sente que a vida passa no celular.",
    "Já tentou meditar e desistiu porque parecia difícil.",
    "Antes de gravar ou falar em público, você trava e a voz sai tensa."
   ],
   "benefits": [
    "Respirar com intenção: técnicas simples para desacelerar em poucos minutos.",
    "Atenção treinada: foco de volta, sem esforço heroico.",
    "Ritual possível: uma rotina que cabe na vida real."
   ],
   "bonuses": [
    {
     "title": "Cartões de pausa",
     "text": "As práticas do curso resumidas em uma página para imprimir e deixar na mesa de trabalho.",
     "value": 47
    }
   ],
   "cta_text": "Quero meus dez minutos",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Primeiro Fôlego",
     "description": "Práticas guiadas para começar.",
     "lessons": [
      {
       "title": "Por que respirar muda tudo",
       "description": "O que acontece no corpo quando você desacelera a respiração.",
       "duration_min": 8
      },
      {
       "title": "Respiração quadrada",
       "description": "Quatro tempos para voltar ao centro em qualquer lugar.",
       "duration_min": 10
      },
      {
       "title": "Meditação de cinco minutos",
       "description": "A prática mínima para quem diz que não tem tempo.",
       "duration_min": 7
      },
      {
       "title": "Antes de dormir",
       "description": "Desligar a cabeça e entregar o dia.",
       "duration_min": 12
      }
     ]
    },
    {
     "title": "Pausa no Corre",
     "description": "Respirar no meio do trabalho, antes de aparecer e na hora de fechar o dia.",
     "lessons": [
      {
       "title": "Micro-pausas no expediente",
       "description": "Pausas de um a três minutos entre tarefas para respirar, soltar os ombros e voltar com a cabeça no lugar.",
       "duration_min": 8
      },
      {
       "title": "Antes de gravar",
       "description": "Uma sequência curta de respiração para entrar em frente à câmera com a voz firme e o corpo solto.",
       "duration_min": 7
      },
      {
       "title": "Antes de falar em público",
       "description": "Preparar o corpo e a respiração nos minutos antes de subir ao palco, entrar na reunião ou abrir a live.",
       "duration_min": 9
      },
      {
       "title": "Fechando o expediente",
       "description": "Um ritual de fim de dia para encerrar o trabalho, soltar as pendências e chegar inteiro em casa.",
       "duration_min": 10
      }
     ]
    },
    {
     "title": "Raiz",
     "description": "Aprofundar a prática e criar o seu ritual.",
     "lessons": [
      {
       "title": "Silêncio e escuta",
       "description": "Ficar com o que aparece, sem brigar.",
       "duration_min": 14
      },
      {
       "title": "Gratidão que não é clichê",
       "description": "Uma prática concreta para fechar o dia.",
       "duration_min": 9
      },
      {
       "title": "Seu ritual de manhã",
       "description": "Montar uma sequência de dez minutos que é só sua.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "sem-sumir-de-casa",
   "title": "Sem Sumir de Casa",
   "subtitle": "Crescer o negócio sem perder quem você ama",
   "category": "Mente e corpo",
   "level": "Todos os níveis",
   "tags": "família, rotina, empreender, equilíbrio, médio ticket",
   "price": 197,
   "anchor_price": 397,
   "color": 5,
   "featured": false,
   "short_desc": "Rotina, limites e acordos para crescer o negócio sendo pai, mãe, companheiro ou companheira e estar inteiro dentro de casa.",
   "description": "Empreender cobra um preço, e a família costuma sentir primeiro. Este curso trata disso sem culpa e sem receita pronta: conversa, acordo, rotina e presença.\n\nVocê sai com combinados claros com quem mora com você, uma semana com hora para começar e para parar, rituais de família que ninguém precisa lembrar e um plano para as semanas em que tudo aperta.",
   "promise": "Uma rotina e acordos claros para crescer o negócio sem perder a presença em casa",
   "audience": [
    "Empreendedores e autônomos que trabalham de casa ou levam o trabalho para dentro de casa",
    "Pais e mães que estão no mesmo ambiente que os filhos, mas com a cabeça no trabalho",
    "Casais em que um dos dois empreende e a rotina da casa virou fonte de atrito",
    "Quem tem lançamento, evento ou prazo apertado e não quer sumir da família nessas semanas"
   ],
   "pains": [
    "Você está em casa, mas a cabeça está no trabalho.",
    "O celular toca no jantar e você atende.",
    "A família já parou de perguntar a que horas você termina.",
    "Toda semana de lançamento vira uma semana de ausência."
   ],
   "benefits": [
    "Acordo claro: uma conversa guiada com a família e combinados escritos que todo mundo entende.",
    "Rotina com limite: blocos de tempo, hora de parar e um jeito de trabalhar com criança em casa.",
    "Presença de verdade: rituais e regras de celular que protegem o tempo em família, inclusive nas semanas difíceis."
   ],
   "bonuses": [
    {
     "title": "Modelo de acordo da família",
     "text": "Uma folha para preencher com quem mora com você: horários, limites e rituais combinados.",
     "value": 67
    },
    {
     "title": "Planejador semanal casa e negócio",
     "text": "Planilha com os blocos de trabalho, as refeições e os compromissos da família na mesma visão.",
     "value": 97
    }
   ],
   "cta_text": "Quero rotina sem sumir",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Acordo",
     "description": "Antes da rotina vem a conversa: o que cada um espera de você.",
     "lessons": [
      {
       "title": "A conversa que você adia",
       "description": "Como abrir o assunto com sua família sem se defender e sem transformar a conversa em cobrança.",
       "duration_min": 14
      },
      {
       "title": "O que cada um espera",
       "description": "Colocar as expectativas na mesa: o que o negócio exige de você e o que a casa precisa.",
       "duration_min": 12
      },
      {
       "title": "Acordos que cabem na semana",
       "description": "Transformar a conversa em poucos combinados escritos, simples de cumprir e fáceis de revisar.",
       "duration_min": 13
      }
     ]
    },
    {
     "title": "A Rotina",
     "description": "Horários, limites e um espaço de trabalho que respeita a casa.",
     "lessons": [
      {
       "title": "Blocos de tempo",
       "description": "Dividir a semana em blocos de trabalho e de casa, com margem para o que não estava no plano.",
       "duration_min": 15
      },
      {
       "title": "Hora de parar",
       "description": "Definir um horário de encerramento, um ritual para fechar o computador e o que fazer com as pendências.",
       "duration_min": 12
      },
      {
       "title": "Home office com criança em casa",
       "description": "Organizar horários, espaço e combinados para trabalhar com criança por perto sem perder foco nem paciência.",
       "duration_min": 16
      }
     ]
    },
    {
     "title": "Presença",
     "description": "Estar inteiro no tempo que sobra para a família.",
     "lessons": [
      {
       "title": "Tempo de qualidade de verdade",
       "description": "Trocar horas de corpo presente por momentos de atenção inteira, mesmo curtos.",
       "duration_min": 12
      },
      {
       "title": "Celular longe da mesa",
       "description": "Criar regras de uso do celular que valem para todos da casa, inclusive para você.",
       "duration_min": 10
      },
      {
       "title": "Rituais de família",
       "description": "Escolher pequenos rituais diários e semanais que a família espera e que sobrevivem à correria.",
       "duration_min": 11
      }
     ]
    },
    {
     "title": "Quando Aperta",
     "description": "Lançamento, prazo e crise sem abandonar a casa.",
     "lessons": [
      {
       "title": "Semana de lançamento",
       "description": "Avisar, combinar e planejar a semana mais puxada do negócio para a casa aguentar junto com você.",
       "duration_min": 15
      },
      {
       "title": "Prazo apertado, casa avisada",
       "description": "Como avisar com antecedência, negociar a ausência e compensar o tempo depois que o prazo passa.",
       "duration_min": 12
      },
      {
       "title": "Crise e volta para casa",
       "description": "O que fazer quando o problema não espera: comunicar, resolver e reconstruir a presença depois.",
       "duration_min": 13
      }
     ]
    }
   ]
  },
  {
   "slug": "cinco-vazamentos",
   "title": "Os 5 Vazamentos do Seu Dinheiro",
   "subtitle": "Onde a grana some sem você ver",
   "category": "Grana",
   "level": "Iniciante",
   "tags": "grátis, finanças pessoais, dinheiro, organização, grátis",
   "price": 0,
   "anchor_price": 0,
   "color": 4,
   "featured": false,
   "short_desc": "Quatro episódios para achar os cinco vazamentos mais comuns no dinheiro de quem empreende e fechar o primeiro ainda hoje.",
   "description": "A maior parte do dinheiro que some não vai em grandes compras. Vai em assinatura esquecida, conta misturada com a da empresa e gasto pequeno repetido.\n\nVocê identifica os seus vazamentos e sabe se vale montar o sistema completo do Grana em Ordem.",
   "promise": "Achar para onde o seu dinheiro está indo e fechar o primeiro vazamento hoje",
   "audience": [
    "Quem ganha e não sabe para onde vai o dinheiro",
    "Empreendedor que mistura conta pessoal e da empresa",
    "Quem quer conhecer a trilha de Grana"
   ],
   "pains": [
    "O mês acaba antes do dinheiro.",
    "Você nem lembra das assinaturas que paga.",
    "Usa o dinheiro da empresa como se fosse seu."
   ],
   "benefits": [
    "Raio-X: os cinco vazamentos mais comuns.",
    "Ação: fechar o primeiro hoje.",
    "Próximo passo: um sistema simples de controle."
   ],
   "bonuses": [],
   "cta_text": "Assistir de graça",
   "aff_enabled": false,
   "aff_commission": 0,
   "seasons": [
    {
     "title": "O Raio-X",
     "description": "Achar o vazamento.",
     "lessons": [
      {
       "title": "Assinaturas esquecidas",
       "description": "O débito que ninguém vê.",
       "duration_min": 7
      },
      {
       "title": "Conta pessoal e da empresa juntas",
       "description": "O vazamento do empreendedor.",
       "duration_min": 9
      },
      {
       "title": "Gasto pequeno repetido",
       "description": "O café que vira aluguel.",
       "duration_min": 7
      },
      {
       "title": "Juros e parcelas",
       "description": "O dinheiro que vai para o banco.",
       "duration_min": 9
      }
     ]
    }
   ]
  },
  {
   "slug": "mei-sem-misterio",
   "title": "MEI Sem Mistério",
   "subtitle": "Abrir, manter e saber quando sair",
   "category": "Grana",
   "level": "Iniciante",
   "tags": "mei, cnpj, nota fiscal, das, low ticket",
   "price": 47,
   "anchor_price": 97,
   "color": 4,
   "featured": false,
   "short_desc": "Tudo o que você precisa para ser MEI: quem pode, como abrir, a guia de todo mês, nota fiscal, declaração anual e quando deixar de ser MEI.",
   "description": "Ser MEI dá CNPJ, nota fiscal e contribuição para a aposentadoria por um valor baixo por mês. O cuidado está nas regras: limite de faturamento, atividades permitidas e prazos.\n\nVocê abre o seu MEI passo a passo e sabe o que fazer todo mês e todo ano. Valores e limites mudam, então o curso sempre indica onde conferir o dado atual, e nada aqui substitui o acompanhamento de um contador.",
   "promise": "Ser MEI com tudo em dia: aberto, pago e declarado",
   "audience": [
    "Quem trabalha por conta e quer formalizar",
    "Quem precisa emitir nota fiscal",
    "Quem já é MEI e tem dúvida sobre as obrigações"
   ],
   "pains": [
    "Você tem medo de abrir CNPJ e se complicar.",
    "Não sabe se a sua atividade pode ser MEI.",
    "Esqueceu de pagar o DAS ou de declarar."
   ],
   "benefits": [
    "Abertura: passo a passo no Portal do Empreendedor.",
    "Rotina: DAS, nota fiscal e declaração.",
    "Limites: quando o MEI deixa de servir."
   ],
   "bonuses": [],
   "cta_text": "Quero começar",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "Abrir",
     "description": "Do zero ao CNPJ.",
     "lessons": [
      {
       "title": "O que é MEI e quem pode",
       "description": "Atividades e limite de faturamento.",
       "duration_min": 12
      },
      {
       "title": "Abrindo no Portal do Empreendedor",
       "description": "Passo a passo.",
       "duration_min": 18
      }
     ]
    },
    {
     "title": "Manter",
     "description": "Tudo em dia.",
     "lessons": [
      {
       "title": "DAS: a guia de todo mês",
       "description": "Como pagar e o que acontece se atrasar.",
       "duration_min": 11
      },
      {
       "title": "Nota fiscal",
       "description": "Emitir sem dor de cabeça.",
       "duration_min": 13
      },
      {
       "title": "Declaração anual",
       "description": "O prazo e o que informar.",
       "duration_min": 11
      },
      {
       "title": "Quando deixar de ser MEI",
       "description": "Os sinais e o próximo passo.",
       "duration_min": 11
      }
     ]
    }
   ]
  },
  {
   "slug": "grana-em-ordem",
   "title": "Grana em Ordem",
   "subtitle": "Separe o dinheiro, monte o sistema e abra seu MEI",
   "category": "Grana",
   "level": "Iniciante",
   "tags": "finanças pessoais, planilha, reserva de emergência, low ticket",
   "price": 97,
   "anchor_price": 197,
   "color": 4,
   "featured": false,
   "short_desc": "Descubra para onde vai seu dinheiro e monte uma planilha com rotina de quinze minutos por semana, reserva e metas.",
   "description": "Antes de crescer, o dinheiro precisa estar em ordem. Aqui você faz o raio-X do mês, separa o que é seu do que é da empresa e monta um sistema simples que não depende de disciplina heroica.\n\nVocê sai com a planilha preenchida, uma rotina de quinze minutos por semana, a reserva de emergência começando e metas com data e valor.",
   "promise": "Saber para onde vai seu dinheiro e ter um sistema simples para controlar tudo",
   "audience": [
    "Quem ganha, gasta e chega ao fim do mês sem saber para onde foi o dinheiro",
    "Autônomos e donos de pequeno negócio que misturam a conta pessoal com a da empresa",
    "Iniciantes em finanças que querem um método simples, sem jargão"
   ],
   "pains": [
    "O salário entra e some, e você não sabe explicar onde.",
    "O dinheiro do negócio e o da casa estão na mesma conta.",
    "Qualquer imprevisto vira dívida porque não existe reserva."
   ],
   "benefits": [
    "Raio-X do mês: veja para onde o dinheiro vai e separe as finanças pessoais das da empresa.",
    "Sistema que cabe na semana: planilha e rotina de quinze minutos.",
    "Reserva e metas: um colchão para imprevistos e objetivos com data e valor."
   ],
   "bonuses": [
    {
     "title": "Planilha de finanças pessoais",
     "text": "A planilha construída no curso, pronta para copiar e começar a usar no mesmo dia.",
     "value": 97
    }
   ],
   "cta_text": "Quero minha grana em ordem",
   "aff_enabled": true,
   "aff_commission": 40,
   "seasons": [
    {
     "title": "O Raio-X",
     "description": "Descubra para onde o dinheiro vai antes de tentar controlá-lo.",
     "lessons": [
      {
       "title": "Para onde vai o dinheiro",
       "description": "Levantar o último mês inteiro, do extrato ao dinheiro vivo, sem julgamento e sem arredondar.",
       "duration_min": 14
      },
      {
       "title": "Categorias que funcionam",
       "description": "Agrupar os gastos em poucas categorias e achar os que vazam sem você perceber.",
       "duration_min": 12
      },
      {
       "title": "Dinheiro pessoal e da empresa",
       "description": "Separar as duas contas, combinar uma retirada mensal para você e parar de pagar a casa com o caixa do negócio.",
       "duration_min": 15
      }
     ]
    },
    {
     "title": "O Sistema",
     "description": "Planilha, rotina semanal, reserva e metas para o dinheiro trabalhar a seu favor.",
     "lessons": [
      {
       "title": "A planilha das finanças",
       "description": "Montar uma planilha simples de entradas, saídas e saldo, pronta para usar todo mês.",
       "duration_min": 22
      },
      {
       "title": "Quinze minutos por semana",
       "description": "Criar a rotina semanal de conferir, categorizar e ajustar, sem virar contador da própria vida.",
       "duration_min": 11
      },
      {
       "title": "Reserva de emergência",
       "description": "Para que serve, como definir o tamanho para a sua realidade e como começar pequeno.",
       "duration_min": 13
      },
      {
       "title": "Metas com data e valor",
       "description": "Transformar desejo em meta: quanto custa, até quando e quanto guardar por mês.",
       "duration_min": 12
      }
     ]
    }
   ]
  }
 ]
};
}

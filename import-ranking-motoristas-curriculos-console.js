/*
  Console Dataverse / Model-driven App
  Importa o XLSX ranking_motoristas_curriculos.xlsx para a tabela new_curriculo.

  Como usar:
  1. Abra o Model-driven App no ambiente correto.
  2. Pressione F12 > Console.
  3. Cole este arquivo inteiro.
  4. Confirme a execução.

  Regra:
  - Se já existir currículo com o mesmo new_nomecompleto, atualiza.
  - Se não existir, cria.
*/
(async function importarRankingMotoristasCurriculos() {
  "use strict";

  const CONFIG = {
    tableLogicalName: "new_curriculo",
    updateExisting: true,
    fields: {
      id: "new_curriculoid",
      nomeCompleto: "new_nomecompleto",
      cidade: "new_cidade",
      estado: "new_estado",
      cargoInteresse: "new_cargointeresse",
      experiencia: "new_experiencia",
      nota: "new_nota",
      indicadoPor: "new_indicadopor",
      categoriaCnh: "new_categoriacnh",
      origemCurriculo: "new_origemcurriculo",
      statusCurriculo: "new_statuscurriculo",
      observacoes: "new_observacoes"
    },
    options: {
      categoriaCnh: {
        A: 100000000,
        B: 100000001,
        C: 100000002,
        D: 100000003,
        E: 100000004,
        AB: 100000005,
        ACC: 100000006,
        naoInformado: 100000007
      },
      origemCurriculo: {
        outro: 100000006
      },
      statusCurriculo: {
        novo: 100000000,
        emAnalise: 100000001,
        aprovadoParaBanco: 100000002,
        reprovado: 100000003
      }
    }
  };

  const CANDIDATOS = [
    {
      ranking: 1,
      candidato: "Horácio Ramos Pereira Neto",
      cidade: "São José dos Campos",
      cnh: "A/D",
      experiencia: "Motorista executivo autônomo desde 02/2017; Top Vale 2015-2017; Navarro 2011-2015; AC Affonso 2011.",
      pontosFortes: "Experiência direta e contínua como motorista executivo; boa proximidade; cursos escolar/coletivo.",
      pontosAtencao: "Validar CNH ativa, disponibilidade e referências; OCR de imagem pode conter falhas.",
      nota: 9.4,
      recomendacao: "Avançar",
      justificativa: "Perfil mais aderente: histórico longo, direto e específico em transporte executivo."
    },
    {
      ranking: 2,
      candidato: "Márcio Quadra Barbosa",
      cidade: "São José dos Campos",
      cnh: "A/D",
      experiencia: "Motorista executivo autônomo para Johnson & Johnson/alta diretoria; Betinho’s 2009-2012; Osses e Santos 2015; experiência com blindados, alto padrão e aeroportos.",
      pontosFortes: "Experiência exatamente no padrão executivo; já conhece Betinho’s; boa comunicação e sistemas.",
      pontosAtencao: "Última função informada parece ser vendas/autos; validar se quer voltar para rotina de motorista.",
      nota: 9.1,
      recomendacao: "Avançar",
      justificativa: "Muito aderente ao padrão da empresa e ao atendimento de cliente executivo."
    },
    {
      ranking: 3,
      candidato: "Marcos Aurélio Rodrigues",
      cidade: "Pindamonhangaba",
      cnh: "Não informado",
      experiencia: "Segurança e motorista; transporte de civis/autoridades; Petrobras 2010-2011; motorista autônomo; chefe de segurança municipal.",
      pontosFortes: "Forte perfil de segurança, rotas, discrição, relatórios e atendimento de horários; referências profissionais.",
      pontosAtencao: "Mora em Pinda; validar CNH/categoria, disponibilidade e atualização do currículo.",
      nota: 8.8,
      recomendacao: "Avançar",
      justificativa: "Excelente para cliente executivo que exige discrição, segurança e postura."
    },
    {
      ranking: 4,
      candidato: "Francisco Eracio de Souza",
      cidade: "Pindamonhangaba",
      cnh: "A/D",
      experiencia: "Clarear Transporte e Turismo 2013-2018 como motorista de carro de passeio; Tursan 2002-2008 motorista executivo; outros cargos de motorista.",
      pontosFortes: "Experiência longa e estável em transporte/turismo; bom histórico de motorista.",
      pontosAtencao: "Currículo em imagem/OCR; validar experiência atual e apresentação pessoal.",
      nota: 8.5,
      recomendacao: "Avançar",
      justificativa: "Boa aderência operacional e histórico consistente no setor."
    },
    {
      ranking: 5,
      candidato: "Ronaldo de Lima Ribeiro",
      cidade: "São José dos Campos",
      cnh: "A/D EAR",
      experiencia: "Motorista particular executivo desde 11/2018; Uber 2015-2017; autônomo 2008-2015; motorista particular registrado 2007-2008.",
      pontosFortes: "Experiência forte com particular/executivo, aeroportos e rotinas pessoais; bom para cliente fixo.",
      pontosAtencao: "Validar referências do executivo atual e disponibilidade para escala/empresa.",
      nota: 8.4,
      recomendacao: "Avançar",
      justificativa: "Perfil muito alinhado a transporte executivo e atendimento personalizado."
    },
    {
      ranking: 6,
      candidato: "Jair Bastos Pimenta",
      cidade: "São José dos Campos",
      cnh: "D",
      experiencia: "Motorista de entrega, motorista executivo, kombi, caminhão, vans e carros executivos; VanVale; cursos MOPP, primeiros socorros, coletivo, escolar e defensiva.",
      pontosFortes: "Muito completo em direção, vans e carros executivos; cursos relevantes.",
      pontosAtencao: "Histórico amplo, mas precisa validar recência e postura para cliente executivo.",
      nota: 8.3,
      recomendacao: "Avançar",
      justificativa: "Boa opção técnica, especialmente se a operação usa vans e carros executivos."
    },
    {
      ranking: 7,
      candidato: "Fábio Miranda da Silva",
      cidade: "Não informado / provável Jacareí",
      cnh: "D",
      experiencia: "Motorista/programador; experiência descrita com transporte de executivos, passageiros, vans Sprinter/Transit/Jumper/Ducato/Master, checklist, tacógrafo e prestação de contas.",
      pontosFortes: "Boa visão operacional, planilha/Excel, liderança e cuidado com veículo.",
      pontosAtencao: "Cidade não apareceu claramente no OCR; validar localização, períodos e empregadores.",
      nota: 8.2,
      recomendacao: "Avançar",
      justificativa: "Perfil operacional forte e bem próximo das exigências da vaga."
    },
    {
      ranking: 8,
      candidato: "Marcelo Vieira Abrantes",
      cidade: "São Paulo",
      cnh: "Não informado",
      experiencia: "Motorista executivo bilíngue na NAS Transportes Executivo 2017-2018 e Shift 2016-2017; inglês/espanhol; mecânica e hotelaria.",
      pontosFortes: "Bilíngue, experiência com executivo e boa apresentação; diferencial para estrangeiros.",
      pontosAtencao: "Mora em São Paulo; validar distância, CNH/categoria e disponibilidade para Vale do Paraíba.",
      nota: 8,
      recomendacao: "Avançar com cautela",
      justificativa: "Muito bom perfil, mas localização pode pesar."
    },
    {
      ranking: 9,
      candidato: "Edmilson Antonio dos Santos",
      cidade: "Pindamonhangaba",
      cnh: "A/D",
      experiencia: "Edvans Transportes: transporte de passageiros/fretamentos/executivo; Tursan: motorista executivo; experiência mecânica.",
      pontosFortes: "Boa aderência a transporte executivo/fretamento; conhecimento mecânico ajuda no zelo do veículo.",
      pontosAtencao: "Validar estabilidade, período atual e comunicação na entrevista.",
      nota: 7.9,
      recomendacao: "Avançar",
      justificativa: "Boa opção para triagem inicial."
    },
    {
      ranking: 10,
      candidato: "Ednilson Mendes",
      cidade: "São José dos Campos",
      cnh: "D",
      experiencia: "Motorista na Betinho’s 2014-2015; transporte e locação 2010-2013; motorista de carga 2015-2016; cursos MOPP, escolar, emergência e coletivo.",
      pontosFortes: "Já trabalhou na empresa/setor; cursos relevantes e boa proximidade.",
      pontosAtencao: "Experiências informadas são antigas; validar últimos anos profissionais.",
      nota: 7.8,
      recomendacao: "Avançar",
      justificativa: "Aderente, principalmente por histórico em transporte/locação e Betinho’s."
    },
    {
      ranking: 11,
      candidato: "Wendell Honório Pinto",
      cidade: "Pindamonhangaba",
      cnh: "A/D",
      experiencia: "Clarear Transportes e Turismo: motorista executivo 2013-2015; Locaralpha: agente de serviços/motoristas 2007-2012; instrutor prático.",
      pontosFortes: "Experiência em executivo, gestão de motoristas e direção defensiva/coletivo.",
      pontosAtencao: "Currículo antigo; validar atuação recente e disponibilidade.",
      nota: 7.7,
      recomendacao: "Avançar",
      justificativa: "Bom histórico no setor, com sinal de responsabilidade operacional."
    },
    {
      ranking: 12,
      candidato: "Jorge Luis Possar",
      cidade: "Pindamonhangaba",
      cnh: "D",
      experiencia: "Motorista VIP; motorista para Família Diniz; motorista para família de ministro; segurança pessoal/escolta; cursos de crise, primeiros socorros e segurança VIP.",
      pontosFortes: "Perfil premium/VIP, segurança e discrição; comunicação e responsabilidade declaradas.",
      pontosAtencao: "Experiências parecem antigas e sem datas recentes; validar atualização e fit cultural.",
      nota: 7.6,
      recomendacao: "Avançar com cautela",
      justificativa: "Pode ser bom para cliente VIP, desde que esteja atualizado e disponível."
    },
    {
      ranking: 13,
      candidato: "Waldomiro Nazareno Ribeiro Ramos",
      cidade: "São José dos Campos",
      cnh: "A/B",
      experiencia: "Motorista de transporte executivo desde 11/2013, atendendo Embraer e LG; também forte perfil administrativo/financeiro; inglês intermediário.",
      pontosFortes: "Experiência direta com empresas grandes; boa comunicação e sistemas.",
      pontosAtencao: "CNH apenas A/B no currículo; validar se atende categoria exigida e disponibilidade.",
      nota: 7.6,
      recomendacao: "Avançar com cautela",
      justificativa: "Bom perfil para carro executivo leve; depende da categoria CNH necessária."
    },
    {
      ranking: 14,
      candidato: "Osvaldo Bastos Junior",
      cidade: "Pindamonhangaba",
      cnh: "D",
      experiencia: "Pindatur 2016-2017; motorista socorrista em Confab/Tomé; Unimed 2005-2011; Tursan 2003-2004.",
      pontosFortes: "Histórico estável como motorista, incluindo socorrista e turismo; CNH D/EAR mencionado.",
      pontosAtencao: "Menos evidência de cliente executivo; validar comunicação e padrão de atendimento.",
      nota: 7.4,
      recomendacao: "Deixar em espera",
      justificativa: "Bom motorista, mas abaixo dos perfis mais executivos."
    },
    {
      ranking: 15,
      candidato: "Júlio Cesar Martins de Oliveira",
      cidade: "São José dos Campos",
      cnh: "D",
      experiencia: "Motorista em Lourival Transportes, Tensvip Rent a Car e Fretavale/Fretamento e Turismo entre 2003 e 2017.",
      pontosFortes: "Experiência consistente em transporte/fretamento; cidade próxima.",
      pontosAtencao: "Histórico antigo; precisa validar situação atual, referências e disponibilidade.",
      nota: 7.3,
      recomendacao: "Deixar em espera",
      justificativa: "Boa base técnica, mas falta atualização."
    },
    {
      ranking: 16,
      candidato: "Levi Valentim da Silva",
      cidade: "São José dos Campos",
      cnh: "Não informado",
      experiencia: "Crispim Transportes: motorista executivo 2018-2019; outros cargos de motorista/caminhão em períodos antigos; cursos MOPP e coletivo.",
      pontosFortes: "Tem passagem em transporte executivo e cursos; mora perto.",
      pontosAtencao: "Pouca estabilidade recente no executivo e escolaridade básica; validar comunicação.",
      nota: 7,
      recomendacao: "Deixar em espera",
      justificativa: "Pode ser considerado se os primeiros colocados não avançarem."
    },
    {
      ranking: 17,
      candidato: "Alison Aparecido de Sá",
      cidade: "São José dos Campos",
      cnh: "D",
      experiencia: "Motorista de ambulância/condutor socorrista; autônomo com caminhão e veículo executivo; curso APH.",
      pontosFortes: "Boa responsabilidade por atuar em emergência; alguma experiência com veículo executivo.",
      pontosAtencao: "Menos histórico comprovado em cliente executivo; OCR com cidade pouco clara.",
      nota: 7,
      recomendacao: "Deixar em espera",
      justificativa: "Interessante pela responsabilidade, mas precisa confirmar experiência executiva."
    },
    {
      ranking: 18,
      candidato: "Fabio Luis Varoli",
      cidade: "Pindamonhangaba",
      cnh: "Não informado",
      experiencia: "Motorista de aplicativo e particular desde 10/2016; viagens a SP, RJ, litoral e Sul de Minas; experiência comercial e atendimento.",
      pontosFortes: "Boa comunicação, atendimento, rotas e perfil de cliente.",
      pontosAtencao: "Falta experiência corporativa/executiva formal e CNH não apareceu claramente.",
      nota: 6.9,
      recomendacao: "Deixar em espera",
      justificativa: "Bom potencial de atendimento, mas menos específico para executivo corporativo."
    },
    {
      ranking: 19,
      candidato: "Dennys Dorado",
      cidade: "São Paulo",
      cnh: "A/B EAR",
      experiencia: "Atendimento receptivo de executivos estrangeiros; objetivo motorista executivo bilíngue; chefe de operações e gerente de produto; espanhol nativo, português/inglês avançado.",
      pontosFortes: "Excelente comunicação, idiomas e experiência com executivos estrangeiros.",
      pontosAtencao: "CNH A/B, pouca experiência direta como motorista; mora em São Paulo.",
      nota: 6.9,
      recomendacao: "Deixar em espera",
      justificativa: "Interessante para cliente estrangeiro, mas não é prioridade se a vaga exigir experiência prática de motorista."
    },
    {
      ranking: 20,
      candidato: "Daniel Fernandes de Oliveira",
      cidade: "Não informado / provável Taubaté",
      cnh: "D",
      experiencia: "Motorista em Prefeitura de Taubaté e Superintendência de Controle de Endemias; manobrista na Coca-Cola; cursos coletivo e escolar.",
      pontosFortes: "Experiência pública como motorista e cursos relevantes.",
      pontosAtencao: "Cidade não informada claramente; pouca evidência de executivo/cliente premium.",
      nota: 6.8,
      recomendacao: "Deixar em espera",
      justificativa: "Bom motorista operacional, mas precisa validar aderência ao executivo."
    },
    {
      ranking: 21,
      candidato: "Josmar Alberto Correa",
      cidade: "Pindamonhangaba",
      cnh: "D",
      experiencia: "Objetivo como motorista executivo, emergencial, vans, entregas/coletas e comprador; Confab com vans e veículos de entrega/coleta.",
      pontosFortes: "Tem direção de van e transporte; curso coletivo.",
      pontosAtencao: "Currículo simples, pouco período/detalhe e pouca evidência de cliente executivo.",
      nota: 6.7,
      recomendacao: "Deixar em espera",
      justificativa: "Pode servir para operação, mas não é prioridade."
    },
    {
      ranking: 22,
      candidato: "Mohamed Lutfi Majzoub",
      cidade: "Taubaté",
      cnh: "D",
      experiencia: "Muitos cargos como motorista truck/entregador/receptivo; cursos Petrobras: off-road, direção legal e defensiva; transporte coletivo.",
      pontosFortes: "Muita experiência de direção e cursos fortes.",
      pontosAtencao: "Foco mais logístico/carga do que executivo; mora em Taubaté.",
      nota: 6.7,
      recomendacao: "Deixar em espera",
      justificativa: "Boa base de motorista, mas menor fit com cliente executivo."
    },
    {
      ranking: 23,
      candidato: "José Carlos Rosa",
      cidade: "São José dos Campos",
      cnh: "D profissional",
      experiencia: "Motorista de produtos perecíveis, coletivo e caminhão; técnico instalador de rastreadores; curso de transporte coletivo.",
      pontosFortes: "Boa vivência com veículos e rastreadores; mora perto.",
      pontosAtencao: "Pouca evidência de transporte executivo ou cliente exigente.",
      nota: 6.6,
      recomendacao: "Deixar em espera",
      justificativa: "Perfil operacional, não prioritário para executivo."
    },
    {
      ranking: 24,
      candidato: "Gislene Lopes da Silva",
      cidade: "São José dos Campos",
      cnh: "B",
      experiencia: "Motorista com experiência em pessoas/cargas; gerente de loja; qualidade em atendimento ao cliente.",
      pontosFortes: "Boa comunicação e atendimento; disponibilidade para viagens.",
      pontosAtencao: "CNH B pode limitar; falta experiência em executivo e categoria D se exigida.",
      nota: 6.4,
      recomendacao: "Deixar em espera",
      justificativa: "Boa postura provável, mas precisa validar CNH e experiência específica."
    },
    {
      ranking: 25,
      candidato: "Leonardo de Oliveira Santiago",
      cidade: "São José dos Campos",
      cnh: "A/D",
      experiencia: "Diversas experiências como motorista; curso de transporte coletivo de passageiros.",
      pontosFortes: "CNH A/D, mora perto, experiência em direção.",
      pontosAtencao: "Currículo com pouco detalhe de empresas/períodos e pouca evidência de executivo.",
      nota: 6.4,
      recomendacao: "Deixar em espera",
      justificativa: "Pode ser backup, mas precisa entrevista para entender histórico."
    },
    {
      ranking: 26,
      candidato: "Manoel Alves de Sousa",
      cidade: "São José dos Campos",
      cnh: "D",
      experiencia: "Motorista de aplicativo; translados aeroporto/obra e transporte de colaboradores em empresas; perfil de liderança declarado.",
      pontosFortes: "Experiência com passageiros e translados; proximidade.",
      pontosAtencao: "Menos executivo corporativo; validar atualização, disponibilidade e padrão de atendimento.",
      nota: 6.3,
      recomendacao: "Deixar em espera",
      justificativa: "Base razoável, mas atrás dos perfis com executivo comprovado."
    },
    {
      ranking: 27,
      candidato: "Robson Pesséa Rabello",
      cidade: "Pindamonhangaba",
      cnh: "D",
      experiencia: "Motorista profissional; motorista de teste VW; manobrista; cursos escolar/coletivo; boa comunicação declarada.",
      pontosFortes: "Boa comunicação, empatia e cursos; experiência com veículos.",
      pontosAtencao: "Pouca experiência executiva; histórico mais técnico/manobra/teste.",
      nota: 6.2,
      recomendacao: "Deixar em espera",
      justificativa: "Pode ser analisado como backup."
    },
    {
      ranking: 28,
      candidato: "Volmir Follmann",
      cidade: "São José dos Campos",
      cnh: "D",
      experiencia: "Experiência principal em produção/comércio; cita motorista de executivos como autônomo por 2 anos.",
      pontosFortes: "Mora perto, CNH D e alguma experiência com executivos.",
      pontosAtencao: "Maior parte da carreira não é como motorista; falta detalhe sobre clientes/períodos.",
      nota: 5.8,
      recomendacao: "Deixar em espera",
      justificativa: "Potencial, mas não é prioridade."
    },
    {
      ranking: 29,
      candidato: "Michel/ Michael Marcelo de Almeida Vieira",
      cidade: "São José dos Campos",
      cnh: "A/D",
      experiencia: "Motorista no Grupo Marbor; motorista executivo na RVF Transportes Executivos; também gerente/corretor/admin.",
      pontosFortes: "Tem passagem como motorista executivo e curso defensiva/evasiva/coletivo.",
      pontosAtencao: "Currículo com pouca informação de períodos e trajetória mista.",
      nota: 5.8,
      recomendacao: "Deixar em espera",
      justificativa: "Precisa entrevista para confirmar consistência."
    },
    {
      ranking: 30,
      candidato: "Luiz Fernando Wolms",
      cidade: "São José dos Campos",
      cnh: "A/E",
      experiencia: "Motorista na Ladyanna Transportes; motorista de viatura de emergência nos Bombeiros; autônomo como motorista/segurança.",
      pontosFortes: "Boa responsabilidade e direção em emergência; CNH forte.",
      pontosAtencao: "Pouca evidência de atendimento executivo e currículo antigo/curto.",
      nota: 5.8,
      recomendacao: "Deixar em espera",
      justificativa: "Bom motorista, mas menor aderência ao executivo."
    },
    {
      ranking: 31,
      candidato: "Marcos Vinicius Cardoso Menecucci",
      cidade: "Jacareí",
      cnh: "Não informado",
      experiencia: "Manobrista em estacionamentos e motorista em Osses Santos e Santos.",
      pontosFortes: "Experiência básica com veículos; cidade relativamente próxima.",
      pontosAtencao: "Pouco detalhe, sem cliente executivo e sem CNH clara.",
      nota: 5.5,
      recomendacao: "Deixar em espera",
      justificativa: "Só avançaria se faltarem candidatos."
    },
    {
      ranking: 32,
      candidato: "Clerivelton Tomaz da Silva",
      cidade: "São José dos Campos",
      cnh: "D",
      experiencia: "Vários cargos de motorista, vendas, teleoperador e logística; formação em logística.",
      pontosFortes: "CNH D, boa base comercial/logística e mora perto.",
      pontosAtencao: "Muitas mudanças/funções; falta evidência de transporte executivo.",
      nota: 5.5,
      recomendacao: "Deixar em espera",
      justificativa: "Perfil misto; precisa validar foco e estabilidade."
    },
    {
      ranking: 33,
      candidato: "Elias Barbosa de Oliveira",
      cidade: "Pindamonhangaba",
      cnh: "Não informado",
      experiencia: "Ajudante e motorista executivo em JV Topografia/Transportes 2009-2010; objetivo genérico.",
      pontosFortes: "Alguma experiência como motorista executivo.",
      pontosAtencao: "Experiência antiga, pouco detalhada e CNH não apareceu.",
      nota: 5.4,
      recomendacao: "Descartar",
      justificativa: "Baixa prioridade frente a candidatos com histórico mais robusto."
    },
    {
      ranking: 34,
      candidato: "Josimar Aparecido da Silva",
      cidade: "São José dos Campos",
      cnh: "A/D",
      experiencia: "Motorista categoria D por curto período; forte histórico como armador/encarregado de armação.",
      pontosFortes: "CNH A/D e alguma experiência com caminhão.",
      pontosAtencao: "Pouca experiência como motorista e nenhuma evidência de executivo.",
      nota: 5.2,
      recomendacao: "Descartar",
      justificativa: "Não parece aderente ao perfil executivo neste momento."
    },
    {
      ranking: 35,
      candidato: "Juliano Cardoso da Silva",
      cidade: "Pindamonhangaba",
      cnh: "A/B",
      experiencia: "Perfil técnico/administrativo; CNH A/B habilitado para transporte de pessoas; contratos, suporte e atendimento.",
      pontosFortes: "Boa comunicação e formação técnica.",
      pontosAtencao: "Não tem experiência relevante como motorista executivo.",
      nota: 5,
      recomendacao: "Descartar",
      justificativa: "Mais aderente a área administrativa/técnica do que motorista."
    },
    {
      ranking: 36,
      candidato: "Nivaldo Machado de Freitas",
      cidade: "São José dos Campos",
      cnh: "Não informado",
      experiencia: "Motorista de aplicativo Uber/99 desde 2017; caminhão 2012-2015; supervisor operacional/vendas.",
      pontosFortes: "Atendimento ao cliente e experiência autônoma como motorista.",
      pontosAtencao: "Não traz CNH clara nem experiência executiva corporativa.",
      nota: 5,
      recomendacao: "Descartar",
      justificativa: "Pode dirigir, mas não se destaca para o padrão executivo."
    },
    {
      ranking: 37,
      candidato: "Maurício Fernandes Feijo",
      cidade: "Pindamonhangaba",
      cnh: "Não informado",
      experiencia: "Assistente administrativo, vendedor, gerente, assistente executivo; experiência internacional.",
      pontosFortes: "Boa comunicação e experiência administrativa.",
      pontosAtencao: "Não há experiência como motorista no currículo.",
      nota: 4.5,
      recomendacao: "Descartar",
      justificativa: "Perfil não aderente à vaga de motorista."
    },
    {
      ranking: 38,
      candidato: "Ronaldo Felix da Silva",
      cidade: "Não informado",
      cnh: "Não informado",
      experiencia: "Arquivo .msg não trouxe currículo legível; só apareceram metadados/e-mails.",
      pontosFortes: "Não foi possível avaliar.",
      pontosAtencao: "Falta o currículo em PDF/Word/imagem legível.",
      nota: 0,
      recomendacao: "Descartar temporariamente",
      justificativa: "Reenviar currículo legível para análise."
    }
  ];

  console.clear();
  console.log(`[Currículos] Importação iniciada. Registros no XLSX: ${CANDIDATOS.length}.`);

  const xrm = getXrm();
  if (!xrm || !xrm.WebApi || !xrm.Utility) {
    throw new Error("Xrm não encontrado. Execute dentro de um Model-driven App carregado.");
  }

  if (CANDIDATOS.length !== 38) {
    throw new Error(`Carga incompleta. Esperado: 38. Atual: ${CANDIDATOS.length}.`);
  }

  const confirmed = window.confirm(
    `Importar ${CANDIDATOS.length} currículos do ranking para new_curriculo?\n\n` +
      "Registros existentes com o mesmo nome serão atualizados."
  );

  if (!confirmed) {
    console.warn("[Currículos] Importação cancelada.");
    return;
  }

  const result = {
    created: 0,
    updated: 0,
    failed: 0,
    failures: []
  };

  for (const candidato of CANDIDATOS) {
    try {
      const payload = buildPayload(candidato);
      const existing = await findByName(xrm, candidato.candidato);

      if (existing && CONFIG.updateExisting) {
        await xrm.WebApi.updateRecord(CONFIG.tableLogicalName, existing[CONFIG.fields.id], payload);
        result.updated += 1;
        console.log(`[Atualizado] #${candidato.ranking} ${candidato.candidato}`);
      } else if (existing) {
        console.log(`[Ignorado] #${candidato.ranking} ${candidato.candidato}`);
      } else {
        await xrm.WebApi.createRecord(CONFIG.tableLogicalName, payload);
        result.created += 1;
        console.log(`[Criado] #${candidato.ranking} ${candidato.candidato}`);
      }
    } catch (error) {
      result.failed += 1;
      result.failures.push({
        ranking: candidato.ranking,
        candidato: candidato.candidato,
        error: error.message || String(error)
      });
      console.error(`[Falhou] #${candidato.ranking} ${candidato.candidato}`, error);
    }
  }

  console.table({
    criados: result.created,
    atualizados: result.updated,
    falhas: result.failed
  });

  if (result.failures.length) {
    console.table(result.failures);
    throw new Error(`[Currículos] Importação terminou com ${result.failed} falha(s). Veja console.table acima.`);
  }

  console.log("[Currículos] Importação finalizada sem falhas.");

  function buildPayload(row) {
    const f = CONFIG.fields;
    const payload = {
      [f.nomeCompleto]: clean(row.candidato),
      [f.cidade]: clean(row.cidade),
      [f.estado]: inferState(row.cidade),
      [f.cargoInteresse]: "Motorista executivo",
      [f.experiencia]: clean(row.experiencia),
      [f.nota]: toIntegerScore(row.nota),
      [f.indicadoPor]: "Ranking motoristas currículos XLSX",
      [f.categoriaCnh]: mapCnh(row.cnh),
      [f.origemCurriculo]: CONFIG.options.origemCurriculo.outro,
      [f.statusCurriculo]: mapStatus(row.recomendacao),
      [f.observacoes]: buildObservacoes(row)
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    return payload;
  }

  function buildObservacoes(row) {
    return [
      `Fonte: ranking_motoristas_curriculos.xlsx`,
      `Ranking: ${row.ranking}`,
      `Nota original do XLSX: ${row.nota}`,
      `Recomendação: ${row.recomendacao}`,
      `CNH informada no XLSX: ${row.cnh}`,
      `Pontos fortes: ${row.pontosFortes}`,
      `Pontos de atenção: ${row.pontosAtencao}`,
      `Justificativa: ${row.justificativa}`,
      "Observação: análise feita com base em currículos extraídos do ZIP; validar CNH ativa, disponibilidade, referências e situação atual."
    ].join("\n");
  }

  async function findByName(xrmApi, name) {
    const escaped = String(name).replace(/'/g, "''");
    const query = `?$select=${CONFIG.fields.id},${CONFIG.fields.nomeCompleto}&$filter=${CONFIG.fields.nomeCompleto} eq '${escaped}'&$top=1`;
    const response = await xrmApi.WebApi.retrieveMultipleRecords(CONFIG.tableLogicalName, query);
    return response.entities && response.entities.length ? response.entities[0] : null;
  }

  function mapStatus(recomendacao) {
    const normalized = normalize(recomendacao);
    if (normalized === "avancar") return CONFIG.options.statusCurriculo.aprovadoParaBanco;
    if (normalized.includes("descartar")) return CONFIG.options.statusCurriculo.reprovado;
    return CONFIG.options.statusCurriculo.emAnalise;
  }

  function mapCnh(cnh) {
    const normalized = normalize(cnh);
    const options = CONFIG.options.categoriaCnh;
    if (!normalized || normalized.includes("nao informado")) return options.naoInformado;
    if (normalized.includes("acc")) return options.ACC;
    if (normalized.includes("e")) return options.E;
    if (normalized.includes("d")) return options.D;
    if (normalized.includes("c")) return options.C;
    if (normalized.includes("a") && normalized.includes("b")) return options.AB;
    if (normalized.includes("b")) return options.B;
    if (normalized.includes("a")) return options.A;
    return options.naoInformado;
  }

  function inferState(cidade) {
    const normalized = normalize(cidade);
    if (!normalized || normalized === "nao informado") return "";
    return "SP";
  }

  function toIntegerScore(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    return Math.round(number);
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function normalize(value) {
    return clean(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function getXrm() {
    if (window.Xrm) return window.Xrm;

    try {
      if (window.parent && window.parent.Xrm) return window.parent.Xrm;
    } catch (error) {
      console.warn("[Currículos] Não foi possível ler window.parent.Xrm.", error);
    }

    try {
      if (window.top && window.top.Xrm) return window.top.Xrm;
    } catch (error) {
      console.warn("[Currículos] Não foi possível ler window.top.Xrm.", error);
    }

    return null;
  }
})();

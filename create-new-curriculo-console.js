/*
  Console Dataverse / Model-driven App
  Cria a tabela new_curriculo e seus campos.

  Como usar:
  1. Abra o Model-driven App no ambiente correto.
  2. Pressione F12 > Console.
  3. Cole este arquivo inteiro.
  4. Confirme a execução.

  Requisito: usuário com permissão de customização do Dataverse.
*/
(async function criarTabelaCurriculos() {
  "use strict";

  console.clear();
  console.log("[Currículos] Script iniciado. Se parou aqui, o problema é acesso ao Xrm ou permissão do ambiente.");

  const CONFIG = {
    languageCode: 1046,
    tableLogicalName: "new_curriculo",
    tableSchemaName: "new_Curriculo",
    tableDisplayName: "Currículo",
    tableCollectionName: "Currículos",
    primaryNameLogicalName: "new_nomecompleto",
    primaryNameSchemaName: "new_NomeCompleto",
    primaryNameDisplayName: "Nome completo",
    prefix: "new",
    publishAtEnd: true
  };

  const OPTION_VALUES = {
    status: {
      Novo: 100000000,
      "Em análise": 100000001,
      "Aprovado para banco": 100000002,
      Reprovado: 100000003,
      Contratado: 100000004
    },
    origem: {
      Indicação: 100000000,
      WhatsApp: 100000001,
      Site: 100000002,
      LinkedIn: 100000003,
      Instagram: 100000004,
      Presencial: 100000005,
      Outro: 100000006
    },
    disponibilidade: {
      Imediata: 100000000,
      "Até 7 dias": 100000001,
      "Até 15 dias": 100000002,
      "Até 30 dias": 100000003,
      "A combinar": 100000004
    },
    cnh: {
      A: 100000000,
      B: 100000001,
      C: 100000002,
      D: 100000003,
      E: 100000004,
      AB: 100000005,
      ACC: 100000006,
      "Não informado": 100000007
    }
  };

  const fields = [
    stringField("new_cpf", "new_CPF", "CPF", 14),
    stringField("new_email", "new_Email", "E-mail", 150, "Email"),
    stringField("new_telefone", "new_Telefone", "Telefone", 30, "Phone"),
    stringField("new_whatsapp", "new_WhatsApp", "WhatsApp", 30, "Phone"),
    stringField("new_cidade", "new_Cidade", "Cidade", 100),
    stringField("new_estado", "new_Estado", "Estado", 2),
    stringField("new_cargointeresse", "new_CargoInteresse", "Cargo de interesse", 120),
    memoField("new_experiencia", "new_Experiencia", "Experiência", 4000),
    stringField("new_ultimocargo", "new_UltimoCargo", "Último cargo", 120),
    stringField("new_ultimaempresa", "new_UltimaEmpresa", "Última empresa", 150),
    moneyField("new_pretensaosalarial", "new_PretensaoSalarial", "Pretensão salarial"),
    picklistField("new_disponibilidade", "new_Disponibilidade", "Disponibilidade", OPTION_VALUES.disponibilidade),
    picklistField("new_categoriacnh", "new_CategoriaCNH", "Categoria CNH", OPTION_VALUES.cnh),
    booleanField("new_temexperienciaexecutivo", "new_TemExperienciaExecutivo", "Tem experiência com executivo"),
    booleanField("new_temcursomopp", "new_TemCursoMOPP", "Tem curso MOPP"),
    picklistField("new_origemcurriculo", "new_OrigemCurriculo", "Origem do currículo", OPTION_VALUES.origem),
    picklistField("new_statuscurriculo", "new_StatusCurriculo", "Status do currículo", OPTION_VALUES.status),
    stringField("new_linkcurriculo", "new_LinkCurriculo", "Link do currículo", 500, "Url"),
    memoField("new_observacoes", "new_Observacoes", "Observações", 4000),
    booleanField("new_consentimentolgpd", "new_ConsentimentoLGPD", "Consentimento LGPD"),
    dateTimeField("new_dataconsentimento", "new_DataConsentimento", "Data do consentimento")
  ];

  const APP_XRM = getXrm();

  if (!APP_XRM || !APP_XRM.Utility || !APP_XRM.WebApi) {
    throw new Error("Xrm não encontrado. Execute dentro de um Model-driven App carregado. Se estiver no Maker Portal, abra o app publicado e tente de novo.");
  }

  const confirmed = window.confirm(
    "Criar tabela Dataverse 'new_curriculo' e campos de currículos neste ambiente?"
  );

  if (!confirmed) {
    console.warn("[Currículos] Execução cancelada pelo usuário.");
    return;
  }

  const clientUrl = APP_XRM.Utility.getGlobalContext().getClientUrl();
  const apiBase = `${clientUrl}/api/data/v9.2`;

  console.group("[Currículos] Provisionamento Dataverse");
  console.log("Ambiente:", clientUrl);
  console.log("Tabela:", CONFIG.tableLogicalName);

  try {
    const tableExistsAlready = await tableExists();

    if (tableExistsAlready) {
      console.log("Tabela já existe. Campos ausentes serão criados.");
    } else {
      await createTable();
      await waitForTable();
    }

    for (const field of fields) {
      await ensureField(field);
    }

    if (CONFIG.publishAtEnd) {
      await publishAll();
    }

    console.log("Concluído.");
    console.log("Próximo passo: abra make.powerapps.com > Tabelas > Currículos e adicione a tabela ao app/sitemap.");
  } catch (error) {
    console.error("Falhou.", normalizeError(error));
    throw error;
  } finally {
    console.groupEnd();
  }

  async function tableExists() {
    const response = await http("GET", `/EntityDefinitions(LogicalName='${CONFIG.tableLogicalName}')?$select=LogicalName`);
    if (response.status === 404) return false;
    if (!response.ok) throw await responseError(response, "Erro ao verificar tabela");
    return true;
  }

  async function createTable() {
    console.log("Criando tabela...");

    const entityMetadata = {
      "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
      SchemaName: CONFIG.tableSchemaName,
      DisplayName: label(CONFIG.tableDisplayName),
      DisplayCollectionName: label(CONFIG.tableCollectionName),
      Description: label("Cadastro simples de currículos e candidatos."),
      OwnershipType: "UserOwned",
      IsActivity: false,
      HasActivities: false,
      HasNotes: false,
      Attributes: [
        {
          "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
          SchemaName: CONFIG.primaryNameSchemaName,
          DisplayName: label(CONFIG.primaryNameDisplayName),
          Description: label("Nome completo do candidato."),
          RequiredLevel: requiredLevel("ApplicationRequired"),
          MaxLength: 200,
          FormatName: { Value: "Text" },
          IsPrimaryName: true
        }
      ]
    };

    const response = await http("POST", "/EntityDefinitions", entityMetadata);
    if (!response.ok) throw await responseError(response, "Erro ao criar tabela");

    console.log("Tabela criada.");
  }

  async function waitForTable() {
    console.log("Aguardando tabela ficar disponível...");

    for (let attempt = 1; attempt <= 20; attempt += 1) {
      if (await tableExists()) {
        console.log("Tabela disponível.");
        return;
      }

      await delay(3000);
    }

    throw new Error("Tabela criada, mas não ficou disponível a tempo. Aguarde alguns minutos e rode o script novamente.");
  }

  async function ensureField(field) {
    const exists = await attributeExists(field.logicalName);

    if (exists) {
      console.log(`Campo já existe: ${field.logicalName}`);
      return;
    }

    console.log(`Criando campo: ${field.logicalName}`);

    const response = await http(
      "POST",
      `/EntityDefinitions(LogicalName='${CONFIG.tableLogicalName}')/Attributes`,
      field.metadata
    );

    if (!response.ok) throw await responseError(response, `Erro ao criar campo ${field.logicalName}`);
  }

  async function attributeExists(logicalName) {
    const response = await http(
      "GET",
      `/EntityDefinitions(LogicalName='${CONFIG.tableLogicalName}')/Attributes(LogicalName='${logicalName}')?$select=LogicalName`
    );

    if (response.status === 404) return false;
    if (!response.ok) throw await responseError(response, `Erro ao verificar campo ${logicalName}`);
    return true;
  }

  async function publishAll() {
    console.log("Publicando customizações...");

    const request = {
      getMetadata: function getMetadata() {
        return {
          boundParameter: null,
          operationType: 0,
          operationName: "PublishAllXml",
          parameterTypes: {}
        };
      }
    };

    const response = await APP_XRM.WebApi.online.execute(request);

    if (!response.ok) {
      throw new Error(`Erro ao publicar customizações. HTTP ${response.status}.`);
    }

    console.log("Customizações publicadas.");
  }

  async function http(method, path, body) {
    const headers = {
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0"
    };

    const init = { method, headers };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json; charset=utf-8";
      init.body = JSON.stringify(body);
    }

    return fetch(`${apiBase}${path}`, init);
  }

  async function responseError(response, fallbackMessage) {
    const text = await response.text();
    let message = text;

    try {
      const parsed = JSON.parse(text);
      message = parsed.error && parsed.error.message ? parsed.error.message : text;
    } catch (_) {
      message = text;
    }

    return new Error(`${fallbackMessage}. HTTP ${response.status}. ${message}`);
  }

  function normalizeError(error) {
    if (!error) return "Erro desconhecido.";
    return error.message || String(error);
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function label(text) {
    return {
      LocalizedLabels: [
        {
          Label: text,
          LanguageCode: CONFIG.languageCode
        }
      ],
      UserLocalizedLabel: {
        Label: text,
        LanguageCode: CONFIG.languageCode
      }
    };
  }

  function requiredLevel(value) {
    return {
      Value: value,
      CanBeChanged: true,
      ManagedPropertyLogicalName: "canmodifyrequirementlevelsettings"
    };
  }

  function stringField(logicalName, schemaName, displayName, maxLength, formatName) {
    return {
      logicalName,
      metadata: {
        "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
        SchemaName: schemaName,
        DisplayName: label(displayName),
        RequiredLevel: requiredLevel("None"),
        MaxLength: maxLength,
        FormatName: { Value: formatName || "Text" }
      }
    };
  }

  function memoField(logicalName, schemaName, displayName, maxLength) {
    return {
      logicalName,
      metadata: {
        "@odata.type": "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
        SchemaName: schemaName,
        DisplayName: label(displayName),
        RequiredLevel: requiredLevel("None"),
        MaxLength: maxLength,
        FormatName: { Value: "TextArea" }
      }
    };
  }

  function moneyField(logicalName, schemaName, displayName) {
    return {
      logicalName,
      metadata: {
        "@odata.type": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
        SchemaName: schemaName,
        DisplayName: label(displayName),
        RequiredLevel: requiredLevel("None"),
        MinValue: 0,
        MaxValue: 1000000,
        Precision: 2,
        PrecisionSource: 1
      }
    };
  }

  function picklistField(logicalName, schemaName, displayName, options) {
    return {
      logicalName,
      metadata: {
        "@odata.type": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
        SchemaName: schemaName,
        DisplayName: label(displayName),
        RequiredLevel: requiredLevel("None"),
        OptionSet: {
          "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
          IsGlobal: false,
          OptionSetType: "Picklist",
          Options: Object.entries(options).map(([optionLabel, value]) => ({
            Value: value,
            Label: label(optionLabel)
          }))
        }
      }
    };
  }

  function booleanField(logicalName, schemaName, displayName) {
    return {
      logicalName,
      metadata: {
        "@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
        SchemaName: schemaName,
        DisplayName: label(displayName),
        RequiredLevel: requiredLevel("None"),
        OptionSet: {
          "@odata.type": "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata",
          TrueOption: {
            Value: 1,
            Label: label("Sim")
          },
          FalseOption: {
            Value: 0,
            Label: label("Não")
          }
        },
        DefaultValue: false
      }
    };
  }

  function dateTimeField(logicalName, schemaName, displayName) {
    return {
      logicalName,
      metadata: {
        "@odata.type": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata",
        SchemaName: schemaName,
        DisplayName: label(displayName),
        RequiredLevel: requiredLevel("None"),
        DateTimeBehavior: { Value: "UserLocal" },
        Format: "DateAndTime"
      }
    };
  }

  function getXrm() {
    if (window.Xrm) return window.Xrm;

    try {
      if (window.parent && window.parent.Xrm) return window.parent.Xrm;
    } catch (_) {
      // Ignora acesso cross-frame bloqueado.
    }

    try {
      if (window.top && window.top.Xrm) return window.top.Xrm;
    } catch (_) {
      // Ignora acesso cross-frame bloqueado.
    }

    return null;
  }
})().catch(function mostrarErroFatal(error) {
  console.error("[Currículos] Erro fatal antes da execução principal:", error && error.message ? error.message : error);
});

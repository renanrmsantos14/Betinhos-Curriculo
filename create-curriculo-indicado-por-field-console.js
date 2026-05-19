/*
  Console Dataverse / Model-driven App
  Cria o campo "Indicado por" na tabela new_curriculo.

  Campo:
  - Logical name: new_indicadopor
  - Tipo: Texto
  - Tamanho: 200

  Como usar:
  1. Abra o Model-driven App no ambiente correto.
  2. Pressione F12 > Console.
  3. Cole este arquivo inteiro.
  4. Confirme a execução.
*/
(async function criarCampoIndicadoPorCurriculo() {
  "use strict";

  console.clear();

  const CONFIG = {
    languageCode: 1046,
    tableLogicalName: "new_curriculo",
    fieldLogicalName: "new_indicadopor",
    fieldSchemaName: "new_IndicadoPor",
    fieldDisplayName: "Indicado por",
    maxLength: 200,
    publishAtEnd: true
  };

  const APP_XRM = getXrm();

  if (!APP_XRM || !APP_XRM.Utility || !APP_XRM.WebApi) {
    throw new Error("Xrm não encontrado. Execute dentro de um Model-driven App carregado.");
  }

  const confirmed = window.confirm(
    `Criar o campo '${CONFIG.fieldDisplayName}' (${CONFIG.fieldLogicalName}) na tabela ${CONFIG.tableLogicalName}?`
  );

  if (!confirmed) {
    console.warn("[Currículos] Execução cancelada pelo usuário.");
    return;
  }

  const clientUrl = APP_XRM.Utility.getGlobalContext().getClientUrl();
  const apiBase = `${clientUrl}/api/data/v9.2`;

  console.group("[Currículos] Criação de campo");
  console.log("Ambiente:", clientUrl);
  console.log("Tabela:", CONFIG.tableLogicalName);
  console.log("Campo:", CONFIG.fieldLogicalName);

  try {
    if (await attributeExists(CONFIG.fieldLogicalName)) {
      console.log("Campo já existe. Nada para criar.");
      return;
    }

    const field = {
      "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
      SchemaName: CONFIG.fieldSchemaName,
      DisplayName: label(CONFIG.fieldDisplayName),
      Description: label("Nome da pessoa que indicou o candidato."),
      RequiredLevel: requiredLevel("None"),
      MaxLength: CONFIG.maxLength,
      FormatName: { Value: "Text" }
    };

    const response = await http(
      "POST",
      `/EntityDefinitions(LogicalName='${CONFIG.tableLogicalName}')/Attributes`,
      field
    );

    if (!response.ok) throw await responseError(response, "Erro ao criar campo");

    if (CONFIG.publishAtEnd) await publishAll();

    console.log("Concluído. Adicione o campo ao formulário/view se quiser ver no Model-driven padrão.");
  } catch (error) {
    console.error("Falhou.", normalizeError(error));
    throw error;
  } finally {
    console.groupEnd();
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
    if (!response.ok) throw new Error(`Erro ao publicar customizações. HTTP ${response.status}.`);
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

  function normalizeError(error) {
    if (!error) return "Erro desconhecido.";
    return error.message || String(error);
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
  console.error("[Currículos] Erro fatal:", error && error.message ? error.message : error);
});

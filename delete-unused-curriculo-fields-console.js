/*
  Console Dataverse / Model-driven App
  Remove campos antigos da tabela new_curriculo.

  Campos alvo, inferidos do código atual:
  - new_consentimentolgpd
  - new_dataconsentimento
  - Curso MOPP
  - Tem experiência com executivo

  Como usar:
  1. Abra o Model-driven App no ambiente correto.
  2. Pressione F12 > Console.
  3. Cole este arquivo inteiro.
  4. Confirme a execução.

  Requisito: usuário com permissão de customização.
*/
(async function apagarCamposCurriculoNaoUsados() {
  "use strict";

  const CONFIG = {
    tableLogicalName: "new_curriculo",
    fieldsToDelete: [
      {
        name: "Consentimento LGPD",
        candidates: ["new_consentimentolgpd"]
      },
      {
        name: "Data do consentimento",
        candidates: ["new_dataconsentimento"]
      },
      {
        name: "Curso MOPP",
        candidates: ["new_temcursomopp", "new_cursomopp", "new_cursodemopp", "new_mopp"],
        labelIncludes: ["curso mopp", "curso de mopp", "mopp"]
      },
      {
        name: "Tem experiência com executivo",
        candidates: [
          "new_temexperienciacomexecutivo",
          "new_temexperienciaexecutivo",
          "new_experienciaexecutivo",
          "new_experienciacomexecutivo"
        ],
        labelIncludes: ["tem experiencia com executivo", "tem experiencia executivo", "experiencia com executivo"]
      }
    ],
    publishAtEnd: true
  };

  const APP_XRM = getXrm();

  if (!APP_XRM || !APP_XRM.Utility || !APP_XRM.WebApi) {
    throw new Error("Xrm não encontrado. Execute dentro de um Model-driven App carregado.");
  }

  const clientUrl = APP_XRM.Utility.getGlobalContext().getClientUrl();
  const apiBase = `${clientUrl}/api/data/v9.2`;

  console.clear();
  console.group("[Currículos] Limpeza de campos não usados");
  console.log("Ambiente:", clientUrl);
  console.log("Tabela:", CONFIG.tableLogicalName);
  console.log("Campos alvo:", CONFIG.fieldsToDelete.map((field) => field.name).join(", "));

  const confirmed = window.confirm(
    `Apagar estes campos da tabela ${CONFIG.tableLogicalName}?\n\n${CONFIG.fieldsToDelete.map((field) => field.name).join("\n")}\n\nEsta ação remove metadados e não é reversível sem recriar os campos.`
  );

  if (!confirmed) {
    console.warn("Cancelado pelo usuário.");
    console.groupEnd();
    return;
  }

  try {
    await assertEntityExists();
    const allAttributes = await getAllAttributes();

    for (const target of CONFIG.fieldsToDelete) {
      const attribute = resolveTargetAttribute(target, allAttributes);

      if (!attribute) {
        console.warn(`Campo não existe ou já foi removido: ${target.name}`);
        continue;
      }

      if (attribute.IsPrimaryId || attribute.IsPrimaryName || attribute.IsValidForCreate === false && attribute.IsValidForUpdate === false) {
        console.error(`Campo protegido. Não vou apagar: ${attribute.LogicalName}`);
        continue;
      }

      const logicalName = attribute.LogicalName;
      console.group(`Campo: ${logicalName}`);
      await reportDependencies(attribute.MetadataId);
      await removeFromForms(logicalName);
      await removeFromViews(logicalName);
      await publishIfNeeded();
      await deleteAttribute(logicalName);
      console.log(`Removido: ${logicalName}`);
      console.groupEnd();
    }

    await publishIfNeeded();
    console.log("Concluído.");
  } catch (error) {
    console.error("Falhou.", normalizeError(error));
    throw error;
  } finally {
    console.groupEnd();
  }

  async function assertEntityExists() {
    const response = await http(
      "GET",
      `/EntityDefinitions(LogicalName='${CONFIG.tableLogicalName}')?$select=MetadataId,LogicalName`
    );

    if (!response.ok) throw await responseError(response, "Erro ao localizar tabela");
  }

  async function getAllAttributes() {
    const response = await http(
      "GET",
      `/EntityDefinitions(LogicalName='${CONFIG.tableLogicalName}')/Attributes?$select=MetadataId,LogicalName,SchemaName,DisplayName,IsPrimaryId,IsPrimaryName,IsValidForCreate,IsValidForUpdate`
    );

    if (!response.ok) throw await responseError(response, "Erro ao listar campos da tabela");
    const data = await response.json();
    return data.value || [];
  }

  function resolveTargetAttribute(target, attributes) {
    const candidateSet = new Set((target.candidates || []).map((name) => normalizeKey(name)));

    const byLogicalName = attributes.find((attribute) => candidateSet.has(normalizeKey(attribute.LogicalName)));
    if (byLogicalName) return byLogicalName;

    const labelIncludes = (target.labelIncludes || []).map((label) => normalizeText(label));
    if (!labelIncludes.length) return null;

    return attributes.find((attribute) => {
      const label = normalizeText(getLocalizedLabel(attribute.DisplayName));
      return label && labelIncludes.some((expected) => label.includes(expected));
    }) || null;
  }

  async function reportDependencies(attributeMetadataId) {
    if (!isGuid(attributeMetadataId)) {
      console.warn("Dependências não consultadas: MetadataId ausente no metadado do campo.");
      return;
    }

    try {
      const response = await http("POST", "/RetrieveDependenciesForDelete", {
        ObjectId: attributeMetadataId,
        ComponentType: 2
      });

      if (!response.ok) {
        console.warn(
          `Não foi possível listar dependências via RetrieveDependenciesForDelete. HTTP ${response.status}. Vou tentar remover mesmo assim.`
        );
        return;
      }

      const result = response.ok ? await response.json() : null;
      const dependencies = result?.EntityCollection?.Entities || result?.value || [];

      if (!dependencies.length) {
        console.log("Dependências reportadas: nenhuma.");
        return;
      }

      console.warn("Dependências reportadas pelo Dataverse:", dependencies);
    } catch (error) {
      console.warn("Não foi possível listar dependências via RetrieveDependenciesForDelete.", normalizeError(error));
    }
  }

  async function removeFromForms(logicalName) {
    const response = await http(
      "GET",
      `/systemforms?$select=formid,name,type,formxml&$filter=objecttypecode eq '${CONFIG.tableLogicalName}'`
    );

    if (!response.ok) throw await responseError(response, "Erro ao listar formulários");
    const data = await response.json();
    const forms = data.value || [];
    let changed = 0;

    for (const form of forms) {
      if (!form.formxml || !form.formxml.includes(logicalName)) continue;

      const nextXml = removeFormXmlField(form.formxml, logicalName);
      if (nextXml === form.formxml) {
        console.warn(`Form contém ${logicalName}, mas não consegui remover automaticamente: ${form.name || form.formid}`);
        continue;
      }

      await http("PATCH", `/systemforms(${form.formid})`, { formxml: nextXml });
      changed += 1;
      console.log(`Removido do formulário: ${form.name || form.formid}`);
    }

    if (!changed) console.log("Formulários: nada para limpar.");
  }

  function removeFormXmlField(formXml, logicalName) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(formXml, "text/xml");

    if (doc.querySelector("parsererror")) return formXml;

    let changed = false;

    doc.querySelectorAll(`control[datafieldname="${logicalName}"], control[id="${logicalName}"]`).forEach((control) => {
      const cell = control.closest("cell");
      if (cell) {
        cell.remove();
        changed = true;
      } else {
        control.remove();
        changed = true;
      }
    });

    doc.querySelectorAll(`cell[id="${logicalName}"], cell[datafieldname="${logicalName}"]`).forEach((cell) => {
      cell.remove();
      changed = true;
    });

    return changed ? new XMLSerializer().serializeToString(doc) : formXml;
  }

  async function removeFromViews(logicalName) {
    const response = await http(
      "GET",
      `/savedqueries?$select=savedqueryid,name,fetchxml,layoutxml&$filter=returnedtypecode eq '${CONFIG.tableLogicalName}'`
    );

    if (!response.ok) throw await responseError(response, "Erro ao listar views");
    const data = await response.json();
    const views = data.value || [];
    let changed = 0;

    for (const view of views) {
      const nextFetchXml = removeFetchXmlAttribute(view.fetchxml || "", logicalName);
      const nextLayoutXml = removeLayoutXmlCell(view.layoutxml || "", logicalName);

      if (nextFetchXml === (view.fetchxml || "") && nextLayoutXml === (view.layoutxml || "")) continue;

      await http("PATCH", `/savedqueries(${view.savedqueryid})`, {
        fetchxml: nextFetchXml,
        layoutxml: nextLayoutXml
      });

      changed += 1;
      console.log(`Removido da view: ${view.name || view.savedqueryid}`);
    }

    if (!changed) console.log("Views: nada para limpar.");
  }

  function removeFetchXmlAttribute(fetchXml, logicalName) {
    if (!fetchXml || !fetchXml.includes(logicalName)) return fetchXml;

    const parser = new DOMParser();
    const doc = parser.parseFromString(fetchXml, "text/xml");

    if (doc.querySelector("parsererror")) return fetchXml;

    let changed = false;
    doc.querySelectorAll(`attribute[name="${logicalName}"]`).forEach((attribute) => {
      attribute.remove();
      changed = true;
    });

    return changed ? new XMLSerializer().serializeToString(doc) : fetchXml;
  }

  function removeLayoutXmlCell(layoutXml, logicalName) {
    if (!layoutXml || !layoutXml.includes(logicalName)) return layoutXml;

    const parser = new DOMParser();
    const doc = parser.parseFromString(layoutXml, "text/xml");

    if (doc.querySelector("parsererror")) return layoutXml;

    let changed = false;
    doc.querySelectorAll(`cell[name="${logicalName}"]`).forEach((cell) => {
      cell.remove();
      changed = true;
    });

    return changed ? new XMLSerializer().serializeToString(doc) : layoutXml;
  }

  async function deleteAttribute(logicalName) {
    const response = await http(
      "DELETE",
      `/EntityDefinitions(LogicalName='${CONFIG.tableLogicalName}')/Attributes(LogicalName='${logicalName}')`
    );

    if (!response.ok) throw await responseError(response, `Erro ao apagar campo ${logicalName}`);
  }

  async function publishIfNeeded() {
    if (!CONFIG.publishAtEnd) return;

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

  function normalizeError(error) {
    if (!error) return "Erro desconhecido.";
    return error.message || String(error);
  }

  function getLocalizedLabel(label) {
    return label?.UserLocalizedLabel?.Label || label?.LocalizedLabels?.[0]?.Label || "";
  }

  function normalizeKey(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function isGuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
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

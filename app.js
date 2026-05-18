(() => {
  "use strict";

  const CONFIG = {
    tableLogicalName: "new_curriculo",
    flowUploadUrl: "https://25a2ab78cf07ee41a124457aa2c29a.ea.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d9dd1bd08123419f947985e36ee22ffa/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=g4g9Lj5lvTL-Z-3AdUNq7_Eelrkxg8wmCaIFz-V8sKc",
    fields: {
      nomeCompleto: "new_nomecompleto",
      cpf: "new_cpf",
      email: "new_email",
      telefone: "new_telefone",
      whatsapp: "new_whatsapp",
      cidade: "new_cidade",
      estado: "new_estado",
      cargoInteresse: "new_cargointeresse",
      experiencia: "new_experiencia",
      ultimoCargo: "new_ultimocargo",
      ultimaEmpresa: "new_ultimaempresa",
      pretensaoSalarial: "new_pretensaosalarial",
      nota: "new_nota",
      disponibilidade: "new_disponibilidade",
      categoriaCnh: "new_categoriacnh",
      experienciaExecutivo: "new_temexperienciaexecutivo",
      cursoMopp: "new_temcursomopp",
      origemCurriculo: "new_origemcurriculo",
      statusCurriculo: "new_statuscurriculo",
      linkCurriculo: "new_linkcurriculo",
      observacoes: "new_observacoes"
    }
  };

  const OPTIONS = {
    disponibilidade: [
      ["", ""],
      [100000000, "Imediata"],
      [100000001, "Até 7 dias"],
      [100000002, "Até 15 dias"],
      [100000003, "Até 30 dias"],
      [100000004, "A combinar"]
    ],
    categoriaCnh: [
      ["", ""],
      [100000000, "A"],
      [100000001, "B"],
      [100000002, "C"],
      [100000003, "D"],
      [100000004, "E"],
      [100000005, "AB"],
      [100000006, "ACC"],
      [100000007, "Não informado"]
    ],
    origemCurriculo: [
      ["", ""],
      [100000000, "Indicação"],
      [100000001, "WhatsApp"],
      [100000002, "Site"],
      [100000003, "LinkedIn"],
      [100000004, "Instagram"],
      [100000005, "Presencial"],
      [100000006, "Outro"]
    ],
    statusCurriculo: [
      [100000000, "Novo"],
      [100000001, "Em análise"],
      [100000002, "Aprovado para banco"],
      [100000003, "Reprovado"],
      [100000004, "Contratado"]
    ]
  };

  const DRAFT_KEY = "betinhos_curriculo_draft_v1";
  const MOCK_KEY = "betinhos_curriculo_mock_records_v1";

  const $ = (id) => document.getElementById(id);
  const el = {
    form: $("curriculoForm"),
    submitButton: $("submitButton"),
    submitButtonText: $("submitButtonText"),
    clearButton: $("clearButton"),
    modeText: $("modeText"),
    tabs: [...document.querySelectorAll(".tab")],
    panels: [...document.querySelectorAll(".panel")],
    toastStack: $("toastStack"),
    loadingOverlay: $("loadingOverlay"),
    successOverlay: $("successOverlay"),
    successMessage: $("successMessage"),
    closeSuccess: $("closeSuccess"),
    arquivoCurriculo: $("arquivoCurriculo"),
    filePreview: $("filePreview")
  };

  const state = {
    xrm: getXrm(),
    mockMode: false,
    saving: false
  };

  let previewUrl = "";

  state.mockMode = !state.xrm;

  init();

  function init() {
    fillOptions();
    bindEvents();
    restoreDraft();
    updateMode();
  }

  function bindEvents() {
    el.tabs.forEach((tab) => {
      tab.addEventListener("click", () => activatePanel(tab.dataset.section));
    });

    el.form.addEventListener("submit", handleSubmit);
    el.form.addEventListener("input", saveDraft);
    el.form.addEventListener("change", saveDraft);
    el.clearButton.addEventListener("click", clearForm);
    el.closeSuccess.addEventListener("click", () => {
      el.successOverlay.hidden = true;
    });

    $("cpf").addEventListener("input", maskCpf);
    $("telefone").addEventListener("input", maskPhone);
    $("whatsapp").addEventListener("input", maskPhone);
    el.arquivoCurriculo.addEventListener("change", renderFilePreview);
    $("estado").addEventListener("input", (event) => {
      event.target.value = event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    });
  }

  function updateMode() {
    el.modeText.textContent = state.mockMode ? "Local / teste" : "Dataverse";
    if (state.mockMode) {
      toast("Modo local ativo. Abra dentro do Model-driven App para gravar no Dataverse.", "warning", 7000);
    }
  }

  function activatePanel(section) {
    el.tabs.forEach((tab) => {
      const active = tab.dataset.section === section;
      tab.classList.toggle("is-active", active);
      if (active) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    el.panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === section);
    });
  }

  function fillOptions() {
    Object.entries(OPTIONS).forEach(([id, rows]) => {
      const select = $(id);
      if (!select) return;
      select.replaceChildren();
      rows.forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value === "" ? "" : String(value);
        option.textContent = label;
        select.appendChild(option);
      });
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (state.saving) return;

    if (!validateForm()) return;

    state.saving = true;
    setLoading(true);
    el.submitButton.disabled = true;
    el.submitButtonText.textContent = "Enviando...";

    try {
      const payload = buildDataversePayload();
      const record = state.mockMode
        ? saveMockRecord(payload)
        : await state.xrm.WebApi.createRecord(CONFIG.tableLogicalName, payload);

      const recordId = record.id || record.recordId;
      const uploadResult = await handleUpload(recordId, payload);
      if (uploadResult.webUrl) {
        await updateRecordLink(recordId, uploadResult.webUrl);
      }
      localStorage.removeItem(DRAFT_KEY);
      el.successMessage.textContent = uploadResult.message;
      el.successOverlay.hidden = false;
      el.form.reset();
      clearFilePreview();
      fillOptions();
      activatePanel("dados");
      toast("Currículo registrado.", "success");
    } catch (error) {
      console.error(error);
      toast(error.message || "Falha ao enviar cadastro.", "error", 9000);
    } finally {
      state.saving = false;
      setLoading(false);
      el.submitButton.disabled = false;
      el.submitButtonText.textContent = "Enviar cadastro";
    }
  }

  function validateForm() {
    const firstInvalid = el.form.querySelector(":invalid");
    if (firstInvalid) {
      const panel = firstInvalid.closest(".panel");
      if (panel) activatePanel(panel.dataset.panel);
      firstInvalid.focus({ preventScroll: false });
      toast("Preencha os campos obrigatórios.", "error");
      return false;
    }

    const file = el.arquivoCurriculo.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      activatePanel("arquivo");
      toast("Arquivo acima de 10 MB. Reduza antes de enviar.", "error");
      return false;
    }

    return true;
  }

  function buildDataversePayload() {
    const f = CONFIG.fields;
    const payload = {
      [f.nomeCompleto]: value("nomeCompleto"),
      [f.cpf]: value("cpf"),
      [f.email]: value("email"),
      [f.telefone]: value("telefone"),
      [f.whatsapp]: value("whatsapp"),
      [f.cidade]: value("cidade"),
      [f.estado]: value("estado"),
      [f.cargoInteresse]: value("cargoInteresse"),
      [f.experiencia]: value("experiencia"),
      [f.ultimoCargo]: value("ultimoCargo"),
      [f.ultimaEmpresa]: value("ultimaEmpresa"),
      [f.pretensaoSalarial]: numberValue("pretensaoSalarial"),
      [f.nota]: numberValue("nota"),
      [f.disponibilidade]: optionValue("disponibilidade"),
      [f.categoriaCnh]: optionValue("categoriaCnh"),
      [f.experienciaExecutivo]: $("experienciaExecutivo").checked,
      [f.cursoMopp]: $("cursoMopp").checked,
      [f.origemCurriculo]: optionValue("origemCurriculo"),
      [f.statusCurriculo]: optionValue("statusCurriculo") ?? 100000000,
      [f.linkCurriculo]: value("linkCurriculo"),
      [f.observacoes]: value("observacoes")
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    return payload;
  }

  async function handleUpload(recordId, payload) {
    const file = el.arquivoCurriculo.files[0];
    if (!file) {
      return { uploaded: false, message: "Currículo registrado sem arquivo anexado." };
    }

    if (!CONFIG.flowUploadUrl) {
      return {
        uploaded: false,
        message: "Currículo registrado. Upload pendente: configure a URL do Flow em CONFIG.flowUploadUrl."
      };
    }

    const filePayload = await fileToPayload(file);
    const flowPayload = {
      curriculoId: recordId,
      expenseId: recordId,
      externalId: CONFIG.tableLogicalName,
      fileName: filePayload.name,
      mimeType: filePayload.type,
      fileSize: filePayload.size,
      base64: filePayload.base64,
      candidateName: payload[CONFIG.fields.nomeCompleto] || "",
      candidateEmail: payload[CONFIG.fields.email] || "",
      cargoInteresse: payload[CONFIG.fields.cargoInteresse] || "",
      uploadedBy: getCurrentUserName(),
      uploadedAt: new Date().toISOString()
    };

    const response = await fetch(CONFIG.flowUploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flowPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Registro criado, mas o upload falhou. HTTP ${response.status}. ${errorText || "Sem detalhes no retorno do Flow."}`);
    }

    const result = await parseFlowResponse(response);
    return {
      uploaded: true,
      webUrl: result.webUrl || "",
      driveItemId: result.driveItemId || "",
      message: result.webUrl
        ? "Currículo registrado, arquivo enviado ao Flow e link gravado no cadastro."
        : "Currículo registrado e arquivo enviado ao Flow."
    };
  }

  function fileToPayload(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve({
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          base64: result.includes(",") ? result.split(",")[1] : result
        });
      };
      reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
      reader.readAsDataURL(file);
    });
  }

  function saveMockRecord(payload) {
    const rows = JSON.parse(localStorage.getItem(MOCK_KEY) || "[]");
    const recordId = `mock-${Date.now().toString(36)}`;
    rows.push({ id: recordId, payload, createdOn: new Date().toISOString() });
    localStorage.setItem(MOCK_KEY, JSON.stringify(rows));
    return { id: recordId };
  }

  async function updateRecordLink(recordId, webUrl) {
    if (!recordId || !webUrl) return;

    if (state.mockMode) {
      const rows = JSON.parse(localStorage.getItem(MOCK_KEY) || "[]");
      const row = rows.find((item) => item.id === recordId);
      if (row) {
        row.payload = {
          ...row.payload,
          [CONFIG.fields.linkCurriculo]: webUrl
        };
        localStorage.setItem(MOCK_KEY, JSON.stringify(rows));
      }
      return;
    }

    await state.xrm.WebApi.updateRecord(CONFIG.tableLogicalName, recordId, {
      [CONFIG.fields.linkCurriculo]: webUrl
    });
  }

  async function parseFlowResponse(response) {
    const text = await response.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch (_) {
      return {};
    }
  }

  function getCurrentUserName() {
    try {
      return state.xrm?.Utility?.getGlobalContext?.().userSettings?.userName || "Usuário não identificado";
    } catch (_) {
      return "Usuário não identificado";
    }
  }

  function saveDraft() {
    const draft = {};
    [...el.form.elements].forEach((control) => {
      if (!control.name || control.type === "file") return;
      draft[control.name] = control.type === "checkbox" ? control.checked : control.value;
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function restoreDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
      Object.entries(draft).forEach(([name, val]) => {
        const control = el.form.elements[name];
        if (!control) return;
        if (control.type === "checkbox") control.checked = !!val;
        else control.value = val;
      });
    } catch (_) {
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  function clearForm() {
    el.form.reset();
    clearFilePreview();
    localStorage.removeItem(DRAFT_KEY);
    activatePanel("dados");
    toast("Formulário limpo.", "success");
  }

  function renderFilePreview() {
    clearFilePreview();
    const file = el.arquivoCurriculo.files[0];

    if (!file) {
      el.filePreview.hidden = true;
      return;
    }

    previewUrl = URL.createObjectURL(file);
    const size = formatBytes(file.size);
    const canPreviewImage = file.type.startsWith("image/");
    const canPreviewPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    let previewMarkup = "";

    if (canPreviewImage) {
      previewMarkup = `<img src="${previewUrl}" alt="Preview do currículo anexado">`;
    } else if (canPreviewPdf) {
      previewMarkup = `<iframe src="${previewUrl}" title="Preview do currículo em PDF"></iframe>`;
    } else {
      previewMarkup = `<div class="file-preview-fallback">Preview visual indisponível para este tipo de arquivo. O arquivo será enviado normalmente.</div>`;
    }

    el.filePreview.innerHTML = `
      <div class="file-preview-head">
        <div class="file-preview-title">
          <strong>${escapeHtml(file.name)}</strong>
          <span>${escapeHtml(file.type || "Arquivo")} · ${size}</span>
        </div>
        <button class="file-preview-clear" type="button">Remover</button>
      </div>
      <div class="file-preview-body">${previewMarkup}</div>
    `;
    el.filePreview.hidden = false;
    el.filePreview.querySelector(".file-preview-clear").addEventListener("click", () => {
      el.arquivoCurriculo.value = "";
      clearFilePreview();
      saveDraft();
    });
  }

  function clearFilePreview(revoke = true) {
    if (revoke && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    previewUrl = "";
    el.filePreview.replaceChildren();
    el.filePreview.hidden = true;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return "0 KB";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function value(id) {
    return ($(id).value || "").trim();
  }

  function optionValue(id) {
    const raw = value(id);
    return raw === "" ? null : Number(raw);
  }

  function numberValue(id) {
    const raw = value(id).replace(",", ".");
    return raw === "" ? null : Number(raw);
  }

  function setLoading(active) {
    el.loadingOverlay.hidden = !active;
  }

  function toast(message, type = "success", timeout = 4500) {
    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.innerHTML = `<span class="toast-message"></span><button class="toast-close" type="button" aria-label="Fechar">×</button>`;
    item.querySelector(".toast-message").textContent = message;
    item.querySelector(".toast-close").addEventListener("click", () => item.remove());
    el.toastStack.appendChild(item);
    window.setTimeout(() => item.remove(), timeout);
  }

  function maskCpf(event) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
    event.target.value = digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function maskPhone(event) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
    event.target.value = digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }

  function getXrm() {
    const scopes = [window, window.parent, window.top, window.opener].filter(Boolean);
    for (const scope of scopes) {
      try {
        if (scope.Xrm && scope.Xrm.WebApi) return scope.Xrm;
      } catch (_) {
        continue;
      }
    }
    return null;
  }
})();

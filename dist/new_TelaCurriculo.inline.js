(() => {
  "use strict";

  const CONFIG = {
    tableLogicalName: "new_curriculo",
    appName: "Tela Curriculo",
    appVersion: "1.0.0",
    builtAt: "2026-06-10T00:00:00.000Z",
    errorLogTableLogicalName: "new_appmotoristaslog",
    flowUploadUrls: {
      dev: "https://25a2ab78cf07ee41a124457aa2c29a.ea.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d9dd1bd08123419f947985e36ee22ffa/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=g4g9Lj5lvTL-Z-3AdUNq7_Eelrkxg8wmCaIFz-V8sKc",
      prod: "https://6847878f5a6fe08baed6d7119975e3.e1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/78e18b7b1ecb4a0c93d3e8458ca69d38/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=VMrBVOoTdjjyjiCcLnvZhawOckboqmG-nZXOinHNGOY"
    },
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
      indicadoPor: "new_indicadopor",
      disponibilidade: "new_disponibilidade",
      categoriaCnh: "new_categoriacnh",
      origemCurriculo: "new_origemcurriculo",
      statusCurriculo: "new_statuscurriculo",
      linkCurriculo: "new_linkcurriculo",
      observacoes: "new_observacoes"
    }
  };

  const ENVIRONMENT_HINTS = {
    dev: {
      host: "appbetinhosdev.crm2.dynamics.com",
      appId: "7c7c8fda-53d0-f011-8543-6045bd3a51ea",
      label: "DEV"
    },
    prod: {
      host: "orgf261ae8e.crm2.dynamics.com",
      appId: "eedbaaa9-5507-f111-8407-6045bd3b9ec0",
      label: "PROD"
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
  const PENDING_SUBMISSION_KEY = "betinhos_curriculo_pending_submission_v1";
  const ERROR_LOG_QUEUE_KEY = "betinhos_curriculo_error_log_queue_v1";
  const ERROR_LOG_SESSION_KEY = "betinhos_curriculo_error_log_session_v1";
  const ERROR_LOG_MAX_QUEUE = 20;
  const ERROR_LOG_MAX_TEXT = 8000;
  const ERROR_LOG_MAX_JSON = 12000;

  const $ = (id) => document.getElementById(id);
  const el = {
    form: $("curriculoForm"),
    submitButton: $("submitButton"),
    submitButtonText: $("submitButtonText"),
    modeText: $("modeText"),
    tabs: [...document.querySelectorAll(".tab")],
    panels: [...document.querySelectorAll(".panel")],
    toastStack: $("toastStack"),
    loadingOverlay: $("loadingOverlay"),
    successOverlay: $("successOverlay"),
    successMessage: $("successMessage"),
    closeSuccess: $("closeSuccess"),
    arquivoCurriculo: $("arquivoCurriculo"),
    uploadField: document.querySelector(".upload-field"),
    uploadStatus: $("uploadStatus"),
    filePreview: $("filePreview")
  };

  const state = {
    xrm: getXrm(),
    mockMode: false,
    environmentLabel: "Dataverse",
    saving: false
  };

  let previewUrl = "";
  const errorLogger = createAppErrorLogger();

  state.mockMode = !state.xrm;

  init();

  function init() {
    errorLogger.installGlobalHandlers();
    fillOptions();
    bindEvents();
    restoreDraft();
    updateMode();
    notifyPendingSubmission();
    errorLogger.flushQueue();
  }

  function reportAppError(error, context = {}) {
    return errorLogger.report(error, context);
  }

  function createAppErrorLogger() {
    let handlersInstalled = false;
    let originalConsoleError = console.error?.bind(console) || null;

    return {
      installGlobalHandlers,
      flushQueue,
      report
    };

    function installGlobalHandlers() {
      if (handlersInstalled) return;
      handlersInstalled = true;

      const previousOnError = window.onerror;
      window.onerror = function onWindowError(message, source, lineno, colno, error) {
        void report(error || message, {
          severity: "critical",
          source: "window",
          action: "window.onerror",
          phase: "runtime",
          component: source || "window",
          detailId: [lineno, colno].filter(Boolean).join(":"),
          payload: { message, source, lineno, colno }
        });

        if (typeof previousOnError === "function") {
          return previousOnError.apply(this, arguments);
        }

        return false;
      };

      window.addEventListener("error", (event) => {
        const target = event.target;
        if (!target || target === window || target === document) return;

        const tagName = String(target.tagName || "resource").toLowerCase();
        const resourceUrl = String(target.currentSrc || target.src || target.href || "").trim();
        void report(new Error(`Falha ao carregar recurso ${tagName}: ${resourceUrl || "desconhecido"}`), {
          severity: "error",
          source: "window.resourceerror",
          action: resourceUrl || tagName,
          phase: "runtime",
          component: tagName,
          payload: {
            tagName,
            resourceUrl
          }
        });
      }, true);

      window.addEventListener("unhandledrejection", (event) => {
        void report(event.reason || "Unhandled promise rejection", {
          severity: "critical",
          source: "window",
          action: "unhandledrejection",
          phase: "runtime",
          component: "promise"
        });
      });

      console.error = (...args) => {
        if (originalConsoleError) {
          originalConsoleError(...args);
        }

        if (isLoggerConsoleMessage(args)) return;

        void report(errorFromConsoleArgs(args), {
          severity: "error",
          source: "console.error",
          action: "console.error",
          phase: "runtime",
          component: "console",
          payload: { args }
        });
      };

      window.addEventListener("online", () => {
        void flushQueue();
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          void flushQueue();
        }
      });

      window.__APP_REPORT_ERROR = report;
    }

    async function report(error, context = {}) {
      try {
        if (context.skipIfReported !== false && isReported(error)) return null;
        markReported(error);

        const record = buildErrorRecord(error, context);
        const xrm = state.xrm || getXrm();

        if (!xrm?.WebApi?.createRecord) {
          enqueueLog(record);
          return null;
        }

        try {
          return await xrm.WebApi.createRecord(CONFIG.errorLogTableLogicalName, record);
        } catch (logError) {
          writeLoggerConsoleError("[Curriculos] Falha ao gravar LOG no Dataverse.", logError);
          enqueueLog(record);
          return null;
        }
      } catch (loggerError) {
        writeLoggerConsoleError("[Curriculos] Falha interna no logger.", loggerError);
        return null;
      }
    }

    async function flushQueue() {
      const xrm = state.xrm || getXrm();
      if (!xrm?.WebApi?.createRecord) return;

      const queue = readQueue();
      if (!queue.length) return;

      const remaining = [];
      for (const record of queue) {
        try {
          await xrm.WebApi.createRecord(CONFIG.errorLogTableLogicalName, record);
        } catch (logError) {
          writeLoggerConsoleError("[Curriculos] Falha ao reenviar LOG pendente.", logError);
          remaining.push(record);
        }
      }

      writeQueue(remaining);
    }

    function buildErrorRecord(error, context = {}) {
      const occurredAt = new Date().toISOString();
      const normalized = normalizeError(error);
      const globalContext = safeCall(() => (state.xrm || getXrm())?.Utility?.getGlobalContext?.()) || null;
      const userSettings = globalContext?.userSettings || {};
      const client = globalContext?.client || {};
      const payload = sanitizeValue(context.payload || context.context || {});
      const raw = sanitizeValue({
        error: normalized,
        context: sanitizeValue(context),
        location: getLocationSnapshot()
      });
      const severity = normalizeSeverity(context.severity);
      const message = normalized.message || String(error || "Erro sem mensagem");
      const action = limitText(context.action || "unknown", 180);
      const source = limitText(context.source || "curriculo-webresource", 120);

      return compactRecord({
        new_name: limitText(`${severity} | ${source} | ${action}`, 160),
        new_occurredat: occurredAt,
        new_severity: severity,
        new_source: source,
        new_action: action,
        new_phase: limitText(context.phase || "", 120),
        new_component: limitText(context.component || "", 180),
        new_screen: limitText(context.screen || "curriculo", 120),
        new_detailid: limitText(context.detailId || "", 120),
        new_detailtype: limitText(context.detailType || "", 80),
        new_message: limitText(message, ERROR_LOG_MAX_TEXT),
        new_stack: limitText(normalized.stack, ERROR_LOG_MAX_TEXT),
        new_errorname: limitText(normalized.name, 220),
        new_errorcode: limitText(normalized.code, 120),
        new_appversion: limitText(CONFIG.appVersion, 60),
        new_builtat: limitText(CONFIG.builtAt, 80),
        new_sessionid: getSessionId(),
        new_userid: limitText(cleanGuid(userSettings.userId), 120),
        new_username: limitText(userSettings.userName || "", 300),
        new_useremail: limitText(userSettings.userEmail || "", 300),
        new_userdomainname: limitText(userSettings.userEmail || userSettings.userName || "", 300),
        new_appname: limitText(CONFIG.appName, 120),
        new_url: limitText(window.location.href, ERROR_LOG_MAX_TEXT),
        new_referrer: limitText(document.referrer || "", ERROR_LOG_MAX_TEXT),
        new_useragent: limitText(navigator.userAgent || "", ERROR_LOG_MAX_TEXT),
        new_language: limitText(navigator.language || "", 80),
        new_platform: limitText(navigator.platform || "", 160),
        new_timezone: limitText(Intl.DateTimeFormat().resolvedOptions().timeZone || "", 120),
        new_viewport: limitText(getViewport(), 80),
        new_visibilitystate: limitText(document.visibilityState || "", 40),
        new_connectiontype: limitText(getConnectionType(), 80),
        new_clienturl: limitText(globalContext?.getClientUrl?.() || "", 500),
        new_isoffline: String(safeCall(() => client.isOffline?.()) ?? (navigator.onLine === false)),
        new_payloadjson: limitText(safeStringify(payload), ERROR_LOG_MAX_JSON),
        new_rawjson: limitText(safeStringify(raw), ERROR_LOG_MAX_JSON)
      });
    }

    function normalizeError(error) {
      if (error instanceof Error) {
        return {
          message: error.message || "",
          stack: error.stack || "",
          name: error.name || "Error",
          code: error.code || error.errorCode || error.status || ""
        };
      }

      if (typeof error === "object" && error !== null) {
        return {
          message: error.message || safeStringify(error),
          stack: error.stack || "",
          name: error.name || "Error",
          code: error.code || error.errorCode || error.status || ""
        };
      }

      return {
        message: String(error || ""),
        stack: "",
        name: "Error",
        code: ""
      };
    }

    function normalizeSeverity(value) {
      return ["info", "warning", "error", "critical"].includes(value) ? value : "error";
    }

    function sanitizeValue(value, depth = 0) {
      if (depth > 4) return "[MaxDepth]";
      if (value === null || value === undefined) return value;
      if (typeof value === "string") return sanitizeString(value);
      if (typeof value === "number" || typeof value === "boolean") return value;
      if (value instanceof Error) return normalizeError(value);
      if (value instanceof File) {
        return {
          name: value.name,
          type: value.type,
          size: value.size,
          lastModified: value.lastModified
        };
      }
      if (Array.isArray(value)) return value.slice(0, 25).map((item) => sanitizeValue(item, depth + 1));
      if (typeof value === "object") {
        const output = {};
        Object.entries(value).slice(0, 60).forEach(([key, item]) => {
          if (isSensitiveKey(key)) {
            output[key] = "[redacted]";
          } else {
            output[key] = sanitizeValue(item, depth + 1);
          }
        });
        return output;
      }
      return String(value);
    }

    function sanitizeString(value) {
      const text = String(value).replace(/([?&](sig|sv|sp|token|apikey|secret)=)[^&\s]+/gi, "$1[redacted]");
      if (text.length > 180 && /^[A-Za-z0-9+/=]+$/.test(text)) return "[base64 redacted]";
      return limitText(text, ERROR_LOG_MAX_TEXT);
    }

    function isSensitiveKey(key) {
      return /base64|token|authorization|password|senha|sig|sv|sp|apikey|secret/i.test(String(key));
    }

    function safeStringify(value) {
      try {
        return JSON.stringify(value);
      } catch (_) {
        return JSON.stringify({ value: String(value) });
      }
    }

    function limitText(value, maxLength) {
      const text = value === null || value === undefined ? "" : String(value);
      return text.length > maxLength ? `${text.slice(0, maxLength - 12)}...[truncated]` : text;
    }

    function compactRecord(record) {
      Object.keys(record).forEach((key) => {
        if (record[key] === "" || record[key] === null || record[key] === undefined) {
          delete record[key];
        }
      });
      return record;
    }

    function enqueueLog(record) {
      try {
        const queue = readQueue();
        queue.push(record);
        writeQueue(queue.slice(-ERROR_LOG_MAX_QUEUE));
      } catch (queueError) {
        writeLoggerConsoleError("[Curriculos] Falha ao enfileirar LOG.", queueError);
      }
    }

    function readQueue() {
      try {
        const raw = localStorage.getItem(ERROR_LOG_QUEUE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }

    function writeQueue(queue) {
      try {
        if (!queue.length) {
          localStorage.removeItem(ERROR_LOG_QUEUE_KEY);
          return;
        }
        localStorage.setItem(ERROR_LOG_QUEUE_KEY, JSON.stringify(queue));
      } catch (queueError) {
        writeLoggerConsoleError("[Curriculos] Falha ao salvar fila de LOG.", queueError);
      }
    }

    function getSessionId() {
      try {
        let sessionId = sessionStorage.getItem(ERROR_LOG_SESSION_KEY);
        if (!sessionId) {
          sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
          sessionStorage.setItem(ERROR_LOG_SESSION_KEY, sessionId);
        }
        return sessionId;
      } catch (_) {
        return "session-unavailable";
      }
    }

    function getLocationSnapshot() {
      return {
        href: window.location.href,
        origin: window.location.origin,
        pathname: window.location.pathname,
        search: window.location.search,
        referrer: document.referrer || ""
      };
    }

    function getViewport() {
      return `${window.innerWidth || 0}x${window.innerHeight || 0}@${window.devicePixelRatio || 1}`;
    }

    function getConnectionType() {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return connection?.effectiveType || connection?.type || "";
    }

    function errorFromConsoleArgs(args) {
      const firstError = args.find((item) => item instanceof Error);
      if (firstError) return firstError;

      const message = args.map((item) => {
        if (typeof item === "string") return item;
        return safeStringify(sanitizeValue(item));
      }).join(" ");

      return new Error(message || "console.error");
    }

    function isLoggerConsoleMessage(args) {
      return args.some((item) => typeof item === "string" && item.includes("[Curriculos] Falha"));
    }

    function writeLoggerConsoleError(...args) {
      if (originalConsoleError) {
        originalConsoleError(...args);
      }
    }

    function cleanGuid(value) {
      return String(value || "").replace(/[{}]/g, "");
    }

    function markReported(error) {
      if (!error || (typeof error !== "object" && typeof error !== "function")) return;
      try {
        Object.defineProperty(error, "__betinhosLogged", {
          value: true,
          configurable: true
        });
      } catch (_) {
        // Ignora objetos selados.
      }
    }

    function isReported(error) {
      return !!(error && typeof error === "object" && error.__betinhosLogged);
    }
  }

  function bindEvents() {
    el.tabs.forEach((tab) => {
      tab.addEventListener("click", () => activatePanel(tab.dataset.section));
    });

    el.form.addEventListener("submit", handleSubmit);
    el.form.addEventListener("input", saveDraft);
    el.form.addEventListener("change", saveDraft);
    el.form.addEventListener("input", clearFieldError);
    el.form.addEventListener("change", clearFieldError);
    el.closeSuccess.addEventListener("click", () => {
      el.successOverlay.hidden = true;
    });

    $("cpf").addEventListener("input", maskCpf);
    $("telefone").addEventListener("input", maskPhone);
    $("whatsapp").addEventListener("input", maskPhone);
    $("nota").addEventListener("input", sanitizeNotaInput);
    el.arquivoCurriculo.addEventListener("change", renderFilePreview);
    bindUploadDropzone();
    document.addEventListener("paste", handlePasteFile);
    $("estado").addEventListener("input", (event) => {
      event.target.value = event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    });
  }

  function bindUploadDropzone() {
    if (!el.uploadField) return;

    ["dragenter", "dragover"].forEach((eventName) => {
      el.uploadField.addEventListener(eventName, (event) => {
        event.preventDefault();
        el.uploadField.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      el.uploadField.addEventListener(eventName, (event) => {
        event.preventDefault();
        el.uploadField.classList.remove("is-dragover");
      });
    });

    el.uploadField.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;

      setSelectedFile(file);
    });
  }

  function handlePasteFile(event) {
    const file = [...(event.clipboardData?.files || [])].find(isAcceptedFile);
    if (!file) return;

    event.preventDefault();
    activatePanel("arquivo");
    setSelectedFile(file);
    toast(`Arquivo colado: ${file.name}`, "success", 3500);
  }

  function setSelectedFile(file) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    el.arquivoCurriculo.files = transfer.files;
    renderFilePreview();
    saveDraft();
  }

  function isAcceptedFile(file) {
    if (!file) return false;
    const name = file.name.toLowerCase();
    const acceptedExtensions = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
    return acceptedExtensions.some((extension) => name.endsWith(extension)) ||
      ["application/pdf", "image/png", "image/jpeg"].includes(file.type);
  }

  function updateMode() {
    state.environmentLabel = state.mockMode ? "Local / teste" : resolveEnvironmentLabel();
    el.modeText.textContent = state.environmentLabel;
    if (state.mockMode) {
      toast("Modo local ativo. Abra dentro do Model-driven App para gravar no Dataverse.", "warning", 7000);
    }
  }

  function resolveEnvironmentLabel() {
    const context = state.xrm?.Utility?.getGlobalContext?.();
    if (!context) return "Dataverse";

    const clientUrl = context.getClientUrl?.();
    const currentHost = getHostFromUrl(clientUrl);
    const currentAppId = getQueryParam("appid", window.location.href);

    if ((currentAppId && isSameGuid(currentAppId, ENVIRONMENT_HINTS.dev.appId)) ||
      isSameHost(currentHost, ENVIRONMENT_HINTS.dev.host)) {
      return ENVIRONMENT_HINTS.dev.label;
    }

    if ((currentAppId && isSameGuid(currentAppId, ENVIRONMENT_HINTS.prod.appId)) ||
      isSameHost(currentHost, ENVIRONMENT_HINTS.prod.host)) {
      return ENVIRONMENT_HINTS.prod.label;
    }

    return "TEST";
  }

  function resolveEnvironmentKey() {
    const context = state.xrm?.Utility?.getGlobalContext?.();
    const clientUrl = context?.getClientUrl?.() || window.location.origin;
    const currentHost = getHostFromUrl(clientUrl);
    const currentAppId = getQueryParam("appid", window.location.href);

    if ((currentAppId && isSameGuid(currentAppId, ENVIRONMENT_HINTS.dev.appId)) ||
      isSameHost(currentHost, ENVIRONMENT_HINTS.dev.host)) {
      return "dev";
    }

    if ((currentAppId && isSameGuid(currentAppId, ENVIRONMENT_HINTS.prod.appId)) ||
      isSameHost(currentHost, ENVIRONMENT_HINTS.prod.host)) {
      return "prod";
    }

    return "";
  }

  function resolveFlowUploadUrl() {
    const environmentKey = resolveEnvironmentKey();
    return environmentKey ? CONFIG.flowUploadUrls[environmentKey] || "" : "";
  }

  function activatePanel(section) {
    el.tabs.forEach((tab) => {
      const active = tab.dataset.section === section;
      tab.classList.toggle("is-active", active);
      if (active) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    const panel = el.panels.find((item) => item.dataset.panel === section);
    panel?.classList.add("is-active");
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
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

    if (!validateFormDetailed()) return;

    state.saving = true;
    setLoading(true);
    el.submitButton.disabled = true;
    el.submitButtonText.textContent = "Enviando...";

    try {
      const payload = buildDataversePayload();
      const submission = await submitWithRetrySafety(payload);

      localStorage.removeItem(DRAFT_KEY);
      clearPendingSubmission(submission.recordId);
      el.successMessage.textContent = submission.message;
      el.successOverlay.hidden = false;
      el.form.reset();
      clearFilePreview();
      fillOptions();
      activatePanel("dados");
      toast(submission.toastMessage, "success");
      notifyHostSubmitted();
      refreshHostGrid();
      closeWebResourceAfterSubmit();
    } catch (error) {
      console.error(error);
      void reportAppError(error, {
        severity: "error",
        source: "curriculo-form",
        action: "submit",
        phase: "submit",
        component: "handleSubmit",
        screen: "curriculo",
        skipIfReported: true
      });
      toast(buildSubmitErrorMessage(error), "error", 12000);
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

  function validateFormDetailed() {
    clearValidationErrors();

    const invalid = findInvalidControl();
    if (invalid) {
      showFieldError(invalid.control, invalid.message);
      return false;
    }

    const file = el.arquivoCurriculo.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      showFieldError(el.arquivoCurriculo, `Arquivo do currículo inválido: ${file.name} tem ${formatBytes(file.size)}. Limite máximo: 10 MB.`);
      return false;
    }

    return true;
  }

  function clearValidationErrors() {
    el.form.querySelectorAll(".field.has-error").forEach((field) => {
      field.classList.remove("has-error");
    });
  }

  function clearFieldError(event) {
    event.target.closest?.(".field.has-error")?.classList.remove("has-error");
  }

  function findInvalidControl() {
    const requiredControls = [...el.form.querySelectorAll("[required]")];
    for (const control of requiredControls) {
      if (!value(control.id)) {
        return {
          control,
          message: `${getControlLabel(control)} não foi preenchido. Esse campo é obrigatório.`
        };
      }
    }

    const nota = $("nota");
    const rawNota = value("nota");
    const parsedNota = parseInteger(rawNota);
    if (rawNota && !parsedNota) {
      return {
        control: nota,
        message: "Nota inválida. Use número inteiro de 0 a 10, exemplo: 8."
      };
    }

    if (parsedNota && (parsedNota.value < 0 || parsedNota.value > 10)) {
      return {
        control: nota,
        message: "Nota inválida. O valor precisa estar entre 0 e 10."
      };
    }

    const nativeInvalid = [...el.form.elements].find((control) => {
      if (!control.name || control.type === "file") return false;
      return typeof control.checkValidity === "function" && !control.checkValidity();
    });

    if (nativeInvalid) {
      return {
        control: nativeInvalid,
        message: buildNativeValidationMessage(nativeInvalid)
      };
    }

    return null;
  }

  function showFieldError(control, message) {
    const field = control.closest(".field");
    const panel = control.closest(".panel");
    if (field) field.classList.add("has-error");
    if (panel) activatePanel(panel.dataset.panel);
    control.focus({ preventScroll: false });
    toast(message, "error", 12000);
  }

  function buildNativeValidationMessage(control) {
    const label = getControlLabel(control);
    const validity = control.validity;

    if (validity.typeMismatch) return `${label} inválido. Verifique o formato preenchido.`;
    if (validity.rangeUnderflow) return `${label} inválido. Valor mínimo: ${control.min}.`;
    if (validity.rangeOverflow) return `${label} inválido. Valor máximo: ${control.max}.`;
    if (validity.stepMismatch) return `${label} inválido. Use um valor compatível com o intervalo permitido.`;
    if (validity.badInput) return `${label} inválido. Use apenas números válidos.`;
    if (validity.patternMismatch) return `${label} inválido. O texto não segue o formato esperado.`;

    return `${label} inválido. ${control.validationMessage || "Revise o valor preenchido."}`;
  }

  function getControlLabel(control) {
    return control.closest(".field")?.querySelector("span")?.textContent?.replace("*", "").trim() || control.name || control.id || "Campo";
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
      [f.nota]: integerValue("nota"),
      [f.indicadoPor]: value("indicadoPor"),
      [f.disponibilidade]: optionValue("disponibilidade"),
      [f.categoriaCnh]: optionValue("categoriaCnh"),
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

  async function submitWithRetrySafety(payload) {
    const payloadSignature = buildPayloadSignature(payload);
    const pending = findPendingSubmission(payloadSignature);

    if (pending) {
      return resumePendingSubmission(pending, payload, payloadSignature);
    }

    let record;
    if (state.mockMode) {
      record = saveMockRecord(payload);
    } else {
      try {
        record = await state.xrm.WebApi.createRecord(CONFIG.tableLogicalName, payload);
      } catch (error) {
        void reportAppError(error, {
          severity: "error",
          source: "dataverse",
          action: "createRecord",
          phase: "record-create",
          component: "submitWithRetrySafety",
          detailType: CONFIG.tableLogicalName,
          payload
        });
        throw error;
      }
    }
    const recordId = record.id || record.recordId;

    if (el.arquivoCurriculo.files[0]) {
      savePendingSubmission({
        recordId,
        payloadSignature,
        phase: "record-created",
        fileName: el.arquivoCurriculo.files[0].name,
        createdAt: new Date().toISOString()
      });
    }

    return continueSubmission(recordId, payload, payloadSignature, false);
  }

  async function resumePendingSubmission(pending, payload, payloadSignature) {
    if (pending.phase === "upload-completed" && pending.webUrl) {
      await updateRecordLink(pending.recordId, pending.webUrl);
      return {
        recordId: pending.recordId,
        message: "Cadastro retomado e link do currículo gravado sem duplicar o upload.",
        toastMessage: "Cadastro concluído sem duplicar o registro."
      };
    }

    if (pending.fileName && !el.arquivoCurriculo.files[0]) {
      throw new Error(`Esse cadastro já foi criado e está aguardando o arquivo "${pending.fileName}". Anexe o arquivo para concluir sem duplicar o registro.`);
    }

    return continueSubmission(pending.recordId, payload, payloadSignature, true);
  }

  async function continueSubmission(recordId, payload, payloadSignature, resumed) {
    const uploadResult = await handleUpload(recordId, payload);

    if (uploadResult.webUrl) {
      savePendingSubmission({
        recordId,
        payloadSignature,
        phase: "upload-completed",
        fileName: el.arquivoCurriculo.files[0] ? el.arquivoCurriculo.files[0].name : "",
        webUrl: uploadResult.webUrl,
        uploadedAt: new Date().toISOString()
      });
      await updateRecordLink(recordId, uploadResult.webUrl);
    }

    return {
      recordId,
      message: resumed && uploadResult.uploaded
        ? uploadResult.webUrl
          ? "Cadastro retomado, arquivo enviado e link gravado sem duplicar o registro."
          : "Cadastro retomado e arquivo enviado sem duplicar o registro."
        : uploadResult.message,
      toastMessage: resumed
        ? "Cadastro concluído sem duplicar o registro."
        : "Currículo registrado."
    };
  }

  async function handleUpload(recordId, payload) {
    const file = el.arquivoCurriculo.files[0];
    if (!file) {
      return { uploaded: false, message: "Currículo registrado sem arquivo anexado." };
    }

    const flowUploadUrl = resolveFlowUploadUrl();
    if (!flowUploadUrl) {
      return {
        uploaded: false,
        message: "Currículo registrado. Upload pendente: ambiente não identificado para escolher o Flow."
      };
    }

    let filePayload;
    try {
      filePayload = await fileToPayload(file);
    } catch (error) {
      void reportAppError(error, {
        severity: "error",
        source: "file",
        action: "read-file",
        phase: "upload",
        component: "fileToPayload",
        payload: { file }
      });
      throw error;
    }

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
      indicadoPor: payload[CONFIG.fields.indicadoPor] || "",
      uploadedBy: getCurrentUserName(),
      uploadedAt: new Date().toISOString()
    };

    let response;
    try {
      response = await fetch(flowUploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flowPayload)
      });
    } catch (error) {
      void reportAppError(error, {
        severity: "error",
        source: "flow",
        action: "fetch",
        phase: "upload",
        component: "handleUpload",
        detailId: recordId,
        detailType: CONFIG.tableLogicalName,
        payload: {
          flowUrl: flowUploadUrl,
          flowPayload
        }
      });
      throw error;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Registro criado, mas o upload falhou. HTTP ${response.status}. ${errorText || "Sem detalhes no retorno do Flow."}`);
      error.status = response.status;
      void reportAppError(error, {
        severity: "error",
        source: "flow",
        action: "fetch-http",
        phase: "upload",
        component: "handleUpload",
        detailId: recordId,
        detailType: CONFIG.tableLogicalName,
        payload: {
          flowUrl: flowUploadUrl,
          status: response.status,
          statusText: response.statusText,
          errorText,
          flowPayload
        }
      });
      throw error;
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
      reader.onerror = () => reject(reader.error || new Error("Falha ao ler o arquivo."));
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

    try {
      await state.xrm.WebApi.updateRecord(CONFIG.tableLogicalName, recordId, {
        [CONFIG.fields.linkCurriculo]: webUrl
      });
    } catch (error) {
      void reportAppError(error, {
        severity: "error",
        source: "dataverse",
        action: "updateRecord",
        phase: "record-update-link",
        component: "updateRecordLink",
        detailId: recordId,
        detailType: CONFIG.tableLogicalName,
        payload: { webUrl }
      });
      throw error;
    }
  }

  async function parseFlowResponse(response) {
    const text = await response.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch (error) {
      void reportAppError(error, {
        severity: "warning",
        source: "flow",
        action: "parse-response",
        phase: "upload",
        component: "parseFlowResponse",
        payload: { responseText: text }
      });
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

  function buildPayloadSignature(payload) {
    const normalized = {};
    Object.keys(payload)
      .sort()
      .forEach((key) => {
        normalized[key] = payload[key];
      });
    return JSON.stringify(normalized);
  }

  function notifyPendingSubmission() {
    const pending = readPendingSubmission();
    if (!pending) return;

    toast("Existe um cadastro pendente de conclusão. Reenvie este mesmo candidato para continuar sem duplicar o registro.", "warning", 8000);
  }

  function findPendingSubmission(payloadSignature) {
    const pending = readPendingSubmission();
    if (!pending) return null;
    return pending.payloadSignature === payloadSignature ? pending : null;
  }

  function readPendingSubmission() {
    try {
      const raw = localStorage.getItem(PENDING_SUBMISSION_KEY);
      if (!raw) return null;

      const pending = JSON.parse(raw);
      if (!pending || typeof pending.recordId !== "string" || typeof pending.payloadSignature !== "string") {
        localStorage.removeItem(PENDING_SUBMISSION_KEY);
        return null;
      }

      return pending;
    } catch (_) {
      localStorage.removeItem(PENDING_SUBMISSION_KEY);
      return null;
    }
  }

  function savePendingSubmission(pending) {
    localStorage.setItem(PENDING_SUBMISSION_KEY, JSON.stringify(pending));
  }

  function clearPendingSubmission(recordId) {
    const pending = readPendingSubmission();
    if (!pending || !recordId || pending.recordId === recordId) {
      localStorage.removeItem(PENDING_SUBMISSION_KEY);
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

  function getHostFromUrl(value) {
    try {
      return new URL(value).hostname.toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function getQueryParam(name, url) {
    try {
      return new URL(url).searchParams.get(name) || "";
    } catch (_) {
      return "";
    }
  }

  function isSameGuid(a, b) {
    return normalizeGuid(a) === normalizeGuid(b);
  }

  function normalizeGuid(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function isSameHost(value, expectedHost) {
    return normalizeHost(value) === normalizeHost(expectedHost);
  }

  function normalizeHost(value) {
    return String(value || "").trim().toLowerCase();
  }

  function renderFilePreview() {
    clearFilePreview();
    const file = el.arquivoCurriculo.files[0];

    if (!file) {
      el.filePreview.hidden = true;
      updateUploadStatus();
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
    el.filePreview.querySelector(".file-preview-title").insertAdjacentHTML(
      "beforeend",
      '<span class="file-preview-status">Arquivo pronto para envio</span>'
    );
    updateUploadStatus(file);
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
    updateUploadStatus();
  }

  function updateUploadStatus(file = null) {
    if (!el.uploadStatus) return;
    el.uploadStatus.textContent = file
      ? `${file.name} selecionado (${formatBytes(file.size)}).`
      : "Nenhum arquivo selecionado.";
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
    const raw = value(id);
    if (raw === "") return null;
    const parsed = parseDecimal(raw);
    return parsed ? parsed.value : Number(raw.replace(",", "."));
  }

  function integerValue(id) {
    const raw = value(id);
    if (raw === "") return null;
    const parsed = parseInteger(raw);
    return parsed ? parsed.value : Number(raw);
  }

  function parseDecimal(raw) {
    const normalized = String(raw || "").trim().replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
    const value = Number(normalized);
    return Number.isFinite(value) ? { value } : null;
  }

  function parseInteger(raw) {
    const normalized = String(raw || "").trim();
    if (!/^\d+$/.test(normalized)) return null;
    const value = Number(normalized);
    return Number.isInteger(value) ? { value } : null;
  }

  function buildSubmitErrorMessage(error) {
    const rawMessage = error?.message || String(error || "") || "Falha ao enviar cadastro.";
    const fieldHint = findFieldHintInError(rawMessage);
    return fieldHint ? `${fieldHint}: ${rawMessage}` : rawMessage;
  }

  function findFieldHintInError(message) {
    const normalized = String(message || "").toLowerCase();
    const entries = Object.entries(CONFIG.fields);
    const found = entries.find(([, logicalName]) => normalized.includes(String(logicalName).toLowerCase()));
    if (!found) return "";

    const control = document.querySelector(`[name="${found[0]}"], #${found[0]}`);
    return control ? `Erro no campo ${getControlLabel(control)}` : `Erro no campo Dataverse ${found[1]}`;
  }

  function setLoading(active) {
    el.loadingOverlay.hidden = !active;
  }

  function refreshHostGrid() {
    const scopes = [window.parent, window.top, window.opener].filter(Boolean);

    for (const scope of scopes) {
      try {
        const grid = scope.Xrm?.Page?.getControl?.("grid");
        if (grid && typeof grid.refresh === "function") {
          grid.refresh();
          return true;
        }
      } catch (_) {
        continue;
      }
    }

    return false;
  }

  function notifyHostSubmitted() {
    const message = {
      type: "betinhos-curriculo-submitted",
      tableLogicalName: CONFIG.tableLogicalName,
      submittedAt: new Date().toISOString()
    };

    [window.parent, window.top, window.opener].filter(Boolean).forEach((target) => {
      try {
        target.postMessage(message, "*");
      } catch (_) {
        // Ignora hosts que bloqueiam postMessage.
      }
    });
  }

  function closeWebResourceAfterSubmit() {
    window.setTimeout(() => {
      try {
        window.close();
      } catch (_) {
        // O host do Model-driven App pode bloquear fechamento direto.
      }

      [window.parent, window.top].filter(Boolean).forEach((scope) => {
        try {
          const closeButton = scope.document.querySelector(
            'button[aria-label="Close"], button[aria-label="Fechar"], [data-id="dialogCloseIconButton"]'
          );
          closeButton?.click?.();
        } catch (_) {
          // Cross-frame ou host sem botão acessível.
        }
      });
    }, 2000);
  }

  function toast(message, type = "success", timeout = 4500) {
    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.innerHTML = `<span class="toast-message"></span><button class="toast-close" type="button" aria-label="Fechar">x</button>`;
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

  function sanitizeNotaInput(event) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 2);
    event.target.value = digits;
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

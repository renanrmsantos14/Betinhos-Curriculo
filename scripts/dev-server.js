const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_PORT = 4000;
const MAX_PORT_ATTEMPTS = 20;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

const args = process.argv.slice(2);
const requestedPort = Number(getArgValue("--port")) || Number(process.env.PORT) || DEFAULT_PORT;
const smoke = args.includes("--smoke");

startWithPortFallback(requestedPort, 0);

function startWithPortFallback(port, attempt) {
  const server = http.createServer(handleRequest);

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attempt < MAX_PORT_ATTEMPTS) {
      startWithPortFallback(port + 1, attempt + 1);
      return;
    }

    console.error(`[dev-server] Falha ao iniciar: ${error.message}`);
    process.exit(1);
  });

  server.listen(port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${port}/`;
    console.log(`[dev-server] Tela Curriculo local: ${url}`);
    console.log("[dev-server] Modo local usa mock quando Xrm nao existe.");

    if (smoke) {
      server.close(() => process.exit(0));
    }
  });
}

function handleRequest(request, response) {
  try {
    const requestUrl = new URL(request.url, "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = resolveSafePath(relativePath);

    if (!filePath) {
      sendText(response, 403, "Acesso negado.");
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        sendFile(response, path.join(ROOT, "index.html"));
        return;
      }

      sendFile(response, filePath);
    });
  } catch (error) {
    sendText(response, 500, error.message || "Erro no servidor local.");
  }
}

function resolveSafePath(relativePath) {
  const filePath = path.resolve(ROOT, relativePath);
  return filePath.startsWith(ROOT) ? filePath : "";
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendText(response, 404, "Arquivo nao encontrado.");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    response.end(content);
  });
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(message);
}

function getArgValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

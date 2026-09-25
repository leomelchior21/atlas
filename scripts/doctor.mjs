#!/usr/bin/env node
/**
 * ATLAS doctor
 *
 * Descobre por que o navegador não abre o ATLAS:
 *  1. se já existe um servidor ATLAS rodando, usa ele (não sobe outro);
 *  2. sobe o servidor se não existir;
 *  3. testa localhost, 127.0.0.1, IPv6 e o IP da rede local;
 *  4. mostra onde a porta está escutando e qual URL abrir.
 *
 *   npm run doctor            # porta padrão 3000
 *   npm run doctor -- 3010    # outra porta
 */
import { spawn, execSync } from "node:child_process";
import net from "node:net";
import os from "node:os";
import { existsSync } from "node:fs";

const requestedPort = Number(process.env.PORT ?? process.argv[2] ?? 3000);
const root = process.cwd();

const out = (text = "") => console.log(text);
const rule = () => out("─".repeat(66));

function portInUse(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const finish = (used) => {
      socket.destroy();
      resolve(used);
    };
    socket.setTimeout(600);
    socket.on("connect", () => finish(true));
    socket.on("timeout", () => finish(false));
    socket.on("error", () => finish(false));
  });
}

async function probe(url, timeout = 6000) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeout),
    });
    const body = await response.text();
    return {
      url,
      ok: response.ok && body.includes("ATLAS"),
      status: response.status,
      size: body.length,
      ms: Date.now() - started,
    };
  } catch (error) {
    return { url, ok: false, error: error.cause?.code ?? error.name };
  }
}

function describe(result) {
  return result.ok
    ? `HTTP ${result.status} · ${result.size} bytes · ATLAS ok · ${result.ms}ms`
    : `sem resposta (${result.error})`;
}

function listeningAddresses(port) {
  try {
    const output = execSync("netstat -ano -p TCP", { encoding: "utf8" });
    const rows = [];
    for (const line of output.split(/\r?\n/)) {
      const columns = line.trim().split(/\s+/);
      if (columns.length < 5) continue;
      const [proto, local, , state, pid] = columns;
      if (proto !== "TCP" || state !== "LISTENING") continue;
      if (!local.endsWith(`:${port}`)) continue;
      rows.push(`${local}  (PID ${pid})`);
    }
    return [...new Set(rows)];
  } catch {
    return [];
  }
}

function lanAddresses() {
  const result = [];
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) result.push(address.address);
    }
  }
  return result;
}

function urlsFor(port) {
  return [
    `http://localhost:${port}/`,
    `http://127.0.0.1:${port}/`,
    `http://[::1]:${port}/`,
    ...lanAddresses().map((address) => `http://${address}:${port}/`),
  ];
}

async function report(port, keepAlive) {
  const targets = urlsFor(port);
  const results = await Promise.all(targets.map((url) => probe(url)));

  out("");
  out("RESULTADO");
  rule();
  for (const result of results) {
    out(`${result.ok ? "OK  " : "--  "} ${result.url.padEnd(32)} ${describe(result)}`);
  }
  rule();
  out("A porta está escutando em:");
  const listening = listeningAddresses(port);
  for (const entry of listening) out(`  ${entry}`);
  if (!listening.length) out("  (nenhum socket encontrado na porta)");
  out("");

  const working = results.filter((result) => result.ok).map((result) => result.url);
  const localhostOk = results.some((r) => r.ok && r.url.includes("//localhost"));
  const ipv4Ok = results.some((r) => r.ok && r.url.includes("127.0.0.1"));
  const ipv6Ok = results.some((r) => r.ok && r.url.includes("[::1]"));
  const lanOk = results.some((r) => r.ok && !r.url.includes("localhost") && !r.url.includes("127.0.0.1") && !r.url.includes("[::1]"));

  if (working.length) {
    out("ABRA ESTE ENDEREÇO NO NAVEGADOR:");
    for (const url of working) out(`  ${url}`);
    out("");
  } else {
    out("Nenhum endereço respondeu. Veja as mensagens do servidor acima.");
    out("");
  }

  if (!localhostOk && ipv4Ok) {
    out("Aviso: 'localhost' não respondeu, mas 127.0.0.1 sim.");
    out("No Windows, localhost costuma resolver para ::1 (IPv6). Use http://127.0.0.1 no navegador.");
    out("");
  }
  if (!ipv6Ok && ipv4Ok) {
    out("Aviso: IPv6 (::1) não respondeu — normal, o servidor está em IPv4.");
    out("");
  }
  if (lanOk) {
    out("Para abrir no iPad/celular (mesma rede wi-fi), use o endereço 192.168.x.x acima.");
    out("Se não abrir em outro aparelho: libere o node.exe no Firewall do Windows");
    out("(Firewall → Permitir um aplicativo → Node.js).");
    out("");
  }
  if (keepAlive) out("O servidor continua rodando. Ctrl+C para encerrar.");
}

async function findRunningAtlas(start, span = 4) {
  for (let port = start; port < start + span; port++) {
    // eslint-disable-next-line no-await-in-loop
    const result = await probe(`http://127.0.0.1:${port}/`, 1200);
    if (result.ok) return port;
  }
  return null;
}

async function main() {
  out();
  out("ATLAS · DIAGNÓSTICO");
  rule();
  out(`pasta         : ${root}`);
  out(`node          : ${process.version} (${process.platform}/${process.arch})`);
  out(`dependências  : ${existsSync("node_modules/next") ? "next instalado" : "FALTA npm install"}`);
  out(`porta pedida  : ${requestedPort}`);
  rule();

  if (!existsSync("node_modules/next")) {
    out("Rode 'npm install' na pasta do projeto e tente novamente.");
    process.exitCode = 1;
    return;
  }

  const existing = await findRunningAtlas(requestedPort);
  if (existing) {
    out(`Já existe um servidor ATLAS rodando na porta ${existing}.`);
    out("Usando ele — não é preciso subir outro (o Next 16 recusa dois dev servers na mesma pasta).");
    await report(existing, false);
    const listening = listeningAddresses(existing);
    if (listening.length) {
      out("Para derrubar esse servidor e começar do zero:");
      const pid = listening[0]?.match(/PID (\d+)/)?.[1];
      if (pid) out(`  taskkill /PID ${pid} /F`);
      out("");
    }
    return;
  }

  let port = requestedPort;
  for (let candidate = requestedPort; candidate < requestedPort + 12; candidate++) {
    // eslint-disable-next-line no-await-in-loop
    if (!(await portInUse(candidate))) {
      port = candidate;
      break;
    }
  }
  if (port !== requestedPort) out(`Porta ${requestedPort} ocupada. Usando a porta ${port}.`);

  out(`subindo: npx next dev -p ${port}`);
  out("");

  const child = spawn(`npx next dev -p ${port}`, {
    cwd: root,
    stdio: ["ignore", "inherit", "inherit"],
    shell: true,
  });

  let finished = false;
  const shutdown = () => {
    if (finished) return;
    finished = true;
    child.kill();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  child.on("exit", (code) => {
    finished = true;
    out("");
    out(`servidor encerrado (código ${code ?? 0})`);
    process.exit(0);
  });

  const targets = urlsFor(port);
  for (let attempt = 0; attempt < 90; attempt++) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // eslint-disable-next-line no-await-in-loop
    const results = await Promise.all(targets.map((url) => probe(url, 4000)));
    if (results.some((result) => result.ok)) {
      await report(port, true);
      return;
    }
    if (finished) return;
  }

  out("");
  out("Nenhum endereço respondeu em 90 segundos. Veja o erro do next dev acima.");
}

main().catch((error) => {
  console.error("Falha no diagnóstico:", error);
  process.exit(1);
});

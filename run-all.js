const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("\x1b[1m\x1b[36m%s\x1b[0m", `
╔══════════════════════════════════════════════════════════════════╗
║                     FIN TWIN AI UNIFIED RUNNER                   ║
║                                                                  ║
║  All services are accessible through a single host:              ║
║  👉 http://localhost:3000                                        ║
║                                                                  ║
║  - Web Application:     http://localhost:3000                    ║
║  - Backend API Gateway: http://localhost:3000/api                ║
║  - ML Forecasting:      http://localhost:3000/ml                 ║
╚══════════════════════════════════════════════════════════════════╝
`);

// Safeguard: Free up ports if lingering from previous run
function freePort(port) {
  try {
    const isWindows = process.platform === "win32";
    if (isWindows) {
      const stdout = require("child_process").execSync(`netstat -ano | findstr :${port}`, { encoding: "utf-8" });
      const lines = stdout.split("\n");
      for (const line of lines) {
        if (line.includes("LISTENING")) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0" && pid !== String(process.pid)) {
            require("child_process").execSync(`taskkill /F /PID ${pid} /T`, { stdio: "ignore" });
          }
        }
      }
    }
  } catch (e) {}
}

[3000, 5000, 8000].forEach(freePort);

const children = [];

function runProcess(name, command, args, cwd, color) {
  const isWindows = process.platform === "win32";
  const proc = spawn(command, args, {
    cwd: path.resolve(__dirname, cwd),
    shell: isWindows,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  proc.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((l) => {
      if (l.trim()) console.log(`${color}[${name}]\x1b[0m ${l}`);
    });
  });

  proc.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((l) => {
      if (l.trim()) console.log(`${color}[${name}]\x1b[0m ${l}`);
    });
  });

  proc.on("close", (code) => {
    console.log(`${color}[${name}]\x1b[0m process exited with code ${code}`);
  });

  children.push(proc);
  return proc;
}

// 1. Determine ML Service uvicorn executable
const venvUvicorn = path.resolve(__dirname, "ml-service/venv/Scripts/uvicorn.exe");
const mlCommand = fs.existsSync(venvUvicorn) ? venvUvicorn : "uvicorn";

console.log("\x1b[33mStarting Python ML Microservice (FastAPI + XGBoost)... \x1b[0m");
runProcess("ML-SERVICE", mlCommand, ["app.main:app", "--host", "127.0.0.1", "--port", "8000"], "ml-service", "\x1b[35m");

// 2. Start Backend (Express + MongoDB)
console.log("\x1b[33mStarting Node/Express Backend Service... \x1b[0m");
runProcess("BACKEND", "npx", ["tsx", "src/index.ts"], "backend", "\x1b[36m");

// 3. Start Frontend (Next.js on port 3000)
console.log("\x1b[33mStarting Next.js Frontend (Serving on http://localhost:3000)... \x1b[0m");
runProcess("FRONTEND", "npm", ["run", "dev"], "frontend", "\x1b[32m");

// Cleanup on termination
function cleanup() {
  console.log("\n\x1b[31mShutting down all FinTwin AI services...\x1b[0m");
  children.forEach((c) => {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", c.pid, "/f", "/t"]);
      } else {
        c.kill("SIGTERM");
      }
    } catch (e) {}
  });
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

import app from "./app";
import { logger } from "./lib/logger";

// Manipuladores de emergência para exceções e rejeições não tratadas
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Rejection detectado no processo Node.js");
});

process.on("uncaughtException", (error) => {
  logger.error({ error }, "Uncaught Exception detectado no processo Node.js");
});

const rawPort = process.env["PORT"] || "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Valor inválido de PORT: "${rawPort}"`);
}

app.listen(port, (err?: any) => {
  if (err) {
    logger.error({ err }, "Erro ao iniciar o servidor na porta");
    process.exit(1);
  }

  logger.info({ port }, "Servidor Backend escutando com segurança");
});

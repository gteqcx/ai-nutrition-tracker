import { defineConfig, env } from "prisma/config";

// Prisma 7 не загружает .env автоматически при наличии config-файла.
// На VPS переменные задаются окружением, .env может отсутствовать.
try {
  process.loadEnvFile(".env");
} catch {
  // ignore — .env не обязателен
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});

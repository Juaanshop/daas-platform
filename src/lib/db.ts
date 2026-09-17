import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// En entornos serverless como Vercel, el sistema de archivos raíz es de solo lectura.
// Si se utiliza SQLite local (DATABASE_URL con prefijo file:), aseguramos que exista
// una copia escribible en /tmp/dev.db inicializada desde prisma/template.db.
if (process.env.VERCEL) {
  const currentDbUrl = process.env.DATABASE_URL || "file:./dev.db";
  if (currentDbUrl.startsWith("file:")) {
    const tmpDbPath = "/tmp/dev.db";
    if (!fs.existsSync(tmpDbPath)) {
      const templateDbPath = path.join(process.cwd(), "prisma", "template.db");
      if (fs.existsSync(/*turbopackIgnore: true*/ templateDbPath)) {
        try {
          fs.copyFileSync(templateDbPath, tmpDbPath);
        } catch (err) {
          console.error("Error al copiar base de datos inicial a /tmp:", err);
        }
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

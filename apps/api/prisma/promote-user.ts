import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const [emailValue, roleValue] = process.argv.slice(2);
const email = emailValue?.trim().toLowerCase();
const role =
  roleValue === "admin" ? "admin" : roleValue === "editor" ? "editor" : null;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("DATABASE_URL is required.");
if (!email || !role)
  throw new Error("Usage: pnpm admin:promote <email> <editor|admin>");
const targetRole: "admin" | "editor" = role;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function promote(): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user) throw new Error("User not found. Register the account first.");
  if (user.role === targetRole) {
    console.log(`User already has the ${targetRole} role.`);
    return;
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: targetRole } }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        event: `role_changed_to_${targetRole}_by_cli`,
      },
    }),
  ]);
  console.log(`Role changed to ${targetRole}.`);
}

void promote()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Promotion failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

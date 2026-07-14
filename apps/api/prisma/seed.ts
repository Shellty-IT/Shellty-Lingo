import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function seed(): Promise<void> {
  await prisma.systemMetadata.upsert({
    where: { key: "foundation_version" },
    update: { value: "stage-2" },
    create: { key: "foundation_version", value: "stage-2" },
  });
}

seed()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error("Database seed failed", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });

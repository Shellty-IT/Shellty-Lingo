import "dotenv/config";
import "reflect-metadata";
import { writeFileSync } from "node:fs";

import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "../src/app.module";

/**
 * Generates the OpenAPI document without starting an HTTP listener. Run via
 * `pnpm --filter @shellty/api openapi:generate`; CI publishes the output as
 * a build artifact so a contract change is visible in the PR diff.
 */
async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle("Shellty Lingo API")
    .setDescription(
      "REST API for the Shellty Lingo mobile app and admin panel.",
    )
    .setVersion(process.env.APP_VERSION ?? "development")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync("openapi.json", `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

void main().catch((error: unknown) => {
  console.error("OpenAPI generation failed", error);
  process.exitCode = 1;
});

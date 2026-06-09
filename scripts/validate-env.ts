import { validateEnv } from "@/lib/env";

const result = validateEnv({ strict: true });

if (!result.ok) {
  console.error("Missing required environment variables:");
  for (const name of result.missing) {
    console.error(`  - ${name}`);
  }
  process.exit(1);
}

if (result.warnings.length > 0) {
  console.warn("Recommended environment variables not set:");
  for (const name of result.warnings) {
    console.warn(`  - ${name}`);
  }
}

console.log("Environment validation passed.");

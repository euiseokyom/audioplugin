export interface EnvValidationResult {
  ok: boolean;
  missing: string[];
  warnings: string[];
}

const REQUIRED_PRODUCTION = [
  "MONGODB_URI",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "ADMIN_EMAILS",
] as const;

const RECOMMENDED = ["NEXT_PUBLIC_SITE_URL", "DISCORD_WEBHOOK_URL"] as const;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function isSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export function validateEnv(options?: { strict?: boolean }): EnvValidationResult {
  const strict = options?.strict ?? isProduction();
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const name of REQUIRED_PRODUCTION) {
    if (!isSet(name)) {
      if (strict) missing.push(name);
      else warnings.push(`${name} (required in production)`);
    }
  }

  for (const name of RECOMMENDED) {
    if (!isSet(name)) warnings.push(name);
  }

  return { ok: missing.length === 0, missing, warnings };
}

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }
  return uri;
}

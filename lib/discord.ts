import { absoluteUrl } from "@/lib/site-url";
import { logger } from "@/lib/logger";

export type DiscordEmbedColor = "success" | "warning" | "error" | number;

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedOptions {
  title: string;
  description?: string;
  fields?: DiscordEmbedField[];
  color?: DiscordEmbedColor;
  timestamp?: Date | string;
  footer?: string;
  url?: string;
}

const COLOR_MAP: Record<"success" | "warning" | "error", number> = {
  success: 0x57f287,
  warning: 0xfee75c,
  error: 0xed4245,
};

const MAX_FIELD_LENGTH = 1024;

function resolveColor(color?: DiscordEmbedColor): number | undefined {
  if (color === undefined) return undefined;
  if (typeof color === "number") return color;
  return COLOR_MAP[color];
}

function truncate(value: string, max = MAX_FIELD_LENGTH): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export async function sendDiscordEmbed(
  webhookUrl: string,
  options: DiscordEmbedOptions
): Promise<{ ok: boolean; status?: number }> {
  const embed: Record<string, unknown> = {
    title: options.title,
    color: resolveColor(options.color),
  };

  if (options.description) embed.description = truncate(options.description);
  if (options.url) embed.url = options.url;
  if (options.timestamp) {
    embed.timestamp =
      options.timestamp instanceof Date
        ? options.timestamp.toISOString()
        : options.timestamp;
  }
  if (options.footer) embed.footer = { text: options.footer };
  if (options.fields?.length) {
    embed.fields = options.fields.map((field) => ({
      name: field.name,
      value: truncate(field.value),
      inline: field.inline ?? false,
    }));
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      logger.warn("Discord webhook failed", { status: response.status });
    }

    return { ok: response.ok, status: response.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Discord webhook error", { error: message });
    return { ok: false };
  }
}

export function adminDashboardUrl(): string {
  return absoluteUrl("/admin");
}

export async function sendDiscordAlert(
  options: DiscordEmbedOptions
): Promise<{ ok: boolean; status?: number } | null> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhookUrl) return null;
  return sendDiscordEmbed(webhookUrl, options);
}

import type { Retailer } from "@/types";

export const RETAILERS: Retailer[] = [
  {
    slug: "plugin-boutique",
    name: "Plugin Boutique",
    baseUrl: "https://www.pluginboutique.com",
    logoUrl: "/logos/plugin-boutique.png",
  },
  {
    slug: "sweetwater",
    name: "Sweetwater",
    baseUrl: "https://www.sweetwater.com",
    logoUrl: "/logos/sweetwater.svg",
  },
  {
    slug: "plugin-alliance",
    name: "Plugin Alliance",
    baseUrl: "https://www.plugin-alliance.com",
    logoUrl: "/logos/plugin-alliance.svg",
  },
  {
    slug: "adsr",
    name: "ADSR Sounds",
    baseUrl: "https://www.adsrsounds.com",
    logoUrl: "/logos/adsr.svg",
  },
  {
    slug: "plugin-fox",
    name: "PluginFox",
    baseUrl: "https://www.pluginfox.com",
    logoUrl: "/logos/pluginfox.png",
  },
  {
    slug: "thomann",
    name: "Thomann",
    baseUrl: "https://www.thomann.de",
    logoUrl: "/logos/thomann.png",
  },
  {
    slug: "waves",
    name: "Waves",
    baseUrl: "https://www.waves.com",
    logoUrl: "/logos/waves.svg",
    isManufacturerDirect: true,
  },
  {
    slug: "native-instruments",
    name: "Native Instruments",
    baseUrl: "https://www.native-instruments.com",
    logoUrl: "/logos/native-instruments.svg",
    isManufacturerDirect: true,
  },
  {
    slug: "gear4music",
    name: "Gear4music",
    baseUrl: "https://www.gear4music.com",
    logoUrl: "/logos/gear4music.png",
  },
  {
    slug: "zzounds",
    name: "zZounds",
    baseUrl: "https://www.zzounds.com",
    logoUrl: "/logos/zzounds.svg",
  },
  {
    slug: "audio-deluxe",
    name: "Audio Deluxe",
    baseUrl: "https://www.audiodeluxe.com",
    logoUrl: "/logos/audio-deluxe.png",
  },
  {
    slug: "best-service",
    name: "Best Service",
    baseUrl: "https://www.bestservice.com",
    logoUrl: "/logos/best-service.png",
  },
];

export const RETAILER_MAP = Object.fromEntries(
  RETAILERS.map((r) => [r.slug, r])
) as Record<string, Retailer>;

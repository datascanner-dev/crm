/**
 * Single source of truth for the color-theme catalog.
 *
 * The CSS variables themselves live in `src/app/globals.css` under
 * `html[data-theme="..."]` blocks — that file is the one we paste
 * theme tokens into. This module only carries the metadata the UI
 * (settings picker, no-flash boot script) needs.
 *
 * Adding a new theme is a two-step change:
 *   1. Append the new `html[data-theme="<id>"]` block in globals.css
 *      with every token from an existing theme (use violet as the
 *      shape reference).
 *   2. Add an entry below. The order here drives the picker grid.
 */

export const THEME_IDS = [
  "datascanner",
  "violet",
  "emerald",
  "cobalt",
  "amber",
  "rose",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "datascanner";

// Chave nova para que todos comecem no tema Data Scanner após a
// reformulação visual; a escolha de modo (claro/escuro) é preservada.
export const STORAGE_KEY = "dscrm.theme";

/**
 * MODE — the light/dark dimension, orthogonal to the accent theme.
 *
 * The CSS variables live in `src/app/globals.css` under
 * `html[data-mode="..."]` blocks (neutral surfaces only). Applied
 * at runtime via `document.documentElement.dataset.mode`. Dark is
 * the historical default and stays the app's identity; light is the
 * opt-in eye-strain-friendly alternative.
 *
 * Persisted under its own localStorage key so it composes freely
 * with the accent choice (you can run Violet-light or Violet-dark).
 */
export const MODES = ["light", "dark"] as const;

export type Mode = (typeof MODES)[number];

export const DEFAULT_MODE: Mode = "dark";

export const MODE_STORAGE_KEY = "wacrm.mode";

export function isMode(value: unknown): value is Mode {
  return (
    typeof value === "string" && (MODES as ReadonlyArray<string>).includes(value)
  );
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  /**
   * Static swatch color for the picker chip. Hard-coded so the boot
   * script / picker cards don't need a getComputedStyle round trip
   * before the page settles. Must mirror `--primary` of the same
   * theme in globals.css.
   */
  swatch: string;
}

export const THEMES: ReadonlyArray<ThemeMeta> = [
  {
    id: "datascanner",
    name: "Data Scanner",
    tagline: "Padrão: o laranja da marca Data Scanner.",
    swatch: "oklch(0.661 0.229 35.5)",
  },
  {
    id: "violet",
    name: "Violeta",
    tagline: "Confiante, com um toque divertido.",
    swatch: "oklch(0.526 0.247 293)",
  },
  {
    id: "emerald",
    name: "Esmeralda",
    tagline: "Remete a crescimento e mensagens, sem copiar o verde do WhatsApp.",
    swatch: "oklch(0.62 0.16 162)",
  },
  {
    id: "cobalt",
    name: "Cobalto",
    tagline: "Azul limpo de SaaS B2B, calmo e profissional.",
    swatch: "oklch(0.585 0.2 254)",
  },
  {
    id: "amber",
    name: "Âmbar",
    tagline: "Quente e acolhedor, combina com pequenas empresas.",
    swatch: "oklch(0.745 0.16 65)",
  },
  {
    id: "rose",
    name: "Rosa",
    tagline: "Ousado e moderno, para D2C e lifestyle.",
    swatch: "oklch(0.645 0.22 16)",
  },
];

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEME_IDS as ReadonlyArray<string>).includes(value)
  );
}

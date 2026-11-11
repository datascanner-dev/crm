// Nome legível da origem do lead (utm_source): "whatsapp" → "WhatsApp".

const KNOWN: Record<string, string> = {
  whatsapp: "WhatsApp",
  wa: "WhatsApp",
  instagram: "Instagram",
  ig: "Instagram",
  facebook: "Facebook",
  fb: "Facebook",
  meta: "Meta",
  google: "Google",
  googleads: "Google Ads",
  google_ads: "Google Ads",
  adwords: "Google Ads",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  yt: "YouTube",
  tiktok: "TikTok",
  twitter: "X (Twitter)",
  x: "X (Twitter)",
  email: "E-mail",
  "e-mail": "E-mail",
  newsletter: "Newsletter",
  bing: "Bing",
  direct: "Direto",
  direto: "Direto",
  organic: "Orgânico",
  organico: "Orgânico",
  base_sc: "Base Sales Club",
};

export function sourceLabel(raw?: string | null): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const known = KNOWN[v.toLowerCase().replace(/\s+/g, "")];
  if (known) return known;
  // Desconhecida: troca _ e - por espaço e põe a 1ª letra de cada palavra em maiúscula.
  return v
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Remove o sufixo automático " — LP Data Scanner" dos títulos de negócio. */
export function stripLpSuffix(title?: string | null): string {
  return (title ?? "").replace(/\s*[—–-]\s*LP Data Scanner\s*$/i, "").trim();
}

// BCP 47 tag used for dates, numbers and <html lang>. NEXT_PUBLIC_APP_LOCALE
// holds the catalogue id (en | ko | pt | es); this maps it to a full tag so
// formatting follows the app language, not the browser's.
const TAGS: Record<string, string> = {
  en: "en-US",
  ko: "ko-KR",
  pt: "pt-BR",
  es: "es-419",
};

export const APP_INTL_LOCALE: string =
  TAGS[process.env.NEXT_PUBLIC_APP_LOCALE ?? "en"] ?? "en-US";

export function intlLocale(locale?: string | null): string {
  return (locale && TAGS[locale]) || APP_INTL_LOCALE;
}

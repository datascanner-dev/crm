import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { cn } from "@/lib/utils";

// Shared frame for the auth screens (login / signup).
//
// Mobile (< sm): full-bleed Data Scanner hero in the brand orange with
// the white logo, title and description, and the form on a sheet with
// rounded top corners that overlaps the hero, like a native app.
// Desktop (sm+): logo above a centered card, as before.
//
// The hero uses the darker brand orange (same as --primary in the
// datascanner theme) so white text keeps AA contrast (4.7:1); the pure
// #ff4602 only appears in the decorative glow and symbol.
export function AuthShell({
  title,
  description,
  badge,
  icon,
  children,
  footer,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Small pill above the mobile title (e.g. "Convite para equipe"). */
  badge?: ReactNode;
  /** Icon shown in the desktop card header. Defaults to the brand mark. */
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background sm:items-center sm:justify-center sm:px-4 sm:py-10">
      {/* Mobile hero */}
      <header className="relative isolate overflow-hidden bg-[oklch(0.58_0.21_35.5)] px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-14 text-center text-white sm:hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-[#ff4602] blur-3xl"
        />
        <BrandMark
          className="pointer-events-none absolute -right-14 -bottom-16 -z-10 size-56 opacity-20 brightness-0 invert"
        />
        <BrandWordmark tone="mono" className="mx-auto h-8" />
        <div className="mt-9 flex flex-col items-center">
          {badge && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
              {badge}
            </span>
          )}
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-xs text-base text-white/90">{description}</p>
          )}
        </div>
      </header>

      {/* Desktop logo */}
      <BrandWordmark className="mb-8 hidden h-8 text-foreground sm:block" />

      <main
        className={cn(
          "relative -mt-6 flex-1 rounded-t-3xl bg-background px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]",
          "sm:mt-0 sm:w-full sm:max-w-md sm:flex-none sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-8",
        )}
      >
        {/* Desktop header (mobile shows it in the hero) */}
        <div className="mb-6 hidden flex-col items-center text-center sm:flex">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
            {icon ?? <BrandMark className="size-6" />}
          </div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children}
        {footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </main>
    </div>
  );
}

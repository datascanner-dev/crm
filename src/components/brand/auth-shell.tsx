import type { ReactNode } from "react";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { CardGlow, CardGlowSpill } from "@/components/brand/card-glow";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Moldura das telas de login e cadastro: o cartão centralizado original,
// com o logo completo do Data Scanner centralizado no topo (no lugar do
// ícone pequeno). Mesmo layout no mobile e no desktop.
//
// `glow`: acrescenta só o efeito de luz por cima do cartão (ver
// card-glow.tsx). Puramente decorativo: não muda o conteúdo
// do cartão nem recebe cliques.
export function AuthShell({
  title,
  description,
  children,
  footer,
  glow = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-dvh items-center justify-center bg-background px-4",
        glow ? "overflow-hidden pt-56 pb-8" : "py-8",
      )}
    >
      <div className="relative w-full max-w-md">
        {glow && <CardGlow />}
        <Card className="w-full max-w-md rounded-[24px] border-border bg-card">
          <CardHeader className="justify-items-center text-center">
            <BrandWordmark className="mb-4 h-8 text-foreground" />
            <CardTitle className="text-xl text-foreground">{title}</CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {children}
            {footer && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {footer}
              </p>
            )}
          </CardContent>
        </Card>
        {glow && <CardGlowSpill />}
      </div>
    </div>
  );
}

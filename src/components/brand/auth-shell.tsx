import type { ReactNode } from "react";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Moldura das telas de login e cadastro: o cartão centralizado original,
// com o logo completo do Data Scanner centralizado no topo (no lugar do
// ícone pequeno). Mesmo layout no mobile e no desktop.
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md rounded-[12px] border-border bg-card">
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
    </div>
  );
}

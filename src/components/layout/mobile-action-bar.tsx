import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Barra de ação fixa na base da tela, só no mobile (< sm).
//
// Fica acima de todo o conteúdo (z-[35]: acima do cabeçalho sticky z-30,
// abaixo da gaveta do menu z-40 e dos modais z-50), com fundo de ponta a
// ponta. Os botões dentro dela ocupam a largura toda — um botão sozinho
// fica com 100%, dois dividem 50/50.
//
// Renderiza também um espaçador no fluxo da página para o último item da
// lista não ficar escondido atrás da barra.
export function MobileActionBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <div aria-hidden="true" className="h-16 sm:hidden" />
      <div
        data-slot="mobile-action-bar"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[35] flex gap-2 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(0_0_0/0.12)] backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:hidden",
          "[&>*]:min-w-0 [&>*]:flex-1 [&_[data-slot=button]]:h-12 [&_[data-slot=button]]:w-full [&_[data-slot=button]]:text-base",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}

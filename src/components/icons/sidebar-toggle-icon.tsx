import { cn } from "@/lib/utils";

// Ícone de abrir/recolher o menu no mesmo desenho do painel da Cloudflare:
// um painel arredondado com a divisória da barra lateral.
export function SidebarToggleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className={cn("size-[18px] shrink-0", className)}
    >
      <path d="M21.25 6.72v10.56a2.97 2.97 0 0 1-2.97 2.97H5.72a2.97 2.97 0 0 1-2.97-2.97V6.72a2.97 2.97 0 0 1 2.97-2.97h12.56a2.97 2.97 0 0 1 2.97 2.97" />
      <path d="M6.25 7.25v9.5" />
    </svg>
  );
}

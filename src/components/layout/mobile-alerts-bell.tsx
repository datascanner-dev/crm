"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell, GitBranch } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNewAssignedDeals } from "@/hooks/use-new-assigned-deals";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { cn } from "@/lib/utils";

function Count({ n, className }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return (
    <span
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground",
        className,
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

/**
 * Sino do cabeçalho — só no mobile, onde o menu lateral fica escondido.
 * O badge soma negócios novos atribuídos a mim + notificações não lidas;
 * ao tocar, abre os atalhos para cada um.
 */
export function MobileAlertsBell() {
  const t = useTranslations("Header");
  const newDeals = useNewAssignedDeals();
  const unread = useUnreadNotifications();
  const total = newDeals + unread;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("bellLabel", { count: total })}
        className="relative flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-popup-open:bg-muted lg:hidden"
      >
        <Bell className="h-5 w-5" />
        <Count n={total} className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] text-[10px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-auto min-w-64 bg-popover text-popover-foreground ring-border"
      >
        <DropdownMenuItem
          render={<Link href="/pipelines" className="min-h-11 text-popover-foreground" />}
        >
          <GitBranch className="size-4" />
          <span className="flex-1">{t("bellNewDeals")}</span>
          <Count n={newDeals} />
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href="/notifications" className="min-h-11 text-popover-foreground" />}
        >
          <Bell className="size-4" />
          <span className="flex-1">{t("bellNotifications")}</span>
          <Count n={unread} />
        </DropdownMenuItem>
        {total === 0 && (
          <p className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground">{t("bellEmpty")}</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

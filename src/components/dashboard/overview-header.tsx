'use client'

import { useRouter } from 'next/navigation'
import { Briefcase, ChevronDown, ChevronRight, Plus, Radio, UserPlus, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { MobileActionBar } from '@/components/layout/mobile-action-bar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  OVERVIEW_RANGES,
  minutesBetween,
  needsSetup,
  type DashboardOverview,
  type OverviewRange,
} from '@/lib/dashboard/overview'
import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'
import { useFormatDuration } from './use-format-duration'
import { WhatsAppHealthChip } from './whatsapp-health-chip'

const NEW_ITEMS = [
  { key: 'newContact', href: '/contacts', icon: UserPlus },
  { key: 'newDeal', href: '/pipelines', icon: Briefcase },
  { key: 'newBroadcast', href: '/broadcasts/new', icon: Radio },
  { key: 'newAutomation', href: '/automations/new', icon: Zap },
] as const

function partOfDay(date: Date): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

export function OverviewHeader({
  data,
  now,
  name,
  range,
  onRangeChange,
}: {
  data: DashboardOverview | null
  now: number
  name: string | null
  range: OverviewRange
  onRangeChange: (range: OverviewRange) => void
}) {
  const t = useTranslations('Dashboard.overview.header')
  const router = useRouter()
  const formatDuration = useFormatDuration()
  const firstName = name?.trim().split(/\s+/)[0] || null
  const [newSheetOpen, setNewSheetOpen] = useState(false)

  let context: string | null = null
  if (data) {
    const a = data.attention
    if (needsSetup(data.setup)) context = t('contextSetup')
    else if (a.waiting > 0 && a.oldestWaitingSince)
      context = t('contextWaiting', {
        count: a.waiting,
        wait: formatDuration(minutesBetween(a.oldestWaitingSince, now)),
      })
    else context = t('contextClear')
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {data ? (
          <>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {firstName
                ? t(`greeting.${partOfDay(new Date(now))}`, { name: firstName })
                : t(`greetingNoName.${partOfDay(new Date(now))}`)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{context}</p>
          </>
        ) : (
          <>
            <Skeleton className="h-6 w-56" />
            <Skeleton className="mt-2 h-4 w-80" />
          </>
        )}
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <WhatsAppHealthChip />
        {/* No mobile o seletor de período ocupa a largura toda. */}
        <Tabs
          value={String(range)}
          onValueChange={(v) => onRangeChange(Number(v) as OverviewRange)}
          className="w-full sm:w-auto"
        >
          <TabsList aria-label={t('rangeLabel')} className="w-full group-data-horizontal/tabs:h-12 sm:w-fit">
            {OVERVIEW_RANGES.map((r) => (
              <TabsTrigger key={r} value={String(r)} className="flex-1 px-3 text-sm sm:flex-none">
                {t(`range.${r}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {/* Desktop: menu suspenso. Mobile: botão fixo na base + painel deslizante. */}
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants(), 'hidden sm:inline-flex')}>
            <Plus aria-hidden />
            {t('new')}
            <ChevronDown className="opacity-70" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {NEW_ITEMS.map(({ key, href, icon: Icon }) => (
              <DropdownMenuItem key={key} onClick={() => router.push(href)}>
                <Icon aria-hidden />
                {t(key)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MobileActionBar>
        <Button onClick={() => setNewSheetOpen(true)} aria-haspopup="dialog">
          <Plus aria-hidden />
          {t('new')}
        </Button>
      </MobileActionBar>
      <Sheet open={newSheetOpen} onOpenChange={setNewSheetOpen}>
        <SheetContent
          side="bottom"
          className="gap-0 rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden [&_[data-slot=sheet-close]]:top-3 [&_[data-slot=sheet-close]]:right-3 [&_[data-slot=sheet-close]]:size-11"
        >
          <SheetHeader className="px-5 pt-5 pb-3 pr-14">
            <SheetTitle className="text-lg font-semibold">{t('new')}</SheetTitle>
          </SheetHeader>
          <ul className="flex flex-col px-3 pb-2">
            {NEW_ITEMS.map(({ key, href, icon: Icon }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    setNewSheetOpen(false)
                    router.push(href)
                  }}
                  className="flex min-h-14 w-full items-center gap-3 rounded-[12px] px-3 text-left text-base text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus/50 focus-visible:outline-none"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="flex-1">{t(key)}</span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  )
}

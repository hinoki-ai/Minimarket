"use client"

import * as React from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { Toaster } from "@/components/ui/sonner"

type ConsentCategory = "necessary" | "analytics" | "personalization" | "advertising"

// Simple i18n map (Spanish, CL)
const t = {
  banner: {
    line1: "Usamos cookies para que el sitio se sienta rápido, seguro y personal.",
    line2:
      "Puedes aceptar todas las cookies o administrar tus preferencias en cualquier momento.",
    gpcDetected: "Se detectó Global Privacy Control (GPC). Preferencias respetadas.",
    managePreferences: "Administrar preferencias",
    rejectAll: "Rechazar todas",
    acceptAll: "Aceptar todas",
  },
  minimized: { button: "Privacidad y cookies" },
  settings: {
    title: "Preferencias de privacidad",
    description:
      "Controla qué categorías de cookies permites. Las cookies estrictamente necesarias siempre están activas.",
    tabs: { summary: "Resumen", details: "Detalles" },
    gpc: { label: "GPC", detected: "Detectado", notDetected: "No detectado" },
    actions: { rejectAll: "Rechazar todas", save: "Guardar preferencias", acceptAll: "Aceptar todas" },
  },
  categories: {
    necessary: {
      label: "Estrictamente necesarias",
      desc: "Requeridas para el funcionamiento básico del sitio.",
    },
    analytics: {
      label: "Analíticas",
      desc: "Nos ayudan a entender el uso para mejorar la experiencia.",
    },
    personalization: {
      label: "Personalización",
      desc: "Contenido y recomendaciones más relevantes para ti.",
    },
    advertising: {
      label: "Publicidad",
      desc: "Publicidad más útil y menos repetitiva.",
    },
    privacyPolicy: "Aviso de privacidad",
  },
  details: {
    necessary: "Estas cookies permiten funciones esenciales como navegación y seguridad.",
    analytics:
      "Las cookies analíticas nos permiten medir y mejorar el rendimiento del sitio.",
    personalization:
      "La personalización adapta características y contenido a tus preferencias.",
    advertising:
      "Las cookies publicitarias permiten mostrar anuncios más relevantes y limitar repeticiones.",
  },
}

export default function CookieConsent() {
  const { theme } = useTheme()
  const [bannerOpen, setBannerOpen] = React.useState(true)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"summary" | "details">("summary")
  // const [minimized, setMinimized] = React.useState(false)

  const [categories, setCategories] = React.useState<Record<ConsentCategory, boolean>>({
    necessary: true,
    analytics: false,
    personalization: false,
    advertising: false,
  })

  const [gpc, setGpc] = React.useState(false)

  // Persisted consent cookie (6 months)
  const CONSENT_COOKIE = "minimarket-cookie-consent"
  const CONSENT_VERSION = "1"
  const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180 // 6 months

  type ConsentPayload = {
    v: string
    ts: number
    categories: Record<ConsentCategory, boolean>
    gpc: boolean
  }

  const readConsent = (): ConsentPayload | null => {
    if (typeof document === "undefined") return null
    const cookie = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    if (!cookie) return null
    try {
      const raw = decodeURIComponent(cookie.split("=")[1])
      return JSON.parse(raw) as ConsentPayload
    } catch {
      return null
    }
  }

  const writeConsent = (payload: ConsentPayload) => {
    if (typeof document === "undefined") return
    const value = encodeURIComponent(JSON.stringify(payload))
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE_SECONDS}; samesite=lax`
  }

  React.useEffect(() => {
    // Detect Global Privacy Control
    const hasGpc =
      typeof navigator !== "undefined" &&
      "globalPrivacyControl" in navigator &&
      (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
    setGpc(hasGpc)

    // Read existing consent cookie
    const existing = readConsent()
    if (existing) {
      setCategories(existing.categories)
      setBannerOpen(false)
      return
    }

    // No existing consent: if GPC is enabled, default to necessary-only and avoid banner
    if (hasGpc) {
      const necessaryOnly: Record<ConsentCategory, boolean> = {
        necessary: true,
        analytics: false,
        personalization: false,
        advertising: false,
      }
      setCategories(necessaryOnly)
      writeConsent({ v: CONSENT_VERSION, ts: Date.now(), categories: necessaryOnly, gpc: true })
      setBannerOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Allow opening the manager from anywhere via a custom browser event
  React.useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ tab?: "summary" | "details" }>
      const tab = custom.detail?.tab === "details" ? "details" : "summary"
      openManager(tab)
    }
    if (typeof window !== "undefined") {
      window.addEventListener("open-cookie-settings", handler as EventListener)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("open-cookie-settings", handler as EventListener)
      }
    }
  }, [])

  function openManager(tab?: "summary" | "details") {
    if (tab) setActiveTab(tab)
    setSheetOpen(true)
  }

  function acceptAll() {
    const next = { necessary: true, analytics: true, personalization: true, advertising: true }
    setCategories(next)
    writeConsent({ v: CONSENT_VERSION, ts: Date.now(), categories: next, gpc })
    setBannerOpen(false)
  }

  function rejectAll() {
    const next = { necessary: true, analytics: false, personalization: false, advertising: false }
    setCategories(next)
    writeConsent({ v: CONSENT_VERSION, ts: Date.now(), categories: next, gpc })
    setBannerOpen(false)
  }

  function saveChoices() {
    const next = categories
    writeConsent({ v: CONSENT_VERSION, ts: Date.now(), categories: next, gpc })
    setBannerOpen(false)
    setSheetOpen(false)
  }

  function toggleCategory(key: ConsentCategory, value: boolean) {
    if (key === "necessary") return
    setCategories((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      {bannerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Consentimiento de cookies"
          className="fixed inset-x-0 bottom-0 z-50 pointer-events-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
        >
          <div className="mx-auto max-w-screen-xl container-padding py-4 pointer-events-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1 hidden sm:block">
                  <Logo className="h-6 w-auto opacity-90" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t.banner.line1}</p>
                  <p className="text-muted-foreground text-sm">{t.banner.line2}</p>
                  {gpc && <p className="text-xs text-muted-foreground">{t.banner.gpcDetected}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button variant="outline" onClick={() => openManager("summary")} className="sm:min-w-40 force-interactive cookie-banner-btn">
                  {t.banner.managePreferences}
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={rejectAll} className="sm:min-w-28 force-interactive cookie-banner-btn">
                    {t.banner.rejectAll}
                  </Button>
                  <Button onClick={acceptAll} className="sm:min-w-28 force-interactive cookie-banner-btn">
                    {t.banner.acceptAll}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimized floating button removed in favor of triggering from bottom bar Cuenta button */}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-xl border-t relative overflow-hidden">
          {/* Decorative favicon */}
          <div className="pointer-events-none select-none absolute right-10 top-16 hidden sm:block z-0">
            <Image
              src={theme === "light" ? "/favicon.svg" : "/favicon.svg"}
              alt="Site favicon"
              width={96}
              height={96}
              className="drop-shadow-xl"
              priority={false}
            />
          </div>
          <SheetHeader className="pb-0 relative z-10 pointer-events-auto">
            <SheetTitle>{t.settings.title}</SheetTitle>
            <SheetDescription>{t.settings.description}</SheetDescription>
          </SheetHeader>
          <div className="p-4 pt-2 relative z-10 pointer-events-auto">
            <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v === "details" ? "details" : "summary")}>
              <TabsList className="mb-3">
                <TabsTrigger value="summary">{t.settings.tabs.summary}</TabsTrigger>
                <TabsTrigger value="details">{t.settings.tabs.details}</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <CategoryRow label={t.categories.necessary.label} description={t.categories.necessary.desc} checked disabled />
                <CategoryRow
                  label={t.categories.analytics.label}
                  description={t.categories.analytics.desc}
                  checked={categories.analytics}
                  onCheckedChange={(v) => toggleCategory("analytics", v)}
                />
                <CategoryRow
                  label={t.categories.personalization.label}
                  description={t.categories.personalization.desc}
                  checked={categories.personalization}
                  onCheckedChange={(v) => toggleCategory("personalization", v)}
                />
                <CategoryRow
                  label={t.categories.advertising.label}
                  description={t.categories.advertising.desc}
                  checked={categories.advertising}
                  onCheckedChange={(v) => toggleCategory("advertising", v)}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t.settings.gpc.label}: {gpc ? t.settings.gpc.detected : t.settings.gpc.notDetected}
                  </span>
                  <a href="#" className="underline hover:no-underline">
                    {t.categories.privacyPolicy}
                  </a>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <Section title={t.categories.necessary.label} locked>
                  {t.details.necessary}
                </Section>
                <Section title={t.categories.analytics.label}>{t.details.analytics}</Section>
                <Section title={t.categories.personalization.label}>{t.details.personalization}</Section>
                <Section title={t.categories.advertising.label}>{t.details.advertising}</Section>

                <div className="rounded-md border p-3 text-xs text-muted-foreground">
                  Vista previa de proveedores. Conectar un CMP para lista real. (Prototipo visual)
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <Separator className="my-2 relative z-10" />
          <SheetFooter className="gap-2 sm:flex-row relative z-10 pointer-events-auto">
            <SheetClose asChild>
              <Button variant="ghost" className="sm:ml-auto" onClick={rejectAll}>
                {t.settings.actions.rejectAll}
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button variant="secondary" onClick={saveChoices}>
                {t.settings.actions.save}
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button onClick={acceptAll}>{t.settings.actions.acceptAll}</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Toast container for future feedback */}
      <Toaster richColors closeButton expand={false} duration={2500} position="bottom-right" />
    </>
  )
}

function CategoryRow(props: {
  label: string
  description: string
  checked?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const { label, description, checked: checkedProp = false, disabled = false, onCheckedChange } = props
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="space-y-0.5">
        <Label className="font-medium">{label}</Label>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
      <Switch
        checked={checkedProp}
        disabled={disabled}
        onCheckedChange={(v: boolean) => onCheckedChange?.(!!v)}
        aria-label={label}
      />
    </div>
  )
}

function Section(props: { title: string; children: React.ReactNode; locked?: boolean }) {
  const { title, children, locked } = props
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        {locked && <span className="text-xs text-muted-foreground">Requerido</span>}
      </div>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}


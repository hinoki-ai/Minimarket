import { Protect } from '@clerk/nextjs'
import CustomClerkPricing from "@/components/custom-clerk-pricing";

function UpgradeCard() {
  return (
    <>
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-center text-2xl font-semibold lg:text-3xl">Cámbiate a un plan pagado</h1>
        <p>Esta página está disponible en planes pagados. Elige el plan que mejor se adapte a tu negocio.</p>
      </div>
      <div className="px-8 lg:px-12">
        <CustomClerkPricing />
      </div>
    </>
  )
}


function FeaturesCard() {
  return (
    <div className="px-4 lg:px-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Funciones avanzadas</h1>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Página con funciones avanzadas</h2>
            <p className="text-muted-foreground">
              Acceso a funciones avanzadas.
            </p>
          </div>
        </div>
      </div>
    )
}


export default function TeamPage() {
  return (
    <Protect
    condition={(has) => {
      // Check if user has any of the paid plans
      // Or alternatively, check if user doesn't have free plan (if free plan exists)
      return !has({ plan: "free_user" })
    }}
      fallback={<UpgradeCard/>}
    >
      <FeaturesCard />
    </Protect>
  )
} 
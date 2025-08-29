'use client';

import { ShoppingCart, Zap, Truck, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceHighlightsProps {
  className?: string;
}

export function ServiceHighlights({ className }: ServiceHighlightsProps) {
  const items: Array<{
    icon: React.ReactNode;
    label: string;
    description: string;
  }> = [
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      label: '500+',
      description: 'Productos disponibles',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      label: '< 30min',
      description: 'Tiempo de entrega',
    },
    {
      icon: <Truck className="h-5 w-5" />,
      label: 'Gratis',
      description: 'Envío sobre $15.000',
    },
    {
      icon: <Smartphone className="h-5 w-5" />,
      label: '24/7',
      description: 'Disponible siempre',
    },
  ];

  return (
    <section className={cn('py-10 md:py-14', className)} aria-label="Ventajas de servicio">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-2xl border bg-card/50 backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-5 md:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-base md:text-lg font-semibold leading-tight">{item.label}</span>
                  <span className="text-xs md:text-sm text-muted-foreground leading-tight">{item.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ServiceHighlights;


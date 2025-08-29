'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ShoppingBag, Search, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MinimartHeroProps {
  className?: string;
}

export function MinimartHero({ className }: MinimartHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const pointerIdRef = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const pointerCurrentX = useRef<number | null>(null);
  const pointerStartTime = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element | null;
    if (target && target.closest('button, a, input, textarea, select, [role="button"]')) {
      // Let interactive elements handle their own clicks
      isDraggingRef.current = false;
      pointerIdRef.current = null;
      return;
    }
    pointerIdRef.current = e.pointerId;
    pointerStartX.current = e.clientX;
    pointerCurrentX.current = null;
    pointerStartTime.current = performance.now();
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId || !isDraggingRef.current) return;
    pointerCurrentX.current = e.clientX;
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const startX = pointerStartX.current;
    const currentX = pointerCurrentX.current ?? startX;
    const startTime = pointerStartTime.current ?? performance.now();
    if (startX != null && currentX != null) {
      const deltaX = currentX - startX;
      const dt = Math.max(1, performance.now() - startTime);
      const velocity = Math.abs(deltaX) / dt; // px/ms
      const distanceThreshold = 60; // px
      const velocityThreshold = 0.5; // ~500 px/s
      if (deltaX > distanceThreshold || (deltaX > 10 && velocity > velocityThreshold)) {
        prevSlide();
      } else if (deltaX < -distanceThreshold || (deltaX < -10 && velocity > velocityThreshold)) {
        nextSlide();
      }
    }
    pointerIdRef.current = null;
    pointerStartX.current = null;
    pointerCurrentX.current = null;
    pointerStartTime.current = null;
    isDraggingRef.current = false;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return; // If not dragging, allow click to bubble
    endPointer(e);
  };
  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => endPointer(e);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  };

  const heroSlides = [
    {
      id: 1,
      title: "Arándanos frescos y vibrantes",
      subtitle: "Selección premium, listos para disfrutar",
      image: "/images/products/Lucid_Origin_Ultra_realistic_closeup_of_a_pile_of_fresh_bluebe_3.jpg",
      badge: "Fresco",
      badgeClass: "status-fresh"
    },
    {
      id: 2,
      title: "Sabor que inspira",
      subtitle: "Fotografía culinaria que abre el apetito",
      image: "/images/products/Lucid_Origin_Professional_food_photography_of_a_tall_flamegril_3.jpg",
      badge: "Popular",
      badgeClass: "status-popular"
    },
    {
      id: 3,
      title: "Refrescos dorados",
      subtitle: "Texturas y burbujas en primer plano",
      image: "/images/products/GPT_Image_1_Ultra_closeup_macro_shot_of_golden_amber_beerlike_0.png",
      badge: "Nuevo",
      badgeClass: "status-new"
    },
    {
      id: 4,
      title: "Fresco y sostenible",
      subtitle: "Presentación moderna y amigable con el entorno",
      image: "/images/products/Lucid_Realism_Ultrarealistic_photo_of_modern_ecofriendly_food__3.jpg",
      badge: "Nuevo",
      badgeClass: "status-new"
    }
  ];

  // Stats moved to a dedicated bottom section on the home page

  return (
    <section className={cn("relative overflow-hidden bg-transparent", className)}>
      {/* Background intentionally transparent to let aurora show through */}

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:py-20 xl:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center">
          
          {/* Left Content */}
          <div className="space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="status-fresh">
                  <MapPin className="h-3 w-3 mr-1" />
                  Minimarket ARAMAC
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Abierto 24/7
                </Badge>
              </div>
              
              <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold tracking-tight typography-hierarchy">
                Tu minimarket
                <span className="text-primary block ma-y-xs">de confianza</span>
              </h1>
              
              <p className="text-lg lg:text-xl xl:text-2xl text-muted-foreground max-w-lg xl:max-w-xl typography-hierarchy ma-y-md">
                Productos frescos y de calidad inspirados en la tradición japonesa de servicio al cliente. 
                Compra fácil, entrega rápida.
              </p>
            </div>

            {/* Search Bar */}
            <div>
              <SearchBar 
                placeholder="Buscar productos, marcas..."
                className="w-full"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="thumb-friendly flex-1 sm:flex-none">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Ver Catálogo
              </Button>
              <Button variant="outline" size="lg" className="thumb-friendly flex-1 sm:flex-none">
                <Search className="h-5 w-5 mr-2" />
                Buscar Productos
              </Button>
            </div>

            {/* Stats moved out of hero */}
          </div>

          {/* Right Content - Hero Carousel */}
          <div className="relative">
            <div
              className="relative aspect-square lg:aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl touch-pan-y select-none pointer-events-auto"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="region"
              aria-label="Hero carousel"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  key={heroSlides[currentSlide].id}
                  src={heroSlides[currentSlide].image}
                  alt={heroSlides[currentSlide].title}
                  fill
                  priority={false}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/10 to-black/20" />
              </div>
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <Badge className={heroSlides[currentSlide].badgeClass + " w-fit mb-3"}>
                  {heroSlides[currentSlide].badge}
                </Badge>
                
                 <h3 className="text-2xl font-bold text-white mb-2 typography-hierarchy">
                   {heroSlides[currentSlide].title}
                 </h3>
                
                <p className="text-white/90 mb-6 typography-hierarchy">
                  {heroSlides[currentSlide].subtitle}
                </p>
                
                 <Button className="w-fit">
                  Ver Productos
                </Button>
              </div>

              {/* Navigation Dots */}
              <div className="absolute top-4 right-4 flex gap-2 z-20" data-testid="hero-dots">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentSlide 
                        ? "bg-white w-6" 
                        : "bg-white/50 hover:bg-white/75"
                    )}
                    onClick={() => setCurrentSlide(index)}
                    data-testid="hero-dot"
                  />
                ))}
              </div>

              {/* Clickable side hotspots */}
              <button
                type="button"
                aria-label="Anterior"
                className="absolute inset-y-0 left-0 w-1/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 group z-10"
                onClick={prevSlide}
              >
                <span className="sr-only">Anterior</span>
                <div className="hidden sm:flex items-center justify-start h-full pl-2 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft className="h-6 w-6 drop-shadow" />
                </div>
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                className="absolute inset-y-0 right-0 w-1/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 group z-10"
                onClick={nextSlide}
              >
                <span className="sr-only">Siguiente</span>
                <div className="hidden sm:flex items-center justify-end h-full pr-2 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-6 w-6 drop-shadow" />
                </div>
              </button>
            </div>

            {/* Removed blurred floating elements to avoid overlapping aurora */}
          </div>
        </div>
      </div>

      {/* Bottom Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-6 fill-muted/50"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,120 L1200,120 L1200,60 C1200,60 900,0 600,60 C300,120 0,60 0,60 Z" />
        </svg>
      </div>
    </section>
  );
}

// Compact Hero for mobile or secondary pages
interface MinimartHeroCompactProps {
  title: string;
  subtitle?: string;
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function MinimartHeroCompact({ 
  title, 
  subtitle, 
  breadcrumb,
  className 
}: MinimartHeroCompactProps) {
  return (
    <section className={cn("relative bg-muted/30 border-b", className)}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-4">
          {breadcrumb && (
            <div className="text-sm">
              {breadcrumb}
            </div>
          )}
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold typography-hierarchy">
              {title}
            </h1>
            
            {subtitle && (
              <p className="text-muted-foreground typography-hierarchy">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
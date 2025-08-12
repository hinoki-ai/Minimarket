'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Search, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MinimartHeroProps {
  className?: string;
}

export function MinimartHero({ className }: MinimartHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      id: 1,
      title: "Productos frescos cada día",
      subtitle: "Siguiendo la tradición japonesa de frescura y calidad",
      image: "/hero-fresh-products.jpg",
      badge: "Fresco",
      badgeClass: "status-fresh"
    },
    {
      id: 2,
      title: "Nuevos productos semanales",
      subtitle: "Descubre las novedades que llegan cada semana",
      image: "/hero-new-products.jpg",
      badge: "Nuevo",
      badgeClass: "status-new"
    },
    {
      id: 3,
      title: "Los más populares",
      subtitle: "Los productos favoritos de nuestra comunidad",
      image: "/hero-popular-products.jpg",
      badge: "Popular",
      badgeClass: "status-popular"
    }
  ];

  const quickStats = [
    { icon: "🛒", label: "500+", description: "Productos disponibles" },
    { icon: "⚡", label: "< 30min", description: "Tiempo de entrega" },
    { icon: "🚚", label: "Gratis", description: "Envío sobre $15.000" },
    { icon: "📱", label: "24/7", description: "Disponible siempre" },
  ];

  return (
    <section className={cn("relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
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
              
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight typography-hierarchy">
                Tu minimarket
                <span className="text-primary block ma-y-xs">de confianza</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-muted-foreground max-w-lg typography-hierarchy ma-y-md">
                Productos frescos y de calidad inspirados en la tradición japonesa de servicio al cliente. 
                Compra fácil, entrega rápida.
              </p>
            </div>

            {/* Search Bar */}
            <div className="space-y-4">
              <SearchBar 
                placeholder="Buscar productos, marcas..."
                className="w-full"
              />
              <div className="flex flex-wrap gap-2">
                {['Pan fresco', 'Bebidas', 'Snacks', 'Lácteos'].map((term) => (
                  <Button
                    key={term}
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-full thumb-friendly"
                  >
                    {term}
                  </Button>
                ))}
              </div>
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

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              {quickStats.map((stat, index) => (
                <div key={index} className="text-center space-y-1">
                  <div className="text-2xl">{stat.icon}</div>
                  <div className="font-semibold text-lg">{stat.label}</div>
                  <div className="text-xs text-muted-foreground typography-hierarchy">
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Carousel */}
          <div className="relative">
            <div className="relative aspect-square lg:aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl">
              {/* Background Image */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-green-500/20 to-orange-500/20" />
              
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
              <div className="absolute bottom-4 right-4 flex gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentSlide 
                        ? "bg-white w-6" 
                        : "bg-white/50 hover:bg-white/75"
                    )}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary/10 rounded-full blur-xl" />
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
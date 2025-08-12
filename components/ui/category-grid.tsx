'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface Category {
  _id: string;
  name: string;
  nameJA?: string;
  slug: string;
  icon?: string;
  color?: string;
  productCount?: number;
}

interface CategoryGridProps {
  categories: Category[];
  className?: string;
  layout?: 'grid' | 'bento';
  showProductCount?: boolean;
}

// Icon mapping - you can extend this with more icons
const getIconComponent = (iconName?: string) => {
  const iconMap: Record<string, string> = {
    'drinks': '🥤',
    'snacks': '🍿',
    'fresh': '🥬',
    'bakery': '🍞',
    'dairy': '🥛',
    'meat': '🥩',
    'frozen': '❄️',
    'household': '🧽',
    'personal-care': '🧴',
    'electronics': '📱',
    'toys': '🧸',
    'stationery': '📝',
  };
  
  return iconMap[iconName || 'default'] || '🏪';
};

export function CategoryGrid({ 
  categories, 
  className, 
  layout = 'grid',
  showProductCount = true 
}: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8 ma-y-lg">
        <p className="text-muted-foreground">No hay categorías disponibles</p>
      </div>
    );
  }

  const gridClasses = cn(
    layout === 'bento' ? 'bento-grid' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
    className
  );

  return (
    <div className={gridClasses}>
      {categories.map((category, index) => {
        const isLarge = layout === 'bento' && index < 2; // First two items in bento are larger
        
        return (
          <Link key={category._id} href={`/categories/${category.slug}`}>
            <Card 
              className={cn(
                'group cursor-pointer subtle-hover h-full',
                layout === 'bento' && 'bento-card',
                isLarge && 'bento-card-featured'
              )}
              style={{
                '--category-color': category.color || '#3B82F6'
              } as React.CSSProperties}
            >
              <CardContent className={cn(
                'flex flex-col items-center justify-center text-center space-y-3',
                isLarge ? 'p-8' : 'p-6',
                'h-full min-h-[120px]'
              )}>
                {/* Category Icon */}
                <div 
                  className={cn(
                    'rounded-full flex items-center justify-center transition-colors',
                    isLarge ? 'w-16 h-16 text-4xl' : 'w-12 h-12 text-2xl',
                    'bg-primary/10 group-hover:bg-primary/20'
                  )}
                  style={{
                    backgroundColor: `${category.color || '#3B82F6'}15`,
                  }}
                >
                  <span className="select-none">
                    {getIconComponent(category.icon)}
                  </span>
                </div>

                {/* Category Name */}
                <div className="space-y-1">
                  <h3 className={cn(
                    'font-semibold group-hover:text-primary transition-colors typography-hierarchy',
                    isLarge ? 'text-lg' : 'text-base'
                  )}>
                    {category.name}
                  </h3>
                  
                  {/* Japanese name if available */}
                  {category.nameJA && (
                    <p className="text-xs text-muted-foreground font-medium tracking-wide">
                      {category.nameJA}
                    </p>
                  )}
                  
                  {/* Product count */}
                  {showProductCount && category.productCount !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {category.productCount} {category.productCount === 1 ? 'producto' : 'productos'}
                    </p>
                  )}
                </div>

                {/* Visual accent line */}
                <div 
                  className="w-8 h-0.5 rounded-full transition-all group-hover:w-12"
                  style={{
                    backgroundColor: category.color || '#3B82F6',
                  }}
                />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// Alternative compact layout for navigation
interface CategoryNavProps {
  categories: Category[];
  activeSlug?: string;
  className?: string;
}

export function CategoryNav({ categories, activeSlug, className }: CategoryNavProps) {
  return (
    <nav className={cn('flex overflow-x-auto gap-2 pb-2', className)}>
      {categories.map((category) => (
        <Link key={category._id} href={`/categories/${category.slug}`}>
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all thumb-friendly',
              'border text-sm font-medium',
              activeSlug === category.slug
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            )}
          >
            <span className="text-sm">
              {getIconComponent(category.icon)}
            </span>
            <span>{category.name}</span>
            {category.productCount !== undefined && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded-full text-xs',
                activeSlug === category.slug
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted-foreground/20 text-muted-foreground'
              )}>
                {category.productCount}
              </span>
            )}
          </div>
        </Link>
      ))}
    </nav>
  );
}

// Breadcrumb component for category navigation
interface CategoryBreadcrumbProps {
  categories: Category[];
  className?: string;
}

export function CategoryBreadcrumb({ categories, className }: CategoryBreadcrumbProps) {
  if (categories.length === 0) return null;

  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)}>
      <Link 
        href="/" 
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        Inicio
      </Link>
      
      {categories.map((category, index) => (
        <div key={category._id} className="flex items-center space-x-2">
          <span className="text-muted-foreground">/</span>
          <Link 
            href={`/categories/${category.slug}`}
            className={cn(
              'transition-colors',
              index === categories.length - 1
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            {category.name}
          </Link>
        </div>
      ))}
    </nav>
  );
}
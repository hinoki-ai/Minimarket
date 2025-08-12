'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Star, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    shortDescription?: string;
    images: Array<{
      url: string;
      alt: string;
    }>;
    inventory: {
      quantity: number;
      lowStockThreshold: number;
      trackInventory: boolean;
    };
    freshness?: {
      isFresh: boolean;
      isNew: boolean;
      isPopular: boolean;
      expiryDate?: number;
    };
    tags: string[];
  };
  onAddToCart?: (productId: string, quantity: number) => void;
  className?: string;
  layout?: 'grid' | 'list' | 'bento';
}

// Format Chilean Peso
const formatCLP = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(price);
};

// Get stock status
const getStockStatus = (inventory: ProductCardProps['product']['inventory']) => {
  if (!inventory.trackInventory) return 'in-stock';
  if (inventory.quantity === 0) return 'out-of-stock';
  if (inventory.quantity <= inventory.lowStockThreshold) return 'low-stock';
  return 'in-stock';
};

export function ProductCard({ 
  product, 
  onAddToCart, 
  className, 
  layout = 'grid' 
}: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const decrement = () => setQuantity(q => Math.max(1, q - 1));
  const increment = () => setQuantity(q => Math.min(99, q + 1));
  
  const stockStatus = getStockStatus(product.inventory);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!onAddToCart) return;
    
    setIsLoading(true);
    try {
      await onAddToCart(product._id, quantity);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusBadges = () => (
    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
      {product.freshness?.isNew && (
        <Badge className="status-new text-xs font-medium">
          Nuevo
        </Badge>
      )}
      {product.freshness?.isFresh && (
        <Badge className="status-fresh text-xs font-medium">
          Fresco
        </Badge>
      )}
      {product.freshness?.isPopular && (
        <Badge className="status-popular text-xs font-medium">
          Popular
        </Badge>
      )}
      {hasDiscount && (
        <Badge className="status-sale text-xs font-medium">
          -{discountPercent}%
        </Badge>
      )}
    </div>
  );

  const renderStockIndicator = () => {
    const stockConfig = {
      'in-stock': { 
        icon: CheckCircle, 
        text: 'En stock', 
        className: 'stock-in' 
      },
      'low-stock': { 
        icon: AlertCircle, 
        text: `Solo ${product.inventory.quantity}`, 
        className: 'stock-low' 
      },
      'out-of-stock': { 
        icon: AlertCircle, 
        text: 'Agotado', 
        className: 'stock-out' 
      }
    };

    const config = stockConfig[stockStatus];
    const IconComponent = config.icon;

    return (
      <div className={cn('flex items-center gap-1', config.className)}>
        <IconComponent className="h-3 w-3" />
        <span className="text-xs font-medium">{config.text}</span>
      </div>
    );
  };

  if (layout === 'list') {
    return (
      <Card className={cn('subtle-hover', className)}>
        <CardContent className="flex gap-4 p-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={product.images[0]?.url || '/placeholder-product.jpg'}
              alt={product.images[0]?.alt || product.name}
              fill
              className="object-cover rounded-md"
            />
            {renderStatusBadges()}
          </div>
          
          <div className="flex-1 space-y-2">
            <Link href={`/products/${product.slug}`}>
              <h3 className="font-medium line-clamp-1 hover:text-primary typography-hierarchy">
                {product.name}
              </h3>
            </Link>
            
            {product.shortDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2 typography-hierarchy">
                {product.shortDescription}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  {formatCLP(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCLP(product.compareAtPrice!)}
                  </span>
                )}
              </div>
              
              {renderStockIndicator()}
            </div>
          </div>
          
          <div className="flex flex-col justify-between">
            <Button
              size="sm"
              className="touch-target"
              onClick={handleAddToCart}
              disabled={stockStatus === 'out-of-stock' || isLoading}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid and Bento layouts
  const cardClasses = cn(
    layout === 'bento' ? 'bento-card' : 'subtle-hover',
    'group relative overflow-hidden',
    className
  );

  return (
    <Card className={cardClasses}>
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden">
          <Link href={`/products/${product.slug}`}>
            <Image
              src={product.images[0]?.url || '/placeholder-product.jpg'}
              alt={product.images[0]?.alt || product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          
          {renderStatusBadges()}
          
          {/* Quick action button */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 rounded-full shadow-lg"
              onClick={handleAddToCart}
              disabled={stockStatus === 'out-of-stock' || isLoading}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-medium line-clamp-2 hover:text-primary typography-hierarchy ma-y-xs">
              {product.name}
            </h3>
          </Link>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">
              {formatCLP(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCLP(product.compareAtPrice!)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex justify-between items-center">
            {renderStockIndicator()}
            
            {product.freshness?.expiryDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  Vence: {new Date(product.freshness.expiryDate).toLocaleDateString('es-CL')}
                </span>
              </div>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="grid grid-cols-3 gap-2 ma-y-sm">
            <div className="col-span-1 flex items-center justify-between border rounded-md px-2 py-1">
              <button
                className="px-2 text-lg disabled:opacity-50"
                onClick={decrement}
                disabled={quantity <= 1}
                aria-label="Disminuir cantidad"
              >
                −
              </button>
              <span className="text-sm font-medium w-6 text-center">{quantity}</span>
              <button
                className="px-2 text-lg disabled:opacity-50"
                onClick={increment}
                disabled={quantity >= 99}
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
            <Button
              className="col-span-2 w-full thumb-friendly"
              onClick={handleAddToCart}
              disabled={stockStatus === 'out-of-stock' || isLoading}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {stockStatus === 'out-of-stock' ? 'Agotado' : 'Agregar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
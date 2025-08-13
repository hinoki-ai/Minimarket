"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2 } from "lucide-react";

type MiniCartSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string | null;
  sessionId?: string | null;
  freeShippingThreshold?: number; // in CLP
};

export function MiniCartSheet({ 
  open, 
  onOpenChange, 
  userId, 
  sessionId, 
  freeShippingThreshold = 20000,
}: MiniCartSheetProps) {
  const cartsApi: any = (api as any).carts;
  const cart = useQuery(cartsApi?.getUserCart, (userId || sessionId) ? { userId: userId ?? undefined, sessionId: userId ? undefined : sessionId ?? undefined } : undefined);
  const updateItem = useMutation(cartsApi?.updateCartItem);
  const removeItem = useMutation(cartsApi?.removeFromCart);
  const clearCart = useMutation(cartsApi?.clearCart);

  const totals = useMemo(() => {
    const subtotal = cart?.subtotal ?? 0;
    const tax = cart?.tax ?? 0;
    const total = cart?.total ?? 0;
    const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);
    const progress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
    return { subtotal, tax, total, remainingForFree, progress };
  }, [cart, freeShippingThreshold]);

  const formatCLP = (price: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tu carrito</SheetTitle>
        </SheetHeader>

        {!cart || cart.items.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>Tu carrito está vacío</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Free shipping progress */}
            <div className="rounded-md border p-3">
              {totals.remainingForFree === 0 ? (
                <p className="text-sm font-medium">¡Envío gratis aplicado!</p>
              ) : (
                <p className="text-sm">Te faltan <span className="font-semibold">{formatCLP(totals.remainingForFree)}</span> para envío gratis</p>
              )}
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${totals.progress}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              {cart.items.map((item: any) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                    <Image
                      src={item.product?.images?.[0]?.url || "/placeholder-product.jpg"}
                      alt={item.product?.images?.[0]?.alt || item.product?.name || "Producto"}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.product?.slug ?? ""}`} className="block font-medium line-clamp-1">
                      {item.product?.name ?? "Producto"}
                    </Link>
                    <p className="text-sm text-muted-foreground">{formatCLP(item.price)}</p>
                    <div className="mt-2 inline-flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" aria-label="Disminuir cantidad" onClick={() => updateItem({ productId: item.productId, quantity: Math.max(1, (item.quantity ?? 1) - 1), userId: userId ?? undefined, sessionId: userId ? undefined : sessionId ?? undefined })}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" aria-label="Aumentar cantidad" onClick={() => updateItem({ productId: item.productId, quantity: Math.min(99, (item.quantity ?? 1) + 1), userId: userId ?? undefined, sessionId: userId ? undefined : sessionId ?? undefined })}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Eliminar del carrito" onClick={() => removeItem({ productId: item.productId, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId ?? undefined })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCLP(totals.subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>IVA (19%)</span><span>{formatCLP(totals.tax)}</span></div>
              <div className="flex justify-between font-semibold text-base mt-2"><span>Total</span><span>{formatCLP(totals.total)}</span></div>
              <p className="text-xs text-muted-foreground">Impuestos incluidos</p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => clearCart({ userId: userId ?? undefined, sessionId: userId ? undefined : sessionId ?? undefined })}>Vaciar</Button>
              <Button asChild>
                <Link href="/checkout">Ir a pagar</Link>
              </Button>
            </div>
          </div>
        )}

        <SheetFooter />
      </SheetContent>
    </Sheet>
  );
}


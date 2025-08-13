'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';

const formatCLP = (price: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

export default function CartPageClient() {
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();

const cartsApi: any = (api as any).carts;
const cart = useQuery(cartsApi?.getUserCart, userId || sessionId ? { userId: userId ?? undefined, sessionId: userId ? undefined : sessionId } : undefined);
const updateItem = useMutation(cartsApi?.updateCartItem);
const removeItem = useMutation(cartsApi?.removeFromCart);
const clearCart = useMutation(cartsApi?.clearCart);

  const handleUpdate = async (productId: string, quantity: number) => {
    await updateItem({ productId, quantity, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
  };

  const handleRemove = async (productId: string) => {
    await removeItem({ productId, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
  };

  const handleClear = async () => {
    await clearCart({ userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
  };

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">Tu carrito</h1>
        {!isEmpty && (
          <Button variant="ghost" onClick={handleClear}>Vaciar carrito</Button>
        )}
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
            <Button asChild>
              <Link href="/products">Explorar productos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item: any) => (
              <Card key={item.productId}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden">
                      <Image
                        src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                        alt={item.product?.images?.[0]?.alt || item.product?.name || 'Producto'}
                        fill
                        sizes="80px"
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Link href={`/products/${item.product?.slug}`}>
                      <h3 className="font-medium hover:text-primary line-clamp-2">{item.product?.name || 'Producto'}</h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label="Disminuir cantidad"
                            onClick={() => handleUpdate(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label="Aumentar cantidad"
                            onClick={() => handleUpdate(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="w-24 text-right font-medium">{formatCLP(item.price * item.quantity)}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Eliminar del carrito"
                          onClick={() => handleRemove(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCLP(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA</span>
                  <span className="font-medium">{formatCLP(cart.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{formatCLP(cart.total)}</span>
                </div>
                <Button asChild className="w-full">
                  <Link href="/checkout">Proceder al pago</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Seguir comprando
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Minus, Plus, Trash2, ArrowLeft, User, Package, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';

const formatCLP = (price: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

export default function CartPageClient() {
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const [activeTab, setActiveTab] = useState('cart');

  // Cart data
  const cartsApi: any = (api as any).carts;
  const cart = useQuery(cartsApi?.getUserCart, userId || sessionId ? { userId: userId ?? undefined, sessionId: userId ? undefined : sessionId } : undefined);
  const updateItem = useMutation(cartsApi?.updateCartItem);
  const removeItem = useMutation(cartsApi?.removeFromCart);
  const clearCart = useMutation(cartsApi?.clearCart);

  // Orders data for authenticated users
  const ordersApi: any = (api as any).orders;
  const orders = useQuery(ordersApi?.listOrdersByUser, userId && ordersApi?.listOrdersByUser ? { userId } : undefined) as any[] | undefined;

  // Handle hash navigation for orders
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#orders' || hash === '#profile') {
      setActiveTab(hash.slice(1));
    }
  }, []);

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
    <div>
      {/* Enhanced Header */}
      <div className="mb-8 lg:mb-12">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-6">Mi Cuenta & Carrito</h2>
        
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cart" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Carrito</span>
            </TabsTrigger>
            {userId && (
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Pedidos</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
          </TabsList>

          {/* Cart Tab */}
          <TabsContent value="cart" className="mt-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg md:text-xl font-semibold">Tu carrito</h3>
              {!isEmpty && (
                <Button variant="ghost" size="lg" onClick={handleClear}>Vaciar carrito</Button>
              )}
            </div>

      {isEmpty ? (
        <Card>
          <CardContent className="py-16 lg:py-24 text-center">
            <p className="text-muted-foreground text-base lg:text-lg mb-6">Tu carrito está vacío</p>
            <Button size="lg" asChild>
              <Link href="/products">Explorar productos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:gap-12 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-4 lg:space-y-6">
            {cart.items.map((item: any) => (
              <Card key={item.productId}>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex gap-4 lg:gap-6">
                    <div className="relative h-20 w-20 lg:h-28 lg:w-28 flex-shrink-0 rounded-md overflow-hidden">
                      <Image
                        src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                        alt={item.product?.images?.[0]?.alt || item.product?.name || 'Producto'}
                        fill
                        sizes="(max-width: 1024px) 80px, 112px"
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1 space-y-2 lg:space-y-4">
                      <Link href={`/products/${item.product?.slug}`}>
                      <h3 className="font-medium text-base lg:text-lg hover:text-primary line-clamp-2">{item.product?.name || 'Producto'}</h3>
                      </Link>
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center space-x-2 lg:space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="lg:h-10 lg:w-10"
                            aria-label="Disminuir cantidad"
                            onClick={() => handleUpdate(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                          <span className="w-8 lg:w-12 text-center text-base lg:text-lg font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="lg:h-10 lg:w-10"
                            aria-label="Aumentar cantidad"
                            onClick={() => handleUpdate(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between lg:gap-6">
                          <div className="font-medium text-lg lg:text-xl">{formatCLP(item.price * item.quantity)}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="lg:h-10 lg:w-10"
                            aria-label="Eliminar del carrito"
                            onClick={() => handleRemove(item.productId)}
                          >
                            <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4 lg:space-y-6">
            <Card>
              <CardContent className="p-6 lg:p-8 space-y-4 lg:space-y-6">
                <div className="flex justify-between text-base lg:text-lg">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCLP(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-base lg:text-lg">
                  <span>IVA</span>
                  <span className="font-medium">{formatCLP(cart.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg lg:text-xl">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{formatCLP(cart.total)}</span>
                </div>
                <Button asChild className="w-full lg:h-12 lg:text-lg" size="lg">
                  <Link href="/checkout">Proceder al pago</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Button variant="outline" asChild className="w-full lg:h-12 lg:text-lg" size="lg">
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                Seguir comprando
              </Link>
            </Button>
          </div>
        </div>
      )}
          </TabsContent>

          {/* Orders Tab */}
          {userId && (
            <TabsContent value="orders" className="mt-6">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold">Tus pedidos</h3>
                <p className="text-muted-foreground">Historial de compras y seguimiento de pedidos</p>
              </div>
              
              {orders === undefined ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground">Cargando pedidos…</p>
                  </CardContent>
                </Card>
              ) : Array.isArray(orders) && orders.length > 0 ? (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <Card key={order._id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">Pedido #{order.orderNumber}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'shipped' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {order.status === 'delivered' ? 'Entregado' :
                                 order.status === 'processing' ? 'Procesando' :
                                 order.status === 'shipped' ? 'Enviado' : 
                                 order.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString('es-CL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.items?.length || 0} artículo{(order.items?.length || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatCLP(order.totalAmount)}</div>
                            <Button variant="outline" size="sm" className="mt-2">
                              Ver detalles
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center space-y-4">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground mb-4">Aún no tienes pedidos</p>
                      <Button asChild>
                        <Link href="/products">Explorar productos</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <div className="mb-6">
              <h3 className="text-lg md:text-xl font-semibold">Mi perfil</h3>
              <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información de cuenta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userId ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Estado de cuenta</label>
                        <p className="font-medium text-green-600">Usuario registrado</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ID de usuario</label>
                        <p className="font-mono text-sm">{userId}</p>
                      </div>
                      <Separator />
                      <Button variant="outline" className="w-full">
                        Gestionar en Clerk
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-muted-foreground">Inicia sesión para acceder a todas las funciones</p>
                      <div className="space-y-2">
                        <Button className="w-full">Iniciar sesión</Button>
                        <Button variant="outline" className="w-full">Crear cuenta</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Acciones rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                     {userId && (
                       <Button variant="outline" className="justify-start h-auto p-4" asChild>
                         <Link href="/carrito#orders">
                          <div className="text-left">
                            <div className="font-medium">Ver mis pedidos</div>
                            <div className="text-sm text-muted-foreground">Historial y estado de pedidos</div>
                          </div>
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" className="justify-start h-auto p-4" asChild>
                      <Link href="/products">
                        <div className="text-left">
                          <div className="font-medium">Explorar productos</div>
                          <div className="text-sm text-muted-foreground">Descubre nuestro catálogo</div>
                        </div>
                      </Link>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto p-4" asChild>
                      <Link href="/help">
                        <div className="text-left">
                          <div className="font-medium">Centro de ayuda</div>
                          <div className="text-sm text-muted-foreground">Soporte y preguntas frecuentes</div>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
'use client';

import * as React from 'react'
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Cart, CartItem, Order, ProductId } from '@/types/convex';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, PieChart, Pie, Cell } from 'recharts';
import { Minus, Plus, Trash2, ArrowLeft, User, Package, ShoppingBag, TrendingUp, Eye, Settings, Bell, CreditCard, Heart, Star, Calendar, Download, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { useState, useEffect } from 'react';


const formatCLP = (price: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

// Mock analytics data - in production this would come from Convex
const analyticsData = [
  { date: "2024-01-01", orders: 12, revenue: 45000, customers: 8 },
  { date: "2024-01-02", orders: 18, revenue: 67000, customers: 14 },
  { date: "2024-01-03", orders: 15, revenue: 58000, customers: 11 },
  { date: "2024-01-04", orders: 22, revenue: 82000, customers: 18 },
  { date: "2024-01-05", orders: 28, revenue: 95000, customers: 22 },
  { date: "2024-01-06", orders: 35, revenue: 120000, customers: 28 },
  { date: "2024-01-07", orders: 31, revenue: 108000, customers: 25 }
];

const categoryData = [
  { category: 'Bebidas', value: 35, color: '#8884d8' },
  { category: 'Snacks', value: 28, color: '#82ca9d' },
  { category: 'Lácteos', value: 20, color: '#ffc658' },
  { category: 'Carnes', value: 17, color: '#ff7c7c' }
];

const chartConfig = {
  orders: { label: "Pedidos", color: "var(--primary)" },
  revenue: { label: "Ingresos", color: "var(--primary)" },
  customers: { label: "Clientes", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function CarritoPageClient() {
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('7d');


  // Cart data
  const cart = useQuery(
    api.carts.getUserCart, 
    userId || sessionId ? { 
      userId: userId ?? undefined, 
      sessionId: userId ? undefined : sessionId 
    } : "skip"
  ) as Cart | undefined;
  const updateItem = useMutation(api.carts.updateCartItem);
  const removeItem = useMutation(api.carts.removeFromCart);
  const clearCart = useMutation(api.carts.clearCart);

  // Orders data for authenticated users
  const orders = useQuery(
    api.orders.listOrdersByUser,
    userId ? { userId } : "skip"
  ) as Order[] | undefined;

  // Handle hash navigation for orders
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#orders' || hash === '#profile' || hash === '#analytics') {
      setActiveTab(hash.slice(1));
    }
  }, []);

  const handleUpdate = async (productId: ProductId, quantity: number) => {
    await updateItem({ productId, quantity, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
  };

  const handleRemove = async (productId: ProductId) => {
    await removeItem({ productId, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
  };

  const handleClear = async () => {
    await clearCart({ userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
  };

  const isEmpty = !cart || !cart.items || cart.items.length === 0;
  
  // Calculate analytics
  const totalRevenue = analyticsData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = analyticsData.reduce((sum, item) => sum + item.orders, 0);
  const totalCustomers = analyticsData.reduce((sum, item) => sum + item.customers, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  return (
    <div className="space-y-6">
      {/* Supreme Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Carrito Supremo</h1>
          <p className="text-muted-foreground text-lg">Dashboard completo, carrito inteligente y gestión avanzada</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar datos
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Supreme Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-12">
          <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="cart" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Carrito</span>
            {!isEmpty && (
              <Badge variant="secondary" className="ml-1 h-5 text-xs">
                {cart?.items?.length || 0}
              </Badge>
            )}
          </TabsTrigger>
          {userId && (
            <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
        </TabsList>

        {/* SUPREME DASHBOARD TAB */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardDescription className="text-blue-600 dark:text-blue-400">Ingresos Totales</CardDescription>
                <CardTitle className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCLP(totalRevenue)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  Crecimiento del 12.5% este mes
                </div>
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardDescription className="text-green-600 dark:text-green-400">Total Pedidos</CardDescription>
                <CardTitle className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {totalOrders.toLocaleString()}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8.2%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter>
                <div className="text-sm text-green-600 dark:text-green-400">
                  <Package className="inline h-4 w-4 mr-1" />
                  {Math.round(totalOrders / 7)} pedidos promedio/día
                </div>
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <CardDescription className="text-purple-600 dark:text-purple-400">Clientes Activos</CardDescription>
                <CardTitle className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {totalCustomers.toLocaleString()}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +15.3%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  <User className="inline h-4 w-4 mr-1" />
                  Excelente retención de usuarios
                </div>
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardDescription className="text-orange-600 dark:text-orange-400">Valor Promedio Pedido</CardDescription>
                <CardTitle className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                  {formatCLP(avgOrderValue)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5.7%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  <CreditCard className="inline h-4 w-4 mr-1" />
                  Mejora constante en ticket promedio
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Advanced Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="@container/chart">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evolución de Ingresos
                </CardTitle>
                <CardDescription>Ingresos y pedidos de los últimos 7 días</CardDescription>
                <CardAction>
                  <ToggleGroup type="single" value={timeRange} onValueChange={setTimeRange} variant="outline" size="sm">
                    <ToggleGroupItem value="7d">7 días</ToggleGroupItem>
                    <ToggleGroupItem value="30d">30 días</ToggleGroupItem>
                    <ToggleGroupItem value="90d">90 días</ToggleGroupItem>
                  </ToggleGroup>
                </CardAction>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent formatter={(value, name) => {
                        if (name === 'revenue') return [formatCLP(Number(value)), 'Ingresos'];
                        return [value, name];
                      }} />} 
                    />
                    <Area 
                      dataKey="revenue" 
                      type="monotone" 
                      fill="url(#fillRevenue)" 
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Distribución por Categorías
                </CardTitle>
                <CardDescription>Ventas por categoría de productos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-[200px]">
                    <ChartContainer config={{}} className="h-full w-full">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => [`${value}%`, 'Ventas']} />} />
                      </PieChart>
                    </ChartContainer>
                  </div>
                  <div className="space-y-4">
                    {categoryData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium">{item.category}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('cart')}>
              <CardContent className="p-6 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Gestionar Carrito</h3>
                <p className="text-muted-foreground text-sm">Ver y modificar productos en el carrito</p>
                {!isEmpty && (
                  <Badge className="mt-2">{cart.items.length} productos</Badge>
                )}
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('orders')}>
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Historial Pedidos</h3>
                <p className="text-muted-foreground text-sm">Revisar pedidos anteriores y estados</p>
                {userId && (
                  <Badge className="mt-2">Ver historial</Badge>
                )}
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('analytics')}>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Análisis Detallado</h3>
                <p className="text-muted-foreground text-sm">Métricas avanzadas y reportes</p>
                <Badge className="mt-2">Ver análisis</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SUPREME CART TAB */}
        <TabsContent value="cart" className="mt-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Carrito Inteligente</h2>
              <p className="text-muted-foreground">
                {!isEmpty ? `${cart.items.length} productos • Total: ${formatCLP(cart.total)}` : 'Tu carrito está vacío'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isEmpty && (
                <>
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Guardar carrito
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClear}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Vaciar carrito
                  </Button>
                </>
              )}
            </div>
          </div>

          {isEmpty ? (
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <CardContent className="py-24 text-center space-y-6">
                <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Tu carrito está vacío</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Descubre nuestros productos frescos y de calidad para llenar tu carrito
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link href="/products">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Explorar productos
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/categories">
                      Ver categorías
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 xl:grid-cols-3">
              {/* Enhanced Cart Items */}
              <div className="xl:col-span-2 space-y-4">
                {cart.items.map((item: CartItem & { product?: any }) => (
                  <Card key={item.productId} className="group hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <div className="relative h-24 w-24 lg:h-28 lg:w-28 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={item.product?.images?.[0]?.alt || item.product?.name || 'Producto'}
                            fill
                            sizes="(max-width: 1024px) 96px, 112px"
                            className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <Link href={`/products/${item.product?.slug}`}>
                                <h3 className="font-semibold text-lg hover:text-primary line-clamp-2 transition-colors">
                                  {item.product?.name || 'Producto'}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Precio unitario: {formatCLP(item.price)}</span>
                                {item.product?.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.product.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemove(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => handleUpdate(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number" 
                                  value={item.quantity} 
                                  className="w-20 text-center" 
                                  min={1}
                                  onChange={(e) => handleUpdate(item.productId, parseInt(e.target.value) || 1)}
                                />
                                <span className="text-sm text-muted-foreground">unidades</span>
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => handleUpdate(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-bold text-xl">{formatCLP(item.price * item.quantity)}</div>
                              {item.quantity > 1 && (
                                <div className="text-sm text-muted-foreground">({formatCLP(item.price)} c/u)</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Supreme Checkout Panel */}
              <div className="space-y-6">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Resumen del pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal ({cart.items.length} productos)</span>
                        <span className="font-medium">{formatCLP(cart.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>IVA (19%)</span>
                        <span className="font-medium">{formatCLP(cart.tax)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-2xl">{formatCLP(cart.total)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button asChild className="w-full h-12 text-lg font-semibold" size="lg">
                        <Link href="/checkout">
                          <CreditCard className="h-5 w-5 mr-2" />
                          Proceder al pago
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="w-full h-12" size="lg">
                        <Link href="/products">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Seguir comprando
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* SUPREME ORDERS TAB */}
        {userId && (
          <TabsContent value="orders" className="mt-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Historial de Pedidos</h2>
              <p className="text-muted-foreground">Gestiona y rastrea todos tus pedidos</p>
            </div>

            {orders === undefined ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : Array.isArray(orders) && orders.length > 0 ? (
              <div className="grid gap-6">
                {orders.map((order: Order) => (
                  <Card key={order._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-primary" />
                              <h4 className="font-bold text-lg">Pedido #{order.orderNumber}</h4>
                            </div>
                            <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'processing' ? 'secondary' : order.status === 'shipped' ? 'outline' : 'destructive'} className="text-xs">
                              {order.status === 'delivered' ? 'Entregado' :
                               order.status === 'processing' ? 'Procesando' :
                               order.status === 'shipped' ? 'Enviado' : 
                               order.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-4">
                          <div>
                            <div className="font-bold text-2xl">{formatCLP(order.totalAmount)}</div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="default" size="sm" className="w-full lg:w-auto">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <CardContent className="py-24 text-center space-y-6">
                  <Package className="h-24 w-24 mx-auto text-muted-foreground/50" />
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">Aún no tienes pedidos</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Una vez que realices tu primera compra, podrás ver todos tus pedidos aquí
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <Link href="/products">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Explorar productos
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* SUPREME ANALYTICS TAB */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Análisis Detallado</h2>
            <p className="text-muted-foreground">Métricas avanzadas de tus compras y preferencias</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-4 text-primary" />
                <div className="text-2xl font-bold">15</div>
                <p className="text-sm text-muted-foreground">Pedidos este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
                <div className="text-2xl font-bold">4.8</div>
                <p className="text-sm text-muted-foreground">Rating promedio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Heart className="h-8 w-8 mx-auto mb-4 text-red-500" />
                <div className="text-2xl font-bold">23</div>
                <p className="text-sm text-muted-foreground">Productos favoritos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-4 text-green-500" />
                <div className="text-2xl font-bold">+{formatCLP(12000)}</div>
                <p className="text-sm text-muted-foreground">Ahorros este año</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SUPREME PROFILE TAB */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Mi Perfil Completo</h2>
            <p className="text-muted-foreground">Gestiona tu información, direcciones y preferencias</p>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información de cuenta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userId ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Estado de cuenta</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <p className="font-semibold text-green-600">Usuario registrado</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Tipo de cuenta</Label>
                          <Badge variant="default">Premium</Badge>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="default" className="flex-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Gestionar cuenta
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Bell className="h-4 w-4 mr-2" />
                          Notificaciones
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Crea tu cuenta</h3>
                        <p className="text-muted-foreground">Accede a todas las funciones premium</p>
                      </div>
                      <div className="space-y-3">
                        <Button size="lg" className="w-full">Crear cuenta gratis</Button>
                        <Button variant="outline" size="lg" className="w-full">Iniciar sesión</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Acciones rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userId && (
                      <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => setActiveTab('orders')}>
                        <Package className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Mis pedidos</div>
                          <div className="text-sm text-muted-foreground">Ver historial</div>
                        </div>
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => setActiveTab('cart')}>
                      <ShoppingBag className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Mi carrito</div>
                        <div className="text-sm text-muted-foreground">Gestionar productos</div>
                      </div>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                      <Link href="/products">
                        <Eye className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Explorar</div>
                          <div className="text-sm text-muted-foreground">Ver productos</div>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ShoppingBag, Truck, Package, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCLP = (price: number) => new Intl.NumberFormat('es-CL', { 
  style: 'currency', 
  currency: 'CLP', 
  minimumFractionDigits: 0 
}).format(price);

interface FormErrors {
  [key: string]: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ShippingInfo {
  address: string;
  city: string;
  postalCode: string;
  region: string;
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const [currentStep, setCurrentStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '',
    city: '',
    postalCode: '',
    region: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const cartsApi: any = (api as any).carts;
  const cart = useQuery(cartsApi?.getUserCart, userId || sessionId ? { userId: userId ?? undefined, sessionId: userId ? undefined : sessionId } : undefined);
  const ordersApi: any = (api as any).orders;
  const createOrder = useMutation(ordersApi?.createOrder);

  const isEmpty = !cart || cart.items.length === 0;
  const hasFreeShipping = cart && cart.subtotal >= 20000;
  const shippingCost = hasFreeShipping ? 0 : 3000;
  const finalTotal = cart ? cart.total + shippingCost : 0;

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!customerInfo.firstName.trim()) newErrors.firstName = 'Nombre es requerido';
      if (!customerInfo.lastName.trim()) newErrors.lastName = 'Apellido es requerido';
      if (!customerInfo.email.trim()) newErrors.email = 'Email es requerido';
      if (!customerInfo.phone.trim()) newErrors.phone = 'Teléfono es requerido';
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (customerInfo.email && !emailRegex.test(customerInfo.email)) {
        newErrors.email = 'Email inválido';
      }
    }

    if (step === 2) {
      if (!shippingInfo.address.trim()) newErrors.address = 'Dirección es requerida';
      if (!shippingInfo.city.trim()) newErrors.city = 'Ciudad es requerida';
      if (!shippingInfo.postalCode.trim()) newErrors.postalCode = 'Código postal es requerido';
      if (!shippingInfo.region.trim()) newErrors.region = 'Región es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2) || !cart) return;

    try {
      await createOrder({
        userId: userId ?? undefined,
        sessionId: userId ? undefined : sessionId,
        customerInfo,
        shippingInfo,
        shippingCost,
        notes: '',
      });
      
      // Redirect to account/cart page
      router.push('/carrito');
    } catch (error) {
      console.error('Error creating order:', error);
      setErrors({ submit: 'Error al procesar el pedido. Inténtalo de nuevo.' });
    }
  };

  const steps = [
    { number: 1, title: 'Contacto', icon: Package, completed: currentStep > 1 },
    { number: 2, title: 'Envío', icon: Truck, completed: currentStep > 2 },
    { number: 3, title: 'Revisar', icon: CheckCircle, completed: false },
  ];

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
            <p className="text-muted-foreground mb-6">Agrega algunos productos antes de proceder al checkout.</p>
            <Button asChild>
              <Link href="/products">Explorar productos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                currentStep >= step.number 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-muted-foreground text-muted-foreground"
              )}>
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <div className={cn(
                "ml-3 hidden sm:block",
                currentStep >= step.number ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-16 h-0.5 ml-8 hidden sm:block",
                  currentStep > step.number ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Información de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      className={errors.firstName ? "border-destructive" : ""}
                    />
                    {errors.firstName && <p className="text-destructive text-sm">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      className={errors.lastName ? "border-destructive" : ""}
                    />
                    {errors.lastName && <p className="text-destructive text-sm">{errors.lastName}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className={errors.phone ? "border-destructive" : ""}
                    placeholder="+56 9 1234 5678"
                  />
                  {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Dirección de envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                    className={errors.address ? "border-destructive" : ""}
                    placeholder="Calle Principal 123, Depto 45"
                  />
                  {errors.address && <p className="text-destructive text-sm">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                      className={errors.city ? "border-destructive" : ""}
                      placeholder="Santiago"
                    />
                    {errors.city && <p className="text-destructive text-sm">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Código Postal *</Label>
                    <Input
                      id="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                      className={errors.postalCode ? "border-destructive" : ""}
                      placeholder="8320000"
                    />
                    {errors.postalCode && <p className="text-destructive text-sm">{errors.postalCode}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Región *</Label>
                  <Input
                    id="region"
                    value={shippingInfo.region}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, region: e.target.value }))}
                    className={errors.region ? "border-destructive" : ""}
                    placeholder="Región Metropolitana"
                  />
                  {errors.region && <p className="text-destructive text-sm">{errors.region}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen del pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Información de contacto</h4>
                      <p className="text-sm text-muted-foreground">
                        {customerInfo.firstName} {customerInfo.lastName}<br />
                        {customerInfo.email}<br />
                        {customerInfo.phone}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Dirección de envío</h4>
                      <p className="text-sm text-muted-foreground">
                        {shippingInfo.address}<br />
                        {shippingInfo.city}, {shippingInfo.region}<br />
                        {shippingInfo.postalCode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {errors.submit && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-primary">
                <CreditCard className="w-4 h-4 mr-2" />
                Finalizar pedido
              </Button>
            )}
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tu pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-medium">Productos</h3>
                {cart.items.map((item: any) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                        alt={item.product?.name || 'Producto'}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-1">{item.product?.name}</h4>
                      <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="font-semibold">
                      {formatCLP(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCLP(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA</span>
                  <span>{formatCLP(cart.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <div className="text-right">
                    {hasFreeShipping ? (
                      <div>
                        <span className="line-through text-muted-foreground text-sm">{formatCLP(3000)}</span>
                        <div className="text-green-600 font-medium">¡Gratis!</div>
                      </div>
                    ) : (
                      <span>{formatCLP(shippingCost)}</span>
                    )}
                  </div>
                </div>
                {!hasFreeShipping && (
                  <div className="text-sm text-muted-foreground">
                    Te faltan <span className="font-semibold">
                      {formatCLP(20000 - cart.subtotal)}
                    </span> para envío gratis
                  </div>
                )}
              </div>

              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCLP(finalTotal)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Pago seguro</p>
                  <p className="text-sm text-muted-foreground">Tus datos están protegidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
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

export default function CheckoutPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const cartsApi: any = (api as any).carts;
  const cart = useQuery(cartsApi?.getUserCart, userId || sessionId ? { 
    userId: userId ?? undefined, 
    sessionId: userId ? undefined : sessionId 
  } : undefined) as any;
  const ordersApi: any = (api as any).orders;
  const createOrder = useMutation(ordersApi?.createOrder);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'Chile',
    additionalInfo: '',
  });

  // Validation rules
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Required fields validation
    if (!form.name.trim()) newErrors.name = 'Nombre es requerido';
    if (!form.email.trim()) newErrors.email = 'Correo electrónico es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Correo electrónico no válido';
    }
    if (!form.street.trim()) newErrors.street = 'Dirección es requerida';
    if (!form.city.trim()) newErrors.city = 'Ciudad es requerida';
    if (!form.region.trim()) newErrors.region = 'Región es requerida';
    if (!form.postalCode.trim()) newErrors.postalCode = 'Código postal es requerido';

    // Phone validation (optional but if provided, should be valid Chilean format)
    if (form.phone.trim() && !/^(\+56|56)?[0-9]{8,9}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Formato de teléfono no válido (ej: +56987654321)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate shipping info
  const shippingInfo = useMemo(() => {
    if (!cart) return null;
    
    const subtotal = cart.subtotal || 0;
    const freeShippingThreshold = 15000;
    const shippingCost = subtotal >= freeShippingThreshold ? 0 : 2990;
    const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
    
    return {
      cost: shippingCost,
      isFree: shippingCost === 0,
      remainingForFree: remainingForFreeShipping,
      threshold: freeShippingThreshold
    };
  }, [cart]);

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate contact info
      const contactErrors: FormErrors = {};
      if (!form.name.trim()) contactErrors.name = 'Nombre es requerido';
      if (!form.email.trim()) contactErrors.email = 'Correo electrónico es requerido';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        contactErrors.email = 'Correo electrónico no válido';
      }
      
      if (Object.keys(contactErrors).length > 0) {
        setErrors(contactErrors);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate shipping info
      const shippingErrors: FormErrors = {};
      if (!form.street.trim()) shippingErrors.street = 'Dirección es requerida';
      if (!form.city.trim()) shippingErrors.city = 'Ciudad es requerida';
      if (!form.region.trim()) shippingErrors.region = 'Región es requerida';
      if (!form.postalCode.trim()) shippingErrors.postalCode = 'Código postal es requerido';
      
      if (Object.keys(shippingErrors).length > 0) {
        setErrors(shippingErrors);
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await createOrder({
        userId: userId ?? undefined,
        sessionId: userId ? undefined : sessionId,
        customerInfo: { 
          name: form.name, 
          email: form.email, 
          phone: form.phone || undefined 
        },
        shippingAddress: {
          street: form.street,
          city: form.city,
          region: form.region,
          postalCode: form.postalCode,
          country: form.country,
          additionalInfo: form.additionalInfo || undefined,
        },
        paymentMethod: 'stripe',
      });
      
      // Redirect to order confirmation or home
      router.push(`/order-confirmation?orderNumber=${result.orderNumber}`);
    } catch (error) {
      console.error('Order creation failed:', error);
      setErrors({ submit: 'Error al procesar el pedido. Inténtalo nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress indicator
  const steps = [
    { number: 1, title: 'Contacto', icon: Package, completed: currentStep > 1 },
    { number: 2, title: 'Envío', icon: Truck, completed: currentStep > 2 },
    { number: 3, title: 'Revisar', icon: CheckCircle, completed: false },
  ];

  if (!cart || !cart.items.length) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center space-y-4">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <p className="text-muted-foreground">
          Agrega algunos productos antes de proceder al checkout
        </p>
        <Button asChild>
          <Link href="/">Ir a la tienda</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8 ma-y-lg">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                step.completed 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : currentStep === step.number
                  ? "border-primary text-primary bg-primary/10"
                  : "border-muted-foreground/30 text-muted-foreground"
              )}>
                <step.icon className="w-5 h-5" />
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={cn(
                  "text-sm font-medium",
                  currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "ml-8 w-16 h-0.5 transition-colors",
                  step.completed ? "bg-primary" : "bg-muted-foreground/30"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          {/* Step 1: Contact Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Información de contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={cn(errors.name && "border-destructive")}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="text-sm text-destructive">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+56987654321"
                      className={cn(errors.phone && "border-destructive")}
                      aria-describedby={errors.phone ? "phone-error" : undefined}
                    />
                    {errors.phone && (
                      <p id="phone-error" className="text-sm text-destructive">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={cn(errors.email && "border-destructive")}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Shipping Address */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Dirección de envío
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="street">Calle y número *</Label>
                    <Input
                      id="street"
                      value={form.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      className={cn(errors.street && "border-destructive")}
                    />
                    {errors.street && (
                      <p className="text-sm text-destructive">{errors.street}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={cn(errors.city && "border-destructive")}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Región *</Label>
                    <Input
                      id="region"
                      value={form.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      className={cn(errors.region && "border-destructive")}
                    />
                    {errors.region && (
                      <p className="text-sm text-destructive">{errors.region}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Código postal *</Label>
                    <Input
                      id="postalCode"
                      value={form.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className={cn(errors.postalCode && "border-destructive")}
                    />
                    {errors.postalCode && (
                      <p className="text-sm text-destructive">{errors.postalCode}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={form.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Información adicional</Label>
                  <Input
                    id="additionalInfo"
                    value={form.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    placeholder="Referencia, depto, etc."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review Order */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Revisar pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Items */}
                <div className="space-y-4">
                  <h3 className="font-medium">Productos</h3>
                  <div className="space-y-3">
                    {cart.items.map((item: any) => (
                      <div key={item.productId} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="relative w-16 h-16 rounded overflow-hidden">
                          <Image
                            src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={item.product?.name || 'Producto'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium line-clamp-1">{item.product?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {item.quantity} × {formatCLP(item.price)}
                          </p>
                        </div>
                        <div className="font-semibold">
                          {formatCLP(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Customer Info Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Información de contacto</h3>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>{form.name}</p>
                      <p>{form.email}</p>
                      {form.phone && <p>{form.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Dirección de envío</h3>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>{form.street}</p>
                      <p>{form.city}, {form.region}</p>
                      <p>{form.postalCode}, {form.country}</p>
                      {form.additionalInfo && <p>{form.additionalInfo}</p>}
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.submit}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevStep}>
                Anterior
              </Button>
            )}
            {currentStep < 3 ? (
              <Button onClick={handleNextStep} className="ml-auto">
                Siguiente
              </Button>
            ) : (
              <Button 
                onClick={handlePlaceOrder} 
                disabled={isSubmitting}
                className="ml-auto"
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar pedido'}
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Free Shipping Progress */}
              {shippingInfo && shippingInfo.remainingForFree > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm">
                    Te faltan <span className="font-semibold">
                      {formatCLP(shippingInfo.remainingForFree)}
                    </span> para envío gratis
                  </p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ 
                        width: `${Math.min(100, (cart.subtotal / shippingInfo.threshold) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              {shippingInfo?.isFree && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ¡Envío gratis aplicado!
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCLP(cart.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span>
                    {shippingInfo?.isFree ? (
                      <Badge variant="secondary">Gratis</Badge>
                    ) : (
                      formatCLP(shippingInfo?.cost || 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (19%)</span>
                  <span>{formatCLP(cart.tax || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCLP((cart.total || 0) + (shippingInfo?.cost || 0))}</span>
                </div>
                <p className="text-xs text-muted-foreground">Impuestos incluidos</p>
              </div>
            </CardContent>
          </Card>

          {/* Security Badge */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="p-2 rounded-full bg-primary/10">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Pago seguro</p>
                  <p className="text-xs">
                    Tus datos están protegidos con encriptación SSL
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


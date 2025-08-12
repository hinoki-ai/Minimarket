'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const formatCLP = (price: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

export default function CheckoutPage() {
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const cartsApi: any = (api as any).carts;
  const cart = useQuery(cartsApi?.getUserCart, userId || sessionId ? { userId: userId ?? undefined, sessionId: userId ? undefined : sessionId } : undefined) as any;
  const ordersApi: any = (api as any).orders;
  const createOrder = useMutation(ordersApi?.createOrder);

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

  const handlePlaceOrder = async () => {
    if (!cart) return;
    await createOrder({
      userId: userId ?? undefined,
      sessionId: userId ? undefined : sessionId,
      customerInfo: { name: form.name, email: form.email, phone: form.phone || undefined },
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
    // After order creation, redirect to confirmation page (to be implemented)
    window.location.href = '/';
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Información de contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Correo electrónico" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Teléfono (opcional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Dirección de envío</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Calle y número" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              <Input placeholder="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input placeholder="Región" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              <Input placeholder="Código postal" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
              <Input placeholder="País" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              <Input placeholder="Información adicional (opcional)" value={form.additionalInfo} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="font-semibold text-lg">Resumen</h2>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCLP(cart?.subtotal || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">IVA (19%)</span>
              <span className="font-medium">{formatCLP(cart?.tax || 0)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold">{formatCLP(cart?.total || 0)}</span>
            </div>
            <Button className="w-full" onClick={handlePlaceOrder} disabled={!cart || (cart?.items?.length ?? 0) === 0}>Confirmar pedido</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

const CHILEAN_TAX_RATE = 0.19;

function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MM-${y}${m}${d}-${r}`;
}

// Get order by id
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    return order;
  },
});

// List orders for a user (order history)
export const listOrdersByUser = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { userId, limit = 20 } = args;
    const orders = await ctx.db
      .query("orders")
      .withIndex("byUser", (q) => q.eq("userId", userId))
      .collect();
    return orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

// Create order from current cart
export const createOrder = mutation({
  args: {
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
    }),
    shippingAddress: v.object({
      street: v.string(),
      city: v.string(),
      region: v.string(),
      postalCode: v.string(),
      country: v.string(),
      additionalInfo: v.optional(v.string()),
    }),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, sessionId } = args;

    // Load cart
    const cart = userId
      ? await ctx.db.query("carts").withIndex("byUser", (q) => q.eq("userId", userId)).unique()
      : sessionId
        ? await ctx.db.query("carts").withIndex("bySession", (q) => q.eq("sessionId", sessionId)).unique()
        : null;

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Validate availability and sync prices
    const products = await Promise.all(cart.items.map((it) => ctx.db.get(it.productId)));
    const validItems = cart.items.map((it, idx) => {
      const p = products[idx];
      if (!p || !p.isActive) throw new Error("Product not available");
      if (p.inventory.trackInventory && p.inventory.quantity < it.quantity) {
        throw new Error(`Insufficient stock for ${p.name}`);
      }
      return {
        ...it,
        price: p.price, // ensure current price
        snapshot: p,
      };
    });

    // Recalculate totals
    const subtotal = validItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const taxAmount = subtotal * CHILEAN_TAX_RATE;
    const shippingCost = subtotal >= 15000 ? 0 : 2990; // free shipping over $15.000
    const totalAmount = subtotal + taxAmount + shippingCost;

    // Reserve inventory
    await ctx.runMutation(api.products.reserveProductInventory, {
      items: validItems.map((it) => ({ productId: it.productId, quantity: it.quantity })),
    });

    // Create order
    const orderNumber = generateOrderNumber();
    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      orderNumber,
      userId,
      customerInfo: args.customerInfo,
      shippingAddress: args.shippingAddress,
      billingAddress: undefined,
      items: validItems.map((it) => ({
        productId: it.productId,
        name: it.snapshot!.name,
        sku: it.snapshot!.sku,
        quantity: it.quantity,
        unitPrice: it.price,
        totalPrice: it.price * it.quantity,
      })),
      subtotal,
      taxAmount,
      taxRate: CHILEAN_TAX_RATE,
      shippingCost,
      discountAmount: 0,
      totalAmount,
      currency: "CLP",
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: args.paymentMethod,
      paymentIntentId: undefined,
      shippingMethod: "standard",
      trackingNumber: undefined,
      estimatedDeliveryDate: undefined,
      createdAt: now,
      updatedAt: now,
      shippedAt: undefined,
      deliveredAt: undefined,
    });

    // Clear cart after creating order
    await ctx.db.delete(cart._id);

    return { orderId, orderNumber };
  },
});


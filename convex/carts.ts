import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Chilean IVA tax rate (19%)
const CHILEAN_TAX_RATE = 0.19;

// Get user's cart
export const getUserCart = query({
  args: { 
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, sessionId } = args;
    
    let cart;
    
    if (userId) {
      cart = await ctx.db.query("carts")
        .withIndex("byUser", (q) => q.eq("userId", userId))
        .unique();
    } else if (sessionId) {
      cart = await ctx.db.query("carts")
        .withIndex("bySession", (q) => q.eq("sessionId", sessionId))
        .unique();
    }
    
    if (!cart) {
      return null;
    }
    
    // Get product details for each cart item
    const cartWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          product,
        };
      })
    );
    
    return {
      ...cart,
      items: cartWithProducts,
    };
  },
});

// Add item to cart
export const addToCart = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { productId, quantity, userId, sessionId } = args;
    
    // Validate product exists and is active
    const product = await ctx.db.get(productId);
    if (!product || !product.isActive) {
      throw new Error("Product not found or inactive");
    }
    
    // Check inventory if tracked
    if (product.inventory.trackInventory && 
        product.inventory.quantity < quantity) {
      throw new Error("Insufficient stock");
    }
    
    // Find existing cart or create new one
    let cart;
    
    if (userId) {
      cart = await ctx.db.query("carts")
        .withIndex("byUser", (q) => q.eq("userId", userId))
        .unique();
    } else if (sessionId) {
      cart = await ctx.db.query("carts")
        .withIndex("bySession", (q) => q.eq("sessionId", sessionId))
        .unique();
    }
    
    const now = Date.now();
    
    if (cart) {
      // Update existing cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId === productId
      );
      
      let updatedItems;
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = cart.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity, addedAt: now }
            : item
        );
      } else {
        // Add new item
        updatedItems = [
          ...cart.items,
          {
            productId,
            quantity,
            price: product.price,
            addedAt: now,
          }
        ];
      }
      
      // Recalculate totals
      const subtotal = updatedItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      const tax = subtotal * CHILEAN_TAX_RATE;
      const total = subtotal + tax;
      
      await ctx.db.patch(cart._id, {
        items: updatedItems,
        subtotal,
        tax,
        total,
        updatedAt: now,
      });
      
      return cart._id;
    } else {
      // Create new cart
      const subtotal = product.price * quantity;
      const tax = subtotal * CHILEAN_TAX_RATE;
      const total = subtotal + tax;
      
      const cartId = await ctx.db.insert("carts", {
        userId,
        sessionId,
        items: [{
          productId,
          quantity,
          price: product.price,
          addedAt: now,
        }],
        subtotal,
        tax,
        total,
        currency: "CLP",
        expiresAt: sessionId ? now + (7 * 24 * 60 * 60 * 1000) : undefined, // 7 days for guest carts
        createdAt: now,
        updatedAt: now,
      });
      
      return cartId;
    }
  },
});

// Update cart item quantity
export const updateCartItem = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { productId, quantity, userId, sessionId } = args;
    
    // Find cart
    let cart;
    if (userId) {
      cart = await ctx.db.query("carts")
        .withIndex("byUser", (q) => q.eq("userId", userId))
        .unique();
    } else if (sessionId) {
      cart = await ctx.db.query("carts")
        .withIndex("bySession", (q) => q.eq("sessionId", sessionId))
        .unique();
    }
    
    if (!cart) {
      throw new Error("Cart not found");
    }
    
    // Check product availability
    const product = await ctx.db.get(productId);
    if (!product || !product.isActive) {
      throw new Error("Product not found or inactive");
    }
    
    if (product.inventory.trackInventory && 
        product.inventory.quantity < quantity) {
      throw new Error("Insufficient stock");
    }
    
    let updatedItems;
    if (quantity <= 0) {
      // Remove item from cart
      updatedItems = cart.items.filter(item => item.productId !== productId);
    } else {
      // Update quantity
      updatedItems = cart.items.map(item => 
        item.productId === productId 
          ? { ...item, quantity, price: product.price }
          : item
      );
    }
    
    // Recalculate totals
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    const tax = subtotal * CHILEAN_TAX_RATE;
    const total = subtotal + tax;
    
    await ctx.db.patch(cart._id, {
      items: updatedItems,
      subtotal,
      tax,
      total,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Remove item from cart
export const removeFromCart = mutation({
  args: {
    productId: v.id("products"),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { productId, userId, sessionId } = args;
    
    // Find cart
    let cart;
    if (userId) {
      cart = await ctx.db.query("carts")
        .withIndex("byUser", (q) => q.eq("userId", userId))
        .unique();
    } else if (sessionId) {
      cart = await ctx.db.query("carts")
        .withIndex("bySession", (q) => q.eq("sessionId", sessionId))
        .unique();
    }
    
    if (!cart) {
      throw new Error("Cart not found");
    }
    
    const updatedItems = cart.items.filter(item => item.productId !== productId);
    
    if (updatedItems.length === 0) {
      // Delete empty cart
      await ctx.db.delete(cart._id);
      return { success: true, cartDeleted: true };
    } else {
      // Recalculate totals
      const subtotal = updatedItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      const tax = subtotal * CHILEAN_TAX_RATE;
      const total = subtotal + tax;
      
      await ctx.db.patch(cart._id, {
        items: updatedItems,
        subtotal,
        tax,
        total,
        updatedAt: Date.now(),
      });
      
      return { success: true, cartDeleted: false };
    }
  },
});

// Clear cart
export const clearCart = mutation({
  args: {
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, sessionId } = args;
    
    let cart;
    if (userId) {
      cart = await ctx.db.query("carts")
        .withIndex("byUser", (q) => q.eq("userId", userId))
        .unique();
    } else if (sessionId) {
      cart = await ctx.db.query("carts")
        .withIndex("bySession", (q) => q.eq("sessionId", sessionId))
        .unique();
    }
    
    if (cart) {
      await ctx.db.delete(cart._id);
    }
    
    return { success: true };
  },
});

// Get cart item count
export const getCartItemCount = query({
  args: {
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, sessionId } = args;
    
    let cart;
    if (userId) {
      cart = await ctx.db.query("carts")
        .withIndex("byUser", (q) => q.eq("userId", userId))
        .unique();
    } else if (sessionId) {
      cart = await ctx.db.query("carts")
        .withIndex("bySession", (q) => q.eq("sessionId", sessionId))
        .unique();
    }
    
    if (!cart) {
      return 0;
    }
    
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },
});

// Validate cart before checkout
export const validateCart = query({
  args: {
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, sessionId } = args;
    
    let cart;
    if (userId) {
      cart = await ctx.db.query("carts")
        .withIndex("byUser", (q) => q.eq("userId", userId))
        .unique();
    } else if (sessionId) {
      cart = await ctx.db.query("carts")
        .withIndex("bySession", (q) => q.eq("sessionId", sessionId))
        .unique();
    }
    
    if (!cart || cart.items.length === 0) {
      return { valid: false, errors: ["Cart is empty"] };
    }
    
    const errors: string[] = [];
    const validItems = [];
    
    // Validate each item
    for (const item of cart.items) {
      const product = await ctx.db.get(item.productId);
      
      if (!product || !product.isActive) {
        errors.push(`Product ${item.productId} is no longer available`);
        continue;
      }
      
      // Check inventory
      if (product.inventory.trackInventory && 
          product.inventory.quantity < item.quantity) {
        errors.push(
          `${product.name} has insufficient stock (${product.inventory.quantity} available, ${item.quantity} requested)`
        );
        continue;
      }
      
      // Check if price has changed
      if (item.price !== product.price) {
        errors.push(`Price has changed for ${product.name}`);
        // Update with current price for recalculation
        validItems.push({
          ...item,
          price: product.price,
        });
      } else {
        validItems.push(item);
      }
    }
    
    // If there are price changes, recalculate cart totals
    if (validItems.some(item => 
      cart.items.find(cartItem => 
        cartItem.productId === item.productId && cartItem.price !== item.price
      )
    )) {
      const subtotal = validItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      const tax = subtotal * CHILEAN_TAX_RATE;
      const total = subtotal + tax;
      
      // Update cart with new prices
      await ctx.db.patch(cart._id, {
        items: validItems,
        subtotal,
        tax,
        total,
        updatedAt: Date.now(),
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      updatedCart: errors.length === 0 ? null : {
        ...cart,
        items: validItems,
      },
    };
  },
});

// Clean up expired guest carts (cron job)
export const cleanupExpiredCarts = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredCarts = await ctx.db.query("carts")
      .withIndex("byExpiry")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    
    let deletedCount = 0;
    for (const cart of expiredCarts) {
      await ctx.db.delete(cart._id);
      deletedCount++;
    }
    
    return { deletedCount };
  },
});

// Migrate guest cart to user cart (when user signs in)
export const migrateGuestCart = mutation({
  args: {
    sessionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { sessionId, userId } = args;
    
    // Find guest cart
    const guestCart = await ctx.db.query("carts")
      .withIndex("bySession", (q) => q.eq("sessionId", sessionId))
      .unique();
    
    if (!guestCart) {
      return { success: true, merged: false };
    }
    
    // Find existing user cart
    const userCart = await ctx.db.query("carts")
      .withIndex("byUser", (q) => q.eq("userId", userId))
      .unique();
    
    if (userCart) {
      // Merge carts
      const mergedItems = [...userCart.items];
      
      // Add guest cart items, merging quantities for duplicate products
      guestCart.items.forEach(guestItem => {
        const existingIndex = mergedItems.findIndex(
          item => item.productId === guestItem.productId
        );
        
        if (existingIndex >= 0) {
          mergedItems[existingIndex].quantity += guestItem.quantity;
        } else {
          mergedItems.push(guestItem);
        }
      });
      
      // Recalculate totals
      const subtotal = mergedItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      const tax = subtotal * CHILEAN_TAX_RATE;
      const total = subtotal + tax;
      
      // Update user cart
      await ctx.db.patch(userCart._id, {
        items: mergedItems,
        subtotal,
        tax,
        total,
        updatedAt: Date.now(),
      });
      
      // Delete guest cart
      await ctx.db.delete(guestCart._id);
      
      return { success: true, merged: true };
    } else {
      // Convert guest cart to user cart
      await ctx.db.patch(guestCart._id, {
        userId,
        sessionId: undefined,
        expiresAt: undefined,
        updatedAt: Date.now(),
      });
      
      return { success: true, merged: false, converted: true };
    }
  },
});
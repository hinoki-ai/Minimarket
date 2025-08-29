import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Shopping Cart Management System
 * 
 * Handles all cart operations including adding/removing items, calculating totals,
 * guest cart management, and cart-to-user migration for the Minimarket ARAMAC platform.
 * 
 * Features:
 * - Guest cart support with session-based identification
 * - User cart persistence across sessions
 * - Automatic cart migration when guest users sign in
 * - Chilean tax calculation (IVA 19%)
 * - Inventory validation and stock checking
 * - Price consistency validation
 * - Automatic cart cleanup for expired guest sessions
 * 
 * @fileoverview Cart management with Chilean e-commerce compliance
 * @version 1.0.0
 * @author Minimarket ARAMAC Development Team
 */

/** Chilean IVA tax rate (19%) as mandated by Chilean tax law */
const CHILEAN_TAX_RATE = 0.19;

/**
 * Retrieves the current user's shopping cart with full product details
 * 
 * Supports both authenticated users (via userId) and guest users (via sessionId).
 * Returns the cart with populated product information for each item.
 * 
 * @param userId - The authenticated user's ID (optional)
 * @param sessionId - The guest session ID for anonymous shopping (optional)
 * @returns The user's cart with product details, or null if no cart exists
 * 
 * @example
 * ```typescript
 * // For authenticated user
 * const cart = await getUserCart({ userId: "user_123" });
 * 
 * // For guest user
 * const cart = await getUserCart({ sessionId: "session_abc" });
 * ```
 */
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

/**
 * Adds a product to the user's shopping cart
 * 
 * Creates a new cart if one doesn't exist, or updates existing cart.
 * Handles inventory validation, stock checking, and automatic total calculation
 * including Chilean IVA tax. Supports both authenticated and guest users.
 * 
 * @param productId - The ID of the product to add
 * @param quantity - The quantity to add (must be positive)
 * @param userId - The authenticated user's ID (optional)
 * @param sessionId - The guest session ID (optional)
 * @returns The cart ID
 * 
 * @throws {Error} When product is not found, inactive, or insufficient stock
 * 
 * @example
 * ```typescript
 * // Add 2 items for authenticated user
 * await addToCart({
 *   productId: "prod_123",
 *   quantity: 2,
 *   userId: "user_123"
 * });
 * 
 * // Add 1 item for guest user
 * await addToCart({
 *   productId: "prod_123",
 *   quantity: 1,
 *   sessionId: "session_abc"
 * });
 * ```
 */
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

/**
 * Updates the quantity of an item in the user's cart
 * 
 * Can increase, decrease, or remove items (when quantity is 0 or less).
 * Performs inventory validation and recalculates cart totals including tax.
 * 
 * @param productId - The ID of the product to update
 * @param quantity - The new quantity (0 or less removes the item)
 * @param userId - The authenticated user's ID (optional)
 * @param sessionId - The guest session ID (optional)
 * @returns Success confirmation object
 * 
 * @throws {Error} When cart/product not found or insufficient stock
 * 
 * @example
 * ```typescript
 * // Update quantity to 3
 * await updateCartItem({
 *   productId: "prod_123",
 *   quantity: 3,
 *   userId: "user_123"
 * });
 * 
 * // Remove item (set quantity to 0)
 * await updateCartItem({
 *   productId: "prod_123",
 *   quantity: 0,
 *   userId: "user_123"
 * });
 * ```
 */
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

/**
 * Removes a specific product from the user's cart
 * 
 * Completely removes the item regardless of quantity. If this results in an empty cart,
 * the entire cart is deleted. Otherwise, totals are recalculated.
 * 
 * @param productId - The ID of the product to remove
 * @param userId - The authenticated user's ID (optional)
 * @param sessionId - The guest session ID (optional)
 * @returns Success object with cart deletion status
 * 
 * @throws {Error} When cart is not found
 * 
 * @example
 * ```typescript
 * const result = await removeFromCart({
 *   productId: "prod_123",
 *   userId: "user_123"
 * });
 * 
 * if (result.cartDeleted) {
 *   console.log("Cart was empty and deleted");
 * }
 * ```
 */
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

/**
 * Completely clears the user's shopping cart
 * 
 * Removes all items and deletes the entire cart from the database.
 * Used for cart abandonment cleanup or after successful checkout.
 * 
 * @param userId - The authenticated user's ID (optional)
 * @param sessionId - The guest session ID (optional)
 * @returns Success confirmation object
 * 
 * @example
 * ```typescript
 * // Clear authenticated user's cart
 * await clearCart({ userId: "user_123" });
 * 
 * // Clear guest cart
 * await clearCart({ sessionId: "session_abc" });
 * ```
 */
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

/**
 * Gets the total number of items in the user's cart
 * 
 * Returns the sum of quantities across all items in the cart.
 * Used for cart badge displays and quick cart status checks.
 * 
 * @param userId - The authenticated user's ID (optional)
 * @param sessionId - The guest session ID (optional)
 * @returns Total quantity of items in cart (0 if no cart exists)
 * 
 * @example
 * ```typescript
 * const itemCount = await getCartItemCount({ userId: "user_123" });
 * // Returns: 5 (if cart has 2x item A + 3x item B)
 * ```
 */
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

/**
 * Validates cart contents before checkout processing
 * 
 * Performs comprehensive validation including:
 * - Product availability and active status
 * - Inventory stock levels
 * - Price consistency (detects price changes)
 * - Cart emptiness check
 * 
 * Returns validation results with error details and suggested corrections.
 * 
 * @param userId - The authenticated user's ID (optional)
 * @param sessionId - The guest session ID (optional)
 * @returns Validation result with errors and updated cart data
 * 
 * @example
 * ```typescript
 * const validation = await validateCart({ userId: "user_123" });
 * 
 * if (!validation.valid) {
 *   console.log("Cart errors:", validation.errors);
 *   if (validation.updatedCart) {
 *     // Use updated cart with current prices
 *   }
 * }
 * ```
 */
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
    
    // If there are price changes, recompute totals. Since this is a query, we
    // cannot write to the database here. The client can call a mutation to
    // apply these changes using the returned `updatedCart` payload.
    let recomputed: { subtotal: number; tax: number; total: number } | null = null;
    if (
      validItems.some((item) =>
        cart.items.find((cartItem: { productId: Id<"products">; price: number }) =>
          cartItem.productId === item.productId && cartItem.price !== item.price
        )
      )
    ) {
      const subtotal = validItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      const tax = subtotal * CHILEAN_TAX_RATE;
      const total = subtotal + tax;
      recomputed = { subtotal, tax, total };
    }
    
    return {
      valid: errors.length === 0,
      errors,
      updatedCart: errors.length === 0 ? null : {
        ...cart,
        items: validItems,
        ...(recomputed ?? {}),
      },
    };
  },
});

/**
 * Cleans up expired guest shopping carts
 * 
 * Automatically removes guest carts that have exceeded their expiration time
 * (default: 7 days). This function should be called periodically as a cron job
 * to prevent database bloat from abandoned guest carts.
 * 
 * @returns Object with count of deleted carts
 * 
 * @example
 * ```typescript
 * // Run as scheduled job
 * const result = await cleanupExpiredCarts({});
 * console.log(`Cleaned up ${result.deletedCount} expired carts`);
 * ```
 * 
 * @cron Should be run daily to maintain database performance
 */
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

/**
 * Migrates a guest cart to a user cart when user signs in
 * 
 * Handles three scenarios:
 * 1. User has no existing cart - Convert guest cart to user cart
 * 2. User has existing cart - Merge guest items into user cart
 * 3. No guest cart exists - No action needed
 * 
 * Automatically handles quantity merging for duplicate products and
 * recalculates all totals including Chilean IVA tax.
 * 
 * @param sessionId - The guest session ID to migrate from
 * @param userId - The authenticated user ID to migrate to
 * @returns Migration result with success status and operation type
 * 
 * @example
 * ```typescript
 * const result = await migrateGuestCart({
 *   sessionId: "guest_session_123",
 *   userId: "user_456"
 * });
 * 
 * if (result.merged) {
 *   console.log("Guest cart merged with existing user cart");
 * } else if (result.converted) {
 *   console.log("Guest cart converted to user cart");
 * }
 * ```
 * 
 * @important This should be called immediately after user authentication
 */
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
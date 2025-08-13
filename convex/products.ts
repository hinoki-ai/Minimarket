import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get all active products with pagination
export const getProducts = query({
  args: { 
    categoryId: v.optional(v.id("categories")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    sortBy: v.optional(v.union(v.literal("price"), v.literal("name"), v.literal("popularity"), v.literal("newest"))),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { categoryId, limit = 20, sortBy = "newest", minPrice, maxPrice, tags } = args;
    
    // Use indexes where available
    let base = ctx.db.query("products").withIndex("byActive", (q) => q.eq("isActive", true));
    if (categoryId) {
      base = ctx.db.query("products").withIndex("byCategory", (q) => q.eq("categoryId", categoryId).eq("isActive", true));
    }

    // Collect and filter client-side only for fields without compound indexes
    let products = await base.collect();

    if (typeof minPrice === 'number') {
      products = products.filter((p) => p.price >= minPrice);
    }
    if (typeof maxPrice === 'number') {
      products = products.filter((p) => p.price <= maxPrice);
    }
    if (tags && tags.length > 0) {
      products = products.filter((p) => tags.every((t) => p.tags.includes(t)));
    }

    // Apply sorting
    switch (sortBy) {
      case "price":
        products.sort((a, b) => a.price - b.price);
        break;
      case "name":
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "popularity":
        products.sort((a, b) => {
          if (a.freshness?.isPopular && !b.freshness?.isPopular) return -1;
          if (!a.freshness?.isPopular && b.freshness?.isPopular) return 1;
          return b.createdAt - a.createdAt;
        });
        break;
      case "newest":
      default:
        products.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }
    
    return products.slice(0, limit);
  },
});

// Get featured products for homepage
export const getFeaturedProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { limit = 8 } = args;
    
    return await ctx.db.query("products")
      .withIndex("byFeatured", (q) => q.eq("isFeatured", true).eq("isActive", true))
      .order("desc")
      .take(limit);
  },
});

// Get fresh/new products (konbini-style)
export const getFreshProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { limit = 6 } = args;
    
    const allProducts = await ctx.db.query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Filter for fresh products and sort by freshness
    const freshProducts = allProducts
      .filter(product => product.freshness?.isFresh || product.freshness?.isNew)
      .sort((a, b) => {
        // Prioritize new over just fresh
        if (a.freshness?.isNew && !b.freshness?.isNew) return -1;
        if (!a.freshness?.isNew && b.freshness?.isNew) return 1;
        return b.createdAt - a.createdAt;
      });
    
    return freshProducts.slice(0, limit);
  },
});

// Get single product by slug
export const getProductBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db.query("products")
      .withIndex("bySlug", (q) => q.eq("slug", args.slug))
      .unique();
    
    if (!product || !product.isActive) {
      return null;
    }
    
    return product;
  },
});

// Search products
export const searchProducts = query({
  args: { 
    searchTerm: v.string(),
    categoryId: v.optional(v.id("categories")),
    limit: v.optional(v.number()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { searchTerm, categoryId, limit = 20, minPrice, maxPrice, tags } = args;
    
    let results = await ctx.db.query("products")
      .withSearchIndex("search_products", (q) => {
        let s = q.search("name", searchTerm).eq("isActive", true);
        if (categoryId) {
          s = s.eq("categoryId", categoryId);
        }
        return s;
      })
      .take(limit * 5); // overfetch, filter client-side, then slice

    if (typeof minPrice === 'number') {
      results = results.filter((p) => p.price >= minPrice);
    }
    if (typeof maxPrice === 'number') {
      results = results.filter((p) => p.price <= maxPrice);
    }
    if (tags && tags.length > 0) {
      results = results.filter((p) => tags.every((t) => p.tags.includes(t)));
    }
    
    return results.slice(0, limit);
  },
});

// Get product recommendations
export const getRecommendedProducts = query({
  args: { 
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { productId, limit = 4 } = args;
    
    const product = await ctx.db.get(productId);
    if (!product) return [];
    
    // Get products from the same category
    const recommendations = await ctx.db.query("products")
      .withIndex("byCategory", (q) => 
        q.eq("categoryId", product.categoryId).eq("isActive", true)
      )
      .filter((q) => q.neq(q.field("_id"), productId))
      .take(limit);
    
    return recommendations;
  },
});

// Check product availability
export const checkProductAvailability = query({
  args: { productId: v.id("products"), quantity: v.number() },
  handler: async (ctx, args) => {
    const { productId, quantity } = args;
    
    const product = await ctx.db.get(productId);
    if (!product || !product.isActive) {
      return { available: false, reason: "product_not_found" };
    }
    
    if (!product.inventory.trackInventory) {
      return { available: true, inStock: true };
    }
    
    const available = product.inventory.quantity >= quantity;
    const lowStock = product.inventory.quantity <= product.inventory.lowStockThreshold;
    
    return {
      available,
      inStock: product.inventory.quantity > 0,
      lowStock,
      quantity: product.inventory.quantity,
      reason: !available ? "insufficient_stock" : undefined,
    };
  },
});

// Get low stock products (admin)
export const getLowStockProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return products.filter(product => 
      product.inventory.trackInventory && 
      product.inventory.quantity <= product.inventory.lowStockThreshold
    );
  },
});

// Update product inventory
export const updateProductInventory = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    type: v.union(v.literal("stock_in"), v.literal("stock_out"), v.literal("adjustment")),
    reason: v.optional(v.string()),
    orderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    const { productId, quantity, type, reason, orderId } = args;
    
    const product = await ctx.db.get(productId);
    if (!product) {
      throw new Error("Product not found");
    }
    
    const previousQuantity = product.inventory.quantity;
    let newQuantity: number;
    
    switch (type) {
      case "stock_in":
        newQuantity = previousQuantity + quantity;
        break;
      case "stock_out":
        newQuantity = Math.max(0, previousQuantity - quantity);
        break;
      case "adjustment":
        newQuantity = quantity;
        break;
    }
    
    // Update product inventory
    await ctx.db.patch(productId, {
      inventory: {
        ...product.inventory,
        quantity: newQuantity,
      },
      updatedAt: Date.now(),
    });
    
    // Log the inventory change
    await ctx.db.insert("inventoryLogs", {
      productId,
      type,
      quantity: type === "stock_out" ? -quantity : quantity,
      previousQuantity,
      newQuantity,
      reason,
      orderId,
      createdAt: Date.now(),
    });
    
    return { success: true, newQuantity, previousQuantity };
  },
});

// Reserve product inventory (for checkout)
export const reserveProductInventory = mutation({
  args: {
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
    orderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    const { items, orderId } = args;
    const reservations = [];
    
    // Check availability for all items first
    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      if (!product || !product.isActive) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      if (product.inventory.trackInventory && 
          product.inventory.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
    }
    
    // Reserve inventory for all items
    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;
      
      if (product.inventory.trackInventory) {
        const newQuantity = product.inventory.quantity - item.quantity;
        
        await ctx.db.patch(item.productId, {
          inventory: {
            ...product.inventory,
            quantity: newQuantity,
          },
          updatedAt: Date.now(),
        });
        
        // Log the reservation
        await ctx.db.insert("inventoryLogs", {
          productId: item.productId,
          type: "reserved",
          quantity: -item.quantity,
          previousQuantity: product.inventory.quantity,
          newQuantity,
          reason: "Order reservation",
          orderId,
          createdAt: Date.now(),
        });
        
        reservations.push({
          productId: item.productId,
          quantity: item.quantity,
          reserved: true,
        });
      } else {
        reservations.push({
          productId: item.productId,
          quantity: item.quantity,
          reserved: false,
        });
      }
    }
    
    return reservations;
  },
});
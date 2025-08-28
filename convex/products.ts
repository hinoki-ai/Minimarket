import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

/**
 * Get all active products with server-side filtering and pagination
 * Optimized with proper indexing to avoid client-side filtering
 */
export const getProducts = query({
  args: { 
    categoryId: v.optional(v.id("categories")),
    paginationOpts: paginationOptsValidator,
    sortBy: v.optional(v.union(v.literal("price"), v.literal("name"), v.literal("popularity"), v.literal("newest"))),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.object({
    page: v.array(v.any()), // Product documents
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const { categoryId, paginationOpts, sortBy = "newest", minPrice, maxPrice, tags } = args;
    
    // Use appropriate index based on filters
    let query;
    
    if (categoryId) {
      query = ctx.db.query("products")
        .withIndex("byCategory", (q) => q.eq("categoryId", categoryId).eq("isActive", true));
    } else if (sortBy === "price" && minPrice !== undefined) {
      query = ctx.db.query("products")
        .withIndex("byPrice", (q) => q.gte("price", minPrice))
        .filter((q) => q.eq(q.field("isActive"), true));
    } else if (sortBy === "popularity") {
      query = ctx.db.query("products")
        .withIndex("byPopular", (q) => q.eq("freshness.isPopular", true).eq("isActive", true));
    } else {
      query = ctx.db.query("products")
        .withIndex("byActive", (q) => q.eq("isActive", true));
    }

    // Apply additional filters that don't have indexes
    if (maxPrice !== undefined && sortBy !== "price") {
      query = query.filter((q) => q.lte(q.field("price"), maxPrice));
    }
    if (minPrice !== undefined && sortBy !== "price") {
      query = query.filter((q) => q.gte(q.field("price"), minPrice));
    }
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        query = query.filter((q) => q.any(q.field("tags"), (t) => q.eq(t, tag)));
      }
    }

    // Apply sorting order
    switch (sortBy) {
      case "price":
        query = query.order("asc");
        break;
      case "popularity":
      case "newest":
      default:
        query = query.order("desc");
        break;
      case "name":
        // For name sorting, we'll need to collect and sort client-side as it's not indexed
        const results = await query.paginate(paginationOpts);
        const sortedPage = [...results.page].sort((a, b) => a.name.localeCompare(b.name));
        return {
          ...results,
          page: sortedPage,
        };
    }
    
    return await query.paginate(paginationOpts);
  },
});

/**
 * Get featured products for homepage with proper typing
 */
export const getFeaturedProducts = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.any()), // Product documents
  handler: async (ctx, args) => {
    const { limit = 8 } = args;
    
    return await ctx.db.query("products")
      .withIndex("byFeatured", (q) => q.eq("isFeatured", true).eq("isActive", true))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get fresh/new products (konbini-style) with optimized filtering
 */
export const getFreshProducts = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.any()), // Product documents
  handler: async (ctx, args) => {
    const { limit = 6 } = args;
    
    // Use proper filtering instead of collecting all products
    const freshProducts = await ctx.db.query("products")
      .withIndex("byActive", (q) => q.eq("isActive", true))
      .filter((q) => q.or(
        q.eq(q.field("freshness.isFresh"), true),
        q.eq(q.field("freshness.isNew"), true)
      ))
      .order("desc") // Sort by createdAt descending (newest first)
      .take(limit * 2); // Take more than needed to account for sorting preferences
    
    // Sort with priority for new products
    const sortedProducts = freshProducts.sort((a, b) => {
      // Prioritize new over just fresh
      if (a.freshness?.isNew && !b.freshness?.isNew) return -1;
      if (!a.freshness?.isNew && b.freshness?.isNew) return 1;
      return b.createdAt - a.createdAt;
    });
    
    return sortedProducts.slice(0, limit);
  },
});

/**
 * Get single product by slug with proper return typing
 */
export const getProductBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.any(), v.null()), // Product document or null
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

/**
 * Search products with optimized filtering and pagination
 */
export const searchProducts = query({
  args: { 
    searchTerm: v.string(),
    categoryId: v.optional(v.id("categories")),
    paginationOpts: paginationOptsValidator,
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.object({
    page: v.array(v.any()), // Product documents
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const { searchTerm, categoryId, paginationOpts, minPrice, maxPrice, tags } = args;
    
    let query = ctx.db.query("products")
      .withSearchIndex("search_products", (q) => {
        let s = q.search("name", searchTerm).eq("isActive", true);
        if (categoryId) {
          s = s.eq("categoryId", categoryId);
        }
        return s;
      });

    // Apply price filters at database level
    if (typeof minPrice === 'number') {
      query = query.filter((q) => q.gte(q.field("price"), minPrice));
    }
    if (typeof maxPrice === 'number') {
      query = query.filter((q) => q.lte(q.field("price"), maxPrice));
    }
    
    // Apply tag filters at database level
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        query = query.filter((q) => q.any(q.field("tags"), (t) => q.eq(t, tag)));
      }
    }
    
    return await query.paginate(paginationOpts);
  },
});

/**
 * Get product recommendations with proper typing
 */
export const getRecommendedProducts = query({
  args: { 
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()), // Product documents
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

/**
 * Check product availability with proper return typing
 */
export const checkProductAvailability = query({
  args: { productId: v.id("products"), quantity: v.number() },
  returns: v.object({
    available: v.boolean(),
    inStock: v.optional(v.boolean()),
    lowStock: v.optional(v.boolean()),
    quantity: v.optional(v.number()),
    reason: v.optional(v.string()),
  }),
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

/**
 * Get low stock products (admin) with optimized filtering
 */
export const getLowStockProducts = query({
  args: {},
  returns: v.array(v.any()), // Product documents
  handler: async (ctx) => {
    // Use compound filtering instead of collecting all products
    return await ctx.db.query("products")
      .withIndex("byActive", (q) => q.eq("isActive", true))
      .filter((q) => q.and(
        q.eq(q.field("inventory.trackInventory"), true),
        q.lte(q.field("inventory.quantity"), q.field("inventory.lowStockThreshold"))
      ))
      .collect();
  },
});

/**
 * Update product inventory with proper typing and error handling
 */
export const updateProductInventory = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    type: v.union(v.literal("stock_in"), v.literal("stock_out"), v.literal("adjustment")),
    reason: v.optional(v.string()),
    orderId: v.optional(v.id("orders")),
  },
  returns: v.object({
    success: v.boolean(),
    newQuantity: v.number(),
    previousQuantity: v.number(),
  }),
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

/**
 * Reserve product inventory (for checkout) with proper typing
 */
export const reserveProductInventory = mutation({
  args: {
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
    orderId: v.optional(v.id("orders")),
  },
  returns: v.array(v.object({
    productId: v.id("products"),
    quantity: v.number(),
    reserved: v.boolean(),
  })),
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

/**
 * Bulk upsert products from scraper output with proper typing
 */
export const bulkUpsertFromScrape = mutation({
  args: {
    products: v.array(v.object({
      name: v.string(),
      brand: v.optional(v.string()),
      description: v.string(),
      shortDescription: v.optional(v.string()),
      category: v.string(),
      price: v.number(),
      currency: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      imageUrls: v.optional(v.array(v.string())),
      sku: v.optional(v.string()),
      barcode: v.optional(v.string()),
      slug: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })),
    defaultTaxRate: v.optional(v.number()),
    defaultQuantity: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    created: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx, args) => {
    const { products, defaultTaxRate = 0.19, defaultQuantity = 0 } = args;

    const now = Date.now();

    // Cache categories by slug to reduce DB lookups
    const categoryCache = new Map<string, Id<"categories">>();

    const ensureSlug = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}+/gu, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const getOrCreateCategory = async (slug: string, name?: string) => {
      const s = ensureSlug(slug);
      if (categoryCache.has(s)) return categoryCache.get(s)!;
      const existing = await ctx.db
        .query("categories")
        .withIndex("bySlug", (q) => q.eq("slug", s))
        .unique();
      if (existing) {
        categoryCache.set(s, existing._id);
        return existing._id;
      }
      const categoryId = await ctx.db.insert("categories", {
        name: name || slug,
        nameJA: undefined,
        slug: s,
        description: undefined,
        parentId: undefined,
        sortOrder: 999,
        isActive: true,
        icon: undefined,
        color: undefined,
        createdAt: now,
        updatedAt: now,
      });
      categoryCache.set(s, categoryId);
      return categoryId;
    };

    let created = 0;
    let updated = 0;

    for (const p of products) {
      const slug = ensureSlug(p.slug || p.name);
      const categoryId = await getOrCreateCategory(p.category, p.category);

      // Attempt upsert by slug
      const existing = await ctx.db
        .query("products")
        .withIndex("bySlug", (q) => q.eq("slug", slug))
        .unique();

      const images = (() => {
        const urls: string[] = [];
        if (p.imageUrl) urls.push(p.imageUrl);
        if (p.imageUrls) urls.push(...p.imageUrls);
        const dedup = Array.from(new Set(urls.filter(Boolean)));
        return dedup.map((url, i) => ({ url, alt: p.name, sortOrder: i }));
      })();

      const doc = {
        name: p.name,
        nameJA: undefined as string | undefined,
        slug,
        description: p.description,
        shortDescription: p.shortDescription,
        sku: p.sku || slug,
        barcode: p.barcode,
        categoryId,
        price: p.price,
        compareAtPrice: undefined as number | undefined,
        cost: undefined as number | undefined,
        taxRate: defaultTaxRate,
        inventory: {
          quantity: defaultQuantity,
          lowStockThreshold: 5,
          trackInventory: true,
          allowBackorder: false,
        },
        images,
        weight: undefined as number | undefined,
        dimensions: undefined as any,
        freshness: undefined as any,
        nutrition: undefined as any,
        metaTitle: undefined as string | undefined,
        metaDescription: undefined as string | undefined,
        tags: p.tags || [],
        isActive: true,
        isFeatured: false,
        isDigital: false,
        requiresShipping: true,
        createdAt: now,
        updatedAt: now,
      };

      if (!existing) {
        await ctx.db.insert("products", doc as any);
        created++;
      } else {
        await ctx.db.patch(existing._id, {
          ...doc,
          createdAt: existing.createdAt,
          updatedAt: now,
        } as any);
        updated++;
      }
    }

    return { success: true, created, updated };
  },
});
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { paymentAttemptSchemaValidator } from "./paymentAttemptTypes";

export default defineSchema({
    users: defineTable({
      name: v.string(),
      // this the Clerk ID, stored in the subject JWT field
      externalId: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.object({
        street: v.string(),
        city: v.string(),
        region: v.string(),
        postalCode: v.string(),
        country: v.string(),
      })),
      preferences: v.optional(v.object({
        language: v.string(), // "es-CL", "ja", etc.
        currency: v.string(), // "CLP", "JPY", etc.
        notifications: v.boolean(),
      })),
      createdAt: v.number(),
      lastLoginAt: v.optional(v.number()),
    }).index("byExternalId", ["externalId"])
      .index("byEmail", ["email"]),
    
    // Japanese-inspired category system with Chilean market adaptation
    categories: defineTable({
      name: v.string(),
      nameJA: v.optional(v.string()), // Japanese name for cultural authenticity
      slug: v.string(),
      description: v.optional(v.string()),
      parentId: v.optional(v.id("categories")), // Hierarchical structure
      sortOrder: v.number(),
      isActive: v.boolean(),
      icon: v.optional(v.string()), // Icon identifier
      color: v.optional(v.string()), // Color coding like konbini
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("bySlug", ["slug"])
      .index("byParent", ["parentId"])
      .index("byActive", ["isActive", "sortOrder"]),
    
    // Products with Japanese categorization and Chilean pricing
    products: defineTable({
      name: v.string(),
      nameJA: v.optional(v.string()),
      slug: v.string(),
      description: v.string(),
      shortDescription: v.optional(v.string()),
      sku: v.string(),
      barcode: v.optional(v.string()),
      categoryId: v.id("categories"),
      
      // Pricing in Chilean Pesos
      price: v.number(),
      compareAtPrice: v.optional(v.number()), // For showing discounts
      cost: v.optional(v.number()), // Admin only
      taxRate: v.number(), // Chilean IVA (19%)
      
      // Inventory
      inventory: v.object({
        quantity: v.number(),
        lowStockThreshold: v.number(),
        trackInventory: v.boolean(),
        allowBackorder: v.boolean(),
      }),
      
      // Product attributes
      images: v.array(v.object({
        url: v.string(),
        alt: v.string(),
        sortOrder: v.number(),
      })),
      weight: v.optional(v.number()),
      dimensions: v.optional(v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
      })),
      
      // Japanese-style freshness and quality indicators
      freshness: v.optional(v.object({
        expiryDate: v.optional(v.number()),
        isFresh: v.boolean(),
        isNew: v.boolean(),
        isPopular: v.boolean(),
      })),
      
      // Nutritional info for food products
      nutrition: v.optional(v.object({
        calories: v.optional(v.number()),
        allergens: v.optional(v.array(v.string())),
        ingredients: v.optional(v.array(v.string())),
      })),
      
      // SEO and metadata
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      tags: v.array(v.string()),
      
      // Status flags
      isActive: v.boolean(),
      isFeatured: v.boolean(),
      isDigital: v.boolean(),
      requiresShipping: v.boolean(),
      
      // Timestamps
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("bySlug", ["slug"])
      .index("bySku", ["sku"])
      .index("byBarcode", ["barcode"])
      .index("byCategory", ["categoryId", "isActive"])
      .index("byActive", ["isActive", "createdAt"])
      .index("byFeatured", ["isFeatured", "isActive"])
      .index("byPopular", ["freshness.isPopular", "isActive"])
      .index("byPrice", ["price", "isActive"])
      .searchIndex("search_products", {
        searchField: "name",
        filterFields: ["categoryId", "isActive", "tags"]
      }),
    
    // Shopping cart for real-time sync
    carts: defineTable({
      userId: v.optional(v.string()), // Optional for guest carts
      sessionId: v.optional(v.string()), // For guest cart persistence
      items: v.array(v.object({
        productId: v.id("products"),
        quantity: v.number(),
        price: v.number(), // Price at time of adding
        addedAt: v.number(),
      })),
      subtotal: v.number(),
      tax: v.number(),
      total: v.number(),
      currency: v.string(),
      expiresAt: v.optional(v.number()), // For guest cart cleanup
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("byUser", ["userId"])
      .index("bySession", ["sessionId"])
      .index("byExpiry", ["expiresAt"]),
    
    // Orders with Chilean tax and shipping considerations
    orders: defineTable({
      orderNumber: v.string(),
      userId: v.optional(v.string()), // Optional for guest orders
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
      }),
      
      // Shipping address
      shippingAddress: v.object({
        street: v.string(),
        city: v.string(),
        region: v.string(),
        postalCode: v.string(),
        country: v.string(),
        additionalInfo: v.optional(v.string()),
      }),
      billingAddress: v.optional(v.object({
        street: v.string(),
        city: v.string(),
        region: v.string(),
        postalCode: v.string(),
        country: v.string(),
      })),
      
      // Order items snapshot
      items: v.array(v.object({
        productId: v.id("products"),
        name: v.string(),
        sku: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        totalPrice: v.number(),
      })),
      
      // Pricing breakdown
      subtotal: v.number(),
      taxAmount: v.number(),
      taxRate: v.number(),
      shippingCost: v.number(),
      discountAmount: v.optional(v.number()),
      totalAmount: v.number(),
      currency: v.string(),
      
      // Order status
      status: v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled"),
        v.literal("refunded")
      ),
      
      // Payment info
      paymentStatus: v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("paid"),
        v.literal("failed"),
        v.literal("cancelled"),
        v.literal("refunded")
      ),
      paymentMethod: v.optional(v.string()),
      paymentIntentId: v.optional(v.string()),
      
      // Shipping info
      shippingMethod: v.optional(v.string()),
      trackingNumber: v.optional(v.string()),
      estimatedDeliveryDate: v.optional(v.number()),
      
      // Timestamps
      createdAt: v.number(),
      updatedAt: v.number(),
      shippedAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
    }).index("byOrderNumber", ["orderNumber"])
      .index("byUser", ["userId"])
      .index("byStatus", ["status", "createdAt"])
      .index("byPaymentStatus", ["paymentStatus"])
      .index("byCreatedAt", ["createdAt"]),
    
    // Inventory tracking for real-time stock management
    inventoryLogs: defineTable({
      productId: v.id("products"),
      type: v.union(
        v.literal("stock_in"),
        v.literal("stock_out"),
        v.literal("reserved"),
        v.literal("released"),
        v.literal("adjustment")
      ),
      quantity: v.number(), // Positive for in, negative for out
      previousQuantity: v.number(),
      newQuantity: v.number(),
      reason: v.optional(v.string()),
      orderId: v.optional(v.id("orders")),
      userId: v.optional(v.string()),
      createdAt: v.number(),
    }).index("byProduct", ["productId", "createdAt"])
      .index("byType", ["type", "createdAt"])
      .index("byOrder", ["orderId"]),
    
    // Reviews and ratings
    reviews: defineTable({
      productId: v.id("products"),
      userId: v.optional(v.string()),
      orderId: v.optional(v.id("orders")),
      customerName: v.string(),
      rating: v.number(), // 1-5 scale
      title: v.optional(v.string()),
      content: v.optional(v.string()),
      isVerifiedPurchase: v.boolean(),
      isApproved: v.boolean(),
      helpfulVotes: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("byProduct", ["productId", "isApproved"])
      .index("byUser", ["userId"])
      .index("byRating", ["rating", "isApproved"]),
    
    paymentAttempts: defineTable(paymentAttemptSchemaValidator)
      .index("byPaymentId", ["payment_id"])
      .index("byUserId", ["userId"])
      .index("byPayerUserId", ["payer.user_id"]),
  });
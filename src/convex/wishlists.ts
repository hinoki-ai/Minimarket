import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get wishlist items for a user
export const getWishlist = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("wishlists")
      .withIndex("byUser", (q) => q.eq("userId", args.userId))
      .collect();
    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Toggle wishlist item
export const toggleWishlist = mutation({
  args: { userId: v.string(), productId: v.id("products") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wishlists")
      .withIndex("byUserProduct", (q) => q.eq("userId", args.userId).eq("productId", args.productId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { added: false };
    }
    await ctx.db.insert("wishlists", { userId: args.userId, productId: args.productId, createdAt: Date.now() });
    return { added: true };
  },
});


import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List approved reviews for a product
export const listReviews = query({
  args: { productId: v.id("products"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { productId, limit = 10 } = args;
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("byProduct", (q) => q.eq("productId", productId).eq("isApproved", true))
      .collect();
    return reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

// Add a review (requires minimal fields); moderation can approve later
export const addReview = mutation({
  args: {
    productId: v.id("products"),
    userId: v.optional(v.string()),
    orderId: v.optional(v.id("orders")),
    customerName: v.string(),
    rating: v.number(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    isVerifiedPurchase: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const reviewId = await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: args.userId,
      orderId: args.orderId,
      customerName: args.customerName,
      rating: Math.max(1, Math.min(5, args.rating)),
      title: args.title,
      content: args.content,
      isVerifiedPurchase: args.isVerifiedPurchase ?? false,
      isApproved: false,
      helpfulVotes: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { reviewId };
  },
});

// Upvote helpful review
export const voteHelpful = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const rev = await ctx.db.get(args.reviewId);
    if (!rev) return { success: false };
    await ctx.db.patch(args.reviewId, { helpfulVotes: (rev.helpfulVotes ?? 0) + 1, updatedAt: Date.now() });
    return { success: true };
  },
});


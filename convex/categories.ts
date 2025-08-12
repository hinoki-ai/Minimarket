import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get all active categories
export const getCategories = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const { includeInactive = false } = args;
    
    let query = ctx.db.query("categories");
    
    if (!includeInactive) {
      query = query.withIndex("byActive", (q) => q.eq("isActive", true));
    }
    
    const categories = await query.collect();
    
    // Sort by sortOrder and build hierarchy
    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Get category hierarchy (parent-child structure)
export const getCategoryHierarchy = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories")
      .withIndex("byActive", (q) => q.eq("isActive", true))
      .collect();
    
    // Build hierarchical structure
    const categoryMap = new Map();
    const rootCategories: Array<Doc<"categories"> & { children: Array<Doc<"categories">> }> = [];
    
    // First pass: create map and identify root categories
    categories.forEach(category => {
      categoryMap.set(category._id, { ...category, children: [] });
      if (!category.parentId) {
        rootCategories.push(categoryMap.get(category._id));
      }
    });
    
    // Second pass: build parent-child relationships
    categories.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryMap.get(category._id));
        }
      }
    });
    
    // Sort children by sortOrder
    const sortRecursively = (cats: any[]) => {
      cats.sort((a, b) => a.sortOrder - b.sortOrder);
      cats.forEach(cat => {
        if (cat.children.length > 0) {
          sortRecursively(cat.children);
        }
      });
    };
    
    sortRecursively(rootCategories);
    
    return rootCategories;
  },
});

// Get category by slug
export const getCategoryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("categories")
      .withIndex("bySlug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// Get top-level categories for navigation
export const getTopLevelCategories = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { limit = 10 } = args;
    
    return await ctx.db.query("categories")
      .withIndex("byParent", (q) => q.eq("parentId", undefined))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(limit);
  },
});

// Get subcategories of a parent category
export const getSubcategories = query({
  args: { parentId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.query("categories")
      .withIndex("byParent", (q) => q.eq("parentId", args.parentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get category with product count
export const getCategoriesWithProductCount = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories")
      .withIndex("byActive", (q) => q.eq("isActive", true))
      .collect();
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await ctx.db.query("products")
          .withIndex("byCategory", (q) => 
            q.eq("categoryId", category._id).eq("isActive", true)
          )
          .collect()
          .then(products => products.length);
        
        return {
          ...category,
          productCount,
        };
      })
    );
    
    return categoriesWithCount.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Create new category (admin)
export const createCategory = mutation({
  args: {
    name: v.string(),
    nameJA: v.optional(v.string()),
    slug: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.number(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existingCategory = await ctx.db.query("categories")
      .withIndex("bySlug", (q) => q.eq("slug", args.slug))
      .unique();
    
    if (existingCategory) {
      throw new Error("Category slug already exists");
    }
    
    const now = Date.now();
    
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      nameJA: args.nameJA,
      slug: args.slug,
      description: args.description,
      parentId: args.parentId,
      sortOrder: args.sortOrder,
      isActive: true,
      icon: args.icon,
      color: args.color,
      createdAt: now,
      updatedAt: now,
    });
    
    return categoryId;
  },
});

// Update category (admin)
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    nameJA: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { categoryId, slug, ...updateFields } = args;
    
    // Check if new slug conflicts with existing category
    if (slug) {
      const existingCategory = await ctx.db.query("categories")
        .withIndex("bySlug", (q) => q.eq("slug", slug))
        .unique();
      
      if (existingCategory && existingCategory._id !== categoryId) {
        throw new Error("Category slug already exists");
      }
    }
    
    // Prevent setting parent as itself or creating circular reference
    if (args.parentId) {
      if (args.parentId === categoryId) {
        throw new Error("Category cannot be its own parent");
      }
      
      // Check for circular reference (basic check)
      const parentCategory = await ctx.db.get(args.parentId);
      if (parentCategory?.parentId === categoryId) {
        throw new Error("Circular reference detected");
      }
    }
    
    await ctx.db.patch(categoryId, {
      ...updateFields,
      ...(slug && { slug }),
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Delete category (admin) - soft delete if has products
export const deleteCategory = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const { categoryId } = args;
    
    // Check if category has products
    const products = await ctx.db.query("products")
      .withIndex("byCategory", (q) => 
        q.eq("categoryId", categoryId).eq("isActive", true)
      )
      .collect();
    
    // Check if category has subcategories
    const subcategories = await ctx.db.query("categories")
      .withIndex("byParent", (q) => q.eq("parentId", categoryId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    if (products.length > 0 || subcategories.length > 0) {
      // Soft delete - deactivate category
      await ctx.db.patch(categoryId, {
        isActive: false,
        updatedAt: Date.now(),
      });
      
      return { 
        success: true, 
        deleted: false, 
        reason: "Category deactivated due to existing products or subcategories" 
      };
    } else {
      // Hard delete if no dependencies
      await ctx.db.delete(categoryId);
      
      return { 
        success: true, 
        deleted: true, 
        reason: "Category permanently deleted" 
      };
    }
  },
});

// Reorder categories (admin)
export const reorderCategories = mutation({
  args: {
    categoryUpdates: v.array(v.object({
      categoryId: v.id("categories"),
      sortOrder: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { categoryUpdates } = args;
    
    // Update sort order for each category
    await Promise.all(
      categoryUpdates.map(async ({ categoryId, sortOrder }) => {
        await ctx.db.patch(categoryId, {
          sortOrder,
          updatedAt: Date.now(),
        });
      })
    );
    
    return { success: true };
  },
});

// Get breadcrumb path for a category
export const getCategoryBreadcrumb = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const { categoryId } = args;
    const breadcrumb: Doc<"categories">[] = [];
    let currentId: Id<"categories"> | undefined = categoryId;
    
    // Walk up the parent chain
    while (currentId) {
      const category = await ctx.db.get(currentId);
      if (!category) break;
      
      breadcrumb.unshift(category);
      currentId = category.parentId;
    }
    
    return breadcrumb;
  },
});
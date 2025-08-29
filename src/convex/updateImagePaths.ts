/**
 * Fix image paths to use correct extensions
 */
import { mutation } from "./_generated/server";

export const updateImagePaths = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Updating image paths from .webp to .svg for placeholders...");
    
    const products = await ctx.db.query("products").collect();
    let updatedCount = 0;
    
    for (const product of products) {
      if (product.images && product.images.length > 0) {
        const updatedImages = product.images.map(image => {
          if (image.url.endsWith('.webp')) {
            return {
              ...image,
              url: image.url.replace('.webp', '.svg')
            };
          }
          return image;
        });
        
        await ctx.db.patch(product._id, {
          images: updatedImages,
          updatedAt: Date.now(),
        });
        
        updatedCount++;
        console.log(`Updated ${product.name}: ${updatedImages[0].url}`);
      }
    }
    
    console.log(`Updated ${updatedCount} products`);
    return { success: true, updatedCount };
  },
});
/**
 * Script to populate the Convex database with Chilean minimarket products
 * Run: npx convex run populate-chilean-products:populateProducts
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const chileanCategories = [
  {
    name: "Bebidas",
    nameJA: "飲み物",
    slug: "bebidas",
    description: "Refrescos, jugos, agua y bebidas alcoholicas",
    icon: "🥤",
    color: "#3B82F6",
    sortOrder: 1,
  },
  {
    name: "Panadería & Cereales",
    nameJA: "パン・シリアル",
    slug: "panaderia",
    description: "Pan fresco, cereales y productos de panadería",
    icon: "🍞",
    color: "#F59E0B",
    sortOrder: 2,
  },
  {
    name: "Lácteos",
    nameJA: "乳製品",
    slug: "lacteos",
    description: "Leche, quesos, yogurt y productos lácteos",
    icon: "🧀",
    color: "#EF4444",
    sortOrder: 3,
  },
  {
    name: "Carnes & Embutidos",
    nameJA: "肉・ハム",
    slug: "carnes",
    description: "Carnes frescas, jamones y embutidos",
    icon: "🥩",
    color: "#DC2626",
    sortOrder: 4,
  },
  {
    name: "Snacks & Dulces",
    nameJA: "スナック・お菓子",
    slug: "snacks",
    description: "Papas fritas, chocolates y dulces",
    icon: "🍿",
    color: "#7C3AED",
    sortOrder: 5,
  },
  {
    name: "Aseo & Limpieza",
    nameJA: "清掃用品",
    slug: "aseo",
    description: "Productos de higiene personal y limpieza",
    icon: "🧽",
    color: "#10B981",
    sortOrder: 6,
  },
  {
    name: "Hogar & Varios",
    nameJA: "家庭用品",
    slug: "hogar",
    description: "Artículos para el hogar y varios",
    icon: "🏠",
    color: "#6B7280",
    sortOrder: 7,
  },
];

const chileanProducts = [
  // Bebidas (12 products)
  {
    name: "Coca-Cola 1.5L",
    nameJA: "コカコーラ 1.5L",
    slug: "coca-cola-15l",
    description: "Bebida gaseosa sabor original, botella 1.5 litros. La marca más popular de Chile.",
    shortDescription: "Bebida gaseosa original 1.5L",
    sku: "BEB-CCL-1500",
    barcode: "7501055363057",
    categorySlug: "bebidas",
    price: 1990,
    compareAtPrice: 2190,
    taxRate: 0.19,
    inventory: {
      quantity: 50,
      lowStockThreshold: 10,
      trackInventory: true,
      allowBackorder: false,
    },
    images: [
      {
        url: "/images/products/bebidas/coca-cola-15l.webp",
        alt: "Coca-Cola 1.5L botella",
        sortOrder: 0,
      },
    ],
    weight: 1500,
    freshness: {
      expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      isFresh: false,
      isNew: false,
      isPopular: true,
    },
    nutrition: {
      calories: 42,
      allergens: [],
      ingredients: ["Agua carbonatada", "Azúcar", "Ácido fosfórico", "Saborizantes naturales", "Cafeína"],
    },
    metaTitle: "Coca-Cola 1.5L - Bebida Original | Minimarket ARAMAC",
    metaDescription: "Coca-Cola original 1.5L, la bebida más popular de Chile. Entrega rápida.",
    tags: ["gaseosa", "original", "familiar", "popular"],
    isActive: true,
    isFeatured: true,
    isDigital: false,
    requiresShipping: true,
  },
  {
    name: "Fanta Naranja 500ml",
    nameJA: "ファンタ オレンジ 500ml",
    slug: "fanta-naranja-500ml",
    description: "Bebida gaseosa sabor naranja, botella 500ml perfecta para una persona.",
    shortDescription: "Bebida gaseosa naranja 500ml",
    sku: "BEB-FNT-500",
    barcode: "7501055363064",
    categorySlug: "bebidas",
    price: 1290,
    taxRate: 0.19,
    inventory: {
      quantity: 35,
      lowStockThreshold: 8,
      trackInventory: true,
      allowBackorder: false,
    },
    images: [
      {
        url: "/images/products/bebidas/fanta-naranja-500ml.webp",
        alt: "Fanta Naranja 500ml",
        sortOrder: 0,
      },
    ],
    weight: 500,
    freshness: {
      expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
      isFresh: false,
      isNew: false,
      isPopular: true,
    },
    nutrition: {
      calories: 45,
      allergens: [],
      ingredients: ["Agua carbonatada", "Azúcar", "Ácido cítrico", "Sabor natural de naranja"],
    },
    tags: ["gaseosa", "naranja", "individual"],
    isActive: true,
    isFeatured: false,
    isDigital: false,
    requiresShipping: true,
  },
  {
    name: "Cachantún Agua 1.5L",
    nameJA: "カチャントゥン 水 1.5L",
    slug: "cachantun-agua-15l",
    description: "Agua mineral natural sin gas de Cachantún, la marca líder en Chile con 49% del mercado.",
    shortDescription: "Agua mineral natural 1.5L",
    sku: "BEB-CAC-1500",
    barcode: "7804650001234",
    categorySlug: "bebidas",
    price: 990,
    taxRate: 0.19,
    inventory: {
      quantity: 80,
      lowStockThreshold: 15,
      trackInventory: true,
      allowBackorder: false,
    },
    images: [
      {
        url: "/images/products/bebidas/cachantun-agua-15l.webp",
        alt: "Cachantún Agua Mineral 1.5L",
        sortOrder: 0,
      },
    ],
    weight: 1500,
    freshness: {
      expiryDate: Date.now() + 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      isFresh: true,
      isNew: false,
      isPopular: true,
    },
    nutrition: {
      calories: 0,
      allergens: [],
      ingredients: ["Agua mineral natural"],
    },
    tags: ["agua", "mineral", "natural", "familiar", "lider"],
    isActive: true,
    isFeatured: true,
    isDigital: false,
    requiresShipping: true,
  },
  // Panadería (10 products)
  {
    name: "Pan Hallulla (4 unidades)",
    nameJA: "パン ハジュジャ (4個)",
    slug: "pan-hallulla-4u",
    description: "Pan tradicional chileno, redondo y esponjoso. Chile es el 2do mayor consumidor de pan del mundo.",
    shortDescription: "Pan tradicional chileno - 4 unidades",
    sku: "PAN-HAL-4U",
    barcode: "7890123456789",
    categorySlug: "panaderia",
    price: 1200,
    taxRate: 0.19,
    inventory: {
      quantity: 25,
      lowStockThreshold: 5,
      trackInventory: true,
      allowBackorder: false,
    },
    images: [
      {
        url: "/images/products/panaderia/pan-hallulla-4u.webp",
        alt: "Pan Hallulla tradicional chileno 4 unidades",
        sortOrder: 0,
      },
    ],
    weight: 400,
    freshness: {
      expiryDate: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days
      isFresh: true,
      isNew: false,
      isPopular: true,
    },
    nutrition: {
      calories: 280,
      allergens: ["gluten"],
      ingredients: ["Harina de trigo", "Agua", "Levadura", "Sal", "Azúcar"],
    },
    tags: ["pan", "tradicional", "chileno", "fresco"],
    isActive: true,
    isFeatured: true,
    isDigital: false,
    requiresShipping: true,
  },
  // Lácteos (8 products)
  {
    name: "Leche Soprole Entera 1L",
    nameJA: "ソプロレ 全乳 1L",
    slug: "leche-soprole-entera-1l",
    description: "Leche entera pasteurizada de Soprole, la marca láctea más valorada de Chile.",
    shortDescription: "Leche entera pasteurizada 1L",
    sku: "LAC-SOP-1000",
    barcode: "7802900123456",
    categorySlug: "lacteos",
    price: 1450,
    taxRate: 0.19,
    inventory: {
      quantity: 40,
      lowStockThreshold: 10,
      trackInventory: true,
      allowBackorder: false,
    },
    images: [
      {
        url: "/images/products/lacteos/leche-soprole-entera-1l.webp",
        alt: "Leche Soprole Entera 1L Tetra Pack",
        sortOrder: 0,
      },
    ],
    weight: 1030,
    freshness: {
      expiryDate: Date.now() + 8 * 24 * 60 * 60 * 1000, // 8 days
      isFresh: true,
      isNew: false,
      isPopular: true,
    },
    nutrition: {
      calories: 61,
      allergens: ["lactosa"],
      ingredients: ["Leche entera pasteurizada"],
    },
    tags: ["leche", "entera", "pasteurizada", "tetra pack", "soprole"],
    isActive: true,
    isFeatured: true,
    isDigital: false,
    requiresShipping: true,
  },
  // Snacks (10 products)
  {
    name: "Papas Lays Original",
    nameJA: "レイズ ポテトチップス オリジナル",
    slug: "papas-lays-original",
    description: "Papas fritas clásicas sabor original, la marca de snacks más popular en Chile.",
    shortDescription: "Papas fritas original 140g",
    sku: "SNK-LAY-140",
    barcode: "7622210951234",
    categorySlug: "snacks",
    price: 1690,
    taxRate: 0.19,
    inventory: {
      quantity: 60,
      lowStockThreshold: 12,
      trackInventory: true,
      allowBackorder: false,
    },
    images: [
      {
        url: "/images/products/snacks/papas-lays-original.webp",
        alt: "Papas Lays Original 140g",
        sortOrder: 0,
      },
    ],
    weight: 140,
    freshness: {
      expiryDate: Date.now() + 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
      isFresh: false,
      isNew: false,
      isPopular: true,
    },
    nutrition: {
      calories: 536,
      allergens: [],
      ingredients: ["Papas", "Aceite vegetal", "Sal"],
    },
    tags: ["papas", "fritas", "original", "snack", "popular"],
    isActive: true,
    isFeatured: true,
    isDigital: false,
    requiresShipping: true,
  },
  // Carnes (8 products)
  {
    name: "Jamón Cocido San Jorge",
    nameJA: "サンホルヘ ハム",
    slug: "jamon-cocido-san-jorge",
    description: "Jamón cocido premium en fetas de la marca San Jorge, perfecto para sandwiches.",
    shortDescription: "Jamón cocido premium 200g",
    sku: "CAR-SJG-200",
    barcode: "7806123456789",
    categorySlug: "carnes",
    price: 3450,
    compareAtPrice: 3890,
    taxRate: 0.19,
    inventory: {
      quantity: 15,
      lowStockThreshold: 3,
      trackInventory: true,
      allowBackorder: false,
    },
    images: [
      {
        url: "/images/products/carnes/jamon-cocido-san-jorge.webp",
        alt: "Jamón Cocido San Jorge 200g",
        sortOrder: 0,
      },
    ],
    weight: 200,
    freshness: {
      expiryDate: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days
      isFresh: true,
      isNew: false,
      isPopular: false,
    },
    nutrition: {
      calories: 120,
      allergens: [],
      ingredients: ["Carne de cerdo", "Agua", "Sal", "Conservantes", "Antioxidantes"],
    },
    tags: ["jamón", "cocido", "premium", "fetas", "sandwich"],
    isActive: true,
    isFeatured: false,
    isDigital: false,
    requiresShipping: true,
  },
  // Aseo (6 products)
  {
    name: "Detergente Ariel Polvo 1kg",
    nameJA: "アリエル 洗剤 1kg",
    slug: "detergente-ariel-polvo-1kg",
    description: "Detergente en polvo para ropa Ariel, limpieza profunda y cuidado de las telas.",
    shortDescription: "Detergente en polvo 1kg",
    sku: "ASE-ARI-1000",
    barcode: "7501234567890",
    categorySlug: "aseo",
    price: 4290,
    taxRate: 0.19,
    inventory: {
      quantity: 20,
      lowStockThreshold: 5,
      trackInventory: true,
      allowBackorder: true,
    },
    images: [
      {
        url: "/images/products/aseo/detergente-ariel-polvo-1kg.webp",
        alt: "Detergente Ariel en Polvo 1kg",
        sortOrder: 0,
      },
    ],
    weight: 1000,
    freshness: {
      expiryDate: Date.now() + 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      isFresh: false,
      isNew: false,
      isPopular: false,
    },
    nutrition: undefined,
    tags: ["detergente", "polvo", "ropa", "limpieza", "ariel"],
    isActive: true,
    isFeatured: false,
    isDigital: false,
    requiresShipping: true,
  },
  // Hogar (4 products)
  {
    name: "Pilas Energizer AA",
    nameJA: "エナジャイザー 電池 AA",
    slug: "pilas-energizer-aa",
    description: "Pilas alcalinas AA Energizer, paquete de 4 unidades para dispositivos electrónicos.",
    shortDescription: "Pilas alcalinas AA - 4 unidades",
    sku: "HOG-ENR-AA4",
    barcode: "7123456789012",
    categorySlug: "hogar",
    price: 2890,
    taxRate: 0.19,
    inventory: {
      quantity: 30,
      lowStockThreshold: 8,
      trackInventory: true,
      allowBackorder: true,
    },
    images: [
      {
        url: "/images/products/hogar/pilas-energizer-aa.webp",
        alt: "Pilas Energizer AA 4 unidades",
        sortOrder: 0,
      },
    ],
    weight: 100,
    freshness: {
      expiryDate: Date.now() + 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
      isFresh: false,
      isNew: false,
      isPopular: false,
    },
    nutrition: undefined,
    tags: ["pilas", "alcalinas", "AA", "energía", "electrónicos"],
    isActive: true,
    isFeatured: false,
    isDigital: false,
    requiresShipping: true,
  },
];

export const populateProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // First, create categories
    console.log("Creating Chilean categories...");
    const categoryMap = new Map<string, Id<"categories">>();
    
    for (const categoryData of chileanCategories) {
      // Check if category already exists
      const existingCategory = await ctx.db.query("categories")
        .withIndex("bySlug", (q) => q.eq("slug", categoryData.slug))
        .unique();
      
      if (!existingCategory) {
        const categoryId = await ctx.db.insert("categories", {
          ...categoryData,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        categoryMap.set(categoryData.slug, categoryId);
        console.log(`Created category: ${categoryData.name} (${categoryId})`);
      } else {
        categoryMap.set(categoryData.slug, existingCategory._id);
        console.log(`Category exists: ${categoryData.name} (${existingCategory._id})`);
      }
    }
    
    // Then create products
    console.log("Creating Chilean products...");
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const productData of chileanProducts) {
      // Check if product already exists
      const existingProduct = await ctx.db.query("products")
        .withIndex("bySlug", (q) => q.eq("slug", productData.slug))
        .unique();
      
      if (!existingProduct) {
        const categoryId = categoryMap.get(productData.categorySlug);
        if (!categoryId) {
          console.error(`Category not found for slug: ${productData.categorySlug}`);
          continue;
        }
        
        const { categorySlug, ...productWithoutCategorySlug } = productData;
        
        const productId = await ctx.db.insert("products", {
          ...productWithoutCategorySlug,
          categoryId,
          createdAt: now,
          updatedAt: now,
        });
        
        createdCount++;
        console.log(`Created product: ${productData.name} (${productId})`);
      } else {
        skippedCount++;
        console.log(`Product exists: ${productData.name} (${existingProduct._id})`);
      }
    }
    
    console.log(`Population complete: ${createdCount} products created, ${skippedCount} products skipped`);
    
    return {
      success: true,
      categoriesCreated: categoryMap.size,
      productsCreated: createdCount,
      productsSkipped: skippedCount,
    };
  },
});
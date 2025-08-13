'use strict';

/**
 * Universal Product Data Schema for Minimarket/Hardware Store
 * Designed to work across Chilean supermarkets, minimarkets, and hardware stores
 */

const ProductSchema = {
  // Core identification
  id: {
    type: 'string',
    required: true,
    description: 'Unique product identifier (slug format)',
    example: 'coca-cola-15l'
  },
  
  sku: {
    type: 'string',
    required: false,
    description: 'Store-specific SKU/product code',
    example: 'LDR-001234'
  },
  
  barcode: {
    type: 'string',
    required: false,
    description: 'EAN/UPC barcode',
    example: '7501055363057'
  },

  // Basic product information
  name: {
    type: 'string',
    required: true,
    description: 'Product name',
    example: 'Coca-Cola 1.5L'
  },
  
  brand: {
    type: 'string',
    required: false,
    description: 'Brand name',
    example: 'Coca-Cola'
  },
  
  manufacturer: {
    type: 'string',
    required: false,
    description: 'Manufacturing company',
    example: 'Coca-Cola Chile'
  },

  // Categorization
  category: {
    type: 'string',
    required: true,
    description: 'Primary category ID',
    example: 'bebidas'
  },
  
  subcategory: {
    type: 'string',
    required: false,
    description: 'Secondary category',
    example: 'gaseosas'
  },
  
  tags: {
    type: 'array',
    items: 'string',
    required: false,
    description: 'Searchable tags',
    example: ['gaseosa', 'original', 'familiar']
  },

  // Pricing
  price: {
    type: 'number',
    required: true,
    description: 'Current price',
    example: 1990
  },
  
  currency: {
    type: 'string',
    required: true,
    description: 'Currency code',
    example: 'CLP'
  },
  
  originalPrice: {
    type: 'number',
    required: false,
    description: 'Original price before discount',
    example: 2200
  },
  
  discountPercentage: {
    type: 'number',
    required: false,
    description: 'Discount percentage',
    example: 15.5
  },

  // Product details
  description: {
    type: 'string',
    required: true,
    description: 'Product description',
    example: 'Bebida gaseosa sabor original, botella 1.5 litros'
  },
  
  shortDescription: {
    type: 'string',
    required: false,
    description: 'Brief product summary',
    example: 'Gaseosa Coca-Cola familiar 1.5L'
  },

  // Physical characteristics
  dimensions: {
    type: 'object',
    required: false,
    properties: {
      length: 'number', // cm
      width: 'number',  // cm
      height: 'number', // cm
      weight: 'number'  // grams
    },
    example: { length: 8, width: 8, height: 32, weight: 1580 }
  },
  
  volume: {
    type: 'string',
    required: false,
    description: 'Volume/quantity',
    example: '1.5L'
  },
  
  unit: {
    type: 'string',
    required: false,
    description: 'Unit of measurement',
    example: 'botella'
  },

  // Images and media
  imageUrl: {
    type: 'string',
    required: true,
    description: 'Primary product image URL',
    example: '/images/products/bebidas/coca-cola-15l.webp'
  },
  
  imageUrls: {
    type: 'array',
    items: 'string',
    required: false,
    description: 'Additional product images',
    example: ['/images/products/bebidas/coca-cola-15l-back.webp']
  },
  
  thumbnailUrl: {
    type: 'string',
    required: false,
    description: 'Thumbnail image URL',
    example: '/images/products/bebidas/thumbs/coca-cola-15l.webp'
  },

  // Inventory and availability
  stock: {
    type: 'number',
    required: true,
    description: 'Current stock level',
    example: 50
  },
  
  inStock: {
    type: 'boolean',
    required: true,
    description: 'Stock availability',
    example: true
  },
  
  lowStock: {
    type: 'boolean',
    required: false,
    description: 'Low stock indicator',
    example: false
  },
  
  stockThreshold: {
    type: 'number',
    required: false,
    description: 'Low stock threshold',
    example: 10
  },

  // Food-specific attributes (optional for hardware)
  ingredients: {
    type: 'array',
    items: 'string',
    required: false,
    description: 'Food ingredients list',
    example: ['Agua carbonatada', 'Azúcar', 'Ácido fosfórico']
  },
  
  nutrition: {
    type: 'object',
    required: false,
    properties: {
      calories: 'number',
      protein: 'string',
      carbs: 'string',
      fat: 'string',
      sugar: 'string',
      sodium: 'string',
      fiber: 'string',
      servingSize: 'string'
    },
    example: {
      calories: 42,
      sugar: '10.6g',
      sodium: '0.01g',
      servingSize: '100ml'
    }
  },
  
  allergens: {
    type: 'array',
    items: 'string',
    required: false,
    description: 'Allergen information',
    example: ['gluten', 'lactose']
  },
  
  freshness: {
    type: 'object',
    required: false,
    properties: {
      daysRemaining: 'number',
      status: 'string', // 'fresh', 'expiring', 'expired'
      expiryDate: 'string' // ISO date
    },
    example: {
      daysRemaining: 2,
      status: 'fresh',
      expiryDate: '2025-01-15'
    }
  },

  // Hardware-specific attributes (optional for food)
  specifications: {
    type: 'object',
    required: false,
    description: 'Technical specifications',
    example: {
      material: 'acero inoxidable',
      power: '1500W',
      voltage: '220V',
      warranty: '2 años'
    }
  },
  
  compatibility: {
    type: 'array',
    items: 'string',
    required: false,
    description: 'Compatible products/systems',
    example: ['Samsung Galaxy S20', 'iPhone 12']
  },
  
  tools: {
    type: 'object',
    required: false,
    properties: {
      category: 'string', // 'hand_tool', 'power_tool', 'garden_tool'
      powerSource: 'string', // 'manual', 'electric', 'battery'
      voltage: 'string',
      batteryType: 'string'
    }
  },

  // Quality and ratings
  rating: {
    type: 'number',
    required: false,
    description: 'Average rating (1-5)',
    example: 4.5
  },
  
  reviewCount: {
    type: 'number',
    required: false,
    description: 'Number of reviews',
    example: 128
  },
  
  popularity: {
    type: 'number',
    required: false,
    description: 'Popularity score (1-100)',
    example: 95
  },

  // Origin and sourcing
  origin: {
    type: 'string',
    required: false,
    description: 'Country of origin',
    example: 'Chile'
  },
  
  supplier: {
    type: 'string',
    required: false,
    description: 'Supplier name',
    example: 'Distribuidora ABC'
  },
  
  sustainable: {
    type: 'boolean',
    required: false,
    description: 'Sustainable/eco-friendly product',
    example: false
  },

  // Store-specific data
  store: {
    type: 'object',
    required: true,
    properties: {
      name: 'string',        // 'lider', 'jumbo', 'santa_isabel'
      url: 'string',         // Source URL
      scraped: 'string',     // ISO timestamp
      section: 'string'      // Store section/aisle
    },
    example: {
      name: 'lider',
      url: 'https://www.lider.cl/supermercado/product/123',
      scraped: '2025-01-13T10:30:00.000Z',
      section: 'bebidas'
    }
  },

  // Metadata
  metadata: {
    type: 'object',
    required: false,
    properties: {
      featured: 'boolean',
      newProduct: 'boolean',
      seasonal: 'boolean',
      promotion: 'string',
      keywords: 'array'
    },
    example: {
      featured: true,
      newProduct: false,
      seasonal: false,
      promotion: 'oferta_verano',
      keywords: ['refrescante', 'familiar', 'clásico']
    }
  },

  // Timestamps
  createdAt: {
    type: 'string',
    required: true,
    description: 'Creation timestamp (ISO)',
    example: '2025-01-13T10:30:00.000Z'
  },
  
  updatedAt: {
    type: 'string',
    required: true,
    description: 'Last update timestamp (ISO)',
    example: '2025-01-13T10:30:00.000Z'
  }
};

// Category definitions for both minimarket and hardware store
const Categories = {
  // Minimarket categories
  bebidas: {
    name: 'Bebidas',
    nameJP: '飲み物',
    icon: '🥤',
    subcategories: ['gaseosas', 'jugos', 'agua', 'alcoholicas', 'energeticas']
  },
  panaderia: {
    name: 'Panadería & Cereales',
    nameJP: 'パン・シリアル',
    icon: '🍞',
    subcategories: ['pan_fresco', 'cereales', 'galletas', 'masas']
  },
  carnes: {
    name: 'Carnes & Embutidos',
    nameJP: '肉・ハム',
    icon: '🥩',
    subcategories: ['carnes_rojas', 'pollo', 'pescado', 'embutidos']
  },
  lacteos: {
    name: 'Lácteos',
    nameJP: '乳製品',
    icon: '🧀',
    subcategories: ['leche', 'quesos', 'yogurt', 'mantequilla']
  },
  snacks: {
    name: 'Snacks & Dulces',
    nameJP: 'スナック・お菓子',
    icon: '🍿',
    subcategories: ['papas_fritas', 'chocolates', 'dulces', 'frutos_secos']
  },
  aseo: {
    name: 'Aseo & Limpieza',
    nameJP: '清掃用品',
    icon: '🧽',
    subcategories: ['higiene_personal', 'limpieza_hogar', 'detergentes']
  },
  hogar: {
    name: 'Hogar & Varios',
    nameJP: '家庭用品',
    icon: '🏠',
    subcategories: ['decoracion', 'cocina', 'organizacion', 'varios']
  },

  // Hardware store categories
  herramientas: {
    name: 'Herramientas',
    nameJP: '工具',
    icon: '🔧',
    subcategories: ['manuales', 'electricas', 'medicion', 'corte']
  },
  ferreteria: {
    name: 'Ferretería',
    nameJP: '金物',
    icon: '🔩',
    subcategories: ['tornillos', 'tuercas', 'clavos', 'bisagras']
  },
  construccion: {
    name: 'Construcción',
    nameJP: '建設',
    icon: '🧱',
    subcategories: ['cemento', 'ladrillos', 'madera', 'tuberia']
  },
  electricidad: {
    name: 'Electricidad',
    nameJP: '電気',
    icon: '⚡',
    subcategories: ['cables', 'enchufes', 'luminarias', 'fusibles']
  },
  jardineria: {
    name: 'Jardinería',
    nameJP: 'ガーデニング',
    icon: '🌱',
    subcategories: ['semillas', 'fertilizantes', 'herramientas_jardin', 'macetas']
  },
  pinturas: {
    name: 'Pinturas',
    nameJP: 'ペイント',
    icon: '🎨',
    subcategories: ['interior', 'exterior', 'brochas', 'diluyentes']
  },
  plomeria: {
    name: 'Plomería',
    nameJP: '配管',
    icon: '🚿',
    subcategories: ['tubos', 'conexiones', 'griferia', 'bombas']
  }
};

// Store configuration for Chilean supermarkets
const StoreConfigs = {
  lider: {
    name: 'Líder',
    baseUrl: 'https://www.lider.cl',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    selectors: {
      productCard: [
        '[data-testid*="product"]',
        'article[class*="product"]',
        '.product-card',
        '.product-item',
        '[class*="ProductCard"]',
        '[class*="product-tile"]',
        '.js-product-container',
        '.product'
      ],
      productName: [
        '[data-testid*="product-name"]',
        '[data-testid*="title"]',
        'h1[class*="product"]',
        'h2[class*="product"]',
        '.product-title',
        '.product-name',
        '[class*="ProductName"]',
        '[aria-label*="product"]'
      ],
      price: [
        '[data-testid*="price"]',
        '[class*="price"]',
        '[class*="Price"]',
        '.precio',
        '.value',
        '[data-cy*="price"]',
        '.cost'
      ],
      image: [
        'img[src*="product"]',
        'img[src*="imagen"]',
        'img[data-src*="product"]',
        'img[class*="product"]',
        'picture img',
        '.product-image img',
        '[class*="ProductImage"] img'
      ],
      description: [
        '[data-testid*="description"]',
        '.product-description',
        '.description',
        '[class*="Description"]',
        '.product-details',
        '.summary'
      ],
      brand: [
        '[data-testid*="brand"]',
        '.brand',
        '.marca',
        '[class*="Brand"]',
        '.manufacturer',
        '.brand-name'
      ]
    },
    rateLimit: 1500,
    concurrent: 2
  },
  
  jumbo: {
    name: 'Jumbo',
    baseUrl: 'https://www.jumbo.cl',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    selectors: {
      productCard: [
        '[data-test*="product"]',
        '.product-item',
        '.product-card',
        '[class*="Product"]',
        'article[class*="product"]',
        '.product',
        '.item'
      ],
      productName: [
        '[data-testid*="name"]',
        'h1[class*="product"]',
        'h2[class*="product"]',
        '.product-name',
        '.product-title',
        '[class*="ProductName"]'
      ],
      price: [
        '[data-test*="price"]',
        '[class*="price"]',
        '[class*="Price"]',
        '.precio',
        '.value',
        '.cost'
      ],
      image: [
        '.product-image img',
        'img[src*="product"]',
        'img[data-src*="product"]',
        'picture img',
        '[class*="ProductImage"] img'
      ],
      description: [
        '.product-description',
        '.description',
        '[class*="Description"]',
        '.product-details'
      ],
      brand: [
        '.brand',
        '.marca',
        '[class*="Brand"]',
        '.manufacturer'
      ]
    },
    rateLimit: 1800,
    concurrent: 2
  },
  
  santa_isabel: {
    name: 'Santa Isabel',
    baseUrl: 'https://www.santaisabel.cl',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    selectors: {
      productCard: [
        '.product',
        '.item-product',
        '.product-card',
        '[class*="Product"]',
        'article[class*="product"]'
      ],
      productName: [
        'h1',
        'h2',
        '.product-title',
        '.product-name',
        '[class*="ProductName"]'
      ],
      price: [
        '.price',
        '[class*="price"]',
        '[class*="Price"]',
        '.precio',
        '.value'
      ],
      image: [
        '.product-img img',
        'img[src*="product"]',
        'img[data-src*="product"]',
        'picture img'
      ],
      description: [
        '.product-description',
        '.description',
        '[class*="Description"]'
      ],
      brand: [
        '.brand-name',
        '.brand',
        '.marca',
        '[class*="Brand"]'
      ]
    },
    rateLimit: 2000,
    concurrent: 2
  },
  
  unimarc: {
    name: 'Unimarc',
    baseUrl: 'https://www.unimarc.cl',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    selectors: {
      productCard: [
        '.product-card',
        '.product',
        '.product-item',
        '[class*="Product"]',
        'article[class*="product"]'
      ],
      productName: [
        '.product-name',
        'h1',
        'h2',
        '.product-title',
        '[class*="ProductName"]'
      ],
      price: [
        '.product-price',
        '.price',
        '[class*="price"]',
        '[class*="Price"]',
        '.precio'
      ],
      image: [
        '.product-image img',
        'img[src*="product"]',
        'img[data-src*="product"]',
        'picture img'
      ],
      description: [
        '.product-desc',
        '.product-description',
        '.description',
        '[class*="Description"]'
      ],
      brand: [
        '.product-brand',
        '.brand',
        '.marca',
        '[class*="Brand"]'
      ]
    },
    rateLimit: 1800,
    concurrent: 2
  },
  
  tottus: {
    name: 'Tottus',
    baseUrl: 'https://www.tottus.cl',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    selectors: {
      productCard: [
        '[data-testid*="product"]',
        '.product-item',
        '.product-card',
        '.product',
        '[class*="Product"]',
        'article[class*="product"]'
      ],
      productName: [
        '[data-testid*="name"]',
        'h1',
        'h2',
        '.product-title',
        '.product-name',
        '[class*="ProductName"]'
      ],
      price: [
        '[data-testid*="price"]',
        '.price',
        '.precio',
        '[class*="price"]',
        '[class*="Price"]',
        '.value'
      ],
      image: [
        'img[src*="product"]',
        'img[src*="imagen"]',
        'img[data-src*="product"]',
        'picture img',
        '.product-image img'
      ],
      description: [
        '.product-description',
        '.description',
        '[class*="Description"]',
        '.product-details'
      ],
      brand: [
        '.brand',
        '.marca',
        '[class*="Brand"]',
        '.manufacturer'
      ]
    },
    rateLimit: 1500,
    concurrent: 2
  },
  
  easy: {
    name: 'Easy',
    baseUrl: 'https://www.easy.cl',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    selectors: {
      productCard: [
        '.product',
        '.product-item',
        '.item',
        '[class*="Product"]',
        'article[class*="product"]'
      ],
      productName: [
        'h1',
        'h2',
        '.product-name',
        '.title',
        '.product-title',
        '[class*="ProductName"]'
      ],
      price: [
        '.price',
        '.valor',
        '[class*="price"]',
        '[class*="Price"]',
        '.precio'
      ],
      image: [
        '.product-image img',
        'img[src*="product"]',
        'img[data-src*="product"]',
        'picture img'
      ],
      description: [
        '.description',
        '.product-desc',
        '.product-description',
        '[class*="Description"]'
      ],
      brand: [
        '.brand',
        '.manufacturer',
        '.marca',
        '[class*="Brand"]'
      ]
    },
    rateLimit: 2000,
    concurrent: 2
  },
  
  falabella: {
    name: 'Falabella',
    baseUrl: 'https://www.falabella.com',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    selectors: {
      productCard: [
        '[data-testid*="pod"]',
        '.pod',
        '.product-item',
        '.product',
        '[class*="Product"]'
      ],
      productName: [
        'b[class*="product"]',
        '[data-testid*="name"]',
        '.product-title',
        'h1',
        'h2',
        '[class*="ProductName"]'
      ],
      price: [
        '[data-testid*="price"]',
        '.copy14',
        '.price',
        '[class*="price"]',
        '[class*="Price"]',
        '.precio'
      ],
      image: [
        'img[src*="falabella"]',
        'img[src*="product"]',
        'img[data-src*="product"]',
        'picture img'
      ],
      description: [
        '.description',
        '.product-description',
        '[class*="Description"]'
      ],
      brand: [
        '.brand-name',
        '.marca',
        '.brand',
        '[class*="Brand"]'
      ]
    },
    rateLimit: 2500,
    concurrent: 1
  },
  
  paris: {
    name: 'París',
    baseUrl: 'https://www.paris.cl',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    selectors: {
      productCard: [
        '.product',
        '.product-item',
        '[class*="Product"]',
        'article[class*="product"]'
      ],
      productName: [
        'h1',
        'h2',
        '.product-name',
        '.product-title',
        '[class*="ProductName"]'
      ],
      price: [
        '.price',
        '.precio',
        '[class*="price"]',
        '[class*="Price"]',
        '.value'
      ],
      image: [
        'img[src*="product"]',
        '.product-image img',
        'img[data-src*="product"]',
        'picture img'
      ],
      description: [
        '.product-description',
        '.description',
        '[class*="Description"]'
      ],
      brand: [
        '.brand',
        '.marca',
        '[class*="Brand"]',
        '.manufacturer'
      ]
    },
    rateLimit: 2000,
    concurrent: 2
  },
  
  sodimac: {
    name: 'Sodimac',
    baseUrl: 'https://www.sodimac.cl',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    selectors: {
      productCard: [
        '[data-testid*="product"]',
        '.product-card',
        '.item-product',
        '.product',
        '[class*="Product"]',
        'article[class*="product"]'
      ],
      productName: [
        '[data-testid*="product-title"]',
        'h1',
        'h2',
        '.product-name',
        '.product-title',
        '[class*="ProductName"]'
      ],
      price: [
        '[data-testid*="price"]',
        '.price',
        '.precio',
        '[class*="price"]',
        '[class*="Price"]',
        '.value'
      ],
      image: [
        '[data-testid*="product-image"]',
        '.product-image img',
        'img[src*="product"]',
        'img[data-src*="product"]',
        'picture img'
      ],
      description: [
        '.product-description',
        '.specs',
        '.description',
        '[class*="Description"]',
        '.product-details'
      ],
      brand: [
        '.brand',
        '.marca',
        '[class*="Brand"]',
        '.manufacturer'
      ]
    },
    rateLimit: 1500,
    concurrent: 2
  }
};

module.exports = {
  ProductSchema,
  Categories,
  StoreConfigs
};
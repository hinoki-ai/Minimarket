/**
 * Script to create placeholder images for Chilean products
 * Run: node create-placeholder-images.js
 */
const fs = require('fs');
const path = require('path');

// Product image data with realistic Chilean product information
const productImages = {
  bebidas: [
    {
      name: 'coca-cola-15l.webp',
      description: 'Coca-Cola 1.5L - Botella familiar',
      color: '#E31E24', // Coca-Cola red
      emoji: '🥤'
    },
    {
      name: 'fanta-naranja-500ml.webp', 
      description: 'Fanta Naranja 500ml',
      color: '#FF8C00', // Orange
      emoji: '🍊'
    },
    {
      name: 'cachantun-agua-15l.webp',
      description: 'Cachantún Agua 1.5L',
      color: '#0077BE', // Blue water
      emoji: '💧'
    }
  ],
  panaderia: [
    {
      name: 'pan-hallulla-4u.webp',
      description: 'Pan Hallulla (4 unidades)',
      color: '#D2691E', // Bread brown
      emoji: '🍞'
    }
  ],
  lacteos: [
    {
      name: 'leche-soprole-entera-1l.webp',
      description: 'Leche Soprole Entera 1L',
      color: '#4169E1', // Royal blue (Soprole brand color)
      emoji: '🥛'
    }
  ],
  snacks: [
    {
      name: 'papas-lays-original.webp',
      description: 'Papas Lays Original',
      color: '#FFD700', // Golden yellow (Lays color)
      emoji: '🍟'
    }
  ],
  carnes: [
    {
      name: 'jamon-cocido-san-jorge.webp',
      description: 'Jamón Cocido San Jorge',
      color: '#CD853F', // Sandy brown (ham color)
      emoji: '🥓'
    }
  ],
  aseo: [
    {
      name: 'detergente-ariel-polvo-1kg.webp',
      description: 'Detergente Ariel Polvo 1kg',
      color: '#1E90FF', // Dodger blue (Ariel brand)
      emoji: '🧽'
    }
  ],
  hogar: [
    {
      name: 'pilas-energizer-aa.webp',
      description: 'Pilas Energizer AA',
      color: '#000000', // Black (battery color)
      emoji: '🔋'
    }
  ]
};

// Create SVG placeholder function
function createSVGPlaceholder(width, height, bgColor, emoji, text) {
  const fontSize = Math.min(width, height) * 0.15;
  const emojiSize = Math.min(width, height) * 0.3;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .product-bg { fill: ${bgColor}; opacity: 0.1; }
      .product-border { fill: none; stroke: ${bgColor}; stroke-width: 2; }
      .product-emoji { font-size: ${emojiSize}px; text-anchor: middle; dominant-baseline: central; }
      .product-text { font-family: system-ui, -apple-system, sans-serif; font-size: ${fontSize}px; font-weight: 600; text-anchor: middle; fill: ${bgColor}; }
      .product-subtitle { font-family: system-ui, -apple-system, sans-serif; font-size: ${fontSize * 0.7}px; text-anchor: middle; fill: #666; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="#FFFFFF" />
  <rect x="10" y="10" width="${width-20}" height="${height-20}" rx="8" class="product-bg" />
  <rect x="10" y="10" width="${width-20}" height="${height-20}" rx="8" class="product-border" />
  
  <!-- Content -->
  <text x="${width/2}" y="${height/2 - fontSize}" class="product-emoji">${emoji}</text>
  <text x="${width/2}" y="${height/2 + fontSize/2}" class="product-text">${text.split(' ').slice(0, 2).join(' ')}</text>
  <text x="${width/2}" y="${height/2 + fontSize * 1.5}" class="product-subtitle">${text.split(' ').slice(2).join(' ')}</text>
  
  <!-- Chilean flag accent -->
  <rect x="10" y="10" width="4" height="20" fill="#0039A6" />
  <rect x="10" y="30" width="4" height="20" fill="#FFFFFF" />
  <rect x="10" y="50" width="4" height="20" fill="#DC143C" />
</svg>`;
}

// Create directories and placeholder images
Object.entries(productImages).forEach(([category, products]) => {
  const categoryPath = path.join(__dirname, 'public', 'images', 'products', category);
  
  // Ensure directory exists
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
    console.log(`Created directory: ${categoryPath}`);
  }
  
  products.forEach(product => {
    const svgPath = path.join(categoryPath, product.name.replace('.webp', '.svg'));
    const svgContent = createSVGPlaceholder(
      500, 500, 
      product.color, 
      product.emoji, 
      product.description
    );
    
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Created placeholder: ${svgPath}`);
    
    // Also create WebP placeholder info file
    const infoPath = path.join(categoryPath, product.name.replace('.webp', '.info.json'));
    const info = {
      filename: product.name,
      description: product.description,
      category: category,
      color: product.color,
      emoji: product.emoji,
      size: "500x500",
      format: "webp",
      placeholder: true,
      chileanProduct: true,
      created: new Date().toISOString()
    };
    
    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
  });
});

// Create a README file explaining the placeholder system
const readmeContent = `# Chilean Product Images

This directory contains placeholder images for Chilean minimarket products.

## Structure

- Each category has its own subdirectory
- SVG placeholders are created for development
- WebP images should replace these placeholders in production

## Categories

${Object.entries(productImages).map(([cat, products]) => 
  `- **${cat}**: ${products.length} product${products.length !== 1 ? 's' : ''}`
).join('\n')}

## To Do

1. Replace SVG placeholders with actual high-quality product images
2. Ensure all images are optimized for web (WebP format)
3. Maintain consistent 500x500px dimensions
4. Use professional product photography

## Source Recommendations

Based on research, the best sources for Chilean product images are:

1. **Supermarket websites**: Jumbo.cl, Santa Isabel, Unimarc
2. **Brand websites**: Soprole.cl, Carozzi.cl, CCU.com
3. **Social media**: @jumbochile (624K followers)
4. **Stock photography**: Shutterstock Chilean collection

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(__dirname, 'public', 'images', 'products', 'README.md'), readmeContent);

console.log(`\\n✅ Created placeholder images for ${Object.values(productImages).flat().length} Chilean products`);
console.log('📁 All files organized by category');
console.log('🇨🇱 Chilean product placeholders ready for development');
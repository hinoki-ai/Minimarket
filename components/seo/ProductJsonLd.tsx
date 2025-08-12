'use client';

interface ProductJsonLdProps {
  name: string;
  description?: string;
  sku?: string;
  brand?: string;
  images?: string[];
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  url?: string;
}

export function ProductJsonLd({
  name,
  description,
  sku,
  brand = 'Minimarket ARAMAC',
  images = [],
  price,
  currency = 'CLP',
  availability = 'InStock',
  url,
}: ProductJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    sku,
    brand: { '@type': 'Brand', name: brand },
    image: images,
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: String(price),
      availability: `https://schema.org/${availability}`,
      url: url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}


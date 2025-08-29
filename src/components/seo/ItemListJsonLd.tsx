'use client';

interface ItemListEntry {
  url: string;
  name?: string;
  image?: string;
}

interface ItemListJsonLdProps {
  items: ItemListEntry[];
  itemListName?: string;
}

export function ItemListJsonLd({ items, itemListName }: ItemListJsonLdProps) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: itemListName,
    itemListElement: items.map((it, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        url: it.url,
        name: it.name,
        image: it.image,
      },
    })),
  } as const;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}


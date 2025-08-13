'use client';

interface WebSiteJsonLdProps {
  name: string;
  url: string;
  searchUrlTemplate?: string; // e.g., https://site/search?q={search_term_string}
}

export function WebSiteJsonLd({ name, url, searchUrlTemplate }: WebSiteJsonLdProps) {
  const data: {
    '@context': string;
    '@type': 'WebSite';
    name: string;
    url: string;
    potentialAction?: {
      '@type': 'SearchAction';
      target: string;
      'query-input': string;
    };
  } = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
  };

  if (searchUrlTemplate) {
    data.potentialAction = {
      '@type': 'SearchAction',
      target: `${searchUrlTemplate}`,
      'query-input': 'required name=search_term_string',
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}


'use client';

interface OrganizationJsonLdProps {
  name: string;
  url: string;
  logoUrl?: string;
  sameAs?: string[];
}

export function OrganizationJsonLd({ name, url, logoUrl, sameAs = [] }: OrganizationJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: logoUrl,
    sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}


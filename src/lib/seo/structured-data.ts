import { SITE_CONFIG } from "./constants";

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/icon-512.png`,
    description: SITE_CONFIG.description,
    sameAs: ["https://github.com/eL1fe/mcpdir"],
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/servers?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

interface ServerSchemaInput {
  name: string;
  slug: string;
  description: string | null;
  sourceUrl: string;
  homepageUrl?: string | null;
  starsCount?: number | null;
  latestVersion?: string | null;
  tools?: { name: string; description?: string }[];
  updatedAt: Date | null;
}

export function generateServerSchema(server: ServerSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: server.name,
    url: `${SITE_CONFIG.url}/servers/${server.slug}`,
    description: server.description || `${server.name} - MCP server for AI integrations`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    ...(server.latestVersion && { softwareVersion: server.latestVersion }),
    codeRepository: server.sourceUrl,
    downloadUrl: server.homepageUrl || server.sourceUrl,
    ...(server.starsCount &&
      server.starsCount > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Math.min(5, 3 + server.starsCount / 1000).toFixed(1),
          bestRating: "5",
          worstRating: "1",
          ratingCount: server.starsCount,
        },
      }),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    ...(server.tools?.length && {
      featureList: server.tools.map((t) => t.name).join(", "),
    }),
    ...(server.updatedAt && { dateModified: server.updatedAt.toISOString() }),
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateCollectionPageSchema(options: {
  name: string;
  description: string;
  url: string;
  itemCount: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
    url: options.url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: options.itemCount,
    },
  };
}

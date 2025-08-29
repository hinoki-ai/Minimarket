# Minimarket Scraping Infrastructure Inventory

## Overview
Comprehensive Chilean minimarket product scraping system covering:
- **Jumbo** - Leading supermarket chain
- **Líder** - Walmart Chile subsidiary  
- **Santa Isabel** - Cencosud subsidiary
- **Tottus** - Falabella retail chain
- **Unimarc** - Chilean supermarket chain
- **Sodimac** - Home improvement retailer

## Data Organization

### Active Data (`data/scraping/active/`)
- **consolidated/** - Latest products from each store
- **images/** - Current product images
- **reports/** - Recent scraping reports

### Archived Data (`data/scraping/archived/`)
- **legacy-scraped/** - Original scraped assets
- **ultra-scraper/** - Historical ultra-scraper runs
- **backups/** - Product data backups by date

### Raw Data (`data/products/`)
- Individual store product databases
- Validation and summary files
- Store-specific manifests

## Scraper Commands (package.json)

```bash
# Main scraper (ultra-scraper.js)
npm run scrape

# Líder-specific scraping
npm run scrape:lider
npm run scrape:lider:clean

# Data standardization
npm run scrape:standardize
```

## Data Schema
Products follow standardized Chilean market schema:
- SKU, name, price, brand, category
- Store-specific metadata
- Image URLs and local paths
- Availability and stock status

## Archive Policy
- Keep last 30 days of active data
- Archive older runs monthly
- Maintain consolidated latest data per store

Last updated: 2025-08-29T19:10:57.153Z

/**
 * Smart product sorting and mixing utilities
 * Creates a visually appealing, quality-ranked product listing
 */

interface Product {
  id: string;
  title: string;
  currentPrice: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviews?: number;
  marketplace: string;
  inStock?: boolean;
  [key: string]: any;
}

/**
 * Calculates a quality score for a product based on multiple factors
 * Higher score = better product placement
 */
export function calculateProductScore(product: Product): number {
  let score = 0;

  // Discount contributes up to 30 points (higher discount = better)
  if (product.discount && product.discount > 0) {
    score += Math.min(product.discount, 50) * 0.6; // Max 30 points for 50%+ discount
  }

  // Reviews contribute up to 25 points (more reviews = more trustworthy)
  if (product.reviews && product.reviews > 0) {
    score += Math.min(Math.log10(product.reviews + 1) * 10, 25);
  }

  // Rating contributes up to 20 points
  if (product.rating && product.rating > 0) {
    score += product.rating * 4; // 5 rating = 20 points
  }

  // Price reasonableness (prefer mid-range prices, not too cheap or expensive)
  // Very cheap items might be low quality, very expensive might be less accessible
  if (product.currentPrice > 0) {
    if (product.currentPrice >= 1000 && product.currentPrice <= 100000) {
      score += 10; // Sweet spot for most shoppers
    } else if (product.currentPrice > 100000) {
      score += 5; // Still valuable but less accessible
    }
  }

  // In-stock bonus
  if (product.inStock !== false) {
    score += 5;
  }

  // Has image bonus
  if (product.image && product.image.length > 0) {
    score += 5;
  }

  return score;
}

/**
 * Smart mixing algorithm that:
 * 1. Sorts each marketplace's products by quality score
 * 2. Creates clusters of 2-3 products per marketplace
 * 3. Ensures marketplace diversity in the first visible results
 * 4. Puts best products from each marketplace at the top
 */
export function smartMixProducts(
  daraz: Product[],
  priceoye: Product[],
  telemart: Product[],
  olx: Product[],
): Product[] {
  const marketplaces = [
    { name: 'daraz', products: [...daraz] },
    { name: 'priceoye', products: [...priceoye] },
    { name: 'telemart', products: [...telemart] },
    { name: 'olx', products: [...olx] },
  ];

  // Sort each marketplace by quality score (descending)
  marketplaces.forEach((mp) => {
    mp.products.sort(
      (a, b) => calculateProductScore(b) - calculateProductScore(a),
    );
  });

  const result: Product[] = [];
  const clusterSize = 2; // Show 2 products from each marketplace before switching

  // Phase 1: First 8-12 products - Show best from each marketplace (ensures diversity)
  // Take top 2-3 from each to fill first visible rows
  for (let round = 0; round < 3; round++) {
    for (const mp of marketplaces) {
      if (mp.products.length > round) {
        result.push(mp.products[round]);
      }
    }
  }

  // Remove already added products
  const addedIds = new Set(result.map((p) => p.id));
  marketplaces.forEach((mp) => {
    mp.products = mp.products.filter((p) => !addedIds.has(p.id));
  });

  // Phase 2: Remaining products - Cluster by marketplace for easier scanning
  // Group remaining products in clusters of 2-3 per marketplace
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const mp of marketplaces) {
      // Take next cluster from this marketplace
      const cluster = mp.products.splice(0, clusterSize);
      if (cluster.length > 0) {
        result.push(...cluster);
        hasMore = true;
      }
    }
  }

  return result;
}

/**
 * Legacy interleave function (kept for backwards compatibility)
 */
export function interleaveArrays<T>(...arrays: T[][]): T[] {
  const maxLength = Math.max(...arrays.map((arr) => arr.length), 0);
  const result: T[] = [];
  for (let i = 0; i < maxLength; i++) {
    for (const arr of arrays) {
      if (i < arr.length) result.push(arr[i]);
    }
  }
  return result;
}

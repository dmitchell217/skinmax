import catalogData from '../../public/seed_products.json';

export interface CatalogItem {
  id: number;
  brand: string;
  name: string;
  step: string;
  actives: string[];
  strength?: string;
  skin_types: string[];
  price_cents: number;
  url: string;
}

/**
 * Load the product catalog
 * In production, this reads from the static JSON file
 */
export async function loadCatalog(): Promise<CatalogItem[]> {
  // In Next.js, we can import JSON directly
  // For runtime loading, we'd fetch from public/seed_products.json
  return catalogData as CatalogItem[];
}

/**
 * Get price band category based on monthly budget
 * Returns: 'budget' ($), 'mid' ($$), or 'premium' ($$$)
 */
export function priceBand(budgetPerMonthCents: number): 'budget' | 'mid' | 'premium' {
  if (budgetPerMonthCents < 3000) {
    return 'budget';
  } else if (budgetPerMonthCents < 8000) {
    return 'mid';
  } else {
    return 'premium';
  }
}

/**
 * Get target price per product based on budget and step count
 */
export function getTargetPricePerProduct(
  budgetPerMonthCents: number,
  stepCount: number
): number {
  // Assume routine is used for ~30 days
  // Distribute budget across steps (rough estimate)
  const budgetPerStep = budgetPerMonthCents / stepCount;
  return budgetPerStep;
}

/**
 * Filter catalog by step, skin type, and budget
 */
export function filterBy(
  catalog: CatalogItem[],
  step: string,
  skinType: string,
  budgetCents: number
): CatalogItem[] {
  const targetPrice = getTargetPricePerProduct(budgetCents, 4); // Assume 4 steps average
  const band = priceBand(budgetCents);
  
  // Define price ranges for each band (per product)
  const priceRanges = {
    budget: { min: 0, max: 1500 },
    mid: { min: 1500, max: 3000 },
    premium: { min: 3000, max: Infinity },
  };
  
  const range = priceRanges[band];
  
  return catalog.filter((item) => {
    // Match step
    if (item.step !== step) return false;
    
    // Match skin type
    if (!item.skin_types.includes(skinType)) return false;
    
    // Match budget (within reasonable range)
    if (item.price_cents < range.min || item.price_cents > range.max) return false;
    
    return true;
  });
}

/**
 * Filter by actives (for conflict checking)
 */
export function filterByActives(
  catalog: CatalogItem[],
  actives: string[]
): CatalogItem[] {
  if (actives.length === 0) return catalog;
  
  return catalog.filter((item) => {
    return actives.some((active) =>
      item.actives.some((itemActive) =>
        itemActive.toLowerCase().includes(active.toLowerCase())
      )
    );
  });
}


import { Product, SearchResponse, Marketplace, MarketplaceStatus } from "@shared/schema";

// Is line ko purani wali ki jagah paste kar dein
const BACKEND_URL = "https://kartowl-production-8370.up.railway.app/api";
// Default marketplace status for error cases
const defaultMarketplaceStatus: Record<Marketplace, MarketplaceStatus> = {
  daraz: { success: false, count: 0, error: 'Request failed' },
  priceoye: { success: false, count: 0, error: 'Request failed' },
  telemart: { success: false, count: 0, error: 'Request failed' },
  olx: { success: false, count: 0, error: 'Request failed' },
};

export const searchProducts = async (query: string): Promise<SearchResponse> => {
  try {
    const response = await fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}`);

    // Handle rate limiting
    if (response.status === 429) {
      console.warn("Rate limited - too many requests");
      return {
        success: false,
        count: 0,
        marketplaceStatus: defaultMarketplaceStatus,
        data: [],
      };
    }

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const json = await response.json();

    // Return full response with marketplace status
    if (json.success && Array.isArray(json.data)) {
      return {
        success: json.success,
        count: json.count,
        marketplaceStatus: json.marketplaceStatus || defaultMarketplaceStatus,
        data: json.data,
      };
    }

    return {
      success: false,
      count: 0,
      marketplaceStatus: defaultMarketplaceStatus,
      data: [],
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      count: 0,
      marketplaceStatus: defaultMarketplaceStatus,
      data: [],
    };
  }
};

// Legacy function for backwards compatibility - returns just products
export const searchProductsLegacy = async (query: string): Promise<Product[]> => {
  const result = await searchProducts(query);
  return result.data;
};

// Fetch price history for a specific product
export const getProductHistory = async (productUrl: string): Promise<any[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/history?url=${encodeURIComponent(productUrl)}`);
    if (!response.ok) throw new Error('Failed to fetch history');

    const json = await response.json();

    // Extract the data array from the response
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }

    return [];
  } catch (error) {
    console.error("History fetch error:", error);
    return [];
  }
};
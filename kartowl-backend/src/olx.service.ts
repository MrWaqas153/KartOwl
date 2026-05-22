import { Injectable, Logger } from '@nestjs/common';
import { ApifyService } from './apify.service';

@Injectable()
export class OlxService {
  private readonly logger = new Logger(OlxService.name);
  private readonly BASE_URL = 'https://www.olx.com.pk';
  private readonly SEARCH_TIMEOUT_MS = 15000;

  constructor(private readonly apifyService: ApifyService) {}

  async searchProduct(query: string): Promise<any[]> {
    try {
      this.logger.log(`OLX searching for: ${query}`);

      const apiResult = await this.searchWithOlxApi(query);
      if (apiResult.products.length > 0 || !apiResult.blocked) {
        return apiResult.products;
      }

      this.logger.warn('OLX direct API appears blocked. Trying Apify fallback.');
      return this.searchWithApify(query);
    } catch (error: any) {
      this.logger.error(`OLX search failed: ${error.message}`);
      return [];
    }
  }

  private async searchWithOlxApi(
    query: string,
  ): Promise<{ products: any[]; blocked: boolean }> {
    const apiUrl = `${this.BASE_URL}/api/relevance/v4/search?query=${encodeURIComponent(query)}&lang=en`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.SEARCH_TIMEOUT_MS);

    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: `${this.BASE_URL}/`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });

      const contentType = response.headers.get('content-type') ?? '';
      const blocked =
        [403, 429, 503].includes(response.status) ||
        !contentType.includes('application/json');

      if (!response.ok || blocked) {
        this.logger.warn(
          `OLX API unavailable: status=${response.status}, content-type=${contentType || 'unknown'}`,
        );
        return { products: [], blocked: true };
      }

      const jsonData = await response.json();
      const listings = Array.isArray(jsonData?.data) ? jsonData.data : [];

      if (listings.length === 0) {
        this.logger.warn(`OLX API: no listings found for "${query}".`);
        return { products: [], blocked: false };
      }

      const products = this.normalizeProducts(listings);
      this.logger.log(`OLX API: found ${products.length} products`);
      return { products, blocked: false };
    } catch (error: any) {
      const message =
        error?.name === 'AbortError'
          ? `request timed out after ${this.SEARCH_TIMEOUT_MS}ms`
          : error?.message;

      this.logger.warn(`OLX API request failed: ${message}`);
      return { products: [], blocked: true };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async searchWithApify(query: string): Promise<any[]> {
    if (!process.env.APIFY_API_TOKEN) {
      this.logger.warn(
        'APIFY_API_TOKEN is not set, so OLX fallback cannot run on Railway.',
      );
      return [];
    }

    const items = await this.apifyService.runScraper('olx', query);
    const products = this.normalizeProducts(items);
    this.logger.log(`OLX Apify fallback: found ${products.length} products`);
    return products;
  }

  private normalizeProducts(items: any[]): any[] {
    return items
      .map((item: any) => {
        const currentPrice = this.parsePrice(item);
        const title = (item.title || item.name || 'Unknown').trim();
        const productUrl = this.resolveProductUrl(item);
        const image = this.resolveImage(item);
        const location = this.resolveLocation(item);

        return {
          id:
            item.id?.toString() ||
            item.itemId?.toString() ||
            productUrl ||
            Math.random().toString(36).substring(2, 11),
          title,
          currentPrice,
          originalPrice: currentPrice,
          discount: 0,
          image,
          marketplace: 'olx',
          productUrl,
          rating: 0,
          reviews: 0,
          inStock: true,
          location,
          priceText:
            item.price?.displayValue ||
            item.priceText ||
            (typeof item.price === 'string' ? item.price : undefined),
        };
      })
      .filter((product: any) => product.currentPrice > 0 && product.title)
      .slice(0, 15);
  }

  private parsePrice(item: any): number {
    const rawPrice =
      item.price?.value?.raw ??
      item.currentPrice ??
      item.priceValue ??
      item.price?.raw ??
      item.price;

    if (typeof rawPrice === 'number') {
      return rawPrice;
    }

    if (typeof rawPrice !== 'string') {
      return 0;
    }

    const normalized = rawPrice.toLowerCase().replace(/,/g, '');
    const numericValue = Number(normalized.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    if (normalized.includes('crore')) {
      return Math.round(numericValue * 10000000);
    }

    if (normalized.includes('lac') || normalized.includes('lakh')) {
      return Math.round(numericValue * 100000);
    }

    return Math.round(numericValue);
  }

  private resolveProductUrl(item: any): string {
    const url = item.url || item.productUrl || item.link;
    if (typeof url === 'string' && url.startsWith('http')) {
      return url;
    }

    if (typeof url === 'string' && url.startsWith('/')) {
      return `${this.BASE_URL}${url}`;
    }

    if (item.slug && item.id) {
      return `${this.BASE_URL}/item/${item.slug}-iid-${item.id}`;
    }

    if (item.id) {
      return `${this.BASE_URL}/item/iid-${item.id}`;
    }

    return this.BASE_URL;
  }

  private resolveImage(item: any): string {
    if (typeof item.image === 'string') {
      return item.image;
    }

    if (typeof item.imageUrl === 'string') {
      return item.imageUrl;
    }

    if (Array.isArray(item.images) && item.images.length > 0) {
      const firstImage = item.images[0];
      return typeof firstImage === 'string' ? firstImage : firstImage?.url || '';
    }

    return '';
  }

  private resolveLocation(item: any): string {
    if (typeof item.location === 'string') {
      return item.location;
    }

    if (Array.isArray(item.locations) && item.locations.length > 0) {
      return item.locations[0]?.name || 'Pakistan';
    }

    return item.city || 'Pakistan';
  }
}

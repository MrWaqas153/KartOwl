import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TelemartService {
  private readonly logger = new Logger(TelemartService.name);

  private readonly ALGOLIA_APP_ID = '7Z6UNQYQER';
  private readonly ALGOLIA_API_KEY = '9b4c33f99e845fe1363fd4c6ceb0f467';
  private readonly ALGOLIA_URL =
    'https://7z6unqyqer-3.algolianet.com/1/indexes/*/queries';

  async searchProduct(query: string): Promise<any[]> {
    try {
      this.logger.log(`🦉 Telemart Algolia scraping: ${query}`);

      const response = await fetch(
        `${this.ALGOLIA_URL}?x-algolia-agent=Algolia%20for%20JavaScript%20(4.15.0)%3B%20Browser%20(lite)&x-algolia-api-key=${this.ALGOLIA_API_KEY}&x-algolia-application-id=${this.ALGOLIA_APP_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                indexName: 'products',
                params: `query=${encodeURIComponent(query)}&hitsPerPage=20&page=0&highlightPreTag=__ais-highlight__&highlightPostTag=__/ais-highlight__`,
              },
            ],
          }),
        },
      );

      const data = await response.json();
      const hits = data?.results?.[0]?.hits || [];

      this.logger.log(`✅ Telemart: ${hits.length} products found`);

      return hits
        .map((hit: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          title: hit.title || 'Unknown Product',
          currentPrice:
            hit.discounted_price || hit.sale_price || hit.price || 0,
          originalPrice: hit.price || 0,
          discount: hit.discountPercent || 0,
          image: hit.mainImageLink || '',
          marketplace: 'telemart',
          productUrl: `https://telemart.pk/${hit.slug?.replace('-price-in-pakistan.html', '') || ''}`,
          rating: parseFloat(hit.rating) || 4.0,
          reviews: hit.reviewsCount || 0,
          inStock: (hit.qty || 0) > 0,
        }))
        .filter((p: any) => p.currentPrice > 0);
    } catch (error) {
      this.logger.error(`❌ Telemart Algolia failed: ${error}`);
      return [];
    }
  }
}

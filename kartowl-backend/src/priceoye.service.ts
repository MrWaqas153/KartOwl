import { Injectable, Logger } from '@nestjs/common';
import { BrowserService } from './browser.service';

@Injectable()
export class PriceOyeService {
  private readonly logger = new Logger(PriceOyeService.name);

  constructor(private readonly browserService: BrowserService) { }

  async searchProduct(query: string): Promise<any[]> {
    if (!this.browserService.isBrowserAvailable()) {
      this.logger.warn('Browser not available for PriceOye scraping');
      return [];
    }

    const result = await this.browserService.getNewPage();
    if (!result) return [];

    const { page, context } = result;

    try {
      this.logger.log(`🦉 PriceOye scraping: ${query}`);
      const searchUrl = `https://priceoye.pk/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      try {
        await page.waitForSelector('.product-list', { timeout: 10000 });
      } catch {
        this.logger.warn('PriceOye: No product list found');
        return [];
      }

      const products = await page.evaluate(() => {
        const cards = document.querySelectorAll(
          '.product-list .p-item, .product-list .productBox',
        );

        return Array.from(cards)
          .slice(0, 15)
          .map((card: any) => {
            const anchor = card.querySelector('a');
            const productUrl = anchor?.href || '';

            // Title extract karo
            const titleEl =
              card.querySelector('.p-title') ||
              card.querySelector('.product-title');
            let title =
              titleEl?.textContent?.trim() ||
              card.querySelector('img')?.alt ||
              'Unknown Product';

            // Agar title mein HTML tag hai to clean karo
            if (title.includes('<') || title.includes('>') || title.startsWith('http')) {
              title = card.querySelector('img')?.alt || 'Unknown Product';
            }
            title = title.replace(/<[^>]*>/g, '').trim();
            if (!title) title = 'Unknown Product';

            // Image extract karo
            let image = '';
            const ampImgEl = card.querySelector('amp-img');
            if (ampImgEl) {
              image = ampImgEl.getAttribute('src') || '';
              if (image.startsWith('/')) image = 'https://priceoye.pk' + image;
              if (image.startsWith('<') || image.includes('<img')) image = '';
            } else {
              const imgEl = card.querySelector('img');
              if (imgEl) {
                image =
                  imgEl.getAttribute('data-src') ||
                  imgEl.getAttribute('src') ||
                  '';
                if (image.startsWith('/')) image = 'https://priceoye.pk' + image;
                if (image.startsWith('<') || image.includes('<img')) image = '';
              }
            }

            // Image valid URL check
            if (image && !image.startsWith('http') && !image.startsWith('//')) {
              image = '';
            }

            // Price extract karo
            let currentPrice = 0;
            const priceEl = card.querySelector('.price-box');
            if (priceEl) {
              const match = (priceEl.textContent || '').match(/[\d,]+/g);
              if (match)
                currentPrice = parseInt(match[0].replace(/,/g, '')) || 0;
            }

            let originalPrice = 0;
            const diffEl = card.querySelector('.price-diff');
            if (diffEl) {
              const match = (diffEl.textContent || '').match(/[\d,]+/g);
              if (match)
                originalPrice = parseInt(match[0].replace(/,/g, '')) || 0;
            }
            if (originalPrice < currentPrice) originalPrice = currentPrice;

            const outOfStockImg =
              card.querySelector('img[src*="out-of-stock"]') ||
              card.querySelector('[class*="out-of-stock"]');
            const inStock = !outOfStockImg;

            return {
              id: Math.random().toString(36).substr(2, 9),
              title,
              currentPrice,
              originalPrice,
              discount:
                originalPrice > currentPrice
                  ? Math.round(
                    ((originalPrice - currentPrice) / originalPrice) * 100,
                  )
                  : 0,
              image,
              marketplace: 'priceoye',
              productUrl,
              rating: 4.5,
              reviews: 0,
              inStock,
            };
          });
      });

      return products.filter((p) => p.currentPrice > 0);
    } catch (error) {
      this.logger.error(`❌ PriceOye scraping failed: ${error}`);
      return [];
    } finally {
      await context.close();
    }
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { BrowserService } from './browser.service';

@Injectable()
export class DarazService {
  private readonly logger = new Logger(DarazService.name);

  constructor(private readonly browserService: BrowserService) {}

  async searchProduct(query: string): Promise<any[]> {
    if (!this.browserService.isBrowserAvailable()) {
      this.logger.warn('Browser not available for Daraz scraping');
      return [];
    }

    const result = await this.browserService.getNewPage();
    if (!result) return [];

    const { page, context } = result;

    try {
      this.logger.log(`🦉 Daraz scraping: ${query}`);
      const searchUrl = `https://www.daraz.pk/catalog/?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await page.evaluate(async () => {
        window.scrollBy(0, 800);
        await new Promise((r) => setTimeout(r, 800));
        window.scrollBy(0, 800);
        await new Promise((r) => setTimeout(r, 800));
      });

      await page.waitForTimeout(1500);

      await page.waitForSelector('[data-qa-locator="product-item"]', {
        timeout: 15000,
      });

      const products = await page.evaluate(() => {
        const cards = document.querySelectorAll(
          '[data-qa-locator="product-item"]',
        );

        return Array.from(cards)
          .slice(0, 20)
          .map((card: any) => {
            const cardText = card.innerText || '';

            const imgEl = card.querySelector('img');
            let image =
              imgEl?.getAttribute('data-ks-lazyload') ||
              imgEl?.getAttribute('data-src') ||
              imgEl?.getAttribute('src') ||
              '';
            if (image)
              image = image.replace(/_\d+x\d+.*$/, '').replace(/_.webp$/, '');

            let currentPrice = 0;
            let originalPrice = 0;

            const priceElements = card.querySelectorAll('span');
            for (const el of priceElements) {
              if (el.closest('del')) continue;
              const text = el.textContent || '';
              if (text.includes('Rs.') && /[\d,]+/.test(text)) {
                currentPrice = parseInt(text.replace(/[^\d]/g, '')) || 0;
                if (currentPrice > 0) break;
              }
            }

            const delEl = card.querySelector('del');
            if (delEl) {
              const delText = delEl.textContent || '';
              if (delText.includes('Rs.')) {
                originalPrice = parseInt(delText.replace(/[^\d]/g, '')) || 0;
              }
            }
            if (!originalPrice || originalPrice < currentPrice)
              originalPrice = currentPrice;

            const reviewsMatch = cardText.match(/\((\d+[\d,]*)\)/);
            const reviews = reviewsMatch
              ? parseInt(reviewsMatch[1].replace(/,/g, ''))
              : 0;

            const titleEl = card.querySelector('a[title]');
            let productUrl = titleEl?.getAttribute('href') || '';
            if (productUrl.startsWith('//')) productUrl = `https:${productUrl}`;

            const soldMatch = cardText.match(/(\d+[\d\.]*[kK]?)\s+Sold/i);

            return {
              id: Math.random().toString(36).substr(2, 9),
              title: titleEl?.getAttribute('title') || 'Unknown Product',
              currentPrice,
              originalPrice,
              discount:
                originalPrice > currentPrice
                  ? Math.round(
                      ((originalPrice - currentPrice) / originalPrice) * 100,
                    )
                  : 0,
              image,
              marketplace: 'daraz',
              productUrl,
              rating: 4.0,
              reviews,
              sold: soldMatch ? soldMatch[0] : '0 Sold',
              inStock: true,
            };
          });
      });

      return products.filter((p) => p.currentPrice > 0);
    } catch (error) {
      this.logger.error(`❌ Daraz scraping failed: ${error}`);
      return [];
    } finally {
      await context.close();
    }
  }
}

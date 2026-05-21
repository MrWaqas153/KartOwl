import { Injectable, Logger } from '@nestjs/common';
import { BrowserService } from './browser.service';

@Injectable()
export class OlxService {
  private readonly logger = new Logger(OlxService.name);

  constructor(private readonly browserService: BrowserService) { }

  async searchProduct(query: string): Promise<any[]> {
    if (!this.browserService.isBrowserAvailable()) {
      this.logger.warn('Browser not available for OLX scraping');
      return [];
    }

    const result = await this.browserService.getNewPage();
    if (!result) return [];

    const { page, context } = result;

    try {
      this.logger.log(`🦉 OLX scraping: ${query}`);

      // 1. Anti-Bot Bypass: OLX ko lagay ke real user aa raha hai
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      const searchUrl = `https://www.olx.com.pk/items/q-${encodeURIComponent(query)}`;
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      try {
        // 2. Extra Selectors: Agar OLX class change kare toh code fail na ho
        await page.waitForSelector('li[aria-label="Listing"], [data-aut-id="itemBox"], li article', {
          timeout: 10000,
        });
      } catch {
        // 3. Debugging: Agar block hua toh Railway logs mein exact page title show hoga
        const pageTitle = await page.title();
        this.logger.warn(`OLX: No listings found. Page Title seen by Railway: "${pageTitle}"`);
        return [];
      }

      const products = await page.evaluate(() => {
        const items: any[] = [];
        const cards = document.querySelectorAll(
          'li[aria-label="Listing"], [data-aut-id="itemBox"], li article',
        );

        cards.forEach((card: any) => {
          const anchor = card.querySelector('a');
          if (!anchor) return;

          let productUrl = anchor.getAttribute('href');
          if (productUrl && !productUrl.startsWith('http')) {
            productUrl = 'https://www.olx.com.pk' + productUrl;
          }

          let title =
            card.querySelector('[aria-label="Title"]')?.textContent ||
            card.querySelector('h2')?.textContent ||
            'Unknown';
          title = title.trim();

          const textContent = card.innerText || '';
          let currentPrice = 0;
          const priceMatch = textContent.match(/Rs\.?\s*[\d,.]+\s*(?:Lac)?/i);
          if (priceMatch) {
            const numStr =
              priceMatch[0].replace(/,/g, '').match(/[\d.]+/)?.[0] || '0';
            currentPrice = priceMatch[0].toLowerCase().includes('lac')
              ? parseFloat(numStr) * 100000
              : parseInt(numStr);
          }

          const imgEl = card.querySelector('img');
          const image =
            imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';

          let location = 'Pakistan';
          const locationEl = card.querySelector('[aria-label="Location"]');
          if (locationEl) location = locationEl.textContent?.trim() || location;

          if (title && currentPrice > 0) {
            items.push({
              id: Math.random().toString(36).substring(2, 11),
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
            });
          }
        });

        return items.slice(0, 15);
      });

      return products;
    } catch (error) {
      this.logger.error(`❌ OLX scraping failed: ${error}`);
      return [];
    } finally {
      await context.close();
    }
  }
}
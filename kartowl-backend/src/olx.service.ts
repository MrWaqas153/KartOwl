import { Injectable, Logger } from '@nestjs/common';
import { BrowserService } from './browser.service';

@Injectable()
export class OlxService {
  private readonly logger = new Logger(OlxService.name);

  // Constructor mein BrowserService rakha hai taake NestJS ka structure break na ho, 
  // lekin hum isay use nahi karenge kyunke ab hum API use kar rahe hain.
  constructor(private readonly browserService: BrowserService) { }

  async searchProduct(query: string): Promise<any[]> {
    try {
      this.logger.log(`🦉 OLX API searching for: ${query}`);

      // 1. OLX ki internal Hidden JSON API ka URL
      const apiUrl = `https://www.olx.com.pk/api/relevance/v4/search?query=${encodeURIComponent(query)}&lang=en`;

      // 2. Fetch lagayen with Anti-Bot Headers (Cloudflare bypass)
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.olx.com.pk/',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.ok) {
        this.logger.warn(`OLX API failed with status: ${response.status}`);
        return [];
      }

      const jsonData = await response.json();

      // 3. Agar products na milein ya API block ho
      if (!jsonData.data || jsonData.data.length === 0) {
        this.logger.warn('OLX API: No listings found.');
        return [];
      }

      // 4. JSON data ko KartOwl ke hisaab se format karein
      const products = jsonData.data.map((item: any) => {
        // Exact integer price nikal rahay hain, decimal ka koi chakkar nahi
        const currentPrice = item.price?.value?.raw || 0;
        const title = item.title || 'Unknown';
        const productUrl = `https://www.olx.com.pk/item/iid-${item.id}`;
        const image = item.images && item.images.length > 0 ? item.images[0].url : '';
        
        // Location set karna
        let location = 'Pakistan';
        if (item.locations && item.locations.length > 0) {
          location = item.locations[0].name || 'Pakistan';
        }

        return {
          id: item.id?.toString() || Math.random().toString(36).substring(2, 11),
          title: title.trim(),
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
        };
      });

      // 5. Sirf wo products return karein jinki price > 0 ho aur top 15 results limit karein
      const finalProducts = products.filter((p: any) => p.currentPrice > 0).slice(0, 15);
      
      this.logger.log(`✅ OLX API: Found ${finalProducts.length} products`);
      return finalProducts;

    } catch (error: any) {
      this.logger.error(`❌ OLX API scraping failed: ${error.message}`);
      return [];
    }
  }
}
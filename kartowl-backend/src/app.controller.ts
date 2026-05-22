// src/app.controller.ts
import {
  Controller,
  Get,
  Query,
  Inject,
  Post,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { SkipThrottle } from '@nestjs/throttler';
import { DarazService } from './daraz.service';
import { PriceOyeService } from './priceoye.service';
import { TelemartService } from './telemart.service';
import { OlxService } from './olx.service';
import { HistoryService } from './history.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AlertsService } from './alerts/alerts.service';
import { SearchDto } from './dto/search.dto';
import {
  interleaveArrays,
  smartMixProducts,
} from './utils/product-sorting.utils';

interface MarketplaceStatus {
  success: boolean;
  count: number;
  error?: string;
}

interface SearchResponse {
  success: boolean;
  count: number;
  marketplaceStatus: {
    daraz: MarketplaceStatus;
    priceoye: MarketplaceStatus;
    telemart: MarketplaceStatus;
    olx: MarketplaceStatus;
  };
  data: any[];
}

@Controller('api')
export class AppController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly darazService: DarazService,
    private readonly priceOyeService: PriceOyeService,
    private readonly telemartService: TelemartService,
    private readonly olxService: OlxService,
    private readonly historyService: HistoryService,
    private readonly alertsService: AlertsService,
  ) { }

  @Get('search')
  async search(@Query() searchDto: SearchDto): Promise<SearchResponse> {
    const query = searchDto.q;

    const cacheKey = `search:${query.toLowerCase().trim()}`;

    const cachedData = await this.cacheManager.get<SearchResponse>(cacheKey);
    if (cachedData) {
      console.log(`⚡ Serving from cache: ${query}`);
      return cachedData;
    }

    console.log(`🚀 Scrapers engaged: ${query}`);

    const marketplaceStatus: SearchResponse['marketplaceStatus'] = {
      daraz: { success: false, count: 0 },
      priceoye: { success: false, count: 0 },
      telemart: { success: false, count: 0 },
      olx: { success: false, count: 0 },
    };

    const [darazResult, priceOyeResult, telemartResult, olxResult] =
      await Promise.all([
        this.safeSearch('daraz', () => this.darazService.searchProduct(query)),
        this.safeSearch('priceoye', () =>
          this.priceOyeService.searchProduct(query),
        ),
        this.safeSearch('telemart', () =>
          this.telemartService.searchProduct(query),
        ),
        this.safeSearch('olx', () => this.olxService.searchProduct(query)),
      ]);

    marketplaceStatus.daraz = darazResult.status;
    marketplaceStatus.priceoye = priceOyeResult.status;
    marketplaceStatus.telemart = telemartResult.status;
    marketplaceStatus.olx = olxResult.status;

    const allProducts = interleaveArrays(
      darazResult.products,
      priceOyeResult.products,
      telemartResult.products,
      olxResult.products,
    );

    const results: SearchResponse = {
      success: true,
      count: allProducts.length,
      marketplaceStatus,
      data: allProducts,
    };

    await this.cacheManager.set(cacheKey, results);

    allProducts.forEach((product: any) => {
      this.historyService
        .addPricePoint({
          url: product.productUrl,
          title: product.title,
          price: product.currentPrice,
          marketplace: product.marketplace,
          originalPrice: product.originalPrice,
          discount: product.discount,
          imageUrl: product.image,
        })
        .catch((err) => console.error('History save failed', err));
    });

    return results;
  }

  private async safeSearch(
    marketplace: string,
    scraper: () => Promise<any[]>,
  ): Promise<{ products: any[]; status: MarketplaceStatus }> {
    try {
      const products = await scraper();
      console.log(`✅ ${marketplace}: Found ${products.length} products`);
      return {
        products,
        status: { success: true, count: products.length },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ ${marketplace} failed:`, errorMessage);
      return {
        products: [],
        status: { success: false, count: 0, error: errorMessage },
      };
    }
  }

  @Get('history')
  @SkipThrottle()
  async getPriceHistory(@Query('url') productUrl: string) {
    if (!productUrl) return { error: 'Product URL is required' };

    const history = await this.historyService.getHistory(productUrl);
    return {
      success: true,
      count: history.length,
      data: history,
    };
  }

  @Get('trending')
  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600000)
  async getTrending() {
    const deals = await this.historyService.getTrendingDeals();
    return deals.length > 0 ? deals : [];
  }

  @Post('alerts')
  async createAlert(@Body() body: any) {
    console.log('🔔 New Alert Requested:', body);

    const result = await this.alertsService.createAlert(
      body.email,
      body.productUrl,
      body.targetPrice,
      body.productTitle || 'Product',
    );

    return {
      success: true,
      emailSent: result.emailSent,
      emailError: result.emailError,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ProductHistory } from './entities/product-history.entity';
import { normalizeUrl } from './utils/url.utils';

interface AddPricePointParams {
  url: string;
  title: string;
  price: number;
  marketplace: string;
  originalPrice?: number;
  discount?: number;
  imageUrl?: string;
}

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(ProductHistory)
    private historyRepository: Repository<ProductHistory>,
  ) { }

  async addPricePoint(params: AddPricePointParams) {
    const cleanUrl = normalizeUrl(params.url);

    // Prevent spam: Check if we already saved this URL today
    const existingToday = await this.historyRepository
      .createQueryBuilder('history')
      .where('history.productUrl = :url', { url: cleanUrl })
      .andWhere('history.scrapedAt > current_date')
      .getOne();

    if (existingToday) return;

    // Create new history entry with explicit typing
    // Naya Code (Math.round ke sath)
    const entryData: Partial<ProductHistory> = {
      productUrl: cleanUrl,
      productTitle: params.title,
      // 👇 Sirf in do lines mein jadoo kiya hai taake point wale numbers hat jayen
      price: Math.round(Number(params.price)),
      marketplace: params.marketplace,
      originalPrice: params.originalPrice ? Math.round(Number(params.originalPrice)) : undefined,
      // 👆 =========================================================================
      discount: params.discount ?? 0,
      imageUrl: params.imageUrl ?? undefined,
    };

    const entry = this.historyRepository.create(entryData);
    return await this.historyRepository.save(entry);
  }

  async getHistory(rawUrl: string) {
    const cleanUrl = normalizeUrl(rawUrl);
    return await this.historyRepository.find({
      where: { productUrl: cleanUrl },
      order: { scrapedAt: 'ASC' },
    });
  }

  /**
   * Get trending deals - products with actual discounts (>5%)
   * Returns the most recent price point for each unique product
   */
  async getTrendingDeals() {
    // Get diverse trending deals: Fetch top 5 from each marketplace
    const marketplaces = ['daraz', 'priceoye', 'telemart', 'olx'];

    // Run queries in parallel
    const results = await Promise.all(
      marketplaces.map((mp) =>
        this.historyRepository.find({
          where: {
            marketplace: mp,
            discount: MoreThan(5),
          },
          order: {
            discount: 'DESC',
            scrapedAt: 'DESC',
          },
          take: 5,
        }),
      ),
    );

    // Combine and shuffle results
    const deals = results.flat().sort(() => Math.random() - 0.5);

    // Deduplicate by productUrl (keep only the most recent entry per product)
    const seen = new Set<string>();
    const uniqueDeals = deals
      .filter((deal) => {
        if (seen.has(deal.productUrl)) return false;
        seen.add(deal.productUrl);
        return true;
      })
      .slice(0, 20); // Return top 20

    // Transform to match Product type expected by frontend
    return uniqueDeals.map((deal) => ({
      id: deal.id,
      title: deal.productTitle,
      image: deal.imageUrl || '',
      marketplace: deal.marketplace,
      currentPrice: deal.price,
      originalPrice: deal.originalPrice,
      discount: deal.discount,
      productUrl: deal.productUrl,
      inStock: true,
    }));
  }
}

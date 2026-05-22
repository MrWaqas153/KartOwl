import { Injectable, Logger } from '@nestjs/common';
import { ApifyClient } from 'apify-client';

@Injectable()
export class ApifyService {
  private readonly client: ApifyClient;
  private readonly logger = new Logger(ApifyService.name);

  private readonly ACTOR_IDS = {
    daraz: 'Bfrh69aUuORkrGQ0T',
    priceoye: '3zm6qi2doRm6FQ0Xp',
    telemart: 'F311dJbC4FnAWcXip',
    olx: process.env.APIFY_OLX_ACTOR_ID || '7Nxt7zbKMFu9CqNbP',
  };

  constructor() {
    this.client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
  }

  async runScraper(
    marketplace: keyof ApifyService['ACTOR_IDS'],
    query: string,
  ): Promise<any[]> {
    try {
      this.logger.log(
        `Starting Apify Actor: ${marketplace} | query: ${query}`,
      );

      const actorInput = this.getActorInput(marketplace, query);
      const run = await this.client
        .actor(this.ACTOR_IDS[marketplace])
        .call(actorInput, { waitSecs: 90 });

      const { items } = await this.client
        .dataset(run.defaultDatasetId)
        .listItems();

      if (marketplace === 'olx' && items.length === 0) {
        throw new Error(
          'OLX Apify actor returned 0 results. OLX is likely blocking the actor IP/proxy; enable Apify residential proxy for this actor.',
        );
      }

      this.logger.log(`${marketplace}: ${items.length} results`);
      return items;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Apify Actor failed (${marketplace}): ${message}`);
      throw new Error(message);
    }
  }

  private getActorInput(
    marketplace: keyof ApifyService['ACTOR_IDS'],
    query: string,
  ) {
    const searchUrl = `https://www.olx.com.pk/items/q-${encodeURIComponent(query)}`;
    const baseInput = { query };

    if (marketplace !== 'olx') {
      return baseInput;
    }

    const proxyGroups = (
      process.env.APIFY_OLX_PROXY_GROUPS || 'RESIDENTIAL'
    )
      .split(',')
      .map((group) => group.trim())
      .filter(Boolean);

    const proxyConfiguration = {
      useApifyProxy: true,
      apifyProxyGroups: proxyGroups,
    };

    return {
      ...baseInput,
      maxItems: 15,
      maxResults: 15,
      maxRequestsPerCrawl: 1,
      proxy: proxyConfiguration,
      proxyConfig: proxyConfiguration,
      proxyConfiguration,
      startUrl: searchUrl,
      startUrls: [{ url: searchUrl }],
      url: searchUrl,
      urls: [searchUrl],
      useApifyProxy: true,
    };
  }
}

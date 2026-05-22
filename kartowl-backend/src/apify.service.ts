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
    olx: '7Nxt7zbKMFu9CqNbP',
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

      const run = await this.client
        .actor(this.ACTOR_IDS[marketplace])
        .call(this.getActorInput(marketplace, query), { waitSecs: 90 });

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
    const baseInput = { query };

    if (marketplace !== 'olx') {
      return baseInput;
    }

    return {
      ...baseInput,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL'],
      },
    };
  }
}

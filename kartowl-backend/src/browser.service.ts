import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private browser: any = null;
  private browserAvailable: boolean = false;
  private readonly logger = new Logger(BrowserService.name);

  async onModuleInit() {
    try {
      const { chromium } = await import('playwright-extra');
      const stealthPlugin = (await import('puppeteer-extra-plugin-stealth'))
        .default;
      chromium.use(stealthPlugin());

      this.logger.log('🕵️ Launching Stealth Singleton Browser...');
      this.browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
        ]
      });
      this.browserAvailable = true;
      this.logger.log('✅ Browser launched successfully');
    } catch (error) {
      this.browserAvailable = false;
      this.logger.warn('⚠️ Playwright browser not available');
      this.logger.warn(
        `Reason: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      this.logger.log('🛑 Closing Browser Instance...');
      await this.browser.close();
    }
  }

  isBrowserAvailable(): boolean {
    return this.browserAvailable;
  }

  async getNewPage() {
    if (!this.browserAvailable || !this.browser) {
      this.logger.warn('Browser not available - cannot create new page');
      return null;
    }

    try {
      const context = await this.browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        (window as any).chrome = { runtime: {} };
      });

      const page = await context.newPage();
      return { page, context };
    } catch (error) {
      this.logger.error('Failed to create new page', error);
      return null;
    }
  }
}

import { Browser } from 'playwright';
import { BasePage } from './BasePage';
import { Motorcycle } from '../models/Motorcycle';
import { createContext } from '../utils/browserConfig';

export class WallapopPage extends BasePage {
    constructor(browser: Browser) {
        super(browser);
    }

    async init(): Promise<void> {
        const context = await createContext(this.browser);
        this.page = await context.newPage();
    }

    protected buildSearchUrl(searchQuery: string): string {
        return `https://es.wallapop.com/app/search?keywords=${encodeURIComponent(searchQuery)}&category_ids=14000`;
    }

    protected getSourceName(): string {
        return 'wallapop';
    }

    protected async handleCookies(): Promise<void> {
        try {
            const cookieButton = this.page!.locator('#onetrust-accept-btn-handler').first();
            await cookieButton.click({ timeout: 3000 });
            await this.page!.waitForTimeout(1000);
        } catch (e) {
            console.log('Wallapop: No cookie banner or already accepted');
        }
    }

    protected async waitForContent(): Promise<void> {
        await this.page!.waitForTimeout(3000);
    }

    protected async extractMotorcycles(): Promise<Motorcycle[]> {
        const motorcycles: Motorcycle[] = await this.page!.evaluate(() => {
            // Try multiple selector strategies
            let cards = Array.from(document.querySelectorAll('wallapop-search-card'));

            // Fallback to other possible selectors
            if (cards.length === 0) {
                cards = Array.from(document.querySelectorAll('[data-testid*="search-card"], .card, article'));
            }

            return cards.slice(0, 20).map((card, index) => {
                // Try multiple selector patterns for title
                const titleEl = card.querySelector('.ItemCard__title, h2, h3, [class*="title"]');
                const priceEl = card.querySelector('.ItemCard__price, [class*="price"]');
                const imageEl = card.querySelector('img') as HTMLImageElement;
                const linkEl = card.querySelector('a') as HTMLAnchorElement;

                const title = titleEl?.textContent?.trim() || '';
                if (!title) return null; // Skip empty cards

                const priceStr = priceEl?.textContent?.trim() || '0';
                const priceValue = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
                const hasTopcase = title.toLowerCase().includes('topcase') ||
                    title.toLowerCase().includes('maleta') ||
                    title.toLowerCase().includes('baul');

                return {
                    id: `wallapop-${index}-${Date.now()}`,
                    title,
                    price: priceStr,
                    priceValue,
                    year: 'N/A',
                    km: 'N/A',
                    location: 'Varies',
                    link: linkEl?.href || '',
                    image: imageEl?.src || '',
                    source: 'wallapop',
                    hasTopcase,
                    brand: '',
                    type: 'Naked'
                };
            }).filter(item => item !== null) as Motorcycle[];
        });

        return motorcycles;
    }
}

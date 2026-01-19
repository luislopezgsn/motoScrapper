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
        // category_ids=14000 is Motorcycles
        // object_type_ids=100 might specify private/pro
        // filters_source=search_box
        return `https://es.wallapop.com/app/search?keywords=${encodeURIComponent(searchQuery)}&category_ids=14000&filters_source=quick_filters`;
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
            // Wallapop uses web components usually, but sometimes standard elements
            // Selectors based on recent Wallapop structure
            let cards = Array.from(document.querySelectorAll('wallapop-search-card, a.ItemCardList__item, .ItemCardList__item'));

            if (cards.length === 0) {
                // Fallback for different layouts
                cards = Array.from(document.querySelectorAll('[data-test="search-layout-item"], .ItemCard'));
            }

            return cards.slice(0, 20).map((card, index) => {
                // Title
                const titleEl = card.querySelector('.ItemCard__title, [class*="title"], h3');
                // Price
                const priceEl = card.querySelector('.ItemCard__price, [class*="price"], .ad-price');
                // Image - often lazy loaded
                const imageEl = card.querySelector('img.ItemCard__image, img') as HTMLImageElement;
                // Link - might be the card itself or a child anchor
                let linkEl = card.tagName === 'A' ? card as HTMLAnchorElement : card.querySelector('a');

                // Location sometimes in .ItemCard__product-location or similar
                const locationEl = card.querySelector('[class*="location"]');

                const title = titleEl?.textContent?.trim() || '';
                if (!title) return null;

                const priceStr = priceEl?.textContent?.trim() || '0';
                const priceValue = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;

                const hasTopcase = title.toLowerCase().includes('topcase') ||
                    title.toLowerCase().includes('maleta') ||
                    title.toLowerCase().includes('baul') ||
                    title.toLowerCase().includes('cofre');

                // Image handling
                const imageUrl = imageEl?.src || imageEl?.getAttribute('src') || '';

                return {
                    id: `wallapop-${index}-${Date.now()}`,
                    title,
                    price: priceStr,
                    priceValue,
                    year: 'N/A', // Wallapop usually requires opening the ad
                    km: 'N/A',   // Wallapop usually requires opening the ad
                    location: locationEl?.textContent?.trim() || 'Varies',
                    link: linkEl?.href || '',
                    image: imageUrl,
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

import { Browser } from 'playwright';
import { BasePage } from './BasePage';
import { Motorcycle } from '../models/Motorcycle';

export class EbayPage extends BasePage {
    constructor(browser: Browser) {
        super(browser);
    }

    async init(): Promise<void> {
        this.page = await this.browser.newPage();
    }

    protected buildSearchUrl(searchQuery: string): string {
        return `https://www.ebay.es/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}+moto`;
    }

    protected getSourceName(): string {
        return 'ebay';
    }

    protected async handleCookies(): Promise<void> {
        // eBay typically doesn't require cookie handling for basic scraping
    }

    protected async waitForContent(): Promise<void> {
        await this.page!.waitForTimeout(2000);
    }

    protected async extractMotorcycles(): Promise<Motorcycle[]> {
        const motorcycles: Motorcycle[] = await this.page!.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.s-item'));

            return cards.slice(1, 21).map((card, index) => { // slice(1) to skip eBay's "internal" result, limit to 20
                const titleEl = card.querySelector('.s-item__title');
                const priceEl = card.querySelector('.s-item__price');
                const imageEl = card.querySelector('.s-item__image-img, img') as HTMLImageElement;
                const linkEl = card.querySelector('.s-item__link') as HTMLAnchorElement;

                // eBay sometimes has location in .s-item__location
                const locationEl = card.querySelector('.s-item__location');

                const title = titleEl?.textContent?.trim() || '';
                if (!title || title === 'Shop on eBay') return null;

                const priceStr = priceEl?.textContent?.trim() || '0';
                const priceValue = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;

                const hasTopcase = title.toLowerCase().includes('topcase') ||
                    title.toLowerCase().includes('maleta') ||
                    title.toLowerCase().includes('baul') ||
                    title.toLowerCase().includes('cofre');

                // Image handling
                const imageUrl = imageEl?.src || imageEl?.dataset.src || '';

                return {
                    id: `ebay-${index}-${Date.now()}`,
                    title,
                    price: priceStr,
                    priceValue,
                    year: 'N/A',
                    km: 'N/A',
                    location: locationEl?.textContent?.replace('from ', '').trim() || 'Spain',
                    link: linkEl?.href || '',
                    image: imageUrl,
                    source: 'ebay',
                    hasTopcase,
                    brand: '',
                    type: 'Naked'
                };
            }).filter(item => item !== null) as Motorcycle[];
        });

        return motorcycles;
    }
}

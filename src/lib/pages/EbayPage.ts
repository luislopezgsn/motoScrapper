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
        // _sacat=422 is Motorcycles category in eBay Spain
        // _ipg=24 for 24 items
        // lh_prefLoc=1 for "Spain" preference (usually) or try to use advanced search params
        // But better: use the 'located in Spain' param which is usually lh_prefLoc=1 or rt=nc&_dmd=1
        // Adding _stpos to prioritize local or just strict filter
        return `https://www.ebay.es/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}&_sacat=422&LH_PrefLoc=1`;
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

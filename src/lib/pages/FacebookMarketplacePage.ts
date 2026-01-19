import { Browser } from 'playwright';
import { BasePage } from './BasePage';
import { Motorcycle } from '../models/Motorcycle';
import { createContext } from '../utils/browserConfig';

export class FacebookMarketplacePage extends BasePage {
    constructor(browser: Browser) {
        super(browser);
    }

    async init(): Promise<void> {
        const context = await createContext(this.browser, 'es-ES');
        this.page = await context.newPage();
    }

    protected buildSearchUrl(searchQuery: string): string {
        return `https://www.facebook.com/marketplace/category/motorcycles?query=${encodeURIComponent(searchQuery)}`;
    }

    protected getSourceName(): string {
        return 'facebook';
    }

    protected async handleCookies(): Promise<void> {
        // Skip the close button - it's too unreliable
        // Just wait for content to load
    }

    protected async waitForContent(): Promise<void> {
        await this.page!.waitForTimeout(5000);
    }

    protected async extractMotorcycles(): Promise<Motorcycle[]> {
        const motorcycles: Motorcycle[] = await this.page!.evaluate(() => {
            // FB Marketplace structure is highly dynamic
            // Look for links with marketplace URLs
            const links = Array.from(document.querySelectorAll('a[href*="/marketplace/item/"]'));

            return links.slice(0, 20).map((linkEl, index) => {
                const link = linkEl as HTMLAnchorElement;

                // Try to find text content within or near the link
                const textElements = Array.from(link.querySelectorAll('span'));

                // Look for price (usually has € or numbers)
                let priceStr = '0';
                let title = '';

                for (const span of textElements) {
                    const text = span.textContent?.trim() || '';
                    if (text.includes('€') || /^\d+\s*€/.test(text)) {
                        priceStr = text;
                    } else if (text.length > 5 && !title) {
                        title = text;
                    }
                }

                if (!title) return null;

                const imageEl = link.querySelector('img') as HTMLImageElement;
                const priceValue = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
                const hasTopcase = title.toLowerCase().includes('topcase') ||
                    title.toLowerCase().includes('maleta') ||
                    title.toLowerCase().includes('baul');

                return {
                    id: `facebook-${index}-${Date.now()}`,
                    title,
                    price: priceStr,
                    priceValue,
                    year: 'N/A',
                    km: 'N/A',
                    location: 'Local',
                    link: link.href.startsWith('http') ? link.href : `https://www.facebook.com${link.getAttribute('href')}`,
                    image: imageEl?.src || '',
                    source: 'facebook',
                    hasTopcase,
                    brand: '',
                    type: 'Naked'
                };
            }).filter(item => item !== null && item.link !== '') as Motorcycle[];
        });

        return motorcycles;
    }
}

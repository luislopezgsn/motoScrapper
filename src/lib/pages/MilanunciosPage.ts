import { Browser } from 'playwright';
import { BasePage } from './BasePage';
import { Motorcycle } from '../models/Motorcycle';
import { createContext } from '../utils/browserConfig';

export class MilanunciosPage extends BasePage {
    constructor(browser: Browser) {
        super(browser);
    }

    async init(): Promise<void> {
        const context = await createContext(this.browser);
        this.page = await context.newPage();
    }

    protected buildSearchUrl(searchQuery: string): string {
        return `https://www.milanuncios.com/motos-de-segunda-mano/?s=${encodeURIComponent(searchQuery)}`;
    }

    protected getSourceName(): string {
        return 'milanuncios';
    }

    protected async handleCookies(): Promise<void> {
        try {
            const cookieButton = this.page!.locator('button:has-text("Aceptar")').first();
            await cookieButton.click({ timeout: 3000 });
            await this.page!.waitForTimeout(1000);
        } catch (e) {
            console.log('Milanuncios: No cookie banner or already accepted');
        }
    }

    protected async waitForContent(): Promise<void> {
        await this.page!.waitForTimeout(3000);
    }

    protected async extractMotorcycles(): Promise<Motorcycle[]> {
        const motorcycles: Motorcycle[] = await this.page!.evaluate(() => {
            // Try multiple selectors
            let cards = Array.from(document.querySelectorAll('article'));

            if (cards.length === 0) {
                cards = Array.from(document.querySelectorAll('[class*="AdCard"], .card, [data-testid*="ad"]'));
            }

            return cards.slice(0, 20).map((card, index) => {
                const titleEl = card.querySelector('h2, h3, [class*="title"]');
                const priceEl = card.querySelector('.ma-AdCard-price, [class*="price"]');
                const imageEl = card.querySelector('img') as HTMLImageElement;
                const linkEl = card.querySelector('a') as HTMLAnchorElement;

                const title = titleEl?.textContent?.trim() || '';
                if (!title) return null;

                const priceStr = priceEl?.textContent?.trim() || '0';
                const priceValue = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
                const hasTopcase = title.toLowerCase().includes('topcase') ||
                    title.toLowerCase().includes('maleta') ||
                    title.toLowerCase().includes('baul');

                return {
                    id: `milanuncios-${index}-${Date.now()}`,
                    title,
                    price: priceStr,
                    priceValue,
                    year: 'N/A',
                    km: 'N/A',
                    location: 'Varies',
                    link: linkEl?.href || '',
                    image: imageEl?.src || '',
                    source: 'milanuncios',
                    hasTopcase,
                    brand: '',
                    type: 'Naked'
                };
            }).filter(item => item !== null) as Motorcycle[];
        });

        return motorcycles;
    }
}

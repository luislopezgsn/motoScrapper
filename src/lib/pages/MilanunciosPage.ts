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
        // c-1139 is the category for motorcycles ("motos-de-segunda-mano")
        // but easier to append the category ID in the query params if possible or use the path
        // The path /motos-de-segunda-mano/ IS the category.
        // We ensure we search WITHIN this category by using the correct base path.
        // The previous one was correct but maybe broad matching.
        // Let's try adding explicit category ID if possible or keep using the path which should be fine.
        // Actually, Milanuncios search might be redirecting if keyword looks like a car.
        // Let's enforce it by using the category specifically.
        return `https://www.milanuncios.com/motos-de-segunda-mano/?s=${encodeURIComponent(searchQuery)}&fromSearch=1`;
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
            // Milanuncios uses articles with specific classes
            let cards = Array.from(document.querySelectorAll('article.ma-AdCard, .ma-AdCard'));

            if (cards.length === 0) {
                // Fallback
                cards = Array.from(document.querySelectorAll('[class*="AdCard"], .card, [data-testid*="ad"]'));
            }

            return cards.slice(0, 20).map((card, index) => {
                const titleEl = card.querySelector('h2.ma-AdCard-title, .ma-AdCard-title, h3');
                const priceEl = card.querySelector('.ma-AdCard-price, [class*="price"]');
                const imageEl = card.querySelector('.ma-AdCard-photo img, img') as HTMLImageElement;
                const linkEl = card.querySelector('a.ma-AdCard-link, a') as HTMLAnchorElement;

                // Try to extract location and other info from tags/metadata
                const tags = Array.from(card.querySelectorAll('.ma-AdCard-metadata, .ma-AdCard-tag, .ma-AdTag')).map(t => t.textContent?.trim() || '');

                let location = 'Varies';
                let year = 'N/A';

                // Usually Milanuncios puts location in the metadata checks
                // E.g. "Professional - Madrid" or just "Madrid"
                if (tags.length > 0) {
                    // Heuristic: location is often the last tag or one that is not numeric
                    // But simpler: just join them for now or pick the one that looks like a city
                    location = tags.find(t => !t.match(/^\d/) && !t.includes('€')) || location;
                }

                const title = titleEl?.textContent?.trim() || '';
                if (!title) return null;

                const priceStr = priceEl?.textContent?.trim() || '0';
                const priceValue = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;

                const hasTopcase = title.toLowerCase().includes('topcase') ||
                    title.toLowerCase().includes('maleta') ||
                    title.toLowerCase().includes('baul') ||
                    title.toLowerCase().includes('cofre');

                // Image handling - check dataset for lazy loaded images
                const imageUrl = imageEl?.dataset.src || imageEl?.src || '';

                return {
                    id: `milanuncios-${index}-${Date.now()}`,
                    title,
                    price: priceStr,
                    priceValue,
                    year: year,
                    km: 'N/A', // Hard to get from list view
                    location,
                    link: linkEl?.href || '',
                    image: imageUrl,
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

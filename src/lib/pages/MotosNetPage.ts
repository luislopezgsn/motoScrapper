import { Browser } from 'playwright';
import { BasePage } from './BasePage';
import { Motorcycle } from '../models/Motorcycle';
import { createContext } from '../utils/browserConfig';

export class MotosNetPage extends BasePage {
    constructor(browser: Browser) {
        super(browser);
    }

    async init(): Promise<void> {
        const context = await createContext(this.browser);
        this.page = await context.newPage();
    }

    protected buildSearchUrl(searchQuery: string): string {
        return `https://motos.coches.net/segunda-mano/?Text=${encodeURIComponent(searchQuery)}`;
    }

    protected getSourceName(): string {
        return 'motos.net';
    }

    protected async handleCookies(): Promise<void> {
        try {
            const cookieButton = this.page!.locator('button:has-text("Aceptar")').first();
            await cookieButton.click({ timeout: 3000 });
            await this.page!.waitForTimeout(1000);
        } catch (e) {
            console.log('Motos.net: No cookie banner or already accepted');
        }
    }

    protected async waitForContent(): Promise<void> {
        await this.page!.waitForSelector('.mt-CardAd', { timeout: 10000 });
    }

    protected async extractMotorcycles(): Promise<Motorcycle[]> {
        const motorcycles: Motorcycle[] = await this.page!.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.mt-CardAd, article.mt-CardAd'));

            return cards.slice(0, 20).map((card, index) => {
                const titleEl = card.querySelector('a.mt-CardAd-infoHeaderTitleLink, .mt-CardAd-title a') as HTMLAnchorElement;
                const priceEl = card.querySelector('.mt-CardAdPrice-cashAmount, .mt-CardAd-price');
                const attrItems = Array.from(card.querySelectorAll('.mt-CardAd-attrItem, .mt-CardAd-attributes li')).map(li => li.textContent?.trim() || '');

                let year = 'N/A';
                let km = 'N/A';
                let location = 'N/A';

                attrItems.forEach(attr => {
                    if (/^\d{4}$/.test(attr)) year = attr;
                    else if (attr.toLowerCase().includes('km')) km = attr;
                    else if (attr.length > 3 && !attr.includes('cv') && !attr.includes('garant') && !attr.includes('change')) location = attr;
                });

                const imageEl = card.querySelector('.mt-CardAd-image, img') as HTMLImageElement;
                const title = titleEl?.innerText || '';
                if (!title) return null;

                const priceStr = priceEl?.textContent?.trim() || '0';
                // Remove non-numeric characters except for possible delimiters if needed, but usually just taking digits works for simple integer prices
                const priceValue = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;

                const hasTopcase = title.toLowerCase().includes('topcase') ||
                    title.toLowerCase().includes('maleta') ||
                    title.toLowerCase().includes('baul') ||
                    title.toLowerCase().includes('cofre');

                // Check multiple sources for image URL
                const imageUrl = imageEl?.dataset.src || imageEl?.src || '';

                return {
                    id: `motos-net-${index}-${Date.now()}`,
                    title,
                    price: priceStr,
                    priceValue,
                    year: year,
                    km: km,
                    location: location,
                    link: titleEl?.href || '',
                    image: imageUrl,
                    source: 'motos.net',
                    hasTopcase,
                    brand: '',
                    type: 'Naked'
                };
            }).filter(item => item !== null) as Motorcycle[];
        });

        return motorcycles;
    }
}

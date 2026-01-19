import { Motorcycle } from './models/Motorcycle';
import { createBrowser } from './utils/browserConfig';
import { MotosNetPage } from './pages/MotosNetPage';
import { WallapopPage } from './pages/WallapopPage';
import { EbayPage } from './pages/EbayPage';
import { MilanunciosPage } from './pages/MilanunciosPage';
import { FacebookMarketplacePage } from './pages/FacebookMarketplacePage';

// Re-export the Motorcycle interface for backward compatibility
export type { Motorcycle };

/**
 * Scrape all sources in parallel and return combined results
 */
export async function scrapeAll(searchQuery: string): Promise<Motorcycle[]> {
    // Create browsers for each scraper
    const browsers = await Promise.all([
        createBrowser(),
        createBrowser(),
        createBrowser(),
        createBrowser(),
        createBrowser()
    ]);

    try {
        // Initialize page objects
        const motosNetPage = new MotosNetPage(browsers[0]);
        const wallapopPage = new WallapopPage(browsers[1]);
        const ebayPage = new EbayPage(browsers[2]);
        const milanunciosPage = new MilanunciosPage(browsers[3]);
        const facebookPage = new FacebookMarketplacePage(browsers[4]);

        // Initialize all pages
        await Promise.all([
            motosNetPage.init(),
            wallapopPage.init(),
            ebayPage.init(),
            milanunciosPage.init(),
            facebookPage.init()
        ]);

        // Scrape all sources in parallel
        const [motos, wallapop, ebay, milanuncios, facebook] = await Promise.allSettled([
            motosNetPage.scrape(searchQuery),
            wallapopPage.scrape(searchQuery),
            ebayPage.scrape(searchQuery),
            milanunciosPage.scrape(searchQuery),
            facebookPage.scrape(searchQuery)
        ]);

        // Combine results
        const results: Motorcycle[] = [];
        if (motos.status === 'fulfilled') results.push(...motos.value);
        if (wallapop.status === 'fulfilled') results.push(...wallapop.value);
        if (ebay.status === 'fulfilled') results.push(...ebay.value);
        if (milanuncios.status === 'fulfilled') results.push(...milanuncios.value);
        if (facebook.status === 'fulfilled') results.push(...facebook.value);

        // Close all pages
        await Promise.all([
            motosNetPage.close(),
            wallapopPage.close(),
            ebayPage.close(),
            milanunciosPage.close(),
            facebookPage.close()
        ]);

        // Sort by price
        return results.sort((a, b) => a.priceValue - b.priceValue);
    } finally {
        // Close all browsers
        await Promise.all(browsers.map(browser => browser.close()));
    }
}

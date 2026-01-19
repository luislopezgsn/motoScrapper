import { Browser, Page } from 'playwright';
import { Motorcycle } from '../models/Motorcycle';
import { detectBrand } from '../utils/brandDetector';
import { detectType } from '../utils/typeDetector';

export abstract class BasePage {
    protected browser: Browser;
    protected page: Page | null = null;

    constructor(browser: Browser) {
        this.browser = browser;
    }

    /**
     * Navigate to the search URL for the given query
     */
    protected abstract buildSearchUrl(searchQuery: string): string;

    /**
     * Get the source name for this scraper
     */
    protected abstract getSourceName(): string;

    /**
     * Handle cookie consent banners
     */
    protected abstract handleCookies(): Promise<void>;

    /**
     * Wait for content to load on the page
     */
    protected abstract waitForContent(): Promise<void>;

    /**
     * Extract motorcycle data from the page
     */
    protected abstract extractMotorcycles(): Promise<Motorcycle[]>;

    /**
     * Main scraping method - orchestrates the scraping process
     */
    async scrape(searchQuery: string): Promise<Motorcycle[]> {
        try {
            const url = this.buildSearchUrl(searchQuery);
            await this.page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

            await this.handleCookies();
            await this.waitForContent();

            const motorcycles = await this.extractMotorcycles();

            // Post-process: add brand and type detection
            return motorcycles.map(m => ({
                ...m,
                brand: detectBrand(m.title),
                type: detectType(m.title)
            }));
        } catch (error) {
            console.error(`${this.getSourceName()} scraping failed:`, error);
            return [];
        }
    }

    /**
     * Check if a title contains topcase-related keywords
     */
    protected hasTopcaseKeywords(title: string): boolean {
        const t = title.toLowerCase();
        return t.includes('topcase') ||
            t.includes('maleta') ||
            t.includes('baul') ||
            t.includes('cofre');
    }

    /**
     * Parse price string to numeric value
     */
    protected parsePriceValue(priceStr: string): number {
        return parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
    }

    /**
     * Generate unique ID for a motorcycle listing
     */
    protected generateId(index: number): string {
        return `${this.getSourceName()}-${index}-${Date.now()}`;
    }

    /**
     * Close the browser page
     */
    async close(): Promise<void> {
        if (this.page) {
            await this.page.close();
        }
    }
}

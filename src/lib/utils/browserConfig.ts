import { Browser, BrowserContext, chromium } from 'playwright';

export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function createBrowser(): Promise<Browser> {
    return await chromium.launch({ headless: true });
}

export async function createContext(browser: Browser, locale?: string): Promise<BrowserContext> {
    return await browser.newContext({
        userAgent: DEFAULT_USER_AGENT,
        ...(locale && { locale })
    });
}

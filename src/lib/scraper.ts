import { chromium } from 'playwright';

export interface Motorcycle {
  id: string;
  title: string;
  price: string;
  year: string;
  km: string;
  location: string;
  link: string;
  image?: string;
}

export async function scrapeMotos(searchQuery: string): Promise<Motorcycle[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // Navigate to motos.net with search query
    // Example: https://motos.coches.net/segunda-mano/?pg=1&or=-1&fi=SortDate&Text=honda+cb500x
    const url = `https://motos.coches.net/segunda-mano/?Text=${encodeURIComponent(searchQuery)}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Handle initial cookie consent if it appears
    const cookieButton = await page.locator('button:has-text("Aceptar")').first();
    if (await cookieButton.isVisible()) {
      await cookieButton.click();
    }

    // Wait for cards to load
    await page.waitForSelector('.mt-CardAd', { timeout: 10000 });

    const motorcycles: Motorcycle[] = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.mt-CardAd'));
      
      return cards.map((card, index) => {
        const titleEl = card.querySelector('a.mt-CardAd-infoHeaderTitleLink') as HTMLAnchorElement;
        const priceEl = card.querySelector('.mt-CardAdPrice-cashAmount');
        const attrItems = Array.from(card.querySelectorAll('.mt-CardAd-attrItem')).map(li => li.textContent?.trim() || '');
        
        // Attr items order usually: [Year, KM, Power, Location] or similar
        // We need to be careful with parsing
        let year = '';
        let km = '';
        let location = '';

        // Simple heuristic: year is 4 digits, km contains 'km', location is usually last
        attrItems.forEach(attr => {
          if (/^\d{4}$/.test(attr)) year = attr;
          else if (attr.toLowerCase().includes('km')) km = attr;
          else if (attr.length > 3 && !attr.includes('cv')) location = attr;
        });

        const imageEl = card.querySelector('.mt-CardAd-image') as HTMLImageElement;

        return {
          id: `motos-net-${index}`,
          title: titleEl?.innerText || 'No title',
          price: priceEl?.textContent?.trim() || 'N/A',
          year: year || 'N/A',
          km: km || 'N/A',
          location: location || 'N/A',
          link: titleEl?.href || '',
          image: imageEl?.src || ''
        };
      });
    });

    return motorcycles;
  } catch (error) {
    console.error('Scraping failed:', error);
    return [];
  } finally {
    await browser.close();
  }
}

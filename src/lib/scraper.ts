import { chromium } from 'playwright';

export interface Motorcycle {
  id: string;
  title: string;
  price: string;
  priceValue: number; // For filtering
  year: string;
  km: string;
  location: string;
  link: string;
  image?: string;
  source: string;
  brand: string;
  type?: string;
  hasTopcase: boolean;
}

export async function scrapeAll(searchQuery: string): Promise<Motorcycle[]> {
  const [motos, wallapop, ebay, milanuncios, facebook] = await Promise.allSettled([
    scrapeMotos(searchQuery),
    scrapeWallapop(searchQuery),
    scrapeEbay(searchQuery),
    scrapeMilanuncios(searchQuery),
    scrapeFacebookMarketplace(searchQuery)
  ]);

  const results: Motorcycle[] = [];
  if (motos.status === 'fulfilled') results.push(...motos.value);
  if (wallapop.status === 'fulfilled') results.push(...wallapop.value);
  if (ebay.status === 'fulfilled') results.push(...ebay.value);
  if (milanuncios.status === 'fulfilled') results.push(...milanuncios.value);
  if (facebook.status === 'fulfilled') results.push(...facebook.value);

  return results.sort((a, b) => a.priceValue - b.priceValue);
}

function detectBrand(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('honda')) return 'Honda';
  if (t.includes('yamaha')) return 'Yamaha';
  if (t.includes('kawasaki')) return 'Kawasaki';
  if (t.includes('suzuki')) return 'Suzuki';
  if (t.includes('bmw')) return 'BMW';
  if (t.includes('ktm')) return 'KTM';
  if (t.includes('ducati')) return 'Ducati';
  if (t.includes('triumph')) return 'Triumph';
  if (t.includes('harley')) return 'Harley-Davidson';
  if (t.includes('piaggio')) return 'Piaggio';
  if (t.includes('kymco')) return 'Kymco';
  if (t.includes('sym')) return 'SYM';
  if (t.includes('aprilia')) return 'Aprilia';
  if (t.includes('benelli')) return 'Benelli';
  return 'Other';
}

function detectType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('naked') || t.includes('z900') || t.includes('mt-07') || t.includes('cb500f') || t.includes('hornet')) return 'Naked';
  if (t.includes('sport') || t.includes('r6') || t.includes('r1') || t.includes('cbr') || t.includes('ninja') || t.includes('gsxr')) return 'Sport';
  if (t.includes('trail') || t.includes('adventure') || t.includes('gs') || t.includes('africa twin') || t.includes('v-strom') || t.includes('tenere')) return 'Trail';
  if (t.includes('custom') || t.includes('harley') || t.includes('bobber') || t.includes('chopper') || t.includes('vulcan')) return 'Custom';
  if (t.includes('scooter') || t.includes('tmax') || t.includes('x-max') || t.includes('honda sh') || t.includes('vespa') || t.includes('pcx')) return 'Scooter';
  return 'Naked';
}

export async function scrapeMotos(searchQuery: string): Promise<Motorcycle[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    const url = `https://motos.coches.net/segunda-mano/?Text=${encodeURIComponent(searchQuery)}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    const cookieButton = await page.locator('button:has-text("Aceptar")').first();
    if (await cookieButton.isVisible()) {
      await cookieButton.click();
    }

    await page.waitForSelector('.mt-CardAd', { timeout: 10000 });

    const motorcycles: Motorcycle[] = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.mt-CardAd'));

      return cards.map((card, index) => {
        const titleEl = card.querySelector('a.mt-CardAd-infoHeaderTitleLink') as HTMLAnchorElement;
        const priceEl = card.querySelector('.mt-CardAdPrice-cashAmount');
        const attrItems = Array.from(card.querySelectorAll('.mt-CardAd-attrItem')).map(li => li.textContent?.trim() || '');

        let year = '';
        let km = '';
        let location = '';

        attrItems.forEach(attr => {
          if (/^\d{4}$/.test(attr)) year = attr;
          else if (attr.toLowerCase().includes('km')) km = attr;
          else if (attr.length > 3 && !attr.includes('cv')) location = attr;
        });

        const imageEl = card.querySelector('.mt-CardAd-image') as HTMLImageElement;
        const title = titleEl?.innerText || 'No title';
        const priceStr = priceEl?.textContent?.trim() || '0';
        const priceValue = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;

        const hasTopcase = title.toLowerCase().includes('topcase') ||
          title.toLowerCase().includes('maleta') ||
          title.toLowerCase().includes('baul') ||
          title.toLowerCase().includes('cofre');

        return {
          id: `motos-net-${index}-${Date.now()}`,
          title,
          price: priceStr,
          priceValue,
          year: year || 'N/A',
          km: km || 'N/A',
          location: location || 'N/A',
          link: titleEl?.href || '',
          image: imageEl?.src || '',
          source: 'motos.net',
          hasTopcase,
          brand: '', // Will be post-processed
          type: 'Naked' // Will be post-processed
        };
      });
    });

    return motorcycles.map(m => ({
      ...m,
      brand: detectBrand(m.title),
      type: detectType(m.title)
    }));
  } catch (error) {
    console.error('Motos.net scraping failed:', error);
    return [];
  } finally {
    await browser.close();
  }
}

export async function scrapeWallapop(searchQuery: string): Promise<Motorcycle[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    const url = `https://es.wallapop.com/app/search?keywords=${encodeURIComponent(searchQuery)}&category_ids=14000`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Handle cookies
    const cookieButton = await page.locator('#onetrust-accept-btn-handler').first();
    if (await cookieButton.isVisible()) {
      await cookieButton.click();
    }

    await page.waitForSelector('wallapop-search-card', { timeout: 10000 });

    const motorcycles: Motorcycle[] = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('wallapop-search-card'));

      return cards.map((card, index) => {
        const titleEl = card.querySelector('.ItemCard__title');
        const priceEl = card.querySelector('.ItemCard__price');
        const imageEl = card.querySelector('img') as HTMLImageElement;
        const linkEl = card.querySelector('a') as HTMLAnchorElement;

        const title = titleEl?.textContent?.trim() || 'No title';
        const priceStr = priceEl?.textContent?.trim() || '0';
        const priceValue = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
        const hasTopcase = title.toLowerCase().includes('topcase') ||
          title.toLowerCase().includes('maleta') ||
          title.toLowerCase().includes('baul');

        return {
          id: `wallapop-${index}-${Date.now()}`,
          title,
          price: priceStr,
          priceValue,
          year: 'N/A', // Wallapop usually needs deeper inspection for year
          km: 'N/A',
          location: 'Varies',
          link: linkEl?.href || '',
          image: imageEl?.src || '',
          source: 'wallapop',
          hasTopcase,
          brand: '',
          type: 'Naked'
        };
      });
    });

    return motorcycles.map(m => ({
      ...m,
      brand: detectBrand(m.title),
      type: detectType(m.title)
    }));
  } catch (error) {
    console.error('Wallapop scraping failed:', error);
    return [];
  } finally {
    await browser.close();
  }
}

export async function scrapeEbay(searchQuery: string): Promise<Motorcycle[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const url = `https://www.ebay.es/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}+moto`;
    await page.goto(url, { waitUntil: 'networkidle' });

    const motorcycles: Motorcycle[] = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.s-item'));

      return cards.slice(1).map((card, index) => { // slice(1) to skip eBay's "internal" result
        const titleEl = card.querySelector('.s-item__title');
        const priceEl = card.querySelector('.s-item__price');
        const imageEl = card.querySelector('.s-item__image-img') as HTMLImageElement;
        const linkEl = card.querySelector('.s-item__link') as HTMLAnchorElement;

        const title = titleEl?.textContent?.trim() || 'No title';
        const priceStr = priceEl?.textContent?.trim() || '0';
        const priceValue = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
        const hasTopcase = title.toLowerCase().includes('topcase') ||
          title.toLowerCase().includes('maleta') ||
          title.toLowerCase().includes('baul');

        return {
          id: `ebay-${index}-${Date.now()}`,
          title,
          price: priceStr,
          priceValue,
          year: 'N/A',
          km: 'N/A',
          location: 'Spain',
          link: linkEl?.href || '',
          image: imageEl?.src || '',
          source: 'ebay',
          hasTopcase,
          brand: '',
          type: 'Naked'
        };
      });
    });

    return motorcycles.map(m => ({
      ...m,
      brand: detectBrand(m.title),
      type: detectType(m.title)
    }));
  } catch (error) {
    console.error('eBay scraping failed:', error);
    return [];
  } finally {
    await browser.close();
  }
}

export async function scrapeMilanuncios(searchQuery: string): Promise<Motorcycle[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    const url = `https://www.milanuncios.com/motos-de-segunda-mano/?s=${encodeURIComponent(searchQuery)}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Cookies
    const cookieButton = await page.locator('button:has-text("Aceptar")').first();
    if (await cookieButton.isVisible()) {
      await cookieButton.click();
    }

    await page.waitForSelector('article', { timeout: 10000 });

    const motorcycles: Motorcycle[] = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('article'));

      return cards.map((card, index) => {
        const titleEl = card.querySelector('h2');
        const priceEl = card.querySelector('.ma-AdCard-price');
        const imageEl = card.querySelector('img') as HTMLImageElement;
        const linkEl = card.querySelector('a') as HTMLAnchorElement;

        const title = titleEl?.textContent?.trim() || 'No title';
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
      });
    });

    return motorcycles.map(m => ({
      ...m,
      brand: detectBrand(m.title),
      type: detectType(m.title)
    }));
  } catch (error) {
    console.error('Milanuncios scraping failed:', error);
    return [];
  } finally {
    await browser.close();
  }
}

export async function scrapeFacebookMarketplace(searchQuery: string): Promise<Motorcycle[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'es-ES'
  });
  const page = await context.newPage();

  try {
    const url = `https://www.facebook.com/marketplace/category/motorcycles?query=${encodeURIComponent(searchQuery)}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Close login popup if it appears
    const closeButton = await page.locator('div[role="button"][aria-label="Cerrar"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    await page.waitForSelector('div[style*="max-width"]', { timeout: 10000 });

    const motorcycles: Motorcycle[] = await page.evaluate(() => {
      // FB Marketplace structure is highly dynamic and uses obfuscated classes.
      // We look for common patterns in the structure.
      const productTiles = Array.from(document.querySelectorAll('div[role="main"] div div div div div div div div div div div'));

      return productTiles.map((tile, index) => {
        const textElements = Array.from(tile.querySelectorAll('span'));
        if (textElements.length < 2) return null;

        const priceStr = textElements[0]?.textContent || '0';
        const title = textElements[1]?.textContent || 'No title';
        const linkEl = tile.querySelector('a') as HTMLAnchorElement;
        const imageEl = tile.querySelector('img') as HTMLImageElement;

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
          link: linkEl ? (linkEl.href.startsWith('http') ? linkEl.href : `https://www.facebook.com${linkEl.getAttribute('href')}`) : '',
          image: imageEl?.src || '',
          source: 'facebook',
          hasTopcase,
          brand: '',
          type: 'Naked'
        };
      }).filter(item => item !== null && item.link !== '') as Motorcycle[];
    });

    return motorcycles.map(m => ({
      ...m,
      brand: detectBrand(m.title),
      type: detectType(m.title)
    }));
  } catch (error) {
    console.error('Facebook Marketplace scraping failed:', error);
    return [];
  } finally {
    await browser.close();
  }
}

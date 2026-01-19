export function detectType(title: string): string {
    const t = title.toLowerCase();
    if (t.includes('naked') || t.includes('z900') || t.includes('mt-07') || t.includes('cb500f') || t.includes('hornet')) return 'Naked';
    if (t.includes('sport') || t.includes('r6') || t.includes('r1') || t.includes('cbr') || t.includes('ninja') || t.includes('gsxr')) return 'Sport';
    if (t.includes('trail') || t.includes('adventure') || t.includes('gs') || t.includes('africa twin') || t.includes('v-strom') || t.includes('tenere')) return 'Trail';
    if (t.includes('custom') || t.includes('harley') || t.includes('bobber') || t.includes('chopper') || t.includes('vulcan')) return 'Custom';
    if (t.includes('scooter') || t.includes('tmax') || t.includes('x-max') || t.includes('honda sh') || t.includes('vespa') || t.includes('pcx')) return 'Scooter';
    return 'Naked';
}

export function detectBrand(title: string): string {
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

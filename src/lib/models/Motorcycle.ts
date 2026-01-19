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

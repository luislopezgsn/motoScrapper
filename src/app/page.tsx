'use client';

import { useState } from 'react';
import { Motorcycle } from '@/lib/models/Motorcycle';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [onlyTopcase, setOnlyTopcase] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/scrape?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(moto => {
    const matchesPrice = moto.priceValue <= maxPrice;
    const matchesType = selectedType === 'All' || moto.type === selectedType;
    const matchesBrand = selectedBrand === 'All' || moto.brand === selectedBrand;
    const matchesTopcase = !onlyTopcase || moto.hasTopcase;
    return matchesPrice && matchesType && matchesBrand && matchesTopcase;
  });

  return (
    <main>
      <header>
        <h1>MotoScrapper</h1>
        <p className="subtitle">Find your next motorcycle in Spain with real-time scraping</p>
      </header>

      <div className="search-container">
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem' }}>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search e.g. Honda CB500X, Yamaha R6..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="filters">
            <div className="filter-group">
              <label>Max Price: {maxPrice}€</label>
              <input
                type="range"
                min="0"
                max="30000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              />
            </div>

            <div className="filter-group">
              <label>Brand</label>
              <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
                <option value="All">All Brands</option>
                <option value="Honda">Honda</option>
                <option value="Yamaha">Yamaha</option>
                <option value="Kawasaki">Kawasaki</option>
                <option value="Suzuki">Suzuki</option>
                <option value="BMW">BMW</option>
                <option value="KTM">KTM</option>
                <option value="Ducati">Ducati</option>
                <option value="Triumph">Triumph</option>
                <option value="Harley-Davidson">Harley-Davidson</option>
                <option value="Piaggio">Piaggio</option>
                <option value="Kymco">Kymco</option>
                <option value="SYM">SYM</option>
                <option value="Aprilia">Aprilia</option>
                <option value="Benelli">Benelli</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Type</label>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                <option value="All">All Types</option>
                <option value="Naked">Naked</option>
                <option value="Sport">Sport</option>
                <option value="Trail">Trail</option>
                <option value="Custom">Custom</option>
                <option value="Scooter">Scooter</option>
              </select>
            </div>

            <div className="filter-group-row">
              <input
                type="checkbox"
                id="topcase"
                checked={onlyTopcase}
                onChange={(e) => setOnlyTopcase(e.target.checked)}
              />
              <label htmlFor="topcase">Has Topcase</label>
            </div>
          </div>
        </form>
      </div>

      {loading && (
        <div className="loading">
          <span className="loader"></span>
          <p>Scraping the web for you...</p>
        </div>
      )}

      <div className="results-grid">
        {!loading && filteredResults.map((moto) => (
          <a key={moto.id} href={moto.link} target="_blank" rel="noopener noreferrer" className="card">
            {moto.image && (
              <img src={moto.image} alt={moto.title} className="card-img" />
            )}
            <div className="card-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 className="card-title">{moto.title}</h2>
                <span className={`source-badge ${moto.source.replace('.', '-')}`}>{moto.source}</span>
              </div>
              <div className="card-price">{moto.price}</div>
              <div className="card-details">
                <span className="badge">{moto.year}</span>
                <span className="badge">{moto.km}</span>
                <span className="badge">{moto.location}</span>
                {moto.hasTopcase && <span className="badge topcase-badge">🧳 Topcase</span>}
              </div>
            </div>
          </a>
        ))}
      </div>

      {!loading && filteredResults.length === 0 && results.length > 0 && (
        <div className="loading">
          <p>No results match your filters.</p>
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="loading">
          <p>No results found for "{query}". Try a different search.</p>
        </div>
      )}
    </main>
  );
}

'use client';

import { useState } from 'react';
import { Motorcycle } from '@/lib/scraper';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <main>
      <header>
        <h1>MotoScrapper</h1>
        <p className="subtitle">Find your next motorcycle in Spain with real-time scraping</p>
      </header>

      <div className="search-container">
        <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Search e.g. Honda CB500X, Yamaha R6..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading">
          <span className="loader"></span>
          <p>Scraping the web for you...</p>
        </div>
      )}

      <div className="results-grid">
        {!loading && results.map((moto) => (
          <a key={moto.id} href={moto.link} target="_blank" rel="noopener noreferrer" className="card">
            {moto.image && (
              <img src={moto.image} alt={moto.title} className="card-img" />
            )}
            <div className="card-content">
              <h2 className="card-title">{moto.title}</h2>
              <div className="card-price">{moto.price}</div>
              <div className="card-details">
                <span className="badge">{moto.year}</span>
                <span className="badge">{moto.km}</span>
                <span className="badge">{moto.location}</span>
                <span className="badge">Motos.net</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {!loading && results.length === 0 && query && (
        <div className="loading">
          <p>No results found for "{query}". Try a different search.</p>
        </div>
      )}
    </main>
  );
}

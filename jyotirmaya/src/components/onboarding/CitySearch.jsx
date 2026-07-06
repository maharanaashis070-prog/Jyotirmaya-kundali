import { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { searchCities } from '../../lib/cities.js';

export default function CitySearch({ onSelect, placeholder }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setResults(q.trim().length ? searchCities(q, 8) : []);
  }, [q]);

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2.5 focus-within:border-gold">
        <Search size={16} className="text-ink/40 shrink-0" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-gold/30 bg-white shadow-temple">
          {results.map(c => (
            <li key={c.label}>
              <button
                type="button"
                onClick={() => { onSelect(c); setQ(c.label); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gold/10 flex items-center gap-2"
              >
                <MapPin size={14} className="text-laterite shrink-0" />
                <span>{c.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && q.trim().length > 0 && results.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-gold/30 bg-white shadow-temple px-3 py-2 text-sm text-ink/55">
          No match in the offline city list — use manual latitude/longitude below.
        </div>
      )}
    </div>
  );
}

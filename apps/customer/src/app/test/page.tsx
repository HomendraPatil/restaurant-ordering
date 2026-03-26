'use client';

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api/v1';

export default function TestPage() {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[TestPage] Component mounted');
    
    async function fetchData() {
      console.log('[TestPage] Starting fetch...');
      try {
        const response = await fetch(`${API_BASE}/categories`);
        console.log('[TestPage] Response:', response.status);
        const json = await response.json();
        console.log('[TestPage] Data:', json);
        setData(json);
        setError(null);
      } catch (err) {
        console.error('[TestPage] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Test Page</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

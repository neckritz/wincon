import { useEffect, useState } from 'react';

type ClanData = any;
export default function ClanTester() {
    const [data, setData] = useState<ClanData | null>(null);
    const [error, setError] = useState<string | null>(null);
  
    // CHANGE THIS STRING TO TEST DIFFERENT CLANS
    const clanTag = 'G22Q2LPU'; 
  
    useEffect(() => {
      // Tags must be URL-encoded ( # becomes %23 )
      const encodedTag = `%23${clanTag.replace('#', '')}`;
      const url = `/api/clans/${encodedTag}`;
      const apiKey = import.meta.env.VITE_CR_API_KEY?.trim();
  
      const fetchClan = async () => {
        try {
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });
  
          if (!response.ok) throw new Error(`Error: ${response.status}`);
          
          const json = await response.json();
          setData(json);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      };
  
      fetchClan();
    }, [clanTag]);
  
    if (error) return <div style={{ color: 'red' }}>Failed to load: {error}</div>;
    if (!data) return <div>Loading Clan #{clanTag}...</div>;
  
    return (
      <div style={{ padding: '20px' }}>
        <h2>Raw Data for Clan: {data.name}</h2>
        {/* This <pre> tag is the magic for a clean JSON dump */}
        <pre style={{ 
          background: '#1e1e1e', 
          color: '#d4d4d4', 
          padding: '1rem', 
          borderRadius: '8px', 
          overflowX: 'auto' 
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

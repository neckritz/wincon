import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [tag, setTag] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag) return;
    
    // Remove the # if they typed it, as URLs don't like it raw
    const cleanTag = tag.replace('#', '');
    navigate(`/clan/${cleanTag}`);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>wincon</h1>
      <form onSubmit={handleSearch}>
        <input 
          type="text" 
          placeholder="Enter Clan Tag (e.g. #G22Q2LPU)" 
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          style={{ padding: '10px', width: '250px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', marginLeft: '10px' }}>
          Analyze Clan
        </button>
      </form>
    </div>
  );
}
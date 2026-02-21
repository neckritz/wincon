import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const [tag, setTag] = useState('');
  const navigate = useNavigate();

  const sanitizeTag = (value: string): string => {
    const trimmedValue = value.trim();
    let decodedValue = trimmedValue;

    try {
      decodedValue = decodeURIComponent(trimmedValue);
    } catch {
      decodedValue = trimmedValue;
    }

    return decodedValue.replace('#', '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag) return;

    const cleanTag = sanitizeTag(tag);
    if (!cleanTag) return;

    navigate(`/clan/${cleanTag}`);
  };

  return (
    <main className="home">
      <div className="home__content">
        <section className="home__card">
          <h1 className="home__title">wincon</h1>
          <p className="home__subtitle">Track your Clash Royale clan's war momentum and standout players</p>

          <form className="home__form" onSubmit={handleSearch}>
            <label className="home__label" htmlFor="clan-tag">
              Clan Tag
            </label>

            <div className="home__form-row">
              <input
                id="clan-tag"
                className="home__input"
                type="text"
                placeholder="Enter clan tag (e.g. #G22Q2LPU)"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
              <button className="home__button" type="submit">
                Analyze Clan
              </button>
            </div>
          </form>
        </section>
      </div>
      <footer className="home__footer">
        <p className="footer__text">Made By Ole Neckritz</p>
        <p className="footer__text">Not officially affiliated with Supercell</p>
      </footer>
    </main>
  );
}

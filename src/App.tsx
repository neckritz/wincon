import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ClanPage from './pages/ClanPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clan/:clanTag" element={<ClanPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
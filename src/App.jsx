import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import ProgressionPage from './pages/ProgressionPage.jsx';
import ForestPage from './pages/ForestPage.jsx';
import AviaryPage from './pages/AviaryPage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import PhoenixFlightPage from './pages/PhoenixFlightPage.jsx'; // Import the new game page
import LoginPage from './pages/LoginPage.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import Starfield from './components/Starfield.jsx';
import ForestBackground from './components/ForestBackground.jsx';
import AsteroidShooterPage from './pages/AsteroidShooterPage.jsx';
import LevelShowcasePage from './pages/LevelShowcasePage.jsx';
import FireBackground from './components/FireBackground.jsx';
import PhoenixConstellationBackground from './components/PhoenixConstellationBackground.jsx';
import SolarSystemBackground from './components/SolarSystemBackground.jsx';
import DarkForestBackground from './components/DarkForestBackground.jsx';

import { ranks } from './data/ranks.js';
import { fetchState, fetchShopData } from './api.js';

export const AppContext = React.createContext();

// This component handles the main layout and conditional background rendering
const AppLayout = () => {
  const location = useLocation();
  const isForestPage = location.pathname === '/forest';
  const { state, previewThemeId, setPreviewThemeId } = React.useContext(AppContext);
  const backgroundThemes = {
    burning_fire_bg: FireBackground,
    phoenix_constellation_bg: PhoenixConstellationBackground,
    solar_system_bg: SolarSystemBackground
  };
  const forestThemes = {
    dark_forest_bg: DarkForestBackground
  };
  const equippedThemeId = Object.keys(backgroundThemes).find((id) => state?.equipped_upgrades?.[id]);
  const equippedForestThemeId = Object.keys(forestThemes).find((id) => state?.equipped_upgrades?.[id]);
  const isPreviewForest = previewThemeId && forestThemes[previewThemeId];
  const isPreviewGlobal = previewThemeId && backgroundThemes[previewThemeId];
  const activeThemeId = isForestPage ? null : (isPreviewGlobal ? previewThemeId : equippedThemeId);
  const ForestBg = isPreviewForest ? forestThemes[previewThemeId] : (equippedForestThemeId ? forestThemes[equippedForestThemeId] : ForestBackground);
  const Background = isForestPage ? ForestBg : (activeThemeId ? backgroundThemes[activeThemeId] : Starfield);

  return (
    <div className="relative min-h-screen md:flex text-gray-200">
      <Background />
      {previewThemeId && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="mx-4 sm:mx-8 mt-4 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-pink-500/10 to-cyan-500/20 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <span className="text-amber-200">Preview mode enabled. This is a temporary background.</span>
            <div className="flex items-center gap-2">
              <Link to="/shop" className="px-3 py-1.5 rounded-md bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400">Purchase</Link>
              <button
                type="button"
                onClick={() => setPreviewThemeId(null)}
                className="px-3 py-1.5 rounded-md bg-gray-800 text-gray-200 hover:bg-gray-700"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
      <Sidebar />
      <main className={`flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto h-screen ${previewThemeId ? 'pt-20' : ''}`}>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/progression" element={<ProgressionPage />} />
          <Route path="/forest" element={<ForestPage />} />
          <Route path="/aviary" element={<AviaryPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/phoenix-flight" element={<PhoenixFlightPage />} /> {/* Add the new route */}
          <Route path="/progression/levels" element={<LevelShowcasePage />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/minigame/asteroid-shooter" element={<AsteroidShooterPage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  const [state, setState] = React.useState(null);
  const [shopItems, setShopItems] = React.useState([]);
  const [treeTypes, setTreeTypes] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [previewThemeId, setPreviewThemeId] = React.useState(null);

  const refetchData = async () => {
    try {
      const stateData = await fetchState();
      const shopData = await fetchShopData();
      if (stateData) {
        stateData.upgrades = JSON.parse(stateData.upgrades || '{}');
        stateData.equipped_upgrades = JSON.parse(stateData.equipped_upgrades || '{}');
        setState(stateData);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      if (shopData) {
        setShopItems(shopData.shopItems || []);
        setTreeTypes(shopData.treeTypes || {});
      }
    } catch (error) {
      console.error("Refetch failed:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };
  
  React.useEffect(() => {
    refetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !state) {
    return <LoginPage refetchData={refetchData} />;
  }
  
  const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
  const streakCoins = Math.floor(10 * Math.pow(totalHours > 0 ? totalHours : 0, 1.2));
  const totalCoins = (state.coinsAtLastRelapse || 0) + streakCoins;
  const coinRatePerHour = totalHours > 0 ? 12 * Math.pow(totalHours, 0.2) : 0;

  const getRank = (hours) => {
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (hours >= ranks[i].hours) return { ...ranks[i], level: i };
    }
    return { ...ranks[0], level: 0 };
  };

  const currentRank = getRank(totalHours);

  const contextValue = {
    state,
    setState,
    shopItems,
    treeTypes,
    totalCoins,
    coinRatePerHour,
    currentRank,
    getRank,
    ranks,
    isSidebarOpen,
    setIsSidebarOpen,
    refetchData,
    previewThemeId,
    setPreviewThemeId
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <AppLayout />
      </Router>
    </AppContext.Provider>
  );
}

export default App;

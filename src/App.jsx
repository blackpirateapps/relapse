import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import ProgressionPage from './pages/ProgressionPage.jsx';
import ForestPage from './pages/ForestPage.jsx';
import AviaryPage from './pages/AviaryPage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import Starfield from './components/Starfield.jsx';

import { ranks } from './data/ranks.js';
import { fetchState, fetchShopData } from './api.js';

export const AppContext = createContext();

function App() {
  const [state, setState] = useState(null);
  const [shopItems, setShopItems] = useState([]);
  const [treeTypes, setTreeTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

  const refetchData = async () => {
    try {
      const stateData = await fetchState();
      const shopData = await fetchShopData();
      if (stateData) {
        stateData.upgrades = JSON.parse(stateData.upgrades || '{}');
        stateData.equipped_upgrades = JSON.parse(stateData.equipped_upgrades || '{}');
        setState(stateData);
      }
      if (shopData) {
        setShopItems(shopData.shopItems || []);
        setTreeTypes(shopData.treeTypes || {});
      }
    } catch (error) {
      console.error("Refetch failed:", error);
    }
  };
  
  useEffect(() => {
    refetchData();
    setIsAuthenticated(true); // Assuming if this runs, we are authenticated
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !state) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} />;
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
    refetchData
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div className="relative min-h-screen md:flex text-gray-200">
          <Starfield />
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto h-screen">
            <Header />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/progression" element={<ProgressionPage />} />
              <Route path="/forest" element={<ForestPage />} />
              <Route path="/aviary" element={<AviaryPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
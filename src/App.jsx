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

import { ranks } from './data/ranks.js';
import { fetchState, fetchShopData } from './api.js';

export const AppContext = createContext();

function App() {
  const [state, setState] = useState(null);
  const [shopItems, setShopItems] = useState([]);
  const [treeTypes, setTreeTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const initialState = await fetchState();
        if (initialState) {
          // Parse JSON strings from DB into objects
          initialState.upgrades = JSON.parse(initialState.upgrades || '{}');
          initialState.equipped_upgrades = JSON.parse(initialState.equipped_upgrades || '{}');
          setState(initialState);

          const shopData = await fetchShopData();
          setShopItems(shopData.shopItems || []);
          setTreeTypes(shopData.treeTypes || {});
          
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Initialization failed:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} />;
  }

  // --- CORRECTED COIN CALCULATION ---
  const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
  // Restored the original, correct formula from your JS files
  const streakCoins = Math.floor(10 * Math.pow(totalHours, 1.2));
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
    ranks
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div className="relative min-h-screen md:flex bg-gray-900 text-gray-200">
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


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
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const stateData = await fetchState();
      const shopData = await fetchShopData();

      if (stateData) {
        // Parse JSON strings from backend
        stateData.upgrades = JSON.parse(stateData.upgrades || '{}');
        stateData.equipped_upgrades = JSON.parse(stateData.equipped_upgrades || '{}');
        setState(stateData);
        setIsAuthenticated(true);
      }
      
      if (shopData) {
        setShopItems(shopData.shopItems || []);
        setTreeTypes(shopData.treeTypes || {});
      }

    } catch (err) {
      console.error("Initialization error:", err);
      setIsAuthenticated(false);
      setError("Could not connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]); // Refetch data on auth change

  const contextValue = {
    state,
    setState,
    shopItems,
    treeTypes,
    ranks,
    refetchData: fetchData,
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} />;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div className="relative min-h-screen md:flex">
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


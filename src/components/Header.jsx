import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../App.jsx';

function Header() {
    const { totalCoins, coinRatePerHour, setIsSidebarOpen } = useContext(AppContext);
    const location = useLocation();
    const [pageTitle, setPageTitle] = useState('Journey');
    
    useEffect(() => {
        const path = location.pathname.replace('/', '');
        const title = path.charAt(0).toUpperCase() + path.slice(1) || 'Journey';
        setPageTitle(title);
    }, [location]);

    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div className="flex items-center">
                {/* Hamburger Menu Button - Shows only on screens smaller than 'md' */}
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden mr-4 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  aria-label="Open sidebar"
                >
                    <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white font-serif-display">{pageTitle}</h1>
                </div>
            </div>
            <div className="card p-3 px-5 text-left sm:text-right w-full sm:w-auto">
                <p className="text-xs text-yellow-300 uppercase tracking-wider">Coins</p>
                <p className="text-2xl font-bold text-white">{Math.floor(totalCoins).toLocaleString()}</p>
                <p className="text-xs text-green-400 font-mono">+{Math.floor(coinRatePerHour).toLocaleString()}/hr</p>
            </div>
        </header>
    );
}

export default Header;

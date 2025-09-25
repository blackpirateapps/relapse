import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../App.jsx';

function Header() {
    const { state } = useContext(AppContext);
    const location = useLocation();
    const [pageTitle, setPageTitle] = useState('Journey');
    
    const [totalCoins, setTotalCoins] = useState(0);
    const [coinRate, setCoinRate] = useState(0);

    useEffect(() => {
        const path = location.pathname.replace('/', '');
        const title = path.charAt(0).toUpperCase() + path.slice(1) || 'Journey';
        setPageTitle(title);
    }, [location]);

    useEffect(() => {
        if (!state) return;

        const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
        const streakCoins = totalHours > 0 ? Math.floor(10 * Math.pow(totalHours, 1.2)) : 0;
        setTotalCoins((state.coinsAtLastRelapse || 0) + streakCoins);

        const newCoinRate = totalHours > 0 ? 12 * Math.pow(totalHours, 0.2) : 0;
        setCoinRate(Math.floor(newCoinRate));

    }, [state, location]); // Rerun on state and location change


    return (
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white font-serif-display">{pageTitle}</h1>
            </div>
            <div className="card p-3 px-5 text-right">
                <p className="text-xs text-yellow-300 uppercase tracking-wider">Coins</p>
                <p className="text-2xl font-bold text-white">{Math.floor(totalCoins).toLocaleString()}</p>
                <p className="text-xs text-green-400 font-mono">+{coinRate.toLocaleString()}/hr</p>
            </div>
        </header>
    );
}

export default Header;


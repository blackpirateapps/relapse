import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AppContext } from '../App.jsx';
import NavIcon from './NavIcon.jsx';
import { ANDROID_NAV_ITEMS, DESKTOP_NAV_ITEMS } from '../mobile/navigation.js';
import { isAndroidApp } from '../platform/runtime.js';

function Sidebar() {
  const { isSidebarOpen, setIsSidebarOpen, state, previewThemeId } = useContext(AppContext);
  const location = useLocation();
  const isKawaiiTheme = previewThemeId === 'kawaii_city_bg' || state?.equipped_upgrades?.kawaii_city_bg;
  const navItems = isAndroidApp() ? ANDROID_NAV_ITEMS : DESKTOP_NAV_ITEMS;

  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location, setIsSidebarOpen]);

  const activeLink = isKawaiiTheme ? 'bg-slate-200 text-slate-900' : 'bg-yellow-400 text-gray-900';
  const inactiveLink = isKawaiiTheme ? 'text-slate-200/80 hover:bg-white/10 hover:text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <aside
        className={`${isKawaiiTheme ? 'bg-slate-900/70 text-slate-100 border-r border-slate-700/70' : 'bg-black bg-opacity-20 text-gray-300'} w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-40
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {isKawaiiTheme && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 left-6 w-32 h-10 rounded-full bg-slate-200/20 blur-[1px] animate-[kawaiiCloud_18s_linear_infinite]" />
            <div className="absolute top-16 -left-10 w-24 h-8 rounded-full bg-slate-200/15 blur-[1px] animate-[kawaiiCloud_22s_linear_infinite]" />
            <div className="absolute bottom-14 left-10 w-20 h-20 rounded-[24px] bg-fuchsia-300/20 rotate-45 animate-[kawaiiGlow_8s_ease-in-out_infinite]" />
            <div className="absolute bottom-8 right-6 w-12 h-12 rounded-[18px] bg-sky-300/20 rotate-45 animate-[kawaiiGlow_9s_ease-in-out_infinite]" />
          </div>
        )}
        <div className="px-4">
          <h1 className={`text-2xl font-bold font-serif-display ${isKawaiiTheme ? 'text-slate-100' : 'text-white'}`}>Phoenix</h1>
        </div>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors ${isActive ? activeLink : inactiveLink}`
                  }
                >
                  <NavIcon type={item.icon} />
                  <span className="ml-3">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {isKawaiiTheme && (
          <style jsx>{`
            @keyframes kawaiiCloud {
              0% { transform: translateX(-40px); opacity: 0; }
              20% { opacity: 1; }
              100% { transform: translateX(260px); opacity: 0; }
            }
            @keyframes kawaiiGlow {
              0%, 100% { opacity: 0.4; transform: scale(1) rotate(45deg); }
              50% { opacity: 0.8; transform: scale(1.08) rotate(45deg); }
            }
          `}</style>
        )}
      </aside>
    </>
  );
}

export default Sidebar;

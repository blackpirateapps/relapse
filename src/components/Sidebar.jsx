import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AppContext } from '../App.jsx';

function Sidebar() {
    const { isSidebarOpen, setIsSidebarOpen } = useContext(AppContext);
    const location = useLocation();

    // Close sidebar on navigation
    React.useEffect(() => {
        setIsSidebarOpen(false);
    }, [location, setIsSidebarOpen]);
    
    const navItems = [
      { name: 'Journey', href: '/', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> },
      { name: 'Progression', href: '/progression', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg> },
      { name: 'Forest', href: '/forest', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg> },
      { name: 'Aviary', href: '/aviary', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> },
      { name: 'Shop', href: '/shop', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg> },
    ];
    
    const activeLink = "bg-yellow-400 text-gray-900";
    const inactiveLink = "text-gray-300 hover:bg-gray-700 hover:text-white";

    return (
      <>
        {/* Overlay for mobile */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            ></div>
        )}
        <aside 
            className={`bg-black bg-opacity-20 text-gray-300 w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-40
                md:relative md:translate-x-0 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            }
        >
            <div className="px-4">
                <h1 className="text-2xl font-bold text-white font-serif-display">Phoenix</h1>
            </div>
            <nav>
                <ul>
                    {navItems.map(item => (
                        <li key={item.name}>
                            <NavLink 
                                to={item.href}
                                className={({ isActive }) => 
                                  `group flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors ${isActive ? activeLink : inactiveLink}`
                                }
                            >
                                {item.icon}
                                <span className="ml-3">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
      </>
    );
}

export default Sidebar;
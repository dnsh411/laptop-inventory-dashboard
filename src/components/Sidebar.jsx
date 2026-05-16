import React from 'react';
import { Icon, icons } from './Icons';

const Sidebar = ({ activeNav, setActiveNav }) => {
  const navItems = [
    { key: "dashboard", label: "Dashboard",  icon: icons.dashboard },
    { key: "inventory", label: "Inventory",   icon: icons.inventory },
    { key: "trash",     label: "Trash",       icon: icons.trash },
    { key: "settings",  label: "Settings",    icon: icons.settings },
  ];

  return (
    <aside id="sidebar" className="w-[260px] min-h-screen bg-surface-900/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Icon d={icons.laptop} className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">LapInventory</h1>
          <p className="text-[10px] text-surface-200/40 font-medium tracking-wider uppercase">Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2">
        <p className="text-[10px] font-semibold text-surface-200/30 uppercase tracking-widest px-3 mb-3">Menu</p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeNav === item.key;
            return (
              <li key={item.key}>
                <button
                  id={`nav-${item.key}`}
                  onClick={() => setActiveNav(item.key)}
                  className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer
                    ${isActive
                      ? "bg-brand-600/15 text-brand-400 shadow-sm shadow-brand-500/5"
                      : "text-surface-200/50 hover:text-surface-200/80 hover:bg-white/[0.03]"
                    }`}
                >
                  <Icon d={item.icon} className="w-[18px] h-[18px]" />
                  {item.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 pulse-dot"></span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-xs font-bold">
            DN
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">Dinesh N</p>
            <p className="text-[10px] text-surface-200/40 truncate">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

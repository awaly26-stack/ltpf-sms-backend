
import React from 'react';
import { Landmark, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  const { logout, currentUser } = useAuth();

  return (
    <header className="px-8 py-6 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-3">
        <Landmark className="text-indigo-500" size={24} />
        <div>
          <h2 className="text-sm font-black text-white uppercase leading-tight">LTP Fatick</h2>
          {currentUser && (
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">
              {currentUser.name}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme} 
          className="p-3 bg-white/5 text-indigo-400 rounded-2xl active:scale-95 transition-all"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button 
          onClick={logout} 
          className="p-3 bg-white/5 text-rose-500 rounded-2xl active:scale-95 transition-all"
        >
          <LogOut size={18}/>
        </button>
      </div>
    </header>
  );
};

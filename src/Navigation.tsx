
import React from 'react';
import { Home, Users, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';

export type TabType = 'home' | 'list' | 'admin' | 'chat';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { isStaff } = useAuth();

  return (
    <nav className="fixed bottom-6 inset-x-0 mx-auto w-[92%] max-w-md glass h-20 rounded-full flex items-center justify-around px-6 z-40 shadow-2xl animate-in slide-in-from-bottom duration-500 border border-white/5">
      <button 
        onClick={() => setActiveTab('home')} 
        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-indigo-500 scale-110' : 'text-slate-500'}`}
      >
        <Home size={22}/>
        <span className="text-[8px] font-black uppercase">Home</span>
      </button>

      <button 
        onClick={() => setActiveTab('list')} 
        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'list' ? 'text-indigo-500 scale-110' : 'text-slate-500'}`}
      >
        <Users size={22}/>
        <span className="text-[8px] font-black uppercase">Campus</span>
      </button>

      <button 
        onClick={() => setActiveTab('chat')} 
        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-indigo-500 scale-110' : 'text-slate-500'}`}
      >
        <MessageSquare size={22}/>
        <span className="text-[8px] font-black uppercase">Chat</span>
      </button>

      {isStaff && (
        <button 
          onClick={() => setActiveTab('admin')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'admin' ? 'text-indigo-500 scale-110' : 'text-slate-500'}`}
        >
          <ShieldCheck size={22}/>
          <span className="text-[8px] font-black uppercase">Pilote</span>
        </button>
      )}
    </nav>
  );
};

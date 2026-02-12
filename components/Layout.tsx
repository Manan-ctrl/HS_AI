import React from 'react';
import { LayoutDashboard, CreditCard, PieChart, MessageSquare, Mic, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isDarkMode, toggleTheme }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'transactions', icon: CreditCard, label: 'Wallet' },
    { id: 'analytics', icon: PieChart, label: 'Stats' },
    { id: 'chat', icon: MessageSquare, label: 'Ask AI' },
    { id: 'live', icon: Mic, label: 'Speak' },
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 transition-colors duration-300`}>
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-white h-screen sticky top-0 border-r border-slate-800 shrink-0">
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center font-black text-slate-900 shadow-lg shadow-teal-500/20">A</div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Aijaz</h1>
          </div>
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-semibold group ${
                activeTab === item.id 
                  ? 'bg-teal-600 text-white shadow-xl shadow-teal-900/40 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-[0.2em] mb-1">Open Platform</p>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">All AI features are free of cost for all users.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative bg-slate-50 dark:bg-slate-950 flex flex-col">
        {/* Mobile Top Header */}
        <header className="md:hidden p-4 pt-6 bg-slate-950 text-white flex justify-between items-center sticky top-0 z-[60] safe-pt border-b border-slate-800/50 backdrop-blur-md">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-slate-900 shadow-md">A</div>
            <h1 className="text-xl font-black tracking-tighter">Aijaz</h1>
          </div>
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>
        
        <div className="flex-1 p-4 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-900 z-50 px-2 py-3 safe-pb flex justify-around items-center backdrop-blur-xl bg-opacity-95 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-300 ${
              activeTab === item.id ? 'bg-teal-500/10 text-teal-400 scale-110' : 'text-slate-500'
            }`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
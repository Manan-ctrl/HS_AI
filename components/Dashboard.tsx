import React, { useEffect, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, Sparkles, Target, ChevronRight } from 'lucide-react';
import { GeminiService } from '../services/gemini';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#14b8a6', '#0d9488', '#0f766e', '#2dd4bf', '#5eead4', '#99f6e4'];

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [insight, setInsight] = useState<string>("Analyzing your finances...");
  
  useEffect(() => {
    if (transactions.length > 0) {
      GeminiService.generateInsight(transactions).then(setInsight);
    } else {
      setInsight("Start adding transactions to get AI-powered insights.");
    }
  }, [transactions]);

  const totalIncome = transactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const budgetLimit = totalIncome > 0 ? totalIncome * 0.8 : 50000;
  const budgetProgress = Math.min((totalExpense / budgetLimit) * 100, 100);

  const expensesByCategory = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Hi, I'm Aijaz</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Your AI financial co-pilot is ready.</p>
      </header>

      {/* AI Insight Bar */}
      <section className="bg-teal-500/10 dark:bg-teal-500/5 border border-teal-500/20 rounded-[2rem] p-5 md:p-6 flex items-start gap-4 shadow-sm backdrop-blur-sm">
        <div className="bg-teal-500 p-2.5 rounded-2xl shadow-lg shadow-teal-500/20 shrink-0">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] mb-1">Financial Intelligence</h4>
          <p className="text-sm md:text-base text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">{insight}</p>
        </div>
      </section>

      {/* Balance Card */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-700"></div>
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 opacity-80">Available Liquidity</p>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm">{formatINR(balance)}</h3>
          </div>
          <div className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
            <Wallet className="text-teal-400" size={28} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue</p>
            <p className="text-xl font-bold text-teal-400">+{formatINR(totalIncome)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spend</p>
            <p className="text-xl font-bold text-rose-400">-{formatINR(totalExpense)}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget & Distribution */}
        <section className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-500"><Target size={22}/></div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg">Distribution</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                  <span className={`text-sm font-black ${budgetProgress > 80 ? 'text-rose-500' : 'text-teal-500'}`}>{budgetProgress.toFixed(0)}%</span>
                </div>
            </div>
            
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-8 shadow-inner">
                <div className={`h-full rounded-full transition-all duration-1000 ease-in-out ${budgetProgress > 80 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(budgetProgress, 100)}%` }}></div>
            </div>
            
            <div className="flex-1 min-h-[220px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: '#0f172a', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-30">
                  <Activity size={40} className="mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Data Required</p>
                </div>
              )}
            </div>
        </section>

        {/* Recent Transactions */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 md:p-8 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Live Stream</h3>
            <button className="text-teal-500 hover:text-teal-600 transition-colors p-2 hover:bg-teal-500/10 rounded-xl">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="p-4 md:p-6 pt-2">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Activity size={32} className="mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Awaiting input</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors px-2 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-transform group-hover:scale-110 ${t.type === TransactionType.INCOME ? 'bg-teal-500/10 text-teal-600' : 'bg-rose-500/10 text-rose-600'}`}>
                        {t.type === TransactionType.INCOME ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm md:text-base leading-none mb-1.5">{t.description}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-sm md:text-base ${t.type === TransactionType.INCOME ? 'text-teal-600' : 'text-slate-900 dark:text-white'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}{formatINR(t.amount)}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { Plus, Trash2, Search, Download, X } from 'lucide-react';
import { GeminiService } from '../services/gemini';

interface TransactionsProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, addTransaction, deleteTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Form State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState<string>('');
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleDescChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDesc(val);
    if (val.length > 3 && !category) {
      setIsAutoCategorizing(true);
      try {
        const cat = await GeminiService.categorizeTransaction(val);
        setCategory(cat);
      } catch(err) {
        console.error("Auto-cat failed", err);
      } finally {
        setIsAutoCategorizing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      description: desc,
      amount: parseFloat(amount),
      type,
      category: category || 'Other',
      date: new Date().toLocaleDateString('en-GB'),
    };

    addTransaction(newTransaction);
    setIsModalOpen(false);
    setDesc('');
    setAmount('');
    setCategory('');
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'ALL' || t.type === filter;
    if (!search) return matchesFilter;
    const searchLower = search.toLowerCase();
    const terms = searchLower.split(/\s+/).filter(term => term.length > 0);
    return matchesFilter && terms.every(term => 
      t.description.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term) ||
      t.amount.toString().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Wallet Ledger</h2>
        <p className="text-sm font-medium text-slate-500">Secure record of every transaction.</p>
      </header>

      {/* Action Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-4 px-8 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} /> New Entry
        </button>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full bg-white dark:bg-slate-900 pl-11 pr-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-medium"
            />
          </div>
          <button className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['ALL', 'INCOME', 'EXPENSE'].map((f) => (
            <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${
              filter === f 
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white' 
                : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-400'
            }`}
            >
              {f}
            </button>
          ))}
      </div>

      {/* Transaction Records */}
      <div className="space-y-3">
        {filteredTransactions.map((t) => (
          <article key={t.id} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                t.type === TransactionType.INCOME ? 'bg-teal-500/10 text-teal-600' : 'bg-rose-500/10 text-rose-600'
              }`}>
                 <span className="font-black text-sm uppercase">{t.category.charAt(0)}</span>
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[150px] md:max-w-xs">{t.description}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.date}</span>
                  <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                  <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">{t.category}</span>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1 shrink-0">
              <span className={`font-black tracking-tighter text-base md:text-lg ${t.type === TransactionType.INCOME ? 'text-teal-600' : 'text-slate-900 dark:text-white'}`}>
                 {t.type === TransactionType.INCOME ? '+' : '-'}{formatINR(t.amount)}
              </span>
              <button onClick={() => deleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all active:scale-90">
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        {filteredTransactions.length === 0 && (
          <div className="p-20 text-center">
            <Search size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
            <p className="font-black uppercase tracking-widest text-[10px] text-slate-400">Search Yielded Zero Results</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-end md:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Entry Sheet</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => setType(TransactionType.EXPENSE)}
                    className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-md scale-[1.02]' : 'text-slate-500'}`}
                  >
                    Expense
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType(TransactionType.INCOME)}
                    className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-teal-500 shadow-md scale-[1.02]' : 'text-slate-500'}`}
                  >
                    Income
                  </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    value={desc}
                    required
                    onChange={handleDescChange}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none p-5 rounded-2xl text-lg font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-teal-500/10 outline-none dark:text-white"
                    placeholder="Short description..."
                  />
                  {isAutoCategorizing && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <input 
                  type="number" 
                  value={amount}
                  required
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-none p-6 rounded-2xl text-4xl font-black placeholder:text-slate-300 focus:ring-4 focus:ring-teal-500/10 outline-none dark:text-white text-center"
                  placeholder="₹ 0"
                />
                <input
                   type="text"
                   value={category}
                   onChange={(e) => setCategory(e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-800/50 border-none p-5 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-teal-500/10 outline-none dark:text-white"
                   placeholder="Tag category (e.g. Food, Fuel)"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 rounded-2xl bg-teal-600 text-white font-black uppercase tracking-[0.2em] hover:bg-teal-500 shadow-xl shadow-teal-500/20 active:scale-[0.98] transition-all text-sm"
              >
                Log Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
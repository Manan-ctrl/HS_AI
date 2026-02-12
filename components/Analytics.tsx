import React from 'react';
import { Transaction, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AnalyticsProps {
  transactions: Transaction[];
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions }) => {
  // Process Data: Expenses per Category
  const categoryData = Object.values(
    transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = { name: t.category, value: 0 };
        }
        acc[t.category].value += t.amount;
        return acc;
      }, {} as Record<string, { name: string; value: number }>)
  );

  // Process Data: Monthly Trend (Mocking simple daily/entry based for demo)
  const trendData = transactions.slice().reverse().map((t, i) => ({
    name: i.toString(), // Simplify for demo, ideally dates
    amount: t.amount,
    type: t.type
  }));

  return (
    <div className="space-y-6">
       <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Category Bar Chart */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Expenses by Category</h3>
           <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={categoryData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                 <XAxis type="number" stroke="#94a3b8" />
                 <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                   cursor={{fill: 'rgba(255,255,255,0.05)'}}
                 />
                 <Bar dataKey="value" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>

         {/* Transactions Trend */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Transaction Flow</h3>
             <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={trendData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis hide />
                 <YAxis stroke="#94a3b8" />
                 <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                 />
                 <Legend />
                 <Bar dataKey="amount" fill="#6366f1" name="Amount" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>
       </div>
    </div>
  );
};

export default Analytics;

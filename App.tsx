import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Analytics from './components/Analytics';
import Chatbot from './components/Chatbot';
import VoiceAssistant from './components/VoiceAssistant';
import { Transaction, TransactionType } from './types';

// Mock Data with INR realistic values
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Monthly Salary', amount: 85000, type: TransactionType.INCOME, category: 'Income', date: '2023-10-01' },
  { id: '2', description: 'House Rent', amount: 25000, type: TransactionType.EXPENSE, category: 'Housing', date: '2023-10-02' },
  { id: '3', description: 'D-Mart Grocery', amount: 4500, type: TransactionType.EXPENSE, category: 'Food & Dining', date: '2023-10-05' },
  { id: '4', description: 'Netflix Subscription', amount: 649, type: TransactionType.EXPENSE, category: 'Entertainment', date: '2023-10-05' },
  { id: '5', description: 'Uber Commute', amount: 450, type: TransactionType.EXPENSE, category: 'Transportation', date: '2023-10-06' },
  { id: '6', description: 'Electricity Bill', amount: 2300, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-10' },
  { id: '7', description: 'Freelance Project', amount: 15000, type: TransactionType.INCOME, category: 'Income', date: '2023-10-12' },
  { id: '8', description: 'Zomato Order', amount: 850, type: TransactionType.EXPENSE, category: 'Food & Dining', date: '2023-10-14' },
  { id: '9', description: 'SIP Investment', amount: 10000, type: TransactionType.EXPENSE, category: 'Investment', date: '2023-10-15' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  // Initialize Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
    >
      {activeTab === 'dashboard' && <Dashboard transactions={transactions} />}
      {activeTab === 'transactions' && (
        <Transactions 
          transactions={transactions} 
          addTransaction={addTransaction}
          deleteTransaction={deleteTransaction}
        />
      )}
      {activeTab === 'analytics' && <Analytics transactions={transactions} />}
      {activeTab === 'chat' && <Chatbot />}
      {activeTab === 'live' && <VoiceAssistant />}
    </Layout>
  );
};

export default App;

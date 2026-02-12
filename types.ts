export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum Category {
  FOOD = 'Food & Dining',
  TRANSPORT = 'Transportation',
  HOUSING = 'Housing',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health & Fitness',
  SHOPPING = 'Shopping',
  INCOME = 'Income',
  INVESTMENT = 'Investment',
  OTHER = 'Other',
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category | string;
  description: string;
  date: string;
}

export interface Budget {
  category: Category | string;
  limit: number;
  spent: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingUrls?: Array<{ title: string; uri: string }>;
}
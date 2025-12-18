import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Trash2, 
  History,
  Bot,
  RefreshCw,
  Sun,
  Moon,
  ArrowRightLeft,
  Building2,
  Landmark,
  Banknote,
  ShoppingBag,
  Plus,
  CalendarDays,
  FileText,
  Clock,
  List,
  Receipt,
  Calculator,
  CalendarRange,
  Calendar,
  User as UserIcon,
  Download,
  Settings,
  Database,
  Menu,
  X,
  BarChart3,
  BarChartBig,
  PieChart as PieChartIcon,
  HandCoins,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  CloudUpload,
  CloudDownload,
  Cloud,
  Wifi,
  WifiOff,
  CloudCheck
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import { StatusBar } from '@capacitor/status-bar';

import { Transaction, TransactionType, FinancialSummary, AccountType, Category, Account } from './types';
import { getStoredTransactions, saveStoredTransactions, getStoredAccounts, saveStoredAccounts } from './services/storage';
import { getFinancialAdvice } from './services/geminiService';
import { getSyncConfig, pushToSheets, pullFromSheets } from './services/syncService';
import TransactionForm from './components/TransactionForm';
import SummaryCard from './components/SummaryCard';
import FinancialChart from './components/FinancialChart';
import BottomNavigation from './components/BottomNavigation';
import SalaryManager from './components/SalaryManager';
import ConfigModal from './components/ConfigModal';
import AccountsModal from './components/AccountsModal';
import LendingView from './components/LendingView';
import BazarView from './components/BazarView';
import HistoryView from './components/HistoryView';

// Reusable Report View Component
interface ReportViewProps {
  title: string;
  icon: React.ElementType;
  transactions: Transaction[];
  accounts: Account[];
  filterFn: (t: Transaction) => boolean;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  colorClass: string;
  bgClass: string;
  totalLabel: string;
  emptyMessage: string;
}

const ReportView: React.FC<ReportViewProps> = ({ 
  title, 
  icon: Icon, 
  transactions, 
  accounts,
  filterFn, 
  onUpdateTransaction, 
  onDeleteTransaction,
  colorClass,
  bgClass,
  totalLabel,
  emptyMessage
}) => {
    const [viewDate, setViewDate] = useState(new Date());

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();
    const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [editDesc, setEditDesc] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editAccount, setEditAccount] = useState<AccountType>('');
    const [editCategory, setEditCategory] = useState<string>('');
    const [editType, setEditType] = useState<TransactionType>('expense');
    
    const typeFilteredTxs = transactions.filter(filterFn);
    
    const thisMonthTxs = typeFilteredTxs.filter(t => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = thisMonthTxs.reduce((sum, t) => sum + t.amount, 0);

    const dailyData = useMemo(() => {
        const groups: Record<string, { total: number, items: Transaction[] }> = {};
        thisMonthTxs.forEach(t => {
            const dateKey = t.date.split('T')[0];
            if (!groups[dateKey]) {
                groups[dateKey] = { total: 0, items: [] };
            }
            groups[dateKey].total += t.amount;
            groups[dateKey].items.push(t);
        });
        
        return Object.entries(groups)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [thisMonthTxs]);

    const startEditing = (t: Transaction) => {
        setEditingTx(t);
        setEditDesc(t.description);
        setEditAmount(t.amount.toString());
        try {
            const d = new Date(t.date);
            const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setEditDate(localIso);
        } catch (e) {
            setEditDate(new Date().toISOString().slice(0, 16));
        }
        setEditAccount(t.accountId);
        setEditCategory(t.category);
        setEditType(t.type);
    };

    const saveEdit = () => {
        if (!editingTx || !editDesc || !editAmount) return;
        const updatedTx: Transaction = {
            ...editingTx,
            description: editDesc,
            amount: parseFloat(editAmount),
            date: new Date(editDate).toISOString(),
            accountId: editAccount,
            category: editCategory,
            type: editType
        };
        onUpdateTransaction(updatedTx);
        setEditingTx(null);
    };

    const handleDelete = () => {
        if (editingTx && confirm("Are you sure you want to delete this transaction?")) {
            onDeleteTransaction(editingTx.id);
            setEditingTx(null);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24 relative">
           {editingTx && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-gray-900 dark:text-white">Edit Transaction</h3>
                        <button onClick={() => setEditingTx(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Description</label>
                            <input 
                                type="text" 
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Amount</label>
                                <input 
                                    type="number" 
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                             </div>
                             <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Type</label>
                                <select
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value as TransactionType)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                    <option value="transfer">Transfer</option>
                                </select>
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Account</label>
                                <select
                                    value={editAccount}
                                    onChange={(e) => setEditAccount(e.target.value as AccountType)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                             </div>
                             <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Category</label>
                                <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                    {Object.values(Category).map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    {!Object.values(Category).includes(editCategory as Category) && (
                                        <option value={editCategory}>{editCategory}</option>
                                    )}
                                </select>
                             </div>
                        </div>
                         <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Date & Time</label>
                            <input 
                                type="datetime-local" 
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between gap-3 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                        <button 
                            onClick={handleDelete}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2 px-2"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                        <div className="flex gap-2">
                             <button onClick={() => setEditingTx(null)} className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                             <button onClick={saveEdit} className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium flex items-center justify-center gap-2">
                                <Check className="w-4 h-4" /> Save
                             </button>
                        </div>
                    </div>
                </div>
            </div>
           )}

           <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                  <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{monthName}</p>
              </div>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                  <ChevronRight className="w-5 h-5" />
              </button>
           </div>

           <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Icon className={`w-6 h-6 ${colorClass}`} />
                  {title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Analysis for {monthName}</p>
           </div>

           <div className={`${bgClass} p-6 rounded-xl border border-gray-100 dark:border-gray-700 mb-8 flex flex-col items-center justify-center text-center`}>
               <p className={`text-sm font-medium mb-2 uppercase tracking-wide opacity-80 ${colorClass}`}>{totalLabel}</p>
               <p className={`text-4xl font-extrabold ${colorClass}`}>Tk {totalSpent.toLocaleString()}</p>
           </div>

           <div className="space-y-4">
               <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                   <CalendarDays className="w-5 h-5 text-gray-500" />
                   Daily Breakdown
               </h3>
               
               {dailyData.length > 0 ? (
                   <div className="space-y-4">
                       {dailyData.map((day, idx) => {
                           const dateObj = new Date(day.date);
                           return (
                               <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                   <div className="flex justify-between items-center p-4 bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                                       <div className="flex items-center gap-4">
                                           <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-700 rounded-lg w-12 h-12 border border-gray-100 dark:border-gray-600 shadow-sm">
                                               <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase leading-none mb-0.5">
                                                  {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                                               </span>
                                               <span className="text-xl font-bold text-gray-800 dark:text-white leading-none">
                                                  {dateObj.getDate()}
                                               </span>
                                           </div>
                                           <div>
                                               <p className="font-semibold text-gray-900 dark:text-white">
                                                  {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                                               </p>
                                               <p className="text-xs text-gray-500 dark:text-gray-400">
                                                  {day.items.length} items
                                               </p>
                                           </div>
                                       </div>
                                       <span className={`font-bold text-lg ${colorClass}`}>
                                           Tk {day.total.toLocaleString()}
                                       </span>
                                   </div>
                                   
                                   <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                      {day.items.map((item, i) => (
                                          <div 
                                            key={item.id} 
                                            onClick={() => startEditing(item)}
                                            className="flex justify-between items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors cursor-pointer"
                                          >
                                              <div className="flex items-center gap-3">
                                                  <span className="text-xs font-medium text-gray-400 w-4">{i + 1}.</span>
                                                  <div>
                                                      <p className="text-sm text-gray-700 dark:text-gray-200">{item.description}</p>
                                                      {item.category && <p className="text-[10px] text-gray-400">{item.category}</p>}
                                                  </div>
                                              </div>
                                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                  {item.amount.toLocaleString()}
                                              </span>
                                          </div>
                                      ))}
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               ) : (
                   <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                       <p className="text-gray-500">{emptyMessage}</p>
                   </div>
               )}
           </div>
        </div>
    );
};

interface FullMonthlyReportProps {
    transactions: Transaction[];
    accounts: Account[];
}

const FullMonthlyReport: React.FC<FullMonthlyReportProps> = ({ transactions, accounts }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();
    const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const historicalBalances = useMemo(() => {
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        const balances: Record<string, number> = {};
        accounts.forEach(a => balances[a.id] = 0);
        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate > endOfMonth) return;
            if (t.type === 'income') {
                if (balances[t.accountId] !== undefined) balances[t.accountId] += t.amount;
            } else if (t.type === 'expense') {
                if (balances[t.accountId] !== undefined) balances[t.accountId] -= t.amount;
            } else if (t.type === 'transfer') {
                if (balances[t.accountId] !== undefined) balances[t.accountId] -= t.amount;
                if (t.targetAccountId && balances[t.targetAccountId] !== undefined) balances[t.targetAccountId] += t.amount;
            }
        });
        return balances;
    }, [transactions, currentMonth, currentYear, accounts]);

    const monthlyData = useMemo(() => {
        const thisMonthTxs = transactions.filter(t => {
            if (!t.date) return false;
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const totalIncome = thisMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = thisMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netFlow = totalIncome - totalExpense;
        const cashAccId = accounts.find(a => a.id === 'cash')?.id || 'cash';
        const totalWithdrawals = thisMonthTxs
            .filter(t => t.type === 'transfer' && t.targetAccountId === cashAccId && t.accountId !== cashAccId)
            .reduce((sum, t) => sum + t.amount, 0);

        const expensesByCategory: Record<string, number> = {};
        const transactionsByCategory: Record<string, Transaction[]> = {};

        thisMonthTxs.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || 'Other';
            expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount;
            if (!transactionsByCategory[cat]) transactionsByCategory[cat] = [];
            transactionsByCategory[cat].push(t);
        });
        
        Object.keys(transactionsByCategory).forEach(cat => {
            transactionsByCategory[cat].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        const sortedCategories = Object.entries(expensesByCategory).sort((a,b) => b[1] - a[1]);

        return { totalIncome, totalExpense, netFlow, totalWithdrawals, sortedCategories, transactionsByCategory };
    }, [transactions, currentMonth, currentYear, accounts]);

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24 relative">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{monthName}</p>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-indigo-500" />
                    Full Monthly Report
                </h2>
                <p className="text-gray-500 dark:text-gray-400">Comprehensive breakdown</p>
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 pl-1 text-sm uppercase tracking-wide">End of Month Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {accounts.map(acc => {
                    const balance = historicalBalances[acc.id] || 0;
                    return (
                        <div key={acc.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{acc.emoji}</span>
                                <p className="text-xs font-medium uppercase text-gray-600 dark:text-gray-400">{acc.name}</p>
                            </div>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">Tk {balance.toLocaleString()}</p>
                        </div>
                    );
                })}
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 pl-1 text-sm uppercase tracking-wide">Monthly Flow</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <p className="text-xs font-medium uppercase text-emerald-600 dark:text-emerald-400 mb-1">Total Income</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">Tk {monthlyData.totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-800">
                    <p className="text-xs font-medium uppercase text-rose-600 dark:text-rose-400 mb-1">Total Expense</p>
                    <p className="text-lg font-bold text-rose-700 dark:text-rose-300">Tk {monthlyData.totalExpense.toLocaleString()}</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 col-span-2 sm:col-span-1">
                    <p className="text-xs font-medium uppercase text-indigo-600 dark:text-indigo-400 mb-1">Net Flow</p>
                    <p className={`text-lg font-bold ${monthlyData.netFlow >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-600 dark:text-rose-400'}`}>
                        Tk {monthlyData.netFlow.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
                 <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                     <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                         <Banknote className="w-4 h-4 text-amber-500" /> Cash Withdrawals
                     </h3>
                     <span className="font-bold text-amber-600 dark:text-amber-400">Tk {monthlyData.totalWithdrawals.toLocaleString()}</span>
                 </div>
                 <div className="p-4 text-xs text-gray-500 dark:text-gray-400 bg-amber-50/30 dark:bg-amber-900/10">
                    Money transferred to Cash. This is not an expense, but money taken out for use.
                 </div>
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 pl-1 text-sm uppercase tracking-wide">Categorical Breakdown</h3>
            <div className="space-y-4 mb-8">
                {monthlyData.sortedCategories.length > 0 ? (
                    monthlyData.sortedCategories.map(([cat, amount]) => (
                        <div key={cat} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                             <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{cat}</span>
                                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                        {monthlyData.transactionsByCategory[cat].length}
                                    </span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">Tk {amount.toLocaleString()}</span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {monthlyData.transactionsByCategory[cat].map(t => (
                                    <div key={t.id} className="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="text-center w-10">
                                                 <div className="text-xs font-bold text-gray-500 dark:text-gray-400">{new Date(t.date).getDate()}</div>
                                                 <div className="text-[10px] text-gray-400 uppercase">{new Date(t.date).toLocaleDateString('en-US', {month:'short'})}</div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-800 dark:text-gray-200">{t.description}</p>
                                                <p className="text-[10px] text-gray-400 capitalize">{accounts.find(a => a.id === t.accountId)?.name || t.accountId}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                                            {t.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        No expenses recorded for this month.
                    </div>
                )}
            </div>
        </div>
    );
}

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [accounts, setAccounts] = useState<Account[]>(() => getStoredAccounts());
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing' | 'error' | 'none'>('none');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [activeTab, setActiveTab] = useState<'input' | 'bazar' | 'bazar-report' | 'expense-report' | 'lending' | 'history' | 'dashboard' | 'full-report'>('input');
  const [dashboardPeriod, setDashboardPeriod] = useState<'month' | 'year'>('month');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showConfig, setShowConfig] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Show status bar
  useEffect(() => {
    StatusBar.show();
  }, []);

  // Sync Logic
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    saveStoredTransactions(transactions);
    saveStoredAccounts(accounts);
    
    // Auto-push debounced
    const config = getSyncConfig();
    if (config && config.url) {
        if (isOnline) {
            setSyncStatus('pending');
            if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
            syncTimerRef.current = window.setTimeout(triggerAutoPush, 2000);
        } else {
            setSyncStatus('pending');
        }
    } else {
        setSyncStatus('none');
    }
  }, [transactions, accounts, isOnline]);

  useEffect(() => {
    const handleOnline = () => {
        setIsOnline(true);
        const config = getSyncConfig();
        if (config && config.url) triggerAutoPush();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync status check
    const config = getSyncConfig();
    if (config && config.url) setSyncStatus('synced');
    else setSyncStatus('none');

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, []);

  const triggerAutoPush = async () => {
    if (!navigator.onLine) {
        setSyncStatus('pending');
        return;
    }
    
    setSyncStatus('syncing');
    const success = await pushToSheets(transactions, accounts);
    if (success) {
        setSyncStatus('synced');
    } else {
        setSyncStatus('error');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = { ...newTx, id: uuidv4() };
    setTransactions(prev => [transaction, ...prev]);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateAccounts = (updatedAccounts: Account[]) => {
      setAccounts(updatedAccounts);
  };

  const handleGetAdvice = async () => {
    setIsAiLoading(true);
    const advice = await getFinancialAdvice(transactions);
    setAiAdvice(advice);
    setIsAiLoading(false);
  };

  const handlePushSync = async () => {
      setIsSyncing(true);
      const success = await pushToSheets(transactions, accounts);
      setIsSyncing(false);
      if (success) {
          alert("Data pushed to Google Sheets successfully!");
          setSyncStatus('synced');
      } else {
          alert("Sync failed. Check your Web App URL in settings.");
          setSyncStatus('error');
      }
  };

  const handlePullSync = async () => {
      setIsSyncing(true);
      const data = await pullFromSheets();
      setIsSyncing(false);
      if (data) {
          if (confirm("Remote data retrieved. Overwrite local data with data from Google Sheets?")) {
              setTransactions(data.transactions);
              setAccounts(data.accounts);
              setSyncStatus('synced');
          }
      } else {
          alert("Could not retrieve data. Check your Web App URL in settings.");
      }
  };

  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach(a => balances[a.id] = 0);
    transactions.forEach(t => {
      if (t.type === 'income') {
        if (balances[t.accountId] !== undefined) balances[t.accountId] += t.amount;
      } else if (t.type === 'expense') {
        if (balances[t.accountId] !== undefined) balances[t.accountId] -= t.amount;
      } else if (t.type === 'transfer') {
        if (balances[t.accountId] !== undefined) balances[t.accountId] -= t.amount;
        if (t.targetAccountId && balances[t.targetAccountId] !== undefined) balances[t.targetAccountId] += t.amount;
      }
    });
    return balances;
  }, [transactions, accounts]);

  const filtered = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date);
      let dateMatch = dashboardPeriod === 'month' 
        ? tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
        : tDate.getFullYear() === currentYear;
      if (!dateMatch) return false;
      if (accountFilter === 'all') return true;
      return t.accountId === accountFilter || t.targetAccountId === accountFilter;
    });
  }, [dashboardPeriod, transactions, accountFilter]);

  const summary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    filtered.forEach(t => {
      const isSource = t.accountId === accountFilter || accountFilter === 'all';
      const isTarget = t.targetAccountId === accountFilter || (accountFilter === 'all' && t.type === 'income');

      if (accountFilter === 'all') {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expenses += t.amount;
      } else {
        if (t.type === 'income' && isSource) income += t.amount;
        if (t.type === 'expense' && isSource) expenses += t.amount;
        if (t.type === 'transfer') {
          if (isSource) expenses += t.amount;
          if (isTarget) income += t.amount;
        }
      }
    });
    const balance = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    return { totalIncome: income, totalExpenses: expenses, balance, savingsRate };
  }, [filtered, accountFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <ConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} />
      <AccountsModal isOpen={showAccounts} onClose={() => setShowAccounts(false)} accounts={accounts} onUpdateAccounts={handleUpdateAccounts} />
      
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg"><Wallet className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 leading-none mb-1">Account Manager</h1>
              <div className="flex items-center gap-2">
                {isOnline ? <Wifi className="w-2.5 h-2.5 text-emerald-500" /> : <WifiOff className="w-2.5 h-2.5 text-rose-500" />}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    syncStatus === 'synced' ? 'text-emerald-500' :
                    syncStatus === 'syncing' ? 'text-blue-500' :
                    syncStatus === 'pending' ? 'text-amber-500' :
                    syncStatus === 'error' ? 'text-rose-500' : 'text-gray-400'
                }`}>
                    {syncStatus === 'synced' && 'Synced'}
                    {syncStatus === 'syncing' && 'Syncing...'}
                    {syncStatus === 'pending' && (isOnline ? 'Pending Auto Sync' : 'Waiting for network')}
                    {syncStatus === 'error' && 'Sync Error'}
                    {syncStatus === 'none' && 'Local Only'}
                </span>
                {syncStatus === 'syncing' && <RefreshCw className="w-2 h-2 animate-spin text-blue-500" />}
                {syncStatus === 'synced' && <CloudCheck className="w-2.5 h-2.5 text-emerald-500" />}
              </div>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                {!isOnline && <div className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-gray-800" />}
                {syncStatus === 'pending' && isOnline && <div className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border border-white dark:border-gray-800 animate-pulse" />}
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-2 z-50">
                    {getSyncConfig() && (
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-2">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                                <Cloud className="w-3 h-3" /> Sheets Connected
                            </p>
                            <p className="text-[9px] text-gray-400 mb-2">Automatic sync is active.</p>
                            <div className="flex gap-2 mt-2">
                                <button onClick={handlePushSync} disabled={isSyncing || !isOnline} className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800 transition-colors disabled:opacity-50">
                                    <CloudUpload className="w-3 h-3" /> Force Push
                                </button>
                                <button onClick={handlePullSync} disabled={isSyncing || !isOnline} className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 transition-colors disabled:opacity-50">
                                    <CloudDownload className="w-3 h-3" /> Pull Data
                                </button>
                            </div>
                        </div>
                    )}
                    <button onClick={() => { setActiveTab('full-report'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><ClipboardList className="w-4 h-4" /> Full Report</button>
                    <button onClick={() => { setShowAccounts(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><CreditCard className="w-4 h-4" /> Manage Accounts</button>
                    <button onClick={() => { toggleTheme(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">{theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} {theme === 'light' ? 'Dark Mode' : 'Light Mode'}</button>
                    <button onClick={() => { setShowConfig(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><Settings className="w-4 h-4" /> Sync Settings</button>
                    <button onClick={() => { setActiveTab('lending'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><HandCoins className="w-4 h-4" /> Lending Manager</button>
                    <button onClick={() => { setActiveTab('dashboard'); setDashboardPeriod('month'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><Calendar className="w-4 h-4" /> Monthly Overview</button>
                    <button onClick={() => { setActiveTab('dashboard'); setDashboardPeriod('year'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"><BarChart3 className="w-4 h-4" /> Yearly Overview</button>
                </div>
            )}
          </div>
      </header>

      <main>
        {!isOnline && (
            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-4 py-2 text-[10px] text-center font-bold uppercase tracking-widest border-b border-amber-200 dark:border-amber-800 animate-pulse">
                Offline Mode: Changes will sync once connected
            </div>
        )}
        {activeTab === 'input' && (
            <div className="max-w-xl mx-auto px-4 py-8 pb-24">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Transaction</h2>
                    <p className="text-gray-500 dark:text-gray-400">Track your daily income and spend</p>
                </div>
                <SalaryManager onAddTransaction={handleAddTransaction} accounts={accounts} />
                <TransactionForm onAddTransaction={handleAddTransaction} accounts={accounts} />
            </div>
        )}
        {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto px-4 py-8 pb-24 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div><h2 className="text-2xl font-bold">{dashboardPeriod === 'month' ? 'Monthly' : 'Yearly'} Overview</h2><p className="text-gray-500">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p></div>
                    <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto">
                        <button onClick={() => setAccountFilter('all')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${accountFilter === 'all' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>All</button>
                        {accounts.map(acc => (<button key={acc.id} onClick={() => setAccountFilter(acc.id)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${accountFilter === acc.id ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{acc.name}</button>))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {accounts.map(acc => (accountFilter === 'all' || accountFilter === acc.id) && <SummaryCard key={acc.id} title={acc.name} amount={accountBalances[acc.id] || 0} icon={Banknote} colorClass="text-indigo-600" bgClass="bg-indigo-50 dark:bg-indigo-900/30" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SummaryCard title="Net Flow" amount={summary.balance} icon={Wallet} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
                    <SummaryCard title="Total In" amount={summary.totalIncome} icon={TrendingUp} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
                    <SummaryCard title="Total Out" amount={summary.totalExpenses} icon={TrendingDown} colorClass="text-rose-600" bgClass="bg-rose-50" />
                    <SummaryCard title="Savings Rate" amount={summary.savingsRate} icon={ShieldCheck} colorClass="text-amber-600" bgClass="bg-amber-50" />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2"><FinancialChart transactions={filtered} period={dashboardPeriod} /></div>
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg h-fit">
                        <div className="flex items-center gap-2 mb-4"><Bot className="w-6 h-6" /><h3 className="font-bold text-lg">AI Financial Advisor</h3></div>
                        {aiAdvice ? <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 text-sm leading-relaxed"><ReactMarkdown>{aiAdvice}</ReactMarkdown></div> : <p className="text-indigo-100 text-sm mb-6">Get personalized insights powered by Gemini AI.</p>}
                        <button onClick={handleGetAdvice} disabled={isAiLoading || !isOnline} className="w-full bg-white text-indigo-600 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">{isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} {isAiLoading ? 'Analyzing...' : isOnline ? 'Generate Insights' : 'AI Offline'}</button>
                    </div>
                </div>
            </div>
        )}
        {activeTab === 'bazar' && <BazarView transactions={transactions} accounts={accounts} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />}
        {activeTab === 'bazar-report' && <ReportView title="Bazar Report" icon={BarChartBig} transactions={transactions} accounts={accounts} filterFn={t => t.category === Category.BAZAR} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} colorClass="text-rose-600" bgClass="bg-rose-50" totalLabel="Total Spent" emptyMessage="No records for this month." />}
        {activeTab === 'expense-report' && <ReportView title="Expense Report" icon={Receipt} transactions={transactions} accounts={accounts} filterFn={t => t.type === 'expense'} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} colorClass="text-purple-600" bgClass="bg-purple-50" totalLabel="Total Expenses" emptyMessage="No expenses recorded." />}
        {activeTab === 'full-report' && <FullMonthlyReport transactions={transactions} accounts={accounts} />}
        {activeTab === 'lending' && <LendingView transactions={transactions} accounts={accounts} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />}
        {activeTab === 'history' && <HistoryView transactions={transactions} accounts={accounts} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />}
      </main>

      <BottomNavigation activeTab={activeTab} onTabChange={tab => { setActiveTab(tab); if (tab === 'dashboard') setDashboardPeriod('month'); }} />
    </div>
  );
};

export default App;
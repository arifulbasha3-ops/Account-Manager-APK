import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Transaction } from '../types';

interface FinancialChartProps {
  transactions: Transaction[];
  period: 'month' | 'year';
}

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6'];

const FinancialChart: React.FC<FinancialChartProps> = ({ transactions, period }) => {
  // Process data for Expenses by Category (Pie Chart)
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  })).sort((a, b) => b.value - a.value);

  // Process Bar Chart Data
  let barData = [];
  
  if (period === 'month') {
    // Show daily activity for the filtered month
    const daysMap = new Map();
    transactions.forEach(t => {
      const day = new Date(t.date).getDate();
      if (!daysMap.has(day)) daysMap.set(day, { income: 0, expense: 0 });
      const current = daysMap.get(day);
      if (t.type === 'income') current.income += t.amount;
      else current.expense += t.amount;
    });

    barData = Array.from(daysMap.entries())
      .map(([day, val]) => ({
        name: day.toString(),
        rawDate: day,
        income: val.income,
        expense: val.expense
      }))
      .sort((a, b) => a.rawDate - b.rawDate);
      
  } else {
    // Year view
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsMap = new Map();
    
    months.forEach(m => monthsMap.set(m, { income: 0, expense: 0 }));

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthName = months[date.getMonth()];
      const current = monthsMap.get(monthName);
      if (t.type === 'income') current.income += t.amount;
      else current.expense += t.amount;
    });

    barData = months.map(m => ({
      name: m,
      income: monthsMap.get(m).income,
      expense: monthsMap.get(m).expense
    }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Expense Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Expense Breakdown</h3>
        <div className="h-64">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `Tk ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">No expenses in this period</div>
          )}
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {period === 'month' ? 'Daily Activity' : 'Monthly Activity'}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} tick={{fill: '#6b7280'}} />
              <Tooltip 
                formatter={(value: number) => `Tk ${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FinancialChart;
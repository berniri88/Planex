import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Expense } from '../lib/types';
import { convertCurrency } from '../lib/currency';
import { hapticFeedback } from '../lib/haptics';
import { supabase } from '../lib/supabase';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  
  // Actions
  fetchExpenses: (tripId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  
  // Computed
  getTotalSpent: (tripId: string, mainCurrency: string) => number;
  getBalances: (tripId: string) => any;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      isLoading: false,

      fetchExpenses: async (tripId) => {
        set({ isLoading: true });
        const { data, error } = await supabase.from('expenses').select('*').eq('trip_id', tripId);
        if (error) console.error("Error fetching expenses:", error);
        if (data) set({ expenses: data as any });
        set({ isLoading: false });
      },

      addExpense: async (expense) => {
        const payload = {
          trip_id: expense.tripId,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency || 'USD',
          paid_by_user_id: expense.paid_by === 'me' ? (await supabase.auth.getUser()).data.user?.id : expense.paid_by,
          category: expense.category,
          is_private: expense.is_private,
          date: expense.date
        };

        const { data: newExp, error } = await supabase.from('expenses').insert([payload]).select().single();
        if (error) {
          console.error("Error adding expense:", error);
          return;
        }

        set(state => ({
          expenses: [...state.expenses, newExp as any]
        }));
        hapticFeedback('success');
      },

      removeExpense: async (id) => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) {
          console.error("Error removing expense:", error);
          return;
        }

        set(state => ({
          expenses: state.expenses.filter(e => e.id !== id)
        }));
        hapticFeedback('warning');
      },

      updateExpense: async (id, updates) => {
        const { error } = await supabase.from('expenses').update(updates).eq('id', id);
        if (error) {
          console.error("Error updating expense:", error);
          return;
        }

        set(state => ({
          expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
        }));
      },

      getTotalSpent: (tripId, mainCurrency) => {
        return get().expenses
          .filter(e => (e as any).trip_id === tripId || e.tripId === tripId)
          .reduce((total, e) => {
            const converted = convertCurrency(e.amount, e.currency, mainCurrency, e.exchangeRate);
            return total + converted;
          }, 0);
      },

      getBalances: (_tripId) => {
        return [];
      }
    }),
    {
      name: 'planex-expense-storage',
    }
  )
);

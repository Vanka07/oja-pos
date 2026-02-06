import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import {
  X, Receipt, Store, Zap, Fuel, Users as UsersIcon, Truck,
  Wrench, Smartphone, FileText, HelpCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRetailStore, formatNaira } from '@/store/retailStore';
import { useMemo } from 'react';

const expenseIcons: Record<string, React.ReactNode> = {
  'Rent': <Store size={18} color="#e05e1b" />,
  'Electricity (NEPA)': <Zap size={18} color="#eab308" />,
  'Generator Fuel': <Fuel size={18} color="#ef4444" />,
  'Staff Salary': <UsersIcon size={18} color="#3b82f6" />,
  'Transport': <Truck size={18} color="#8b5cf6" />,
  'Shop Supplies': <Receipt size={18} color="#10b981" />,
  'Repairs': <Wrench size={18} color="#f59e0b" />,
  'Phone/Data': <Smartphone size={18} color="#06b6d4" />,
  'Taxes/Levy': <FileText size={18} color="#64748b" />,
  'Other': <HelpCircle size={18} color="#78716c" />,
};

interface ExpensesListModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExpensesListModal({ visible, onClose }: ExpensesListModalProps) {
  const insets = useSafeAreaInsets();
  const expenses = useRetailStore((s) => s.expenses);
  const getExpensesToday = useRetailStore((s) => s.getExpensesToday);
  const todayExpenses = useMemo(() => getExpensesToday(), [getExpensesToday, expenses]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <View className="bg-white dark:bg-stone-900 rounded-t-3xl max-h-[70%]" style={{ paddingBottom: insets.bottom + 20 }}>
        <View className="p-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-stone-900 dark:text-white text-xl font-bold">Today's Expenses</Text>
            <Pressable onPress={onClose}>
              <X size={24} color="#78716c" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {todayExpenses.length === 0 ? (
              <View className="py-8 items-center">
                <Receipt size={40} color="#57534e" />
                <Text className="text-stone-500 mt-3">No expenses recorded today</Text>
              </View>
            ) : (
              <View className="gap-2">
                {todayExpenses.map((expense) => (
                  <View
                    key={expense.id}
                    className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 flex-row items-center"
                  >
                    <View className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-800 items-center justify-center mr-3">
                      {expenseIcons[expense.category] || expenseIcons['Other']}
                    </View>
                    <View className="flex-1">
                      <Text className="text-stone-900 dark:text-white font-medium">{expense.description}</Text>
                      <Text className="text-stone-500 text-xs">
                        {expense.category} • {expense.paymentMethod}
                      </Text>
                    </View>
                    <Text className="text-red-400 font-bold">{formatNaira(expense.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

import { View, Text, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import {
  X, Store, Zap, Fuel, Users as UsersIcon, Truck, Receipt,
  Wrench, Smartphone, FileText, HelpCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useRetailStore, expenseCategories } from '@/store/retailStore';
import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export const expenseIcons: Record<string, React.ReactNode> = {
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

interface ExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExpenseModal({ visible, onClose }: ExpenseModalProps) {
  const insets = useSafeAreaInsets();
  const addExpense = useRetailStore((s) => s.addExpense);

  const [form, setForm] = useState({
    category: 'Other',
    description: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'pos',
  });

  const handleAdd = useCallback(() => {
    if (!form.amount) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addExpense({
      category: form.category,
      description: form.description.trim() || form.category,
      amount: parseFloat(form.amount) || 0,
      paymentMethod: form.paymentMethod,
    });
    setForm({ category: 'Other', description: '', amount: '', paymentMethod: 'cash' });
    onClose();
  }, [form, addExpense, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <Pressable className="flex-1 bg-black/60" onPress={onClose} />
        <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-stone-900 dark:text-white text-xl font-bold">Add Expense</Text>
                <Pressable onPress={onClose}>
                  <X size={24} color="#78716c" />
                </Pressable>
              </View>

              <View className="gap-4">
                <View>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    {expenseCategories.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setForm({ ...form, category: cat })}
                        className={`mr-2 px-3 py-2 rounded-lg border flex-row items-center gap-2 ${
                          form.category === cat
                            ? 'bg-orange-500/20 border-orange-500'
                            : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700'
                        }`}
                      >
                        {expenseIcons[cat]}
                        <Text className={form.category === cat ? 'text-orange-400 font-medium' : 'text-stone-600 dark:text-stone-400'}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                <View>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Amount (₦) *</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold"
                    placeholder="0"
                    placeholderTextColor="#57534e"
                    keyboardType="numeric"
                    value={form.amount}
                    onChangeText={(text) => setForm({ ...form, amount: text })}
                  />
                </View>

                <View>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Description (Optional)</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
                    placeholder="e.g. Diesel for generator"
                    placeholderTextColor="#57534e"
                    value={form.description}
                    onChangeText={(text) => setForm({ ...form, description: text })}
                  />
                </View>

                <View>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Paid With</Text>
                  <View className="flex-row gap-2">
                    {(['cash', 'transfer', 'pos'] as const).map((method) => (
                      <Pressable
                        key={method}
                        onPress={() => setForm({ ...form, paymentMethod: method })}
                        className={`flex-1 py-3 rounded-lg border ${
                          form.paymentMethod === method
                            ? 'bg-orange-500/20 border-orange-500'
                            : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700'
                        }`}
                      >
                        <Text className={`text-center font-medium capitalize ${
                          form.paymentMethod === method ? 'text-orange-400' : 'text-stone-600 dark:text-stone-400'
                        }`}>
                          {method}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Pressable
                  onPress={handleAdd}
                  className="bg-red-500 py-4 rounded-xl active:opacity-90 mt-2"
                >
                  <Text className="text-white font-semibold text-center text-lg">Record Expense</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

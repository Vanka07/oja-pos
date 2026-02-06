import { View, Text, Pressable, Modal, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useRetailStore, formatNaira } from '@/store/retailStore';
import { useState, useCallback, useMemo } from 'react';
import * as Haptics from 'expo-haptics';

interface CashSessionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CashSessionModal({ visible, onClose }: CashSessionModalProps) {
  const insets = useSafeAreaInsets();
  const [cashAmount, setCashAmount] = useState('');
  const [closingNote, setClosingNote] = useState('');

  const currentCashSession = useRetailStore((s) => s.currentCashSession);
  const openCashSession = useRetailStore((s) => s.openCashSession);
  const closeCashSession = useRetailStore((s) => s.closeCashSession);
  const getExpectedCash = useRetailStore((s) => s.getExpectedCash);
  const expectedCash = useMemo(() => getExpectedCash(), [getExpectedCash, currentCashSession]);

  const handleSubmit = useCallback(() => {
    const amount = parseFloat(cashAmount) || 0;
    if (currentCashSession) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeCashSession(amount, closingNote || undefined);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      openCashSession(amount);
    }
    setCashAmount('');
    setClosingNote('');
    onClose();
  }, [cashAmount, closingNote, currentCashSession, openCashSession, closeCashSession, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <Pressable className="flex-1 bg-black/60" onPress={onClose} />
        <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
          <View className="p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-stone-900 dark:text-white text-xl font-bold">
                {currentCashSession ? 'Close Cash Register' : 'Open Cash Register'}
              </Text>
              <Pressable onPress={onClose}>
                <X size={24} color="#78716c" />
              </Pressable>
            </View>

            {currentCashSession && (
              <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-stone-500 dark:text-stone-400">Opening Cash</Text>
                  <Text className="text-stone-900 dark:text-white font-medium">{formatNaira(currentCashSession.openingCash)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-stone-500 dark:text-stone-400">Expected Cash</Text>
                  <Text className="text-emerald-400 font-bold">{formatNaira(expectedCash)}</Text>
                </View>
              </View>
            )}

            <View className="gap-4">
              <View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">
                  {currentCashSession ? 'Count Your Cash (₦)' : 'Opening Cash (₦)'}
                </Text>
                <TextInput
                  className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold"
                  placeholder="0"
                  placeholderTextColor="#57534e"
                  keyboardType="numeric"
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  autoFocus
                />
              </View>

              {currentCashSession && (
                <View>
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Note (Optional)</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
                    placeholder="e.g. Short by 500 - gave change"
                    placeholderTextColor="#57534e"
                    value={closingNote}
                    onChangeText={setClosingNote}
                  />
                </View>
              )}

              <Pressable
                onPress={handleSubmit}
                className={`py-4 rounded-xl active:opacity-90 ${
                  currentCashSession ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              >
                <Text className="text-white font-semibold text-center text-lg">
                  {currentCashSession ? 'Close Register' : 'Open Register'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

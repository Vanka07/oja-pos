import { View, Text, Pressable, Modal, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PinModal({ visible, onClose, onSuccess }: PinModalProps) {
  const insets = useSafeAreaInsets();
  const currentPin = useAuthStore((s) => s.pin);
  const setPin = useAuthStore((s) => s.setPin);

  const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm'>('new');
  const [currentPinEntry, setCurrentPinEntry] = useState('');
  const [newPinEntry, setNewPinEntry] = useState('');
  const [confirmPinEntry, setConfirmPinEntry] = useState('');
  const [pinError, setPinError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setPinError('');
      setNewPinEntry('');
      setConfirmPinEntry('');
      setCurrentPinEntry('');
      setPinStep(currentPin ? 'current' : 'new');
    }
  }, [visible, currentPin]);

  const handleCurrentPin = useCallback(() => {
    if (currentPinEntry !== currentPin) {
      setPinError('Wrong PIN');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setPinError('');
    setPinStep('new');
  }, [currentPinEntry, currentPin]);

  const handleNewPin = useCallback(() => {
    if (newPinEntry.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }
    setPinError('');
    setPinStep('confirm');
  }, [newPinEntry]);

  const handleConfirmPin = useCallback(() => {
    if (confirmPinEntry !== newPinEntry) {
      setPinError("PINs don't match");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setPin(newPinEntry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    onSuccess();
  }, [confirmPinEntry, newPinEntry, setPin, onClose, onSuccess]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <Pressable className="flex-1 bg-black/60" onPress={onClose} />
        <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
          <View className="p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-stone-900 dark:text-white text-xl font-bold">
                {currentPin ? 'Change PIN' : 'Set PIN'}
              </Text>
              <Pressable onPress={onClose}>
                <X size={24} color="#78716c" />
              </Pressable>
            </View>

            {pinStep === 'current' && (
              <View className="gap-4">
                <Text className="text-stone-500 dark:text-stone-400 text-sm">Enter your current PIN</Text>
                <TextInput
                  className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold tracking-[12px]"
                  placeholder="• • • •"
                  placeholderTextColor="#57534e"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={currentPinEntry}
                  onChangeText={setCurrentPinEntry}
                  autoFocus
                />
                {pinError ? <Text className="text-red-400 text-sm text-center">{pinError}</Text> : null}
                <Pressable onPress={handleCurrentPin} className="bg-orange-500 py-4 rounded-xl active:opacity-90">
                  <Text className="text-white font-semibold text-center text-lg">Continue</Text>
                </Pressable>
              </View>
            )}

            {pinStep === 'new' && (
              <View className="gap-4">
                <Text className="text-stone-500 dark:text-stone-400 text-sm">
                  {currentPin ? 'Enter your new 4-digit PIN' : 'Choose a 4-digit PIN to protect your app'}
                </Text>
                <TextInput
                  className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold tracking-[12px]"
                  placeholder="• • • •"
                  placeholderTextColor="#57534e"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={newPinEntry}
                  onChangeText={setNewPinEntry}
                  autoFocus
                />
                {pinError ? <Text className="text-red-400 text-sm text-center">{pinError}</Text> : null}
                <Pressable onPress={handleNewPin} className="bg-orange-500 py-4 rounded-xl active:opacity-90">
                  <Text className="text-white font-semibold text-center text-lg">Continue</Text>
                </Pressable>
              </View>
            )}

            {pinStep === 'confirm' && (
              <View className="gap-4">
                <Text className="text-stone-500 dark:text-stone-400 text-sm">Confirm your PIN</Text>
                <TextInput
                  className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold tracking-[12px]"
                  placeholder="• • • •"
                  placeholderTextColor="#57534e"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={confirmPinEntry}
                  onChangeText={setConfirmPinEntry}
                  autoFocus
                />
                {pinError ? <Text className="text-red-400 text-sm text-center">{pinError}</Text> : null}
                <Pressable onPress={handleConfirmPin} className="bg-emerald-500 py-4 rounded-xl active:opacity-90">
                  <Text className="text-white font-semibold text-center text-lg">
                    {currentPin ? 'Update PIN' : 'Set PIN'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

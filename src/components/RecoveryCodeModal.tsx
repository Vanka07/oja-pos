import { View, Text, Pressable, Modal, Linking } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface RecoveryCodeModalProps {
  visible: boolean;
  onClose: () => void;
  recoveryCode: string | null;
}

export default function RecoveryCodeModal({ visible, onClose, recoveryCode }: RecoveryCodeModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable className="flex-1 bg-black/60" onPress={onClose} />
        <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
          <View className="p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-stone-900 dark:text-white text-xl font-bold">Recovery Code</Text>
              <Pressable onPress={onClose}>
                <X size={24} color="#78716c" />
              </Pressable>
            </View>

            <Text className="text-stone-500 dark:text-stone-400 text-sm mb-4">
              Use this code to reset your PIN if you forget it. Keep it safe!
            </Text>

            <View className="bg-stone-100 dark:bg-stone-800 border-2 border-dashed border-orange-500/50 rounded-2xl py-6 px-10 mb-6">
              <Text className="text-orange-500 text-3xl font-bold tracking-[8px] text-center">
                {recoveryCode}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const message = `🔐 Oja POS Recovery Code: ${recoveryCode}\n\nKeep this message safe! You'll need this code if you forget your PIN.\n\nDo NOT share this code with anyone.`;
                const encoded = encodeURIComponent(message);
                Linking.openURL(`https://wa.me/?text=${encoded}`).catch(() => {
                  Linking.openURL(`whatsapp://send?text=${encoded}`).catch(() => {});
                });
              }}
              className="bg-emerald-500 py-4 rounded-xl active:opacity-90 mb-3"
            >
              <Text className="text-white font-semibold text-center text-lg">Send to WhatsApp</Text>
            </Pressable>

            <Pressable onPress={onClose} className="py-3">
              <Text className="text-stone-500 text-center font-medium">Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

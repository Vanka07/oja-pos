import { View, Text, Pressable, Modal } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type DialogVariant = 'destructive' | 'info' | 'success' | 'warning';

interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  /** If true, only show a single dismiss button (no confirm/cancel pair) */
  showCancel?: boolean;
}

const VARIANT_CONFIG: Record<DialogVariant, {
  icon: typeof AlertTriangle;
  iconColor: string;
  iconBg: string;
  confirmBg: string;
  confirmText: string;
}> = {
  destructive: {
    icon: AlertTriangle,
    iconColor: '#ef4444',
    iconBg: 'bg-red-500/15',
    confirmBg: 'bg-red-500',
    confirmText: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#f59e0b',
    iconBg: 'bg-amber-500/15',
    confirmBg: 'bg-amber-500',
    confirmText: 'text-white',
  },
  info: {
    icon: Info,
    iconColor: '#3b82f6',
    iconBg: 'bg-blue-500/15',
    confirmBg: 'bg-blue-500',
    confirmText: 'text-white',
  },
  success: {
    icon: CheckCircle,
    iconColor: '#10b981',
    iconBg: 'bg-emerald-500/15',
    confirmBg: 'bg-emerald-500',
    confirmText: 'text-white',
  },
};

export default function ConfirmDialog({
  visible,
  onClose,
  title,
  message,
  variant = 'destructive',
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  showCancel = true,
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    if (variant === 'destructive') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onConfirm?.();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/60 items-center justify-center px-8"
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={SlideInDown.duration(300).springify().damping(20)}
            className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-sm"
          >
            {/* Icon */}
            <View className="items-center mb-4">
              <View className={`w-14 h-14 rounded-full ${config.iconBg} items-center justify-center`}>
                <IconComponent size={28} color={config.iconColor} />
              </View>
            </View>

            {/* Title */}
            <Text className="text-stone-900 dark:text-white text-lg font-bold text-center mb-2">
              {title}
            </Text>

            {/* Message */}
            <Text className="text-stone-500 dark:text-stone-400 text-sm text-center leading-5 mb-6">
              {message}
            </Text>

            {/* Actions */}
            <View className="gap-3">
              {onConfirm && (
                <Pressable
                  onPress={handleConfirm}
                  className={`${config.confirmBg} py-3.5 rounded-xl active:opacity-90`}
                >
                  <Text className={`${config.confirmText} font-semibold text-center text-base`}>
                    {confirmLabel || (variant === 'destructive' ? 'Delete' : 'OK')}
                  </Text>
                </Pressable>
              )}
              {showCancel ? (
                <Pressable
                  onPress={onClose}
                  className="bg-stone-200 dark:bg-stone-800 py-3.5 rounded-xl active:opacity-90"
                >
                  <Text className="text-stone-700 dark:text-stone-300 font-medium text-center text-base">
                    {onConfirm ? cancelLabel : 'OK'}
                  </Text>
                </Pressable>
              ) : !onConfirm ? (
                <Pressable
                  onPress={onClose}
                  className="bg-stone-200 dark:bg-stone-800 py-3.5 rounded-xl active:opacity-90"
                >
                  <Text className="text-stone-700 dark:text-stone-300 font-medium text-center text-base">
                    OK
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';


export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-stone-50 dark:bg-stone-950">
      <Text className="text-xl font-bold text-stone-900 dark:text-white">Modal</Text>
      <View className="my-8 h-px w-4/5 bg-stone-200 dark:bg-stone-800" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

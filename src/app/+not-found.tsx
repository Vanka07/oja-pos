import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-stone-50 p-5 dark:bg-stone-950">
        <Text className="text-xl font-bold text-stone-900 dark:text-white">
          This screen doesn't exist.
        </Text>

        <Link href="/" className="mt-4 py-4">
          <Text className="text-sm text-orange-500">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

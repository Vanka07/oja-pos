import { View, Text, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Store, X, RotateCcw } from 'lucide-react-native';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

export default function ShopProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const canManageShop = !currentStaff || hasPermission(currentStaff.role, 'manage_shop');

  useEffect(() => {
    if (!canManageShop) router.back();
  }, [canManageShop, router]);

  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const setShopInfo = useOnboardingStore((s) => s.setShopInfo);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  const [name, setName] = useState(shopInfo?.name || '');
  const [ownerName, setOwnerName] = useState(shopInfo?.ownerName || '');
  const [phone, setPhone] = useState(shopInfo?.phone || '');
  const [address, setAddress] = useState(shopInfo?.address || '');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a shop name');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShopInfo({
      name: name.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      currency: 'NGN',
    });
    router.back();
  };

  const handleReset = () => {
    Alert.alert(
      'Reset App',
      'This will erase all your shop settings and take you back to the setup screen. Your sales and inventory data will remain until you set up again.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetOnboarding();
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={isDark ? ['#292524', '#1c1917', '#0c0a09'] : ['#f5f5f4', '#fafaf9', '#ffffff']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingTop: insets.top + 8 }} className="px-5">
            <View className="flex-row items-center justify-between mb-6">
              <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                <Text className="text-stone-900 dark:text-white text-2xl font-bold">Shop Profile</Text>
                <Text className="text-stone-500 text-sm mt-1">Edit your shop information</Text>
              </Animated.View>
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center"
              >
                <X size={20} color="#a8a29e" />
              </Pressable>
            </View>
          </View>

          {/* Shop Icon */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} className="items-center mb-6">
            <View className="w-20 h-20 rounded-2xl bg-orange-500/20 items-center justify-center">
              <Store size={36} color="#f97316" />
            </View>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} className="px-5 gap-4">
            <View>
              <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Shop Name *</Text>
              <TextInput
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-base"
                placeholder="e.g. Mama Nkechi Store"
                placeholderTextColor="#57534e"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View>
              <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Owner Name</Text>
              <TextInput
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-base"
                placeholder="e.g. Nkechi Okafor"
                placeholderTextColor="#57534e"
                value={ownerName}
                onChangeText={setOwnerName}
              />
            </View>

            <View>
              <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Phone Number</Text>
              <TextInput
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-base"
                placeholder="e.g. 08031234567"
                placeholderTextColor="#57534e"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View>
              <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Address</Text>
              <TextInput
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-base"
                placeholder="e.g. 12 Market Road, Ikeja"
                placeholderTextColor="#57534e"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>

            <View>
              <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Currency</Text>
              <View className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-4">
                <Text className="text-stone-500 text-base">🇳🇬 Nigerian Naira (₦ NGN)</Text>
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              className="bg-orange-500 py-4 rounded-xl active:opacity-90 mt-2"
            >
              <Text className="text-white font-semibold text-center text-lg">Save Changes</Text>
            </Pressable>

            {/* Reset App */}
            <View className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
              <Text className="text-stone-600 dark:text-stone-400 text-xs uppercase tracking-wide mb-3">Danger Zone</Text>
              <Pressable
                onPress={handleReset}
                className="bg-red-500/10 border border-red-500/30 py-4 rounded-xl active:opacity-90 flex-row items-center justify-center gap-2"
              >
                <RotateCcw size={18} color="#ef4444" />
                <Text className="text-red-400 font-semibold text-center text-base">Reset App</Text>
              </Pressable>
              <Text className="text-stone-600 dark:text-stone-400 text-xs text-center mt-2">
                This will take you back to the onboarding screen
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Store, User, Phone, MapPin, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';
import * as Haptics from 'expo-haptics';

export default function OnboardingSetup() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setShopInfo = useOnboardingStore((s) => s.setShopInfo);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Shop name is required';
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Your name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid 11-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setShopInfo({
      name: formData.name.trim(),
      ownerName: formData.ownerName.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      currency: 'NGN',
    });

    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-stone-950">
      <LinearGradient
        colors={['#292524', '#1c1917', '#0c0a09']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6" style={{ paddingTop: insets.top + 40 }}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(600)}>
              <View className="w-16 h-16 rounded-2xl bg-orange-500/20 items-center justify-center mb-6">
                <Store size={32} color="#f97316" />
              </View>
              <Text className="text-white text-3xl font-bold mb-2">
                Set up your shop
              </Text>
              <Text className="text-stone-400 text-base mb-8">
                Tell us about your business so we can personalize Oja for you.
              </Text>
            </Animated.View>

            {/* Form */}
            <View className="gap-5">
              <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                <Text className="text-stone-400 text-sm mb-2 ml-1">Shop Name *</Text>
                <View className={`bg-stone-900/80 rounded-xl flex-row items-center px-4 border ${errors.name ? 'border-red-500' : 'border-stone-800'}`}>
                  <Store size={20} color="#78716c" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-white text-base"
                    placeholder="e.g. Mama Titi Supermarket"
                    placeholderTextColor="#57534e"
                    value={formData.name}
                    onChangeText={(text) => {
                      setFormData({ ...formData, name: text });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                  />
                </View>
                {errors.name && (
                  <Text className="text-red-400 text-xs mt-1 ml-1">{errors.name}</Text>
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                <Text className="text-stone-400 text-sm mb-2 ml-1">Your Name *</Text>
                <View className={`bg-stone-900/80 rounded-xl flex-row items-center px-4 border ${errors.ownerName ? 'border-red-500' : 'border-stone-800'}`}>
                  <User size={20} color="#78716c" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-white text-base"
                    placeholder="e.g. Adaobi Okonkwo"
                    placeholderTextColor="#57534e"
                    value={formData.ownerName}
                    onChangeText={(text) => {
                      setFormData({ ...formData, ownerName: text });
                      if (errors.ownerName) setErrors({ ...errors, ownerName: '' });
                    }}
                  />
                </View>
                {errors.ownerName && (
                  <Text className="text-red-400 text-xs mt-1 ml-1">{errors.ownerName}</Text>
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                <Text className="text-stone-400 text-sm mb-2 ml-1">Phone Number *</Text>
                <View className={`bg-stone-900/80 rounded-xl flex-row items-center px-4 border ${errors.phone ? 'border-red-500' : 'border-stone-800'}`}>
                  <Phone size={20} color="#78716c" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-white text-base"
                    placeholder="e.g. 08012345678"
                    placeholderTextColor="#57534e"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => {
                      setFormData({ ...formData, phone: text });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                  />
                </View>
                {errors.phone && (
                  <Text className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</Text>
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(500).duration(600)}>
                <Text className="text-stone-400 text-sm mb-2 ml-1">Shop Address (Optional)</Text>
                <View className="bg-stone-900/80 rounded-xl flex-row items-center px-4 border border-stone-800">
                  <MapPin size={20} color="#78716c" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-white text-base"
                    placeholder="e.g. 15 Market Road, Ikeja, Lagos"
                    placeholderTextColor="#57534e"
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                  />
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Bottom Button */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(600)}
            className="px-6"
            style={{ paddingBottom: insets.bottom + 20, paddingTop: 20 }}
          >
            <Pressable
              onPress={handleComplete}
              className="active:scale-98"
            >
              <LinearGradient
                colors={['#ea580c', '#c2410c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Check size={20} color="white" />
                <Text className="text-white text-lg font-semibold">Start Using Oja</Text>
              </LinearGradient>
            </Pressable>

            <Text className="text-stone-600 text-xs text-center mt-4">
              You can change these details later in Settings
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

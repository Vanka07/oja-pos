import { View, Text, Pressable, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatNaira } from '@/store/retailStore';
import { useState, useMemo } from 'react';

interface PriceCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PriceCalculatorModal({ visible, onClose }: PriceCalculatorModalProps) {
  const insets = useSafeAreaInsets();
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [targetMargin, setTargetMargin] = useState('20');

  const calculatedMargin = useMemo(() => {
    const cost = parseFloat(costPrice) || 0;
    const sell = parseFloat(sellingPrice) || 0;
    if (cost === 0 || sell === 0) return null;
    const profit = sell - cost;
    const margin = (profit / sell) * 100;
    return { profit, margin };
  }, [costPrice, sellingPrice]);

  const suggestedPrice = useMemo(() => {
    const cost = parseFloat(costPrice) || 0;
    const margin = parseFloat(targetMargin) || 20;
    if (cost === 0) return null;
    return cost / (1 - margin / 100);
  }, [costPrice, targetMargin]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <Pressable className="flex-1 bg-black/60" onPress={onClose} />
        <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-stone-900 dark:text-white text-xl font-bold">Price Calculator</Text>
                <Pressable onPress={onClose}>
                  <X size={24} color="#78716c" />
                </Pressable>
              </View>

              <View className="gap-4">
                {/* Calculate Margin */}
                <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4">
                  <Text className="text-stone-900 dark:text-white font-medium mb-3">Calculate Profit Margin</Text>
                  <View className="flex-row gap-3 mb-3">
                    <View className="flex-1">
                      <Text className="text-stone-500 dark:text-stone-400 text-xs mb-1">Cost Price</Text>
                      <TextInput
                        className="bg-stone-200 dark:bg-stone-800 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                        placeholder="0"
                        placeholderTextColor="#57534e"
                        keyboardType="numeric"
                        value={costPrice}
                        onChangeText={setCostPrice}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-stone-500 dark:text-stone-400 text-xs mb-1">Selling Price</Text>
                      <TextInput
                        className="bg-stone-200 dark:bg-stone-800 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                        placeholder="0"
                        placeholderTextColor="#57534e"
                        keyboardType="numeric"
                        value={sellingPrice}
                        onChangeText={setSellingPrice}
                      />
                    </View>
                  </View>
                  {calculatedMargin && (
                    <View className="bg-stone-200 dark:bg-stone-800 rounded-lg p-3 flex-row justify-between">
                      <View>
                        <Text className="text-stone-500 dark:text-stone-400 text-xs">Profit</Text>
                        <Text className="text-emerald-400 font-bold">{formatNaira(calculatedMargin.profit)}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-stone-500 dark:text-stone-400 text-xs">Margin</Text>
                        <Text className="text-emerald-400 font-bold">{calculatedMargin.margin.toFixed(1)}%</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Suggest Price */}
                <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4">
                  <Text className="text-stone-900 dark:text-white font-medium mb-3">Suggest Selling Price</Text>
                  <View className="flex-row gap-3 mb-3">
                    <View className="flex-1">
                      <Text className="text-stone-500 dark:text-stone-400 text-xs mb-1">Cost Price</Text>
                      <TextInput
                        className="bg-stone-200 dark:bg-stone-800 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                        placeholder="0"
                        placeholderTextColor="#57534e"
                        keyboardType="numeric"
                        value={costPrice}
                        onChangeText={setCostPrice}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-stone-500 dark:text-stone-400 text-xs mb-1">Target Margin %</Text>
                      <TextInput
                        className="bg-stone-200 dark:bg-stone-800 rounded-lg px-3 py-2 text-stone-900 dark:text-white"
                        placeholder="20"
                        placeholderTextColor="#57534e"
                        keyboardType="numeric"
                        value={targetMargin}
                        onChangeText={setTargetMargin}
                      />
                    </View>
                  </View>
                  {suggestedPrice && (
                    <View className="bg-emerald-500/20 rounded-lg p-3 border border-emerald-500/30">
                      <Text className="text-emerald-400 text-xs mb-1">Suggested Selling Price</Text>
                      <Text className="text-emerald-400 text-2xl font-bold">{formatNaira(Math.ceil(suggestedPrice / 10) * 10)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

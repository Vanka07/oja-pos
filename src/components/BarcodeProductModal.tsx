import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { X, Package, Globe, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { lookupBarcode, type BarcodeResult } from '@/lib/barcodeLookup';
import { useRetailStore } from '@/store/retailStore';

interface BarcodeProductModalProps {
  visible: boolean;
  barcode: string;
  onClose: () => void;
  onAddProduct: (product: {
    name: string;
    barcode: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    quantity: number;
    unit: string;
    lowStockThreshold: number;
    imageUrl?: string;
  }, addToCart: boolean) => void;
}

export default function BarcodeProductModal({
  visible,
  barcode,
  onClose,
  onAddProduct,
}: BarcodeProductModalProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const categories = useRetailStore((s) => s.categories);

  const [loading, setLoading] = useState(true);
  const [lookupResult, setLookupResult] = useState<BarcodeResult | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Look up barcode when modal opens
  useEffect(() => {
    if (visible && barcode) {
      setLoading(true);
      setLookupResult(null);
      setName('');
      setCategory('');
      setCostPrice('');
      setSellingPrice('');

      lookupBarcode(barcode).then((result) => {
        setLookupResult(result);
        if (result.found) {
          setName(result.name || '');
          setCategory(result.category || '');
        }
        setLoading(false);
      });
    }
  }, [visible, barcode]);

  const handleSubmit = (addToCart: boolean) => {
    const cost = parseFloat(costPrice) || 0;
    const selling = parseFloat(sellingPrice) || 0;

    if (!name.trim()) return;
    if (selling <= 0) return;

    onAddProduct(
      {
        name: name.trim(),
        barcode,
        category: category || 'General',
        costPrice: cost,
        sellingPrice: selling,
        quantity: 1,
        unit: 'pcs',
        lowStockThreshold: 5,
        imageUrl: lookupResult?.imageUrl,
      },
      addToCart,
    );
  };

  const isValid = name.trim().length > 0 && parseFloat(sellingPrice) > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable className="flex-1 bg-black/60" onPress={onClose} />
        <View
          className="bg-white dark:bg-stone-950 rounded-t-3xl"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 560 }}
          >
            <View className="p-6">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-stone-900 dark:text-white text-xl font-bold">
                  Product Not in Inventory
                </Text>
                <Pressable
                  onPress={onClose}
                  className="bg-stone-200 dark:bg-stone-800 w-9 h-9 rounded-full items-center justify-center"
                >
                  <X size={18} color={isDark ? '#a8a29e' : '#57534e'} />
                </Pressable>
              </View>

              {/* Barcode display */}
              <View className="bg-stone-100 dark:bg-stone-900 rounded-xl px-4 py-2 mb-4 flex-row items-center gap-2">
                <Package size={16} color="#e05e1b" />
                <Text className="text-stone-600 dark:text-stone-400 text-sm font-mono">
                  Barcode: {barcode}
                </Text>
              </View>

              {/* Loading state */}
              {loading && (
                <Animated.View
                  entering={FadeInUp.duration(300)}
                  className="items-center py-8"
                >
                  <ActivityIndicator size="large" color="#e05e1b" />
                  <Text className="text-stone-500 dark:text-stone-400 mt-3 text-sm">
                    Searching online database...
                  </Text>
                </Animated.View>
              )}

              {/* Lookup result */}
              {!loading && lookupResult?.found && (
                <Animated.View
                  entering={FadeInUp.duration(300)}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4"
                >
                  <View className="flex-row items-center gap-2 mb-3">
                    <Globe size={16} color="#10b981" />
                    <Text className="text-emerald-400 font-semibold text-sm">
                      Found product online!
                    </Text>
                  </View>
                  <View className="flex-row gap-3">
                    {lookupResult.imageUrl && (
                      <Image
                        source={{ uri: lookupResult.imageUrl }}
                        className="w-16 h-16 rounded-lg bg-stone-200 dark:bg-stone-800"
                        resizeMode="contain"
                      />
                    )}
                    <View className="flex-1">
                      <Text className="text-stone-900 dark:text-white font-semibold text-base">
                        {lookupResult.name}
                      </Text>
                      {lookupResult.brand && (
                        <Text className="text-stone-500 dark:text-stone-400 text-sm">
                          {lookupResult.brand}
                        </Text>
                      )}
                      {lookupResult.quantity && (
                        <Text className="text-stone-500 dark:text-stone-400 text-xs mt-1">
                          {lookupResult.quantity}
                        </Text>
                      )}
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Not found online */}
              {!loading && !lookupResult?.found && (
                <Animated.View
                  entering={FadeInUp.duration(300)}
                  className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 flex-row items-center gap-3"
                >
                  <AlertCircle size={20} color="#f59e0b" />
                  <Text className="text-amber-400 font-medium text-sm flex-1">
                    Product not found online. Fill in the details below.
                  </Text>
                </Animated.View>
              )}

              {/* Form */}
              {!loading && (
                <Animated.View entering={FadeInUp.delay(100).duration(300)}>
                  {/* Product Name */}
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-1.5 font-medium">
                    Product Name *
                  </Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white text-base mb-4 border border-stone-200 dark:border-stone-700"
                    placeholder="e.g. Indomie Chicken 70g"
                    placeholderTextColor="#78716c"
                    value={name}
                    onChangeText={setName}
                  />

                  {/* Category */}
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-1.5 font-medium">
                    Category
                  </Text>
                  <Pressable
                    onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                    className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 mb-1 border border-stone-200 dark:border-stone-700"
                  >
                    <Text
                      className={
                        category
                          ? 'text-stone-900 dark:text-white text-base'
                          : 'text-stone-400 text-base'
                      }
                    >
                      {category || 'Select category'}
                    </Text>
                  </Pressable>
                  {showCategoryPicker && (
                    <View className="bg-stone-100 dark:bg-stone-800 rounded-xl mb-3 border border-stone-200 dark:border-stone-700 overflow-hidden">
                      {categories.map((cat) => (
                        <Pressable
                          key={cat.id}
                          onPress={() => {
                            setCategory(cat.name);
                            setShowCategoryPicker(false);
                          }}
                          className={`px-4 py-2.5 border-b border-stone-200 dark:border-stone-700 ${
                            category === cat.name ? 'bg-orange-500/10' : ''
                          }`}
                        >
                          <Text
                            className={
                              category === cat.name
                                ? 'text-orange-400 font-medium'
                                : 'text-stone-700 dark:text-stone-300'
                            }
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {!showCategoryPicker && <View className="mb-3" />}

                  {/* Prices */}
                  <View className="flex-row gap-3 mb-6">
                    <View className="flex-1">
                      <Text className="text-stone-500 dark:text-stone-400 text-sm mb-1.5 font-medium">
                        Cost Price (₦)
                      </Text>
                      <TextInput
                        className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white text-base border border-stone-200 dark:border-stone-700"
                        placeholder="0"
                        placeholderTextColor="#78716c"
                        keyboardType="numeric"
                        value={costPrice}
                        onChangeText={setCostPrice}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-stone-500 dark:text-stone-400 text-sm mb-1.5 font-medium">
                        Selling Price (₦) *
                      </Text>
                      <TextInput
                        className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white text-base border border-stone-200 dark:border-stone-700"
                        placeholder="0"
                        placeholderTextColor="#78716c"
                        keyboardType="numeric"
                        value={sellingPrice}
                        onChangeText={setSellingPrice}
                      />
                    </View>
                  </View>

                  {/* Buttons */}
                  <Pressable
                    onPress={() => handleSubmit(true)}
                    disabled={!isValid}
                    className={`py-4 rounded-xl mb-3 active:opacity-90 ${
                      isValid ? 'bg-[#e05e1b]' : 'bg-stone-300 dark:bg-stone-700'
                    }`}
                  >
                    <Text
                      className={`text-center font-bold text-base ${
                        isValid ? 'text-white' : 'text-stone-500'
                      }`}
                    >
                      Add to Inventory & Sell
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleSubmit(false)}
                    disabled={!isValid}
                    className={`py-4 rounded-xl border active:opacity-90 ${
                      isValid
                        ? 'border-[#e05e1b] bg-[#e05e1b]/10'
                        : 'border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold text-base ${
                        isValid ? 'text-[#e05e1b]' : 'text-stone-500'
                      }`}
                    >
                      Add to Inventory Only
                    </Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

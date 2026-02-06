import { View, Text, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  X,
  Save,
  TrendingUp,
  TrendingDown,
  Trash2,
  Package,
} from 'lucide-react-native';
import { useRetailStore, formatNaira, type Product } from '@/store/retailStore';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { getPlaceholders } from '@/lib/placeholderConfig';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useState, useCallback, useMemo, useEffect } from 'react';
import * as Haptics from 'expo-haptics';

export default function ProductEditScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams<{ productId: string }>();

  const currentStaff = useStaffStore((s) => s.currentStaff);
  const canEdit = !currentStaff || hasPermission(currentStaff.role, 'edit_product');

  // Redirect if no permission
  useEffect(() => {
    if (!canEdit) router.back();
  }, [canEdit, router]);

  const businessType = useOnboardingStore((s) => s.businessType);
  const placeholders = getPlaceholders(businessType);

  const products = useRetailStore((s) => s.products);
  const categories = useRetailStore((s) => s.categories);
  const updateProduct = useRetailStore((s) => s.updateProduct);
  const deleteProduct = useRetailStore((s) => s.deleteProduct);
  const adjustStock = useRetailStore((s) => s.adjustStock);
  const logActivity = useStaffStore((s) => s.logActivity);

  const product = useMemo(
    () => products.find((p) => p.id === params.productId),
    [products, params.productId]
  );

  const [formData, setFormData] = useState({
    name: product?.name ?? '',
    barcode: product?.barcode ?? '',
    category: product?.category ?? 'Provisions',
    costPrice: product?.costPrice?.toString() ?? '',
    sellingPrice: product?.sellingPrice?.toString() ?? '',
    unit: product?.unit ?? 'pcs',
    lowStockThreshold: product?.lowStockThreshold?.toString() ?? '10',
  });

  const [stockAdjustment, setStockAdjustment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const unitOptions = ['pcs', 'pack', 'tin', 'bottle', 'bar', 'bag', 'carton', 'kg', 'litre'];

  const handleSave = useCallback(() => {
    if (!product || !formData.name || !formData.costPrice || !formData.sellingPrice) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProduct(product.id, {
      name: formData.name,
      barcode: formData.barcode,
      category: formData.category,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      unit: formData.unit,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
    });
    router.back();
  }, [product, formData, updateProduct, router]);

  const handleStockAdjust = useCallback(
    (type: 'add' | 'remove') => {
      if (!product || !stockAdjustment) return;
      const amount = parseInt(stockAdjustment) || 0;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      adjustStock(product.id, type === 'add' ? amount : -amount);
      if (type === 'add') {
        logActivity('restock', `Restocked ${product.name} (+${amount})`);
      }
      setStockAdjustment('');
    },
    [product, stockAdjustment, adjustStock, logActivity]
  );

  const handleDelete = useCallback(() => {
    if (!product) return;
    setShowDeleteConfirm(true);
  }, [product]);

  const confirmDelete = useCallback(() => {
    if (!product) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteProduct(product.id);
    router.back();
  }, [product, deleteProduct, router]);

  if (!product) {
    return (
      <View className="flex-1 bg-stone-50 dark:bg-stone-950 items-center justify-center">
        <Package size={48} color="#78716c" />
        <Text className="text-stone-400 mt-4 text-lg">Product not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-6 py-3 bg-stone-200 dark:bg-stone-800 rounded-xl">
          <Text className="text-stone-900 dark:text-white font-medium">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={isDark ? ['#292524', '#1c1917', '#0c0a09'] : ['#f5f5f4', '#fafaf9', '#ffffff']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="px-5 pb-4 flex-row items-center justify-between"
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center active:scale-95"
          >
            <X size={20} color="#a8a29e" />
          </Pressable>
          <Text className="text-stone-900 dark:text-white text-lg font-bold">Edit Product</Text>
          <Pressable
            onPress={handleSave}
            className="bg-orange-500 px-5 py-2.5 rounded-full flex-row items-center gap-2 active:scale-95"
          >
            <Save size={16} color="white" />
            <Text className="text-white font-semibold">Save</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Product Details Section */}
          <View className="px-5 mt-2">
            <Text className="text-stone-500 text-xs uppercase tracking-wide mb-4 font-medium">
              Product Details
            </Text>

            <View className="gap-4">
              <View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Product Name *</Text>
                <TextInput
                  className="bg-stone-100 dark:bg-stone-900 rounded-xl px-4 py-3.5 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800"
                  placeholder={placeholders.productName}
                  placeholderTextColor="#57534e"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Barcode</Text>
                <TextInput
                  className="bg-stone-100 dark:bg-stone-900 rounded-xl px-4 py-3.5 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800"
                  placeholder="Scan or enter barcode"
                  placeholderTextColor="#57534e"
                  value={formData.barcode}
                  onChangeText={(text) => setFormData({ ...formData, barcode: text })}
                />
              </View>

              <View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0 }}
                >
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setFormData({ ...formData, category: cat.name })}
                      className={`mr-2 px-4 py-2 rounded-full border ${
                        formData.category === cat.name
                          ? 'bg-orange-500 border-orange-500'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <Text
                        className={
                          formData.category === cat.name
                            ? 'text-white font-medium'
                            : 'text-stone-600 dark:text-stone-400'
                        }
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Cost Price (₦) *</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-900 rounded-xl px-4 py-3.5 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800"
                    placeholder="0"
                    placeholderTextColor="#57534e"
                    keyboardType="numeric"
                    value={formData.costPrice}
                    onChangeText={(text) => setFormData({ ...formData, costPrice: text })}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Selling Price (₦) *</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-900 rounded-xl px-4 py-3.5 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800"
                    placeholder="0"
                    placeholderTextColor="#57534e"
                    keyboardType="numeric"
                    value={formData.sellingPrice}
                    onChangeText={(text) => setFormData({ ...formData, sellingPrice: text })}
                  />
                </View>
              </View>

              {/* Margin preview */}
              {formData.costPrice && formData.sellingPrice && parseFloat(formData.sellingPrice) > 0 && (
                <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex-row items-center justify-between">
                  <Text className="text-emerald-400 text-sm">Profit Margin</Text>
                  <Text className="text-emerald-400 font-bold">
                    {(
                      ((parseFloat(formData.sellingPrice) - parseFloat(formData.costPrice)) /
                        parseFloat(formData.sellingPrice)) *
                      100
                    ).toFixed(0)}
                    % ({formatNaira(parseFloat(formData.sellingPrice) - parseFloat(formData.costPrice))})
                  </Text>
                </View>
              )}

              <View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Unit</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0 }}
                >
                  {unitOptions.map((unit) => (
                    <Pressable
                      key={unit}
                      onPress={() => setFormData({ ...formData, unit })}
                      className={`mr-2 px-4 py-2 rounded-full border ${
                        formData.unit === unit
                          ? 'bg-orange-500 border-orange-500'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <Text
                        className={
                          formData.unit === unit ? 'text-white font-medium' : 'text-stone-600 dark:text-stone-400'
                        }
                      >
                        {unit}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm mb-1">Low Stock Alert</Text>
                <Text className="text-stone-500 text-xs mb-2">Alert when stock falls below</Text>
                <TextInput
                  className="bg-stone-100 dark:bg-stone-900 rounded-xl px-4 py-3.5 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800"
                  placeholder="10"
                  placeholderTextColor="#57534e"
                  keyboardType="numeric"
                  value={formData.lowStockThreshold}
                  onChangeText={(text) =>
                    setFormData({ ...formData, lowStockThreshold: text })
                  }
                />
              </View>
            </View>
          </View>

          {/* Stock Adjustment Section */}
          <View className="px-5 mt-8">
            <Text className="text-stone-500 text-xs uppercase tracking-wide mb-4 font-medium">
              Stock Adjustment
            </Text>

            <View className="bg-white/80 dark:bg-stone-900/80 rounded-2xl border border-stone-200 dark:border-stone-800 p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-stone-500 dark:text-stone-400 text-sm">Current Stock</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-stone-900 dark:text-white font-bold text-2xl">{product.quantity}</Text>
                  <Text className="text-stone-500">{product.unit}</Text>
                </View>
              </View>

              <View className="mb-4">
                <TextInput
                  className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold border border-stone-200 dark:border-stone-700"
                  placeholder="0"
                  placeholderTextColor="#57534e"
                  keyboardType="numeric"
                  value={stockAdjustment}
                  onChangeText={setStockAdjustment}
                />
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => handleStockAdjust('remove')}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-red-500/20 border border-red-500/40 py-3.5 rounded-xl active:opacity-90"
                >
                  <TrendingDown size={18} color="#ef4444" />
                  <Text className="text-red-400 font-semibold">Remove</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleStockAdjust('add')}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/40 py-3.5 rounded-xl active:opacity-90"
                >
                  <TrendingUp size={18} color="#10b981" />
                  <Text className="text-emerald-400 font-semibold">Add Stock</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Delete Section */}
          <View className="px-5 mt-8">
            <Pressable
              onPress={handleDelete}
              className="flex-row items-center justify-center gap-2 py-4 border border-red-500/30 rounded-xl active:opacity-80"
            >
              <Trash2 size={18} color="#ef4444" />
              <Text className="text-red-400 font-medium">Delete Product</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Product Confirmation */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Product"
        message={product ? `Are you sure you want to delete "${product.name}"? This cannot be undone.` : ''}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </View>
  );
}

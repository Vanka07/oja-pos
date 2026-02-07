import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  X,
  TrendingUp,
  TrendingDown,
  Pencil,
} from 'lucide-react-native';
import { useRetailStore, formatNaira, type Product } from '@/store/retailStore';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import { canAccess, FREE_PRODUCT_LIMIT, FEATURE_DESCRIPTIONS } from '@/lib/premiumFeatures';
import PremiumUpsell from '@/components/PremiumUpsell';
import { useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'nativewind';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import EmptyState from '@/components/EmptyState';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';
import { getPlaceholders } from '@/lib/placeholderConfig';
import { track } from '@/lib/analytics';

const generateInternalBarcode = () =>
  `INT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [noBarcode, setNoBarcode] = useState(false);
  const [barcodeError, setBarcodeError] = useState('');
  const [generatedBarcode, setGeneratedBarcode] = useState('');

  const businessType = useOnboardingStore((s) => s.businessType);
  const placeholders = getPlaceholders(businessType);

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'Provisions',
    costPrice: '',
    sellingPrice: '',
    quantity: '',
    unit: 'pcs',
    lowStockThreshold: '10',
  });

  const currentStaff = useStaffStore((s) => s.currentStaff);
  const logActivity = useStaffStore((s) => s.logActivity);
  const canEditProduct = !currentStaff || hasPermission(currentStaff.role, 'edit_product');
  const canDeleteProduct = !currentStaff || hasPermission(currentStaff.role, 'delete_product');
  const canAddProduct = !currentStaff || hasPermission(currentStaff.role, 'add_product');
  const canRestock = !currentStaff || hasPermission(currentStaff.role, 'restock');

  const products = useRetailStore((s) => s.products);
  const categories = useRetailStore((s) => s.categories);
  const addProduct = useRetailStore((s) => s.addProduct);
  const deleteProduct = useRetailStore((s) => s.deleteProduct);
  const adjustStock = useRetailStore((s) => s.adjustStock);
  const getLowStockProducts = useRetailStore((s) => s.getLowStockProducts);

  const lowStockProducts = useMemo(() => getLowStockProducts(), [getLowStockProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (showLowStockOnly) filtered = lowStockProducts;
    return filtered.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, lowStockProducts, searchQuery, selectedCategory, showLowStockOnly]);

  const totalInventoryValue = useMemo(() => products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0), [products]);

  const handleAddProduct = useCallback(() => {
    if (!formData.name || !formData.costPrice || !formData.sellingPrice) return;
    const trimmedBarcode = formData.barcode.trim();
    if (!trimmedBarcode && !noBarcode) {
      setBarcodeError('Select "No barcode" to continue without a barcode.');
      return;
    }
    const finalBarcode = trimmedBarcode || generatedBarcode || generateInternalBarcode();
    // Check product limit for free users
    if (products.length >= FREE_PRODUCT_LIMIT && !canAccess('unlimited_products')) {
      setShowAddModal(false);
      setShowUpsell(true);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addProduct({
      name: formData.name,
      barcode: finalBarcode,
      category: formData.category,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      quantity: parseInt(formData.quantity) || 0,
      unit: formData.unit,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
    });
    track('product_added', undefined, { category: formData.category });
    setFormData({ name: '', barcode: '', category: 'Provisions', costPrice: '', sellingPrice: '', quantity: '', unit: 'pcs', lowStockThreshold: '10' });
    setNoBarcode(false);
    setBarcodeError('');
    setGeneratedBarcode('');
    setShowAddModal(false);
  }, [formData, addProduct, products.length, noBarcode, generatedBarcode]);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setBarcodeError('');
    setNoBarcode(false);
    setGeneratedBarcode('');
  }, []);

  const handleStockAdjust = useCallback((type: 'add' | 'remove') => {
    if (!selectedProduct || !stockAdjustment) return;
    const amount = parseInt(stockAdjustment) || 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    adjustStock(selectedProduct.id, type === 'add' ? amount : -amount);
    if (type === 'add') logActivity('restock', `Restocked ${selectedProduct.name} (+${amount})`);
    setStockAdjustment('');
    setShowStockModal(false);
    setSelectedProduct(null);
  }, [selectedProduct, stockAdjustment, adjustStock, logActivity]);

  const openProductEdit = useCallback((product: Product) => {
    router.push({ pathname: '/product-edit', params: { productId: product.id } });
  }, [router]);

  const openStockModal = useCallback((product: Product) => {
    setSelectedProduct(product);
    setStockAdjustment('');
    setShowStockModal(true);
  }, []);

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={gradientColors}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 8 }} className="px-5">
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-stone-600 dark:text-stone-400 text-sm font-semibold tracking-wide">Stock</Text>
              {canAddProduct && (
                <Pressable
                  onPress={() => {
                    if (products.length >= FREE_PRODUCT_LIMIT && !canAccess('unlimited_products')) {
                      setShowUpsell(true);
                    } else {
                      setShowAddModal(true);
                    }
                  }}
                  className="bg-orange-500 w-8 h-8 rounded-full items-center justify-center active:scale-95"
                >
                  <Plus size={18} color="white" />
                </Pressable>
              )}
            </View>
            <Text style={{ fontFamily: 'Poppins-ExtraBold' }} className="text-stone-900 dark:text-white text-3xl font-extrabold tracking-tight">Stock</Text>
          </Animated.View>
        </View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="flex-row mx-5 mt-6 gap-3">
          <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-2xl p-4 border border-stone-200 dark:border-stone-800">
            <View className="flex-row items-center gap-2 mb-2">
              <Package size={16} color="#3b82f6" />
              <Text className="text-stone-600 dark:text-stone-400 text-sm font-semibold tracking-wide">Total Products</Text>
            </View>
            <Text className="text-stone-900 dark:text-white text-2xl font-bold">{products.length}</Text>
          </View>
          <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-2xl p-4 border border-stone-200 dark:border-stone-800">
            <View className="flex-row items-center gap-2 mb-2">
              <TrendingUp size={16} color="#10b981" />
              <Text className="text-stone-600 dark:text-stone-400 text-sm font-semibold tracking-wide">Stock Value</Text>
            </View>
            <Text className="text-orange-400 text-xl font-bold">{formatNaira(totalInventoryValue)}</Text>
          </View>
        </Animated.View>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mx-5 mt-4">
            <Pressable
              onPress={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`rounded-xl p-4 border flex-row items-center justify-between ${
                showLowStockOnly ? 'bg-amber-500/20 border-amber-500/50' : 'bg-amber-500/10 border-amber-500/30'
              } active:opacity-80`}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-amber-500/20 items-center justify-center">
                  <AlertTriangle size={16} color="#f59e0b" />
                </View>
                <View>
                  <Text className="text-amber-400 font-medium">{lowStockProducts.length} Low Stock Items</Text>
                  <Text className="text-stone-600 dark:text-stone-400 text-sm">Tap to {showLowStockOnly ? 'show all' : 'filter'}</Text>
                </View>
              </View>
              <View className={`w-5 h-5 rounded-full border-2 ${showLowStockOnly ? 'bg-amber-500 border-amber-500' : 'border-amber-500/50'} items-center justify-center`}>
                {showLowStockOnly && <View className="w-2 h-2 rounded-full bg-white" />}
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} className="px-5 mt-4">
          <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl flex-row items-center px-4 border border-stone-200 dark:border-stone-800">
            <Search size={20} color="#78716c" />
            <TextInput className="flex-1 py-3 px-3 text-stone-900 dark:text-white text-base" placeholder="Search products..." placeholderTextColor="#78716c" value={searchQuery} onChangeText={setSearchQuery} />
            {searchQuery && <Pressable onPress={() => setSearchQuery('')}><X size={18} color="#78716c" /></Pressable>}
          </View>
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, marginTop: 12 }} style={{ flexGrow: 0 }}>
            <Pressable onPress={() => setSelectedCategory(null)} className={`mr-2 px-4 py-2 rounded-full border ${!selectedCategory ? 'bg-orange-500 border-orange-500' : 'bg-white/60 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800'}`}>
              <Text className={!selectedCategory ? 'text-white font-medium' : 'text-stone-600 dark:text-stone-400'}>All</Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable key={cat.id} onPress={() => setSelectedCategory(cat.name)} className={`mr-2 px-4 py-2 rounded-full border ${selectedCategory === cat.name ? 'bg-orange-500 border-orange-500' : 'bg-white/60 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800'}`}>
                <Text className={selectedCategory === cat.name ? 'text-white font-medium' : 'text-stone-600 dark:text-stone-400'}>{cat.name}</Text>
              </Pressable>
            ))}
            {canEditProduct && (
              <Pressable onPress={() => router.push('/categories')} className="mr-2 px-4 py-2 rounded-full border border-dashed border-stone-400 dark:border-stone-600">
                <Text className="text-stone-600 dark:text-stone-400">+ Edit</Text>
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>

        {/* Products List */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} className="px-5 mt-4">
          <Text className="text-stone-600 dark:text-stone-400 text-sm mb-3">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</Text>
          {filteredProducts.length === 0 && products.length === 0 && (
            <View className="bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800">
              <EmptyState icon={Package} title="Your shelf is empty" description="Add your first product to get started" buttonLabel="Add Product" onButtonPress={() => setShowAddModal(true)} />
            </View>
          )}
          <View className="gap-3">
            {filteredProducts.map((product, index) => {
              const isLowStock = product.quantity <= product.lowStockThreshold;
              const profit = product.sellingPrice - product.costPrice;
              const margin = product.sellingPrice > 0 ? ((profit / product.sellingPrice) * 100).toFixed(0) : '0';
              const hasSwipeActions = canEditProduct || canRestock;

              const card = (
                <Pressable
                  onPress={() => canEditProduct ? openProductEdit(product) : canRestock ? openStockModal(product) : undefined}
                  className={`bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border ${isLowStock ? 'border-amber-500/50' : 'border-stone-200 dark:border-stone-800'} active:scale-[0.99]`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-stone-900 dark:text-white font-medium text-base" numberOfLines={1}>{product.name}</Text>
                        {isLowStock && <View className="bg-amber-500/20 px-2 py-0.5 rounded"><Text className="text-amber-400 text-xs">Low</Text></View>}
                      </View>
                      <Text className="text-stone-600 dark:text-stone-400 text-xs mb-2">{product.category}</Text>
                      <View className="flex-row items-center gap-4">
                        <View>
                          <Text className="text-stone-600 dark:text-stone-400 text-xs">Cost</Text>
                          <Text className="text-stone-600 dark:text-stone-400 text-sm">{formatNaira(product.costPrice)}</Text>
                        </View>
                        <View>
                          <Text className="text-stone-600 dark:text-stone-400 text-xs">Sell</Text>
                          <Text className="text-orange-400 text-sm font-medium">{formatNaira(product.sellingPrice)}</Text>
                        </View>
                        <View>
                          <Text className="text-stone-600 dark:text-stone-400 text-xs">Margin</Text>
                          <Text className="text-emerald-400 text-sm">{margin}%</Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                      <View className={`px-3 py-1 rounded-lg ${isLowStock ? 'bg-amber-500/20' : 'bg-stone-200 dark:bg-stone-800'}`}>
                        <Text className={`font-bold text-lg ${isLowStock ? 'text-amber-400' : 'text-stone-900 dark:text-white'}`}>{product.quantity}</Text>
                      </View>
                      <Text className="text-stone-600 dark:text-stone-400 text-xs mt-1">{product.unit}</Text>
                    </View>
                  </View>
                </Pressable>
              );

              return (
                <Animated.View key={product.id} entering={FadeIn.delay(100 + index * 30).duration(400)} layout={Layout.springify()}>
                  {hasSwipeActions ? (
                    <ReanimatedSwipeable
                      friction={2}
                      overshootRight={false}
                      containerStyle={{ overflow: 'hidden', borderRadius: 12 }}
                      renderRightActions={() => (
                        <View style={{ flexDirection: 'row' }}>
                          {canEditProduct && (
                            <Pressable
                              onPress={() => openProductEdit(product)}
                              style={{ backgroundColor: '#e05e1b', width: 72, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Pencil size={20} color="white" />
                              <Text style={{ color: 'white', fontSize: 11, marginTop: 4, fontWeight: '600' }}>Edit</Text>
                            </Pressable>
                          )}
                          {canRestock && (
                            <Pressable
                              onPress={() => openStockModal(product)}
                              style={{ backgroundColor: '#10b981', width: 72, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Package size={20} color="white" />
                              <Text style={{ color: 'white', fontSize: 11, marginTop: 4, fontWeight: '600' }}>Restock</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    >
                      {card}
                    </ReanimatedSwipeable>
                  ) : card}
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <PremiumUpsell
        visible={showUpsell}
        onClose={() => setShowUpsell(false)}
        featureName={FEATURE_DESCRIPTIONS.unlimited_products.name}
        featureDescription={FEATURE_DESCRIPTIONS.unlimited_products.description}
      />

      {/* Add Product Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={closeAddModal}>
        <KeyboardAvoidingView style={{ flex: 1 }}>
          <Pressable className="flex-1 bg-black/60" onPress={closeAddModal} />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <ScrollView className="max-h-[500px]" showsVerticalScrollIndicator={false}>
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-stone-900 dark:text-white text-xl font-bold">Add New Product</Text>
                  <Pressable onPress={closeAddModal}><X size={24} color="#78716c" /></Pressable>
                </View>
                <View className="gap-4">
                  <View>
                    <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Product Name *</Text>
                    <TextInput className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white" placeholder={placeholders.productName} placeholderTextColor="#57534e" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
                  </View>
                  <View>
                    <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Barcode (Optional)</Text>
                    <TextInput
                      className={`bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white ${noBarcode ? 'opacity-50' : ''}`}
                      placeholder="Scan or enter barcode"
                      placeholderTextColor="#57534e"
                      editable={!noBarcode}
                      value={formData.barcode}
                      onChangeText={(text) => {
                        setFormData({ ...formData, barcode: text });
                        if (barcodeError) setBarcodeError('');
                      }}
                    />
                    <Pressable
                      onPress={() => {
                        const next = !noBarcode;
                        setNoBarcode(next);
                        setBarcodeError('');
                        if (next) {
                          setFormData({ ...formData, barcode: '' });
                          if (!generatedBarcode) setGeneratedBarcode(generateInternalBarcode());
                        } else {
                          setGeneratedBarcode('');
                        }
                      }}
                      className="flex-row items-center gap-2 mt-2"
                    >
                      <View
                        className={`w-5 h-5 rounded border ${noBarcode ? 'bg-orange-500 border-orange-500' : 'border-stone-300 dark:border-stone-700'}`}
                      />
                      <Text className="text-stone-600 dark:text-stone-400 text-sm">No barcode (use internal code)</Text>
                    </Pressable>
                    {noBarcode && (
                      <View className="mt-2">
                        <Text className="text-amber-500 text-xs">Internal code: {generatedBarcode}</Text>
                        <Text className="text-stone-600 dark:text-stone-400 text-xs">This code is for search only.</Text>
                      </View>
                    )}
                    {barcodeError ? (
                      <Text className="text-red-400 text-xs mt-1">{barcodeError}</Text>
                    ) : null}
                  </View>
                  <View>
                    <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      {categories.map((cat) => (
                        <Pressable key={cat.id} onPress={() => setFormData({ ...formData, category: cat.name })} className={`mr-2 px-4 py-2 rounded-full border ${formData.category === cat.name ? 'bg-orange-500 border-orange-500' : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700'}`}>
                          <Text className={formData.category === cat.name ? 'text-white font-medium' : 'text-stone-600 dark:text-stone-400'}>{cat.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Cost Price (₦) *</Text>
                      <TextInput className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white" placeholder="0" placeholderTextColor="#57534e" keyboardType="numeric" value={formData.costPrice} onChangeText={(text) => setFormData({ ...formData, costPrice: text })} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Selling Price (₦) *</Text>
                      <TextInput className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white" placeholder="0" placeholderTextColor="#57534e" keyboardType="numeric" value={formData.sellingPrice} onChangeText={(text) => setFormData({ ...formData, sellingPrice: text })} />
                    </View>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Initial Stock</Text>
                      <TextInput className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white" placeholder="0" placeholderTextColor="#57534e" keyboardType="numeric" value={formData.quantity} onChangeText={(text) => setFormData({ ...formData, quantity: text })} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Low Stock Alert</Text>
                      <TextInput className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white" placeholder="10" placeholderTextColor="#57534e" keyboardType="numeric" value={formData.lowStockThreshold} onChangeText={(text) => setFormData({ ...formData, lowStockThreshold: text })} />
                    </View>
                  </View>
                  <Pressable onPress={handleAddProduct} className="bg-orange-500 py-4 rounded-xl active:opacity-90 mt-2">
                    <Text className="text-white font-semibold text-center text-lg">Add Product</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal visible={showStockModal} transparent animationType="slide" onRequestClose={() => setShowStockModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }}>
          <Pressable className="flex-1 bg-black/60" onPress={() => setShowStockModal(false)} />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-stone-900 dark:text-white text-xl font-bold">Adjust Stock</Text>
                <Pressable onPress={() => setShowStockModal(false)}><X size={24} color="#78716c" /></Pressable>
              </View>
              {selectedProduct && (
                <>
                  <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 mb-6">
                    <Text className="text-stone-900 dark:text-white font-medium text-lg mb-1">{selectedProduct.name}</Text>
                    <Text className="text-stone-600 dark:text-stone-400 text-sm">{selectedProduct.category}</Text>
                    <View className="flex-row items-center mt-3">
                      <Text className="text-stone-600 dark:text-stone-400 text-sm">Current Stock:</Text>
                      <Text className="text-stone-900 dark:text-white font-bold text-lg ml-2">{selectedProduct.quantity} {selectedProduct.unit}</Text>
                    </View>
                  </View>
                  <View className="mb-6">
                    <Text className="text-stone-600 dark:text-stone-400 text-sm mb-2">Quantity to Add/Remove</Text>
                    <TextInput className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold" placeholder="0" placeholderTextColor="#57534e" keyboardType="numeric" value={stockAdjustment} onChangeText={setStockAdjustment} />
                  </View>
                  <View className="flex-row gap-3">
                    <Pressable onPress={() => handleStockAdjust('remove')} className="flex-1 flex-row items-center justify-center gap-2 bg-red-500/20 border border-red-500/40 py-4 rounded-xl active:opacity-90">
                      <TrendingDown size={20} color="#ef4444" />
                      <Text className="text-red-400 font-semibold">Remove</Text>
                    </Pressable>
                    <Pressable onPress={() => handleStockAdjust('add')} className="flex-1 flex-row items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/40 py-4 rounded-xl active:opacity-90">
                      <TrendingUp size={20} color="#10b981" />
                      <Text className="text-emerald-400 font-semibold">Add Stock</Text>
                    </Pressable>
                  </View>
                  {canDeleteProduct && (
                    <Pressable onPress={() => { deleteProduct(selectedProduct.id); setShowStockModal(false); }} className="mt-4 py-3 items-center">
                      <Text className="text-red-400 font-medium">Delete Product</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

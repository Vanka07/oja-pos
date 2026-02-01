import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Linking, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  X,
  Check,
  Banknote,
  CreditCard,
  Smartphone,
  Users,
  MessageCircle,
  Share2,
  ScanBarcode,
  Printer,
} from 'lucide-react-native';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { useRetailStore, formatNaira, generateReceiptText, type Product, type Sale } from '@/store/retailStore';
import { checkSoldProductsLowStock, checkAndSendLowStockAlerts } from '@/lib/lowStockAlerts';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useStaffStore } from '@/store/staffStore';
import { usePrinterStore } from '@/store/printerStore';
import { printReceipt } from '@/lib/printerService';
import { useState, useMemo, useCallback, useRef } from 'react';
import { useColorScheme } from 'nativewind';
import Animated, { FadeInDown, FadeInUp, FadeIn, SlideInRight, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

type PaymentMethod = Sale['paymentMethod'];

export default function POSScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lowStockAlert, setLowStockAlert] = useState<{ name: string; quantity: number }[] | null>(null);
  const scanLockRef = useRef(false);
  const paperSize = usePrinterStore((s) => s.paperSize);
  const whatsAppAlertsEnabled = useRetailStore((s) => s.whatsAppAlertsEnabled);
  const alertPhoneNumber = useRetailStore((s) => s.alertPhoneNumber);

  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const logActivity = useStaffStore((s) => s.logActivity);
  const products = useRetailStore((s) => s.products);
  const categories = useRetailStore((s) => s.categories);
  const cart = useRetailStore((s) => s.cart);
  const cartDiscount = useRetailStore((s) => s.cartDiscount);
  const addToCart = useRetailStore((s) => s.addToCart);
  const updateCartQuantity = useRetailStore((s) => s.updateCartQuantity);
  const removeFromCart = useRetailStore((s) => s.removeFromCart);
  const clearCart = useRetailStore((s) => s.clearCart);
  const completeSale = useRetailStore((s) => s.completeSale);
  const getProductByBarcode = useRetailStore((s) => s.getProductByBarcode);

  const handleBarcodeScan = useCallback((result: BarcodeScanningResult) => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    const product = getProductByBarcode(result.data);
    if (product) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addToCart(product);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setShowScanner(false);
    setTimeout(() => { scanLockRef.current = false; }, 500);
  }, [getProductByBarcode, addToCart]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory && p.quantity > 0;
    });
  }, [products, searchQuery, selectedCategory]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  }, [cart]);

  const cartTotal = cartSubtotal - cartDiscount;

  const handleAddToCart = useCallback((product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart(product);
  }, [addToCart]);

  const handleQuantityChange = useCallback((productId: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item = cart.find((i) => i.product.id === productId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        removeFromCart(productId);
      } else {
        updateCartQuantity(productId, newQuantity);
      }
    }
  }, [cart, updateCartQuantity, removeFromCart]);

  const handleCompleteSale = useCallback((method: PaymentMethod) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const soldProductIds = cart.map((item) => item.product.id);
    const sale = completeSale(method, undefined, undefined, currentStaff?.id, currentStaff?.name);
    if (sale) {
      setLastSale(sale);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      logActivity('sale', `Sold ${itemCount} item${itemCount > 1 ? 's' : ''} for ${formatNaira(sale.total)}`, sale.total);

      // Check for low stock after sale
      if (whatsAppAlertsEnabled) {
        const lowStock = checkSoldProductsLowStock(soldProductIds);
        if (lowStock.length > 0) {
          setLowStockAlert(lowStock);
        }
      }
    }
  }, [completeSale, currentStaff, logActivity, cart, whatsAppAlertsEnabled]);

  const handlePrintReceipt = useCallback(async () => {
    if (!lastSale || !shopInfo) return;
    setIsPrinting(true);
    try {
      await printReceipt(lastSale, shopInfo, paperSize);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Print failed — haptic already handles feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPrinting(false);
    }
  }, [lastSale, shopInfo, paperSize]);

  const shareReceiptWhatsApp = useCallback(() => {
    if (!lastSale || !shopInfo) return;
    const receipt = generateReceiptText(lastSale, shopInfo.name, shopInfo.phone);
    const encoded = encodeURIComponent(receipt);
    if (Platform.OS === 'web') {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    } else {
      const url = `whatsapp://send?text=${encoded}`;
      Linking.openURL(url).catch(() => {
        Share.share({ message: receipt });
      });
    }
  }, [lastSale, shopInfo]);

  const shareReceipt = useCallback(async () => {
    if (!lastSale || !shopInfo) return;
    const receipt = generateReceiptText(lastSale, shopInfo.name, shopInfo.phone);
    try {
      await Share.share({ message: receipt });
    } catch (error) {
      // Ignore
    }
  }, [lastSale, shopInfo]);

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={gradientColors}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text className="text-stone-500 dark:text-stone-500 text-sm font-semibold tracking-wide mb-1">
            Sell
          </Text>
          <Text className="text-stone-900 dark:text-white text-3xl font-extrabold tracking-tight">
            New Sale
          </Text>
        </Animated.View>
      </View>

      <View className="flex-1 flex-row">
        {/* Products Section */}
        <View className="flex-1">
          {/* Search */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="px-5 mb-4"
          >
            <View className="flex-row items-center gap-2">
              <View className="flex-1 bg-white/80 dark:bg-stone-900/80 rounded-xl flex-row items-center px-4 border border-stone-200 dark:border-stone-800">
                <Search size={20} color="#78716c" />
                <TextInput
                  className="flex-1 py-3 px-3 text-stone-900 dark:text-white text-base"
                  placeholder="Search products..."
                  placeholderTextColor="#78716c"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={18} color="#78716c" />
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={() => setShowScanner(true)}
                className="bg-orange-500/20 border border-orange-500/40 rounded-xl p-3 active:opacity-80"
              >
                <ScanBarcode size={22} color="#f97316" />
              </Pressable>
            </View>
          </Animated.View>

          {/* Categories */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              style={{ flexGrow: 0, marginBottom: 12 }}
            >
              <Pressable
                onPress={() => setSelectedCategory(null)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  !selectedCategory
                    ? 'bg-orange-500 border-orange-500'
                    : 'bg-white/60 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800'
                }`}
              >
                <Text className={!selectedCategory ? 'text-white font-medium' : 'text-stone-600 dark:text-stone-400'}>
                  All
                </Text>
              </Pressable>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.name)}
                  className={`mr-2 px-4 py-2 rounded-full border ${
                    selectedCategory === cat.name
                      ? 'bg-orange-500 border-orange-500'
                      : 'bg-white/60 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <Text
                    className={selectedCategory === cat.name ? 'text-white font-medium' : 'text-stone-600 dark:text-stone-400'}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Products Grid */}
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 200 }}
          >
            <View className="flex-row flex-wrap gap-3">
              {filteredProducts.map((product, index) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const firstLetter = product.name.charAt(0).toUpperCase();
                const letterColors = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#ec4899'];
                const colorIndex = firstLetter.charCodeAt(0) % letterColors.length;
                const placeholderColor = letterColors[colorIndex];
                return (
                  <Animated.View
                    key={product.id}
                    entering={FadeIn.delay(100 + index * 30).duration(400)}
                    className="w-[47%]"
                  >
                    <Pressable
                      onPress={() => handleAddToCart(product)}
                      className={`bg-white/80 dark:bg-stone-900/80 rounded-xl p-3 border ${
                        inCart ? 'border-orange-500' : 'border-stone-200 dark:border-stone-800'
                      } active:scale-95`}
                    >
                      {/* Product image placeholder */}
                      {product.imageUrl ? (
                        <View className="w-full h-16 rounded-lg bg-stone-200 dark:bg-stone-800 mb-2 overflow-hidden items-center justify-center">
                          <Text className="text-stone-400 text-xs">📷</Text>
                        </View>
                      ) : (
                        <View
                          className="w-full h-16 rounded-lg mb-2 items-center justify-center"
                          style={{ backgroundColor: placeholderColor + '18' }}
                        >
                          <Text style={{ color: placeholderColor, fontSize: 22, fontWeight: '700' }}>
                            {firstLetter}
                          </Text>
                        </View>
                      )}
                      <Text className="text-stone-900 dark:text-white font-semibold text-sm mb-1" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="text-stone-500 dark:text-stone-500 text-xs mb-2">{product.category}</Text>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-orange-400 font-bold text-base">
                          {formatNaira(product.sellingPrice)}
                        </Text>
                        <View className="bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded">
                          <Text className="text-stone-600 dark:text-stone-400 text-xs">{product.quantity}</Text>
                        </View>
                      </View>
                      {inCart && (
                        <View className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 items-center justify-center">
                          <Text className="text-white text-xs font-bold">{inCart.quantity}</Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Cart Summary Bar */}
      {cart.length > 0 && (
        <Animated.View
          entering={SlideInRight.duration(400)}
          className="absolute bottom-0 left-0 right-0"
          style={{ paddingBottom: insets.bottom + 80 }}
        >
          <View className="mx-5">
            <LinearGradient
              colors={['#ea580c', '#c2410c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 20, padding: 16 }}
            >
              <Pressable
                onPress={() => setShowPaymentModal(true)}
                className="active:opacity-90"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                      <ShoppingBag size={20} color="white" />
                    </View>
                    <View>
                      <Text className="text-white/80 text-xs">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                      </Text>
                      <Text className="text-white text-xl font-bold">
                        {formatNaira(cartTotal)}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-white/20 px-4 py-2 rounded-full">
                    <Text className="text-white font-semibold">Checkout</Text>
                  </View>
                </View>
              </Pressable>
            </LinearGradient>
          </View>
        </Animated.View>
      )}

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/60"
            onPress={() => setShowPaymentModal(false)}
          />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-stone-900 dark:text-white text-xl font-bold">Complete Payment</Text>
                <Pressable onPress={() => setShowPaymentModal(false)}>
                  <X size={24} color="#78716c" />
                </Pressable>
              </View>

              {/* Cart Items */}
              <ScrollView className="max-h-48 mb-4" showsVerticalScrollIndicator={false}>
                {cart.map((item) => (
                  <Animated.View
                    key={item.product.id}
                    layout={Layout.springify()}
                    className="flex-row items-center justify-between py-3 border-b border-stone-200 dark:border-stone-800"
                  >
                    <View className="flex-1">
                      <Text className="text-stone-900 dark:text-white font-medium" numberOfLines={1}>
                        {item.product.name}
                      </Text>
                      <Text className="text-stone-500 text-sm">
                        {formatNaira(item.product.sellingPrice)} x {item.quantity}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center bg-stone-200 dark:bg-stone-800 rounded-lg">
                        <Pressable
                          onPress={() => handleQuantityChange(item.product.id, -1)}
                          className="p-2"
                        >
                          <Minus size={16} color="#f97316" />
                        </Pressable>
                        <Text className="text-stone-900 dark:text-white font-medium px-2">{item.quantity}</Text>
                        <Pressable
                          onPress={() => handleQuantityChange(item.product.id, 1)}
                          className="p-2"
                        >
                          <Plus size={16} color="#f97316" />
                        </Pressable>
                      </View>
                      <Text className="text-stone-900 dark:text-white font-semibold w-20 text-right">
                        {formatNaira(item.product.sellingPrice * item.quantity)}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </ScrollView>

              {/* Totals */}
              <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 mb-6">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-stone-500 dark:text-stone-400">Subtotal</Text>
                  <Text className="text-stone-900 dark:text-white font-medium">{formatNaira(cartSubtotal)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-stone-500 dark:text-stone-400">Discount</Text>
                  <Text className="text-orange-400 font-medium">-{formatNaira(cartDiscount)}</Text>
                </View>
                <View className="h-px bg-stone-300 dark:bg-stone-700 my-2" />
                <View className="flex-row justify-between">
                  <Text className="text-stone-900 dark:text-white font-semibold text-lg">Total</Text>
                  <Text className="text-orange-400 font-bold text-xl">{formatNaira(cartTotal)}</Text>
                </View>
              </View>

              {/* Payment Methods */}
              <Text className="text-stone-500 dark:text-stone-400 text-sm mb-3">Select Payment Method</Text>
              <View className="gap-3">
                <Pressable
                  onPress={() => handleCompleteSale('cash')}
                  className="flex-row items-center bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-4 active:scale-98"
                >
                  <View className="w-10 h-10 rounded-full bg-emerald-500/30 items-center justify-center mr-3">
                    <Banknote size={20} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-stone-900 dark:text-white font-medium">Cash</Text>
                    <Text className="text-stone-500 text-xs">Receive payment in cash</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => handleCompleteSale('transfer')}
                  className="flex-row items-center bg-blue-500/20 border border-blue-500/40 rounded-xl p-4 active:scale-98"
                >
                  <View className="w-10 h-10 rounded-full bg-blue-500/30 items-center justify-center mr-3">
                    <Smartphone size={20} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-stone-900 dark:text-white font-medium">Bank Transfer</Text>
                    <Text className="text-stone-500 text-xs">Mobile banking / USSD</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => handleCompleteSale('pos')}
                  className="flex-row items-center bg-purple-500/20 border border-purple-500/40 rounded-xl p-4 active:scale-98"
                >
                  <View className="w-10 h-10 rounded-full bg-purple-500/30 items-center justify-center mr-3">
                    <CreditCard size={20} color="#a855f7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-stone-900 dark:text-white font-medium">POS Terminal</Text>
                    <Text className="text-stone-500 text-xs">Card payment via POS</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => handleCompleteSale('credit')}
                  className="flex-row items-center bg-amber-500/20 border border-amber-500/40 rounded-xl p-4 active:scale-98"
                >
                  <View className="w-10 h-10 rounded-full bg-amber-500/30 items-center justify-center mr-3">
                    <Users size={20} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-stone-900 dark:text-white font-medium">Credit Sale</Text>
                    <Text className="text-stone-500 text-xs">Customer pays later</Text>
                  </View>
                </Pressable>
              </View>

              {/* Clear Cart */}
              <Pressable
                onPress={() => {
                  clearCart();
                  setShowPaymentModal(false);
                }}
                className="mt-4 py-3 items-center"
              >
                <Text className="text-red-400 font-medium">Clear Cart</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showScanner}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View className="flex-1 bg-black">
          <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4 flex-row items-center justify-between z-10">
            <Text className="text-white text-lg font-bold">Scan Barcode</Text>
            <Pressable
              onPress={() => setShowScanner(false)}
              className="bg-stone-800/80 w-10 h-10 rounded-full items-center justify-center"
            >
              <X size={20} color="white" />
            </Pressable>
          </View>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
            }}
            onBarcodeScanned={handleBarcodeScan}
          />
          <View className="absolute bottom-0 left-0 right-0 items-center" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="bg-stone-900/90 px-6 py-3 rounded-full">
              <Text className="text-stone-300 text-sm">Point camera at a barcode</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          setLastSale(null);
          setLowStockAlert(null);
        }}
      >
        <Pressable
          className="flex-1 bg-black/80 items-center justify-center px-8"
          onPress={() => {
            setShowSuccessModal(false);
            setLastSale(null);
            setLowStockAlert(null);
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={FadeInUp.duration(400)}
            className="bg-white dark:bg-stone-900 rounded-3xl p-8 w-full items-center"
          >
            <View className="w-20 h-20 rounded-full bg-emerald-500/20 items-center justify-center mb-4">
              <Check size={40} color="#10b981" />
            </View>
            <Text className="text-stone-900 dark:text-white text-2xl font-bold mb-2">Sale Complete!</Text>
            <Text className="text-stone-500 dark:text-stone-400 text-center mb-6">
              Transaction recorded successfully
            </Text>
            {lastSale && (
              <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 w-full mb-6">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-stone-500 dark:text-stone-400">Total</Text>
                  <Text className="text-stone-900 dark:text-white font-bold text-lg">{formatNaira(lastSale.total)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-stone-500 dark:text-stone-400">Payment</Text>
                  <Text className="text-orange-400 font-medium capitalize">{lastSale.paymentMethod}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-stone-500 dark:text-stone-400">Items</Text>
                  <Text className="text-stone-600 dark:text-stone-300">{lastSale.items.length} product{lastSale.items.length > 1 ? 's' : ''}</Text>
                </View>
              </View>
            )}

            {/* Low Stock Alert Banner */}
            {lowStockAlert && lowStockAlert.length > 0 && (
              <View className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 w-full mb-4">
                <Text className="text-amber-400 font-medium text-sm mb-1">⚠️ Low Stock Warning</Text>
                {lowStockAlert.map((item, i) => (
                  <Text key={i} className="text-amber-300 text-xs">
                    {item.name} — {item.quantity} left
                  </Text>
                ))}
                {alertPhoneNumber ? (
                  <Pressable
                    onPress={() => {
                      checkAndSendLowStockAlerts(alertPhoneNumber);
                      setLowStockAlert(null);
                    }}
                    className="bg-amber-500 mt-2 py-2 rounded-lg active:opacity-90"
                  >
                    <Text className="text-white font-semibold text-center text-sm">Send WhatsApp Alert</Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            {/* Share Receipt Buttons */}
            <Pressable
              onPress={handlePrintReceipt}
              disabled={isPrinting}
              className="flex-row items-center justify-center gap-2 w-full py-4 rounded-xl mb-3 bg-orange-500 active:opacity-90"
            >
              <Printer size={20} color="#ffffff" />
              <Text className="text-white font-bold text-base">
                {isPrinting ? 'Printing...' : 'Print Receipt'}
              </Text>
            </Pressable>
            <Pressable
              onPress={shareReceiptWhatsApp}
              className="flex-row items-center justify-center gap-2 w-full py-4 rounded-xl mb-3 active:opacity-90"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle size={20} color="#ffffff" />
              <Text className="text-white font-bold text-base">Share via WhatsApp</Text>
            </Pressable>
            <View className="flex-row gap-3 w-full mb-4">
              <Pressable
                onPress={shareReceipt}
                className="flex-1 flex-row items-center justify-center gap-2 bg-stone-200 dark:bg-stone-800 py-3 rounded-xl active:opacity-90"
              >
                <Share2 size={18} color="#a8a29e" />
                <Text className="text-stone-600 dark:text-stone-300 font-medium">Share Other</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                setShowSuccessModal(false);
                setLastSale(null);
                setLowStockAlert(null);
              }}
              className="bg-orange-500 w-full py-4 rounded-xl active:opacity-90"
            >
              <Text className="text-white font-semibold text-center text-lg">New Sale</Text>
            </Pressable>
          </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

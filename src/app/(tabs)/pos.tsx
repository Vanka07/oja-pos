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
  Share2
} from 'lucide-react-native';
import { useRetailStore, formatNaira, generateReceiptText, type Product, type Sale } from '@/store/retailStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useState, useMemo, useCallback } from 'react';
import Animated, { FadeInDown, FadeInUp, FadeIn, SlideInRight, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

type PaymentMethod = Sale['paymentMethod'];

export default function POSScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const products = useRetailStore((s) => s.products);
  const categories = useRetailStore((s) => s.categories);
  const cart = useRetailStore((s) => s.cart);
  const cartDiscount = useRetailStore((s) => s.cartDiscount);
  const addToCart = useRetailStore((s) => s.addToCart);
  const updateCartQuantity = useRetailStore((s) => s.updateCartQuantity);
  const removeFromCart = useRetailStore((s) => s.removeFromCart);
  const clearCart = useRetailStore((s) => s.clearCart);
  const completeSale = useRetailStore((s) => s.completeSale);

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
    const sale = completeSale(method);
    if (sale) {
      setLastSale(sale);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
    }
  }, [completeSale]);

  const shareReceiptWhatsApp = useCallback(() => {
    if (!lastSale || !shopInfo) return;
    const receipt = generateReceiptText(lastSale, shopInfo.name, shopInfo.phone);
    const url = `whatsapp://send?text=${encodeURIComponent(receipt)}`;
    Linking.openURL(url).catch(() => {
      // WhatsApp not installed, try regular share
      Share.share({ message: receipt });
    });
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

  return (
    <View className="flex-1 bg-stone-950">
      <LinearGradient
        colors={['#292524', '#1c1917', '#0c0a09']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text className="text-stone-500 text-sm font-medium tracking-wide uppercase mb-1">
            Point of Sale
          </Text>
          <Text className="text-white text-3xl font-bold tracking-tight">
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
            <View className="bg-stone-900/80 rounded-xl flex-row items-center px-4 border border-stone-800">
              <Search size={20} color="#78716c" />
              <TextInput
                className="flex-1 py-3 px-3 text-white text-base"
                placeholder="Search products or scan barcode..."
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
                    : 'bg-stone-900/60 border-stone-800'
                }`}
              >
                <Text className={!selectedCategory ? 'text-white font-medium' : 'text-stone-400'}>
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
                      : 'bg-stone-900/60 border-stone-800'
                  }`}
                >
                  <Text
                    className={selectedCategory === cat.name ? 'text-white font-medium' : 'text-stone-400'}
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
                return (
                  <Animated.View
                    key={product.id}
                    entering={FadeIn.delay(100 + index * 30).duration(400)}
                    className="w-[47%]"
                  >
                    <Pressable
                      onPress={() => handleAddToCart(product)}
                      className={`bg-stone-900/80 rounded-xl p-3 border ${
                        inCart ? 'border-orange-500' : 'border-stone-800'
                      } active:scale-95`}
                    >
                      <Text className="text-white font-medium text-sm mb-1" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="text-stone-500 text-xs mb-2">{product.category}</Text>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-orange-400 font-bold text-base">
                          {formatNaira(product.sellingPrice)}
                        </Text>
                        <View className="bg-stone-800 px-2 py-0.5 rounded">
                          <Text className="text-stone-400 text-xs">{product.quantity}</Text>
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
          <View className="bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Complete Payment</Text>
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
                    className="flex-row items-center justify-between py-3 border-b border-stone-800"
                  >
                    <View className="flex-1">
                      <Text className="text-white font-medium" numberOfLines={1}>
                        {item.product.name}
                      </Text>
                      <Text className="text-stone-500 text-sm">
                        {formatNaira(item.product.sellingPrice)} x {item.quantity}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center bg-stone-800 rounded-lg">
                        <Pressable
                          onPress={() => handleQuantityChange(item.product.id, -1)}
                          className="p-2"
                        >
                          <Minus size={16} color="#f97316" />
                        </Pressable>
                        <Text className="text-white font-medium px-2">{item.quantity}</Text>
                        <Pressable
                          onPress={() => handleQuantityChange(item.product.id, 1)}
                          className="p-2"
                        >
                          <Plus size={16} color="#f97316" />
                        </Pressable>
                      </View>
                      <Text className="text-white font-semibold w-20 text-right">
                        {formatNaira(item.product.sellingPrice * item.quantity)}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </ScrollView>

              {/* Totals */}
              <View className="bg-stone-800/50 rounded-xl p-4 mb-6">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-stone-400">Subtotal</Text>
                  <Text className="text-white font-medium">{formatNaira(cartSubtotal)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-stone-400">Discount</Text>
                  <Text className="text-orange-400 font-medium">-{formatNaira(cartDiscount)}</Text>
                </View>
                <View className="h-px bg-stone-700 my-2" />
                <View className="flex-row justify-between">
                  <Text className="text-white font-semibold text-lg">Total</Text>
                  <Text className="text-orange-400 font-bold text-xl">{formatNaira(cartTotal)}</Text>
                </View>
              </View>

              {/* Payment Methods */}
              <Text className="text-stone-400 text-sm mb-3">Select Payment Method</Text>
              <View className="gap-3">
                <Pressable
                  onPress={() => handleCompleteSale('cash')}
                  className="flex-row items-center bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-4 active:scale-98"
                >
                  <View className="w-10 h-10 rounded-full bg-emerald-500/30 items-center justify-center mr-3">
                    <Banknote size={20} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">Cash</Text>
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
                    <Text className="text-white font-medium">Bank Transfer</Text>
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
                    <Text className="text-white font-medium">POS Terminal</Text>
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
                    <Text className="text-white font-medium">Credit Sale</Text>
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

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center px-8">
          <Animated.View
            entering={FadeInUp.duration(400)}
            className="bg-stone-900 rounded-3xl p-8 w-full items-center"
          >
            <View className="w-20 h-20 rounded-full bg-emerald-500/20 items-center justify-center mb-4">
              <Check size={40} color="#10b981" />
            </View>
            <Text className="text-white text-2xl font-bold mb-2">Sale Complete!</Text>
            <Text className="text-stone-400 text-center mb-6">
              Transaction recorded successfully
            </Text>
            {lastSale && (
              <View className="bg-stone-800/50 rounded-xl p-4 w-full mb-6">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-stone-400">Total</Text>
                  <Text className="text-white font-bold text-lg">{formatNaira(lastSale.total)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-stone-400">Payment</Text>
                  <Text className="text-orange-400 font-medium capitalize">{lastSale.paymentMethod}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-stone-400">Items</Text>
                  <Text className="text-stone-300">{lastSale.items.length} product{lastSale.items.length > 1 ? 's' : ''}</Text>
                </View>
              </View>
            )}

            {/* Share Receipt Buttons */}
            <View className="flex-row gap-3 w-full mb-4">
              <Pressable
                onPress={shareReceiptWhatsApp}
                className="flex-1 flex-row items-center justify-center gap-2 bg-green-500/20 border border-green-500/40 py-3 rounded-xl active:opacity-90"
              >
                <MessageCircle size={18} color="#22c55e" />
                <Text className="text-green-400 font-medium">WhatsApp</Text>
              </Pressable>
              <Pressable
                onPress={shareReceipt}
                className="flex-1 flex-row items-center justify-center gap-2 bg-stone-800 py-3 rounded-xl active:opacity-90"
              >
                <Share2 size={18} color="#a8a29e" />
                <Text className="text-stone-300 font-medium">Share</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setShowSuccessModal(false)}
              className="bg-orange-500 w-full py-4 rounded-xl active:opacity-90"
            >
              <Text className="text-white font-semibold text-center text-lg">New Sale</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

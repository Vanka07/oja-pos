import { View, Text, ScrollView, Pressable, TextInput, Switch, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ArrowLeft, Share2, Copy, ExternalLink, Check, ShoppingBag, Eye } from 'lucide-react-native';
import { useCatalogStore } from '@/store/catalogStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { getPlaceholders } from '@/lib/placeholderConfig';
import { useRetailStore, formatNaira } from '@/store/retailStore';
import { useStaffStore, hasPermission } from '@/store/staffStore';
import { generateCatalogUrl, generateShareMessage } from '@/lib/catalogGenerator';
import { useState, useEffect, useMemo, useCallback } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const currentStaff = useStaffStore((s) => s.currentStaff);
  const canManageCatalog = !currentStaff || hasPermission(currentStaff.role, 'manage_catalog');

  const catalogEnabled = useCatalogStore((s) => s.catalogEnabled);
  const setCatalogEnabled = useCatalogStore((s) => s.setCatalogEnabled);
  const shopSlug = useCatalogStore((s) => s.shopSlug);
  const setShopSlug = useCatalogStore((s) => s.setShopSlug);
  const shopDescription = useCatalogStore((s) => s.shopDescription);
  const setShopDescription = useCatalogStore((s) => s.setShopDescription);
  const whatsappNumber = useCatalogStore((s) => s.whatsappNumber);
  const setWhatsappNumber = useCatalogStore((s) => s.setWhatsappNumber);
  const catalogProducts = useCatalogStore((s) => s.catalogProducts);
  const setCatalogProducts = useCatalogStore((s) => s.setCatalogProducts);
  const generateSlug = useCatalogStore((s) => s.generateSlug);

  const shopInfo = useOnboardingStore((s) => s.shopInfo);
  const businessType = useOnboardingStore((s) => s.businessType);
  const placeholders = getPlaceholders(businessType);
  const products = useRetailStore((s) => s.products);

  const [copied, setCopied] = useState(false);
  const [showEnableFirst, setShowEnableFirst] = useState(false);

  // Auto-generate slug from shop name if not set
  useEffect(() => {
    if (!shopSlug && shopInfo?.name) {
      generateSlug(shopInfo.name);
    }
  }, [shopSlug, shopInfo?.name, generateSlug]);

  // Pre-fill WhatsApp number from onboarding
  useEffect(() => {
    if (!whatsappNumber && shopInfo?.phone) {
      setWhatsappNumber(shopInfo.phone);
    }
  }, [whatsappNumber, shopInfo?.phone, setWhatsappNumber]);

  const catalogUrl = useMemo(() => {
    if (!catalogEnabled) return { url: '', truncated: false };
    return generateCatalogUrl();
  }, [catalogEnabled, shopDescription, whatsappNumber, catalogProducts, products]);

  const selectedCount = catalogProducts.length === 0 ? products.length : catalogProducts.length;

  const toggleProduct = useCallback((productId: string) => {
    const current = catalogProducts.length === 0 ? products.map((p) => p.id) : [...catalogProducts];
    const index = current.indexOf(productId);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(productId);
    }
    // If all products are selected, reset to empty (meaning "all")
    if (current.length === products.length) {
      setCatalogProducts([]);
    } else {
      setCatalogProducts(current);
    }
  }, [catalogProducts, products, setCatalogProducts]);

  const selectAll = useCallback(() => {
    setCatalogProducts([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setCatalogProducts]);

  const isProductSelected = useCallback((productId: string) => {
    if (catalogProducts.length === 0) return true;
    return catalogProducts.includes(productId);
  }, [catalogProducts]);

  const handleShare = useCallback(async () => {
    if (!catalogUrl.url) {
      setShowEnableFirst(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = generateShareMessage();
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    if (Platform.OS === 'web') {
      window.open(waUrl, '_blank');
    } else {
      await Linking.openURL(waUrl).catch(() => {});
    }
  }, [catalogUrl.url]);

  const handleCopyLink = useCallback(async () => {
    if (!catalogUrl.url) return;
    await Clipboard.setStringAsync(catalogUrl.url);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  }, [catalogUrl.url]);

  const handlePreview = useCallback(async () => {
    if (!catalogUrl.url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await WebBrowser.openBrowserAsync(catalogUrl.url);
  }, [catalogUrl.url]);

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

  // Group products by category
  const productsByCategory = useMemo(() => {
    const groups: Record<string, typeof products> = {};
    for (const product of products) {
      const cat = product.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
    }
    return groups;
  }, [products]);

  if (!canManageCatalog) {
    return (
      <View className="flex-1 bg-stone-50 dark:bg-stone-950 items-center justify-center px-8">
        <LinearGradient
          colors={gradientColors}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <ShoppingBag size={48} color="#78716c" />
        <Text className="text-stone-900 dark:text-white font-semibold text-lg mt-4 mb-2 text-center">Access Restricted</Text>
        <Text className="text-stone-500 dark:text-stone-400 text-center">Only the shop owner or manager can manage the WhatsApp Storefront.</Text>
        <Pressable onPress={() => router.back()} className="mt-6 bg-orange-500 px-6 py-3 rounded-xl active:opacity-90">
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={gradientColors}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 8 }} className="px-5">
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <View className="flex-row items-center gap-3 mb-4">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-xl bg-white/80 dark:bg-stone-900/80 items-center justify-center border border-stone-200 dark:border-stone-800"
              >
                <ArrowLeft size={20} color={isDark ? '#fff' : '#1c1917'} />
              </Pressable>
              <View className="flex-1">
                <Text style={{ fontFamily: 'Poppins-ExtraBold' }} className="text-stone-900 dark:text-white text-2xl font-extrabold tracking-tight">
                  WhatsApp Catalog
                </Text>
                <Text className="text-stone-500 text-sm">Share your products online</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Enable Toggle */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mx-5 mt-4">
          <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-10 h-10 rounded-xl bg-green-500/20 items-center justify-center">
                  <ShoppingBag size={20} color="#22c55e" />
                </View>
                <View>
                  <Text className="text-stone-900 dark:text-white font-medium">Enable Online Catalog</Text>
                  <Text className="text-stone-500 text-sm">
                    {catalogEnabled ? 'Your catalog is live' : 'Turn on to share products'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCatalogEnabled(!catalogEnabled);
                }}
                className={`w-12 h-7 rounded-full justify-center ${catalogEnabled ? 'bg-orange-500 items-end' : 'bg-stone-300 dark:bg-stone-700 items-start'}`}
              >
                <View className="w-5 h-5 rounded-full bg-white mx-1" />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {catalogEnabled && (
          <>
            {/* Shop Details */}
            <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mx-5 mt-4">
              <Text className="text-stone-500 text-xs font-semibold tracking-wide mb-3">Shop Details</Text>
              <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                {/* Shop Slug */}
                <View className="p-4 border-b border-stone-200 dark:border-stone-800">
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Shop Link Name</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-lg px-3 py-2.5 text-stone-900 dark:text-white"
                    placeholder={placeholders.catalogSlug}
                    placeholderTextColor="#57534e"
                    value={shopSlug || ''}
                    onChangeText={setShopSlug}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Description */}
                <View className="p-4 border-b border-stone-200 dark:border-stone-800">
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Shop Description</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-lg px-3 py-2.5 text-stone-900 dark:text-white"
                    placeholder={placeholders.catalogDescription}
                    placeholderTextColor="#57534e"
                    value={shopDescription}
                    onChangeText={setShopDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    style={{ minHeight: 72 }}
                  />
                </View>

                {/* WhatsApp Number */}
                <View className="p-4">
                  <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">WhatsApp Number</Text>
                  <TextInput
                    className="bg-stone-100 dark:bg-stone-800 rounded-lg px-3 py-2.5 text-stone-900 dark:text-white"
                    placeholder="e.g. 2348012345678"
                    placeholderTextColor="#57534e"
                    keyboardType="phone-pad"
                    value={whatsappNumber}
                    onChangeText={setWhatsappNumber}
                  />
                  <Text className="text-stone-400 text-xs mt-1">Include country code without +</Text>
                </View>
              </View>
            </Animated.View>

            {/* Catalog Link Ready */}
            {catalogUrl.url ? (
              <Animated.View entering={FadeInDown.delay(350).duration(600)} className="mx-5 mt-4">
                <Text className="text-stone-500 text-xs font-semibold tracking-wide mb-3">Your Catalog</Text>
                <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
                  <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center">
                      <Check size={20} color="#22c55e" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-stone-900 dark:text-white font-semibold">Your link is ready ✅</Text>
                      <Text className="text-stone-500 text-sm">{selectedCount} product{selectedCount !== 1 ? 's' : ''} in catalog</Text>
                    </View>
                  </View>
                  {catalogUrl.truncated && (
                    <Text className="text-amber-500 text-xs mb-3">
                      ⚠️ Some products were excluded to fit the link. Try selecting fewer products.
                    </Text>
                  )}
                  {/* Share on WhatsApp */}
                  <Pressable
                    onPress={handleShare}
                    className="bg-green-600 rounded-xl py-3.5 flex-row items-center justify-center gap-2 mb-3"
                  >
                    <Share2 size={18} color="#fff" />
                    <Text className="text-white font-semibold">Share on WhatsApp</Text>
                  </Pressable>
                  {/* Preview + Copy row */}
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={handlePreview}
                      className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-xl py-3 flex-row items-center justify-center gap-2"
                    >
                      <Eye size={18} color={isDark ? '#a8a29e' : '#57534e'} />
                      <Text className="text-stone-700 dark:text-stone-300 font-medium">Preview</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleCopyLink}
                      className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-xl py-3 flex-row items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check size={18} color="#22c55e" />
                          <Text className="text-emerald-500 font-medium">Copied!</Text>
                        </>
                      ) : (
                        <>
                          <Copy size={18} color={isDark ? '#a8a29e' : '#57534e'} />
                          <Text className="text-stone-700 dark:text-stone-300 font-medium">Copy Link</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            ) : null}

            {/* Product Selection */}
            <Animated.View entering={FadeInDown.delay(400).duration(600)} className="mx-5 mt-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-stone-500 text-xs font-semibold tracking-wide">
                  Catalog Products ({selectedCount}/{products.length})
                </Text>
                <Pressable onPress={selectAll} className="active:opacity-70">
                  <Text className="text-orange-500 text-xs font-medium">Select All</Text>
                </Pressable>
              </View>

              {products.length === 0 ? (
                <View className="bg-white/80 dark:bg-stone-900/80 rounded-xl border border-stone-200 dark:border-stone-800 p-6 items-center">
                  <Text className="text-stone-500 text-sm text-center">
                    No products yet. Add products in the Inventory tab first.
                  </Text>
                </View>
              ) : (
                <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                  {Object.entries(productsByCategory).map(([category, catProducts], catIndex) => (
                    <View key={category}>
                      <View className="px-4 py-2 bg-stone-100 dark:bg-stone-800/60">
                        <Text className="text-stone-500 dark:text-stone-400 text-xs font-semibold">{category}</Text>
                      </View>
                      {catProducts.map((product, index) => {
                        const selected = isProductSelected(product.id);
                        return (
                          <Pressable
                            key={product.id}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              toggleProduct(product.id);
                            }}
                            className={`flex-row items-center p-3 px-4 ${
                              index < catProducts.length - 1 ? 'border-b border-stone-200/50 dark:border-stone-800/50' : ''
                            } active:bg-stone-200/30 dark:active:bg-stone-800/30`}
                          >
                            <View
                              className={`w-6 h-6 rounded-md mr-3 items-center justify-center ${
                                selected
                                  ? 'bg-orange-500'
                                  : 'bg-stone-200 dark:bg-stone-700 border border-stone-300 dark:border-stone-600'
                              }`}
                            >
                              {selected && <Check size={14} color="#fff" />}
                            </View>
                            <View className="flex-1">
                              <Text className="text-stone-900 dark:text-white text-sm font-medium">{product.name}</Text>
                            </View>
                            <Text className="text-orange-500 font-semibold text-sm">
                              {formatNaira(product.sellingPrice)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Enable Catalog First */}
      <ConfirmDialog
        visible={showEnableFirst}
        onClose={() => setShowEnableFirst(false)}
        title="Enable Catalog"
        message="Please enable your online catalog first."
        variant="info"
        showCancel={false}
      />
    </View>
  );
}

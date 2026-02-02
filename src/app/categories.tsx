import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Package } from 'lucide-react-native';
import { useRetailStore, type Category } from '@/store/retailStore';
import { useState, useCallback, useMemo } from 'react';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const PRESET_COLORS = [
  '#E67E22', '#27AE60', '#3498DB', '#F39C12', '#9B59B6',
  '#1ABC9C', '#E74C3C', '#34495E', '#2196F3', '#FF9800',
  '#E91E63', '#4CAF50', '#795548', '#607D8B', '#FF5722',
];

const PRESET_ICONS = [
  '📦', '☕', '🥛', '🌾', '🧴', '❄️', '🍪', '🏠',
  '💇', '💈', '💊', '🍚', '🍖', '🥤', '📱', '🎧',
  '👔', '🧵', '👟', '💍', '🍳', '🧼', '🔌', '🔋',
  '🛒', '✨', '🎁', '🧹', '🪥', '🍺', '🧊', '🔧',
];

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const categories = useRetailStore((s) => s.categories);
  const products = useRetailStore((s) => s.products);
  const addCategory = useRetailStore((s) => s.addCategory);
  const updateCategory = useRetailStore((s) => s.updateCategory);
  const deleteCategory = useRetailStore((s) => s.deleteCategory);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formIcon, setFormIcon] = useState(PRESET_ICONS[0]);

  // Count products per category
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  const openAddModal = useCallback(() => {
    setEditingCategory(null);
    setFormName('');
    setFormColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setFormIcon(PRESET_ICONS[0]);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormColor(category.color);
    setFormIcon(category.icon);
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    const name = formName.trim();
    if (!name) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingCategory) {
      // Check if name changed — update products with old category name
      if (editingCategory.name !== name) {
        const store = useRetailStore.getState();
        const affectedProducts = store.products.filter((p) => p.category === editingCategory.name);
        for (const p of affectedProducts) {
          store.updateProduct(p.id, { category: name });
        }
      }
      updateCategory(editingCategory.id, { name, color: formColor, icon: formIcon });
    } else {
      addCategory({ name, color: formColor, icon: formIcon });
    }

    setShowModal(false);
  }, [formName, formColor, formIcon, editingCategory, addCategory, updateCategory]);

  const handleDelete = useCallback((category: Category) => {
    const count = productCounts[category.name] || 0;

    Alert.alert(
      'Delete Category',
      count > 0
        ? `"${category.name}" has ${count} product${count > 1 ? 's' : ''}. Products will keep their category name but it won't appear as a filter. Delete anyway?`
        : `Delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteCategory(category.id);
          },
        },
      ]
    );
  }, [deleteCategory, productCounts]);

  const gradientColors: [string, string, string] = isDark
    ? ['#292524', '#1c1917', '#0c0a09']
    : ['#f5f5f4', '#fafaf9', '#ffffff'];

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
                  Categories
                </Text>
                <Text className="text-stone-500 text-sm">{categories.length} categories</Text>
              </View>
              <Pressable
                onPress={openAddModal}
                className="bg-orange-500 w-10 h-10 rounded-xl items-center justify-center active:scale-95"
              >
                <Plus size={20} color="white" />
              </Pressable>
            </View>
          </Animated.View>
        </View>

        {/* Categories List */}
        <View className="px-5 mt-2">
          {categories.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <View className="bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 items-center">
                <Package size={48} color="#78716c" />
                <Text className="text-stone-900 dark:text-white font-semibold text-lg mt-4 mb-2">No categories yet</Text>
                <Text className="text-stone-500 text-sm text-center mb-4">Add categories to organize your products</Text>
                <Pressable onPress={openAddModal} className="bg-orange-500 px-6 py-3 rounded-xl active:opacity-90">
                  <Text className="text-white font-semibold">Add Category</Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : (
            <View className="gap-3">
              {categories.map((category, index) => {
                const count = productCounts[category.name] || 0;
                return (
                  <Animated.View
                    key={category.id}
                    entering={FadeIn.delay(100 + index * 40).duration(400)}
                    layout={Layout.springify()}
                  >
                    <View
                      className="bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border border-stone-200 dark:border-stone-800 flex-row items-center"
                    >
                      {/* Color indicator */}
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: category.color + '30' }}
                      >
                        <Text className="text-xl">{category.icon}</Text>
                      </View>

                      {/* Name + count */}
                      <View className="flex-1">
                        <Text className="text-stone-900 dark:text-white font-medium text-base">{category.name}</Text>
                        <Text className="text-stone-500 text-sm">
                          {count} product{count !== 1 ? 's' : ''}
                        </Text>
                      </View>

                      {/* Color dot */}
                      <View
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: category.color }}
                      />

                      {/* Actions */}
                      <Pressable
                        onPress={() => openEditModal(category)}
                        className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 items-center justify-center mr-2 active:opacity-70"
                      >
                        <Pencil size={16} color={isDark ? '#a8a29e' : '#57534e'} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(category)}
                        className="w-9 h-9 rounded-lg bg-red-500/10 items-center justify-center active:opacity-70"
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </Pressable>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <Pressable className="flex-1 bg-black/60" onPress={() => setShowModal(false)} />
        <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
          <View className="p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-stone-900 dark:text-white text-xl font-bold">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <X size={24} color="#78716c" />
              </Pressable>
            </View>

            <View className="gap-5">
              {/* Name */}
              <View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Category Name *</Text>
                <TextInput
                  className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white text-base"
                  placeholder="e.g. Hair Products, Drinks, Electronics"
                  placeholderTextColor="#57534e"
                  value={formName}
                  onChangeText={setFormName}
                  autoFocus
                />
              </View>

              {/* Icon */}
              <View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {PRESET_ICONS.map((icon) => (
                      <Pressable
                        key={icon}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setFormIcon(icon);
                        }}
                        className={`w-11 h-11 rounded-xl items-center justify-center border-2 ${formIcon === icon ? 'border-orange-500 bg-orange-500/10' : 'border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800'}`}
                      >
                        <Text className="text-lg">{icon}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Color */}
              <View>
                <Text className="text-stone-500 dark:text-stone-400 text-sm mb-2">Color</Text>
                <View className="flex-row flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFormColor(color);
                      }}
                      className={`w-10 h-10 rounded-xl items-center justify-center border-2 ${formColor === color ? 'border-white dark:border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    >
                      {formColor === color && <Check size={18} color="#fff" />}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Preview */}
              {formName.trim() && (
                <View className="bg-stone-100/50 dark:bg-stone-800/50 rounded-xl p-4 flex-row items-center gap-3">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: formColor + '30' }}
                  >
                    <Text className="text-xl">{formIcon}</Text>
                  </View>
                  <View>
                    <Text className="text-stone-900 dark:text-white font-medium">{formName.trim()}</Text>
                    <Text className="text-stone-500 text-xs">Preview</Text>
                  </View>
                  <View className="w-4 h-4 rounded-full ml-auto" style={{ backgroundColor: formColor }} />
                </View>
              )}

              {/* Save */}
              <Pressable
                onPress={handleSave}
                className={`py-4 rounded-xl active:opacity-90 ${formName.trim() ? 'bg-orange-500' : 'bg-stone-300 dark:bg-stone-700'}`}
                disabled={!formName.trim()}
              >
                <Text className="text-white font-semibold text-center text-lg">
                  {editingCategory ? 'Save Changes' : 'Add Category'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

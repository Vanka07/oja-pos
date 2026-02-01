import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronLeft,
  UserCircle
} from 'lucide-react-native';
import { useStaffStore, hasPermission, type StaffMember, type StaffRole } from '@/store/staffStore';
import { formatNaira } from '@/store/retailStore';
import { useState, useMemo, useCallback } from 'react';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const ROLE_COLORS: Record<StaffRole, { bg: string; text: string; border: string }> = {
  owner: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  manager: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  cashier: { bg: 'bg-stone-700/40', text: 'text-stone-600 dark:text-stone-300', border: 'border-stone-600' },
};

const ROLE_ICONS: Record<StaffRole, React.ReactNode> = {
  owner: <ShieldAlert size={16} color="#f59e0b" />,
  manager: <ShieldCheck size={16} color="#3b82f6" />,
  cashier: <Shield size={16} color="#a8a29e" />,
};

export default function StaffScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState<'staff' | 'activity'>('staff');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pin: '',
    role: 'cashier' as StaffRole,
  });

  const staff = useStaffStore((s) => s.staff);
  const currentStaff = useStaffStore((s) => s.currentStaff);
  const activities = useStaffStore((s) => s.activities);
  const addStaff = useStaffStore((s) => s.addStaff);
  const updateStaff = useStaffStore((s) => s.updateStaff);
  const removeStaff = useStaffStore((s) => s.removeStaff);

  const isOwner = currentStaff?.role === 'owner' || staff.length === 0;

  const recentActivities = useMemo(() => activities.slice(0, 50), [activities]);

  const resetForm = useCallback(() => {
    setFormData({ name: '', phone: '', pin: '', role: 'cashier' });
  }, []);

  const handleAddStaff = useCallback(() => {
    if (!formData.name || formData.pin.length !== 4) return;
    // Check for duplicate PIN
    const pinExists = staff.some((s) => s.pin === formData.pin);
    if (pinExists) {
      Alert.alert('Duplicate PIN', 'Another staff member already uses this PIN. Choose a different one.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addStaff({
      name: formData.name,
      phone: formData.phone,
      pin: formData.pin,
      role: formData.role,
      active: true,
    });
    resetForm();
    setShowAddModal(false);
  }, [formData, staff, addStaff, resetForm]);

  const handleEditStaff = useCallback(() => {
    if (!editingStaff || !formData.name) return;
    // Check for duplicate PIN (excluding current staff)
    if (formData.pin.length === 4) {
      const pinExists = staff.some((s) => s.pin === formData.pin && s.id !== editingStaff.id);
      if (pinExists) {
        Alert.alert('Duplicate PIN', 'Another staff member already uses this PIN.');
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updates: Partial<StaffMember> = {
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
    };
    if (formData.pin.length === 4) {
      updates.pin = formData.pin;
    }
    updateStaff(editingStaff.id, updates);
    setShowEditModal(false);
    setEditingStaff(null);
    resetForm();
  }, [editingStaff, formData, staff, updateStaff, resetForm]);

  const openEditModal = useCallback((member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      phone: member.phone,
      pin: '',
      role: member.role,
    });
    setShowEditModal(true);
  }, []);

  const handleDeleteStaff = useCallback((member: StaffMember) => {
    Alert.alert(
      'Remove Staff',
      `Are you sure you want to remove ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeStaff(member.id);
          },
        },
      ]
    );
  }, [removeStaff]);

  const toggleActive = useCallback((member: StaffMember) => {
    updateStaff(member.id, { active: !member.active });
  }, [updateStaff]);

  const RoleSelector = ({ selected, onSelect }: { selected: StaffRole; onSelect: (r: StaffRole) => void }) => (
    <View className="flex-row gap-2">
      {(['owner', 'manager', 'cashier'] as StaffRole[]).map((role) => (
        <Pressable
          key={role}
          onPress={() => onSelect(role)}
          className={`flex-1 py-3 rounded-xl border flex-row items-center justify-center gap-2 ${
            selected === role
              ? `${ROLE_COLORS[role].bg} ${ROLE_COLORS[role].border}`
              : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700'
          }`}
        >
          {ROLE_ICONS[role]}
          <Text className={`font-medium capitalize ${
            selected === role ? ROLE_COLORS[role].text : 'text-stone-400'
          }`}>
            {role}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const StaffForm = ({ isEdit }: { isEdit: boolean }) => (
    <View className="gap-4">
      <View>
        <Text className="text-stone-400 text-sm mb-2">Name *</Text>
        <TextInput
          className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
          placeholder="e.g. Chidi Okafor"
          placeholderTextColor="#57534e"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />
      </View>

      <View>
        <Text className="text-stone-400 text-sm mb-2">Phone</Text>
        <TextInput
          className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-stone-900 dark:text-white"
          placeholder="e.g. 08012345678"
          placeholderTextColor="#57534e"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
        />
      </View>

      <View>
        <Text className="text-stone-400 text-sm mb-2">
          {isEdit ? 'New PIN (leave blank to keep current)' : '4-Digit PIN *'}
        </Text>
        <TextInput
          className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-4 text-stone-900 dark:text-white text-center text-2xl font-bold tracking-[12px]"
          placeholder="• • • •"
          placeholderTextColor="#57534e"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={formData.pin}
          onChangeText={(text) => setFormData({ ...formData, pin: text.replace(/[^0-9]/g, '') })}
        />
      </View>

      <View>
        <Text className="text-stone-400 text-sm mb-2">Role</Text>
        <RoleSelector
          selected={formData.role}
          onSelect={(role) => setFormData({ ...formData, role })}
        />
      </View>

      <Pressable
        onPress={isEdit ? handleEditStaff : handleAddStaff}
        className="bg-orange-500 py-4 rounded-xl active:opacity-90 mt-2"
      >
        <Text className="text-white font-semibold text-center text-lg">
          {isEdit ? 'Save Changes' : 'Add Staff Member'}
        </Text>
      </Pressable>
    </View>
  );

  const formatActivityTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const actDate = dateStr.split('T')[0];
    const time = date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    if (actDate === today) return time;
    return `${date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })} ${time}`;
  };

  const ACTION_COLORS: Record<string, string> = {
    sale: 'text-emerald-400',
    restock: 'text-blue-400',
    price_change: 'text-amber-400',
    expense: 'text-red-400',
    credit_payment: 'text-purple-400',
    login: 'text-stone-400',
    product_add: 'text-emerald-400',
    product_delete: 'text-red-400',
  };

  return (
    <View className="flex-1 bg-stone-50 dark:bg-stone-950">
      <LinearGradient
        colors={isDark ? ['#292524', '#1c1917', '#0c0a09'] : ['#f5f5f4', '#fafaf9', '#ffffff']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 items-center justify-center"
              >
                <ChevronLeft size={20} color="#a8a29e" />
              </Pressable>
              <View>
                <Text className="text-stone-500 text-sm font-medium tracking-wide uppercase">
                  Management
                </Text>
                <Text className="text-stone-900 dark:text-white text-2xl font-bold tracking-tight">
                  Staff & Roles
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => { resetForm(); setShowAddModal(true); }}
              className="bg-orange-500 w-10 h-10 rounded-full items-center justify-center active:scale-95"
            >
              <Plus size={20} color="white" />
            </Pressable>
          </View>
        </Animated.View>
      </View>

      {/* Tab Selector */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} className="px-5 mb-4">
        <View className="flex-row bg-white/80 dark:bg-stone-900/80 rounded-xl p-1 border border-stone-200 dark:border-stone-800">
          <Pressable
            onPress={() => setActiveTab('staff')}
            className={`flex-1 py-3 rounded-lg ${activeTab === 'staff' ? 'bg-orange-500' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'staff' ? 'text-white' : 'text-stone-400'}`}>
              Staff ({staff.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('activity')}
            className={`flex-1 py-3 rounded-lg ${activeTab === 'activity' ? 'bg-orange-500' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'activity' ? 'text-white' : 'text-stone-400'}`}>
              Activity Log
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'staff' ? (
          <>
            {staff.length === 0 ? (
              <Animated.View entering={FadeIn.duration(400)} className="items-center py-16">
                <Users size={48} color="#57534e" />
                <Text className="text-stone-500 text-lg mt-4 mb-2">No staff members yet</Text>
                <Text className="text-stone-600 text-center mb-6">
                  Add your first staff member to enable role-based access
                </Text>
                <Pressable
                  onPress={() => { resetForm(); setShowAddModal(true); }}
                  className="bg-orange-500 px-6 py-3 rounded-xl active:opacity-90"
                >
                  <Text className="text-white font-semibold">Add First Staff</Text>
                </Pressable>
              </Animated.View>
            ) : (
              <View className="gap-3">
                {staff.map((member, index) => (
                  <Animated.View
                    key={member.id}
                    entering={FadeIn.delay(100 + index * 50).duration(400)}
                  >
                    <View className={`bg-white/80 dark:bg-stone-900/80 rounded-xl p-4 border ${
                      !member.active ? 'border-stone-200 dark:border-stone-800 opacity-60' : 'border-stone-200 dark:border-stone-800'
                    }`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          <View className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center">
                            <Text className="text-stone-900 dark:text-white text-lg font-bold">
                              {member.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text className="text-stone-900 dark:text-white font-medium text-base">{member.name}</Text>
                              {currentStaff?.id === member.id && (
                                <View className="bg-emerald-500/20 px-2 py-0.5 rounded">
                                  <Text className="text-emerald-400 text-xs">Active</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-stone-500 text-sm">{member.phone || 'No phone'}</Text>
                          </View>
                        </View>
                        <View className="items-end gap-2">
                          <View className={`px-3 py-1 rounded-full flex-row items-center gap-1 ${ROLE_COLORS[member.role].bg}`}>
                            {ROLE_ICONS[member.role]}
                            <Text className={`text-xs font-medium capitalize ${ROLE_COLORS[member.role].text}`}>
                              {member.role}
                            </Text>
                          </View>
                          <View className="flex-row gap-2">
                            <Pressable
                              onPress={() => toggleActive(member)}
                              className={`px-2 py-1 rounded ${member.active ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
                            >
                              <Text className={`text-xs ${member.active ? 'text-emerald-400' : 'text-red-400'}`}>
                                {member.active ? 'Enabled' : 'Disabled'}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => openEditModal(member)}
                              className="bg-stone-200 dark:bg-stone-800 p-1.5 rounded"
                            >
                              <Edit3 size={14} color="#a8a29e" />
                            </Pressable>
                            {isOwner && member.role !== 'owner' && (
                              <Pressable
                                onPress={() => handleDeleteStaff(member)}
                                className="bg-red-500/20 p-1.5 rounded"
                              >
                                <Trash2 size={14} color="#ef4444" />
                              </Pressable>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {recentActivities.length === 0 ? (
              <View className="items-center py-16">
                <Clock size={48} color="#57534e" />
                <Text className="text-stone-500 text-lg mt-4">No activity yet</Text>
                <Text className="text-stone-600 text-center mt-2">
                  Staff actions will be logged here
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {recentActivities.map((activity, index) => (
                  <Animated.View
                    key={activity.id}
                    entering={FadeIn.delay(50 + index * 30).duration(300)}
                  >
                    <View className="bg-white/60 dark:bg-stone-900/60 rounded-xl p-3 border border-stone-200 dark:border-stone-800">
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center gap-2">
                          <View className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-800 items-center justify-center">
                            <Text className="text-stone-900 dark:text-white text-xs font-bold">
                              {activity.staffName.charAt(0)}
                            </Text>
                          </View>
                          <Text className="text-stone-900 dark:text-white font-medium text-sm">{activity.staffName}</Text>
                        </View>
                        <Text className="text-stone-600 text-xs">{formatActivityTime(activity.createdAt)}</Text>
                      </View>
                      <View className="flex-row items-center justify-between ml-9">
                        <Text className="text-stone-400 text-sm flex-1" numberOfLines={2}>
                          {activity.description}
                        </Text>
                        {activity.amount !== undefined && (
                          <Text className={`font-medium text-sm ml-2 ${ACTION_COLORS[activity.action] || 'text-stone-400'}`}>
                            {formatNaira(activity.amount)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Staff Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable className="flex-1 bg-black/60" onPress={() => setShowAddModal(false)} />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-stone-900 dark:text-white text-xl font-bold">Add Staff Member</Text>
                  <Pressable onPress={() => setShowAddModal(false)}>
                    <X size={24} color="#78716c" />
                  </Pressable>
                </View>
                {staff.length === 0 && (
                  <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
                    <Text className="text-amber-400 text-sm">
                      👑 First staff member will automatically be set as Owner
                    </Text>
                  </View>
                )}
                <StaffForm isEdit={false} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable className="flex-1 bg-black/60" onPress={() => setShowEditModal(false)} />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-stone-900 dark:text-white text-xl font-bold">Edit Staff</Text>
                  <Pressable onPress={() => setShowEditModal(false)}>
                    <X size={24} color="#78716c" />
                  </Pressable>
                </View>
                <StaffForm isEdit={true} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

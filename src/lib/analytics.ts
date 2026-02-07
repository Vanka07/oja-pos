import { supabase } from './supabase';
import { Platform } from 'react-native';
import * as Application from 'expo-application';

// Simple analytics - tracks key events to Supabase
// View in Supabase Dashboard > Table Editor > analytics_events

type EventName = 
  | 'app_open'
  | 'shop_created'
  | 'first_sale'
  | 'sale_completed'
  | 'product_added'
  | 'staff_added'
  | 'subscription_started'
  | 'cloud_sync_enabled';

interface AnalyticsEvent {
  event: EventName;
  shop_id?: string;
  properties?: Record<string, any>;
}

let sessionId: string | null = null;
let analyticsEnabled = true;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  return sessionId;
}

export async function track(event: EventName, shopId?: string, properties?: Record<string, any>) {
  if (!analyticsEnabled) return;
  try {
    const { error } = await supabase.from('analytics_events').insert({
      event,
      shop_id: shopId || null,
      session_id: getSessionId(),
      platform: Platform.OS,
      app_version: Application.nativeApplicationVersion || 'unknown',
      properties: properties || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Silent fail - analytics should never break the app
      console.log('[Analytics] Failed to track:', error.message);
      if (error.message?.includes('Could not find the table') || error.message?.includes('404')) {
        analyticsEnabled = false;
      }
    }
  } catch {
    // Silent fail
  }
}

// Track daily active shops (call on app open)
export async function trackDailyActive(shopId: string) {
  if (!analyticsEnabled) return;
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await supabase.from('daily_active_shops').upsert(
      { shop_id: shopId, date: today },
      { onConflict: 'shop_id,date' }
    );
  } catch {
    // Silent fail
  }
}

// Get stats (for admin dashboard later)
export async function getStats() {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dailyActive, weeklyActive, totalShops, totalSales] = await Promise.all([
    supabase.from('daily_active_shops').select('shop_id', { count: 'exact' }).eq('date', today),
    supabase.from('daily_active_shops').select('shop_id', { count: 'exact' }).gte('date', weekAgo),
    supabase.from('shops').select('id', { count: 'exact' }),
    supabase.from('analytics_events').select('id', { count: 'exact' }).eq('event', 'sale_completed'),
  ]);

  return {
    dailyActiveShops: dailyActive.count || 0,
    weeklyActiveShops: weeklyActive.count || 0,
    totalShops: totalShops.count || 0,
    totalSales: totalSales.count || 0,
  };
}

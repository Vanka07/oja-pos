-- Analytics Events Table
-- Tracks key user actions for growth metrics

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  session_id TEXT,
  platform TEXT,
  app_version TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Active Shops (for DAU tracking)
CREATE TABLE IF NOT EXISTS daily_active_shops (
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  PRIMARY KEY (shop_id, date)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_shop ON analytics_events(shop_id);
CREATE INDEX IF NOT EXISTS idx_daily_active_date ON daily_active_shops(date);

-- RLS Policies (analytics is write-only for users, read for admins)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_active_shops ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics (anonymous tracking)
CREATE POLICY "Anyone can insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Anyone can insert daily active
CREATE POLICY "Anyone can insert daily active" ON daily_active_shops
  FOR INSERT WITH CHECK (true);

-- Only service role can read (for admin dashboard)
CREATE POLICY "Service role can read analytics" ON analytics_events
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read daily active" ON daily_active_shops
  FOR SELECT USING (auth.role() = 'service_role');

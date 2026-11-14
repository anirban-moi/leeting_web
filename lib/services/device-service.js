import { createClient, isSupabaseConfigured } from '../supabase/client.js';
import { initialUserData } from '../mock-data.js';

export async function fetchRegisteredDevices(userId) {
  if (!isSupabaseConfigured || !userId) {
    return initialUserData.registeredDevices;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('device_registry')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return initialUserData.registeredDevices;
  }

  return data.map((d, index) => ({
    id: d.device_id,
    name: d.device_name,
    browser: `${d.browser_type} Extension`,
    os: 'Synced OS',
    version: d.extension_version,
    lastSeen: new Date(d.last_seen_at).toLocaleDateString(),
    isCurrent: index === 0,
  }));
}

export async function registerDeviceHeartbeat(userId, { deviceId, deviceName, browserType, extensionVersion }) {
  if (!isSupabaseConfigured || !userId) return false;

  const supabase = createClient();
  const { error } = await supabase
    .from('device_registry')
    .upsert({
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName,
      browser_type: browserType,
      extension_version: extensionVersion,
      last_seen_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,device_id',
    });

  return !error;
}

// Alias for backwards compatibility with bridge
export const registerDevice = registerDeviceHeartbeat;

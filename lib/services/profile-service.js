import { createClient, isSupabaseConfigured } from '../supabase/client.js';
import { initialUserData } from '../mock-data.js';

export async function fetchUserProfile(userId) {
  if (!isSupabaseConfigured || !userId) {
    return initialUserData.profile;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return initialUserData.profile;
  }

  return {
    username: data.leetcode_username || data.display_name || initialUserData.profile.username,
    avatarUrl: data.avatar_url || initialUserData.profile.avatarUrl,
    ranking: initialUserData.profile.ranking,
    streak: data.current_streak ?? initialUserData.profile.streak,
    leetCoins: data.leetcoins ?? initialUserData.profile.leetCoins,
    totalSolved: initialUserData.profile.totalSolved,
    totalAvailable: initialUserData.profile.totalAvailable,
    acceptanceRate: initialUserData.profile.acceptanceRate,
    connectionStatus: 'CONNECTED',
    lastSynced: 'Just now',
    email: data.email,
  };
}

export async function updateUserProfile(userId, updates) {
  if (!isSupabaseConfigured || !userId) return false;

  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    });

  return !error;
}

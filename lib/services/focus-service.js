import { createClient, isSupabaseConfigured } from '../supabase/client.js';
import { initialUserData } from '../mock-data.js';

export async function logFocusSession(userId, { durationMinutes, completed = true, notes = '' }) {
  if (!isSupabaseConfigured || !userId) {
    // In local mode, sessions succeed silently
    return { success: true, localOnly: true };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: userId,
      started_at: new Date().toISOString(),
      duration_minutes: durationMinutes,
      completed,
      notes,
    })
    .select()
    .single();

  if (error) {
    console.warn('Failed to log focus session to Supabase:', error);
    return { success: false, error };
  }

  return { success: true, session: data };
}

export async function fetchFocusHistory(userId) {
  if (!isSupabaseConfigured || !userId) {
    return initialUserData.recentFocusSessions || [];
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      return initialUserData.recentFocusSessions || [];
    }
    return data;
  } catch {
    return initialUserData.recentFocusSessions || [];
  }
}

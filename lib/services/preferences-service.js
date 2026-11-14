import { createClient, isSupabaseConfigured } from '../supabase/client.js';
import { initialUserData } from '../mock-data.js';

export async function fetchUserPreferences(userId) {
  if (!isSupabaseConfigured || !userId) {
    return {
      focusRules: initialUserData.focusRules,
      quietHours: initialUserData.quietHours,
      notifications: initialUserData.notificationPreferences,
      solveBeforeScroll: initialUserData.focusPreferences.solveBeforeScroll,
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return {
      focusRules: initialUserData.focusRules,
      quietHours: initialUserData.quietHours,
      notifications: initialUserData.notificationPreferences,
      solveBeforeScroll: initialUserData.focusPreferences.solveBeforeScroll,
    };
  }

  return {
    solveBeforeScroll: data.solve_before_scroll ?? true,
    quietHours: {
      enabled: data.quiet_hours_enabled ?? true,
      start: data.quiet_hours_start?.slice(0, 5) || '22:30',
      end: data.quiet_hours_end?.slice(0, 5) || '07:00',
    },
    notifications: {
      dailyChallengeMorning: data.notify_daily_challenge ?? true,
      contestAlert45Min: data.notify_contest_minutes_before === 45,
      streakFreezeWarning: true,
    },
    focusRules: initialUserData.focusRules.map((rule) => ({
      ...rule,
      enabled: Array.isArray(data.blocked_sites)
        ? data.blocked_sites.includes(rule.id)
        : rule.enabled,
    })),
  };
}

export async function saveUserPreferences(userId, prefs) {
  if (!isSupabaseConfigured || !userId) return false;

  const supabase = createClient();
  const payload = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (prefs.solveBeforeScroll !== undefined) {
    payload.solve_before_scroll = prefs.solveBeforeScroll;
  }
  if (prefs.quietHours?.enabled !== undefined) {
    payload.quiet_hours_enabled = prefs.quietHours.enabled;
  }
  if (prefs.quietHours?.start) {
    payload.quiet_hours_start = prefs.quietHours.start.length === 5 ? `${prefs.quietHours.start}:00` : prefs.quietHours.start;
  }
  if (prefs.quietHours?.end) {
    payload.quiet_hours_end = prefs.quietHours.end.length === 5 ? `${prefs.quietHours.end}:00` : prefs.quietHours.end;
  }
  if (prefs.notifications?.dailyChallengeMorning !== undefined) {
    payload.notify_daily_challenge = prefs.notifications.dailyChallengeMorning;
  }
  if (prefs.notifications?.contestAlert45Min !== undefined) {
    payload.notify_contest_minutes_before = prefs.notifications.contestAlert45Min ? 45 : 0;
  }
  if (prefs.focusRules) {
    payload.blocked_sites = prefs.focusRules.filter((r) => r.enabled).map((r) => r.id);
  }

  const { error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to save user preferences to Supabase:', error);
    return false;
  }

  return true;
}

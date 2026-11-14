import { createClient, isSupabaseConfigured } from '../supabase/client';
import { initialUserData } from '../mock-data';

export async function fetchActivityLogs(userId) {
  if (!isSupabaseConfigured || !userId) {
    return initialUserData.calendarGrid;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(35);

  if (error || !data || data.length === 0) {
    return initialUserData.calendarGrid;
  }

  return data;
}

export async function logDailyActivitySnapshot(userId, { logDate, problemsCount, dailyChallengeSolved, title, difficulty, streak }) {
  if (!isSupabaseConfigured || !userId) return false;

  const supabase = createClient();
  const { error } = await supabase
    .from('activity_logs')
    .upsert({
      user_id: userId,
      log_date: logDate,
      problems_solved_count: problemsCount,
      daily_challenge_solved: dailyChallengeSolved,
      daily_challenge_title: title,
      daily_challenge_difficulty: difficulty,
      streak_count: streak,
    }, {
      onConflict: 'user_id,log_date',
    });

  return !error;
}

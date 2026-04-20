'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type {
  PubSession,
  SessionDrink,
  BarTheme,
  RoundThemeId,
  ChallengeAttempt,
  TriviaAttempt,
  HotTakeVoteRecord,
  PredictionPick,
  SessionReview,
  ROUND_THEMES,
} from '@/lib/types';

interface StartSessionParams {
  groupId: string;
  pubName: string;
  city: string;
  barTheme: BarTheme;
  roundTheme: RoundThemeId;
  menuPhotoUrl?: string;
}

interface EndSessionStats {
  durationMs: number;
  drinksCount: number;
  questionsAnswered: number;
  questionsAsked: number;
  challengesDone: number;
  roundsBought: number;
  unansweredCount: number;
}

export function usePubSession() {
  const [session, setSession] = useState<PubSession | null>(null);
  const [drinks, setDrinks] = useState<SessionDrink[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Start a new pub session
  const startSession = useCallback(async (params: StartSessionParams) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return { error: new Error('Not authenticated') }; }

    const { data, error } = await supabase
      .from('pub_sessions')
      .insert({
        user_id: user.id,
        group_id: params.groupId,
        pub_name: params.pubName,
        city: params.city,
        bar_theme: params.barTheme,
        round_theme: params.roundTheme,
        menu_photo_url: params.menuPhotoUrl || null,
      })
      .select()
      .single();

    if (data) {
      setSession(data);
      setDrinks([]);
    }
    setLoading(false);
    return { data, error };
  }, []);

  // Log a drink during the session
  const logDrink = useCallback(async (drinkName: string, drinkEmoji: string) => {
    if (!session) return { error: new Error('No active session') };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('session_drinks')
      .insert({
        session_id: session.id,
        user_id: user.id,
        drink_name: drinkName,
        drink_emoji: drinkEmoji,
      })
      .select()
      .single();

    if (data) {
      setDrinks(prev => [...prev, data]);
    }
    return { data, error };
  }, [session]);

  // Log a challenge attempt
  const logChallenge = useCallback(async (
    challengeId: string,
    status: 'done' | 'skipped',
    comment?: string,
    videoSent?: boolean,
  ) => {
    if (!session) return { error: new Error('No active session') };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('challenge_attempts')
      .insert({
        session_id: session.id,
        user_id: user.id,
        challenge_id: challengeId,
        status,
        comment: comment || null,
        video_sent: videoSent || false,
      })
      .select()
      .single();

    return { data, error };
  }, [session]);

  // Log a trivia attempt
  const logTrivia = useCallback(async (
    triviaQuestion: string,
    correctAnswer: string,
    userAnswer: string,
    isCorrect: boolean,
    stakeLevel: number,
    stakeLabel: string,
  ) => {
    if (!session) return { error: new Error('No active session') };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('trivia_attempts')
      .insert({
        session_id: session.id,
        user_id: user.id,
        trivia_question: triviaQuestion,
        correct_answer: correctAnswer,
        user_answer: userAnswer,
        is_correct: isCorrect,
        stake_level: stakeLevel,
        stake_label: stakeLabel,
      })
      .select()
      .single();

    return { data, error };
  }, [session]);

  // Log a hot take vote
  const logHotTakeVote = useCallback(async (
    hotTakeId: string,
    statement: string,
    vote: 'agree' | 'disagree',
  ) => {
    if (!session) return { error: new Error('No active session') };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('hot_take_votes')
      .insert({
        session_id: session.id,
        user_id: user.id,
        hot_take_id: hotTakeId,
        statement,
        vote,
      })
      .select()
      .single();

    return { data, error };
  }, [session]);

  // Log a prediction pick
  const logPrediction = useCallback(async (
    predictionId: string,
    prompt: string,
    pickedValue: string,
  ) => {
    if (!session) return { error: new Error('No active session') };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('prediction_picks')
      .insert({
        session_id: session.id,
        user_id: user.id,
        prediction_id: predictionId,
        prompt,
        picked_value: pickedValue,
      })
      .select()
      .single();

    return { data, error };
  }, [session]);

  // End the session and save the review
  const endSession = useCallback(async (stats: EndSessionStats) => {
    if (!session) return { error: new Error('No active session') };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    // Update the session with end time
    await supabase
      .from('pub_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_ms: stats.durationMs,
      })
      .eq('id', session.id);

    // Save the session review
    const { data, error } = await supabase
      .from('session_reviews')
      .insert({
        session_id: session.id,
        user_id: user.id,
        duration_ms: stats.durationMs,
        drinks_count: stats.drinksCount,
        questions_answered: stats.questionsAnswered,
        questions_asked: stats.questionsAsked,
        challenges_done: stats.challengesDone,
        rounds_bought: stats.roundsBought,
        unanswered_count: stats.unansweredCount,
      })
      .select()
      .single();

    setSession(null);
    setDrinks([]);
    return { data, error };
  }, [session]);

  // Fetch past sessions for the group
  const fetchPastSessions = useCallback(async (groupId: string) => {
    const { data, error } = await supabase
      .from('session_summary_view')
      .select('*')
      .eq('group_id', groupId)
      .order('started_at', { ascending: false })
      .limit(20);

    return { data, error };
  }, []);

  return {
    session,
    drinks,
    loading,
    startSession,
    logDrink,
    logChallenge,
    logTrivia,
    logHotTakeVote,
    logPrediction,
    endSession,
    fetchPastSessions,
  };
}

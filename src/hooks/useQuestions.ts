'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type {
  Question,
  QuestionWithStatus,
  Answer,
  AnswerWithProfile,
  Profile,
} from '@/lib/types';

// The three question states from the prototype:
// - unanswered: I haven't answered yet (show answer UI)
// - waiting: I answered, but not everyone has (show progress ring)
// - completed: everyone answered (show reveal)

export interface CategorizedQuestions {
  unanswered: QuestionWithStatus[];
  waiting: QuestionWithStatus[];
  completed: QuestionWithStatus[];
}

export function useQuestions(groupId: string | null) {
  const [questions, setQuestions] = useState<QuestionWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  // Unique per-hook-instance suffix so parallel mounts (e.g. Home + PubTab
  // both calling useQuestions) don't collide on the same realtime channel
  // name. Supabase will reject the second `.on(...)` with "cannot add
  // postgres_changes callbacks after subscribe()" if two components try to
  // reuse the same channel topic.
  const instanceIdRef = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );

  // Fetch all questions for the group with their status
  const fetchQuestions = useCallback(async () => {
    if (!groupId) return;
    const { data, error } = await supabase
      .from('question_status_view')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (data) setQuestions(data);
    setLoading(false);
  }, [groupId]);

  // Initial fetch
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Realtime: listen for new answers and question status changes
  useEffect(() => {
    if (!groupId) return;

    // When a new answer is inserted, refetch questions
    // (the DB trigger will auto-complete questions when all members answer)
    const answersChannel = supabase
      .channel(`answers-${groupId}-${instanceIdRef.current}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
        },
        () => {
          // Refetch to get updated counts and completion status
          fetchQuestions();
        }
      )
      .subscribe();

    // Also listen for question status updates (open -> completed)
    const questionsChannel = supabase
      .channel(`questions-${groupId}-${instanceIdRef.current}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'questions',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(answersChannel);
      supabase.removeChannel(questionsChannel);
    };
  }, [groupId, fetchQuestions]);

  // Categorize questions by the current user's answer status
  const categorize = useCallback(async (): Promise<CategorizedQuestions> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { unanswered: [], waiting: [], completed: [] };

    // Fetch which questions this user has answered
    const { data: myAnswers } = await supabase
      .from('answers')
      .select('question_id')
      .eq('user_id', user.id);

    const answeredIds = new Set((myAnswers || []).map(a => a.question_id));

    const unanswered: QuestionWithStatus[] = [];
    const waiting: QuestionWithStatus[] = [];
    const completed: QuestionWithStatus[] = [];

    for (const q of questions) {
      if (q.status === 'completed') {
        completed.push(q);
      } else if (answeredIds.has(q.id)) {
        waiting.push(q);
      } else {
        unanswered.push(q);
      }
    }

    return { unanswered, waiting, completed };
  }, [questions]);

  // Submit an answer to a question
  const submitAnswer = useCallback(async (
    questionId: string,
    sessionId: string | null,
    answerText: string | null,
    isVoice: boolean = false,
    voiceUrl: string | null = null,
    voiceDurationSeconds: number | null = null,
    drinkCount: number = 0,
    drinkEmoji: string = '🍺',
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('answers')
      .insert({
        question_id: questionId,
        user_id: user.id,
        session_id: sessionId,
        answer_text: answerText,
        is_voice: isVoice,
        voice_url: voiceUrl,
        voice_duration_seconds: voiceDurationSeconds,
        drink_count: drinkCount,
        drink_emoji: drinkEmoji,
      })
      .select()
      .single();

    // Refetch to update categorization
    if (data) await fetchQuestions();

    return { data, error };
  }, [fetchQuestions]);

  // Ask a new question
  const askQuestion = useCallback(async (questionText: string) => {
    if (!groupId) return { error: new Error('No group') };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('questions')
      .insert({
        group_id: groupId,
        asked_by: user.id,
        question_text: questionText,
      })
      .select()
      .single();

    if (data) await fetchQuestions();

    return { data, error };
  }, [groupId, fetchQuestions]);

  // Fetch answers for a completed question (the reveal)
  const fetchAnswers = useCallback(async (questionId: string): Promise<AnswerWithProfile[]> => {
    const { data: answers } = await supabase
      .from('answers')
      .select('*, profile:profiles(*)')
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });

    return (answers || []) as AnswerWithProfile[];
  }, []);

  // Upload a voice note to Supabase Storage and get the URL
  const uploadVoiceNote = useCallback(async (
    questionId: string,
    audioBlob: Blob,
  ): Promise<{ url: string | null; error: Error | null }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { url: null, error: new Error('Not authenticated') };

    const filePath = `voice-notes/${groupId}/${questionId}/${user.id}.webm`;

    const { error } = await supabase.storage
      .from('pub-mode')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: true,
      });

    if (error) return { url: null, error };

    const { data: { publicUrl } } = supabase.storage
      .from('pub-mode')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  }, [groupId]);

  return {
    questions,
    loading,
    categorize,
    submitAnswer,
    askQuestion,
    fetchAnswers,
    uploadVoiceNote,
    refetch: fetchQuestions,
  };
}

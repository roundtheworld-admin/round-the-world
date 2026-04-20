'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { FeedItem } from '@/lib/types';

export function useFeed(groupId: string | null) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchFeed = useCallback(async () => {
    if (!groupId) return;

    const { data: feedData } = await supabase
      .from('feed_view')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (feedData) {
      setItems(feedData as FeedItem[]);
    }

    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchFeed();

    // Real-time subscription for new checkins
    if (groupId) {
      const channel = supabase
        .channel('feed-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'checkins', filter: `group_id=eq.${groupId}` },
          () => fetchFeed()
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [groupId, fetchFeed]);

  async function createCheckin(data: {
    drink_name: string;
    drink_emoji: string;
    bar_name?: string;
    city?: string;
    rating?: number;
    review?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !groupId) return;

    const { error } = await supabase.from('checkins').insert({
      user_id: user.id,
      group_id: groupId,
      ...data,
    });

    if (!error) fetchFeed();
    return { error };
  }

  return { items, loading, createCheckin, refresh: fetchFeed };
}

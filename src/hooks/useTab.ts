'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { Balance, TabEntry, Round, Settlement, Profile } from '@/lib/types';

interface RoundWithProfiles extends Round {
  from_profile: Profile;
  to_profile: Profile;
}

export function useTab(groupId: string | null, myUserId: string | null) {
  const [tab, setTab] = useState<TabEntry[]>([]);
  const [history, setHistory] = useState<(RoundWithProfiles | (Settlement & { from_profile: Profile; to_profile: Profile }))[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTab = useCallback(async () => {
    if (!groupId || !myUserId) return;

    // Get balances
    const { data: balances } = await supabase
      .from('balances_view')
      .select('*')
      .eq('group_id', groupId);

    // Get all group member profiles for display
    const { data: memberData } = await supabase
      .from('group_members')
      .select('user_id, profiles(*)')
      .eq('group_id', groupId);

    const profiles = new Map<string, Profile>();
    memberData?.forEach((m: any) => {
      profiles.set(m.user_id, m.profiles);
    });

    // Build tab entries relative to current user
    const tabMap = new Map<string, number>();

    // Initialize all members with 0
    profiles.forEach((p, id) => {
      if (id !== myUserId) tabMap.set(id, 0);
    });

    // Apply balances
    balances?.forEach((b: Balance) => {
      if (b.owed_to === myUserId) {
        // Someone owes me
        tabMap.set(b.owed_by, (tabMap.get(b.owed_by) || 0) + b.amount_cents);
      } else if (b.owed_by === myUserId) {
        // I owe someone
        tabMap.set(b.owed_to, (tabMap.get(b.owed_to) || 0) - b.amount_cents);
      }
    });

    const entries: TabEntry[] = [];
    tabMap.forEach((amount, userId) => {
      const p = profiles.get(userId);
      if (p) {
        entries.push({
          userId,
          name: p.name,
          avatar_color: p.avatar_color,
          amount_cents: amount,
        });
      }
    });

    // Sort: people who owe you first (positive), then people you owe (negative)
    entries.sort((a, b) => b.amount_cents - a.amount_cents);
    setTab(entries);

    // Fetch recent history (rounds + settlements)
    const { data: rounds } = await supabase
      .from('rounds')
      .select('*, from_profile:profiles!rounds_from_user_id_fkey(*), to_profile:profiles!rounds_to_user_id_fkey(*)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(30);

    const { data: settlements } = await supabase
      .from('settlements')
      .select('*, from_profile:profiles!settlements_from_user_id_fkey(*), to_profile:profiles!settlements_to_user_id_fkey(*)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Merge and sort by date
    const combined = [
      ...(rounds || []).map((r: any) => ({ ...r, _type: 'round' as const })),
      ...(settlements || []).map((s: any) => ({ ...s, _type: 'settlement' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setHistory(combined);
    setLoading(false);
  }, [groupId, myUserId]);

  useEffect(() => {
    fetchTab();
  }, [fetchTab]);

  // Net balance: positive = you are owed overall, negative = you owe overall
  const netBalance = tab.reduce((sum, t) => sum + t.amount_cents, 0);

  async function settleUp(withUserId: string, amountCents: number, note?: string) {
    if (!groupId || !myUserId) return { error: new Error('Missing context') };

    // Figure out direction: who owes whom?
    const entry = tab.find((t) => t.userId === withUserId);
    if (!entry) return { error: new Error('No balance with this person') };

    // If entry.amount_cents > 0, they owe me, so they are paying me (from=them, to=me)
    // If entry.amount_cents < 0, I owe them, so I am paying them (from=me, to=them)
    const fromUserId = entry.amount_cents > 0 ? withUserId : myUserId;
    const toUserId = entry.amount_cents > 0 ? myUserId : withUserId;

    const { error } = await supabase.from('settlements').insert({
      group_id: groupId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount_cents: amountCents,
      note: note || null,
    });

    if (!error) fetchTab();
    return { error };
  }

  return { tab, history, netBalance, loading, settleUp, refresh: fetchTab };
}

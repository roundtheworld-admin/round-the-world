'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { Group, Profile, LeaderboardEntry } from '@/lib/types';

export function useGroup() {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchGroup = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get user's first group (MVP: one group per user)
    const { data: membership } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (membership) {
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', membership.group_id)
        .single();

      setGroup(groupData);

      // Get members
      const { data: memberData } = await supabase
        .from('group_members')
        .select('user_id, profiles(*)')
        .eq('group_id', membership.group_id);

      if (memberData) {
        setMembers(memberData.map((m: any) => m.profiles));
      }

      // Get leaderboard
      const { data: leaderData } = await supabase
        .from('leaderboard_view')
        .select('*');

      if (leaderData) {
        // Filter to group members only
        const memberIds = new Set(memberData?.map((m: any) => m.user_id) || []);
        setLeaderboard(leaderData.filter((l) => memberIds.has(l.id)));
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  async function createGroup(name: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { data: newGroup, error } = await supabase
      .from('groups')
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (error) {
      console.error('createGroup insert error:', error);
      return { error };
    }

    if (!newGroup) {
      console.error('createGroup: insert succeeded but no data returned');
      return { error: new Error('Failed to create group') };
    }

    // Auto-join the creator
    const { error: joinError } = await supabase.from('group_members').insert({
      group_id: newGroup.id,
      user_id: user.id,
    });

    if (joinError) {
      console.error('createGroup join error:', joinError);
    }

    setGroup(newGroup);
    fetchGroup();
    return { error: null };
  }

  async function joinGroup(inviteCode: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    // Use a SECURITY DEFINER RPC so the lookup-by-invite-code bypasses
    // the "members-only SELECT" RLS policy on the groups table (the person
    // joining is not a member yet, so a plain select would return nothing).
    const { data: groupId, error: rpcError } = await supabase.rpc(
      'join_group_by_invite_code',
      { code: inviteCode.trim() }
    );

    if (rpcError) {
      // P0002 = our "Group not found" signal
      if (rpcError.code === 'P0002' || /group not found/i.test(rpcError.message || '')) {
        return { error: new Error('Group not found. Check the invite code.') };
      }
      return { error: rpcError };
    }

    if (!groupId) {
      return { error: new Error('Group not found. Check the invite code.') };
    }

    // Now that we're a member, the RLS policy permits this read.
    const { data: newGroup } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (newGroup) {
      setGroup(newGroup);
    }
    fetchGroup();
    return { error: null };
  }

  // Send a round to one person (status starts as 'pending')
  async function sendRound(toUserId: string, drinkName: string, drinkEmoji: string, amountCents: number, note?: string, checkinId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !group) return { error: new Error('Not authenticated or no group') };

    const { error } = await supabase.from('rounds').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      group_id: group.id,
      checkin_id: checkinId || null,
      drink_name: drinkName,
      drink_emoji: drinkEmoji,
      amount_cents: amountCents,
      note: note || null,
      status: 'pending',
    });

    return { error };
  }

  // Send a round to EVERYONE in the group (creates one pending round per member)
  async function sendRoundToEveryone(drinkName: string, drinkEmoji: string, amountCents: number, note?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !group) return { error: new Error('Not authenticated or no group') };

    const otherMembers = members.filter((m) => m.id !== user.id);
    const rows = otherMembers.map((m) => ({
      from_user_id: user.id,
      to_user_id: m.id,
      group_id: group.id,
      drink_name: drinkName,
      drink_emoji: drinkEmoji,
      amount_cents: amountCents,
      note: note || null,
      status: 'pending',
    }));

    const { error } = await supabase.from('rounds').insert(rows);
    return { error };
  }

  // Accept or decline a pending round (called by the recipient)
  async function respondToRound(roundId: string, accept: boolean) {
    const { error } = await supabase
      .from('rounds')
      .update({
        status: accept ? 'accepted' : 'declined',
        accepted_at: accept ? new Date().toISOString() : null,
      })
      .eq('id', roundId);

    return { error };
  }

  // Get pending rounds for the current user
  async function getPendingRounds() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !group) return [];

    const { data } = await supabase
      .from('rounds')
      .select('*, from_profile:profiles!rounds_from_user_id_fkey(*)')
      .eq('to_user_id', user.id)
      .eq('group_id', group.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    return data || [];
  }

  // Whose round is it next? Oldest member-with-least-recent-round-bought wins.
  // Ignores the current user (it's never literally "your own round to buy for yourself").
  async function getRoundRobin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !group || members.length < 2) return null;

    // Pull the most recent accepted round each member has sent within this group.
    const { data: rounds } = await supabase
      .from('rounds')
      .select('from_user_id, created_at')
      .eq('group_id', group.id)
      .in('status', ['accepted', 'pending']) // pending still "counts" as their turn being taken
      .order('created_at', { ascending: false });

    const lastByUser = new Map<string, string>();
    for (const r of rounds || []) {
      if (!lastByUser.has(r.from_user_id)) {
        lastByUser.set(r.from_user_id, r.created_at);
      }
    }

    // Rank members: those who have never bought (null) go first, then by oldest last-bought.
    const ranked = members
      .map((m) => ({
        member: m,
        lastBoughtAt: lastByUser.get(m.id) || null,
      }))
      .sort((a, b) => {
        if (a.lastBoughtAt === null && b.lastBoughtAt === null) {
          // Fall back to joined order (i.e., the crew's original order) to be stable.
          return 0;
        }
        if (a.lastBoughtAt === null) return -1;
        if (b.lastBoughtAt === null) return 1;
        return a.lastBoughtAt.localeCompare(b.lastBoughtAt);
      });

    const next = ranked[0];
    if (!next) return null;

    return {
      userId: next.member.id,
      name: next.member.name,
      avatarColor: next.member.avatar_color,
      lastBoughtAt: next.lastBoughtAt,
      isYou: next.member.id === user.id,
    };
  }

  // Pairwise drink ledger: for each other member, how many rounds I've bought
  // them (accepted only) vs how many they've bought me (accepted only). A
  // settlement between two people wipes the slate clean, i.e. only rounds
  // created AFTER the most recent settlement between us count.
  async function getDrinkLedger() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !group) return [];

    // Pull all settlements involving me in this group so we know the "since"
    // cutoff per counterparty.
    const { data: settlements } = await supabase
      .from('settlements')
      .select('from_user_id, to_user_id, created_at')
      .eq('group_id', group.id)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    // Most-recent settlement timestamp per other-user id
    const lastSettledWith = new Map<string, string>();
    for (const s of settlements || []) {
      const other = s.from_user_id === user.id ? s.to_user_id : s.from_user_id;
      if (!lastSettledWith.has(other)) {
        lastSettledWith.set(other, s.created_at);
      }
    }

    const { data: rounds } = await supabase
      .from('rounds')
      .select('from_user_id, to_user_id, status, created_at')
      .eq('group_id', group.id)
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

    const tally = new Map<string, { boughtForThem: number; boughtForMe: number }>();
    for (const r of rounds || []) {
      const other =
        r.from_user_id === user.id ? r.to_user_id : r.from_user_id;

      // If we've settled since this round was created, ignore it.
      const cutoff = lastSettledWith.get(other);
      if (cutoff && r.created_at <= cutoff) continue;

      if (r.from_user_id === user.id) {
        const cur = tally.get(other) || { boughtForThem: 0, boughtForMe: 0 };
        cur.boughtForThem += 1;
        tally.set(other, cur);
      } else if (r.to_user_id === user.id) {
        const cur = tally.get(other) || { boughtForThem: 0, boughtForMe: 0 };
        cur.boughtForMe += 1;
        tally.set(other, cur);
      }
    }

    return members
      .filter((m) => m.id !== user.id)
      .map((m) => {
        const t = tally.get(m.id) || { boughtForThem: 0, boughtForMe: 0 };
        return {
          userId: m.id,
          name: m.name,
          avatarColor: m.avatar_color,
          boughtForThem: t.boughtForThem,
          boughtForMe: t.boughtForMe,
          net: t.boughtForThem - t.boughtForMe,
        };
      });
  }

  // Settle up between two members. Writes a row to the `settlements` table;
  // `getDrinkLedger` treats rounds created at or before that timestamp as
  // already reconciled, so both counts drop to zero after a settle.
  // `fromUserId` is the payer; `toUserId` is the receiver.
  async function settleUp(opts: {
    fromUserId: string;
    toUserId: string;
    amountCents: number;
    note?: string | null;
  }) {
    if (!group) return { error: new Error('No group') };

    const { error } = await supabase.from('settlements').insert({
      from_user_id: opts.fromUserId,
      to_user_id: opts.toUserId,
      group_id: group.id,
      amount_cents: opts.amountCents,
      note: opts.note || null,
    });

    return { error };
  }

  return {
    group, members, leaderboard, loading,
    createGroup, joinGroup,
    sendRound, sendRoundToEveryone, respondToRound, getPendingRounds,
    getRoundRobin, getDrinkLedger, settleUp,
    refresh: fetchGroup,
  };
}

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qdtktdgpyvgfycgpdvnw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-HIDWnnKJ__iQPhhVC4jBg_l4P4jucf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FAKE_USERS = [
  { email: 'dave@fakecrew.com', password: 'testpass123', name: 'Dave', city: 'Brisbane', timezone: 'Australia/Brisbane' },
  { email: 'kieran@fakecrew.com', password: 'testpass123', name: 'Kieran', city: 'Middleton', timezone: 'Europe/Dublin' },
  { email: 'ryan@fakecrew.com', password: 'testpass123', name: 'Ryan', city: 'Wicklow', timezone: 'Europe/Dublin' },
];

const DRINKS = [
  { name: 'Pint of Guinness', emoji: '🍺', amount_cents: 700 },
  { name: 'Glass of Malbec', emoji: '🍷', amount_cents: 900 },
  { name: 'Espresso Martini', emoji: '🍸', amount_cents: 1200 },
  { name: 'Whiskey neat', emoji: '🥃', amount_cents: 1000 },
  { name: 'Shot of Jameson', emoji: '🥂', amount_cents: 600 },
];

const QUESTIONS = [
  "What's the best pub you've ever been to and why?",
  "If you could only drink one thing for the rest of your life, what would it be?",
  "What's the worst hangover you've ever had?",
  "Describe your perfect Sunday session",
  "What's a drink you'd never order again?",
  "If our crew opened a bar, what would we call it?",
  "What song always gets you going after a few pints?",
  "What's the most you've ever spent on a single round?",
];

const BAR_NAMES = [
  { name: "The Long Hall", city: "Dublin" },
  { name: "The Churchill Arms", city: "London" },
  { name: "Dead Rabbit", city: "New York" },
  { name: "The Baxter Inn", city: "Sydney" },
  { name: "Kehoe's", city: "Dublin" },
  { name: "Ye Olde Cheshire Cheese", city: "London" },
];

const REVIEWS = [
  "Unreal spot. Atmosphere was class.",
  "Bit pricey but the Guinness was perfect.",
  "Live trad session going on, couldn't beat it.",
  "Quiet enough but the bartender was sound.",
  "Packed to the rafters but worth the wait.",
  "Hidden gem. Will definitely be back.",
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

async function signUpUser(user) {
  const { data, error } = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
  });
  if (error) {
    if (error.message.includes('already registered')) {
      // Sign in instead
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });
      if (signInError) { console.error(`Failed to sign in ${user.email}:`, signInError.message); return null; }
      return signInData.user;
    }
    console.error(`Failed to sign up ${user.email}:`, error.message);
    return null;
  }
  return data.user;
}

async function actAs(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { console.error(`Failed to sign in as ${email}:`, error.message); return null; }
  return data.user;
}

async function main() {
  console.log('=== Round The World Seed Script ===\n');

  // Step 1: Sign up fake users and get their IDs
  console.log('1. Creating fake users...');
  const userIds = [];
  for (const u of FAKE_USERS) {
    const user = await signUpUser(u);
    if (user) {
      userIds.push(user.id);
      console.log(`   Created: ${u.name} (${user.id})`);

      // Update their profile
      await supabase.from('profiles').update({
        name: u.name,
        city: u.city,
        timezone: u.timezone,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
    }
  }

  if (userIds.length === 0) {
    console.error('No users created. Aborting.');
    return;
  }

  // Step 2: Sign in as Donal to find the group
  // We need Donal's credentials since only the creator/members can see groups via RLS.
  // Instead, we'll sign in as a fake user and use joinGroup via invite code.
  console.log('\n2. Finding group "YTB"...');

  // Sign in as first fake user and look up the group by invite code
  await actAs(FAKE_USERS[0].email, FAKE_USERS[0].password);

  // Query groups table -- fake users can't see it yet (not members, not creator).
  // So we query by invite code which the groups table allows via the name column.
  // Actually, let's just query the groups table directly -- the select policy allows
  // anyone who is the creator. Since our fake users aren't, we need another approach.
  // The simplest fix: sign in as Donal to get the group ID.

  // Workaround: use Donal's account to find the group
  const DONAL_EMAIL = 'thedictatorjim@gmail.com';
  const DONAL_PASSWORD = 'QkL7wbqn42*6ArJzv3pG';

  const donalUser = await actAs(DONAL_EMAIL, DONAL_PASSWORD);
  if (!donalUser) {
    console.error('   Could not sign in as Donal. Check the password.');
    return;
  }

  const { data: donalMembership } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', donalUser.id)
    .limit(1)
    .single();

  if (!donalMembership) {
    console.error('   Donal is not in any group. Create a crew first.');
    return;
  }

  const { data: groupData } = await supabase
    .from('groups')
    .select('*')
    .eq('id', donalMembership.group_id)
    .single();

  const groupId = groupData.id;
  console.log(`   Found group: ${groupData.name} (${groupId}), invite: ${groupData.invite_code}`);

  // Step 3: Add fake users to the group
  console.log('\n3. Adding users to the group...');
  for (let i = 0; i < FAKE_USERS.length; i++) {
    await actAs(FAKE_USERS[i].email, FAKE_USERS[i].password);
    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userIds[i],
    });
    if (error && !error.message.includes('duplicate')) {
      console.error(`   Failed to add ${FAKE_USERS[i].name}:`, error.message);
    } else {
      console.log(`   Added ${FAKE_USERS[i].name} to the crew`);
    }
  }

  // Get all member IDs (including Donal)
  const { data: memberData } = await supabase.from('group_members').select('user_id').eq('group_id', groupId);
  const allMemberIds = memberData?.map(m => m.user_id) || [];
  console.log(`   Total crew members: ${allMemberIds.length}`);

  // Step 4: Create some checkins
  console.log('\n4. Creating check-ins...');
  for (let i = 0; i < FAKE_USERS.length; i++) {
    await actAs(FAKE_USERS[i].email, FAKE_USERS[i].password);
    const numCheckins = randBetween(2, 4);
    for (let j = 0; j < numCheckins; j++) {
      const drink = pick(DRINKS);
      const bar = pick(BAR_NAMES);
      const { error } = await supabase.from('checkins').insert({
        user_id: userIds[i],
        group_id: groupId,
        drink_name: drink.name,
        drink_emoji: drink.emoji,
        bar_name: bar.name,
        city: bar.city,
        rating: (randBetween(30, 50) / 10).toFixed(1),
        review: pick(REVIEWS),
        created_at: daysAgo(randBetween(0, 14)),
      });
      if (error) console.error(`   Checkin error:`, error.message);
      else console.log(`   ${FAKE_USERS[i].name} checked in at ${bar.name}`);
    }
  }

  // Step 5: Create some rounds between users
  console.log('\n5. Creating rounds...');
  for (let i = 0; i < FAKE_USERS.length; i++) {
    await actAs(FAKE_USERS[i].email, FAKE_USERS[i].password);
    const numRounds = randBetween(1, 3);
    for (let j = 0; j < numRounds; j++) {
      const otherMembers = allMemberIds.filter(id => id !== userIds[i]);
      const toUser = pick(otherMembers);
      const drink = pick(DRINKS);
      const { error } = await supabase.from('rounds').insert({
        from_user_id: userIds[i],
        to_user_id: toUser,
        group_id: groupId,
        drink_name: drink.name,
        drink_emoji: drink.emoji,
        amount_cents: drink.amount_cents,
        note: pick(['Cheers mate!', 'Get one in for me', 'This one is on me', "You're welcome", 'Sláinte!', null]),
        status: pick(['accepted', 'accepted', 'accepted', 'pending']),
        accepted_at: new Date().toISOString(),
        created_at: daysAgo(randBetween(0, 10)),
      });
      if (error) console.error(`   Round error:`, error.message);
      else console.log(`   ${FAKE_USERS[i].name} bought ${drink.name} for someone`);
    }
  }

  // Step 6: Create questions
  console.log('\n6. Creating questions...');
  const questionIds = [];
  // Use first fake user to create questions
  await actAs(FAKE_USERS[0].email, FAKE_USERS[0].password);
  for (const q of QUESTIONS) {
    const asker = pick(userIds);
    const { data, error } = await supabase.from('questions').insert({
      group_id: groupId,
      asked_by: asker,
      question_text: q,
      status: 'open',
      created_at: daysAgo(randBetween(1, 20)),
    }).select().single();
    if (error) console.error(`   Question error:`, error.message);
    else {
      questionIds.push(data.id);
      console.log(`   Added question: "${q.slice(0, 50)}..."`);
    }
  }

  // Step 7: Add answers to some questions
  console.log('\n7. Adding answers to questions...');
  const SAMPLE_ANSWERS = {
    0: ["The Stag's Head in Dublin, no contest. Perfect Guinness every time.", "Ye Olde Trip to Jerusalem in Nottingham. Oldest pub in England, mad atmosphere.", "Any beach bar in Bali honestly. Sun, cheap beers, can't go wrong."],
    1: ["Guinness. No hesitation.", "A good Barolo. Life's too short for bad wine.", "Espresso martinis. Judge me all you want."],
    2: ["That night in Prague. Three days to recover.", "New Year's 2022. I genuinely thought I was dying.", "Freshers week. Say no more."],
    3: ["Roast at 1pm, first pint by 3, trad session by 6, chipper by 11.", "Start with a Bloody Mary, transition to pints, home by 8. I'm old.", "Craft beer crawl with the lads. No plans, just vibes."],
    4: ["Malort. Never again.", "Sambuca. Even the smell makes me gag now.", "Fireball. University ruined it for me."],
    5: ["The Round House, obviously.", "The Eejit & Pint.", "The Tab -- because nobody ever settles up."],
    6: ["Mr. Brightside. Every single time.", "Don't Stop Me Now by Queen.", "Galway Girl, if we're being honest."],
    7: ["200 quid in London. Nearly cried.", "About 150 at a cocktail bar in NYC. Four drinks.", "80 quid in Dublin and I still think about it."],
  };

  for (let qi = 0; qi < questionIds.length; qi++) {
    // Have each fake user answer
    for (let ui = 0; ui < FAKE_USERS.length; ui++) {
      await actAs(FAKE_USERS[ui].email, FAKE_USERS[ui].password);
      const answers = SAMPLE_ANSWERS[qi] || ["Great question, need to think about this one."];
      const { error } = await supabase.from('answers').insert({
        question_id: questionIds[qi],
        user_id: userIds[ui],
        answer_text: answers[ui] || pick(answers),
        is_voice: false,
        drink_count: randBetween(0, 3),
        drink_emoji: pick(DRINKS).emoji,
        created_at: daysAgo(randBetween(0, 5)),
      });
      if (error) console.error(`   Answer error:`, error.message);
      else console.log(`   ${FAKE_USERS[ui].name} answered Q${qi + 1}`);
    }
  }

  // Step 8: Create a settlement
  console.log('\n8. Creating a settlement...');
  await actAs(FAKE_USERS[1].email, FAKE_USERS[1].password);
  const { error: settlError } = await supabase.from('settlements').insert({
    group_id: groupId,
    from_user_id: userIds[1],
    to_user_id: userIds[0],
    amount_cents: 1400,
    note: 'Settling up from last weekend',
    created_at: daysAgo(2),
  });
  if (settlError) console.error(`   Settlement error:`, settlError.message);
  else console.log('   Aoife settled up with Sean');

  console.log('\n=== Done! Your app should now have test data. ===');
  console.log('\nFake accounts you can log in as:');
  for (const u of FAKE_USERS) {
    console.log(`   ${u.name}: ${u.email} / ${u.password}`);
  }
}

main().catch(console.error);

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Mic } from 'lucide-react';
import PixelBar from './PixelBar';
import AnswerProgress from './AnswerProgress';
import Avatar from '@/components/Avatar';
import {
  type BarTheme, type RoundThemeId, type QuestionWithStatus, type AnswerWithProfile, type Profile,
  ROUND_THEMES, CHALLENGES, TRIVIA_STAKES,
} from '@/lib/types';

// ── Trivia questions by theme ────────────────────────────────
const TRIVIA_BY_THEME: Record<string, { question: string; answer: string }[]> = {
  pint: [
    { question: 'What country drinks the most beer per capita?', answer: 'Czech Republic' },
    { question: 'What is the oldest known recipe in the world?', answer: 'Beer' },
    { question: 'How many pints of Guinness are consumed daily worldwide?', answer: '10 million' },
  ],
  whiskey: [
    { question: 'What does "whiskey" mean in Gaelic?', answer: 'Water of life' },
    { question: 'Which country produces the most whiskey?', answer: 'Scotland' },
    { question: 'What gives bourbon its distinctive flavor?', answer: 'Charred oak barrels' },
  ],
  cocktail: [
    { question: 'What cocktail was allegedly invented in Cuba?', answer: 'Mojito' },
    { question: 'What is the main ingredient in a Negroni besides gin?', answer: 'Campari' },
    { question: 'Which cocktail is traditionally served in a copper mug?', answer: 'Moscow Mule' },
  ],
  shots: [
    { question: 'What is tequila made from?', answer: 'Blue agave' },
    { question: 'In which country did Jagermeister originate?', answer: 'Germany' },
    { question: 'What does "sake" literally mean in Japanese?', answer: 'Alcohol' },
  ],
};

const HOT_TAKES = [
  'The pub quiz is the greatest form of entertainment ever invented.',
  'You can tell everything about a person by their drink order.',
  'Drinking alone at a bar is underrated and sometimes superior.',
  'The best nights out are the ones you didn\'t plan.',
  'Tipping culture has gotten completely out of hand.',
  'Beer before wine and you\'ll be fine is total nonsense.',
];

const PREDICTIONS = [
  'Who is most likely to fall asleep at the bar tonight?',
  'Who is most likely to buy a stranger a drink?',
  'Who would survive longest on a desert island?',
  'Who is most likely to start a karaoke session?',
  'Who will be the last one standing tonight?',
];

// ── Card types ────────────────────────────────────────────────
type CardType = 'intro' | 'round_theme' | 'reveal' | 'question' | 'trivia' | 'challenge' | 'hot_take' | 'prediction' | 'waiting_summary' | 'ask_question' | 'session_end';

interface Card {
  type: CardType;
  data?: any;
}

// ── Props ─────────────────────────────────────────────────────
interface PubSessionProps {
  barTheme: BarTheme;
  pubName: string;
  city: string;
  groupId: string;
  members: Profile[];
  myProfile: Profile;
  unanswered: QuestionWithStatus[];
  waiting: QuestionWithStatus[];
  completed: QuestionWithStatus[];
  onSubmitAnswer: (questionId: string, text: string) => Promise<void>;
  onAskQuestion: (text: string) => Promise<void>;
  onFetchAnswers: (questionId: string) => Promise<AnswerWithProfile[]>;
  onEnd: () => void;
}

export default function PubSession({
  barTheme, pubName, city, groupId, members, myProfile,
  unanswered, waiting, completed,
  onSubmitAnswer, onAskQuestion, onFetchAnswers, onEnd,
}: PubSessionProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [myAnswers, setMyAnswers] = useState<Record<string, string>>({});
  const [triviaAnswers, setTriviaAnswers] = useState<Record<number, string>>({});
  const [triviaStakes, setTriviaStakes] = useState<Record<number, typeof TRIVIA_STAKES[0]>>({});
  const [challengeStatus, setChallengeStatus] = useState<Record<number, 'done' | 'skipped'>>({});
  const [hotTakeVotes, setHotTakeVotes] = useState<Record<number, 'agree' | 'disagree'>>({});
  const [predictionPicks, setPredictionPicks] = useState<Record<number, Profile>>({});
  const [myQuestions, setMyQuestions] = useState<string[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, AnswerWithProfile[]>>({});
  const [expandedReveal, setExpandedReveal] = useState<Record<string, boolean>>({});
  const [animating, setAnimating] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pick a random round theme
  const [roundTheme] = useState(() => ROUND_THEMES[Math.floor(Math.random() * ROUND_THEMES.length)]);

  // Build the card deck
  useEffect(() => {
    const themeTrivia = TRIVIA_BY_THEME[roundTheme.id] || TRIVIA_BY_THEME.pint;
    const shuffledTrivia = [...themeTrivia].sort(() => Math.random() - 0.5);
    const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    const shuffledHotTakes = [...HOT_TAKES].sort(() => Math.random() - 0.5);
    const prediction = PREDICTIONS[Math.floor(Math.random() * PREDICTIONS.length)];

    // Interleave reveals and questions
    const reveals = completed.map(q => ({ type: 'reveal' as CardType, data: q }));
    const questions = unanswered.map(q => ({ type: 'question' as CardType, data: q }));
    const interleaved: Card[] = [];
    const maxLen = Math.max(reveals.length, questions.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < reveals.length) interleaved.push(reveals[i]);
      if (i < questions.length) interleaved.push(questions[i]);
    }

    // Sprinkle extras
    const extras: Card[] = [
      { type: 'trivia', data: shuffledTrivia[0] },
      { type: 'challenge', data: challenge },
      { type: 'hot_take', data: shuffledHotTakes[0] },
      { type: 'trivia', data: shuffledTrivia[1] },
      { type: 'prediction', data: prediction },
      { type: 'hot_take', data: shuffledHotTakes[1] },
    ];
    let extraIdx = 0;
    const spiced: Card[] = [];
    for (let i = 0; i < interleaved.length; i++) {
      spiced.push(interleaved[i]);
      if ((i + 1) % 2 === 0 && extraIdx < extras.length) {
        spiced.push(extras[extraIdx++]);
      }
    }
    while (extraIdx < extras.length) spiced.push(extras[extraIdx++]);

    setCards([
      { type: 'intro' },
      { type: 'round_theme' },
      ...spiced,
      ...(waiting.length > 0 ? [{ type: 'waiting_summary' as CardType }] : []),
      { type: 'ask_question' },
      { type: 'session_end' },
    ]);

    setTimeout(() => setAnimating(false), 2000);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentCard, myAnswers, expandedReveal, triviaStakes, triviaAnswers, challengeStatus, hotTakeVotes, predictionPicks]);

  const advance = useCallback(() => {
    setCurrentCard(c => Math.min(c + 1, cards.length - 1));
  }, [cards.length]);

  const handleAnswer = async (qId: string, text: string) => {
    setMyAnswers(prev => ({ ...prev, [qId]: text }));
    setInputValue('');
    await onSubmitAnswer(qId, text);
    setTimeout(advance, 1200);
  };

  const handleTriviaAnswer = (cardIdx: number, answer: string) => {
    setTriviaAnswers(prev => ({ ...prev, [cardIdx]: answer }));
    setInputValue('');
    setTimeout(advance, 2500);
  };

  const handleSubmitQuestion = async () => {
    if (inputValue.trim()) {
      const q = inputValue.trim();
      setMyQuestions(prev => [...prev, q]);
      setInputValue('');
      await onAskQuestion(q);
    }
  };

  const handleReveal = async (questionId: string) => {
    setExpandedReveal(prev => ({ ...prev, [questionId]: true }));
    const answers = await onFetchAnswers(questionId);
    setRevealedAnswers(prev => ({ ...prev, [questionId]: answers }));
  };

  const visibleCards = cards.slice(0, currentCard + 1);

  // Intro animation
  if (animating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5">
        <div className="rounded-2xl overflow-hidden w-full mb-5">
          <PixelBar type={barTheme} width={380} height={140} />
        </div>
        <div className="text-center">
          <div className="text-[11px] text-gray-500 uppercase tracking-[2px] font-semibold mb-2">Entering</div>
          <div className="text-2xl font-extrabold text-white">{pubName}</div>
          <div className="text-[13px] text-gray-500 mt-1">{city}</div>
          <div className="mt-4 flex justify-center gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <div className="text-xs text-gray-700 mt-2">Loading your session...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Session header */}
      <div className="px-4 py-3 border-b border-brand-border flex items-center gap-2.5 bg-brand-dark sticky top-0 z-40">
        <button onClick={onEnd} className="text-gray-500 text-xl p-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="text-white font-bold text-sm">{pubName}</div>
          <div className="text-gray-500 text-[11px]">{city} -- pub mode</div>
        </div>
        <div className="flex -space-x-1">
          {members.filter(m => m.id !== myProfile.id).slice(0, 3).map(m => (
            <Avatar key={m.id} name={m.name} color={m.avatar_color} size={24} />
          ))}
        </div>
      </div>

      {/* Card deck */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pt-3 pb-32">
        {visibleCards.map((card, idx) => {
          const isActive = currentCard === idx;

          // ── Intro
          if (card.type === 'intro') {
            return (
              <div key={idx} className="text-center py-5">
                <div className="rounded-2xl overflow-hidden mb-3">
                  <PixelBar type={barTheme} width={380} height={100} />
                </div>
                <p className="text-[13px] text-gray-500">
                  You are at <span className="text-white font-bold">{pubName}</span> in {city}
                </p>
                <p className="text-xs text-gray-700 mt-1 px-3 leading-relaxed">
                  {completed.length} reveal{completed.length !== 1 ? 's' : ''} ready, {unanswered.length} questions, trivia, challenges, and hot takes.
                </p>
                {isActive && (
                  <button onClick={advance} className="mt-3 px-6 py-2.5 rounded-full bg-brand-purple text-white font-bold text-[13px]">
                    Let&apos;s go 🍺
                  </button>
                )}
              </div>
            );
          }

          // ── Round theme
          if (card.type === 'round_theme') {
            if (isActive) setTimeout(advance, 1500);
            return (
              <div key={idx} className="mb-4">
                <div className="rounded-2xl p-4 text-center" style={{ background: `${roundTheme.color}10`, border: `1px solid ${roundTheme.color}30` }}>
                  <div className="text-[40px] mb-1.5">{roundTheme.emoji}</div>
                  <div className="text-base font-extrabold" style={{ color: roundTheme.color }}>{roundTheme.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{roundTheme.desc}</div>
                  <div className="bg-brand-dark rounded-lg px-3 py-2 mt-2.5 text-[11px] text-gray-500 inline-block">
                    Tonight&apos;s drink: <span className="text-white font-semibold">{roundTheme.drink}</span> {roundTheme.emoji}
                  </div>
                </div>
              </div>
            );
          }

          // ── Reveal card
          if (card.type === 'reveal') {
            const q = card.data as QuestionWithStatus;
            const isExpanded = expandedReveal[q.id];
            const answers = revealedAnswers[q.id] || [];

            return (
              <div key={idx} className="mb-4">
                <div className="text-center py-3">
                  <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    All answers in
                  </span>
                </div>
                <div className="rounded-2xl p-3.5" style={{ background: 'rgba(0,184,148,0.03)', border: '1px solid rgba(0,184,148,0.12)' }}>
                  <div className="flex items-start gap-2 mb-2">
                    {q.asked_by_color && <Avatar name={q.asked_by_name || '?'} color={q.asked_by_color} size={28} />}
                    <div>
                      <span className="text-[10px] text-gray-500">{q.asked_by_name || 'Someone'} asked</span>
                      <div className="text-[15px] font-bold text-white mt-0.5">{q.question_text}</div>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-2 space-y-2">
                      {answers.map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Avatar name={a.profile?.name || '?'} color={a.profile?.avatar_color || '#6C5CE7'} size={28} />
                          <div className="flex-1 bg-brand-card rounded-xl px-3 py-2 border border-brand-border">
                            <div className="text-[11px] text-gray-500 font-semibold">{a.profile?.name}</div>
                            <div className="text-white text-[13px] mt-0.5">{a.answer_text || '🎙️ Voice note'}</div>
                            {a.drink_count > 0 && (
                              <div className="text-[10px] text-gray-600 mt-1">{a.drink_emoji} x{a.drink_count} deep</div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isActive && (
                        <div className="text-center mt-2">
                          <button onClick={advance} className="px-5 py-2 rounded-2xl bg-brand-card text-gray-400 text-xs font-semibold">Next</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleReveal(q.id)}
                      className="w-full py-3 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 font-bold text-[13px] mt-1"
                    >
                      Tap to reveal all {q.answer_count} answers
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // ── Question card
          if (card.type === 'question') {
            const q = card.data as QuestionWithStatus;
            const myAnswer = myAnswers[q.id];

            return (
              <div key={idx} className="mb-4">
                <div className="flex items-start gap-2 mb-2">
                  {q.asked_by_color && <Avatar name={q.asked_by_name || '?'} color={q.asked_by_color} size={28} />}
                  <div className="bg-brand-card rounded-xl px-3.5 py-2.5 border border-brand-border">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">{q.asked_by_name || 'Someone'} asked</div>
                    <div className="text-[15px] font-bold text-white">{q.question_text}</div>
                  </div>
                </div>

                {myAnswer ? (
                  <>
                    <div className="flex justify-end mb-2">
                      <div className="bg-brand-purple rounded-xl px-3.5 py-2.5 max-w-[80%]">
                        <div className="text-white text-[13px]">{myAnswer}</div>
                        <div className="text-white/50 text-[10px] mt-0.5">Just now</div>
                      </div>
                    </div>
                    <div className="bg-brand-card rounded-xl p-2.5 flex items-center gap-2.5 border border-brand-border">
                      <AnswerProgress answered={q.answer_count + 1} total={q.member_count} />
                      <div>
                        <div className="text-xs text-gray-400">
                          {q.member_count - q.answer_count - 1 === 0
                            ? 'Everyone answered! Check reveals next session.'
                            : `Waiting for ${q.member_count - q.answer_count - 1} more...`}
                        </div>
                        <div className="text-[10px] text-gray-600 mt-0.5">Answers unlock when everyone weighs in</div>
                      </div>
                    </div>
                  </>
                ) : isActive ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && inputValue.trim() && handleAnswer(q.id, inputValue.trim())}
                      placeholder="Type your answer..."
                      autoFocus
                      className="flex-1 bg-brand-card border border-brand-border rounded-full px-4 py-2.5 text-white text-sm outline-none focus:border-brand-purple/50"
                    />
                    <button
                      onClick={() => inputValue.trim() && handleAnswer(q.id, inputValue.trim())}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${inputValue.trim() ? 'bg-brand-purple' : 'bg-brand-card'}`}
                    >
                      <Send size={16} className="text-white" />
                    </button>
                  </div>
                ) : null}
              </div>
            );
          }

          // ── Trivia
          if (card.type === 'trivia') {
            const t = card.data as { question: string; answer: string };
            if (!t) return null;
            const myGuess = triviaAnswers[idx];
            const myStake = triviaStakes[idx];
            const isCorrect = myGuess && myGuess.toLowerCase().includes(t.answer.toLowerCase().slice(0, 4));

            return (
              <div key={idx} className="mb-4">
                <div className="text-center py-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider" style={{ background: `${roundTheme.color}22`, color: roundTheme.color }}>
                    🎲 {roundTheme.name} Trivia
                  </span>
                </div>
                <div className="rounded-2xl p-4 text-center" style={{ background: `linear-gradient(135deg, ${roundTheme.color}15, #FDCB6E15)`, border: `1px solid ${roundTheme.color}30` }}>
                  <div className="text-base font-bold text-white mb-3">{t.question}</div>

                  {/* Step 1: Pick stake */}
                  {!myStake && isActive && (
                    <div>
                      <div className="text-xs text-gray-400 mb-2.5">Pick your stake -- if you&apos;re wrong, you drink it</div>
                      <div className="flex gap-2 justify-center">
                        {TRIVIA_STAKES.map(s => (
                          <button key={s.label} onClick={() => setTriviaStakes(prev => ({ ...prev, [idx]: s }))}
                            className="bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 flex-1 text-center">
                            <div className="text-xl">{s.emoji}</div>
                            <div className="text-[11px] text-white font-semibold mt-1">{s.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Answer */}
                  {myStake && !myGuess && isActive && (
                    <div>
                      <div className="text-[11px] text-gray-500 mb-2">
                        Staking: <span className="font-bold" style={{ color: roundTheme.color }}>{myStake.emoji} {myStake.label}</span>
                      </div>
                      <div className="flex gap-2">
                        <input value={inputValue} onChange={e => setInputValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && inputValue.trim() && handleTriviaAnswer(idx, inputValue.trim())}
                          placeholder="Your guess..." autoFocus
                          className="flex-1 bg-brand-dark border border-brand-border rounded-full px-4 py-2.5 text-white text-sm outline-none" />
                        <button onClick={() => inputValue.trim() && handleTriviaAnswer(idx, inputValue.trim())}
                          className="px-4 py-2.5 rounded-full text-white font-bold text-[13px]" style={{ background: roundTheme.color }}>
                          Guess
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Result */}
                  {myGuess && (
                    <div>
                      <div className="text-[13px] text-gray-400 mb-1">
                        Staked {myStake?.emoji} {myStake?.label}, you said: <span className="text-white font-semibold">{myGuess}</span>
                      </div>
                      <div className={`text-sm font-bold mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? 'Correct! You live to fight another round 🎉' : `Wrong! The answer is ${t.answer}`}
                      </div>
                      {!isCorrect && myStake && (
                        <div className="bg-red-500/10 rounded-xl p-2.5 inline-flex items-center gap-2 mt-1">
                          <span className="text-2xl">{myStake.emoji}</span>
                          <div className="text-left">
                            <div className="text-red-400 font-bold text-sm">{myStake.label}!</div>
                            <div className="text-gray-500 text-[11px]">The crew will see you got this wrong</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // ── Challenge
          if (card.type === 'challenge') {
            const ch = card.data as typeof CHALLENGES[0];
            if (!ch) return null;
            const status = challengeStatus[idx];

            return (
              <div key={idx} className="mb-4">
                <div className="text-center py-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    ch.severity === 'legendary' ? 'bg-red-500/20 text-red-400' : ch.severity === 'hard' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-brand-purple/20 text-brand-purple'
                  }`}>
                    {ch.severity === 'legendary' ? '🔥 Legendary Challenge' : ch.severity === 'hard' ? '⚡ Challenge' : '🎯 Challenge'}
                  </span>
                </div>
                <div className={`rounded-2xl p-5 text-center ${ch.severity === 'legendary' ? 'bg-red-500/5 border border-red-500/20' : 'bg-brand-card border border-brand-border'}`}>
                  <div className="text-5xl mb-2">{ch.emoji}</div>
                  <div className="text-xl font-extrabold text-white">{ch.title}</div>
                  <div className="text-sm text-gray-400 mt-1.5 leading-relaxed">{ch.desc}</div>

                  {status === 'done' ? (
                    <div className="mt-3 text-sm text-green-400 font-bold">Challenge completed!</div>
                  ) : status === 'skipped' ? (
                    <div className="mt-3 text-sm text-gray-500">You skipped... they&apos;ll see</div>
                  ) : isActive ? (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => { setChallengeStatus(prev => ({ ...prev, [idx]: 'done' })); setTimeout(advance, 1000); }}
                        className={`flex-[2] py-3.5 rounded-xl text-white font-extrabold text-[15px] ${ch.severity === 'legendary' ? 'bg-red-500' : 'bg-brand-purple'}`}>
                        Did it!
                      </button>
                      <button onClick={() => { setChallengeStatus(prev => ({ ...prev, [idx]: 'skipped' })); setTimeout(advance, 1000); }}
                        className="flex-1 py-3.5 rounded-xl border border-brand-border text-gray-500 text-[13px]">
                        Skip
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          }

          // ── Hot take
          if (card.type === 'hot_take') {
            const statement = card.data as string;
            if (!statement) return null;
            const myVote = hotTakeVotes[idx];

            return (
              <div key={idx} className="mb-4">
                <div className="text-center py-3">
                  <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    🔥 Hot Take
                  </span>
                </div>
                <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,0,110,0.03)', border: '1px solid rgba(255,0,110,0.12)' }}>
                  <div className="text-lg font-extrabold text-white mb-1 leading-snug">&ldquo;{statement}&rdquo;</div>

                  {myVote ? (
                    <div className="mt-3">
                      <div className="text-[11px] text-gray-500 mb-2">
                        You said: <span className={`font-bold ${myVote === 'agree' ? 'text-green-400' : 'text-red-400'}`}>
                          {myVote === 'agree' ? 'Agree' : 'Disagree'}
                        </span> -- waiting for the crew
                      </div>
                    </div>
                  ) : isActive ? (
                    <div className="flex gap-2.5 mt-3.5">
                      <button onClick={() => { setHotTakeVotes(prev => ({ ...prev, [idx]: 'agree' })); setTimeout(advance, 1500); }}
                        className="flex-1 py-3.5 rounded-xl border-2 border-green-500 text-green-400 font-extrabold text-[15px]">
                        👍 Agree
                      </button>
                      <button onClick={() => { setHotTakeVotes(prev => ({ ...prev, [idx]: 'disagree' })); setTimeout(advance, 1500); }}
                        className="flex-1 py-3.5 rounded-xl border-2 border-red-500 text-red-400 font-extrabold text-[15px]">
                        👎 Disagree
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          }

          // ── Prediction
          if (card.type === 'prediction') {
            const prompt = card.data as string;
            if (!prompt) return null;
            const myPick = predictionPicks[idx];

            return (
              <div key={idx} className="mb-4">
                <div className="text-center py-3">
                  <span className="bg-purple-400/10 text-purple-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    🔮 Group Prediction
                  </span>
                </div>
                <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(162,155,254,0.03)', border: '1px solid rgba(162,155,254,0.12)' }}>
                  <div className="text-base font-extrabold text-white mb-3.5 leading-snug">{prompt}</div>

                  {myPick ? (
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Avatar name={myPick.name} color={myPick.avatar_color} size={40} />
                        <div className="text-left">
                          <div className="text-white font-bold text-[15px]">{myPick.name}</div>
                          <div className="text-gray-500 text-[11px]">Your pick</div>
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-600">Results revealed when everyone picks</div>
                    </div>
                  ) : isActive ? (
                    <div className="grid grid-cols-2 gap-2">
                      {members.map(m => (
                        <button key={m.id} onClick={() => { setPredictionPicks(prev => ({ ...prev, [idx]: m })); setTimeout(advance, 1200); }}
                          className="bg-brand-dark border border-brand-border rounded-xl p-3 flex items-center gap-2">
                          <Avatar name={m.name} color={m.avatar_color} size={32} />
                          <span className="text-white font-semibold text-[13px]">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          }

          // ── Waiting summary
          if (card.type === 'waiting_summary') {
            return (
              <div key={idx} className="mb-4">
                <div className="text-center py-3">
                  <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Waiting on the crew
                  </span>
                </div>
                <div className="rounded-2xl p-3.5" style={{ background: 'rgba(253,203,110,0.03)', border: '1px solid rgba(253,203,110,0.12)' }}>
                  <div className="text-[13px] text-gray-400 mb-3">You already answered these. Still waiting for everyone.</div>
                  {waiting.map(wq => (
                    <div key={wq.id} className="bg-brand-card rounded-xl p-2.5 mb-2 flex items-center gap-2.5 border border-brand-border">
                      <AnswerProgress answered={wq.answer_count} total={wq.member_count} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white font-semibold truncate">{wq.question_text}</div>
                        <div className="text-[10px] text-gray-600 mt-0.5">Asked by {wq.asked_by_name}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {isActive && (
                  <div className="text-center mt-2">
                    <button onClick={advance} className="px-5 py-2 rounded-2xl bg-brand-card text-gray-400 text-xs font-semibold">Next</button>
                  </div>
                )}
              </div>
            );
          }

          // ── Ask a question
          if (card.type === 'ask_question') {
            const suggestions = [
              "What's the most embarrassing thing you've done while drunk?",
              "Tell us about a stranger you'll never forget.",
              "What's a hill you will die on?",
              "Describe a night out that went completely off the rails.",
            ];

            return (
              <div key={idx} className="mb-4">
                <div className="text-center py-3">
                  <span className="bg-brand-purple/10 text-brand-purple text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Your turn to ask
                  </span>
                </div>
                <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-2xl p-4">
                  <div className="text-sm font-bold text-white mb-1">Ask the crew something</div>
                  <div className="text-xs text-gray-500 mb-3">
                    Go deep -- the best questions get real stories. Everyone answers before anyone sees replies.
                  </div>
                  {myQuestions.map((q, i) => (
                    <div key={i} className="flex justify-end mb-2">
                      <div className="bg-brand-purple rounded-xl px-3.5 py-2.5 max-w-[80%]">
                        <div className="text-white text-[13px]">{q}</div>
                      </div>
                    </div>
                  ))}
                  {isActive && (
                    <>
                      <div className="flex gap-2 mt-1">
                        <input value={inputValue} onChange={e => setInputValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSubmitQuestion()}
                          placeholder="What do you want to ask?"
                          className="flex-1 bg-brand-dark border border-brand-border rounded-full px-4 py-2.5 text-white text-sm outline-none" />
                        <button onClick={handleSubmitQuestion} disabled={!inputValue.trim()}
                          className={`px-4 py-2.5 rounded-full font-bold text-[13px] ${inputValue.trim() ? 'bg-brand-purple text-white' : 'bg-brand-card text-gray-600'}`}>
                          Ask
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {suggestions.map(s => (
                          <button key={s} onClick={() => { setMyQuestions(p => [...p, s]); onAskQuestion(s); }}
                            className="bg-brand-dark border border-brand-border rounded-2xl px-2.5 py-1.5 text-gray-400 text-[11px] text-left">
                            {s}
                          </button>
                        ))}
                      </div>
                      <button onClick={advance}
                        className={`w-full mt-3 py-3 rounded-2xl font-bold text-[13px] ${myQuestions.length > 0 ? 'bg-green-500 text-white' : 'bg-brand-card text-gray-500'}`}>
                        {myQuestions.length > 0 ? `Done (${myQuestions.length} queued)` : 'Skip'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          }

          // ── Session end
          if (card.type === 'session_end') {
            return (
              <div key={idx} className="text-center py-5">
                <div className="text-5xl mb-2">🍻</div>
                <div className="text-lg font-extrabold text-white">Session complete!</div>
                <div className="text-[13px] text-gray-500 mt-1 px-5 leading-relaxed">
                  Your answers are locked in. Once everyone answers, all replies get revealed at once.
                </div>

                {/* Stats */}
                <div className="flex gap-2 justify-center mt-3 flex-wrap">
                  {[
                    { label: 'Answered', val: Object.keys(myAnswers).length, color: '#6C5CE7' },
                    { label: 'Questions', val: myQuestions.length, color: '#00B894' },
                    { label: 'Challenges', val: Object.values(challengeStatus).filter(s => s === 'done').length, color: '#E17055' },
                  ].map(s => (
                    <div key={s.label} className="bg-brand-card rounded-xl px-3 py-2.5 border border-brand-border">
                      <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                <button onClick={onEnd}
                  className="w-full mt-4 py-3.5 rounded-2xl border border-brand-border text-gray-400 text-sm">
                  End session
                </button>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Monitor, Smartphone, Users } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  collection 
} from 'firebase/firestore';
// Import config from local file
import { firebaseConfig, appId } from './firebaseConfig';

// --- FIREBASE SETUP ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATA & CONSTANTS ---
const INITIAL_GAME_STATE = {
  currentScreen: 'start',
  currentRound: 0,
  revealedAnswers: [],
  strikes: 0,
  activeTeam: 'sports',
  teamScores: { sports: 0, news: 0 },
  roundScore: 0,
  fastMoneyTimer: 20,
  fastMoneyRunning: false,
  fastMoneySlots: Array(5).fill({ answer: '', points: 0, revealed: false }),
  fastMoneyTotalScore: 0,
  fastMoneyActiveQuestionText: "",
  fastMoneyBatchIndex: 0,
  fastMoneyActiveQuestionIndex: 0 
};

// Full Pool of Fast Money Questions
const FAST_MONEY_POOL = [
  // --- BATCH 1 ---
  {
    question: "Name something you wish you had more of in college",
    answers: [
      { text: "Money", points: 40 },
      { text: "Time", points: 25 },
      { text: "Sleep", points: 10 },
      { text: "Patience", points: 9 },
      { text: "Ethnic food", points: 8 },
      { text: "Black Professors", points: 8 }
    ]
  },
  {
    question: "Name a multicultural event a student might go to on Campus",
    answers: [
      { text: "Pep Rally", points: 50 },
      { text: "Holi", points: 20 },
      { text: "Diwali", points: 15 },
      { text: "Ashe", points: 15 }
    ]
  },
  {
    question: "Name a reason a student might miss class",
    answers: [
      { text: "Sick", points: 40 },
      { text: "Overslept", points: 35 },
      { text: "Hungover", points: 2 },
      { text: "Don’t feel like it", points: 5 }
    ]
  },
  {
    question: "Name a place students might go during spring break",
    answers: [
      { text: "Florida", points: 35 },
      { text: "Home", points: 25 },
      { text: "Dominican Republic", points: 15 },
      { text: "Puerto Rico", points: 10 },
      { text: "Beach", points: 10 },
      { text: "Amusement Park", points: 5 }
    ]
  },
  {
    question: "Name a major people joke about being easy",
    answers: [
      { text: "Business", points: 40 },
      { text: "Communications", points: 25 },
      { text: "English", points: 17 },
      { text: "Political Science", points: 10 },
      { text: "Psychology", points: 8 }
    ]
  },
  
  // --- BATCH 2 ---
  {
    question: "Name another school a College student might go to instead of Penn State",
    answers: [
      { text: "Pitt", points: 35 },
      { text: "Temple", points: 25 },
      { text: "Ohio State", points: 22 },
      { text: "U Penn", points: 8 },
      { text: "Michigan", points: 5 },
      { text: "Rutgers", points: 5 }
    ]
  },
  {
    question: "Name something you do to procrastinate studying",
    answers: [
      { text: "Sleep/Nap", points: 35 },
      { text: "Scroll TikTok", points: 30 },
      { text: "Watch Netflix", points: 20 },
      { text: "Clean Room", points: 10 },
      { text: "Eat/Snack", points: 5 }
    ]
  },
  {
    question: "Name something Penn State students are doing",
    answers: [
      { text: "Studying", points: 40 },
      { text: "Partying", points: 30 },
      { text: "Complaining", points: 15 },
      { text: "Drinking", points: 10 },
      { text: "Walking", points: 5 }
    ]
  },
  {
    question: "Name something that causes most roommate conflicts",
    answers: [
      { text: "Cleaning/Mess", points: 45 },
      { text: "Noise", points: 25 },
      { text: "Guests/Hookups", points: 15 },
      { text: "Borrowing Stuff", points: 10 },
      { text: "Temperature", points: 5 }
    ]
  },
  {
    question: "Name a reason a college student might bomb an exam",
    answers: [
      { text: "Didn't Study", points: 50 },
      { text: "Hungover", points: 20 },
      { text: "Overslept", points: 15 },
      { text: "Forgot", points: 10 },
      { text: "Sick", points: 5 }
    ]
  },

  // --- BATCH 3 ---
  {
    question: "Name something a college student might lie to a professor about",
    answers: [
      { text: "Being Sick", points: 40 },
      { text: "Grandma Died", points: 30 },
      { text: "Computer Broke", points: 15 },
      { text: "Traffic", points: 10 },
      { text: "Overslept", points: 5 }
    ]
  },
  {
    question: "Name something your parent might ask when they call",
    answers: [
      { text: "Need Money?", points: 35 },
      { text: "How's Grades?", points: 30 },
      { text: "Eating Enough?", points: 20 },
      { text: "Coming Home?", points: 10 },
      { text: "Dating Anyone?", points: 5 }
    ]
  },
  {
    question: "Name a place on campus you could make friends",
    answers: [
      { text: "HUB", points: 30 },
      { text: "Dorms", points: 25 },
      { text: "Class", points: 20 },
      { text: "Parties", points: 15 },
      { text: "Clubs", points: 10 }
    ]
  },
  {
    question: "Name a phrase that contains the word 'Nittany'",
    answers: [
      { text: "Nittany Lion", points: 60 },
      { text: "Nittanyville", points: 20 },
      { text: "Nittany Mall", points: 10 },
      { text: "Nittany Apartments", points: 5 },
      { text: "Nittany Notes", points: 5 }
    ]
  },
  {
    question: "Name something a student might do during break",
    answers: [
      { text: "Sleep", points: 40 },
      { text: "Work", points: 25 },
      { text: "Go Home", points: 20 },
      { text: "Travel", points: 10 },
      { text: "Party", points: 5 }
    ]
  }
];

// Regular Round Data
const REGULAR_ROUNDS = [
  {
    title: "QUESTION 1",
    question: "Name a word to describe a Penn State Football game",
    answers: [
      { text: "LOUD", points: 30 },
      { text: "ELECTRIC", points: 20 },
      { text: "OVERRATED", points: 18 },
      { text: "WHITEOUT", points: 15 },
      { text: "TERRIBLE", points: 10 },
      { text: "SAD", points: 7 }
    ]
  },
  {
    title: "QUESTION 2",
    question: "Name a popular Penn Stater most students would know",
    answers: [
      { text: "SAQUON BARKLEY", points: 40 },
      { text: "SHAMAK", points: 16 },
      { text: "KEEGAN-MICHAEL KEY", points: 14 },
      { text: "COACH FRANKLIN", points: 9 },
      { text: "DREW ALLAR", points: 8 },
      { text: "JOE PATERNO", points: 2 }
    ]
  },
  {
    title: "QUESTION 3",
    question: "Name a movie college students might watch",
    answers: [
      { text: "SINNERS", points: 40 },
      { text: "WICKED", points: 40 },
      { text: "ZOOTOPIA 2", points: 15 },
      { text: "THE SOCIAL NETWORK", points: 10 }
    ]
  }
];

// --- HOOKS ---
const useGameState = (isController = false) => {
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [user, setUser] = useState(null);

  // 1. Auth
  useEffect(() => {
    const initAuth = async () => {
      await signInAnonymously(auth);
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 2. Sync
  useEffect(() => {
    if (!user) return;
    
    // Controller initializes the game state if missing
    if (isController) {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'gamestate');
    }

    const unsub = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data'),
      (snapshot) => {
        const docSnap = snapshot.docs.find(d => d.id === 'gamestate');
        if (docSnap && docSnap.exists()) {
          setGameState(docSnap.data());
        }
      },
      (error) => console.error("Firestore sync error:", error)
    );

    return () => unsub();
  }, [user, isController]);

  // 3. Update Function (Controller Only)
  const updateState = async (updates) => {
    if (!user) return;
    const newState = { ...gameState, ...updates };
    setGameState(newState); // Optimistic update
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gamestate'), newState);
    } catch (e) {
      console.error("Failed to update state", e);
    }
  };

  return { gameState, updateState, user };
};

// --- CONTROLLER COMPONENT ---
const Controller = () => {
  const { gameState, updateState } = useGameState(true);
  const { 
    currentScreen, currentRound, revealedAnswers, strikes, 
    activeTeam, teamScores, roundScore,
    fastMoneyTimer, fastMoneyRunning, fastMoneySlots, 
    fastMoneyBatchIndex, fastMoneyActiveQuestionIndex
  } = gameState;

  const currentRoundData = REGULAR_ROUNDS[currentRound];
  const currentFastMoneyQuestions = FAST_MONEY_POOL.slice(fastMoneyBatchIndex * 5, (fastMoneyBatchIndex * 5) + 5);
  const currentActiveQuestionText = currentFastMoneyQuestions[fastMoneyActiveQuestionIndex]?.question || "";

  // Timer Logic
  useEffect(() => {
    let interval;
    if (fastMoneyRunning && fastMoneyTimer > 0) {
      interval = setInterval(() => {
        updateState({ fastMoneyTimer: fastMoneyTimer - 1 });
      }, 1000);
    } else if (fastMoneyTimer === 0 && fastMoneyRunning) {
      updateState({ fastMoneyRunning: false });
    }
    return () => clearInterval(interval);
  }, [fastMoneyRunning, fastMoneyTimer]);

  // Actions
  const advanceScreen = () => {
    if (currentScreen === 'start') updateState({ currentScreen: 'rules' });
    else if (currentScreen === 'rules') {
      updateState({ 
        currentScreen: 'answer', currentRound: 0, revealedAnswers: [], strikes: 0, roundScore: 0 
      });
    } else if (currentScreen === 'answer') {
      if (currentRound < 2) {
        updateState({ currentRound: currentRound + 1, revealedAnswers: [], strikes: 0, roundScore: 0 });
      } else {
        updateState({ currentScreen: 'fastmoney' });
      }
    }
  };

  const goBack = () => {
    if (currentScreen === 'rules') updateState({ currentScreen: 'start' });
    else if (currentScreen === 'answer') {
      if (currentRound > 0) {
        updateState({ currentRound: currentRound - 1, revealedAnswers: [], strikes: 0, roundScore: 0 });
      } else {
        updateState({ currentScreen: 'rules' });
      }
    } else if (currentScreen === 'fastmoney') {
      updateState({ currentScreen: 'answer', currentRound: 2 });
    }
  };

  const revealAnswer = (index) => {
    if (!revealedAnswers.includes(index)) {
      const points = currentRoundData.answers[index].points;
      updateState({ 
        revealedAnswers: [...revealedAnswers, index],
        roundScore: roundScore + points 
      });
    }
  };

  const setFastMoneySlot = (slotIndex, answerText, points) => {
    const newSlots = [...fastMoneySlots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], answer: answerText, points };
    
    const total = newSlots.reduce((acc, slot) => acc + (slot.revealed ? slot.points : 0), 0);
    updateState({ fastMoneySlots: newSlots, fastMoneyTotalScore: total });
  };

  const toggleFastMoneyReveal = (slotIndex) => {
    const newSlots = [...fastMoneySlots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], revealed: !newSlots[slotIndex].revealed };
    
    const total = newSlots.reduce((acc, slot) => acc + (slot.revealed ? slot.points : 0), 0);
    updateState({ fastMoneySlots: newSlots, fastMoneyTotalScore: total });
  };

  const nextBatch = () => {
    const maxBatches = Math.floor(FAST_MONEY_POOL.length / 5);
    const nextIndex = (fastMoneyBatchIndex + 1) % maxBatches;
    updateState({
      fastMoneyBatchIndex: nextIndex,
      fastMoneySlots: Array(5).fill({ answer: '', points: 0, revealed: false }),
      fastMoneyActiveQuestionIndex: 0,
      fastMoneyTotalScore: 0,
      fastMoneyActiveQuestionText: FAST_MONEY_POOL[nextIndex * 5].question
    });
  };

  const setActiveFastMoneyQuestion = (idx) => {
    const questionText = currentFastMoneyQuestions[idx]?.question || "";
    updateState({ 
      fastMoneyActiveQuestionIndex: idx,
      fastMoneyActiveQuestionText: questionText
    });
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4 font-sans overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-yellow-400">🎮 Host Controller</h1>
          <div className="bg-gray-800 px-4 py-2 rounded text-sm text-green-400 font-mono">
            {window.location.origin}/display
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg border-2 text-center ${activeTeam === 'sports' ? 'bg-green-900 border-green-500' : 'bg-gray-800 border-gray-700'}`}>
            <div className="text-sm text-gray-400 mb-1">SPORTS</div>
            <div className="text-4xl font-bold text-yellow-400">{teamScores.sports}</div>
            {currentScreen === 'fastmoney' && (
              <button 
                onClick={() => updateState({ teamScores: { ...teamScores, sports: teamScores.sports + gameState.fastMoneyTotalScore } })}
                className="mt-2 w-full py-1 bg-green-700 hover:bg-green-600 rounded text-xs"
              >
                + Award Fast Money
              </button>
            )}
          </div>
          <div className={`p-4 rounded-lg border-2 text-center ${activeTeam === 'news' ? 'bg-blue-900 border-blue-500' : 'bg-gray-800 border-gray-700'}`}>
            <div className="text-sm text-gray-400 mb-1">NEWS</div>
            <div className="text-4xl font-bold text-yellow-400">{teamScores.news}</div>
            {currentScreen === 'fastmoney' && (
              <button 
                onClick={() => updateState({ teamScores: { ...teamScores, news: teamScores.news + gameState.fastMoneyTotalScore } })}
                className="mt-2 w-full py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs"
              >
                + Award Fast Money
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <button 
            onClick={() => updateState({ teamScores: { sports: 0, news: 0 } })}
            className="px-4 py-1 bg-red-900/50 text-red-300 text-xs rounded hover:bg-red-900"
          >
            Reset All Scores
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={goBack} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold">◀ Back</button>
          <button onClick={advanceScreen} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold">Next Screen ▶</button>
        </div>
        <div className="text-center text-sm text-gray-500 mb-6 uppercase tracking-wider">
          Current: <span className="text-yellow-400 font-bold">{currentScreen === 'answer' ? `Round ${currentRound + 1}` : currentScreen}</span>
        </div>

        {currentScreen === 'answer' && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-center mb-4">
              <div className="text-gray-400 text-sm">Round Pot</div>
              <div className="text-3xl text-blue-400 font-bold">{roundScore}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                onClick={() => {
                  updateState({ 
                    teamScores: { ...teamScores, sports: teamScores.sports + roundScore }, 
                    activeTeam: 'sports' 
                  });
                }}
                className="py-2 bg-green-700 rounded hover:bg-green-600"
              >
                Award to Sports
              </button>
              <button 
                onClick={() => {
                  updateState({ 
                    teamScores: { ...teamScores, news: teamScores.news + roundScore }, 
                    activeTeam: 'news' 
                  });
                }}
                className="py-2 bg-blue-700 rounded hover:bg-blue-600"
              >
                Award to News
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <button 
                onClick={() => strikes < 3 && updateState({ strikes: strikes + 1 })}
                className="py-2 bg-red-600 rounded hover:bg-red-500 font-bold"
              >
                X Strike ({strikes})
              </button>
              <button 
                onClick={() => updateState({ strikes: 0 })}
                className="py-2 bg-gray-600 rounded hover:bg-gray-500"
              >
                Clear Strikes
              </button>
            </div>

            <div className="space-y-2">
              {currentRoundData.answers.map((answer, idx) => (
                <button
                  key={idx}
                  onClick={() => revealAnswer(idx)}
                  disabled={revealedAnswers.includes(idx)}
                  className={`w-full p-3 rounded flex justify-between font-bold ${
                    revealedAnswers.includes(idx) ? 'bg-green-900 text-gray-400' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <span>{idx + 1}. {answer.text}</span>
                  <span>{answer.points}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentScreen === 'fastmoney' && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-center text-yellow-400 font-bold text-xl mb-4">⚡ Fast Money Control</h3>
            
            <div className="flex items-center justify-center gap-4 mb-6 bg-gray-900 p-4 rounded">
              <div className="text-4xl font-mono text-yellow-400 font-bold">{fastMoneyTimer}s</div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => updateState({ fastMoneyRunning: true })}
                  disabled={fastMoneyRunning}
                  className="px-4 py-1 bg-green-600 rounded text-sm disabled:opacity-50"
                >
                  Start
                </button>
                <button 
                  onClick={() => updateState({ fastMoneyRunning: false, fastMoneyTimer: 20 })}
                  className="px-4 py-1 bg-gray-600 rounded text-sm"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <button onClick={() => updateState({ fastMoneySlots: Array(5).fill({ answer: '', points: 0, revealed: false }), fastMoneyTotalScore: 0 })} className="flex-1 py-2 bg-orange-700 rounded text-xs">Reset Answers</button>
              <button onClick={nextBatch} className="flex-1 py-2 bg-purple-700 rounded text-xs">Next Question Batch</button>
            </div>

            <div className="bg-gray-700 p-3 rounded mb-4">
              <div className="text-xs text-gray-300 mb-2 text-center">Set Visible Question</div>
              <div className="flex gap-1 justify-center">
                {[0,1,2,3,4].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setActiveFastMoneyQuestion(idx)}
                    className={`px-3 py-1 rounded font-bold text-sm ${fastMoneyActiveQuestionIndex === idx ? 'bg-yellow-500 text-black' : 'bg-gray-600'}`}
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-center text-sm italic text-gray-300">
                "{currentFastMoneyQuestions[fastMoneyActiveQuestionIndex]?.question}"
              </div>
            </div>

            <div className="space-y-6">
              {currentFastMoneyQuestions.map((qData, qIdx) => (
                <div key={qIdx} className={`p-3 rounded border-l-4 ${fastMoneyActiveQuestionIndex === qIdx ? 'border-yellow-500 bg-gray-700' : 'border-gray-600 bg-gray-900'}`}>
                  <div className="text-xs text-gray-400 mb-2 truncate">{qData.question}</div>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {qData.answers.map((ans, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => setFastMoneySlot(qIdx, ans.text, ans.points)}
                        className={`px-2 py-1 rounded text-xs ${fastMoneySlots[qIdx]?.answer === ans.text ? 'bg-green-600' : 'bg-gray-600'}`}
                      >
                        {ans.text} ({ans.points})
                      </button>
                    ))}
                    <button 
                      onClick={() => setFastMoneySlot(qIdx, '-', 0)}
                      className="px-2 py-1 rounded text-xs bg-red-900 text-red-200"
                    >
                      Pass (0)
                    </button>
                  </div>

                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <div className="text-sm">
                      <span className="text-yellow-500 font-bold">{fastMoneySlots[qIdx]?.answer || '-'}</span>
                      <span className="text-gray-500 ml-2">{fastMoneySlots[qIdx]?.points || 0} pts</span>
                    </div>
                    <button
                      onClick={() => toggleFastMoneyReveal(qIdx)}
                      className={`px-3 py-1 rounded text-xs font-bold ${fastMoneySlots[qIdx]?.revealed ? 'bg-orange-500 text-black' : 'bg-blue-600'}`}
                    >
                      {fastMoneySlots[qIdx]?.revealed ? 'HIDE' : 'REVEAL'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- DISPLAY COMPONENT ---
const Display = () => {
  const { gameState } = useGameState(false);
  const { 
    currentScreen, currentRound, revealedAnswers, strikes, 
    teamScores, activeTeam,
    fastMoneyTimer, fastMoneySlots, fastMoneyTotalScore, fastMoneyActiveQuestionText
  } = gameState;

  const currentRoundData = REGULAR_ROUNDS[currentRound];

  return (
    <div className="min-h-screen relative overflow-hidden font-sans select-none" style={{ backgroundColor: '#003366' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@700&display=swap');
        @font-face { font-family: 'ClarendonBold'; src: local('Clarendon Bold'), local('Clarendon-Bold'); font-weight: bold; }
        @keyframes slideUp { from { transform: translateY(100vh); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes flipIn { 0% { transform: perspective(400px) rotateX(-90deg); opacity: 0; } 100% { transform: perspective(400px) rotateX(0deg); opacity: 1; } }
        @keyframes xPulse { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0; transform: scale(0.9); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `}</style>

      {/* Dynamic Backgrounds */}
      <div className="absolute inset-0 z-0 bg-center bg-cover transition-all duration-500" 
           style={{ 
             backgroundImage: currentScreen === 'start' ? 'url(/assets/1.png)' : currentScreen === 'rules' ? 'url(/assets/2.png)' : 'none',
             backgroundColor: (currentScreen === 'answer' || currentScreen === 'fastmoney') ? '#003366' : 'transparent'
           }} 
      />

      {/* Strike Overlay */}
      {strikes > 0 && currentScreen !== 'start' && currentScreen !== 'rules' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
           <div key={strikes} style={{ animation: 'xPulse 0.8s ease-out' }}>
             <img 
               src="/assets/family_feud_x.png" 
               className="w-96 h-96 drop-shadow-2xl"
               onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} 
             />
             <div className="hidden text-[400px] leading-none text-red-600 font-bold drop-shadow-[0_0_50px_rgba(255,0,0,0.8)]" style={{ fontFamily: 'Arial' }}>X</div>
           </div>
        </div>
      )}

      {/* Score Bar */}
      {(currentScreen === 'answer' || currentScreen === 'fastmoney') && (
        <div className="absolute top-4 left-0 right-0 px-8 flex justify-between z-10">
          <div className={`px-8 py-3 rounded-xl border-4 ${activeTeam === 'sports' ? 'bg-green-900/90 border-green-500 animate-pulse' : 'bg-black/80 border-gray-600'}`}>
            <div className="text-gray-400 text-sm font-bold text-center">SPORTS</div>
            <div className="text-4xl text-yellow-400 font-bold" style={{ fontFamily: "'Anton', sans-serif" }}>{teamScores.sports}</div>
          </div>

          <div className="bg-black/80 px-10 py-3 rounded-full border-4 border-yellow-500 flex items-center gap-4">
            {currentScreen === 'answer' ? (
              [0, 1, 2].map(i => (
                <div key={i} className="w-8 h-8 flex items-center justify-center">
                  {i < strikes ? <X className="w-8 h-8 text-red-600 stroke-[4]" /> : <div className="w-full h-full border-2 border-gray-700 rounded" />}
                </div>
              ))
            ) : (
              <span className="text-yellow-400 font-bold text-xl tracking-wider">FAST MONEY</span>
            )}
          </div>

          <div className={`px-8 py-3 rounded-xl border-4 ${activeTeam === 'news' ? 'bg-blue-900/90 border-blue-500 animate-pulse' : 'bg-black/80 border-gray-600'}`}>
            <div className="text-gray-400 text-sm font-bold text-center">NEWS</div>
            <div className="text-4xl text-yellow-400 font-bold" style={{ fontFamily: "'Anton', sans-serif" }}>{teamScores.news}</div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex items-center justify-center min-h-screen pt-20 pb-10 px-10">
        
        {/* ANSWER BOARD */}
        {currentScreen === 'answer' && currentRoundData && (
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Generated Header */}
            <h1 className="text-7xl text-yellow-400 mb-6 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] tracking-widest" style={{ fontFamily: "'ClarendonBold', serif" }}>
              QUESTION {currentRound + 1}
            </h1>

            {/* Orange Question Box */}
            <div className="w-full bg-gradient-to-br from-orange-500 to-red-600 p-8 rounded-3xl border-[6px] border-yellow-400 shadow-2xl mb-10 text-center animate-[slideUp_0.6s_ease-out]">
              <h2 className="text-4xl text-white drop-shadow-md leading-tight" style={{ fontFamily: "'ClarendonBold', serif" }}>
                {currentRoundData.question}
              </h2>
            </div>

            {/* Answer Grid */}
            <div className="w-full grid grid-cols-2 gap-4">
              {currentRoundData.answers.map((answer, idx) => (
                <div 
                  key={idx}
                  className={`h-24 rounded-xl border-4 flex items-center justify-between px-6 transition-all duration-500 ${
                    revealedAnswers.includes(idx) 
                      ? 'bg-gradient-to-br from-green-600 to-green-800 border-green-400 animate-[flipIn_0.6s_ease-out]' 
                      : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold border-2 ${
                      revealedAnswers.includes(idx) ? 'bg-yellow-400 text-black border-white' : 'bg-slate-700 text-slate-500 border-slate-600'
                    }`} style={{ fontFamily: "'Anton', sans-serif" }}>
                      {idx + 1}
                    </div>
                    <span className="text-3xl text-white uppercase font-bold tracking-wide" style={{ fontFamily: "'ClarendonBold', serif" }}>
                      {revealedAnswers.includes(idx) ? answer.text : ''}
                    </span>
                  </div>
                  <span className="text-4xl font-bold text-yellow-400" style={{ fontFamily: "'Anton', sans-serif" }}>
                    {revealedAnswers.includes(idx) ? answer.points : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAST MONEY BOARD */}
        {currentScreen === 'fastmoney' && (
          <div className="w-full max-w-4xl flex flex-col items-center mt-10">
            <h1 className="text-7xl text-yellow-400 mb-2 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] tracking-[0.2em]" style={{ fontFamily: "'ClarendonBold', serif" }}>
              FAST MONEY
            </h1>
            
            <div className="mb-8 px-8 py-2 bg-black/60 rounded-full border-2 border-yellow-500">
              <span className={`text-5xl font-mono font-bold ${fastMoneyTimer <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                {fastMoneyTimer}
              </span>
            </div>

            {/* Active Question Display (Orange Box) */}
            {fastMoneyActiveQuestionText && (
               <div className="w-full bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl border-[4px] border-yellow-400 shadow-xl mb-8 text-center animate-[slideUp_0.5s_ease-out]">
                 <h2 className="text-3xl text-white drop-shadow-md" style={{ fontFamily: "'ClarendonBold', serif" }}>
                   {fastMoneyActiveQuestionText}
                 </h2>
               </div>
            )}

            {/* Answer Slots */}
            <div className="w-full space-y-3">
              {fastMoneySlots.map((slot, idx) => (
                <div key={idx} className="h-20 bg-black/40 rounded-xl border-[3px] border-slate-600 flex overflow-hidden">
                  <div className={`flex-1 flex items-center px-8 text-3xl font-bold uppercase transition-colors duration-500 ${
                    slot.revealed ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' : 'bg-transparent'
                  }`} style={{ fontFamily: "'ClarendonBold', serif" }}>
                    {slot.revealed ? slot.answer : ''}
                  </div>
                  
                  <div className={`w-32 flex items-center justify-center border-l-2 border-black/50 text-4xl font-bold transition-colors duration-500 ${
                    slot.revealed ? 'bg-yellow-400 text-black' : 'bg-black/60'
                  }`} style={{ fontFamily: "'Anton', sans-serif" }}>
                    {slot.revealed ? slot.points : ''}
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full flex justify-end mt-6">
              <div className="bg-black px-8 py-3 rounded-xl border-[3px] border-green-500 flex items-center gap-6">
                <span className="text-gray-400 text-2xl font-bold tracking-widest">TOTAL</span>
                <span className="text-6xl text-green-500 font-bold" style={{ fontFamily: "'Anton', sans-serif" }}>
                  {fastMoneyTotalScore}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default function App() {
  const [role, setRole] = useState(null);

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-700">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Anton', sans-serif" }}>FAMILY FEUD</h1>
          <p className="text-slate-400 mb-8">Game Night Control Center</p>
          <div className="space-y-4">
            <button onClick={() => setRole('controller')} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95">
              <Smartphone className="w-6 h-6" /><span className="text-xl font-bold text-white">Host Controller</span>
            </button>
            <button onClick={() => setRole('display')} className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95">
              <Monitor className="w-6 h-6" /><span className="text-xl font-bold text-white">Big Screen Display</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  return role === 'controller' ? <Controller /> : <Display />;
}
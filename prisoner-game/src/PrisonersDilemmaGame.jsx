import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Trophy, RotateCcw, Brain } from 'lucide-react';

// Add pixel font
const pixelFont = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

* {
  font-family: 'Press Start 2P', monospace !important;
}

input, button {
  font-family: 'Press Start 2P', monospace !important;
}
`;

// AI Strategy definitions
const AI_STRATEGIES = {
  titForTat: (history) => {
    if (history.length === 0) return 'cooperate';
    return history[history.length - 1].opponentChoice;
  },
  alwaysCooperate: () => 'cooperate',
  alwaysDefect: () => 'defect',
  random: () => Math.random() > 0.5 ? 'cooperate' : 'defect',
  grudger: (history) => {
    // Cooperates until opponent defects once, then always defects
    const betrayed = history.some(game => game.opponentChoice === 'defect');
    return betrayed ? 'defect' : 'cooperate';
  },
  pavlov: (history) => {
    // Win-stay, lose-shift
    if (history.length === 0) return 'cooperate';
    const lastGame = history[history.length - 1];
    // If got 3 or 5 points (won), repeat. If got 0 or 1 (lost), switch
    if (lastGame.myPoints >= 3) return lastGame.myChoice;
    return lastGame.myChoice === 'cooperate' ? 'defect' : 'cooperate';
  },
  suspiciousTitForTat: (history) => {
    // Starts with defect, then copies opponent
    if (history.length === 0) return 'defect';
    return history[history.length - 1].opponentChoice;
  },
  generous: (history) => {
    // Like Tit-for-Tat but sometimes forgives defections
    if (history.length === 0) return 'cooperate';
    if (history[history.length - 1].opponentChoice === 'defect') {
      return Math.random() > 0.3 ? 'defect' : 'cooperate'; // 70% retaliate, 30% forgive
    }
    return 'cooperate';
  },
  detective: (history) => {
    // Tests opponent: cooperate, defect, cooperate, cooperate
    // Then uses strategy based on if opponent retaliated
    if (history.length === 0) return 'cooperate';
    if (history.length === 1) return 'defect';
    if (history.length === 2) return 'cooperate';
    if (history.length === 3) return 'cooperate';
    
    // Check if opponent ever defected in response
    const opponentDefected = history.some(game => game.opponentChoice === 'defect');
    if (opponentDefected) {
      // Use Tit-for-Tat
      return history[history.length - 1].opponentChoice;
    } else {
      // Always defect if opponent seems too nice
      return 'defect';
    }
  },
  alternator: (history) => {
    // Alternates between cooperate and defect
    return history.length % 2 === 0 ? 'cooperate' : 'defect';
  }
};

// AI Opponents with personalities and appearances
const AI_OPPONENTS = [
  {
    id: 'tit-for-tat',
    name: 'Mirror',
    strategy: AI_STRATEGIES.titForTat,
    description: 'Copies your last move',
    skinTone: '#f0c080',
    hairColor: '#8b4513',
    hatColor: null,
    shoeColor: '#000000',
    personality: 'Fair player - treats you how you treat them'
  },
  {
    id: 'always-cooperate',
    name: 'Saint',
    strategy: AI_STRATEGIES.alwaysCooperate,
    description: 'Always stays silent',
    skinTone: '#d4a574',
    hairColor: '#ffd700',
    hatColor: '#ffffff',
    shoeColor: '#8b4513',
    personality: 'Trusting soul - never betrays'
  },
  {
    id: 'always-defect',
    name: 'Backstabber',
    strategy: AI_STRATEGIES.alwaysDefect,
    description: 'Always betrays',
    skinTone: '#c68562',
    hairColor: '#000000',
    hatColor: '#ff0000',
    shoeColor: '#000000',
    personality: 'Pure evil - always defects'
  },
  {
    id: 'random',
    name: 'Chaos',
    strategy: AI_STRATEGIES.random,
    description: 'Unpredictable choices',
    skinTone: '#e0ac69',
    hairColor: '#ff6b9d',
    hatColor: '#9b59b6',
    shoeColor: '#e74c3c',
    personality: 'Wild card - completely random'
  },
  {
    id: 'grudger',
    name: 'Grudger',
    strategy: AI_STRATEGIES.grudger,
    description: 'Never forgives betrayal',
    skinTone: '#8b6f47',
    hairColor: '#654321',
    hatColor: '#2c3e50',
    shoeColor: '#000000',
    personality: 'Holds grudges - one betrayal and it\'s over'
  },
  {
    id: 'pavlov',
    name: 'Pavlov',
    strategy: AI_STRATEGIES.pavlov,
    description: 'Win-stay, lose-shift',
    skinTone: '#daa06d',
    hairColor: '#708090',
    hatColor: null,
    shoeColor: '#4a4a4a',
    personality: 'Strategic - repeats success, changes after failure'
  },
  {
    id: 'suspicious',
    name: 'Skeptic',
    strategy: AI_STRATEGIES.suspiciousTitForTat,
    description: 'Starts with betrayal',
    skinTone: '#c19a6b',
    hairColor: '#000000',
    hatColor: '#34495e',
    shoeColor: '#000000',
    personality: 'Distrustful - tests you first, then mirrors'
  },
  {
    id: 'generous',
    name: 'Forgiving',
    strategy: AI_STRATEGIES.generous,
    description: 'Sometimes forgives',
    skinTone: '#f5deb3',
    hairColor: '#d2691e',
    hatColor: '#87ceeb',
    shoeColor: '#8b4513',
    personality: 'Merciful - usually retaliates but sometimes forgives'
  },
  {
    id: 'detective',
    name: 'Detective',
    strategy: AI_STRATEGIES.detective,
    description: 'Tests then exploits',
    skinTone: '#bc9b7a',
    hairColor: '#a0522d',
    hatColor: '#708090',
    shoeColor: '#2f4f4f',
    personality: 'Clever - tests your strategy then adapts'
  },
  {
    id: 'alternator',
    name: 'Flip-Flop',
    strategy: AI_STRATEGIES.alternator,
    description: 'Alternates moves',
    skinTone: '#d2b48c',
    hairColor: '#ff8c00',
    hatColor: '#ffd700',
    shoeColor: '#ff6347',
    personality: 'Predictable - alternates between cooperate and defect'
  }
];

// Pixel art component for prisoner
const PixelPrisoner = ({ skinTone, hairColor, hatColor, shoeColor, size = 8 }) => {
  const scale = size;
  
  return (
    <div style={{ 
      display: 'inline-block', 
      imageRendering: 'pixelated',
      transform: `scale(${scale})`,
      transformOrigin: 'center'
    }}>
      <svg width="16" height="24" viewBox="0 0 16 24" style={{ imageRendering: 'pixelated' }}>
        {/* Shoes */}
        <rect x="4" y="22" width="3" height="2" fill={shoeColor} />
        <rect x="9" y="22" width="3" height="2" fill={shoeColor} />
        
        {/* Legs (striped pants) */}
        <rect x="4" y="16" width="3" height="6" fill="#ffffff" />
        <rect x="9" y="16" width="3" height="6" fill="#ffffff" />
        <rect x="4" y="17" width="3" height="1" fill="#000000" />
        <rect x="9" y="17" width="3" height="1" fill="#000000" />
        <rect x="4" y="19" width="3" height="1" fill="#000000" />
        <rect x="9" y="19" width="3" height="1" fill="#000000" />
        <rect x="4" y="21" width="3" height="1" fill="#000000" />
        <rect x="9" y="21" width="3" height="1" fill="#000000" />
        
        {/* Body (striped shirt) */}
        <rect x="3" y="10" width="10" height="6" fill="#ffffff" />
        <rect x="3" y="11" width="10" height="1" fill="#000000" />
        <rect x="3" y="13" width="10" height="1" fill="#000000" />
        <rect x="3" y="15" width="10" height="1" fill="#000000" />
        
        {/* Arms */}
        <rect x="1" y="11" width="2" height="4" fill="#ffffff" />
        <rect x="13" y="11" width="2" height="4" fill="#ffffff" />
        <rect x="1" y="12" width="2" height="1" fill="#000000" />
        <rect x="13" y="12" width="2" height="1" fill="#000000" />
        
        {/* Hands */}
        <rect x="1" y="15" width="2" height="2" fill={skinTone} />
        <rect x="13" y="15" width="2" height="2" fill={skinTone} />
        
        {/* Head */}
        <rect x="5" y="4" width="6" height="6" fill={skinTone} />
        
        {/* Eyes */}
        <rect x="6" y="6" width="1" height="1" fill="#000000" />
        <rect x="9" y="6" width="1" height="1" fill="#000000" />
        
        {/* Mouth */}
        <rect x="7" y="8" width="2" height="1" fill="#000000" />
        
        {/* Hair */}
        {hairColor && (
          <>
            <rect x="5" y="3" width="6" height="2" fill={hairColor} />
            <rect x="4" y="4" width="1" height="3" fill={hairColor} />
            <rect x="11" y="4" width="1" height="3" fill={hairColor} />
          </>
        )}
        
        {/* Hat */}
        {hatColor && (
          <>
            <rect x="5" y="2" width="6" height="2" fill={hatColor} />
            <rect x="4" y="2" width="8" height="1" fill={hatColor} />
          </>
        )}
      </svg>
    </div>
  );
};

const PrisonersDilemmaGame = () => {
  const [gameState, setGameState] = useState('menu'); // menu, playing, results
  const [playerName, setPlayerName] = useState('');
  const [currentOpponent, setCurrentOpponent] = useState(null);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [playerStats, setPlayerStats] = useState({ totalScore: 0, gamesPlayed: 0, cooperations: 0, defections: 0 });
  const [gameHistory, setGameHistory] = useState({});
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = () => {
    try {
      const statsData = localStorage.getItem('player_stats');
      if (statsData) {
        setPlayerStats(JSON.parse(statsData));
      }

      const historyData = localStorage.getItem('game_history');
      if (historyData) {
        setGameHistory(JSON.parse(historyData));
      }

      const nameData = localStorage.getItem('player_name');
      if (nameData) {
        setPlayerName(JSON.parse(nameData));
      }
    } catch (error) {
      console.log('No saved data found, starting fresh');
    }
  };

  const saveGameData = (stats, history) => {
    try {
      localStorage.setItem('player_stats', JSON.stringify(stats));
      localStorage.setItem('game_history', JSON.stringify(history));
      if (playerName) {
        localStorage.setItem('player_name', JSON.stringify(playerName));
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const startGame = () => {
    if (!playerName.trim()) {
      window.alert('Please enter your name!');
      return;
    }
    
    // Pick a random opponent
    const randomOpponent = AI_OPPONENTS[Math.floor(Math.random() * AI_OPPONENTS.length)];
    setCurrentOpponent(randomOpponent);
    setPlayerChoice(null);
    setOpponentChoice(null);
    setResult(null);
    setGameState('playing');
  };

  const makeChoice = (choice) => {
    setPlayerChoice(choice);
    
    // AI makes its choice based on history
    const opponentHistory = gameHistory[currentOpponent.id] || [];
    const aiChoice = currentOpponent.strategy(opponentHistory);
    setOpponentChoice(aiChoice);
    
    // Calculate results
    const outcome = calculateOutcome(choice, aiChoice);
    setResult(outcome);
    
    // Update stats
    const newStats = {
      totalScore: playerStats.totalScore + outcome.playerPoints,
      gamesPlayed: playerStats.gamesPlayed + 1,
      cooperations: playerStats.cooperations + (choice === 'cooperate' ? 1 : 0),
      defections: playerStats.defections + (choice === 'defect' ? 1 : 0)
    };
    setPlayerStats(newStats);
    
    // Update history for this opponent
    const newHistory = { ...gameHistory };
    if (!newHistory[currentOpponent.id]) {
      newHistory[currentOpponent.id] = [];
    }
    newHistory[currentOpponent.id].push({
      myChoice: choice,
      opponentChoice: aiChoice,
      myPoints: outcome.playerPoints,
      opponentPoints: outcome.opponentPoints
    });
    setGameHistory(newHistory);
    
    // Save data
    saveGameData(newStats, newHistory);
    
    setGameState('results');
  };

  const calculateOutcome = (playerChoice, opponentChoice) => {
    let playerPoints = 0;
    let opponentPoints = 0;
    let outcomeText = '';

    if (playerChoice === 'cooperate' && opponentChoice === 'cooperate') {
      playerPoints = 3;
      opponentPoints = 3;
      outcomeText = 'Mutual Cooperation!';
    } else if (playerChoice === 'defect' && opponentChoice === 'defect') {
      playerPoints = 1;
      opponentPoints = 1;
      outcomeText = 'Mutual Defection';
    } else if (playerChoice === 'cooperate' && opponentChoice === 'defect') {
      playerPoints = 0;
      opponentPoints = 5;
      outcomeText = 'You Were Exploited!';
    } else if (playerChoice === 'defect' && opponentChoice === 'cooperate') {
      playerPoints = 5;
      opponentPoints = 0;
      outcomeText = 'You Exploited Them!';
    }

    return { playerPoints, opponentPoints, outcomeText };
  };

  const playAgain = () => {
    startGame();
  };

  const backToMenu = () => {
    setGameState('menu');
    setCurrentOpponent(null);
    setPlayerChoice(null);
    setOpponentChoice(null);
    setResult(null);
  };

  const resetGame = () => {
    if (window.confirm('Are you sure you want to reset all progress?')) {
      try {
        localStorage.removeItem('player_stats');
        localStorage.removeItem('game_history');
        localStorage.removeItem('player_name');
        setPlayerStats({ totalScore: 0, gamesPlayed: 0, cooperations: 0, defections: 0 });
        setGameHistory({});
        window.alert('Progress reset!');
      } catch (error) {
        console.error('Error resetting:', error);
        window.alert('Error resetting progress');
      }
    }
  };

  // Menu Screen
  if (gameState === 'menu') {
    return (
      <>
        <style>{pixelFont}</style>
        <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gray-800 border-4 border-gray-600 p-6 mb-4 text-center">
            <h1 className="text-5xl font-bold text-green-400 mb-2">
              PRISONER'S DILEMMA
            </h1>
            <p className="text-gray-400 text-lg">
              Play Against AI Prisoners
            </p>
          </div>

          {/* Player name input */}
          <div className="bg-gray-800 border-4 border-gray-600 p-6 mb-4">
            <label className="text-yellow-400 text-xl mb-2 block">
              YOUR PRISONER NAME
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && startGame()}
              placeholder="Enter your name..."
              className="w-full bg-gray-900 border-2 border-gray-600 text-green-400 p-3 text-lg"
              maxLength={20}
            />
          </div>

          {/* Stats */}
          {playerStats.gamesPlayed > 0 && (
            <div className="bg-gray-800 border-4 border-gray-600 p-6 mb-4">
              <h2 className="text-yellow-400 text-xl mb-3">
                YOUR STATS
              </h2>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-gray-400 text-sm">SCORE</div>
                  <div className="text-yellow-400 text-2xl font-bold">{playerStats.totalScore}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">GAMES</div>
                  <div className="text-green-400 text-2xl font-bold">{playerStats.gamesPlayed}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">COOPERATE</div>
                  <div className="text-blue-400 text-2xl font-bold">{playerStats.cooperations}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">DEFECT</div>
                  <div className="text-red-400 text-2xl font-bold">{playerStats.defections}</div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions toggle */}
          <div className="bg-gray-800 border-4 border-gray-600 p-6 mb-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full text-left text-yellow-400 text-xl font-bold flex items-center justify-between"
            >
              <span>📖 THE RULES</span>
              <span>{showInstructions ? '▲' : '▼'}</span>
            </button>
            
            {showInstructions && (
              <div className="mt-4 text-green-300 space-y-2" style={{ fontSize: '14px' }}>
                <p>• Both cooperate: 3 pts each</p>
                <p>• Both defect: 1 pt each</p>
                <p>• One defects: 5 pts (defector), 0 pts (cooperator)</p>
                <p className="mt-4 text-yellow-400">• Face random AI prisoners with different strategies</p>
                <p className="text-yellow-400">• Build history with each prisoner over multiple rounds</p>
                <p className="text-yellow-400">• Learn their patterns and adapt your strategy!</p>
              </div>
            )}
          </div>

          {/* AI Opponents showcase */}
          <div className="bg-gray-800 border-4 border-gray-600 p-6 mb-4">
            <h2 className="text-yellow-400 text-xl mb-4">
              THE PRISONERS
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {AI_OPPONENTS.map(opponent => (
                <div key={opponent.id} className="bg-gray-900 border-2 border-gray-700 p-3 text-center">
                  <div className="mb-2 flex justify-center">
                    <PixelPrisoner 
                      skinTone={opponent.skinTone}
                      hairColor={opponent.hairColor}
                      hatColor={opponent.hatColor}
                      shoeColor={opponent.shoeColor}
                      size={3}
                    />
                  </div>
                  <div className="text-green-400 text-sm font-bold">
                    {opponent.name}
                  </div>
                  {gameHistory[opponent.id] && (
                    <div className="text-gray-400 text-xs mt-1">
                      {gameHistory[opponent.id].length} games
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 border-4 border-green-800 text-xl"
            >
              🎲 FACE RANDOM OPPONENT
            </button>
            
            {playerStats.gamesPlayed > 0 && (
              <button
                onClick={resetGame}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 border-4 border-red-800"
              >
                <RotateCcw className="inline mr-2" size={20} />
                RESET PROGRESS
              </button>
            )}
          </div>
        </div>
      </div>
      </>
    );
  }

  // Playing Screen
  if (gameState === 'playing') {
    const opponentHistory = gameHistory[currentOpponent.id] || [];
    
    return (
      <>
        <style>{pixelFont}</style>
        <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Opponent info */}
          <div className="bg-gray-800 border-4 border-gray-600 p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl text-red-400 font-bold">
                  {currentOpponent.name}
                </h2>
                <p className="text-gray-400">
                  {currentOpponent.description}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <PixelPrisoner 
                  skinTone={currentOpponent.skinTone}
                  hairColor={currentOpponent.hairColor}
                  hatColor={currentOpponent.hatColor}
                  shoeColor={currentOpponent.shoeColor}
                  size={6}
                />
              </div>
            </div>
            
            <div className="bg-gray-900 border-2 border-gray-700 p-3">
              <div className="flex items-center gap-2 text-yellow-400">
                <Brain size={20} />
                <span className="text-sm">{currentOpponent.personality}</span>
              </div>
            </div>
          </div>

          {/* History with this opponent */}
          {opponentHistory.length > 0 && (
            <div className="bg-gray-800 border-4 border-gray-600 p-6 mb-4">
              <h3 className="text-yellow-400 text-xl mb-3">
                PREVIOUS ENCOUNTERS WITH {currentOpponent.name.toUpperCase()}
              </h3>
              <div className="space-y-2">
                {opponentHistory.slice(-5).reverse().map((game, idx) => (
                  <div key={idx} className="bg-gray-900 border-2 border-gray-700 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400">Round {opponentHistory.length - idx}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">You:</span>
                        {game.myChoice === 'cooperate' ? (
                          <ThumbsUp size={20} className="text-blue-400" />
                        ) : (
                          <ThumbsDown size={20} className="text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400">{currentOpponent.name}:</span>
                        {game.opponentChoice === 'cooperate' ? (
                          <ThumbsUp size={20} className="text-blue-400" />
                        ) : (
                          <ThumbsDown size={20} className="text-red-400" />
                        )}
                      </div>
                      <span className="text-yellow-400">You: +{game.myPoints} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Choice interface */}
          <div className="bg-gray-800 border-4 border-gray-600 p-6 mb-4">
            <h3 className="text-2xl text-yellow-400 text-center mb-6">
              MAKE YOUR CHOICE
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => makeChoice('cooperate')}
                className="bg-blue-600 hover:bg-blue-500 border-4 border-blue-800 p-8 flex flex-col items-center gap-4 transition-transform hover:scale-105"
              >
                <ThumbsUp size={64} className="text-white" />
                <span className="text-white text-2xl font-bold">
                  COOPERATE
                </span>
                <span className="text-blue-200 text-sm">
                  Stay silent (3/3 if both)
                </span>
              </button>

              <button
                onClick={() => makeChoice('defect')}
                className="bg-red-600 hover:bg-red-500 border-4 border-red-800 p-8 flex flex-col items-center gap-4 transition-transform hover:scale-105"
              >
                <ThumbsDown size={64} className="text-white" />
                <span className="text-white text-2xl font-bold">
                  DEFECT
                </span>
                <span className="text-red-200 text-sm">
                  Betray them (5/0 if they cooperate)
                </span>
              </button>
            </div>
          </div>

          {/* Current stats */}
          <div className="bg-gray-800 border-4 border-gray-600 p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-sm">TOTAL SCORE</div>
                <div className="text-yellow-400 text-xl font-bold">{playerStats.totalScore}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">GAMES</div>
                <div className="text-green-400 text-xl font-bold">{playerStats.gamesPlayed}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">WIN RATE</div>
                <div className="text-blue-400 text-xl font-bold">
                  {playerStats.gamesPlayed > 0 ? Math.round((playerStats.cooperations / playerStats.gamesPlayed) * 100) : 0}%
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">AVG SCORE</div>
                <div className="text-yellow-400 text-xl font-bold">
                  {playerStats.gamesPlayed > 0 ? (playerStats.totalScore / playerStats.gamesPlayed).toFixed(1) : 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Results Screen
  if (gameState === 'results') {
    return (
      <>
        <style>{pixelFont}</style>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border-4 border-gray-600 p-8 max-w-2xl w-full">
          <h2 className="text-4xl text-yellow-400 text-center mb-6">
            {result.outcomeText}
          </h2>

          {/* Visual outcome */}
          <div className="bg-gray-900 border-2 border-gray-700 p-6 mb-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Player */}
              <div className="text-center">
                <div className="text-green-400 text-lg mb-3">
                  {playerName || 'YOU'}
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-3">
                    {playerChoice === 'cooperate' ? (
                      <ThumbsUp size={64} className="text-blue-400" />
                    ) : (
                      <ThumbsDown size={64} className="text-red-400" />
                    )}
                  </div>
                  <div className="text-yellow-400 text-4xl font-bold">
                    +{result.playerPoints}
                  </div>
                </div>
              </div>

              {/* Opponent */}
              <div className="text-center">
                <div className="text-red-400 text-lg mb-3">
                  {currentOpponent.name}
                </div>
                <div className="flex flex-col items-center gap-4">
                  <PixelPrisoner 
                    skinTone={currentOpponent.skinTone}
                    hairColor={currentOpponent.hairColor}
                    hatColor={currentOpponent.hatColor}
                    shoeColor={currentOpponent.shoeColor}
                    size={5}
                  />
                  <div className="flex items-center justify-center gap-3">
                    {opponentChoice === 'cooperate' ? (
                      <ThumbsUp size={48} className="text-blue-400" />
                    ) : (
                      <ThumbsDown size={48} className="text-red-400" />
                    )}
                  </div>
                  <div className="text-yellow-400 text-4xl font-bold">
                    +{result.opponentPoints}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Updated stats */}
          <div className="bg-gray-900 border-2 border-gray-700 p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-sm">YOUR TOTAL SCORE</div>
                <div className="text-yellow-400 text-3xl font-bold">{playerStats.totalScore}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">GAMES PLAYED</div>
                <div className="text-green-400 text-3xl font-bold">{playerStats.gamesPlayed}</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={playAgain}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 border-4 border-green-800 text-xl"
            >
              🎲 NEXT OPPONENT
            </button>
            
            <button
              onClick={backToMenu}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 border-4 border-gray-700"
            >
              ← BACK TO MENU
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  return null;
};

export default PrisonersDilemmaGame;

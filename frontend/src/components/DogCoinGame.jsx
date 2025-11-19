import React, { useState, useEffect, useRef } from 'react';

const DogCoinGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'gameOver'
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameSpeed, setGameSpeed] = useState(1);
  
  const dogRef = useRef({ x: 0, y: 0, width: 60, height: 40 });
  const coinsRef = useRef([]);
  const animationRef = useRef();
  const lastCoinTime = useRef(0);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setGameSpeed(1);
    coinsRef.current = [];
    lastCoinTime.current = 0;
    
    // Initialize dog position
    const canvas = canvasRef.current;
    if (canvas) {
      dogRef.current.x = canvas.width / 2 - 30;
      dogRef.current.y = canvas.height - 60;
    }
  };

  const drawDog = (ctx, x, y) => {
    // Dog body
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y, 40, 25);
    
    // Dog head
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(x + 10, y - 15, 30, 20);
    
    // Dog ears
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 5, y - 20, 8, 12);
    ctx.fillRect(x + 27, y - 20, 8, 12);
    
    // Dog tail
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 40, y + 5, 15, 5);
    
    // Dog eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 15, y - 10, 3, 3);
    ctx.fillRect(x + 25, y - 10, 3, 3);
    
    // Dog nose
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 20, y - 5, 3, 2);
  };

  const drawCoin = (ctx, coin) => {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin shine
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(coin.x - 3, coin.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkCollision = (dog, coin) => {
    return (
      dog.x < coin.x + coin.radius &&
      dog.x + dog.width > coin.x - coin.radius &&
      dog.y < coin.y + coin.radius &&
      dog.y + dog.height > coin.y - coin.radius
    );
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;

    const ctx = canvas.getContext('2d');
    const now = Date.now();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(100, 50, 20, 0, Math.PI * 2);
    ctx.arc(120, 50, 25, 0, Math.PI * 2);
    ctx.arc(140, 50, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(300, 80, 15, 0, Math.PI * 2);
    ctx.arc(315, 80, 20, 0, Math.PI * 2);
    ctx.arc(330, 80, 15, 0, Math.PI * 2);
    ctx.fill();

    // Spawn coins
    if (now - lastCoinTime.current > 2000 / gameSpeed) {
      coinsRef.current.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        radius: 10,
        speed: 2 + gameSpeed
      });
      lastCoinTime.current = now;
    }

    // Update and draw coins
    coinsRef.current = coinsRef.current.filter(coin => {
      coin.y += coin.speed;
      
      // Check collision with dog
      if (checkCollision(dogRef.current, coin)) {
        setScore(prev => prev + 10);
        return false; // Remove coin
      }
      
      // Remove coin if it hits the ground
      if (coin.y > canvas.height) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState('gameOver');
          }
          return newLives;
        });
        return false;
      }
      
      return true;
    });

    // Draw coins
    coinsRef.current.forEach(coin => drawCoin(ctx, coin));

    // Draw dog
    drawDog(ctx, dogRef.current.x, dogRef.current.y);

    // Increase game speed every 50 points
    if (score > 0 && score % 50 === 0) {
      setGameSpeed(prev => Math.min(prev + 0.1, 3));
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoop();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, score]);

  const handleKeyPress = (e) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const step = 20;
    switch (e.key) {
      case 'ArrowLeft':
        dogRef.current.x = Math.max(0, dogRef.current.x - step);
        break;
      case 'ArrowRight':
        dogRef.current.x = Math.min(canvas.width - dogRef.current.width, dogRef.current.x + step);
        break;
      case 'a':
      case 'A':
        dogRef.current.x = Math.max(0, dogRef.current.x - step);
        break;
      case 'd':
      case 'D':
        dogRef.current.x = Math.min(canvas.width - dogRef.current.width, dogRef.current.x + step);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);

  return (
    <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-xl shadow-lg">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">🐕 Dog Coin Catcher Game</h3>
        <p className="text-gray-600">Use arrow keys or A/D to move the dog and catch falling coins!</p>
      </div>
      
      <div className="flex justify-center mb-4">
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex gap-6 text-lg font-semibold">
            <div className="text-green-600">Score: {score}</div>
            <div className="text-red-600">Lives: {lives}</div>
            <div className="text-blue-600">Speed: {gameSpeed.toFixed(1)}x</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="border-2 border-gray-300 rounded-lg bg-sky-200"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <div className="text-center">
        {gameState === 'ready' && (
          <button
            onClick={startGame}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Start Game
          </button>
        )}
        
        {gameState === 'gameOver' && (
          <div className="space-y-4">
            <div className="text-2xl font-bold text-red-600">Game Over!</div>
            <div className="text-lg">Final Score: {score}</div>
            <button
              onClick={startGame}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
        
        {gameState === 'playing' && (
          <div className="text-sm text-gray-600">
            Use ← → arrow keys or A/D to move the dog
          </div>
        )}
      </div>
    </div>
  );
};

export default DogCoinGame;
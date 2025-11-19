import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPaw } from 'react-icons/fa';
import DogCoinGame from '../components/DogCoinGame';

const GamePage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-300"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <FaPaw className="text-orange-400 w-6 h-6 animate-bounce" />
                <h1 className="text-2xl font-bold text-white">PetVerse Game Center</h1>
              </div>
            </div>
            <div className="text-white">
              <span className="text-sm opacity-80">🎮 Fun & Interactive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🐕 Dog Coin Catcher
          </h2>
          <p className="text-xl text-gray-200 mb-6">
            Help our adorable dog catch falling coins and earn points!
          </p>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-white mb-4">How to Play:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <p className="text-gray-200">🎮 <strong>Controls:</strong></p>
                <p className="text-gray-300">• Use ← → arrow keys</p>
                <p className="text-gray-300">• Or use A/D keys</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-200">🏆 <strong>Objective:</strong></p>
                <p className="text-gray-300">• Catch falling coins</p>
                <p className="text-gray-300">• Don't let coins hit the ground</p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Component */}
        <div className="flex justify-center">
          <DogCoinGame />
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold text-white mb-4">Game Features</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-2">🏆</div>
                <h4 className="text-lg font-semibold text-white mb-2">Progressive Difficulty</h4>
                <p className="text-gray-300">Game speed increases as you score more points</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">❤️</div>
                <h4 className="text-lg font-semibold text-white mb-2">Lives System</h4>
                <p className="text-gray-300">Start with 3 lives - don't let coins hit the ground!</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">⭐</div>
                <h4 className="text-lg font-semibold text-white mb-2">Score Tracking</h4>
                <p className="text-gray-300">Earn 10 points for each coin you catch</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-gray-300">
            Enjoying the game? Explore more of PetVerse's services and products!
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
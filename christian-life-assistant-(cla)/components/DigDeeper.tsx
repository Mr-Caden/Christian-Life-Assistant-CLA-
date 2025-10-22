import React from 'react';
import { SparklesIcon } from './Icons';

interface DigDeeperProps {
  suggestions: string[];
  onSelectSuggestion: (prompt: string) => void;
}

export const DigDeeper: React.FC<DigDeeperProps> = ({ suggestions, onSelectSuggestion }) => {
  return (
    <div className="flex justify-start animate-[fade-in_0.2s_ease-out] ml-12">
      <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 max-w-2xl">
          <h3 className="flex items-center text-sm font-semibold text-amber-100 mb-2">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Dig Deeper
          </h3>
          <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                  <button
                      key={index}
                      onClick={() => onSelectSuggestion(suggestion)}
                      className="text-sm text-left py-1 px-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-200"
                  >
                      {suggestion}
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
};

import React from 'react';
import { SparklesIcon } from './Icons';

interface ConversationStartersProps {
  onSelectStarter: (prompt: string) => void;
}

const starters = [
  "Create a sermon about the concept of the Trinity.",
  "What is the significance of Jesus' resurrection?",
  "Write a brief blog post about early church history.",
  "Share some verses about hope in hard times.",
];

export const ConversationStarters: React.FC<ConversationStartersProps> = ({ onSelectStarter }) => {
  return (
    <div className="animate-[slide-up_0.3s_ease-out] p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <h3 className="flex items-center text-lg font-semibold text-amber-100 mb-3">
            <SparklesIcon className="h-5 w-5 mr-2" />
            Conversation Starters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {starters.map((starter, index) => (
                <button
                    key={index}
                    onClick={() => onSelectStarter(starter)}
                    className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-200"
                >
                    {starter}
                </button>
            ))}
        </div>
    </div>
  );
};

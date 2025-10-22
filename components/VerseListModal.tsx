import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Verse } from '../types';
import { CloseIcon, ClipboardIcon, SearchIcon } from './Icons';

interface VerseListModalProps {
  isOpen: boolean;
  onClose: () => void;
  verses: Verse[];
}

const VerseCard: React.FC<{ verse: Verse; index: number }> = ({ verse, index }) => {
  const [isCopied, setIsCopied] = useState(false);
  const bibleGatewayUrl = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(verse.reference)}&version=${verse.version}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${verse.text} —${verse.reference} ${verse.version}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 animate-[fade-in_0.2s_ease-out]" style={{animationDelay: `${index * 50}ms`, animationFillMode: 'backwards'}}>
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-amber-200">{verse.reference} <span className="text-xs font-normal text-gray-400">{verse.version}</span></h3>
        {verse.topic && <span className="text-xs bg-amber-900/50 text-amber-200 px-2 py-1 rounded-full">{verse.topic}</span>}
      </div>
      <p className="text-gray-200 my-2 italic">"{verse.text}"</p>
      <div className="flex items-center justify-end space-x-2 mt-3">
        <a href={bibleGatewayUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-400 hover:text-amber-300 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-2 py-1">
          View on Bible Gateway
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 text-gray-200 font-semibold py-1 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-700 transition-colors disabled:opacity-70"
          disabled={isCopied}
          aria-label={`Copy ${verse.reference}`}
        >
          <ClipboardIcon className="h-4 w-4" />
          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};

export const VerseListModal: React.FC<VerseListModalProps> = ({ isOpen, onClose, verses }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');

  const topics = useMemo(() => {
    if (!verses || verses.length === 0) return ['All'];
    const uniqueTopics = new Set(verses.map(v => v.topic || 'Uncategorized').filter(Boolean));
    return ['All', ...Array.from(uniqueTopics).sort()];
  }, [verses]);

  const filteredVerses = useMemo(() => {
    return verses.filter(verse => {
      const topicForFilter = verse.topic || 'Uncategorized';
      const topicMatch = selectedTopic === 'All' || topicForFilter === selectedTopic;
      
      const query = searchQuery.toLowerCase().trim();
      const searchMatch = !query ||
          verse.reference.toLowerCase().includes(query) ||
          verse.text.toLowerCase().includes(query) ||
          (verse.topic || '').toLowerCase().includes(query);

      return topicMatch && searchMatch;
    });
  }, [verses, searchQuery, selectedTopic]);

  useEffect(() => {
    if (!isOpen) {
        // Reset filters on close
        setSearchQuery('');
        setSelectedTopic('All');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 animate-[fade-in_0.2s_ease-out]"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div ref={modalRef} className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-gray-700 animate-[slide-up_0.3s_ease-out] flex flex-col" style={{maxHeight: '85vh'}}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-semibold text-amber-100">Scripture References</h2>
          <button onClick={onClose} aria-label="Close scripture list" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full p-1">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Filter Controls */}
        {verses.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-shrink-0">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search by reference, text, or topic..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-gray-100 placeholder-gray-400 transition-shadow"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {topics.length > 1 && (
                    <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-gray-100 transition-shadow appearance-none sm:w-48"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                    >
                        {topics.map(topic => (
                            <option key={topic} value={topic}>{topic}</option>
                        ))}
                    </select>
                )}
            </div>
        )}
        
        <div className="overflow-y-auto space-y-3 pr-2 -mr-2">
            {verses.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                    <p>No scripture references have been mentioned yet.</p>
                    <p className="text-sm mt-1">Verses from the conversation will appear here.</p>
                </div>
            ) : filteredVerses.length > 0 ? (
                filteredVerses.map((verse, index) => (
                    <VerseCard key={`${verse.reference}-${index}`} verse={verse} index={index} />
                ))
            ) : (
                <div className="text-center text-gray-400 py-10">
                    <p>No verses match your search criteria.</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
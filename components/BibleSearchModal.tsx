import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

interface BibleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BIBLE_VERSIONS = [
  { value: 'ESV', name: 'English Standard Version' },
  { value: 'NLT', name: 'New Living Translation' },
  { value: 'KJV', name: 'King James Version' },
  { value: 'NIV', name: 'New International Version' },
  { value: 'NKJV', name: 'New King James Version' },
  { value: 'MSG', name: 'The Message' },
  { value: 'AMP', name: 'Amplified Bible' },
];

const OLD_TESTAMENT_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', 
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
];

const NEW_TESTAMENT_BOOKS = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 
  'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', 
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', 
  '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];


export const BibleSearchModal: React.FC<BibleSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState('ESV');
  const [book, setBook] = useState('ALL');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset form on close
      setQuery('');
      setBook('ALL');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const fullQuery = book === 'ALL' ? query : `${book} ${query}`;
    
    const searchUrl = new URL('https://www.biblegateway.com/quicksearch/');
    searchUrl.searchParams.append('quicksearch', fullQuery);
    searchUrl.searchParams.append('version', version);

    window.open(searchUrl.toString(), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 animate-[fade-in_0.2s_ease-out]"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div ref={modalRef} className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-gray-700 animate-[slide-up_0.3s_ease-out]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-amber-100">Search the Scriptures</h2>
          <button onClick={onClose} aria-label="Close search" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full p-1">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="quicksearch" className="block text-sm font-medium text-gray-300 mb-1">
                    Word, phrase, or passage
                </label>
                <input
                    ref={inputRef}
                    id="quicksearch"
                    name="quicksearch"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={book === 'ALL' ? "e.g., John 3:16 or 'love'" : "e.g., 3:16 or 'creation'"}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-gray-100 placeholder-gray-400 transition-shadow"
                />
            </div>

            <div>
                 <label htmlFor="book" className="block text-sm font-medium text-gray-300 mb-1">
                    Book of the Bible
                </label>
                <select
                    id="book"
                    name="book"
                    value={book}
                    onChange={(e) => setBook(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-gray-100 transition-shadow appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                    <option value="ALL">All Books</option>
                    <optgroup label="Old Testament">
                        {OLD_TESTAMENT_BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </optgroup>
                    <optgroup label="New Testament">
                        {NEW_TESTAMENT_BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </optgroup>
                </select>
            </div>

            <div>
                 <label htmlFor="version" className="block text-sm font-medium text-gray-300 mb-1">
                    Bible Version
                </label>
                <select
                    id="version"
                    name="version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-gray-100 transition-shadow appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                    {BIBLE_VERSIONS.map(v => (
                        <option key={v.value} value={v.value}>{v.name} ({v.value})</option>
                    ))}
                </select>
            </div>
          
            <div className="flex justify-end items-center pt-2">
                 <button
                    type="submit"
                    disabled={!query.trim()}
                    className="bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-amber-800 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    Search on BibleGateway.com
                </button>
            </div>
        </form>
        <div className="text-center mt-4">
          <small className="text-gray-500">
            Search results will open in a new tab on{' '}
            <a href="https://www.biblegateway.com/" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">
              BibleGateway.com
            </a>.
          </small>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat } from '@google/genai';
import { Message, Verse } from './types';
import { createChatSession, extractVerses, generateSuggestions } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { BotIcon, SearchIcon, BookOpenIcon } from './components/Icons';
import { BibleSearchModal } from './components/BibleSearchModal';
import { VerseListModal } from './components/VerseListModal';
import { ConversationStarters } from './components/ConversationStarters';
import { DigDeeper } from './components/DigDeeper';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Peace be with you. I am here to serve as your guide through the scriptures. How may I help you in your walk with the Lord today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isVerseListOpen, setIsVerseListOpen] = useState(false);
  const [extractedVerses, setExtractedVerses] = useState<Verse[]>([]);
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      chatRef.current = createChatSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize chat session.');
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
  
  const handleSendMessage = useCallback(async (prompt: string) => {
    if (isLoading || !prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    const newUserMessage: Message = { role: 'user', content: prompt };
    // Clear suggestions from previous message when a new message is sent
    setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'model' && lastMessage.suggestions) {
            const newMessages = [...prev];
            delete newMessages[newMessages.length - 1].suggestions;
            return [...newMessages, newUserMessage];
        }
        return [...prev, newUserMessage]
    });

    if (!chatRef.current) {
      setError('Chat session is not initialized.');
      setIsLoading(false);
      return;
    }

    try {
      const stream = await chatRef.current.sendMessageStream({ message: prompt });
      
      let newModelMessage: Message = { role: 'model', content: ''};
      setMessages(prev => [...prev, newModelMessage]);
      
      let fullModelResponse = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        fullModelResponse += chunkText;
        setMessages(prev => {
            const updatedMessages = [...prev];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage.role === 'model') {
                lastMessage.content += chunkText;
            }
            return updatedMessages;
        });
      }

      // Once the message is complete, run background tasks
      if (fullModelResponse) {
          // Extract verses with context of existing topics
          const currentTopics = [...new Set(extractedVerses.map(v => v.topic).filter(Boolean) as string[])];
          extractVerses(fullModelResponse, currentTopics).then(verses => {
            if (verses.length > 0) {
              setExtractedVerses(prev => {
                const existingVerseKeys = new Set(prev.map(v => `${v.reference}|${v.version}`));
                const uniqueNewVerses = verses.filter(v => !existingVerseKeys.has(`${v.reference}|${v.version}`));
                
                if (uniqueNewVerses.length > 0) {
                  return [...prev, ...uniqueNewVerses];
                }
                return prev;
              });
            }
          }).catch(extractionError => {
              console.error("Failed to extract verses:", extractionError);
          });

          // Generate "Dig Deeper" suggestions
          generateSuggestions(fullModelResponse).then(suggestions => {
            if (suggestions.length > 0) {
              setMessages(prev => {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if (lastMessage.role === 'model') {
                  lastMessage.suggestions = suggestions;
                }
                return updatedMessages;
              });
            }
          }).catch(suggestionError => {
              console.error("Failed to generate suggestions:", suggestionError);
          });
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'model', content: `Sorry, I encountered an error: ${errorMessage}` }]);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, extractedVerses]);

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
        <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 shadow-lg">
            <div className="flex items-center">
              <BotIcon className="h-8 w-8 text-amber-400" />
              <h1 className="ml-3 text-xl font-semibold tracking-wider text-amber-100">Christian Life Assistant (CLA)</h1>
            </div>
            <div className="flex items-center space-x-2">
                <button
                onClick={() => setIsVerseListOpen(true)}
                className="text-amber-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full p-2 transition-colors"
                aria-label="View Scripture References"
                >
                <BookOpenIcon className="h-6 w-6" />
                </button>
                <button
                onClick={() => setIsSearchModalOpen(true)}
                className="text-amber-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full p-2 transition-colors"
                aria-label="Search Bible"
                >
                <SearchIcon className="h-6 w-6" />
                </button>
            </div>
        </header>

        <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
            ))}

            {messages.length === 1 && !isLoading && (
              <ConversationStarters onSelectStarter={handleSendMessage} />
            )}

            {!isLoading && lastMessage?.role === 'model' && lastMessage.suggestions && (
              <DigDeeper suggestions={lastMessage.suggestions} onSelectSuggestion={handleSendMessage} />
            )}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
                 <div className="flex items-start space-x-4 animate-[fade-in_0.2s_ease-out]">
                    <div className="flex-shrink-0">
                      <BotIcon className="h-8 w-8 text-amber-400" />
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 max-w-2xl">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse [animation-delay:200ms]"></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse [animation-delay:400ms]"></div>
                      </div>
                    </div>
                </div>
            )}
        </main>
        
        <footer className="p-4 bg-gray-800 border-t border-gray-700">
            {error && <p className="text-red-400 text-center text-sm mb-2">{error}</p>}
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </footer>

        <BibleSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
        <VerseListModal isOpen={isVerseListOpen} onClose={() => setIsVerseListOpen(false)} verses={extractedVerses} />
    </div>
  );
};

export default App;
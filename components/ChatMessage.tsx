import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Message } from '../types';
import { UserIcon, BotIcon } from './Icons';

// Use a DOMPurify hook to ensure all links open in a new tab for security and convenience
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const createMarkup = (content: string) => {
  // All content from the AI is now expected to be HTML. We just need to sanitize it.
  const sanitizedMarkup = DOMPurify.sanitize(content);
  return { __html: sanitizedMarkup };
};

// Helper to convert HTML to plain text for clipboard fallback
const getPlainText = (html: string) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';
  const [isCopied, setIsCopied] = useState(false);
  const [isHoveringVerse, setIsHoveringVerse] = useState(false);
  const [isHoveringLink, setIsHoveringLink] = useState(false);

  const copyContent = async (html: string) => {
    // Don't copy empty strings
    if (!html) return;

    // Create a temporary container to modify the HTML for clipboard purposes
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all blockquotes and apply inline styles so they are preserved in Word/Outlook
    const blockquotes = tempDiv.querySelectorAll('blockquote');
    blockquotes.forEach(bq => {
      // Apply a greyscale border and padding to mimic the UI styling
      bq.style.borderLeft = '4px solid #cccccc';
      bq.style.paddingLeft = '1em';
      bq.style.marginLeft = '0'; // Reset prose margins for better pasting
      bq.style.color = '#333333'; // Ensure text is dark on a potentially white background
    });
    
    const styledHtmlForClipboard = tempDiv.innerHTML;


    try {
      // Modern clipboard API to copy HTML and a plain text fallback
      const htmlBlob = new Blob([styledHtmlForClipboard], { type: 'text/html' });
      const textBlob = new Blob([getPlainText(html)], { type: 'text/plain' });
      
      // The ClipboardItem API is the key to copying rich text.
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });

      await navigator.clipboard.write([clipboardItem]);
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Show "Copied!" for 2 seconds
    } catch (err) {
      console.error('Failed to copy rich text: ', err);
      // Fallback for older browsers or environments where ClipboardItem is not supported
      try {
        await navigator.clipboard.writeText(getPlainText(html));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback plain text copy failed: ', fallbackErr);
        alert('Failed to copy message to clipboard.'); // Inform user if all methods fail
      }
    }
  };

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Don't do anything if there's no content (i.e., it's a loading bubble)
    if (!message.content) return;

    const target = event.target as HTMLElement;

    // If a link is clicked, do nothing and let the default browser action occur.
    if (target.closest('a')) {
      return;
    }
    
    // Check if a blockquote (verse) was clicked
    const blockquoteElement = target.closest('blockquote');
    if (blockquoteElement) {
      // If a verse is clicked, copy only the verse.
      copyContent(blockquoteElement.outerHTML);
    } else {
      // If anything else is clicked (the bubble background, a paragraph, etc.), copy the whole message.
      copyContent(message.content);
    }
  };

  const handleMouseOver = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('a')) {
      setIsHoveringLink(true);
      setIsHoveringVerse(false);
    } else if (target.closest('blockquote')) {
      setIsHoveringLink(false);
      setIsHoveringVerse(true);
    } else {
      setIsHoveringLink(false);
      setIsHoveringVerse(false);
    }
  };

  const handleMouseLeave = () => {
    setIsHoveringLink(false);
    setIsHoveringVerse(false);
  };


  return (
    <div className={`flex items-start space-x-4 ${isModel ? '' : 'justify-end'}`}>
      {isModel && (
        <div className="flex-shrink-0">
          <BotIcon className="h-8 w-8 text-amber-400" />
        </div>
      )}
      <div 
        onClick={handleContainerClick}
        onMouseOver={handleMouseOver}
        onMouseLeave={handleMouseLeave}
        title={message.content ? "Click to copy message or a specific verse" : ""}
        className={`relative rounded-lg p-4 max-w-2xl shadow-md transition-all duration-200 ${
          isModel 
            ? 'bg-gray-800 text-gray-200' 
            : 'bg-amber-600 text-white'
        } ${ message.content ? 'cursor-pointer' : '' } ${ 
          isCopied 
            ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-green-400' 
            : (message.content && !isHoveringVerse && !isHoveringLink) ? 'hover:ring-2 hover:ring-offset-2 hover:ring-offset-gray-900 hover:ring-amber-500/50' : '' 
        }`}
      >
        {isCopied && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-[fade-in_0.2s_ease-out] z-10">
            Copied!
          </div>
        )}
        {message.content ? (
           <div 
             className="prose prose-invert max-w-none 
                        prose-p:my-4 
                        prose-headings:text-amber-100 prose-headings:font-semibold 
                        prose-h1:text-2xl prose-h1:border-b prose-h1:border-gray-600 prose-h1:pb-2 prose-h1:mb-4 
                        prose-h2:text-xl prose-h2:border-b prose-h2:border-gray-700 prose-h2:pb-2 prose-h2:mb-3 
                        prose-h3:text-lg 
                        prose-blockquote:border-l-amber-400 prose-blockquote:bg-gray-900/50 prose-blockquote:px-5 prose-blockquote:py-4 prose-blockquote:rounded-lg prose-blockquote:transition-colors hover:prose-blockquote:bg-gray-700 hover:prose-blockquote:ring-2 hover:prose-blockquote:ring-amber-400
                        prose-cite:block prose-cite:text-right prose-cite:mt-3 prose-cite:not-italic prose-cite:font-bold prose-cite:text-gray-400
                        prose-strong:text-amber-200 
                        prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline"
             dangerouslySetInnerHTML={createMarkup(message.content)}
           />
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-150"></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-300"></div>
          </div>
        )}
      </div>
      {!isModel && (
        <div className="flex-shrink-0">
          <UserIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>
  );
};
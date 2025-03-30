"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Reader({ chapterId, content }: { chapterId: number, content: string }) {
  const { data: session } = useSession();
  const [selectedText, setSelectedText] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlights, setHighlights] = useState<Array<{ text: string; active: boolean }>>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Automatically focus the chat input when the chat is opened
  useEffect(() => {
    if (chatOpen && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [chatOpen]);

  // Handle text selection and highlighting
  const handleSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 10) { // Minimum length for a highlight
      if (confirm('Open AI chat for this highlight?')) {
        setSelectedText(text);
        
        // Add the highlight
        setHighlights(prev => {
          // Check if this highlight already exists
          const exists = prev.some(h => h.text === text);
          if (!exists) {
            return [...prev, { text, active: true }];
          }
          // Otherwise just activate it
          return prev.map(h => ({ ...h, active: h.text === text }));
        });
        
        // Open the chat panel
        setChatOpen(true);
        
        // Add initial AI message if this is a new conversation
        if (chatMessages.length === 0) {
          setChatMessages([{
            role: "assistant",
            content: "I noticed you highlighted this passage. What are your thoughts about it?"
          }]);
        }
      }
    }
  };

  // Handle sending messages
  const handleSendMessage = (userMessage: string) => {
    if (!userMessage.trim()) return;
    
    // Add user message to chat
    const newMessages = [...chatMessages, { role: "user", content: userMessage }];
    setChatMessages(newMessages);
    setIsLoading(true);
    
    // Demo responses - this will work without API
    setTimeout(() => {
      const aiResponses = [
        "That's an interesting observation! The author uses this passage to highlight the theme of isolation. How do you think this relates to the novel's broader themes?",
        "This is a pivotal moment in the narrative. Notice how Shelley uses language to convey the character's emotional state. What words or phrases stand out to you?",
        "The Romantic period was characterized by an interest in nature and extreme emotions. How does this passage reflect those themes?",
        "Consider how this letter foreshadows later events in the novel. What hints do you see about the character's fate?",
        "This reflects Shelley's interest in scientific progress and its potential consequences. How might this relate to the novel's subtitle, 'The Modern Prometheus'?"
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      setChatMessages([...newMessages, { 
        role: "assistant", 
        content: randomResponse
      }]);
      setIsLoading(false);
      
      // Clear input field
      if (chatInputRef.current) {
        chatInputRef.current.value = "";
        chatInputRef.current.style.height = 'auto';
      }
    }, 1000);
  };

  // Split content into paragraphs
  const paragraphs = content.split(/\n+/).filter(p => p.trim());

  return (
    <div className="reader-container">
      {/* Book Content */}
      <div className="book-content" ref={contentRef} onMouseUp={handleSelection}>
        <h2 className="chapter-title">
          {chapterId > 0 ? `Chapter ${chapterId}` : 
           (chapterId < 0 ? `Letter ${Math.abs(chapterId)}` : 'Introduction')}
        </h2>
        
        {paragraphs.map((paragraph, index) => {
          // Create a key for this paragraph
          const paragraphKey = `p-${index}`;
          
          // Check if any highlights match this paragraph
          let hasHighlight = false;
          let displayContent: string | ReactNode = paragraph;
          
          highlights.forEach(highlight => {
            if (paragraph.includes(highlight.text)) {
              hasHighlight = true;
              
              // Split the paragraph at the highlight
              const parts = paragraph.split(highlight.text);
              
              if (parts.length > 1) {
                // Create JSX with the highlight wrapped in a span
                displayContent = (
                  <>
                    {parts[0]}
                    <span 
                      className={`highlight ${highlight.active ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedText(highlight.text);
                        setHighlights(prev => prev.map(h => ({ 
                          ...h, 
                          active: h.text === highlight.text 
                        })));
                        setChatOpen(true);
                      }}
                    >
                      {highlight.text}
                    </span>
                    {parts.slice(1).join(highlight.text)}
                  </>
                );
              }
            }
          });
          
          return (
            <div key={paragraphKey} className="book-paragraph">
              {displayContent}
            </div>
          );
        })}
      </div>

      {/* Margin Chat */}
      <div className={`margin-container ${chatOpen ? 'open' : ''}`}>
        <div className="margin-header">
          <h5>Conversation</h5>
          <span 
            className="margin-close" 
            onClick={() => {
              setChatOpen(false);
              setHighlights(prev => prev.map(h => ({ ...h, active: false })));
            }}
          >
            <i className="fas fa-times"></i>
          </span>
        </div>
        
        <div className="margin-content">
          {selectedText && (
            <div className="passage-preview">
              "{selectedText}"
            </div>
          )}
          
          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${msg.role === "user" ? "user-message" : "ai-message"}`}
                >
                  {msg.content}
                </div>
              ))}
              
              {isLoading && (
                <div className="chat-message ai-message">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef}></div>
            </div>
            
            <div className="chat-input-container">
              <textarea
                ref={chatInputRef}
                className="chat-input"
                placeholder="Type your message..."
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const message = e.currentTarget.value;
                    handleSendMessage(message);
                  }
                }}
                onChange={(e) => {
                  // Auto-expand the textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
              <button
                className="chat-send"
                onClick={() => {
                  if (chatInputRef.current) {
                    handleSendMessage(chatInputRef.current.value);
                  }
                }}
                disabled={isLoading}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="reader-nav">
        <div className="page-controls">
          <Link
            href={`/chapters/${chapterId - 1}`}
            className={`btn btn-sm btn-outline-secondary ${chapterId <= -4 ? 'disabled' : ''}`}
          >
            <i className="fas fa-arrow-left"></i> Previous
          </Link>
          
          <select
            className="chapter-selector mx-2"
            value={chapterId}
            onChange={(e) => {
              window.location.href = `/chapters/${e.target.value}`;
            }}
          >
            <optgroup label="Letters">
              <option value="-4">Letter 4</option>
              <option value="-3">Letter 3</option>
              <option value="-2">Letter 2</option>
              <option value="-1">Letter 1</option>
            </optgroup>
            <optgroup label="Chapters">
              {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  Chapter {num}
                </option>
              ))}
            </optgroup>
          </select>
          
          <Link
            href={`/chapters/${chapterId + 1}`}
            className={`btn btn-sm btn-outline-primary ${chapterId >= 24 ? 'disabled' : ''}`}
          >
            Next <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
} 
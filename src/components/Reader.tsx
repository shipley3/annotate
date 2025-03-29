"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { romanize } from "@/utils/romanize";

interface ReaderProps {
  chapterId: number;
  content: string;
}

export default function Reader({ chapterId, content }: ReaderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  // Handle text selection and highlighting
  const handleSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 10) { // Minimum length for a highlight
      setSelectedText(text);
      setHighlights(prev => {
        // Check if this highlight already exists
        const exists = prev.some(h => h.text === text);
        if (!exists) {
          return [...prev, { text, active: true }];
        }
        // Otherwise just activate it
        return prev.map(h => ({ ...h, active: h.text === text }));
      });
      setChatOpen(true);
      
      // For testing, we'll add an initial AI message
      if (chatMessages.length === 0) {
        setChatMessages([{
          role: "assistant",
          content: "I noticed you highlighted this passage. What are your thoughts about it?"
        }]);
      }
    }
  };

  // Handle highlight click
  const handleHighlightClick = (text: string) => {
    setSelectedText(text);
    setHighlights(prev => prev.map(h => ({ ...h, active: h.text === text })));
    setChatOpen(true);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    if (!session?.user) {
      alert('Please sign in to continue the conversation');
      return;
    }

    setIsLoading(true);
    const newMessages = [...chatMessages, { role: "user", content: message }];
    setChatMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          passage: selectedText,
          chapterId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();
      setChatMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setChatMessages([...newMessages, { 
        role: "assistant", 
        content: "I apologize, but I encountered an error processing your message. Please try again." 
      }]);
    } finally {
      if (chatInputRef.current) {
        chatInputRef.current.value = "";
        chatInputRef.current.style.height = 'auto';
      }
      setIsLoading(false);
    }
  };

  // Split content into paragraphs and render them
  const paragraphs = content.split(/\n+/).filter(p => p.trim());

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="reader-topbar">
        <div className="book-title">Frankenstein</div>
        <div className="user-menu">
          <div className="user-info">{session?.user?.name || "Guest"}</div>
          {session ? (
            <Link href="/api/auth/signout" className="btn btn-sm btn-outline-secondary">
              Sign Out
            </Link>
          ) : (
            <Link href="/api/auth/signin" className="btn btn-sm btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Main Reader Container */}
      <div className="reader-container">
        {/* Book Content */}
        <div className="book-content" ref={contentRef} onMouseUp={handleSelection}>
          <h2 className="chapter-title">
            {chapterId < 0 ? `Letter ${Math.abs(chapterId)}` : `Chapter ${romanize(chapterId)}`}
          </h2>
          
          {paragraphs.map((paragraph, index) => {
            let content: ReactNode = paragraph;
            
            // Apply highlights to the paragraph
            highlights.forEach(highlight => {
              if (paragraph.includes(highlight.text)) {
                const parts = paragraph.split(highlight.text);
                if (parts.length > 1) {
                  content = parts.map((part, i) => 
                    i === 0 ? part : (
                      <>
                        <span 
                          key={`highlight-${i}`}
                          className={`highlight ${highlight.active ? 'active' : ''}`}
                          onClick={() => handleHighlightClick(highlight.text)}
                        >
                          {highlight.text}
                        </span>
                        {part}
                      </>
                    )
                  );
                }
              }
            });
            
            return (
              <div key={index} className="book-paragraph">
                {content}
              </div>
            );
          })}
        </div>

        {/* Margin Chat */}
        <div className={`margin-container ${chatOpen ? 'open' : ''}`}>
          <div className="margin-header">
            <h5>Discussion</h5>
            <button 
              className="margin-close"
              onClick={() => {
                setChatOpen(false);
                setHighlights(prev => prev.map(h => ({ ...h, active: false })));
              }}
              aria-label="Close discussion"
            >
              ×
            </button>
          </div>
          
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
                <div className="ai-message chat-message">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input-container">
              <textarea
                ref={chatInputRef}
                className="chat-input"
                placeholder="Ask a question about this passage..."
                rows={1}
                onChange={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e.currentTarget.value);
                  }
                }}
                disabled={isLoading}
              />
              <button
                className="chat-send"
                onClick={() => {
                  if (chatInputRef.current) {
                    handleSendMessage(chatInputRef.current.value);
                  }
                }}
                disabled={isLoading}
                aria-label="Send message"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="reader-nav">
        <div className="page-controls">
          <Link
            href={`/chapters/${chapterId - 1}`}
            className={`btn btn-sm btn-outline-secondary ${chapterId <= -4 ? 'disabled' : ''}`}
          >
            <i className="fas fa-arrow-left"></i> Previous
          </Link>
          
          <select
            className="chapter-selector form-select"
            value={chapterId}
            onChange={(e) => router.push(`/chapters/${e.target.value}`)}
          >
            {/* Letters */}
            <optgroup label="Letters">
              {Array.from({ length: 4 }, (_, i) => -(i + 1)).map((num) => (
                <option key={num} value={num}>
                  Letter {Math.abs(num)}
                </option>
              ))}
            </optgroup>
            {/* Chapters */}
            <optgroup label="Chapters">
              {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  Chapter {romanize(num)}
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
    </>
  );
} 
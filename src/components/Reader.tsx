"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { romanize } from "@/utils/romanize";

interface ReaderProps {
  chapterId: number;
  content: string;
  chapterTitle: string;
  onChapterChange: (chapterId: number) => void;
}

export default function Reader({ chapterId, content, chapterTitle, onChapterChange }: ReaderProps) {
  const { data: session } = useSession();
  const [selectedText, setSelectedText] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlights, setHighlights] = useState<Array<{ text: string; active: boolean }>>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Handle text selection and highlighting
  const handleSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 10) { // Minimum length for a highlight
      if (window.confirm('Open AI chat for this highlight?')) {
        setSelectedText(text);
        setHighlights(prev => [...prev, { text, active: true }]);
        setChatOpen(true);
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
      }
    }
  };

  // Handle highlight click
  const handleHighlightClick = (text: string) => {
    setSelectedText(text);
    setHighlights(prev => prev.map(h => ({ ...h, active: h.text === text })));
    setChatOpen(true);
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!session?.user) {
      console.error('No user session found');
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
      setIsLoading(false);
    }
  };

  // Handle chat input expansion
  const handleChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Split content into paragraphs and render them with highlights
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  // Function to render text with highlights
  const renderTextWithHighlights = (text: string) => {
    let result = text;
    highlights.forEach(highlight => {
      const regex = new RegExp(highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, `<span class="highlight ${highlight.active ? 'active' : ''}" onclick="handleHighlightClick('${highlight.text}')">$&</span>`);
    });
    return result;
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="reader-topbar">
        <div className="book-title">Frankenstein</div>
        <div className="user-menu">
          <div className="user-info">{session?.user?.name}</div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => signOut()}>
            Log out
          </button>
        </div>
      </div>

      {/* Main Reader Container */}
      <div className="reader-container">
        {/* Book Content */}
        <div className="book-content">
          <h2 className="chapter-title">Chapter {romanize(chapterId)}</h2>
          <div 
            ref={contentRef} 
            onMouseUp={handleSelection}
            dangerouslySetInnerHTML={{ __html: paragraphs.map(p => renderTextWithHighlights(p)).join('<br/><br/>') }}
          />
        </div>

        {/* Margin Chat */}
        <div className={`margin-container ${chatOpen ? 'open' : ''}`}>
          <div className="margin-header">
            <h5>Conversation</h5>
            <span className="margin-close" onClick={() => {
              setChatOpen(false);
              setHighlights(prev => prev.map(h => ({ ...h, active: false })));
            }}>
              <i className="fas fa-times"></i>
            </span>
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
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="chat-input-container">
              <textarea
                ref={chatInputRef}
                className="chat-input"
                placeholder="Type your message..."
                rows={1}
                onChange={handleChatInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e.currentTarget.value);
                    e.currentTarget.value = "";
                    e.currentTarget.style.height = 'auto';
                  }
                }}
              />
              <button
                className="chat-send"
                onClick={(e) => {
                  const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                  handleSendMessage(textarea.value);
                  textarea.value = "";
                  textarea.style.height = 'auto';
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
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onChapterChange(chapterId - 1)}
            disabled={chapterId <= 1}
          >
            <i className="fas fa-arrow-left"></i> Previous
          </button>
          
          <select
            className="chapter-selector"
            value={chapterId}
            onChange={(e) => onChapterChange(parseInt(e.target.value))}
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                Chapter {romanize(num)}
              </option>
            ))}
          </select>
          
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onChapterChange(chapterId + 1)}
            disabled={chapterId >= 24}
          >
            Next <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </>
  );
} 
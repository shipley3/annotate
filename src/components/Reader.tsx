import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ReaderProps {
  chapterId: number;
  content: string;
}

export default function Reader({ chapterId, content }: ReaderProps) {
  const { data: session } = useSession();
  const [selectedText, setSelectedText] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text) {
      setSelectedText(text);
      setChatOpen(true);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!session?.user) return;

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

      const data = await response.json();
      setChatMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-8 overflow-y-auto">
        <div
          ref={contentRef}
          className="prose prose-lg max-w-none"
          onMouseUp={handleSelection}
        >
          {content}
        </div>
      </div>
      
      {chatOpen && (
        <div className="w-96 border-l border-gray-200 p-4 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`mb-4 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-2 border rounded"
              placeholder="Ask a question..."
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => setChatOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
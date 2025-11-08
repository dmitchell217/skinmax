'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';

interface ChatDrawerProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatDrawer({ slug, isOpen, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'normal' | 'looksmaxx'>('normal');
  const [sessionId] = useState(() => {
    // Generate session ID once when component mounts
    if (typeof window !== 'undefined') {
      return crypto.randomUUID();
    }
    return '';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          message: userMessage,
          history: messages, // Send conversation history
          mode, // Send current mode
          sessionId, // Send session ID for rate limiting
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle rate limit errors gracefully
        if (response.status === 429) {
          const retryAfter = error.retryAfter || 3600;
          const minutes = Math.ceil(retryAfter / 60);
          throw new Error(
            `Rate limit reached. You've sent too many messages. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`
          );
        }
        
        throw new Error(error.message || 'Failed to get response');
      }

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 right-0 left-0 md:left-auto md:w-96 h-[80vh] md:h-[600px] bg-white border-t md:border-l border-zinc-200 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">
                {mode === 'looksmaxx' ? 'looksMAXX Mode' : 'Ask About Your Routine'}
              </h2>
              {mode === 'looksmaxx' && (
                <Sparkles className="h-4 w-4 text-pink-500" />
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {mode === 'looksmaxx' 
                ? 'Your unhinged friend helping you get ready' 
                : 'Get personalized skincare guidance'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <button
              onClick={() => {
                setMode(mode === 'normal' ? 'looksmaxx' : 'normal');
                setMessages([]); // Clear messages when switching modes
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                mode === 'looksmaxx'
                  ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
              title={mode === 'normal' ? 'Switch to looksMAXX mode' : 'Switch to normal mode'}
            >
              {mode === 'looksmaxx' ? 'looksMAXX' : 'Normal'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5 text-zinc-600" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-zinc-500 text-sm mt-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
              {mode === 'looksmaxx' ? (
                <>
                  <p className="font-medium">Ready to look absolutely irresistible? 🔥</p>
                  <p className="mt-2 text-xs">Ask me anything - I'm here to hype you up for your night!</p>
                </>
              ) : (
                <>
                  <p>Ask me anything about your skincare routine!</p>
                  <p className="mt-2 text-xs">Examples: "Can I use retinol with vitamin C?" or "What order should I apply these?"</p>
                </>
              )}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-100 rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-200">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={mode === 'looksmaxx' ? "Tell me what you need..." : "Ask about your routine..."}
              className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {mode === 'looksmaxx' 
              ? '18+ • For entertainment purposes only • Not medical advice'
              : 'This is educational guidance only, not medical advice.'}
          </p>
        </div>
      </div>
    </>
  );
}


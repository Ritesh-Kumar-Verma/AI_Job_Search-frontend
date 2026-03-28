import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../services/api';

function ChatBot({ onFiltersSuggested, onJobsMatched, currentFilters }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hi! I\'m your AI job hunting assistant powered by LangChain & LangGraph. I can help you:\n\n🔍 **Search jobs**: "Show me React developer jobs"\n🎯 **Match resume**: "How well do I match these jobs?"\n🔧 **Control filters**: "Show only remote positions"\n❓ **Help**: Ask me anything about the app!\n\n💡 Try: "Show me remote Python jobs with high match scores"',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFilterAction, setLastFilterAction] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format message content with markdown-like styling
  const formatMessage = (content) => {
    if (!content) return '';

    // Split by lines and process
    return content.split('\n').map((line, i) => {
      // Bold text between **
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          {i < content.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call AI API
      const res = await aiAPI.chat(
        messages.map(m => ({ role: m.role, content: m.content })).concat(userMessage)
      );

      const assistantMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: res.data.message,
        intent: res.data.intent,
        matchScores: res.data.matchScores,
        filters: res.data.filters,
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (res.data.filters && onFiltersSuggested) {
        onFiltersSuggested(res.data.filters);
        setLastFilterAction(res.data.filters);

        navigate('/jobs');

        setTimeout(() => setLastFilterAction(null), 3000);
      }

      if (res.data.matchScores && res.data.matchScores.length > 0 && onJobsMatched) {
        onJobsMatched(res.data.matchScores);
      }
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: '🎯 Match Resume', action: 'How well do I match the available jobs?' },
    { label: '🌍 Remote Jobs', action: 'Show only remote jobs' },
    { label: '⭐ High Match', action: 'Filter by high match scores only' },
    { label: '🔄 Clear Filters', action: 'Clear all filters' },
  ];

  const handleQuickAction = (action) => {
    setInput(action);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
          zIndex: 999,
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(1.1)' : 'scale(1)',
        }}
        title="Chat with AI"
      >
        🤖
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '5rem',
            right: '2rem',
            width: '400px',
            maxWidth: '90vw',
            height: '500px',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '1rem',
              borderTopLeftRadius: '0.75rem',
              borderTopRightRadius: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0 }}>🤖 Job Hunt Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {lastFilterAction && (
            <div style={{
              backgroundColor: '#d1fae5',
              color: '#065f46',
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ✅ Filters updated! Check the Job Feed.
            </div>
          )}

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: msg.role === 'user' ? '#2563eb' : '#f3f4f6',
                    color: msg.role === 'user' ? 'white' : '#333',
                    wordWrap: 'break-word',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {formatMessage(msg.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '0.75rem', color: '#999', fontSize: '0.875rem' }}>
                  🤖 AI is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderTop: '1px solid #e5e7eb',
            flexWrap: 'wrap'
          }}>
            {quickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(qa.action)}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  backgroundColor: '#e5e7eb',
                  border: 'none',
                  borderRadius: '1rem',
                  cursor: 'pointer',
                }}
              >
                {qa.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSend}
            style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '1rem',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatBot;

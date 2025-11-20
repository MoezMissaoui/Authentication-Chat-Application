import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LogOut, Send, User, MessageSquare } from 'lucide-react';

function Chat() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        text: newMessage,
        username: user.username,
        timestamp: new Date().toISOString()
      };
      setMessages([...messages, message]);
      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const groupMessagesByDate = (messages) => {
    const grouped = [];
    let currentDate = null;

    messages.forEach((message, index) => {
      const messageDate = formatDate(message.timestamp);
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        grouped.push({ type: 'date', date: messageDate, id: `date-${index}` });
      }
      grouped.push(message);
    });

    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Chat</h1>
              <p className="text-xs text-muted-foreground">{user?.username}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 py-6">
          {groupedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
              <p className="text-muted-foreground max-w-md">
                Send a message to begin chatting. Your messages will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedMessages.map((item, index) => {
                if (item.type === 'date') {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-center py-4"
                    >
                      <div className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                        {item.date}
                      </div>
                    </div>
                  );
                }

                const isUser = item.username === user.username;
                const prevItem = index > 0 ? groupedMessages[index - 1] : null;
                const showAvatar = !prevItem || 
                  prevItem.type === 'date' || 
                  prevItem.username !== item.username ||
                  (new Date(item.timestamp).getTime() - new Date(prevItem.timestamp).getTime()) > 300000; // 5 minutes

                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${
                      !showAvatar ? (isUser ? 'ml-11' : 'mr-11') : ''
                    }`}
                  >
                    {showAvatar && (
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isUser ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                      {showAvatar && (
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-sm font-medium">{item.username}</span>
                          <span className="text-xs text-muted-foreground">{formatTime(item.timestamp)}</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 max-w-[85%] ${
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {item.text}
                        </p>
                      </div>
                      {!showAvatar && (
                        <span className="text-xs text-muted-foreground mt-1 px-1">
                          {formatTime(item.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[52px]"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-[52px] w-[52px] shrink-0"
              disabled={!newMessage.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;

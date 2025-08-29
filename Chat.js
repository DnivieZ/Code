
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Conversation, Message, User } from "@/entities/all";
import { useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search, MessageSquare, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import FriendsLeaderboard from "../components/chat/FriendsLeaderboard";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        const convs = await Conversation.filter({ participants: currentUser.email }, "-last_message_date");
        setConversations(convs);

        const params = new URLSearchParams(location.search);
        const convId = params.get("convId");
        if (convId) {
          const activeConv = convs.find(c => c.id === convId);
          if (activeConv) {
            setActiveConversation(activeConv);
          }
        }
      } catch (e) {
        // not logged in
      }
    };
    init();
  }, [location.search]);

  const loadMessages = useCallback(async () => {
    if (activeConversation) {
      const msgs = await Message.filter({ conversation_id: activeConversation.id }, "created_date");
      setMessages(msgs);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [activeConversation, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    setIsSending(true);
    const tempId = Date.now().toString();
    const content = newMessage;
    setMessages(prev => [...prev, {id: tempId, content, created_by: user.email, created_date: new Date().toISOString()}]);
    setNewMessage("");

    try {
      await Message.create({ conversation_id: activeConversation.id, content });
      await Conversation.update(activeConversation.id, {
        last_message: content,
        last_message_date: new Date().toISOString()
      });
      await loadMessages();
    } catch (e) {
      console.error("Failed to send message", e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = (conv) => {
    return conv.participant_details.find(p => p.email !== user.email);
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sign in to Chat</h2>
        <p className="text-gray-400 mb-6">Connect with other creators on ViralStream</p>
        <Button
          onClick={() => User.login()}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          Sign In with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Conversations List (Sidebar) */}
      <div className={`w-full md:w-1/3 border-r border-gray-800 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">Chats</h2>
        </div>
        
        {/* Friends Leaderboard */}
        <FriendsLeaderboard user={user} />
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start chatting with creators from the Feed!</p>
            </div>
          ) : (
            conversations.map(conv => {
              const otherUser = getOtherParticipant(conv);
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`p-4 flex items-center gap-3 cursor-pointer border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                    activeConversation?.id === conv.id ? 'bg-purple-900/50' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-lg font-bold">
                    {otherUser?.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold truncate">{otherUser?.full_name}</h3>
                    <p className="text-sm text-gray-400 truncate">{conv.last_message || "No messages yet"}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {conv.last_message_date && format(new Date(conv.last_message_date), 'p')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Chat Window */}
      <div className={`w-full md:w-2/3 flex flex-col ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
        {activeConversation ? (
          <>
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConversation(null)}>
                <ArrowLeft className="w-5 h-5"/>
              </Button>
              <h2 className="text-lg font-semibold">{getOtherParticipant(activeConversation)?.full_name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.created_by === user.email ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.created_by === user.email ? 'bg-purple-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-800 flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                className="bg-gray-800 border-gray-700"
              />
              <Button onClick={handleSendMessage} disabled={isSending} className="bg-purple-600 hover:bg-purple-700">
                <Send className="w-4 h-4"/>
              </Button>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <MessageSquare className="w-20 h-20 text-gray-700 mx-auto" />
              <p className="text-gray-500 mt-2">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

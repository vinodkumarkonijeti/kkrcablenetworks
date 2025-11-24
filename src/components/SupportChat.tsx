import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Loader } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  customerId: string;
  sender: 'customer' | 'support';
  message: string;
  timestamp: Date;
  resolved?: boolean;
}

interface SupportChatProps {
  customerId: string;
}

export const SupportChat: React.FC<SupportChatProps> = ({ customerId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const messagesRef = collection(db, 'support_tickets');
        const q = query(
          messagesRef,
          where('customerId', '==', customerId),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        const messageList: Message[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          messageList.push({
            id: doc.id,
            customerId: data.customerId,
            sender: data.sender,
            message: data.message,
            timestamp: data.timestamp?.toDate?.() || new Date(),
            resolved: data.resolved
          });
        });
        setMessages(messageList.reverse());
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchMessages();
    }
  }, [customerId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      // Simulate sending message to Firestore
      const message: Message = {
        id: `msg_${Date.now()}`,
        customerId,
        sender: 'customer',
        message: newMessage,
        timestamp: new Date(),
        resolved: false
      };

      setMessages([...messages, message]);
      setNewMessage('');

      // In production, this would save to Firestore
      // await addDoc(collection(db, 'support_tickets'), message);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col h-96"
    >
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Support Chat
      </h3>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded">
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No messages yet. Send a message to start!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender === 'customer'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs mt-1 opacity-70">{format(new Date(msg.timestamp), 'HH:mm')}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={handleSendMessage}
          disabled={sending || !newMessage.trim()}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
        >
          {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </motion.div>
  );
};

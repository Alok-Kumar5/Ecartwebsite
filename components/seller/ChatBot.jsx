import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you with your shopping today?", sender: 'bot' }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Add user message to chat
    setMessages(prev => [...prev, { text: message, sender: 'user' }]);
    
    // Store original message and clear input
    const userMessage = message;
    setMessage('');
    
    try {
      // Send message to Python chatbot
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      
      // Add bot response to chat
      setMessages(prev => [...prev, { 
        text: data.response, 
        sender: 'bot' 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting to the server.", 
        sender: 'bot' 
      }]);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all"
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-80 sm:w-96 flex flex-col h-96 border border-gray-200">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">Customer Support</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  msg.sender === 'user' 
                    ? 'bg-blue-100 ml-6 text-right' 
                    : 'bg-gray-100 mr-6'
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
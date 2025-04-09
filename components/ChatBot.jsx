import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, ShoppingBag, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ChatBot() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { 
            text: "Welcome to QuickCart! I'm your virtual shopping assistant. How may I assist you today?\n\nI can help you with:\n1. Finding Products\n2. Registration Process\n3. Order Tracking\n4. Shipping Information\n5. Returns & Refunds\n6. Payment Methods", 
            sender: 'bot',
            type: 'text'
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleProductClick = (productUrl) => {
        router.push(productUrl);
        setIsOpen(false);
    };

    const renderMessage = (msg, index) => {
        if (msg.type === 'products') {
            return (
                <div className="grid grid-cols-2 gap-2">
                    {msg.products.map((product) => (
                        <div 
                            key={product.id}
                            className="border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleProductClick(product.url)}
                        >
                            <div className="relative h-20 w-full mb-2">
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover rounded"
                                />
                            </div>
                            <p className="text-sm font-medium">{product.name}</p>
                            <p className="text-sm text-blue-600">${product.price}</p>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div 
                className={`p-3 rounded-lg ${
                    msg.sender === 'user' 
                        ? 'bg-blue-100 ml-6 text-right' 
                        : 'bg-gray-100 mr-6'
                }`}
            >
                {msg.text.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                ))}
            </div>
        );
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        
        // Add user message
        setMessages(prev => [...prev, { text: message, sender: 'user', type: 'text' }]);
        
        const userMessage = message;
        setMessage('');
        setIsTyping(true);
        
        try {
            // Check if it's a product search query
            if (userMessage.toLowerCase().includes('find') || 
                userMessage.toLowerCase().includes('search') || 
                userMessage.toLowerCase().includes('looking for')) {
                
                // Call product search endpoint
                const searchResponse = await fetch('http://localhost:5000/chat/search_products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: userMessage }),
                });

                const searchData = await searchResponse.json();
                
                if (searchData.products.length > 0) {
                    setMessages(prev => [...prev, {
                        products: searchData.products,
                        sender: 'bot',
                        type: 'products'
                    }]);
                }
            }

            // Get chatbot response
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();
            
            setMessages(prev => [...prev, { 
                text: data.response, 
                sender: 'bot',
                type: 'text'
            }]);
        } catch (error) {
            handleError(error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleError = (error) => {
        setMessages(prev => [...prev, { 
            text: "Sorry, I'm having trouble connecting to the server. Please try again later.", 
            sender: 'bot',
            type: 'text'
        }]);
        console.error('ChatBot Error:', error);
    };

    const quickResponses = [
        { text: "How to register?", icon: <UserPlus size={16} /> },
        { text: "Track my order", icon: <Package size={16} /> },
        { text: "Shipping info", icon: <Truck size={16} /> },
        { text: "Return policy", icon: <RefreshCw size={16} /> },
    ];

    const searchProducts = async (query) => {
        try {
            const response = await fetch('http://localhost:5000/chat/search_products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });
            
            const data = await response.json();
            return data.products;
        } catch (error) {
            console.error('Error searching products:', error);
            return [];
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
                <div className="bg-white rounded-lg shadow-xl w-80 sm:w-96 flex flex-col h-[32rem] border border-gray-200">
                    <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <ShoppingBag size={20} />
                            <h3 className="font-medium">QuickCart Assistant</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg, index) => (
                            <div key={index}>
                                {renderMessage(msg, index)}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="bg-gray-100 mr-6 p-3 rounded-lg">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {quickResponses.map((response, index) => (
                                <button
                                    key={index}
                                    onClick={() => setMessage(response.text)}
                                    className="flex items-center space-x-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1"
                                >
                                    {response.icon}
                                    <span>{response.text}</span>
                                </button>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex">
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
                </div>
            )}
        </div>
    );
} 
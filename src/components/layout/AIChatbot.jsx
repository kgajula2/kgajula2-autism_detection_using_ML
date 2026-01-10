import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * AI Chatbot with predefined FAQ answers
 * Provides instant help for common questions about the app
 */

// Predefined Q&A database
const FAQ_DATABASE = [
    {
        keywords: ['what', 'neurostep', 'app', 'about'],
        question: 'What is NeuroStep?',
        answer: 'NeuroStep is a fun game app that helps track your child\'s development through interactive games! 🎮 It uses AI to analyze gameplay patterns and provide helpful insights for parents.'
    },
    {
        keywords: ['how', 'play', 'game', 'start'],
        question: 'How do I play the games?',
        answer: 'It\'s easy! 🎯\n\n1. Tap the big PLAY button\n2. Choose a game with colorful cards\n3. Follow the animated tutorial\n4. Have fun!\n\nEach game has simple visual instructions - no reading needed!'
    },
    {
        keywords: ['age', 'old', 'child', 'children', 'kids'],
        question: 'What age is this for?',
        answer: 'NeuroStep is designed for children ages 3-8 years old! 👶 The games are simple enough for toddlers but engaging for older kids too.'
    },
    {
        keywords: ['safe', 'privacy', 'data', 'secure'],
        question: 'Is my data safe?',
        answer: 'Yes! 🔒 We take privacy seriously:\n\n• Data is encrypted\n• We never share personal info\n• You can delete data anytime\n• See our Privacy Policy for details'
    },
    {
        keywords: ['autism', 'diagnosis', 'screen', 'risk', 'score'],
        question: 'Can this diagnose autism?',
        answer: '⚠️ Important: NeuroStep is NOT a medical diagnostic tool.\n\nOur games track behavioral patterns and provide insights, but ONLY a healthcare professional can make a diagnosis. Please consult a doctor for any concerns.'
    },
    {
        keywords: ['dashboard', 'results', 'report', 'analysis'],
        question: 'How do I see results?',
        answer: 'After playing games, go to the Parent Dashboard! 📊\n\nYou\'ll see:\n• Game scores\n• AI insights\n• Progress over time\n• Helpful recommendations'
    },
    {
        keywords: ['account', 'login', 'sign', 'register'],
        question: 'How do I create an account?',
        answer: 'Creating an account is easy! 📝\n\n1. Tap "Get Started" on home page\n2. Sign in with Google (fast & secure!)\n3. Complete short onboarding\n4. Start playing!\n\nYou can also use email registration.'
    },
    {
        keywords: ['work', 'offline', 'internet', 'wifi'],
        question: 'Does it work offline?',
        answer: 'Partially! 📶\n\n• Games can be played offline\n• Data syncs when back online\n• Some features need internet\n• Dashboard needs connection'
    },
    {
        keywords: ['cost', 'free', 'price', 'pay', 'money'],
        question: 'Is NeuroStep free?',
        answer: '✅ Yes! NeuroStep is completely FREE!\n\nAll games and features are available at no cost. We believe every child deserves access to developmental screening tools.'
    },
    {
        keywords: ['help', 'support', 'contact', 'problem', 'issue'],
        question: 'How do I get help?',
        answer: 'We\'re here for you! 💬\n\n• Email: support@neurostep.app\n• Visit our Help page\n• Check FAQ section\n• Use feedback button\n\nWe typically respond within 24 hours!'
    },
    {
        keywords: ['toddler', 'mode', 'simple', 'easy'],
        question: 'What is Toddler Mode?',
        answer: '👶 Toddler Mode makes games easier for 3-5 year olds:\n\n• Bigger buttons\n• Simpler steps\n• Visual-only instructions\n• No reading needed\n\nEnable it in Settings!'
    },
    {
        keywords: ['camera', 'face', 'emotion', 'mirror'],
        question: 'Why does Emotion Mirror need camera?',
        answer: '📷 The camera helps detect facial expressions!\n\nIt\'s used to:\n• See your child\'s smile\n• Track emotions\n• Make the game interactive\n\nCamera data stays on your device - never uploaded!'
    },
];

// Find best matching answer
function findAnswer(query) {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);

    let bestMatch = null;
    let bestScore = 0;

    for (const faq of FAQ_DATABASE) {
        const score = faq.keywords.reduce((acc, keyword) => {
            if (lowerQuery.includes(keyword)) return acc + 2;
            if (words.some(w => w.includes(keyword) || keyword.includes(w))) return acc + 1;
            return acc;
        }, 0);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = faq;
        }
    }

    if (bestScore >= 2) {
        return bestMatch.answer;
    }

    // Default response
    return "I'm not sure about that! 🤔 Try asking about:\n\n• How to play games\n• What is NeuroStep\n• Privacy & safety\n• Creating an account\n• Viewing results\n\nOr tap a suggested question below!";
}

// Suggested quick questions
const QUICK_QUESTIONS = [
    "What is NeuroStep?",
    "How do I play?",
    "Is my data safe?",
    "Is this free?",
    "What age is this for?"
];

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: 'Hi there! 👋 I\'m NeuroBot! How can I help you today?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (text = input) => {
        if (!text.trim()) return;

        // Add user message
        setMessages(prev => [...prev, {
            type: 'user',
            text: text.trim(),
            timestamp: new Date()
        }]);

        setInput('');
        setIsTyping(true);

        // Simulate AI thinking
        setTimeout(() => {
            const answer = findAnswer(text);
            setMessages(prev => [...prev, {
                type: 'bot',
                text: answer,
                timestamp: new Date()
            }]);
            setIsTyping(false);
        }, 800 + Math.random() * 500);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-2xl flex items-center justify-center text-white hover:shadow-purple-500/50 transition-shadow"
                        aria-label="Open chat assistant"
                    >
                        <MessageCircle size={28} />
                        {/* Pulse indicator */}
                        <span className="absolute top-0 right-0 w-4 h-4 bg-green-400 rounded-full animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold">NeuroBot</h3>
                                    <p className="text-xs text-white/80">AI Assistant</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                aria-label="Close chat"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] p-3 rounded-2xl ${msg.type === 'user'
                                            ? 'bg-purple-500 text-white rounded-br-sm'
                                            : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-bl-sm shadow-sm'
                                        }`}>
                                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-bl-sm shadow-sm">
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(i => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 bg-gray-400 rounded-full"
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Questions */}
                        <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {QUICK_QUESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(q)}
                                        className="flex-shrink-0 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-full text-xs hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask me anything..."
                                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim()}
                                    className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
                                    aria-label="Send message"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bug, Lightbulb, ThumbsUp } from 'lucide-react';
import { Button } from '../ui/Button';

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const feedbackTypes = [
        { id: 'bug', icon: Bug, label: 'Report Bug', color: 'text-red-500' },
        { id: 'idea', icon: Lightbulb, label: 'Suggestion', color: 'text-yellow-500' },
        { id: 'praise', icon: ThumbsUp, label: 'Praise', color: 'text-green-500' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsSubmitted(false);
            setType('');
            setMessage('');
        }, 2000);
    };

    return (
        <>
            { }
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white z-50 hover:shadow-xl transition-shadow"
            >
                <MessageCircle size={24} />
            </motion.button>

            { }
            <AnimatePresence>
                {isOpen && (
                    <>
                        { }
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />

                        { }
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="fixed bottom-24 right-6 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            { }
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <MessageCircle size={20} />
                                    Send Feedback
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            { }
                            <div className="p-4">
                                {isSubmitted ? (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-center py-8"
                                    >
                                        <div className="text-5xl mb-4">🎉</div>
                                        <h4 className="font-bold text-slate-800 dark:text-white">Thank you!</h4>
                                        <p className="text-slate-500 text-sm">Your feedback helps us improve</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        { }
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                                What type of feedback?
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {feedbackTypes.map(ft => (
                                                    <button
                                                        key={ft.id}
                                                        type="button"
                                                        onClick={() => setType(ft.id)}
                                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${type === ft.id
                                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                                                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                                            }`}
                                                    >
                                                        <ft.icon size={20} className={ft.color} />
                                                        <span className="text-xs font-medium">{ft.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        { }
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                                Your message
                                            </label>
                                            <textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                rows={3}
                                                required
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm"
                                                placeholder="Tell us what's on your mind..."
                                            />
                                        </div>

                                        <Button type="submit" disabled={!type || !message} className="w-full gap-2">
                                            <Send size={16} />
                                            Send Feedback
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

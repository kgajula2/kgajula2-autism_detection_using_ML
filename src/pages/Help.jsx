import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle,
    Gamepad2, Brain, Shield, User, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Footer from '../components/layout/Footer';

const faqs = [
    {
        category: 'Getting Started',
        icon: Gamepad2,
        questions: [
            {
                q: 'What is NeuroStep?',
                a: 'NeuroStep is a game-based screening tool designed to help identify early developmental patterns in children ages 3-8. Through engaging games, we collect behavioral data that can provide insights for parents and healthcare providers.'
            },
            {
                q: 'How do I create an account?',
                a: 'Simply click "Get Started" on the landing page and sign in with your Google account. Your data is automatically saved and synced across devices.'
            },
            {
                q: 'Is NeuroStep free to use?',
                a: 'Yes! NeuroStep is completely free for all families. We believe early screening should be accessible to everyone.'
            },
        ]
    },
    {
        category: 'Games & Gameplay',
        icon: Gamepad2,
        questions: [
            {
                q: 'How many games are available?',
                a: 'We currently offer 4 games: Color Focus (bubble popping), Routine Sequencer (daily routine ordering), Emotion Mirror (facial expression matching), and Object ID (object identification).'
            },
            {
                q: 'How long does each game take?',
                a: 'Most games take 30-60 seconds to complete. We recommend playing at least one game per day for best results.'
            },
            {
                q: 'Can I pause during a game?',
                a: 'Currently, games run on a timer and cannot be paused. If interrupted, you can always start a new session.'
            },
        ]
    },
    {
        category: 'AI Analysis',
        icon: Brain,
        questions: [
            {
                q: 'How does the AI analysis work?',
                a: 'Our AI analyzes gameplay patterns including reaction times, accuracy, and behavioral indicators. The system uses machine learning trained on research data to identify potential developmental patterns.'
            },
            {
                q: 'What does the risk percentage mean?',
                a: 'The percentage indicates how closely the gameplay patterns match certain developmental characteristics. A lower percentage suggests typical patterns, while higher percentages may warrant discussion with a healthcare provider.'
            },
            {
                q: 'Is the AI diagnosis reliable?',
                a: 'NeuroStep is a SCREENING TOOL, not a diagnostic tool. Results should always be discussed with qualified healthcare professionals. Our AI has ~92% accuracy in research settings.'
            },
        ]
    },
    {
        category: 'Privacy & Data',
        icon: Shield,
        questions: [
            {
                q: 'Is my data safe?',
                a: 'Yes! We use Firebase with industry-standard encryption. Your data is never sold or shared with third parties. Only you can access your child\'s data.'
            },
            {
                q: 'Can I delete my data?',
                a: 'Yes, you can request complete data deletion at any time through the Profile settings or by contacting us at support@neurostep.com.'
            },
            {
                q: 'Do you comply with COPPA?',
                a: 'Yes, NeuroStep is designed with child privacy in mind and complies with COPPA (Children\'s Online Privacy Protection Act) regulations.'
            },
        ]
    },
];

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-slate-100 dark:border-slate-700 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 px-4 rounded-lg transition-colors"
            >
                <span className="font-medium text-slate-700 dark:text-white pr-4">{question}</span>
                {isOpen ? <ChevronUp className="text-slate-400 shrink-0" /> : <ChevronDown className="text-slate-400 shrink-0" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="px-4 pb-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function Help() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFaqs = faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
            faq => faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-900 dark:to-blue-900">
            { }
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 pb-24">
                <div className="max-w-4xl mx-auto text-center">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <h1 className="text-4xl font-black mb-2">Help & FAQ</h1>
                    <p className="text-blue-200">Find answers to common questions</p>
                </div>
            </div>

            { }
            <div className="max-w-4xl mx-auto px-6 -mt-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search for help..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 shadow-xl text-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:text-white"
                    />
                </div>
            </div>

            { }
            <div className="max-w-4xl mx-auto px-6 py-12">
                {filteredFaqs.map((category, idx) => (
                    <motion.div
                        key={category.category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                                <category.icon size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{category.category}</h2>
                        </div>
                        <Card className="shadow-lg overflow-hidden">
                            {category.questions.map((faq, i) => (
                                <FAQItem key={i} question={faq.q} answer={faq.a} />
                            ))}
                        </Card>
                    </motion.div>
                ))}

                {filteredFaqs.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">No results found</h3>
                        <p className="text-slate-500">Try searching with different keywords</p>
                    </div>
                )}

                { }
                <Card className="p-8 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl mt-12">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
                    <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
                    <p className="text-purple-100 mb-6">Our support team is here to assist you</p>
                    <Link to="/contact">
                        <Button variant="secondary" className="bg-white text-purple-600 hover:bg-purple-50">
                            <Mail className="mr-2" size={18} />
                            Contact Support
                        </Button>
                    </Link>
                </Card>
            </div>

            <Footer />
        </div>
    );
}

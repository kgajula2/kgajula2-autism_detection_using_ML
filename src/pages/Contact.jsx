import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send, MapPin, Phone, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Footer from '../components/layout/Footer';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

         
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-purple-100 dark:from-slate-900 dark:to-purple-900 flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                        className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle className="w-12 h-12 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Message Sent!</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-8">
                        Thank you for reaching out. We'll get back to you within 24-48 hours.
                    </p>
                    <Button onClick={() => { setIsSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}>
                        Send Another Message
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-purple-100 dark:from-slate-900 dark:to-purple-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 pb-24">
                <div className="max-w-4xl mx-auto text-center">
                    <Mail className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <h1 className="text-4xl font-black mb-2">Contact Us</h1>
                    <p className="text-purple-200">We'd love to hear from you</p>
                </div>
            </div>

            { }
            <div className="max-w-4xl mx-auto px-6 -mt-12 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    { }
                    <div className="lg:col-span-2">
                        <Card className="p-8 shadow-xl">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <MessageSquare className="text-purple-500" />
                                Send a Message
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                        Subject
                                    </label>
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="">Select a topic...</option>
                                        <option value="general">General Inquiry</option>
                                        <option value="support">Technical Support</option>
                                        <option value="feedback">Feedback & Suggestions</option>
                                        <option value="privacy">Privacy Concern</option>
                                        <option value="partnership">Partnership Opportunity</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                        placeholder="Tell us how we can help..."
                                    />
                                </div>

                                <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                                    {isSubmitting ? (
                                        <>Sending...</>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Card>
                    </div>

                    { }
                    <div className="space-y-6">
                        <Card className="p-6 shadow-xl">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Quick Contact</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="text-purple-500 mt-1" size={20} />
                                    <div>
                                        <div className="font-medium text-slate-700 dark:text-white">Email</div>
                                        <a href="mailto:support@neurostep.com" className="text-purple-600 text-sm">
                                            support@neurostep.com
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="text-purple-500 mt-1" size={20} />
                                    <div>
                                        <div className="font-medium text-slate-700 dark:text-white">Response Time</div>
                                        <div className="text-slate-500 text-sm">24-48 hours</div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            <h3 className="font-bold mb-4">💡 Quick Tip</h3>
                            <p className="text-purple-100 text-sm">
                                For the fastest response, please include your account email and
                                a detailed description of your inquiry.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

import { motion } from 'framer-motion';
import { Heart, Target, Users, Award, Lightbulb, Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import Footer from '../components/layout/Footer';

export default function About() {
    const values = [
        { icon: Heart, title: 'Family First', desc: 'Built with love for families navigating developmental journeys' },
        { icon: Shield, title: 'Privacy Focused', desc: 'Your data is yours. We never sell or share personal information' },
        { icon: Lightbulb, title: 'Research Driven', desc: 'Our ML models are trained on peer-reviewed research data' },
        { icon: Target, title: 'Accessible', desc: 'Free for all families, designed for children ages 3-8' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-purple-100 dark:from-slate-900 dark:to-purple-900">
            {/* Hero */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white py-20 px-6 text-center relative overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 max-w-3xl mx-auto"
                >
                    <h1 className="text-5xl font-black mb-4">About NeuroStep</h1>
                    <p className="text-xl text-purple-100 leading-relaxed">
                        Empowering families with AI-powered insights through play
                    </p>
                </motion.div>
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-10 left-10 text-9xl">🧠</div>
                    <div className="absolute bottom-10 right-10 text-9xl">🎮</div>
                </div>
            </div>

            {/* Mission */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-6">Our Mission</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                        Early identification of developmental differences can make a profound impact on a child's life.
                        NeuroStep was created to provide families with accessible, engaging, and scientifically-backed
                        screening tools — disguised as fun games that children love to play.
                    </p>
                </motion.div>

                {/* Values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {values.map((value, idx) => (
                        <motion.div
                            key={value.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className="p-6 h-full hover:shadow-xl transition-shadow">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mb-4">
                                    <value.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{value.title}</h3>
                                <p className="text-slate-600 dark:text-slate-300">{value.desc}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* How It Works */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-8 text-center">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { num: '1', title: 'Play Games', desc: 'Children play fun, engaging mini-games designed by child development experts', emoji: '🎮' },
                            { num: '2', title: 'AI Analyzes', desc: 'Our ML model analyzes behavioral patterns in real-time', emoji: '🧠' },
                            { num: '3', title: 'Get Insights', desc: 'Parents receive actionable insights and progress reports', emoji: '📊' },
                        ].map((step, idx) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                className="text-center"
                            >
                                <div className="text-6xl mb-4">{step.emoji}</div>
                                <div className="w-10 h-10 rounded-full bg-purple-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                                    {step.num}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{step.title}</h3>
                                <p className="text-slate-600 dark:text-slate-300">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Disclaimer */}
                <Card className="p-8 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
                    <h3 className="text-xl font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                        ⚠️ Important Disclaimer
                    </h3>
                    <p className="text-amber-700 dark:text-amber-200 leading-relaxed">
                        NeuroStep is a <strong>screening tool</strong>, not a diagnostic instrument. Our AI-powered analysis
                        provides insights based on behavioral patterns but cannot replace professional medical evaluation.
                        Always consult with qualified healthcare providers for diagnosis and treatment recommendations.
                        Results from NeuroStep should be used as one of many tools in understanding your child's development.
                    </p>
                </Card>
            </div>

            <Footer />
        </div>
    );
}

import { Link } from 'react-router-dom';
import { Heart, Mail, Shield, FileText, HelpCircle, Info } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 dark:bg-slate-950 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-12">
                { }
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    { }
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                            NeuroStep
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                            Empowering families with AI-powered insights through engaging play.
                            NeuroStep helps identify early developmental patterns in children ages 3-8.
                        </p>
                        <div className="flex items-center gap-2 mt-4 text-slate-500 text-sm">
                            <Heart size={14} className="text-pink-500" />
                            <span>Made with care for families</span>
                        </div>
                    </div>

                    { }
                    <div>
                        <h4 className="font-bold text-white mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/home" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    🎮 Games
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    📊 Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    👤 Profile
                                </Link>
                            </li>
                            <li>
                                <Link to="/help" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    <HelpCircle size={14} /> Help & FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    { }
                    <div>
                        <h4 className="font-bold text-white mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/about" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    <Info size={14} /> About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    <Shield size={14} /> Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    <FileText size={14} /> Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    <Mail size={14} /> Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                { }
                <div className="border-t border-slate-800 pt-6 mb-6">
                    <p className="text-slate-500 text-xs leading-relaxed">
                        <strong className="text-slate-400">⚠️ Medical Disclaimer:</strong> NeuroStep is a screening tool and does NOT provide medical diagnosis.
                        Results should be discussed with qualified healthcare professionals. This app is intended for informational
                        and educational purposes only.
                    </p>
                </div>

                { }
                <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        © {currentYear} NeuroStep. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-slate-600 text-xs">v1.0.0</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

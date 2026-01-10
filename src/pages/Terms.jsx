import { FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import Footer from '../components/layout/Footer';

export default function Terms() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-green-100 dark:from-slate-900 dark:to-green-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-8">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <FileText className="w-12 h-12" />
                    <div>
                        <h1 className="text-3xl font-black">Terms of Service</h1>
                        <p className="text-green-200">Last updated: January 2026</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Card className="p-8 shadow-xl prose prose-slate dark:prose-invert max-w-none">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using NeuroStep, you agree to be bound by these Terms of Service.
                        If you do not agree, please do not use our service.
                    </p>

                    <h2>2. Description of Service</h2>
                    <p>
                        NeuroStep provides game-based developmental screening tools for children ages 3-8.
                        Our service includes interactive games, AI-powered behavioral analysis, and
                        progress tracking dashboards for parents.
                    </p>

                    <h2>3. Medical Disclaimer</h2>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                        <p className="text-amber-800 dark:text-amber-200 font-medium">
                            ⚠️ <strong>IMPORTANT:</strong> NeuroStep is a SCREENING TOOL ONLY and does NOT provide
                            medical diagnosis. Our AI analysis is designed to identify patterns that may warrant
                            further evaluation by qualified healthcare professionals. Never use NeuroStep results
                            as a substitute for professional medical advice, diagnosis, or treatment.
                        </p>
                    </div>

                    <h2>4. User Accounts</h2>
                    <ul>
                        <li>You must be 18 years or older to create an account</li>
                        <li>You are responsible for maintaining account security</li>
                        <li>You may only create accounts for children under your legal guardianship</li>
                        <li>We reserve the right to suspend accounts that violate these terms</li>
                    </ul>

                    <h2>5. Acceptable Use</h2>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Use the service for any unlawful purpose</li>
                        <li>Attempt to reverse engineer our AI models</li>
                        <li>Share account credentials with others</li>
                        <li>Upload harmful or malicious content</li>
                        <li>Interfere with service operation</li>
                    </ul>

                    <h2>6. Intellectual Property</h2>
                    <p>
                        All content, games, AI models, and branding are the property of NeuroStep.
                        You may not reproduce, distribute, or create derivative works without permission.
                    </p>

                    <h2>7. Limitation of Liability</h2>
                    <p>
                        NeuroStep is provided "as is" without warranties. We are not liable for any damages
                        arising from use of our service, including but not limited to decisions made based
                        on AI analysis results.
                    </p>

                    <h2>8. Changes to Terms</h2>
                    <p>
                        We may update these terms periodically. Continued use after changes constitutes
                        acceptance of the new terms.
                    </p>

                    <h2>9. Contact</h2>
                    <p>
                        Questions about these terms? Contact us at: <br />
                        <a href="mailto:legal@neurostep.com" className="text-green-600">legal@neurostep.com</a>
                    </p>
                </Card>
            </div>

            <Footer />
        </div>
    );
}

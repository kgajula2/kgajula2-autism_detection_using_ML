import { Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import Footer from '../components/layout/Footer';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-900 dark:to-blue-900">
            { }
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Shield className="w-12 h-12" />
                    <div>
                        <h1 className="text-3xl font-black">Privacy Policy</h1>
                        <p className="text-blue-200">Last updated: January 2026</p>
                    </div>
                </div>
            </div>

            { }
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Card className="p-8 shadow-xl prose prose-slate dark:prose-invert max-w-none">
                    <h2>1. Information We Collect</h2>
                    <p>NeuroStep collects the following information:</p>
                    <ul>
                        <li><strong>Account Information:</strong> Email address and display name via Google Sign-In</li>
                        <li><strong>Gameplay Data:</strong> Scores, reaction times, accuracy metrics, and behavioral patterns</li>
                        <li><strong>Device Information:</strong> Browser type, device type for optimization purposes</li>
                    </ul>

                    <h2>2. How We Use Your Information</h2>
                    <p>We use collected data exclusively to:</p>
                    <ul>
                        <li>Provide AI-powered behavioral analysis</li>
                        <li>Track progress and generate insights for parents</li>
                        <li>Improve our games and ML models (anonymized data only)</li>
                        <li>Send optional notifications and reminders</li>
                    </ul>

                    <h2>3. Data Storage & Security</h2>
                    <p>
                        Your data is stored securely using Firebase (Google Cloud) with industry-standard encryption.
                        We implement strict access controls and regular security audits. All data transmission uses
                        HTTPS encryption.
                    </p>

                    <h2>4. Children's Privacy (COPPA Compliance)</h2>
                    <p>
                        NeuroStep is designed for use by parents/guardians on behalf of their children. We do not
                        knowingly collect personal information directly from children under 13. All accounts must
                        be created by adults.
                    </p>

                    <h2>5. Data Sharing</h2>
                    <p>
                        <strong>We do NOT sell or share your personal data with third parties.</strong> Anonymized,
                        aggregated data may be used for research purposes only with your consent.
                    </p>

                    <h2>6. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your data at any time through the Dashboard</li>
                        <li>Export your data in PDF format</li>
                        <li>Request complete deletion of your account and data</li>
                        <li>Opt-out of optional data collection</li>
                    </ul>

                    <h2>7. Data Retention</h2>
                    <p>
                        We retain your data for as long as your account is active. Upon account deletion,
                        all personal data is permanently removed within 30 days.
                    </p>

                    <h2>8. Contact Us</h2>
                    <p>
                        For privacy-related inquiries, contact us at: <br />
                        <a href="mailto:privacy@neurostep.com" className="text-blue-600">privacy@neurostep.com</a>
                    </p>
                </Card>
            </div>

            <Footer />
        </div>
    );
}

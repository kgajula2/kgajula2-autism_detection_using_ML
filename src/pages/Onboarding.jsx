import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { createUserProfile } from '../services/db';
import { getAuth } from "firebase/auth"; // Import auth
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Title, SubTitle } from '../components/ui/Typography';
import { motion } from 'framer-motion';

export default function Onboarding() {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        childName: '',
        age: '',
        gender: '',
        dob: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Fallback to direct auth if store is empty
        const currentUser = user || getAuth().currentUser;

        console.log("Onboarding Submit: CurrentUser:", currentUser);

        if (!currentUser) {
            alert("Error: No authenticated user found. Please reload.");
            return;
        }
        setLoading(true);

        try {
            console.log("Saving profile for:", currentUser.uid, formData);
            await createUserProfile(currentUser.uid, {
                ...formData,
                parentName: currentUser.displayName || 'Parent',
                email: currentUser.email,
                onboardingCompleted: true
            });
            console.log("Profile saved. Redirecting...");
            // Force reload or redirect
            window.location.href = '/home'; // using href to force full state refresh
        } catch (error) {
            console.error("Onboarding failed:", error);
            alert("Failed to save profile: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="p-8 shadow-xl border-t-4 border-brand-primary">
                    <div className="text-center mb-8">
                        <Title className="text-brand-primary mb-2">Welcome to NeuroStep</Title>
                        <SubTitle>Let's set up your child's profile to personalize their journey.</SubTitle>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="font-bold text-gray-700 text-sm uppercase tracking-wide">Child's Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Alex"
                                className="p-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-gray-50"
                                value={formData.childName}
                                onChange={e => setFormData({ ...formData, childName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-gray-700 text-sm uppercase tracking-wide">Age</label>
                                <input
                                    required
                                    type="number"
                                    min="2" max="10"
                                    className="p-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-gray-50"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-gray-700 text-sm uppercase tracking-wide">Gender</label>
                                <select
                                    required
                                    className="p-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-gray-50"
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    <option value="Boy">Boy</option>
                                    <option value="Girl">Girl</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-bold text-gray-700 text-sm uppercase tracking-wide">Date of Birth</label>
                            <input
                                required
                                type="date"
                                className="p-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-gray-50"
                                value={formData.dob}
                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full py-4 text-lg shadow-lg shadow-brand-primary/30"
                        >
                            {loading ? 'Creating Profile...' : 'Start Playing'}
                        </Button>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}

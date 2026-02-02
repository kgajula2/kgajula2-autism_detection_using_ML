import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAuth, updateProfile } from 'firebase/auth';
import {
    User, Settings, Moon, Sun, Volume2, VolumeX, Bell, Shield,
    ChevronRight, LogOut, Award, Flame, Calendar, Save, Camera
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSettings } from '../contexts/SettingsContext';
import Footer from '../components/layout/Footer';

const avatars = ['🦊', '🐻', '🐰', '🐼', '🦁', '🐨', '🐯', '🦄', '🐸', '🐵'];

export default function Profile() {
    const auth = getAuth();
    const user = auth.currentUser;
    const { settings, toggleSetting, updateSetting } = useSettings();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [selectedAvatar, setSelectedAvatar] = useState(
        localStorage.getItem('neurostep_avatar') || '🦊'
    );
    const [isSaving, setIsSaving] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

     
    const achievements = [
        { id: 'first_game', name: 'First Steps', emoji: '👶', unlocked: true },
        { id: 'five_games', name: 'Getting Started', emoji: '🎮', unlocked: true },
        { id: 'perfect_score', name: 'Perfect!', emoji: '⭐', unlocked: false },
        { id: 'week_streak', name: '7-Day Streak', emoji: '🔥', unlocked: false },
    ];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile(user, { displayName });
            localStorage.setItem('neurostep_avatar', selectedAvatar);
            alert('Profile saved!');
        } catch (e) {
            console.error(e);
            alert('Failed to save profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await auth.signOut();
            window.location.href = '/';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-purple-100 dark:from-slate-900 dark:to-purple-900">
            { }
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 pb-24">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-black mb-2">Profile & Settings</h1>
                    <p className="text-purple-200">Manage your account and preferences</p>
                </div>
            </div>

            { }
            <div className="max-w-4xl mx-auto px-6 -mt-16 pb-12">
                { }
                <Card className="p-6 mb-6 shadow-xl">
                    <div className="flex items-center gap-6 mb-6">
                        <div className="relative">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-5xl cursor-pointer shadow-lg"
                            >
                                {selectedAvatar}
                            </motion.div>
                            <button
                                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                                className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg"
                            >
                                <Camera size={16} />
                            </button>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-500 mb-1">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none text-lg font-bold"
                                placeholder="Enter your name"
                            />
                            <p className="text-sm text-slate-400 mt-1">{user?.email}</p>
                        </div>
                    </div>

                    { }
                    {showAvatarPicker && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                        >
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Choose your avatar:</p>
                            <div className="flex flex-wrap gap-3">
                                {avatars.map(avatar => (
                                    <button
                                        key={avatar}
                                        onClick={() => { setSelectedAvatar(avatar); setShowAvatarPicker(false); }}
                                        className={`w-14 h-14 rounded-xl text-3xl flex items-center justify-center transition-all ${selectedAvatar === avatar
                                                ? 'bg-purple-500 shadow-lg scale-110'
                                                : 'bg-white dark:bg-slate-700 hover:bg-purple-100'
                                            }`}
                                    >
                                        {avatar}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </Button>
                </Card>

                { }
                <Card className="p-6 mb-6 shadow-xl">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                        <Award className="text-yellow-500" /> Achievements
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {achievements.map(ach => (
                            <div
                                key={ach.id}
                                className={`p-4 rounded-xl text-center ${ach.unlocked
                                        ? 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30'
                                        : 'bg-slate-100 dark:bg-slate-800 opacity-50'
                                    }`}
                            >
                                <div className="text-4xl mb-2">{ach.emoji}</div>
                                <div className="text-sm font-bold text-slate-700 dark:text-white">{ach.name}</div>
                                <div className="text-xs text-slate-500">
                                    {ach.unlocked ? '✅ Unlocked' : '🔒 Locked'}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                { }
                <Card className="p-6 mb-6 shadow-xl">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                        <Settings className="text-slate-500" /> Settings
                    </h3>

                    { }
                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            {settings.darkMode ? <Moon className="text-indigo-500" /> : <Sun className="text-yellow-500" />}
                            <div>
                                <div className="font-medium">Dark Mode</div>
                                <div className="text-sm text-slate-500">Switch to dark theme</div>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSetting('darkMode')}
                            className={`w-14 h-8 rounded-full transition-colors ${settings.darkMode ? 'bg-purple-500' : 'bg-slate-200'
                                }`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.darkMode ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>

                    { }
                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            {settings.soundEnabled ? <Volume2 className="text-green-500" /> : <VolumeX className="text-slate-400" />}
                            <div>
                                <div className="font-medium">Sound Effects</div>
                                <div className="text-sm text-slate-500">Play sounds in games</div>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSetting('soundEnabled')}
                            className={`w-14 h-8 rounded-full transition-colors ${settings.soundEnabled ? 'bg-green-500' : 'bg-slate-200'
                                }`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>

                    { }
                    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <Bell className="text-blue-500" />
                            <div>
                                <div className="font-medium">Daily Reminder</div>
                                <div className="text-sm text-slate-500">Get notified to play</div>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSetting('dailyReminder')}
                            className={`w-14 h-8 rounded-full transition-colors ${settings.dailyReminder ? 'bg-blue-500' : 'bg-slate-200'
                                }`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.dailyReminder ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>

                    { }
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <Flame className="text-orange-500" />
                            <div>
                                <div className="font-medium">Game Difficulty</div>
                                <div className="text-sm text-slate-500">Adjust game challenge</div>
                            </div>
                        </div>
                        <select
                            value={settings.difficulty}
                            onChange={(e) => updateSetting('difficulty', e.target.value)}
                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 font-medium"
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                </Card>

                { }
                <Card className="p-6 shadow-xl">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-bold"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </Card>
            </div>

            <Footer />
        </div>
    );
}

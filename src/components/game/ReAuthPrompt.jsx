 

import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AlertTriangle } from 'lucide-react';

export function ReAuthPrompt({ onDismiss }) {
    const navigate = useNavigate();

    const handleLogin = () => {
         
        sessionStorage.setItem('returnUrl', window.location.pathname);
        navigate('/login');
    };

    const handleContinue = () => {
        onDismiss?.();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-white shadow-2xl p-0 overflow-hidden">
                { }
                <div className="bg-amber-500 p-6 text-white text-center">
                    <AlertTriangle size={48} className="mx-auto mb-2" />
                    <h2 className="text-2xl font-black">Session Expired</h2>
                </div>

                { }
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-center">
                        Your login session has expired. Sign in again to save your game progress.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button onClick={handleLogin} className="w-full">
                            Sign In to Save Progress
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleContinue}
                            className="w-full text-gray-500"
                        >
                            Continue Without Saving
                        </Button>
                    </div>

                    <p className="text-xs text-gray-400 text-center">
                        Your progress will be saved locally and synced when you sign in.
                    </p>
                </div>
            </Card>
        </div>,
        document.body
    );
}

export default ReAuthPrompt;

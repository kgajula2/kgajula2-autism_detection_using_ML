import { Component } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

/**
 * Error Boundary specifically for game components.
 * Provides a child-friendly error UI with retry and home options.
 */
class GameErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });

        // Log to console in development
        console.error('Game Error:', error);
        console.error('Error Info:', errorInfo);

        // Log to external service if available
        if (window.errorLogger) {
            window.errorLogger.log({
                type: 'GAME_ERROR',
                game: this.props.gameName || 'unknown',
                error: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
            });
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = '/games';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-4">
                    <Card className="max-w-md text-center p-8 bg-white dark:bg-slate-800">
                        {/* Sad Mascot */}
                        <div className="text-8xl mb-4 animate-bounce">😢</div>

                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                            Oops! Something went wrong
                        </h2>

                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            The game had a little problem. Let's try again!
                        </p>

                        {/* Error details (development only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 text-left">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-2">
                                    <AlertTriangle size={16} />
                                    Debug Info
                                </div>
                                <code className="text-xs text-red-700 dark:text-red-300 break-all">
                                    {this.state.error.message}
                                </code>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={this.handleRetry}
                                className="flex items-center gap-2"
                            >
                                <RefreshCcw size={18} />
                                Try Again
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2"
                            >
                                <Home size={18} />
                                Go Home
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GameErrorBoundary;

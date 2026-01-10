import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        // Log error to console (in production, send to error tracking service)
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleRefresh = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md text-center"
                    >
                        {/* Error Icon */}
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5 }}
                            className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6"
                        >
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </motion.div>

                        <h1 className="text-2xl font-black text-slate-800 mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-slate-600 mb-6">
                            We encountered an unexpected error. Don't worry, your data is safe!
                        </p>

                        {/* Error Details (only in development) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-slate-100 rounded-xl p-4 mb-6 text-left overflow-auto max-h-40">
                                <p className="text-xs font-mono text-red-600 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={this.handleRefresh} className="gap-2">
                                <RefreshCw size={18} />
                                Try Again
                            </Button>
                            <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                                <Home size={18} />
                                Go Home
                            </Button>
                        </div>

                        {/* Cute message */}
                        <p className="text-sm text-slate-400 mt-8">
                            🧠 Even AI makes mistakes sometimes!
                        </p>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

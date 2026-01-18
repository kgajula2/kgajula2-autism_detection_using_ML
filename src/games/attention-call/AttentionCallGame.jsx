/**
 * Attention Call Game - Name Response Test with Camera Detection
 * 
 * This game measures social orienting reflex by calling the child's name
 * and detecting their response via webcam (eye contact / head movement).
 * 
 * ML Signals Captured:
 * - response_detected: Did child react?
 * - response_time: Time from call to response
 * - response_type: 'eye_contact' | 'head_movement' | 'face_appeared' | 'none'
 * - first_response_call: Which call number got response
 * - call_details: Per-call breakdown
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { useGameSession } from '../../hooks/useGameSession';
import { getUserProfile } from '../../services/db';
import { ATTENTION_CALL_CONFIG, MASCOT } from '../../config/gameConfig';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Camera, Eye } from 'lucide-react';
import { analyzeUserPerformance } from '../../services/ml';
import { fetchUserGameStats } from '../../services/db';
import { initializeFaceMesh, stopVision } from '../../services/vision';
import GameTutorial from '../../components/game/GameTutorial';

const {
    MAX_CALLS,
    INITIAL_DELAY,
    BETWEEN_CALLS_DELAY,
    RESPONSE_WINDOW,
    FALLBACK_GREETING,
    SPEECH_PITCH,
    SPEECH_RATE,
    SPEECH_VOLUME,
    GAZE_THRESHOLD,
    MOVEMENT_THRESHOLD,
    GREETING_PREFIX
} = ATTENTION_CALL_CONFIG;

// Animated character component
const AnimatedCharacter = ({ isWaving, isIdle, isCalling }) => {
    return (
        <motion.div
            className="relative"
            animate={isWaving ? {
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1],
            } : isCalling ? {
                scale: [1, 1.15, 1],
            } : isIdle ? {
                y: [0, -10, 0],
            } : {}}
            transition={isWaving ? {
                duration: 0.5,
                repeat: 2,
            } : isCalling ? {
                duration: 0.3,
                repeat: 3,
            } : {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            <div className="text-[150px] select-none">
                {MASCOT.emoji}
            </div>
            {isWaving && (
                <motion.div
                    className="absolute -right-8 top-0 text-6xl"
                    animate={{ rotate: [0, 20, -20, 20, 0] }}
                    transition={{ duration: 0.3, repeat: 3 }}
                >
                    👋
                </motion.div>
            )}
            {isCalling && (
                <motion.div
                    className="absolute -right-4 -top-4 text-5xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }}
                    transition={{ duration: 0.4, repeat: 3 }}
                >
                    📢
                </motion.div>
            )}
        </motion.div>
    );
};

// Confetti burst component
const ConfettiBurst = ({ show }) => {
    if (!show) return null;

    const confetti = ['🎉', '⭐', '✨', '🌟', '🎊', '💫'];

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confetti.map((emoji, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0
                    }}
                    animate={{
                        x: `${20 + Math.random() * 60}%`,
                        y: `${10 + Math.random() * 80}%`,
                        scale: [0, 1.5, 1],
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: 1.5,
                        delay: i * 0.1,
                    }}
                    className="absolute text-4xl"
                >
                    {emoji}
                </motion.div>
            ))}
        </div>
    );
};

export default function AttentionCallGame() {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { startSession, endSession } = useGameSession('attention-call');

    // Game states
    const [gameState, setGameState] = useState('TUTORIAL'); // TUTORIAL, PLAYING, FINISHED
    const [childName, setChildName] = useState('');
    const [currentCall, setCurrentCall] = useState(0);
    const [isCalling, setIsCalling] = useState(false);
    const [isWaving, setIsWaving] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [calls, setCalls] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [mlResult, setMlResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [waitingForResponse, setWaitingForResponse] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [detectionStatus, setDetectionStatus] = useState('');
    const [gameStartTime, setGameStartTime] = useState(null);
    const [faceDetected, setFaceDetected] = useState(false);  // STATE for face detection

    // Refs
    const videoRef = useRef(null);
    const callTimeRef = useRef(null);
    const responseTimeoutRef = useRef(null);
    const previousLandmarksRef = useRef(null);
    const detectionActiveRef = useRef(false);
    const faceWasAbsentRef = useRef(true);
    const gameStateRef = useRef('TUTORIAL');
    const responseTriggeredRef = useRef(false);
    const faceDetectedRef = useRef(false);  // REF for immediate access in game loop
    // Additional refs for callbacks - MUST be defined before useGameLoop
    const currentCallRef = useRef(currentCall);
    const childNameRef = useRef(childName);
    const callsRef = useRef(calls);
    const finishGameRef = useRef(null);

    // Keep gameStateRef in sync
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Keep faceDetectedRef in sync with state
    useEffect(() => {
        faceDetectedRef.current = faceDetected;
    }, [faceDetected]);

    // Eye landmarks for EAR (Eye Aspect Ratio) calculation
    // MediaPipe FaceMesh uses these landmark indices:
    const LEFT_EYE = { upper: [159, 158, 157], lower: [145, 144, 153], inner: 133, outer: 33 };
    const RIGHT_EYE = { upper: [386, 385, 384], lower: [374, 373, 380], inner: 362, outer: 263 };

    // Iris landmarks
    const LEFT_IRIS = [474, 475, 476, 477];
    const RIGHT_IRIS = [469, 470, 471, 472];

    // Calculate Eye Aspect Ratio (EAR) - higher = more open
    const calculateEAR = (landmarks, eye) => {
        // Vertical distances (upper lid to lower lid)
        let verticalSum = 0;
        for (let i = 0; i < eye.upper.length; i++) {
            const upper = landmarks[eye.upper[i]];
            const lower = landmarks[eye.lower[i]];
            verticalSum += Math.abs(upper.y - lower.y);
        }
        const avgVertical = verticalSum / eye.upper.length;

        // Horizontal distance (inner to outer corner)
        const inner = landmarks[eye.inner];
        const outer = landmarks[eye.outer];
        const horizontal = Math.abs(inner.x - outer.x);

        // EAR = vertical / horizontal
        return avgVertical / horizontal;
    };

    // Check if looking at camera (eyes open + iris centered)
    const checkEyeContact = (landmarks) => {
        // Calculate EAR for both eyes
        const leftEAR = calculateEAR(landmarks, LEFT_EYE);
        const rightEAR = calculateEAR(landmarks, RIGHT_EYE);
        const avgEAR = (leftEAR + rightEAR) / 2;

        // Eyes open if EAR > 0.15 (threshold for open eyes)
        const eyesOpen = avgEAR > 0.15;

        // Calculate iris X positions
        const leftIrisX = LEFT_IRIS.reduce((sum, i) => sum + landmarks[i].x, 0) / LEFT_IRIS.length;
        const rightIrisX = RIGHT_IRIS.reduce((sum, i) => sum + landmarks[i].x, 0) / RIGHT_IRIS.length;

        // Iris centered (0.30-0.70 for more tolerance) - EITHER eye looking at camera counts
        const leftCentered = leftIrisX > 0.30 && leftIrisX < 0.70;
        const rightCentered = rightIrisX > 0.30 && rightIrisX < 0.70;
        const lookingAtCamera = leftCentered || rightCentered;  // EITHER eye counts

        return {
            eyesOpen,
            lookingAtCamera,
            eyeContact: eyesOpen && lookingAtCamera,
            avgEAR: avgEAR.toFixed(2),
            leftIrisX: leftIrisX.toFixed(2),
            rightIrisX: rightIrisX.toFixed(2)
        };
    };

    // onResults handler with EAR + IRIS detection
    const onResults = (results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            setFaceDetected(false);
            faceDetectedRef.current = false;  // IMMEDIATE update
            setDetectionStatus('❌ No face - look at camera');
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];

        // Check if enough landmarks for iris detection
        if (landmarks.length < 478) {
            setFaceDetected(false);
            faceDetectedRef.current = false;  // IMMEDIATE update
            setDetectionStatus('⚠️ Face found but iris not detected');
            return;
        }

        const result = checkEyeContact(landmarks);

        if (!result.eyesOpen) {
            // Eyes closed
            setFaceDetected(false);
            faceDetectedRef.current = false;  // IMMEDIATE update
            setDetectionStatus(`😴 Eyes closed (EAR:${result.avgEAR})`);
        } else if (!result.lookingAtCamera) {
            // Eyes open but not looking at camera
            setFaceDetected(false);
            faceDetectedRef.current = false;  // IMMEDIATE update
            setDetectionStatus(`👀 Look at camera (L:${result.leftIrisX} R:${result.rightIrisX})`);
        } else {
            // Eyes open AND looking at camera = SUCCESS
            setFaceDetected(true);
            faceDetectedRef.current = true;  // IMMEDIATE update - game loop sees this instantly
            setDetectionStatus(`✅ Eye contact! (EAR:${result.avgEAR})`);
        }
    };

    // Direct requestAnimationFrame loop for face detection (NOT using useGameLoop which checks wrong gameStore)
    useEffect(() => {
        let animationId;
        let isRunning = true;

        const checkDetection = () => {
            if (!isRunning) return;

            // Only check when game is active and detection is enabled
            if (gameStateRef.current === 'PLAYING' &&
                detectionActiveRef.current &&
                !responseTriggeredRef.current) {

                // Check if face/eye contact detected
                if (faceDetectedRef.current) {
                    console.log('[Detection Loop] EYE CONTACT DETECTED - TRIGGERING RESPONSE!');
                    responseTriggeredRef.current = true;
                    detectionActiveRef.current = false;

                    // Clear timeout
                    if (responseTimeoutRef.current) {
                        clearTimeout(responseTimeoutRef.current);
                    }

                    // Record response
                    const callData = {
                        callNumber: currentCallRef.current,
                        callTimestamp: callTimeRef.current,
                        responseDetected: true,
                        responseType: 'eye_contact',
                        responseTime: Date.now() - callTimeRef.current,
                        nameUsed: childNameRef.current || FALLBACK_GREETING,
                    };

                    callsRef.current = [...callsRef.current, callData];
                    setCalls(callsRef.current);
                    setWaitingForResponse(false);
                    setShowConfetti(true);
                    setIsWaving(true);

                    // Finish game after celebration
                    setTimeout(() => {
                        if (finishGameRef.current) {
                            finishGameRef.current(callsRef.current, 'eye_contact');
                        }
                    }, 1500);

                    return; // Stop the loop after detecting
                }
            }

            // Continue checking
            animationId = requestAnimationFrame(checkDetection);
        };

        // Start the detection loop when camera is active
        if (cameraActive) {
            animationId = requestAnimationFrame(checkDetection);
        }

        return () => {
            isRunning = false;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [cameraActive]);

    // Keep refs in sync
    useEffect(() => {
        currentCallRef.current = currentCall;
    }, [currentCall]);

    useEffect(() => {
        childNameRef.current = childName;
    }, [childName]);

    useEffect(() => {
        callsRef.current = calls;
    }, [calls]);

    // Initialize camera when game starts using MediaPipe (SAME as EmotionMirrorGame)
    useEffect(() => {
        if (gameState === 'PLAYING') {
            const startCamera = async () => {
                try {
                    await initializeFaceMesh(videoRef.current, onResults);
                    setCameraActive(true);
                    setDetectionStatus('Camera ready - detecting face...');
                } catch (err) {
                    console.error("Camera init failed", err);
                    setDetectionStatus('Camera error - please allow access');
                }
            };
            startCamera();
        }

        return () => {
            stopVision();
        };
    }, [gameState]);

    // Fetch child's name from profile
    useEffect(() => {
        const fetchName = async () => {
            if (user?.uid) {
                const profile = await getUserProfile(user.uid);
                if (profile?.childName) {
                    setChildName(profile.childName);
                } else if (user.displayName) {
                    setChildName(user.displayName.split(' ')[0]);
                }
            }
        };
        fetchName();
    }, [user]);

    // Text-to-speech: Gentle, warm, child-safe cartoon narrator voice
    // - High-pitched but not startling
    // - Slow, clear pronunciation
    // - Soft volume, non-overstimulating
    const speakName = useCallback((name) => {
        return new Promise((resolve) => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();

                // Simple, warm greeting under 10 words: "Hi [NAME]!"
                const greeting = `${GREETING_PREFIX} ${name}!`;
                const utterance = new SpeechSynthesisUtterance(greeting);

                // Gentle voice settings
                utterance.rate = SPEECH_RATE;      // 0.75 - slow, clear for ages 3-8
                utterance.pitch = SPEECH_PITCH;    // 1.5 - cheerful but calm
                utterance.volume = SPEECH_VOLUME;  // 0.85 - soft, non-startling

                // Find a warm, gentle, child-friendly voice
                const voices = window.speechSynthesis.getVoices();
                // Priority: Warm female voices known for gentle, friendly tone
                const preferredVoice = voices.find(v =>
                    v.name.includes('Microsoft Jenny') ||    // Warm, friendly
                    v.name.includes('Microsoft Aria') ||     // Young, warm
                    v.name.includes('Google UK English Female') ||
                    v.name.includes('Samantha') ||           // macOS friendly voice  
                    v.name.includes('Karen') ||              // Gentle Australian
                    v.name.includes('Moira') ||              // Warm Irish
                    v.name.includes('Victoria') ||
                    v.name.includes('Microsoft Zira') ||
                    (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
                );

                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }

                utterance.onend = resolve;
                utterance.onerror = resolve;

                window.speechSynthesis.speak(utterance);
            } else {
                resolve();
            }
        });
    }, []);
    // handleResponseDetected - using function declaration for hoisting

    // Handle detected response
    const handleResponseDetected = useCallback((responseType) => {
        if (!detectionActiveRef.current) return;

        // Disable further detection
        detectionActiveRef.current = false;

        // Clear timeout
        if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current);
        }

        const responseTime = Date.now() - callTimeRef.current;
        const callNumber = currentCall;

        // Record response
        const callData = {
            callNumber,
            callTimestamp: callTimeRef.current,
            responseDetected: true,
            responseType,
            responseTime,
            nameUsed: childName || FALLBACK_GREETING,
        };

        setCalls(prev => [...prev, callData]);
        setWaitingForResponse(false);

        // Show celebration
        setIsWaving(true);
        setShowConfetti(true);

        setTimeout(() => {
            setIsWaving(false);
            setShowConfetti(false);
            // Response detected - end game successfully
            callsRef.current = [...callsRef.current, callData];
            finishGameRef.current(callsRef.current, responseType);
        }, 2000);
    }, [currentCall, childName, calls]);

    // Make a name call
    const makeCall = useCallback(async (callNumber) => {
        if (gameStateRef.current !== 'PLAYING') return;

        const nameToCall = childName || FALLBACK_GREETING;

        setCurrentCall(callNumber);
        setIsCalling(true);
        callTimeRef.current = Date.now();

        // Speak the name
        await speakName(nameToCall);
        setIsCalling(false);

        // Start listening for response
        setWaitingForResponse(true);
        detectionActiveRef.current = true;
        responseTriggeredRef.current = false;  // Reset for new detection window
        setDetectionStatus('👀 Looking for face...');

        // After response window, check result
        responseTimeoutRef.current = setTimeout(() => {
            if (!detectionActiveRef.current) return; // Already responded

            // No response detected
            detectionActiveRef.current = false;

            const callData = {
                callNumber,
                callTimestamp: callTimeRef.current,
                responseDetected: false,
                responseType: 'none',
                responseTime: null,
                nameUsed: nameToCall,
            };

            setCalls(prev => [...prev, callData]);
            setWaitingForResponse(false);

            // Check if more calls remaining
            if (callNumber < MAX_CALLS) {
                // Wait and make next call
                setTimeout(() => makeCall(callNumber + 1), BETWEEN_CALLS_DELAY);
            } else {
                // No response after all calls - end game
                callsRef.current = [...callsRef.current, callData];
                finishGameRef.current(callsRef.current, 'none');
            }
        }, RESPONSE_WINDOW);
    }, [childName, speakName, calls]);

    // Start game
    const handleStartGame = useCallback(async () => {
        setCalls([]);
        setCurrentCall(0);
        setGameStartTime(Date.now());
        previousLandmarksRef.current = null;
        faceWasAbsentRef.current = true;

        if (user?.uid) {
            const sid = await startSession({
                maxCalls: MAX_CALLS,
                childName: childName || FALLBACK_GREETING,
            });
            setSessionId(sid);
        }

        // Set game state - useEffect will handle camera init
        setGameState('PLAYING');

        // Start first call after initial delay (give camera time to init)
        setTimeout(() => makeCall(1), INITIAL_DELAY + 1000);
    }, [startSession, user, childName, makeCall]);

    // Finish game
    const finishGame = useCallback(async (finalCalls, finalResponseType) => {
        setGameState('FINISHED');
        stopVision();
        setCameraActive(false);

        // Calculate stats
        const responses = finalCalls.filter(c => c.responseDetected);
        const firstResponseCall = responses.length > 0 ? responses[0].callNumber : null;
        const responseRate = finalCalls.length > 0 ? responses.length / finalCalls.length : 0;
        const avgResponseTime = responses.length > 0
            ? responses.reduce((sum, c) => sum + c.responseTime, 0) / responses.length
            : null;

        const duration = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;

        const stats = {
            callDetails: finalCalls.map(c => ({
                call: c.callNumber,
                response: c.responseType,
                time: c.responseTime,
            })),
            responseRate: Math.round(responseRate * 100) / 100,
            avgResponseTime: avgResponseTime ? Math.round(avgResponseTime) : null,
            totalResponses: responses.length,
            totalCalls: finalCalls.length,
            firstResponseCall,
            responseType: finalResponseType,
            duration,
        };

        // End session
        if (sessionId) {
            await endSession(responses.length, stats);
        }

        setShowResultModal(true);
        setIsAnalyzing(true);

        try {
            if (user?.uid) {
                const { aggregated } = await fetchUserGameStats(user.uid);
                aggregated['attention-call'] = {
                    ...stats,
                    score: responses.length > 0 ? MAX_CALLS - firstResponseCall + 1 : 0,
                    count: (aggregated['attention-call']?.count || 0) + 1,
                };

                const result = await analyzeUserPerformance(aggregated, {
                    age: user.age || 5,
                });
                setMlResult(result);
            }
        } catch (error) {
            console.error('ML analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [sessionId, endSession, user, gameStartTime]);

    // Keep finishGameRef in sync
    useEffect(() => {
        finishGameRef.current = finishGame;
    }, [finishGame]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (responseTimeoutRef.current) {
                clearTimeout(responseTimeoutRef.current);
            }
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            stopVision();
        };
    }, []);

    // Result Modal
    const ResultModal = () => {
        if (!showResultModal) return null;

        const responses = calls.filter(c => c.responseDetected);
        const firstResponse = responses.length > 0 ? responses[0] : null;

        return createPortal(
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            >
                <motion.div
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                >
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-4">
                            {responses.length > 0 ? '🎉' : '🔔'}
                        </div>
                        <h2 className="text-3xl font-black text-rose-600">
                            {responses.length > 0 ? 'Great Response!' : 'Session Complete'}
                        </h2>
                    </div>

                    <div className="space-y-3 mb-6">
                        {firstResponse ? (
                            <>
                                <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl">
                                    <span className="font-medium text-gray-700">Responded at call</span>
                                    <span className="text-2xl font-bold text-green-600">#{firstResponse.callNumber}</span>
                                </div>
                                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl">
                                    <span className="font-medium text-gray-700">Response Type</span>
                                    <span className="text-lg font-bold text-blue-600 capitalize">
                                        {firstResponse.responseType.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-purple-50 p-3 rounded-xl">
                                    <span className="font-medium text-gray-700">Response Time</span>
                                    <span className="text-2xl font-bold text-purple-600">
                                        {(firstResponse.responseTime / 1000).toFixed(1)}s
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                <span className="font-medium text-gray-700">Calls Made</span>
                                <span className="text-2xl font-bold text-gray-600">{calls.length}</span>
                            </div>
                        )}
                    </div>

                    {/* Call breakdown */}
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-500 mb-2">Call by Call:</p>
                        <div className="flex gap-2 flex-wrap">
                            {calls.map((call, i) => (
                                <div
                                    key={i}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${call.responseDetected
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    {call.callNumber}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            🟢 = responded, ⚪ = no response
                        </p>
                    </div>

                    {isAnalyzing && (
                        <div className="text-center text-gray-500 mb-4">
                            <div className="animate-spin inline-block w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full mr-2" />
                            Analyzing responses...
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={() => {
                                setShowResultModal(false);
                                setGameState('TUTORIAL');
                                setCalls([]);
                            }}
                            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                        >
                            Play Again
                        </Button>
                        <Button
                            onClick={() => navigate('/home')}
                            variant="outline"
                            className="flex-1"
                        >
                            Back to Games
                        </Button>
                    </div>
                </motion.div>
            </motion.div>,
            document.body
        );
    };

    return (
        <div className="min-h-[80vh] flex flex-col">

            {/* Tutorial */}
            {gameState === 'TUTORIAL' && (
                <GameTutorial
                    type="camera"
                    title="🐘 Listen for your name!"
                    subtitle="When you hear your name, look at the screen!"
                    onComplete={handleStartGame}
                    targetElement={
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-6xl animate-bounce">🔔</span>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Camera className="w-5 h-5" />
                                <span>Camera will detect your response</span>
                            </div>
                        </div>
                    }
                />
            )}

            {/* Game Area */}
            {gameState === 'PLAYING' && (
                <div className="flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 px-4">
                        <Button
                            onClick={() => {
                                stopVision();
                                navigate('/home');
                            }}
                            variant="outline"
                            className="flex items-center gap-2 bg-white/90 hover:bg-white shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back</span>
                        </Button>
                        <div className="flex items-center gap-3">
                            {cameraActive && (
                                <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-medium text-red-700">CAMERA</span>
                                </div>
                            )}
                            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg">
                                <span className="text-lg font-bold">Call {currentCall} / {MAX_CALLS}</span>
                            </div>
                        </div>
                    </div>

                    {/* Game Play Area - Camera Only */}
                    <div className="relative flex-1 min-h-[500px] bg-gradient-to-br from-rose-100 via-pink-50 to-orange-100 rounded-3xl overflow-hidden flex flex-col items-center justify-center mx-4 p-6">

                        {/* Large Camera View - Centered */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white w-full max-w-2xl aspect-video bg-gray-900">
                            <video
                                ref={videoRef}
                                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                                autoPlay
                                playsInline
                                muted
                            />
                            {/* Live indicator */}
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-white">LIVE</span>
                            </div>

                            {/* Call counter */}
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-full">
                                <span className="font-bold">Call {currentCall} / {MAX_CALLS}</span>
                            </div>

                            {/* Calling indicator - shows name being called */}
                            {isCalling && (
                                <motion.div
                                    initial={{ scale: 0, y: -20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="absolute top-16 left-1/2 transform -translate-x-1/2"
                                >
                                    <div className="bg-yellow-400 text-yellow-900 px-8 py-4 rounded-full shadow-lg text-2xl font-bold flex items-center gap-2">
                                        🔔 "{GREETING_PREFIX} {childName || FALLBACK_GREETING}!"
                                    </div>
                                </motion.div>
                            )}

                            {/* Detection status - bottom center */}
                            <div className="absolute bottom-4 left-4 right-4 bg-black/70 px-6 py-3 rounded-xl">
                                <p className="text-lg font-bold text-white text-center">
                                    {detectionStatus || 'Starting camera...'}
                                </p>
                            </div>
                        </div>

                        {/* Instruction text */}
                        {waitingForResponse && !isCalling && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 bg-white/90 px-8 py-4 rounded-full shadow-lg"
                            >
                                <p className="text-xl font-bold text-rose-600">
                                    👀 Look directly at the camera!
                                </p>
                            </motion.div>
                        )}

                        {/* Confetti */}
                        <ConfettiBurst show={showConfetti} />

                        {/* Progress dots */}
                        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
                            {Array.from({ length: MAX_CALLS }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full transition-all ${i < calls.length
                                        ? calls[i]?.responseDetected
                                            ? 'bg-green-500'
                                            : 'bg-gray-400'
                                        : i === currentCall - 1
                                            ? 'bg-rose-500 animate-pulse'
                                            : 'bg-white/50'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            <ResultModal />
        </div>
    );
}

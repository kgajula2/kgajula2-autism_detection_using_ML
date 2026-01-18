/**
 * Face Detection Service using face-api.js
 * 
 * This provides reliable face detection with eye state detection
 * using Eye Aspect Ratio (EAR) calculation.
 */

import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let videoElement = null;
let onResultsCallback = null;
let animationFrameId = null;
let isRunning = false;

/**
 * Load face-api.js models from CDN
 */
export const loadModels = async () => {
    if (modelsLoaded) return true;

    try {
        // Load from CDN - faster and no need to host files
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);

        modelsLoaded = true;
        return true;
    } catch (error) {
        console.error('Failed to load face-api.js models:', error);
        return false;
    }
};

/**
 * Calculate Eye Aspect Ratio (EAR) to detect if eyes are open
 * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
 * 
 * Eye landmarks (0-indexed from face-api.js 68-point model):
 * Left eye: 36-41 (36=outer, 37=upper-outer, 38=upper-inner, 39=inner, 40=lower-inner, 41=lower-outer)
 * Right eye: 42-47 (same pattern)
 */
const calculateEAR = (eyePoints) => {
    // Vertical distances
    const v1 = Math.sqrt(
        Math.pow(eyePoints[1].x - eyePoints[5].x, 2) +
        Math.pow(eyePoints[1].y - eyePoints[5].y, 2)
    );
    const v2 = Math.sqrt(
        Math.pow(eyePoints[2].x - eyePoints[4].x, 2) +
        Math.pow(eyePoints[2].y - eyePoints[4].y, 2)
    );

    // Horizontal distance
    const h = Math.sqrt(
        Math.pow(eyePoints[0].x - eyePoints[3].x, 2) +
        Math.pow(eyePoints[0].y - eyePoints[3].y, 2)
    );

    // EAR calculation
    const ear = (v1 + v2) / (2 * h);
    return ear;
};

/**
 * Detect face and eye state
 */
const detectFace = async () => {
    if (!videoElement || !isRunning) return;

    try {
        const detection = await faceapi
            .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({
                inputSize: 320,
                scoreThreshold: 0.3
            }))
            .withFaceLandmarks();

        if (detection) {
            const landmarks = detection.landmarks;

            // Get eye landmarks
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();

            // Calculate EAR for both eyes
            const leftEAR = calculateEAR(leftEye);
            const rightEAR = calculateEAR(rightEye);
            const avgEAR = (leftEAR + rightEAR) / 2;

            // Thresholds: 
            // EAR < 0.20 = eyes closed
            // EAR > 0.25 = eyes open (looking at screen)
            const eyesOpen = avgEAR > 0.22;

            if (onResultsCallback) {
                onResultsCallback({
                    faceDetected: true,
                    eyesOpen,
                    leftEAR,
                    rightEAR,
                    avgEAR,
                    boundingBox: detection.detection.box
                });
            }
        } else {
            if (onResultsCallback) {
                onResultsCallback({
                    faceDetected: false,
                    eyesOpen: false,
                    leftEAR: 0,
                    rightEAR: 0,
                    avgEAR: 0
                });
            }
        }
    } catch (error) {
        console.error('Face detection error:', error);
    }

    // Continue detection loop
    if (isRunning) {
        animationFrameId = requestAnimationFrame(detectFace);
    }
};

/**
 * Initialize face detection with a video element
 * @param {HTMLVideoElement} video - The video element to detect faces from
 * @param {Function} onResults - Callback function with detection results
 */
export const initializeFaceDetection = async (video, onResults) => {
    if (!video) {
        console.error('[FaceDetection] Video element is required');
        return false;
    }

    videoElement = video;
    onResultsCallback = onResults;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' }
        });

        video.srcObject = stream;

        await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
                video.play()
                    .then(() => {
                        resolve();
                    })
                    .catch(reject);
            };
            video.onerror = reject;

            // Timeout after 5 seconds
            setTimeout(() => reject(new Error('Video load timeout')), 5000);
        });

    } catch (error) {
        console.error('[FaceDetection] Camera error:', error);
        return false;
    }

    isRunning = true;

    if (modelsLoaded) {
        detectFace();
        return true;
    }

    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);

        modelsLoaded = true;
        detectFace();
    } catch (error) {
        console.error('[FaceDetection] Model loading failed:', error);

        // Report error but DO NOT fake detection
        if (onResultsCallback) {
            onResultsCallback({
                faceDetected: false,
                eyesOpen: false,
                avgEAR: 0,
                error: 'Face detection failed to load (Network/CORS)'
            });
        }
    }



    return true;
};

/**
 * Stop face detection and release resources
 */
export const stopFaceDetection = () => {
    isRunning = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
    }

    videoElement = null;
    onResultsCallback = null;
};

 

import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let videoElement = null;
let onResultsCallback = null;
let animationFrameId = null;
let isRunning = false;

 
export const loadModels = async () => {
    if (modelsLoaded) return true;

    try {
         
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

 
const calculateEAR = (eyePoints) => {
     
    const v1 = Math.sqrt(
        Math.pow(eyePoints[1].x - eyePoints[5].x, 2) +
        Math.pow(eyePoints[1].y - eyePoints[5].y, 2)
    );
    const v2 = Math.sqrt(
        Math.pow(eyePoints[2].x - eyePoints[4].x, 2) +
        Math.pow(eyePoints[2].y - eyePoints[4].y, 2)
    );

     
    const h = Math.sqrt(
        Math.pow(eyePoints[0].x - eyePoints[3].x, 2) +
        Math.pow(eyePoints[0].y - eyePoints[3].y, 2)
    );

     
    const ear = (v1 + v2) / (2 * h);
    return ear;
};

 
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

             
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();

             
            const leftEAR = calculateEAR(leftEye);
            const rightEAR = calculateEAR(rightEye);
            const avgEAR = (leftEAR + rightEAR) / 2;

             
             
             
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

     
    if (isRunning) {
        animationFrameId = requestAnimationFrame(detectFace);
    }
};

 
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

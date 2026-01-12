// import { FaceMesh } from '@mediapipe/face_mesh';
// import { Camera } from '@mediapipe/camera_utils';

let faceMesh = null;
let camera = null;

export const initializeFaceMesh = async (videoElement, onResults) => {
    console.log('[Vision] Starting FaceMesh initialization...');

    if (!videoElement) {
        console.error('[Vision] No video element provided');
        return null;
    }

    // Use global variables loaded via CDN in index.html
    const FaceMesh = window.FaceMesh;
    const Camera = window.Camera;

    if (!FaceMesh) {
        console.error("[Vision] FaceMesh not loaded from CDN");
        return null;
    }
    if (!Camera) {
        console.error("[Vision] Camera not loaded from CDN");
        return null;
    }

    console.log('[Vision] MediaPipe libraries loaded');

    try {
        faceMesh = new FaceMesh({
            locateFile: (file) => {
                console.log(`[Vision] Loading file: ${file}`);
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        console.log('[Vision] FaceMesh instance created');

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        console.log('[Vision] FaceMesh options set');

        // Wrap onResults with logging
        faceMesh.onResults((results) => {
            console.log('[Vision] onResults called, faces:', results.multiFaceLandmarks?.length || 0);
            if (onResults) {
                onResults(results);
            }
        });

        console.log('[Vision] onResults callback registered');

        if (videoElement) {
            camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (faceMesh) {
                        await faceMesh.send({ image: videoElement });
                    }
                },
                width: 640,
                height: 480
            });

            console.log('[Vision] Camera instance created, starting...');
            await camera.start();
            console.log('[Vision] Camera started successfully');
        }

        return { faceMesh, camera };

    } catch (error) {
        console.error('[Vision] Initialization error:', error);
        return null;
    }
};

export const stopVision = () => {
    if (camera) {
        camera.stop();
        camera = null;
    }
    if (faceMesh) {
        faceMesh.close();
        faceMesh = null;
    }
};

/**
 * Detect if child is looking at camera and head movement
 * Uses MediaPipe FaceMesh iris landmarks (468-477) for gaze detection
 * 
 * @param {Array} landmarks - Current frame landmarks (478 points)
 * @param {Array|null} previousLandmarks - Previous frame landmarks for movement detection
 * @param {Object} thresholds - { gazeThreshold, movementThreshold }
 * @returns {Object} { faceDetected, isLookingAtCamera, gazeConfidence, headMovement, movementMagnitude }
 */
export const detectGazeAndMovement = (landmarks, previousLandmarks = null, thresholds = {}) => {
    const { gazeThreshold = 0.15, movementThreshold = 0.03 } = thresholds;

    if (!landmarks || landmarks.length < 478) {
        return {
            faceDetected: false,
            isLookingAtCamera: false,
            gazeConfidence: 0,
            headMovement: false,
            movementMagnitude: 0,
        };
    }

    // MediaPipe FaceMesh iris landmarks:
    // Left iris: 468-472 (center = 468)
    // Right iris: 473-477 (center = 473)
    // Eye corners: Left eye inner/outer = 133/33, Right eye inner/outer = 362/263

    const leftIrisCenter = landmarks[468];
    const rightIrisCenter = landmarks[473];
    const leftEyeInner = landmarks[133];
    const leftEyeOuter = landmarks[33];
    const rightEyeInner = landmarks[362];
    const rightEyeOuter = landmarks[263];

    // Calculate gaze direction for each eye
    // When looking at camera: iris is centered between inner/outer corners
    // Offset = (irisX - eyeCenter) / eyeWidth

    const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
    const leftEyeCenter = (leftEyeOuter.x + leftEyeInner.x) / 2;
    const leftGazeOffset = Math.abs(leftIrisCenter.x - leftEyeCenter) / leftEyeWidth;

    const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
    const rightEyeCenter = (rightEyeOuter.x + rightEyeInner.x) / 2;
    const rightGazeOffset = Math.abs(rightIrisCenter.x - rightEyeCenter) / rightEyeWidth;

    // Average gaze offset (0 = looking straight, higher = looking away)
    const avgGazeOffset = (leftGazeOffset + rightGazeOffset) / 2;

    // Looking at camera if gaze offset is below threshold
    const isLookingAtCamera = avgGazeOffset < gazeThreshold;
    const gazeConfidence = Math.max(0, 1 - (avgGazeOffset / gazeThreshold));

    // Head movement detection
    let headMovement = false;
    let movementMagnitude = 0;

    if (previousLandmarks && previousLandmarks.length >= 478) {
        // Use nose tip (landmark 1) as reference point for head position
        const currentNose = landmarks[1];
        const previousNose = previousLandmarks[1];

        movementMagnitude = Math.sqrt(
            Math.pow(currentNose.x - previousNose.x, 2) +
            Math.pow(currentNose.y - previousNose.y, 2)
        );

        headMovement = movementMagnitude > movementThreshold;
    }

    return {
        faceDetected: true,
        isLookingAtCamera,
        gazeConfidence,
        headMovement,
        movementMagnitude,
    };
};

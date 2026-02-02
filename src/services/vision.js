 
 

let faceMesh = null;
let camera = null;

export const initializeFaceMesh = async (videoElement, onResults) => {
    if (!videoElement) {
        console.error('[Vision] No video element provided');
        return null;
    }

     
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

    try {
        faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results) => {
            if (onResults) {
                onResults(results);
            }
        });

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

            await camera.start();
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

     
     
     
     

    const leftIrisCenter = landmarks[468];
    const rightIrisCenter = landmarks[473];
    const leftEyeInner = landmarks[133];
    const leftEyeOuter = landmarks[33];
    const rightEyeInner = landmarks[362];
    const rightEyeOuter = landmarks[263];

     
     
     

    const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
    const leftEyeCenter = (leftEyeOuter.x + leftEyeInner.x) / 2;
    const leftGazeOffset = Math.abs(leftIrisCenter.x - leftEyeCenter) / leftEyeWidth;

    const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
    const rightEyeCenter = (rightEyeOuter.x + rightEyeInner.x) / 2;
    const rightGazeOffset = Math.abs(rightIrisCenter.x - rightEyeCenter) / rightEyeWidth;

     
    const avgGazeOffset = (leftGazeOffset + rightGazeOffset) / 2;

     
    const isLookingAtCamera = avgGazeOffset < gazeThreshold;
    const gazeConfidence = Math.max(0, 1 - (avgGazeOffset / gazeThreshold));

     
    let headMovement = false;
    let movementMagnitude = 0;

    if (previousLandmarks && previousLandmarks.length >= 478) {
         
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

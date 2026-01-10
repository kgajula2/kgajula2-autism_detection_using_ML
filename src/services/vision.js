// import { FaceMesh } from '@mediapipe/face_mesh';
// import { Camera } from '@mediapipe/camera_utils';

let faceMesh = null;
let camera = null;

export const initializeFaceMesh = (videoElement, onResults) => {
    if (!videoElement) return;

    // Use global variables loaded via CDN in index.html
    const FaceMesh = window.FaceMesh;
    const Camera = window.Camera;

    if (!FaceMesh || !Camera) {
        console.error("Mediapipe libraries not loaded. Check index.html scripts.");
        return;
    }

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

    faceMesh.onResults(onResults);

    if (videoElement) {
        camera = new Camera(videoElement, {
            onFrame: async () => {
                await faceMesh.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });
        camera.start();
    }

    return { faceMesh, camera };
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

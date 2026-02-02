 

 
export const ASSET_MANIFEST = {
    images: {
        'apple': { path: '/images/apple.png', required: true },
        'banana': { path: '/images/banana.png', required: true },
        'cat': { path: '/images/cat.png', required: true },
        'dog': { path: '/images/dog.png', required: true },
        'car': { path: '/images/car.png', required: true },
    },
    models: {
        'ml_weights': { path: '/models/model_weights.json', required: true },
    },
};

 
export const getAssetPath = (category, key) => {
    const asset = ASSET_MANIFEST[category]?.[key];
    if (!asset) {
        console.warn(`Asset not found: ${category}/${key}`);
        return null;
    }
    return asset.path;
};

 
export const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ src, status: 'loaded' });
        img.onerror = () => reject({ src, status: 'error' });
        img.src = src;
    });
};

 
export const preloadImages = async (sources, onProgress) => {
    const results = {
        success: [],
        failed: [],
    };

    let loaded = 0;
    const total = sources.length;

    for (const src of sources) {
        try {
            await preloadImage(src);
            results.success.push(src);
        } catch {
            results.failed.push(src);
            console.warn(`Failed to preload image: ${src}`);
        }

        loaded++;
        onProgress?.({
            loaded,
            total,
            percent: Math.round((loaded / total) * 100),
        });
    }

    return results;
};

 
export const preloadRequiredAssets = async (onProgress) => {
    const requiredImages = Object.values(ASSET_MANIFEST.images)
        .filter(asset => asset.required)
        .map(asset => asset.path);

    return preloadImages(requiredImages, onProgress);
};

 
export const validateAssets = async () => {
    const missing = [];

    for (const [key, asset] of Object.entries(ASSET_MANIFEST.images)) {
        if (asset.required) {
            try {
                await preloadImage(asset.path);
            } catch {
                missing.push(key);
            }
        }
    }

    return {
        valid: missing.length === 0,
        missing,
    };
};

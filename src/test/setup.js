import '@testing-library/jest-dom';

 
vi.mock('../services/firebase', () => ({
    app: {},
    analytics: {},
    auth: {},
    db: {},
    storage: {},
    getGeminiModel: vi.fn(() => ({
        generateContent: vi.fn().mockResolvedValue({
            response: { text: () => 'Test AI response' }
        })
    }))
}));

 
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({
        currentUser: { uid: 'test-user-123', displayName: 'Test User' }
    })),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback({ uid: 'test-user-123', displayName: 'Test User' });
        return () => { };
    })
}));

 
global.FaceMesh = vi.fn();
global.Camera = vi.fn();

 
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

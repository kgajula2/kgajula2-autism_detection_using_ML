import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { MainLayout } from "./components/layout/MainLayout";
import { Login } from "./pages/Login";
import { LandingPage } from "./pages/LandingPage";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

// Lazy load heavy components to reduce initial bundle size
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const GameSelection = lazy(() => import("./pages/GameSelection").then(m => ({ default: m.GameSelection })));
const Onboarding = lazy(() => import("./pages/Onboarding"));

// Lazy load game components (largest chunks)
const ColorFocusGame = lazy(() => import("./games/color-focus/ColorFocusGame"));
const RoutineSequencerGame = lazy(() => import("./games/routine-sequencer/RoutineSequencerGame"));
const EmotionMirrorGame = lazy(() => import("./games/emotion-mirror/EmotionMirrorGame"));
const ObjectIdGame = lazy(() => import("./games/object-id/ObjectIdGame"));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - Wrapped in Suspense for lazy loading */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Onboarding />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/home" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <GameSelection />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          } />

          {/* Game Routes - Lazy loaded for performance */}
          <Route path="/game/color-focus" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ColorFocusGame />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/game/routine-sequencer" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <RoutineSequencerGame />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/game/emotion-mirror" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <EmotionMirrorGame />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/game/object-id" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ObjectIdGame />
              </Suspense>
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

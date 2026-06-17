import SignInPage from "./features/auth/pages/signIn";
import SignUpPage from "./features/auth/pages/signUp";
import Dashboard from "./features/dashboard/pages/Dashboard";
import LandingPage from "./features/landing/pages/LandingPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./features/upload/pages/UploadPage";
import VideosPage from "./features/videos/pages/VideosPage";
import VideoDetailsPage from "./features/videos/pages/VideoDetailsPage";
import StudioPage from "./features/studio/pages/StudioPage";
import Settings from "./features/settings/pages/Settings";
import { useDispatch } from "react-redux";
import { getCurrentUser } from "./features/auth/authSlice";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";
import { useEffect } from "react";
import DeveloperConsole from "./features/developer/pages/DeveloperConsole";

function App() {

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  return (
    <div className='min-h-screen bg-background text-foreground selection:bg-primary/30'>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/auth/signin" element={<SignInPage />} />

          <Route path="/auth/signup" element={<SignUpPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
             <Dashboard />
            </ProtectedRoute>
            } />

         
          <Route path="/upload" element={
            <ProtectedRoute>
              <UploadPage />
             </ProtectedRoute> } />

          <Route path="/videos" element={
            <ProtectedRoute><VideosPage />
            </ProtectedRoute>} />

          <Route path="/videos/:id" element={
            <ProtectedRoute>
            <VideoDetailsPage />
            </ProtectedRoute>} />

          <Route path="/studio/:id" element={
            <ProtectedRoute>
               <StudioPage />
              </ProtectedRoute>} />

          <Route path="/settings" element={
            <ProtectedRoute><Settings />
            </ProtectedRoute>} />


            <Route path="/developer" element={
            <ProtectedRoute>
              <DeveloperConsole />
            </ProtectedRoute>
          } />

  
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
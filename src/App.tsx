import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HomeHero from './pages/HomeHero';
import SmartPivotPage from './pages/SmartPivotPage';
import FeedbackPage from './pages/FeedbackPage';
import ReviewsPage from './pages/ReviewsPage';

function App() {
  return (
    <>
      <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<HomeHero />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/smart-pivot" element={<SmartPivotPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/app/*" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;

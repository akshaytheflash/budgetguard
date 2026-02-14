import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import BudgetSetup from './components/BudgetSetup';
import Dashboard from './components/Dashboard';
import Home from './pages/Home';
import Activity from './pages/Activity';
import Rewards from './pages/Rewards';
import Premium from './pages/Premium';
import Security from './pages/Security';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (token) {
      checkBudgetStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkBudgetStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard?token=${token}`);
      if (!response.ok) {
        // Invalid token
        handleLogout();
        return;
      }
      const data = await response.json();
      setIsSetup(data.monthly_budget > 0);
    } catch (error) {
      console.error('Failed to check budget status:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newToken, hasBudget) => {
    setToken(newToken);
    setUsername(localStorage.getItem('username'));
    setIsSetup(hasBudget);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    setIsSetup(false);
  };

  const handleBudgetSetup = async (budgetData) => {
    try {
      await fetch(`${API_URL}/set_budget?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData)
      });
      setIsSetup(true);
    } catch (error) {
      console.error('Failed to set budget:', error);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'inline-block', fontSize: '48px' }}
        >
          💰
        </motion.div>
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  // Auth Flow
  if (!token) {
    return (
      <div className="app">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  if (!isSetup) {
    return (
      <div className="app">
        <BudgetSetup onComplete={handleBudgetSetup} />
      </div>
    );
  }

  // Dashboard & Routes
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard token={token} username={username} onLogout={handleLogout} />}>
          <Route index element={<Home />} />
          <Route path="activity" element={<Activity />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="premium" element={<Premium />} />
          <Route path="security" element={<Security />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;

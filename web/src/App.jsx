import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import BudgetSetup from './components/BudgetSetup';
import Dashboard from './components/Dashboard';
import './index.css';

const API_URL = 'http://localhost:8000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {!token ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Login onLogin={handleLogin} />
          </motion.div>
        ) : !isSetup ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BudgetSetup onComplete={handleBudgetSetup} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard
              token={token}
              username={username}
              onLogout={handleLogout}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

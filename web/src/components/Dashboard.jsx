import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import {
    TrendingUp,
    Shield,
    CheckCircle,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import Navbar from './Navbar';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Dashboard({ token, username, onLogout }) {
    const [userData, setUserData] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDesc, setPaymentDesc] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [emergencyPin, setEmergencyPin] = useState('');
    const [useEmergency, setUseEmergency] = useState(false);
    const [pinError, setPinError] = useState('');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const location = useLocation();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await fetch(`${API_URL}/dashboard?token=${token}`);
            const data = await response.json();
            setUserData(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    };

    const simulatePayment = async () => {
        if (!paymentAmount) return;

        try {
            const response = await fetch(`${API_URL}/simulate_payment?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(paymentAmount),
                    description: paymentDesc || 'Payment',
                    use_emergency: useEmergency,
                    emergency_pin: useEmergency ? emergencyPin : null
                })
            });

            if (!response.ok) {
                if (response.status === 403) {
                    setPinError('Incorrect PIN. Please try again.');
                    setEmergencyPin('');
                    return;
                }
            }

            const data = await response.json();
            setPrediction(data);
            setShowResult(true);

            if (data.requires_pin && !useEmergency) {
                setUseEmergency(true);
            }
        } catch (error) {
            console.error('Failed to simulate payment:', error);
        }
    };

    const resetState = () => {
        setShowPaymentModal(false);
        setShowAddExpense(false);
        setShowResult(false);
        setPrediction(null);
        setPinError('');
        setPaymentAmount('');
        setPaymentDesc('');
        setUseEmergency(false);
        setEmergencyPin('');
    };

    const approvePayment = async () => {
        try {
            const url = new URL(`${API_URL}/add_transaction`, window.location.origin);

            url.searchParams.append('token', token);
            if (emergencyPin) {
                url.searchParams.append('emergency_pin', emergencyPin);
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(paymentAmount),
                    description: paymentDesc || 'Payment'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 403) {
                    // PIN required
                    if (emergencyPin || useEmergency) {
                        setPinError('Incorrect PIN. Please try again.');
                        setEmergencyPin('');
                    } else {
                        setUseEmergency(true);
                    }
                    return;
                }
                throw new Error(error.detail || 'Failed to add transaction');
            }

            resetState();
            loadDashboard();
        } catch (error) {
            console.error('Failed to add transaction:', error);
            alert(error.message);
        }
    };

    const markTransaction = async (transactionId, isUseful) => {
        try {
            await fetch(`${API_URL}/mark_transaction?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_id: transactionId,
                    is_useful: isUseful
                })
            });
            loadDashboard();
        } catch (error) {
            console.error('Failed to mark transaction:', error);
        }
    };

    const addManualExpense = async (e) => {
        e.preventDefault();
        await approvePayment();
    };

    if (!userData) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}
                >
                    <TrendingUp size={48} color="var(--primary-start)" />
                </motion.div>
                <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading...</p>
            </div>
        );
    }

    const requiresPin = userData && paymentAmount && (parseFloat(paymentAmount) > userData.budget_remaining);

    return (
        <div className="container">
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    <Outlet context={{
                        userData,
                        token,
                        username,
                        theme,
                        toggleTheme,
                        onLogout,
                        loadDashboard,
                        setShowPaymentModal,
                        setShowAddExpense,
                        markTransaction
                    }} />
                </motion.div>
            </AnimatePresence>

            <Navbar />

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => !showResult && resetState()}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!showResult ? (
                                <>
                                    <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>
                                        Simulate Payment
                                    </h2>

                                    <div className="input-group">
                                        <label className="input-label">Amount</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{
                                                position: 'absolute',
                                                left: '20px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                fontSize: '20px',
                                                color: 'var(--text-secondary)'
                                            }}>$</span>
                                            <input
                                                type="number"
                                                className="input-field"
                                                style={{ paddingLeft: '40px', fontSize: '20px', fontWeight: '600' }}
                                                placeholder="50.00"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Description</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Coffee, groceries, etc."
                                            value={paymentDesc}
                                            onChange={(e) => setPaymentDesc(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                        <button
                                            className="btn btn-outline"
                                            onClick={resetState}
                                            style={{ flex: 1 }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={simulatePayment}
                                            style={{ flex: 1 }}
                                        >
                                            Check Payment
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <PaymentResult
                                    prediction={prediction}
                                    onApprove={approvePayment}
                                    onCancel={resetState}
                                    onUseEmergency={() => setUseEmergency(true)}
                                    useEmergency={useEmergency}
                                    emergencyPin={emergencyPin}
                                    setEmergencyPin={(val) => {
                                        setEmergencyPin(val);
                                        setPinError('');
                                    }}
                                    simulatePayment={simulatePayment}
                                    pinError={pinError}
                                />
                            )}
                        </motion.div>
                    </motion.div>
                )}

                {showAddExpense && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={resetState}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>
                                Add Manual Expense
                            </h2>

                            <form onSubmit={addManualExpense}>
                                <div className="input-group">
                                    <label className="input-label">Amount</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: '20px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '20px',
                                            color: 'var(--text-secondary)'
                                        }}>$</span>
                                        <input
                                            type="number"
                                            className="input-field"
                                            style={{ paddingLeft: '40px', fontSize: '20px', fontWeight: '600' }}
                                            placeholder="50.00"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Description</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="What did you spend on?"
                                        value={paymentDesc}
                                        onChange={(e) => setPaymentDesc(e.target.value)}
                                        required
                                    />
                                </div>

                                <AnimatePresence>
                                    {(requiresPin || useEmergency) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="input-group"
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{ height: '16px' }} /> {/* Gap */}
                                            <label className="input-label" style={{ color: 'var(--warning)' }}>
                                                Emergency PIN Required
                                            </label>
                                            <input
                                                type="password"
                                                className="input-field"
                                                style={{
                                                    letterSpacing: '8px',
                                                    textAlign: 'center',
                                                    fontSize: '20px',
                                                    borderColor: pinError ? 'var(--danger)' : 'var(--warning)'
                                                }}
                                                placeholder="••••"
                                                value={emergencyPin}
                                                onChange={(e) => {
                                                    setEmergencyPin(e.target.value);
                                                    setPinError('');
                                                }}
                                                maxLength="6"
                                                required
                                            />
                                            {pinError && (
                                                <p style={{ fontSize: '14px', color: 'var(--danger)', marginTop: '8px', fontWeight: 'bold' }}>
                                                    {pinError}
                                                </p>
                                            )}
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                                Amount exceeds remaining budget. Authorization required.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={resetState}
                                        style={{ flex: 1 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        Add Expense
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PaymentResult({ prediction, onApprove, onCancel, onUseEmergency, useEmergency, emergencyPin, setEmergencyPin, simulatePayment, pinError }) {
    const decision = prediction?.decision;
    const isBlocked = decision === 'BLOCKED';
    const isWarning = decision === 'WARNING';
    const isSafe = decision === 'SAFE';

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
        >
            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: isSafe ? 'var(--gradient-success)' : isWarning ? 'var(--gradient-warning)' : 'var(--gradient-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto'
                    }}
                >
                    {isSafe && <CheckCircle size={40} color="white" />}
                    {isWarning && <AlertTriangle size={40} color="white" />}
                    {isBlocked && <XCircle size={40} color="white" />}
                </motion.div>
            </div>

            {/* Title */}
            <h2 style={{
                fontSize: '28px',
                fontWeight: '800',
                textAlign: 'center',
                marginBottom: '12px',
                color: isSafe ? 'var(--success)' : isWarning ? 'var(--warning)' : 'var(--danger)'
            }}>
                {isSafe && 'Payment Approved'}
                {isWarning && 'Warning!'}
                {isBlocked && 'Payment Blocked'}
            </h2>

            {/* Explanation */}
            <p style={{
                textAlign: 'center',
                color: 'var(--text-secondary)',
                marginBottom: '24px',
                fontSize: '16px'
            }}>
                {prediction?.explanation}
            </p>

            {/* Stats */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Predicted Spend</span>
                    <span style={{ fontWeight: '700' }}>${prediction?.predicted_spend?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Budget Usage</span>
                    <span style={{ fontWeight: '700', color: prediction?.budget_usage_percent > 85 ? 'var(--danger)' : 'var(--success)' }}>
                        {prediction?.budget_usage_percent}%
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Remaining</span>
                    <span style={{ fontWeight: '700' }}>${prediction?.budget_remaining?.toFixed(2)}</span>
                </div>
            </div>

            {/* Emergency Override */}
            {isBlocked && !useEmergency && (
                <button
                    className="btn btn-warning"
                    onClick={onUseEmergency}
                    style={{ width: '100%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <Shield size={20} />
                    Use Emergency Fund
                </button>
            )}

            {useEmergency && (
                <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label className="input-label">Enter Emergency PIN</label>
                    <input
                        type="password"
                        className="input-field"
                        style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '20px' }}
                        placeholder="••••"
                        value={emergencyPin}
                        onChange={(e) => setEmergencyPin(e.target.value)}
                        maxLength="6"
                    />
                    {pinError && (
                        <p style={{ fontSize: '14px', color: 'var(--danger)', marginTop: '8px', fontWeight: 'bold' }}>
                            {pinError}
                        </p>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={simulatePayment}
                        style={{ width: '100%', marginTop: '12px' }}
                    >
                        Verify PIN
                    </button>
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    className="btn btn-outline"
                    onClick={onCancel}
                    style={{ flex: 1 }}
                >
                    Cancel
                </button>
                {(isSafe || isWarning) && (
                    <button
                        className="btn btn-primary"
                        onClick={onApprove}
                        style={{ flex: 1 }}
                    >
                        {isWarning ? 'Proceed Anyway' : 'Confirm Payment'}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

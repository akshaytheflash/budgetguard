import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    DollarSign,
    Shield,
    Plus,
    CreditCard,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Lock,
    LogOut,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:8000';

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

    const approvePayment = async () => {
        try {
            const url = new URL(`${API_URL}/add_transaction`);
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

            setShowPaymentModal(false);
            setShowAddExpense(false);
            setShowResult(false);
            setPrediction(null);
            setPinError('');
            setPaymentAmount('');
            setPaymentDesc('');
            setUseEmergency(false);
            setEmergencyPin('');
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
        setShowAddExpense(false);
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

    const budgetUsage = userData.budget_usage_percent;

    // Format chart data for transaction-level graph
    const chartData = userData.chart_data.map((point, index) => ({
        index: index + 1,
        amount: point.amount,
        timestamp: new Date(point.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }));

    return (
        <div className="container">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>
                        BudgetGuard
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
                        Welcome back, {username}!
                    </p>
                </div>
                <button
                    className="btn btn-outline"
                    onClick={onLogout}
                    style={{ fontSize: '14px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-3" style={{ marginBottom: '32px' }}>
                {/* Budget Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="gradient-card"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <DollarSign size={24} />
                        <span style={{ fontSize: '14px', opacity: 0.9 }}>Monthly Budget</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>
                        ${userData.monthly_budget.toLocaleString()}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '14px', opacity: 0.9 }}>
                        ${userData.current_spend.toLocaleString()} spent
                    </div>
                    <div className="progress-bar" style={{ marginTop: '12px', background: 'rgba(255,255,255,0.2)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(budgetUsage, 100)}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            style={{
                                height: '100%',
                                background: budgetUsage > 85 ? 'var(--danger)' : 'white',
                                borderRadius: '8px'
                            }}
                        />
                    </div>
                </motion.div>

                {/* Remaining Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <TrendingUp size={24} color={userData.budget_remaining > 0 ? 'var(--success)' : 'var(--danger)'} />
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {userData.budget_remaining > 0 ? 'Remaining' : 'Over Budget'}
                        </span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: userData.budget_remaining > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        ${userData.budget_remaining.toLocaleString()}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {budgetUsage.toFixed(1)}% used
                    </div>
                </motion.div>

                {/* Emergency Fund Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <Shield size={24} color="var(--warning)" />
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Emergency Fund</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>
                        ${userData.emergency_fund.toLocaleString()}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Protected savings
                    </div>
                </motion.div>
            </div >

            {/* Chart - Transaction Level */}
            {
                chartData.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card"
                        style={{ marginBottom: '32px' }}
                    >
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                            Cumulative Spending (Transaction-Level)
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis
                                    dataKey="index"
                                    stroke="var(--text-secondary)"
                                    label={{ value: 'Transaction #', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px'
                                    }}
                                    formatter={(value) => [`$${value.toFixed(2)}`, 'Cumulative']}
                                    labelFormatter={(label) => `Transaction #${label}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="var(--primary-start)"
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--primary-start)', r: 5 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>
                )
            }

            {/* Action Buttons */}
            <div className="grid grid-2" style={{ marginBottom: '32px' }}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn btn-primary"
                    onClick={() => setShowPaymentModal(true)}
                    style={{ padding: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                >
                    <CreditCard size={24} />
                    Simulate Payment
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn btn-outline"
                    onClick={() => setShowAddExpense(true)}
                    style={{ padding: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                >
                    <Plus size={24} />
                    Add Expense
                </motion.button>
            </div>

            {/* Recent Transactions with Useful/Useless Marking */}
            {
                userData.transactions && userData.transactions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card"
                    >
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
                            Recent Transactions
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {userData.transactions.slice().reverse().map((txn) => (
                                <div
                                    key={txn.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px',
                                        background: 'var(--bg-card)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)'
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600' }}>{txn.description}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {new Date(txn.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--danger)' }}>
                                            -${txn.amount.toFixed(2)}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => markTransaction(txn.id, true)}
                                                style={{
                                                    background: txn.is_useful === 1 ? 'var(--success)' : 'var(--bg-card)',
                                                    border: `1px solid ${txn.is_useful === 1 ? 'var(--success)' : 'var(--border)'}`,
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Mark as useful"
                                            >
                                                <ThumbsUp size={16} color={txn.is_useful === 1 ? 'white' : 'var(--text-secondary)'} />
                                            </button>
                                            <button
                                                onClick={() => markTransaction(txn.id, false)}
                                                style={{
                                                    background: txn.is_useful === 0 ? 'var(--danger)' : 'var(--bg-card)',
                                                    border: `1px solid ${txn.is_useful === 0 ? 'var(--danger)' : 'var(--border)'}`,
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Mark as useless"
                                            >
                                                <ThumbsDown size={16} color={txn.is_useful === 0 ? 'white' : 'var(--text-secondary)'} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )
            }

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => !showResult && setShowPaymentModal(false)}
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
                                            onClick={() => setShowPaymentModal(false)}
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
                                    onCancel={() => {
                                        setShowPaymentModal(false);
                                        setShowResult(false);
                                        setPrediction(null);
                                        setPinError('');
                                    }}
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
                        onClick={() => setShowAddExpense(false)}
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

                                {useEmergency && (
                                    <div className="input-group">
                                        <label className="input-label">Emergency PIN Required</label>
                                        <input
                                            type="password"
                                            className="input-field"
                                            style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '20px' }}
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
                                            This expense requires emergency fund approval
                                        </p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setShowAddExpense(false);
                                            setUseEmergency(false);
                                            setEmergencyPin('');
                                        }}
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
        </div >
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
                    <Lock size={20} />
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

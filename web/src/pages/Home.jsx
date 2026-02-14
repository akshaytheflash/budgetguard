import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    DollarSign,
    Shield,
    Plus,
    CreditCard,
    Sun,
    Moon,
    LogOut,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';

export default function Home() {
    const {
        userData,
        username,
        theme,
        toggleTheme,
        onLogout,
        setShowPaymentModal,
        setShowAddExpense,
        markTransaction
    } = useOutletContext();

    const budgetUsage = userData.budget_usage_percent;

    return (
        <div className="page-content" style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="/logo.png" alt="BudgetGuard Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                        BudgetGuard
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
                        Welcome back, {username}!
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-outline"
                        onClick={toggleTheme}
                        style={{ fontSize: '14px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {theme === 'dark' ? 'Light' : 'Dark'}
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={onLogout}
                        style={{ fontSize: '14px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
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
            </div>

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

            {/* Recent Transactions */}
            {userData.transactions && userData.transactions.length > 0 && (
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
                        {userData.transactions.slice().reverse().slice(0, 5).map((txn) => (
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
            )}
        </div>
    );
}

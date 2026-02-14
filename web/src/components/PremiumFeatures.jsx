import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, TrendingUp, DollarSign, PieChart, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function PremiumFeatures({ token, isPremium, onUpgrade }) {
    const [showModal, setShowModal] = useState(false);
    const [showAdvice, setShowAdvice] = useState(false);
    const [advice, setAdvice] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        try {
            const response = await fetch(`${API_URL}/upgrade_premium?token=${token}`, {
                method: 'POST'
            });

            if (response.ok) {
                onUpgrade();
                setShowModal(false);
            }
        } catch (error) {
            console.error('Upgrade error:', error);
        }
    };

    const getAIAdvice = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/ai_advisor?token=${token}`, {
                method: 'POST'
            });

            const data = await response.json();
            setAdvice(data);
            setShowAdvice(true);
        } catch (error) {
            console.error('AI advice error:', error);
            alert('Failed to get AI advice');
        } finally {
            setLoading(false);
        }
    };

    if (!isPremium) {
        return (
            <>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="gradient-card"
                    onClick={() => setShowModal(true)}
                    style={{
                        cursor: 'pointer',
                        border: 'none',
                        width: '100%',
                        minHeight: '140px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '24px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Crown size={32} />
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: '800' }}>Upgrade to Premium</div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Unlock AI Investment Advisor</div>
                        </div>
                    </div>
                </motion.button>

                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="modal-overlay"
                            onClick={() => setShowModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="modal-content"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <Crown size={64} color="var(--warning)" style={{ marginBottom: '16px' }} />

                                    <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>
                                        Go Premium
                                    </h2>

                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                        Unlock powerful AI-driven investment insights
                                    </p>

                                    <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                                        <div style={{
                                            padding: '16px',
                                            background: 'var(--bg-card)',
                                            borderRadius: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <TrendingUp size={20} color="var(--success)" />
                                                <span style={{ fontWeight: '600' }}>AI Investment Advisor</span>
                                            </div>
                                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '32px' }}>
                                                Get personalized SIP and ETF recommendations
                                            </p>
                                        </div>

                                        <div style={{
                                            padding: '16px',
                                            background: 'var(--bg-card)',
                                            borderRadius: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <DollarSign size={20} color="var(--success)" />
                                                <span style={{ fontWeight: '600' }}>Smart Savings Plans</span>
                                            </div>
                                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '32px' }}>
                                                AI-powered emergency fund planning
                                            </p>
                                        </div>

                                        <div style={{
                                            padding: '16px',
                                            background: 'var(--bg-card)',
                                            borderRadius: '12px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <PieChart size={20} color="var(--success)" />
                                                <span style={{ fontWeight: '600' }}>Portfolio Insights</span>
                                            </div>
                                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '32px' }}>
                                                Advanced analytics and predictions
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => setShowModal(false)}
                                            style={{ flex: 1 }}
                                        >
                                            Maybe Later
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleUpgrade}
                                            style={{ flex: 1 }}
                                        >
                                            Upgrade Now (Free)
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <>
            <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Crown size={24} color="var(--warning)" />
                    <span style={{ fontSize: '18px', fontWeight: '700' }}>Premium Features</span>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={getAIAdvice}
                    disabled={loading}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <TrendingUp size={20} />
                    {loading ? 'Generating Advice...' : 'Get AI Investment Advice'}
                </button>
            </div>

            <AnimatePresence>
                {showAdvice && advice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setShowAdvice(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            style={{ maxWidth: '600px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
                                    🤖 AI Investment Advisor
                                </h2>
                                <button
                                    onClick={() => setShowAdvice(false)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
                                {advice.summary}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                {advice.recommendations.map((rec, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        style={{
                                            padding: '16px',
                                            background: 'var(--bg-card)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '16px' }}>{rec.title}</div>
                                            <span className={`badge ${rec.risk === 'Low' ? 'badge-safe' :
                                                rec.risk === 'Medium' ? 'badge-warning' :
                                                    'badge-blocked'
                                                }`}>
                                                {rec.risk} Risk
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                            {rec.description}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            <div style={{
                                padding: '12px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid var(--warning)',
                                marginBottom: '16px'
                            }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    ⚠️ {advice.disclaimer}
                                </p>
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAdvice(false)}
                                style={{ width: '100%' }}
                            >
                                Got It
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

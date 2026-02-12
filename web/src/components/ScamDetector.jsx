import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function ScamDetector({ token }) {
    const [showModal, setShowModal] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const checkScam = async () => {
        if (!messageText.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/check_scam?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_text: messageText })
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Scam check error:', error);
            alert('Failed to check message');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        if (level === 'HIGH') return 'var(--danger)';
        if (level === 'MEDIUM') return 'var(--warning)';
        return 'var(--success)';
    };

    const getRiskIcon = (level) => {
        if (level === 'HIGH') return <XCircle size={48} />;
        if (level === 'MEDIUM') return <AlertTriangle size={48} />;
        return <CheckCircle size={48} />;
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-outline"
                onClick={() => setShowModal(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%'
                }}
            >
                <Shield size={20} />
                Scam Detector
            </motion.button>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => {
                            setShowModal(false);
                            setResult(null);
                            setMessageText('');
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!result ? (
                                <>
                                    <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>
                                        🛡️ Scam Detector
                                    </h2>

                                    <div className="input-group">
                                        <label className="input-label">Paste Message or SMS</label>
                                        <textarea
                                            className="input-field"
                                            style={{ minHeight: '150px', resize: 'vertical' }}
                                            placeholder="Paste suspicious message here..."
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => {
                                                setShowModal(false);
                                                setMessageText('');
                                            }}
                                            style={{ flex: 1 }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={checkScam}
                                            disabled={loading || !messageText.trim()}
                                            style={{ flex: 1 }}
                                        >
                                            {loading ? 'Analyzing...' : 'Check Message'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{ textAlign: 'center' }}
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.2 }}
                                        style={{
                                            marginBottom: '24px',
                                            color: getRiskColor(result.risk_level)
                                        }}
                                    >
                                        {getRiskIcon(result.risk_level)}
                                    </motion.div>

                                    <div className={`badge ${result.risk_level === 'HIGH' ? 'badge-blocked' :
                                            result.risk_level === 'MEDIUM' ? 'badge-warning' :
                                                'badge-safe'
                                        }`} style={{ marginBottom: '16px' }}>
                                        {result.risk_level} RISK
                                    </div>

                                    <div style={{
                                        fontSize: '48px',
                                        fontWeight: '800',
                                        marginBottom: '8px',
                                        color: getRiskColor(result.risk_level)
                                    }}>
                                        {result.risk_score}%
                                    </div>

                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        marginBottom: '24px',
                                        lineHeight: '1.6'
                                    }}>
                                        {result.explanation}
                                    </p>

                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setShowModal(false);
                                            setResult(null);
                                            setMessageText('');
                                        }}
                                        style={{ width: '100%' }}
                                    >
                                        Done
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

            {showModal && createPortal(
                <AnimatePresence>
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
                                >
                                    {/* Header with Icon and Risk Level */}
                                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.2 }}
                                            style={{
                                                marginBottom: '16px',
                                                color: getRiskColor(result.risk_level),
                                                display: 'flex',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {getRiskIcon(result.risk_level)}
                                        </motion.div>

                                        <div className={`badge ${result.risk_level === 'HIGH' ? 'badge-blocked' :
                                            result.risk_level === 'MEDIUM' ? 'badge-warning' :
                                                'badge-safe'
                                            }`} style={{ marginBottom: '12px' }}>
                                            {result.risk_level} RISK
                                        </div>

                                        <div style={{
                                            fontSize: '56px',
                                            fontWeight: '800',
                                            marginBottom: '8px',
                                            background: `linear-gradient(135deg, ${getRiskColor(result.risk_level)}, ${getRiskColor(result.risk_level)}dd)`,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text'
                                        }}>
                                            {result.risk_score}%
                                        </div>

                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>
                                            Risk Score
                                        </p>
                                    </div>

                                    {/* AI Analysis Section */}
                                    <div style={{
                                        background: 'var(--bg-dark)',
                                        border: `2px solid ${getRiskColor(result.risk_level)}33`,
                                        borderRadius: '16px',
                                        padding: '20px',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '12px'
                                        }}>
                                            <MessageSquare size={20} style={{ color: getRiskColor(result.risk_level) }} />
                                            <h3 style={{
                                                fontSize: '16px',
                                                fontWeight: '700',
                                                color: 'var(--text-primary)',
                                                margin: 0
                                            }}>
                                                AI Analysis
                                            </h3>
                                        </div>
                                        <p style={{
                                            color: 'var(--text-primary)',
                                            lineHeight: '1.7',
                                            fontSize: '15px',
                                            margin: 0
                                        }}>
                                            {result.explanation}
                                        </p>
                                    </div>

                                    {/* Analyzed Message Preview */}
                                    <div style={{
                                        background: 'var(--bg-dark)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        marginBottom: '24px'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            marginBottom: '8px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            Analyzed Message
                                        </div>
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            margin: 0,
                                            maxHeight: '100px',
                                            overflowY: 'auto',
                                            fontStyle: 'italic'
                                        }}>
                                            "{messageText.length > 200 ? messageText.substring(0, 200) + '...' : messageText}"
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => {
                                                setResult(null);
                                            }}
                                            style={{ flex: 1 }}
                                        >
                                            Check Another
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                setShowModal(false);
                                                setResult(null);
                                                setMessageText('');
                                            }}
                                            style={{ flex: 1 }}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

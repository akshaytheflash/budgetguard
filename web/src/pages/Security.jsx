import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import ScamDetector from '../components/ScamDetector';

export default function Security() {
    const { token, userData } = useOutletContext();

    return (
        <div className="page-content" style={{ paddingBottom: '100px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={32} color="var(--primary-start)" />
                Security Center
            </h1>

            {/* Scam Detector */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: '32px' }}
            >
                <div className="glass-card" style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                            <AlertTriangle size={24} color="var(--danger)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>SMS Scam Detector</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Paste suspicious messages below to analyze them with AI.
                            </p>
                        </div>
                    </div>
                    <ScamDetector token={token} />
                </div>
            </motion.div>

            {/* Emergency Fund Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="gradient-card"
                style={{ marginBottom: '32px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Lock size={24} />
                    <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Emergency Protection</h2>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '14px', opacity: 0.9 }}>Current Fund Balance</p>
                        <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px' }}>
                            ${userData.emergency_fund.toLocaleString()}
                        </h3>
                    </div>
                    {userData.emergency_fund > 0 ? (
                        <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                            Active
                        </div>
                    ) : (
                        <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                            Empty
                        </div>
                    )}
                </div>
                <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.9 }}>
                    Your emergency fund is protected by a PIN code to prevent impulsive spending.
                </p>
            </motion.div>

            {/* Security Tips */}
            <div className="grid grid-2" style={{ gap: '20px' }}>
                <div className="glass-card">
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
                        Did you know?
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Phishing attacks often use urgent language to trick you into acting quickly. Always verify the sender before clicking links within SMS or Email.
                    </p>
                </div>
            </div>
        </div>
    );
}

import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, CheckCircle } from 'lucide-react';
import PremiumFeatures from '../components/PremiumFeatures';

export default function Premium() {
    const { token, userData, loadDashboard } = useOutletContext();

    return (
        <div className="page-content" style={{ paddingBottom: '100px' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', marginBottom: '40px' }}
            >
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--gradient-warning)',
                    marginBottom: '16px',
                    boxShadow: '0 8px 16px rgba(255, 193, 7, 0.4)'
                }}>
                    <Crown size={32} color="white" />
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '800' }}>BudgetGuard Premium</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginTop: '8px' }}>
                    Unlock your full financial potential
                </p>
            </motion.div>

            {/* Premium Component */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: '40px' }}
            >
                <PremiumFeatures
                    token={token}
                    isPremium={userData.is_premium}
                    onUpgrade={loadDashboard}
                />
            </motion.div>

            {/* Features Grid */}
            {!userData.is_premium && (
                <div className="grid grid-2" style={{ gap: '20px' }}>
                    <div className="glass-card">
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Pro Features</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {[
                                'AI Investment Recommendations',
                                'Unlimited Budget Categories',
                                'Priority Support',
                                'Export Data to CSV'
                            ].map((feature, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                                    <CheckCircle size={16} color="var(--success)" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

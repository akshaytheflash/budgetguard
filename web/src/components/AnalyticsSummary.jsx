import { motion } from 'framer-motion';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

export default function AnalyticsSummary({ analytics }) {
    if (!analytics) return null;

    return (
        <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
                📈 Spending Analytics
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        padding: '16px',
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Calendar size={16} color="var(--primary-start)" />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avg Daily</span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-start)' }}>
                        ${analytics.avg_daily}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        padding: '16px',
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Calendar size={16} color="var(--success)" />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avg Weekly</span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)' }}>
                        ${analytics.avg_weekly}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        padding: '16px',
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <TrendingUp size={16} color="var(--warning)" />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Predicted Monthly</span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--warning)' }}>
                        ${analytics.predicted_monthly}
                    </div>
                </motion.div>
            </div>

            <div style={{
                marginTop: '16px',
                padding: '16px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        padding: '4px 8px',
                        background: 'var(--primary-start)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#fff'
                    }}>
                        {Math.round((analytics.days_passed / analytics.days_in_month) * 100)}%
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Month Progress
                    </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    Day {analytics.days_passed} <span style={{ color: 'var(--text-secondary)' }}>/ {analytics.days_in_month}</span>
                </div>
            </div>
        </div>
    );
}

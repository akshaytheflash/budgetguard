import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AnalyticsSummary from '../components/AnalyticsSummary';
import CategoryBreakdown from '../components/CategoryBreakdown';
import StreakHeatmap from '../components/StreakHeatmap';

export default function Activity() {
    const { userData } = useOutletContext();

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
        <div className="page-content" style={{ paddingBottom: '100px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '32px' }}>Activity & Analytics</h1>

            {/* Analytics Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: '32px' }}
            >
                <AnalyticsSummary analytics={userData.analytics} />
            </motion.div>

            {/* Chart - Transaction Level */}
            {chartData.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card"
                    style={{ marginBottom: '32px' }}
                >
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                        Cumulative Spending
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
            ) : (
                <div className="glass-card" style={{ marginBottom: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>No transaction data available yet.</p>
                </div>
            )}

            {/* Category Breakdown and Heatmap */}
            <div className="grid grid-2" style={{ marginBottom: '32px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <CategoryBreakdown analytics={userData.analytics} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <StreakHeatmap heatmapData={userData.heatmap_data || []} />
                </motion.div>
            </div>

            {/* Additional Info to flesh out the page */}
            <div className="glass-card">
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Spending Insights</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    Your spending patterns are analyzed to help you stay within budget.
                    The heatmap shows your most active spending days, while the breakdown helps you identify categories where you can save more.
                </p>
            </div>
        </div>
    );
}

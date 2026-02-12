import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function CategoryBreakdown({ analytics }) {
    const data = (analytics && analytics.category_breakdown && analytics.category_breakdown.length > 0)
        ? analytics.category_breakdown.map((item, index) => ({
            name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
            value: item.amount,
            percentage: item.percentage
        }))
        : [];

    return (
        <div className="glass-card" style={{ minHeight: '300px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
                📊 Spending by Category
            </h3>

            {data.length === 0 ? (
                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    No spending data yet
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => `$${value.toFixed(2)}`}
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                        {data.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    background: 'var(--bg-card)',
                                    borderRadius: '8px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: COLORS[index % COLORS.length]
                                    }} />
                                    <span style={{ fontSize: '14px' }}>{item.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700' }}>
                                        ${item.value.toFixed(2)}
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {item.percentage}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

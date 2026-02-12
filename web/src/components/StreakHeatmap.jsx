import { motion } from 'framer-motion';

export default function StreakHeatmap({ heatmapData }) {
    // Generate last 365 days
    const generateHeatmapGrid = () => {
        const today = new Date();
        const days = [];

        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dataPoint = heatmapData.find(d => d.date === dateStr);
            const count = dataPoint ? dataPoint.count : 0;

            days.push({
                date: dateStr,
                count: count,
                day: date.getDay(),
                week: Math.floor(i / 7)
            });
        }

        return days;
    };

    const days = generateHeatmapGrid();
    const weeks = Math.ceil(days.length / 7);

    const getColor = (count) => {
        if (count === 0) return 'var(--bg-card)';
        return 'var(--success)';
    };

    return (
        <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                📅 Activity Heatmap
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(weeks, 53)}, 12px)`,
                gap: '3px',
                justifyContent: 'start',
                overflowX: 'auto',
                paddingBottom: '8px'
            }}>
                {days.map((day, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.001 }}
                        title={`${day.date}: ${day.count > 0 ? 'Active' : 'Inactive'}`}
                        style={{
                            width: '12px',
                            height: '12px',
                            background: getColor(day.count),
                            borderRadius: '2px',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            opacity: day.count > 0 ? 1 : 0.3
                        }}
                    />
                ))}
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                fontSize: '11px',
                color: 'var(--text-secondary)'
            }}>
                <span>Less</span>
                <div style={{ width: '12px', height: '12px', background: 'var(--bg-card)', borderRadius: '2px', border: '1px solid var(--border)' }} />
                <div style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '2px', opacity: 0.5 }} />
                <div style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '2px' }} />
                <span>More</span>
            </div>
        </div>
    );
}

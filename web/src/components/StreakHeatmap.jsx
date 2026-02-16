import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export default function StreakHeatmap({ heatmapData, transactions }) {
    const [dailyLimit, setDailyLimit] = useState(() => {
        const saved = localStorage.getItem('dailyLimit');
        return saved ? parseFloat(saved) : 50;
    });

    const [hoveredCell, setHoveredCell] = useState(null);

    useEffect(() => {
        localStorage.setItem('dailyLimit', dailyLimit);
    }, [dailyLimit]);

    // Current month context
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Build daily totals map from transactions
    const dailyTotals = {};

    if (transactions && Array.isArray(transactions)) {
        transactions.forEach(t => {
            try {
                // Parse the timestamp - handle "YYYY-MM-DD HH:MM:SS" format
                let dateStr = t.timestamp;

                // Convert to ISO format if needed
                if (dateStr && !dateStr.includes('T')) {
                    dateStr = dateStr.replace(' ', 'T');
                }

                // Parse as local time (SQLite stores in UTC but we display in local)
                const date = new Date(dateStr);

                if (!isNaN(date.getTime())) {
                    // Get the day of month in local timezone
                    const month = date.getMonth();
                    const year = date.getFullYear();
                    const day = date.getDate();

                    // Only count transactions from current month
                    if (month === currentMonth && year === currentYear) {
                        if (!dailyTotals[day]) {
                            dailyTotals[day] = 0;
                        }
                        dailyTotals[day] += t.amount;
                    }
                }
            } catch (err) {
                console.error('Error parsing transaction:', err, t);
            }
        });
    }

    // Helper to get day index (Monday = 0, Sunday = 6)
    const getDayIndex = (date) => (date.getDay() + 6) % 7;

    // Helper to check status for a specific date
    const getStatusForDate = (dayOfMonth) => {
        const dailyTotal = dailyTotals[dayOfMonth] || 0;

        if (dailyTotal === 0) return 'no-data';
        return dailyTotal <= dailyLimit ? 'on-budget' : 'overspent';
    };

    // Rows: Mon-Sun
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Cols: 1-31
    const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

    const getCellColor = (status) => {
        switch (status) {
            case 'on-budget': return '#10B981'; // Green
            case 'overspent': return '#EF4444'; // Red
            case 'no-data': return 'transparent';
            default: return 'transparent';
        }
    };

    const isDateValidForDay = (dayOfMonth, dayWeekIndex) => {
        const date = new Date(currentYear, currentMonth, dayOfMonth);
        if (date.getMonth() !== currentMonth) return false;
        return getDayIndex(date) === dayWeekIndex;
    };

    return (
        <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>📅</span> Date-Day Activity Matrix
                </h3>

                {/* Daily Limit Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Daily Limit:</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>$</span>
                        <input
                            type="number"
                            value={dailyLimit}
                            onChange={(e) => setDailyLimit(Math.max(0, parseFloat(e.target.value) || 0))}
                            style={{
                                padding: '6px 10px 6px 24px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                width: '100px',
                                fontWeight: '600'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Matrix */}
            <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'inline-block', minWidth: '100%' }}>
                    {/* Header Row (Dates) */}
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '40px' }} /> {/* Row Label Spacer */}
                        {daysOfMonth.map(day => (
                            <div key={day} style={{
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: 'var(--text-secondary)',
                                marginRight: '4px'
                            }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Matrix Rows */}
                    {weekDays.map((dayName, dayIndex) => (
                        <div key={dayName} style={{ display: 'flex', marginBottom: '4px' }}>
                            {/* Row Label */}
                            <div style={{
                                width: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                fontWeight: '500'
                            }}>
                                {dayName}
                            </div>

                            {/* Cells */}
                            {daysOfMonth.map(dateNum => {
                                const isValid = isDateValidForDay(dateNum, dayIndex);
                                const status = isValid ? getStatusForDate(dateNum) : 'invalid';
                                const color = getCellColor(status);

                                return (
                                    <motion.div
                                        key={`${dayName}-${dateNum}`}
                                        initial={false}
                                        whileHover={{ scale: 1.2, zIndex: 10 }}
                                        onMouseEnter={(e) => {
                                            if (!isValid) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const date = new Date(currentYear, currentMonth, dateNum);
                                            const amount = dailyTotals[dateNum] || 0;

                                            setHoveredCell({
                                                text: `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
                                                subText: amount > 0 ? `$${amount.toFixed(2)}` : 'No Activity',
                                                x: rect.left + rect.width / 2,
                                                y: rect.top - 8
                                            });
                                        }}
                                        onMouseLeave={() => setHoveredCell(null)}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '4px',
                                            background: color,
                                            border: `1px solid ${isValid ? (status === 'no-data' ? 'var(--border)' : color) : 'var(--border)'}`,
                                            marginRight: '4px',
                                            opacity: isValid ? 1 : 0.3,
                                            cursor: isValid ? 'pointer' : 'default',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                    <span>No Data</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#10B981', border: '1px solid #10B981' }} />
                    <span>On Budget</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#EF4444', border: '1px solid #EF4444' }} />
                    <span>Overspent</span>
                </div>
            </div>

            {/* Tooltip Portal */}
            {hoveredCell && createPortal(
                <div style={{
                    position: 'fixed',
                    left: hoveredCell.x,
                    top: hoveredCell.y,
                    transform: 'translate(-50%, -100%)',
                    background: 'var(--bg-card)',
                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    whiteSpace: 'nowrap',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    marginBottom: '8px',
                    textAlign: 'center'
                }}>
                    <div>{hoveredCell.text}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                        {hoveredCell.subText}
                    </div>
                    <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: '8px',
                        height: '8px',
                        background: 'rgba(20, 20, 20, 0.95)',
                        borderRight: '1px solid var(--border)',
                        borderBottom: '1px solid var(--border)'
                    }} />
                </div>,
                document.body
            )}
        </div>
    );
}

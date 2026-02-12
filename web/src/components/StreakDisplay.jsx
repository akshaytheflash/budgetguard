import { motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';

export default function StreakDisplay({ currentStreak, longestStreak }) {
    return (
        <div className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center' }}>
                {/* Current Streak */}
                <div>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ marginBottom: '12px' }}
                    >
                        <Flame size={48} color="var(--warning)" />
                    </motion.div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--warning)' }}>
                        {currentStreak}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Day Streak
                    </div>
                </div>

                {/* Longest Streak */}
                <div>
                    <div style={{ marginBottom: '12px' }}>
                        <Trophy size={48} color="var(--success)" />
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)' }}>
                        {longestStreak}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Best Streak
                    </div>
                </div>
            </div>
        </div>
    );
}

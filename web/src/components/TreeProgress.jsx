import { motion } from 'framer-motion';
import { TreePine, Sprout, Leaf } from 'lucide-react';

export default function TreeProgress({ treeProgress, totalTreesPlanted }) {
    // Determine tree stage based on progress (0-6)
    const getTreeIcon = () => {
        if (treeProgress === 0) return <Sprout size={64} color="var(--success)" />;
        if (treeProgress <= 3) return <Leaf size={64} color="var(--success)" />;
        return <TreePine size={64} color="var(--success)" />;
    };

    const getTreeStage = () => {
        if (treeProgress === 0) return "Seed";
        if (treeProgress <= 3) return "Sapling";
        return "Growing";
    };

    return (
        <div className="glass-card" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
                🌳 Tree Impact
            </h3>

            {/* Animated Tree Icon */}
            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ marginBottom: '16px' }}
            >
                {getTreeIcon()}
            </motion.div>

            {/* Progress */}
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {getTreeStage()} - {treeProgress}/7 days
            </div>

            {/* Progress Bar */}
            <div className="progress-bar" style={{ marginBottom: '16px' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(treeProgress / 7) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    style={{
                        height: '100%',
                        background: 'var(--gradient-success)',
                        borderRadius: '8px'
                    }}
                />
            </div>

            {/* Total Trees */}
            <div style={{
                padding: '12px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border)'
            }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)' }}>
                    {totalTreesPlanted}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Trees Planted
                </div>
                {totalTreesPlanted > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        ~{totalTreesPlanted * 22}kg CO₂ offset
                    </div>
                )}
            </div>
        </div>
    );
}

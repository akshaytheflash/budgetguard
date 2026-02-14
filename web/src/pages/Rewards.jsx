import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Zap, Leaf } from 'lucide-react';
import StreakDisplay from '../components/StreakDisplay';
import TreeProgress from '../components/TreeProgress';
import CoinRewards from '../components/CoinRewards';

export default function Rewards() {
    const { userData, token, loadDashboard } = useOutletContext();

    return (
        <div className="page-content" style={{ paddingBottom: '100px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Award size={32} color="var(--warning)" />
                Rewards & Challenges
            </h1>

            {/* Streak and Tree Progress */}
            <div className="grid grid-2" style={{ marginBottom: '32px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <StreakDisplay
                        currentStreak={userData.current_streak}
                        longestStreak={userData.longest_streak}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <TreeProgress
                        treeProgress={userData.tree_progress}
                        totalTreesPlanted={userData.total_trees_planted}
                    />
                </motion.div>
            </div>

            {/* Coin Rewards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ marginBottom: '32px' }}
            >
                <CoinRewards
                    token={token}
                    coinBalance={userData.coin_balance}
                    onRedemption={loadDashboard}
                />
            </motion.div>

            {/* How it Works Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="gradient-card"
            >
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                    How to Earn Rewards
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '12px',
                            height: 'fit-content'
                        }}>
                            <Zap size={24} color="var(--warning)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Daily Streaks</h3>
                            <p style={{ fontSize: '14px', opacity: 0.9 }}>
                                Log in daily and stay under budget to build your streak. Higher streaks earn bonus multipliers!
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '12px',
                            height: 'fit-content'
                        }}>
                            <Leaf size={24} color="var(--success)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Plant Trees</h3>
                            <p style={{ fontSize: '14px', opacity: 0.9 }}>
                                Every $100 saved contributes to planting real trees. Watch your virtual forest grow as you save.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

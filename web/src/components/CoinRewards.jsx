import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gift, X, Sparkles } from 'lucide-react';

const API_URL = 'http://localhost:8000';

const REWARDS = [
    { brand: 'Amazon', coins: 100, discount: '₹50 off' },
    { brand: 'Flipkart', coins: 100, discount: '₹50 off' },
    { brand: 'Swiggy', coins: 75, discount: '₹30 off' },
    { brand: 'Zomato', coins: 75, discount: '₹30 off' },
    { brand: 'Netflix', coins: 150, discount: '1 month free' },
    { brand: 'Spotify', coins: 120, discount: '2 months free' },
];

export default function CoinRewards({ token, coinBalance, onRedemption }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);
    const [redemptionCode, setRedemptionCode] = useState(null);

    const handleRedeem = async (reward) => {
        if (coinBalance < reward.coins) {
            alert('Insufficient coins!');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/redeem_coins?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand: reward.brand,
                    coins_required: reward.coins
                })
            });

            const data = await response.json();

            if (response.ok) {
                setRedemptionCode(data.redemption_code);
                onRedemption();
            } else {
                alert(data.detail || 'Redemption failed');
            }
        } catch (error) {
            console.error('Redemption error:', error);
            alert('Failed to redeem coins');
        }
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card"
                onClick={() => setShowModal(true)}
                style={{
                    cursor: 'pointer',
                    border: '2px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px',
                    width: '100%',
                    minHeight: '140px',
                    textAlign: 'left'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Coins size={32} color="var(--warning)" />
                    <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Coin Balance</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--warning)' }}>
                            {coinBalance}
                        </div>
                    </div>
                </div>
                <Gift size={24} color="var(--primary-start)" />
            </motion.button>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => {
                            setShowModal(false);
                            setRedemptionCode(null);
                            setSelectedReward(null);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            style={{ maxWidth: '600px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!redemptionCode ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
                                            🎁 Rewards Marketplace
                                        </h2>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--text-secondary)'
                                            }}
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div style={{
                                        padding: '16px',
                                        background: 'var(--bg-card)',
                                        borderRadius: '12px',
                                        marginBottom: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <Coins size={24} color="var(--warning)" />
                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Your Balance</div>
                                            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--warning)' }}>
                                                {coinBalance} coins
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                                        {REWARDS.map((reward, index) => (
                                            <motion.div
                                                key={index}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="glass-card"
                                                onClick={() => handleRedeem(reward)}
                                                style={{
                                                    cursor: coinBalance >= reward.coins ? 'pointer' : 'not-allowed',
                                                    opacity: coinBalance >= reward.coins ? 1 : 0.5,
                                                    textAlign: 'center',
                                                    padding: '16px'
                                                }}
                                            >
                                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                                    {reward.brand === 'Amazon' && '📦'}
                                                    {reward.brand === 'Flipkart' && '🛒'}
                                                    {reward.brand === 'Swiggy' && '🍔'}
                                                    {reward.brand === 'Zomato' && '🍕'}
                                                    {reward.brand === 'Netflix' && '🎬'}
                                                    {reward.brand === 'Spotify' && '🎵'}
                                                </div>
                                                <div style={{ fontWeight: '700', marginBottom: '4px' }}>{reward.brand}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--success)', marginBottom: '8px' }}>
                                                    {reward.discount}
                                                </div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: '700',
                                                    color: 'var(--warning)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <Coins size={16} />
                                                    {reward.coins}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{ textAlign: 'center' }}
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        style={{ marginBottom: '24px' }}
                                    >
                                        <Sparkles size={64} color="var(--warning)" />
                                    </motion.div>

                                    <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', color: 'var(--success)' }}>
                                        Redeemed Successfully!
                                    </h2>

                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                        Your redemption code:
                                    </p>

                                    <div style={{
                                        padding: '20px',
                                        background: 'var(--bg-card)',
                                        borderRadius: '12px',
                                        border: '2px dashed var(--success)',
                                        marginBottom: '24px'
                                    }}>
                                        <div style={{
                                            fontSize: '24px',
                                            fontWeight: '800',
                                            fontFamily: 'monospace',
                                            color: 'var(--success)',
                                            letterSpacing: '2px'
                                        }}>
                                            {redemptionCode}
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setShowModal(false);
                                            setRedemptionCode(null);
                                        }}
                                        style={{ width: '100%' }}
                                    >
                                        Done
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

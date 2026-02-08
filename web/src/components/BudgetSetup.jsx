import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Shield, Lock } from 'lucide-react';

export default function BudgetSetup({ onComplete }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        monthly_budget: '',
        emergency_fund: '',
        emergency_pin: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
        } else {
            onComplete({
                monthly_budget: parseFloat(formData.monthly_budget),
                emergency_fund: parseFloat(formData.emergency_fund),
                emergency_pin: formData.emergency_pin
            });
        }
    };

    const progress = (step / 3) * 100;

    return (
        <div className="container" style={{ maxWidth: '600px', paddingTop: '60px' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        style={{
                            width: '80px',
                            height: '80px',
                            background: 'var(--gradient-primary)',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}
                    >
                        {step === 1 && <Wallet size={40} color="white" />}
                        {step === 2 && <Shield size={40} color="white" />}
                        {step === 3 && <Lock size={40} color="white" />}
                    </motion.div>

                    <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>
                        {step === 1 && 'Set Your Budget'}
                        {step === 2 && 'Emergency Fund'}
                        {step === 3 && 'Secure Your Savings'}
                    </h1>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                        {step === 1 && 'How much do you want to spend this month?'}
                        {step === 2 && 'Protect your emergency savings'}
                        {step === 3 && 'Create a PIN to access emergency funds'}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="progress-bar" style={{ marginBottom: '32px' }}>
                    <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="input-group">
                                    <label className="input-label">Monthly Budget</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: '20px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '20px',
                                            color: 'var(--text-secondary)'
                                        }}>$</span>
                                        <input
                                            type="number"
                                            className="input-field"
                                            style={{ paddingLeft: '40px', fontSize: '24px', fontWeight: '600' }}
                                            placeholder="1000"
                                            value={formData.monthly_budget}
                                            onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="input-group">
                                    <label className="input-label">Emergency Fund Amount</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: '20px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '20px',
                                            color: 'var(--text-secondary)'
                                        }}>$</span>
                                        <input
                                            type="number"
                                            className="input-field"
                                            style={{ paddingLeft: '40px', fontSize: '24px', fontWeight: '600' }}
                                            placeholder="500"
                                            value={formData.emergency_fund}
                                            onChange={(e) => setFormData({ ...formData, emergency_fund: e.target.value })}
                                            required
                                            min="0"
                                        />
                                    </div>
                                    <p style={{
                                        marginTop: '12px',
                                        fontSize: '14px',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <Shield size={16} />
                                        This amount will be protected from overspending
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="input-group">
                                    <label className="input-label">Emergency PIN (4-6 digits)</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        style={{ fontSize: '24px', fontWeight: '600', letterSpacing: '8px', textAlign: 'center' }}
                                        placeholder="••••"
                                        value={formData.emergency_pin}
                                        onChange={(e) => setFormData({ ...formData, emergency_pin: e.target.value })}
                                        required
                                        pattern="[0-9]{4,6}"
                                        maxLength="6"
                                    />
                                    <p style={{
                                        marginTop: '12px',
                                        fontSize: '14px',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <Lock size={16} />
                                        You'll need this PIN to use emergency funds
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                        {step > 1 && (
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setStep(step - 1)}
                                style={{ flex: 1 }}
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                        >
                            {step === 3 ? 'Complete Setup' : 'Continue'}
                        </button>
                    </div>
                </form>

                {/* Step indicator */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '24px'
                }}>
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            style={{
                                width: s === step ? '24px' : '8px',
                                height: '8px',
                                borderRadius: '4px',
                                background: s <= step ? 'var(--gradient-primary)' : 'var(--border)',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

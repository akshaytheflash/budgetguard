import { Link, useLocation } from 'react-router-dom';
import { Home, PieChart, Trophy, Crown, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/activity', icon: PieChart, label: 'Activity' },
        { path: '/rewards', icon: Trophy, label: 'Rewards' },
        { path: '/premium', icon: Crown, label: 'Premium' },
        { path: '/security', icon: ShieldCheck, label: 'Security' }
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-card)',
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            border: '1px solid var(--border)',
            display: 'flex',
            gap: '8px',
            zIndex: 1000,
            backdropFilter: 'blur(10px)'
        }}>
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link to={item.path} key={item.path} style={{ textDecoration: 'none' }}>
                        <div style={{
                            position: 'relative',
                            padding: '12px',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            minWidth: '64px',
                            color: isActive ? 'var(--primary-start)' : 'var(--text-secondary)',
                            transition: 'color 0.3s ease'
                        }}>
                            {isActive && (
                                <motion.div
                                    layoutId="nav-bg"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'var(--bg-hover)',
                                        borderRadius: '16px',
                                        zIndex: -1
                                    }}
                                />
                            )}
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span style={{ fontSize: '12px', fontWeight: isActive ? '600' : '400' }}>
                                {item.label}
                            </span>
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
}

import React, { useState } from 'react';
import { translations } from '../translations';
import { Icon, PrimaryBtn, inputStyle } from '../ui';

// ============ LOGIN ============
export const AuthScreen = ({ T, onAuth, lang }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const t = translations[lang];
    const night = T.name === 'night';

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            const res = await onAuth(isLogin, isLogin ? { email, password } : { name, email, password });
            if (!res.success) setError(res.error || 'Error');
        } catch (err) { setError('No se pudo conectar con el servidor'); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100dvh', background: T.bg, color: T.ink, fontFamily: T.sans, display: 'flex', justifyContent: 'center' }}>
            <div className="anim-fade" style={{ width: '100%', maxWidth: 440, padding: '72px 28px 36px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: night ? 'center' : 'flex-start', textAlign: night ? 'center' : 'left' }}>
                {night
                    ? <div style={{ width: 56, height: 56, borderRadius: '50%', border: `1px solid ${T.accent}`, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="book-open" size={24} /></div>
                    : <img src="/icon-192.png" alt="" style={{ width: 64, height: 64, borderRadius: 16 }} />}
                <h1 style={{ margin: '28px 0 0', fontFamily: T.serif, fontWeight: 400, fontSize: night ? 56 : 48, lineHeight: 1 }}>
                    Maná {night ? <span style={{ fontStyle: 'italic', color: T.accent }}>Digital</span> : 'Digital'}
                </h1>
                <p style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.5, color: T.muted, maxWidth: 290 }}>{t.tagline}</p>

                <form onSubmit={handleSubmit} style={{ marginTop: 'auto', paddingTop: 48, width: '100%', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                    {!isLogin && <input type="text" placeholder={t.name} value={name} onChange={e => setName(e.target.value)} required style={inputStyle(T)} />}
                    <input type="email" placeholder={t.email} value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputStyle(T)} />
                    <input type="password" placeholder={t.password} value={password} onChange={e => setPassword(e.target.value)} required autoComplete={isLogin ? 'current-password' : 'new-password'} style={inputStyle(T)} />
                    {error && <div style={{ fontSize: 14, color: T.danger, padding: '4px 4px 0' }}>{error}</div>}
                    <PrimaryBtn T={T} type="submit" disabled={loading} style={{ marginTop: 8 }}>{loading ? t.loading : (isLogin ? t.login : t.register)}</PrimaryBtn>
                    <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ height: 44, border: 'none', background: 'none', color: T.muted, fontSize: 14 }}>
                        {isLogin ? t.noAccount : t.hasAccount} <span style={{ color: T.accentText, fontWeight: 600 }}>{isLogin ? t.noAccountCta : t.hasAccountCta}</span>
                    </button>
                </form>
            </div>
        </div>
    );
};


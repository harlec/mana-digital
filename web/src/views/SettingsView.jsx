import React, { useState, useEffect } from 'react';
import { api } from '../config';
import { Card, GhostBtn, Icon, PrimaryBtn, Segmented, Toggle, inputStyle } from '../ui';

// ============ AJUSTES (pantalla) ============
export const SettingsView = ({ T, settings, token, onUpdate, onClose, onLogout, t, themeMode, setThemeMode }) => {
    const [s, setS] = useState(settings);
    const [saving, setSaving] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [newSchedule, setNewSchedule] = useState('');
    const set = (patch) => setS(prev => ({ ...prev, ...patch }));

    useEffect(() => { loadSchedules(); }, []);
    const loadSchedules = async () => { try { const res = await api.call('/settings.php?action=get', 'GET', null, token); if (res.success && res.schedules) setSchedules(res.schedules); } catch (e) {} };
    const addSchedule = async () => { if (!newSchedule) return; const res = await api.call('/settings.php?action=add-schedule', 'POST', { time: newSchedule + ':00' }, token); if (res.success) { await loadSchedules(); setNewSchedule(''); } };
    const removeSchedule = async (id) => { const res = await api.call(`/settings.php?action=remove-schedule&id=${id}`, 'DELETE', null, token); if (res.success) loadSchedules(); };
    const handleSave = async () => {
        setSaving(true);
        const payload = { ...s, dark_mode: themeMode === 'night' };
        const res = await api.call('/settings.php?action=update', 'PUT', payload, token);
        if (res.success) { onUpdate(payload); onClose(); }
        setSaving(false);
    };

    const Section = ({ title, children }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: '12px 8px 0', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.muted }}>{title}</div>
            <Card T={T} style={{ display: 'flex', flexDirection: 'column' }}>{children}</Card>
        </div>
    );
    const Row = ({ label, hint, children, last }) => (
        <div style={{ minHeight: 60, padding: '12px 16px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: last ? 'none' : `1px solid ${T.line2}` }}>
            <div><div style={{ fontSize: 15, fontWeight: 500 }}>{label}</div>{hint && <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{hint}</div>}</div>
            {children}
        </div>
    );
    const Block = ({ label, children, last }) => (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, borderBottom: last ? 'none' : `1px solid ${T.line2}` }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{label}</div>{children}
        </div>
    );
    const chip = { height: 38, borderRadius: 19, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px 0 14px', fontSize: 14, fontWeight: 600, background: T.accentSoft, color: T.accentText, border: T.pill ? `1px solid ${T.accent}` : 'none' };
    const smallInput = { ...inputStyle(T), height: 44, width: 'auto', flex: 1 };

    return (
        <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={onClose} aria-label="Volver" style={{ width: 44, height: 44, border: 'none', background: 'none', color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="chevron-left" size={24} /></button>
                <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: 32 * T.serifSize }}>{t.settings}</h2>
            </div>

            <Section title={t.appearance}>
                <Block label={t.theme}>
                    <Segmented T={T} value={themeMode} onChange={setThemeMode} options={[{ value: 'day', label: t.day, icon: 'sun' }, { value: 'auto', label: t.auto }, { value: 'night', label: t.night, icon: 'moon' }]} />
                    {themeMode === 'auto' && <div style={{ fontSize: 13, color: T.muted }}>{t.autoHint}</div>}
                </Block>
                <Row label={t.language} last>
                    <select value={s.language} onChange={e => set({ language: e.target.value })} style={{ height: 40, borderRadius: 12, border: `1px solid ${T.line}`, background: T.surface, color: T.ink, padding: '0 10px' }}>
                        <option value="es">Español</option><option value="en">English</option>
                    </select>
                </Row>
            </Section>

            <Section title={t.reminders}>
                <Row label={t.notifications} last={!s.notifications_enabled}><Toggle T={T} on={!!s.notifications_enabled} onChange={v => set({ notifications_enabled: v })} /></Row>
                {s.notifications_enabled && (<>
                    <Row label={t.pause}><Toggle T={T} on={!!s.notifications_paused} onChange={v => set({ notifications_paused: v })} /></Row>
                    <Block label={t.frequency}>
                        <Segmented T={T} value={s.interval_mode ? 'interval' : 'fixed'} onChange={v => set({ interval_mode: v === 'interval' })} options={[{ value: 'interval', label: t.interval, icon: 'clock' }, { value: 'fixed', label: t.fixed, icon: 'calendar' }]} />
                        {s.interval_mode ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 14, color: T.muted, flex: 1 }}>{t.everyHours}</span>
                                <input type="number" min="1" max="24" value={s.interval_hours || 2} onChange={e => set({ interval_hours: parseInt(e.target.value) })} style={{ ...smallInput, flex: 'none', width: 88, textAlign: 'center' }} />
                            </div>
                        ) : (<>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {schedules.length === 0 && <span style={{ fontSize: 14, color: T.muted }}>{t.noSchedules}</span>}
                                {schedules.map(sc => (
                                    <span key={sc.id} style={chip}>{sc.time.substring(0, 5)}
                                        <button onClick={() => removeSchedule(sc.id)} aria-label="Eliminar" style={{ width: 28, height: 28, border: 'none', background: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="x" size={14} /></button>
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="time" value={newSchedule} onChange={e => setNewSchedule(e.target.value)} style={smallInput} />
                                <button onClick={addSchedule} disabled={!newSchedule} style={{ height: 44, borderRadius: T.pill ? 22 : 12, border: 'none', padding: '0 16px', background: T.accent, color: T.accentInk, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: newSchedule ? 1 : .45 }}><Icon n="plus" size={16} />{t.add}</button>
                            </div>
                        </>)}
                    </Block>
                    <Row label={t.dailyCheckin} hint={(s.checkin_time || '09:00').substring(0, 5)} last><Toggle T={T} on={!!s.checkin_notification} onChange={v => set({ checkin_notification: v })} /></Row>
                </>)}
            </Section>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <PrimaryBtn T={T} onClick={handleSave} disabled={saving}>{saving ? t.loading : t.save}</PrimaryBtn>
                <GhostBtn T={T} onClick={onLogout} style={{ color: T.danger }}>{t.logout}</GhostBtn>
            </div>
        </div>
    );
};

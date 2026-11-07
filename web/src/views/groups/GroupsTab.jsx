import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Card, GhostBtn, Icon, PageTitle, PrimaryBtn, Spinner, inputStyle } from '../../ui';
import { GroupLogo, JOIN_KEY, groupMeta, todayLine } from './shared';
import { NewGroup } from './NewGroup';
import { GroupDetail } from './GroupDetail';
import { Chapter } from './Chapter';
import { Prayers } from './Prayers';
import { NewPrayer } from './NewPrayer';
import { Testimonies } from './Testimonies';
import { Leader, Safety } from './Leader';
import { Weekly } from './Weekly';
import { Meeting } from './Meeting';
import { Pastoral } from './Pastoral';

const JoinCard = ({ T, token, code, onDone, onCancel }) => {
    const [g, setG] = useState(null);
    const [error, setError] = useState(false);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        api.call(`/groups.php?action=preview&code=${encodeURIComponent(code)}`, 'GET', null, token)
            .then(r => r.success ? setG(r.group) : setError(true)).catch(() => setError(true));
    }, [code]);
    const join = async () => {
        setBusy(true);
        const r = await api.call('/groups.php?action=join', 'POST', { code }, token);
        setBusy(false);
        if (r.success) onDone(r.group);
    };
    return (
        <Card T={T} style={{ padding: 18, marginBottom: 16 }}>
            {error && <><p style={{ margin: '0 0 12px', color: T.ink }}>Ese código no existe. Revisa que esté completo.</p><GhostBtn T={T} onClick={onCancel} style={{ width: '100%' }}>Cerrar</GhostBtn></>}
            {!error && !g && <Spinner T={T} />}
            {g && (
                <>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <GroupLogo g={g} />
                        <div>
                            <div style={{ fontFamily: T.serif, fontSize: 22 * T.serifSize, color: T.ink }}>{g.name}</div>
                            <div style={{ fontSize: 13, color: T.muted }}>{g.leader_name ? `${g.leader_name} te invita · ` : ''}{g.book}, {g.pace} {g.pace === 1 ? 'capítulo' : 'capítulos'} al día</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <GhostBtn T={T} onClick={onCancel} style={{ flex: 1 }}>Ahora no</GhostBtn>
                        {g.joined ? <PrimaryBtn T={T} onClick={() => onDone(g)} style={{ flex: 1 }}>Abrir grupo</PrimaryBtn>
                            : <PrimaryBtn T={T} onClick={join} disabled={busy} style={{ flex: 1 }}>Unirme</PrimaryBtn>}
                    </div>
                </>
            )}
        </Card>
    );
};

export const GroupsTab = ({ T, token, user, toast }) => {
    const [screen, setScreen] = useState({ name: 'list' });
    const [groups, setGroups] = useState(null);
    const [pending, setPending] = useState(null);
    const [code, setCode] = useState('');
    const [migration, setMigration] = useState(false);

    const load = async () => {
        try {
            const r = await api.call('/groups.php?action=mine', 'GET', null, token);
            if (r.success) setGroups(r.groups);
            else if (r.error === 'groups_migration_pending') setMigration(true);
            else setGroups([]);
        } catch (e) { setGroups([]); }
    };
    useEffect(() => {
        load();
        let c = null;
        try { c = sessionStorage.getItem(JOIN_KEY); } catch (e) {}
        if (c) setPending(c);
    }, []);

    const clearPending = () => { try { sessionStorage.removeItem(JOIN_KEY); } catch (e) {} setPending(null); };
    const open = (g) => { clearPending(); load(); setScreen({ name: 'group', id: g.id }); };

    if (screen.name === 'new') return <NewGroup T={T} token={token} onBack={() => setScreen({ name: 'list' })} onCreated={(g) => { load(); setScreen({ name: 'group', id: g.id }); }} />;
    if (screen.name === 'group') return <GroupDetail T={T} token={token} id={screen.id} toast={toast} onBack={() => { load(); setScreen({ name: 'list' }); }} onChapter={() => setScreen({ name: 'chapter', id: screen.id })} onOpen={(name, group) => setScreen({ name, id: screen.id, group })} />;
    if (screen.name === 'chapter') return <Chapter T={T} token={token} id={screen.id} toast={toast} onBack={() => setScreen({ name: 'group', id: screen.id })} />;

    if (screen.name === 'prayers') return <Prayers T={T} token={token} group={screen.group} toast={toast} onBack={() => setScreen({ name: 'group', id: screen.id })} onNew={() => setScreen({ name: 'newprayer', id: screen.id, group: screen.group })} />;
    if (screen.name === 'newprayer') return <NewPrayer T={T} token={token} group={screen.group} toast={toast} onBack={() => setScreen({ name: 'prayers', id: screen.id, group: screen.group })} onDone={() => setScreen({ name: 'prayers', id: screen.id, group: screen.group })} />;
    if (screen.name === 'testimonies') return <Testimonies T={T} token={token} group={screen.group} onBack={() => setScreen({ name: 'group', id: screen.id })} />;

    const to = (name, group) => setScreen(prev => ({ name, id: group.id, group, from: prev.from }));
    const back = (name, group) => () => to(name, group);
    if (screen.name === 'pastoral') return <Pastoral T={T} token={token} onBack={() => setScreen({ name: 'list' })} onOpen={(g) => setScreen({ name: 'leader', id: g.id, group: { ...g, role: 'leader' }, from: 'pastoral' })} />;
    if (screen.name === 'leader') return <Leader T={T} token={token} group={screen.group} toast={toast} onBack={() => { load(); setScreen(screen.from === 'pastoral' ? { name: 'pastoral' } : { name: 'group', id: screen.id }); }}
        onSafety={() => to('safety', screen.group)} onMeeting={() => to('meeting', screen.group)} onWeekly={() => to('weekly', screen.group)} />;
    if (screen.name === 'safety') return <Safety T={T} token={token} group={screen.group} toast={toast} onBack={back('leader', screen.group)} />;
    if (screen.name === 'weekly') return <Weekly T={T} token={token} group={screen.group} toast={toast} leader={screen.group.role === 'leader'} onBack={back('group', screen.group)} onMeeting={() => to('meeting', screen.group)} />;
    if (screen.name === 'meeting') return <Meeting token={token} group={screen.group} onExit={back('group', screen.group)} />;

    if (migration) return <div className="anim-up"><PageTitle T={T}>Comunidad</PageTitle><p style={{ color: T.muted, lineHeight: 1.5 }}>Los grupos estarán disponibles en cuanto se active la actualización en el servidor.</p></div>;

    return (
        <div className="anim-up">
            <PageTitle T={T} right={<button onClick={() => setScreen({ name: 'new' })} style={{ height: 40, padding: '0 16px', borderRadius: 20, border: 'none', background: T.pill ? T.accent : '#26211C', color: T.pill ? T.accentInk : '#fff', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Icon n="plus" size={16} />Crear</button>}>Comunidad</PageTitle>
            <p style={{ margin: '-8px 4px 18px', fontSize: 14, color: T.muted }}>Unánimes, aunque estemos lejos.</p>

            {pending && <JoinCard T={T} token={token} code={pending} onDone={open} onCancel={clearPending} />}

            {groups && groups.some(g => g.role === 'leader') && (
                <button onClick={() => setScreen({ name: 'pastoral' })} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: 16, marginBottom: 18, borderRadius: 22, border: 'none', background: T.pill ? T.surface : '#26211C', color: T.pill ? T.ink : '#F5F0E8' }}>
                    <Icon n="church" size={24} />
                    <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontFamily: T.serif, fontSize: 20 * T.serifSize }}>Vista pastoral</span>
                        <span style={{ display: 'block', fontSize: 13, opacity: .75 }}>Todos tus grupos de un vistazo y quién necesita ánimo</span>
                    </span>
                    <Icon n="chevron-right" size={18} />
                </button>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.muted, margin: '0 4px 8px' }}>Mis grupos</div>
            {!groups && <Spinner T={T} />}
            {groups && groups.length === 0 && (
                <Card T={T} style={{ padding: 22, textAlign: 'center', color: T.muted, lineHeight: 1.5 }}>
                    <Icon n="users" size={28} style={{ color: T.faint }} />
                    <p style={{ margin: '10px 0 0' }}>Crea tu grupo o únete con el código que te compartieron. Leer juntos se hace más fácil.</p>
                </Card>
            )}
            {groups && groups.map(g => (
                <button key={g.id} onClick={() => setScreen({ name: 'group', id: g.id })} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: 14, marginBottom: 10, borderRadius: 22, border: `1px solid ${T.line2}`, background: T.surface, color: T.ink }}>
                    <GroupLogo g={g} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontFamily: T.serif, fontSize: 20 * T.serifSize }}>{g.name}</span>
                        <span style={{ display: 'block', fontSize: 12, color: T.muted, marginTop: 2 }}>{groupMeta(g)}</span>
                        <span style={{ display: 'block', fontSize: 13, color: T.accentText, marginTop: 4 }}>{todayLine(g)}</span>
                        {g.open_prayers > 0 && <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 10px', borderRadius: 10, background: '#FBE4EF', color: '#BE185D', fontSize: 12, fontWeight: 700 }}>{g.open_prayers} {g.open_prayers === 1 ? 'petición abierta' : 'peticiones abiertas'}</span>}
                    </span>
                    <Icon n="chevron-right" size={18} style={{ color: T.faint }} />
                </button>
            ))}

            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.muted, margin: '22px 4px 8px' }}>Unirme con un código</div>
            <div style={{ display: 'flex', gap: 10 }}>
                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ej. K7M2QX" maxLength={12} style={{ ...inputStyle(T), letterSpacing: '.12em' }} />
                <PrimaryBtn T={T} disabled={code.trim().length < 4} onClick={() => { setPending(code.trim()); setCode(''); }} style={{ padding: '0 22px', flexShrink: 0 }}>Buscar</PrimaryBtn>
            </div>
            <p style={{ textAlign: 'center', margin: '28px 0 0', fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: 15 * T.serifSize }}>“Perseveraban en la doctrina de los apóstoles, en la comunión unos con otros.” — Hechos 2:42</p>
        </div>
    );
};

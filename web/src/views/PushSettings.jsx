import React, { useState, useEffect } from 'react';
import { Card, GhostBtn, Toggle } from '../ui';
import { PUSH_SUPPORTED, disablePush, enablePush, pushState, sendTestPush } from '../push';

// Avisos del servidor en este dispositivo (lectura del día, momentos, examen, grupos)
export const PushSettings = ({ T, token }) => {
    const [state, setState] = useState('loading');
    const [msg, setMsg] = useState(null);
    useEffect(() => { pushState().then(setState); }, []);

    const change = async (on) => {
        setMsg(null);
        try { setState(on ? await enablePush(token) : await disablePush(token)); }
        catch (e) { setMsg('No se pudieron activar los avisos. Intenta de nuevo más tarde.'); setState(await pushState()); }
    };
    const test = async () => {
        setMsg(null);
        const r = await sendTestPush(token).catch(() => null);
        setMsg(r && r.sent > 0 ? 'Enviado. Debería llegarte en unos segundos.' : 'No se pudo enviar la prueba a este dispositivo.');
    };

    const hint = {
        loading: '', unsupported: PUSH_SUPPORTED ? '' : 'Este navegador o esta app no los admite. Úsalo desde el navegador o instalando la web como app.',
        denied: 'Los bloqueaste en el navegador. Actívalos en los permisos del sitio.', off: 'Te avisamos de tu lectura, los momentos del día, el examen y tu grupo.', on: 'Activados en este dispositivo.'
    }[state];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: '12px 8px 0', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.muted }}>Avisos en este dispositivo</div>
            <Card T={T} style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500 }}>Notificaciones push</div>
                        {hint && <div style={{ fontSize: 13, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
                    </div>
                    {(state === 'off' || state === 'on') && <Toggle T={T} on={state === 'on'} onChange={change} />}
                </div>
                {state === 'on' && <GhostBtn T={T} onClick={test} style={{ width: '100%', height: 44, marginTop: 12 }}>Enviarme una prueba</GhostBtn>}
                {msg && <div style={{ fontSize: 13, color: T.muted, marginTop: 10 }}>{msg}</div>}
            </Card>
        </div>
    );
};

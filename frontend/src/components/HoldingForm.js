import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import LoadingButton from './LoadingButton';
import FeedbackSnackbar from './FeedbackSnackbar';
import Autocomplete from '@mui/material/Autocomplete';

// Runtime-safe fallbacks in case imports fail to resolve
const SafeLoadingButton = (typeof LoadingButton === 'undefined' || LoadingButton === null) ? (({ children, ...p }) => <Button {...p}>{children}</Button>) : LoadingButton;
const SafeFeedbackSnackbar = (typeof FeedbackSnackbar === 'undefined' || FeedbackSnackbar === null) ? (({ open, message }) => open ? <div style={{ position: 'fixed', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '8px 12px', borderRadius: 6 }}>{message}</div> : null) : FeedbackSnackbar;

export default function HoldingForm({ onSaved, editing = null, onCancel = null }) {
    // No longer load schemes from backend; adapters or user-entered codes are used.
    const [selected, setSelected] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [principal, setPrincipal] = useState('');
    const [unit, setUnit] = useState('');
    const [loading, setLoading] = useState(false);
    const [snack, setSnack] = useState(null);

    // When editing prop is provided, populate the form fields
    useEffect(() => {
        if (editing) {
            // editing.principal/unit may be numbers; ensure strings for controlled inputs
            setInputValue(editing.scheme_code ? String(editing.scheme_code) : '');
            setSelected(null); // clear any selected object when editing
            setPrincipal(editing.principal !== undefined && editing.principal !== null ? String(editing.principal) : '');
            setUnit(editing.unit !== undefined && editing.unit !== null ? String(editing.unit) : '');
        }
    }, [editing]);

    const save = async () => {
        // client-side validation
        if (!inputValue && !(selected && selected.scheme_code) && !editing) {
            setSnack({ severity: 'error', message: 'Enter a scheme code or select a scheme' });
            return;
        }
        if (!principal && !unit) {
            setSnack({ severity: 'error', message: 'Enter principal or units' });
            return;
        }
        // Determine scheme_code from selected option or free-form input
        let schemeCode = null;
        if (selected && typeof selected === 'object' && selected.scheme_code) schemeCode = Number(selected.scheme_code);
        if (!schemeCode) {
            // try to parse numeric code from inputValue or selected if it's a primitive
            const candidate = (typeof inputValue === 'string' && inputValue.trim()) ? inputValue.trim() : (selected && typeof selected === 'string' ? selected : null);
            if (candidate) {
                const parsed = Number(candidate.replace(/[^0-9]/g, ''));
                if (Number.isFinite(parsed)) schemeCode = parsed;
            }
        }
        if (!schemeCode) return;
        const payload = { holdings: [{ scheme_code: schemeCode, principal: Number(principal || 0), unit: Number(unit || 0) }] };
        setLoading(true);
        try {
            if (editing) {
                // Update existing holding via PUT
                const scheme = editing.scheme_code;
                const principalNum = principal === '' ? 0 : Number.parseFloat(String(principal).replace(/[,₹\s]/g, '')) || 0;
                const unitNum = unit === '' ? 0 : Number.parseFloat(String(unit).replace(/[,\s]/g, '')) || 0;
                const res = await fetch((process.env.REACT_APP_BACKEND_URL || '') + `/user/holdings/${scheme}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ principal: principalNum, unit: unitNum }) });
                if (res.ok) {
                    const json = await res.json();
                    setSnack({ severity: 'success', message: 'Holding updated' });
                    if (onSaved) onSaved(json.holdings || []);
                    if (onCancel) onCancel();
                } else {
                    const txt = await res.text().catch(() => 'Failed to update');
                    setSnack({ severity: 'error', message: `Update failed: ${txt}` });
                }
            } else {
                const res = await fetch((process.env.REACT_APP_BACKEND_URL || '') + '/user/holdings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
                if (res.ok) {
                    const json = await res.json();
                    setPrincipal(''); setUnit(''); setSelected(null); setInputValue('');
                    setSnack({ severity: 'success', message: 'Holding saved' });
                    if (onSaved) onSaved(json.holdings || []);
                } else {
                    const txt = await res.text().catch(() => 'Failed to save');
                    setSnack({ severity: 'error', message: `Save failed: ${txt}` });
                }
            }
        } catch (e) {
            setSnack({ severity: 'error', message: `Save failed: ${e.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch', mb: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Autocomplete
                freeSolo
                options={[]}
                getOptionLabel={(o) => (o && typeof o === 'object') ? (o.scheme_name ? `${o.scheme_name} (${o.scheme_code})` : String(o.scheme_code)) : String(o)}
                value={selected}
                inputValue={inputValue}
                onInputChange={(e, v) => setInputValue(v)}
                onChange={(e, v) => setSelected(v)}
                sx={{ minWidth: 120, flex: '1 1 0', display: 'flex', alignItems: 'stretch', width: '100%' }}
                disabled={!!editing}
                renderInput={(params) => <TextField {...params} label="Scheme (code or name)" size="small" fullWidth />}
            />
            <TextField size="small" label="Principal" value={principal} onChange={(e) => setPrincipal(e.target.value)} fullWidth sx={{ minWidth: 120, flex: '1 1 0' }} />
            <TextField size="small" label="Units" value={unit} onChange={(e) => setUnit(e.target.value)} fullWidth sx={{ minWidth: 120, flex: '1 1 0' }} />
            <SafeLoadingButton variant="contained" size="small" onClick={save} loading={loading} sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, height: { xs: '40px', sm: 'auto' } }}>{editing ? 'Save changes' : 'Save'}</SafeLoadingButton>
            <SafeFeedbackSnackbar open={!!snack} severity={String((snack && snack.severity) || 'info')} message={snack && snack.message} onClose={() => setSnack(null)} />
        </Box>
    );
}

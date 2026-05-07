import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import LoadingButton from './LoadingButton';
import FeedbackSnackbar from './FeedbackSnackbar';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { toTitleCase } from '../utils/formatters';

// Runtime-safe fallbacks in case imports fail to resolve
const SafeLoadingButton = (typeof LoadingButton === 'undefined' || LoadingButton === null) ? (({ children, ...p }) => <Button {...p}>{children}</Button>) : LoadingButton;
const SafeFeedbackSnackbar = (typeof FeedbackSnackbar === 'undefined' || FeedbackSnackbar === null) ? (({ open, message }) => open ? <div style={{ position: 'fixed', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '8px 12px', borderRadius: 6 }}>{message}</div> : null) : FeedbackSnackbar;

export default function HoldingForm({ onSaved, editing = null, onCancel = null }) {
    const [schemes, setSchemes] = useState([]);
    const [schemesLoading, setSchemesLoading] = useState(false);
    const [schemesError, setSchemesError] = useState('');
    const [selected, setSelected] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [principal, setPrincipal] = useState('');
    const [unit, setUnit] = useState('');
    const [loading, setLoading] = useState(false);
    const [snack, setSnack] = useState(null);

    const formatSchemeName = (name) => toTitleCase(name || '')
        .replace(/\bIdcw\b/g, 'IDCW')
        .replace(/\bSip\b/g, 'SIP')
        .replace(/\bEtf\b/g, 'ETF')
        .replace(/\bNfo\b/g, 'NFO');

    const getSchemeLabel = (scheme) => {
        if (!scheme || typeof scheme !== 'object') return '';
        const name = formatSchemeName(scheme.scheme_name);
        return name ? `${name} (${scheme.scheme_code})` : `Code ${scheme.scheme_code}`;
    };

    useEffect(() => {
        if (editing) return undefined;
        const query = inputValue.trim();
        if (query.length < 2) {
            setSchemes([]);
            setSchemesError('');
            setSchemesLoading(false);
            return undefined;
        }

        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            setSchemesLoading(true);
            setSchemesError('');
            try {
                const params = new URLSearchParams({ q: query });
                const res = await fetch((process.env.REACT_APP_BACKEND_URL || '') + `/schemes?${params.toString()}`, { credentials: 'include' });
                if (!res.ok) throw new Error('Unable to load fund list');
                const json = await res.json();
                const list = Array.isArray(json.schemes) ? json.schemes : [];
                if (!cancelled) setSchemes(list.filter(s => s && s.scheme_code && s.scheme_name));
            } catch (e) {
                if (!cancelled) setSchemesError(e.message || 'Unable to load fund list');
            } finally {
                if (!cancelled) setSchemesLoading(false);
            }
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [inputValue, editing]);

    // When editing prop is provided, populate the form fields
    useEffect(() => {
        if (editing) {
            // editing.principal/unit may be numbers; ensure strings for controlled inputs
            const matchingScheme = schemes.find(s => Number(s.scheme_code) === Number(editing.scheme_code));
            setSelected(matchingScheme || null);
            const matchingName = matchingScheme?.scheme_name ? `${formatSchemeName(matchingScheme.scheme_name)} (${matchingScheme.scheme_code})` : '';
            const editingName = editing.scheme_name ? `${formatSchemeName(editing.scheme_name)} (${editing.scheme_code})` : '';
            setInputValue(matchingName || editingName || (editing.scheme_code ? `Code ${editing.scheme_code}` : ''));
            setPrincipal(editing.principal !== undefined && editing.principal !== null ? String(editing.principal) : '');
            setUnit(editing.unit !== undefined && editing.unit !== null ? String(editing.unit) : '');
        }
    }, [editing, schemes]);

    const save = async () => {
        // client-side validation
        if (!editing && !(selected && selected.scheme_code)) {
            setSnack({ severity: 'error', message: 'Select a fund from the list' });
            return;
        }
        if (!principal && !unit) {
            setSnack({ severity: 'error', message: 'Enter principal or units' });
            return;
        }
        const schemeCode = editing ? Number(editing.scheme_code) : Number(selected.scheme_code);
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
            {editing ? (
                <TextField
                    label="Fund name"
                    size="small"
                    value={inputValue}
                    disabled
                    fullWidth
                    helperText="Fund cannot be changed while editing"
                    sx={{ minWidth: 120, flex: '1 1 0' }}
                />
            ) : (
                <Autocomplete
                    options={schemes}
                    loading={schemesLoading}
                    noOptionsText={inputValue.trim().length < 2 ? 'Type at least 2 characters' : 'No matching funds found'}
                    getOptionLabel={getSchemeLabel}
                    isOptionEqualToValue={(option, value) => Number(option?.scheme_code) === Number(value?.scheme_code)}
                    filterOptions={(options, state) => {
                        const query = state.inputValue.trim().toLowerCase();
                        if (!query) return options.slice(0, 25);
                        return options.filter((option) => {
                            const name = String(option.scheme_name || '').toLowerCase();
                            const code = String(option.scheme_code || '');
                            return name.includes(query) || code.includes(query);
                        }).slice(0, 25);
                    }}
                    value={selected}
                    inputValue={inputValue}
                    onInputChange={(e, v) => setInputValue(v)}
                    onChange={(e, v) => setSelected(v)}
                    sx={{ minWidth: 120, flex: '1 1 0', display: 'flex', alignItems: 'stretch', width: '100%' }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Fund name"
                            size="small"
                            fullWidth
                            error={!!schemesError}
                            helperText={schemesError || 'Type to search and select a matching fund'}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {schemesLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                )
                            }}
                        />
                    )}
                />
            )}
            <TextField size="small" label="Principal" value={principal} onChange={(e) => setPrincipal(e.target.value)} fullWidth sx={{ minWidth: 120, flex: '1 1 0' }} />
            <TextField size="small" label="Units" value={unit} onChange={(e) => setUnit(e.target.value)} fullWidth sx={{ minWidth: 120, flex: '1 1 0' }} />
            <SafeLoadingButton variant="contained" size="small" onClick={save} loading={loading} sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, height: { xs: '40px', sm: 'auto' } }}>{editing ? 'Save changes' : 'Save'}</SafeLoadingButton>
            <SafeFeedbackSnackbar open={!!snack} severity={String((snack && snack.severity) || 'info')} message={snack && snack.message} onClose={() => setSnack(null)} />
        </Box>
    );
}

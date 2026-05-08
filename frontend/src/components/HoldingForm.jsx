import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import LoadingButton from './LoadingButton';
import FeedbackSnackbar from './FeedbackSnackbar';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import { formatFundName } from '../utils/formatters';
import { fetchWithCsrf } from '../auth/csrf';
import { BACKEND_URL } from '../config/env';

const SafeLoadingButton = (typeof LoadingButton === 'undefined' || LoadingButton === null)
    ? (({ children, ...p }) => <Button {...p}>{children}</Button>)
    : LoadingButton;
const SafeFeedbackSnackbar = (typeof FeedbackSnackbar === 'undefined' || FeedbackSnackbar === null)
    ? (({ open, message }) => open ? <div style={{ position: 'fixed', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '8px 12px', borderRadius: 6 }}>{message}</div> : null)
    : FeedbackSnackbar;

function parseHoldingNumber(value) {
    if (value === '' || value === undefined || value === null) return 0;
    const parsed = Number.parseFloat(String(value).replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(parsed) ? parsed : NaN;
}

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

    const formatSchemeName = (name) => formatFundName(name || '');

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
                const res = await fetch(BACKEND_URL + `/schemes?${params.toString()}`, { credentials: 'include' });
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

    useEffect(() => {
        if (editing) {
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
        if (!editing && !(selected && selected.scheme_code)) {
            setSnack({ severity: 'error', message: 'Select a fund from the list' });
            return;
        }
        if (!principal && !unit) {
            setSnack({ severity: 'error', message: 'Enter invested amount or units' });
            return;
        }

        const schemeCode = editing ? Number(editing.scheme_code) : Number(selected.scheme_code);
        if (!schemeCode) return;
        const principalNum = parseHoldingNumber(principal);
        const unitNum = parseHoldingNumber(unit);
        if (!Number.isFinite(principalNum) || !Number.isFinite(unitNum)) {
            setSnack({ severity: 'error', message: 'Enter valid numbers for amount and units' });
            return;
        }
        const payload = { holdings: [{ scheme_code: schemeCode, principal: principalNum, unit: unitNum }] };

        setLoading(true);
        try {
            if (editing) {
                const scheme = editing.scheme_code;
                const principalNum = principal === '' ? 0 : Number.parseFloat(String(principal).replace(/[,₹\s]/g, '')) || 0;
                const unitNum = unit === '' ? 0 : Number.parseFloat(String(unit).replace(/[,\s]/g, '')) || 0;
                const res = await fetchWithCsrf(BACKEND_URL + `/user/holdings/${scheme}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload.holdings[0])
                });
                if (res.ok) {
                    const json = await res.json();
                    setSnack({ severity: 'success', message: 'Fund updated' });
                    if (onSaved) onSaved(json.holdings || []);
                    if (onCancel) onCancel();
                } else {
                    const txt = await res.text().catch(() => 'Failed to update');
                    setSnack({ severity: 'error', message: `Update failed: ${txt}` });
                }
            } else {
                const res = await fetchWithCsrf(BACKEND_URL + '/user/holdings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const json = await res.json();
                    setPrincipal('');
                    setUnit('');
                    setSelected(null);
                    setInputValue('');
                    setSnack({ severity: 'success', message: 'Fund added' });
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(320px, 1.55fr) minmax(150px, 0.7fr) minmax(140px, 0.65fr) auto' }, gap: 1.25, alignItems: 'start' }}>
            {editing ? (
                <TextField
                    label="Fund name"
                    size="small"
                    value={inputValue}
                    disabled
                    fullWidth
                    helperText="To change the fund, remove this one and add the correct fund"
                    sx={{ minWidth: 120 }}
                    InputProps={{ sx: { bgcolor: 'action.hover' } }}
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
                    sx={{ minWidth: 120, width: '100%' }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Fund name"
                            placeholder="Search by fund name"
                            size="small"
                            fullWidth
                            error={!!schemesError}
                            helperText={schemesError || 'Type at least 2 characters, then choose a fund from the list'}
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
            <TextField
                size="small"
                label="Amount invested"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                fullWidth
                sx={{ minWidth: 120 }}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
            <TextField size="small" label="Units held" value={unit} onChange={(e) => setUnit(e.target.value)} fullWidth sx={{ minWidth: 120 }} placeholder="0.000" />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: { xs: 'stretch', lg: 'flex-end' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <SafeLoadingButton variant="contained" size="small" onClick={save} loading={loading} fullWidth sx={{ minWidth: 124, height: 40 }}>{editing ? 'Update' : 'Add fund'}</SafeLoadingButton>
                {editing ? <Button size="small" onClick={onCancel} fullWidth sx={{ minWidth: 90, height: 40 }}>Cancel</Button> : null}
            </Box>
            <SafeFeedbackSnackbar open={!!snack} severity={String((snack && snack.severity) || 'info')} message={snack && snack.message} onClose={() => setSnack(null)} />
        </Box>
    );
}

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import HoldingForm from './HoldingForm';
import FeedbackSnackbar from './FeedbackSnackbar';
import SectionCard from './ui/SectionCard';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatFundName, fmtUnit } from '../utils/formatters';
import { fetchSchemeDataUsingAdapter } from '../adapters/mfAdapters';
import { fetchWithCsrf } from '../auth/csrf';
import { BACKEND_URL } from '../config/env';

function HoldingRow({ holding, fundName, totalPrincipal, onEdit, onAskDelete, disabled }) {
    const allocation = totalPrincipal ? (Number(holding.principal || 0) / totalPrincipal) * 100 : 0;

    return (
        <Card
            variant="outlined"
            sx={(theme) => ({
                borderRadius: 2,
                boxShadow: 'none',
                borderColor: theme.palette.divider,
                transition: 'border-color .16s ease, background-color .16s ease, transform .16s ease',
                '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-1px)' },
                    borderColor: theme.palette.primary.main,
                    backgroundColor: '#fbfdff'
                }
            })}
        >
            <CardContent sx={{ p: { xs: 1.4, sm: 1.55 }, '&:last-child': { pb: { xs: 1.4, sm: 1.55 } } }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 150px 130px 96px' }, gap: { xs: 1.2, md: 1.75 }, alignItems: 'center' }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                            <Typography sx={{ color: 'text.primary', fontSize: { xs: 14.5, sm: 15 }, fontWeight: 800, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>
                                {fundName}
                            </Typography>
                            <Chip label={`Code ${holding.scheme_code}`} size="small" sx={{ height: 21, fontSize: 10.5, fontWeight: 800, flexShrink: 0, display: { xs: 'none', sm: 'inline-flex' } }} />
                        </Box>
                        <Box sx={{ mt: 0.75, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 44px', gap: 1, alignItems: 'center', maxWidth: 420 }}>
                            <Box sx={{ height: 6, borderRadius: 999, bgcolor: '#e2e8f0', overflow: 'hidden' }}>
                                <Box sx={{ width: `${Math.min(100, Math.max(0, allocation))}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #2563eb, #0f9f6e)' }} />
                            </Box>
                            <Typography sx={{ color: 'text.secondary', fontSize: 11.5, fontWeight: 800, textAlign: 'right' }}>{allocation.toFixed(1)}%</Typography>
                        </Box>
                    </Box>

                    <Box>
                        <Typography sx={{ color: 'text.secondary', fontSize: 11.5, fontWeight: 750 }}>Amount invested</Typography>
                        <Typography sx={{ color: 'text.primary', fontSize: 15, fontWeight: 850, mt: 0.15 }}>{formatCurrency(holding.principal)}</Typography>
                    </Box>

                    <Box>
                        <Typography sx={{ color: 'text.secondary', fontSize: 11.5, fontWeight: 750 }}>Units held</Typography>
                        <Typography sx={{ color: 'text.primary', fontSize: 15, fontWeight: 850, mt: 0.15 }}>{fmtUnit(holding.unit)}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 0.35 }}>
                        <Tooltip title="Edit fund">
                            <IconButton size="small" aria-label={`edit ${fundName}`} onClick={() => onEdit(holding)} sx={{ width: 38, height: 38 }}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove fund">
                            <IconButton size="small" aria-label={`remove ${fundName}`} onClick={() => onAskDelete(holding)} disabled={disabled} color="error" sx={{ width: 38, height: 38 }}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function HoldingsPage() {
    const [holdings, setHoldings] = useState([]);
    const [editing, setEditing] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [schemesMap, setSchemesMap] = useState({});
    const navigate = useNavigate();

    const SafeFeedbackSnackbar = (typeof FeedbackSnackbar === 'undefined' || FeedbackSnackbar === null)
        ? (({ open, message }) => open ? <div style={{ position: 'fixed', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '8px 12px', borderRadius: 6 }}>{message}</div> : null)
        : FeedbackSnackbar;

    const load = async () => {
        try {
            const res = await fetch(BACKEND_URL + '/user/holdings', { credentials: 'include' });
            if (res.ok) {
                const json = await res.json();
                setHoldings(json.holdings || []);
            }
        } catch (e) {
            // The page remains usable; mutations will surface their own errors.
        }
    };

    const [loading, setLoading] = useState(false);
    const [snack, setSnack] = useState(null);

    const loadSchemes = async (codes) => {
        try {
            const uniqueCodes = Array.from(new Set(codes.map(c => Number(c)))).filter(Number.isFinite);
            const schemeObjects = uniqueCodes.map(code => ({ scheme_code: code }));
            const map = {};

            if (schemeObjects.length > 0) {
                try {
                    const results = await fetchSchemeDataUsingAdapter(schemeObjects);
                    results.forEach(result => {
                        if (result && !result.error && result.data) {
                            const name = result.data.meta && result.data.meta.scheme_name ? result.data.meta.scheme_name : null;
                            if (name) map[result.schemeCode] = name;
                        }
                    });
                } catch (e) {
                    // Missing metadata falls back to scheme code labels.
                }
            }

            setSchemesMap(map);
        } catch (e) {
            // Missing metadata falls back to scheme code labels.
        }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { if (holdings && holdings.length) loadSchemes(holdings.map(h => h.scheme_code)); }, [holdings]);

    const onSaved = (newList) => { setHoldings(newList || []); };

    const remove = async (code) => {
        setLoading(true);
        try {
            const res = await fetchWithCsrf(BACKEND_URL + '/user/holdings/' + code, { method: 'DELETE' });
            if (res.ok) {
                const json = await res.json();
                setHoldings(json.holdings || []);
                setPendingDelete(null);
                setSnack({ severity: 'success', message: 'Fund removed' });
            } else {
                setSnack({ severity: 'error', message: 'Failed to remove fund' });
            }
        } catch (e) {
            setSnack({ severity: 'error', message: `Failed to remove: ${e.message}` });
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (h) => {
        setEditing({
            ...h,
            scheme_name: schemesMap[h.scheme_code] || '',
            principal: h.principal !== undefined && h.principal !== null ? String(h.principal) : '',
            unit: h.unit !== undefined && h.unit !== null ? String(h.unit) : ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const totalPrincipal = holdings.reduce((sum, h) => sum + Number(h.principal || 0), 0);
    const pendingDeleteName = pendingDelete ? formatFundName(schemesMap[pendingDelete.scheme_code] || `Code ${pendingDelete.scheme_code}`) : '';

    return (
        <Box component="main" sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 2.25, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box>
                    <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 1 }}>Dashboard</Button>
                    <Typography component="h1" sx={{ fontSize: { xs: 27, sm: 34 }, fontWeight: 900, lineHeight: 1.08 }}>Manage funds</Typography>
                    <Typography sx={{ color: 'text.secondary', mt: 0.65, fontWeight: 500, maxWidth: 680 }}>
                        Add or update the funds used to build your portfolio dashboard.
                    </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: 1 }}>
                    <Chip label={`${holdings.length} funds`} size="small" sx={{ fontWeight: 850 }} />
                    <Chip label={formatCurrency(totalPrincipal, { compact: true })} size="small" color="primary" sx={{ fontWeight: 850 }} />
                </Box>
            </Box>

            <SectionCard
                title={editing ? 'Edit fund' : 'Add fund'}
                eyebrow={editing ? 'Update amount or units' : 'Add a fund to your dashboard'}
                action={<AddCircleOutlineIcon color="primary" />}
                sx={{ mb: 2 }}
            >
                <HoldingForm onSaved={onSaved} editing={editing} onCancel={() => setEditing(null)} />
            </SectionCard>

            <SectionCard
                title="Funds in your dashboard"
                eyebrow="Your portfolio list"
                action={<PlaylistAddCheckIcon color="primary" />}
            >
                {holdings.length === 0 ? (
                    <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                        <Typography sx={{ fontWeight: 850, fontSize: 18 }}>No funds added yet</Typography>
                        <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>Search for a mutual fund above, then add invested amount or units to start tracking.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'grid', gap: 0.9 }}>
                        {holdings.map((h) => {
                            const fundName = formatFundName(schemesMap[h.scheme_code] || `Code ${h.scheme_code}`);
                            return (
                                <HoldingRow
                                    key={h.scheme_code}
                                    holding={h}
                                    fundName={fundName}
                                    totalPrincipal={totalPrincipal}
                                    onEdit={startEdit}
                                    onAskDelete={setPendingDelete}
                                    disabled={loading}
                                />
                            );
                        })}
                    </Box>
                )}
            </SectionCard>

            <Dialog open={!!pendingDelete} onClose={() => !loading && setPendingDelete(null)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 900 }}>Remove this fund?</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: 'text.secondary', lineHeight: 1.55 }}>
                        This will remove <Box component="span" sx={{ color: 'text.primary', fontWeight: 800 }}>{pendingDeleteName}</Box> from your dashboard. Your mutual fund account and data provider remain unchanged.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setPendingDelete(null)} disabled={loading}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={() => remove(pendingDelete.scheme_code)} disabled={loading}>
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>

            <SafeFeedbackSnackbar open={!!snack} severity={String((snack && snack.severity) || 'info')} message={snack && snack.message} onClose={() => setSnack(null)} />
        </Box>
    );
}

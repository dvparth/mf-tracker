// Shared formatting and date helper utilities used by MFTracker and subcomponents
export function fmtAmount(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return '-';
    return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtRoundUp(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return '-';
    return Math.ceil(Number(v)).toLocaleString();
}

export function fmtUnit(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return '-';
    return Number(v).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function profitColor(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return 'text.primary';
    if (n > 0) return 'success.main';
    if (n < 0) return 'error.main';
    return 'text.primary';
}

export function accentColor(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return '#cfd8dc';
    if (n > 0) return '#00b894';
    if (n < 0) return '#ff6b6b';
    return '#90a4ae';
}

export function dateShort(d) {
    if (!d) return '-';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = months[Number(parts[1]) - 1] || parts[1];
    return `${parts[0]} ${m}`;
}

export function monthLabelShort(d) {
    if (!d) return '-';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = months[Number(parts[1]) - 1] || parts[1];
    const dd = parts[0];
    return `${dd}-${m}`;
}

export function toTitleCase(str) {
    if (!str) return '';
    return String(str).toLowerCase().split(/\s+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

// Date helpers used by MFTracker for month math
export function parseDMY(d) {
    if (!d) return null;
    const parts = d.split('-');
    if (parts.length !== 3) return null;
    const dd = Number(parts[0]);
    const mm = Number(parts[1]) - 1;
    const yyyy = Number(parts[2]);
    return new Date(yyyy, mm, dd);
}

export function formatDMY(date) {
    if (!date) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = String(date.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
}

// Find nearest entry (entries array of {date: 'DD-MM-YYYY', nav: number|string}) to a target Date
export function findNearestEntry(entries, targetDate) {
    if (!entries || entries.length === 0 || !targetDate) return null;
    const targetTime = targetDate.getTime();
    let best = null;
    let bestDiff = Infinity;
    for (const e of entries) {
        if (!e || !e.date || e.nav === undefined || e.nav === null) continue;
        const ed = parseDMY(e.date);
        if (!ed) continue;
        const diff = Math.abs(ed.getTime() - targetTime);
        if (diff < bestDiff) {
            bestDiff = diff;
            best = e;
        }
    }
    return best;
}

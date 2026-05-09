import React, { useEffect, useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function InfoTooltip({ title, ariaLabel = 'More information', size = 15, sx }) {
    const [open, setOpen] = useState(false);
    const ignoreNextClickRef = useRef(false);
    const ignoreClickTimeoutRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const timeoutId = window.setTimeout(() => setOpen(false), 4500);
        return () => window.clearTimeout(timeoutId);
    }, [open]);

    useEffect(() => () => {
        if (ignoreClickTimeoutRef.current) {
            window.clearTimeout(ignoreClickTimeoutRef.current);
        }
    }, []);

    const stopParentInteraction = (event) => {
        event.stopPropagation();
    };

    const toggleTooltip = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (ignoreNextClickRef.current) {
            ignoreNextClickRef.current = false;
            if (ignoreClickTimeoutRef.current) {
                window.clearTimeout(ignoreClickTimeoutRef.current);
                ignoreClickTimeoutRef.current = null;
            }
            return;
        }
        setOpen((current) => !current);
    };

    const openTooltip = (event) => {
        event.stopPropagation();
        setOpen(true);
    };

    const handlePointerDown = (event) => {
        event.stopPropagation();
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

        event.preventDefault();
        ignoreNextClickRef.current = true;
        if (ignoreClickTimeoutRef.current) {
            window.clearTimeout(ignoreClickTimeoutRef.current);
        }
        ignoreClickTimeoutRef.current = window.setTimeout(() => {
            ignoreNextClickRef.current = false;
            ignoreClickTimeoutRef.current = null;
        }, 500);
        setOpen((current) => !current);
    };

    return (
        <Tooltip
            title={title || ''}
            arrow
            open={open}
            onClose={() => setOpen(false)}
            disableHoverListener
            disableFocusListener
            disableTouchListener
        >
            <IconButton
                type="button"
                size="small"
                aria-label={ariaLabel}
                onClick={toggleTooltip}
                onPointerDown={handlePointerDown}
                onMouseDown={stopParentInteraction}
                onMouseEnter={openTooltip}
                onMouseLeave={() => setOpen(false)}
                onFocus={openTooltip}
                onBlur={() => setOpen(false)}
                sx={{
                    width: 24,
                    height: 24,
                    p: 0,
                    color: 'text.secondary',
                    verticalAlign: 'middle',
                    '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                    '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2
                    },
                    ...sx
                }}
            >
                <InfoOutlinedIcon sx={{ fontSize: size }} />
            </IconButton>
        </Tooltip>
    );
}

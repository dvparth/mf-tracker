import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function InfoTooltip({ title, ariaLabel = 'More information', size = 15, sx }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        const timeoutId = window.setTimeout(() => setOpen(false), 4500);
        return () => window.clearTimeout(timeoutId);
    }, [open]);

    const stopParentInteraction = (event) => {
        event.stopPropagation();
    };

    const toggleTooltip = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen((current) => !current);
    };

    const openTooltip = (event) => {
        event.stopPropagation();
        setOpen(true);
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
                onMouseDown={stopParentInteraction}
                onMouseEnter={openTooltip}
                onMouseLeave={() => setOpen(false)}
                onTouchStart={stopParentInteraction}
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

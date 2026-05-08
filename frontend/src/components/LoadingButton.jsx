import React from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

const LoadingButton = React.forwardRef(function LoadingButton({ loading, children, ...props }, ref) {
    return (
        <Button {...props} ref={ref} disabled={loading || props.disabled}>
            {loading && <CircularProgress size={16} style={{ marginRight: 8 }} />}
            {children}
        </Button>
    );
});

export default LoadingButton;

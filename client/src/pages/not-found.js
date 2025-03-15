import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
export function NotFound() {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [_jsx("div", { className: "rounded-full bg-muted p-6 mb-6", children: _jsx(AlertTriangle, { className: "h-12 w-12 text-muted-foreground" }) }), _jsx("h1", { className: "text-3xl font-bold tracking-tight mb-2", children: "Page Not Found" }), _jsx("p", { className: "text-muted-foreground mb-6 max-w-md", children: "The page you are looking for doesn't exist or has been moved." }), _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/", children: "Return to Home" }) })] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@radix-ui/react-label';
import { useAppStore } from '@/lib/store';
import { Save, RefreshCw, Printer as PrinterIcon, Info, Cloud } from 'lucide-react';
import { fetchPrinters } from '@/lib/utils';
export function Settings() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [tempGoogleSheetUrl, setTempGoogleSheetUrl] = useState('');
    const [tempGoogleSlideUrl, setTempGoogleSlideUrl] = useState('');
    const [tempSelectedPrinter, setTempSelectedPrinter] = useState(null);
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const [showPrintNodeConfig, setShowPrintNodeConfig] = useState(false);
    const [tempPrintNodeConfig, setTempPrintNodeConfig] = useState({
        apiKey: '',
        printerId: ''
    });
    const { googleSheetUrl, setGoogleSheetUrl, googleSlideUrl, setGoogleSlideUrl, availablePrinters, setAvailablePrinters, selectedPrinter, setSelectedPrinter, printNodeConfig, setPrintNodeConfig, setError } = useAppStore();
    // Initialize form with stored values
    useEffect(() => {
        setTempGoogleSheetUrl(googleSheetUrl);
        setTempGoogleSlideUrl(googleSlideUrl);
        setTempSelectedPrinter(selectedPrinter);
        if (printNodeConfig) {
            setTempPrintNodeConfig(printNodeConfig);
            setShowPrintNodeConfig(true);
        }
        // Load printers on mount if none available
        if (availablePrinters.length === 0) {
            loadPrinters();
        }
    }, [googleSheetUrl, googleSlideUrl, selectedPrinter, printNodeConfig, availablePrinters]);
    // When PrintNode is selected, show config
    useEffect(() => {
        if (tempSelectedPrinter?.type === 'printnode') {
            setShowPrintNodeConfig(true);
        }
    }, [tempSelectedPrinter]);
    // Load available printers
    async function loadPrinters() {
        setLoadingPrinters(true);
        setError(null);
        try {
            const printers = await fetchPrinters();
            setAvailablePrinters(printers);
            // Check if there are real printers (not mock)
            const realPrinters = printers.filter((p) => !p.name.includes('Mock') && p.type !== 'printnode');
            toast({
                title: 'Printers Detected',
                description: `Found ${realPrinters.length} system ${realPrinters.length === 1 ? 'printer' : 'printers'}${realPrinters.length === 0 ? ', using mock printers instead' : ''}`,
            });
            // Select default printer if available, otherwise first printer if none selected
            const defaultPrinter = printers.find((p) => p.isDefault);
            if (!selectedPrinter && printers.length > 0) {
                setTempSelectedPrinter(defaultPrinter || printers[0]);
            }
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load printers. Using mock printers instead.',
                variant: 'destructive',
            });
            setError('Failed to load printers');
        }
        finally {
            setLoadingPrinters(false);
        }
    }
    // Save settings
    function saveSettings() {
        setIsLoading(true);
        try {
            // Validate URLs
            if (!isValidUrl(tempGoogleSheetUrl) || !isValidUrl(tempGoogleSlideUrl)) {
                toast({
                    title: 'Invalid URLs',
                    description: 'Please enter valid Google Sheets and Slides URLs',
                    variant: 'destructive',
                });
                return;
            }
            // Validate printer selection
            if (!tempSelectedPrinter) {
                toast({
                    title: 'Printer Required',
                    description: 'Please select a printer',
                    variant: 'destructive',
                });
                return;
            }
            // Validate PrintNode configuration if selected
            if (tempSelectedPrinter.type === 'printnode') {
                if (!tempPrintNodeConfig.apiKey || !tempPrintNodeConfig.printerId) {
                    toast({
                        title: 'PrintNode Configuration Required',
                        description: 'Please enter your PrintNode API Key and Printer ID',
                        variant: 'destructive',
                    });
                    return;
                }
                // Save PrintNode config
                setPrintNodeConfig(tempPrintNodeConfig);
            }
            else if (!showPrintNodeConfig) {
                // Clear PrintNode config if not using PrintNode
                setPrintNodeConfig(null);
            }
            // Save settings
            setGoogleSheetUrl(tempGoogleSheetUrl);
            setGoogleSlideUrl(tempGoogleSlideUrl);
            setSelectedPrinter(tempSelectedPrinter);
            toast({
                title: 'Settings Saved',
                description: 'Your configuration has been updated',
            });
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings',
                variant: 'destructive',
            });
            setError('Failed to save settings');
        }
        finally {
            setIsLoading(false);
        }
    }
    // Validate URL format
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Settings" }), _jsx("p", { className: "text-muted-foreground", children: "Configure your Google integration and printer settings" })] }), _jsxs("div", { className: "grid gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Google Integration" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "googleSheetUrl", children: "Google Sheet URL" }), _jsx("input", { id: "googleSheetUrl", type: "url", value: tempGoogleSheetUrl, onChange: (e) => setTempGoogleSheetUrl(e.target.value), className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", placeholder: "https://docs.google.com/spreadsheets/d/..." }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Enter the URL of your Google Sheet containing the barcode data" })] }), _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "googleSlideUrl", children: "Google Slide Template URL" }), _jsx("input", { id: "googleSlideUrl", type: "url", value: tempGoogleSlideUrl, onChange: (e) => setTempGoogleSlideUrl(e.target.value), className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", placeholder: "https://docs.google.com/presentation/d/..." }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Enter the URL of your Google Slide template for label printing" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Printer Settings" }), _jsxs("div", { className: "text-sm bg-muted px-2 py-0.5 rounded-full text-muted-foreground", children: [availablePrinters.filter((p) => !p.name.includes('Mock') && p.type !== 'printnode').length, " system ", availablePrinters.filter((p) => !p.name.includes('Mock') && p.type !== 'printnode').length === 1 ? 'printer' : 'printers', " detected"] })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: loadPrinters, disabled: loadingPrinters, children: [_jsx(RefreshCw, { className: `mr-2 h-4 w-4 ${loadingPrinters ? 'animate-spin' : ''}` }), loadingPrinters ? 'Scanning...' : 'Scan for Printers'] })] }), _jsxs("div", { className: "space-y-4", children: [availablePrinters.length > 0 ? (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: availablePrinters.map(printer => {
                                            const isMockPrinter = printer.type === 'mock';
                                            const isPrintNodePrinter = printer.type === 'printnode';
                                            return (_jsx("div", { className: `flex flex-col p-4 rounded-lg border cursor-pointer ${tempSelectedPrinter?.id === printer.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:bg-accent/50'}`, onClick: () => setTempSelectedPrinter(printer), children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative", children: [isPrintNodePrinter ? (_jsx(Cloud, { className: "h-5 w-5 text-blue-500" })) : (_jsx(PrinterIcon, { className: `h-5 w-5 ${isMockPrinter ? 'text-orange-500' : 'text-green-600'}` })), printer.isDefault && !isPrintNodePrinter && (_jsx("div", { className: "absolute -top-1 -right-1 bg-primary rounded-full w-2 h-2" }))] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("p", { className: "font-medium truncate", children: printer.name }), printer.isDefault && !isPrintNodePrinter && (_jsx("span", { className: "text-xs bg-primary/10 text-primary px-1 rounded", children: "Default" })), isPrintNodePrinter && (_jsx("span", { className: "text-xs bg-blue-100 text-blue-700 px-1 rounded", children: "Cloud" }))] }), _jsxs("div", { className: "flex items-center", children: [printer.location && (_jsx("p", { className: "text-xs text-muted-foreground truncate", children: printer.location })), isMockPrinter && (_jsxs("div", { className: "flex items-center ml-1", children: [_jsx(Info, { className: "h-3 w-3 text-orange-500" }), _jsx("span", { className: "text-xs text-orange-500 ml-0.5", children: "Simulated" })] }))] })] }), _jsx("div", { className: `h-3 w-3 rounded-full ${tempSelectedPrinter?.id === printer.id
                                                                ? 'bg-primary'
                                                                : 'bg-muted'}` })] }) }, printer.id));
                                        }) })) : (_jsxs("div", { className: "flex flex-col items-center justify-center p-8 border rounded-md", children: [_jsx(PrinterIcon, { className: "h-10 w-10 mb-2 text-muted-foreground" }), _jsx("h3", { className: "text-lg font-medium", children: "No Printers Found" }), _jsx("p", { className: "text-sm text-muted-foreground text-center max-w-xs", children: loadingPrinters
                                                    ? 'Scanning for available printers...'
                                                    : 'Click "Scan for Printers" to find available system printers.' })] })), (showPrintNodeConfig || tempSelectedPrinter?.type === 'printnode') && (_jsxs("div", { className: "border rounded-md p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Cloud, { className: "h-5 w-5 text-blue-500" }), _jsx("h3", { className: "font-semibold", children: "PrintNode Configuration" })] }), tempSelectedPrinter?.type !== 'printnode' && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
                                                            setShowPrintNodeConfig(false);
                                                            setPrintNodeConfig(null);
                                                        }, children: "Hide" }))] }), _jsxs("div", { className: "grid gap-4", children: [_jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "printNodeApiKey", children: "PrintNode API Key" }), _jsx("input", { id: "printNodeApiKey", type: "password", value: tempPrintNodeConfig.apiKey, onChange: (e) => setTempPrintNodeConfig({
                                                                    ...tempPrintNodeConfig,
                                                                    apiKey: e.target.value
                                                                }), className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", placeholder: "Your PrintNode API Key" })] }), _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "printNodePrinterId", children: "PrintNode Printer ID" }), _jsx("input", { id: "printNodePrinterId", type: "text", value: tempPrintNodeConfig.printerId, onChange: (e) => setTempPrintNodeConfig({
                                                                    ...tempPrintNodeConfig,
                                                                    printerId: e.target.value
                                                                }), className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", placeholder: "PrintNode Printer ID (e.g. 12345)" })] })] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["PrintNode allows you to print to any printer connected to its service.", _jsx("a", { href: "https://www.printnode.com/", target: "_blank", rel: "noopener noreferrer", className: "text-blue-500 hover:underline ml-1", children: "Learn more" })] })] })), _jsxs("div", { className: "flex items-start gap-2 p-3 bg-muted/50 rounded-md", children: [_jsx(Info, { className: "h-5 w-5 text-blue-600 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "About Printer Access" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "The application detects printers installed on your system. If no printers are found, mock printers will be used for demonstration purposes. You can also use PrintNode for cloud printing to any connected printer. For label printing, you may need to configure the appropriate label size." })] })] })] })] }), _jsxs(Button, { onClick: saveSettings, disabled: isLoading || loadingPrinters, className: "w-full sm:w-auto", children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), isLoading ? 'Saving...' : 'Save Settings'] })] })] }));
}

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAppStore } from '@/lib/store'
import { fetchGoogleSheetData, printLabel, formatCurrency } from '@/lib/utils'
import { Printer, Barcode, AlertTriangle, X, Bug } from 'lucide-react'
import { LabelPreview } from '@/components/LabelPreview'
import { PrintOptions } from '@/lib/types'

export function Home() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [pdaMode, setPdaMode] = useState(true) // Default to PDA mode ON
  const [debugMode, setDebugMode] = useState(false)
  const [keyEvents, setKeyEvents] = useState<string[]>([])
  
  // Simple barcode buffer to collect characters
  const barcodeBufferRef = useRef('')
  const lastKeypressTimeRef = useRef(Date.now())
  const scanTimeoutRef = useRef<number | null>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)
  
  const {
    googleSheetUrl,
    googleSlideUrl,
    selectedPrinter,
    printNodeConfig,
    manualEntry,
    setManualEntry,
    currentItem,
    setCurrentItem,
    printStatus,
    setPrintStatus,
    setError
  } = useAppStore()

  // Check if settings are configured
  useEffect(() => {
    if (!googleSheetUrl || !googleSlideUrl || !selectedPrinter) {
      toast({
        title: 'Configuration Required',
        description: 'Please set up your Google Sheets URL, Slides Template URL, and select a printer in Settings.',
        variant: 'destructive',
      })
      navigate('/settings')
    }
    
    // Check if PrintNode is selected but not configured
    if (selectedPrinter?.type === 'printnode' && !printNodeConfig) {
      toast({
        title: 'PrintNode Configuration Required',
        description: 'You selected PrintNode but haven\'t configured your API key and printer ID.',
        variant: 'destructive',
      })
      navigate('/settings')
    }
  }, [googleSheetUrl, googleSlideUrl, selectedPrinter, printNodeConfig, navigate, toast])

  // Focus on the input when in manual mode
  useEffect(() => {
    if (manualEntry && manualInputRef.current) {
      manualInputRef.current.focus()
    }
  }, [manualEntry])

  // Direct PDA scan mode - uses an aggressive approach to catch all scan types
  useEffect(() => {
    if (!pdaMode || manualEntry) return;
    
    // Listen for pasted content - some scanners simulate paste
    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && pastedText.length > 3) {
        if (debugMode) {
          setKeyEvents(prev => [...prev, `Paste detected: ${pastedText}`]);
        }
        processBarcode(pastedText);
      }
    };
    
    // Setup sequence detection for rapid key entry
    let keySequence = '';
    let lastKeyTime = 0;
    let sequenceTimer: number | null = null;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if manually typing in fields
      if ((document.activeElement?.tagName === 'INPUT' && document.activeElement !== manualInputRef.current) ||
          document.activeElement?.tagName === 'TEXTAREA' ||
          document.activeElement?.getAttribute('contenteditable') === 'true') {
        return;
      }
      
      // Record key events for debugging
      if (debugMode) {
        setKeyEvents(prev => {
          const newEvents = [...prev, `Key: ${e.key} (${Date.now()})`];
          return newEvents.slice(-10); // Keep last 10 events
        });
      }
      
      // Handle enter or tab as terminators
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (keySequence.length > 3) {
          if (debugMode) {
            setKeyEvents(prev => [...prev, `Scan completed by ${e.key}: ${keySequence}`]);
          }
          processBarcode(keySequence);
          keySequence = '';
          if (sequenceTimer) clearTimeout(sequenceTimer);
        }
        return;
      }
      
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTime;
      
      // Typical scanner sends keys very rapidly (<50ms apart)
      const isPossiblyScanner = timeSinceLastKey < 50;
      
      // If it's been a while, start fresh
      if (timeSinceLastKey > 500) {
        keySequence = '';
        setIsScanning(true);
      }
      
      // Only collect reasonable barcode characters
      if (/^[\w\d\-\/\+\.=%:;]$/.test(e.key)) {
        keySequence += e.key;
        setBarcodeInput(keySequence);
        
        // Clear any pending timeout
        if (sequenceTimer) clearTimeout(sequenceTimer);
        
        // Set new timeout - if keys stop coming, process what we have
        sequenceTimer = window.setTimeout(() => {
          if (keySequence.length > 3) {
            if (debugMode) {
              setKeyEvents(prev => [...prev, `Scan completed by timeout: ${keySequence}`]);
            }
            processBarcode(keySequence);
            keySequence = '';
            setIsScanning(false);
          }
        }, 300); // Longer timeout for PDA
      }
      
      lastKeyTime = now;
    };
    
    // Handle focus events - some scanners trigger focus before sending keys
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (debugMode) {
        setKeyEvents(prev => [...prev, `Focus event on: ${target?.tagName || 'unknown'}`]);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('focus', handleFocus, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('focus', handleFocus, true);
      if (sequenceTimer) clearTimeout(sequenceTimer);
    };
  }, [pdaMode, manualEntry, debugMode]);
  
  // Process the barcode and fetch data
  async function processBarcode(barcode: string) {
    if (!barcode || isProcessing) return
    
    console.log('Processing barcode:', barcode);
    setIsProcessing(true)
    setError(null)
    setIsScanning(false)
    
    try {
      const data = await fetchGoogleSheetData(googleSheetUrl, barcode)
      
      if (!data) {
        toast({
          title: 'Item Not Found',
          description: `No item found with barcode or ID: ${barcode}`,
          variant: 'destructive',
        })
        setCurrentItem(null)
      } else {
        setCurrentItem(data)
        toast({
          title: 'Item Found',
          description: `${data.name} has been loaded`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch item data. Please check your network connection.',
        variant: 'destructive',
      })
      setError('Failed to fetch item data')
    } finally {
      setIsProcessing(false)
      setBarcodeInput('')
    }
  }
  
  // Show print preview
  function handlePrintPreview() {
    if (!currentItem || !selectedPrinter || printStatus === 'printing') return
    setIsPreviewOpen(true)
  }
  
  // Handle print request
  async function handlePrint() {
    if (!currentItem || !selectedPrinter || printStatus === 'printing') return
    
    setPrintStatus('printing')
    
    try {
      // Prepare print options
      const printOptions: PrintOptions = {
        title: `Label-${currentItem.name}-${new Date().toISOString()}`,
        copies: 1
      }
      
      // Add PrintNode configuration if using PrintNode
      if (selectedPrinter.type === 'printnode' && printNodeConfig) {
        printOptions.printNodeApiKey = printNodeConfig.apiKey
        printOptions.printNodePrinterId = printNodeConfig.printerId
      }
      
      // Print the label
      await printLabel(
        googleSlideUrl, 
        selectedPrinter.id, 
        currentItem,
        printOptions
      )
      
      setPrintStatus('success')
      toast({
        title: 'Print Success',
        description: `Label sent to ${selectedPrinter.type === 'printnode' ? 'PrintNode' : 'printer'}`,
      })
      setIsPreviewOpen(false)
    } catch (error: any) {
      setPrintStatus('error')
      toast({
        title: 'Print Error',
        description: error.message || 'Failed to print label. Please check your printer connection.',
        variant: 'destructive',
      })
      setError('Failed to print label')
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Barcode Scanner</h1>
        <p className="text-muted-foreground">
          Scan a barcode or enter an ID to retrieve item details and print a label
        </p>
      </div>
      
      {/* Scanner Mode Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 border rounded-md bg-muted/30">
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="pda-mode" 
            checked={pdaMode} 
            onChange={(e) => setPdaMode(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="pda-mode" className="text-sm font-medium">PDA Scanner Mode</label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="debug-mode" 
            checked={debugMode} 
            onChange={(e) => setDebugMode(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="debug-mode" className="text-sm font-medium">Debug Mode</label>
        </div>
        
        <Button 
          onClick={() => setManualEntry(!manualEntry)}
          variant={manualEntry ? "default" : "outline"}
          size="sm"
        >
          {manualEntry ? "Cancel Manual Entry" : "Manual Entry"}
        </Button>
      </div>
      
      {/* Barcode Input */}
      <div className="grid gap-4 mb-8">
        {manualEntry && (
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && processBarcode(barcodeInput)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter barcode or ID"
              ref={manualInputRef}
              autoFocus
            />
            <Button onClick={() => processBarcode(barcodeInput)} disabled={!barcodeInput || isProcessing}>
              Scan
            </Button>
          </div>
        )}
        
        {!manualEntry && (
          <div className={`flex items-center justify-center p-8 border-2 border-dashed rounded-md ${isScanning ? 'bg-green-100 dark:bg-green-900/20 border-green-400 dark:border-green-700' : 'bg-muted/50'} transition-colors duration-300`}>
            <div className="flex flex-col items-center text-center">
              <Barcode className={`h-10 w-10 mb-2 ${isScanning ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'} transition-colors duration-300`} />
              <h3 className="text-lg font-medium">
                {isProcessing ? "Processing..." : isScanning ? "Scanning..." : "Ready to Scan"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {barcodeInput ? `Receiving: ${barcodeInput}` : pdaMode ? "Point PDA scanner at a barcode" : "Point scanner at a barcode or ID"}
              </p>
              
              {/* Hidden input to help with focus */}
              <input 
                type="text"
                className="opacity-0 position-absolute h-0 w-0 pointer-events-none"
                value={barcodeInput}
                onChange={() => {}}
                ref={manualInputRef}
                tabIndex={-1}
              />
            </div>
          </div>
        )}
        
        {/* Debug Information */}
        {debugMode && (
          <div className="border rounded-md p-3 bg-yellow-50 dark:bg-yellow-900/20 overflow-auto max-h-32">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="h-4 w-4" />
              <h4 className="font-medium">Scanner Debug</h4>
            </div>
            <div className="text-xs font-mono">
              {keyEvents.length > 0 ? (
                <ul className="space-y-1">
                  {keyEvents.map((event, i) => (
                    <li key={i} className="truncate">{event}</li>
                  ))}
                </ul>
              ) : (
                <p>No events captured yet. Try scanning a barcode.</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Item Details */}
      {currentItem ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mb-6 relative">
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={() => {
              setCurrentItem(null);
              setPrintStatus('idle');
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear item</span>
          </Button>
          <div className="flex flex-col md:flex-row gap-6">
            {currentItem.imageUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={currentItem.imageUrl} 
                  alt={currentItem.name} 
                  className="w-36 h-36 object-contain rounded-md border bg-white"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{currentItem.name}</h2>
              <p className="text-sm text-muted-foreground mb-2">
                {currentItem.barcode && `Barcode: ${currentItem.barcode}`}
                {currentItem.id && !currentItem.barcode && `ID: ${currentItem.id}`}
                {currentItem.id && currentItem.barcode && ` | ID: ${currentItem.id}`}
              </p>
              <p className="mb-4">{currentItem.description}</p>
              <p className="text-xl font-semibold">{formatCurrency(currentItem.price)}</p>
              
              <div className="mt-6">
                <Button 
                  onClick={handlePrintPreview} 
                  disabled={printStatus === 'printing'}
                  className="w-full md:w-auto"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {printStatus === 'printing' ? 'Printing...' : 'Print Label'}
                </Button>
                
                {printStatus === 'success' && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Label sent to {selectedPrinter?.type === 'printnode' ? 'PrintNode' : 'printer'} successfully
                  </p>
                )}
                
                {printStatus === 'error' && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Print error: Please check printer connection</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-12 border rounded-md bg-muted/50">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full border border-dashed p-4 mb-4">
              <Barcode className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No Item Selected</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Scan a barcode or enter an ID manually to view item details
            </p>
          </div>
        </div>
      )}
      
      {/* Label Preview Dialog */}
      <LabelPreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        itemData={currentItem}
        onConfirm={handlePrint}
        isLoading={printStatus === 'printing'}
      />
    </div>
  )
} 
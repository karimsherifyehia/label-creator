import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAppStore } from '@/lib/store'
import { fetchGoogleSheetData, printLabel, formatCurrency } from '@/lib/utils'
import { Printer, Barcode, AlertTriangle, X } from 'lucide-react'
import { LabelPreview } from '@/components/LabelPreview'
import { PrintOptions } from '@/lib/types'

export function Home() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false) // Added to show scanning status
  
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

  // Handle barcode scan input - simplified approach based on time intervals
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture if typing in input fields other than our barcode input
      const isTypingInInput = document.activeElement?.tagName === 'INPUT' && 
                             document.activeElement !== manualInputRef.current;
      
      // Don't capture if in editable areas
      const isTypingElsewhere = document.activeElement?.getAttribute('contenteditable') === 'true' ||
                              document.activeElement?.tagName === 'TEXTAREA';
      
      if (isTypingInInput || isTypingElsewhere || isProcessing) {
        return;
      }
      
      // If in manual entry mode, only handle when the input field is focused
      if (manualEntry) {
        return; // Let the input field handle it
      }
      
      const now = Date.now();
      const timeDiff = now - lastKeypressTimeRef.current;
      
      // Clear any existing timeout
      if (scanTimeoutRef.current !== null) {
        window.clearTimeout(scanTimeoutRef.current);
      }
      
      // Process immediate terminators (Enter or Tab)
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault(); // Prevent default actions
        
        // Only process if we have characters in the buffer
        if (barcodeBufferRef.current.length > 0) {
          console.log('Scan completed by Enter/Tab key:', barcodeBufferRef.current);
          const barcode = barcodeBufferRef.current;
          barcodeBufferRef.current = '';
          setIsScanning(false);
          processBarcode(barcode);
        }
        return;
      }
      
      // If it's a long gap, reset and start a new scan
      if (timeDiff > 300) {
        console.log('Starting new scan');
        barcodeBufferRef.current = '';
        setIsScanning(true);
      }
      
      // Accept a wider range of characters that might appear in barcodes
      if (/^[\w\d\-\/\+\.=%]$/.test(e.key)) {
        // Add character to buffer
        barcodeBufferRef.current += e.key;
        // Update visual display
        setBarcodeInput(barcodeBufferRef.current);
        
        // Set a timeout to finalize the scan after a pause
        scanTimeoutRef.current = window.setTimeout(() => {
          if (barcodeBufferRef.current.length > 3) {
            console.log('Scan completed by timeout:', barcodeBufferRef.current);
            const barcode = barcodeBufferRef.current;
            barcodeBufferRef.current = '';
            setIsScanning(false);
            processBarcode(barcode);
          }
        }, 200); // Increased timeout for PDA scanners
      }
      
      lastKeypressTimeRef.current = now;
    }
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scanTimeoutRef.current !== null) {
        window.clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [manualEntry, isProcessing]);
  
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Barcode Scanner</h1>
        <p className="text-muted-foreground">
          Scan a barcode or enter an ID to retrieve item details and print a label
        </p>
      </div>
      
      {/* Barcode Input */}
      <div className="grid gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setManualEntry(!manualEntry)}
            variant={manualEntry ? "default" : "outline"}
          >
            {manualEntry ? "Cancel Manual Entry" : "Manual Entry"}
          </Button>
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
        </div>
        
        {!manualEntry && (
          <div className={`flex items-center justify-center p-8 border-2 border-dashed rounded-md ${isScanning ? 'bg-green-100 dark:bg-green-900/20 border-green-400 dark:border-green-700' : 'bg-muted/50'} transition-colors duration-300`}>
            <div className="flex flex-col items-center text-center">
              <Barcode className={`h-10 w-10 mb-2 ${isScanning ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'} transition-colors duration-300`} />
              <h3 className="text-lg font-medium">
                {isProcessing ? "Processing..." : isScanning ? "Scanning..." : "Ready to Scan"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {barcodeInput ? `Receiving: ${barcodeInput}` : "Point the scanner at a barcode or ID"}
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
import { useEffect, useState } from 'react'
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

  // Handle barcode scan input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!manualEntry && e.key !== 'Enter' && /^[a-zA-Z0-9-]$/.test(e.key)) {
        setBarcodeInput(prev => prev + e.key)
      }
      
      if (e.key === 'Enter' && barcodeInput) {
        processBarcode(barcodeInput)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [barcodeInput, manualEntry])
  
  // Process the barcode and fetch data
  async function processBarcode(barcode: string) {
    if (!barcode || isProcessing) return
    
    setIsProcessing(true)
    setError(null)
    
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter barcode or ID"
              />
              <Button onClick={() => processBarcode(barcodeInput)} disabled={!barcodeInput || isProcessing}>
                Scan
              </Button>
            </div>
          )}
        </div>
        
        {!manualEntry && (
          <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-md bg-muted/50">
            <div className="flex flex-col items-center text-center">
              <Barcode className="h-10 w-10 mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium">
                {isProcessing ? "Processing..." : "Ready to Scan"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {barcodeInput ? `Receiving: ${barcodeInput}` : "Point the scanner at a barcode or ID"}
              </p>
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
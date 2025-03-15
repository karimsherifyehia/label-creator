import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@radix-ui/react-label'
import { useAppStore } from '@/lib/store'
import { Save, RefreshCw, Printer as PrinterIcon, Info, Cloud, Bug } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchPrinters, isRunningOnNetlify } from '@/lib/utils'
import { Printer, PrintNodeConfig } from '@/lib/types'

export function Settings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [tempGoogleSheetUrl, setTempGoogleSheetUrl] = useState('')
  const [tempGoogleSlideUrl, setTempGoogleSlideUrl] = useState('')
  const [tempSelectedPrinter, setTempSelectedPrinter] = useState<Printer | null>(null)
  const [loadingPrinters, setLoadingPrinters] = useState(false)
  const [showPrintNodeConfig, setShowPrintNodeConfig] = useState(false)
  const [tempPrintNodeConfig, setTempPrintNodeConfig] = useState<PrintNodeConfig>({
    apiKey: '',
    printerId: ''
  })
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [showDebug, setShowDebug] = useState(false)
  
  const {
    googleSheetUrl,
    setGoogleSheetUrl,
    googleSlideUrl,
    setGoogleSlideUrl,
    availablePrinters,
    setAvailablePrinters,
    selectedPrinter,
    setSelectedPrinter,
    printNodeConfig,
    setPrintNodeConfig,
    setError
  } = useAppStore()
  
  // Initialize form with stored values
  useEffect(() => {
    setTempGoogleSheetUrl(googleSheetUrl)
    setTempGoogleSlideUrl(googleSlideUrl)
    setTempSelectedPrinter(selectedPrinter)
    
    if (printNodeConfig) {
      setTempPrintNodeConfig(printNodeConfig)
      setShowPrintNodeConfig(true)
    }
    
    // Show debug by default on Netlify
    if (isRunningOnNetlify()) {
      setShowDebug(true);
    }
    
    // Log some debug info
    console.log('Settings component mounted');
    console.log('Available printers:', availablePrinters);
    console.log('Selected printer:', selectedPrinter);
    console.log('PrintNode config:', printNodeConfig);
    
    // Load printers on mount if none available
    if (availablePrinters.length === 0) {
      loadPrinters()
    }
  }, [googleSheetUrl, googleSlideUrl, selectedPrinter, printNodeConfig, availablePrinters])
  
  // When PrintNode is selected, show config
  useEffect(() => {
    if (tempSelectedPrinter?.type === 'printnode') {
      setShowPrintNodeConfig(true)
    }
  }, [tempSelectedPrinter])
  
  // Load available printers
  async function loadPrinters() {
    setLoadingPrinters(true)
    setError(null)
    setDebugInfo({
      status: 'loading',
      timestamp: new Date().toISOString()
    });
    
    try {
      const printers = await fetchPrinters()
      console.log('Printers loaded:', printers);
      
      // Add printers even if empty or undefined - with safety checks
      setAvailablePrinters(Array.isArray(printers) ? printers : []);
      
      // Force add PrintNode option if it's missing
      const hasPrintNodeOption = Array.isArray(printers) && 
                                printers.some(p => p.type === 'printnode');
      
      if (!hasPrintNodeOption) {
        const printNodePrinter = {
          id: 'printnode',
          name: 'PrintNode (Cloud Printing)',
          location: 'Cloud',
          isDefault: false,
          type: 'printnode',
          description: 'Print to any printer connected to PrintNode'
        };
        
        console.log('Adding PrintNode printer option manually:', printNodePrinter);
        setAvailablePrinters(prev => 
          Array.isArray(prev) ? [...prev, printNodePrinter] : [printNodePrinter]
        );
      }
      
      setDebugInfo(prev => ({
        ...prev,
        status: 'success',
        printers: Array.isArray(printers) ? printers : [],
        hasPrintNodeOption,
        manuallyAdded: !hasPrintNodeOption
      }));
      
      // Check if there are real printers (not mock)
      const realPrinters = Array.isArray(printers) 
        ? printers.filter((p: Printer) => !p.name.includes('Mock') && p.type !== 'printnode')
        : [];
      
      toast({
        title: 'Printers Detected',
        description: `Found ${realPrinters.length} system ${realPrinters.length === 1 ? 'printer' : 'printers'}${realPrinters.length === 0 ? ', using mock printers instead' : ''}`,
      })
      
      // Select default printer if available, otherwise first printer if none selected
      if (Array.isArray(printers) && printers.length > 0) {
        const defaultPrinter = printers.find((p: Printer) => p.isDefault);
        if (!selectedPrinter) {
          setTempSelectedPrinter(defaultPrinter || printers[0])
        }
      }
      
    } catch (error) {
      console.error('Error loading printers:', error);
      setDebugInfo(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      }));
      
      toast({
        title: 'Error',
        description: 'Failed to load printers. Using mock printers instead.',
        variant: 'destructive',
      })
      setError('Failed to load printers')
      
      // Add mock printers and PrintNode option if loading fails
      const mockPrinters = [
        {
          id: 'printer1',
          name: 'Office Printer (Mock)',
          location: 'Main Office',
          isDefault: true,
          type: 'mock'
        },
        {
          id: 'printnode',
          name: 'PrintNode (Cloud Printing)',
          location: 'Cloud',
          isDefault: false,
          type: 'printnode',
          description: 'Print to any printer connected to PrintNode'
        }
      ];
      
      setAvailablePrinters(mockPrinters);
      if (!selectedPrinter) {
        setTempSelectedPrinter(mockPrinters[0]);
      }
      
    } finally {
      setLoadingPrinters(false)
    }
  }
  
  // Save settings
  function saveSettings() {
    setIsLoading(true)
    
    try {
      // Validate URLs
      if (!isValidUrl(tempGoogleSheetUrl) || !isValidUrl(tempGoogleSlideUrl)) {
        toast({
          title: 'Invalid URLs',
          description: 'Please enter valid Google Sheets and Slides URLs',
          variant: 'destructive',
        })
        return
      }
      
      // Validate printer selection
      if (!tempSelectedPrinter) {
        toast({
          title: 'Printer Required',
          description: 'Please select a printer',
          variant: 'destructive',
        })
        return
      }
      
      // Validate PrintNode configuration if selected
      if (tempSelectedPrinter.type === 'printnode') {
        if (!tempPrintNodeConfig.apiKey || !tempPrintNodeConfig.printerId) {
          toast({
            title: 'PrintNode Configuration Required',
            description: 'Please enter your PrintNode API Key and Printer ID',
            variant: 'destructive',
          })
          return
        }
        
        // Save PrintNode config
        setPrintNodeConfig(tempPrintNodeConfig)
      } else if (!showPrintNodeConfig) {
        // Clear PrintNode config if not using PrintNode
        setPrintNodeConfig(null)
      }
      
      // Save settings
      setGoogleSheetUrl(tempGoogleSheetUrl)
      setGoogleSlideUrl(tempGoogleSlideUrl)
      setSelectedPrinter(tempSelectedPrinter)
      
      toast({
        title: 'Settings Saved',
        description: 'Your configuration has been updated',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
      setError('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Validate URL format
  function isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch (error) {
      return false
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your Google integration and printer settings
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setShowDebug(!showDebug)}
        >
          <Bug className="h-5 w-5" />
        </Button>
      </div>
      
      {showDebug && (
        <div className="border rounded-md p-4 bg-muted/20 space-y-2">
          <h3 className="font-medium">Debug Information</h3>
          <pre className="text-xs overflow-auto p-2 bg-muted rounded">
            {JSON.stringify({
              isNetlify: isRunningOnNetlify(),
              availablePrinters: availablePrinters.map(p => ({id: p.id, name: p.name, type: p.type})),
              hasPrintNode: availablePrinters.some(p => p.type === 'printnode'),
              debugInfo,
              selectedPrinter: tempSelectedPrinter ? {id: tempSelectedPrinter.id, name: tempSelectedPrinter.name, type: tempSelectedPrinter.type} : null,
            }, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="grid gap-6">
        {/* Google Sheets Configuration */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Google Integration</h2>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="googleSheetUrl">Google Sheet URL</Label>
              <input
                id="googleSheetUrl"
                type="url"
                value={tempGoogleSheetUrl}
                onChange={(e) => setTempGoogleSheetUrl(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
              <p className="text-sm text-muted-foreground">
                Enter the URL of your Google Sheet containing the barcode data
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="googleSlideUrl">Google Slide Template URL</Label>
              <input
                id="googleSlideUrl"
                type="url"
                value={tempGoogleSlideUrl}
                onChange={(e) => setTempGoogleSlideUrl(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://docs.google.com/presentation/d/..."
              />
              <p className="text-sm text-muted-foreground">
                Enter the URL of your Google Slide template for label printing
              </p>
            </div>
          </div>
        </div>
        
        {/* Printer Configuration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Printer Settings</h2>
              <div className="text-sm bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {availablePrinters.filter((p: Printer) => !p.name.includes('Mock') && p.type !== 'printnode').length} system {availablePrinters.filter((p: Printer) => !p.name.includes('Mock') && p.type !== 'printnode').length === 1 ? 'printer' : 'printers'} detected
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPrinters}
              disabled={loadingPrinters}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loadingPrinters ? 'animate-spin' : ''}`} />
              {loadingPrinters ? 'Scanning...' : 'Scan for Printers'}
            </Button>
          </div>
          
          <div className="space-y-4">
            {availablePrinters.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availablePrinters.map(printer => {
                  const isMockPrinter = printer.type === 'mock';
                  const isPrintNodePrinter = printer.type === 'printnode';
                  
                  return (
                    <div 
                      key={printer.id}
                      className={`flex flex-col p-4 rounded-lg border cursor-pointer ${
                        tempSelectedPrinter?.id === printer.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent/50'
                      }`}
                      onClick={() => setTempSelectedPrinter(printer)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {isPrintNodePrinter ? (
                            <Cloud className="h-5 w-5 text-blue-500" />
                          ) : (
                            <PrinterIcon className={`h-5 w-5 ${isMockPrinter ? 'text-orange-500' : 'text-green-600'}`} />
                          )}
                          {printer.isDefault && !isPrintNodePrinter && (
                            <div className="absolute -top-1 -right-1 bg-primary rounded-full w-2 h-2"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-medium truncate">{printer.name}</p>
                            {printer.isDefault && !isPrintNodePrinter && (
                              <span className="text-xs bg-primary/10 text-primary px-1 rounded">Default</span>
                            )}
                            {isPrintNodePrinter && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Cloud</span>
                            )}
                          </div>
                          <div className="flex items-center">
                            {printer.location && (
                              <p className="text-xs text-muted-foreground truncate">{printer.location}</p>
                            )}
                            {isMockPrinter && (
                              <div className="flex items-center ml-1">
                                <Info className="h-3 w-3 text-orange-500" />
                                <span className="text-xs text-orange-500 ml-0.5">Simulated</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`h-3 w-3 rounded-full ${
                          tempSelectedPrinter?.id === printer.id
                            ? 'bg-primary'
                            : 'bg-muted'
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border rounded-md">
                <PrinterIcon className="h-10 w-10 mb-2 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Printers Found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  {loadingPrinters
                    ? 'Scanning for available printers...'
                    : 'Click "Scan for Printers" to find available system printers.'}
                </p>
              </div>
            )}
            
            {/* Add PrintNode option if it doesn't exist */}
            {!availablePrinters.some(p => p.type === 'printnode') && (
              <div className="mt-4 mb-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const printNodePrinter = {
                      id: 'printnode',
                      name: 'PrintNode (Cloud Printing)',
                      location: 'Cloud',
                      isDefault: false,
                      type: 'printnode',
                      description: 'Print to any printer connected to PrintNode'
                    };
                    
                    setAvailablePrinters(prev => [...prev, printNodePrinter]);
                    setShowPrintNodeConfig(true);
                  }}
                >
                  <Cloud className="mr-2 h-4 w-4 text-blue-500" />
                  Add PrintNode Option
                </Button>
              </div>
            )}
            
            {/* PrintNode Configuration */}
            {(showPrintNodeConfig || tempSelectedPrinter?.type === 'printnode') && (
              <div className="border rounded-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">PrintNode Configuration</h3>
                  </div>
                  
                  {tempSelectedPrinter?.type !== 'printnode' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowPrintNodeConfig(false);
                        setPrintNodeConfig(null);
                      }}
                    >
                      Hide
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="printNodeApiKey">PrintNode API Key</Label>
                    <input
                      id="printNodeApiKey"
                      type="password"
                      value={tempPrintNodeConfig.apiKey}
                      onChange={(e) => setTempPrintNodeConfig({
                        ...tempPrintNodeConfig,
                        apiKey: e.target.value
                      })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Your PrintNode API Key"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="printNodePrinterId">PrintNode Printer ID</Label>
                    <input
                      id="printNodePrinterId"
                      type="text"
                      value={tempPrintNodeConfig.printerId}
                      onChange={(e) => setTempPrintNodeConfig({
                        ...tempPrintNodeConfig,
                        printerId: e.target.value
                      })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="PrintNode Printer ID (e.g. 12345)"
                    />
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  PrintNode allows you to print to any printer connected to its service. 
                  <a 
                    href="https://www.printnode.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline ml-1"
                  >
                    Learn more
                  </a>
                </div>
              </div>
            )}
            
            {/* Printer Access Information */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">About Printer Access</p>
                <p className="text-xs text-muted-foreground">
                  The application detects printers installed on your system. If no printers are found, mock printers will be used for demonstration purposes.
                  You can also use PrintNode for cloud printing to any connected printer. For label printing, you may need to configure the appropriate label size.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <Button 
          onClick={saveSettings} 
          disabled={isLoading || loadingPrinters}
          className="w-full sm:w-auto"
        >
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
} 
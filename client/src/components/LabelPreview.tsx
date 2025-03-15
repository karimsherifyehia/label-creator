import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { ItemData } from "@/lib/types"
import { Printer } from "lucide-react"

interface LabelPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemData: ItemData | null
  onConfirm: () => void
  isLoading: boolean
}

export function LabelPreview({
  open,
  onOpenChange,
  itemData,
  onConfirm,
  isLoading,
}: LabelPreviewProps) {
  if (!itemData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print Label Preview</DialogTitle>
          <DialogDescription>
            Preview the label before printing. Confirm to send to printer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col p-4 border rounded-md bg-white">
          {/* Company Logo */}
          <div className="flex mb-4">
            <div className="bg-blue-900 text-white p-4 w-1/3">
              <div className="font-bold text-2xl transform rotate-90 origin-left translate-x-2 translate-y-9">
                DERHAL
              </div>
            </div>
            <div className="w-2/3 p-2">
              {/* Description Field */}
              <div className="mb-3">
                <p className="text-sm">{itemData.description || ""}</p>
              </div>
              
              {/* Item Name Field */}
              <div className="mb-2">
                <h3 className="font-bold text-lg">{itemData.name}</h3>
              </div>
              
              {/* Barcode Field - Using the Barcode Font */}
              <div className="flex justify-center text-center overflow-hidden mb-2">
                <div className="barcode-text">
                  {itemData.barcode || itemData.id || ""}
                </div>
              </div>
              
              {/* Price Field */}
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">{formatCurrency(itemData.price)}</span>
                <span className="text-lg font-semibold text-gray-600">السعر</span>
              </div>
            </div>
          </div>
          
          {/* Add a note to indicate this is a preview */}
          <div className="border-t pt-2 mt-2 text-center text-xs text-gray-500">
            Preview only - actual label layout may vary
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
          >
            <Printer className="mr-2 h-4 w-4" />
            {isLoading ? "Printing..." : "Print Label"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
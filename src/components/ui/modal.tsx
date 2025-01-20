import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type React from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onConfirm?: () => void
}

export function Modal({ isOpen, onClose, title, children, onConfirm }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 my-4">
          <div className="space-y-4 pb-2">{children}</div>
        </ScrollArea>
        <DialogFooter className="flex justify-end space-x-2 pt-4 border-t">
          {onConfirm && (
            <Button onClick={onConfirm} className="px-4 py-2">
              Đồng ý
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="px-4 py-2">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


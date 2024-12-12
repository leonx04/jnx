import React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
}

export function Modal({ isOpen, onClose, title, children, onConfirm }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full max-h-[60vh]">
            {children}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {onConfirm && (
            <Button onClick={onConfirm}>Đồng ý</Button>
          )}
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </CardFooter>
      </Card>
    </div>
  )
}


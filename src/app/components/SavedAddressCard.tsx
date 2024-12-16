import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from 'lucide-react'

interface SavedAddressCardProps {
  address: {
    fullName: string
    phoneNumber: string
    province: string
    district: string
    ward: string
    address: string
  }
  isSelected: boolean
  onSelect: () => void
}

export function SavedAddressCard({ address, isSelected, onSelect }: SavedAddressCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all ${isSelected ? 'border-primary' : 'hover:border-gray-400'}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold">{address.fullName}</p>
            <p className="text-sm text-gray-600">{address.phoneNumber}</p>
            <p className="text-sm mt-2">{address.address}</p>
            <p className="text-sm">{address.ward}, {address.district}</p>
            <p className="text-sm">{address.province}</p>
          </div>
          {isSelected && (
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

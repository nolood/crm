'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createClientAction } from '@/lib/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

function SubmitButton(): React.ReactElement {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Добавление...' : 'Добавить'}
    </Button>
  )
}

export function ClientForm(): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false)

  async function handleSubmit(formData: FormData): Promise<void> {
    const result = await createClientAction(formData)
    if (result.success) {
      toast.success('Клиент добавлен')
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Добавить клиента</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый клиент</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" placeholder="@username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Заметки</Label>
            <Textarea id="notes" name="notes" />
          </div>
          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  )
}

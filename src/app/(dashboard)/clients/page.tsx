import { getClients } from '@/lib/actions/clients'
import { ClientForm } from './client-form'
import { ClientsTable } from './clients-table'

export default async function ClientsPage(): Promise<React.ReactElement> {
  const clients = await getClients()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Клиенты</h1>
        <ClientForm />
      </div>

      <ClientsTable clients={clients} />
    </div>
  )
}

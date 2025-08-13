import { cn } from '@/lib/utils'
import Image from 'next/image'

const MESCHAC_AVATAR = 'https://avatars.githubusercontent.com/u/47919550?v=4'
const BERNARD_AVATAR = 'https://avatars.githubusercontent.com/u/31113941?v=4'
const THEO_AVATAR = 'https://avatars.githubusercontent.com/u/68236786?v=4'
const GLODIE_AVATAR = 'https://avatars.githubusercontent.com/u/99137927?v=4'

export const Table = ({ className }: { className?: string }) => {
    const customers = [
        {
            id: 1,
            date: '31/10/2023',
            status: 'Pagado',
            statusVariant: 'success',
            name: 'Venta mostrador',
            avatar: BERNARD_AVATAR,
            revenue: '$ 12.490 CLP',
        },
        {
            id: 2,
            date: '21/10/2023',
            status: 'Devuelto',
            statusVariant: 'warning',
            name: 'Venta tarjeta',
            avatar: MESCHAC_AVATAR,
            revenue: '$ 6.990 CLP',
        },
        {
            id: 3,
            date: '15/10/2023',
            status: 'Pagado',
            statusVariant: 'success',
            name: 'Venta delivery',
            avatar: GLODIE_AVATAR,
            revenue: '$ 28.990 CLP',
        },
        {
            id: 4,
            date: '12/10/2023',
            status: 'Anulado',
            statusVariant: 'danger',
            name: 'Venta mostrador',
            avatar: THEO_AVATAR,
            revenue: '$ 5.990 CLP',
        },
    ]

    return (
        <div className={cn('bg-background shadow-foreground/5 inset-ring-1 inset-ring-background ring-foreground/5 relative w-full overflow-hidden rounded-xl border border-transparent p-6 shadow-md ring-1', className)}>
            <div className="mb-6">
                <div className="flex gap-1.5">
                    <div className="bg-muted size-2 rounded-full border border-black/5"></div>
                    <div className="bg-muted size-2 rounded-full border border-black/5"></div>
                    <div className="bg-muted size-2 rounded-full border border-black/5"></div>
                </div>
                <div className="mt-3 text-lg font-medium">Ventas</div>
                <p className="mt-1 text-sm">Resumen diario de operaciones y canales de venta</p>
            </div>
            <table
                className="w-max table-auto border-collapse lg:w-full"
                data-rounded="medium">
                <thead className="dark:bg-background bg-gray-950/5">
                    <tr className="*:border *:p-3 *:text-left *:text-sm *:font-medium">
                        <th className="rounded-l-[--card-radius]">#</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Tipo</th>
                        <th className="rounded-r-[--card-radius]">Monto</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {customers.map((customer) => (
                        <tr
                            key={customer.id}
                            className="*:border *:p-2">
                            <td>{customer.id}</td>
                            <td>{customer.date}</td>
                            <td>
                                <span className={cn('rounded-full px-2 py-1 text-xs', customer.statusVariant == 'success' && 'bg-lime-500/15 text-lime-800', customer.statusVariant == 'danger' && 'bg-red-500/15 text-red-800', customer.statusVariant == 'warning' && 'bg-yellow-500/15 text-yellow-800')}>{customer.status}</span>
                            </td>
                            <td>
                                <div className="text-title flex items-center gap-2">
                                    <div className="size-6 overflow-hidden rounded-full relative">
                                        <Image
                                            src={customer.avatar}
                                            alt={customer.name}
                                            fill
                                            sizes="24px"
                                            className="object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                    <span className="text-foreground">{customer.name}</span>
                                </div>
                            </td>
                            <td>{customer.revenue}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

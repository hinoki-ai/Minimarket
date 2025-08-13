import React from 'react'
import { useAuth } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export default function CartItemCount({ sessionId }: { sessionId: string | null }) {
    const { userId } = useAuth()
    const args = (userId || sessionId)
        ? { userId: userId ?? undefined, sessionId: userId ? undefined : sessionId ?? undefined }
        : 'skip' as const
    const itemCount = useQuery(
        api.carts.getCartItemCount,
        args
    ) ?? 0

    if (!itemCount || itemCount <= 0) return null

    return (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
            {itemCount}
        </span>
    )
}
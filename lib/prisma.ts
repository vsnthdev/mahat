/*
 *  Creates a prisma client & stores in memory.
 *  Created On 24 April 2022
 */

import { PrismaClient } from '@prisma/client'
import { DateTime } from 'luxon'

export let db: PrismaClient

if (process.env.NODE_ENV == 'production') {
    db = new PrismaClient()
} else {
    if (!global.db) {
        global.db = new PrismaClient()
    }

    db = global.db
}

export const getCache = async (name: string, timeoutMinutes: number) => {
    // do database query
    const cache = await db.cache.findFirst({
        where: {
            id: name,
        },
    })

    const now = DateTime.now()
    const cachedAt = DateTime.fromJSDate(cache.cachedAt).plus({
        minutes: timeoutMinutes,
    })

    return cachedAt.diff(now, 'milliseconds').milliseconds < 0
        ? null
        : JSON.parse(cache.contents)
}

export const setCache = async (name: string, data: any) =>
    await db.cache.upsert({
        where: {
            id: name,
        },
        create: {
            id: name,
            contents: JSON.stringify(data),
        },
        update: {
            contents: JSON.stringify(data),
            cachedAt: new Date(),
        },
    })

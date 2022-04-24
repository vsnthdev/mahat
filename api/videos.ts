/*
 *  Feed of my latest YouTube videos.
 *  Created On 22 April 2021
 */

import Joi from 'joi'
import reader from 'rss-to-json'
import { getCache, setCache } from '../lib/prisma'
import { VercelRequest, VercelResponse } from '@vercel/node'

import { cors } from './index'

// YouTube Channel ID
const ID = 'UCo6K7mx7gWKbXbpQAMrvFwg'

const querySchema = Joi.object({
    latest: Joi.bool().default(false),
})

export default async (
    req: VercelRequest,
    res: VercelResponse,
): Promise<VercelResponse> => {
    if (req.url.startsWith('/videos') == false)
        return res.redirect(308, '/videos')

    // set headers properly
    await cors(req, res)

    // parse query arguments
    const query = await querySchema.validateAsync(req.query)

    // set the cache header to not cached by default
    res.setHeader('m-cached', 'false')

    // get from the cache
    const cache = await getCache('videos', 10)
    if (cache) {
        res.setHeader('m-cached', 'true')

        if (query.latest)
            return res.redirect(`https://youtu.be/${cache.resources[0].id}`)

        return res.status(200).json(cache)
    }

    const read = await reader(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${ID}`,
        {},
    )

    const returnable = {
        title: read.title,
        id: ID,
        resources: [],
    }

    for (const item of read.items) {
        const video = {
            title: item.title,
            id: item.id.split(':')[2],
            published: item.published,
        }

        returnable.resources.push(video)
    }

    // cache the response for next time
    await setCache('videos', returnable)

    if (query.latest)
        return res.redirect(`https://youtu.be/${returnable.resources[0].id}`)

    return res.status(200).json(returnable)
}

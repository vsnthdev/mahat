/*
 *  Feed of my latest YouTube videos.
 *  1 hour
 *  Created On 22 April 2021
 */

import { VercelRequest, VercelResponse } from '@vercel/node'
import Joi from 'joi'
import reader from 'rss-to-json'

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

    // cache policy
    res.setHeader('cache-control', 'public, max-age=3600')

    // parse query arguments
    const query = await querySchema.validateAsync(req.query)

    const read = await reader.load(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${ID}`,
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

    if (query.latest)
        return res.redirect(`https://youtu.be/${returnable.resources[0].id}`)

    return res.status(200).json(returnable)
}

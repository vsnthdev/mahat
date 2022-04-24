/*
 *  A feed of my articles fetched from my blog.
 *  Created On 01 April 2022
 */

import { VercelRequest, VercelResponse } from '@vercel/node'
import GhostContentAPI from '@tryghost/content-api'
import { cors } from './index'
import { getCache, setCache } from '../lib/prisma'

export default async (
    req: VercelRequest,
    res: VercelResponse,
): Promise<VercelResponse> => {
    if (req.url.startsWith('/articles') == false)
        return res.redirect(308, '/articles')

    // work on headers
    await cors(req, res)

    // set the cache header to not cached by default
    res.setHeader('m-cached', 'false')

    // get from the cache
    const cache = await getCache('articles', 10)
    if (cache) {
        res.setHeader('m-cached', 'true')
        return res.status(200).json(cache)
    }

    // create an authenticated Ghost content API client
    const ghost = new GhostContentAPI({
        url: 'https://vasanthdeveloper.com',
        key: process.env.GHOST_KEY,
        version: 'v4',
    })

    // fetch articles
    const articles = (
        await ghost.posts.browse({
            fields: 'slug, title, feature_image, excerpt, url, visibility',
            limit: 10,
        })
    )
        .filter((article: any) => article.visibility == 'public')
        .map((article: any) => {
            delete article.visibility
            return article
        })

    // cache the response for next time
    await setCache('articles', articles)

    // respond
    return res.status(200).json(articles)
}

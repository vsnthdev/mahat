/*
 *  A feed of my articles fetched from my blog.
 *  Created On 01 April 2022
 */

import { VercelRequest, VercelResponse } from '@vercel/node'
import GhostContentAPI from '@tryghost/content-api'
import { cors } from './index'

export default async (
    req: VercelRequest,
    res: VercelResponse,
): Promise<VercelResponse> => {
    if (req.url.startsWith('/articles') == false)
        return res.redirect(308, '/articles')

    // work on headers
    await cors(req, res)

    // create an authenticated Ghost content API client
    const ghost = new GhostContentAPI({
        url: 'https://vasanthdeveloper.com',
        key: process.env.GHOST_KEY,
        version: 'v4',
    })

    // fetch articles
    const articles = await ghost.posts.browse({
        fields: 'slug, title, feature_image, excerpt, url, visibility',
        limit: 10,
    })

    // respond
    return res.status(200).json(
        articles
            .filter((article: any) => article.visibility == 'public')
            .map((article: any) => {
                delete article.visibility
                return article
            }),
    )
}

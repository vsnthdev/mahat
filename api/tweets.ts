/*
 *  Curated feed of my Twitter tweets and threads.
 *  Created On 02 May 2021
 */

import axios from 'axios'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { getCache, setCache } from '../lib/prisma'

import { cors } from './index'

const CHANNEL = '801896274197741568'

export default async (
    req: VercelRequest,
    res: VercelResponse,
): Promise<VercelResponse> => {
    if (req.url.startsWith('/tweets') == false)
        return res.redirect(308, '/tweets')

    // work on headers
    await cors(req, res)

    // set the cache header to not cached by default
    res.setHeader('m-cached', 'false')

    // get from the cache
    const cache = await getCache('tweets', 10)
    if (cache) {
        res.setHeader('m-cached', 'true')
        return res.status(200).json(cache)
    }

    // fetch the Twitter tweets from
    // my Discord channel's tweets channel
    const { data: tweets } = await axios({
        method: 'GET',
        url: `https://discord.com/api/channels/${CHANNEL}/messages?limit=10`,
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
    })

    // loop through each tweet and convert it into an object
    for (const index in tweets) {
        let { content } = tweets[index]
        content = content.split('**').map(line => line.trim())

        tweets[index] = {
            name: content[1],
            url: content[2],
        }
    }

    // cache the response for next time
    await setCache('tweets', tweets)

    return res.status(200).json(tweets)
}

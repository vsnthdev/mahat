/*
 *  Curated feed of my Twitter tweets and threads.
 *  Created On 02 May 2021
 */

import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

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

    return res.status(200).json(tweets)
}

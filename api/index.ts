/*
 *  Responds with my personal information.
 *  1 day
 *  Created On 21 April 2021
 */

import { VercelRequest, VercelResponse } from '@vercel/node'
import Joi from 'joi'
import { TwitterClient } from 'twitter-api-client'

export const data = {
    name: 'Vasanth Srivatsa',
    displayName: 'Vasanth Developer',
    email: 'vasanth@vasanthdeveloper.com',
    bio: 'Loves 💻 computers and makes educational 📹 videos on YouTube.',
    avatar: null,
    social: {
        youtube: 'https://youtube.com/vasanthdeveloper',
        twitter: 'https://twitter.com/vasanthdevelop',
        github: 'https://github.com/vasanthdeveloper',
        telegram: 'https://t.me/vasanthdeveloper',
    },
}

const querySchema = Joi.object({
    avatar: Joi.bool().default(false),
})

export default async (
    req: VercelRequest,
    res: VercelResponse,
): Promise<VercelResponse> => {
    if (req.url.startsWith('/') == false) return res.redirect(308, '/')

    res.setHeader('cache-control', 'public, max-age=86400')

    // parse query arguments
    const query = await querySchema.validateAsync(req.query)

    // create an authenticated Twitter client
    const twitter = new TwitterClient({
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_KEY,
        accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
    })

    const profile = await twitter.accountsAndUsers.usersLookup({
        screen_name: data.social.twitter.split('/').pop(),
    })

    data.avatar = profile[0].profile_image_url_https.replace(
        '_normal',
        '_400x400',
    )

    if (query.avatar) return res.redirect(data.avatar)
    return res.status(200).json(data)
}

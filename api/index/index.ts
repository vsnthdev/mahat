/*
 *  Responds with my personal information.
 *  Created On 21 April 2021
 */

import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import fs from 'fs/promises'
import Joi from 'joi'
import yaml from 'js-yaml'
import path from 'path'
import { TwitterClient } from 'twitter-api-client'

import { DataImpl } from './data'

export const cors = async (
    { headers: { origin } }: VercelRequest,
    res: VercelResponse,
): Promise<any> => {
    const { allowed }: { allowed: string[] } = JSON.parse(
        await fs.readFile(
            path.join(__dirname, '..', '..', 'package.json'),
            'utf-8',
        ),
    )

    if (allowed.includes(origin)) {
        return res.setHeader('Access-Control-Allow-Origin', origin)
    } else {
        return res.setHeader('Access-Control-Allow-Origin', 'deny')
    }
}

const querySchema = Joi.object({
    avatar: Joi.bool().default(false),
})

// create an authenticated Twitter client
export const getTwitter = (): TwitterClient =>
    new TwitterClient({
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_KEY,
        accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
    })

// resolve a vas.cx redirect and return the URL
export const resolveRedirect = async (code: string): Promise<string> => {
    const res = await axios({
        method: 'GET',
        url: `https://vas.cx/${code}`,
    })

    return path.parse(res.request.path).base
}

export const getData = async (): Promise<DataImpl> => {
    const str = await fs.readFile(path.join(__dirname, 'profile.yml'), 'utf-8')
    return yaml.load(str) as DataImpl
}

export default async (
    req: VercelRequest,
    res: VercelResponse,
): Promise<VercelResponse> => {
    if (req.url.startsWith('/') == false) return res.redirect(308, '/')

    // set headers properly
    await cors(req, res)

    // parse query arguments
    const query = await querySchema.validateAsync(req.query)

    // create an authenticated Twitter client
    const twitter = getTwitter()

    // grab my current username dynamically
    // by resolving vas.cx/twitter
    const username = await resolveRedirect('twitter')

    // get my profile information from Twitter
    const profile = await twitter.accountsAndUsers.usersLookup({
        screen_name: username,
    })

    // get data
    const data = await getData()

    // set the avatar URL
    data.avatar = profile[0].profile_image_url_https.replace(
        '_normal',
        '_400x400',
    )

    // set the bio
    data.bio = profile[0].description.split(/[•|]+/g)[0].trim()

    // set the banner link
    data.cover = profile[0].profile_banner_url

    // set the theme color
    data.themeColor = profile[0].profile_link_color

    if (query.avatar) return res.redirect(data.avatar)
    return res.status(200).json(data)
}

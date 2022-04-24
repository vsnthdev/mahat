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
import { getCache, setCache } from '../../lib/prisma'

import { DataImpl } from './data'

export const cors = async (
    { headers: { origin } }: VercelRequest,
    res: VercelResponse,
): Promise<any> => {
    const { cors }: { cors: string[] } = JSON.parse(
        await fs.readFile(
            path.join(__dirname, '..', '..', 'package.json'),
            'utf-8',
        ),
    )

    if (cors.includes(origin)) {
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
    try {
        await axios({
            method: 'GET',
            url: `https://vas.cx/${code}`,
            maxRedirects: 0,
        })
    } catch ({ response: { status, headers } }) {
        if (status == 307) return path.parse(headers.location).base
    }
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

    // set the cache header to not cached by default
    res.setHeader('m-cached', 'false')

    // get from the cache
    const cache = await getCache('index', 10)
    if (cache) {
        if (query.avatar) return res.redirect(cache.avatar)

        res.setHeader('m-cached', 'true')
        return res.status(200).json(cache)
    }

    // create an authenticated Twitter client
    const twitter = getTwitter()

    // grab my current username dynamically
    // by resolving vas.cx/twitter
    const username = await resolveRedirect('twitter')

    // get my profile information from Twitter
    const profile = await twitter.accountsAndUsers.usersLookup({
        screen_name: username,
    })

    // fetch todoist productivity information
    const { data: todoist } = await axios({
        method: 'GET',
        url: 'https://api.todoist.com/sync/v8/completed/get_stats',
        headers: {
            Authorization: `Bearer ${process.env.TODOIST_TOKEN}`,
        },
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

    // insert details from todoist into the response
    data.todoist.karma = todoist.karma
    data.todoist.longestStreak = todoist.goals.max_daily_streak.count
    data.todoist.completed.day = todoist.days_items[0].total_completed
    data.todoist.completed.week = todoist.week_items[0].total_completed
    data.todoist.completed.total = todoist.completed_count

    // cache the response for next time
    await setCache('index', data)

    if (query.avatar) return res.redirect(data.avatar)
    return res.status(200).json(data)
}

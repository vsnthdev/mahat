/*
 *  List of projects I'm working on, organizations I've created.
 *  Created On 01 May 2021
 */

import Joi from 'joi'
import { Octokit } from '@octokit/rest'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { getCache, setCache } from '../../lib/prisma'

import { cors } from '../index'
import loop from './loop'

// GitHub username
const USER = 'vsnthdev'

const querySchema = Joi.object({
    extended: Joi.bool().default(false),
})

export default async (
    req: VercelRequest,
    res: VercelResponse,
): Promise<VercelResponse> => {
    if (req.url.startsWith('/projects') == false)
        return res.redirect(308, '/projects')

    // set proper response headers
    await cors(req, res)

    // parse query arguments
    const query = await querySchema.validateAsync(req.query)

    // set the cache header to not cached by default
    res.setHeader('m-cached', 'false')

    // get from the cache
    const cache = await getCache('projects', 10)
    if (cache) {
        res.setHeader('m-cached', 'true')
        return res.status(200).json(cache)
    }

    // initialize a new GitHub API class
    // while passing in the token
    const github = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    })

    // send requests to GitHub's API
    const {
        data: {
            followers,
            following,
            public_repos: repoCount,
            public_gists: gistCount,
        },
    } = await github.users.getAuthenticated()
    const { data: repos } = await github.repos.listForUser({
        username: USER,
        sort: 'updated',
        visibility: 'public',
    })
    const { data: gists } = await github.gists.listForUser({
        username: USER,
    })

    // prepare the returnable response
    const returnable = {
        counts: {
            followers,
            following,
            repoCount,
            gistCount,
        },
        gists: [],
        repositories: [],
    }

    // populate public gists
    for (const gist of gists.filter(gist => gist.public))
        returnable.gists.push({
            title: gist.description,
            url: gist.html_url,
            files: gist.files,
        })

    // populate the repositories
    const queue = []
    for (const repo of repos)
        queue.push(loop({ github, query, repo, returnable }))
    await Promise.all(queue)

    // cache the response for next time
    await setCache('projects', returnable)

    return res.status(200).json(returnable)
}

/*
 *  List of projects I'm working on, organizations I've created.
 *  Created On 01 May 2021
 */

import { Octokit } from '@octokit/rest'
import { VercelRequest, VercelResponse } from '@vercel/node'
import Joi from 'joi'

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
            public_repos: projects,
            public_gists: gists,
        },
    } = await github.users.getAuthenticated()
    const { data: repos } = await github.repos.listForUser({
        username: USER,
        sort: 'updated',
        visibility: 'public',
    })
    const { data: orgs } = await github.orgs.listForAuthenticatedUser()

    // prepare the returnable response
    const returnable = {
        counts: {
            followers,
            following,
            projects,
            gists,
        },
        organizations: [],
        repositories: [],
    }

    // populate the repositories
    const queue = []
    for (const repo of repos)
        queue.push(loop({ github, query, repo, returnable }))
    await Promise.all(queue)

    // populate the organizations
    for (const org of orgs)
        returnable.organizations.push({
            name: org.login,
            description: org.description,
            avatar: org.avatar_url,
        })

    return res.status(200).json(returnable)
}

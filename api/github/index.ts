/*
 *  List of projects I'm working on, organizations I've created.
 *  Created On 01 May 2021
 */

import { Octokit } from '@octokit/rest'
import { VercelRequest, VercelResponse } from '@vercel/node'

import { cors } from '../index'
import loop from './loop'

// GitHub username
const USER = 'vasanthdeveloper'

export default async (
    req: VercelRequest,
    res: VercelResponse,
): Promise<VercelResponse> => {
    if (req.url.startsWith('/github') == false)
        return res.redirect(308, '/github')

    // set proper response headers
    await cors(req, res)

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
    for (const repo of repos) await loop(repo, returnable, github)

    // populate the organizations
    for (const org of orgs)
        returnable.organizations.push({
            name: org.login,
            description: org.description,
            avatar: org.avatar_url,
        })

    return res.status(200).json(returnable)
}

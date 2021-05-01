/*
 *  Responds with a sorted list of latest projects from GitHub.
 *  Created On 01 May 2021
 */

import { Octokit } from '@octokit/rest'
import { VercelRequest, VercelResponse } from '@vercel/node'
import size from 'filesize'
import ogs from 'open-graph-scraper'

// GitHub username
const USER = 'vasanthdeveloper'

const getLanguages = async (repo: string, owner: string, github: Octokit) => {
    try {
        const { data } = await github.repos.listLanguages({ repo, owner })

        return Object.keys(data)
    } catch (err) {
        console.log(`Failed to get repository languages 👇`)
        console.log({
            repo,
            code: err.status,
            message: err.message,
        })

        return []
    }
}

export default async (
    req: VercelRequest,
    res: VercelResponse,
): Promise<VercelResponse> => {
    if (req.url != '/github') return res.redirect(308, '/github')

    // Cache the response for next 4 hours
    res.setHeader('cache-control', 'public, max-age=14400')

    // initialize a new GitHub API class
    // while passing in the token
    const github = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    })

    // send requests to GitHub's API
    const {
        status: profileStatus,
        data: {
            followers,
            following,
            public_repos: projects,
            public_gists: gists,
        },
    } = await github.users.getAuthenticated()
    const { status: reposStatus, data: repos } = await github.repos.listForUser(
        {
            username: USER,
            sort: 'updated',
            visibility: 'public',
        },
    )
    const {
        status: orgsStatus,
        data: orgs,
    } = await github.orgs.listForAuthenticatedUser()

    // handle the error
    if (profileStatus != 200)
        throw new Error(`Failed to get profile info with code ${profileStatus}`)
    if (reposStatus != 200)
        throw new Error(`Failed to get repositories with code ${reposStatus}`)
    if (orgsStatus != 200)
        throw new Error(`Failed to get organizations with code ${reposStatus}`)

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
    for (const repo of repos) {
        // we don't need to showcase forks
        if (repo.fork) continue

        const pushable = {
            name: repo.name,
            owner: repo.owner.login,
            description: repo.description,
            url: repo.html_url,
            size: size(repo.size),
            image: null,
            branch: repo.default_branch,
            counts: {
                stars: repo.stargazers_count,
                watches: repo.watchers_count,
                issues: repo.open_issues_count,
            },
        }

        // populate the homepage
        if (repo.homepage) pushable['homepage'] = repo.homepage

        // populate the license
        repo.license
            ? (pushable['license'] = repo.license.name)
            : (pushable['license'] = 'Unlicensed')

        // populate languages detected by GitHub
        pushable['languages'] = await getLanguages(
            repo.name,
            repo.owner.login,
            github,
        )

        // populate the cover image by fetching from OpenGraph API
        const { result: openGraph } = await ogs({
            url: `https://github.com/${repo.owner.login}/${repo.name}`,
        })
        pushable.image = openGraph['ogImage'].url

        returnable.repositories.push(pushable)
    }

    // populate the organizations
    for (const org of orgs)
        returnable.organizations.push({
            name: org.login,
            description: org.description,
            avatar: org.avatar_url,
        })

    return res.status(200).json(returnable)
}

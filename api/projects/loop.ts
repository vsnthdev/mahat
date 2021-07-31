/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/*
 *  Loop through each project and return a presentable
 *  response.
 *  Created On 02 May 2021
 */

import { Octokit } from '@octokit/rest'
import size from 'filesize'
import ogs from 'open-graph-scraper'

import languages from './languages'

const getImage = async ({
    query,
    repo: {
        name,
        owner: { login },
    },
}: {
    query: any
    repo: { name: string; owner: { login: string } }
}): Promise<string | void> => {
    // skip if extended is not true
    if (query.extended != true) return

    // construct the URL
    const { result: og } = await ogs({
        url: `https://github.com/${login}/${name}`,
    })

    return og['ogImage'].url
}

export default async ({
    github,
    query,
    repo,
    returnable,
}: {
    github: Octokit
    query: any
    repo: any
    returnable: any
}): Promise<void> => {
    // we don't need to showcase forks
    // or archived repositories
    if (repo.fork || repo.archived) return

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
    pushable['languages'] = await languages({ github, query, repo })

    // populate the cover image by fetching from OpenGraph API
    pushable.image = await getImage({ query, repo })

    returnable.repositories.push(pushable)
}

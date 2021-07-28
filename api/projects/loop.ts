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

export default async (
    repo: any,
    returnable: any,
    github: Octokit,
): Promise<void> => {
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
    pushable['languages'] = await languages(repo.name, repo.owner.login, github)

    // populate the cover image by fetching from OpenGraph API
    const { result: openGraph } = await ogs({
        url: `https://github.com/${repo.owner.login}/${repo.name}`,
    })
    pushable.image = openGraph['ogImage'].url

    returnable.repositories.push(pushable)
}

/*
 *  Fetches languages for a given GitHub repository.
 *  Created On 02 May 2021
 */

import { Octokit } from '@octokit/rest'

export default async ({
    github,
    query,
    repo: {
        name: repo,
        owner: { login: owner },
    },
}: {
    github: Octokit
    query: any
    repo: { name: string; owner: { login: string } }
}): Promise<string[]> => {
    // we skip this function if extended isn't true
    if (query.extended != true) return

    try {
        const { data } = await github.repos.listLanguages({ repo, owner })

        return Object.keys(data)
    } catch (err) {
        console.log(`Failed to get repository languages 👇`)
        console.log({
            name,
            code: err.status,
            message: err.message,
        })

        return []
    }
}

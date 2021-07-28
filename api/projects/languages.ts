/*
 *  Fetches languages for a given GitHub repository.
 *  Created On 02 May 2021
 */

import { Octokit } from '@octokit/rest'

export default async (
    repo: string,
    owner: string,
    github: Octokit,
): Promise<string[]> => {
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

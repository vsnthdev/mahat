/*
 *  TypeScript schema for representing data object.
 *  Created On 09 August 2021
 */

export interface DataImpl {
    email: string
    bio: string | null
    avatar: string | null
    cover: string | null
    themeColor: string | null
    todoist: {
        karma: number | null
        longestStreak: number | null
        completed: {
            day: number | null
            week: number | null
            total: number | null
        }
    }
    socials: string[]
}

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
    socials: string[]
}

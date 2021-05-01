/*
 *  Responds with my personal information.
 *  1 day
 *  Created On 21 April 2021
 */

import { VercelRequest, VercelResponse } from '@vercel/node'

const data = {
    name: 'Vasanth Srivatsa',
    username: 'Vasanth Developer',
    email: 'vasanth@vasanthdeveloper.com',
    bio: 'Love 💻 computers and makes educational 📹 videos on YouTube.',
    social: {
        YouTube: 'https://youtube.com/vasanthdeveloper',
        Twitter: 'https://twitter.com/vasanthdevelop',
        GitHub: 'https://github.com/vasanthdeveloper',
        Discord: 'https://vas.cx/discord',
        Telegram: 'https://t.me/vasanthdeveloper',
    },
}

export default (req: VercelRequest, res: VercelResponse): VercelResponse => {
    if (req.url != '/') return res.redirect(308, '/')

    res.setHeader('cache-control', 'public, max-age=86400')
    return res.status(200).json(data)
}

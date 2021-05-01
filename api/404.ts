/*
 *  Responds with a 404.
 *  Created On 01 May 2021
 */

import { VercelRequest, VercelResponse } from '@vercel/node'

export default (req: VercelRequest, res: VercelResponse): VercelResponse =>
    res.status(404).json({
        code: 404,
        message: 'Not found',
    })

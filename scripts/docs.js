/* eslint-disable @typescript-eslint/no-var-requires */
/*
 *  Generates docs by reading code and re-writes vercel.json
 *  Created On 01 May 2021
 */

const glob = require('glob')
const path = require('path')
const fs = require('fs/promises')

let files = glob
    .sync(path.join(__dirname, '..', 'api', '*.ts'))
    .concat(glob.sync(path.join(__dirname, '..', 'api', '**', 'index.ts')))
const src = path.join(path.join(__dirname, '..', 'README.template.md'))
const dest = path.join(path.join(__dirname, '..', 'README.md'))

// getRoutes() will loop through each file
// and read the file's header command to get
// the description of that route.
const routes = async template => {
    let data = []
    let render = ''

    // remove the first element as it's a
    // duplicate of index.js
    files = Array.from(new Set(files))

    for (const file of files) {
        // skip 404
        if (path.parse(file).name == '404') continue

        let txt = await fs.readFile(file, 'utf-8')
        txt = txt
            .split('*/')[0]
            .split('\n')
            .map(line => line.substring(4))
            .filter(line => line.length != 0)
            .filter(line => line.startsWith('Created On') == false)
            .join('\n')

        const description = txt.split('\n').pop().trim()

        txt = txt.split('\n').splice(0, 1).join('\n')

        const name = file
            .substr(path.join(__dirname, '..', 'api').length + 1)
            .split(path.sep)[0]

        data.push({
            description,
            method: 'GET',
            path: `/${
                path.parse(name).name == 'index' ? '' : path.parse(name).name
            }`,
        })
    }

    // sort them
    data = data.sort((a, b) => {
        if (a.path.slice(1) < b.path.slice(1)) {
            return -1
        }

        if (a.path.slice(1) > b.path.slice(1)) {
            return 1
        }

        return 0
    })

    for (const route of data)
        render = render.concat(
            `| \`${route.method}\` | \`${route.path}\` | ${route.description} |\n`,
        )

    return template.replace('<!-- {routes} -->', render)
}

const main = async () => {
    // read the src file
    const template = await fs.readFile(src, 'utf-8')

    const render = await routes(template)

    // write the file back
    await fs.writeFile(dest, render, 'utf-8')
}

main()

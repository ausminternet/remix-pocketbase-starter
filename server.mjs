import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'

import { createRequestHandler } from '@remix-run/express'
import { broadcastDevReady, installGlobals } from '@remix-run/node'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import morgan from 'morgan'
import PocketBase from 'pocketbase'
import sourceMapSupport from 'source-map-support'
import invariant from 'tiny-invariant'

sourceMapSupport.install({
  retrieveSourceMap: function (source) {
    // get source file without the `file://` prefix or `?t=...` suffix
    const match = source.match(/^file:\/\/(.*)\?t=[.\d]+$/)
    if (match) {
      return {
        url: source,
        map: fs.readFileSync(`${match[1]}.map`, 'utf8'),
      }
    }
    return null
  },
})
installGlobals()

/** @typedef {import('@remix-run/node').ServerBuild} ServerBuild */

const BUILD_PATH = path.resolve('build/index.js')
const VERSION_PATH = path.resolve('build/version.txt')

const initialBuild = await reimportServer()

async function getLoadContext(req) {
  invariant(process.env.POCKETBASE_URL, 'POCKETBASE_URL is not set')
  const pb = new PocketBase(process.env.POCKETBASE_URL)

  const parsedCookie = JSON.parse(req.cookies['pb_auth'] || '{}')
  pb.authStore.save(parsedCookie.token || '', parsedCookie.model || null)

  try {
    pb.authStore.isValid && (await pb.collection('users').authRefresh())
  } catch (_) {
    pb.authStore.clear()
  }

  return {
    pb,
  }
}

const remixHandler =
  process.env.NODE_ENV === 'development'
    ? await createDevRequestHandler(initialBuild)
    : createRequestHandler({
        build: initialBuild,
        getLoadContext,
        mode: initialBuild.mode,
      })

const app = express()

app.use(compression())
app.use(cookieParser())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

// Remix fingerprints its assets so we can cache forever.
app.use(
  '/build',
  express.static('public/build', { immutable: true, maxAge: '1y' }),
)

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }))

app.use(morgan('tiny'))

app.all('*', remixHandler)

const host = process.env.APP_HOST || 'localhost'
const port = process.env.APP_PORT || 3000

app.listen(port, host, async () => {
  console.log(`Express server listening on  ${host}:${port}`)

  if (process.env.NODE_ENV === 'development') {
    broadcastDevReady(initialBuild)
  }
})

/**
 * @returns {Promise<ServerBuild>}
 */
async function reimportServer() {
  const stat = fs.statSync(BUILD_PATH)

  // convert build path to URL for Windows compatibility with dynamic `import`
  const BUILD_URL = url.pathToFileURL(BUILD_PATH).href

  // use a timestamp query parameter to bust the import cache
  return import(BUILD_URL + '?t=' + stat.mtimeMs)
}

/**
 * @param {ServerBuild} initialBuild
 * @returns {Promise<import('@remix-run/express').RequestHandler>}
 */
async function createDevRequestHandler(initialBuild) {
  let build = initialBuild
  async function handleServerUpdate() {
    // 1. re-import the server build
    build = await reimportServer()
    // 2. tell Remix that this app server is now up-to-date and ready
    broadcastDevReady(build)
  }
  const chokidar = await import('chokidar')
  chokidar
    .watch(VERSION_PATH, { ignoreInitial: true })
    .on('add', handleServerUpdate)
    .on('change', handleServerUpdate)

  // wrap request handler to make sure its recreated with the latest build for every request
  return async (req, res, next) => {
    try {
      return createRequestHandler({
        build,
        getLoadContext,
        mode: 'development',
      })(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

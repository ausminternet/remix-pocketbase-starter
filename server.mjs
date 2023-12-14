import { createRequestHandler } from '@remix-run/express'
import { broadcastDevReady } from '@remix-run/node'
import cookieParser from 'cookie-parser'
import express from 'express'
import PocketBase from 'pocketbase'
import invariant from 'tiny-invariant'
import * as build from './build/index.js'

const app = express()
app.use(express.static('public'))
app.use(cookieParser())

app.all(
  '*',
  createRequestHandler({
    build,
    async getLoadContext(req) {
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
    },
  }),
)

const host = process.env.APP_HOST || 'localhost'
const port = process.env.APP_PORT || 3000

app.listen(port, host, () => {
  if (process.env.NODE_ENV === 'development') {
    broadcastDevReady(build)
  }
  console.log(`App listening on http://${host}:${port}`)
})

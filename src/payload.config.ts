import path from 'path'
import { fileURLToPath } from 'url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Topics } from './collections/Topics'
import { Journeys } from './collections/Journeys'
import { Variants } from './collections/Variants'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- HeGetsUs Admin',
    },
  },
  routes: {
    admin: '/',
  },
  collections: [Users, Media, Topics, Journeys, Variants],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Schema push only runs outside production; Vercel's serverless functions
    // boot with NODE_ENV=production, so prodMigrations is what actually
    // creates tables there (bundled into the function, no filesystem/CLI step needed).
    push: process.env.NODE_ENV !== 'production',
    prodMigrations: migrations,
  }),
  graphQL: {
    disable: true,
  },
})

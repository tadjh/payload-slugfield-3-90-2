import { randomUUID } from 'node:crypto'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

const content = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Body', version: 1 }],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
} as const

const createPost = (title: string, slug?: string) =>
  payload.create({
    collection: 'posts',
    data: { title, _status: 'published', content, ...(slug ? { slug } : {}) } as never,
    // The template's revalidate hooks need a Next.js request; skip them here.
    context: { disableRevalidate: true },
  })

describe('slugField', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('generates the slug when a published post is created without one', async () => {
    const id = randomUUID().slice(0, 8)
    const post = await createPost(`Hello Slug ${id}`)
    expect(post.slug).toBe(`hello-slug-${id}`)
  })

  it('keeps a slug given by hand (control)', async () => {
    const id = randomUUID().slice(0, 8)
    const post = await createPost(`Hand Slug ${id}`, `hand-slug-${id}`)
    expect(post.slug).toBe(`hand-slug-${id}`)
  })
})

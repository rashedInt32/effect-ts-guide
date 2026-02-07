/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EFFECT SCHEMA - PRACTICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Complete these exercises to master Effect Schema.
 * Reference: ./schema.reference.ts
 *
 * Run with: bun run 02-schema/schema.practice.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Effect, Match, Schema } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1: Create Branded Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create branded types for a blog post system.
 *
 * 1. PostId - A branded string for post IDs
 * 2. AuthorId - A branded string for author IDs
 * 3. Slug - A branded string for URL slugs
 * 4. ViewCount - A branded non-negative integer
 */

// export const PostId = ???
// export type PostId = ???

// export const AuthorId = ???
// export type AuthorId = ???

// export const Slug = ???
// export type Slug = ???

// export const ViewCount = ???
// export type ViewCount = ???

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2: Create a Schema.Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a BlogPost class with Schema.Class
 *
 * Fields:
 * - id: PostId (branded)
 * - authorId: AuthorId (branded)
 * - title: string
 * - slug: Slug (branded)
 * - content: string
 * - viewCount: ViewCount (branded)
 * - publishedAt: Date (optional, use Schema.optionalWith with { as: "Option" })
 * - createdAt: Date
 *
 * Add a getter:
 * - isPublished: boolean (true if publishedAt is Some)
 */

// export class BlogPost extends Schema.Class<BlogPost>("BlogPost")({
//   ???
// }) {
//   get isPublished(): boolean {
//     ???
//   }
// }

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3: Create Tagged Variants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a union type for blog post status.
 *
 * 1. Draft - Has fields: postId (PostId)
 * 2. Published - Has fields: postId (PostId), publishedAt (Date)
 * 3. Archived - Has fields: postId (PostId), archivedAt (Date), reason (string)
 *
 * Then create a function displayStatus that pattern matches on the status
 * and returns a descriptive string.
 */

// export class Draft extends Schema.TaggedClass<Draft>()("Draft", {
//   ???
// }) {}

// export class Published extends Schema.TaggedClass<Published>()("Published", {
//   ???
// }) {}

// export class Archived extends Schema.TaggedClass<Archived>()("Archived", {
//   ???
// }) {}

// export const PostStatus = Schema.Union(???)
// export type PostStatus = typeof PostStatus.Type

// export const displayStatus = (status: PostStatus): string =>
//   Match.valueTags(status, {
//     ???
//   })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4: Decode Unknown Data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a function that decodes raw JSON data into a BlogPost.
 *
 * The function should:
 * 1. Accept unknown data
 * 2. Decode it using Schema.decodeUnknown
 * 3. Handle ParseError and return a friendly error message
 * 4. Return the decoded BlogPost on success
 */

// export const decodeBlogPost = (rawData: unknown) =>
//   Effect.gen(function* () {
//     ???
//   })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5: Create Input/Output Schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create input schemas for CRUD operations.
 *
 * 1. CreatePostInput - For creating a new post
 *    Fields: title, slug, content, authorId
 *    (No id, viewCount, dates - those are auto-generated)
 *
 * 2. UpdatePostInput - For updating an existing post
 *    Fields: title (optional), content (optional)
 *
 * 3. PostFilters - For querying posts
 *    Fields: authorId (optional), isPublished (optional boolean)
 */

// export const CreatePostInput = Schema.Struct({
//   ???
// })
// export type CreatePostInput = typeof CreatePostInput.Type

// export const UpdatePostInput = Schema.Struct({
//   ???
// })
// export type UpdatePostInput = typeof UpdatePostInput.Type

// export const PostFilters = Schema.Struct({
//   ???
// })
// export type PostFilters = typeof PostFilters.Type

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 6: Complete Domain Model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Build a complete comment system for blog posts.
 *
 * 1. CommentId - Branded string
 * 2. Comment class with:
 *    - id: CommentId
 *    - postId: PostId
 *    - authorId: AuthorId
 *    - content: string (min 1 char, max 1000 chars)
 *    - createdAt: Date
 *    - updatedAt: Date
 *
 * 3. CreateCommentInput struct
 * 4. A function createComment that:
 *    - Takes raw input and postId
 *    - Validates the input
 *    - Creates a Comment with generated id and timestamps
 */

// Your code here...

// ─────────────────────────────────────────────────────────────────────────────
// TEST YOUR SOLUTIONS
// ─────────────────────────────────────────────────────────────────────────────

const main = Effect.gen(function* () {
  yield* Effect.logInfo("=== Schema Practice ===")

  // Uncomment and test your solutions:

  // Exercise 1: Test branded types
  // const postId = PostId.make("post-123")
  // const authorId = AuthorId.make("author-456")
  // yield* Effect.logInfo(`PostId: ${postId}, AuthorId: ${authorId}`)

  // Exercise 2: Test BlogPost class
  // const post = BlogPost.make({
  //   id: PostId.make("post-1"),
  //   authorId: AuthorId.make("author-1"),
  //   title: "Hello World",
  //   slug: Slug.make("hello-world"),
  //   content: "This is my first post.",
  //   viewCount: ViewCount.make(0),
  //   publishedAt: Option.none(),
  //   createdAt: new Date(),
  // })
  // yield* Effect.logInfo(`Post "${post.title}" isPublished: ${post.isPublished}`)

  // Exercise 3: Test variants
  // const draft = Draft.make({ postId: PostId.make("post-1") })
  // yield* Effect.logInfo(displayStatus(draft))

  // Exercise 4: Test decoding
  // const rawData = {
  //   id: "post-1",
  //   authorId: "author-1",
  //   title: "Test Post",
  //   slug: "test-post",
  //   content: "Content here",
  //   viewCount: 0,
  //   createdAt: new Date().toISOString(),
  // }
  // const decoded = yield* decodeBlogPost(rawData)
  // yield* Effect.logInfo(`Decoded post: ${decoded.title}`)

  // Exercise 6: Test comment creation
  // const comment = yield* createComment(
  //   { content: "Great post!" },
  //   PostId.make("post-1"),
  //   AuthorId.make("author-2")
  // )
  // yield* Effect.logInfo(`Created comment: ${comment.id}`)

  yield* Effect.logInfo("All exercises completed!")
})

// Uncomment to run:
// Effect.runPromise(main).catch(console.error)

export { main }

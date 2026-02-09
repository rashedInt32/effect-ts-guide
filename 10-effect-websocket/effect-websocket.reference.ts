/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * @effect/platform WEBSOCKET - REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Effect's WebSocket module provides type-safe, composable bidirectional
 * communication with automatic resource management and error handling.
 *
 * WHY EFFECT WEBSOCKET?
 * - Automatic connection lifecycle management
 * - Type-safe message handling with Schema
 * - Built-in error handling and reconnection
 * - Works seamlessly with Effect's concurrency model
 * - Backpressure-aware streaming with Channels
 *
 * TABLE OF CONTENTS:
 *   1. What is WebSocket? - Quick conceptual overview
 *   2. Setting Up - Installation and imports
 *   3. Creating a WebSocket Client - Connection basics
 *   4. Sending & Receiving Messages - Core usage
 *   5. Error Handling - Errors and reconnection
 *   6. WebSocket with Layers - DI pattern
 *   7. Streaming with Channels - Stream processing
 *   8. Server-Side WebSocket - Building servers
 *   9. Complete Example - Real-time chat app
 *   10. Anti-Patterns - What NOT to do
 *
 * DOCS: https://effect.website/docs/platform/introduction
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Socket, SocketServer } from "@effect/platform"
import { NodeSocket } from "@effect/platform-node"
import { Config, Console, Context, Effect, Layer, Queue, Schedule, Schema, Stream } from "effect"

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: WHAT IS WEBSOCKET?
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         WEBSOCKET IN 30 SECONDS                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  HTTP (Request/Response)          WEBSOCKET (Persistent)                  ║
 * ║  ───────────────────────          ──────────────────────                  ║
 * ║  Client ──→ Server                Client ←──────→ Server                  ║
 * ║      ←─────                       (bidirectional, always open)            ║
 * ║  (Connection closes)                                                      ║
 * ║                                                                           ║
 * ║  USE WEBSOCKET WHEN:                                                      ║
 * ║  - Real-time chat, live updates, gaming                                   ║
 * ║  - Server needs to push data to client                                    ║
 * ║  - Low latency is critical                                                ║
 * ║                                                                           ║
 * ║  HOW IT WORKS:                                                            ║
 * ║  1. Client sends HTTP "Upgrade" request                                   ║
 * ║  2. Server responds with 101 "Switching Protocols"                        ║
 * ║  3. Connection stays open for bidirectional data                          ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: SETTING UP
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Required packages:
 *
 * npm install @effect/platform @effect/platform-node
 *
 * For browser clients, use @effect/platform-browser instead.
 */

// Main imports for Node.js
import { Effect as EffectModule, Layer as LayerModule } from "effect"
import { Socket as SocketModule } from "@effect/platform"
import { NodeSocket as NodeSocketModule } from "@effect/platform-node"

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: CREATING A WEBSOCKET CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    TWO WAYS TO CREATE WEBSOCKET CLIENT                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  1. Socket.makeWebSocket(url) - Direct creation                           ║
 * ║     → Returns Effect<Socket, never, WebSocketConstructor>                 ║
 * ║     → Good for one-off connections                                        ║
 * ║                                                                           ║
 * ║  2. Socket.layerWebSocket(url) - Layer-based                              ║
 * ║     → Returns Layer<Socket, never, WebSocketConstructor>                  ║
 * ║     → Good for dependency injection pattern                               ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 3a. Simple Client Connection (Direct)
// ─────────────────────────────────────────────────────────────────────────────

const createSimpleConnection = Effect.gen(function* () {
  // Create a WebSocket connection
  // Requires WebSocketConstructor - provided by platform layer
  const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")

  yield* Effect.logInfo("WebSocket connected!")

  return socket
})
// Type: Effect<Socket.Socket, never, Socket.WebSocketConstructor>

// ─────────────────────────────────────────────────────────────────────────────
// 3b. Connection with Options
// ─────────────────────────────────────────────────────────────────────────────

const createConnectionWithOptions = Effect.gen(function* () {
  const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/", {
    // Optional: WebSocket subprotocols
    protocols: ["chat", "superchat"],

    // Optional: Timeout for connection open
    openTimeout: "10 seconds",

    // Optional: Custom logic to determine if close code is an error
    closeCodeIsError: (code) => code !== 1000 && code !== 1001,
  })

  return socket
})

// ─────────────────────────────────────────────────────────────────────────────
// 3c. The Socket Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Socket provides three main methods:
 *
 * 1. socket.run(handler)        - Listen for messages with a handler
 * 2. socket.runRaw(handler)     - Listen for raw (string | Uint8Array) messages
 * 3. socket.writer              - Get a function to send messages
 */

const demonstrateSocketInterface = Effect.gen(function* () {
  const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")

  // Method 1: Run with message handler
  // This Effect runs forever until the socket closes
  const runEffect = socket.run((data) =>
    Effect.gen(function* () {
      yield* Effect.logInfo(`Received: ${new TextDecoder().decode(data)}`)
    })
  )

  // Method 2: Get writer to send messages
  const writer = yield* socket.writer

  // Send a message
  yield* writer(new TextEncoder().encode("Hello, WebSocket!"))

  // Keep listening
  yield* runEffect
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: SENDING & RECEIVING MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     MESSAGE FLOW: SEND & RECEIVE                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  SENDING:                              RECEIVING:                         ║
 * ║  ────────                              ─────────                          ║
 * ║  const writer = yield* socket.writer   socket.run((data) => {             ║
 * ║  yield* writer(message)                  // handle message                ║
 * ║                                                                           ║
 * ║  Message types:                                                           ║
 * ║  - Uint8Array (binary)                                                    ║
 * ║  - string (text)                                                          ║
 * ║  - Socket.CloseEvent (to close connection)                                ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 4a. Echo Client Example
// ─────────────────────────────────────────────────────────────────────────────

const echoClient = Effect.gen(function* () {
  yield* Effect.logInfo("Connecting to echo server...")

  const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")

  // Fork the listener so it runs concurrently
  const listenerFiber = yield* Effect.fork(
    socket.run((data) =>
      Effect.gen(function* () {
        const message = new TextDecoder().decode(data)
        yield* Effect.logInfo(`📨 Received: ${message}`)
      })
    )
  )

  // Get writer and send messages
  const writer = yield* socket.writer

  yield* Effect.logInfo("Sending messages...")
  yield* writer("Hello, WebSocket!")
  yield* writer("This is message 2")
  yield* writer("Goodbye!")

  // Wait a bit then close
  yield* Effect.sleep("2 seconds")
  yield* writer(new Socket.CloseEvent(1000, "Done"))

  // Wait for listener to complete
  yield* listenerFiber

  yield* Effect.logInfo("Connection closed")
})

// ─────────────────────────────────────────────────────────────────────────────
// 4b. Working with Strings (Most Common)
// ─────────────────────────────────────────────────────────────────────────────

const stringBasedClient = Effect.gen(function* () {
  const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")

  // Use runRaw for string messages
  const listener = Effect.fork(
    socket.runRaw((data) => {
      // data is string | Uint8Array
      const message = typeof data === "string" ? data : new TextDecoder().decode(data)
      return Effect.logInfo(`Got: ${message}`)
    })
  )

  yield* listener

  const writer = yield* socket.writer

  // Can send strings directly
  yield* writer("Hello as string")

  // Or Uint8Array
  yield* writer(new TextEncoder().encode("Hello as binary"))
})

// ─────────────────────────────────────────────────────────────────────────────
// 4c. Handling Connection Open
// ─────────────────────────────────────────────────────────────────────────────

const connectionWithOnOpen = Effect.gen(function* () {
  const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")

  const writer = yield* socket.writer

  yield* socket
    .run(
      (data) => Effect.logInfo(`Received: ${new TextDecoder().decode(data)}`),
      {
        // Runs when connection opens
        onOpen: Effect.gen(function* () {
          yield* Effect.logInfo("✅ Connection opened!")
          yield* writer("Hello from onOpen!").pipe(Effect.catchAll(() => Effect.void))
        }).pipe(Effect.catchAll(() => Effect.void)),
      }
    )
    .pipe(Effect.catchAll(() => Effect.void))
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    WEBSOCKET ERROR TYPES                                   ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  Socket.SocketError = SocketGenericError | SocketCloseError               ║
 * ║                                                                           ║
 * ║  - SocketGenericError: Connection failures, network errors                ║
 * ║  - SocketCloseError: Clean or error closes with code and reason           ║
 * ║                                                                           ║
 * ║  CLOSE CODES:                                                             ║
 * ║  - 1000: Normal closure                                                   ║
 * ║  - 1001: Going away (browser closing)                                     ║
 * ║  - 1006: Abnormal closure (connection lost)                               ║
 * ║  - 1011: Server error                                                     ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 5a. Basic Error Handling
// ─────────────────────────────────────────────────────────────────────────────

const connectionWithErrorHandling = Effect.gen(function* () {
  const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")

  const result = yield* socket
    .run((data) => Effect.logInfo(`Data: ${data}`))
    .pipe(
      Effect.catchAll((error) =>
        Effect.gen(function* () {
          if (Socket.SocketCloseError.is(error)) {
            yield* Effect.logWarning(`Connection closed: ${error.code} - ${error.reason}`)
          } else {
            yield* Effect.logError(`Socket error: ${error}`)
          }
        })
      )
    )

  return result
})

// ─────────────────────────────────────────────────────────────────────────────
// 5b. Reconnection with Retry
// ─────────────────────────────────────────────────────────────────────────────

const connectionWithRetry = Effect.gen(function* () {
  const connectAndRun = Effect.gen(function* () {
    yield* Effect.logInfo("Attempting connection...")
    const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")

    yield* socket.run((data) => Effect.logInfo(`Data: ${new TextDecoder().decode(data)}`))
  })

  // Retry with exponential backoff
  yield* connectAndRun.pipe(
    Effect.retry(
      Schedule.exponential("1 second").pipe(
        Schedule.compose(Schedule.recurs(5)) // Max 5 retries
      )
    ),
    Effect.catchAll((error) => Effect.logError(`Failed after retries: ${error}`))
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// 5c. Detecting Clean vs Error Closes
// ─────────────────────────────────────────────────────────────────────────────

const detectCloseType = Effect.gen(function* () {
  const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")

  yield* socket.run((data) => Effect.void).pipe(
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        if (Socket.SocketCloseError.is(error)) {
          // Check if it's a clean close (code 1000 or 1001)
          const isClean = error.code === 1000 || error.code === 1001

          if (isClean) {
            yield* Effect.logInfo(`Clean close: ${error.reason}`)
          } else {
            yield* Effect.logError(`Error close: ${error.code} - ${error.reason}`)
          }
        }
      })
    )
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: WEBSOCKET WITH LAYERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              DEPENDENCY INJECTION FOR WEBSOCKET                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  Instead of creating sockets directly, provide them as a service.         ║
 * ║  This makes testing easy and follows Effect's DI pattern.                 ║
 * ║                                                                           ║
 * ║  LAYERS NEEDED:                                                           ║
 * ║  1. Socket.layerWebSocketConstructorGlobal - Provides WebSocket class     ║
 * ║  2. Socket.layerWebSocket(url) - Creates Socket service                   ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 6a. Creating a WebSocket Service
// ─────────────────────────────────────────────────────────────────────────────

class ChatSocket extends Context.Tag("@app/ChatSocket")<ChatSocket, Socket.Socket>() {}

// Layer that provides ChatSocket - using Layer.effect to wrap
const ChatSocketLive = Layer.effect(
  ChatSocket,
  Effect.gen(function* () {
    const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")
    return socket
  })
).pipe(Layer.provide(Socket.layerWebSocketConstructorGlobal))

// Or more simply, just use Socket.Socket directly
const WebSocketLive = Layer.merge(
  Socket.layerWebSocketConstructorGlobal,
  Socket.layerWebSocket("wss://echo.websocket.org/")
)

// ─────────────────────────────────────────────────────────────────────────────
// 6b. Using WebSocket in a Service
// ─────────────────────────────────────────────────────────────────────────────

class ChatService extends Context.Tag("@app/ChatService")<
  ChatService,
  {
    readonly sendMessage: (message: string) => Effect.Effect<void>
    readonly messages: Stream.Stream<string>
  }
>() {
  static readonly live = Layer.effect(
    ChatService,
    Effect.gen(function* () {
      const socket = yield* Socket.Socket

      // Create a queue to broadcast messages
      const messageQueue = yield* Queue.unbounded<string>()

      // Start listener in background
      yield* Effect.fork(
        socket.run((data) =>
          Effect.gen(function* () {
            const message = new TextDecoder().decode(data)
            yield* Queue.offer(messageQueue, message)
          })
        )
      )

      const writer = yield* socket.writer

      const sendMessage = (message: string) =>
        Effect.gen(function* () {
          yield* writer(message)
          yield* Effect.logInfo(`Sent: ${message}`)
        }).pipe(Effect.catchAll(() => Effect.void))

      const messages = Stream.fromQueue(messageQueue)

      return ChatService.of({ sendMessage, messages })
    })
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6c. Providing the Layer
// ─────────────────────────────────────────────────────────────────────────────

const chatProgram = Effect.gen(function* () {
  const chat = yield* ChatService

  // Send a message
  yield* chat.sendMessage("Hello from service!")

  // Listen for messages
  yield* chat.messages.pipe(
    Stream.take(3),
    Stream.runForEach((msg) => Effect.logInfo(`📨 ${msg}`))
  )
})

// Compose layers
const ChatAppLive = ChatService.live.pipe(
  Layer.provide(Socket.layerWebSocket("wss://echo.websocket.org/")),
  Layer.provide(Socket.layerWebSocketConstructorGlobal)
)

// Run it
// const runnable = chatProgram.pipe(Effect.provide(ChatAppLive))

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: STREAMING WITH CHANNELS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    SOCKET AS A STREAM (CHANNELS)                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  Channels provide backpressure-aware streaming for WebSocket data.        ║
 * ║  Use this when you need to process large amounts of data or               ║
 * ║  integrate with Effect's Stream ecosystem.                                ║
 * ║                                                                           ║
 * ║  KEY FUNCTIONS:                                                           ║
 * ║  - Socket.toChannel(socket)        - Convert to Channel<Uint8Array>       ║
 * ║  - Socket.toChannelString(socket)  - Convert to Channel<string>           ║
 * ║  - Socket.makeWebSocketChannel()   - Create channel directly              ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 7a. Basic Channel Usage
// ─────────────────────────────────────────────────────────────────────────────

const channelExample = Effect.gen(function* () {
  const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")

  // Convert socket to channel
  const channel = Socket.toChannel(socket)

  // Now you can use all Channel/Stream operations
  // This is advanced - usually run() is sufficient
})

// ─────────────────────────────────────────────────────────────────────────────
// 7b. String Channel
// ─────────────────────────────────────────────────────────────────────────────

const stringChannelExample = Effect.gen(function* () {
  const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")

  // For string-based processing, use runRaw with proper decoding
  // Channels are for advanced use cases - here's a Stream-based approach:
  yield* Effect.gen(function* () {
    const queue = yield* Queue.unbounded<string>()

    // Fork message listener
    yield* Effect.fork(
      socket.runRaw((data) => {
        const text = typeof data === "string" ? data : new TextDecoder().decode(data)
        return Queue.offer(queue, text)
      })
    )

    // Process messages as a stream
    yield* Stream.fromQueue(queue).pipe(
      Stream.take(5),
      Stream.runForEach((message) => Effect.logInfo(`Stream: ${message}`))
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7c. When to Use Channels
// ─────────────────────────────────────────────────────────────────────────────

/**
 * USE CHANNELS WHEN:
 * - Processing large data streams
 * - Need backpressure control
 * - Integrating with Stream pipelines
 * - Building data processing pipelines
 *
 * USE run() WHEN:
 * - Simple message handlers
 * - Event-driven logic
 * - Most WebSocket use cases
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: SERVER-SIDE WEBSOCKET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    CREATING A WEBSOCKET SERVER                             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  Effect's SocketServer handles WebSocket upgrades from HTTP servers.      ║
 * ║  You need an HTTP server that supports upgrade handling.                  ║
 * ║                                                                           ║
 * ║  NodeSocketServer.layer creates a server that listens for connections.    ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 8a. Basic Server Setup
// ─────────────────────────────────────────────────────────────────────────────

import { NodeSocketServer } from "@effect/platform-node"

// Simple TCP socket server layer (WebSocket servers use layerWebSocket)
const serverLayer = NodeSocketServer.layer({ port: 8080 })

// ─────────────────────────────────────────────────────────────────────────────
// 8b. Handling Connections
// ─────────────────────────────────────────────────────────────────────────────

const handleConnection = (socket: Socket.Socket) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("New client connected!")

    const writer = yield* socket.writer

    // Send welcome message
    yield* writer("Welcome to the server!")

      // Handle incoming messages
      yield* socket
        .runRaw((data) =>
          Effect.gen(function* () {
            const message = typeof data === "string" ? data : new TextDecoder().decode(data)
            yield* Effect.logInfo(`Received: ${message}`)

            // Echo back
            yield* writer(`Echo: ${message}`)
          })
        )
        .pipe(Effect.catchAll(() => Effect.void))

      yield* Effect.logInfo("Client disconnected")
    })

const serverProgram = Effect.gen(function* () {
  const server = yield* SocketServer.SocketServer

  yield* Effect.logInfo("WebSocket server starting on port 8080...")

  // Listen for connections
  yield* server.run(handleConnection)
})

// ─────────────────────────────────────────────────────────────────────────────
// 8c. Server with Connection Management
// ─────────────────────────────────────────────────────────────────────────────

const advancedServerProgram = Effect.gen(function* () {
  const server = yield* SocketServer.SocketServer

  // Track connected clients
  const clients = yield* Effect.sync(() => new Set<Socket.Socket>())

  const handleClient = (socket: Socket.Socket) =>
    Effect.gen(function* () {
      clients.add(socket)
      yield* Effect.logInfo(`Client connected. Total: ${clients.size}`)

      const writer = yield* socket.writer

      yield* socket
        .runRaw((data) => {
          const message = typeof data === "string" ? data : new TextDecoder().decode(data)
          return Effect.logInfo(`Message from client: ${message}`)
        })
        .pipe(
          Effect.ensuring(
            Effect.sync(() => {
              clients.delete(socket)
              console.log(`Client disconnected. Total: ${clients.size}`)
            })
          )
        )
    })

  yield* server.run(handleClient)
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: COMPLETE EXAMPLE - REAL-TIME CHAT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Full chat application with client and server
 */

// ─────────────────────────────────────────────────────────────────────────────
// 9a. Message Schema
// ─────────────────────────────────────────────────────────────────────────────

const ChatMessageSchema = Schema.Struct({
  type: Schema.Literal("message", "join", "leave"),
  username: Schema.String,
  content: Schema.String,
  timestamp: Schema.Number,
})

type ChatMessage = typeof ChatMessageSchema.Type

// ─────────────────────────────────────────────────────────────────────────────
// 9b. Chat Client
// ─────────────────────────────────────────────────────────────────────────────

const createChatClient = (username: string) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`[${username}] Connecting...`)

    const socket = yield* Socket.makeWebSocket("wss://echo.websocket.org/")
    const writer = yield* socket.writer

    // Send join message
    const joinMessage: ChatMessage = {
      type: "join",
      username,
      content: `${username} joined the chat`,
      timestamp: Date.now(),
    }
    yield* writer(JSON.stringify(joinMessage))

    // Handle incoming messages
    const listener = Effect.fork(
      socket.runRaw((data) =>
        Effect.gen(function* () {
          const text = typeof data === "string" ? data : new TextDecoder().decode(data)
          try {
            const message = yield* Schema.decodeUnknown(ChatMessageSchema)(JSON.parse(text))
            yield* Effect.logInfo(`[${message.username}]: ${message.content}`)
          } catch {
            yield* Effect.logInfo(`[Raw]: ${text}`)
          }
        })
      )
    )

    yield* listener

    return {
      send: (content: string) =>
        Effect.gen(function* () {
          const message: ChatMessage = {
            type: "message",
            username,
            content,
            timestamp: Date.now(),
          }
          yield* writer(JSON.stringify(message))
        }),
      disconnect: () => writer(new Socket.CloseEvent(1000, "Leaving")),
    }
  })

// ─────────────────────────────────────────────────────────────────────────────
// 9c. Chat Server
// ─────────────────────────────────────────────────────────────────────────────

const createChatServer = Effect.gen(function* () {
  const server = yield* SocketServer.SocketServer

  const clients = yield* Effect.sync(() => new Map<string, Socket.Socket>())
  const messageHistory = yield* Effect.sync(() => [] as ChatMessage[])

  const broadcast = (message: ChatMessage, exclude?: string) =>
    Effect.gen(function* () {
      const data = JSON.stringify(message)
      for (const [username, socket] of clients.entries()) {
        if (username !== exclude) {
          const writer = yield* socket.writer
          yield* writer(data).pipe(Effect.catchAll(() => Effect.void))
        }
      }
    })

  const handleClient = (socket: Socket.Socket) =>
    Effect.gen(function* () {
      let currentUser = "anonymous"

      yield* socket
        .runRaw((data) =>
          Effect.gen(function* () {
            const text = typeof data === "string" ? data : new TextDecoder().decode(data)

            try {
              const message = yield* Schema.decodeUnknown(ChatMessageSchema)(JSON.parse(text))

              if (message.type === "join") {
                currentUser = message.username
                clients.set(currentUser, socket)
                yield* Effect.logInfo(`${currentUser} joined`)

                // Send history
                const writer = yield* socket.writer
                for (const hist of messageHistory.slice(-10)) {
                  yield* writer(JSON.stringify(hist))
                }

                yield* broadcast(message)
              } else if (message.type === "message") {
                messageHistory.push(message)
                yield* broadcast(message)
              }
            } catch {
              yield* Effect.logWarning(`Invalid message: ${text}`)
            }
          })
        )
        .pipe(
          Effect.ensuring(
            Effect.gen(function* () {
              clients.delete(currentUser)
              yield* broadcast({
                type: "leave",
                username: currentUser,
                content: `${currentUser} left`,
                timestamp: Date.now(),
              })
            })
          )
        )
    })

  yield* Effect.logInfo("Chat server starting...")
  yield* server.run(handleClient)
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: ANTI-PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      COMMON MISTAKES TO AVOID                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ❌ DON'T: Forget to yield* the writer
// const badSend = Effect.gen(function* () {
//   const socket = yield* Socket.makeWebSocket("...")
//   const writer = yield* socket.writer
//   writer("message")  // Missing yield*!
// })

// ✅ CORRECT:
// yield* writer("message")

// ❌ DON'T: Run multiple run() calls on same socket
// const badRun = Effect.gen(function* () {
//   const socket = yield* Socket.makeWebSocket("...")
//   yield* Effect.fork(socket.run(handler1))
//   yield* Effect.fork(socket.run(handler2))  // Only one run() allowed!
// })

// ✅ CORRECT: Use single handler with branching logic

// ❌ DON'T: Forget to handle socket closure
// const badLifecycle = Effect.gen(function* () {
//   const socket = yield* Socket.makeWebSocket("...")
//   yield* socket.run(handler)  // If this fails, no cleanup
// })

// ✅ CORRECT: Use ensuring for cleanup
// yield* socket.run(handler).pipe(
//   Effect.ensuring(cleanupEffect)
// )

// ❌ DON'T: Create new connections in loops
// const badLoop = Effect.gen(function* () {
//   for (const msg of messages) {
//     const socket = yield* Socket.makeWebSocket("...")  // Creates many connections!
//     yield* socket.writer(msg)
//   }
// })

// ✅ CORRECT: Create one connection, reuse it

// ❌ DON'T: Ignore backpressure in high-throughput scenarios
// If sending many messages, use Queue or Stream to manage flow

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // Section 3: Client
  createSimpleConnection,
  createConnectionWithOptions,
  demonstrateSocketInterface,

  // Section 4: Messages
  echoClient,
  stringBasedClient,
  connectionWithOnOpen,

  // Section 5: Errors
  connectionWithErrorHandling,
  connectionWithRetry,
  detectCloseType,

  // Section 6: Layers
  ChatSocket,
  ChatSocketLive,
  ChatService,
  chatProgram,
  ChatAppLive,

  // Section 7: Channels
  channelExample,
  stringChannelExample,

  // Section 8: Server
  serverLayer,
  handleConnection,
  serverProgram,
  advancedServerProgram,

  // Section 9: Complete
  ChatMessageSchema,
  createChatClient,
  createChatServer,
}

import type { Problem } from '../types'
import { connected, countMin, keyword, minNodes, noOrphans, presence } from './rubricHelpers'

export const PROBLEMS: Problem[] = [
  {
    id: 'url-shortener',
    title: 'Design a URL Shortener',
    difficulty: 'Easy',
    tags: ['API design', 'databases', 'caching'],
    summary:
      'Build a service like bit.ly that turns long URLs into short, shareable aliases and redirects visitors from the short link back to the original URL.',
    functionalRequirements: [
      'Given a long URL, generate a unique short alias (e.g. sho.rt/abc123).',
      'Visiting the short alias redirects (HTTP 302) to the original long URL.',
      'Users can optionally pick a custom alias.',
      'Links can optionally expire after a configurable time.',
    ],
    nonFunctionalRequirements: [
      'Redirects must be very low latency (sub-100ms).',
      'System should be highly available — a redirect failure is worse than a slightly stale click counter.',
      'Reads (redirects) vastly outnumber writes (creations), roughly 100:1.',
    ],
    constraints: [
      '~500M new short links created per month',
      '~50B redirects served per month',
      'Average URL length ~100 bytes',
    ],
    keyQuestions: [
      {
        id: 'encoding',
        prompt: 'How do you generate short, unique aliases and avoid collisions at scale?',
        keywords: ['base62', 'base 62', 'hash', 'counter', 'snowflake', 'md5', 'collision', 'unique id'],
      },
      {
        id: 'read-scaling',
        prompt: 'Redirects dominate traffic. How do you keep them fast as read volume grows?',
        keywords: ['cache', 'redis', 'memcache', 'cdn', 'read replica', 'hot key'],
      },
      {
        id: 'expiry',
        prompt: 'How do you handle link expiry and cleanup without slowing down redirects?',
        keywords: ['ttl', 'expire', 'lazy delete', 'background job', 'cron'],
      },
    ],
    rubric: [
      {
        id: 'api',
        name: 'Core Functionality & API',
        weight: 0.25,
        checks: [
          presence(['api_gateway', 'web_server', 'app_server'], 'Has a request-handling tier', 'Add an API Gateway, Web Server, or App Server to accept create/redirect requests.', 10),
          keyword(['base62', 'base 62', 'counter', 'hash', 'snowflake'], 'Explains alias generation strategy', 'Describe how short codes are generated (e.g. base62 counter, hashing).', 10, ['encoding']),
          keyword(['redirect', '302', '301'], 'Explains the redirect mechanism', 'Mention the HTTP redirect status used and where the mapping lookup happens.', 5, ['encoding']),
        ],
      },
      {
        id: 'scale',
        name: 'Scalability & Performance',
        weight: 0.3,
        checks: [
          presence(['cache'], 'Uses a cache for hot redirects', 'Add a Cache in front of the database for the read-heavy redirect path.', 15),
          presence(['load_balancer'], 'Uses a load balancer', 'Add a Load Balancer so redirect traffic can be spread across many servers.', 10),
          connected(['cache', 'app_server'], 'Cache sits in the redirect path', 'Connect the Cache to the App/Web server so redirects check it before the database.', 10),
          keyword(['cache', 'redis', 'memcache', 'cdn'], 'Discusses read scaling explicitly', 'Explain how caching or a CDN keeps redirect latency low under heavy read load.', 10, ['read-scaling']),
        ],
      },
      {
        id: 'reliability',
        name: 'Reliability & Availability',
        weight: 0.2,
        checks: [
          countMin('sql_database', 1, 'Persists mappings durably', 'Use a database (SQL or NoSQL) to durably store the short-to-long mapping.', 10),
          keyword(['replica', 'replication', 'failover', 'multi-az', 'multi-region'], 'Considers database redundancy', 'Mention replication or failover so a single DB node failure does not cause an outage.', 10),
        ],
      },
      {
        id: 'data',
        name: 'Data Model & Housekeeping',
        weight: 0.25,
        checks: [
          presence(['sql_database', 'nosql_database'], 'Has a datastore for mappings', 'Add a SQL or NoSQL database to store short-code → long-URL mappings.', 10),
          keyword(['ttl', 'expire', 'lazy', 'cron', 'background job'], 'Handles link expiry', 'Describe how expired links are cleaned up (TTL, lazy deletion, or a background sweep job).', 10, ['expiry']),
          noOrphans(5),
          minNodes(4, 5),
        ],
      },
    ],
    reference: {
      overview:
        'Clients hit a Load Balancer in front of stateless App Servers. Writes generate a base62 code from a distributed counter (or hash + collision check) and persist the mapping in a SQL database with a unique index on the short code; the same write populates a Cache. Reads (redirects) check the Cache first and fall back to the DB on a miss, keeping the hot path fast even at tens of thousands of redirects per second. A background job sweeps expired rows using a TTL column.',
      nodes: [
        { id: 'ref-client', type: 'client', label: 'Client', x: 40, y: 180 },
        { id: 'ref-lb', type: 'load_balancer', label: 'Load Balancer', x: 260, y: 180 },
        { id: 'ref-app', type: 'app_server', label: 'App Server (fleet)', x: 480, y: 180 },
        { id: 'ref-cache', type: 'cache', label: 'Cache (code → URL)', x: 700, y: 80 },
        { id: 'ref-db', type: 'sql_database', label: 'SQL DB (mappings)', x: 700, y: 280 },
      ],
      edges: [
        { id: 'e1', source: 'ref-client', target: 'ref-lb' },
        { id: 'e2', source: 'ref-lb', target: 'ref-app' },
        { id: 'e3', source: 'ref-app', target: 'ref-cache', label: 'check first' },
        { id: 'e4', source: 'ref-app', target: 'ref-db', label: 'on miss / writes' },
      ],
      tradeoffs: [
        'Base62 counter gives short, sequential codes but needs a coordination point (e.g. sharded counters or Snowflake IDs) to avoid a single point of contention.',
        'Hash-based codes (MD5/SHA truncated) avoid coordination but need a collision-check read before insert.',
        'Caching redirect lookups trades a small staleness window for a large latency win — acceptable since mappings rarely change after creation.',
      ],
    },
  },

  {
    id: 'rate-limiter',
    title: 'Design a Distributed Rate Limiter',
    difficulty: 'Easy',
    tags: ['distributed systems', 'algorithms', 'caching'],
    summary:
      'Design a rate limiting service that throttles how many requests a client (by API key or user ID) can make in a given time window, shared consistently across many API server instances.',
    functionalRequirements: [
      'Limit each client to N requests per time window (e.g. 100 req/min).',
      'Reject requests over the limit with HTTP 429 and a Retry-After header.',
      'Support different limits per API tier (free vs. paid).',
      'Work correctly across many API server instances, not just one.',
    ],
    nonFunctionalRequirements: [
      'Limiter check must add minimal latency (single-digit ms) to every request.',
      'Must stay accurate under high concurrency (no significant over-admission).',
      'Should degrade gracefully (fail open or closed, explicitly chosen) if the limiter store is unavailable.',
    ],
    constraints: ['~200K requests/sec across the fleet', 'Limits configured per API key, up to millions of keys'],
    keyQuestions: [
      {
        id: 'algorithm',
        prompt: 'Which rate-limiting algorithm do you use (fixed window, sliding window, token bucket, leaky bucket) and why?',
        keywords: ['token bucket', 'leaky bucket', 'sliding window', 'fixed window', 'sliding log'],
      },
      {
        id: 'shared-state',
        prompt: 'How do multiple API server instances share rate-limit counters consistently?',
        keywords: ['redis', 'centralized', 'shared store', 'atomic', 'lua script', 'incr'],
      },
      {
        id: 'failure-mode',
        prompt: 'What happens to traffic if the rate-limit store goes down — fail open or fail closed?',
        keywords: ['fail open', 'fail closed', 'degrade', 'circuit breaker'],
      },
    ],
    rubric: [
      {
        id: 'algorithm',
        name: 'Algorithm Choice',
        weight: 0.3,
        checks: [
          keyword(['token bucket', 'leaky bucket', 'sliding window', 'sliding log'], 'Names a specific rate-limiting algorithm', 'Pick and justify a concrete algorithm (token bucket, leaky bucket, or sliding window) instead of a vague description.', 20, ['algorithm']),
          keyword(['burst'], 'Discusses burst handling', 'Explain whether short bursts above the average rate are allowed and how.', 10, ['algorithm']),
        ],
      },
      {
        id: 'shared-state',
        name: 'Shared / Distributed State',
        weight: 0.35,
        checks: [
          presence(['cache'], 'Uses a shared low-latency store for counters', 'Add a Cache (e.g. Redis) as the shared counter store so all API instances agree on usage.', 15),
          presence(['api_gateway', 'app_server', 'microservice'], 'Has an enforcement point', 'Add an API Gateway or App Server tier where the limiter check happens on every request.', 10),
          connected(['api_gateway', 'cache'], 'Gateway checks the shared store', 'Connect the API Gateway (or app server) to the Cache so the limit check is centralized, not per-instance.', 10),
          keyword(['atomic', 'lua', 'incr', 'race condition'], 'Addresses atomicity/race conditions', 'Explain how concurrent requests updating the same counter stay atomic (e.g. Redis INCR or a Lua script).', 10, ['shared-state']),
        ],
      },
      {
        id: 'reliability',
        name: 'Reliability & Failure Handling',
        weight: 0.2,
        checks: [
          keyword(['fail open', 'fail closed'], 'Explicitly chooses a failure mode', 'State clearly whether the system fails open (allow traffic) or fails closed (block traffic) if the store is unreachable.', 15, ['failure-mode']),
        ],
      },
      {
        id: 'config',
        name: 'Configuration & Extensibility',
        weight: 0.15,
        checks: [
          keyword(['tier', 'per-key', 'per key', 'configurable', 'quota'], 'Supports per-client / per-tier configuration', 'Describe how different clients or plans get different limits.', 10),
          noOrphans(5),
        ],
      },
    ],
    reference: {
      overview:
        'Every request passes through an API Gateway that runs the rate-limit check before forwarding to backend App Servers. Counters live in a shared Cache (Redis) keyed by client ID + window, updated atomically via a Lua script implementing a sliding-window or token-bucket algorithm so the check is race-free across all gateway instances. Limit configuration (per API key / tier) is stored alongside in the cache or a small config DB and hot-reloaded. On cache unavailability the gateway is configured to fail open for a bounded period while alerting, favoring availability over strict enforcement.',
      nodes: [
        { id: 'ref-client', type: 'client', label: 'Client', x: 40, y: 160 },
        { id: 'ref-gw', type: 'api_gateway', label: 'API Gateway (limiter check)', x: 280, y: 160 },
        { id: 'ref-cache', type: 'cache', label: 'Redis (counters)', x: 520, y: 60 },
        { id: 'ref-app', type: 'app_server', label: 'App Server', x: 520, y: 260 },
      ],
      edges: [
        { id: 'e1', source: 'ref-client', target: 'ref-gw' },
        { id: 'e2', source: 'ref-gw', target: 'ref-cache', label: 'atomic incr / check' },
        { id: 'e3', source: 'ref-gw', target: 'ref-app', label: 'if allowed' },
      ],
      tradeoffs: [
        'Token bucket allows controlled bursts and is cheap to compute; sliding-log is the most accurate but memory-heavy at scale.',
        'A centralized Redis store is simple and consistent but becomes a shared dependency — mitigate with clustering and a fail-open fallback.',
        'Fixed windows are simplest to implement but allow 2x burst at window boundaries; sliding window avoids that at slightly higher cost.',
      ],
    },
  },

  {
    id: 'chat-app',
    title: 'Design a Real-Time Chat Application',
    difficulty: 'Medium',
    tags: ['real-time', 'websockets', 'messaging'],
    summary:
      'Design a WhatsApp/Slack-style messaging system supporting 1:1 and group chats, real-time delivery, delivery/read receipts, and offline message storage.',
    functionalRequirements: [
      'Users can send 1:1 and group messages that are delivered in real time to online recipients.',
      'Messages sent while a recipient is offline are stored and delivered on reconnect.',
      'Delivery and read receipts are shown to the sender.',
      'Chat history is retrievable when a user opens a conversation.',
    ],
    nonFunctionalRequirements: [
      'Message delivery latency should be near-instant (<1s) for online users.',
      'No messages should be lost, even across server restarts or client disconnects.',
      'System must scale to tens of millions of concurrent connections.',
    ],
    constraints: ['~50M daily active users', '~5M concurrent WebSocket connections at peak', '~1B messages/day'],
    keyQuestions: [
      {
        id: 'realtime',
        prompt: 'How do you deliver messages to online users in real time, and route across many connection servers?',
        keywords: ['websocket', 'long polling', 'connection server', 'pub/sub', 'presence'],
      },
      {
        id: 'offline',
        prompt: 'How are messages handled and delivered when the recipient is offline?',
        keywords: ['queue', 'inbox', 'store and forward', 'push notification', 'persist'],
      },
      {
        id: 'ordering',
        prompt: 'How do you guarantee messages in a conversation are stored and shown in a consistent order?',
        keywords: ['sequence', 'timestamp', 'ordering', 'vector clock', 'message id'],
      },
    ],
    rubric: [
      {
        id: 'realtime',
        name: 'Real-Time Delivery',
        weight: 0.3,
        checks: [
          presence(['websocket_service'], 'Uses a persistent-connection tier', 'Add a WebSocket Service to hold long-lived connections for real-time delivery.', 15),
          keyword(['websocket', 'pub/sub', 'presence'], 'Explains the real-time fan-out mechanism', 'Describe how a message from one connection server reaches a recipient connected to a different one (e.g. pub/sub between connection servers).', 15, ['realtime']),
          connected(['client', 'websocket_service'], 'Clients connect via the WebSocket tier', 'Connect the Client to the WebSocket Service to show where the persistent connection lives.', 10),
        ],
      },
      {
        id: 'messaging-backbone',
        name: 'Messaging Backbone & Offline Delivery',
        weight: 0.25,
        checks: [
          presence(['message_queue'], 'Uses a message queue for decoupling / offline delivery', 'Add a Message Queue so messages can be reliably handed off between senders, storage, and offline recipients.', 15),
          keyword(['offline', 'store and forward', 'inbox', 'push notification'], 'Describes offline message handling', 'Explain what happens to a message when the recipient is not currently connected.', 15, ['offline']),
        ],
      },
      {
        id: 'storage',
        name: 'Data Model & Durability',
        weight: 0.25,
        checks: [
          presence(['nosql_database', 'sql_database'], 'Persists chat history durably', 'Add a database to durably store message history per conversation.', 10),
          keyword(['sequence', 'message id', 'timestamp', 'ordering'], 'Addresses message ordering', 'Explain how message order within a conversation is preserved and reconstructed.', 10, ['ordering']),
          countMin('nosql_database', 1, 'Chooses a scalable store for message history', 'Consider a NoSQL store partitioned by conversation ID for very high message write volume.', 10),
        ],
      },
      {
        id: 'scale',
        name: 'Scalability & Reliability',
        weight: 0.2,
        checks: [
          presence(['load_balancer'], 'Load-balances connection servers', 'Add a Load Balancer capable of distributing/sticky-routing WebSocket connections.', 10),
          noOrphans(5),
          minNodes(5, 5),
        ],
      },
    ],
    reference: {
      overview:
        'Clients open a persistent WebSocket connection through a Load Balancer to a fleet of WebSocket Services (connection servers). Each connection server registers the user\'s presence in a shared Cache. Sending a message publishes it to a Message Queue; a delivery worker looks up the recipient\'s connection server via presence and pushes it over the live socket if online, and always persists it to a NoSQL database partitioned by conversation ID. If the recipient is offline, a Notification Service sends a push notification and the message waits in their inbox until next connect, when history is paged from the database.',
      nodes: [
        { id: 'ref-client', type: 'client', label: 'Client', x: 20, y: 220 },
        { id: 'ref-lb', type: 'load_balancer', label: 'Load Balancer', x: 220, y: 220 },
        { id: 'ref-ws', type: 'websocket_service', label: 'WebSocket Service (fleet)', x: 420, y: 220 },
        { id: 'ref-cache', type: 'cache', label: 'Presence Cache', x: 420, y: 40 },
        { id: 'ref-mq', type: 'message_queue', label: 'Message Queue', x: 640, y: 220 },
        { id: 'ref-db', type: 'nosql_database', label: 'NoSQL DB (messages)', x: 860, y: 140 },
        { id: 'ref-notif', type: 'notification_service', label: 'Notification Service', x: 860, y: 320 },
      ],
      edges: [
        { id: 'e1', source: 'ref-client', target: 'ref-lb' },
        { id: 'e2', source: 'ref-lb', target: 'ref-ws' },
        { id: 'e3', source: 'ref-ws', target: 'ref-cache', label: 'presence' },
        { id: 'e4', source: 'ref-ws', target: 'ref-mq', label: 'publish' },
        { id: 'e5', source: 'ref-mq', target: 'ref-db', label: 'persist' },
        { id: 'e6', source: 'ref-mq', target: 'ref-notif', label: 'if offline' },
      ],
      tradeoffs: [
        'WebSockets give the lowest latency but require sticky routing and presence tracking; long-polling is simpler to load-balance but slower.',
        'A pub/sub layer between connection servers (or the queue itself) is what lets a message "hop" from the sender\'s server to the recipient\'s server.',
        'Partitioning message storage by conversation ID keeps per-chat history contiguous and fast to page, at the cost of hot partitions for very large groups.',
      ],
    },
  },

  {
    id: 'news-feed',
    title: 'Design a Social Media News Feed',
    difficulty: 'Medium',
    tags: ['fan-out', 'caching', 'ranking'],
    summary:
      'Design the feed system behind a Twitter/Instagram-style app: users follow other users, post content, and see a reverse-chronological (or ranked) feed of posts from people they follow.',
    functionalRequirements: [
      'Users can post content and follow/unfollow other users.',
      'A user\'s home feed shows recent posts from everyone they follow.',
      'Feed loads quickly even for users following thousands of accounts.',
      'Support for celebrity accounts with millions of followers.',
    ],
    nonFunctionalRequirements: [
      'Feed read latency should be low (<200ms) for a good UX.',
      'System should handle highly skewed follower graphs (some accounts have 50M+ followers).',
      'Eventual consistency for feed freshness is acceptable; posting should feel fast to the author.',
    ],
    constraints: ['~300M daily active users', '~500M posts/day', 'average user follows ~300 accounts'],
    keyQuestions: [
      {
        id: 'fanout',
        prompt: 'Do you fan out a new post to followers\' feeds at write time or compute the feed at read time? How do you handle celebrity accounts?',
        keywords: ['fan-out', 'fanout', 'push', 'pull', 'hybrid', 'celebrity'],
      },
      {
        id: 'feed-cache',
        prompt: 'How do you keep reading a feed fast?',
        keywords: ['cache', 'precompute', 'materialize', 'redis'],
      },
      {
        id: 'ranking',
        prompt: 'Is the feed strictly chronological or ranked, and how would ranking change the design?',
        keywords: ['ranking', 'chronological', 'relevance', 'ml', 'score'],
      },
    ],
    rubric: [
      {
        id: 'fanout',
        name: 'Fan-out Strategy',
        weight: 0.35,
        checks: [
          keyword(['fan-out', 'fanout', 'push', 'pull', 'hybrid'], 'Chooses an explicit fan-out strategy', 'State whether you fan out posts to followers on write, compute on read, or use a hybrid — this is the central design decision.', 20, ['fanout']),
          keyword(['celebrity', 'hybrid', 'hot user', 'high fan-out'], 'Handles high fan-out / celebrity accounts', 'Explain how accounts with millions of followers avoid an enormous write amplification on every post.', 15, ['fanout']),
        ],
      },
      {
        id: 'perf',
        name: 'Read Performance',
        weight: 0.25,
        checks: [
          presence(['cache'], 'Caches feed data', 'Add a Cache to store precomputed or recently accessed feed data for fast reads.', 15),
          presence(['message_queue'], 'Uses async processing for fan-out', 'Add a Message Queue so fan-out writes happen asynchronously and don\'t block the post request.', 10),
        ],
      },
      {
        id: 'data',
        name: 'Data Model & Storage',
        weight: 0.25,
        checks: [
          presence(['nosql_database', 'sql_database'], 'Has a store for posts and the social graph', 'Add a database for posts and another (or the same, modeled separately) for the follow graph.', 10),
          countMin('nosql_database', 1, 'Uses a scalable store for feed/timeline data', 'A NoSQL store partitioned by user is a common fit for per-user timeline data at this scale.', 10),
          connected(['app_server', 'message_queue'], 'Post writes trigger async fan-out', 'Connect the App Server to the Message Queue so a new post enqueues fan-out work instead of doing it inline.', 5),
        ],
      },
      {
        id: 'ranking',
        name: 'Feed Composition',
        weight: 0.15,
        checks: [
          keyword(['ranking', 'chronological', 'relevance', 'score'], 'Discusses feed ordering', 'Mention whether the feed is chronological or ranked, even briefly.', 10, ['ranking']),
          noOrphans(5),
        ],
      },
    ],
    reference: {
      overview:
        'A post write hits an App Server, is persisted, and publishes a fan-out job to a Message Queue. Workers consuming the queue push the post ID into each follower\'s precomputed timeline, stored in a NoSQL database and warmed in a Cache — this is the "push" path used for normal accounts. For celebrity accounts (millions of followers), fan-out is skipped at write time; instead their posts are merged into a follower\'s feed at read time ("pull"), keeping the write path bounded. Reading a feed merges the precomputed cached timeline with any pulled celebrity posts before returning to the client.',
      nodes: [
        { id: 'ref-client', type: 'client', label: 'Client', x: 20, y: 220 },
        { id: 'ref-lb', type: 'load_balancer', label: 'Load Balancer', x: 220, y: 220 },
        { id: 'ref-app', type: 'app_server', label: 'App Server', x: 420, y: 220 },
        { id: 'ref-mq', type: 'message_queue', label: 'Fan-out Queue', x: 640, y: 100 },
        { id: 'ref-cache', type: 'cache', label: 'Timeline Cache', x: 860, y: 100 },
        { id: 'ref-db', type: 'nosql_database', label: 'Posts / Timelines DB', x: 640, y: 320 },
      ],
      edges: [
        { id: 'e1', source: 'ref-client', target: 'ref-lb' },
        { id: 'e2', source: 'ref-lb', target: 'ref-app' },
        { id: 'e3', source: 'ref-app', target: 'ref-db', label: 'persist post' },
        { id: 'e4', source: 'ref-app', target: 'ref-mq', label: 'enqueue fan-out' },
        { id: 'e5', source: 'ref-mq', target: 'ref-cache', label: 'push to follower timelines' },
      ],
      tradeoffs: [
        'Push (fan-out-on-write) makes reads very fast but wastes work writing to inactive users\' timelines and breaks down for celebrity accounts.',
        'Pull (fan-out-on-read) keeps writes cheap but makes every feed read more expensive to assemble.',
        'A hybrid — push for normal accounts, pull-and-merge for celebrities — is the industry-standard compromise.',
      ],
    },
  },

  {
    id: 'video-streaming',
    title: 'Design a Video Streaming Platform',
    difficulty: 'Hard',
    tags: ['CDN', 'storage', 'transcoding'],
    summary:
      'Design the core of a YouTube/Netflix-style platform: creators upload video, it gets processed into multiple qualities, and viewers stream it smoothly worldwide with minimal buffering.',
    functionalRequirements: [
      'Creators can upload video files.',
      'Uploaded video is transcoded into multiple resolutions/bitrates.',
      'Viewers can stream video with adaptive bitrate based on their connection.',
      'Viewers can search for and browse videos.',
    ],
    nonFunctionalRequirements: [
      'Playback should start quickly and avoid buffering for viewers worldwide.',
      'Storage and delivery must scale to petabytes of video and huge concurrent viewership.',
      'Uploads and transcoding are write-heavy/batch; playback is extremely read-heavy.',
    ],
    constraints: ['~500 hours of video uploaded per minute', '~1B hours watched per day', 'global audience'],
    keyQuestions: [
      {
        id: 'transcoding',
        prompt: 'What happens to a video after it\'s uploaded, and how do you avoid the transcoding pipeline becoming a bottleneck?',
        keywords: ['transcode', 'encode', 'ffmpeg', 'worker', 'pipeline', 'queue', 'bitrate'],
      },
      {
        id: 'delivery',
        prompt: 'How is video delivered to viewers around the world with low startup latency?',
        keywords: ['cdn', 'edge', 'adaptive bitrate', 'hls', 'dash', 'chunk'],
      },
      {
        id: 'storage',
        prompt: 'Where and how is the raw and processed video stored?',
        keywords: ['object storage', 'blob', 's3', 'chunk', 'segment'],
      },
    ],
    rubric: [
      {
        id: 'pipeline',
        name: 'Upload & Transcoding Pipeline',
        weight: 0.3,
        checks: [
          presence(['message_queue'], 'Decouples upload from transcoding', 'Add a Message Queue so uploads enqueue transcoding jobs instead of processing synchronously.', 15),
          keyword(['transcode', 'encode', 'ffmpeg', 'worker', 'bitrate'], 'Explains the transcoding step', 'Describe how uploaded video is converted into multiple resolutions/bitrates for adaptive playback.', 15, ['transcoding']),
          presence(['stream_processor', 'microservice', 'app_server'], 'Has a processing/worker tier', 'Add a worker tier (Stream Processor or Microservice) to represent the transcoding workers.', 10),
        ],
      },
      {
        id: 'delivery',
        name: 'Global Delivery',
        weight: 0.3,
        checks: [
          presence(['cdn'], 'Uses a CDN for playback', 'Add a CDN so viewers stream from a nearby edge location instead of the origin every time.', 20),
          keyword(['adaptive bitrate', 'hls', 'dash', 'chunk', 'segment'], 'Mentions adaptive bitrate streaming', 'Explain how playback quality adapts to the viewer\'s network (e.g. HLS/DASH chunked delivery).', 10, ['delivery']),
        ],
      },
      {
        id: 'storage',
        name: 'Storage',
        weight: 0.25,
        checks: [
          presence(['object_storage'], 'Uses object storage for video files', 'Add Object Storage for raw uploads and transcoded video segments — a relational DB is the wrong fit for large blobs.', 15),
          presence(['sql_database', 'nosql_database'], 'Has a metadata store', 'Add a database for video metadata (titles, owners, view counts) separate from the blob storage.', 10),
        ],
      },
      {
        id: 'search',
        name: 'Discovery',
        weight: 0.15,
        checks: [
          presence(['search_index'], 'Supports search/browse', 'Add a Search Index so viewers can search video titles/descriptions/tags.', 10),
          noOrphans(5),
        ],
      },
    ],
    reference: {
      overview:
        'Uploads go directly to Object Storage (often via a pre-signed URL) and the App Server enqueues a transcoding job on a Message Queue. A fleet of transcoding workers (Stream Processors) pull jobs, produce multiple resolution/bitrate renditions chunked for adaptive streaming, and write them back to Object Storage; metadata (title, duration, available renditions) is written to a database and indexed in a Search Index. Viewers request playback manifests from the App Server, but the actual video chunks are served from a CDN backed by Object Storage, so repeat views never hit the origin.',
      nodes: [
        { id: 'ref-creator', type: 'client', label: 'Creator (upload)', x: 20, y: 60 },
        { id: 'ref-viewer', type: 'client', label: 'Viewer (playback)', x: 20, y: 340 },
        { id: 'ref-app', type: 'app_server', label: 'App Server', x: 240, y: 200 },
        { id: 'ref-storage', type: 'object_storage', label: 'Object Storage', x: 460, y: 60 },
        { id: 'ref-mq', type: 'message_queue', label: 'Transcode Queue', x: 460, y: 200 },
        { id: 'ref-worker', type: 'stream_processor', label: 'Transcoding Workers', x: 680, y: 200 },
        { id: 'ref-db', type: 'sql_database', label: 'Metadata DB', x: 460, y: 340 },
        { id: 'ref-search', type: 'search_index', label: 'Search Index', x: 680, y: 340 },
        { id: 'ref-cdn', type: 'cdn', label: 'CDN', x: 240, y: 400 },
      ],
      edges: [
        { id: 'e1', source: 'ref-creator', target: 'ref-app' },
        { id: 'e2', source: 'ref-app', target: 'ref-storage', label: 'raw upload' },
        { id: 'e3', source: 'ref-app', target: 'ref-mq', label: 'enqueue' },
        { id: 'e4', source: 'ref-mq', target: 'ref-worker' },
        { id: 'e5', source: 'ref-worker', target: 'ref-storage', label: 'write renditions' },
        { id: 'e6', source: 'ref-app', target: 'ref-db' },
        { id: 'e7', source: 'ref-app', target: 'ref-search' },
        { id: 'e8', source: 'ref-viewer', target: 'ref-cdn' },
        { id: 'e9', source: 'ref-cdn', target: 'ref-storage', label: 'origin fetch on miss' },
      ],
      tradeoffs: [
        'Transcoding many renditions eagerly costs storage and compute up front but makes every playback fast; transcoding on-demand saves storage but adds startup latency.',
        'A CDN massively cuts origin load and latency for popular videos, but adds cache-invalidation complexity for edited/removed content.',
        'Chunked adaptive bitrate (HLS/DASH) trades a bit of quality-switch complexity for resilience to fluctuating network conditions.',
      ],
    },
  },

  {
    id: 'ride-hailing',
    title: 'Design a Ride-Hailing Dispatch System',
    difficulty: 'Hard',
    tags: ['geospatial', 'real-time', 'matching'],
    summary:
      'Design the core of an Uber/Lyft-style system: riders request a trip, nearby available drivers are found and matched, and both parties track the trip in real time.',
    functionalRequirements: [
      'Riders can request a ride from their current location to a destination.',
      'System finds and matches nearby available drivers to the request.',
      'Both rider and driver see live location updates during the trip.',
      'Trip state (requested, matched, in-progress, completed) is tracked reliably.',
    ],
    nonFunctionalRequirements: [
      'Driver matching should happen within a few seconds.',
      'Location updates should propagate with low latency (~seconds).',
      'System must handle regional spikes in demand (e.g. surge events, city-wide events).',
    ],
    constraints: ['~5M active drivers reporting location every few seconds', '~20M rides requested per day', 'city-partitioned geography'],
    keyQuestions: [
      {
        id: 'geo',
        prompt: 'How do you efficiently find nearby available drivers for a rider\'s request?',
        keywords: ['geohash', 'quadtree', 'geospatial index', 'proximity', 's2', 'grid'],
      },
      {
        id: 'location-updates',
        prompt: 'How are frequent driver location updates ingested and propagated without overwhelming the system?',
        keywords: ['websocket', 'stream', 'queue', 'batching', 'throttle'],
      },
      {
        id: 'matching',
        prompt: 'How does the matching process avoid double-booking a driver when multiple riders request nearby simultaneously?',
        keywords: ['lock', 'atomic', 'race condition', 'reservation', 'idempotent'],
      },
    ],
    rubric: [
      {
        id: 'geo',
        name: 'Geospatial Matching',
        weight: 0.35,
        checks: [
          keyword(['geohash', 'quadtree', 's2', 'grid', 'geospatial index'], 'Uses a real geospatial indexing approach', 'Name a concrete technique (geohashing, quadtree, S2 cells, or a grid) for finding nearby drivers efficiently — scanning all drivers does not scale.', 20, ['geo']),
          presence(['cache'], 'Stores live driver locations somewhere fast', 'Add a Cache to hold current driver locations for low-latency proximity queries.', 15),
        ],
      },
      {
        id: 'realtime',
        name: 'Real-Time Location Pipeline',
        weight: 0.25,
        checks: [
          presence(['websocket_service', 'stream_processor'], 'Has a real-time ingestion/streaming tier', 'Add a WebSocket Service or Stream Processor to handle continuous driver location updates.', 15),
          presence(['message_queue'], 'Uses a queue/stream to absorb update bursts', 'Add a Message Queue so location update spikes don\'t overwhelm downstream processing.', 10),
        ],
      },
      {
        id: 'matching-logic',
        name: 'Matching Correctness',
        weight: 0.2,
        checks: [
          keyword(['lock', 'atomic', 'race condition', 'idempotent', 'reservation'], 'Addresses double-booking / race conditions', 'Explain how you prevent two riders from being matched to the same driver at once.', 15, ['matching']),
          presence(['microservice', 'app_server'], 'Has a dedicated matching service', 'Add a service responsible for the matching logic between riders and drivers.', 5),
        ],
      },
      {
        id: 'data',
        name: 'Data & State Management',
        weight: 0.2,
        checks: [
          presence(['sql_database', 'nosql_database'], 'Persists trip state durably', 'Add a database to track trip lifecycle (requested → matched → in-progress → completed) durably.', 10),
          noOrphans(5),
          minNodes(5, 5),
        ],
      },
    ],
    reference: {
      overview:
        'Drivers stream location updates over a WebSocket connection into a Stream Processor, which writes current position into a Cache indexed by geohash cells for O(1)-ish proximity lookups, and asynchronously archives history via a Message Queue. A rider request hits a Matching Service, which queries the geohash cache for nearby available drivers, ranks candidates, and atomically reserves one (e.g. a conditional write / distributed lock keyed by driver ID) to prevent double-booking. Trip state transitions are persisted in a database and pushed to both parties over their WebSocket connections as the trip progresses.',
      nodes: [
        { id: 'ref-driver', type: 'client', label: 'Driver App', x: 20, y: 60 },
        { id: 'ref-rider', type: 'client', label: 'Rider App', x: 20, y: 340 },
        { id: 'ref-ws', type: 'websocket_service', label: 'WebSocket Service', x: 240, y: 200 },
        { id: 'ref-stream', type: 'stream_processor', label: 'Location Stream Processor', x: 460, y: 100 },
        { id: 'ref-cache', type: 'cache', label: 'Geo Cache (geohash)', x: 680, y: 100 },
        { id: 'ref-match', type: 'microservice', label: 'Matching Service', x: 680, y: 260 },
        { id: 'ref-db', type: 'sql_database', label: 'Trips DB', x: 460, y: 340 },
        { id: 'ref-mq', type: 'message_queue', label: 'Location History Queue', x: 460, y: 60 },
      ],
      edges: [
        { id: 'e1', source: 'ref-driver', target: 'ref-ws' },
        { id: 'e2', source: 'ref-rider', target: 'ref-ws' },
        { id: 'e3', source: 'ref-ws', target: 'ref-stream' },
        { id: 'e4', source: 'ref-stream', target: 'ref-cache', label: 'update position' },
        { id: 'e5', source: 'ref-stream', target: 'ref-mq' },
        { id: 'e6', source: 'ref-ws', target: 'ref-match', label: 'ride request' },
        { id: 'e7', source: 'ref-match', target: 'ref-cache', label: 'nearby query' },
        { id: 'e8', source: 'ref-match', target: 'ref-db', label: 'persist trip state' },
      ],
      tradeoffs: [
        'Geohashing is simple and index-friendly but has edge-boundary issues (nearby points in different cells); S2/quadtrees handle this better at added complexity.',
        'Holding live driver positions in a cache instead of a database trades some durability for the low latency proximity queries need.',
        'Atomic driver reservation (vs. optimistic matching + retry) avoids double-booking but adds a small amount of matching latency.',
      ],
    },
  },

  {
    id: 'ecommerce-checkout',
    title: 'Design an E-Commerce Order & Inventory System',
    difficulty: 'Medium',
    tags: ['transactions', 'consistency', 'messaging'],
    summary:
      'Design the checkout backbone for an online store: browsing a catalog, adding to cart, and placing an order that reliably reserves inventory and processes payment without overselling.',
    functionalRequirements: [
      'Users can browse a product catalog and add items to a cart.',
      'Placing an order reserves inventory and charges payment.',
      'Inventory must never go negative (no overselling), even under concurrent orders for the last unit.',
      'Order status is tracked and visible to the user.',
    ],
    nonFunctionalRequirements: [
      'Catalog browsing should be fast even under heavy read traffic.',
      'Checkout must be correct (strong consistency for inventory decrement) even if slower than browsing.',
      'System should handle traffic spikes (flash sales) without crashing.',
    ],
    constraints: ['~10M product catalog', '~2M orders/day with spikes 10x during sales', 'payment provider is a third-party API'],
    keyQuestions: [
      {
        id: 'oversell',
        prompt: 'How do you prevent overselling when many users try to buy the last unit of an item at once?',
        keywords: ['transaction', 'lock', 'atomic', 'compare and swap', 'reserve', 'inventory'],
      },
      {
        id: 'payment',
        prompt: 'How does the order flow integrate with an external payment provider reliably?',
        keywords: ['idempotent', 'saga', 'async', 'webhook', 'retry', 'third-party'],
      },
      {
        id: 'catalog-read',
        prompt: 'How do you keep catalog browsing fast and separate from the more sensitive checkout path?',
        keywords: ['cache', 'cdn', 'search index', 'read replica'],
      },
    ],
    rubric: [
      {
        id: 'consistency',
        name: 'Inventory Consistency',
        weight: 0.35,
        checks: [
          keyword(['transaction', 'atomic', 'lock', 'compare and swap', 'reserve'], 'Prevents overselling explicitly', 'Explain the concrete mechanism (DB transaction, atomic decrement, or reservation) that stops two orders from selling the same last unit.', 20, ['oversell']),
          presence(['sql_database'], 'Uses a strongly-consistent store for inventory/orders', 'Use a SQL database for inventory and order state, where transactional guarantees matter most.', 15),
        ],
      },
      {
        id: 'payment',
        name: 'Payment Integration',
        weight: 0.2,
        checks: [
          presence(['third_party_api'], 'Models the payment provider as an external dependency', 'Add a Third-Party API node to represent the external payment processor.', 10),
          keyword(['idempotent', 'saga', 'webhook', 'retry'], 'Handles payment failure/retry safely', 'Explain how retries or partial failures during payment don\'t double-charge or leave orders stuck.', 15, ['payment']),
        ],
      },
      {
        id: 'catalog',
        name: 'Catalog Browsing Path',
        weight: 0.25,
        checks: [
          presence(['cache'], 'Caches catalog reads', 'Add a Cache to keep product browsing fast and separate from the transactional checkout path.', 15),
          presence(['search_index'], 'Supports product search', 'Add a Search Index so users can search/filter the catalog efficiently.', 10),
        ],
      },
      {
        id: 'async',
        name: 'Async Order Processing',
        weight: 0.2,
        checks: [
          presence(['message_queue'], 'Decouples post-order workflows', 'Add a Message Queue so steps like shipping notification and email confirmation happen asynchronously after the order is placed.', 15),
          noOrphans(5),
        ],
      },
    ],
    reference: {
      overview:
        'Catalog browsing is served from App Servers backed by a Cache and Search Index, kept isolated from the checkout path so a flash sale on browsing traffic doesn\'t threaten order correctness. Checkout runs against a SQL database: placing an order opens a transaction that atomically checks and decrements inventory (or inserts a reservation row) before it ever calls the external payment Third-Party API, so a payment failure never leaves inventory oversold. On success, an event is published to a Message Queue for downstream async work — order confirmation email, shipping label creation, analytics — none of which block the checkout response.',
      nodes: [
        { id: 'ref-client', type: 'client', label: 'Client', x: 20, y: 220 },
        { id: 'ref-lb', type: 'load_balancer', label: 'Load Balancer', x: 220, y: 220 },
        { id: 'ref-app', type: 'app_server', label: 'App Server', x: 420, y: 220 },
        { id: 'ref-cache', type: 'cache', label: 'Catalog Cache', x: 640, y: 80 },
        { id: 'ref-search', type: 'search_index', label: 'Search Index', x: 640, y: 200 },
        { id: 'ref-db', type: 'sql_database', label: 'Orders / Inventory DB', x: 640, y: 320 },
        { id: 'ref-payment', type: 'third_party_api', label: 'Payment Provider', x: 860, y: 320 },
        { id: 'ref-mq', type: 'message_queue', label: 'Order Events Queue', x: 420, y: 400 },
      ],
      edges: [
        { id: 'e1', source: 'ref-client', target: 'ref-lb' },
        { id: 'e2', source: 'ref-lb', target: 'ref-app' },
        { id: 'e3', source: 'ref-app', target: 'ref-cache', label: 'browse' },
        { id: 'e4', source: 'ref-app', target: 'ref-search', label: 'browse' },
        { id: 'e5', source: 'ref-app', target: 'ref-db', label: 'reserve inventory (txn)' },
        { id: 'e6', source: 'ref-app', target: 'ref-payment', label: 'charge' },
        { id: 'e7', source: 'ref-app', target: 'ref-mq', label: 'order placed event' },
      ],
      tradeoffs: [
        'Reserving inventory inside a DB transaction before charging payment avoids overselling at the cost of briefly locking rows during checkout spikes.',
        'A saga-style flow (reserve → charge → confirm, with compensating actions on failure) scales better across services than a single distributed transaction.',
        'Keeping catalog reads on a cache separate from the transactional order path means a browsing traffic spike can\'t degrade checkout correctness or latency.',
      ],
    },
  },

  {
    id: 'web-crawler',
    title: 'Design a Web Crawler',
    difficulty: 'Hard',
    tags: ['distributed systems', 'queues', 'scale'],
    summary:
      'Design a distributed web crawler that discovers and downloads billions of web pages, respecting politeness rules, avoiding duplicate/infinite crawls, and feeding pages to a downstream indexing pipeline.',
    functionalRequirements: [
      'Given a set of seed URLs, discover and download linked pages recursively.',
      'Extract and store page content for downstream indexing.',
      'Avoid re-crawling unchanged pages too frequently.',
      'Respect robots.txt and per-domain rate limits ("politeness").',
    ],
    nonFunctionalRequirements: [
      'Must scale horizontally to crawl billions of pages.',
      'Must avoid crawler traps (infinite link loops, dynamically generated URLs).',
      'Should prioritize important/frequently-changing pages for re-crawl.',
    ],
    constraints: ['~billions of URLs in the frontier', 'thousands of crawler workers', 'must not overload any single target domain'],
    keyQuestions: [
      {
        id: 'frontier',
        prompt: 'How do you manage the URL frontier (the queue of URLs to crawl) at massive scale?',
        keywords: ['frontier', 'queue', 'priority', 'partition', 'shard'],
      },
      {
        id: 'politeness',
        prompt: 'How do you avoid hammering any single domain with too many requests at once?',
        keywords: ['politeness', 'rate limit', 'per-domain', 'robots.txt', 'delay'],
      },
      {
        id: 'dedupe',
        prompt: 'How do you avoid re-downloading the same URL or falling into crawler traps?',
        keywords: ['dedupe', 'bloom filter', 'seen url', 'hash', 'fingerprint', 'trap'],
      },
    ],
    rubric: [
      {
        id: 'frontier',
        name: 'URL Frontier Management',
        weight: 0.3,
        checks: [
          presence(['message_queue'], 'Uses a queue for the URL frontier', 'Add a Message Queue (or queue-like store) to represent the frontier of URLs waiting to be crawled.', 15),
          keyword(['priority', 'partition', 'shard'], 'Addresses frontier scale/prioritization', 'Explain how the frontier is partitioned (e.g. by domain) and/or prioritized so it scales to billions of URLs.', 15, ['frontier']),
        ],
      },
      {
        id: 'politeness',
        name: 'Politeness',
        weight: 0.25,
        checks: [
          keyword(['politeness', 'rate limit', 'per-domain', 'robots.txt'], 'Implements politeness explicitly', 'Describe a concrete mechanism (per-domain rate limiting, robots.txt checks) that prevents overloading any one site.', 20, ['politeness']),
          presence(['cache'], 'Caches per-domain rate/robots state', 'Add a Cache to hold per-domain crawl-delay and robots.txt rules for fast lookup by workers.', 5),
        ],
      },
      {
        id: 'workers',
        name: 'Crawling & Extraction',
        weight: 0.25,
        checks: [
          presence(['microservice', 'app_server', 'stream_processor'], 'Has a distributed worker fleet', 'Add a worker tier that fetches pages, extracts links, and extracts content in parallel.', 10),
          presence(['object_storage'], 'Stores raw page content', 'Add Object Storage for the raw downloaded HTML/assets, which are too large/unstructured for a typical database row.', 10),
          keyword(['dedupe', 'bloom filter', 'seen url', 'fingerprint'], 'Avoids duplicate crawling / traps', 'Explain how already-seen URLs are tracked so the crawler doesn\'t loop forever (e.g. a bloom filter or seen-URL store).', 10, ['dedupe']),
        ],
      },
      {
        id: 'downstream',
        name: 'Metadata & Downstream Pipeline',
        weight: 0.2,
        checks: [
          presence(['nosql_database', 'sql_database'], 'Tracks crawl metadata', 'Add a database to track URL status, last-crawled time, and content hashes.', 10),
          noOrphans(5),
          minNodes(5, 5),
        ],
      },
    ],
    reference: {
      overview:
        'Discovered URLs flow into a partitioned frontier — a Message Queue sharded by domain so politeness limits can be enforced per shard. A fleet of crawler workers (Microservices) pull URLs, check a Cache of per-domain robots.txt/crawl-delay rules before fetching, download the page to Object Storage, and extract outbound links. Each new link is checked against a seen-URL filter (a Bloom filter backed by a NoSQL store) before being pushed back onto the frontier, preventing duplicate crawls and most infinite loops. Crawl metadata (status, last-crawled timestamp, content hash for change detection) lives in the same NoSQL store and feeds the downstream indexing pipeline.',
      nodes: [
        { id: 'ref-seed', type: 'client', label: 'Seed URLs', x: 20, y: 220 },
        { id: 'ref-mq', type: 'message_queue', label: 'URL Frontier (sharded)', x: 240, y: 220 },
        { id: 'ref-worker', type: 'microservice', label: 'Crawler Workers', x: 460, y: 220 },
        { id: 'ref-cache', type: 'cache', label: 'Robots/Politeness Cache', x: 460, y: 60 },
        { id: 'ref-storage', type: 'object_storage', label: 'Object Storage (raw pages)', x: 680, y: 120 },
        { id: 'ref-db', type: 'nosql_database', label: 'URL Metadata / Seen-URL Store', x: 680, y: 320 },
      ],
      edges: [
        { id: 'e1', source: 'ref-seed', target: 'ref-mq' },
        { id: 'e2', source: 'ref-mq', target: 'ref-worker' },
        { id: 'e3', source: 'ref-worker', target: 'ref-cache', label: 'check politeness' },
        { id: 'e4', source: 'ref-worker', target: 'ref-storage', label: 'save page' },
        { id: 'e5', source: 'ref-worker', target: 'ref-db', label: 'dedupe + track' },
        { id: 'e6', source: 'ref-db', target: 'ref-mq', label: 'new unseen links' },
      ],
      tradeoffs: [
        'Sharding the frontier by domain makes per-domain politeness trivial to enforce but risks hot shards for domains with enormous link counts.',
        'A Bloom filter for seen-URL checks is memory-efficient at billions of URLs but allows a small false-positive rate (occasionally skipping a page that was actually new).',
        'Storing raw pages in object storage instead of a database keeps large, unstructured content cheap and simple to scale independently of metadata.',
      ],
    },
  },

  {
    id: 'notification-system',
    title: 'Design a Multi-Channel Notification System',
    difficulty: 'Medium',
    tags: ['messaging', 'reliability', 'fan-out'],
    summary:
      'Design a system that lets internal services trigger notifications to users across push, email, and SMS, with user preferences, retries, and delivery tracking.',
    functionalRequirements: [
      'Internal services can trigger a notification for a user via a simple API.',
      'Notifications are delivered over the user\'s preferred channel(s): push, email, SMS.',
      'Failed deliveries are retried with backoff; permanent failures are recorded.',
      'Users can configure per-category notification preferences (e.g. mute marketing, keep security alerts).',
    ],
    nonFunctionalRequirements: [
      'The system must not become a bottleneck for the services that trigger notifications (fire-and-forget from their perspective).',
      'Duplicate notifications for the same event should be avoided.',
      'Must integrate with multiple third-party providers (APNs/FCM, email, SMS gateways).',
    ],
    constraints: ['~200M notifications/day', 'multiple third-party delivery providers per channel', 'spiky load during broadcast events'],
    keyQuestions: [
      {
        id: 'decoupling',
        prompt: 'How do triggering services stay fast and unaffected by slow downstream providers?',
        keywords: ['async', 'queue', 'decouple', 'fire and forget'],
      },
      {
        id: 'retry',
        prompt: 'How do you handle a provider being temporarily down without losing notifications or spamming retries?',
        keywords: ['retry', 'backoff', 'dead letter', 'idempotent'],
      },
      {
        id: 'preferences',
        prompt: 'How do user channel preferences and dedup get applied before sending?',
        keywords: ['preference', 'opt out', 'dedupe', 'idempotency key'],
      },
    ],
    rubric: [
      {
        id: 'decoupling',
        name: 'Decoupling & Async Delivery',
        weight: 0.3,
        checks: [
          presence(['message_queue'], 'Decouples trigger from delivery', 'Add a Message Queue so the triggering service just enqueues an event and returns immediately.', 20),
          keyword(['async', 'fire and forget', 'decouple'], 'Explains the async trigger flow', 'Describe why/how the notification API call from other services is fast and non-blocking.', 10, ['decoupling']),
        ],
      },
      {
        id: 'channels',
        name: 'Multi-Channel Fan-out',
        weight: 0.3,
        checks: [
          presence(['third_party_api'], 'Models external providers explicitly', 'Add Third-Party API node(s) for push/email/SMS providers (APNs/FCM, SES/SendGrid, Twilio, etc.).', 15),
          presence(['microservice', 'app_server'], 'Has per-channel dispatch workers', 'Add a worker/service tier responsible for formatting and sending per channel.', 10),
          keyword(['preference', 'opt out'], 'Applies user preferences before sending', 'Explain where user channel preferences are checked before dispatch.', 10, ['preferences']),
        ],
      },
      {
        id: 'reliability',
        name: 'Reliability',
        weight: 0.25,
        checks: [
          keyword(['retry', 'backoff', 'dead letter'], 'Handles delivery failures explicitly', 'Describe retry-with-backoff and what happens to a notification that keeps failing (e.g. a dead-letter queue).', 20, ['retry']),
        ],
      },
      {
        id: 'data',
        name: 'State & Deduplication',
        weight: 0.15,
        checks: [
          presence(['sql_database', 'nosql_database'], 'Tracks delivery state', 'Add a database to record notification/delivery status and preferences per user.', 10),
          keyword(['dedupe', 'idempotency'], 'Avoids duplicate sends', 'Explain how a retried or duplicate event doesn\'t result in the user getting the same notification twice.', 5, ['preferences']),
          noOrphans(5),
        ],
      },
    ],
    reference: {
      overview:
        'Internal services call a thin API on the Notification Service, which validates the request and immediately publishes an event to a Message Queue — the caller\'s work ends there. Dispatch workers consume the queue, look up the user\'s channel preferences and dedupe/idempotency key in a database, and fan out to per-channel senders that call the appropriate Third-Party API (push, email, SMS). Failed sends are retried with exponential backoff a bounded number of times; after that, they land in a dead-letter queue for inspection, and final delivery status is written back to the database for observability.',
      nodes: [
        { id: 'ref-service', type: 'client', label: 'Internal Service', x: 20, y: 220 },
        { id: 'ref-api', type: 'api_gateway', label: 'Notification API', x: 220, y: 220 },
        { id: 'ref-mq', type: 'message_queue', label: 'Event Queue', x: 420, y: 220 },
        { id: 'ref-worker', type: 'microservice', label: 'Dispatch Workers', x: 620, y: 220 },
        { id: 'ref-db', type: 'sql_database', label: 'Preferences / Delivery State', x: 620, y: 60 },
        { id: 'ref-provider', type: 'third_party_api', label: 'Push / Email / SMS Providers', x: 840, y: 220 },
      ],
      edges: [
        { id: 'e1', source: 'ref-service', target: 'ref-api' },
        { id: 'e2', source: 'ref-api', target: 'ref-mq' },
        { id: 'e3', source: 'ref-mq', target: 'ref-worker' },
        { id: 'e4', source: 'ref-worker', target: 'ref-db', label: 'check prefs / dedupe' },
        { id: 'e5', source: 'ref-worker', target: 'ref-provider', label: 'send' },
      ],
      tradeoffs: [
        'Putting a queue between trigger and delivery is what makes the API "fire and forget" for callers, at the cost of eventual (not immediate) delivery confirmation.',
        'Exponential backoff plus a dead-letter queue balances resilience to transient provider outages against endlessly retrying a permanently-failing send.',
        'Checking preferences at dispatch time (not at trigger time) keeps the trigger API simple and lets preference changes apply even to already-queued events.',
      ],
    },
  },
]

export function getProblemById(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id)
}

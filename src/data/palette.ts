import type { ComponentType, PaletteItem } from '../types'
import {
  Boxes,
  Database,
  Gauge,
  Globe,
  HardDrive,
  KeyRound,
  Layers,
  MonitorSmartphone,
  Network,
  Radio,
  Router,
  Search,
  Server,
  ServerCog,
  Bell,
  Waypoints,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export const PALETTE: PaletteItem[] = [
  { type: 'client', label: 'Client', description: 'Web / mobile app making requests', category: 'client' },
  { type: 'cdn', label: 'CDN', description: 'Edge caching for static & media assets', category: 'networking' },
  { type: 'load_balancer', label: 'Load Balancer', description: 'Distributes traffic across instances', category: 'networking' },
  { type: 'api_gateway', label: 'API Gateway', description: 'Routing, auth, rate limiting at the edge', category: 'networking' },
  { type: 'web_server', label: 'Web Server', description: 'Stateless HTTP request handler', category: 'compute' },
  { type: 'app_server', label: 'App Server', description: 'Business logic / backend service', category: 'compute' },
  { type: 'microservice', label: 'Microservice', description: 'Independently deployable service', category: 'compute' },
  { type: 'auth_service', label: 'Auth Service', description: 'Authentication & authorization', category: 'compute' },
  { type: 'websocket_service', label: 'WebSocket Service', description: 'Persistent bidirectional connections', category: 'compute' },
  { type: 'stream_processor', label: 'Stream Processor', description: 'Real-time event / data processing', category: 'compute' },
  { type: 'sql_database', label: 'SQL Database', description: 'Relational store with strong consistency', category: 'data' },
  { type: 'nosql_database', label: 'NoSQL Database', description: 'Document/KV/wide-column store for scale', category: 'data' },
  { type: 'cache', label: 'Cache', description: 'In-memory store for hot data', category: 'data' },
  { type: 'object_storage', label: 'Object Storage', description: 'Blob storage for files & media', category: 'data' },
  { type: 'search_index', label: 'Search Index', description: 'Full-text / faceted search', category: 'data' },
  { type: 'message_queue', label: 'Message Queue', description: 'Async decoupling between services', category: 'messaging' },
  { type: 'notification_service', label: 'Notification Service', description: 'Push / email / SMS delivery', category: 'messaging' },
  { type: 'third_party_api', label: 'Third-Party API', description: 'External service integration', category: 'external' },
]

export const PALETTE_BY_TYPE: Record<ComponentType, PaletteItem> = Object.fromEntries(
  PALETTE.map((item) => [item.type, item]),
) as Record<ComponentType, PaletteItem>

export const ICON_BY_TYPE: Record<ComponentType, LucideIcon> = {
  client: MonitorSmartphone,
  cdn: Globe,
  load_balancer: Gauge,
  api_gateway: Router,
  web_server: Server,
  app_server: ServerCog,
  microservice: Boxes,
  auth_service: KeyRound,
  websocket_service: Radio,
  stream_processor: Workflow,
  sql_database: Database,
  nosql_database: Layers,
  cache: Zap,
  object_storage: HardDrive,
  search_index: Search,
  message_queue: Waypoints,
  notification_service: Bell,
  third_party_api: Network,
}

export const CATEGORY_LABELS: Record<PaletteItem['category'], string> = {
  client: 'Client',
  networking: 'Networking & Edge',
  compute: 'Compute',
  data: 'Data',
  messaging: 'Messaging',
  external: 'External',
}

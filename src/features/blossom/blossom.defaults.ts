import { type BlossomServer, MOCK_BLOSSOM_SERVERS } from '@/default'

export const BLOSSOM_DEFAULT_SERVERS: BlossomServer[] = MOCK_BLOSSOM_SERVERS.map((server) => ({
  url: server.url,
  name: server.name,
  region: server.region,
}))

export const BLOSSOM_DEFAULT_PRIMARY_SERVER = BLOSSOM_DEFAULT_SERVERS[0]?.url ?? ''

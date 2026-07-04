import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_BASE = process.env.API_BASE || 'https://latdawer.mr991199.workers.dev'
const server = new McpServer({ name: 'latdawer', version: '1.0.0' })

async function trpcCall(route, input = {}, method = 'query') {
  const res = await fetch(`${API_BASE}/api/trpc/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method, params: { json: input } }) })
  const data = await res.json()
  return data?.result?.data?.json || data
}

server.tool('inventory_list', 'List inventory for a store', { storeId: z.string(), page: z.number().optional().default(1), limit: z.number().optional().default(20), search: z.string().optional() },
  async (p) => ({ content: [{ type: 'text', text: JSON.stringify(await trpcCall('inventory.list', p), null, 2) }] }))

server.tool('inventory_create', 'Create inventory item', { storeId: z.string(), partId: z.string(), price: z.number(), quantity: z.number(), condition: z.enum(['new', 'used', 'refurbished', 'salvage']) },
  async (p) => ({ content: [{ type: 'text', text: JSON.stringify(await trpcCall('inventory.create', p, 'mutation'), null, 2) }] }))

server.tool('parts_search', 'Search parts', { q: z.string(), page: z.number().optional().default(1), limit: z.number().optional().default(12) },
  async (p) => ({ content: [{ type: 'text', text: JSON.stringify(await trpcCall('search.parts', p), null, 2) }] }))

server.tool('stores_list', 'List stores', { page: z.number().optional().default(1), limit: z.number().optional().default(20) },
  async (p) => ({ content: [{ type: 'text', text: JSON.stringify(await trpcCall('stores.list', p), null, 2) }] }))

server.tool('workflows_list', 'List workflows', {}, async () => ({ content: [{ type: 'text', text: JSON.stringify(await trpcCall('workflows.list'), null, 2) }] }))

server.tool('workflows_create', 'Create workflow from text', { text: z.string() },
  async (p) => ({ content: [{ type: 'text', text: JSON.stringify(await trpcCall('workflows.createFromText', p, 'mutation'), null, 2) }] }))

server.tool('admin_stats', 'Get admin stats', {}, async () => ({ content: [{ type: 'text', text: JSON.stringify(await trpcCall('admin.stats'), null, 2) }] }))

server.tool('compare_prices', 'Compare prices across stores', { partId: z.string() },
  async (p) => ({ content: [{ type: 'text', text: JSON.stringify(await trpcCall('inventory.compare', p), null, 2) }] }))

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('Latdawer MCP Server running')

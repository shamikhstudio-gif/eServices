/**
 * eShamikh Cloud - MCP (Model Context Protocol) & Admin API Endpoint
 * 
 * This endpoint acts as both an MCP server for external AI agents (Cursor, Windsurf, Claude)
 * and an Admin API for developers building custom external dashboards on any network.
 * 
 * Supports:
 * - Dual-tier authentication: API Key (mcp_...) or Secret Key (sec_...)
 * - Granular permissions: Standard (Read/Create) vs High-Privilege (Update/Delete)
 * - Both MCP JSON-RPC 2.0 and Direct REST payloads
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// MCP Protocol: Tool definitions
const MCP_TOOLS = [
  {
    name: 'elink_create',
    description: 'Create a new dynamic short link',
    inputSchema: {
      type: 'object',
      properties: {
        destination_url: { type: 'string', description: 'The target URL to redirect to' },
        custom_slug: { type: 'string', description: 'Optional custom slug for the short link' },
        title: { type: 'string', description: 'Optional descriptive title for the link' },
      },
      required: ['destination_url'],
    },
  },
  {
    name: 'elink_list',
    description: 'List all short links belonging to the authenticated account',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results to return (default 20, max 100)' },
      },
    },
  },
  {
    name: 'elink_stats',
    description: 'Get click analytics and target details for a specific link',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The link slug to inspect' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'elink_update',
    description: '[HIGH-PRIVILEGE] Update an existing link destination, title, or active status',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The slug of the link to update' },
        destination_url: { type: 'string', description: 'New target URL' },
        title: { type: 'string', description: 'New descriptive title' },
        is_active: { type: 'boolean', description: 'Enable or disable the link' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'elink_delete',
    description: '[HIGH-PRIVILEGE] Permanently delete a short link and its click analytics',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The slug of the link to permanently delete' },
      },
      required: ['slug'],
    },
  },
];

interface AuthContext {
  userId: string;
  projectId: string;
  projectName: string;
  allowHighPrivilege: boolean;
  authenticatedViaSecret: boolean;
}

async function authenticateRequest(req: NextRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.get('authorization');
  const xApiKey = req.headers.get('x-api-key') || req.headers.get('x-mcp-key');
  const xApiSecret = req.headers.get('x-api-secret') || req.headers.get('x-mcp-secret');
  const xProjectId = req.headers.get('x-project-id');

  let token = '';
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (xApiSecret) {
    token = xApiSecret.trim();
  } else if (xApiKey) {
    token = xApiKey.trim();
  }

  if (!token) return null;

  const isSecret = token.startsWith('sec_');

  let query = supabaseAdmin
    .from('mcp_projects')
    .select('id, user_id, name, is_active, allow_high_privilege, api_key, api_secret')
    .eq('is_active', true);

  if (isSecret) {
    query = query.eq('api_secret', token);
  } else {
    query = query.eq('api_key', token);
  }

  const { data, error } = await query.single();

  if (error || !data) return null;
  if (xProjectId && data.id !== xProjectId) return null;

  // If secret token is provided directly, high commands are always authorized.
  // Otherwise, check the project's allow_high_privilege toggle.
  const hasHighPrivilege = isSecret || Boolean(data.allow_high_privilege);

  return {
    userId: data.user_id,
    projectId: data.id,
    projectName: data.name,
    allowHighPrivilege: hasHighPrivilege,
    authenticatedViaSecret: isSecret,
  };
}

// MCP Protocol Responses
function mcpInitResponse() {
  return NextResponse.json({
    jsonrpc: '2.0',
    result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: {
        name: 'eshamikh-mcp-server',
        version: '1.1.0',
      },
    },
    id: 1,
  });
}

function mcpToolsResponse(id: number | string) {
  return NextResponse.json({
    jsonrpc: '2.0',
    result: { tools: MCP_TOOLS },
    id,
  });
}

async function executeTool(
  toolName: string,
  args: Record<string, any>,
  auth: AuthContext
): Promise<{ success: boolean; data?: any; error?: { code: number; message: string } }> {
  try {
    // 1. CREATE LINK
    if (toolName === 'elink_create') {
      const { destination_url, custom_slug, title } = args;
      if (!destination_url) {
        return { success: false, error: { code: -32602, message: 'Missing destination_url' } };
      }

      const slug = custom_slug || Math.random().toString(36).slice(2, 8);

      const { data, error } = await supabaseAdmin
        .from('links')
        .insert({
          user_id: auth.userId,
          slug,
          destination_url,
          title: title || null,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: { code: -32000, message: `Failed to create link: ${error.message}` } };
      }

      return {
        success: true,
        data: {
          slug: data.slug,
          short_url: `https://services.eshamikh.com/s/${data.slug}`,
          destination_url: data.destination_url,
          title: data.title,
          created_at: data.created_at,
        },
      };
    }

    // 2. LIST LINKS
    if (toolName === 'elink_list') {
      const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 100);

      const { data, error } = await supabaseAdmin
        .from('links')
        .select('slug, destination_url, title, is_active, created_at, updated_at')
        .eq('user_id', auth.userId)
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: { code: -32000, message: `Failed to list links: ${error.message}` } };
      }

      return {
        success: true,
        data: {
          links: data || [],
          total: data?.length || 0,
        },
      };
    }

    // 3. STATS
    if (toolName === 'elink_stats') {
      const { slug } = args;
      if (!slug) {
        return { success: false, error: { code: -32602, message: 'Missing slug parameter' } };
      }

      const { data: link, error: linkError } = await supabaseAdmin
        .from('links')
        .select('slug, destination_url, title, is_active, created_at')
        .eq('user_id', auth.userId)
        .eq('slug', slug)
        .single();

      if (linkError || !link) {
        return { success: false, error: { code: -32004, message: 'Link not found or access denied' } };
      }

      const { count } = await supabaseAdmin
        .from('link_clicks')
        .select('id', { count: 'exact', head: true })
        .eq('link_slug', slug);

      return {
        success: true,
        data: {
          slug: link.slug,
          title: link.title,
          destination_url: link.destination_url,
          is_active: link.is_active,
          created_at: link.created_at,
          total_clicks: count || 0,
        },
      };
    }

    // 4. UPDATE LINK (HIGH PRIVILEGE)
    if (toolName === 'elink_update') {
      if (!auth.allowHighPrivilege) {
        return {
          success: false,
          error: {
            code: -32003,
            message:
              'High-privilege command blocked: Updating links is disabled for this project key. Enable "High Commands / الصلاحيات المتقدمة" in your eShamikh MCP settings or authenticate using your API Secret.',
          },
        };
      }

      const { slug, destination_url, title, is_active } = args;
      if (!slug) {
        return { success: false, error: { code: -32602, message: 'Missing slug parameter' } };
      }

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (destination_url !== undefined) updateData.destination_url = destination_url;
      if (title !== undefined) updateData.title = title;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabaseAdmin
        .from('links')
        .update(updateData)
        .eq('user_id', auth.userId)
        .eq('slug', slug)
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: { code: -32000, message: `Failed to update link: ${error?.message || 'Link not found'}` } };
      }

      return {
        success: true,
        data: {
          slug: data.slug,
          short_url: `https://services.eshamikh.com/s/${data.slug}`,
          destination_url: data.destination_url,
          title: data.title,
          is_active: data.is_active,
          updated_at: data.updated_at,
        },
      };
    }

    // 5. DELETE LINK (HIGH PRIVILEGE)
    if (toolName === 'elink_delete') {
      if (!auth.allowHighPrivilege) {
        return {
          success: false,
          error: {
            code: -32003,
            message:
              'High-privilege command blocked: Deleting links is disabled for this project key. Enable "High Commands / الصلاحيات المتقدمة" in your eShamikh MCP settings or authenticate using your API Secret.',
          },
        };
      }

      const { slug } = args;
      if (!slug) {
        return { success: false, error: { code: -32602, message: 'Missing slug parameter' } };
      }

      const { error, count } = await supabaseAdmin
        .from('links')
        .delete({ count: 'exact' })
        .eq('user_id', auth.userId)
        .eq('slug', slug);

      if (error) {
        return { success: false, error: { code: -32000, message: `Failed to delete link: ${error.message}` } };
      }

      if (count === 0) {
        return { success: false, error: { code: -32004, message: 'Link not found or already deleted' } };
      }

      return {
        success: true,
        data: {
          deleted: true,
          slug,
          message: `Link "${slug}" was permanently deleted`,
        },
      };
    }

    return {
      success: false,
      error: { code: -32601, message: `Tool not recognized: ${toolName}` },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: -32000, message: err?.message || 'Internal error' },
    };
  }
}

export async function POST(req: NextRequest) {
  // 1. Authenticate Request
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Unauthorized: Missing or invalid API key / Secret key',
        },
        id: null,
      },
      { status: 401 }
    );
  }

  // 2. Parse Body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400 }
    );
  }

  // 3. Check for Direct REST action (for developers building custom admin dashboards)
  const restAction = body.action || body.tool;
  if (restAction) {
    const normalizedTool = restAction.startsWith('elink_') ? restAction : `elink_${restAction}`;
    const result = await executeTool(normalizedTool, body, auth);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message, code: result.error?.code },
        { status: result.error?.code === -32003 ? 403 : 400 }
      );
    }
    return NextResponse.json({ success: true, ...result.data });
  }

  // 4. Standard MCP JSON-RPC 2.0 Handling
  const { method, params, id = 1 } = body;

  switch (method) {
    case 'initialize':
      return mcpInitResponse();

    case 'tools/list':
      return mcpToolsResponse(id);

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const result = await executeTool(toolName, toolArgs, auth);

      if (!result.success) {
        return NextResponse.json({
          jsonrpc: '2.0',
          error: result.error,
          id,
        });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        },
        id,
      });
    }

    default:
      return NextResponse.json({
        jsonrpc: '2.0',
        error: { code: -32601, message: `Method not found: ${method}` },
        id,
      });
  }
}

// GET: Server info & capabilities report
export async function GET() {
  return NextResponse.json({
    name: 'eShamikh MCP & Admin API Server',
    version: '1.1.0',
    protocol: 'MCP 2024-11-05',
    capabilities: {
      mcp: true,
      rest_api: true,
      high_privilege_commands: ['elink_update', 'elink_delete'],
      standard_commands: ['elink_create', 'elink_list', 'elink_stats'],
    },
    auth_methods: [
      'Bearer <api_key>',
      'Bearer <api_secret>',
      'X-API-Key header',
      'X-API-Secret header',
    ],
    status: 'operational',
    docs: 'https://services.eshamikh.com/docs/mcp',
  });
}

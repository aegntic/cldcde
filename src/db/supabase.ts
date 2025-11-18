import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Supabase client for server-side operations
export function createSupabaseClient(env: { 
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string 
}) {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Supabase client for client-side operations (uses anon key)
export function createSupabaseAnonClient(env: { 
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string 
}) {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}

// Helper functions for common queries
export const db = {
  // Extensions
  async getExtensions(client: ReturnType<typeof createSupabaseClient>, options?: {
    category?: string
    search?: string
    limit?: number
    offset?: number
    orderBy?: 'downloads' | 'rating' | 'created_at'
  }) {
    let query = client
      .from('extensions')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url)
      `)

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.search) {
      query = query.textSearch('name', options.search, {
        type: 'websearch',
        config: 'english'
      })
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: false })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  },

  async getExtensionById(client: ReturnType<typeof createSupabaseClient>, id: string) {
    return client
      .from('extensions')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url),
        reviews(rating, title, content, created_at, user:profiles!user_id(username, avatar_url))
      `)
      .eq('id', id)
      .single()
  },

  async createExtension(
    client: ReturnType<typeof createSupabaseClient>, 
    extension: Omit<Database['public']['Tables']['extensions']['Insert'], 'id' | 'created_at' | 'updated_at'>
  ) {
    return client
      .from('extensions')
      .insert(extension)
      .select()
      .single()
  },

  async updateExtensionDownloads(client: ReturnType<typeof createSupabaseClient>, id: string) {
    return client.rpc('increment_downloads', { extension_id: id })
  },

  // MCP Servers
  async getMCPServers(client: ReturnType<typeof createSupabaseClient>, options?: {
    category?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    let query = client
      .from('mcp_servers')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url)
      `)

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.search) {
      query = query.textSearch('name', options.search)
    }

    query = query.order('downloads', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  },

  // Users
  async getUserProfile(client: ReturnType<typeof createSupabaseClient>, username: string) {
    return client
      .from('profiles')
      .select(`
        *,
        extensions:extensions!author_id(id, name, downloads, rating),
        mcp_servers:mcp_servers!author_id(id, name, downloads, rating)
      `)
      .eq('username', username)
      .single()
  },

  async createUserProfile(
    client: ReturnType<typeof createSupabaseClient>,
    profile: Database['public']['Tables']['profiles']['Insert']
  ) {
    return client
      .from('profiles')
      .insert(profile)
      .select()
      .single()
  },

  // Reviews
  async createReview(
    client: ReturnType<typeof createSupabaseClient>,
    review: Database['public']['Tables']['reviews']['Insert']
  ) {
    return client
      .from('reviews')
      .insert(review)
      .select()
      .single()
  },

  // Forums
  async getForums(client: ReturnType<typeof createSupabaseClient>) {
    return client
      .from('forums')
      .select('*')
      .order('title')
  },

  async getForumPosts(client: ReturnType<typeof createSupabaseClient>, forumId: string, options?: {
    limit?: number
    offset?: number
  }) {
    let query = client
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url)
      `)
      .eq('forum_id', forumId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  },

  async getPost(client: ReturnType<typeof createSupabaseClient>, postId: string) {
    return client
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url),
        comments(
          *,
          author:profiles!author_id(id, username, avatar_url)
        )
      `)
      .eq('id', postId)
      .single()
  },

  // News
  async getNews(client: ReturnType<typeof createSupabaseClient>, options?: {
    limit?: number
    offset?: number
  }) {
    let query = client
      .from('news')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url)
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  }
}

// Create stored procedures for complex operations
export const storedProcedures = `
-- Increment downloads counter
CREATE OR REPLACE FUNCTION increment_downloads(extension_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE extensions 
  SET downloads = downloads + 1 
  WHERE id = extension_id;
END;
$$ LANGUAGE plpgsql;

-- Update rating after new review
CREATE OR REPLACE FUNCTION update_rating()
RETURNS TRIGGER AS $$
DECLARE
  new_rating NUMERIC(3,2);
  new_count INTEGER;
BEGIN
  IF NEW.extension_id IS NOT NULL THEN
    SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)::INTEGER
    INTO new_rating, new_count
    FROM reviews
    WHERE extension_id = NEW.extension_id;
    
    UPDATE extensions
    SET rating = new_rating, rating_count = new_count
    WHERE id = NEW.extension_id;
  ELSIF NEW.mcp_server_id IS NOT NULL THEN
    SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)::INTEGER
    INTO new_rating, new_count
    FROM reviews
    WHERE mcp_server_id = NEW.mcp_server_id;
    
    UPDATE mcp_servers
    SET rating = new_rating, rating_count = new_count
    WHERE id = NEW.mcp_server_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_extension_rating_after_review
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_rating();
`
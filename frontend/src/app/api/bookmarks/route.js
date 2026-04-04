import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid user token' }, { status: 401 });
    }

    const { hackathonId } = await request.json();
    if (!hackathonId) {
      return NextResponse.json({ error: 'hackathonId is required' }, { status: 400 });
    }

    const { data: existing } = await adminClient
      .from('saved_hackathons')
      .select('id')
      .eq('user_id', user.id)
      .eq('hackathon_id', hackathonId)
      .maybeSingle();

    if (existing?.id) {
      await adminClient
        .from('saved_hackathons')
        .delete()
        .eq('id', existing.id)
        .eq('user_id', user.id);
      return NextResponse.json({ saved: false });
    }

    await adminClient.from('saved_hackathons').insert({
      user_id: user.id,
      hackathon_id: hackathonId,
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}

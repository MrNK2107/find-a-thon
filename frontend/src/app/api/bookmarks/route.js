import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

// Initialize Firebase Admin once
if (!getApps().length) {
  try {
    const privKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privKey && !privKey.includes('your_private_key')) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privKey.replace(/\\n/g, '\n'),
        }),
      });
    }
  } catch (error) {
    console.warn('Firebase admin skipped init:', error.message);
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const { hackathonId } = await request.json();
    if (!hackathonId) {
      return NextResponse.json({ error: 'hackathonId is required' }, { status: 400 });
    }

    const { data: existing } = await adminClient
      .from('saved_hackathons')
      .select('id')
      .eq('user_id', uid)
      .eq('hackathon_id', hackathonId)
      .maybeSingle();

    if (existing?.id) {
      await adminClient
        .from('saved_hackathons')
        .delete()
        .eq('id', existing.id)
        .eq('user_id', uid);
      return NextResponse.json({ saved: false });
    }

    await adminClient.from('saved_hackathons').insert({
      user_id: uid,
      hackathon_id: hackathonId,
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}

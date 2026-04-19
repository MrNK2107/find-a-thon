import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
    // Optional: add a secret token check to ensure only the cron job can trigger this
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need a service role key to query all data securely

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Missing Supabase configured keys for service role' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Query users who saved hackathons and want reminders
        // In a real setup, we might also get user emails from Firebase Admin SDK using the user_id.
        const { data, error } = await supabase
            .from('saved_hackathons')
            .select(`
                user_id,
                hackathon_id,
                hackathons:hackathon_id (
                    title,
                    reg_end_date,
                    link
                )
            `)
            .eq('remind_me', true);

        if (error) throw error;

        // Calculate tomorrow's date string
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        let remindersSent = 0;

        // Iterate and check deadlines
        const sendPromises = data.map(async (bookmark) => {
            const hackathon = bookmark.hackathons;
            if (!hackathon || !hackathon.reg_end_date) return;
            
            // Check if deadline is tomorrow
            // Assuming reg_end_date is YYYY-MM-DD format
            if (hackathon.reg_end_date === tomorrowStr) {
                // Mock sending an email
                console.log(`[CRON/MOCK EMAIL] Sending 24h reminder to Firebase User ${bookmark.user_id} for "${hackathon.title}" -> ${hackathon.link}`);
                
                // Here you would call Firebase Admin to get the user's email, or Postmark/SendGrid API to dispatch the mail.
                remindersSent++;
            }
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${data.length} bookmarks. Mock sent ${remindersSent} reminders.` 
        });

    } catch (err) {
        console.error('Error executing cron reminders:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

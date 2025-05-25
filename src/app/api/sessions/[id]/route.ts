import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const body = await request.json();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the existing session to ensure we have all data and ownership
    const { data: existingSession, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingSession) throw fetchError || new Error('Session not found');

    // Merge existing data with updates
    const buyIn = Number(body.buyIn);
    const cashOut = body.cashOut !== undefined && body.cashOut !== '' ? Number(body.cashOut) : null;
    const profit = cashOut !== null ? cashOut - buyIn : null;
    const updatedData = {
      ...existingSession,
      game_type: body.gameType,
      buy_in: buyIn,
      cash_out: cashOut,
      profit: profit,
      location: body.location,
      notes: body.notes,
      date: body.date
    };

    const { data: session, error } = await supabase
      .from('sessions')
      .update(updatedData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Error updating session' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Error deleting session' }, { status: 500 });
  }
} 
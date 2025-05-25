import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface Session {
  id: string;
  game_type: string;
  buy_in: number | null;
  cash_out: number | null;
  profit: number | null;
  location: string;
  notes: string;
  date: string;
  user_id?: string;
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) throw error;

    // Map snake_case to camelCase for frontend compatibility
    const mappedData = sessions.map((session: Session) => ({
      id: session.id,
      gameType: session.game_type,
      buyIn: session.buy_in !== null && session.buy_in !== undefined ? Number(session.buy_in) : null,
      cashOut: session.cash_out !== null && session.cash_out !== undefined ? Number(session.cash_out) : null,
      profit: session.profit !== null && session.profit !== undefined ? Number(session.profit) : null,
      location: session.location,
      notes: session.notes,
      date: session.date,
    }));
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Error fetching sessions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .insert([
        {
          user_id: user.id,
          game_type: body.gameType,
          buy_in: Number(body.buyIn),
          cash_out: body.cashOut ? Number(body.cashOut) : null,
          profit: body.cashOut ? Number(body.cashOut) - Number(body.buyIn) : null,
          location: body.location,
          notes: body.notes,
          date: body.date,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Error creating session' }, { status: 500 });
  }
} 
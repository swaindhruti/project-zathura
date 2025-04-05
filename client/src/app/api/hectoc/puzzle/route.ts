import { NextResponse } from 'next/server';
import axios from 'axios';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { difficulty = 'moderate' } = body;

    const response = await axios.post(
      `${process.env.SERVER_URL}/hectoc/puzzle`,
      { difficulty },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching puzzle:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch puzzle' }, { status: 500 });
  }
}

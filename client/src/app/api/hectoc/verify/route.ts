import { NextResponse } from 'next/server';
import axios from 'axios';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { digits, solution, target = 100 } = body;

    const response = await axios.post(
      `${process.env.SERVER_URL}/api/hectoc/verify`,
      { digits, solution, target },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error verifying solution:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify solution' },
      { status: 500 }
    );
  }
}

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
    const { questionId } = body;

    const response = await axios.post(
      `${process.env.SERVER_URL}/api/hectoc/solution`,
      { questionId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error getting solution:', error);
    return NextResponse.json({ error: error.message || 'Failed to get solution' }, { status: 500 });
  }
}

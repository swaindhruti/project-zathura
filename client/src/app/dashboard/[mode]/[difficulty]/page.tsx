'use client';
import Game from '@/components/dashboard/game';

interface PageParams {
  mode: string;
  difficulty: string;
}

export default async function Page({ params }: { params: PageParams }) {
  const { mode, difficulty } = await params;

  return <Game difficulty={difficulty} mode={mode} />;
}

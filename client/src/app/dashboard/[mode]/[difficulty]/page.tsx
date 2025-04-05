import React from 'react';

interface PageParams {
  mode: string;
  difficulty: string;
}

export default async function Page({ params }: { params: PageParams }) {
  const { mode, difficulty } = await params;
  console.log('Mode:', mode);
  console.log('Difficulty:', difficulty);

  return (
    <div>
      <h1>Game Page</h1>
      <p>Mode: {mode}</p>
      <p>Difficulty: {difficulty}</p>
    </div>
  );
}

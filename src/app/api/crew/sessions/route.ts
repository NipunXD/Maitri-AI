import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const sessionsDir = path.join(process.cwd(), 'src/app/data/sessions');
    const files = await fs.readdir(sessionsDir);

    const sessions = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async f => {
          const content = await fs.readFile(path.join(sessionsDir, f), 'utf-8');
          return JSON.parse(content);
        })
    );

    return NextResponse.json(sessions);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}

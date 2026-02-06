import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the sessions directory
    const sessionsDir = path.join(process.cwd(), 'src/app/data/sessions');
    
    // Read the directory contents
    const files = await fs.readdir(sessionsDir);
    
    // Filter for JSON files and sort by most recent first
    const sessionFiles = files
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        // Extract timestamps from filenames for sorting
        const getTime = (filename: string) => {
          const match = filename.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/);
          return match ? new Date(match[0].replace(/-/g, ':')) : new Date(0);
        };
        return getTime(b).getTime() - getTime(a).getTime();
      });
    
    return NextResponse.json(sessionFiles);
  } catch (error) {
    console.error('Error reading session files:', error);
    return NextResponse.json(
      { error: 'Failed to load session files' },
      { status: 500 }
    );
  }
}

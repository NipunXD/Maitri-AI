import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const sessionId = formData.get('sessionId') as string;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Save the uploaded file
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, `${sessionId}-${Date.now()}.webm`);
    await writeFile(filePath, buffer);

    console.log(`Video saved to ${filePath}`);

    // For now, just return a success response
    // In a real implementation, you would process the video here
    return NextResponse.json({
      success: true,
      message: 'Video uploaded successfully',
      filePath,
      sessionId,
    });

  } catch (error) {
    console.error('Error processing video upload:', error);
    return NextResponse.json(
      { error: 'Failed to process video upload' },
      { status: 500 }
    );
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const form = formidable({ uploadDir: './uploads', keepExtensions: true });

    try {
        const [fields, files] = await form.parse(req);
        const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;
        const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;

        if (!videoFile) return res.status(400).json({ error: 'No video file provided' });

        // Make sure sessions folder exists
        const sessionsDir = path.join(process.cwd(), 'src', 'app', 'data', 'sessions');
        if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

        const outputPath = path.join(sessionsDir, `${sessionId}-emotions.json`);
        const pythonScript = path.join(process.cwd(), 'scripts', 'emotion_analyzer.py');

        const pythonProcess = spawn('python', [pythonScript, videoFile.filepath, outputPath]);

        pythonProcess.on('close', (code) => {
            // Delete uploaded video
            fs.unlinkSync(videoFile.filepath);

            if (code === 0) {
                res.status(200).json({ message: 'Video analyzed successfully', outputPath });
            } else {
                res.status(500).json({ error: 'Emotion analysis failed' });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

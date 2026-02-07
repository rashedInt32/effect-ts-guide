import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 });
  }

  // Security: prevent directory traversal
  const sanitizedPath = filePath.replace(/\.\./g, '');
  
  // Read from parent directory (repo root)
  const fullPath = path.join(process.cwd(), '..', sanitizedPath);
  
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // Add cache-busting headers in development
    const headers = new Headers();
    headers.set('Content-Type', 'text/plain');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return new NextResponse(content, { headers });
  } catch (error) {
    console.error(`Error reading file ${fullPath}:`, error);
    return NextResponse.json(
      { error: 'File not found', path: sanitizedPath },
      { status: 404 }
    );
  }
}

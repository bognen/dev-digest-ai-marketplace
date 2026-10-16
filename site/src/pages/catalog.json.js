import { getSiteData } from '../lib/data.mjs';

export function GET() {
  return new Response(JSON.stringify(getSiteData().catalog), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

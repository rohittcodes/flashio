import { json } from '@remix-run/cloudflare';

// Handle Chrome DevTools and other .well-known requests
export async function loader() {
  return json({ error: 'Not found' }, { status: 404 });
}

export default function WellKnown() {
  return null;
}

// One-time OAuth flow for the Best of MPLS YouTube channel.
// Run: node scripts/youtube/auth.js
// Prints an auth URL; the account owner opens it, picks the Best of MPLS
// brand channel at the account chooser, and approves. The loopback server
// catches the code and saves .youtube-token.json (gitignored).
// Refresh tokens from a production-published consent screen do not expire.
import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLIENT = JSON.parse(fs.readFileSync(path.join(ROOT, '.youtube-client.json'), 'utf8'));
const TOKEN_PATH = path.join(ROOT, '.youtube-token.json');
const PORT = 8791;
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
].join(' ');

const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: CLIENT.client_id,
  redirect_uri: REDIRECT,
  response_type: 'code',
  scope: SCOPES,
  access_type: 'offline',
  prompt: 'consent',
  code_challenge: challenge,
  code_challenge_method: 'S256',
});

console.log('\nOpen this URL, choose the Best of MPLS channel, and approve:\n');
console.log(authUrl + '\n');

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT);
  if (u.pathname !== '/callback') { res.writeHead(404).end(); return; }
  const code = u.searchParams.get('code');
  if (!code) {
    res.end('No code in callback. Check the terminal.');
    console.error('Callback had no code:', req.url);
    return;
  }
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT.client_id,
      client_secret: CLIENT.client_secret,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT,
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.refresh_token) {
    res.end('Token exchange failed. Check the terminal.');
    console.error('Token exchange failed:', JSON.stringify(tokens, null, 2));
    process.exit(1);
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  res.end('Best of MPLS is connected. You can close this tab.');
  console.log('Saved refresh token to .youtube-token.json');
  server.close();
});
server.listen(PORT, '127.0.0.1');

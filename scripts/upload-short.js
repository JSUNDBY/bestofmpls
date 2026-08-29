#!/usr/bin/env node
/**
 * upload-short.js — put a rendered Short on YouTube as a PRIVATE draft.
 *
 * It never publishes. Two reasons, and both are load-bearing:
 *   1. The project rule: automate everything up to the send, never the send.
 *   2. YouTube enforces it anyway. Videos uploaded via videos.insert from an
 *      unverified API project (created after 2020-07-28) are locked to private
 *      with no appeal. Lifting that needs a YouTube API compliance audit.
 *      https://support.google.com/youtube/answer/7300965
 * So Josh opens Studio, watches it, and publishes by hand. That is the design.
 *
 * One-time setup:  node scripts/upload-short.js --auth
 *   Opens Google's consent screen, catches the callback on localhost:47824, and
 *   prints the refresh token to save as YT_REFRESH_TOKEN. See growth/YOUTUBE-SETUP.md.
 *
 * Upload:  node scripts/upload-short.js [--file dist/shorts/....mp4]
 *   Needs YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN in the environment.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { google } = require('googleapis');

const ROOT = path.join(__dirname, '..');
const SHORTS_DIR = path.join(ROOT, 'dist', 'shorts');
const REDIRECT_PORT = 47824;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

const { YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN } = process.env;

function client() {
  if (!YT_CLIENT_ID || !YT_CLIENT_SECRET) {
    console.error('Missing YT_CLIENT_ID / YT_CLIENT_SECRET. See growth/YOUTUBE-SETUP.md');
    process.exit(1);
  }
  return new google.auth.OAuth2(YT_CLIENT_ID, YT_CLIENT_SECRET, REDIRECT_URI);
}

/** One-time consent, catching the redirect on loopback (Google killed the OOB flow). */
function auth() {
  const oauth = client();
  const url = oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',              // force a refresh token even on re-auth
    scope: SCOPES,
  });

  const server = http.createServer(async (req, res) => {
    const code = new URL(req.url, REDIRECT_URI).searchParams.get('code');
    if (!code) { res.writeHead(400).end('No code in callback.'); return; }
    try {
      const { tokens } = await oauth.getToken(code);
      res.writeHead(200, { 'Content-Type': 'text/plain' })
         .end('Done. Back to the terminal.');
      console.log('\nAdd this to your environment (and to the repo secrets):\n');
      console.log(`YT_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      if (!tokens.refresh_token) {
        console.log('No refresh token came back. Revoke the app at');
        console.log('https://myaccount.google.com/permissions and run --auth again.');
      }
    } catch (e) {
      res.writeHead(500).end('Token exchange failed.');
      console.error(e.message);
    }
    server.close();
  });

  server.listen(REDIRECT_PORT, () => {
    console.log('Open this in the browser signed in to the Best of MPLS channel:\n');
    console.log(url + '\n');
    console.log(`Waiting for the callback on ${REDIRECT_URI} ...`);
  });
}

function latestShort() {
  const i = process.argv.indexOf('--file');
  if (i > -1) return path.resolve(process.argv[i + 1]);
  if (!fs.existsSync(SHORTS_DIR)) return null;
  const files = fs.readdirSync(SHORTS_DIR).filter(f => f.endsWith('.mp4')).sort();
  return files.length ? path.join(SHORTS_DIR, files[files.length - 1]) : null;
}

async function upload() {
  if (!YT_REFRESH_TOKEN) {
    console.error('Missing YT_REFRESH_TOKEN. Run: node scripts/upload-short.js --auth');
    process.exit(1);
  }
  const file = latestShort();
  if (!file || !fs.existsSync(file)) {
    console.error('No rendered Short found. Run: node scripts/build-shorts.js');
    process.exit(1);
  }
  const metaPath = file.replace(/\.mp4$/, '.json');
  if (!fs.existsSync(metaPath)) {
    console.error(`Missing sidecar metadata: ${metaPath}`);
    process.exit(1);
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  const oauth = client();
  oauth.setCredentials({ refresh_token: YT_REFRESH_TOKEN });
  const youtube = google.youtube({ version: 'v3', auth: oauth });

  const bytes = fs.statSync(file).size;
  console.log(`Uploading ${path.basename(file)} (${(bytes / 1e6).toFixed(1)} MB) as PRIVATE`);

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: meta.title,
        description: meta.description,
        tags: meta.tags,
        categoryId: '24',             // Entertainment
        defaultLanguage: 'en',
      },
      status: {
        privacyStatus: 'private',     // never change this; see the header
        selfDeclaredMadeForKids: false,
      },
    },
    media: { body: fs.createReadStream(file) },
  });

  const id = res.data.id;
  console.log(`\nUploaded as private: https://youtu.be/${id}`);
  console.log(`Review and publish:  https://studio.youtube.com/video/${id}/edit`);
}

if (process.argv.includes('--auth')) auth();
else upload().catch(e => { console.error(e.message); process.exit(1); });

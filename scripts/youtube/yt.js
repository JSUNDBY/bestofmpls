// Shared YouTube API helpers for the Best of MPLS channel.
// Auth model: .youtube-client.json + .youtube-token.json (both gitignored),
// created by scripts/youtube/auth.js. Access tokens are refreshed here on
// every run; the refresh token is the durable credential.
//
// Review gate (the rule for every caller): videos upload as PRIVATE.
// Nothing goes public except through publish() with an explicit video id,
// after Josh has reviewed the private upload in YouTube Studio.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLIENT = JSON.parse(fs.readFileSync(path.join(ROOT, '.youtube-client.json'), 'utf8'));
const TOKEN_PATH = path.join(ROOT, '.youtube-token.json');

export async function accessToken() {
  const saved = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT.client_id,
      client_secret: CLIENT.client_secret,
      refresh_token: saved.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const fresh = await res.json();
  if (!fresh.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(fresh));
  return fresh.access_token;
}

// Resumable upload. meta: {title, description, tags?, categoryId?}.
// Always lands as private — the review gate.
export async function uploadVideo(filePath, meta) {
  const token = await accessToken();
  const size = fs.statSync(filePath).size;
  const body = {
    snippet: {
      title: meta.title,
      description: meta.description || '',
      tags: meta.tags || [],
      categoryId: meta.categoryId || '19', // Travel & Events
    },
    status: { privacyStatus: 'private', selfDeclaredMadeForKids: false },
  };
  const start = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
        'content-type': 'application/json',
        'x-upload-content-length': String(size),
        'x-upload-content-type': 'video/*',
      },
      body: JSON.stringify(body),
    },
  );
  if (!start.ok) throw new Error('Upload init failed: ' + (await start.text()));
  const uploadUrl = start.headers.get('location');
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-length': String(size), 'content-type': 'video/*' },
    body: fs.readFileSync(filePath),
  });
  const result = await put.json();
  if (result.error) throw new Error('Upload failed: ' + JSON.stringify(result.error));
  return result; // result.id is the video id
}

// The only path to public. Requires the explicit id of a reviewed video.
export async function publish(videoId) {
  const token = await accessToken();
  const get = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoId}`,
    { headers: { authorization: 'Bearer ' + token } },
  );
  const data = await get.json();
  const video = data.items?.[0];
  if (!video) throw new Error('Video not found: ' + videoId);
  video.status.privacyStatus = 'public';
  const res = await fetch('https://www.googleapis.com/youtube/v3/videos?part=status', {
    method: 'PUT',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ id: videoId, status: video.status }),
  });
  const out = await res.json();
  if (out.error) throw new Error('Publish failed: ' + JSON.stringify(out.error));
  return out;
}

export async function listVideos() {
  const token = await accessToken();
  const ch = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
    { headers: { authorization: 'Bearer ' + token } },
  ).then(r => r.json());
  const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return [];
  const items = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,status&playlistId=${uploads}&maxResults=50`,
    { headers: { authorization: 'Bearer ' + token } },
  ).then(r => r.json());
  return (items.items || []).map(i => ({
    id: i.snippet.resourceId.videoId,
    title: i.snippet.title,
    privacy: i.status?.privacyStatus,
    publishedAt: i.snippet.publishedAt,
  }));
}

// CLI for the Best of MPLS channel. The review gate lives in yt.js:
// uploads are always private; publish is a separate explicit step.
//
//   node scripts/youtube/cli.js upload <video.mp4> --title "..." [--desc "..."] [--tags a,b]
//   node scripts/youtube/cli.js list
//   node scripts/youtube/cli.js publish <videoId>
import { uploadVideo, publish, listVideos } from './yt.js';

const [cmd, ...rest] = process.argv.slice(2);

function flag(name) {
  const i = rest.indexOf('--' + name);
  return i === -1 ? undefined : rest[i + 1];
}

if (cmd === 'upload') {
  const file = rest[0];
  const title = flag('title');
  if (!file || !title) { console.error('Usage: upload <file> --title "..."'); process.exit(1); }
  const result = await uploadVideo(file, {
    title,
    description: flag('desc') || '',
    tags: (flag('tags') || '').split(',').filter(Boolean),
  });
  console.log(`Uploaded PRIVATE: https://youtube.com/watch?v=${result.id}`);
  console.log('Review it in YouTube Studio, then: node scripts/youtube/cli.js publish ' + result.id);
} else if (cmd === 'publish') {
  if (!rest[0]) { console.error('Usage: publish <videoId>'); process.exit(1); }
  await publish(rest[0]);
  console.log(`PUBLIC: https://youtube.com/watch?v=${rest[0]}`);
} else if (cmd === 'list') {
  for (const v of await listVideos()) {
    console.log(`${v.id}  [${v.privacy}]  ${v.title}`);
  }
} else {
  console.error('Commands: upload, list, publish');
  process.exit(1);
}

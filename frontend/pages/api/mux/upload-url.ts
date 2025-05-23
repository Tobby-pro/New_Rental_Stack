import type { NextApiRequest, NextApiResponse } from 'next';
import mux from '@mux/mux-node';

const muxClient = new mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const upload = await muxClient.video.uploads.create({
        new_asset_settings: {
          playback_policies: ['public'],
        },
        cors_origin: '*',
      });

    res.status(200).json({ uploadUrl: upload.url, uploadId: upload.id });
  } catch (err) {
    console.error('Error creating upload URL:', err);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
}

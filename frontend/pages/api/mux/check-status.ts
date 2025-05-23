import type { NextApiRequest, NextApiResponse } from 'next';
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

const video = mux.video;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uploadId } = req.query;

  if (!uploadId || typeof uploadId !== 'string') {
    return res.status(400).json({ error: 'Missing uploadId' });
  }

  try {
    const upload = await video.uploads.retrieve(uploadId);
    if (upload.asset_id) {
      const asset = await video.assets.retrieve(upload.asset_id);
      const playbackId = asset.playback_ids?.[0]?.id;
      res.status(200).json({ assetId: upload.asset_id, playbackId });
    } else {
      res.status(200).json({ status: upload.status });
    }
  } catch (err) {
    console.error('Error retrieving upload or asset:', err);
    res.status(500).json({ error: 'Failed to check status' });
  }
}

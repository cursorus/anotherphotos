// api/proxy.js - Vercel Serverless Function

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { authSession, gatheringId, cursor, limit } = req.body;

    if (!authSession || !gatheringId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const query = `
      query GetGatheringAndPhotos($input: GetGatheringInput!, $photosInput: GatheringPhotosInput) {
        getGathering(input: $input) {
          gatheringId
          numPhotos
          photos(input: $photosInput) {
            cursor
            payload {
              photoId
              ownerId
              width
              height
              variant
              videoDuration
              readUrl {
                v0TemplateUrl
                videoStrategy
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://multi-region-prod-graphql.joinswsh.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${authSession}`,
        'x-operation-version': 'v0.0.2',
        'x-operation-hash': 'e2bd15ab063fc6f0949a545a581e536260a7cb10f8c0b2244261b8ec00bdfc47',
        'x-client-version': '1.1.15',
        'x-branch': 'prod',
        'User-Agent': 'Mozilla/5.0 (compatible; AlbumViewer/1.0)'
      },
      body: JSON.stringify({
        operationName: 'GetGatheringAndPhotos',
        variables: {
          input: { gatheringId },
          photosInput: {
            cursor,
            limit: limit || 50,
            filterUserIds: [],
            filterUploaderIds: [],
            filterPhotoVariant: [],
            filterLabels: [],
            filterRestrictedLabels: [],
            filterMode: 'Or',
            filter: 'Active'
          }
        },
        query
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'API request failed', 
        details: data 
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}

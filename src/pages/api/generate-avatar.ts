import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing env.OPENAI_API_KEY');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, prompt, traits } = req.body;

    if (!userId || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate image using OpenAI DALL-E
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: '512x512',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const { data } = await response.json();
    const imageUrl = data[0].url;

    // Upload image to Supabase Storage
    const timestamp = Date.now();
    const imagePath = `avatars/${userId}/${timestamp}.png`;

    // Download image from OpenAI
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(imagePath, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('user-content')
      .getPublicUrl(imagePath);

    // Store metadata about the generated avatar
    await supabase.from('user_avatars').insert({
      user_id: userId,
      image_url: publicUrl.publicUrl,
      traits,
      prompt,
      created_at: new Date().toISOString(),
    });

    res.status(200).json({ imageUrl: publicUrl.publicUrl });
  } catch (error) {
    console.error('Error generating avatar:', error);
    res.status(500).json({ error: 'Failed to generate avatar' });
  }
} 
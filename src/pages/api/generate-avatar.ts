import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const OPENAI_IMAGES_API_URL = 'https://api.openai.com/v1/images/generations';

if (!process.env.OPENAI_API_KEY) {
  logger.error('CRITICAL: Missing env.OPENAI_API_KEY for avatar generation.');
  throw new Error('Missing env.OPENAI_API_KEY');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let userIdForLog: string | undefined = undefined;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Unauthorized: Missing or invalid Authorization header for avatar generation.');
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header.' });
    }
    const token = authHeader.split(' ')[1];

    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      logger.error('Auth error verifying token for avatar generation API', authError, { tokenProvided: !!token });
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }
    const authenticatedUserId = authData.user.id;
    userIdForLog = authenticatedUserId;

    const { prompt, traits } = req.body;

    if (!prompt) {
      logger.warn('Missing required field: prompt for avatar generation', { userId: authenticatedUserId });
      return res.status(400).json({ error: 'Missing required field: prompt' });
    }

    const userId = authenticatedUserId;

    // Generate image using OpenAI DALL-E
    const response = await fetch(OPENAI_IMAGES_API_URL, {
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
      let errorDetails = `Failed to generate image from OpenAI (status: ${response.status})`;
      let errorToLog: Error | null = null;
      const contextForLog: Record<string, any> = { userId, prompt, openAIStatus: response.status };

      try {
        const errorData = await response.json();
        errorDetails += `: ${errorData.error?.message || JSON.stringify(errorData)}`;
        errorToLog = new Error(errorDetails);
        contextForLog.openAIErrorPayload = errorData;
      } catch (e: any) {
        const textError = await response.text().catch(() => "Invalid error response from OpenAI");
        errorDetails += `. Response: ${textError}`;
        errorToLog = e instanceof Error ? e : new Error(errorDetails);
        contextForLog.nonJsonErrorText = textError;
        logger.warn('Failed to parse JSON error from OpenAI, or non-JSON error response', { 
          originalError: e instanceof Error ? { message: e.message, name: e.name, stack: e.stack } : String(e),
          openAIStatus: response.status, 
          openAIResponseText: textError, 
          userId 
        });
      }
      logger.error(errorDetails, errorToLog, contextForLog);
      throw new Error(errorDetails);
    }

    const { data: openaiData } = await response.json();
    const imageUrl = openaiData[0].url;

    // Upload image to Supabase Storage
    const timestamp = Date.now();
    const imagePath = `avatars/${userId}/${timestamp}.png`;

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(imagePath, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Error uploading image to Supabase Storage for avatar', uploadError, { userId, imagePath });
      throw uploadError;
    }

    const { data: publicUrlObject } = await supabase.storage
      .from('user-content')
      .getPublicUrl(imagePath);

    if (!publicUrlObject || !publicUrlObject.publicUrl) {
      const errorMessage = 'Error getting public URL for avatar: publicUrlObject is invalid or missing publicUrl property.';
      logger.error(errorMessage, 
        new Error(errorMessage), 
        { userId, imagePath, publicUrlObjectReceived: publicUrlObject }
      );
      throw new Error('Failed to construct valid public URL for the generated avatar.');
    }
    
    const finalImageUrl = publicUrlObject.publicUrl;

    const { error: insertMetadataError } = await supabase.from('user_avatars').insert({
      user_id: userId,
      image_url: finalImageUrl, 
      traits,
      prompt,
      created_at: new Date().toISOString(),
    });

    if (insertMetadataError) {
      logger.error('Error saving avatar metadata to Supabase', insertMetadataError, { userId, finalImageUrl, prompt });
      throw new Error('Failed to save avatar metadata.');
    }

    logger.info('Avatar generated and saved successfully', { userId, finalImageUrl });
    res.status(200).json({ imageUrl: finalImageUrl });
  } catch (error) {
    logger.error('Unhandled error in generate-avatar API handler', error, { body: req.body, userId: userIdForLog });
    res.status(500).json({ error: 'Failed to generate avatar. Please try again later or contact support.' });
  }
} 
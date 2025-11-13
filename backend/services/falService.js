import * as fal from '@fal-ai/client'
import dotenv from 'dotenv'

dotenv.config()

// Configure Fal.ai client
if (process.env.FAL_API_KEY) {
  fal.config({
    credentials: process.env.FAL_API_KEY,
  })
} else {
  console.warn('⚠️  FAL_API_KEY not found in environment variables')
  console.warn('⚠️  AI generation features will not work. Please configure FAL_API_KEY')
}

/**
 * Generate an image using Fal.ai's Nano Banana model
 * @param {Object} params - Generation parameters
 * @param {string} params.imageUrl - URL of the input image
 * @param {string} params.prompt - Text prompt for generation
 * @returns {Promise<Object>} Generated image result
 */
export async function generateImage({ imageUrl, prompt }) {
  try {
    if (!process.env.FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured')
    }

    console.log('Calling Fal.ai Nano Banana model...')

    // Call Fal.ai's Nano Banana model
    // Model ID: fal-ai/nano-banana
    const result = await fal.subscribe('fal-ai/nano-banana', {
      input: {
        image_url: imageUrl,
        prompt: prompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Generation in progress...')
        }
      },
    })

    console.log('Image generation completed')

    // Extract the generated image URL from the result
    const generatedImageUrl = result.images?.[0]?.url || result.image?.url

    if (!generatedImageUrl) {
      throw new Error('No image URL in response')
    }

    return {
      imageUrl: generatedImageUrl,
      ...result,
    }
  } catch (error) {
    console.error('Fal.ai image generation error:', error)
    throw new Error(`Image generation failed: ${error.message}`)
  }
}

/**
 * Generate a video using Fal.ai's Sora 2 model
 * @param {Object} params - Generation parameters
 * @param {string} params.imageUrl - URL of the input image
 * @param {string} params.prompt - Text prompt for video generation
 * @returns {Promise<Object>} Generated video result
 */
export async function generateVideo({ imageUrl, prompt }) {
  try {
    if (!process.env.FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured')
    }

    console.log('Calling Fal.ai Sora 2 model...')

    // Call Fal.ai's Sora 2 text-to-video model
    // Model ID: fal-ai/sora-2/text-to-video
    const result = await fal.subscribe('fal-ai/sora-2/text-to-video', {
      input: {
        image_url: imageUrl,
        prompt: prompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Video generation in progress...')
          if (update.logs) {
            update.logs.forEach((log) => console.log(log.message))
          }
        }
      },
    })

    console.log('Video generation completed')

    // Extract the generated video URL from the result
    const generatedVideoUrl = result.video?.url || result.videos?.[0]?.url

    if (!generatedVideoUrl) {
      throw new Error('No video URL in response')
    }

    return {
      videoUrl: generatedVideoUrl,
      ...result,
    }
  } catch (error) {
    console.error('Fal.ai video generation error:', error)
    throw new Error(`Video generation failed: ${error.message}`)
  }
}

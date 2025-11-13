import * as fal from '@fal-ai/client'
import dotenv from 'dotenv'

dotenv.config()

// Configure Fal.ai client
// The @fal-ai/client library reads credentials from FAL_KEY environment variable
// or we can pass it explicitly in the subscribe call
if (!process.env.FAL_API_KEY) {
  console.warn('⚠️  FAL_API_KEY not found in environment variables')
  console.warn('⚠️  AI generation features will not work. Please configure FAL_API_KEY')
}

/**
 * Generate/edit an image using Fal.ai's Nano Banana Edit model (Gemini 2.5 Flash Image)
 * @param {Object} params - Generation parameters
 * @param {string|string[]} params.imageUrl - URL(s) of the input image(s)
 * @param {string} params.prompt - Text prompt for image editing
 * @param {number} [params.numImages=1] - Number of images to generate
 * @param {string} [params.aspectRatio='auto'] - Aspect ratio of the generated image
 * @param {string} [params.outputFormat='png'] - Output format (jpeg, png, webp)
 * @returns {Promise<Object>} Generated image result
 */
export async function generateImage({
  imageUrl,
  prompt,
  numImages = 1,
  aspectRatio = 'auto',
  outputFormat = 'png'
}) {
  try {
    if (!process.env.FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured')
    }

    console.log('Calling Fal.ai Nano Banana Edit model (Gemini 2.5 Flash Image)...')

    // Convert imageUrl to array if it's a single string
    const imageUrls = Array.isArray(imageUrl) ? imageUrl : [imageUrl]

    // Call Fal.ai's Nano Banana Edit model
    // Model ID: fal-ai/nano-banana/edit
    const result = await fal.subscribe('fal-ai/nano-banana/edit', {
      input: {
        prompt: prompt,
        image_urls: imageUrls,
        num_images: numImages,
        aspect_ratio: aspectRatio,
        output_format: outputFormat,
      },
      logs: true,
      credentials: process.env.FAL_API_KEY,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Image generation in progress...')
          if (update.logs) {
            update.logs.forEach((log) => console.log(log.message))
          }
        }
      },
    })

    console.log('Image generation completed')

    // Extract the generated images from the result
    if (!result.images || result.images.length === 0) {
      throw new Error('No images in response')
    }

    return {
      images: result.images,
      description: result.description || '',
      imageUrl: result.images[0].url, // Primary image URL for backward compatibility
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
      credentials: process.env.FAL_API_KEY,
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

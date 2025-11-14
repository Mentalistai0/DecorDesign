import * as fal from '@fal-ai/serverless-client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// Configure Fal.ai client with credentials
if (!process.env.FAL_API_KEY) {
  console.warn('⚠️  FAL_API_KEY not found in environment variables')
  console.warn('⚠️  AI generation features will not work. Please configure FAL_API_KEY')
} else {
  // Set the FAL_KEY environment variable that the client expects
  process.env.FAL_KEY = process.env.FAL_API_KEY
  // Configure the client
  fal.config({
    credentials: process.env.FAL_API_KEY
  })
  console.log('✓ Fal.ai API key configured')
}

/**
 * Generate/edit an image using Fal.ai's Nano Banana Edit model (Gemini 2.5 Flash Image)
 * @param {Object} params - Generation parameters
 * @param {string|string[]} params.imageUrl - URL(s) of the input image(s) or file path(s)
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
    let imageUrls = Array.isArray(imageUrl) ? imageUrl : [imageUrl]

    // Upload local files to Fal.ai storage if they're localhost URLs
    const uploadedUrls = []
    for (const url of imageUrls) {
      if (url.includes('localhost') || url.startsWith('http://127.0.0.1')) {
        console.log('Local URL detected, uploading to Fal.ai storage...')

        // Extract the file path from the URL and read file
        const urlPath = new URL(url).pathname
        // Ensure we resolve against project root (cwd) even if pathname starts with '/'
        const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath
        const filePath = path.join(process.cwd(), relativePath)

        console.log('Uploading file:', filePath)

        // Determine MIME type from extension
        const ext = path.extname(filePath).toLowerCase()
        let mimeType = 'application/octet-stream'
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
        else if (ext === '.png') mimeType = 'image/png'
        else if (ext === '.webp') mimeType = 'image/webp'
        else if (ext === '.gif') mimeType = 'image/gif'
        else if (ext === '.bmp') mimeType = 'image/bmp'
        else if (ext === '.tiff' || ext === '.tif') mimeType = 'image/tiff'
        else if (ext === '.avif') mimeType = 'image/avif'

        // Read file contents and construct a Blob/File so the client sets correct content-type
        const buffer = fs.readFileSync(filePath)

        let uploadedUrl
        try {
          // Prefer File when available to include original filename
          // Node 18+ provides a global File implementation via undici
          if (typeof File !== 'undefined') {
            const fileObj = new File([buffer], path.basename(filePath), { type: mimeType })
            uploadedUrl = await fal.storage.upload(fileObj)
          } else {
            const blob = new Blob([buffer], { type: mimeType })
            uploadedUrl = await fal.storage.upload(blob)
          }
        } catch (uploadErr) {
          console.error('Fal storage upload failed, retrying as Blob...', uploadErr)
          const blob = new Blob([buffer], { type: mimeType })
          uploadedUrl = await fal.storage.upload(blob)
        }

        console.log('Uploaded to:', uploadedUrl)
        uploadedUrls.push(uploadedUrl)
      } else {
        uploadedUrls.push(url)
      }
    }

    imageUrls = uploadedUrls

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
      onQueueUpdate: (update) => {
        console.log('Queue update:', update)
        if (update.logs) {
          update.logs.forEach((log) => console.log(log.message))
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
    if (error.body && error.body.detail) {
      console.error('Validation error details:', JSON.stringify(error.body.detail, null, 2))
    }
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
export async function generateVideo({ imageUrl, prompt, resolution = 'auto', aspectRatio = 'auto', duration = 4, deleteVideo = true }) {
  try {
    if (!process.env.FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured')
    }

    console.log('Calling Fal.ai Sora 2 model...')

    // If imageUrl points to localhost, upload to Fal storage first
    let sourceImageUrl = imageUrl
    if (sourceImageUrl && (sourceImageUrl.includes('localhost') || sourceImageUrl.startsWith('http://127.0.0.1'))) {
      try {
        const urlPath = new URL(sourceImageUrl).pathname
        const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath
        const filePath = path.join(process.cwd(), relativePath)

        const ext = path.extname(filePath).toLowerCase()
        let mimeType = 'application/octet-stream'
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
        else if (ext === '.png') mimeType = 'image/png'
        else if (ext === '.webp') mimeType = 'image/webp'
        else if (ext === '.gif') mimeType = 'image/gif'
        else if (ext === '.bmp') mimeType = 'image/bmp'
        else if (ext === '.tiff' || ext === '.tif') mimeType = 'image/tiff'
        else if (ext === '.avif') mimeType = 'image/avif'

        const buffer = fs.readFileSync(filePath)
        let uploadedUrl
        try {
          if (typeof File !== 'undefined') {
            const fileObj = new File([buffer], path.basename(filePath), { type: mimeType })
            uploadedUrl = await fal.storage.upload(fileObj)
          } else {
            const blob = new Blob([buffer], { type: mimeType })
            uploadedUrl = await fal.storage.upload(blob)
          }
        } catch (uploadErr) {
          console.error('Fal storage upload failed for video source, retrying as Blob...', uploadErr)
          const blob = new Blob([buffer], { type: mimeType })
          uploadedUrl = await fal.storage.upload(blob)
        }
        console.log('Uploaded video source to:', uploadedUrl)
        sourceImageUrl = uploadedUrl
      } catch (err) {
        console.error('Local image upload for video failed:', err)
      }
    }

    // Call Fal.ai's Sora 2 image-to-video model
    // Model ID: fal-ai/sora-2/image-to-video
    const result = await fal.subscribe('fal-ai/sora-2/image-to-video', {
      input: {
        image_url: sourceImageUrl,
        prompt: prompt,
        resolution: resolution,
        aspect_ratio: aspectRatio,
        duration: duration,
        delete_video: deleteVideo,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', update)
        if (update.logs) {
          update.logs.forEach((log) => console.log(log.message))
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

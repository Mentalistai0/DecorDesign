import express from 'express'
import { upload } from '../config/multer.js'
import { generateVideo } from '../services/falService.js'
import { supabase } from '../config/supabase.js'
import fs from 'fs'

const router = express.Router()

router.post('/generate-video', upload.single('image'), async (req, res) => {
  try {
    const { prompt, imageUrl, resolution = 'auto', aspect_ratio = 'auto', duration = 4, delete_video = true } = req.body
    const imageFile = req.file

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!imageFile && !imageUrl) {
      return res.status(400).json({ error: 'Image file or URL is required' })
    }

    // Prepare image input for Fal.ai
    let imageInput
    if (imageFile) {
      imageInput = `${req.protocol}://${req.get('host')}/uploads/${imageFile.filename}`
    } else {
      imageInput = imageUrl
    }

    console.log('Generating video with prompt:', prompt)
    console.log('Image input:', imageInput)

    // Call Fal.ai service
    const allowedDurations = [4, 8, 12]
    const parsedDuration = Number(duration)
    const finalDuration = allowedDurations.includes(parsedDuration) ? parsedDuration : 4

    const result = await generateVideo({
      imageUrl: imageInput,
      prompt: prompt,
      resolution,
      aspectRatio: aspect_ratio,
      duration: finalDuration,
      deleteVideo: delete_video === 'false' ? false : delete_video === 'true' ? true : !!delete_video,
    })

    // Save to Supabase videos table
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('videos')
          .insert([
            {
              url: result.videoUrl,
              prompt: prompt,
              source_url: imageInput,
            },
          ])
          .select()

        if (error) {
          console.error('Supabase insert error:', error)
        } else {
          console.log('Saved to videos:', data)
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
      }
    }

    // Clean up uploaded file if exists
    if (imageFile) {
      try {
        fs.unlinkSync(imageFile.path)
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError)
      }
    }

    res.json({
      success: true,
      videoUrl: result.videoUrl,
      prompt: prompt,
    })
  } catch (error) {
    console.error('Video generation error:', error)
    res.status(500).json({
      error: error.message || 'Failed to generate video',
    })
  }
})

export default router

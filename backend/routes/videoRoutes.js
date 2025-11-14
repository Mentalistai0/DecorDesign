import express from 'express'
import { upload } from '../config/multer.js'
import { generateVideo } from '../services/falService.js'
import { supabase } from '../config/supabase.js'
import { generationLimiter, validateVideoGeneration } from '../middleware/security.js'
import { optionalAuth } from '../middleware/auth.js'
import fs from 'fs'

const router = express.Router()

router.post(
  '/generate-video',
  generationLimiter,
  optionalAuth,
  upload.single('image'),
  validateVideoGeneration,
  async (req, res) => {
    try {
      const { prompt, imageUrl } = req.body
      const imageFile = req.file
      const userId = req.user?.id || null

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
    const result = await generateVideo({
      imageUrl: imageInput,
      prompt: prompt,
    })

    // Save to Supabase videos table with user association
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('videos')
          .insert([
            {
              url: result.videoUrl,
              prompt: prompt,
              source_url: imageInput,
              user_id: userId, // Associate with authenticated user (null if anonymous)
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
  }
)

export default router

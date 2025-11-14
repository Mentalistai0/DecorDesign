import express from 'express'
import { upload } from '../config/multer.js'
import { generateImage } from '../services/falService.js'
import { supabase } from '../config/supabase.js'
import { generationLimiter, validateImageGeneration } from '../middleware/security.js'
import { optionalAuth } from '../middleware/auth.js'
import fs from 'fs'

const router = express.Router()

router.post(
  '/generate-image',
  generationLimiter,
  optionalAuth,
  upload.single('image'),
  validateImageGeneration,
  async (req, res) => {
    try {
      const { prompt, imageUrl } = req.body
      const imageFile = req.file
      const userId = req.user?.id || null

    // Prepare image input for Fal.ai
    let imageInput
    if (imageFile) {
      // Convert file to base64 or URL
      imageInput = `${req.protocol}://${req.get('host')}/uploads/${imageFile.filename}`
    } else {
      imageInput = imageUrl
    }

    console.log('Generating image with prompt:', prompt)
    console.log('Image input:', imageInput)

    // Call Fal.ai service
    const result = await generateImage({
      imageUrl: imageInput,
      prompt: prompt,
    })

    // Save to Supabase gallery with user association
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .insert([
            {
              url: result.imageUrl,
              prompt: prompt,
              source_url: imageInput,
              user_id: userId, // Associate with authenticated user (null if anonymous)
            },
          ])
          .select()

        if (error) {
          console.error('Supabase insert error:', error)
        } else {
          console.log('Saved to gallery:', data)
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
        imageUrl: result.imageUrl,
        prompt: prompt,
      })
    } catch (error) {
      console.error('Image generation error:', error)
      res.status(500).json({
        error: error.message || 'Failed to generate image',
      })
    }
  }
)

export default router

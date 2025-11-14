import express from 'express'
import { upload } from '../config/multer.js'
import { generateImage } from '../services/falService.js'
import { supabase } from '../config/supabase.js'
import { generationLimiter, validateImageGeneration } from '../middleware/security.js'
import { requireAuth } from '../middleware/auth.js'
import { checkImageCredits, deductCredits } from '../middleware/creditMiddleware.js'
import fs from 'fs'

const router = express.Router()

router.post(
  '/generate-image',
  generationLimiter,
  requireAuth,
  upload.single('image'),
  validateImageGeneration,
  checkImageCredits,
  async (req, res) => {
    let galleryId = null;

    try {
      const { prompt, imageUrl } = req.body
      const imageFile = req.file
      const userId = req.user.id

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
              user_id: userId,
            },
          ])
          .select()

        if (error) {
          console.error('Supabase insert error:', error)
          throw new Error('Failed to save image to gallery');
        } else {
          console.log('Saved to gallery:', data)
          galleryId = data[0]?.id;
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
        throw dbError;
      }
    }

    // Deduct credits after successful generation
    try {
      const deducted = await deductCredits(
        userId,
        'image',
        req.creditsRequired.amount,
        galleryId,
        `Image generation: ${prompt.substring(0, 100)}`
      );

      if (!deducted) {
        console.error('Failed to deduct credits');
        // Note: Image was already generated, but we log the credit deduction failure
      }
    } catch (creditError) {
      console.error('Error deducting credits:', creditError);
      // Continue anyway since image was successfully generated
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
        creditsUsed: req.creditsRequired.amount,
      })
    } catch (error) {
      console.error('Image generation error:', error)

      // Clean up uploaded file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path)
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError)
        }
      }

      res.status(500).json({
        error: error.message || 'Failed to generate image',
      })
    }
  }
)

export default router

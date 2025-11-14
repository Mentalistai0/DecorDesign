import express from 'express'
import { upload } from '../config/multer.js'
import { generateImage } from '../services/falService.js'
import { supabase } from '../config/supabase.js'
import { generationLimiter, validateImageGeneration } from '../middleware/security.js'
import { authenticate } from '../middleware/auth.js'
import { checkImageCredits, deductCredits, refundCredits } from '../middleware/creditMiddleware.js'
import fs from 'fs'

const router = express.Router()

router.post(
  '/generate-image',
  generationLimiter,
  authenticate,
  upload.single('image'),
  validateImageGeneration,
  checkImageCredits,
  async (req, res) => {
    let galleryId = null;
    let creditsDeducted = false;

    try {
      const { prompt, imageUrl } = req.body
      const imageFile = req.file
      const userId = req.user.id

      // CRITICAL FIX: Deduct credits BEFORE generation to prevent race condition
      console.log(`Deducting ${req.creditsRequired.amount} image credits from user ${userId}`);
      creditsDeducted = await deductCredits(
        userId,
        'image',
        req.creditsRequired.amount,
        null, // No reference ID yet, will be updated after generation
        `Image generation (pending): ${prompt.substring(0, 100)}`
      );

      if (!creditsDeducted) {
        return res.status(500).json({
          error: 'Failed to reserve credits',
          message: 'Unable to process your request. Please try again.',
        });
      }

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

      // CRITICAL FIX: Refund credits if generation failed
      if (creditsDeducted) {
        console.log(`Refunding ${req.creditsRequired.amount} image credits to user ${req.user.id}`);
        await refundCredits(
          req.user.id,
          'image',
          req.creditsRequired.amount,
          `Generation failed: ${error.message}`
        );
      }

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

import express from 'express'
import { upload } from '../config/multer.js'
import { generateVideo } from '../services/falService.js'
import { supabase } from '../config/supabase.js'
import { generationLimiter, validateVideoGeneration } from '../middleware/security.js'
import { requireAuth } from '../middleware/auth.js'
import { checkVideoCredits, deductCredits } from '../middleware/creditMiddleware.js'
import fs from 'fs'

const router = express.Router()

router.post(
  '/generate-video',
  generationLimiter,
  requireAuth,
  upload.single('image'),
  validateVideoGeneration,
  checkVideoCredits,
  async (req, res) => {
    let videoId = null;

    try {
      const { prompt, imageUrl, resolution = 'auto', aspect_ratio = 'auto', duration = 4, delete_video = true } = req.body
      const imageFile = req.file
      const userId = req.user.id

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
                user_id: userId,
              },
            ])
            .select()

          if (error) {
            console.error('Supabase insert error:', error)
            throw new Error('Failed to save video to database');
          } else {
            console.log('Saved to videos:', data)
            videoId = data[0]?.id;
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
          'video',
          req.creditsRequired.amount,
          videoId,
          `Video generation (${finalDuration}s): ${prompt.substring(0, 100)}`
        );

        if (!deducted) {
          console.error('Failed to deduct credits');
          // Note: Video was already generated, but we log the credit deduction failure
        }
      } catch (creditError) {
        console.error('Error deducting credits:', creditError);
        // Continue anyway since video was successfully generated
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
        duration: finalDuration,
        creditsUsed: req.creditsRequired.amount,
      })
    } catch (error) {
      console.error('Video generation error:', error)

      // Clean up uploaded file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path)
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError)
        }
      }

      res.status(500).json({
        error: error.message || 'Failed to generate video',
      })
    }
  }
)

export default router

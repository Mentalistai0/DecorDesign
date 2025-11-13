import express from 'express'
import { upload } from '../config/multer.js'
import { generateImage } from '../services/falService.js'
import { supabase } from '../config/supabase.js'
import fs from 'fs'

const router = express.Router()

router.post('/generate-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt, imageUrl } = req.body
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

    // Save to Supabase gallery
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .insert([
            {
              url: result.imageUrl,
              prompt: prompt,
              source_url: imageInput,
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
})

export default router

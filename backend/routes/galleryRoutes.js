import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Get all images from gallery
router.get('/gallery', async (req, res) => {
  try {
    if (!supabase) {
      return res.json([]) // Return empty array if Supabase not configured
    }

    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json(data || [])
  } catch (error) {
    console.error('Gallery fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch gallery images' })
  }
})

// Get all videos
router.get('/videos', async (req, res) => {
  try {
    if (!supabase) {
      return res.json([]) // Return empty array if Supabase not configured
    }

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json(data || [])
  } catch (error) {
    console.error('Videos fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch videos' })
  }
})

// Delete image from gallery
router.delete('/gallery/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(400).json({ error: 'Database not configured' })
    }

    const { id } = req.params

    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    res.json({ success: true, message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

// Delete video
router.delete('/videos/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(400).json({ error: 'Database not configured' })
    }

    const { id } = req.params

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    res.json({ success: true, message: 'Video deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Failed to delete video' })
  }
})

export default router

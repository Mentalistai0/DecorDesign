import express from 'express'
import { supabase } from '../config/supabase.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Get all images from gallery with pagination and filtering
router.get('/gallery', optionalAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ items: [], total: 0, page: 1, limit: 20 })
    }

    const userId = req.user?.id
    const {
      page = 1,
      limit = 20,
      search = '',
      favorites = false,
    } = req.query

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const offset = (pageNum - 1) * limitNum

    // Build query
    let query = supabase.from('gallery').select('*', { count: 'exact' })

    // Filter by user if authenticated
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Search by prompt
    if (search) {
      query = query.ilike('prompt', `%${search}%`)
    }

    // Filter favorites
    if (favorites === 'true') {
      query = query.eq('is_favorite', true)
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    if (error) {
      throw error
    }

    res.json({
      items: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    })
  } catch (error) {
    console.error('Gallery fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch gallery images' })
  }
})

// Get all videos with pagination and filtering
router.get('/videos', optionalAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ items: [], total: 0, page: 1, limit: 20 })
    }

    const userId = req.user?.id
    const {
      page = 1,
      limit = 20,
      search = '',
      favorites = false,
    } = req.query

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const offset = (pageNum - 1) * limitNum

    // Build query
    let query = supabase.from('videos').select('*', { count: 'exact' })

    // Filter by user if authenticated
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Search by prompt
    if (search) {
      query = query.ilike('prompt', `%${search}%`)
    }

    // Filter favorites
    if (favorites === 'true') {
      query = query.eq('is_favorite', true)
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    if (error) {
      throw error
    }

    res.json({
      items: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    })
  } catch (error) {
    console.error('Videos fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch videos' })
  }
})

// Delete image from gallery (with ownership check)
router.delete('/gallery/:id', optionalAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(400).json({ error: 'Database not configured' })
    }

    const { id } = req.params
    const userId = req.user?.id

    // Build delete query
    let deleteQuery = supabase.from('gallery').delete().eq('id', id)

    // If user is authenticated, ensure they own the resource
    if (userId) {
      deleteQuery = deleteQuery.eq('user_id', userId)
    }

    const { error, count } = await deleteQuery

    if (error) {
      throw error
    }

    // Check if anything was deleted
    if (count === 0) {
      return res.status(404).json({
        error: 'Image not found or you do not have permission to delete it',
      })
    }

    res.json({ success: true, message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

// Delete video (with ownership check)
router.delete('/videos/:id', optionalAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(400).json({ error: 'Database not configured' })
    }

    const { id } = req.params
    const userId = req.user?.id

    // Build delete query
    let deleteQuery = supabase.from('videos').delete().eq('id', id)

    // If user is authenticated, ensure they own the resource
    if (userId) {
      deleteQuery = deleteQuery.eq('user_id', userId)
    }

    const { error, count } = await deleteQuery

    if (error) {
      throw error
    }

    // Check if anything was deleted
    if (count === 0) {
      return res.status(404).json({
        error: 'Video not found or you do not have permission to delete it',
      })
    }

    res.json({ success: true, message: 'Video deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Failed to delete video' })
  }
})

// Toggle favorite status for image
router.patch('/gallery/:id/favorite', optionalAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(400).json({ error: 'Database not configured' })
    }

    const { id } = req.params
    const userId = req.user?.id
    const { isFavorite } = req.body

    // Build update query
    let updateQuery = supabase
      .from('gallery')
      .update({ is_favorite: isFavorite })
      .eq('id', id)

    // If user is authenticated, ensure they own the resource
    if (userId) {
      updateQuery = updateQuery.eq('user_id', userId)
    }

    const { data, error } = await updateQuery.select()

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Image not found or you do not have permission to update it',
      })
    }

    res.json({ success: true, data: data[0] })
  } catch (error) {
    console.error('Favorite toggle error:', error)
    res.status(500).json({ error: 'Failed to update favorite status' })
  }
})

// Toggle favorite status for video
router.patch('/videos/:id/favorite', optionalAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(400).json({ error: 'Database not configured' })
    }

    const { id } = req.params
    const userId = req.user?.id
    const { isFavorite } = req.body

    // Build update query
    let updateQuery = supabase
      .from('videos')
      .update({ is_favorite: isFavorite })
      .eq('id', id)

    // If user is authenticated, ensure they own the resource
    if (userId) {
      updateQuery = updateQuery.eq('user_id', userId)
    }

    const { data, error } = await updateQuery.select()

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Video not found or you do not have permission to update it',
      })
    }

    res.json({ success: true, data: data[0] })
  } catch (error) {
    console.error('Favorite toggle error:', error)
    res.status(500).json({ error: 'Failed to update favorite status' })
  }
})

export default router

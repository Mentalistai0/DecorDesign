import supabase from '../config/supabase.js';

/**
 * Get user's credit information
 * @param {string} userId - User's UUID
 * @returns {Promise<Object>} User's credit information
 */
export async function getUserCredits(userId) {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Failed to get user credits: ${error.message}`);
  }

  // If no credits record exists, return default empty state
  if (!data) {
    return {
      user_id: userId,
      credits_image_total: 0,
      credits_image_used: 0,
      credits_video_total: 0,
      credits_video_used: 0,
      credits_image_available: 0,
      credits_video_available: 0,
    };
  }

  // Calculate available credits
  return {
    ...data,
    credits_image_available: data.credits_image_total - data.credits_image_used,
    credits_video_available: data.credits_video_total - data.credits_video_used,
  };
}

/**
 * Check if user has enough credits
 * @param {string} userId - User's UUID
 * @param {string} creditType - 'image' or 'video'
 * @param {number} amount - Number of credits needed
 * @returns {Promise<boolean>} True if user has enough credits
 */
export async function hasEnoughCredits(userId, creditType, amount) {
  const credits = await getUserCredits(userId);

  if (creditType === 'image') {
    return credits.credits_image_available >= amount;
  } else if (creditType === 'video') {
    return credits.credits_video_available >= amount;
  }

  return false;
}

/**
 * Deduct credits from user account (atomic operation)
 * @param {string} userId - User's UUID
 * @param {string} creditType - 'image' or 'video'
 * @param {number} amount - Number of credits to deduct
 * @param {string} referenceId - UUID of the generated content
 * @param {string} description - Description of the transaction
 * @returns {Promise<boolean>} True if successful
 */
export async function deductCredits(userId, creditType, amount, referenceId, description) {
  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_credit_type: creditType,
    p_amount: amount,
    p_transaction_type: `${creditType}_generation`,
    p_reference_id: referenceId,
    p_description: description,
  });

  if (error) {
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }

  return data;
}

/**
 * Add credits to user account
 * @param {string} userId - User's UUID
 * @param {number} imageCredits - Number of image credits to add
 * @param {number} videoCredits - Number of video credits to add
 * @param {string} transactionType - Type of transaction (e.g., 'purchase', 'refund')
 * @param {string} description - Description of the transaction
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<boolean>} True if successful
 */
export async function addCredits(userId, imageCredits, videoCredits, transactionType, description, metadata = null) {
  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_image_credits: imageCredits,
    p_video_credits: videoCredits,
    p_transaction_type: transactionType,
    p_description: description,
    p_metadata: metadata,
  });

  if (error) {
    throw new Error(`Failed to add credits: ${error.message}`);
  }

  return data;
}

/**
 * Initialize credits for a new user
 * @param {string} userId - User's UUID
 * @returns {Promise<void>}
 */
export async function initializeUserCredits(userId) {
  const { error } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      credits_image_total: 0,
      credits_image_used: 0,
      credits_video_total: 0,
      credits_video_used: 0,
    });

  if (error && error.code !== '23505') { // 23505 = unique constraint violation
    throw new Error(`Failed to initialize user credits: ${error.message}`);
  }
}

/**
 * Get user's credit transaction history
 * @param {string} userId - User's UUID
 * @param {number} limit - Number of transactions to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of transactions
 */
export async function getCreditTransactions(userId, limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get credit transactions: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all available plans
 * @returns {Promise<Array>} Array of active plans
 */
export async function getPlans() {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true });

  if (error) {
    throw new Error(`Failed to get plans: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific plan by ID
 * @param {string} planId - Plan's UUID
 * @returns {Promise<Object>} Plan details
 */
export async function getPlanById(planId) {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .eq('is_active', true)
    .single();

  if (error) {
    throw new Error(`Failed to get plan: ${error.message}`);
  }

  return data;
}

/**
 * Create or update Stripe customer ID for user
 * @param {string} userId - User's UUID
 * @param {string} stripeCustomerId - Stripe customer ID
 * @returns {Promise<void>}
 */
export async function updateStripeCustomerId(userId, stripeCustomerId) {
  const { error } = await supabase
    .from('user_credits')
    .upsert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    throw new Error(`Failed to update Stripe customer ID: ${error.message}`);
  }
}

/**
 * Record a Stripe payment
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} Created payment record
 */
export async function recordPayment(paymentData) {
  const { data, error } = await supabase
    .from('stripe_payments')
    .insert(paymentData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record payment: ${error.message}`);
  }

  return data;
}

/**
 * Update payment status
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {string} status - New status
 * @param {string} errorMessage - Error message if failed
 * @returns {Promise<void>}
 */
export async function updatePaymentStatus(paymentIntentId, status, errorMessage = null) {
  const updateData = { status };
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('stripe_payments')
    .update(updateData)
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (error) {
    throw new Error(`Failed to update payment status: ${error.message}`);
  }
}

/**
 * Mark payment as credits allocated
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<void>}
 */
export async function markCreditsAllocated(paymentIntentId) {
  const { error } = await supabase
    .from('stripe_payments')
    .update({ credits_allocated: true })
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (error) {
    throw new Error(`Failed to mark credits as allocated: ${error.message}`);
  }
}

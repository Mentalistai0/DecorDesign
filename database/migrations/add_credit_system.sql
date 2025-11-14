-- Migration: Add Credit System and Stripe Integration
-- Run this migration to add credit tracking and payment functionality

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  credits_total INTEGER NOT NULL,
  credits_image INTEGER NOT NULL,
  credits_video INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_credits CHECK (credits_total > 0 AND credits_image >= 0 AND credits_video >= 0),
  CONSTRAINT positive_price CHECK (price_cents > 0)
);

-- Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_image_total INTEGER DEFAULT 0,
  credits_image_used INTEGER DEFAULT 0,
  credits_video_total INTEGER DEFAULT 0,
  credits_video_used INTEGER DEFAULT 0,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT one_credit_per_user UNIQUE(user_id),
  CONSTRAINT non_negative_image_total CHECK (credits_image_total >= 0),
  CONSTRAINT non_negative_image_used CHECK (credits_image_used >= 0),
  CONSTRAINT non_negative_video_total CHECK (credits_video_total >= 0),
  CONSTRAINT non_negative_video_used CHECK (credits_video_used >= 0),
  CONSTRAINT valid_image_usage CHECK (credits_image_used <= credits_image_total),
  CONSTRAINT valid_video_usage CHECK (credits_video_used <= credits_video_total)
);

-- Create credit_transactions table for audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'image_generation', 'video_generation', 'refund', 'adjustment', 'initial')),
  credit_type VARCHAR(10) NOT NULL CHECK (credit_type IN ('image', 'video')),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stripe_payments table for payment records
CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_checkout_session_id VARCHAR(255) UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  credits_allocated BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (amount_cents > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_user_id ON stripe_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON stripe_payments(status);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_created_at ON stripe_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active) WHERE is_active = TRUE;

-- Enable Row Level Security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans (public read access)
CREATE POLICY "Anyone can view active plans"
  ON plans FOR SELECT
  USING (is_active = TRUE);

-- RLS Policies for user_credits (users can only see their own credits)
CREATE POLICY "Users can view their own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON user_credits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert user credits"
  ON user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for credit_transactions (users can only see their own transactions)
CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for stripe_payments (users can only see their own payments)
CREATE POLICY "Users can view their own payments"
  ON stripe_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert payments"
  ON stripe_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for plans updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for user_credits updated_at
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for stripe_payments updated_at
CREATE TRIGGER update_stripe_payments_updated_at
  BEFORE UPDATE ON stripe_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get available credits for a user
CREATE OR REPLACE FUNCTION get_available_credits(p_user_id UUID, p_credit_type VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
  v_used INTEGER;
BEGIN
  IF p_credit_type = 'image' THEN
    SELECT credits_image_total, credits_image_used
    INTO v_total, v_used
    FROM user_credits
    WHERE user_id = p_user_id;
  ELSIF p_credit_type = 'video' THEN
    SELECT credits_video_total, credits_video_used
    INTO v_total, v_used
    FROM user_credits
    WHERE user_id = p_user_id;
  ELSE
    RETURN 0;
  END IF;

  IF v_total IS NULL THEN
    RETURN 0;
  END IF;

  RETURN GREATEST(v_total - v_used, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits (atomic operation)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_credit_type VARCHAR,
  p_amount INTEGER,
  p_transaction_type VARCHAR,
  p_reference_id UUID,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
  v_total INTEGER;
  v_used INTEGER;
  v_new_used INTEGER;
BEGIN
  -- Lock the user_credits row for update
  IF p_credit_type = 'image' THEN
    SELECT credits_image_total, credits_image_used
    INTO v_total, v_used
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
  ELSIF p_credit_type = 'video' THEN
    SELECT credits_video_total, credits_video_used
    INTO v_total, v_used
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
  ELSE
    RETURN FALSE;
  END IF;

  -- Check if user has credits record
  IF v_total IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate available credits
  v_available := v_total - v_used;

  -- Check if enough credits
  IF v_available < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits
  v_new_used := v_used + p_amount;

  IF p_credit_type = 'image' THEN
    UPDATE user_credits
    SET credits_image_used = v_new_used
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_credits
    SET credits_video_used = v_new_used
    WHERE user_id = p_user_id;
  END IF;

  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credit_type,
    amount,
    balance_before,
    balance_after,
    reference_id,
    description
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_credit_type,
    -p_amount,
    v_available,
    v_available - p_amount,
    p_reference_id,
    p_description
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for purchases)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_image_credits INTEGER,
  p_video_credits INTEGER,
  p_transaction_type VARCHAR,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_image_total INTEGER;
  v_video_total INTEGER;
  v_image_available INTEGER;
  v_video_available INTEGER;
BEGIN
  -- Get current totals and calculate available
  SELECT
    credits_image_total,
    credits_video_total,
    credits_image_total - credits_image_used,
    credits_video_total - credits_video_used
  INTO v_image_total, v_video_total, v_image_available, v_video_available
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no credits record exists, create one
  IF v_image_total IS NULL THEN
    INSERT INTO user_credits (user_id, credits_image_total, credits_video_total)
    VALUES (p_user_id, p_image_credits, p_video_credits);

    v_image_available := 0;
    v_video_available := 0;
  ELSE
    -- Update existing credits
    UPDATE user_credits
    SET
      credits_image_total = credits_image_total + p_image_credits,
      credits_video_total = credits_video_total + p_video_credits
    WHERE user_id = p_user_id;
  END IF;

  -- Log image credit transaction if any
  IF p_image_credits > 0 THEN
    INSERT INTO credit_transactions (
      user_id,
      transaction_type,
      credit_type,
      amount,
      balance_before,
      balance_after,
      description,
      metadata
    ) VALUES (
      p_user_id,
      p_transaction_type,
      'image',
      p_image_credits,
      v_image_available,
      v_image_available + p_image_credits,
      p_description,
      p_metadata
    );
  END IF;

  -- Log video credit transaction if any
  IF p_video_credits > 0 THEN
    INSERT INTO credit_transactions (
      user_id,
      transaction_type,
      credit_type,
      amount,
      balance_before,
      balance_after,
      description,
      metadata
    ) VALUES (
      p_user_id,
      p_transaction_type,
      'video',
      p_video_credits,
      v_video_available,
      v_video_available + p_video_credits,
      p_description,
      p_metadata
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert the 3 pricing plans
INSERT INTO plans (name, credits_total, credits_image, credits_video, price_cents) VALUES
  ('Starter Plan', 200, 100, 100, 9900),
  ('Professional Plan', 500, 250, 250, 19900),
  ('Enterprise Plan', 1200, 600, 600, 29900);

-- Add comments for documentation
COMMENT ON TABLE plans IS 'Available credit plans for purchase';
COMMENT ON TABLE user_credits IS 'Tracks credit balance for each user, separated by type (image/video)';
COMMENT ON TABLE credit_transactions IS 'Audit log of all credit operations';
COMMENT ON TABLE stripe_payments IS 'Records of Stripe payment transactions';
COMMENT ON FUNCTION get_available_credits IS 'Returns available credits for a user by type';
COMMENT ON FUNCTION deduct_credits IS 'Atomically deducts credits and logs transaction';
COMMENT ON FUNCTION add_credits IS 'Adds credits to user account and logs transaction';

-- Add 'bictorys' to allowed payment methods
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('moneroo', 'stripe', 'cash', 'bictorys'));

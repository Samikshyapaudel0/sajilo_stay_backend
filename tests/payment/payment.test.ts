import { PaymentService } from '../../src/services/payment.service';
import { createHmac } from 'crypto';

describe('Payment Service - Signature Generation', () => {
  let paymentService: PaymentService;

  beforeAll(() => {
    // Set test environment variables
    process.env.ESEWA_MERCHANT_CODE = 'EPAYTEST';
    process.env.ESEWA_SECRET_KEY = '8gBm/:&EnhH.1/q';
    process.env.ESEWA_ENVIRONMENT = 'TEST';
    paymentService = new PaymentService();
  });

  describe('Signature generation according to ePay v2 specification', () => {
    test('should generate correct signature using 2 decimal place values', () => {
      const totalAmount = '100.00';
      const transactionUuid = 'test-uuid-123';
      const productCode = 'EPAYTEST';

      // Generate signature using the service
      const signature = paymentService['generateSignature'](totalAmount, transactionUuid, productCode);

      // Manually calculate expected signature using the same method
      const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
      const expectedSignature = createHmac('sha256', '8gBm/:&EnhH.1/q')
        .update(signatureString)
        .digest('base64');

      expect(signature).toBe(expectedSignature);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    test('signature should match form field values exactly', () => {
      const amount = 100;
      const totalAmount = amount.toFixed(2); // '100.00' (2 decimal places)
      const transactionUuid = 'test-uuid-456';
      const productCode = 'EPAYTEST';

      const signature = paymentService['generateSignature'](totalAmount, transactionUuid, productCode);

      // The signature string must use the exact string values from form
      const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
      const expectedSignature = createHmac('sha256', '8gBm/:&EnhH.1/q')
        .update(signatureString)
        .digest('base64');

      expect(signature).toBe(expectedSignature);
    });

    test('signature should be different for different amounts', () => {
      const signature1 = paymentService['generateSignature']('100.00', 'test-uuid', 'EPAYTEST');
      const signature2 = paymentService['generateSignature']('200.00', 'test-uuid', 'EPAYTEST');

      expect(signature1).not.toBe(signature2);
    });

    test('signature should be different for different transaction UUIDs', () => {
      const signature1 = paymentService['generateSignature']('100.00', 'uuid-1', 'EPAYTEST');
      const signature2 = paymentService['generateSignature']('100.00', 'uuid-2', 'EPAYTEST');

      expect(signature1).not.toBe(signature2);
    });
  });
});

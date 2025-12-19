#!/bin/bash

# Create a test image file (1x1 PNG pixel in base64)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test_payment.png

# Submit payment with form data
curl -X POST http://localhost:3000/api/subscription/submit-payment \
  -F "plan=PRO_MONTHLY" \
  -F "amount=999" \
  -F "transactionId=qa_test_$(date +%s)" \
  -F "screenshot=@test_payment.png" \
  -b qa_cookies.txt

# Cleanup
rm -f test_payment.png
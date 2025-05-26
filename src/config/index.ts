import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  backend_base_url: process.env.BACKEND_BASE_URL,
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    expires_in: process.env.EXPIRES_IN,
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN,
    reset_pass_secret: process.env.RESET_PASS_TOKEN,
    reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN,
  },
  reset_pass_link: process.env.RESET_PASS_LINK,
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.APP_PASS,
  },
  twilio:{
    test_sid:process.env.TWILIO_ACCOUNT_SID,
    test_token:process.env.TWILIO_AUTH_TOKEN,
    sid:process.env.TWILIO_SID,
    token:process.env.TWILIO_TOKEN,
    number:process.env.TWILIO_PHONE_NUMBER
  },
  ssl: {
    storeId: process.env.STORE_ID,
    storePass: process.env.STORE_PASS,
    successUrl: process.env.SUCCESS_URL,
    cancelUrl: process.env.CANCEL_URL,
    failUrl: process.env.FAIL_URL,
    sslPaymentApi: process.env.SSL_PAYMENT_API,
    sslValidationApi: process.env.SSL_VALIDATIOIN_API,
  },
  stripe: {
    stripe_secret_key: process.env.STRIPE_SK,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    price_id: process.env.STRIPE_PRICE_ID,
  },
  agora: {
    app_id: process.env.AGORA_APP_ID,
    app_certificate: process.env.AGORA_APP_CERTIFICATE,
  },
};

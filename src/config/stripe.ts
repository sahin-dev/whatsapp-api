import Stripe from "stripe";
import config from "../config";

const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
  apiVersion: "2024-11-20.acacia",
});

export default stripe;

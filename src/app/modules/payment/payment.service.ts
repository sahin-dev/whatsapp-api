import stripe from "../../../config/stripe";

const stripePortalSessionInStripe = async (customerId: string) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: "https://360trader.com",
  });

  return session.url;
};

export const paymentSevices = {
  stripePortalSessionInStripe,
};

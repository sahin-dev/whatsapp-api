import stripe from "../../../config/stripe";
import dotenv from "dotenv";
import path from "path";
import Stripe from "stripe";
import config from "../../../config";
import { Request } from "express";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const stripePortalSessionInStripe = async (customerId: string) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: "https://360trader.com",
  });

  return session.url;
};

const loginwithAuth = async (userEmail: string) => {
  const auth0Domain = process.env.AUTH0_DOMAIN;
  const auth0ClientId = process.env.AUTH0_CLIENT_ID;
  const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET;

  const tokenResponse = await fetch(`https://${auth0Domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: auth0ClientId,
      client_secret: auth0ClientSecret,
      audience: `https://${auth0Domain}/api/v2/`,
      grant_type: "client_credentials",
      scope: "read:users read:users_by_email create:roles",
    }),
  });
  const tokenData = await tokenResponse.json();
  const managementToken = tokenData.access_token;
  console.log(tokenResponse);

  // Get User by Email
  const userResponse = await fetch(
    `https://${auth0Domain}/api/v2/users-by-email?email=${userEmail}`,
    {
      headers: {
        Authorization: `Bearer ${managementToken}`,
      },
    }
  );
  const users = await userResponse.json();
  const userId = users[0]?.user_id;

  if (userId) {
    // Get User Metadata (priceId)
    const priceId = users[0]?.app_metadata?.priceId;

    let roleId;
    let groupName;

    if (priceId === "stockmarketslayer") {
      roleId = process.env.STOCK_MARKET_ROLE_ID;
      groupName = "360 Elite Stock Market Slayer";
    } else if (priceId === "elitecryptoalerts") {
      roleId = process.env.CRYPTO_ALERTS_ROLE_ID;
      groupName = "360 Elite Crypto Trading Alerts";
    }

    if (roleId) {
      // Assign Role to User
      await fetch(`https://${auth0Domain}/api/v2/users/${userId}/roles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${managementToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roles: [roleId],
        }),
      });

      console.log(`✅ Role assigned to user ${userId} based on Price ID`);

      // Assign User to Group
      await fetch(`https://${auth0Domain}/api/v2/users/${userId}/groups`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${managementToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groups: [groupName],
        }),
      });

      console.log(`✅ Group ${groupName} assigned to user ${userId}`);
    }
  }
};

const handleSubscriptionDeleted = async (event: Stripe.Event) => {
  const subscription = event.data.object as Stripe.Subscription;

  // const result = await prisma.company.update({
  //   where: { subscriptionId: subscription.id },
  //   data: { planType: "FREE", subscriptionId: null },
  // });

  return;
};

const handelPaymentWebhook = async (req: Request) => {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig) {
    console.error("Missing Stripe signature header");
  }

  let event: Stripe.Event;

  try {
    // Verify and construct the Stripe event
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhook_secret as string
    );
    let result;
    switch (event.type) {
      case "customer.subscription.deleted":
        result = await handleSubscriptionDeleted(event);
        break;

      default:
        break;
    }

    return result;
  } catch (err: any) {
    return;
  }
};

export const paymentSevices = {
  stripePortalSessionInStripe,
  loginwithAuth,
  handelPaymentWebhook,
};

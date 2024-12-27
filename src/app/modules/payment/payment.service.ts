import stripe from "../../../config/stripe";
import dotenv from "dotenv";
import path from "path";
import Stripe from "stripe";
import config from "../../../config";
import { Request } from "express";
import axios from "axios";
import ApiError from "../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const stripePortalSessionInStripe = async (customerId: string) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: "https://360trader.com",
  });

  return session.url;
};

const createSubcriptionInStripe = async (payload: {
  email: string;
  paymentMethodId: string;
  priceId: string;
}) => {
  const { email, paymentMethodId, priceId } = payload;

  const userInfo = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }

  if (userInfo.priceId === priceId) {
    throw new ApiError(409, "You already have subscription this plan");
  }

  let customerId = userInfo.customerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email,
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userInfo.id },
      data: { customerId: customer.id },
    });
  }

  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    expand: ["latest_invoice.payment_intent"],
  });

  const updateData = {
    subscriptionId: subscription.id,
    priceId: priceId,
    subcription: true,
  };
  await prisma.user.update({
    where: { id: userInfo.id },
    data: updateData,
  });
  return subscription;
};

const cancelSubscriptionInStripe = async (subscriptionId: string) => {
  const cancelSubcription = await stripe.subscriptions.cancel(subscriptionId);

  return cancelSubcription;
};

const loginwithAuth = async (userEmail: string) => {
  const auth0Domain = process.env.AUTH0_DOMAIN;
  const auth0ClientId = process.env.AUTH0_CLIENT_ID;
  const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET;
  const stockMarketRoleId = process.env.STOCK_MARKET_ROLE_ID;
  const cryptoAlertsRoleId = process.env.CRYPTO_ALERTS_ROLE_ID;

  try {
    // Get Management Token
    const tokenResponse = await axios.post(
      `https://${auth0Domain}/oauth/token`,
      {
        client_id: auth0ClientId,
        client_secret: auth0ClientSecret,
        audience: `https://${auth0Domain}/api/v2/`,
        grant_type: "client_credentials",
        scope:
          "read:users read:users_by_email update:users create:passwords_tickets",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const managementToken = tokenResponse.data.access_token;
    console.log(managementToken);

    // Get User by Email
    const userResponse = await axios.get(
      `https://${auth0Domain}/api/v2/users-by-email?email=${userEmail}`,
      {
        headers: {
          Authorization: `Bearer ${managementToken}`,
        },
      }
    );
    const users = userResponse.data;
    const userId = users[0]?.user_id;

    if (userId) {
      // Get User Metadata (priceId)
      const priceId = users[0]?.app_metadata?.priceId;

      let roleId: string | undefined;
      let groupName: string | undefined;

      if (priceId === "stockmarketslayer") {
        roleId = stockMarketRoleId;
        groupName = "360 Elite Stock Market Slayer";
      } else if (priceId === "elitecryptoalerts") {
        roleId = cryptoAlertsRoleId;
        groupName = "360 Elite Crypto Trading Alerts";
      }

      if (roleId && groupName) {
        // Assign Role to User
        await axios.post(
          `https://${auth0Domain}/api/v2/users/${userId}/roles`,
          {
            roles: [roleId],
          },
          {
            headers: {
              Authorization: `Bearer ${managementToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(`✅ Role assigned to user ${userId} based on Price ID`);

        // Assign User to Group
        await axios.post(
          `https://${auth0Domain}/api/v2/users/${userId}/groups`,
          {
            groups: [groupName],
          },
          {
            headers: {
              Authorization: `Bearer ${managementToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(`✅ Group ${groupName} assigned to user ${userId}`);
      }
    } else {
      console.error("❌ User not found by email.");
    }
  } catch (error: any) {
    console.error(
      "❌ Error in loginwithAuth:",
      error.response?.data || error.message
    );
  }
};

const handleSubscriptionDeleted = async (event: Stripe.Event) => {
  event.data.object as Stripe.Subscription;

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
  createSubcriptionInStripe,
  cancelSubscriptionInStripe,
  loginwithAuth,
  handelPaymentWebhook,
};

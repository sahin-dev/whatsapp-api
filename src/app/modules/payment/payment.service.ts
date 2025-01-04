import stripe from "../../../config/stripe";
import dotenv from "dotenv";
import path from "path";
import Stripe from "stripe";
import config from "../../../config";
import { Request } from "express";
import axios from "axios";
import ApiError from "../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { User } from "@prisma/client";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const ROLE_GROUP_MAPPING: { [key: string]: string } = {
  rol_sXYkL5QJc63EvHJI: "360 Elite Crypto Trading Alerts",
  rol_kFz6E1TzYWKHnoNb: "360 Elite Stock Market Slayer",
};

const PRICE_ID_ROLE_MAPPING: { [key: string]: string } = {
  elitecryptoalerts: "rol_sXYkL5QJc63EvHJI",
  stockmarketslayer: "rol_kFz6E1TzYWKHnoNb",
};

// const ROLE_GROUP_MAPPING: { [key: string]: string } = {
//   rol_sXYkL5QJc63EvHJI: "360 Elite Crypto Trading Alerts",
//   rol_kFz6E1TzYWKHnoNb: "360 Elite Stock Market Slayer",
// };

// const PRICE_ID_ROLE_MAPPING: { [key: string]: string } = {
//   price_1QWxVRFQDM8OhwJHQ3ZhKBrB: "rol_sXYkL5QJc63EvHJI",
//   price_1QUjNEFQDM8OhwJHDpoZ9bAZ: "rol_kFz6E1TzYWKHnoNb",
// };

const auth0Domain = process.env.M2M_DOMAIN;
const auth0ClientId = process.env.M2M_CLIENT_ID;
const auth0ClientSecret = process.env.M2M_CLIENT_SECRET;

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

  const customer = await stripe.customers.create({
    email: email,
  });
  const customerId = customer.id;

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
  return subscription;
};

const cancelSubscriptionInStripe = async (subscriptionId: string) => {
  const cancelSubcription = await stripe.subscriptions.cancel(subscriptionId);

  return cancelSubcription;
};

const getUserFromAuth0 = async (userEmail: string) => {
  const tokenResponse = await axios.post(
    `https://${process.env.M2M_DOMAIN}/oauth/token`,
    {
      client_id: process.env.M2M_CLIENT_ID,
      client_secret: process.env.M2M_CLIENT_SECRET,
      audience: `https://${process.env.M2M_DOMAIN}/api/v2/`,
      grant_type: "client_credentials",
      scope: "read:users update:users_app_metadata",
    }
  );

  const managementToken = tokenResponse.data.access_token;
  const userResponse = await axios.get(
    `https://${process.env.M2M_DOMAIN}/api/v2/users-by-email?email=${userEmail}`,
    {
      headers: {
        Authorization: `Bearer ${managementToken}`,
      },
    }
  );
  return userResponse.data[0];
};

const removeUserRole = async (userId: string, roleId: string) => {
  const tokenResponse = await axios.post(
    `https://${process.env.M2M_DOMAIN}/oauth/token`,
    {
      client_id: process.env.M2M_CLIENT_ID,
      client_secret: process.env.M2M_CLIENT_SECRET,
      audience: `https://${process.env.M2M_DOMAIN}/api/v2/`,
      grant_type: "client_credentials",
      scope: "update:users",
    }
  );

  const managementToken = tokenResponse.data.access_token;

  await axios.delete(
    `https://${process.env.M2M_DOMAIN}/api/v2/users/${userId}/roles`,
    {
      headers: {
        Authorization: `Bearer ${managementToken}`,
        "Content-Type": "application/json",
      },
      data: { roles: [roleId] },
    }
  );
};

const validateAndAssignRole = async (userEmail: string) => {
  try {
    const userFromAuth = await getUserFromAuth0(userEmail);
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new ApiError(404, "User not found by email address");
    }

    const customerId = user.customerId;
    const priceId = user.priceId;

    if (!customerId || !priceId) {
      await updateAuth0UserMetadata(userFromAuth.user_id, {
        priceId: null,
        group: null,
      });
      console.log("Removed invalid priceId from user metadata");
      return { valid: false };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    const validSubscription = subscriptions.data.find((sub) =>
      sub.items.data.some((item) => item.price.id === priceId)
    );

    if (validSubscription) {
      const roleId = PRICE_ID_ROLE_MAPPING[priceId];
      if (roleId) {
        await assignUserRole(userFromAuth.user_id, roleId);
        await updateAuth0UserMetadata(userFromAuth.user_id, {
          group: ROLE_GROUP_MAPPING[roleId],
        });
        console.log(
          `✅ Role ${roleId} assigned, Group: ${ROLE_GROUP_MAPPING[roleId]}`
        );
        return { valid: true, group: ROLE_GROUP_MAPPING[roleId] };
      }
    } else {
      await updateAuth0UserMetadata(userFromAuth.user_id, {
        priceId: null,
        group: null,
      });
      await removeUserRole(userFromAuth.user_id, "rol_sXYkL5QJc63EvHJI");
      await removeUserRole(userFromAuth.user_id, "rol_kFz6E1TzYWKHnoNb");
      console.log("❌ Subscription invalid, roles removed, group cleared");
      return { valid: false };
    }
  } catch (error: any) {
    console.error("❌ Subscription validation failed:", error.message);
    throw error;
  }
};

const handleSubscriptionInAuth = async (userEmail: string) => {
  await validateAndAssignRole(userEmail);

  const getAuth0Token = async () => {
    const tokenResponse = await axios.post(
      `https://${auth0Domain}/oauth/token`,
      {
        client_id: auth0ClientId,
        client_secret: auth0ClientSecret,
        audience: `https://${auth0Domain}/api/v2/`,
        grant_type: "client_credentials",
        scope:
          "read:users update:users create:user_tickets read:roles update:users_app_metadata",
      }
    );

    const managementToken = tokenResponse.data.access_token;
    return managementToken;
  };

  const managementToken = await getAuth0Token();

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

  if (!userId) {
    throw new ApiError(404, "User not found by email address");
  }

  const priceId = users[0]?.app_metadata?.priceId;

  let role: string | undefined;
  let groupName: string | undefined;

  if (priceId === "stockmarketslayer") {
    role = "rol_kFz6E1TzYWKHnoNb";
    groupName = "360 Elite Stock Market Slayer";
  } else if (priceId === "elitecryptoalerts") {
    role = "rol_sXYkL5QJc6ЗEVHJ!";
    groupName = "360 Elite Crypto Trading Alerts";
  }

  if (role && groupName) {
    // Assign Role to User
    await axios.post(
      `https://${auth0Domain}/api/v2/users/${userId}/roles`,
      {
        roles: [role],
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
};

//using for webhook
const updateAuth0UserMetadata = async (userId: string, appMetadata: object) => {
  const tokenResponse = await axios.post(
    `https://${process.env.M2M_DOMAIN}/oauth/token`,
    {
      client_id: process.env.M2M_CLIENT_ID,
      client_secret: process.env.M2M_CLIENT_SECRET,
      audience: `https://${process.env.M2M_DOMAIN}/api/v2/`,
      grant_type: "client_credentials",
      scope: "update:users_app_metadata",
    }
  );

  const managementToken = tokenResponse.data.access_token;

  await axios.patch(
    `https://${process.env.M2M_DOMAIN}/api/v2/users/${userId}`,
    {
      app_metadata: appMetadata,
    },
    {
      headers: {
        Authorization: `Bearer ${managementToken}`,
        "Content-Type": "application/json",
      },
    }
  );
};

//using for webhook
const assignUserRole = async (userId: string, roleId: string) => {
  const tokenResponse = await axios.post(
    `https://${process.env.M2M_DOMAIN}/oauth/token`,
    {
      client_id: process.env.M2M_CLIENT_ID,
      client_secret: process.env.M2M_CLIENT_SECRET,
      audience: `https://${process.env.M2M_DOMAIN}/api/v2/`,
      grant_type: "client_credentials",
      scope: "update:users",
    }
  );

  const managementToken = tokenResponse.data.access_token;

  await axios.post(
    `https://${process.env.M2M_DOMAIN}/api/v2/users/${userId}/roles`,
    { roles: [roleId] },
    {
      headers: {
        Authorization: `Bearer ${managementToken}`,
        "Content-Type": "application/json",
      },
    }
  );
};

//using for webhook
const subscriptionCreateHelperFunc = async (
  event: Stripe.CustomerSubscriptionCreatedEvent
) => {
  const customerId = event.data.object.customer as string;

  const customer = (await stripe.customers.retrieve(
    customerId
  )) as Stripe.Customer;
  if (!customer) {
    throw new ApiError(404, "Customer not found for the given customer ID");
  }
  const userEmail = customer.email;

  if (!userEmail) {
    throw new ApiError(404, "Email not found for the given customer ID");
  }

  const getAuth0Token = async () => {
    const tokenResponse = await axios.post(
      `https://${auth0Domain}/oauth/token`,
      {
        client_id: auth0ClientId,
        client_secret: auth0ClientSecret,
        audience: `https://${auth0Domain}/api/v2/`,
        grant_type: "client_credentials",
        scope:
          "read:users update:users create:user_tickets read:roles update:users_app_metadata",
      }
    );

    const managementToken = tokenResponse.data.access_token;
    return managementToken;
  };

  const managementToken = await getAuth0Token();

  const userResponse = await axios.get(
    `https://${auth0Domain}/api/v2/users-by-email?email=${userEmail}`,
    {
      headers: {
        Authorization: `Bearer ${managementToken}`,
      },
    }
  );

  const user = userResponse.data;
  const userId = user[0]?.user_id;

  if (!user) {
    throw new ApiError(404, "User not found by email address");
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
  });

  const activeSubscription = subscriptions.data.find(
    (subscription) => subscription.status === "active"
  );

  if (!activeSubscription) {
    throw new ApiError(404, "No active subscription found for the customer");
  }

  const priceId = activeSubscription.items.data[0]?.price.id;

  if (!priceId) {
    throw new ApiError(404, "PriceId not found in the subscription");
  }

  const roleId = PRICE_ID_ROLE_MAPPING[priceId];
  if (roleId) {
    await assignUserRole(userId, roleId);
    await updateAuth0UserMetadata(userId, {
      group: ROLE_GROUP_MAPPING[roleId],
    });
    console.log(
      `✅ Role ${roleId} assigned, Group: ${ROLE_GROUP_MAPPING[roleId]}`
    );
    const data = {
      email: userEmail,
      username: user[0].username,
      customerId: customerId,
      priceId: priceId,
      subscriptionId: activeSubscription.id,
      subcription: true,
      roleId: roleId,
      accessGroup: ROLE_GROUP_MAPPING[roleId],
    };
    const isExisting = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (isExisting) {
      await prisma.user.update({
        where: { email: userEmail },
        data: data as User,
      });
    } else {
      await prisma.user.create({
        data: data as User,
      });
    }
  }
};

//using for webhook
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
      case "customer.subscription.created":
        result = await subscriptionCreateHelperFunc(event);
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
  handelPaymentWebhook,
  validateAndAssignRole,
  handleSubscriptionInAuth,
};

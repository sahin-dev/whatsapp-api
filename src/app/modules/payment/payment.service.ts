import stripe from "../../../config/stripe";
import dotenv from "dotenv";
import path from "path";
import Stripe from "stripe";
import config from "../../../config";
import { Request } from "express";
import axios from "axios";
import ApiError from "../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const ROLE_GROUP_MAPPING: { [key: string]: string } = {
  rol_sXYkL5QJc63EvHJI: "360 Elite Crypto Trading Alerts",
  rol_kFz6E1TzYWKHnoNb: "360 Elite Stock Market Slayer",
};

const PRICE_ID_ROLE_MAPPING: { [key: string]: string } = {
  elitecryptoalerts: "rol_sXYkL5QJc63EvHJI",
  stockmarketslayer: "rol_kFz6E1TzYWKHnoNb",
};

// const auth0Domain = process.env.M2M_DOMAIN;
// const auth0ClientId = process.env.M2M_CLIENT_ID;
// const auth0ClientSecret = process.env.M2M_CLIENT_SECRET;

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

  let userInfo;

  userInfo = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!userInfo) {
    userInfo = await prisma.user.create({
      data: {
        email: email,
        username: email,
        password: await bcrypt.hash(email, 10),
      },
    });
  }

  if (userInfo?.priceId === priceId) {
    throw new ApiError(409, "You already have subscription this plan");
  }

  let customerId = userInfo?.customerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email,
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userInfo?.id },
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
    where: { id: userInfo?.id },
    data: updateData,
  });
  return subscription;
};

const cancelSubscriptionInStripe = async (subscriptionId: string) => {
  const cancelSubcription = await stripe.subscriptions.cancel(subscriptionId);

  return cancelSubcription;
};

const handleUserInAuth = async (
  event: Stripe.CustomerSubscriptionCreatedEvent
) => {
  const customerId = event.data.object.customer as string;
  // const auth0Domain = process.env.M2M_DOMAIN;
  // const auth0ClientId = process.env.M2M_CLIENT_ID;
  // const auth0ClientSecret = process.env.M2M_CLIENT_SECRET;

  const customer = await stripe.customers.retrieve(customerId);
  const userEmail = (customer as Stripe.Customer).email;
  if (!userEmail) {
    throw new ApiError(404, "Email not found for the given customer ID");
  }

  const result = await validateAndAssignRole(userEmail);
  return result;

  // const getAuth0Token = async () => {
  //   const tokenResponse = await axios.post(
  //     `https://${auth0Domain}/oauth/token`,
  //     {
  //       client_id: auth0ClientId,
  //       client_secret: auth0ClientSecret,
  //       audience: `https://${auth0Domain}/api/v2/`,
  //       grant_type: "client_credentials",
  //       scope:
  //         "read:users update:users create:user_tickets read:roles update:users_app_metadata",
  //     }
  //   );

  //   const managementToken = tokenResponse.data.access_token;
  //   return managementToken;
  // };

  // const managementToken = await getAuth0Token();

  // // Get User by Email
  // const userResponse = await axios.get(
  //   `https://${auth0Domain}/api/v2/users-by-email?email=${userEmail}`,
  //   {
  //     headers: {
  //       Authorization: `Bearer ${managementToken}`,
  //     },
  //   }
  // );

  // const users = userResponse.data;
  // console.log(users);
  // const userId = users[0]?.user_id;

  // if (!userId) {
  //   throw new ApiError(404, "User not found by email address");
  // }

  // const priceId = users[0]?.app_metadata?.priceId;

  // let role: string | undefined;
  // let groupName: string | undefined;

  // if (priceId === "stockmarketslayer") {
  //   role = "rol_kFz6E1TzYWKHnoNb";
  //   groupName = "360 Elite Stock Market Slayer";
  // } else if (priceId === "elitecryptoalerts") {
  //   role = "rol_sXYkL5QJc6ЗEVHJ!";
  //   groupName = "360 Elite Crypto Trading Alerts";
  // }

  // if (role && groupName) {
  //   // Assign Role to User
  //   await axios.post(
  //     `https://${auth0Domain}/api/v2/users/${userId}/roles`,
  //     {
  //       roles: [role],
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${managementToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   console.log(`✅ Role assigned to user ${userId} based on Price ID`);

  //   // Assign User to Group
  //   await axios.post(
  //     `https://${auth0Domain}/api/v2/users/${userId}/groups`,
  //     {
  //       groups: [groupName],
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${managementToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   console.log(`✅ Group ${groupName} assigned to user ${userId}`);
  // }
};

const getUserFromAuth0 = async (userEmail: string) => {
  console.log(userEmail);
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
    `https://${process.env.M2M_DOMAIN}/api/v2/users-by-email?email=newtest@test.com`,
    {
      headers: {
        Authorization: `Bearer ${managementToken}`,
      },
    }
  );
  console.log(userResponse.data[0]);
  return userResponse.data[0];
};

const updateAuth0UserMetadata = async (userId: string, appMetadata: object) => {
  console.log(appMetadata);
  console.log("userId:", userId);
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
  console.log("comming from assignrole tokenResponse", tokenResponse);

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
  console.log("comming from validate assign role", userEmail);
  try {
    const user = await getUserFromAuth0(userEmail);
    console.log("user", user);
    if (!user) throw new ApiError(404, "User not found in Auth0");

    const userInfo = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!userInfo || !userInfo.subscriptionId || !userInfo.priceId) {
      console.warn("No subscription details found in database for this user.");
      return { valid: false };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userInfo.customerId as any,
      status: "active",
    });

    const validSubscription = subscriptions.data.find((sub) =>
      sub.items.data.some((item) => item.price.id === userInfo.priceId)
    );

    if (validSubscription) {
      const roleId = PRICE_ID_ROLE_MAPPING[userInfo.priceId];
      await assignUserRole(user.user_id, roleId);
      const debugData = await updateAuth0UserMetadata(user.user_id, {
        group: ROLE_GROUP_MAPPING[roleId],
        priceId: userInfo.priceId,
      });
      console.log("comming from valid subscription", debugData);
      return { valid: true, group: ROLE_GROUP_MAPPING[roleId] };
    } else {
      await updateAuth0UserMetadata(user.user_id, {
        priceId: null,
        group: null,
      });
      await removeUserRole(
        user.user_id,
        PRICE_ID_ROLE_MAPPING[userInfo.priceId]
      );
      return { valid: false };
    }
  } catch (error: any) {
    console.error("Validation error:", error.message);
    throw error;
  }
};

const handleSubscriptionInAuth = async (userEmail: string) => {
  if (!userEmail) {
    throw new ApiError(404, "Email not found for the given customer ID");
  }

  const result = await validateAndAssignRole(userEmail);
  console.log("comming from handleSubscriptionInAuth", result);
  return result;

  // const getAuth0Token = async () => {
  //   const tokenResponse = await axios.post(
  //     `https://${auth0Domain}/oauth/token`,
  //     {
  //       client_id: auth0ClientId,
  //       client_secret: auth0ClientSecret,
  //       audience: `https://${auth0Domain}/api/v2/`,
  //       grant_type: "client_credentials",
  //       scope:
  //         "read:users update:users create:user_tickets read:roles update:users_app_metadata",
  //     }
  //   );

  //   const managementToken = tokenResponse.data.access_token;
  //   return managementToken;
  // };

  // const managementToken = await getAuth0Token();

  // // Get User by Email
  // const userResponse = await axios.get(
  //   `https://${auth0Domain}/api/v2/users-by-email?email=${userEmail}`,
  //   {
  //     headers: {
  //       Authorization: `Bearer ${managementToken}`,
  //     },
  //   }
  // );

  // const users = userResponse.data;
  // console.log(users);
  // const userId = users[0]?.user_id;

  // if (!userId) {
  //   throw new ApiError(404, "User not found by email address");
  // }

  // const priceId = users[0]?.app_metadata?.priceId;

  // let role: string | undefined;
  // let groupName: string | undefined;

  // if (priceId === "stockmarketslayer") {
  //   role = "rol_kFz6E1TzYWKHnoNb";
  //   groupName = "360 Elite Stock Market Slayer";
  // } else if (priceId === "elitecryptoalerts") {
  //   role = "rol_sXYkL5QJc6ЗEVHJ!";
  //   groupName = "360 Elite Crypto Trading Alerts";
  // }

  // if (role && groupName) {
  //   // Assign Role to User
  //   await axios.post(
  //     `https://${auth0Domain}/api/v2/users/${userId}/roles`,
  //     {
  //       roles: [role],
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${managementToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   console.log(`✅ Role assigned to user ${userId} based on Price ID`);

  //   // Assign User to Group
  //   await axios.post(
  //     `https://${auth0Domain}/api/v2/users/${userId}/groups`,
  //     {
  //       groups: [groupName],
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${managementToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   console.log(`✅ Group ${groupName} assigned to user ${userId}`);
  // }
};

const handelPaymentWebhook = async (req: Request) => {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig) {
    console.error("Missing Stripe signature header");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhook_secret as string
    );
    let result;
    switch (event.type) {
      case "customer.subscription.created":
        result = await handleUserInAuth(event);
        break;

      default:
        break;
    }
    console.log("comming from webhook", result);
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

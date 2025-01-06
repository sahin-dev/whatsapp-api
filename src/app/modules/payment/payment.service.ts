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

// const ROLE_GROUP_MAPPING: { [key: string]: string } = {
//   rol_sXYkL5QJc63EvHJI: "360 Elite Crypto Trading Alerts",
//   rol_kFz6E1TzYWKHnoNb: "360 Elite Stock Market Slayer",
// };

// const PRICE_ID_ROLE_MAPPING: { [key: string]: string } = {
//   elitecryptoalerts: "rol_sXYkL5QJc63EvHJI",
//   stockmarketslayer: "rol_kFz6E1TzYWKHnoNb",
// };

const ROLE_GROUP_MAPPING: { [key: string]: string } = {
  rol_sXYkL5QJc63EvHJI: "360 Elite Crypto Trading Alerts",
  rol_kFz6E1TzYWKHnoNb: "360 Elite Stock Market Slayer",
};

const PRICE_ID_ROLE_MAPPING: { [key: string]: string } = {
  price_1Qe8t2FQDM8OhwJHt1Wr8DJ9: "rol_sXYkL5QJc63EvHJI",
  price_1Qe8tmFQDM8OhwJHgdBWauny: "rol_kFz6E1TzYWKHnoNb",
};

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

    const activeSubscription = subscriptions.data.find(
      (subscription) => subscription.status === "active"
    );

    if (!activeSubscription) {
      throw new ApiError(404, "No active subscription found for the customer");
    }

    const validSubscription = subscriptions.data.find((sub) =>
      sub.items.data.some((item) => item.price.id === priceId)
    );

    if (validSubscription) {
      const roleId = PRICE_ID_ROLE_MAPPING[priceId];
      if (roleId) {
        await assignUserRole(userFromAuth.user_id, roleId);
        await updateAuth0UserMetadata(userFromAuth.user_id, {
          stripe_customer_id: customerId,
          priceId: priceId,
          subscriptionId: activeSubscription.id,
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
  if (!userEmail) {
    throw new ApiError(400, "userEmail is required");
  }
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

  const user = await prisma.user.findUnique({ where: { email: userEmail } });

  if (!user) {
    throw new Error("User not found in database");
  }

  const priceId = user.priceId;

  // const priceId = users[0]?.app_metadata?.priceId;

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
    console.log("working in role and groupName");
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

    // Assign User to Group
    // const result = await axios.post(
    //   `https://${auth0Domain}/api/v2/users/${userId}/groups`,
    //   {
    //     groups: [groupName],
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${managementToken}`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );

    return {
      stripeCustomerId: user.customerId,
      priceId: user.priceId,
      subscriptionId: user.subscriptionId,
    };
  }
  return {
    stripeCustomerId: user.customerId,
    priceId: user.priceId,
    subscriptionId: user.subscriptionId,
  };
};

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

//using for subscription delete operation
const handleSubscriptionDeleted = async (event: Stripe.Event) => {
  const customerData = event.data.object as Stripe.Customer;
  const subscriptionData = event.data.object as Stripe.Subscription;
  console.log("customer ##############################", customerData);
  console.log("subscription ##############################", subscriptionData);

  // Check if user exists with the subscriptionId
  const isUserExist = await prisma.user.findFirst({
    where: { email: customerData.email as string },
  });

  if (!isUserExist) {
    throw new ApiError(404, "User not found");
  }
  const subscriptions = isUserExist.subscriptions;

  // const priceId = subscription.items.data[0]?.price.id;
  const priceId = "price_1Qe8t2FQDM8OhwJHt1Wr8DJ9";
  console.log("subscriptions ###############################", subscriptions);
  const roleId = PRICE_ID_ROLE_MAPPING[priceId];
  const groupToRemove = ROLE_GROUP_MAPPING[roleId];
  console.log("remove group", groupToRemove);

  const updatedAccessGroup = isUserExist.accessGroup.filter(
    (group) => group !== groupToRemove
  );
  console.log("update access group", updatedAccessGroup);

  const result = await prisma.user.update({
    where: { id: isUserExist.id },
    data: {
      accessGroup: updatedAccessGroup,
    },
  });

  return result;
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

  const roleId = PRICE_ID_ROLE_MAPPING[priceId] as any;
  const data = {
    email: userEmail,
    username: userEmail,
    customerId: customerId,
    priceId: priceId,
    subscriptionId: activeSubscription.id,
    subcription: true,
    roleId: roleId,
    accessGroup: [ROLE_GROUP_MAPPING[roleId]],
  };

  const subscription = {
    subscriptionId: activeSubscription.id,
    priceId: priceId,
    status: "ACTIVE",
    role: roleId,
    group: ROLE_GROUP_MAPPING[roleId],
  };

  const user: any = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    await prisma.user.create({
      data: {
        ...data,
        subscriptions: [subscription],
      },
    });
  }

  const newAccessGroup = [ROLE_GROUP_MAPPING[roleId]] as any;

  const newSubscription = {
    subscriptionId: activeSubscription.id,
    priceId: priceId,
    status: "ACTIVE",
    role: roleId,
    group: ROLE_GROUP_MAPPING[roleId],
  };

  await prisma.user.update({
    where: { id: user?.id },
    data: {
      ...data,
      subscriptions: [
        {
          ...newSubscription,
        },
        ...user?.subscriptions,
      ],
      accessGroup: {
        push: newAccessGroup,
      },
    },
  });
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
  handelPaymentWebhook,
  validateAndAssignRole,
  handleSubscriptionInAuth,
};

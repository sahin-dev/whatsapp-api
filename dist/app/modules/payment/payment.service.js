"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentSevices = void 0;
const stripe_1 = __importDefault(require("../../../config/stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../../../config"));
const axios_1 = __importDefault(require("axios"));
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
const ROLE_GROUP_MAPPING = {
    rol_sXYkL5QJc63EvHJI: "360 Elite Crypto Trading Alerts",
    rol_kFz6E1TzYWKHnoNb: "360 Elite Stock Market Slayer",
};
const PRICE_ID_ROLE_MAPPING = {
    elitecryptoalerts: "rol_sXYkL5QJc63EvHJI",
    stockmarketslayer: "rol_kFz6E1TzYWKHnoNb",
};
// const ROLE_GROUP_MAPPING: { [key: string]: string } = {
//   rol_sXYkL5QJc63EvHJI: "360 Elite Crypto Trading Alerts",
//   rol_kFz6E1TzYWKHnoNb: "360 Elite Stock Market Slayer",
// };
// const PRICE_ID_ROLE_MAPPING: { [key: string]: string } = {
//   price_1Qe8t2FQDM8OhwJHt1Wr8DJ9: "rol_sXYkL5QJc63EvHJI",
//   price_1Qe8tmFQDM8OhwJHgdBWauny: "rol_kFz6E1TzYWKHnoNb",
// };
const auth0Domain = process.env.M2M_DOMAIN;
const auth0ClientId = process.env.M2M_CLIENT_ID;
const auth0ClientSecret = process.env.M2M_CLIENT_SECRET;
const stripePortalSessionInStripe = (customerId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield stripe_1.default.billingPortal.sessions.create({
        customer: customerId,
        return_url: "https://360trader.com",
    });
    return session.url;
});
const createSubcriptionInStripe = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, paymentMethodId, priceId } = payload;
    const customer = yield stripe_1.default.customers.create({
        email: email,
    });
    const customerId = customer.id;
    yield stripe_1.default.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
    });
    yield stripe_1.default.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
    });
    const subscription = yield stripe_1.default.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        expand: ["latest_invoice.payment_intent"],
    });
    return subscription;
});
const cancelSubscriptionInStripe = (subscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    const cancelSubcription = yield stripe_1.default.subscriptions.cancel(subscriptionId);
    return cancelSubcription;
});
const getUserFromAuth0 = (userEmail) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenResponse = yield axios_1.default.post(`https://${process.env.M2M_DOMAIN}/oauth/token`, {
        client_id: process.env.M2M_CLIENT_ID,
        client_secret: process.env.M2M_CLIENT_SECRET,
        audience: `https://${process.env.M2M_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
        scope: "read:users update:users_app_metadata",
    });
    const managementToken = tokenResponse.data.access_token;
    const userResponse = yield axios_1.default.get(`https://${process.env.M2M_DOMAIN}/api/v2/users-by-email?email=${userEmail}`, {
        headers: {
            Authorization: `Bearer ${managementToken}`,
        },
    });
    return userResponse.data[0];
});
const removeUserRole = (userId, roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenResponse = yield axios_1.default.post(`https://${process.env.M2M_DOMAIN}/oauth/token`, {
        client_id: process.env.M2M_CLIENT_ID,
        client_secret: process.env.M2M_CLIENT_SECRET,
        audience: `https://${process.env.M2M_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
        scope: "update:users",
    });
    const managementToken = tokenResponse.data.access_token;
    yield axios_1.default.delete(`https://${process.env.M2M_DOMAIN}/api/v2/users/${userId}/roles`, {
        headers: {
            Authorization: `Bearer ${managementToken}`,
            "Content-Type": "application/json",
        },
        data: { roles: [roleId] },
    });
});
// const validateAndAssignRole = async (userEmail: string) => {
//   try {
//     const userFromAuth = await getUserFromAuth0(userEmail);
//     const user = await prisma.user.findUnique({
//       where: { email: userEmail },
//       include: {
//         subscription: true,
//       },
//     });
//     if (!user) {
//       throw new ApiError(404, "User not found by email address");
//     }
//     const customerId = user.customerId;
//     const priceId = user.priceId;
//     if (!customerId || !priceId) {
//       await updateAuth0UserMetadata(userFromAuth.user_id, {
//         priceId: null,
//         group: null,
//       });
//       console.log("Removed invalid priceId from user metadata");
//       return { valid: false };
//     }
//     const subscriptions = await stripe.subscriptions.list({
//       customer: customerId,
//       status: "active",
//     });
//     const activeSubscription = subscriptions.data.find(
//       (subscription) => subscription.status === "active"
//     );
//     if (!activeSubscription) {
//       throw new ApiError(404, "No active subscription found for the customer");
//     }
//     const validSubscription = subscriptions.data.find((sub) =>
//       sub.items.data.some((item) => item.price.id === priceId)
//     );
//     if (validSubscription) {
//       const roleId = PRICE_ID_ROLE_MAPPING[priceId];
//       if (roleId) {
//         await assignUserRole(userFromAuth.user_id, roleId);
//         await updateAuth0UserMetadata(userFromAuth.user_id, {
//           stripe_customer_id: customerId,
//           priceId: priceId,
//           subscriptionId: activeSubscription.id,
//         });
//         //for testing
//         // await updateAuth0UserMetadata(userFromAuth.user_id, [
//         //   user.subscription,
//         // ]);
//         console.log(
//           `✅ Role ${roleId} assigned, Group: ${ROLE_GROUP_MAPPING[roleId]}`
//         );
//         return { valid: true, group: ROLE_GROUP_MAPPING[roleId] };
//       }
//     } else {
//       await updateAuth0UserMetadata(userFromAuth.user_id, {
//         stripe_customer_id: null,
//         priceId: null,
//         subscriptionId: null,
//       });
//       await removeUserRole(userFromAuth.user_id, "rol_sXYkL5QJc63EvHJI");
//       await removeUserRole(userFromAuth.user_id, "rol_kFz6E1TzYWKHnoNb");
//       console.log("❌ Subscription invalid, roles removed, group cleared");
//       return { valid: false };
//     }
//   } catch (error: any) {
//     console.error("❌ Subscription validation failed:", error.message);
//     throw error;
//   }
// };
const validateAndAssignRole = (userEmail) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userFromAuth = yield getUserFromAuth0(userEmail);
        const user = yield prisma_1.default.user.findUnique({
            where: { email: userEmail },
            include: { subscription: true },
        });
        if (!user)
            throw new ApiErrors_1.default(404, "User not found by email");
        const customerId = user === null || user === void 0 ? void 0 : user.customerId;
        console.log(customerId);
        if (!customerId) {
            throw new ApiErrors_1.default(400, "Customer ID missing for user");
        }
        const appMetadata = {
            stripe_customer_id: customerId,
            subscriptions: user.subscription,
        };
        // Update Auth0 with all active subscriptions
        yield updateAuth0UserMetadata(userFromAuth.user_id, appMetadata);
        console.log(`✅ Updated Auth0 metadata for user ${userEmail}`);
        // Assign roles to the user based on subscriptions
        const roles = user.subscription.map((sub) => sub.role).filter(Boolean);
        for (const roleId of roles) {
            yield assignUserRole(userFromAuth.user_id, roleId);
            // await removeUserRole(userFromAuth.user_id, roleId); // for testing
        }
    }
    catch (error) {
        console.error("❌ Error in validating and assigning subscriptions:", error.message);
        throw error;
    }
});
const handleSubscriptionInAuth = (userEmail) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!userEmail) {
        throw new ApiErrors_1.default(400, "userEmail is required");
    }
    yield validateAndAssignRole(userEmail);
    const getAuth0Token = () => __awaiter(void 0, void 0, void 0, function* () {
        const tokenResponse = yield axios_1.default.post(`https://${auth0Domain}/oauth/token`, {
            client_id: auth0ClientId,
            client_secret: auth0ClientSecret,
            audience: `https://${auth0Domain}/api/v2/`,
            grant_type: "client_credentials",
            scope: "read:users update:users create:user_tickets read:roles update:users_app_metadata",
        });
        const managementToken = tokenResponse.data.access_token;
        return managementToken;
    });
    const managementToken = yield getAuth0Token();
    // Get User by Email
    const userResponse = yield axios_1.default.get(`https://${auth0Domain}/api/v2/users-by-email?email=${userEmail}`, {
        headers: {
            Authorization: `Bearer ${managementToken}`,
        },
    });
    const users = userResponse.data;
    const userId = (_a = users[0]) === null || _a === void 0 ? void 0 : _a.user_id;
    if (!userId) {
        throw new ApiErrors_1.default(404, "User not found by email address");
    }
    const user = yield prisma_1.default.user.findUnique({ where: { email: userEmail } });
    if (!user) {
        throw new Error("User not found in database");
    }
    const priceId = user.priceId;
    // const priceId = users[0]?.app_metadata?.priceId;
    let role;
    let groupName;
    if (priceId === "stockmarketslayer") {
        role = "rol_kFz6E1TzYWKHnoNb";
        groupName = "360 Elite Stock Market Slayer";
    }
    else if (priceId === "elitecryptoalerts") {
        role = "rol_sXYkL5QJc6ЗEVHJ!";
        groupName = "360 Elite Crypto Trading Alerts";
    }
    // if (role && groupName) {
    //   console.log("working in role and groupName");
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
    //   // Assign User to Group
    //   // const result = await axios.post(
    //   //   `https://${auth0Domain}/api/v2/users/${userId}/groups`,
    //   //   {
    //   //     groups: [groupName],
    //   //   },
    //   //   {
    //   //     headers: {
    //   //       Authorization: `Bearer ${managementToken}`,
    //   //       "Content-Type": "application/json",
    //   //     },
    //   //   }
    //   // );
    //   return {
    //     stripeCustomerId: user.customerId,
    //     priceId: user.priceId,
    //     subscriptionId: user.subscriptionId,
    //   };
    // }
    return {
        stripeCustomerId: user.customerId,
        priceId: user.priceId,
        subscriptionId: user.subscriptionId,
    };
});
const updateAuth0UserMetadata = (userId, appMetadata) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenResponse = yield axios_1.default.post(`https://${process.env.M2M_DOMAIN}/oauth/token`, {
        client_id: process.env.M2M_CLIENT_ID,
        client_secret: process.env.M2M_CLIENT_SECRET,
        audience: `https://${process.env.M2M_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
        scope: "update:users_app_metadata",
    });
    const managementToken = tokenResponse.data.access_token;
    yield axios_1.default.patch(`https://${process.env.M2M_DOMAIN}/api/v2/users/${userId}`, {
        app_metadata: appMetadata,
    }, {
        headers: {
            Authorization: `Bearer ${managementToken}`,
            "Content-Type": "application/json",
        },
    });
});
const assignUserRole = (userId, roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenResponse = yield axios_1.default.post(`https://${process.env.M2M_DOMAIN}/oauth/token`, {
        client_id: process.env.M2M_CLIENT_ID,
        client_secret: process.env.M2M_CLIENT_SECRET,
        audience: `https://${process.env.M2M_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
        scope: "update:users",
    });
    const managementToken = tokenResponse.data.access_token;
    yield axios_1.default.post(`https://${process.env.M2M_DOMAIN}/api/v2/users/${userId}/roles`, { roles: [roleId] }, {
        headers: {
            Authorization: `Bearer ${managementToken}`,
            "Content-Type": "application/json",
        },
    });
});
//using for subscription delete operation
const handleSubscriptionDeleted = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const subscriptionData = event.data.object;
    const priceId = subscriptionData.plan.id;
    const subscriptionId = subscriptionData.id;
    yield prisma_1.default.subscription.deleteMany({
        where: {
            priceId: priceId,
            subscriptionId: subscriptionId,
        },
    });
    return;
});
//using for webhook
const subscriptionCreateHelperFunc = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const customerId = event.data.object.customer;
    const customer = (yield stripe_1.default.customers.retrieve(customerId));
    if (!customer) {
        throw new ApiErrors_1.default(404, "Customer not found for the given customer ID");
    }
    const userEmail = customer.email;
    if (!userEmail) {
        throw new ApiErrors_1.default(404, "Email not found for the given customer ID");
    }
    const subscriptions = yield stripe_1.default.subscriptions.list({
        customer: customerId,
    });
    const activeSubscription = subscriptions.data.find((subscription) => subscription.status === "active");
    if (!activeSubscription) {
        throw new ApiErrors_1.default(404, "No active subscription found for the customer");
    }
    const priceId = (_a = activeSubscription.items.data[0]) === null || _a === void 0 ? void 0 : _a.price.id;
    if (!priceId) {
        throw new ApiErrors_1.default(404, "PriceId not found in the subscription");
    }
    const roleId = PRICE_ID_ROLE_MAPPING[priceId];
    const data = {
        email: userEmail,
        username: userEmail,
        customerId: customerId,
        priceId: priceId,
        subscriptionId: activeSubscription.id,
        subcription: true,
        roleId: roleId,
    };
    const subscription = {
        subscriptionId: activeSubscription.id,
        priceId: priceId,
        status: "ACTIVE",
        role: roleId,
        group: ROLE_GROUP_MAPPING[roleId],
    };
    const user = yield prisma_1.default.user.findUnique({
        where: { email: userEmail },
    });
    if (!user) {
        const createdUser = yield prisma_1.default.user.create({
            data: data,
        });
        console.log(createdUser);
        yield prisma_1.default.subscription.create({
            data: Object.assign(Object.assign({}, subscription), { userId: createdUser.id }),
        });
    }
    const newSubscription = {
        subscriptionId: activeSubscription.id,
        priceId: priceId,
        status: "ACTIVE",
        role: roleId,
        group: ROLE_GROUP_MAPPING[roleId],
    };
    yield prisma_1.default.subscription.create({
        data: Object.assign(Object.assign({}, newSubscription), { userId: user.id }),
    });
});
//using for webhook
const handelPaymentWebhook = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        console.error("Missing Stripe signature header");
    }
    let event;
    try {
        // Verify and construct the Stripe event
        event = stripe_1.default.webhooks.constructEvent(req.body, sig, config_1.default.stripe.webhook_secret);
        let result;
        switch (event.type) {
            case "customer.subscription.created":
                result = yield subscriptionCreateHelperFunc(event);
                break;
            case "customer.subscription.deleted":
                result = yield handleSubscriptionDeleted(event);
                break;
            default:
                break;
        }
        return result;
    }
    catch (err) {
        return;
    }
});
exports.paymentSevices = {
    stripePortalSessionInStripe,
    createSubcriptionInStripe,
    cancelSubscriptionInStripe,
    handelPaymentWebhook,
    validateAndAssignRole,
    handleSubscriptionInAuth,
};

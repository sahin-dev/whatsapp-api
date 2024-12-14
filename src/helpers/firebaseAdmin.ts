import admin from "firebase-admin";
import { serviceAccount } from "../config/serviceAccount";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

export default admin;

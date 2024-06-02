import { Timestamp } from "mongodb";
import mongoose, { Schema } from "mongoose";

export const billingSchema = new Schema({
  documentType: String,
  checkoutId: String,
  subscriptionId: String,
  invoice: String,
  currency: String,
  amountTotal: Number,
  status: String,
  customerEmail: String,
  customerName: String,
  createdAt: Date,
  expiresAt: Date,
  isTrial: Boolean
});

export const Billing = mongoose.model("Billing", billingSchema, "billings");
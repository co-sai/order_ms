const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  senderName: {
    type: String,
    required: true,
  },
  receiverName: {
    type: String,
    required: true,
  },
  items: [
    {
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      barcode: {
        type: String,
        default : null
      },
    },
  ],
  paymentMethod: {
    type: String,
    enum: ["credit card", "debit card", "paypal", "wavepay", "kpay"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Payment Pending", "Payment Completed"],
    default: "Payment Pending",
  },
  orderStatus : {
    type : String,
    enum : ["Order Requested", "Order Completed"],
    default : "Order Requested"
  }
}, {timestamps : true});

module.exports = mongoose.model("Order", orderSchema);

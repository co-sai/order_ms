const Joi = require('joi');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');
const canvas = createCanvas();

const { OrderRepository } = require("../database");
const {
    NotFoundError,
    AuthorizeError,
    ValidationError,
    APIError,
} = require("../utils/errors/app-errors");

// Business Logic
class OrderService{
    constructor(){
        this.repository = new OrderRepository();
    }

    async CreateOrder(userInputs){
        try{
            const validatedInputs = await this.ValidatedInputs(userInputs);

            const data = await this.repository.CreateOrder(validatedInputs);

            const updatedItems = data.items;
            updatedItems.forEach((item, index) => {
                JsBarcode(canvas, `${item._id.toString()}`);
                item.barcode = canvas.toDataURL();
            });
            await data.save();
            return data;
        }catch(err){
            throw err;
        }
    }

    async TrackOrderItem(id){
        try{
            const data = await this.repository.TrackItemById(id);
            return data;
        }catch(err){
            throw err;
        }
    }

    async FindById(id){
        try{
            const data = await this.repository.FindById(id);
            if(!data){
                throw new NotFoundError("Order not found with that id.");
            }
            return data;
        }catch(err){
            throw err;
        }
    };

    async UpdateOrder(userInputs){
        try{
            const { id, senderName, receiverName, items, paymentMethod, paymentStatus, paymentAmount, orderStatus } = userInputs;
            const data = await this.repository.FindById(id);
            if(!data){
                throw new NotFoundError("Order not found with that id.");
            }
            const currentPaymentStatus = data.paymentStatus;
            if(!data){
                throw new NotFoundError("Order not found with that id.");
            }
            const validatedInputs = await this.ValidatedInputs({senderName, receiverName, items, paymentMethod, paymentStatus, paymentAmount, orderStatus});

            if (data.orderStatus === "Order Completed") {
                throw new ValidationError("Order has already been completed and cannot be updated");
            }

            // Update senderName if provided
            if (validatedInputs.senderName) {
                data.senderName = validatedInputs.senderName;
            }
        
            // Update receiverName if provided
            if (validatedInputs.receiverName) {
                data.receiverName = validatedInputs.receiverName;
            }

            // Update items if provided
            if (validatedInputs.items) {
                const updatedItems = validatedInputs.items.map((item) => {
                const existingItem = data.items.find((i) => i._id.toString() === item._id.toString());
        
                if (!existingItem) {
                    throw new Error(`Item with barcode ${item._id} not found in order`);
                }
        
                return {
                    ...existingItem._doc,
                    quantity: item.quantity,
                    price: item.price,
                };
                });
        
                data.items = updatedItems;
            }
  

            // Update payment status if provided and valid
            if (validatedInputs.paymentStatus) {
                if (currentPaymentStatus !== "Payment Completed") {
                    if (
                        validatedInputs.paymentStatus === "Payment Completed" &&
                        data.paymentAmount !== validatedInputs.paymentAmount
                    ) {
                        throw new ValidationError("Invalid payment amount for completing the payment");
                    }
                    // data.paymentStatus = validatedInputs.paymentStatus;
                    data.set("paymentStatus", validatedInputs.paymentStatus );
                }
                
            }

            // Update payment method if provided and valid
            if (validatedInputs.paymentMethod) {
                if(validatedInputs.paymentMethod !== data.paymentMethod){
                    if (currentPaymentStatus === "Payment Completed") {
                        throw new ValidationError("Payment method cannot be updated after payment has been completed");
                    }
                    // data.paymentMethod = validatedInputs.paymentMethod;
                    data.set("paymentMethod", validatedInputs.paymentMethod)
                }
            }
            
            if(data.paymentAmount !== validatedInputs.paymentAmount){
                console.log(currentPaymentStatus);
                if(currentPaymentStatus === "Payment Completed"){
                    throw new ValidationError("Invalid payment amount for completing the payment");
                }
                data.set("paymentAmount", validatedInputs.paymentAmount);
            }

            // Update order status if provided and valid
            if (validatedInputs.orderStatus) {
                if (validatedInputs.orderStatus === "Order Completed") {
                    if (data.paymentStatus !== "Payment Completed") {
                        throw new ValidationError("Cannot complete the order without completing the payment");
                    }
                    data.orderStatus = validatedInputs.orderStatus;
                } else if (validatedInputs.orderStatus !== "Order Requested") {
                    throw new ValidationError("Invalid order status");
                }
            }
        
            const updatedOrder = await data.save();
            
            return updatedOrder;
        }catch(err){
            throw err;
        }
    }

    async DeleteOrder(id){
        try{
            await this.repository.DeleteOrder(id);

            return;
        }catch(err){
            throw err;
        }
    };

    async ValidatedInputs(userInputs){
        try{
            const schema = Joi.object({
                senderName: Joi.string()
                .min(3)
                .max(30).required().messages({
                    'string.required': 'Sender name is required.',
                    'string.min': 'Sender name length must be at least {#limit} characters long',
                    'string.max': 'Sender name length must be less than or equal to {#limit} characters'
                }),
                receiverName: Joi.string()
                .min(3)
                .max(30).required().messages({
                    'string.required': 'Receiver name is required.',
                    'string.min': 'Receiver name length must be at least {#limit} characters long',
                    'string.max': 'Receiver name length must be less than or equal to {#limit} characters'
                }),
                items: Joi.array().min(1).items(
                    Joi.object({
                        _id: Joi.string().optional(),
                        name: Joi.string().required(),
                        quantity: Joi.number().integer().min(1).required(),
                        price: Joi.number().min(0).required(),
                    })
                ).required().messages({
                  'array.required': 'Items is required.',
                  'array.min': 'At least one item is required.'
                }),
                paymentMethod: Joi.string().valid("credit card", "debit card", "paypal", "wavepay", "kpay").required().messages({
                  'any.required': 'Payment method is required.',
                  'any.only': 'Payment method must be one of [credit card, debit card, paypal, wavepay, kpay]'
                }),
                paymentStatus: Joi.string().valid('Payment Pending', 'Payment Completed').messages({
                    'any.only': 'Payment status must be either "Payment Pending" or "Payment Completed".'
                }),
                paymentAmount: Joi.number().messages({
                    'any.required': 'Payment amount is required.'
                }),
                orderStatus: Joi.string().valid("Order Requested", "Order Completed").messages({
                    'any.only': 'Order status must be either "Order Requested" or "Order Completed".'
                }),
            });

            const validatedInputs = await schema.validateAsync(userInputs, { abortEarly: false });

            return validatedInputs;
        }catch(err){
            throw err;
        }
    }
}
module.exports = OrderService;
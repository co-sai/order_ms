const Joi = require('joi');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');
const canvas = createCanvas();

const { OrderRepository } = require("../database");
const {
    NotFoundError,
    AuthorizeError,
    ValidationError,
} = require("../utils/errors/app-errors");

// Business Logic
class OrderService{
    constructor(){
        this.repository = new OrderRepository();
    }

    async CreateOrder(userInputs){
        try{
            const { senderName, receiverName, items, paymentMethod, paymentStatus } = userInputs;
            const schema = Joi.object({
                senderName: Joi.string()
                .min(3)
                .max(30).required().messages({
                  'any.required': 'Sender name is required.'
                }),
                receiverName: Joi.string()
                .min(3)
                .max(30).required().messages({
                  'any.required': 'Receiver name is required.'
                }),
                items: Joi.array().min(1).items(
                    Joi.object({
                      name: Joi.string().required(),
                      quantity: Joi.number().integer().min(1).required(),
                      price: Joi.number().min(0).required(),
                    })
                ).required().messages({
                  'any.required': 'At least one item is required.',
                  'array.min': 'At least one item is required.'
                }),
                paymentMethod: Joi.string().required().messages({
                  'any.required': 'Payment method is required.'
                }),
                paymentStatus: Joi.string().valid('Payment Pending', 'Payment Completed').messages({
                    'any.only': 'Payment status must be either "Payment Pending" or "Payment Payment Completed".'
                }),
            });
          
            const validatedInputs = await schema.validateAsync(userInputs, { abortEarly: false });

            const data = await this.repository.CreateOrder(validatedInputs);

            const updatedItems = data.items;
            updatedItems.forEach((item, index) => {
                JsBarcode(canvas, data._id.toString());
                item.barcode = canvas.toDataURL();
            });
        
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

    async UpdateOrder(id){
        try{
            const data = await this.repository.FindById(id);
            if(!data){
                throw new NotFoundError("Order not found with that id.");
            }
        }catch(err){
            throw err;
        }
    }
}
module.exports = OrderService;
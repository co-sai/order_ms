const { OrderModel } = require("../models");

// Work with Database
class OrderRepository{
    async CreateOrder(validatedInputs){
        try{
            const { senderName, receiverName, items, paymentMethod, paymentStatus } = validatedInputs;
            const order = new OrderModel({
                senderName, receiverName, items, paymentMethod, paymentStatus
            });
            await order.save();
            return order;
        }catch(err){
            throw err;
        }
    }

    async FindById(id){
        try{
            const data = await OrderModel.findById(id);
            return data;
        }catch(err){
            throw err;
        }
    }
}
module.exports = OrderRepository;
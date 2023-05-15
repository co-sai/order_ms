const { OrderModel } = require("../models");

// Work with Database
class OrderRepository{
    async CreateOrder(validatedInputs){
        try{
            const { senderName, receiverName, items, paymentMethod, paymentStatus, paymentAmount } = validatedInputs;
            const order = new OrderModel({
                senderName, receiverName, items, paymentMethod, paymentStatus, paymentAmount
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

    async TrackItemById(id){
        try{
            const data = await OrderModel.findOne({ "items._id" : id});
            return data;
        }catch(err){
            throw err;
        }
    }


    async DeleteOrder(id){
        try{
            await OrderModel.findByIdAndRemove(id);

            return;
        }catch(err){
            throw err;
        }
    };
}
module.exports = OrderRepository;
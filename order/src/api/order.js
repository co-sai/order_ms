const OrderService = require("../service/order-service");

module.exports = async (app, channel) => {
    const service = new OrderService();

    // Create Order
    app.post("/orders/add", async (req, res, next) => {
        try {
            const { senderName, receiverName, items, paymentMethod, paymentStatus, paymentAmount } = req.body;

            const data = await service.CreateOrder({ senderName, receiverName, items, paymentMethod, paymentStatus, paymentAmount });

            return res.status(201).json({
                message : "Order has been created successfully.",
                data : data
            });
        } catch (err) {
            next(err);
        }
    });

    //Track
    app.get("/orders/track/:id", async(req, res, next)=>{
        try{
            const id = req.params.id;
            const data = await service.TrackOrderItem(id);

            return res.status(200).json({
                data : data
            })
        }catch(err){
            next(err);
        }
    })

    // Get Order Detail
    app.get("/orders/:id", async(req, res, next)=>{
        try{
            const id = req.params.id;
            const data = await service.FindById(id);

            return res.status(200).json(data);
        }catch(err){
            next(err);
        }
    });

    // Update Order
    app.put("/orders/:id", async(req, res, next)=>{
        try{
            const id = req.params.id;
            const { senderName, receiverName, items, paymentMethod, paymentStatus, paymentAmount, orderStatus } = req.body;

            const data = await service.UpdateOrder({id, senderName, receiverName, items, paymentMethod, paymentStatus, paymentAmount, orderStatus});

            return res.status(200).json({
                message : "Order has been updated successfully.",
                data : data
            })
        }catch(err){
            next(err);
        }
    });

    app.delete("/orders/:id", async(req, res, next)=>{
        try{
            const id = req.params.id;
            await service.DeleteOrder(id);

            return res.status(200).json({
                message : "Order has been deleted successfully."
            });
        }catch(err){
            next(err);
        }
    });
};

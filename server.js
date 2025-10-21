import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();


//middeleware
app.use(express.json());
app.use(cors());


//DB CONNECTION 
mongoose.connect("mongodb+srv://whyonlyhead_db_user:yFZssk6NHLeiYbr9@cluster0.abobqym.mongodb.net/flourmil?retryWrites=true&w=majority&appName=Cluster0").then(()=>{
  console.log("DB connected");
}).catch((err)=>{
  console.log("DB connection error:", err);
});


const orderSchema = new mongoose.Schema({
  name: String,
  phone: String,
  iscleaned: { type: Boolean, default: false },
  initialWeight: Number,
  finalWeight: { type: Number, default: 0 },
  paymentType: String, // "money" or "flour"
  totalBill: { type: Number, default: 0 },
  ataType: { type: String, default: "gandum" },
  status: { type: String, default: "pending" },
  date: { type: Date, default: Date.now },
});


const Order = mongoose.model("Order", orderSchema);





app.get("/", (req, res) => res.send("🌾 Flour Mill Backend Running"));

// Add new order
app.post("/order", async (req, res) => {
  try {
    const { name, phone, initialWeight, paymentType, status,totalBill,iscleaned } = req.body;

    const order = new Order({
      name,
      phone,
      initialWeight,
      paymentType,
      status,
      totalBill,
      iscleaned
    })
     
await order.save()
  
    res.json({ message: "✅ Order saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/allorders', async (req, res) => {
  try {
    const orders = await Order.find({},{_id:1,name:1}).sort({ date: -1 });

      res.json({ orders });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  );
  app.put("/updateorder/:id", async (req, res) => {
    try {
      const { finalWeight } = req.body;
        
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      order.finalWeight = finalWeight;
        
      await order.save();
      res.json({ message: "✅ Order updated successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  );
  app.get('/orderbyid/:id', async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json({ order });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  );

app.get('/searchorders/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const orders = await Order.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    },{_id:1,name:1,phone:1}).sort({ date: -1 });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
);


export default app

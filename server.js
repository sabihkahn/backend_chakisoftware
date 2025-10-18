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
  initialWeight: Number,
  finalWeight: { type: Number, default: 0 },
  paymentType: String, // "money" or "flour"
  status: { type: String, default: "pending" },
  date: { type: Date, default: Date.now },
});

const inventorySchema = new mongoose.Schema({
  totalFlour: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

const saleSchema = new mongoose.Schema({
  name: String,
  phone: String,
  soldKg: Number,
  totalAmount: Number,
  date: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);
const Inventory = mongoose.model("Inventory", inventorySchema);
const Sale = mongoose.model("Sale", saleSchema);




app.get("/", (req, res) => res.send("🌾 Flour Mill Backend Running"));

// Add new order
app.post("/order", async (req, res) => {
  try {
    const { name, phone, initialWeight, paymentType, status } = req.body;

    if (paymentType === "money") {
      await Order.create({ name, phone, initialWeight, paymentType, status });
    } else if (paymentType === "flour") {
      const flour = initialWeight * 0.03; // 3%
      const inv = await Inventory.findOne();
      inv.totalFlour += flour;
      inv.updatedAt = Date.now();
      await inv.save();
      await Order.create({ name, phone, initialWeight, paymentType, status });
    } else {
      await Order.create({ name, phone, initialWeight, paymentType, status });
    }

    res.json({ message: "✅ Order saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all pending orders
app.get("/orders/pending", async (req, res) => {
 try {
   const orders = await Order.find({ status: "pending" });
  res.json(orders);
 } catch (error) {
  console.log(error);
  res.status(500).send({message:"something happend in gettin oders with are pending"})
  
 }
});
app.get("/orders/completed", async (req, res) => {
  try {
    const orders = await Order.find({ status: "completed" });
  res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({message:"cant get completed oders"})
    
  }
});
// Confirm a pending order
app.put("/order/confirm/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = "completed";
    if (order.paymentType === "flour") {
      const flour = order.initialWeight * 0.03;
      const inv = await Inventory.findOne();
      inv.totalFlour += flour;
      inv.updatedAt = Date.now();
      await inv.save();
    }

    await order.save();
    res.json({ message: "✅ Order confirmed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put("/apifinal/:id", async (req, res) => {
  try {
    const { finalWeight } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.finalWeight = finalWeight;

    await order.save();

    res.json({
      message: "✅ Final weight updated successfully",
      finalWeight: order.finalWeight,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get inventory info
app.get("/api/inventory", async (req, res) => {
  const inv = await Inventory.findOne();
  const totalValue = inv.totalFlour * 300;
  res.json({
    totalFlour: inv.totalFlour.toFixed(2),
    totalValue: totalValue.toFixed(0),
    updatedAt: inv.updatedAt,
  });
});

// Record sale
app.post("/api/sale", async (req, res) => {
  try {
    const { name, phone, soldKg } = req.body;
    const inv = await Inventory.findOne();

    if (soldKg > inv.totalFlour)
      return res.status(400).json({ error: "Not enough flour in stock" });

    const totalAmount = soldKg * 62;
    inv.totalFlour -= soldKg;
    inv.updatedAt = Date.now();
    await inv.save();

    await Sale.create({ name, phone, soldKg, totalAmount });
    res.json({ message: "✅ Sale recorded successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sales
app.get("/api/sales", async (req, res) => {
  const sales = await Sale.find().sort({ date: -1 });
  res.json(sales);
});
app.get('/alldata', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
   

    res.json({ orders});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
);

export default app

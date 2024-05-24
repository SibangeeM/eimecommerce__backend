const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const dotenv = require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
const PORT = process.env.PORT || 8080;
//mongodb connection
console.log(process.env.MONGODB_URL);
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Connect to Databse"))
  .catch((err) => console.log(err));

//user schema
const userSchema = mongoose.Schema({
  image: String,
  name: String,
  email: {
    type: String,
    unique: true,
  },
  phone: String,
  address: String,
  apt: String,
  city: String,
  state: String,
  zipcode: String,
  isBusinessOwner: Boolean,
  selectedRole: String,
  businessName: String,
  businessType: String,
  licenseNumber: String,
  registeredAddress: String,
  companyName: String,
  servicableRegions: String,
  password: String,
  confirmPassword: String,
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
});
const userModel = mongoose.model("users", userSchema);

// order schema
const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    username: {
      type: String,
      required: true,
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "Paypal",
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
const orderModel = mongoose.model("Order", orderSchema);

app.post("/orders", async (req, res) => {
  const {
    user,
    username,
    orderItems,
    shippingAddress,
    shippingPrice,
    paymentMethod,
    totalPrice,
  } = req.body;
  try {
    const newOrder = new orderModel({
      user,
      username,
      orderItems,
      shippingAddress,
      paymentMethod,
      shippingPrice,
      totalPrice,
      isPaid: false,
      isDelivered: false,
    });

    const savedOrder = await newOrder.save();
    res.send({
      message: "Order placed successfully",
      alert: true,
      order: savedOrder,
    });
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).send({ message: "Failed to place order", alert: false });
  }
});

//api
app.get("/", (req, res) => {
  res.send("Server is running");
});

//signup api
app.post("/signup", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  try {
    const existingUser = await userModel.findOne({ email }).exec();

    if (existingUser) {
      res.send({ message: "Email id is already registered", alert: false });
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

      // Create a new user object with the hashed password
      const newUser = new userModel({
        ...req.body,
        password: hashedPassword,
      });

      // Save the user to the database
      const savedUser = await newUser.save();

      res.send({ message: "Successfully signed up", alert: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error", alert: false });
  }
});

//login api
const bcrypt = require("bcrypt");

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email }).exec();

  if (user) {
    // Compare passwords
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        // Handle error
        console.error("Error comparing passwords:", err);
        res.status(500).send({ message: "Internal Server Error" });
      } else if (result) {
        // Passwords match
        const dataSend = {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          image: user.image,
          apt: user.apt,
          city: user.city,
          state: user.state,
          zipcode: user.zipcode,
          isBusinessOwner: user.isBusinessOwner,
          selectedRole: user.selectedRole,
          businessName: user.businessName,
          businessType: user.businessType,
          licenseNumber: user.licenseNumber,
          registeredAddress: user.registeredAddress,
          companyName: user.companyName,
          servicableRegions: user.servicableRegions,
        };
        res.send({
          message: "Login is successful",
          alert: true,
          data: dataSend,
        });
      } else {
        // Passwords don't match
        res.send({
          message: "Invalid email or password",
          alert: false,
        });
      }
    });
  } else {
    // User not found
    res.send({
      message: "Email is not available, please sign up",
      alert: false,
    });
  }
});

//product section
const schemaProduct = mongoose.Schema({
  name: String,
  materials: String,
  materialName: String,
  image: String,
  pricePound: String,
  description: String,
});
const productModel = mongoose.model("product", schemaProduct);

app.get("/orders/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await orderModel.find({ user: userId }).exec();
    res.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).send({ message: "Failed to fetch orders" });
  }
});

//save product in data
//api

app.post("/uploadProduct", async (req, res) => {
  console.log(res);
  const data = await productModel(req.body);
  const datasave = await data.save();
  res.send({ message: "Upload successfully" });
});

app.get("/product", async (req, res) => {
  const data = await productModel.find({});
  res.send(JSON.stringify(data));
});

//server is ruuning
app.listen(PORT, () => console.log("server is running at port : " + PORT));

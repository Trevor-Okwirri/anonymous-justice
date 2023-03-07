const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoute = require("./routes/user");
const authRoute = require("./routes/auth");
const reportRoute = require("./routes/report");
const factRoute = require("./routes/fact");
const storiesRoute = require("./routes/story");
const chatRoute = require("./routes/chat");
// const cart = re
// const cartRoute = require("./routes/cart");
// const orderRoute = require("./routes/order");
// const stripeRoute = require("./routes/stripe");
const cors = require("cors");

dotenv.config();

mongoose
  .connect("mongodb+srv://trevorokwirri:trevor@1234@anonymous-justice.eppsouf.mongodb.net/?retryWrites=true&w=majority")
  .then(() => console.log("DB Connection Successfull!"))
  .catch((err) => {
    console.log(err);
  });

app.use(cors());
app.use(express.json());
app.use("/auth", authRoute);
app.use("/users", userRoute);
app.use("/reports", reportRoute);
app.use("/stories", storiesRoute);
app.use("/facts", factRoute);
app.use("/chats", chatRoute);
// app.use("/carts", cartRoute);
// app.use("/orders", orderRoute);
// app.use("/checkout", stripeRoute);
app.get("/", (req, res) => {
  res.send("Hello world")
})


app.listen(process.env.PORT ||5000, () => {
  console.log("Backend server is running!");
});

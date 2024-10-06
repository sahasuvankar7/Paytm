const express = require("express");
const app = express();
const cors = require("cors");
const rootRouter = require("./routes/index");
app.use(cors());
app.use(express.json());

app.use("/api/v1", rootRouter); // this routes defines that whatever router comes in if it is start with "/api/v1" , then the remaining routes will pass through this route to mainRouter.

const PORT = 8000;

app.listen(PORT, (req, res) => {
  console.log("backend is running", PORT);
});

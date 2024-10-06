const express = require("express");
const app = express();
const cors = require("cors");
const userRouter = require('./user');
const accountRouter = require('./account');
app.use(cors());
app.use(express.json());


const router = express.Router();
router.use('/user',userRouter);
router.use('/account',accountRouter);
// router.get("/", async (req, res, next) => {
//   console.log("router is working");
//   res.end();
// });

module.exports = router;


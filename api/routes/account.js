const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const {Account} = require("../db");
const { authMiddleware } = require("../middleware");

const transferFunds = async function (fromAccountId, toAccountId, amount) {
  // decrease the balance of fromAccount
  await Account.findByIdAndUpdate(fromAccountId, {
    $inc: { balance: -amount },
  });
  // increase the balance of toAccount
  await Account.findByIdAndUpdate(toAccountId, {
    $inc: { balance: amount },
  });
};

// get all the balance from database
router.get("/balance", authMiddleware, async (req, res) => {
  const account = await Account.findOne({
    userId: req.userId,
  });

  res.status(200).json({
    balance: account.balance,
  });
});

router.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();
  const { amount, to } = req.body;

  // Fetch the accounts withing the transaction
  const account = await Account.findOne({ userId: req.userId }).session(
    session
  );

  if (!account || account.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Insufficient balance" });
  }


  const toAccount = await Account.findOne({ userId: to }).session(session);

  if (!toAccount) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Invalid account" });
  }


  
  // Perform the transfer
  await Account.updateOne(
    { userId: req.userId },
    { $inc: { balance: -amount } }
  ).session(session);

  await Account.updateOne(
    { userId: to },
    { $inc: { balance: amount } }
  ).session(session);


  // Commit the transaction
  await session.commitTransaction();
  res.status(200).json({ message: "Transfer successful" });
});

module.exports = router;

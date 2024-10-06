const express = require("express");
const jwt = require("jsonwebtoken");
const zod = require("zod");
const { User ,Account} = require("../db");
const { JWT_SECRET } = require("../config");
const router = express.Router();

// user verification using zod

const signupBody = zod.object({
  username: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string().max(50),
});

const signinBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

const updateBody = zod.object({
  firstname: zod.string().optional(),
  lastname: zod.string().optional(),
  password: zod.string().optional(),
});

// user creation if user doesn't exit
router.post("/signup", async (req, res) => {
  try {
    const { success } = signupBody.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        message: "Invalid inputs",
      });
    }

    const existingUser = await User.findOne({
      username: req.body.username,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: req.body.password,
    });

    const userId = user._id;

    await Account.create({
      userId,
      balance: 1 + Math.random() * 1000,
    });

    const token = jwt.sign(
      {
        userId,
      },
      JWT_SECRET
    );

    res.status(201).json({
      message: "User created successfully",
      token: token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// logging up user
router.post("/signin", async (req, res, next) => {
  const { success } = signinBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({ message: "invalid inputs" });
  }

  try {
    const existingUser = await User.findOne({
      username: req.body.username,
      password: req.body.password,
    });

    if (!existingUser) {
      return res.status(404).json({ message: "user doesn't exist" });
    }
    if (existingUser) {
      const token = jwt.sign(
        {
          userId: existingUser._id,
        },
        JWT_SECRET
      );
      res.json({
        token: token,
      });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

// updating user

router.put("/update", async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Error while updating information",
    });
  }

  try {
    const updatedUser = await User.updateOne({
      _id: req.userId,
    });
    res.status(200).json({
      message: "updated Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "something internal fault",
    });
  }
});

// when user wants to find existing user by searching there name
router.get("/bulk", async (req, res) => {
  // filter the reponse part
  const filter = req.query.filter || "";

  // find username using first name or last name it doesnot matter

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.status(200).json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = router;

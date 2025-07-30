import User from "../models/User.js";
import Category from "../models/Category.js";
import { signToken } from "../utlis/auth.js";

     ///===Create new user===///
const createUser = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    const token =  signToken(newUser);
    ///==defualt category===//
    await Category.create({
      name: "Uncategorized",
      createdby: newUser._id,
    });
     res.status(201).json({ token, user: newUser })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
// POST /api/users/login - Authenticate a user and return a token
const loginUser = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
if (!user) {
    return res.status(400).json({ message: "Can't find this user" });
  }
const correctPw = await user.isCorrectPassword(req.body.password);
if (!correctPw) {
    return res.status(400).json({ message: "Wrong password!" });
  }
const token = signToken(user);
  res.json({ token, user });
};

export { createUser, loginUser };

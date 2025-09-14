import User from "../models/User.js";
import { signToken } from "../utlis/auth.js";
import Account from "../models/Account.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

     ///===Create new user===///
const createUser = async (req, res) => {
  try {
    const newUser = await User(req.body);
    newUser.role = 'user';
    //==temporarily assing dummy id so we can use it to create Account==//
    const tempUserId=newUser._id
    const newAccount =await Account.create({
      name:`${newUser.username}'s Account`,
      owner:tempUserId,
      collaborators:[],
      type:'personal'
    })
    newUser.account=newAccount._id
    await newUser.save()
    const token =  signToken(newUser);
  
   
     res.status(201).json({ token, user: newUser,account:newAccount })
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

 const getUsers = async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) throw new Error("accountId is required");

    await verifyAccountAccess(req.user._id, accountId, ["personal", "hotel"], "User");

    const users = await User.find({ account: accountId, isActive: true })
      .select('_id name email role');
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
 const createEmployee = async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can create employees" });
    }

    const { name, username, email, password, role } = req.body;
    if (!name || !username || !email || !password || !role) {
      throw new Error("name, username, email, password, and role are required");
    }

    const newEmployee = new User({
      account: req.user.account, // Under the same account as admin
      name,
      username,
      email,
      password, // Will be hashed in pre-save hook
      role,
      approvalLevel,
      createdBy: req.user._id,
      isActive: true,
    });
    await newEmployee.save();

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};
//Update user
export const updateEmployee = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can update employees" });
    }
    const { userId } = req.params;
    const { username, email, role, approvalLevel } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (approvalLevel !== undefined) updates.approvalLevel = approvalLevel;
    updates.updatedBy = req.user._id;
    const user = await User.findOneAndUpdate(
      { _id: userId, account: req.user.account, isActive: true },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};
export { createUser, loginUser,getUsers,createEmployee };

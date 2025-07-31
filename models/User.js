import {Schema,model} from 'mongoose'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Name is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
     required: [true, 'Email is required'],
    unique: true,
    match: [/.+@.+\..+/, 'Must use a valid email address'],
  },
  password: {
    type: String,
    minlength: 4,
    required: [true, 'Password is required'],

  },
  account: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Account',
  required: true,
},

},{timestamps:true});
 
// hash user password
userSchema.pre('save', async function (next) {
  if (this.password && (this.isNew || this.isModified('password'))) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
 
  next();
});
 
// custom method to compare and validate password for logging in
userSchema.methods.isCorrectPassword = async function (password) {
  return this.password? bcrypt.compare(password, this.password):false;
};
 
const User = model('User', userSchema);
 
export default  User;
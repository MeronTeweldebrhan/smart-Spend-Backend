import mongoose from 'mongoose'
import {Schema,model} from 'mongoose'

const categorySchema=new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    createdby:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
},{ timestamps: true })

const Category =model("Category",categorySchema)

export default Category
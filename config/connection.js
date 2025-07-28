import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const uri=process.env.MONGO_URI

const connection = async ()=>{
    try {
        await mongoose.connect(uri)
        console.log("Connected to MongoDB")
    } catch (error) {
        console.error(error)
    }
}


export default connection
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connection from './config/connection.js'
import userRoutes from './routes/userRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import accountRoutes from './routes/accountRoutes.js'

dotenv.config()
const app=express()

app.use(express.json())
const PORT = process.env.PORT || 3000
const PRODURL=process.env.PROD_URL ;
connection()
///==Cors Acess ==//
const allowedOrgins =[
    PRODURL,
    'http://localhost:5173'
]
app.use(cors({
    origin:function (origin,callback){
        console.log("Incoming origin:", origin); ////==>debug
        if(!origin || allowedOrgins.includes(origin)){
            callback(null,true)
        } else{
            callback(new Error('CORS not allowed from this orgin :'+orgin))
        }
    }
}))

///====ROUTES====///
app.use('/api/users',userRoutes)
app.use('/api/transaction',transactionRoutes)
app.use('/api/category',categoryRoutes)
app.use('/api/accounts',accountRoutes)


app.use('/',(req,res)=>{
    res.json('smartSpend is runinig ')
})


app.listen(PORT,()=>{
    console.log(`Server is runing on port :${PORT}`)
})
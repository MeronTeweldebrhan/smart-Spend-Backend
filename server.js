import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connection from './config/connection.js'
import userRoutes from './routes/userRoutes.js'
import accountRoutes from './routes/accountRoutes.js'
import journalRoutes from './routes/journalEntryRoutes.js'
import chartaccountRoutes from './routes/chartofAcoountRoutes.js'
import hotelRoutes from './routes/hotelRoutes.js'
import reportRoutes from './routes/reportsRoutes.js'
import storeRoutes from './routes/storeRoutes.js'
import vendorRoutes from './routes/vendorRoutes.js'
import DepartmentRoutes from './routes/DepartmentRoutes.js'
dotenv.config()
const app=express()

app.use(express.json())
const PORT = process.env.PORT || 3000
const PRODURL=process.env.PROD_URL ;
connection()
///==Cors Acess ==//
const allowedOrgins =[
    PRODURL,
    'http://localhost:5173','http://localhost:5174'
]
app.use(cors({
    origin:function (origin,callback){
        console.log("Incoming origin:", origin); ////==>debug
        if(!origin || allowedOrgins.includes(origin)){
            callback(null,true)
        } else{
            callback(new Error('CORS not allowed from this orgin :'+origin))
        }
    }
}))

///====ROUTES====///
app.use('/api/users',userRoutes)
app.use('/api/accounts',accountRoutes)
app.use('/api/journals',journalRoutes)
app.use('/api/chartofaccounts',chartaccountRoutes)
app.use('/api/hotel',hotelRoutes)
app.use('/api/reports',reportRoutes)
app.use('/api/store',storeRoutes)
app.use('/api/vendor',vendorRoutes)
app.use('/api/departments',DepartmentRoutes)

app.use('/',(req,res)=>{
    res.json('smartSpend is runinig ')
})


app.listen(PORT,()=>{
    console.log(`Server is runing on port :${PORT}`)
})
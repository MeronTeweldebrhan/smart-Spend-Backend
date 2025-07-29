import express from 'express'
import dotenv from 'dotenv'
import connection from './config/connection.js'
import userRoutes from './routes/userRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'

dotenv.config()
const app=express()

app.use(express.json())
const PORT = process.env.PORT || 3000
connection()

///====ROUTES====///
app.use('/api/users',userRoutes)
app.use('/api/transaction',transactionRoutes)
app.use('/api/category',categoryRoutes)


// app.use('/',(req,res)=>{
//     res.json('smartSpend is runinig ')
// })


app.listen(PORT,()=>{
    console.log(`Server is runing on port :${PORT}`)
})
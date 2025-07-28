import express from 'express'
import dotenv from 'dotenv'
import connection from './config/connection'
import userRoutes from './routes/userRoutes.js'

dotenv.config()
const app=express()

app.use(express.json())
const PORT = process.env.PORT || 3000
connection()

//====ROUTES====///

//===User====///

app.use('/api/users',userRoutes)

app.use('/',(req,res)=>{
    res.json('smartSpend is runinig ')
})


app.listen(PORT,()=>{
    console.log(`Server is runing on port :${PORT}`)
})
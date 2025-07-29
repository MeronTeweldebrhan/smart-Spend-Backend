import { creatTransaction,getTransactions,updatetransaction,deleteTransaction,gettransactionbyID } from "../controllers/TransactionController.js";
import express from 'express'
import { authMiddleware } from "../utlis/auth.js";

const router=express.Router()

router.use(authMiddleware)
router.post('/',creatTransaction)
router.get('/',getTransactions)
router.put('/:id',updatetransaction)
router.delete('/:id',deleteTransaction)
router.get('/:id',gettransactionbyID)



export default router
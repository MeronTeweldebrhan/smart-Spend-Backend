import express from 'express'
import { createUser,loginUser,getUsers,createEmployee,updateEmployee } from '../controllers/userController.js'
const router =express.Router()


router.post('/register', createUser)
router.post('/login',loginUser)
router.get('/', getUsers);
router.post('/employees', createEmployee);
router.put('/employees/:userId', updateEmployee);

export default router
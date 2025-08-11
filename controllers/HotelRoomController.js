import HotelRoom from "../models/HotelRoom.js";
import { verifyAccountAccess } from "../utlis/verifyOwnership.js";

///=== Create Room ===///
const createRoom = async (req, res) => {
    try {
        const { roomNumber, accountId } = req.body;
        const userId = req.user._id;

        // Check for existing room with the same number
        const existingRoom = await HotelRoom.findOne({
            roomNumber: roomNumber.trim(),
            account: accountId,
        });

        if (existingRoom) {
            return res.status(409).json({ message: `Room number '${roomNumber}' already exists.` });
        }

        // Verify user has access to the account
        await verifyAccountAccess(userId, accountId, 'hotel', 'rooms');

        const room = await HotelRoom.create({
            ...req.body,
            roomNumber: roomNumber.trim(),
            createdBy: userId,
            account: accountId,
        });

        const populatedRoom = await HotelRoom.findById(room._id)
            .populate("createdBy", "username")
            .populate("account", "name");

        res.status(201).json(populatedRoom);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};

///=== Get All Rooms for an Account ===///
const getRooms = async (req, res) => {
    try {
        const accountId = req.params.accountId;
        const userId = req.user._id;

        // Verify user has access to the account
        await verifyAccountAccess(userId, accountId, 'hotel', 'rooms');

        const rooms = await HotelRoom.find({ account: accountId })
            .populate("createdBy", "username");

        res.json(rooms);
    } catch (error) {
        console.error(error.message);
        res.status(404).json({ message: error.message });
    }
};

///=== Get Single Room by ID ===///
const getRoomById = async (req, res) => {
    try {
        const { id: roomId } = req.params;
        const userId = req.user._id;
        
        const room = await HotelRoom.findById(roomId);

        if (!room) {
            throw new Error("Room not found");
        }

        // Verify user has access to the room's account
        await verifyAccountAccess(userId, accountId, 'hotel', 'rooms');

        const populatedRoom = await HotelRoom.findById(roomId)
            .populate("createdBy", "username")
            .populate("account", "name");

        res.json(populatedRoom);
    } catch (error) {
        console.error(error.message);
        res.status(404).json({ message: error.message });
    }
};

///=== Update Room ===///
const updateRoom = async (req, res) => {
    try {
        const { id: roomId } = req.params;
        const userId = req.user._id;
        
        const room = await HotelRoom.findById(roomId);

        if (!room) {
            throw new Error("Room not found");
        }

        // Verify user has access to the room's account
        await verifyAccountAccess(userId, accountId, 'hotel', 'rooms');

        const updatedRoom = await HotelRoom.findByIdAndUpdate(roomId, req.body, {
            new: true, // Return the updated document
        })
        .populate("createdBy", "username")
        .populate("account", "name");

        res.json(updatedRoom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

///=== Delete Room ===///
const deleteRoom = async (req, res) => {
    try {
        const { id: roomId } = req.params;
        const userId = req.user._id;

        const room = await HotelRoom.findById(roomId);
        if (!room) {
            throw new Error("Room not found");
        }

        // Verify user has access to the room's account
        await verifyAccountAccess(userId, accountId, 'hotel', 'rooms');

        await HotelRoom.findByIdAndDelete(roomId);

        res.json({ message: "Room deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export { createRoom, getRooms, getRoomById, updateRoom, deleteRoom };

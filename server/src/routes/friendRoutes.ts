import express from "express";
 import {
   sendFriendRequest,
   getFriendRequests,
   acceptFriendRequest,
   rejectFriendRequest,
   cancelFriendRequest,
   getFriends,
   removeFriend,
 } from "../controllers/friendController";
 import { protect } from "../middlewares/authMiddleware";
 
 const router = express.Router();
 
 router.use(protect);
 
 router.post("/requests", sendFriendRequest);
 router.get("/requests", getFriendRequests);
 router.patch("/requests/:id/accept", acceptFriendRequest);
 router.patch("/requests/:id/reject", rejectFriendRequest);
 router.delete("/requests/:id", cancelFriendRequest);
 
 router.get("/", getFriends);
 router.delete("/:id", removeFriend);
 
 export default router;
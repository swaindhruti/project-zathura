import { Request, Response, NextFunction } from "express";
 import { PrismaClient } from "@prisma/client";
 import { z } from "zod";
 
 const prisma = new PrismaClient();
 
 // Validation schemas
 const friendRequestSchema = z.object({
   receiverId: z.string().uuid("Invalid receiver ID format"),
 });
 
 export const sendFriendRequest = async (
   req: Request,
   res: Response,
   next: NextFunction
 ) => {
   try {
     const { receiverId } = friendRequestSchema.parse(req.body);
     const senderId = req.user?.id;
 
     if (!senderId) {
       return next(console.log("User ID not found", 401));
     }
 
     if (senderId === receiverId) {
       return next(
         console.log("You cannot send a friend request to yourself", 400)
       );
     }
 
     const receiver = await prisma.user.findUnique({
       where: { id: receiverId },
     });
 
     if (!receiver) {
       return next(console.log("Receiver not found", 404));
     }
 
     const existingRequest = await prisma.friendRequest.findUnique({
       where: {
         senderId_receiverId: {
           senderId,
           receiverId,
         },
       },
     });
 
     if (existingRequest) {
       return next(console.log("Friend request already sent", 400));
     }
 
     const reverseRequest = await prisma.friendRequest.findUnique({
       where: {
         senderId_receiverId: {
           senderId: receiverId,
           receiverId: senderId,
         },
       },
     });
 
     if (reverseRequest) {
       return next(
         console.log("You already have a pending request from this user", 400)
       );
     }
 
     const existingFriendship = await prisma.friendship.findFirst({
       where: {
         OR: [
           { userId: senderId, friendId: receiverId },
           { userId: receiverId, friendId: senderId },
         ],
       },
     });
 
     if (existingFriendship) {
       return next(console.log("You are already friends with this user", 400));
     }
 
     const friendRequest = await prisma.friendRequest.create({
       data: {
         senderId,
         receiverId,
         status: "PENDING",
       },
     });
 
     res.status(201).json({
       status: "success",
       data: {
         friendRequest,
       },
     });
   } catch (error) {
     next(error);
   }
 };
 
 export const getFriendRequests = async (
   req: Request,
   res: Response,
   next: NextFunction
 ) => {
   try {
     const userId = req.user?.id;
 
     if (!userId) {
       return next(console.log("User ID not found", 401));
     }
 
     const sentRequests = await prisma.friendRequest.findMany({
       where: { senderId: userId },
       include: {
         receiver: {
           select: {
             id: true,
             username: true,
             firstName: true,
             lastName: true,
           },
         },
       },
     });
 
     const receivedRequests = await prisma.friendRequest.findMany({
       where: { receiverId: userId },
       include: {
         sender: {
           select: {
             id: true,
             username: true,
             firstName: true,
             lastName: true,
           },
         },
       },
     });
 
     res.status(200).json({
       status: "success",
       data: {
         sent: sentRequests,
         received: receivedRequests,
       },
     });
   } catch (error) {
     next(error);
   }
 };
 
 export const acceptFriendRequest = async (
   req: Request,
   res: Response,
   next: NextFunction
 ) => {
   try {
     const { id } = req.params;
     const userId = req.user?.id;
 
     if (!userId) {
       return next(console.log("User ID not found", 401));
     }
 
     const friendRequest = await prisma.friendRequest.findFirst({
       where: {
         id,
         receiverId: userId,
         status: "PENDING",
       },
     });
 
     if (!friendRequest) {
       return next(
         console.log("Friend request not found or already processed", 404)
       );
     }
 
     await prisma.friendRequest.update({
       where: { id },
       data: { status: "ACCEPTED" },
     });
 
     await prisma.friendship.createMany({
       data: [
         { userId, friendId: friendRequest.senderId },
         { userId: friendRequest.senderId, friendId: userId },
       ],
     });
 
     res.status(200).json({
       status: "success",
       message: "Friend request accepted",
     });
   } catch (error) {
     next(error);
   }
 };
 
 export const rejectFriendRequest = async (
   req: Request,
   res: Response,
   next: NextFunction
 ) => {
   try {
     const { id } = req.params;
     const userId = req.user?.id;
 
     if (!userId) {
       return next(console.log("User ID not found", 401));
     }
 
     const friendRequest = await prisma.friendRequest.findFirst({
       where: {
         id,
         receiverId: userId,
         status: "PENDING",
       },
     });
 
     if (!friendRequest) {
       return next(
         console.log("Friend request not found or already processed", 404)
       );
     }
 
     await prisma.friendRequest.update({
       where: { id },
       data: { status: "REJECTED" },
     });
 
     res.status(200).json({
       status: "success",
       message: "Friend request rejected",
     });
   } catch (error) {
     next(error);
   }
 };
 
 export const cancelFriendRequest = async (
   req: Request,
   res: Response,
   next: NextFunction
 ) => {
   try {
     const { id } = req.params;
     const userId = req.user?.id;
 
     if (!userId) {
       return next(console.log("User ID not found", 401));
     }
 
     const friendRequest = await prisma.friendRequest.findFirst({
       where: {
         id,
         senderId: userId,
         status: "PENDING",
       },
     });
 
     if (!friendRequest) {
       return next(console.log("Friend request not found", 404));
     }
 
     await prisma.friendRequest.delete({
       where: { id },
     });
 
     res.status(200).json({
       status: "success",
       message: "Friend request cancelled",
     });
   } catch (error) {
     next(error);
   }
 };
 
 export const getFriends = async (
   req: Request,
   res: Response,
   next: NextFunction
 ) => {
   try {
     const userId = req.user?.id;
 
     if (!userId) {
       return next(console.log("User ID not found", 401));
     }
 
     const friendships = await prisma.friendship.findMany({
       where: { userId },
       include: {
         friend: {
           select: {
             id: true,
             username: true,
             firstName: true,
             lastName: true,
           },
         },
       },
     });
 
     const friends = friendships.map((friendship) => friendship.friend);
 
     res.status(200).json({
       status: "success",
       data: {
         friends,
       },
     });
   } catch (error) {
     next(error);
   }
 };
 
 export const removeFriend = async (
   req: Request,
   res: Response,
   next: NextFunction
 ) => {
   try {
     const { id: friendId } = req.params;
     const userId = req.user?.id;
 
     if (!userId) {
       return next(console.log("User ID not found", 401));
     }
 
     await prisma.friendship.deleteMany({
       where: {
         OR: [
           { userId, friendId },
           { userId: friendId, friendId: userId },
         ],
       },
     });
 
     res.status(200).json({
       status: "success",
       message: "Friend removed successfully",
     });
   } catch (error) {
     next(error);
   }
 };
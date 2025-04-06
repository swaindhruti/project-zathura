import { HectocService } from "@/services/hectocService";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
interface Puzzle {
    questionId: string; // Frontend expects questionId, not id
    digits: number[];
    solution: string;
    targetNumber?: number;
}
interface Player {
    id: string;
    username: string;
    score: number;
    currentPuzzleIndex: number;
    isFinished: boolean;
    socketId?: string; // Track the socket ID
}

interface GameRoom {
    id: string;
    players: Player[];
    puzzles: any[];
    difficulty: string;
    startTime: Date;
    isActive: boolean;
}

interface OnlinePlayer {
    id: string;
    username: string;
    difficulty: string | null;
    socketId: string;
    status: "available" | "playing" | "away";
}

// Store active games
const activeGames: Map<string, GameRoom> = new Map();

// Store online players
const onlinePlayers: Map<string, OnlinePlayer> = new Map();

// Store pending game invitations
const pendingInvitations: Map<
    string,
    {
        from: OnlinePlayer;
        to: OnlinePlayer;
        difficulty: string;
        timestamp: Date;
    }
> = new Map();

export const initializeGameController = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log(`Game socket connected: ${socket.id}`);

        // Player announces themselves as online
        socket.on(
            "playerOnline",
            ({
                player,
                difficulty,
            }: {
                player: Player;
                difficulty: string | null;
            }) => {
                console.log(`Player ${player.username} is now online`);

                // Add or update player in online players list
                const onlinePlayer: OnlinePlayer = {
                    id: player.id,
                    username: player.username,
                    difficulty: difficulty,
                    socketId: socket.id,
                    status: "available",
                };

                onlinePlayers.set(player.id, onlinePlayer);

                // Associate socket ID with player ID for easy lookup
                socket.data.playerId = player.id;

                // Broadcast updated player list to everyone
                broadcastOnlinePlayers(io);
            }
        );

        // Player requests online players list
        socket.on("getOnlinePlayers", () => {
            // Convert Map to array for easy transmission
            const playersList = Array.from(onlinePlayers.values()).filter(
                (p) => p.socketId !== socket.id && p.status === "available"
            );

            socket.emit("onlinePlayersList", playersList);
        });

        // Player invites another player
        socket.on(
            "invitePlayer",
            ({
                fromPlayer,
                toPlayerId,
                difficulty,
            }: {
                fromPlayer: Player;
                toPlayerId: string;
                difficulty: string;
            }) => {
                const toPlayer = onlinePlayers.get(toPlayerId);

                if (!toPlayer) {
                    socket.emit("invitationError", {
                        message: "Player is no longer available",
                    });
                    return;
                }

                if (toPlayer.status !== "available") {
                    socket.emit("invitationError", {
                        message: "Player is currently unavailable",
                    });
                    return;
                }

                // Generate invitation ID
                const invitationId = uuidv4();

                // Store the invitation
                pendingInvitations.set(invitationId, {
                    from: onlinePlayers.get(fromPlayer.id)!,
                    to: toPlayer,
                    difficulty,
                    timestamp: new Date(),
                });

                // Send invitation to the recipient
                io.to(toPlayer.socketId).emit("gameInvitation", {
                    invitationId,
                    fromPlayer: {
                        id: fromPlayer.id,
                        username: fromPlayer.username,
                    },
                    difficulty,
                });

                socket.emit("invitationSent", {
                    invitationId,
                    toPlayer: toPlayer.username,
                });

                // Set timeout to auto-reject invitation after 30 seconds
                setTimeout(() => {
                    const invitation = pendingInvitations.get(invitationId);
                    if (invitation) {
                        pendingInvitations.delete(invitationId);
                        io.to(invitation.from.socketId).emit(
                            "invitationExpired",
                            {
                                invitationId,
                                toPlayer: invitation.to.username,
                            }
                        );
                    }
                }, 30000);
            }
        );

        // Player responds to invitation
        socket.on(
            "respondToInvitation",
            async ({
                invitationId,
                accept,
            }: {
                invitationId: string;
                accept: boolean;
            }) => {
                const invitation = pendingInvitations.get(invitationId);

                if (!invitation) {
                    socket.emit("invitationError", {
                        message: "Invitation no longer exists",
                    });
                    return;
                }

                // Remove the invitation
                pendingInvitations.delete(invitationId);

                if (!accept) {
                    // Notify sender that invitation was declined
                    io.to(invitation.from.socketId).emit("invitationDeclined", {
                        invitationId,
                        playerName: invitation.to.username,
                    });
                    return;
                }

                // Create a new game
                const roomId = uuidv4();

                // Generate puzzles for the game
                const puzzles = await generatePuzzles(invitation.difficulty);

                // Create player objects for the game
                const player1: Player = {
                    id: invitation.from.id,
                    username: invitation.from.username,
                    score: 0,
                    currentPuzzleIndex: 0,
                    isFinished: false,
                    socketId: invitation.from.socketId,
                };

                const player2: Player = {
                    id: invitation.to.id,
                    username: invitation.to.username,
                    score: 0,
                    currentPuzzleIndex: 0,
                    isFinished: false,
                    socketId: invitation.to.socketId,
                };

                // Create the game room
                const gameRoom: GameRoom = {
                    id: roomId,
                    players: [player1, player2],
                    puzzles,
                    difficulty: invitation.difficulty,
                    startTime: new Date(),
                    isActive: true,
                };

                // Store the active game
                activeGames.set(roomId, gameRoom);

                // Update player statuses
                if (onlinePlayers.has(player1.id)) {
                    onlinePlayers.get(player1.id)!.status = "playing";
                }

                if (onlinePlayers.has(player2.id)) {
                    onlinePlayers.get(player2.id)!.status = "playing";
                }

                // Broadcast updated player list
                broadcastOnlinePlayers(io);

                // Notify both players that the game is starting
                io.to(invitation.from.socketId).emit("matchFound", {
                    roomId,
                    players: gameRoom.players,
                    puzzles,
                });

                io.to(invitation.to.socketId).emit("matchFound", {
                    roomId,
                    players: gameRoom.players,
                    puzzles,
                });
            }
        );

        // Player updates progress - same as before
        socket.on(
            "updateProgress",
            ({ roomId, player }: { roomId: string; player: Player }) => {
                const gameRoom = activeGames.get(roomId);

                if (gameRoom) {
                    // Update player data in the game room
                    gameRoom.players = gameRoom.players.map((p) =>
                        p.id === player.id ? player : p
                    );

                    // Broadcast progress to all players in the room
                    socket.to(roomId).emit("opponentProgress", {
                        playerId: player.id,
                        currentPuzzleIndex: player.currentPuzzleIndex,
                        score: player.score,
                        isFinished: player.isFinished,
                    });
                }
            }
        );

        // Player finished all puzzles - same as before
        socket.on(
            "playerFinished",
            ({ roomId, player }: { roomId: string; player: Player }) => {
                const gameRoom = activeGames.get(roomId);

                if (gameRoom) {
                    // Update player status
                    gameRoom.players = gameRoom.players.map((p) =>
                        p.id === player.id ? { ...player, isFinished: true } : p
                    );

                    // Check if all players finished or if one player finished all puzzles
                    const allFinished = gameRoom.players.every(
                        (p) => p.isFinished
                    );
                    const someoneFinishedAll = gameRoom.players.some(
                        (p) =>
                            p.isFinished &&
                            p.currentPuzzleIndex >= gameRoom.puzzles.length
                    );

                    // Broadcast progress update
                    socket.to(roomId).emit("opponentProgress", {
                        playerId: player.id,
                        currentPuzzleIndex: player.currentPuzzleIndex,
                        score: player.score,
                        isFinished: true,
                    });

                    // If game should end (all finished or someone completed all puzzles)
                    if (allFinished || someoneFinishedAll) {
                        // Find the winner (highest score)
                        let winner = gameRoom.players[0];
                        for (const p of gameRoom.players) {
                            if (p.score > winner.score) {
                                winner = p;
                            }
                        }

                        // End the game
                        gameRoom.isActive = false;

                        // Update player statuses back to available
                        for (const p of gameRoom.players) {
                            if (onlinePlayers.has(p.id)) {
                                onlinePlayers.get(p.id)!.status = "available";
                            }
                        }

                        // Broadcast updated player list
                        broadcastOnlinePlayers(io);

                        // Notify all players about the result
                        io.to(roomId).emit("gameEnded", {
                            winnerId: winner.id,
                            players: gameRoom.players,
                        });

                        // Remove the game after some time
                        setTimeout(() => {
                            activeGames.delete(roomId);
                        }, 60000); // Keep game data for 1 minute
                    }
                }
            }
        );

        // Player changes status
        socket.on(
            "setPlayerStatus",
            ({ status }: { status: "available" | "playing" | "away" }) => {
                const playerId = socket.data.playerId;

                if (playerId && onlinePlayers.has(playerId)) {
                    onlinePlayers.get(playerId)!.status = status;
                    broadcastOnlinePlayers(io);
                }
            }
        );

        // Clean up when socket disconnects
        socket.on("disconnect", () => {
            const playerId = socket.data.playerId;

            if (playerId) {
                console.log(`Player ${playerId} disconnected`);

                // Remove from online players list
                onlinePlayers.delete(playerId);

                // Broadcast updated player list
                broadcastOnlinePlayers(io);

                // Find and handle any active games this player was part of
                for (const [roomId, game] of activeGames.entries()) {
                    const playerInGame = game.players.find(
                        (p) => p.id === playerId
                    );

                    if (playerInGame && game.isActive) {
                        // Notify other players
                        socket.to(roomId).emit("playerLeft", {
                            playerId: playerInGame.id,
                            username: playerInGame.username,
                        });

                        // End the game
                        game.isActive = false;

                        // Find the other player to make them the winner
                        const otherPlayers = game.players.filter(
                            (p) => p.id !== playerInGame.id
                        );

                        if (otherPlayers.length > 0) {
                            io.to(roomId).emit("gameEnded", {
                                winnerId: otherPlayers[0].id,
                                players: game.players,
                                reason: "opponent_disconnected",
                            });

                            // Update remaining players' status
                            for (const p of otherPlayers) {
                                if (onlinePlayers.has(p.id)) {
                                    onlinePlayers.get(p.id)!.status =
                                        "available";
                                }
                            }
                        }
                    }
                }

                // Cancel any pending invitations
                for (const [
                    invitationId,
                    invitation,
                ] of pendingInvitations.entries()) {
                    if (
                        invitation.from.id === playerId ||
                        invitation.to.id === playerId
                    ) {
                        pendingInvitations.delete(invitationId);

                        // Notify the other player if they're still online
                        const otherPlayerId =
                            invitation.from.id === playerId
                                ? invitation.to.id
                                : invitation.from.id;
                        const otherPlayer = onlinePlayers.get(otherPlayerId);

                        if (otherPlayer) {
                            io.to(otherPlayer.socketId).emit(
                                "invitationCancelled",
                                {
                                    invitationId,
                                    reason: "Player disconnected",
                                }
                            );
                        }
                    }
                }
            }
        });
    });
};

// Helper function to broadcast online players to everyone
function broadcastOnlinePlayers(io: Server) {
    const playersList = Array.from(onlinePlayers.values());
    io.emit("onlinePlayersList", playersList);
}
const hectoc = new HectocService();
// Helper function to generate puzzles based on difficulty
async function generatePuzzles(difficulty: string): Promise<Puzzle[]> {
    // Get puzzles from service
    const rawPuzzles = await hectoc.generatePuzzle(difficulty);

    // Transform puzzles to the format expected by frontend
    const formattedPuzzles = rawPuzzles.map((puzzle) => ({
        questionId: puzzle.questionId, // Using questionId directly instead of mapping id to questionId
        digits: puzzle.digits,
        solution: puzzle.solution,
        targetNumber: 100, // Assuming the target is always 100 for Hectoc puzzles
    }));

    return formattedPuzzles;
}

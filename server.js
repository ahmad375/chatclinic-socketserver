// const { createServer } = require("http");
// const { Server } = require("socket.io");

// // Create an HTTP server
// const httpServer = createServer((req, res) => {
//   res.writeHead(200, {'Content-Type': 'text/plain'});
//   res.end('Hello World!');
// });
// // const httpServer = createServer();

// // Create a new instance of socket.io server by passing the HTTP server
// const io = new Server(httpServer, {
//   cors: {
//       origin: "*",
//       // origin: ["http://localhost:3000", "https://www.chatwizard.com"],
//       methods: ["GET", "POST"]
//     }
// });

// const supports = new Map();
// const visitors = new Map();
// const supportIdsToSockets = new Map();
// const visitorIdsToSockets = new Map();

// // Event handler for new connections
// io.on("connection", (socket) => {
//   console.log("A user connected");

//   socket.on("identify", (userType, userId) => {
//     if (userType === "support") {
//       supports.set(socket.id, userId); // Store the admin's socket id and adminId in the admins map
//       supportIdsToSockets.set(userId, socket); // Associate the adminId with the socket instance
//     } else if (userType === "visitor") {
//       visitors.set(socket.id, userId); // Store the client's socket id and clientId in the clients map
//       visitorIdsToSockets.set(userId, socket); // Associate the adminId with the socket instance
//     }
//   });

//   socket.on("message", ({ from, fromId, message, toId }) => {
//     console.log('======messageContent======', message)
//     if (from === "support" && supportIdsToSockets.has(fromId)) {
//       visitorIdsToSockets.get(toId).emit("message", { fromId, message });
//     } else if (from === "visitor" && visitorIdsToSockets.has(fromId)) {
//       supportIdsToSockets.get(toId).emit("message", { fromId, message });
//     }
//   });

//   socket.on("newVisitor", ({fromId, toId}) => {
//     supportIdsToSockets.get(toId).emit("newVisitor", { thread: fromId });
//   })

//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//     if (supports.has(socket.id)) {
//       const supportId = supports.get(socket.id);
//       supports.delete(socket.id);
//       supportIdsToSockets.delete(supportId);
//     } else if (visitors.has(socket.id)) {
//       const visitorId = visitors.get(socket.id);
//       visitors.delete(socket.id);
//       visitorIdsToSockets.delete(visitorId);
//     }
//   });
// });

// //So much stressful!
// const PORT = process.env.PORT || 5000;
// httpServer.listen(PORT, () => {
//   console.log("Socket.IO server is listening on port:5000");
// });


const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World!');
});

const io = new Server(httpServer, {
  cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
});

const supports = new Map(); // Map of support user IDs to an array of socket instances
const visitors = new Map(); // Map of visitor user IDs to an array of socket instances

// Event handler for new connections
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("identify", (userType, userId) => {
    if (userType === "support") {
      if (!supports.has(userId)) {
        supports.set(userId, []);
      }
      supports.get(userId).push(socket); // Add the socket instance to the array
    } else if (userType === "visitor") {
      if (!visitors.has(userId)) {
        visitors.set(userId, []);
      }
      visitors.get(userId).push(socket); // Add the socket instance to the array
    }
  });

  socket.on("message", ({ from, fromId, message, toId }) => {
    console.log('======messageContent======', message)
    if (from === "support" && supports.has(fromId)) {
      // supports.get(fromId).forEach((supportSocket) => {
        visitors.get(toId).forEach((visitorSocket) => {
          visitorSocket.emit("message", { fromId, message });
        });
      // });
    } else if (from === "visitor" && visitors.has(fromId)) {
      // visitors.get(fromId).forEach((visitorSocket) => {
        supports.get(toId).forEach((supportSocket) => {
          supportSocket.emit("message", { fromId, message });
        });
      // });
    }
  });

  socket.on("newVisitor", ({fromId, toId}) => {
    supports.get(toId).forEach((supportSocket) => {
      supportSocket.emit("newVisitor", { thread: fromId });
    });
  })

  socket.on("disconnect", () => {
    console.log("User disconnected");
    // Remove the disconnected socket instance from the respective arrays
    for (const [userId, sockets] of supports.entries()) {
      const index = sockets.indexOf(socket);
      if (index !== -1) {
        sockets.splice(index, 1);
      }
    }
    for (const [userId, sockets] of visitors.entries()) {
      const index = sockets.indexOf(socket);
      if (index !== -1) {
        sockets.splice(index, 1);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log("Socket.IO server is listening on port:5000");
});

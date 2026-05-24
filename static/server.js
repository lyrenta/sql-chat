const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const { Server } = require("socket.io");
const url = require("url");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "chat"
});

connection.connect();

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);

    // STATIC FILES
    if (req.url === "/" || req.url === "/index.html") {
        return sendFile(res, "index.html", "text/html");
    }
    if (req.url === "/style.css") {
        return sendFile(res, "style.css", "text/css");
    }
    if (req.url === "/script.js") {
        return sendFile(res, "script.js", "text/javascript");
    }

    // REGISTER
    if (req.url === "/register" && req.method === "POST") {
        return readBody(req, (body) => {
            const { login, password } = JSON.parse(body);

            connection.query(
                "INSERT INTO user (login, password) VALUES (?, ?)",
                [login, password],
                (err) => {
                    if (err) return sendJSON(res, { error: err.message });
                    sendJSON(res, { success: true });
                }
            );
        });
    }

    // LOGIN
    if (req.url === "/login" && req.method === "POST") {
        return readBody(req, (body) => {
            const { login, password } = JSON.parse(body);

            connection.query(
                "SELECT * FROM user WHERE login=? AND password=?",
                [login, password],
                (err, results) => {
                    if (err) return sendJSON(res, { error: err.message });
                    if (results.length === 0) return sendJSON(res, { error: "Invalid" });

                    sendJSON(res, { success: true, user: results[0] });
                }
            );
        });
    }

    // USERS LIST
    if (req.url === "/users") {
        connection.query("SELECT id, login FROM user", (err, results) => {
            if (err) return sendJSON(res, { error: err.message });
            sendJSON(res, results);
        });
        return;
    }

    // GET DIALOGS
    if (parsed.pathname === "/dialogs") {
        const userId = parsed.query.userId;

        connection.query(
            `SELECT * FROM dialog 
             WHERE first_user_id=? OR second_user_id=?`,
            [userId, userId],
            (err, results) => {
                if (err) return sendJSON(res, { error: err.message });
                sendJSON(res, results);
            }
        );
        return;
    }

    // CREATE OR GET DIALOG
    if (req.url === "/dialog" && req.method === "POST") {
        return readBody(req, (body) => {
            const { user1, user2 } = JSON.parse(body);

            connection.query(
                `SELECT * FROM dialog 
                 WHERE (first_user_id=? AND second_user_id=?)
                 OR (first_user_id=? AND second_user_id=?)`,
                [user1, user2, user2, user1],
                (err, results) => {
                    if (results.length > 0) {
                        return sendJSON(res, results[0]);
                    }

                    connection.query(
                        "INSERT INTO dialog (first_user_id, second_user_id) VALUES (?, ?)",
                        [user1, user2],
                        (err2, result) => {
                            if (err2) return sendJSON(res, { error: err2.message });

                            sendJSON(res, {
                                id: result.insertId,
                                first_user_id: user1,
                                second_user_id: user2
                            });
                        }
                    );
                }
            );
        });
    }

    // GET MESSAGES
    if (parsed.pathname === "/messages") {
        const dialogId = parsed.query.dialogId;

        connection.query(
            "SELECT * FROM message WHERE dialog_id=?",
            [dialogId],
            (err, results) => {
                if (err) return sendJSON(res, { error: err.message });
                sendJSON(res, results);
            }
        );
        return;
    }

    res.writeHead(404);
    res.end("Not found");
});

const io = new Server(server);

io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("sendMessage", (data) => {
        const { content, author_id, dialog_id } = data;

        connection.query(
            "INSERT INTO message (content, author_id, dialog_id) VALUES (?, ?, ?)",
            [content, author_id, dialog_id],
            (err, result) => {
                if (err) return;

                io.emit("newMessage", {
                    id: result.insertId,
                    content,
                    author_id,
                    dialog_id
                });
            }
        );
    });
});

// HELPERS
function sendFile(res, file, type) {
    const filePath = path.join(__dirname, file);
    res.writeHead(200, { "Content-Type": type });
    res.end(fs.readFileSync(filePath));
}

function sendJSON(res, data) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

function readBody(req, cb) {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => cb(body));
}

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
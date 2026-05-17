const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "chat"
});

connection.connect((err) => {

    if (err) {
        console.log("Database error:", err);
    } else {
        console.log("MySQL connected!");
    }
});

const server = http.createServer((req, res) => {

    if (req.url === '/') {

        const file = fs.readFileSync(
            path.join(__dirname, 'static', 'index.html')
        );

        res.setHeader('Content-Type', 'text/html');

        return res.end(file);
    }

    if (req.url === '/style.css') {

        const file = fs.readFileSync(
            path.join(__dirname, 'static', 'style.css')
        );

        res.setHeader('Content-Type', 'text/css');

        return res.end(file);
    }

    if (req.url === '/script.js') {

        const file = fs.readFileSync(
            path.join(__dirname, 'static', 'script.js')
        );

        res.setHeader('Content-Type', 'application/javascript');

        return res.end(file);
    }

    if (req.url === "/messages" && req.method === "GET") {

        connection.query(
            "SELECT * FROM message ORDER BY id ASC",
            (err, results) => {

                if (err) {

                    console.log("MYSQL ERROR:", err);

                    res.writeHead(500, {
                        "Content-Type": "application/json"
                    });

                    return res.end(JSON.stringify({
                        error: err.message
                    }));
                }

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                return res.end(JSON.stringify(results));
            }
        );

        return;
    }

    if (req.url === "/send" && req.method === "POST") {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            const data = JSON.parse(body);

            connection.query(
                "INSERT INTO message (username, message) VALUES (?, ?)",
                [data.user, data.message],
                (err) => {

                    if (err) {

                        console.log("MYSQL ERROR:", err);

                        res.writeHead(500);

                        return res.end("Database error");
                    }

                    res.writeHead(200);

                    return res.end("Message saved!");
                }
            );
        });

        return;
    }

    if (req.url === "/register" && req.method === "POST") {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            const data = JSON.parse(body);

            connection.query(
                "INSERT INTO user (user, password) VALUES (?, ?)",
                [data.user, data.password],
                (err) => {

                    if (err) {

                        console.log("MYSQL ERROR:", err);

                        res.writeHead(500);

                        return res.end("Register error");
                    }

                    res.writeHead(200);

                    return res.end("User created!");
                }
            );
        });

        return;
    }
    res.writeHead(404);

    res.end("404 Not Found");
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

const { Server } = require("socket.io");
const io = new Server(server);

io.on('connection', async (socket) => {
    const guestNickname = 'gist_' + Math.floor(Math.random() * 1000);
    console.log(`${guestNickname} pidkluchivsya. id - ${socket.io}`);
})
# Realtime Chat Application

This project is a full-stack real-time chat application that consists of a C++ server and a web client developed using HTML, CSS, and JavaScript.

## Project Structure

```
realtime-chat-app
├── server
│   ├── src
│   │   ├── main.cpp          # Entry point for the C++ server application
│   │   ├── chat_server.cpp   # Implementation of the ChatServer class
│   │   └── chat_server.h     # Header file for the ChatServer class
│   ├── CMakeLists.txt        # CMake configuration file
│   └── README.md             # Documentation for the server-side
├── client
│   ├── index.html            # Main HTML file for the web client
│   ├── styles
│   │   └── main.css          # CSS styles for the web client
│   └── scripts
│       └── app.js            # JavaScript logic for the web client
└── README.md                 # Documentation for the entire project
```

## Server

The server is implemented in C++ and uses socket programming to handle client connections and message broadcasting. It is designed to be efficient and scalable, allowing multiple clients to connect and communicate in real-time.

### Setup Instructions

1. Install CMake and a C++ compiler.
2. Navigate to the `server` directory.
3. Run `cmake .` to generate the build files.
4. Compile the server using `make`.
5. Run the server executable.

## Client

The client is a web application that provides a user-friendly interface for chatting. It communicates with the server using WebSocket or a TCP bridge.

### Setup Instructions

1. Open `index.html` in a web browser.
2. Ensure the server is running to connect and chat.

## Usage

Once both the server and client are running, users can join the chat by entering their names and sending messages. The chat interface will update in real-time as messages are exchanged.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.
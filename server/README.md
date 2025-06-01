# Server README for Real-Time Chat Application

# Real-Time Chat Application - Server

This document provides an overview of the server-side implementation of the Real-Time Chat Application. The server is built using C++ and utilizes socket programming to handle real-time communication between clients.

## Project Structure

```
realtime-chat-app
└── server
    ├── src
    │   ├── main.cpp          # Entry point of the server application
    │   ├── chat_server.cpp    # Implementation of the ChatServer class
    │   └── chat_server.h      # Header file for the ChatServer class
    ├── CMakeLists.txt        # CMake configuration file
    └── README.md             # This documentation file
```

## Requirements

- C++11 or higher
- CMake
- A compatible compiler (e.g., g++, clang++)

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd realtime-chat-app/server
   ```

2. **Build the project:**
   ```
   mkdir build
   cd build
   cmake ..
   make
   ```

3. **Run the server:**
   ```
   ./chat_server
   ```

## Usage

Once the server is running, it will listen for incoming client connections. Clients can connect to the server and start sending messages. The server will broadcast messages to all connected clients.

## Contributing

Feel free to contribute to the project by submitting issues or pull requests. Your contributions are welcome!

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
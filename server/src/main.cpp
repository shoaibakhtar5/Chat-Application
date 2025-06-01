#include <iostream>
#include <string>
#include <thread>
#include "chat_server.h"

int main() {
    ChatServer server(8080);

    // Start the server
    server.start();
    // If start() returns an int or bool, handle errors accordingly.
    // If it returns void, assume it throws on error or always succeeds.

    std::cout << "Server is running on port 8080..." << std::endl;

    // Accept clients in a loop
    while (true) {
        server.acceptClient();
    }

    return 0;
}
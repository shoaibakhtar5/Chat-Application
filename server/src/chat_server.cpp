#include <iostream>
#include <string>
#include <vector>
#include <thread>
#include <mutex>
#include <algorithm> // For std::remove
#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#endif

#include "chat_server.h"

ChatServer::ChatServer(int port) : port(port) {
#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2,2), &wsaData) != 0) {
        std::cerr << "WSAStartup failed" << std::endl;
        exit(EXIT_FAILURE);
    }
#endif
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
#ifdef _WIN32
    if (server_fd == INVALID_SOCKET) {
#else
    if (server_fd < 0) {
#endif
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }

    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port);

    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("Bind failed");
        exit(EXIT_FAILURE);
    }

    if (listen(server_fd, 10) < 0) {
        perror("Listen failed");
        exit(EXIT_FAILURE);
    }
}

void ChatServer::start() {
    std::cout << "Chat server started on port " << port << std::endl;
    // Accept clients in a loop
    while (true) {
        acceptClient();
    }
}

void ChatServer::acceptClient() {
    int new_socket;
    sockaddr_in address{};
#ifdef _WIN32
    int addrlen = sizeof(address);
#else
    socklen_t addrlen = sizeof(address);
#endif
    new_socket = accept(server_fd, (struct sockaddr *)&address, &addrlen);
#ifdef _WIN32
    if (new_socket == INVALID_SOCKET) {
#else
    if (new_socket < 0) {
#endif
        perror("Accept failed");
        return;
    }
    {
        std::lock_guard<std::mutex> lock(mutex);
        clients.push_back(new_socket);
    }
    std::thread(&ChatServer::manageClient, this, new_socket).detach();
}

void ChatServer::broadcastMessage(const std::string &message) {
    std::lock_guard<std::mutex> lock(mutex);
    for (int client : clients) {
        send(client, message.c_str(), (int)message.size(), 0);
    }
}

void ChatServer::manageClient(int client_socket) {
    char buffer[1024] = {0};
    std::string username;
    bool got_username = false;
    while (true) {
#ifdef _WIN32
        int bytes_read = recv(client_socket, buffer, sizeof(buffer), 0);
#else
        int bytes_read = read(client_socket, buffer, sizeof(buffer));
#endif
        if (bytes_read <= 0) break;
        std::string message(buffer, bytes_read);

        // First message is username
        if (!got_username) {
            username = message.substr(0, message.find(':'));
            {
                std::lock_guard<std::mutex> lock(mutex);
                user_names[client_socket] = username;
            }
            got_username = true;
        }

        // Private message: /pm username message
        if (message.find("/pm ") == 0) {
            size_t first_space = message.find(' ', 4);
            if (first_space != std::string::npos) {
                std::string target = message.substr(4, first_space - 4);
                std::string pm_msg = "[PM from " + username + "]: " + message.substr(first_space + 1);
                std::lock_guard<std::mutex> lock(mutex);
                for (const auto& pair : user_names) {
                    if (pair.second == target) {
                        send(pair.first, pm_msg.c_str(), (int)pm_msg.size(), 0);
                        break;
                    }
                }
            }
        } else {
            broadcastMessage(message);
        }
    }
#ifdef _WIN32
    closesocket(client_socket);
#else
    close(client_socket);
#endif
    std::lock_guard<std::mutex> lock(mutex);
    clients.erase(std::remove(clients.begin(), clients.end(), client_socket), clients.end());
    user_names.erase(client_socket);
}
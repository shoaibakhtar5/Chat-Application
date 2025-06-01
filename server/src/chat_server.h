#ifndef CHAT_SERVER_H
#define CHAT_SERVER_H

#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#endif
#include <thread>
#include <mutex>

class ChatServer {
public:
    ChatServer(int port);
    void start();
    void acceptClient();
    void broadcastMessage(const std::string &message);
    void manageClient(int client_socket);

private:
    int port;
    int server_fd;
    std::vector<int> clients;
    std::mutex mutex;
    std::unordered_map<int, std::string> user_names; // Add this line
};

#endif // CHAT_SERVER_H
project(realtime-chat-app)

set(CMAKE_CXX_STANDARD 17)

include_directories(src)

add_executable(chat_server src/main.cpp src/chat_server.cpp)

target_link_libraries(chat_server pthread)
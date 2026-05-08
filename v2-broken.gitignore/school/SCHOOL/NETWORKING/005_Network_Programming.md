# 005_Network_Programming

> Sockets in C, building a server, and non-blocking I/O.

## Level 1 — Intuition

### Concept

A socket is an endpoint for communication — like a power outlet. Plug your program into a port, and data flows through. Sockets abstract the network so you can `read()` and `write()` just like files.

### Socket Types

```
┌─────────────────────────────────────────────────────┐
│ SOCK_STREAM (TCP):                                  │
│   Reliable, ordered, connection-oriented            │
│   Like a phone call: dial → talk → hang up          │
│                                                     │
│ SOCK_DGRAM (UDP):                                   │
│   Unreliable, unordered, connectionless             │
│   Like sending postcards: just send, hope it arrives│
└─────────────────────────────────────────────────────┘
```

## Level 2 — Practical

### TCP Client in C

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>

int main() {
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) { perror("socket"); return 1; }

    // Resolve hostname
    struct hostent *server = gethostbyname("example.com");
    if (!server) { fprintf(stderr, "No such host\n"); return 1; }

    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET;
    memcpy(&addr.sin_addr.s_addr, server->h_addr, server->h_length);
    addr.sin_port = htons(80);  // HTTP

    if (connect(sock, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("connect"); return 1;
    }

    // Send HTTP request
    char *request = "GET / HTTP/1.1\r\nHost: example.com\r\n"
                    "Connection: close\r\n\r\n";
    send(sock, request, strlen(request), 0);

    // Receive response
    char buffer[4096];
    int bytes;
    while ((bytes = recv(sock, buffer, sizeof(buffer) - 1, 0)) > 0) {
        buffer[bytes] = '\0';
        printf("%s", buffer);
    }

    close(sock);
    return 0;
}
// Compile: gcc client.c -o client
```

### TCP Server in C

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define PORT 8080
#define BACKLOG 10

int main() {
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) { perror("socket"); return 1; }

    // Allow port reuse (prevents "Address already in use")
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;  // Listen on all interfaces
    addr.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind"); return 1;
    }

    if (listen(server_fd, BACKLOG) < 0) {
        perror("listen"); return 1;
    }

    printf("Server listening on port %d\n", PORT);

    while (1) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);

        int client_fd = accept(server_fd,
                               (struct sockaddr*)&client_addr,
                               &client_len);
        if (client_fd < 0) { perror("accept"); continue; }

        printf("Connection from %s:%d\n",
               inet_ntoa(client_addr.sin_addr),
               ntohs(client_addr.sin_port));

        // Read request
        char buffer[4096];
        int bytes = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
        if (bytes > 0) {
            buffer[bytes] = '\0';
            printf("Request:\n%s\n", buffer);
        }

        // Send response
        char *response =
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/html\r\n"
            "Content-Length: 47\r\n"
            "Connection: close\r\n"
            "\r\n"
            "<html><body><h1>Hello from C!</h1></body></html>\r\n";
        send(client_fd, response, strlen(response), 0);

        close(client_fd);
    }

    close(server_fd);
    return 0;
}
// Compile: gcc server.c -o server
// Test: curl http://localhost:8080
```

### UDP Echo Server

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>

#define PORT 9999

int main() {
    int sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0) { perror("socket"); return 1; }

    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(PORT);

    if (bind(sock, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind"); return 1;
    }

    printf("UDP echo server on port %d\n", PORT);

    while (1) {
        char buffer[1024];
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);

        int bytes = recvfrom(sock, buffer, sizeof(buffer) - 1, 0,
                             (struct sockaddr*)&client_addr,
                             &client_len);
        if (bytes > 0) {
            buffer[bytes] = '\0';
            printf("Received: %s", buffer);
            sendto(sock, buffer, bytes, 0,
                   (struct sockaddr*)&client_addr, client_len);
        }
    }

    close(sock);
    return 0;
}
```

## Level 3 — Systems

### select() — Multiplexing Multiple Connections

```c
// Problem: single-threaded server blocks on accept() → can't handle multiple clients
// Solution: select() monitors multiple file descriptors

#include <sys/select.h>

// Pseudocode for a select()-based server:
void select_server(int server_fd) {
    fd_set master_set, read_set;
    FD_ZERO(&master_set);
    FD_SET(server_fd, &master_set);
    int max_fd = server_fd;

    while (1) {
        read_set = master_set;  // select() modifies the set

        // select() blocks until any fd in read_set is ready
        if (select(max_fd + 1, &read_set, NULL, NULL, NULL) < 0) {
            perror("select"); continue;
        }

        // Check every fd
        for (int fd = 0; fd <= max_fd; fd++) {
            if (!FD_ISSET(fd, &read_set)) continue;

            if (fd == server_fd) {
                // New connection
                int client_fd = accept(server_fd, NULL, NULL);
                FD_SET(client_fd, &master_set);
                if (client_fd > max_fd) max_fd = client_fd;
            } else {
                // Existing connection has data
                char buf[1024];
                int bytes = recv(fd, buf, sizeof(buf), 0);
                if (bytes <= 0) {
                    // Connection closed
                    close(fd);
                    FD_CLR(fd, &master_set);
                } else {
                    send(fd, buf, bytes, 0);  // Echo
                }
            }
        }
    }
}
```

### epoll — Linux's Efficient I/O

```c
// select() is O(n) — scans ALL fds every call
// epoll is O(1) — only returns ready fds

#include <sys/epoll.h>

#define MAX_EVENTS 64

void epoll_server(int server_fd) {
    int epoll_fd = epoll_create1(0);

    struct epoll_event ev = {0};
    ev.events = EPOLLIN;
    ev.data.fd = server_fd;
    epoll_ctl(epoll_fd, EPOLL_CTL_ADD, server_fd, &ev);

    struct epoll_event events[MAX_EVENTS];

    while (1) {
        int nfds = epoll_wait(epoll_fd, events, MAX_EVENTS, -1);
        for (int i = 0; i < nfds; i++) {
            int fd = events[i].data.fd;

            if (fd == server_fd) {
                int client_fd = accept(server_fd, NULL, NULL);
                // Make client socket non-blocking
                fcntl(client_fd, F_SETFL,
                      fcntl(client_fd, F_GETFL, 0) | O_NONBLOCK);
                ev.events = EPOLLIN | EPOLLET;  // Edge-triggered
                ev.data.fd = client_fd;
                epoll_ctl(epoll_fd, EPOLL_CTL_ADD, client_fd, &ev);
            } else {
                // Handle client data (must read until EAGAIN for ET)
                while (1) {
                    char buf[512];
                    int bytes = read(fd, buf, sizeof(buf));
                    if (bytes > 0) {
                        write(fd, buf, bytes);  // Echo
                    } else if (bytes == 0) {
                        close(fd);  // Client disconnected
                        break;
                    } else if (errno == EAGAIN || errno == EWOULDBLOCK) {
                        break;  // No more data
                    }
                }
            }
        }
    }
}
```

### Non-Blocking I/O and Event Loops

```
Blocking I/O:
  recv(sock) → WAIT until data arrives → return data
  One thread can handle ONE connection

Non-blocking I/O:
  fcntl(sock, F_SETFL, O_NONBLOCK);
  recv(sock) → returns immediately
    If data: returns data
    If no data: returns -1, errno = EAGAIN/EWOULDBLOCK
  One thread can handle THOUSANDS of connections

Event Loop:
  while (1) {
      poll/epoll/select for ready fds
      for each ready fd:
          if new connection: accept + register
          if data: read + process + write response
          if closed: cleanup
  }

This is the foundation of: nginx, Node.js, Redis, HAProxy
```

## Level 4 — Expert

### Zero-Copy and sendfile()

```c
// Traditional file send:
// read() → user buffer → write() to socket
// = 2 copies + 2 context switches

// sendfile(): kernel copies data directly from file to socket
// No userspace copy → much faster for static files

#include <sys/sendfile.h>

void send_file(int client_fd, const char *filepath) {
    int file_fd = open(filepath, O_RDONLY);
    off_t offset = 0;
    struct stat st;
    fstat(file_fd, &st);

    sendfile(client_fd, file_fd, &offset, st.st_size);
    close(file_fd);
}

// Also: splice() for socket-to-socket, mmap() for shared memory
```

### Building a Simple HTTP Server (Complete)

```c
// Key considerations for a production HTTP server:
// 1. Non-blocking I/O (epoll/kqueue)
// 2. Connection pooling (keep-alive)
// 3. Request parsing (method, path, headers, body)
// 4. Response building (status line, headers, body)
// 5. Static file serving (sendfile)
// 6. Timeout handling (idle connections)
// 7. Graceful shutdown (drain connections, stop accepting)
// 8. Worker pool (one thread per CPU, each with own epoll)

// Minimal HTTP parser state machine:
enum HttpState {
    STATE_METHOD,
    STATE_PATH,
    STATE_VERSION,
    STATE_HEADER_NAME,
    STATE_HEADER_VALUE,
    STATE_BODY,
    STATE_COMPLETE
};
```

---

## Exercises

1. Write a TCP client in C that connects to a web server on port 80, sends an HTTP GET request, and prints the response headers.
2. Build a multi-client echo server using select(). Test with `nc localhost 8080` from 3 terminals simultaneously.
3. Convert your server to use epoll. Compare the max number of concurrent connections with select() vs epoll().

## Quiz

1. What is the sequence of socket calls for a TCP server (create → accept)?
2. What's the difference between select(), poll(), and epoll()?
3. Why use non-blocking I/O instead of one-thread-per-connection?
4. What does SO_REUSEADDR do?
5. What advantage does sendfile() provide over read()+write()?

---

## Navigation

**Parent**: [[000_NETWORKING_MOC|NETWORKING]]

**Synapses**:
- [[001_TCP_IP|NETWORKING 001]] — TCP fundamentals
- [[005_Operating_Systems|CORE 005]] — Process and thread model
- [[003_Process_Management|LINUX 003]] — Linux I/O primitives

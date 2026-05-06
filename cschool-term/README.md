# C-SCHOOL Terminal Backend

Run with `cargo run` from the `cschool-term` directory:

```bash
cd cschool-term
cargo run
```

The server runs on `http://localhost:8080` and provides a real terminal API:

- **POST /api/session** - Create session, returns session ID
- **POST /api/exec** - Execute command in session with JSON body:
  ```json
  {"session_id": "abc123", "command": "ls -la"}
  ```

Returns:
```json
{
  "id": "abc123", 
  "working_dir": "/home/user", 
  "output": "...\n",
  "prompt": "user@c-school:~$ "
}
```

## Quick Test

```bash
# Create session
curl -X POST http://localhost:8080/api/session

# Run command  
curl -X POST http://localhost:8080/api/exec \
  -H "Content-Type: application/json" \
  -d '{"session_id":"abc","command":"ls"}'
```

The frontend JavaScript connects to this API to make the terminal functional.
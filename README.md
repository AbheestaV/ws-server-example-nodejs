# Simple WebSocket server using the ws module (Added MySQL Login)

Added a few features to the original application so that this websocket can be used for a login system in Unreal Engine.
You now need a .env file with the following 

```
DB_HOST=host
DB_USERNAME=username
DB_PASSWORD=password
DB_NAME=dbname
```

This sample is meant for testing out the capabilities of Unreal Engine's WebSocket client interface locally, but can be used with non-UE clients too. All the server does is assign unique IDs to client connections, broadcast messages received from a client to all the connected clients, and tell clients how many connected clients there are every 15 seconds. 

To try it out, simply run `npm install`, then `node server`, and have applications connect to ws://localhost:8080. 


# SnApplication for North Texas Food Bank (NTFB)
Text the chatbot at __417-815-3351__

### Server
server runs from app.js

### `/sms` endpoint
> routes > index.js

### logic configuration
- Chatbot logic is configured through the binary search tree in __index.js__
- Each node in the tree has
  - id
  - double (boolean denoting whether node has two children)
  - left
  - right
- `validLogic` map contains valid messages for each node (by id) and which direction down tree to go for nodes marked "double" (two children)
- `responses` map contains a list for every node (by id) where the 0 index response is in English and the 1 index response is in Spanish

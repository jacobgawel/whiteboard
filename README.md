# WhiteBoard Application using Node.js and React.js

<br/>

## Description 
This application uses Node.js, React.js, JS, CSS, and HTML to create a front and back end aiming for real-time collaboration 
between users using sockets by providing server communication. Provides simple tools such as drawing shapes and freehand
as well as text. It only uses two components and therefore isn't very elaborate but will aim to be better as I gain more experience with react.

<br/>

## UI section
### `Board.jsx` `Container.jsx`
Currently, the UI will enable the user to interact with a board class. This is accessed through a container. Using the board class 
it can receive properties from the container allowing it to use these parameters to enable targetted drawing modes for users. 
The UI also interacts with the sockets to emit signals to allow communication between the server and clients.

The UI class Board.jsx contains many features including its ability to draw; freehand, rectangles, lines, circles, and write text.
It does this by setting up mouse events to trigger certain actions. It can also read JSON data objects allowing it to draw objects from
the MongoDB database as well as from the server where the clients communicate.

<br/>

## Server
### `Server.js`
On starting the server it will try to connect to a MongoDB container as well as open a connection for clients to join.
Upon a connection, the server will then send a signal to that individual socket to perform a canvas construction using 
the objects stored in the database. It will also define and enable signals to be received from that socket from that connection. 
Enabling it to receive communication and broadcast signals to the other users.

<br/>
<br/>

##### Created by: SamBrown22

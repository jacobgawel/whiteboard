import React from 'react';
import io from 'socket.io-client';
import './style.css';

class Board extends React.Component {

    /* Sets initial global variable status' */
    timeout;
    socket;
    ctx;
    isDrawing = false; 
    isDragging = false; 
    drawingMode = this.props.drawingMode; 
    lineWidth = this.props.size;
    strokeStyle = this.props.color;

    /* Constructor to establish a socket connection and initalising component's state */
    constructor(props) {
        super(props); // Calls for properties from parent class

        this.state = {
            canvas: null,
            mouse: { x: 0, y: 0 },
            lastMouse: { x: 0, y: 0 },
            startX: 0,
            startY: 0,
            width: 0,
            height: 0,
            freehand_object: [],
            last_object: [],
        };
    };

    /* Function to send a clear canvas signal to server */
    clearCanvas() {
        this.socket.emit('clear-canvas'); // Sends signal to server of clear canvas
        this.clearLocalCanvas(); // Calls a local clear
    };

    /* Draws JSON object from server by calling correct function based on type */
    drawObject(objectData){
        const { type, properties } = objectData; // Gets type and property data from JSON

        const incomingCanvas = document.createElement('canvas'); // Creates seperate canvas
        incomingCanvas.width = this.state.canvas.width; // Sets canvas width
        incomingCanvas.height = this.state.canvas.height; // Sets canvas height
        
        const incomingCtx = incomingCanvas.getContext('2d'); // Creates a new canvas context to use server ctx styles  
        incomingCtx.lineJoin = 'round'; //sets default ctx variables
        incomingCtx.lineCap = 'round';

        switch (type) { // Detects Object type and uses correct function
            case 'line':
                this.drawObjectLine(properties, incomingCtx);
                break;

            case 'rectangle':
                this.drawObjectRectangle(properties, incomingCtx);
                break;

            case 'circle':
                this.drawObjectCircle(properties, incomingCtx);
                break;

            case 'freehand':
                this.drawObjectFreehand(properties, incomingCtx);
                break;

            case 'text':
                this.writeObjectText(properties, incomingCtx);
                break;

            default:
                console.error('Unsupported object type:', type);
        }

        this.ctx.drawImage(incomingCanvas, 0, 0); // Draw the incoming content onto the main canvas
        incomingCanvas.remove()
    };

    /* Function to draw incoming Lines */
    drawObjectLine = (properties, ctx) => {
        const { startX, startY, endX, endY, color, lineWidth } = properties;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.closePath();
        ctx.stroke();

    };

    /* Function to draw incoming Rectangles */
    drawObjectRectangle = (properties, ctx) => {
        const { startX, startY, width, height, color, lineWidth } = properties;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.rect(startX, startY, width, height);
        ctx.stroke();
        ctx.closePath();
    };

    /* Function to draw incoming Circles */
    drawObjectCircle = (properties, ctx) => {
        const { startX, startY, radius, color, lineWidth } = properties;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    };

    /* Function to draw incoming Freehand */
    drawObjectFreehand = (properties, ctx) => {
        const { mouse, lastMouse, color, lineWidth} = properties;
        console.log('FREEHAND');
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(lastMouse.x, lastMouse.y);
        ctx.lineTo(mouse.x, mouse.y)
        ctx.closePath();
        ctx.stroke();
    };

    /* Function to write incoming text */
    writeObjectText = (properties, ctx) => {
        const { message, startX, startY, font, color} = properties;
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.fillText(message, startX, startY);
    };

    /* Called on initial component mount to setup */
    componentDidMount() {
        console.log('MOUNTING BOARD')
        this.socket = io.connect(process.env.SERVER_URL);
        console.log("MOUNTED")
        this.setupEventListeners();
        this.setupCanvas();

        /* Socket for recieving object data from server */
        this.socket.on('last-object', (data) => {
            console.log('RECEIVING OBJECT ...'); // Log that object is being recieved
            try {
                var objectData = JSON.parse(data); // Parse the JSON data
                this.drawObject(objectData); // Draw the object based on the received data
                console.log('OBJECT RECEIVED'); // Log that object has been received and drawn
            } 
            catch (error) {
                console.error('Error parsing last object data:', error);
            }
        });

        // Listen for existing objects from the server
        this.socket.on('all-objects', (allObjects) => {
            allObjects.forEach((object) => {
                this.drawObject(object);
            });
        });
        
        // Listen for clear signals from the server and clears canvas
        this.socket.on('clear-canvas', () => {
            console.log('Received clear signal');
            this.clearLocalCanvas();
        });
    };

    /* Called when component is left */
    componentWillUnmount() {
        console.log('UNMOUNTING BOARD')
        const canvas = this.state.canvas;
        this.socket.disconnect();
        
        if (canvas) {
            canvas.removeEventListener('mousemove', this.handleMouseMove);
            canvas.removeEventListener('mousedown', this.handleMouseDown);
            canvas.removeEventListener('mouseup', this.handleMouseUp);
        }
    };

    /*  Called on super(props) update */
    componentDidUpdate(prevProps) {
        const { color, size, drawingMode } = this.props;

        if (prevProps.color !== color || prevProps.size !== size || prevProps.drawingMode !== drawingMode) {
        this.strokeStyle = color;
        this.lineWidth = size;
        this.drawingMode = drawingMode;
        }
    };

    /* Used to clear local canvas */
    clearLocalCanvas(){
        console.log('CLEARING CANVAS...')
        const canvas = document.querySelector('#board');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log('CLEARED')
        if (this.props.onClearCanvas) {
        this.props.onClearCanvas();
        }
    };

    /* Creates canvas */
    setupCanvas() {
        console.log('SETTING UP INITIAL CANVAS...')
        const canvas = document.querySelector('#board');

        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
        const sketch = document.querySelector('#sketch');
        const sketchStyle = getComputedStyle(sketch);
        canvas.width = parseInt(sketchStyle.getPropertyValue('width'));
        canvas.height = parseInt(sketchStyle.getPropertyValue('height'));
        this.setState({ canvas })// Set canvas in the state

        this.ctx.lineJoin = 'round'; // Defines context attributes
        this.ctx.lineCap = 'round'; 
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.strokeStyle;
    };

    /* Creates event listeners */
    setupEventListeners() {
        console.log('SETTING UP LISTENERS ...')
        const canvas = document.querySelector('#board');

        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mouseup', this.handleMouseUp);
    };

    /* Function called upon mouse movement */
    handleMouseMove = (e) => {
        try{
            const { isDragging, drawingMode } = this;
            const { canvas, mouse, startX, startY } = this.state;

            const lastMouse = { x: mouse.x, y: mouse.y };
            const newMouse = { x: e.pageX - canvas.offsetLeft, y: e.pageY - canvas.offsetTop };
            
            console.log('DRAGGING? :', isDragging)
            if (isDragging) { // If dragging is true which is a shape drawing enabled
                const width = newMouse.x - startX; // Calculate new width for shapes
                const height = newMouse.y - startY; // Calculate new height for shapes
                this.setState({ lastMouse, mouse: newMouse, width, height }, () => { // Save state of all mouse pos and shape params});
                    this.updateShapePreview(drawingMode); // Calls to show shape preview after state has been saved
                })
            }
            else {
                this.setState({lastMouse, mouse: newMouse}) //else just track mouse
            }
        }catch (error){
            console.error('Error in handleMouseMove:', error);
        }
    };
    
    /* Function called on mousedown (press) */
    handleMouseDown = (e) => {
        try{
            const { drawingMode } = this;
            const { canvas, mouse } = this.state;

            this.ctx.strokeStyle = this.strokeStyle; // Assign ctx to strokestyles incase of update
            this.ctx.lineWidth = this.lineWidth;

            if (document.querySelector('textarea')) { // Checks for existing textareas on canvas and removes on click
                document.body.removeChild(document.querySelector('textarea'));
            }

            switch(drawingMode) {
                case'freehand': // If freehand follow mouse until mouseup event
                    this.isDrawing = true; // Set drawing to true
                    canvas.addEventListener('mousemove', this.drawFree);
                    break;

                case 'text': // If text start text input on mouse click
                    var canvasState = this.ctx.getImageData(0, 0, canvas.width, canvas.height); // Capture the canvas state on initial click
                    this.setState({ canvasState, startX: mouse.x, startY: mouse.y, width: 0, height: 0 }, () => { // Set width, height and mouse pos
                        this.startTextInput();
                    })
                    break;

                default: // Else must be a shape so enable dragging
                    console.log("CAPTURING CANVAS STATE ...")
                    canvasState = this.ctx.getImageData(0, 0, canvas.width, canvas.height); // Capture the canvas state on initial click
                    this.setState({ canvasState, startX: mouse.x, startY: mouse.y, width: 0, height: 0 }, () => { // Set width, height and mouse pos
                        this.isDragging = true;
                    })
            }
        }catch (error) {
            console.error('Error in handleMouseDown:', error);
        }
    };

    /* Function called upon mouseup (release) */
    handleMouseUp = () => {
        try {
            const { canvas } = this.state;

            if (this.isDragging) {
                this.isDragging = false;
                this.drawShape(() => {
                    this.sendLastObject();
                });
            }
            else if (this.isDrawing){
                this.isDrawing = false;
                canvas.removeEventListener('mousemove', this.drawFree);
            }
        } catch (error) {
            console.error('Error in handleMouseUp:', error);
        }
    };

    /* Used to show a preview of shape whilst positioning */
    updateShapePreview = () => {
        const { drawingMode } = this;
        const { canvasState, canvas } = this.state;

        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.ctx.putImageData(canvasState, 0, 0); // Draws from canvasState

        console.log('PREVIEWING SHAPE ...')
        switch (drawingMode) { // Determine shape
            case 'line':
                this.drawLine(); // Draws line 
                break;

            case 'rectangle':
                this.drawRect(); // Draws rectangle
                break;

            case 'circle':
                this.drawCircle(); // Draws circle
                break;
            default:
                console.log('MODE UNKNOWN')
                break;
        }
    };

    /* Draws the shape */
    drawShape = (callback) => {
        const { drawingMode } = this;
        const { startX, startY, mouse, width, height} = this.state;
        var newObject = {};

        switch (drawingMode) {
            case 'line':
                this.drawLine();
                newObject = {
                    type: 'line',
                    properties: {
                        startX: startX,
                        startY: startY,
                        endX: mouse.x,
                        endY: mouse.y,
                        color: this.props.color,
                        lineWidth: this.props.size
                    }
                };
                break;

            case 'rectangle':
                this.drawRect();
                newObject  = {
                    type: 'rectangle',
                    properties: {
                        startX: startX,
                        startY: startY,
                        width: width,
                        height: height,
                        color: this.props.color,
                        lineWidth: this.props.size
                    }
                }
                break;
                
            case 'circle':
                this.drawCircle();
                newObject  = {
                    type: 'circle',
                    properties: {
                        startX: startX,
                        startY: startY,
                        radius: Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)),
                        color: this.props.color,
                        lineWidth: this.props.size
                    }
                };
                break;
            default:
                console.log('UNKNOWN MODE');
                break;
        }
        // Update the state by appending the new object to the last_object array
        this.setState({ last_object: newObject }, () => {
            console.log('Object added to last_object:', newObject);
            if (callback) {
                callback();
            }
        });
    };

    /* Freehand Drawing */
    drawFree = () => {
        const { lastMouse, mouse } = this.state;
        this.ctx.beginPath();
        this.ctx.moveTo(lastMouse.x, lastMouse.y);
        this.ctx.lineTo(mouse.x, mouse.y);
        this.ctx.closePath();
        this.ctx.stroke();

        var freehand = {
            type: 'freehand',
            properties: {
                lastMouse: lastMouse,
                mouse: mouse,
                color: this.props.color,
                lineWidth: this.props.size
            }
        }

        //Send object only recorded in intervals
        setTimeout(() => {
            this.setState({last_object:freehand}, () =>{
              this.sendLastObject();
            });
          }, 2);
    };

    /* Line Drawing */
    drawLine = () => {
        const { startX, startY, mouse } = this.state;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(mouse.x, mouse.y);
        this.ctx.closePath();
        this.ctx.stroke();
    };

     /* Rectangle Drawing */
    drawRect = () => {
        const { startX, startY, width, height } = this.state;
        this.ctx.beginPath();
        this.ctx.rect(startX, startY, width, height);
        this.ctx.stroke();
        this.ctx.closePath();
    };

     /* Circle Drawing */
    drawCircle = () => {
        const { startX, startY, width, height } = this.state;
        const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
        this.ctx.beginPath();
        this.ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    };

     /* Showing text area */
    startTextInput = () => {
        const { startX, startY, canvas } = this.state;
        if (document.querySelector('textarea')) {
        return;
        }

        const input = document.createElement('textarea');
        const inputSize = this.props.size * 3;

        input.style.position = 'absolute';
        input.style.left = `${startX + canvas.offsetLeft}px`;
        input.style.top = `${startY + canvas.offsetTop}px`;
        input.style.height = `${inputSize}px`;
        input.style.width = `${inputSize * 6}px`;
        input.style.fontSize = `${inputSize}px`;
        input.style.color = this.props.color;
        input.style.fontWeight = '600';

        document.body.appendChild(input);

        setTimeout(() => {
        input.focus();
        }, 10);

        input.addEventListener('keydown', this.handleTextInput);
    };

    /* Putting text onto canvas */
    handleTextInput = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const { startX, startY } = this.state;
            this.ctx.font = `600 ${this.props.size * 3}px Arial`;
            this.ctx.fillStyle = this.props.color;
            this.ctx.fillText(event.target.value, startX, startY);
            var textObject = {
                type: 'text',
                properties: {
                    message: event.target.value,
                    startX: startX,
                    startY: startY,
                    font: `600 ${this.props.size * 3}px Arial`,
                    color: this.props.color
                }
            }
            this.setState({last_object: textObject}, () => {
                this.sendLastObject();
            })
            document.body.removeChild(event.target);

        }
    };

    sendLastObject = () => {
        const { last_object } = this.state;
    
        try {
            // Convert last_object to JSON
            const jsonData = JSON.stringify(last_object);
    
            // Send JSON data to the server
            this.socket.emit('last-object', jsonData);
            console.log('LAST OBJECT SENT:', jsonData);
        } catch (error) {
            console.error('Error sending last object:', error);
        }
    };

    render() {
        return (
        <div className='sketch' id='sketch'>
            <canvas className='board' id='board'></canvas>
        </div>
        );
    }
}

export default Board;


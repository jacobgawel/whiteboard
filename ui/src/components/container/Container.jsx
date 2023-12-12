import React, { useState, useRef } from 'react';
import Board from '../board/Board';
import './style.css';

const Container = () => {
  const [color, setColor] = useState('black');
  const [size, setSize] = useState('5');
  const [drawingMode, setDrawingMode] = useState('freehand');
  const boardRef = useRef();

  const changeColor = (event) => {
    setColor(event.target.value);
  };

  const changeSize = (event) => {
    setSize(event.target.value);
  };

  const selectDrawingMode = (mode) => {
    setDrawingMode(mode);
  };

  const clearCanvasInBoard = () => {
    if (boardRef.current) {
      boardRef.current.clearCanvas();
    }
  };

  return (
    <div className='container'>
      {/* Container across the whole top */}
      <div className='top-container'>
        <p className='text-above-board'>WHITEBOARD APP</p>
      </div>

      <div className='content'>
        {/* Tools for board */}
        <div className='tools-section'>
          {/* Color selector */}
          <div className='color-picker-container'>
            <input type='color' value={color} onChange={changeColor} />
          </div>

          {/* Brush size selector */}
          <div className='brushsize-container'>
            <select value={size} onChange={changeSize}>
              <option>5</option>
              <option>10</option>
              <option>15</option>
              <option>20</option>
              <option>25</option>
              <option>30</option>
            </select>
          </div>

          {/* Drawing mode buttons */}
          <div className='drawing-mode-buttons'>
            <button className={drawingMode === 'clear' ? 'selected' : ''} onClick={clearCanvasInBoard}>
              <img src="clearIcon.png" alt="clear" /> 
            </button>
            <button className={drawingMode === 'freehand' ? 'selected' : ''} onClick={() => selectDrawingMode('freehand')}>
              <img src="PencilIcon.png" alt="freehand" /> 
            </button>
            <button className={drawingMode === 'line' ? 'selected' : ''} onClick={() => selectDrawingMode('line')}>
              <img src="Lineicon.png" alt="Line" /> 
            </button>
            <button className={drawingMode === 'rectangle' ? 'selected' : ''} onClick={() => selectDrawingMode('rectangle')}>
              <img src="rectangleIcon.png" alt="rectangle" /> 
            </button>
            <button className={drawingMode === 'circle' ? 'selected' : ''} onClick={() => selectDrawingMode('circle')}>
              <img src="CircleIcon.png" alt="circle" /> 
            </button>
            <button className={drawingMode === 'text' ? 'selected' : ''} onClick={() => selectDrawingMode('text')}>
              <img src="textIcon.png" alt="text" /> 
            </button>
          </div>
        </div>

        {/* Board - Uses class(Board) in container */}
        <div className='board-container'>
          <Board ref={boardRef} color={color} size={size} drawingMode={drawingMode} />
        </div>
      </div>
    </div>
  );
};

export default Container;

'use client';
import React, { useState, useRef, useEffect } from 'react';
import './HectocGame.css';

// Update the Operation type to include "^"
type Operation = '+' | '-' | '*' | '/' | '' | '(' | ')' | '^';
type CellType = 'digit' | 'operation';

interface Cell {
  type: CellType;
  value: string;
  id: string;
  draggable?: boolean;
}

const HectocGame: React.FC = () => {
  const [cells, setCells] = useState<Cell[]>([]);
  const [draggedItem, setDraggedItem] = useState<Cell | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('Drag operations between digits to make 100');
  const operationsPanelRef = useRef<HTMLDivElement>(null);
  // Add history state to track previous moves
  const [history, setHistory] = useState<Cell[][]>([]);

  // Initialize the game board
  useEffect(() => {
    const initialDigits = ['1', '2', '3', '4', '5', '6'];
    const initialCells: Cell[] = [];

    initialDigits.forEach((digit, index) => {
      initialCells.push({
        type: 'digit',
        value: digit,
        id: `digit-${index}`,
        draggable: false,
      });

      if (index < initialDigits.length - 1) {
        initialCells.push({
          type: 'operation',
          value: '',
          id: `op-${index}`,
          draggable: true,
        });
      }
    });

    setCells(initialCells);
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, cell: Cell, index: number) => {
    if (!cell.draggable && cell.type !== 'operation') return;

    e.dataTransfer.setData('text/plain', JSON.stringify({ cell, index }));
    setDraggedItem(cell);

    // Visual feedback
    setTimeout(() => {
      const element = e.target as HTMLElement;
      element.style.opacity = '0.4';
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();

    // Only allow dropping on operation cells or empty operation slots
    if (
      cells[index].type === 'operation' ||
      (cells[index].type === 'digit' && draggedItem?.type === 'operation')
    ) {
      setTargetIndex(index);
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const element = e.target as HTMLElement;
    element.style.opacity = '1';
    setDraggedItem(null);
    setTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();

    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    const { cell: sourceCell, index: sourceIndex } = JSON.parse(data);

    // Only allow operation cells to be moved or placed
    if (sourceCell.type !== 'operation') return;

    // Don't allow dropping on digits unless it's an adjacent operation slot
    if (cells[index].type === 'digit') {
      // Find the operation slot before or after this digit
      const operationIndex =
        index > 0 && cells[index - 1].type === 'operation'
          ? index - 1
          : index < cells.length - 1 && cells[index + 1].type === 'operation'
            ? index + 1
            : -1;

      if (operationIndex === -1) return;
      return handleOperationDrop(sourceCell, sourceIndex, operationIndex);
    }

    handleOperationDrop(sourceCell, sourceIndex, index);
  };

  const handleOperationDrop = (sourceCell: Cell, sourceIndex: number, targetIndex: number) => {
    const newCells = [...cells];

    // Save current state to history before making changes
    setHistory((prev) => [...prev, [...cells]]);

    // Check if we're adding a bracket
    const isAddingBracket =
      (sourceCell.value === '(' || sourceCell.value === ')') &&
      newCells[targetIndex].value !== '(' &&
      newCells[targetIndex].value !== ')';

    // If dragging from operations panel
    if (sourceIndex === -1) {
      newCells[targetIndex] = {
        ...newCells[targetIndex],
        value: sourceCell.value,
      };

      // If we're adding a bracket, we might need to add operation slots
      if (isAddingBracket) {
        insertOperationSlotsForBracket(newCells, targetIndex, sourceCell.value);
      }

      setCells([...newCells]); // Use spread to ensure React detects the change
    }
    // If dragging from another operation slot
    else {
      // Swap the values
      const temp = newCells[targetIndex].value;
      newCells[targetIndex] = {
        ...newCells[targetIndex],
        value: sourceCell.value,
      };
      newCells[sourceIndex] = { ...newCells[sourceIndex], value: temp };

      // If we're adding a bracket, we might need to add operation slots
      if (isAddingBracket) {
        insertOperationSlotsForBracket(newCells, targetIndex, sourceCell.value);
      }

      setCells([...newCells]); // Use spread to ensure React detects the change
    }

    checkSolution(newCells);
  };

  // Helper function to ensure brackets have operation slots next to them
  const insertOperationSlotsForBracket = (
    cellsArray: Cell[],
    bracketIndex: number,
    bracketType: string
  ) => {
    let modified = false;

    if (bracketType === '(') {
      // Always add an operation slot before opening bracket
      // Only exception is if it's at the beginning or already has an operation before it
      if (bracketIndex > 0) {
        if (cellsArray[bracketIndex - 1].type !== 'operation') {
          // Insert an operation slot before the opening bracket
          const newOpSlot: Cell = {
            type: 'operation',
            value: '',
            id: `op-new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            draggable: true,
          };

          cellsArray.splice(bracketIndex, 0, newOpSlot);
          bracketIndex++; // Adjust index after insertion
          modified = true;
          setMessage('Operation slot added before bracket. Add an operator here.');
        }
      }

      // Keep the existing code for adding an operation slot after the bracket
      if (
        bracketIndex < cellsArray.length - 1 &&
        cellsArray[bracketIndex + 1].type !== 'operation'
      ) {
        // Insert an operation slot after the opening bracket
        const newOpSlot: Cell = {
          type: 'operation',
          value: '',
          id: `op-new-inside-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          draggable: true,
        };

        cellsArray.splice(bracketIndex + 1, 0, newOpSlot);
        modified = true;
        setMessage('Operation slot added inside bracket. Start building your expression.');
      }
    } else if (bracketType === ')') {
      // Fix closing bracket handling

      // Add operation slot after closing bracket if there's any digit after it
      if (bracketIndex < cellsArray.length - 1 && cellsArray[bracketIndex + 1].type === 'digit') {
        // Insert an operation slot after the closing bracket
        const newOpSlot: Cell = {
          type: 'operation',
          value: '',
          id: `op-new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          draggable: true,
        };

        cellsArray.splice(bracketIndex + 1, 0, newOpSlot);
        modified = true;
        setMessage('Operation slot added after closing bracket. Add an operator here.');
      }

      // Also check if there's another closing bracket or an opening bracket after this one
      // and add an operation slot if needed
      if (
        bracketIndex < cellsArray.length - 1 &&
        cellsArray[bracketIndex + 1].value &&
        (cellsArray[bracketIndex + 1].value === '(' || cellsArray[bracketIndex + 1].value === ')')
      ) {
        // Insert an operation slot between brackets
        const newOpSlot: Cell = {
          type: 'operation',
          value: '',
          id: `op-new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          draggable: true,
        };

        cellsArray.splice(bracketIndex + 1, 0, newOpSlot);
        modified = true;
        setMessage('Operation slot added between brackets. Add an operator here.');
      }
    }

    return modified;
  };

  const checkSolution = (currentCells: Cell[]) => {
    // Build the expression
    let expression = '';
    let currentNumber = '';
    let needsConcat = false;

    currentCells.forEach((cell) => {
      if (cell.type === 'digit') {
        if (needsConcat) {
          currentNumber += cell.value;
          needsConcat = false;
        } else {
          if (currentNumber) expression += currentNumber;
          currentNumber = cell.value;
        }
      } else if (cell.type === 'operation' && cell.value) {
        if (cell.value === '(' || cell.value === ')') {
          expression += currentNumber + cell.value;
          currentNumber = '';
          needsConcat = false;
        } else {
          expression += currentNumber + cell.value;
          currentNumber = '';
          needsConcat = cell.value === '';
        }
      } else if (cell.type === 'operation' && !cell.value) {
        needsConcat = true;
      }
    });

    // Add the last number
    expression += currentNumber;

    try {
      // Only convert ^ to ** for JavaScript exponentiation before evaluation
      // Remove automatic multiplication for brackets
      const processedExpression = expression.replace(/\^/g, '**');

      // Check for digit-bracket pairs without operations
      if (expression.match(/\d\(/) || expression.match(/\)\d/)) {
        setMessage('You need to add an operation between digits and brackets');
        return;
      }

      // Evaluate the expression
      const result = eval(processedExpression);

      if (Math.abs(result - 100) < 0.0001) {
        // Account for floating point precision
        setMessage('Congratulations! You solved it!');
      } else {
        setMessage(`Current value: ${result}. Keep trying!`);
      }
    } catch {
      setMessage('Invalid expression. Keep trying!');
    }
  };

  // Add undo function to revert to the previous state
  const undoMove = () => {
    if (history.length === 0) return;

    // Get the last state from history
    const previousState = history[history.length - 1];

    // Update cells with the previous state
    setCells(previousState);

    // Remove the used state from history
    setHistory((prev) => prev.slice(0, -1));

    // Update message
    setMessage('Move undone. Keep trying!');
  };

  const resetGame = () => {
    const newCells = cells.map((cell) =>
      cell.type === 'operation' ? { ...cell, value: '' } : cell
    );
    setCells(newCells);
    setMessage('Drag operations between digits to make 100');
    // Clear history when resetting
    setHistory([]);
  };

  // Add "^" to available operations
  const availableOperations: Operation[] = ['+', '-', '*', '/', '(', ')', '^'];

  const handleOperationsPanelDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    const { cell: sourceCell, index: sourceIndex } = JSON.parse(data);

    // Only allow dropping operations from the game board (not from the panel itself)
    if (sourceCell.type !== 'operation' || sourceIndex === -1) return;

    // Save current state to history
    setHistory((prev) => [...prev, [...cells]]);

    // Clear the operation value
    const newCells = [...cells];
    newCells[sourceIndex] = {
      ...newCells[sourceIndex],
      value: '',
    };

    setCells(newCells);
    checkSolution(newCells);
  };

  return (
    <div className='hectoc-game'>
      <h1 className='game-title'>Hectoc Game</h1>
      <p className='game-subtitle'>Combine the digits with operations to make 100</p>

      <div className='game-message'>{message}</div>
      <div className='mobile-hint'>Swipe horizontally if needed to see all digits</div>

      <div
        className='operations-panel'
        ref={operationsPanelRef}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
        onDrop={handleOperationsPanelDrop}
      >
        <h3 className='panel-title'>Available Operations</h3>
        <div className='operations-container'>
          {availableOperations.map((op, index) => (
            <div
              key={`avail-op-${index}`}
              className='operation-tile'
              draggable
              onDragStart={(e: React.DragEvent<HTMLDivElement>) =>
                handleDragStart(e, { type: 'operation', value: op, id: `avail-op-${index}` }, -1)
              }
              onDragEnd={handleDragEnd}
            >
              {op}
            </div>
          ))}
        </div>
        <div className='drop-hint'>Drop operations here to remove them</div>
      </div>

      <div className='game-board' role='region' aria-label='Game board with draggable operations'>
        {cells.map((cell, index) => (
          <div
            key={cell.id}
            className={`cell ${cell.type} ${
              targetIndex === index ? 'drop-target' : ''
            } ${cell.value ? 'has-value' : 'empty'}`}
            draggable={cell.type === 'operation'}
            onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, cell, index)}
            onDragOver={(e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, index)}
            onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {cell.value || (cell.type === 'operation' ? '□' : cell.value)}
          </div>
        ))}
      </div>

      <div className='game-controls'>
        <button className='button reset-button' onClick={resetGame}>
          Reset
        </button>
        <button className='button undo-button' onClick={undoMove} disabled={history.length === 0}>
          Undo Last Move
        </button>
      </div>

      <div className='game-rules'>
        <h3 className='rules-title'>Rules:</h3>
        <ul className='rules-list'>
          <li>Drag operations between the digits</li>
          <li>Adjacent digits with no operation between them concatenate (e.g., 1 2 becomes 12)</li>
          <li>Use parentheses to control order of operations</li>
          <li>You must add an explicit operation between digits and brackets (e.g., 2*(3+4))</li>
          <li>The ^ symbol represents exponentiation (e.g., 2^3 = 8)</li>
          <li>The expression must evaluate to exactly 100</li>
        </ul>
      </div>
    </div>
  );
};

export default HectocGame;

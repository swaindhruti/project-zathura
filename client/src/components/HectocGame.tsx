'use client';
import React, { useState, useRef, useEffect } from 'react';
import './HectocGame.css';

type Operation = '+' | '-' | '*' | '/' | '' | '(' | ')';
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

    setTimeout(() => {
      const element = e.target as HTMLElement;
      element.style.opacity = '0.4';
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();

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

    if (sourceCell.type !== 'operation') return;

    if (cells[index].type === 'digit') {
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
    setHistory((prev) => [...prev, [...cells]]);

    const isAddingBracket =
      (sourceCell.value === '(' || sourceCell.value === ')') &&
      newCells[targetIndex].value !== '(' &&
      newCells[targetIndex].value !== ')';

    if (sourceIndex === -1) {
      newCells[targetIndex] = {
        ...newCells[targetIndex],
        value: sourceCell.value,
      };

      if (isAddingBracket) {
        insertOperationSlotsForBracket(newCells, targetIndex, sourceCell.value);
      }

      setCells([...newCells]);
    } else {
      const temp = newCells[targetIndex].value;
      newCells[targetIndex] = {
        ...newCells[targetIndex],
        value: sourceCell.value,
      };
      newCells[sourceIndex] = { ...newCells[sourceIndex], value: temp };

      if (isAddingBracket) {
        insertOperationSlotsForBracket(newCells, targetIndex, sourceCell.value);
      }

      setCells([...newCells]);
    }

    checkSolution(newCells);
  };

  const insertOperationSlotsForBracket = (
    cellsArray: Cell[],
    bracketIndex: number,
    bracketType: string
  ) => {
    let modified = false;

    if (bracketType === '(') {
      if (bracketIndex > 0) {
        if (cellsArray[bracketIndex - 1].type !== 'operation') {
          const newOpSlot: Cell = {
            type: 'operation',
            value: '',
            id: `op-new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            draggable: true,
          };

          cellsArray.splice(bracketIndex, 0, newOpSlot);
          bracketIndex++;
          modified = true;
          setMessage('Operation slot added before bracket. Add an operator here.');
        }
      }

      if (
        bracketIndex < cellsArray.length - 1 &&
        cellsArray[bracketIndex + 1].type !== 'operation'
      ) {
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
      if (bracketIndex < cellsArray.length - 1 && cellsArray[bracketIndex + 1].type === 'digit') {
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

      if (
        bracketIndex < cellsArray.length - 1 &&
        cellsArray[bracketIndex + 1].value &&
        (cellsArray[bracketIndex + 1].value === '(' || cellsArray[bracketIndex + 1].value === ')')
      ) {
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

    expression += currentNumber;

    try {
      const processedExpression = expression.replace(/\^/g, '**');

      if (expression.match(/\d\(/) || expression.match(/\)\d/)) {
        setMessage('You need to add an operation between digits and brackets');
        return;
      }

      const result = eval(processedExpression);

      if (Math.abs(result - 100) < 0.0001) {
        setMessage('Congratulations! You solved it!');
      } else {
        setMessage(`Current value: ${result}. Keep trying!`);
      }
    } catch {
      setMessage('Invalid expression. Keep trying!');
    }
  };

  const undoMove = () => {
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    setCells(previousState);
    setHistory((prev) => prev.slice(0, -1));
    setMessage('Move undone. Keep trying!');
  };

  const resetGame = () => {
    const newCells = cells.map((cell) =>
      cell.type === 'operation' ? { ...cell, value: '' } : cell
    );
    setCells(newCells);
    setMessage('Drag operations between digits to make 100');
    setHistory([]);
  };

  const availableOperations: Operation[] = ['+', '-', '*', '/', '(', ')'];

  const handleOperationsPanelDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    const { cell: sourceCell, index: sourceIndex } = JSON.parse(data);

    if (sourceCell.type !== 'operation' || sourceIndex === -1) return;

    setHistory((prev) => [...prev, [...cells]]);

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
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleOperationsPanelDrop}
      >
        <h3 className='panel-title'>Available Operations</h3>
        <div className='operations-container'>
          {availableOperations.map((op, index) => (
            <div
              key={`avail-op-${index}`}
              className='operation-tile'
              draggable
              onDragStart={(e) =>
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
            onDragStart={(e) => handleDragStart(e, cell, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
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
          Undo
        </button>
      </div>

      <div className='game-rules'>
        <h3 className='rules-title'>Rules:</h3>
        <ul className='rules-list'>
          <li>Drag operations between the digits</li>
          <li>Adjacent digits with no operation between them concatenate (e.g., 1 2 becomes 12)</li>
          <li>Use parentheses to control order of operations</li>
          <li>You must add an explicit operation between digits and brackets</li>
          <li>The ^ symbol represents exponentiation (e.g., 2^3 = 8)</li>
          <li>The expression must evaluate to exactly 100</li>
        </ul>
      </div>
    </div>
  );
};

export default HectocGame;

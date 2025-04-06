'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, X, Lightbulb, Timer } from 'lucide-react';
import { Wifi, Bluetooth } from 'lucide-react';
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
  const [timeLeft, setTimeLeft] = useState(59);
  const [touchDragging, setTouchDragging] = useState(false);
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
  const [touchSourceIndex, setTouchSourceIndex] = useState<number>(-1);
  const [touchSourceCell, setTouchSourceCell] = useState<Cell | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
        setMessage(`Current value: ${result} `);
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

  // Add this function for mobile touch handling
  const handleTouchStart = (e: React.TouchEvent, cell: Cell, index: number) => {
    if (!cell.draggable) return;

    setTouchDragging(true);
    setTouchSourceIndex(index);
    setTouchSourceCell(cell);
    setTouchPosition({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });

    // Create visual feedback
    const element = e.currentTarget;
    element.classList.add('touch-dragging');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragging) return;

    e.preventDefault(); // Prevent scrolling while dragging

    setTouchPosition({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });

    // Find drop target element under the touch point
    const elementsAtPoint = document.elementsFromPoint(touchPosition.x, touchPosition.y);
    const dropTargetEl = elementsAtPoint.find(
      (el) => el.classList.contains('operation-slot') || el.classList.contains('digit-cell')
    );

    // Highlight potential drop target
    document
      .querySelectorAll('.highlight-drop-target')
      .forEach((el) => el.classList.remove('highlight-drop-target'));

    if (dropTargetEl) {
      dropTargetEl.classList.add('highlight-drop-target');
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchDragging) return;

    const element = e.currentTarget;
    element.classList.remove('touch-dragging');

    // Find drop target element under the final touch point
    const elementsAtPoint = document.elementsFromPoint(touchPosition.x, touchPosition.y);
    const dropTargetEl = elementsAtPoint.find(
      (el) => el.classList.contains('operation-slot') || el.classList.contains('digit-cell')
    );

    if (dropTargetEl && touchSourceCell) {
      const targetIndex = parseInt(dropTargetEl.getAttribute('data-index') || '-1');

      if (targetIndex !== -1) {
        if (cells[targetIndex].type === 'digit') {
          const operationIndex =
            targetIndex > 0 && cells[targetIndex - 1].type === 'operation'
              ? targetIndex - 1
              : targetIndex < cells.length - 1 && cells[targetIndex + 1].type === 'operation'
                ? targetIndex + 1
                : -1;

          if (operationIndex !== -1) {
            handleOperationDrop(touchSourceCell, touchSourceIndex, operationIndex);
          }
        } else {
          handleOperationDrop(touchSourceCell, touchSourceIndex, targetIndex);
        }
      }
    }

    // Clear states
    setTouchDragging(false);
    setTouchSourceIndex(-1);
    setTouchSourceCell(null);

    // Remove all highlights
    document
      .querySelectorAll('.highlight-drop-target')
      .forEach((el) => el.classList.remove('highlight-drop-target'));
  };

  return (
    <div className='flex flex-col items-center min-h-screen text-white w-full max-w-md lg:max-w-xl mx-auto px-3 sm:px-4'>
      {/* Player scores - improved spacing */}
      <div className='w-full flex justify-between px-3 sm:px-4 mt-8 sm:mt-10 mb-6'>
        <div className='flex flex-col items-center'>
          <div className='w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-md'></div>
          <div className='mt-2 text-sm sm:text-sm'>You</div>
          <div className='text-sm text-gray-400'>12 XP</div>
          <div className='mt-2 bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-sm'>
            0
          </div>
        </div>
        <div className='flex flex-col items-center'>
          <div className='w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-md'></div>
          <div className='mt-2 text-sm sm:text-sm'>DMC</div>
          <div className='text-sm text-gray-400'>6 XP</div>
          <div className='mt-2 bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-sm'>
            0
          </div>
        </div>
      </div>

      {/* Timer - consistent spacing */}
      <div className='mb-6'>
        <div
          className={`w-20 h-10 sm:w-16 sm:h-12 rounded-xl border ${
            timeLeft === 0 ? 'border-red-500' : 'border-teal-500'
          } flex items-center justify-center`}
        >
          <span className='mr-2'>
            <Timer color={timeLeft === 0 ? '#FF0000' : '#00EFCA'} />
          </span>
          <div
            className={`${timeLeft === 0 ? 'text-red-500' : 'text-teal-500'} text-base sm:text-base`}
          >
            0:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Game board - improved spacing */}
      <div
        className='relative w-full max-w-md mx-auto border-t border-gray-800 pt-5'
        ref={gameAreaRef}
      >
        {/* Centered horizontal cell layout with consistent spacing */}
        <div className='flex flex-nowrap justify-center overflow-x-auto gap-2 sm:gap-3 mb-6 px-4 py-2'>
          {cells.map((cell, index) => (
            <div
              key={cell.id}
              data-index={index}
              className={`flex-shrink-0 flex items-center justify-center h-5 w-5 sm:h-14 sm:w-14 md:h-16 md:w-16 text-xl sm:text-2xl md:text-2xl ${
                cell.type === 'digit'
                  ? 'text-white font-medium digit-cell'
                  : cell.value
                    ? 'bg-gray-700 text-[#90FE95] rounded-md'
                    : 'bg-gray-600 rounded-full operation-slot'
              }`}
              draggable={cell.draggable}
              onDragStart={(e) => cell.draggable && handleDragStart(e, cell, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => cell.draggable && handleTouchStart(e, cell, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {cell.value}
            </div>
          ))}
        </div>

        {/* Dragged item visual - preserved sizing */}
        {touchDragging && touchSourceCell && (
          <div
            className='fixed bg-green-800 rounded-md w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center pointer-events-none z-50 touch-dragging-visual'
            style={{
              left: `${touchPosition.x - 20}px`,
              top: `${touchPosition.y - 20}px`,
            }}
          >
            {touchSourceCell.value ||
              (touchSourceCell.id.includes('plus')
                ? '+'
                : touchSourceCell.id.includes('minus')
                  ? '-'
                  : touchSourceCell.id.includes('multiply')
                    ? '×'
                    : touchSourceCell.id.includes('divide')
                      ? '/'
                      : touchSourceCell.id.includes('left-bracket')
                        ? '('
                        : touchSourceCell.id.includes('right-bracket')
                          ? ')'
                          : touchSourceCell.id.includes('exponent')
                            ? '^'
                            : '')}
          </div>
        )}

        {/* Result area - improved spacing */}
        <div className='mx-auto mb-4 w-[40%] max-w-xs h-14 sm:h-14 bg-gray-700 rounded-md flex items-center justify-center px-3'>
          <div className='text-lg sm:text-lg font-medium text-white truncate'>
            {message.includes('Current value:') ? message.replace('Current value:', '').trim() : ''}
          </div>
        </div>

        {/* Instructions - improved spacing */}
        <div className='text-center mb-8 text-sm sm:text-sm text-gray-300 px-3'>
          {!message.includes('Current value:') ? message : 'Drag the operations in the gaps'}
        </div>
      </div>

      {/* Operation buttons - improved spacing */}
      <div className='flex flex-col items-center gap-4 mb-8 px-3 sm:px-4 w-full max-w-xs sm:max-w-sm'>
        {/* First row */}
        <div className='flex justify-center gap-3 sm:gap-3 w-full'>
          <div
            className='w-14 h-14 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-900 rounded-full flex items-center justify-center cursor-grab touch-action-none'
            draggable
            data-op='+'
            onDragStart={(e) =>
              handleDragStart(
                e,
                { type: 'operation', value: '+', id: 'op-plus', draggable: true },
                -1
              )
            }
            onDragEnd={handleDragEnd}
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                { type: 'operation', value: '+', id: 'op-plus', draggable: true },
                -1
              )
            }
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Plus className='text-green-400 h-7 w-7 sm:h-7 sm:w-7' />
          </div>
          <div
            className='w-14 h-14 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-900 rounded-full flex items-center justify-center cursor-grab touch-action-none'
            draggable
            data-op='-'
            onDragStart={(e) =>
              handleDragStart(
                e,
                { type: 'operation', value: '-', id: 'op-minus', draggable: true },
                -1
              )
            }
            onDragEnd={handleDragEnd}
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                { type: 'operation', value: '-', id: 'op-minus', draggable: true },
                -1
              )
            }
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Minus className='text-green-400 h-7 w-7 sm:h-7 sm:w-7' />
          </div>
          <div
            className='w-14 h-14 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-900 rounded-full flex items-center justify-center cursor-grab touch-action-none'
            draggable
            data-op='*'
            onDragStart={(e) =>
              handleDragStart(
                e,
                { type: 'operation', value: '*', id: 'op-multiply', draggable: true },
                -1
              )
            }
            onDragEnd={handleDragEnd}
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                { type: 'operation', value: '*', id: 'op-multiply', draggable: true },
                -1
              )
            }
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <X className='text-green-400 h-7 w-7 sm:h-7 sm:w-7' />
          </div>
        </div>

        {/* Second row */}
        <div className='flex justify-center gap-3 sm:gap-3 w-full'>
          <div
            className='w-14 h-14 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-900 rounded-full flex items-center justify-center cursor-grab touch-action-none'
            draggable
            data-op='/'
            onDragStart={(e) =>
              handleDragStart(
                e,
                { type: 'operation', value: '/', id: 'op-divide', draggable: true },
                -1
              )
            }
            onDragEnd={handleDragEnd}
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                { type: 'operation', value: '/', id: 'op-divide', draggable: true },
                -1
              )
            }
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <span className='text-green-400 text-2xl sm:text-2xl'>/</span>
          </div>
          <div
            className='w-14 h-14 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-900 rounded-full flex items-center justify-center cursor-grab touch-action-none'
            draggable
            data-op='('
            onDragStart={(e) =>
              handleDragStart(
                e,
                { type: 'operation', value: '(', id: 'op-left-bracket', draggable: true },
                -1
              )
            }
            onDragEnd={handleDragEnd}
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                { type: 'operation', value: '(', id: 'op-left-bracket', draggable: true },
                -1
              )
            }
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <span className='text-green-400 text-2xl sm:text-2xl'>(</span>
          </div>
          <div
            className='w-14 h-14 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-900 rounded-full flex items-center justify-center cursor-grab touch-action-none'
            draggable
            data-op=')'
            onDragStart={(e) =>
              handleDragStart(
                e,
                { type: 'operation', value: ')', id: 'op-right-bracket', draggable: true },
                -1
              )
            }
            onDragEnd={handleDragEnd}
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                { type: 'operation', value: ')', id: 'op-right-bracket', draggable: true },
                -1
              )
            }
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <span className='text-green-400 text-2xl sm:text-2xl'>)</span>
          </div>
        </div>

        {/* Third row */}
        <div className='flex justify-center gap-3 sm:gap-3 w-full'>
          <div
            className='w-14 h-14 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-900 rounded-full flex items-center justify-center cursor-grab touch-action-none'
            draggable
            data-op='^'
            onDragStart={(e) =>
              handleDragStart(
                e,
                { type: 'operation', value: '^', id: 'op-exponent', draggable: true },
                -1
              )
            }
            onDragEnd={handleDragEnd}
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                { type: 'operation', value: '^', id: 'op-exponent', draggable: true },
                -1
              )
            }
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <span className='text-green-400 text-2xl sm:text-2xl'>^</span>
          </div>
          <div
            className='w-24 sm:w-24 h-14 sm:h-14 bg-green-900 rounded-xl flex items-center justify-center cursor-pointer'
            onClick={undoMove}
          >
            <span className='text-green-400 text-base sm:text-base'>Undo</span>
          </div>
        </div>
      </div>

      {/* Hint and Reset buttons - improved spacing */}
      <div className='flex justify-center gap-5 w-full max-w-xs sm:max-w-sm mb-8'>
        <button
          className='flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 sm:py-2.5 rounded-full text-base sm:text-base'
          onClick={() => {
            // Simple hint system
            const hasMultiplication = cells.some((cell) => cell.value === '*');
            const hasBrackets = cells.some((cell) => cell.value === '(' || cell.value === ')');

            if (!hasMultiplication) {
              setMessage('Hint: Try using multiplication to get larger values');
            } else if (!hasBrackets) {
              setMessage('Hint: Try using parentheses to control calculation order');
            } else {
              setMessage('Hint: Try different combinations to reach 100');
            }
          }}
        >
          <Lightbulb size={18} className='w-5 h-5 sm:w-5 sm:h-5' />
          <span>Hint</span>
        </button>
        <button
          className='flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 sm:py-2.5 rounded-full text-base sm:text-base'
          onClick={resetGame}
        >
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

export default HectocGame;

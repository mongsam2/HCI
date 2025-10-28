import React from "react";

type ButtonProps = {
  onArrowButtonClick: (buttonName: "prev" | "next") => void;
  onFunctionButtonClick: (buttonName: "f1" | "f2" | "f3" | "f4") => void;
};

export default function DotPadButtons({onArrowButtonClick, onFunctionButtonClick }: ButtonProps) {
  const buttons = [
    { label: "◀", name: "prev" },
    { label: "F1", name: "f1" },
    { label: "F2", name: "f2" },
    { label: "F3", name: "f3" },
    { label: "F4", name: "f4" },
    { label: "▶", name: "next" },
  ];

  return (
    <div className="dotpad-buttons">
      <button 
        className="dotpad-btn"
        onClick={() => onArrowButtonClick("prev")}
      >
        ◀
      </button>
      <button 
        className="dotpad-btn"
        onClick={() => onFunctionButtonClick("f1")}
      >
        F1
      </button>
      <button 
        className="dotpad-btn"
        onClick={() => onFunctionButtonClick("f2")}
      >
        F2
      </button>
      <button 
        className="dotpad-btn"
        onClick={() => onFunctionButtonClick("f3")}
      >
        F3
      </button>
      <button 
        className="dotpad-btn"
        onClick={() => onFunctionButtonClick("f4")}
      >
        F4
      </button>
      <button 
        className="dotpad-btn"
        onClick={() => onArrowButtonClick("next")}
      >
        ▶
      </button>
    </div>
  );
}

import { useRef } from "react";

import "./Knob.css";

function Knob({
    value = 0,
    min = 0,
    max = 100,
    step = 1,
    decimals = 0,
    label,
    unit = "",
    disabled = false,
    onChange = () => {}
}) {
    const dragRef = useRef(null);

    const percent = ((value - min) / (max - min)) * 100;

    const clamp = (v) => {
        v = Math.max(min, Math.min(max, v));
        return Math.round(v / step) * step;
    };

    const handleWheel = (e) => {
        if (disabled) return;
        e.preventDefault();

        let amount = step;

        if (e.shiftKey) {
            amount *= 10;
        }

        const newValue = value + (e.deltaY > 0 ? -amount : amount);

        onChange(clamp(newValue));
    };

    const startDrag = (e) => {
        if (disabled) return;

        dragRef.current = {
            y: e.clientY,
            value
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", stopDrag);
    };

    const handleMove = (e) => {
        if (!dragRef.current) return;

        const dy = dragRef.current.y - e.clientY;
        const newValue = dragRef.current.value + dy * step;

        onChange(clamp(newValue));
    };

    const stopDrag = () => {
        dragRef.current = null;

        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", stopDrag);
    };

    return (
        <div className={`knob ${disabled ? "disabled" : ""}`}>

            {label && (
                <span className="knob-label">
                    {label}
                </span>
            )}

            <span
                className="knob-knob"
                onWheel={handleWheel}
                onMouseDown={startDrag}
                style={{
                "--value": percent
                }}
            >
                <span className="knob-value">
                    {value.toFixed(decimals)}
                    {unit}
                </span>

                <span className="knob-indicator" />
            </span>
        </div>
    );
}

export default Knob
import { useState } from "react";
import MaterialSymbol from "./MaterialSymbol";

import "./Button.css"

function MixerButton({ label="", icon="", value=false, toggle=false, onclick: onClick=()=>{}}) {
    const [isOn, setIsOn] = useState(value);

    const handleClick = () => {
        let newValue = true;

        if (toggle) {
            newValue = !isOn;
            setIsOn(newValue);
        }

        onClick(newValue);
    }

    return (
        <div
            className={`button ${isOn ? 'on' : ''}`}
            onClick={handleClick}
        >
            {icon && (
                <MaterialSymbol>{icon}</MaterialSymbol>
            )}

            <span className="button-label">
                {label}
            </span>
        </div>
    )
}

export default MixerButton
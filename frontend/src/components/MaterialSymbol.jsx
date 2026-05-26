import "./MaterialSymbol.css";

function MaterialSymbol({ children, className = "" }) {
  return (
    <span className={`material-symbol ${className}`}>
      {children}
    </span>
  );
}

export default MaterialSymbol
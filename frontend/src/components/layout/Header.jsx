import MaterialSymbol from "../MaterialSymbol"
import "./Header.css"

function Header({
    hostname = "hostname",
    ip = "255.255.255.255",
    userViews = {},
    systemViews = {},
    currentView = "",
    onChangeView = ()=>{}
}) {

    return (
        <div className="header">
            <span className="header-title">MeeterLink</span>

            <div className="header-views">
                {Object.entries(userViews).map(([key, label]) => (
                    <span 
                        key={key}
                        className={key === currentView ? 'header-view active' : 'header-view'}
                        onClick={()=>{onChangeView(key)}}
                    >
                        {label}
                    </span>
                ))}
            </div>

            <span className="spacer"></span>

            <div className="header-views">
                {Object.entries(systemViews).map(([key, view]) => (
                    <span 
                        key={key}
                        className={key === currentView ? 'header-system-view active' : 'header-system-view'}
                        onClick={()=>{onChangeView(key)}}
                        title={view.label}
                    >
                        <MaterialSymbol>{view.icon}</MaterialSymbol>
                    </span>
                ))}
            </div>

            <div className="header-instance-info" title="Instance Info">
                <span className="header-instance-name">{hostname}</span>
                <span className="header-instance-ip">{ip}</span>
            </div>

            <div className="header-status">
                <MaterialSymbol className="status-icon" title="Connection Status">cell_tower</MaterialSymbol>
                <MaterialSymbol className="status-icon" title="Receiving">call_received</MaterialSymbol>
                <MaterialSymbol className="status-icon" title="Sending">call_made</MaterialSymbol>
            </div>
        </div>
    )
}

export default Header
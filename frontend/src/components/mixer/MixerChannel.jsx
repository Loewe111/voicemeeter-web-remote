
import MixerButton from '../Button'
import "./MixerChannel.css";


function MixerChannel({
    channel,
    onUpdate
}) {
    function updateChannel(obj) {
        onUpdate({ ...channel, ...obj });
    }

    const chType = channel.type === 'input' ? 'Input' : 'Output';
    const chLabel = channel.label || `${chType} ${channel.index + 1}`;

    return (
        <div className="channel">
            <div className="channel-icons"></div>
            <span className="channel-label">{chLabel}</span>
            <MixerButton label='EQ' toggle value={channel.eq} onclick={(v)=>updateChannel({eq: v})}/>
        </div>
    )
}

export default MixerChannel
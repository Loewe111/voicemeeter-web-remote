import { useState } from 'react'
import './App.css'
// import Symbol from './components/Symbol'
// import Button from './components/Button'
// import Knob from './components/Knob'
import MixerChannel from './components/mixer/MixerChannel';
import Header from './components/layout/Header'
import channelObject from './components/mixer/channelObject';

function App() {
  const [currentView, setCurrentView] = useState(0);

  const views = {}

  const systemViews = {
    _inputs: {label: "Inputs", icon: "input"},
    _outputs: {label: "Outputs", icon: "output"},
    _settings: {label: "Settings", icon: "settings"},
  }

  const [channel, setChannel] = useState(channelObject)

  return (
    <>
      <Header userViews={views} systemViews={systemViews} currentView={currentView} onChangeView={setCurrentView} />
      <MixerChannel channel={channel} onUpdate={setChannel}></MixerChannel>
    </>
  )
}

export default App

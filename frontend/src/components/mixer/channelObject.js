const channelObject = {
    isPhysical : false,
    type: 'input',
    index: 0,
    label : '',

    mono : false,
    mute : false,
    solo : false,
    gain : 0,
    limit : 0,
    routing : [ false, false, false, false, false, false, false, false ],
    fx : [0, 0, 0, 0],

    pan : 0,

    compressor : {
        gainin: 0,
        ratio: 1.0,
        threshold: -40,
        attack: 10,
        release: 50,
        knee: 0.5,
        gainout: 0,
        makeup: true,
    },

    gate : {
        threshold: -60,
        damping: -60,
        bpsidechain: 100,
        attack: 10,
        hold: 200,
        release: 1250,
    },

    denoiser : 0,

    eq : {
        on: true,
        cells: [
            { freq: 50, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 200, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 800, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 2000, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 8000, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 12000, gain: 0, q: 3.0, on: false, type: 0 },
        ]
    },

    bandEq : {
        bass: 0,
        mid: 0,
        treble: 0
    },
}

export default channelObject
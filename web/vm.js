class VMStrip {
    isPhysical = false;

    mono = false;
    mute = false;
    solo = false;
    gain = 0;
    limit = 0;
    routing = [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false
    ]
    label = '';
    fx = [0, 0, 0, 0];

    pan = 0;

    compressor = {
        gainin: 0,
        ratio: 1.0,
        threshold: -40,
        attack: 10,
        release: 50,
        knee: 0.5,
        gainout: 0,
        makeup: true,
    };

    gate = {
        threshold: -60,
        damping: -60,
        bpsidechain: 100,
        attack: 10,
        hold: 200,
        release: 1250,
    };

    denoiser = 0;

    eq = {
        on: false,
        cells: [
            { freq: 50, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 200, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 800, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 2000, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 8000, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 12000, gain: 0, q: 3.0, on: false, type: 0 },
        ]
    }

    bandEq = {
        bass: 0,
        mid: 0,
        treble: 0
    };

    capabilities = {
        parametric_eq: true,
        band_eq: true,
        compressor: true,
        gate: true,
        denoiser: true,
        fx: true,
    };

    device = null;
    device_rate = null;

    fromObject(object) {
        this.isPhysical = object.isPhysical || false;
        this.mono = object.mono;
        this.mute = object.mute;
        this.solo = object.solo;
        this.gain = object.gain;
        this.label = object.label;
        this.pan = object.pan || 0;
        this.limit = object.limit || 0;
        this.denoiser = object.denoiser || 0;
        this.device = object.device || null;
        this.device_rate = object.device_rate || null;

        if (object.isPhysical) {
            this.eq = object.eq || this.eq;
            this.compressor = object.compressor || this.compressor;
            this.gate = object.gate || this.gate;
            this.denoiser = object.denoiser || 0;
            this.capabilities = {
                parametric_eq: true,
                band_eq: false,
                compressor: true,
                gate: true,
                denoiser: true,
                fx: true,
            };
        } else {
            this.bandEq = object.band_eq || {};
            this.eqEnabled = this.bandEq.bass !== 0 || this.bandEq.mid !== 0 || this.bandEq.treble !== 0;
            this.capabilities = {
                parametric_eq: false,
                band_eq: true,
                compressor: false,
                gate: false,
                denoiser: false,
                fx: false,
            };
        }
        this.routing = object.routing || [
            false, false, false, false, false, false, false, false
        ];
        this.fx = object.fx || [0, 0, 0, 0];
    }

    asObject() {
        return {
            mono: this.mono,
            mute: this.mute,
            solo: this.solo,
            gain: this.gain,
            label: this.label,
            pan: this.pan,
            eq: this.eq,
            band_eq: this.bandEq,
            routing: this.routing,
            fx: this.fx,
            limit: this.limit,
            denoiser: this.denoiser,
            compressor: this.compressor,
            gate: this.gate,
        };
    }
}

class VMBus {
    isPhysical = false;

    mono = false;
    mute = false;
    sel = false;
    gain = 0;
    label = '';
    monitor = false;

    fx = [0, 0, 0, 0];

    eq = {
        on: false,
        cells: [
            { freq: 50, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 200, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 800, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 2000, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 8000, gain: 0, q: 3.0, on: false, type: 0 },
            { freq: 12000, gain: 0, q: 3.0, on: false, type: 0 },
        ]
    }

    capabilities = {
        parametric_eq: true,
        band_eq: false,
        compressor: false,
        gate: false,
        denoiser: false,
        fx: true,
    };

    device = null;
    device_rate = null;

    fromObject(object) {
        this.mono = object.mono;
        this.mute = object.mute;
        this.sel = object.sel;
        this.gain = object.gain;
        this.label = object.label;
        this.eq = object.eq || this.eq;
        this.fx = object.fx || this.fx;
        this.device = object.device || null;
        this.device_rate = object.device_rate || null;
        this.isPhysical = object.isPhysical || false;
        this.monitor = object.monitor || false;
    }

    asObject() {
        return {
            mono: this.mono,
            mute: this.mute,
            sel: this.sel,
            gain: this.gain,
            label: this.label,
            eq: this.eq,
            fx: this.fx,
        };
    }
}

class VBANStream {
    enabled = false;
    name = '';
    ip = '';
    port = 6980;
    samplerate = 48000;
    channels = 2;
    format = 16;
    quality = 0;
    route = 0;

    fromObject(object) {
        this.enabled = object.enabled;
        this.name = object.name;
        this.ip = object.ip;
        this.port = object.port;
        this.samplerate = object.samplerate;
        this.channels = object.channels;
        this.format = object.format;
        this.quality = object.quality;
        this.destination = object.destination;
        this.route = object.route;
    }

    asObject() {
        return {
            enabled: this.enabled,
            name: this.name,
            ip: this.ip,
            port: this.port,
            samplerate: this.samplerate,
            channels: this.channels,
            format: this.format,
            quality: this.quality,
            destination: this.destination,
            route: this.route
        };
    }
}
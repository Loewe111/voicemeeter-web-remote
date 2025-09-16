var ws;

var inputChannels = []; // "strips"
var outputChannels = []; // "busses"
var detailsChannel = null;
var vbanOptions = {
    incoming: [],
    outgoing: []
};
var deviceOptions = {
    inputElements: [],
    outputElements: []
};

var setup = {
    version: null,
    type: null
};

var settings = {
    sliderMode: 'normal', // normal, safe
}

const defaultStrip = new VMStrip();
const defaultBus = new VMBus();

const eqTypeImages = {
    0: '/images/eq_peak.svg',
    1: '/images/eq_notch.svg',
    2: '/images/eq_band_pass.svg',
    3: '/images/eq_high_cut.svg',
    4: '/images/eq_low_cut.svg',
    5: '/images/eq_low_shelf.svg',
    6: '/images/eq_high_shelf.svg',
}

const eqTypeNames = {
    0: 'PEAK',
    1: 'NOTCH',
    2: 'BAND PASS',
    3: 'HIGH CUT',
    4: 'LOW CUT',
    5: 'LOW SHELF',
    6: 'HIGH SHELF',
}

function createChannels(inputs, outputs) {
    // Clear existing channels
    $('#input-channels').empty();
    $('#output-channels').empty();
    inputChannels = [];
    outputChannels = [];
    for (let i = 1; i <= inputs; i++) {
        const channel = createInputChannel();
        inputChannels.push(channel);
    }
    for (let i = 1; i <= outputs; i++) {
        const channel = createOutputChannel();
        outputChannels.push(channel);
    }
}

function createInputChannel() {
    const channel = {};
    channel.type = 'input';
    channel.strip = new VMStrip();
    channel.element = $(document.createElement('div')).addClass('channel');
    channel.header = {};
    // Add channel label
    channel.header.label = $(document.createElement('span')).addClass('channel-label');
    channel.header.label.text('Input Channel');

    channel.header.icons = {};

    channel.header.icons.vban = $(document.createElement('span')).addClass('material-symbols-outlined').attr('data-icon', 'vban').attr('title', 'VBAN Input').text('lan');
    channel.header.icons.connected = $(document.createElement('span')).addClass('material-symbols-outlined').attr('data-icon', 'connected').attr('title', 'Physical Input').text('usb');
    channel.header.icons.compressor = $(document.createElement('span')).addClass('material-symbols-outlined').attr('data-icon', 'compressor').attr('title', 'Compressor').text('compress');
    channel.header.icons.gate = $(document.createElement('span')).addClass('material-symbols-outlined').attr('data-icon', 'gate').attr('title', 'Gate').text('filter_alt');
    channel.header.icons.eq = $(document.createElement('span')).addClass('material-symbols-outlined').attr('data-icon', 'eq').attr('title', '3 Band EQ').text('equalizer');

    const iconsContainer = $(document.createElement('div')).addClass('channel-icons');
    Object.values(channel.header.icons).forEach(icon => {
        iconsContainer.append(icon);
    });

    channel.element.append(iconsContainer);
    channel.element.append(channel.header.label);

    // Add Inputs
    channel.inputs = {};

    channel.inputs.eq = new Button(createButton('blue'), {
        label: 'EQ', value: false, toggle: true,
        onClick: (value) => {
            channel.strip.eq.on = value;
            channelChanged(channel);
            detailsViewRerender();
        }
    });

    channel.inputs.mono = new Button(createButton(), {
        label: 'Mono', value: false, toggle: true,
        onClick: (value) => {
            channel.strip.mono = value;
            channelChanged(channel);
        }
    });

    channel.inputs.solo = new Button(createButton('red'), {
        label: 'Solo', value: false, toggle: true,
        onClick: (value) => {
            channel.strip.solo = value;
            channelChanged(channel);
        }
    });

    channel.inputs.mute = new Button(createButton('red'), {
        label: 'Mute', value: false, toggle: true,
        onClick: (value) => {
            channel.strip.mute = value;
            channelChanged(channel);
        }
    });

    channel.inputs.gain = new Slider(createSlider(), {
        label: 'GAIN',
        hideLabel: true,
        min: -60,
        max: 10,
        step: 0.1,
        decimals: 1,
        value: 0,
        unit: 'dB',
        labels: 10,
        safeMode: settings.sliderMode === 'safe',
        onChange: (value) => {
            channel.strip.gain = value;
            channelChanged(channel);
        }
    });

    channel.inputs.options = new Button(createButton('blue'), {
        icon: 'expand_content',
        onClick: () => {
            createDetailsView(channel);
        }
    });

    Object.keys(channel.inputs).forEach(key => {
        channel.element.append(channel.inputs[key].element);
    });
    $('#input-channels').append(channel.element);

    return channel;
}

function createOutputChannel() {
    const channel = {}
    channel.type = 'output';
    channel.bus = new VMBus();
    channel.element = $(document.createElement('div')).addClass('channel');
    channel.header = {};
    // Add channel label
    channel.header.label = $(document.createElement('span')).addClass('channel-label');
    channel.header.label.text('Output Channel');

    channel.header.icons = {};

    channel.header.icons.vban = $(document.createElement('span')).addClass('material-symbols-outlined').attr('data-icon', 'vban').attr('title', 'VBAN Output').text('lan');
    channel.header.icons.connected = $(document.createElement('span')).addClass('material-symbols-outlined').attr('data-icon', 'connected').attr('title', 'Physical Output').text('usb');
    channel.header.icons.monitor = $(document.createElement('span')).addClass('material-symbols-outlined').attr('data-icon', 'monitor').attr('title', 'Monitor').text('headphones');

    const iconsContainer = $(document.createElement('div')).addClass('channel-icons');
    Object.values(channel.header.icons).forEach(icon => {
        iconsContainer.append(icon);
    });

    channel.element.append(iconsContainer);
    channel.element.append(channel.header.label);

    // Add Inputs
    channel.inputs = {};

    channel.inputs.eq = new Button(createButton('blue'), {
        label: 'EQ', value: false, toggle: true,
        onClick: (value) => {
            channel.bus.eq.on = value;
            channelChanged(channel);
            detailsViewRerender();
        }
    });

    channel.inputs.mono = new Button(createButton(), {
        label: 'Mono', value: false, toggle: true,
        onClick: (value) => {
            channel.bus.mono = value;
            channelChanged(channel);
        }
    });

    channel.inputs.sel = new Button(createButton(), {
        label: 'Select', value: false, toggle: true,
        onClick: (value) => {
            channel.bus.sel = value;
            channelChanged(channel);
            updateAllBusIcons();
        }
    });

    channel.inputs.mute = new Button(createButton('red'), {
        label: 'Mute', value: false, toggle: true,
        onClick: (value) => {
            channel.bus.mute = value;
            channelChanged(channel);
        }
    });

    channel.inputs.gain = new Slider(createSlider(), {
        label: 'GAIN',
        hideLabel: true,
        min: -60,
        max: 10,
        step: 0.1,
        decimals: 1,
        value: 0,
        unit: 'dB',
        labels: 10,
        safeMode: settings.sliderMode === 'safe',
        onChange: (value) => {
            channel.bus.gain = value;
            channelChanged(channel);
        }
    });

    channel.inputs.options = new Button(createButton('blue'), {
        icon: 'expand_content',
        onClick: () => {
            createDetailsView(channel);
        }
    });

    Object.keys(channel.inputs).forEach(key => {
        channel.element.append(channel.inputs[key].element);
    });

    $('#output-channels').append(channel.element);
    return channel;
}

function createDetailsView(channel) {
    const view = $('#details-view');
    const channelElement = $('#details-view .channel');
    channelElement.empty();

    detailsChannel = {
        channel: channel,
        channelIndex: channel.type === 'input' ? inputChannels.indexOf(channel) : outputChannels.indexOf(channel),
        type: channel.type,
        element: channelElement,
        inputs: channel.inputs,
        strip: channel.strip || null,
        bus: channel.bus || null,
        wrapper: channel.strip || channel.bus,
        options: {
            routing: [],
            fx: [],
            band_eq: {},
            advanced_eq: {},
            compressor: {},
            gate: {},
        }
    }

    const label = $(document.createElement('span')).addClass('channel-label');
    channelElement.append(label);

    Object.keys(channel.inputs).forEach(key => {
        channelElement.append(channel.inputs[key].element);
    });
    detailsChannel.inputs.options.element.hide();
    
    // General Input options

    const general_input_options = $('#options-input');
    general_input_options.find('.details-button').remove();
    general_input_options.find('.knob').remove();
    if (channel.type === 'input') {
        general_input_options.show();
        detailsChannel.options.pan = new Knob(createKnob('yellow'), {
            label: `PAN`, min: -0.5, max: 0.5, step: 0.01, decimals: 2, value: 0,
            onChange: (value) => {
                detailsChannel.strip.pan = value;
                channelChanged(channel);
            }
        });
        general_input_options.append(detailsChannel.options.pan.element);
        detailsChannel.options.limiter_enabled = new Button(createDetailsButton('red'), {
            label: 'Limiter', toggle: true,
            onClick: (value) => {
                if (value) {
                    detailsChannel.strip.limit = 0;
                    detailsChannel.options.limiter.enable();
                } else {
                    detailsChannel.strip.limit = 12;
                    detailsChannel.options.limiter.disable();
                }
                detailsChannel.options.limiter.setValue(0);
                channelChanged(channel);
            }
        });
        general_input_options.append(detailsChannel.options.limiter_enabled.element);
        detailsChannel.options.limiter = new Knob(createKnob('red'), {
            label: `LIMIT`, min: -40, max: 11, step: 1, unit: 'dB', value: 0,
            disabled: !detailsChannel.strip.limit,
            onChange: (value) => {
                detailsChannel.strip.limit = value;
                channelChanged(channel);
            }
        });
        general_input_options.append(detailsChannel.options.limiter.element);
        
        if (detailsChannel.strip.isPhysical) {
            detailsChannel.options.denoiser = new Knob(createKnob('blue'), {
                label: `DENOISER`, min: 0, max: 10, step: 0.1, decimals: 1, value: 0,
                onChange: (value) => {
                    detailsChannel.strip.denoiser = value;
                    channelChanged(channel);
                }
            });
            general_input_options.append(detailsChannel.options.denoiser.element);
        }
    } else {
        general_input_options.hide();
    }

    // Routing options
    const routing_options = $('#options-routing');
    if (channel.type === 'input') {
        routing_options.find('.details-button').remove();
        outputChannels.forEach((output, index) => {
            detailsChannel.options.routing.push(new Button(createDetailsButton(), {
                icon: 'arrow_forward', label: [`OUT ${index + 1}`, output.bus.label], toggle: true,
                onClick: (value) => {
                    detailsChannel.channel.strip.routing[index] = value;
                    channelChanged(detailsChannel.channel);
                }
            }));
            routing_options.append(detailsChannel.options.routing[index].element);
        });
        routing_options.show();
    } else {
        routing_options.hide();
    }

    // Effects options
    const effects_options = $('#options-effects');
    if (!detailsChannel.wrapper.capabilities.fx) {
        effects_options.hide();
    } else if (channel.type === 'input') {
        effects_options.show();
        effects_options.find('.option-title #options-effect-title-input').show();
        effects_options.find('.option-title #options-effect-title-output').hide();
    } else {
        effects_options.show();
        effects_options.find('.option-title #options-effect-title-input').hide();
        effects_options.find('.option-title #options-effect-title-output').show();
    }
    effects_options.find('.knob').remove();
    detailsChannel.wrapper.fx.forEach((fx, index) => {
        detailsChannel.options.fx.push(new Knob(createKnob(), {
            label: `FX ${index + 1}`, min: 0, max: 10, step: 0.1, decimals: 1, value: 0,
            onChange: (value) => {
                detailsChannel.wrapper.fx[index] = value;
                channelChanged(channel);
            }
        }));
        effects_options.append(detailsChannel.options.fx[index].element);
    });

    // EQ options
    const simple_eq_options = $('#options-simple-eq');
    const advanced_eq_options = $('#options-advanced-eq');
    simple_eq_options.find('.knob').remove();
    if (detailsChannel.wrapper.capabilities.band_eq) {
        // For Virtual input Channels, use 3 band EQ
        advanced_eq_options.hide();
        simple_eq_options.show();
        detailsChannel.options.band_eq.treble = new Knob(createKnob('red'), {
            label: `TREBLE`, min: -12, max: 12, step: 0.1, decimals: 1, value: 0,
            onChange: (value) => {
                detailsChannel.strip.bandEq.treble = value;
                channelChanged(channel);
                updateStripIcons(detailsChannel.channelIndex);
            }
        });
        simple_eq_options.append(detailsChannel.options.band_eq.treble.element);
        detailsChannel.options.band_eq.mid = new Knob(createKnob('red'), {
            label: `MID`, min: -12, max: 12, step: 0.1, decimals: 1, value: 0,
            onChange: (value) => {
                detailsChannel.strip.bandEq.mid = value;
                channelChanged(channel);
                updateStripIcons(detailsChannel.channelIndex);
            }
        });
        simple_eq_options.append(detailsChannel.options.band_eq.mid.element);
        detailsChannel.options.band_eq.bass = new Knob(createKnob('red'), {
            label: `BASS`, min: -12, max: 12, step: 0.1, decimals: 1, value: 0,
            onChange: (value) => {
                detailsChannel.strip.bandEq.bass = value;
                channelChanged(channel);
                updateStripIcons(detailsChannel.channelIndex);
            }
        });
        simple_eq_options.append(detailsChannel.options.band_eq.bass.element);
    } else if (detailsChannel.wrapper.capabilities.parametric_eq) {
        advanced_eq_options.show();
        simple_eq_options.hide();
        detailsChannel.options.advanced_eq.cells = [];
        const cellsContainer = $('#advanced-eq-cells');
        cellsContainer.empty();
        cellsContainer.append('<div class="eq-cell-header">ON</div>');
        cellsContainer.append('<div class="eq-cell-header">FREQ</div>');
        cellsContainer.append('<div class="eq-cell-header">GAIN</div>');
        cellsContainer.append('<div class="eq-cell-header">Q</div>');
        cellsContainer.append('<div class="eq-cell-header">TYPE</div>');

        for (let i = 0; i < 6; i++) {
            // create new cell
            const cell = {};
            cell.on = new Button(createDetailsButton('blue'), {
                label: 'ON', toggle: true, value: defaultStrip.eq.cells[i].on,
                onClick: (value) => {
                    detailsChannel.wrapper.eq.cells[i].on = value;
                    channelChanged(channel);
                    detailsViewRerender();
                }
            });
            cell.freq = new Knob(createKnob('blue'), {
                label: `FREQ ${i + 1}`, hideLabel: true, min: 20, max: 20000, step: 10, decimals: 0, unit: 'Hz', value: defaultStrip.eq.cells[i].freq, logarithmic: true,
                onChange: (value) => {
                    detailsChannel.wrapper.eq.cells[i].freq = value;
                    channelChanged(channel);
                    detailsViewRerender();
                }
            });
            cell.gain = new Knob(createKnob('blue'), {
                label: `GAIN ${i + 1}`, hideLabel: true, min: -36, max: 18, step: 0.1, decimals: 1, unit: 'dB', value: defaultStrip.eq.cells[i].gain,
                onChange: (value) => {
                    detailsChannel.wrapper.eq.cells[i].gain = value;
                    channelChanged(channel);
                    detailsViewRerender();
                }
            });
            cell.q = new Knob(createKnob('blue'), {
                label: `Q ${i + 1}`, hideLabel: true, min: 0.3, max: 100, step: 0.1, decimals: 1, value: defaultStrip.eq.cells[i].q,
                onChange: (value) => {
                    detailsChannel.wrapper.eq.cells[i].q = value;
                    channelChanged(channel);
                    detailsViewRerender();
                }
            });
            cell.type = [];
            const cellTypeElement = $(document.createElement('div')).addClass('eq-type-buttons');

            for (let type = 0; type < 7; type++) {
                const button = new Button(createDetailsButton('blue', true), {
                    image: eqTypeImages[type],
                    value: defaultStrip.eq.cells[i].type === type,
                    onClick: (value) => {
                        detailsChannel.wrapper.eq.cells[i].type = type;
                        updateDetailsView();
                        channelChanged(channel);
                    }
                });
                cell.type.push(button);
            }
            for (let type = 6; type >= 0; type--) {
                cellTypeElement.append(cell.type[type].element);
            }

            cellsContainer.append(cell.on.element);
            cellsContainer.append(cell.freq.element);
            cellsContainer.append(cell.gain.element);
            cellsContainer.append(cell.q.element);
            cellsContainer.append(cellTypeElement);
            detailsChannel.options.advanced_eq.cells.push(cell);
        }
    }

    // Compressor options
    const compressor_options = $('#options-compressor');
    compressor_options.find('.knob').remove();
    compressor_options.find('.details-button').remove();
    if (detailsChannel.wrapper.capabilities.compressor) {
        compressor_options.show();
        detailsChannel.options.compressor.gainin = new Knob(createKnob('blue'), {
            label: `INPUT GAIN`, min: -24, max: 24, step: 0.1, decimals: 1, unit: 'dB', value: defaultStrip.compressor.gainin,
            onChange: (value) => {
                channel.strip.compressor.gainin = value;
                channelChanged(channel);
                detailsViewRerender();
            }
        });
        detailsChannel.options.compressor.ratio = new Knob(createKnob('blue'), {
            label: `RATIO`, min: 1, max: 8, step: 0.05, decimals: 1, value: defaultStrip.compressor.ratio, displayValues: {'1': 'OFF'},
            onChange: (value) => {
                channel.strip.compressor.ratio = value;
                channelChanged(channel);
                detailsViewRerender();
                updateStripIcons(detailsChannel.channelIndex);
            }
        });
        detailsChannel.options.compressor.threshold = new Knob(createKnob('blue'), {
            label: `THRESHOLD`, min: -40, max: -3, step: 0.1, decimals: 1, unit: 'dB', value: defaultStrip.compressor.threshold,
            onChange: (value) => {
                channel.strip.compressor.threshold = value;
                channelChanged(channel);
                detailsViewRerender();
            }
        });
        detailsChannel.options.compressor.attack = new Knob(createKnob('blue'), {
            label: `ATTACK`, min: 0, max: 200, step: 1, decimals: 0, unit: 'ms', value: defaultStrip.compressor.attack,
            onChange: (value) => {
                channel.strip.compressor.attack = value;
                channelChanged(channel);
                detailsViewRerender();
            }
        });
        detailsChannel.options.compressor.release = new Knob(createKnob('blue'), {
            label: `RELEASE`, min: 0, max: 5000, step: 10, decimals: 0, unit: 'ms', value: defaultStrip.compressor.release,
            onChange: (value) => {
                channel.strip.compressor.release = value;
                channelChanged(channel);
                detailsViewRerender();
            }
        });
        detailsChannel.options.compressor.knee = new Knob(createKnob('blue'), {
            label: `KNEE`, min: 0, max: 1, step: 0.01, decimals: 2, value: defaultStrip.compressor.knee,
            onChange: (value) => {
                channel.strip.compressor.knee = value;
                channelChanged(channel);
                detailsViewRerender();
            }
        });
        detailsChannel.options.compressor.gainout = new Knob(createKnob('blue'), {
            label: `OUTPUT GAIN`, min: -24, max: 24, step: 0.1, decimals: 1, unit: 'dB', value: defaultStrip.compressor.gainout,
            onChange: (value) => {
                channel.strip.compressor.gainout = value;
                channelChanged(channel);
                detailsViewRerender();
            }
        });
        detailsChannel.options.compressor.makeup = new Button(createDetailsButton('blue'), {
            label: 'AUTO MAKEUP', toggle: true, value: defaultStrip.compressor.makeup,
            onClick: (value) => {
                channel.strip.compressor.makeup = value;
                channelChanged(channel);
                detailsViewRerender();
            }
        });
        detailsChannel.options.compressor.reset = new Button(createDetailsButton('red'), {
            label: 'Reset', onClick: () => {
                channel.strip.compressor = structuredClone(defaultStrip.compressor);
                channelChanged(channel);
                updateDetailsView();
                updateStripIcons(detailsChannel.channelIndex);
            }
        });
        compressor_options.append(detailsChannel.options.compressor.ratio.element);
        compressor_options.append(detailsChannel.options.compressor.threshold.element);
        compressor_options.append(detailsChannel.options.compressor.attack.element);
        compressor_options.append(detailsChannel.options.compressor.release.element);
        compressor_options.append(detailsChannel.options.compressor.knee.element);
        compressor_options.append(detailsChannel.options.compressor.gainin.element);
        compressor_options.append(detailsChannel.options.compressor.gainout.element);
        compressor_options.append(detailsChannel.options.compressor.makeup.element);
        compressor_options.append(detailsChannel.options.compressor.reset.element);
    } else {
        compressor_options.hide();
    }

    // Gate options
    const gate_options = $('#options-gate');
    gate_options.find('.knob').remove();
    gate_options.find('.details-button').remove();
    if (detailsChannel.wrapper.capabilities.gate) {
        gate_options.show();
        detailsChannel.options.gate.threshold = new Knob(createKnob('blue'), {
            label: `THRESHOLD`, min: -60, max: -10, step: 0.1, decimals: 1, unit: 'dB', value: defaultStrip.gate.threshold, displayValues: {'-60': 'OFF'},
            onChange: (value) => {
                channel.strip.gate.threshold = value;
                detailsViewRerender();
                channelChanged(channel);
                updateStripIcons(detailsChannel.channelIndex);
            }
        });
        detailsChannel.options.gate.damping = new Knob(createKnob('blue'), {
            label: `DAMPING`, min: -60, max: -10, step: 0.1, decimals: 1, unit: 'dB', value: defaultStrip.gate.damping, displayValues: {'-60': '-INF'},
            onChange: (value) => {
                channel.strip.gate.damping = value;
                detailsViewRerender();
                channelChanged(channel);
            }
        });
        detailsChannel.options.gate.bpsidechain = new Knob(createKnob('blue'), {
            label: `BPSIDECHAIN`, min: 100, max: 4000, step: 10, decimals: 0, unit: 'Hz', value: defaultStrip.gate.bpsidechain, displayValues: {'100': 'OFF'},
            onChange: (value) => {
                channel.strip.gate.bpsidechain = value;
                detailsViewRerender();
                channelChanged(channel);
            }
        });
        detailsChannel.options.gate.attack = new Knob(createKnob('blue'), {
            label: `ATTACK`, min: 0, max: 1000, step: 1, decimals: 0, unit: 'ms', value: defaultStrip.gate.attack,
            onChange: (value) => {
                channel.strip.gate.attack = value;
                detailsViewRerender();
                channelChanged(channel);
            }
        });
        detailsChannel.options.gate.hold = new Knob(createKnob('blue'), {
            label: `HOLD`, min: 0, max: 5000, step: 10, decimals: 0, unit: 'ms', value: defaultStrip.gate.hold,
            onChange: (value) => {
                channel.strip.gate.hold = value;
                detailsViewRerender();
                channelChanged(channel);
            }
        });
        detailsChannel.options.gate.release = new Knob(createKnob('blue'), {
            label: `RELEASE`, min: 0, max: 5000, step: 10, decimals: 0, unit: 'ms', value: defaultStrip.gate.release,
            onChange: (value) => {
                channel.strip.gate.release = value;
                detailsViewRerender();
                channelChanged(channel);
            }
        });
        detailsChannel.options.gate.reset = new Button(createDetailsButton('red'), {
            label: 'Reset', onClick: () => {
                channel.strip.gate = structuredClone(defaultStrip.gate);
                channelChanged(channel);
                updateDetailsView();
                updateStripIcons(detailsChannel.channelIndex);
            }
        });
        gate_options.append(detailsChannel.options.gate.threshold.element);
        gate_options.append(detailsChannel.options.gate.damping.element);
        gate_options.append(detailsChannel.options.gate.bpsidechain.element);
        gate_options.append(detailsChannel.options.gate.attack.element);
        gate_options.append(detailsChannel.options.gate.hold.element);
        gate_options.append(detailsChannel.options.gate.release.element);
        gate_options.append(detailsChannel.options.gate.reset.element);
    } else {
        gate_options.hide();
    }

    $('#channel-view').hide();
    view.show();
    updateDetailsView();
}

function updateDetailsView() {
    if (!detailsChannel) return;
    const channel = detailsChannel.channel;
    
    // Update channel label
    const index = detailsChannel.type === 'input' ? inputChannels.indexOf(channel) : outputChannels.indexOf(channel);
    const label = detailsChannel.strip ? detailsChannel.strip.label : detailsChannel.bus.label;
    detailsChannel.element.find('.channel-label').text(label || (channel.type === 'input' ? `Input ${index + 1}` : `Output ${index + 1}`));

    // Update General Input options
    if (detailsChannel.type === 'input') {
        detailsChannel.options.pan.setValue(detailsChannel.strip.pan);
        detailsChannel.options.limiter_enabled.setValue(detailsChannel.strip.limit !== 12);
        if (detailsChannel.strip.limit === 12) {
            detailsChannel.options.limiter.disable();
            detailsChannel.options.limiter.setValue(0);
        } else {
            detailsChannel.options.limiter.enable();
            detailsChannel.options.limiter.setValue(detailsChannel.strip.limit);
        }
        if (detailsChannel.strip.isPhysical) {
            detailsChannel.options.denoiser.setValue(detailsChannel.strip.denoiser || 0);
        }
    }

    // Update routing buttons
    if (detailsChannel.type === 'input') {
        detailsChannel.options.routing.forEach((button, index) => {
            button.setValue(detailsChannel.channel.strip.routing[index]);
        });
    }

    // Update FX knobs
    if (detailsChannel.wrapper.capabilities.fx) {
        detailsChannel.options.fx.forEach((knob, index) => {
            knob.setValue(detailsChannel.wrapper.fx[index]);
        });
    }

    // Update EQ knobs
    if (detailsChannel.wrapper.capabilities.band_eq) {
        detailsChannel.options.band_eq.treble.setValue(detailsChannel.strip.bandEq.treble);
        detailsChannel.options.band_eq.mid.setValue(detailsChannel.strip.bandEq.mid);
        detailsChannel.options.band_eq.bass.setValue(detailsChannel.strip.bandEq.bass);
    } else if (detailsChannel.wrapper.capabilities.parametric_eq) {
        detailsChannel.options.advanced_eq.cells.forEach((cell, index) => {
            cell.on.setValue(detailsChannel.wrapper.eq.cells[index].on);
            cell.freq.setValue(detailsChannel.wrapper.eq.cells[index].freq);
            cell.gain.setValue(detailsChannel.wrapper.eq.cells[index].gain);
            cell.q.setValue(detailsChannel.wrapper.eq.cells[index].q);
            cell.type.forEach((button, typeIndex) => {
                button.setValue(detailsChannel.wrapper.eq.cells[index].type === typeIndex);
            });
        });
    }

    // Update Compressor and Gate knobs
    if (detailsChannel.wrapper.capabilities.compressor) {
        detailsChannel.options.compressor.gainin.setValue(detailsChannel.strip.compressor.gainin);
        detailsChannel.options.compressor.ratio.setValue(detailsChannel.strip.compressor.ratio);
        detailsChannel.options.compressor.threshold.setValue(detailsChannel.strip.compressor.threshold);
        detailsChannel.options.compressor.attack.setValue(detailsChannel.strip.compressor.attack);
        detailsChannel.options.compressor.release.setValue(detailsChannel.strip.compressor.release);
        detailsChannel.options.compressor.knee.setValue(detailsChannel.strip.compressor.knee);
        detailsChannel.options.compressor.gainout.setValue(detailsChannel.strip.compressor.gainout);
        detailsChannel.options.compressor.makeup.setValue(detailsChannel.strip.compressor.makeup);
    }
    if (detailsChannel.wrapper.capabilities.gate) {
        detailsChannel.options.gate.threshold.setValue(detailsChannel.strip.gate.threshold);
        detailsChannel.options.gate.damping.setValue(detailsChannel.strip.gate.damping);
        detailsChannel.options.gate.bpsidechain.setValue(detailsChannel.strip.gate.bpsidechain);
        detailsChannel.options.gate.attack.setValue(detailsChannel.strip.gate.attack);
        detailsChannel.options.gate.hold.setValue(detailsChannel.strip.gate.hold);
        detailsChannel.options.gate.release.setValue(detailsChannel.strip.gate.release);
    }
    detailsViewRerender();
}

function detailsViewRerender() {
    if (!detailsChannel) return;
    if (detailsChannel.wrapper.capabilities.compressor) {
        drawCompressorPreview($('#compressor-preview')[0], detailsChannel.strip.compressor.ratio, detailsChannel.strip.compressor.threshold, detailsChannel.strip.compressor.knee);
    }
    if (detailsChannel.wrapper.capabilities.gate) {
        drawGatePreview($('#gate-preview')[0], detailsChannel.strip.gate.threshold, detailsChannel.strip.gate.damping);
    }
    if (detailsChannel.wrapper.capabilities.parametric_eq) {
        drawEQPreview($('#advanced-eq-preview')[0], detailsChannel.wrapper.eq.cells, detailsChannel.wrapper.eq.on);
    }
}

function closeDetailsView() {
    const view = $('#details-view');
    const channelElement = $('#details-view .channel');

    Object.keys(detailsChannel.inputs).forEach(key => {
        detailsChannel.channel.element.append(detailsChannel.inputs[key].element);
    });
    detailsChannel.inputs.options.element.show();

    detailsChannel = null;
    $('#channel-view').show();
    view.hide();
}

function initVbanOptions() {
    vbanOptions = {
        incomingElements: [],
        outgoingElements: [],
        incomingStreams: [],
        outgoingStreams: []
    }
    // incoming
    let incomingStreams = $('#vban-incoming-list');
    incomingStreams.find(':not(.vban-list-header)').remove();
    let templateHTML = $('#template-vban-incoming').html();
    for (let i = 0; i < 8; i++) {
        incomingStreams.append(templateHTML);
        let elements = {
            enabled: incomingStreams.find('.vban-list-enabled').eq(i),
            name: incomingStreams.find('.vban-list-name').eq(i),
            ip: incomingStreams.find('.vban-list-ip').eq(i),
            port: incomingStreams.find('.vban-list-port').eq(i),
            samplerate: incomingStreams.find('.vban-list-samplerate').eq(i),
            channels: incomingStreams.find('.vban-list-channels').eq(i),
            format: incomingStreams.find('.vban-list-format').eq(i),
            quality: incomingStreams.find('.vban-list-quality').eq(i),
            route: incomingStreams.find('.vban-list-route').eq(i)
        };

        elements.enabled.on('click', function() {
            elements.enabled.toggleClass('on');
            if (elements.enabled.hasClass('on')) {
                elements.enabled.find('.button-label material-symbol').text('check');
            } else {
                elements.enabled.find('.button-label material-symbol').text('close');
            }
            vbanOptions.incomingStreams[i].enabled = elements.enabled.hasClass('on');
            vbanOptionsChanged(true, i);
        });

        elements.name.on('change', function() {
            vbanOptions.incomingStreams[i].name = elements.name.val();
            vbanOptionsChanged(true, i);
        });

        elements.ip.on('change', function() {
            vbanOptions.incomingStreams[i].ip = elements.ip.val();
            vbanOptionsChanged(true, i);
        });

        elements.port.on('change', function() {
            vbanOptions.incomingStreams[i].port = parseInt(elements.port.val());
            vbanOptionsChanged(true, i);
        });

        elements.quality.on('change', function() {
            vbanOptions.incomingStreams[i].quality = parseInt(elements.quality.val());
            vbanOptionsChanged(true, i);
        });

        elements.route.on('change', function() {
            vbanOptions.incomingStreams[i].route = parseInt(elements.route.val());
            vbanOptionsChanged(true, i);
        });

        vbanOptions.incomingElements.push(elements);
        vbanOptions.incomingStreams.push(new VBANStream());
    }
    // outgoing
    let outgoingStreams = $('#vban-outgoing-list');
    outgoingStreams.find(':not(.vban-list-header)').remove();
    templateHTML = $('#template-vban-outgoing').html();
    for (let i = 0; i < 8; i++) {
        outgoingStreams.append(templateHTML);
        let elements = {
            enabled: outgoingStreams.find('.vban-list-enabled').eq(i),
            name: outgoingStreams.find('.vban-list-name').eq(i),
            ip: outgoingStreams.find('.vban-list-ip').eq(i),
            port: outgoingStreams.find('.vban-list-port').eq(i),
            samplerate: outgoingStreams.find('.vban-list-samplerate').eq(i),
            channels: outgoingStreams.find('.vban-list-channels').eq(i),
            format: outgoingStreams.find('.vban-list-format').eq(i),
            quality: outgoingStreams.find('.vban-list-quality').eq(i),
            route: outgoingStreams.find('.vban-list-route').eq(i)
        };

        elements.enabled.on('click', function() {
            elements.enabled.toggleClass('on');
            if (elements.enabled.hasClass('on')) {
                elements.enabled.find('.button-label material-symbol').text('check');
            } else {
                elements.enabled.find('.button-label material-symbol').text('close');
            }
            vbanOptions.outgoingStreams[i].enabled = elements.enabled.hasClass('on');
            vbanOptionsChanged(false, i);
        });

        elements.name.on('change', function() {
            vbanOptions.outgoingStreams[i].name = elements.name.val();
            vbanOptionsChanged(false, i);
        });

        elements.ip.on('change', function() {
            vbanOptions.outgoingStreams[i].ip = elements.ip.val();
            vbanOptionsChanged(false, i);
        });

        elements.port.on('change', function() {
            vbanOptions.outgoingStreams[i].port = elements.port.val();
            vbanOptionsChanged(false, i);
        });

        elements.samplerate.on('change', function() {
            vbanOptions.outgoingStreams[i].samplerate = parseInt(elements.samplerate.val());
            vbanOptionsChanged(false, i);
        });

        elements.channels.on('change', function() {
            vbanOptions.outgoingStreams[i].channels = parseInt(elements.channels.val());
            vbanOptionsChanged(false, i);
        });

        elements.format.on('change', function() {
            vbanOptions.outgoingStreams[i].format = parseInt(elements.format.val());
            vbanOptionsChanged(false, i);
        });

        elements.quality.on('change', function() {
            vbanOptions.outgoingStreams[i].quality = parseInt(elements.quality.val());
            vbanOptionsChanged(false, i);
        });

        elements.route.on('change', function() {
            vbanOptions.outgoingStreams[i].route = parseInt(elements.route.val());
            vbanOptionsChanged(false, i);
        });

        vbanOptions.outgoingElements.push(elements);
        vbanOptions.outgoingStreams.push(new VBANStream());
    }
}

function updateVbanOptions(data) {
    for (let i = 0; i < data.incoming.length; i++) {
        vbanOptions.incomingStreams[i].fromObject(data.incoming[i]);
    }
    for (let i = 0; i < data.outgoing.length; i++) {
        vbanOptions.outgoingStreams[i].fromObject(data.outgoing[i]);
    }

    vbanOptions.incomingStreams.forEach((stream, index) => {
        let elements = vbanOptions.incomingElements[index];
        elements.enabled.toggleClass('on', stream.enabled);
        elements.enabled.find('.button-label material-symbol').text(stream.enabled ? 'check' : 'close');
        if (!elements.name.is(':focus')) {
            elements.name.val(stream.name);
        }
        if (!elements.ip.is(':focus')) {
            elements.ip.val(stream.ip);
        }
        if (!elements.port.is(':focus')) {
            elements.port.val(stream.port);
        }
        elements.samplerate.text(`${stream.samplerate} Hz`);
        elements.channels.text(stream.channels);
        elements.format.text(`${stream.format} Bit`);
        elements.quality.val(stream.quality);
        elements.route.val(stream.route);

        elements.route.find('option').each(function( index ) {
            if (inputChannels[index].strip.label) {
                $(this).text(`Input ${index + 1} (${inputChannels[index].strip.label})`);
            } else {
                $(this).text(`Input ${index + 1}`);
            }
        });
    });
    vbanOptions.outgoingStreams.forEach((stream, index) => {
        let elements = vbanOptions.outgoingElements[index];
        elements.enabled.toggleClass('on', stream.enabled);
        elements.enabled.find('.button-label material-symbol').text(stream.enabled ? 'check' : 'close');
        if (!elements.name.is(':focus')) {
            elements.name.val(stream.name);
        }
        if (!elements.ip.is(':focus')) {
            elements.ip.val(stream.ip);
        }
        if (!elements.port.is(':focus')) {
            elements.port.val(stream.port);
        }
        elements.samplerate.val(stream.samplerate);
        elements.channels.val(stream.channels);
        elements.format.val(stream.format);
        elements.quality.val(stream.quality);
        elements.route.val(stream.route);

        elements.route.find('option').each(function( index ) {
            if (outputChannels[index].bus.label) {
                $(this).text(`Output ${index + 1} (${outputChannels[index].bus.label})`);
            } else {
                $(this).text(`Output ${index + 1}`);
            }
        });
    });

    // Update Channels
    inputChannels.forEach((channel, index) => {
        let vbanActive = false;
        if (vbanOptions && vbanOptions.incomingStreams) {
            vbanActive = vbanOptions.incomingStreams.some(stream => stream.enabled && stream.route === index);
        }
        channel.header.icons.vban.toggleClass('on', vbanActive);
    });

    outputChannels.forEach((channel, index) => {
        let vbanActive = false;
        if (vbanOptions && vbanOptions.outgoingStreams) {
            vbanActive = vbanOptions.outgoingStreams.some(stream => stream.enabled && stream.route === index);
        }
        channel.header.icons.vban.toggleClass('on', vbanActive);
    });
}

function vbanOptionsChanged(incoming, index) {
    console.log('VBAN options changed:', incoming, index);
    let message = {
        type: 'vban',
        direction: incoming ? 'incoming' : 'outgoing',
        index: index,
        values: vbanOptions[incoming ? 'incomingStreams' : 'outgoingStreams'][index].asObject()
    };
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        console.warn('WebSocket is not open. Cannot send VBAN options.');
    }
}

function initDevices() {
    deviceOptions.inputElements = [];
    deviceOptions.outputElements = [];

    let templateHTML = $('#template-device-list-entry').html();
    let inputsList = $('#device-inputs-list');
    inputsList.find(':not(.device-list-header)').remove();
    for (let i = 0; i < inputChannels.length; i++) {
        let channel = inputChannels[i];
        inputsList.append(templateHTML);
        let elements = {
            id: inputsList.find('.device-list-id').eq(i),
            name: inputsList.find('.device-list-name').eq(i),
            device: inputsList.find('.device-list-device').eq(i),
            samplerate: inputsList.find('.device-list-samplerate').eq(i),
            change: inputsList.find('.device-list-change').eq(i)
        };
        elements.id.text(`Input ${i + 1}`);
        elements.name.on('change', function() {
            channel.strip.label = $(this).val();
            channelChanged(channel);
        });
        elements.name.attr('placeholder', `Input ${i + 1}`);
        elements.change.click(function() {
            openDeviceSelector(channel, 'input');
        });

        deviceOptions.inputElements.push(elements);
    }

    let outputsList = $('#device-outputs-list');
    outputsList.find(':not(.device-list-header)').remove();
    for (let i = 0; i < outputChannels.length; i++) {
        let channel = outputChannels[i];
        outputsList.append(templateHTML);
        let elements = {
            id: outputsList.find('.device-list-id').eq(i),
            name: outputsList.find('.device-list-name').eq(i),
            device: outputsList.find('.device-list-device').eq(i),
            samplerate: outputsList.find('.device-list-samplerate').eq(i),
            change: outputsList.find('.device-list-change').eq(i)
        };
        elements.id.text(`Output ${i + 1}`);
        elements.name.on('change', function() {
            channel.bus.label = $(this).val();
            channelChanged(channel);
        });
        elements.name.attr('placeholder', `Output ${i + 1}`);
        elements.change.click(function() {
            openDeviceSelector(channel, 'output');
        });

        deviceOptions.outputElements.push(elements);
    }
}

function updateDevices() {
    inputChannels.forEach((channel, index) => {
        let elements = deviceOptions.inputElements[index];
        if (!elements.name.is(':focus')) {
            elements.name.val(channel.strip.label || '');
        }
        elements.samplerate.text(channel.strip.device_rate ? `${channel.strip.device_rate} Hz` : '');
        if (channel.strip.isPhysical) {
            elements.device.text(channel.strip.device || '');
            elements.change.css('visibility', '');
        } else {
            elements.device.text('VAIO Virtual Input');
            elements.change.css('visibility', 'hidden');
        }
    });
    outputChannels.forEach((channel, index) => {
        let elements = deviceOptions.outputElements[index];
        if (!elements.name.is(':focus')) {
            elements.name.val(channel.bus.label || '');
        }
        elements.samplerate.text(channel.bus.device_rate ? `${channel.bus.device_rate} Hz` : '');
        if (channel.bus.isPhysical) {
            elements.device.text(channel.bus.device || '');
            elements.change.css('visibility', '');
        } else {
            elements.device.text('VAIO Virtual Output');
            elements.change.css('visibility', 'hidden');
        }
    });
}

function openDeviceSelector(channel, type = "input") {
    $('#device-selector').show();
    $('#device-selector-list > :not(.device-list-header)').remove();
    let templateHTML = $('#template-device-selector-device').html();
    // Add Remove Device Selection option
    $('#device-selector-list').append(templateHTML);
    let deviceElement = $('#device-selector-list').children().last();
    deviceElement.find('.device-name').text('Remove Device Selection');
    deviceElement.click(function() {
        $(`#device-selector`).hide();
        selectDevice(channel, 'wdm', '');
    });
    // Add option for each device
    setup.devices[type].forEach(element => {
        if(element.type.toLowerCase() == 'asio') return;
        $('#device-selector-list').append(templateHTML);
        let deviceElement = $('#device-selector-list').children().last();
        deviceElement.find('.device-type').text(element.type.toUpperCase());
        deviceElement.find('.device-name').text(element.name);
        deviceElement.attr('title', element.id);
        deviceElement.click(function() {
            $(`#device-selector`).hide();
            selectDevice(channel, element.type, element.name);
        });
    });
    let channelName;
    if (type === "input") {
        channelName = channel.strip.label || `Input ${inputChannels.indexOf(channel) + 1}`;
    } else {
        channelName = channel.bus.label || `Output ${outputChannels.indexOf(channel) + 1}`;
    }
    $('#device-selector-title').text(channelName);
    $('#device-selector-close').click(closeDeviceSelector);
}

function closeDeviceSelector() {
    $('#device-selector').hide();
}

function selectDevice(channel, device_type, device_name) {
    sendWebSocket({
        type: 'device',
        channel_type: channel.type,
        channel_index: channel.type === 'input' ? inputChannels.indexOf(channel) : outputChannels.indexOf(channel),
        device_type: device_type,
        device_name: device_name
    });
    requestUpdate();
}

function updateSetup(data) {
    setup = data;
    $('.vm-info-version').text(setup.version);
    $('.vm-info-type').text(setup.type);
    $('.vm-info-version-string').text(`Voicemeeter ${setup.type} ${setup.version}`.toUpperCase());
    $('#instance-info .header-instance-name').text(setup.hostname);
    $('#instance-info .header-instance-ip').text(setup.ip_address);
    $('#instance-info').show();
    document.title = `MeeterLink (${setup.hostname})`;
}

function updateBusses(busses) {
    busses.forEach((bus, index) => {
        let channel = outputChannels[index];
        channel.bus.fromObject(bus);
        channel.element.find('.channel-label').text(bus.label || `Output ${index + 1}`);
        channel.inputs.eq.setValue(channel.bus.eq.on);
        channel.inputs.mono.setValue(channel.bus.mono);
        channel.inputs.mute.setValue(channel.bus.mute);
        channel.inputs.sel.setValue(channel.bus.sel);
        channel.inputs.gain.setValue(channel.bus.gain);

        if (detailsChannel && detailsChannel.channel === channel) {
            updateDetailsView();
        }

        updateBusIcons(index);
    });

    updateMonitorSettings();
}

function updateAllBusIcons() {
    outputChannels.forEach((channel, index) => {
        updateBusIcons(index);
    });
}

function updateBusIcons(index) {
    let channel = outputChannels[index];
    channel.header.icons.connected.toggle(channel.bus.isPhysical);
    channel.header.icons.connected.toggleClass('on', !!channel.bus.device && channel.bus.device.length > 0);
    channel.header.icons.monitor.toggle(channel.bus.monitor);

    let monitoring = outputChannels.some(ch => ch.bus.sel); // check if any output has sel active
    channel.header.icons.monitor.toggleClass('on', monitoring);

    let vbanActive = false;
    if (vbanOptions && vbanOptions.outgoingStreams) {
        vbanActive = vbanOptions.outgoingStreams.some(stream => stream.enabled && stream.route === index);
    }
    channel.header.icons.vban.toggleClass('on', vbanActive);
}

function updateStrips(strips) {
    strips.forEach((strip, index) => {
        let channel = inputChannels[index];
        channel.strip.fromObject(strip);
        channel.header.label.text(strip.label || `Input ${index + 1}`);

        channel.inputs.eq.setValue(channel.strip.eq.on);
        channel.inputs.eq.hide(!channel.strip.isPhysical); // Hide EQ button for virtual strips
        channel.inputs.mono.setValue(channel.strip.mono);
        channel.inputs.mono.hide(!channel.strip.isPhysical); // Hide mono button for virtual strips
        channel.inputs.mute.setValue(channel.strip.mute);
        channel.inputs.solo.setValue(channel.strip.solo);
        channel.inputs.gain.setValue(channel.strip.gain);

        if (detailsChannel && detailsChannel.channel === channel) {
            updateDetailsView();
        }

        updateStripIcons(index);
    });
}

function updateStripIcons(index) {
    let channel = inputChannels[index];
    channel.header.icons.compressor.toggle(channel.strip.capabilities.compressor);
    channel.header.icons.compressor.toggleClass('on', channel.strip.compressor.ratio > 1);
    channel.header.icons.gate.toggle(channel.strip.capabilities.gate);
    channel.header.icons.gate.toggleClass('on', channel.strip.gate.threshold > -60);
    channel.header.icons.connected.toggle(channel.strip.isPhysical);
    channel.header.icons.connected.toggleClass('on', !!channel.strip.device && channel.strip.device.length > 0);
    channel.header.icons.eq.toggle(channel.strip.capabilities.band_eq);
    channel.header.icons.eq.toggleClass('on', channel.strip.bandEq.bass !== 0 || channel.strip.bandEq.mid !== 0 || channel.strip.bandEq.treble !== 0);

    let vbanActive = false;
    if (vbanOptions && vbanOptions.incomingStreams) {
        vbanActive = vbanOptions.incomingStreams.some(stream => stream.enabled && stream.route === index);
    }
    channel.header.icons.vban.toggleClass('on', vbanActive);
}

function updateMonitorSettings() {
    $('#settings-monitor-channel-select').empty();
    outputChannels.forEach((channel, index) => {
        let option = $('<option></option>').val(index).text(channel.bus.label ? `Output ${index + 1} (${channel.bus.label})` : `Output ${index + 1}`);
        $('#settings-monitor-channel-select').append(option);
        if (channel.bus.monitor) {
            $('#settings-monitor-channel-select').val(index);
        }
    });
    $('#settings-monitor-channel-select').on('change', function() {
        let selectedIndex = parseInt($(this).val());
        sendWebSocket({ type: 'action', action: 'set-monitor-channel', index: selectedIndex });
        updateAllBusIcons();
    });
}

function updateVULevels(levels) {
    outputChannels.forEach((channel, index) => {
        let level_total = 0;
        let level_channels = levels.outputs[index];
        let validLevels = level_channels.filter(level => level !== -200);

        if (validLevels.length === 0) {
            level_total = -200;
        } else {
            validLevels.forEach((level, i) => {
                level_total += level;
                level_total /= 2;
            });
        }
        channel.inputs.gain.setVUMeter(level_total);
    });
    inputChannels.forEach((channel, index) => {
        let level_total = 0;
        let level_channels = levels.inputs[index];
        let validLevels = level_channels.filter(level => level !== -200);

        if (validLevels.length === 0) {
            level_total = -200;
        } else {
            validLevels.forEach((level, i) => {
                level_total += level;
                level_total /= 2;
            });
        }
        channel.inputs.gain.setVUMeter(level_total);
    });
}

function channelChanged(channel) {
    if (channel.type === 'input') {
        const strip = channel.strip;
        sendWebSocket({
            type: 'strip',
            index: inputChannels.indexOf(channel),
            values: strip.asObject()
        });
    }
    if (channel.type === 'output') {
        const bus = channel.bus;
        sendWebSocket({
            type: 'bus',
            index: outputChannels.indexOf(channel),
            values: bus.asObject()
        });
    }
}

function setStatusIcon(element, status) {
    if (element) {
        element.toggleClass('ok', status === 'ok');
        element.toggleClass('error', status === 'error');
    }
}

function blinkStatusIcon(element, duration = 100) {
    if (element) {
        element.addClass('activity');
        setTimeout(() => {
            element.removeClass('activity');
        }, duration);
    }
}

// Websocket connection

function requestUpdate() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        sendWebSocket({ type: 'update' });
    }
}

function websocketTask() {
    if (!ws || ws.readyState == WebSocket.CLOSED) {
        console.warn('WebSocket is closed. Reconnecting...');
        connectWebSocket();
        return;
    }
    if (!ws || ws.readyState != WebSocket.OPEN) {
        return;
    }

    requestUpdate();
}

var wsTaskInterval;

function connectWebSocket() {
    ws = new WebSocket(`ws://${location.host}/ws`);

    ws.onopen = function() {
        setStatusIcon($('#status-connected'), 'ok');
        console.log('WebSocket connection established');
        if (detailsChannel) {
            closeDetailsView();
        }
        sendWebSocket({ type: 'update' });
    };

    ws.onmessage = function(event) {
        blinkStatusIcon($('#status-receiving'), 100);
        const data = JSON.parse(event.data);

        if (data.setup) {
            createChannels(data.setup.inputs, data.setup.outputs);
            updateSetup(data.setup);
            initDevices();
            console.log('Received setup:', data.setup);
        }
        if (data.levels) {
            updateVULevels(data.levels);
        }
        if (data.busses) {
            updateBusses(data.busses);
            updateDevices();
            console.log('Received busses:', data.busses);
        }
        if (data.strips) {
            updateStrips(data.strips);
            updateDevices();
            console.log('Received strips:', data.strips);
        }
        if (data.vban) {
            updateVbanOptions(data.vban);
            console.log('Received VBAN options:', data.vban);
        }
        // console.log('Received data:', data);
    };

    ws.onclose = function() {
        setStatusIcon($('#status-connected'), 'error');
        console.log('WebSocket connection closed');
    };

    ws.onerror = function(error) {
        setStatusIcon($('#status-connected'), 'error');
        console.error('WebSocket error:', error);
    };
}

function sendWebSocket(message) {
    console.log(message);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        blinkStatusIcon($('#status-sending'), 100);
    } else {
        console.error('WebSocket is not open. Cannot send message:', message);
    }
}

function switchToView(id) {
    $('#views .header-view').removeClass('active');
    $(`#views .header-view#${id}`).addClass('active');
    if (detailsChannel) {
        closeDetailsView();
    }
    $('#channel-view').toggle(id !== 'view-settings');
    $('#channel-view-group-inputs').toggle(id !== 'view-outputs');
    $('#channel-view-group-outputs').toggle(id !== 'view-inputs');
    $('#settings-view').toggle(id === 'view-settings');
    if(id !== 'view-settings') {
        localStorage.setItem('channelView', id);
    }
}

function switchToSettingsGroup(id) {
    $('.settings-nav-item').removeClass('active');
    $(`.settings-nav-item#${id}`).addClass('active');
    $('.settings-view-group').hide();
    $(`#group-${id}`).show();
}

function init() {
    connectWebSocket();
    if (!wsTaskInterval) {
        wsTaskInterval = setInterval(websocketTask, 2000);
    }

    $('#view-all, #view-inputs, #view-outputs, #view-settings').click(function() {
        switchToView(this.id)
    });
    switchToView(localStorage.getItem('channelView') || 'view-all');

    $('#details-back-button').click(function() {
        closeDetailsView();
    });

    updateMonitorSettings();
    $('#settings-restart-audio-engine').click(function() {
        sendWebSocket({ type: 'action', action: 'restart-audio-engine' });
    });
    $('#settings-general, #settings-vban, #settings-devices').click(function() {
        switchToSettingsGroup(this.id);
    });
    switchToSettingsGroup('settings-general');

    settings = JSON.parse(localStorage.getItem('settings')) || settings;

    $('#settings-slider-mode-select').val(settings.sliderMode);
    $('#settings-slider-mode-select').on('change', function() {
        settings.sliderMode = $(this).val();
        localStorage.setItem('settings', JSON.stringify(settings));

        // Update existing sliders
        inputChannels.forEach(channel => {
            channel.inputs.gain.safeMode = settings.sliderMode === 'safe';
        });
        outputChannels.forEach(channel => {
            channel.inputs.gain.safeMode = settings.sliderMode === 'safe';
        });
    });

    $('#settings-fullscreen-toggle').on('click', function() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    $(window).resize(function() {
        detailsViewRerender();
    });

    initVbanOptions();
}

$(document).ready(function() {
    init();
});
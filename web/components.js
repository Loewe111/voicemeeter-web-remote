
// Knob

class Knob {
    constructor(element, options = {}) {
        this.element = element;

        this.defaultValue = options.defaultValue || options.value || 0;
        this.value = options.value || options.defaultValue || 0;
        this.min = options.min || 0;
        this.max = options.max || 100;
        
        this.step = options.step || 1;
        this.decimals = options.decimals || 0;

        this.label = options.label || '';
        this.displayValues = options.displayValues || {};

        this.unit = options.unit || '';
        this.onchange = options.onChange || function() {};

        this._drag = {
            startValue: 0,
            startX: 0,
            startY: 0,
            dragging: false,
            startTimer: null
        }

        this.init();

        this.disabled = options.disabled || false;

        if (this.disabled) {
            this.disable();
        }
    }

    init() {
        this._elements = {
            knob: this.element.find('.knob-knob'),
            value: this.element.find('.knob-value'),
            label: this.element.find('.knob-label'),
        }

        this._elements.label.text(this.label);
        if (this.label === '') {
            this._elements.label.hide();
        }

        this._update();

        this._elements.knob.on('mousedown', (e) => this._dragStart(e));
        this._elements.knob.on('wheel', (e) => this._wheel(e));
        $(document).on('mouseup', (e) => this._dragEnd(e));
        $(document).on('mouseleave', (e) => this._dragEnd(e));
        $(document).on('mousemove', (e) => this._dragMove(e));
        this.element.on('touchstart', (e) => this._dragStart(e));
        this.element.on('touchmove', (e) => this._dragMove(e));
        this.element.on('touchend', (e) => this._dragEnd(e));
        this.element.on('dblclick', (e) => this._reset(e));
    }

    _wheel(event) {
        if (this.disabled) return;
        event.preventDefault();

        const delta = event.originalEvent.deltaY || -event.originalEvent.wheelDeltaY || -event.originalEvent.wheelDelta;

        let step = this.step;
        if (event.originalEvent.shiftKey) step = this.step * 10;

        let newValue = this.value + (delta > 0 ? -step : step);

        if (newValue < this.min) newValue = this.min;
        if (newValue > this.max) newValue = this.max;

        if (newValue !== this.value) {
            this.setValue(newValue);
            this.onchange(this.value);
        }
    }

    _reset(event) {
        if (this.disabled) return;
        this.setValue(this.defaultValue);
        this.onchange(this.value);
    }

    _update() {
        // convert to 0 - 100 percent
        const percent = (this.value - this.min) / (this.max - this.min) * 100;
        this.element.css('--value', percent);
        if (this.displayValues[this.value] !== undefined) {
            this._elements.value.text(this.displayValues[this.value]);
        } else {
            this._elements.value.text(`${this.value.toFixed(this.decimals)}${this.unit}`);
        }
    }

    _dragStart(event) {
        if (this.disabled) return;
        this._drag.startValue = this.value;
        this._drag.startX = this._eventPosition(event.originalEvent).x;
        this._drag.startY = this._eventPosition(event.originalEvent).y;
        this.element.addClass('dragging')
        this._drag.dragging = true;
    }

    _dragEnd(event) {
        if (this.disabled) return;
        clearTimeout(this._drag.startTimer);
        this.element.removeClass('dragging');
        this._drag.dragging = false;
    }

    _dragMove(event) {
        if (this.disabled) return;
        if (!this._drag.dragging) return;

        const dx = this._eventPosition(event.originalEvent).x - this._drag.startX;
        const dy = this._eventPosition(event.originalEvent).y - this._drag.startY;

        let step = this.step;
        if (event.originalEvent.shiftKey) step = this.step * 10;
        if (this._isTouchEvent(event)) step = this.step * 0.5;

        let newValue = this._drag.startValue - dy * step;

        if (newValue < this.min) newValue = this.min;
        if (newValue > this.max) newValue = this.max;

        if (newValue !== this.value) {
            this.setValue(newValue);
            this.onchange(this.value);
        }

        this._drag.startX = this._eventPosition(event.originalEvent).x;
        this._drag.startY = this._eventPosition(event.originalEvent).y;
        this._drag.startValue = newValue;
    }

    _eventPosition(ev) {
        if (ev.targetTouches && ev.targetTouches.length) {
            return {
                x: ev.targetTouches[0].clientX,
                y: ev.targetTouches[0].clientY
            }
        } else {
            return {
                x: ev.clientX,
                y: ev.clientY
            };
        }
    }

    _isTouchEvent(event) {
        return event.type.startsWith('touch');
    }

    setValue(newValue) {
        if (newValue < this.min || newValue > this.max) {
            throw new Error(`Value must be between ${this.min} and ${this.max}`);
        }
        if (newValue % this.step !== 0) { // Make value a multiple of step
            newValue = Math.round(newValue / this.step) * this.step;
        }

        this.value = newValue;
        this._update();
    }

    disable() {
        this.element.addClass('disabled');
        this.disabled = true;
    }

    enable() {
        this.element.removeClass('disabled');
        this.disabled = false;
    }
}

class Slider {
    constructor(element, options = {}) {
        this.element = element;

        this.defaultValue = options.defaultValue || options.value || 0;
        this.value = options.value || options.defaultValue || 0;
        this.position = 0;
        this.min = options.min || 0;
        this.max = options.max || 100;
        this.scale = options.scale || 'linear';

        this.step = options.step || 1;
        this.decimals = options.decimals || 0;

        this.label = options.label || '';
        this.labels = options.labels || 0; // Number of labels to show

        this.unit = options.unit || '';
        this.onchange = options.onChange || function() {};

        this._drag = {
            startValue: 0,
            dragging: false,
            startTimer: null
        }

        this.init();
    }

    init() {
        this._elements = {
            knob: this.element.find('.slider-knob'),
            value: this.element.find('.slider-value'),
            range: this.element.find('.slider-range'),
            label: this.element.find('.slider-label'),
            labels: this.element.find('.slider-labels'),
            vuMeter: this.element.find('.slider-vu')
        }

        this._elements.knob.on('mousedown', (e) => this._dragStart(e));
        this.element.on('wheel', (e) => this._wheel(e));
        $(document).on('mouseup', (e) => this._dragEnd(e));
        $(document).on('mouseleave', (e) => this._dragEnd(e));
        $(document).on('mousemove', (e) => this._dragMove(e));
        this._elements.knob.on('touchstart', (e) => this._dragStart(e));
        this._elements.knob.on('touchmove', (e) => this._dragMove(e));
        this._elements.knob.on('touchend', (e) => this._dragEnd(e));
        this.element.on('dblclick', (e) => this._reset(e));
        this._elements.range.on('click', (e) => this._rangeClick(e));

        this._elements.label.text(this.label);

        this._elements.vuMeter.hide();

        this._createLabels();
        this._update();
    }

    _reset(event) {
        this.setValue(this.defaultValue);
        this.onchange(this.value);
    }

    _update() {
        this.position = this._getPercent(this.value);
        this.element.css('--value', this.position);
        this._elements.value.text(`${this.value.toFixed(this.decimals)} ${this.unit}`);
    }

    _rangeClick(event) {
        const yStart = this._elements.range.offset().top;
        const yEnd = this._elements.range.offset().top + this._elements.range.outerHeight();
        let percent = (this._eventPosition(event.originalEvent).y - yStart) / (yEnd - yStart);

        let newValue = this.max + percent * (this.min - this.max);

        if (newValue < this.min) newValue = this.min;
        if (newValue > this.max) newValue = this.max;

        if (newValue !== this.value) {
            this.setValue(newValue);
            this.onchange(this.value);
        }
    }

    _wheel(event) {
        event.preventDefault();
        const delta = event.originalEvent.deltaY || -event.originalEvent.wheelDeltaY || -event.originalEvent.wheelDelta;
        let step = this.step;
        if (event.originalEvent.shiftKey) step = this.step * 10;

        let newValue = this.value + (delta > 0 ? -step : step);

        if (newValue < this.min) newValue = this.min;
        if (newValue > this.max) newValue = this.max;

        if (newValue !== this.value) {
            this.setValue(newValue);
            this.onchange(this.value);
        }
    }

    _dragStart(event) {
        this._drag.startValue = this.value;
        this.element.addClass('dragging');
        this._drag.dragging = true;
    }

    _dragEnd(event) {
        clearTimeout(this._drag.startTimer);
        this.element.removeClass('dragging');
        this._drag.dragging = false;
    }

    _dragMove(event) {
        if (!this._drag.dragging) return;

        const yStart = this._elements.range.offset().top;
        const yEnd = this._elements.range.offset().top + this._elements.range.outerHeight();

        let percent = (this._eventPosition(event.originalEvent).y - yStart) / (yEnd - yStart);

        let newValue = this.max + percent * (this.min - this.max);

        if (newValue < this.min) newValue = this.min;
        if (newValue > this.max) newValue = this.max;
        if (newValue !== this.value) {
            this.setValue(newValue);
            this.onchange(this.value);
        }
    }

    _getPercent(value) {
        return (value - this.min) / (this.max - this.min) * 100;
    }

    _eventPosition(ev) {
        if (ev.targetTouches && ev.targetTouches.length) {
            return {
                x: ev.targetTouches[0].clientX,
                y: ev.targetTouches[0].clientY
            }
        } else {
            return {
                x: ev.clientX,
                y: ev.clientY
            };
        }
    }

    _isTouchEvent(event) {
        return event.type.startsWith('touch');
    }

    _createLabels() {
        if (this.labels == 0) return;
        const step = this.labels;
        this._elements.labels.empty();
        const steps = Math.ceil((this.max - this.min) / step);
        for (let i = steps; i >= 0; i--) {
            const value = this.min + i * step;
            const label = value.toFixed(0);
            this._elements.labels.append(`<span>${label}</span>`);
        }
    }

    setValue(newValue) {
        if (newValue < this.min || newValue > this.max) {
            throw new Error(`Value must be between ${this.min} and ${this.max}`);
        }
        if (newValue % this.step !== 0) { // Make value a multiple of step
            newValue = Math.round(newValue / this.step) * this.step;
        }

        this.value = newValue;
        this._update();
    }

    setVUMeter(value) {
        drawVUMeter(this._elements.vuMeter[0], value, this.min, this.max);
        this._elements.vuMeter.show();
    }
}

class Button {
    constructor(element, options = {}) {
        this.element = element;
        this.value = options.value || false;

        this.label = options.label || '';
        this.icon = options.icon || '';
        this.image = options.image || '';
        this.onClick = options.onClick || function() {};
        this.toggle = options.toggle || false;

        this.init();
    }

    init() {
        this._elements = {
            label: this.element.find('.button-label'),
            icon: this.element.find('.button-icon'),
            image: this.element.find('.button-image'),
        }

        if (typeof this.label == 'object') {
            this.label.forEach((text, index) => {
                this._elements.label.append(`<span>${text}</span>`);
            });
        } else {
            this._elements.label.text(this.label);
        }
        this._elements.label.toggle(!!this.label);

        if (this.icon) {
            this._elements.icon.html(this.icon);
        } else {
            this._elements.icon.remove();
        }
        if (this.image) {
            this._elements.image.attr('src', this.image);
        } else {
            this._elements.image.remove();
        }

        this.element.on('click', (e) => {
            e.preventDefault();
            if (this.toggle) {
                this.value = !this.value;
                this.element.toggleClass('on', this.value);
            } else {
                this.value = true;
            }
            this.onClick(this.value);
        });
        this.element.toggleClass('on', this.value);
    }

    setValue(value) {
        if (typeof value !== 'boolean') {
            throw new Error('Button value must be a boolean');
        }
        this.value = value;
        this.element.toggleClass('on', this.value);
    }

    setImage(image) {
        if (this.image) {
            this._elements.icon.find('img').attr('src', image);
        }
    }

    hide(hide = true) {
        if (hide) {
            this.element.addClass('hidden');
        } else {
            this.element.removeClass('hidden');
        }
    }
}

// Creation Functions

function createKnob(color) {
    const knob = $(`
        <div class="knob ${color || ''}">
            <span class="knob-label"></span>
            <span class="knob-knob">
                <span class="knob-value"></span>
                <span class="knob-indicator"></span>
            </span>
        </div>
    `);
    return knob;
}

function createSlider(color) {
    const slider = $(`
        <div class="slider ${color || ''}">
            <span class="slider-label"></span>
            <span class="slider-range">
                <span class="slider-knob"></span>
                <div class="slider-labels"></div>
                <canvas class="slider-vu"></canvas>
            </span>
            <span class="slider-value"></span>
        </div>
    `);
    return slider;
}

function createButton(color) {
    const button = $(`
        <div class="button ${color || ''}">
            <material-symbol class="button-icon"></material-symbol>
            <span class="button-label"></span>
        </div>
    `);
    return button;
}

function createDetailsButton(color, hasImage = false) {
    const button = $(`
        <div class="details-button ${color || ''}">
            ${hasImage ? '<img src="" class="button-image" />' : ''}
            <material-symbol class="button-icon"></material-symbol>
            <span class="button-label"></span>
        </div>
    `);
    return button;
}
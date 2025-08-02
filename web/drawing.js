function getCanvasSize(canvas) {
    const style = getComputedStyle(canvas);
    let width = canvas.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    let height = canvas.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    // account for device pixel ratio
    width = Math.floor(width * window.devicePixelRatio + 0.5);
    height = Math.floor(height * window.devicePixelRatio + 0.5);
    return { width, height };
}

function drawVUMeter(canvas, value, min, max) {
    const colors = {
        redOn: '#ff0000',
        redOff: '#200000',
        yellowOn: '#ffff00',
        yellowOff: '#202000',
        greenOn: '#00ff00',
        greenOff: '#002000',
    }
    const redThreshold = 0; // dB threshold for peak indication
    const yellowThreshold = -20; // dB threshold for warning indication

    const ctx = canvas.getContext('2d');
    let { width, height } = getCanvasSize(canvas);

    // set canvas size to match parent element
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < height; i++) {
        const boxY = height - i * 1; // Invert Y axis
        const boxValue = min + (max - min) * (i / (height - 1));
        let color;

        if (boxValue >= redThreshold) {
            color = value >= boxValue ? colors.redOn : colors.redOff;
        } else if (boxValue >= yellowThreshold) {
            color = value >= boxValue ? colors.yellowOn : colors.yellowOff;
        } else {
            color = value >= boxValue ? colors.greenOn : colors.greenOff;
        }

        ctx.fillStyle = color;
        if (i % 3 == 0) {
            ctx.fillRect(0, boxY, width, 1);
        }
    }
}

function drawCompressorPreview(canvas, ratio, threshold, knee) {
    const ctx = canvas.getContext('2d');

    const dbMin = -60; // Minimum dB value
    const dbMax = 0; // Maximum dB value
    
    const { width, height } = getCanvasSize(canvas);
    console.log(`Canvas size: ${width}x${height}`);
    canvas.width = width;
    canvas.height = height;
    // create a 5x5 grid
    const cols = 6;
    const rows = 6;

    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#222';
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
    }

    const thresholdY = height - ((threshold - dbMin) / (dbMax - dbMin)) * height;
    const thresholdX = ((threshold - dbMin) / (dbMax - dbMin)) * width;

    // Draw the linear gain line, from bottom left to to threshold point
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(thresholdX, thresholdY);

    // Draw the output gain line
    ctx.lineTo(width, thresholdY - thresholdY / ratio);
    ctx.stroke();

    // Draw the threshold point
    ctx.fillStyle = '#3e6ed6';
    ctx.fillRect(thresholdX - 3, thresholdY - 3, 6, 6);
}

function drawGatePreview(canvas, threshold, damping) {
    const ctx = canvas.getContext('2d');

    const dbMin = -60; // Minimum dB value
    const dbMax = 0; // Maximum dB value
    // Get size without padding
    const { width, height } = getCanvasSize(canvas);
    canvas.width = width;
    canvas.height = height;
    // create a 5x5 grid
    const cols = 6;
    const rows = 6;

    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#222';
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
    }

    const thresholdY = height - ((threshold - dbMin) / (dbMax - dbMin)) * height;
    const thresholdX = ((threshold - dbMin) / (dbMax - dbMin)) * width;
    const dampingY = thresholdY + height - ((damping - dbMin) / (dbMax - dbMin)) * height;
    const startX = width - ((damping - dbMin) / (dbMax - dbMin)) * width;

    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(startX, height);
    ctx.lineTo(thresholdX, dampingY);
    ctx.lineTo(thresholdX, thresholdY);
    ctx.lineTo(width, 0);
    ctx.stroke();

    // ctx.fillStyle = '#3e6ed6';
    // ctx.fillRect(thresholdX - 3, thresholdY - 3, 6, 6);
}

function drawEqGrid(ctx, width, height, freqMin, freqMax, gainMin, gainMax) {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    const fontSize = 10 * window.devicePixelRatio;
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = "#555";

    const freqMagnitudes = [10, 100, 1000, 10000];
    const multipliers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const freqs = [];
    const freqLabels = [];
    for (let m of multipliers) {
        for (let f of freqMagnitudes) {
            const freq = f * m;
            if (freq >= freqMin && freq <= freqMax) {
                freqs.push(freq);
                if (freqMagnitudes.includes(freq)) {
                    freqLabels.push(f);
                } else {
                    freqLabels.push(m);
                }
            }
        }
    }

    // const freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    freqs.forEach((f, i) => {
        const x = Math.log10(f / freqMin) / Math.log10(freqMax / freqMin) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.fillText(`${freqLabels[i]}`, x + 2, fontSize);
    });

    for (let g = gainMin; g <= gainMax; g += 6) {
        const y = ((gainMax - g) / (gainMax - gainMin)) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.fillText(`${g} dB`, 2, y - 2);
    }
}

const eqTypes = [
    'peaking',
    'notch',
    'bandpass',
    'lowpass',
    'highpass',
    'lowshelf',
    'highshelf'
]

function drawEQPreview(canvas, cells, is_on) {
    const ctx = canvas.getContext('2d');
    
    const style = getComputedStyle(canvas);
    let width = canvas.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    let height = canvas.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    width = Math.floor(width * window.devicePixelRatio + 0.5);
    height = Math.floor(height * window.devicePixelRatio + 0.5);
    canvas.width = width;
    canvas.height = height;

    const freqMin = 20;
    const freqMax = 20000;
    const gainMin = -54;
    const gainMax = 24;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    drawEqGrid(ctx, width, height, freqMin, freqMax, gainMin, gainMax);

    const points = [];
    const frequencies = new Float32Array(width);
    const magnitudes = new Float32Array(width);
    const phases = new Float32Array(width);
    const totalMagnitudes = new Float32Array(width);

    for (let x = 0; x < width; x+=1) {
        const freq = freqMin * Math.pow(freqMax / freqMin, x / width);
        frequencies[x] = freq;
        totalMagnitudes[x] = 1; // Start with a flat response
    }

    for (let i = 0; i < cells.length; i++) {
        if (!cells[i].on) continue; // Skip if the EQ cell is off
        let q = cells[i].q;
        if ([3, 4].includes(cells[i].type)) {
            q = -3; 
        }
        const bqfn = new BiquadFilterNode(new AudioContext(), {
            type: eqTypes[cells[i].type],
            frequency: cells[i].freq,
            Q: q,
            gain: cells[i].gain
        });
        bqfn.getFrequencyResponse(frequencies, magnitudes, phases);
        for (let x = 0; x < width; x++) {
            totalMagnitudes[x] *= magnitudes[x]; // Combine the magnitudes
        }
    }

    // turn magnitudes into dB
    for (let i = 0; i < totalMagnitudes.length; i++) {
        if (totalMagnitudes[i] <= 0) {
            totalMagnitudes[i] = -Infinity; // Handle zero or negative values
        } else {
            totalMagnitudes[i] = 20 * Math.log10(totalMagnitudes[i]);
        }
    }

    for (let i = 0; i < frequencies.length; i++) {
        const freq = frequencies[i];
        let mag = totalMagnitudes[i];
        const x = Math.log10(freq / freqMin) / Math.log10(freqMax / freqMin) * width;
        const y = ((gainMax - mag) / (gainMax - gainMin)) * height;
        points.push({ x, y });
    }

    ctx.strokeStyle = is_on ? '#fff' : '#fffa';
    ctx.setLineDash(is_on ? [] : [5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash
    ctx.strokeStyle = '#fff';
    if (!is_on) {
        ctx.beginPath();
        ctx.moveTo(0, ((gainMax - 0) / (gainMax - gainMin)) * height);
        ctx.lineTo(width, ((gainMax - 0) / (gainMax - gainMin)) * height);
        ctx.stroke();
    }
}

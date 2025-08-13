import os
import sys
import tomllib
import aiohttp
from aiohttp import web
import asyncio
import logging
from log import LogFormatter
# from voicemeeterlib.error import InstallError

vm = None

# Set up logging
stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.DEBUG)
stream_handler.setFormatter(LogFormatter())

log = logging.getLogger("main")
logging.basicConfig(level=logging.INFO, handlers=[stream_handler])
log.setLevel(logging.DEBUG)

try:
    import voicemeeterlib
except Exception as e:
    log.error(f"Voicemeeter installation error: {e}")
    log.error("Please ensure Voicemeeter is installed.")
    exit(1)

if getattr(sys, 'frozen', False):
    FILE_DIR = sys._MEIPASS
else:
    FILE_DIR = os.path.dirname(os.path.abspath(__file__))

print(f"Config file path: {os.path.join(FILE_DIR, 'config.toml')}")
with open(os.path.join(FILE_DIR, "config.toml"), "rb") as f:
    CONFIG = tomllib.load(f)

OUTPUT_CHANNEL_NAMES = []
INPUT_EFFECT_NAMES = []
OUTPUT_EFFECT_NAMES = []
if CONFIG['voicemeeter']['kind'] == 'basic':
    OUTPUT_CHANNEL_NAMES = ['A1', 'A2']
elif CONFIG['voicemeeter']['kind'] == 'banana':
    OUTPUT_CHANNEL_NAMES = ['A1', 'A2', 'A3', 'B1', 'B2']
elif CONFIG['voicemeeter']['kind'] == 'potato':
    OUTPUT_CHANNEL_NAMES = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3']
    INPUT_EFFECT_NAMES = ['reverb', 'delay', 'fx1', 'fx2']
    OUTPUT_EFFECT_NAMES = ['returnreverb', 'returndelay', 'returnfx1', 'returnfx2']


sessions = []

async def dirty_check():
    if vm.pdirty:
        for session in sessions:
            session["dirty"] = True

def serialize_eq(eq):
    return {
        "on": eq.on,
        "cells": [
            {
                "on": cell.on,
                "type": cell.type,
                "freq": cell.f,
                "gain": cell.gain,
                "q": cell.q,
            } for cell in eq.channel[0].cell
        ]
    }

def deserialize_eq(eq, data):
    eq.on = data.get("on", eq.on)
    for i, cell_data in enumerate(data.get("cells", [])):
        for channel_index, channel in enumerate(eq.channel):
            if i < len(channel.cell):
                cell = channel.cell[i]
                cell.on = cell_data.get("on", cell.on)
                cell.type = cell_data.get("type", cell.type)
                cell.f = cell_data.get("freq", cell.f)
                cell.gain = cell_data.get("gain", cell.gain)
                cell.q = cell_data.get("q", cell.q)

def serialize_vban(vm):
    return {
        "incoming": [
            {
                "enabled": stream.on,
                "name": stream.name,
                "ip": stream.ip,
                "port": stream.port,
                "samplerate": stream.sr,
                "channels": stream.channel,
                "format": stream.bit,
                "quality": stream.quality,
                "route": stream.route
            } for stream in vm.vban.instream[0:8]
        ],
        "outgoing": [
            {
                "enabled": stream.on,
                "name": stream.name,
                "ip": stream.ip,
                "port": stream.port,
                "samplerate": stream.sr,
                "channels": stream.channel,
                "format": stream.bit,
                "quality": stream.quality,
                "route": stream.route
            } for stream in vm.vban.outstream[0:8]
        ]
    }

async def send_vban(ws):
    try:
        message = serialize_vban(vm)
        await ws.send_json({"vban": message})
    except Exception as e:
        log.error(f"Error sending VBAN data: {e}")

async def rec_vban(ws, data):
    try:
        stream = None
        if data["direction"] == "incoming":
            stream = vm.vban.instream[data["index"]]
        elif data["direction"] == "outgoing":
            stream = vm.vban.outstream[data["index"]]
        if stream:
            if stream.on != data["values"].get("enabled", stream.on):
                stream.on = data["values"].get("enabled", stream.on)
            if stream.name != data["values"].get("name", stream.name):
                stream.name = data["values"].get("name", stream.name)
            if stream.ip != data["values"].get("ip", stream.ip):
                stream.ip = data["values"].get("ip", stream.ip)
            if stream.port != data["values"].get("port", stream.port):
                stream.port = data["values"].get("port", stream.port)
            if stream.quality != data["values"].get("quality", stream.quality):
                stream.quality = data["values"].get("quality", stream.quality)
            if stream.route != data["values"].get("route", stream.route):
                stream.route = data["values"].get("route", stream.route)
            if data["direction"] == "outgoing":
                stream.sr = data["values"].get("samplerate", stream.sr)
                stream.channel = data["values"].get("channels", stream.channel)
                stream.bit = data["values"].get("format", stream.bit)
    except Exception as e:
        log.error(f"Error receiving VBAN data: {e}")

async def send_busses(ws):
    try:
        message = {
            "busses": []
        }
        for bus in vm.bus:
            bus_data = {
                "isPhysical": getattr(bus, 'device', None) is not None,
                "label": bus.label,
                "mono": bus.mono,
                "mute": bus.mute,
                "sel": bus.sel,
                "gain": bus.gain,
                "eq": serialize_eq(bus.eq),
                "fx": [getattr(bus, output, False) for output in OUTPUT_EFFECT_NAMES],
                "device": bus.device.name if getattr(bus, 'device', None) else None,
                "device_rate": bus.device.sr if getattr(bus, 'device', None) else None
            }
            message["busses"].append(bus_data)
        await ws.send_json(message)
    except Exception as e:
        log.error(f"Error sending bus data: {e}")

async def send_strips(ws):
    try:
        message = {
            "strips": []
        }
        for strip in vm.strip:
            strip_data = {
                "isPhysical": getattr(strip, 'eq', None) is not None,
                "label": strip.label,
                "mute": strip.mute,
                "mono": strip.mono,
                "solo": strip.solo,
                "gain": strip.gain,
                "pan": strip.pan_x,
                "limit": strip.limit,
                "denoiser": hasattr(strip, 'denoiser') and strip.denoiser.knob or 0,
                "routing": [getattr(strip, output, False) for output in OUTPUT_CHANNEL_NAMES],
                "fx": [getattr(strip, input, False) for input in INPUT_EFFECT_NAMES],
                "device": strip.device.name if getattr(strip, 'device', None) else None,
                "device_rate": strip.device.sr if getattr(strip, 'device', None) else None
            }
            if hasattr(strip, 'eq'):
                strip_data.update({
                    "eq": serialize_eq(strip.eq)
                })
            else:
                strip_data.update({
                    "band_eq": {
                        "bass": strip.bass,
                        "mid": strip.mid,
                        "treble": strip.treble,
                    }
                })
            if hasattr(strip, 'comp'):
                strip_data.update({
                    "compressor": {
                        "gainin": strip.comp.gainin,
                        "gainout": strip.comp.gainout,
                        "ratio": strip.comp.ratio,
                        "threshold": strip.comp.threshold,
                        "attack": strip.comp.attack,
                        "release": strip.comp.release,
                        "knee": strip.comp.knee,
                        "makeup": strip.comp.makeup,
                    }
                })
            if hasattr(strip, 'gate'):
                strip_data.update({
                    "gate": {
                        "threshold": strip.gate.threshold,
                        "damping": strip.gate.damping,
                        "bpsidechain": strip.gate.bpsidechain,
                        "attack": strip.gate.attack,
                        "hold": strip.gate.hold,
                        "release": strip.gate.release,
                    }
                })
            message["strips"].append(strip_data)
        await ws.send_json(message)
    except Exception as e:
        log.error(f"Error sending strip data: {e}")

async def rec_busses(ws, data):
    try:
        bus = vm.bus[data['index']]
        bus.label = data['values'].get('label', bus.label)
        bus.mute = data['values'].get('mute', bus.mute)
        bus.gain = data['values'].get('gain', bus.gain)
        bus.sel = data['values'].get('sel', bus.sel)
        bus.mono = data['values'].get('mono', bus.mono)
        
        if 'eq' in data['values']:
            deserialize_eq(bus.eq, data['values']['eq'])

        if data['values'].get('fx', None) is not None:
            for i, fx_value in enumerate(data['values']['fx']):
                setattr(bus, OUTPUT_EFFECT_NAMES[i], fx_value)
    except Exception as e:
        log.error(f"Error updating bus: {e}")

async def rec_strips(ws, data):
    try:
        strip = vm.strip[data['index']]
        strip.label = data['values'].get('label', strip.label)
        strip.mute = data['values'].get('mute', strip.mute)
        strip.mono = data['values'].get('mono', strip.mono)
        strip.solo = data['values'].get('solo', strip.solo)
        strip.gain = data['values'].get('gain', strip.gain)
        strip.pan_x = data['values'].get('pan', strip.pan_x)
        strip.limit = data['values'].get('limit', strip.limit)
        if hasattr(strip, 'eq'):
            if 'eq' in data['values']:
                deserialize_eq(strip.eq, data['values']['eq'])
        else:
            if 'band_eq' in data['values']:
                strip.bass = data['values']['band_eq'].get('bass', strip.bass)
                strip.mid = data['values']['band_eq'].get('mid', strip.mid)
                strip.treble = data['values']['band_eq'].get('treble', strip.treble)
        
        if hasattr(strip, 'denoiser'):
            strip.denoiser.knob = data['values'].get('denoiser', strip.denoiser)

        if data['values'].get('routing', None) is not None:
            for i, enabled in enumerate(data['values']['routing']):
                setattr(strip, OUTPUT_CHANNEL_NAMES[i], enabled)

        if data['values'].get('fx', None) is not None:
            for i, fx_value in enumerate(data['values']['fx']):
                setattr(strip, INPUT_EFFECT_NAMES[i], fx_value)

        if data['values'].get('compressor', None) is not None and hasattr(strip, 'comp'):
            strip.comp.gainin = data['values']['compressor'].get('gainin', strip.comp.gainin)
            strip.comp.gainout = data['values']['compressor'].get('gainout', strip.comp.gainout)
            strip.comp.ratio = data['values']['compressor'].get('ratio', strip.comp.ratio)
            strip.comp.threshold = data['values']['compressor'].get('threshold', strip.comp.threshold)
            strip.comp.attack = data['values']['compressor'].get('attack', strip.comp.attack)
            strip.comp.release = data['values']['compressor'].get('release', strip.comp.release)
            strip.comp.knee = data['values']['compressor'].get('knee', strip.comp.knee)
            strip.comp.makeup = data['values']['compressor'].get('makeup', strip.comp.makeup)
        
        if data['values'].get('gate', None) and hasattr(strip, 'gate'):
            strip.gate.threshold = data['values']['gate'].get('threshold', strip.gate.threshold)
            strip.gate.damping = data['values']['gate'].get('damping', strip.gate.damping)
            strip.gate.bpsidechain = data['values']['gate'].get('bpsidechain', strip.gate.bpsidechain)
            strip.gate.attack = data['values']['gate'].get('attack', strip.gate.attack)
            strip.gate.hold = data['values']['gate'].get('hold', strip.gate.hold)
            strip.gate.release = data['values']['gate'].get('release', strip.gate.release)

    except Exception as e:
        log.error(f"Error updating strip: {e}")

async def set_device(ws, data):
    try:
        channel = None
        if data['channel_type'] == 'input':
            channel = vm.strip[data['channel_index']]
        else:
            channel = vm.bus[data['channel_index']]
        if data['device_type'] == 'wdm':
            channel.device.wdm = data['device_name']
        elif data['device_type'] == 'ks':
            channel.device.ks = data['device_name']
        elif data['device_type'] == 'mme':
            channel.device.mme = data['device_name']
    except Exception as e:
        log.error(f"Error setting device: {e}")

async def parameter_poller(ws, session):
    while not ws.closed:
        await dirty_check()
        if session['dirty']:
            if session['ignoreUpdate']:
                session['ignoreUpdate'] = False
            else:
                await send_busses(ws)
                await send_strips(ws)
                await send_vban(ws)
            session['dirty'] = False
        await asyncio.sleep(CONFIG['general']['polling_interval'])

async def level_poller(ws):
    while not ws.closed:
        # Send level updates to client
        try:
            levels = {
                "levels": {
                    "inputs": [strip.levels.postfader for strip in vm.strip],
                    "outputs": [bus.levels.all for bus in vm.bus]
                }
            }
            await ws.send_json(levels)
        except Exception as e:
            log.error(f"Error sending levels: {e}")
        await asyncio.sleep(CONFIG['levels']['polling_interval'])

async def init_message(ws):
    # Send initial message to client
    await ws.send_json({
        "setup": {
            "version": vm.version,
            "type": vm.type,
            "inputs": len(vm.strip),
            "outputs": len(vm.bus),
            "devices": {
                "input": [vm.device.input(i) for i in range(vm.device.ins)],
                "output": [vm.device.output(i) for i in range(vm.device.outs)]
            }
        }
    })

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    log.info("Websocket connected")
    await init_message(ws)
    session = {"ignoreUpdate": False, "dirty": False}
    sessions.append(session)

    parameter_polling_task = asyncio.create_task(parameter_poller(ws, session))
    if CONFIG['levels']['enabled']:
        level_polling_task = asyncio.create_task(level_poller(ws))

    try:
        async for msg in ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                data = msg.json()
                if data.get("type") == "update":
                    await send_busses(ws)
                    await send_strips(ws)
                    await send_vban(ws)
                    await init_message(ws)
                elif data.get("type") == "bus":
                    await rec_busses(ws, data)
                    session["ignoreUpdate"] = True
                elif data.get("type") == "strip":
                    await rec_strips(ws, data)
                    session["ignoreUpdate"] = True
                elif data.get("type") == "vban":
                    await rec_vban(ws, data)
                    session["ignoreUpdate"] = True
                elif data.get("type") == "action":
                    if data.get("action") == "restart-audio-engine":
                        vm.command.restart()
                elif data.get("type") == "device":
                    await set_device(ws, data)
            elif msg.type == aiohttp.WSMsgType.ERROR:
                log.error(f"WS Error: {ws.exception}")
    finally:
        log.info("Websocket disconnected")
        sessions.remove(session)

        parameter_polling_task.cancel()
        level_polling_task and level_polling_task.cancel()
        await parameter_polling_task
        await level_polling_task

    return ws

async def index(request):
    return web.FileResponse(os.path.join(FILE_DIR, 'web/index.html'))

if __name__ == '__main__':
    app = web.Application()
    app.router.add_get('/', index)
    app.router.add_get('/ws', websocket_handler)
    app.router.add_static('/', path=os.path.join(FILE_DIR, 'web'), name='web')

    with voicemeeterlib.api(CONFIG['voicemeeter']['kind']) as vm:
        if CONFIG['voicemeeter']['lock']:
            vm.command.lock = True
        try:
            web.run_app(app, host=CONFIG['http']['host'], port=CONFIG['http']['port'], access_log=None)
        except KeyboardInterrupt:
            log.info("Server stopped by user")
            if CONFIG['voicemeeter']['lock']:
                vm.command.lock = False
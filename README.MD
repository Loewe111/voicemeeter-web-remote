# MeeterLink

A web-based remote control interface for Voicemeter
Allows you to control pretty much everything in Voicemeter from a web browser.

![Screenshot of the Channels](/images/screenshot_channels.png)

![Screenshot of the Detailed View](/images/screenshot_details.png)

![Screenshot of the Device Settings](/images/screenshot_device_settings.png)

![Screenshot of the VBAN Settings](/images/screenshot_vban_settings.png)

## Features
- Control all Input and Output channels
- Set Compressor, Gate, and EQ settings
- Control Routing and Bus assignments
- Change device assignment for each channel
- Configure VBAN inputs and outputs

## Installation and Usage

> [!IMPORTANT]
> You need to have Voicemeeter Potato installed on your system.
> Since Voicemeeter is only available for Windows, this project only works on Windows as well.

1. Download the latest build from the [Releases](https://github.com/Loewe111/voicemeeter-web-remote/releases)
2. Extract the contents of the ZIP file to a directory of your choice.
3. If needed, you can edit the `config.toml` file to configure the host and port for the web server, as well as other settings like enabling the lock option.
   - The default host is `0.0.0.0` and the default port is `8080`.
   - The lock option is enabled by default.
4. Run the `meeterlink.exe` file to start the server.
5. Open your web browser and go to `http://localhost:8080` (or the configured host and port).

### Usage

Running the server will automatically start Voicemeeter if it is not already running. If the lock option is enabled in the configuration, it will also lock the Voicemeeter GUI to prevent manual changes while using the web remote.

After opening the web interface, you can see the Channel view, which displays all input and output channels. You can click on the view buttons on the top to only show inputs or outputs.

Clicking on the the expand button on the bottom of a channel will open a detailed view for that channel, where you can adjust settings like Routing, Compressor, Gate, and EQ.
Click at the close button on the top left of the detailed view to close it again.

Double-clicking on a slider or knob will reset it to its default value.

Click and drag sliders and knobs to adjust their values. You can also use the scroll wheel to adjust sliders and knobs, holding the `Shift` key while scrolling will adjust the value in bigger steps.

Right-clicking on a slider allows you to manually enter your desired value using your keyboard.

#### Slider Modes

In the Settings menu, you can choose between different slider modes:
- **Normal**: The slider behaves like described above.
- **Safe**: The slider will only move when you click and drag it, or when using the scroll wheel while hovering over it. It can not be changed by clicking on the slider track or reset by double-clicking it. This prevents accidentally changing the volume to a loud value.
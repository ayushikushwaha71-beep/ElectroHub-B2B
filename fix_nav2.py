import re

mapping = {
    '/categories/arduino/uno': '/product/ard-001',
    '/categories/arduino/mega': '/product/ard-002',
    '/categories/arduino/nano': '/product/ard-003',
    '/categories/raspberry-pi/pi5': '/product/rpi-001',
    '/categories/raspberry-pi/pi4': '/product/rpi-002',
    '/categories/esp32/devkit': '/product/esp-001',
    '/categories/esp8266/nodemcu': '/product/esp-002',
    '/categories/sensors/temperature': '/product/sen-001',
    '/categories/sensors/motion': '/product/sen-002',
    '/categories/motors/stepper': '/product/mot-001',
    '/categories/motors/drivers': '/product/mot-002',
    '/categories/displays/tft': '/product/dsp-001',
    '/categories/displays/oled': '/product/dsp-002',
    '/categories/robotics-kits/arm': '/product/rob-001',
    '/categories/robotics-kits/chassis': '/product/rob-002',
    '/categories/power/buck': '/product/pwr-001',
    '/categories/power/lipo': '/product/pwr-002',
}

with open('lib/data/navigation.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    for old_url, new_url in mapping.items():
        if f"href: '{old_url}'" in line:
            line = line.replace(f"href: '{old_url}'", f"href: '{new_url}'")
            break
    new_lines.append(line)

with open('lib/data/navigation.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Mapped categories to products!")

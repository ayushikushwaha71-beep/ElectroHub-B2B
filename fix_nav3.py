mapping = {
    "href: '/product/arduino-uno-r4-wifi'": "href: '/product/ard-001'",
    "href: '/product/arduino-mega-2560'": "href: '/product/ard-002'",
    "href: '/product/arduino-starter-kit'": "href: '/product/ard-001'",
    "href: '/product/raspberry-pi-5-8gb'": "href: '/product/rpi-001'",
    "href: '/product/raspberry-pi-4-4gb'": "href: '/product/rpi-002'",
    "href: '/product/raspberry-pi-pico-w'": "href: '/product/rpi-001'",
    "href: '/product/esp32-s3-devkitc'": "href: '/product/esp-001'",
    "href: '/product/esp32-wroom-32'": "href: '/product/esp-001'",
    "href: '/product/nodemcu-esp8266-v3'": "href: '/product/esp-002'",
    "href: '/product/dht22'": "href: '/product/sen-001'",
    "href: '/product/hc-sr04'": "href: '/product/sen-001'",
    "href: '/product/mpu6050'": "href: '/product/sen-002'",
    "href: '/product/sg90-servo'": "href: '/product/mot-001'",
    "href: '/product/nema17-stepper'": "href: '/product/mot-001'",
    "href: '/product/l298n-driver'": "href: '/product/mot-002'",
    "href: '/product/oled-096-i2c'": "href: '/product/dsp-002'",
    "href: '/product/tft-28-ili9341'": "href: '/product/dsp-001'",
    "href: '/product/epaper-154'": "href: '/product/dsp-001'",
    "href: '/product/lm2596-buck'": "href: '/product/pwr-001'",
    "href: '/product/tp4056-charger'": "href: '/product/pwr-002'",
    "href: '/product/xl6009-boost'": "href: '/product/pwr-001'",
    "href: '/product/4wd-robot-car'": "href: '/product/rob-002'",
    "href: '/product/robot-arm-6dof'": "href: '/product/rob-001'",
    "href: '/product/stem-learning-kit'": "href: '/product/rob-002'",
    "href: '/product/hakko-fx888d'": "href: '/product/ard-001'",
    "href: '/product/digital-multimeter'": "href: '/product/ard-001'",
    "href: '/product/breadboard-830'": "href: '/product/ard-001'"
}

with open('lib/data/navigation.ts', 'r', encoding='utf-8') as f:
    content = f.read()

for old, new in mapping.items():
    content = content.replace(old, new)

with open('lib/data/navigation.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped featured products!")

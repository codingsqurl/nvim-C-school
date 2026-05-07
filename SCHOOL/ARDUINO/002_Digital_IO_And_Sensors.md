# 002_Digital_IO_And_Sensors

> Reading the physical world - buttons, potentiometers, and serial data.

## Level 1 — Intuition

### Concept

Your Arduino reads the physical world through its **pins**. Digital pins detect on/off (button pressed or not). Analog pins detect levels (how far a knob is turned). The **Serial Monitor** is your window into what the Arduino sees.

```
   Physical World              Arduino                Computer (Serial Monitor)
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐
│ [Button] → HIGH │───→│ pinMode(2,INPUT)│───→│  Serial.println(val)        │
│ [Knob] → 512    │───→│ analogRead(A0)  │───→│  "Sensor value: 512"       │
│ [Light] → 800   │───→│ analogRead(A1)  │───→│  "Light level: 800"        │
└─────────────────┘    └─────────────────┘    └─────────────────────────────┘
```

### Digital Input Mechanics

**Without pull-up:** Incoming pin **floats** — reads random HIGH/LOW when nothing is connected. This is electrical noise.

**With pull-up:** Pin connects internally to 5V through a resistor. Defaults to HIGH, reads LOW only when connected to ground.

```
FLOATING (bad):              PULL-UP (good):           PULL-DOWN (external):
    5V                            5V                          5V
     │                              │                           │
     ? ← reads random              ├── 20kΩ ──┐                │
     │                              │          │                ├── 10kΩ ──┐
   Pin 2                          Pin 2   [Button]          [Button]      │
     │                              │          │                │         Pin 2
     ?                              ├──────────┘                ├───────────┤
                                    │  GND                      │           │
                                   GND                         GND     10kΩ resistor
                                                                          │
                                                                         GND
```

**Rule of thumb:** Use `INPUT_PULLUP` for buttons — no external resistor needed. But logic is inverted (HIGH = not pressed, LOW = pressed).

## Level 2 — Practical

### Button with INPUT_PULLUP

```cpp
const int BUTTON_PIN = 2;
const int LED_PIN = 13;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);  // Internal pull-up resistor
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);
  // LOW = pressed (circuit connected to GND)
  // HIGH = not pressed (pulled up to 5V)

  if (buttonState == LOW) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Button pressed!");
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  delay(50);  // Debounce delay (crude but works)
}
```

### Debouncing Buttons Properly

Mechanical buttons bounce — one press creates multiple HIGH/LOW transitions:

```cpp
const int BUTTON_PIN = 2;
int lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

void loop() {
  int reading = digitalRead(BUTTON_PIN);

  if (reading != lastButtonState) {
    lastDebounceTime = millis();  // Reset timer on change
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading == LOW) {
      // Actual press detected
    }
  }

  lastButtonState = reading;
}
```

### Analog Input

`analogRead()` returns 0-1023 (10-bit ADC), mapping 0-5V:

```cpp
const int POT_PIN = A0;

void loop() {
  int rawValue = analogRead(POT_PIN);              // 0-1023
  float voltage = rawValue * (5.0 / 1023.0);        // Convert to volts
  int percent = map(rawValue, 0, 1023, 0, 100);    // Map to percentage

  Serial.print("Raw: "); Serial.print(rawValue);
  Serial.print(" | Voltage: "); Serial.print(voltage);
  Serial.print("V | Percent: "); Serial.print(percent);
  Serial.println("%");

  delay(200);
}
```

### Common Sensors and Their Output

| Sensor | Type | Reading | Connection |
|--------|------|---------|------------|
| Push button | Digital | HIGH/LOW | `INPUT_PULLUP` |
| Potentiometer (10kΩ) | Analog | 0-1023 | Outer pins → 5V/GND, wiper → A0 |
| LDR (light sensor) | Analog | 0-1023 | Voltage divider with 10kΩ |
| TMP36 (temperature) | Analog | 0-1023 | 750mV at 25°C, 10mV/°C |
| HC-SR04 (ultrasonic) | Digital timing | Distance in cm | Trigger/Echo pins |
| DHT11 (temp/humidity) | Digital protocol | Temp, Humidity | One-wire protocol |

### Serial Communication

```cpp
void setup() {
  Serial.begin(9600);          // 9600 baud = bits per second
  Serial.println("Hello!");    // Print with newline

  int x = 42;
  Serial.print("Answer: ");    // Print without newline
  Serial.println(x);           // "Answer: 42"

  // Formatted output (no printf in base Arduino)
  Serial.print("Sensor: ");
  Serial.print(analogRead(A0));
  Serial.print(" (");
  Serial.print(map(analogRead(A0), 0, 1023, 0, 100));
  Serial.println("%)");
}
```

## Level 3 — Systems

### The ADC (Analog to Digital Converter)

```
Analog voltage (0-5V)
        │
        ▼
   ┌─────────┐
   │ 10-bit  │ → 2^10 = 1024 discrete levels
   │  ADC    │ → 5V / 1024 = 4.88 mV per step
   └────┬────┘
        │
        ▼
  Digital value (0-1023)
```

**ADC resolution comparison:**
- Arduino UNO: 10-bit (0-1023)
- Arduino Due: 12-bit (0-4095)
- ESP32: 12-bit (0-4095), configurable attenuation

### Voltage Dividers

Many sensors use voltage divider circuits:

```
        5V
        │
        ├── 10kΩ (fixed resistor)
        │
        ├──── A0 (measure here)
        │
        ├── LDR (light-dependent resistor)
        │
       GND

Vout = Vin * (R2 / (R1 + R2))
     = 5V * (LDR / (10kΩ + LDR))

Bright light → LDR ≈ 1kΩ → Vout ≈ 0.45V → analogRead ≈ 93
Dark        → LDR ≈ 100kΩ → Vout ≈ 4.55V → analogRead ≈ 930
```

### Serial Protocol Internals

```
┌──────┐                          ┌──────┐
│ TX   │────── data ─────────────→│ RX   │
│      │                          │      │
│ GND  │──────── common ─────────│ GND  │
└──────┘                          └──────┘

9600 baud = 9600 bits/second = ~960 bytes/second

Frame format: [Start bit(0)][8 data bits][Stop bit(1)]
                1 bit      8 bits       1 bit
                 ↓
          Total: 10 bits per byte
```

## Level 4 — Expert

### Advanced Debouncing with State Machines

```cpp
enum ButtonState { IDLE, PRESSED, HELD, RELEASED };

struct Button {
  int pin;
  ButtonState state;
  unsigned long pressTime;
  unsigned long holdDuration;
};

Button btn = {2, IDLE, 0, 0};

void updateButton(Button &b) {
  int reading = digitalRead(b.pin);

  switch (b.state) {
    case IDLE:
      if (reading == LOW) {
        b.state = PRESSED;
        b.pressTime = millis();
      }
      break;
    case PRESSED:
      if (reading == HIGH) {
        b.state = RELEASED;
        b.holdDuration = millis() - b.pressTime;
      } else if (millis() - b.pressTime > 1000) {
        b.state = HELD;
      }
      break;
    case HELD:
      if (reading == HIGH) b.state = IDLE;
      break;
    case RELEASED:
      b.state = IDLE;
      break;
  }
}
```

### Multiplexing Inputs with 74HC165

When you need more inputs, use a shift register:

```
Arduino pins: 3 pins (LATCH, CLOCK, DATA)
74HC165: 8 inputs per chip, chainable for 16, 24, 32+ inputs
```

---
## EXERCISES

### Exercise 1: Light Meter (15 min)
Connect an LDR + 10kΩ voltage divider to A0. Print readings to serial. Map 0-1023 to descriptive words: "Dark", "Dim", "Room light", "Bright", "Direct sun".

### Exercise 2: Button-Controlled LED (15 min)
Connect a button to pin 2 (INPUT_PULLUP) and LED to pin 13. Make each button press toggle the LED (press once = on, press again = off). Must use proper debouncing.

### Exercise 3: Serial Data Logger (20 min)
Connect a potentiometer to A0 and a button to pin 2. Continuously send potentiometer readings to serial at 115200 baud. When the button is pressed, prefix the reading with "MARK:" so it can be identified later. Example output:
```
342
345
MARK: 347
350
```

---
## QUIZ

1. **Why do floating digital input pins read random values?**
   A) The Arduino has a bug with digitalRead()
   B) Without a reference voltage, the pin picks up electrical noise
   C) The pin is broken
   D) delay() is required before reading

2. **When using `INPUT_PULLUP`, what logic value equals "button pressed" for a button wired to GND?**
   A) HIGH (the pull-up drives it high)
   B) LOW (the button connects to ground, overriding the pull-up)
   C) Neither — you need INPUT_PULLDOWN
   D) The value alternates with each press

3. **analogRead(A0) returns 512. What is the approximate voltage on A0?**
   A) 5V
   B) 0V
   C) 2.5V
   D) 3.3V

4. **What baud rate means 9600 bits per second on Serial?**
   A) The number of bytes sent per second
   B) The number of bits transmitted per second
   C) The number of packets per second
   D) The microcontroller's clock speed

5. **A button press creates 20 HIGH/LOW transitions in 10ms. This is called:**
   A) Signal reflection
   B) Bouncing
   C) Oscillation
   D) PWM

**Answers: 1-B, 2-B, 3-C, 4-B, 5-B**

---
## Navigation

**Parent**: [[000_ARDUINO_MOC|ARDUINO]]

**Synapses**:
- [[001_Introduction_To_Embedded|ARDUINO 001]] - Arduino basics
- [[003_PWM_And_Motors|ARDUINO 003]] - PWM output
- [[005_Communication_Protocols|ARDUINO 005]] - Serial protocol deep dive

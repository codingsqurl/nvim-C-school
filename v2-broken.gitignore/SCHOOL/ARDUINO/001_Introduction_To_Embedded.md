# 001_Introduction_To_Embedded

> What is embedded systems programming - from PC to microcontroller.

## Level 1 — Intuition

### Concept

Embedded systems are computers designed to do ONE specific task. Unlike your laptop (general-purpose), an Arduino is a single-purpose brain:

```
Desktop computer          Embedded system (Arduino)
┌─────────────────┐       ┌─────────────────┐
│ OS (Windows/Linux)│      │ No OS - bare metal │
│ Many apps        │      │ One program (sketch) │
│ 8+ GB RAM        │      │ 2 KB RAM (UNO)       │
│ 100+ W power     │      │ 0.5 W power          │
└─────────────────┘       └─────────────────┘
```

### Microcontrollers vs Microprocessors

| Feature | Microcontroller (Arduino UNO) | Microprocessor (Intel i7) |
|---------|-------------------------------|---------------------------|
| CPU | ATmega328P (16 MHz) | Multi-core (3+ GHz) |
| RAM | 2 KB | 8+ GB |
| Storage | 32 KB Flash | 500+ GB SSD |
| OS | None (bare metal) | Windows/Linux/macOS |
| I/O pins | Built-in GPIO | Needs chipset |
| Cost | $2-5 | $200-500 |
| Power | ~50 mA | 65+ W |

### The Arduino Platform

The Arduino UNO is the standard board for learning:

```
          ┌─────────────────────────────┐
          │  [USB]  [Power Jack]        │
          │                             │
      ────┤  ATmega328P                 ├────
    Digital │  16 MHz, 2KB RAM, 32KB Flash    │ Analog
    Pins    │                             │    Pins
    (0-13)  │  [Power LEDs]  [Reset Btn] │    (A0-A5)
      ────┤                             ├────
          └─────────────────────────────┘
```

**Key specs:**
- 14 Digital I/O pins (6 PWM-capable: 3, 5, 6, 9, 10, 11)
- 6 Analog input pins (A0-A5)
- Operating voltage: 5V
- Input voltage: 7-12V

## Level 2 — Practical

### Setting Up the Arduino IDE

1. Download from [arduino.cc/en/software](https://arduino.cc/en/software)
2. Install, launch, connect board via USB
3. Select: **Tools → Board → Arduino Uno**
4. Select: **Tools → Port → COM3** (Windows) or **/dev/ttyUSB0** (Linux)

### Your First Sketch: Blink

Every Arduino program has two required functions:

```cpp
// The setup function runs ONCE at power-up or reset
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);  // Set built-in LED pin as output
}

// The loop function repeats FOREVER
void loop() {
  digitalWrite(LED_BUILTIN, HIGH);  // Turn LED on (5V)
  delay(1000);                       // Wait 1000ms (1 second)
  digitalWrite(LED_BUILTIN, LOW);   // Turn LED off (0V)
  delay(1000);                       // Wait 1 second
}
```

### Core Functions Explained

| Function | Purpose | Example |
|----------|---------|---------|
| `pinMode(pin, mode)` | Set pin as INPUT or OUTPUT | `pinMode(13, OUTPUT);` |
| `digitalWrite(pin, val)` | Set pin HIGH (5V) or LOW (0V) | `digitalWrite(13, HIGH);` |
| `digitalRead(pin)` | Read pin state (HIGH/LOW) | `int val = digitalRead(2);` |
| `analogRead(pin)` | Read 0-5V → 0-1023 value | `int val = analogRead(A0);` |
| `analogWrite(pin, val)` | PWM output (0-255) | `analogWrite(9, 128);` |
| `delay(ms)` | Pause for milliseconds | `delay(1000);` // 1 sec |
| `Serial.begin(baud)` | Start serial communication | `Serial.begin(9600);` |
| `Serial.print(val)` | Send data to computer | `Serial.println("Hello");` |

### Anatomy of a Sketch

```cpp
// ── GLOBAL DECLARATIONS ──
const int LED_PIN = 13;
int brightness = 0;

// ── SETUP: runs once ──
void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Arduino ready!");
}

// ── LOOP: runs forever ──
void loop() {
  // Your program logic here
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
}
```

## Level 3 — Systems

### The Build Process: Sketch → Upload

```
Your .ino file
    │
    ├── 1. Preprocessor: adds #include <Arduino.h>, function prototypes
    ├── 2. Compiler (avr-gcc): C++ → AVR machine code
    ├── 3. Linker: combines your code + Arduino libraries
    ├── 4. avrdude: uploads .hex file via USB → ATmega328P Flash
    ▼
Running on the chip!
```

### Timers and the Loop Cycle

The ATmega328P runs at 16 MHz — that's 16 million instructions per second. Each `loop()` iteration runs as fast as possible unless you use `delay()`:

```
loop() → check sensors → update outputs → loop() → ...
  ↑_______________________________________________↓
```

**`delay()` blocks everything** — the Arduino does nothing during `delay()`. For non-blocking timing, use `millis()`:

```cpp
unsigned long previousMillis = 0;
const long interval = 1000;

void loop() {
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    // Do something every 1 second WITHOUT blocking
  }
}
```

### Memory Constraints

```
ATmega328P Memory Layout:
┌──────────────────────┐ 0x0000
│   .text (your code)  │ Flash (32 KB) - read only
├──────────────────────┤
│   .data (variables)  │ SRAM (2 KB) - read/write, volatile
│   .bss (zero-init)   │
│   heap   →           │
│   ...   ←   stack    │
├──────────────────────┤
│   EEPROM (1 KB)      │ Non-volatile storage
└──────────────────────┘
```

**Warning signs you're running out of RAM:**
- Random crashes or resets
- Serial output garbled
- Variables changing values unexpectedly
- Program works then fails suddenly

## Level 4 — Expert

### Bootloader and Reset

```
Power-on Reset:
  ┌─────────┐
  │ Bootloader │ ← Runs first (0.5-2 sec), waits for upload
  │  checks    │    If no upload signal → jumps to your sketch
  │  upload?   │
  └─────┬─────┘
        │
   ┌────▼────┐
   │  setup() │ ← Your code starts here
   └────┬────┘
        │
   ┌────▼────┐
   │  loop()  │ ← Runs forever
   └─────────┘
```

### Pin Mapping: Arduino vs ATmega328P

| Arduino Pin | ATmega328P Pin | Function | PWM |
|-------------|----------------|----------|-----|
| Digital 0 | PD0 | RX (Serial) | No |
| Digital 1 | PD1 | TX (Serial) | No |
| Digital 3 | PD3 | GPIO | Yes (Timer2) |
| Digital 9 | PB1 | GPIO | Yes (Timer1) |
| Digital 13 | PB5 | LED_BUILTIN | No |
| Analog A0 | PC0 | ADC | No |

### Direct Port Manipulation (Advanced)

For speed-critical code, manipulate ports directly:

```cpp
// Set all of PORTB pins to OUTPUT (pins 8-13)
DDRB = 0b00111111;    // Set pins 8-13 as output

// Turn on pin 13 (PB5) instantly
PORTB |= (1 << PB5);  // Single CPU cycle vs digitalWrite() ~50 cycles

// Turn off pin 13
PORTB &= ~(1 << PB5);
```

---
## EXERCISES

### Exercise 1: Custom Blink Pattern (10 min)
Create a sketch that blinks the built-in LED in this pattern: 200ms on, 200ms off, 200ms on, 800ms off → repeat.

```cpp
void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(200);
  digitalWrite(LED_BUILTIN, LOW);
  delay(200);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(200);
  digitalWrite(LED_BUILTIN, LOW);
  delay(800);
}
```

### Exercise 2: SOS Signal (15 min)
Using external LED on pin 9 with 220Ω resistor, program the Morse code SOS (... --- ...):
- Dot: 200ms on, 200ms off
- Dash: 600ms on, 200ms off  
- Letter gap: 600ms off
- Word gap: 1400ms off

### Exercise 3: Traffic Light Controller (20 min)
Wire 3 LEDs (red=pin11, yellow=pin10, green=pin9) with 220Ω resistors each. Program a traffic light cycle:
- Green: 5 seconds → Yellow: 2 seconds → Red: 5 seconds → repeat

---
## QUIZ

1. **What does `pinMode(13, OUTPUT)` do?**
   A) Reads the state of pin 13
   B) Configures pin 13 to send voltage out instead of reading voltage in
   C) Turns on the LED connected to pin 13
   D) Sets pin 13 to 5V

2. **How many times does `setup()` run during normal operation?**
   A) Once per second
   B) Once, at power-up or reset
   C) Continuously, alternating with loop()
   D) It never runs — Arduino uses loop() only

3. **What happens during `delay(1000)`?**
   A) The Arduino sleeps for 1 second while still checking sensors
   B) The Arduino does nothing — it's blocked for 1 second
   C) The Arduino executes loop() but slower
   D) The Arduino sends a timing pulse to the CPU

4. **An Arduino UNO has 32 KB of Flash and 2 KB of SRAM. Which is used for variables during program execution?**
   A) Flash
   B) SRAM
   C) EEPROM
   D) The USB chip

5. **What voltage does `digitalWrite(pin, HIGH)` output on a standard Arduino UNO?**
   A) 3.3V
   B) 1.5V
   C) 5V
   D) 12V

**Answers: 1-B, 2-B, 3-B, 4-B, 5-C**

---
## Navigation

**Parent**: [[000_ARDUINO_MOC|ARDUINO]]

**Synapses**:
- [[001_Mental_Models|CORE 001]] - IPO model applies to embedded
- [[002_Digital_IO_And_Sensors|ARDUINO 002]] - Digital and analog I/O
- [[003_PWM_And_Motors|ARDUINO 003]] - PWM for motor control

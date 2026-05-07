# 006_Advanced_Projects

> Expert territory - interrupts, memory management, low power, and IoT.

## Level 1 — Intuition

### Concept

So far your code uses **polling** — checking sensors in each `loop()` iteration. But what if something happens while `delay()` is blocking? **Interrupts** let the hardware instantly pause your code and handle urgent events.

```
Polling (slow, misses events):        Interrupts (instant, never misses):
                                      
loop() checks button ──┐              loop() runs normally ──┐
   │          not pressed│               │                   │
   ▼                    │               ▼                   │
delay(1000)  ← blocked! │            BUTTON PRESSED!        │
   │                    │               │ (interrupt fires) │
   ▼                    │               ▼                   │
check button ← FINALLY! │            handleButton() runs    │
                        │               │                   │
                        │               ▼                   │
                        │            return to loop() ──────┘
```

### What You'll Build

By the end of this lesson, you'll combine everything into a **complete IoT weather station** — sensors, display, connectivity, and power management.

## Level 2 — Practical

### External Interrupts

Arduino UNO has two external interrupt pins: **D2 (INT0)** and **D3 (INT1)**:

```cpp
const int BUTTON_PIN = 2;  // INT0
volatile int buttonPresses = 0;  // volatile = changed by ISR!

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);

  // Attach interrupt to pin 2
  // FALLING: triggers when pin goes HIGH → LOW (button press)
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), buttonISR, FALLING);
}

void loop() {
  // Main program runs freely — no need to check button!
  Serial.print("Presses: ");
  Serial.println(buttonPresses);
  delay(1000);
}

// ISR: Keep it SHORT — no delay(), no Serial.print(), no loops!
void buttonISR() {
  buttonPresses++;  // Just increment counter
}
```

### Interrupt Rules (Critical!)

1. **ISRs must be short** — microseconds, not milliseconds
2. **No `delay()`** in an ISR — it disables interrupts
3. **No `Serial.print()`** in an ISR — uses interrupts internally
4. **Variables shared with `loop()` must be `volatile`** — tells compiler the value can change anytime
5. **`delay()` and `millis()` won't increment** inside an ISR

### Timer Interrupts

Timers let you schedule events precisely without blocking:

```cpp
#include <TimerOne.h>  // Install via Library Manager

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Timer1.initialize(500000);      // Period in microseconds (500ms)
  Timer1.attachInterrupt(toggleLED);  // ISR to call
}

void toggleLED() {
  digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
}

void loop() {
  // loop() is free for other tasks — LED toggles independently
}
```

### Pin Change Interrupts (All Pins)

UNO only has 2 external interrupts. For more, use pin change interrupts:

```cpp
#include <PinChangeInterrupt.h>

void setup() {
  pinMode(4, INPUT_PULLUP);
  pinMode(5, INPUT_PULLUP);
  attachPCINT(digitalPinToPCINT(4), onPin4Change, CHANGE);
  attachPCINT(digitalPinToPCINT(5), onPin5Change, CHANGE);
}

void onPin4Change() { /* handle pin 4 */ }
void onPin5Change() { /* handle pin 5 */ }

void loop() {}
```

## Level 3 — Systems

### Memory Management

When SRAM runs out, the Arduino silently fails. Here's how to manage memory:

```cpp
// 1. Use PROGMEM for constant data (stores in Flash, not SRAM)
#include <avr/pgmspace.h>

const char longString[] PROGMEM = "This 100-character string lives in Flash, not RAM";
char buffer[50];

void setup() {
  Serial.begin(9600);
  strcpy_P(buffer, longString);  // Read from Flash to RAM buffer
  Serial.println(buffer);
}

// 2. Use F() macro for Serial strings
Serial.println(F("This string stays in Flash, saving RAM!"));

// 3. Check free memory
int freeMemory() {
  extern int __heap_start, *__brkval;
  int v;
  return (int)&v - (__brkval == 0 ? (int)&__heap_start : (int)__brkval);
}

// 4. Avoid String class — use char arrays
// BAD:
String s = "Hello";
s += " World";       // Fragments heap!

// GOOD:
char msg[32] = "Hello";
strcat(msg, " World");  // Fixed-size buffer
```

### Low Power Techniques

Arduino can run on batteries for months with sleep modes:

```cpp
#include <avr/sleep.h>
#include <avr/power.h>

void setup() {
  // Disable unused peripherals
  power_adc_disable();
  power_spi_disable();
  power_twi_disable();
  power_usart0_disable();

  // Set watchdog for periodic wake-up (~8 seconds)
  // Or use external interrupt on pin 2 to wake
  attachInterrupt(0, wakeUp, LOW);
}

void loop() {
  // Do work here, then sleep

  set_sleep_mode(SLEEP_MODE_PWR_DOWN);  // Deepest sleep
  sleep_enable();
  sleep_mode();          // CPU stops here

  // Resumes here after wake-up
  sleep_disable();
}

void wakeUp() { /* Interrupt wakes the CPU */ }
```

**Sleep modes comparison:**

| Mode | Current Draw | Wake Sources |
|------|-------------|--------------|
| Active | ~20 mA | N/A |
| Idle | ~5 mA | Any interrupt |
| Standby | ~1 mA | External interrupt, watchdog |
| Power-down | ~0.1 μA | External interrupt, watchdog |

### EEPROM: Persistent Storage

Save settings that survive power loss:

```cpp
#include <EEPROM.h>

void setup() {
  Serial.begin(9600);

  // Write
  EEPROM.put(0, 42);          // Write int at address 0
  EEPROM.put(2, 3.14159f);    // Write float at address 2

  // Write string
  const char* setting = "Arduino";
  for (int i = 0; i < 8; i++) {
    EEPROM.write(6 + i, setting[i]);
  }

  // Read
  int val;
  EEPROM.get(0, val);
  Serial.print("Stored value: ");
  Serial.println(val);
}

void loop() {}
```

## Level 4 — Expert

### Building a Complete IoT Weather Station

Combine sensors, display, interrupts, and power management:

```cpp
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT22
#define LDR_PIN A0
#define RAIN_PIN 3  // Rain sensor (digital)
#define LCD_ADDR 0x27

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(LCD_ADDR, 16, 2);

// Weather data (volatile for ISR access)
volatile bool rainDetected = false;
volatile unsigned long lastRainTime = 0;
unsigned long lastReadingTime = 0;
const unsigned long READING_INTERVAL = 2000;

void rainISR() {
  rainDetected = true;
  lastRainTime = millis();
}

void setup() {
  Serial.begin(9600);
  dht.begin();
  lcd.init();
  lcd.backlight();

  pinMode(RAIN_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(RAIN_PIN), rainISR, FALLING);

  lcd.setCursor(0, 0);
  lcd.print(F("Weather Station"));
  lcd.setCursor(0, 1);
  lcd.print(F("Initializing..."));
  delay(2000);
}

void loop() {
  if (millis() - lastReadingTime >= READING_INTERVAL) {
    lastReadingTime = millis();

    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    int light = analogRead(LDR_PIN);

    // Row 0: Temperature and humidity
    lcd.setCursor(0, 0);
    lcd.print((int)temp);
    lcd.print(F("C "));
    lcd.print((int)hum);
    lcd.print(F("% "));

    // Row 1: Light level and rain status
    lcd.setCursor(0, 1);
    lcd.print(F("Light:"));
    lcd.print(light);

    if (rainDetected && (millis() - lastRainTime < 30000)) {
      lcd.print(F(" RAIN!"));
    } else {
      lcd.print(F("      "));
    }

    // Serial output for data logging
    Serial.print(temp);
    Serial.print(F(","));
    Serial.print(hum);
    Serial.print(F(","));
    Serial.println(light);
  }

  // Low power: sleep between readings
  // sleep_mode(); // Uncomment for battery operation
}
```

### Watchdog Timer for Reliability

```cpp
#include <avr/wdt.h>

void setup() {
  wdt_enable(WDTO_2S);  // Reset if unresponsive for 2 seconds
  Serial.begin(9600);
}

void loop() {
  // In critical sections, reset the watchdog
  wdt_reset();

  // If this loop hangs (infinite loop, stuck sensor), watchdog resets Arduino
  Serial.println(F("Running..."));

  // If we're doing a long operation, reset more frequently
  for (long i = 0; i < 1000000; i++) {
    wdt_reset();  // Keepalive during long loop
  }
}
```

### FreeRTOS on Arduino (Optional — ESP32 Focus)

For true multitasking, use a real-time OS:

```cpp
// ESP32 FreeRTOS example (conceptual)
// Task 1: Read sensors every 5s
void sensorTask(void *pvParameters) {
  while (1) {
    float temp = readTemperature();
    xQueueSend(dataQueue, &temp, portMAX_DELAY);
    vTaskDelay(5000 / portTICK_PERIOD_MS);
  }
}

// Task 2: Update display every 0.5s
void displayTask(void *pvParameters) {
  float temp;
  while (1) {
    if (xQueueReceive(dataQueue, &temp, 100)) {
      updateDisplay(temp);
    }
    vTaskDelay(500 / portTICK_PERIOD_MS);
  }
}
```

---
## EXERCISES

### Exercise 1: Interrupt-Powered Button (15 min)
Program an LED that toggles ONLY via interrupt when a button on pin 2 is pressed. The `loop()` should print a counter to Serial every second. Verify the LED responds instantly even while `delay(1000)` is running.

### Exercise 2: Memory-Optimized Data Logger (25 min)
Build a sensor logger that reads temperature every 5 seconds using `millis()`. Store the last 20 readings in a circular buffer (array, not String objects). Use `F()` macro for all Serial strings. Print free memory before and after optimizing to see the difference.

### Exercise 3: Capstone — Design Your Own Project (30 min+)
Design and document your own Arduino project combining at least:
- 2 different sensors (digital + analog or two I2C)
- 1 output device (motor, servo, or display)
- At least 1 interrupt
- Serial output for monitoring
- A state machine for behavior logic

Document your design: block diagram, pin assignments, state machine diagram, and sketch.

---
## QUIZ

1. **What does the `volatile` keyword indicate when used with a variable?**
   A) The variable is stored in EEPROM
   B) The variable's value can change outside normal program flow (e.g., in an ISR)
   C) The variable cannot be modified
   D) The variable uses battery-backed RAM

2. **Why shouldn't you use `delay()` inside an interrupt service routine (ISR)?**
   A) `delay()` works but slows down the ISR
   B) `delay()` uses millis() which relies on interrupts that are disabled during the ISR
   C) `delay()` requires `Serial` to be initialized
   D) It's fine — `delay()` is safe in ISRs on newer Arduino boards

3. **What does `F("some string")` accomplish?**
   A) It formats the string with printf-style formatting
   B) It stores the string in Flash (PROGMEM) instead of copying to SRAM
   C) It creates a floating-point number from the string
   D) It frees the string so it can be garbage collected

4. **In SLEEP_MODE_PWR_DOWN, how does the Arduino wake up?**
   A) It wakes itself after a fixed 8-second interval
   B) Only external interrupts or watchdog timer can wake it
   C) `millis()` continues counting and triggers wake
   D) Any sensor reading automatically wakes it

5. **A watchdog timer serves what primary purpose?**
   A) To time the execution of `loop()` precisely
   B) To reset the Arduino if the program hangs or crashes
   C) To measure the frequency of incoming signals
   D) To synchronize serial communication timing

**Answers: 1-B, 2-B, 3-B, 4-B, 5-B**

---
## MILESTONE: Capstone Project

**Goal**: Design and build your own Arduino project independently.

**Requirements:**
- At least 2 sensor types (digital + analog or I2C)
- At least 1 output device (motor, servo, display, or relay)
- At least 1 interrupt (external or timer)
- A state machine controlling overall behavior
- Proper memory management (no String class, use F() macro)
- Serial output for debug/monitoring
- Schematic and pin assignment table

**Suggested Projects:**
1. **Smart Thermostat** — TMP36 + relay + LCD + button interrupts
2. **Automated Plant Watering** — Soil moisture sensor + pump relay + LCD
3. **Motion-Activated Security Light** — PIR sensor + LED strip + servo camera mount
4. **Line-Following Robot** — IR sensors + motor driver + PID control
5. **Internet Data Display** — ESP8266 WiFi + OLED display + web API

---
## Navigation

**Parent**: [[000_ARDUINO_MOC|ARDUINO]]

**Synapses**:
- [[005_Communication_Protocols|ARDUINO 005]] - Protocols for IoT connectivity
- [[004_Displays_And_Output|ARDUINO 004]] - Display data from sensors
- [[003_PWM_And_Motors|ARDUINO 003]] - Motor output for projects
- [[002_Digital_IO_And_Sensors|ARDUINO 002]] - Sensor integration
- [[001_Mental_Models|CORE 001]] - State machine design for capstone
- [[001_TCP_IP|NETWORKING 001]] - Network stack for IoT

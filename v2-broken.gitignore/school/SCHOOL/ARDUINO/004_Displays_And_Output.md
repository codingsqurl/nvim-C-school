# 004_Displays_And_Output

> Making data visible - LCDs, 7-segment displays, and LED matrices.

## Level 1 — Intuition

### Concept

Sensors gather data. Displays make that data **visible**. Arduino supports a spectrum of display types — from simple single-digit 7-segment displays to full text LCDs and graphical matrices.

```
Output complexity spectrum:

7-Segment    ──→   16x2 LCD    ──→   8x8 LED Matrix    ──→   OLED/TFT
(1 digit)          (32 chars)        (64 LEDs)               (128x64 px)
```
```

### Display Architecture

All displays work the same way: send commands + data over a protocol, and the display controller chip renders it:

```
Arduino ──[I2C/SPI/Parallel]──→ Display Controller ──→ Pixels/Segments
                                  (HD44780, MAX7219, etc.)
```

## Level 2 — Practical

### 16x2 LCD with I2C Backpack

The most common Arduino display — 2 rows, 16 characters each. The I2C backpack reduces wiring from 8+ pins to just 2 (SDA, SCL):

```cpp
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Address 0x27 or 0x3F depending on backpack — scan to find
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);        // Column 0, Row 0
  lcd.print("Hello, World!");

  lcd.setCursor(0, 1);        // Column 0, Row 1
  lcd.print("Arduino LCD");
}

void loop() {
  // Display millis() as a timer
  lcd.setCursor(0, 1);
  lcd.print("Time: ");
  lcd.print(millis() / 1000);
  lcd.print("s   ");  // Extra spaces clear leftover chars
  delay(200);
}
```

**I2C LCD wiring (4 wires):**
```
LCD I2C       Arduino
GND     →     GND
VCC     →     5V
SDA     →     A4 (UNO) / SDA
SCL     →     A5 (UNO) / SCL
```

### LCD Special Characters

```cpp
// Create a custom character (5x8 pixels)
byte heart[8] = {
  0b00000,
  0b01010,
  0b11111,
  0b11111,
  0b01110,
  0b00100,
  0b00000,
  0b00000
};

void setup() {
  lcd.init();
  lcd.createChar(0, heart);  // Store in slot 0
  lcd.setCursor(0, 0);
  lcd.write(0);              // Display heart
}
```

### 7-Segment Display

7-segment displays show digits by lighting LED segments labeled A through G:

```
      A
     ───
  F │   │ B
    │ G │
     ───
  E │   │ C
    │   │
     ───  ● DP (decimal point)
      D
```

```cpp
// Direct drive (common cathode) — 8 pins needed
// For practicality, use TM1637 module (I2C-like, 2 pins):
#include <TM1637Display.h>

const int CLK = 2;
const int DIO = 3;
TM1637Display display(CLK, DIO);

void setup() {
  display.setBrightness(7);  // 0-7
}

void loop() {
  // Display "1234"
  uint8_t data[] = { 0x06, 0x5B, 0x4F, 0x66 };  // 1, 2, 3, 4
  display.setSegments(data);

  // Or use built-in encoding:
  display.showNumberDec(42, false);  // "  42"
  delay(2000);
  display.showNumberDec(1530, false);  // "1530"
  delay(2000);
}
```

### 8x8 LED Matrix with MAX7219

```cpp
#include <LedControl.h>

// DIN=12, CS=11, CLK=10
LedControl lc = LedControl(12, 11, 10, 1);

void setup() {
  lc.shutdown(0, false);       // Wake up display
  lc.setIntensity(0, 8);       // Brightness 0-15
  lc.clearDisplay(0);
}

void loop() {
  // Draw a smiley face
  byte smile[8] = {
    B00111100,
    B01000010,
    B10100101,
    B10000001,
    B10100101,
    B10011001,
    B01000010,
    B00111100
  };

  for (int row = 0; row < 8; row++) {
    lc.setRow(0, row, smile[row]);
  }
  delay(1000);

  // Scroll text
  lc.clearDisplay(0);
  for (int i = 0; i < 8; i++) {
    lc.setRow(0, i, 0xFF);  // All on
    delay(100);
  }
}
```

## Level 3 — Systems

### I2C Address Scanning

Not all LCD backpacks use the same address. Scan for devices:

```cpp
#include <Wire.h>

void setup() {
  Serial.begin(9600);
  Wire.begin();

  Serial.println("I2C Scanner");
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("Found device at 0x");
      Serial.println(addr, HEX);
    }
  }
}

void loop() {}
```

### Display Update Strategies

**Problem:** Updating displays too often causes flickering.

```cpp
// BAD: updates every loop iteration (flickers)
void loop() {
  lcd.setCursor(0, 1);
  lcd.print(millis());  // Updates thousands of times/sec
}

// GOOD: update only when value changes
unsigned long lastDisplayed = 0;
void loop() {
  unsigned long secs = millis() / 1000;
  if (secs != lastDisplayed) {
    lastDisplayed = secs;
    lcd.setCursor(0, 1);
    lcd.print("Time: ");
    lcd.print(secs);
    lcd.print("s   ");
  }
}
```

### Display Memory and Rendering

```
LCD 16x2 memory map (HD44780):
  Row 0: addresses 0x00-0x0F (visible) + 0x10-0x27 (hidden, scrollable)
  Row 1: addresses 0x40-0x4F (visible) + 0x50-0x67 (hidden)

MAX7219 memory:
  8 registers × 8 bits = 64-bit display RAM
  Each register = one row
  No character ROM — you control every pixel
```

## Level 4 — Expert

### Scrolling Text on LCD without Blocking

```cpp
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

const char* message = "Arduino scrolling text demo — long messages!   ";
int scrollPos = 0;
unsigned long lastScroll = 0;

void setup() {
  lcd.init();
  lcd.backlight();
}

void loop() {
  if (millis() - lastScroll > 300) {
    lastScroll = millis();

    lcd.setCursor(0, 0);
    for (int i = 0; i < 16; i++) {
      int charIndex = (scrollPos + i) % strlen(message);
      lcd.print(message[charIndex]);
    }
    scrollPos++;
  }
}
```

### Daisy-Chaining MAX7219 for Larger Displays

```
Arduino ──→ MAX7219 #1 ──→ MAX7219 #2 ──→ MAX7219 #3 ──→ ...
            (devices 0-7)  (devices 8-15) (devices 16-23)
```

```cpp
LedControl lc = LedControl(DIN, CS, CLK, 4);  // 4 daisy-chained

void setPixel(int x, int y, bool on) {
  if (x < 0 || x >= 32 || y < 0 || y >= 8) return;
  int device = x / 8;
  int col = x % 8;
  lc.setLed(device, y, col, on);
}
```

### Menu System Pattern

```cpp
// State machine for display UI navigation
enum MenuState { MAIN, SETTINGS, SENSOR_READ };

MenuState currentMenu = MAIN;
int menuCursor = 0;
const char* menuItems[] = {"Settings", "Sensors", "About"};
const int menuCount = 3;

void displayMenu() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("> ");
  lcd.print(menuItems[menuCursor]);
  lcd.setCursor(0, 1);
  lcd.print("  ");
  lcd.print(menuItems[(menuCursor + 1) % menuCount]);
}
```

---
## EXERCISES

### Exercise 1: Temperature Display (20 min)
Connect a TMP36 temperature sensor to A0 and a 16x2 I2C LCD. Display current temperature on row 0 (in °C and °F). TMP36: `tempC = (analogRead(A0) * 5.0 / 1023.0 - 0.5) * 100.0`.

### Exercise 2: Digital Clock (25 min)
Use a TM1637 4-digit 7-segment display to show minutes:seconds. Start at 00:00 and count up every second using `millis()` (not `delay()`). Add a button on pin 2 to reset to 00:00. Display colon blinking every second.

### Exercise 3: Scrolling News Ticker (20 min)
Connect a 16x2 LCD. Store 3 different messages in an array. Rotate through messages every 5 seconds with a smooth horizontal scroll animation. Use `millis()` for all timing — never block with `delay()`.

---
## QUIZ

1. **How many wires are needed for an I2C LCD backpack (excluding power)?**
   A) 8 — all data pins
   B) 4 — RS, EN, D4-D7
   C) 2 — SDA and SCL
   D) 1 — just a data line

2. **What happens if you update an LCD every 1ms (loop speed) without checking for changes?**
   A) The display updates smoothly
   B) The display flickers or becomes unreadable
   C) The Arduino crashes
   D) The LCD backlight turns off

3. **A TM1637 7-segment display can show at most:**
   A) 2 digits
   B) 4 digits
   C) 8 digits
   D) 16 digits

4. **The MAX7219 controls an 8x8 LED matrix using what protocol?**
   A) I2C
   B) SPI-like (DIN, CS, CLK)
   C) UART
   D) Parallel 8-bit

5. **Why use `lcd.print("   ")` at the end of updating a value?**
   A) To center-align the text
   B) To clear leftover characters from a previously longer value
   C) Syntax requirement of the library
   D) To trigger the backlight refresh

**Answers: 1-C, 2-B, 3-B, 4-B, 5-B**

---
## Navigation

**Parent**: [[000_ARDUINO_MOC|ARDUINO]]

**Synapses**:
- [[002_Digital_IO_And_Sensors|ARDUINO 002]] - Reading sensors to display
- [[005_Communication_Protocols|ARDUINO 005]] - I2C and SPI for displays
- [[006_Advanced_Projects|ARDUINO 006]] - Complete weather station with display

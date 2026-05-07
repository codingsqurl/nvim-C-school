# 005_Communication_Protocols

> How Arduinos talk - I2C, SPI, UART deep dive.

## Level 1 — Intuition

### Concept

A microcontroller talks to sensors and modules using **communication protocols** — agreed-upon rules for sending bits. Think of them as languages: some are fast, some are simple, some allow many devices.

```
┌──────────────────────────────────────────────────┐
│              Communication                       │
├──────────┬──────────┬──────────┬────────────────┤
│   UART   │   I2C    │   SPI    │   1-Wire       │
│  2 wires │  2 wires │  4 wires │   1 wire       │
│  Peer    │  Multi   │  Multi   │   Multi        │
│  Simple  │  Addr'd  │  Fast    │   Slow         │
│  PC link │  Sensors │  Displays│  Temperature   │
└──────────┴──────────┴──────────┴────────────────┘
```

### Protocol Comparison

| Feature | UART (Serial) | I2C | SPI |
|---------|---------------|-----|-----|
| Wires | 2 (TX, RX) | 2 (SDA, SCL) | 4 (MOSI, MISO, SCK, SS) |
| Speed | Up to 2 Mbps | 100/400/1000 kbps | Up to 8+ Mbps |
| Devices | 2 (point-to-point) | Up to 127 (7-bit addr) | Limited by SS pins |
| Addressing | None | 7 or 10-bit address | SS pin per device |
| Distance | Long (meters) | Short (meters) | Very short (cm) |
| Complexity | Low | Medium | Low |
| Arduino Pins | 0 (RX), 1 (TX) | A4 (SDA), A5 (SCL) | 11-13 + 10 (SS) |

## Level 2 — Practical

### UART / Serial

Arduino's `Serial` is UART. Two devices connect TX→RX, RX→TX:

```cpp
// Standard Serial (pins 0,1 - also used for USB upload)
void setup() {
  Serial.begin(9600);     // Speed must match on both devices
}

// SoftwareSerial — create serial on any pin
#include <SoftwareSerial.h>
SoftwareSerial btSerial(10, 11);  // RX=10, TX=11

void setup() {
  btSerial.begin(9600);
}

void loop() {
  if (btSerial.available()) {
    char c = btSerial.read();
    Serial.print("Received: ");
    Serial.println(c);
  }

  if (Serial.available()) {
    btSerial.write(Serial.read());
  }
}
```

### I2C (Inter-Integrated Circuit)

I2C is a multi-master, multi-slave bus. Every device has an address. Only 2 wires:

```
     ┌─────────┐
     │ Arduino │ (Master)
     │  SDA  SCL│
     └──┬───┬───┘
        │   ├──────────────┬──────────────┐
        │   │              │              │
   ┌────┼───┼────┐   ┌────┼──────┐  ┌────┼──────┐
   │ 4.7kΩ 4.7kΩ │   │  LCD    │  │  Sensor  │
   │  │     │    │   │ 0x27   │  │  0x68    │
   │ 5V    GND   │   └─────────┘  └──────────┘
   └─────────────┘    (Slave)      (Slave)
    Pull-up resistors (required!)
```

```cpp
#include <Wire.h>

void setup() {
  Wire.begin();                     // Join I2C bus as master
  Serial.begin(9600);
}

void loop() {
  // Read 2 bytes from device at address 0x68
  Wire.beginTransmission(0x68);
  Wire.write(0x3B);                 // Register to read
  Wire.endTransmission(false);      // Restart (not stop)

  Wire.requestFrom(0x68, 2);        // Request 2 bytes
  if (Wire.available() == 2) {
    int high = Wire.read();
    int low = Wire.read();
    int value = (high << 8) | low;
    Serial.println(value);
  }
  delay(500);
}
```

### I2C Scanner (Essential Tool)

```cpp
#include <Wire.h>

void setup() {
  Serial.begin(9600);
  Wire.begin();
  Serial.println("I2C Scanner");

  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("0x");
      Serial.println(addr, HEX);
    }
  }
  Serial.println("Done.");
}

void loop() {}
```

### SPI (Serial Peripheral Interface)

SPI is full-duplex and fast. Uses 4 wires + 1 SS per slave:

```
           Arduino (Master)
          ┌────┼────┼────┼────┐
          │    │    │    │    │
         SCK MOSI MISO SS1 SS2 ...
         (13) (11) (12) (10) (9)
          │    │    │    │
          ├────┼────┤    │
          │    │    │    │
┌─────────┼────┼────┼────┤
│   MISO  │   MOSI  SCK SS │
│          Slave #1         │
└───────────────────────────┘
```

```cpp
#include <SPI.h>

const int SS_PIN = 10;

void setup() {
  pinMode(SS_PIN, OUTPUT);
  digitalWrite(SS_PIN, HIGH);   // Deselect slave
  SPI.begin();
  Serial.begin(9600);
}

void loop() {
  digitalWrite(SS_PIN, LOW);              // Select slave
  byte response = SPI.transfer(0x42);     // Send 0x42, receive response
  digitalWrite(SS_PIN, HIGH);             // Deselect

  Serial.print("Response: 0x");
  Serial.println(response, HEX);
  delay(1000);
}
```

## Level 3 — Systems

### I2C Deep Dive: The Wire Protocol

```
I2C Transaction:

Start ──→ SlaveAddr+R/W ──→ ACK ──→ RegisterAddr ──→ ACK ──→
  │                                                            │
  └── Data Byte ──→ ACK ──→ Data Byte ──→ ACK ──→ Stop ←─────┘

Start: SDA goes LOW while SCL is HIGH
Stop:  SDA goes HIGH while SCL is HIGH
ACK:   Receiver pulls SDA LOW on 9th clock pulse
NACK:  Receiver leaves SDA HIGH on 9th clock pulse
```

### SPI Clock Modes (CPOL/CPHA)

SPI has 4 modes determined by clock polarity and phase:

| Mode | CPOL | CPHA | Idle Clock | Sample Edge |
|------|------|------|------------|-------------|
| 0 | 0 | 0 | LOW | Rising |
| 1 | 0 | 1 | LOW | Falling |
| 2 | 1 | 0 | HIGH | Falling |
| 3 | 1 | 1 | HIGH | Rising |

```cpp
// Most devices use Mode 0 (default) or Mode 3
SPI.setDataMode(SPI_MODE0);  // CPOL=0, CPHA=0
SPI.setDataMode(SPI_MODE3);  // CPOL=1, CPHA=1
```

### Bus Contention and Pull-ups

**I2C requires external pull-up resistors** — typically 4.7kΩ to 10kΩ. Arduino's internal pull-ups (~20-50kΩ) are too weak:

```
Without pull-ups:   SDA/SCL float → bus stuck, no communication
With 4.7kΩ:         SDA/SCL default HIGH, devices pull LOW to signal
Too strong (1kΩ):   May exceed pin sink current limits
Too weak (100kΩ):   Edges too slow for high-speed I2C
```

### Multi-Master I2C and Arbitration

I2C supports multiple masters. If two talk at once, arbitration resolves it:

```
Master1: ────▁▁▁▁▁▁████▁▁▁▁────
                │  conflict! Master2 loses
Master2: ────▁▁▁▁▁▁████▁▁▁▁────
                │
                ↓
         Bus stays LOW (the device driving LOW wins)
```

## Level 4 — Expert

### High-Speed SPI: Bit Banging with Direct Port Access

```cpp
// Manual SPI for maximum speed (no library overhead)
#define SCK PB5  // Pin 13
#define MOSI PB3 // Pin 11
#define MISO PB4 // Pin 12

byte spiTransfer(byte data) {
  byte received = 0;
  for (byte i = 0; i < 8; i++) {
    // Set MOSI
    if (data & 0x80) PORTB |= (1 << MOSI);
    else PORTB &= ~(1 << MOSI);
    data <<= 1;

    // Pulse SCK
    PORTB |= (1 << SCK);
    // Read MISO on rising edge
    received = (received << 1) | ((PINB >> MISO) & 1);
    PORTB &= ~(1 << SCK);
  }
  return received;
}
```

### Building an Arduino-to-Arduino I2C Network

**Master:**
```cpp
#include <Wire.h>

void setup() {
  Wire.begin();    // Master (no address needed)
  Serial.begin(9600);
}

void loop() {
  Wire.beginTransmission(8);  // Talk to slave #8
  Wire.write("Hello from master!");
  Wire.endTransmission();

  Wire.requestFrom(8, 6);     // Request 6 bytes from slave #8
  while (Wire.available()) {
    Serial.print((char)Wire.read());
  }
  Serial.println();
  delay(1000);
}
```

**Slave:**
```cpp
#include <Wire.h>

void setup() {
  Wire.begin(8);                    // Join bus with address #8
  Wire.onReceive(receiveEvent);     // Register callback
  Wire.onRequest(requestEvent);
  Serial.begin(9600);
}

void receiveEvent(int howMany) {
  while (Wire.available()) {
    Serial.print((char)Wire.read());
  }
  Serial.println();
}

void requestEvent() {
  Wire.write("hello!");  // Respond with 6 bytes
}

void loop() {}
```

### Protocol Selection Decision Matrix

| Use Case | Best Protocol | Why |
|----------|---------------|-----|
| Single sensor, short distance | I2C | Fewest wires, standard addresses |
| High-speed data (displays, SD cards) | SPI | Fastest, full duplex |
| GPS module, Bluetooth, PC link | UART | Simple, long-distance capable |
| Many identical sensors (temp chain) | 1-Wire | Each has unique ROM ID |
| Long distance, noisy | RS-485 | Differential signaling |

---
## EXERCISES

### Exercise 1: I2C Scanner (10 min)
Write the I2C scanner sketch. Connect any I2C device (or multiple) and verify its address appears. Try it with and without the device connected — observe which addresses appear.

### Exercise 2: Multi-Sensor Dashboard (25 min)
Connect two I2C sensors simultaneously (e.g., BME280 at 0x76 and an LCD at 0x27). Read temperature/humidity from the BME280 and display it on the LCD. Must handle both I2C addresses correctly on the same bus.

### Exercise 3: Arduino-to-Arduino Chat (25 min)
Connect two Arduinos via UART (TX→RX, RX→TX, GND→GND). Program one as "sender" (reads potentiometer and sends value) and one as "receiver" (displays received value on LCD). Use `SoftwareSerial` to leave `Serial` free for debugging.

---
## QUIZ

1. **How many wires does I2C use for communication (excluding power)?**
   A) 1 — just a data line
   B) 2 — SDA (data) and SCL (clock)
   C) 3 — SDA, SCL, and an interrupt line
   D) 4 — MOSI, MISO, SCK, SS

2. **Why do I2C buses need external pull-up resistors?**
   A) To limit current through the devices
   B) I2C uses open-drain outputs — lines float without pull-ups
   C) To convert 5V signals to 3.3V
   D) Pull-ups are optional for slow speeds

3. **SPI's SS (Slave Select) pin serves what purpose?**
   A) It provides the clock signal
   B) It selects which slave device to communicate with
   C) It carries data from slave to master
   D) It resets the slave device

4. **Two I2C devices on the same bus must have:**
   A) The same address so they can share data
   B) Different addresses to avoid conflicts
   C) The same voltage level
   D) Separate SDA lines

5. **Which protocol is best for connecting to a PC's serial monitor?**
   A) I2C
   B) SPI
   C) UART (Serial)
   D) CAN bus

**Answers: 1-B, 2-B, 3-B, 4-B, 5-C**

---
## Navigation

**Parent**: [[000_ARDUINO_MOC|ARDUINO]]

**Synapses**:
- [[002_Digital_IO_And_Sensors|ARDUINO 002]] - Reading sensor data over I2C/SPI
- [[004_Displays_And_Output|ARDUINO 004]] - Display modules use I2C/SPI
- [[006_Advanced_Projects|ARDUINO 006]] - Multi-protocol IoT device
- [[001_TCP_IP|NETWORKING 001]] - Network protocols for IoT

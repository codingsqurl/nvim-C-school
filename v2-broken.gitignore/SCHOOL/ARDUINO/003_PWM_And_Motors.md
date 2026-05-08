# 003_PWM_And_Motors

> Making things move - pulse width modulation, servos, and DC motors.

## Level 1 — Intuition

### Concept

Digital pins are either ON (5V) or OFF (0V). But how do you dim an LED or control motor speed? **PWM (Pulse Width Modulation)** fakes an analog voltage by switching ON/OFF very fast. Your eyes see the average.

```
100% duty cycle:  ████████████████   = full brightness / full speed
 75% duty cycle:  ████████████░░░░   = 75% brightness / 75% speed
 50% duty cycle:  ████████░░░░░░░░   = half brightness / half speed
 25% duty cycle:  ████░░░░░░░░░░░░   = dim / slow
  0% duty cycle:  ░░░░░░░░░░░░░░░░   = off / stopped
```

### How PWM Works

```
Period (fixed) ───────────────
             ┌──────┐          ┌──────┐
5V ──────────┤      ├──────────┤      ├──
             │      │          │      │
0V ──────────┘      └──────────┘      └──
             ├──────┤          ├──────┤
             ON time           OFF time

Duty Cycle = ON_time / Period × 100%
Frequency  = 1 / Period

Arduino UNO PWM: ~490 Hz (pins 5,6) or ~980 Hz (pins 3,9,10,11)
```

### PWM-Capable Pins on Arduino UNO

```
         ┌────────────────────────┐
         │  3, 5, 6, 9, 10, 11   │
         │    (marked with ~)     │
         └────────────────────────┘
         ↑           ↑
    Timer2 (980Hz)  Timer1 (490Hz)
```

## Level 2 — Practical

### LED Fading with analogWrite()

```cpp
const int LED_PIN = 9;  // Must be a PWM pin (~)

void loop() {
  // Fade in
  for (int brightness = 0; brightness <= 255; brightness++) {
    analogWrite(LED_PIN, brightness);
    delay(10);  // Smooth fade over ~2.5 seconds
  }
  // Fade out
  for (int brightness = 255; brightness >= 0; brightness--) {
    analogWrite(LED_PIN, brightness);
    delay(10);
  }
}
```

**`analogWrite(pin, value)`:**
- `pin`: PWM-capable pin (3, 5, 6, 9, 10, 11 on UNO)
- `value`: 0 (always off) to 255 (always on)
- Non-PWM pins: value < 128 → LOW, ≥ 128 → HIGH

### Breathing LED Effect

```cpp
// Sine-wave breathing (smoother than linear fade)
void loop() {
  for (int i = 0; i < 360; i++) {
    // sin() returns -1 to +1, map to 0-255
    int brightness = (sin(radians(i)) + 1) * 127.5;
    analogWrite(LED_PIN, brightness);
    delay(10);
  }
}
```

### Servo Motor Control

Servos are position-controlled motors. They rotate to a specific angle (usually 0-180°) and hold:

```cpp
#include <Servo.h>

Servo myServo;
const int SERVO_PIN = 9;

void setup() {
  myServo.attach(SERVO_PIN);  // Connect servo to pin 9
}

void loop() {
  myServo.write(0);       // Go to 0 degrees
  delay(1000);
  myServo.write(90);      // Go to 90 degrees (center)
  delay(1000);
  myServo.write(180);     // Go to 180 degrees
  delay(1000);
}
```

**Servo wiring:**
```
Servo        Arduino
Brown/Black → GND
Red         → 5V (use external supply for multiple servos!)
Orange/Yellow → Pin 9 (signal)
```

### How Servo PWM Works

Servos listen for a pulse every 20ms. The pulse width determines angle:

```
20ms period
├─────────────────────────────────────────┤
├─┤ 1ms pulse = 0°
├──┤ 1.5ms pulse = 90°
├────┤ 2ms pulse = 180°
```

## Level 3 — Systems

### DC Motor Control with H-Bridge (L293D / L298N)

DC motors spin continuously. An H-bridge lets you control speed AND direction:

```
H-Bridge Concept:
    VCC                VCC
     │                  │
     ├──[SW1]──┬──[SW3]─┤
     │         │         │
     │       Motor       │
     │         │         │
     ├──[SW2]──┴──[SW4]─┤
     │                  │
    GND                GND

Forward:  SW1+SW4 closed, SW2+SW3 open
Reverse:  SW2+SW3 closed, SW1+SW4 open
Brake:    SW1+SW2 closed (or SW3+SW4)
Coast:    All open
```

**L298N wiring:**

```cpp
// L298N Motor Driver
const int ENA = 9;   // Enable A (PWM for speed)
const int IN1 = 8;   // Input 1 (direction)
const int IN2 = 7;   // Input 2 (direction)

void setup() {
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
}

void motorForward(int speed) {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, speed);   // 0-255 PWM
}

void motorReverse(int speed) {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  analogWrite(ENA, speed);
}

void motorStop() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 0);
}
```

### Controlling Multiple PWM Devices

Each PWM pin uses a hardware timer internally:

| Timer | Pins | Resolution | Default Freq |
|-------|------|------------|--------------|
| Timer0 | 5, 6 | 8-bit | 976 Hz |
| Timer1 | 9, 10 | 16-bit | 490 Hz |
| Timer2 | 3, 11 | 8-bit | 490 Hz |

Changing Timer0 affects `millis()` and `delay()` — avoid it unless you know what you're doing.

### Computing Motor Requirements

```
Torque needed, speed required, operating voltage:

Stall current = Operating voltage / Coil resistance

Example: 6V motor, 3Ω resistance
Stall current = 6V / 3Ω = 2A

Arduino pin max: 40mA — you CANNOT drive motors directly!
Always use a motor driver (L293D, L298N, MOSFET)
```

## Level 4 — Expert

### PWM Frequency Adjustment

```cpp
// Change PWM frequency on Timer1 (pins 9, 10)
// Formula: f = 16MHz / (prescaler * ICR1)

void setPWMFrequency(int pin, long frequency) {
  // Pin 9 or 10 (Timer1)
  TCCR1B = (TCCR1B & 0b11111000) | 0x01;  // Prescaler = 1
  ICR1 = 16000000 / frequency - 1;
  TCCR1A |= _BV(COM1A1);  // Non-inverting mode
}
```

### Smooth Stepper Motor Control with AccelStepper

```cpp
#include <AccelStepper.h>

// 28BYJ-48 stepper motor: 2048 steps/rev with ULN2003 driver
AccelStepper stepper(AccelStepper::FULL4WIRE, 8, 10, 9, 11);

void setup() {
  stepper.setMaxSpeed(1000);       // Steps/second
  stepper.setAcceleration(200);    // Steps/second²
}

void loop() {
  stepper.moveTo(2048);            // One full rotation
  stepper.run();                   // Must call repeatedly
}
```

### PID Control for Precise Motor Positioning

```cpp
// Simple PID for motor speed/position control
float Kp = 2.0, Ki = 0.1, Kd = 0.5;
float integral = 0, lastError = 0;

int computePID(int setpoint, int measurement, float dt) {
  float error = setpoint - measurement;
  integral += error * dt;
  float derivative = (error - lastError) / dt;
  lastError = error;
  return Kp * error + Ki * integral + Kd * derivative;
}
```

---
## EXERCISES

### Exercise 1: Servo Sweeper (15 min)
Connect a servo to pin 9. Program it to sweep from 0° to 180° and back continuously. Use `map()` to make the servo follow a potentiometer on A0 — turn the knob to set servo angle.

### Exercise 2: Motor Speed Controller (20 min)
Use L293D/L298N to drive a DC motor. Connect a potentiometer to A0. Map the potentiometer reading (0-1023) to motor speed (0-255). Add a button on pin 2 to toggle motor direction. Display speed and direction on Serial Monitor.

### Exercise 3: Mini Robotic Arm (30 min)
Control TWO servos (base rotation + gripper lift) with two potentiometers (A0, A1). Add a button that, when pressed, records the current arm position; pressing a second button replays the recorded motion sequence. This is the foundation of teach-and-repeat robotics.

---
## QUIZ

1. **What does a 50% duty cycle PWM signal on pin 9 look like?**
   A) 5V half the time, 0V half the time, at the PWM frequency
   B) 2.5V constant voltage
   C) 5V pulses every 50ms
   D) Random switching

2. **Why can't you drive a DC motor directly from an Arduino digital pin?**
   A) The pin can only supply ~40mA; motors need hundreds of mA to amps
   B) The motor would spin backwards
   C) The timing is wrong for DC motors
   D) It works fine — just connect directly

3. **A servo motor's angle is controlled by:**
   A) The voltage level on the signal wire
   B) The width of a pulse sent every 20ms
   C) The frequency of the PWM signal
   D) The current flowing through the servo

4. **`analogWrite(9, 128)` on a PWM-capable pin produces approximately:**
   A) 5V constant
   B) 0V constant
   C) 2.5V average (50% duty cycle)
   D) 128V pulses

5. **What happens if you use `analogWrite()` on a non-PWM pin (e.g., pin 7)?**
   A) Nothing — it's ignored
   B) Values ≥ 128 output HIGH, < 128 output LOW
   C) The Arduino enters PWM mode on that pin
   D) pinMode is automatically changed

**Answers: 1-A, 2-A, 3-B, 4-C, 5-B**

---
## Navigation

**Parent**: [[000_ARDUINO_MOC|ARDUINO]]

**Synapses**:
- [[002_Digital_IO_And_Sensors|ARDUINO 002]] - Sensor input
- [[004_Displays_And_Output|ARDUINO 004]] - Display motor data
- [[006_Advanced_Projects|ARDUINO 006]] - Interrupt-based motor control

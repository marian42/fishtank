#include <SoftwareServo.h> 
#include <EEPROM.h>

int pinled = 2;
int pinservodump = 3;
int pinservoopen = 6;
int pinmotor = 4;
int pinmotorspeed = 5;
int pingreen = 10;
int pinblue = 9;
int pinred = 11;
int pincounter1 = A0;
int pincounter2 = A1;
int pinbrightness = A2;

const int threshold1 = 200;
const int threshold2 = 400;
const int fullrotation = 210;
const int containers = 28;
const int motorspeed = 255;

const int servodumpup = 159;
const int servodumpdown = 63;
const int servoopenopen = 1;
const int servoopenclosed = 180;

const int address_calibrated = 1;
const int address_position = 2;

float position = 0.0;
boolean calibrated = false; // Set true to skip calibration

boolean customcolor = true;
long timeout = 0;

boolean errorstate = false;

SoftwareServo servodump;
SoftwareServo servoopen;

void setup() {
	pinMode(pinled, OUTPUT);		
	pinMode(pinservodump, OUTPUT);		
	pinMode(pinservoopen, OUTPUT);		
	pinMode(pinmotor, OUTPUT);		
	pinMode(pinmotorspeed, OUTPUT);		
	pinMode(pinred, OUTPUT);		
	pinMode(pingreen, OUTPUT);		
	pinMode(pinblue, OUTPUT);		
	pinMode(pincounter1, INPUT);
	pinMode(pincounter2, INPUT);
	pinMode(pinbrightness, INPUT);
	setcolor(0,0,0);
	
	Serial.begin(9600);
	
	servodump.attach(pinservodump);
	servodump.write(servodumpup);
	delayandrefresh(300);
	servoopen.attach(pinservoopen);
	servoopen.write(servoopenclosed);

	if (EEPROM.read(address_calibrated) == 1) {
		calibrated = true;
		position = (float)EEPROM.read(address_position) * (float)containers / (float)fullrotation;
	}
	
	for (int i = 0; i < 255; i++) {
		setcolor(0,(int)(256.0 * pow((double)i / 256.0, 5)),0);
		delayandrefresh(5);
	}
	
	for (int i = 0; i < 3; i++) {
		delayandrefresh(200);
		if (calibrated)
			setcolor(0,255,0);
		else setcolor(100,255,0);
		delayandrefresh(200);
		setcolor(0,0,0);
	}
}

void saveposition() {
	EEPROM.write(address_calibrated, 1);
	EEPROM.write(address_position, (byte)(position * (float)fullrotation / (float)containers));
}

void setcolor(int r, int g, int b) {
	analogWrite(pinred, 255 - r);
	analogWrite(pingreen, 255 - g);
	analogWrite(pinblue, 255 - b);
}

int getCounter1() {
	digitalWrite(pinled, true);
	delay(1);
	int value = analogRead(pincounter1);
	digitalWrite(pinled, false);
	digitalWrite(pinred, value < threshold1);
	digitalWrite(pingreen, value < threshold1);
	return value;
}

int getCounter2() {
	digitalWrite(pinled, true);
	delay(1);
	int value = analogRead(pincounter2);
	digitalWrite(pinled, false);
	return value;
}

void startMotor(int v) {
	EEPROM.write(address_calibrated, 0);
	digitalWrite(pinmotor, true);
	digitalWrite(pinmotorspeed, v);
}

void stopMotor(boolean brake) {
	digitalWrite(pinmotorspeed, 0);
	
	if (brake) {
		digitalWrite(pinmotor, true);
		delay(200);
	}
	digitalWrite(pinmotor, false);
}

boolean rotate(int r, boolean brake) {	
	startMotor(motorspeed);
	const int cooldown1 = 200;
	long last1 = millis();
	
	while (getCounter1() > threshold1) {
		delay(40);
		if (millis() > last1 + 1000) {
			errorstate = true;			
			stopMotor(false);
			return false;
		}
	}
	
	while (r > 0) {
		int v = getCounter1();
		if (v > threshold1 && last1 + cooldown1 < millis()) {
			r--;
			Serial.write(20 + r);
			last1 = millis();
		}
		if (millis() > last1 + 1000) {
			errorstate = true;			
			stopMotor(false);
			return false;
		}
	}
	stopMotor(brake);
	setcolor(0,0,0);
	return true;
}

void findstart() {
	Serial.write(16);
	
	long last1 = millis();
	long start = millis();
	int progress = fullrotation;
	
	startMotor(motorspeed);
	while (getCounter2() > threshold2 || millis() < start + 10000) {
		if ((getCounter1() > threshold1)) {
			if (millis() > last1 + 200) {
				last1 = millis();
				progress--;
				Serial.write(20 + progress);
			}
		}
		else setcolor(0, 255, 0);

		if (getCounter2() < threshold2)
			progress = fullrotation;		
		
		if (millis() > last1 + 2000) {
			calibrated = false;
			errorstate = true;
			Serial.write(20);
			stopMotor(false);
			return;
		}
		delay(10);
	}
	rotate(2, true);
	
	position = 0;
	calibrated = true;
	
	Serial.write(20);
	saveposition();
}

boolean gotocontainer(int n) {
	if (errorstate)
		return false;
	if (!calibrated)
		findstart();
	if (errorstate)
		return false;
	
	int p = (int)position;
	if (n < p) n += containers;
	return skipcontainer(n - p);
}

boolean skipcontainer(int n) {
	if (errorstate)
		return false;
	//Serial.print("pos: "); Serial.print(position); Serial.print(" - maxr: ");
	float maxr = (float)n * (float)fullrotation / containers;
	//Serial.print(maxr); Serial.print(" - corrected: ");
	maxr += (- position + floor(position)) * (float)fullrotation / containers;
	//Serial.print(maxr); Serial.print(" - r: ");
	int r = (int)maxr + 1;
	//Serial.print(r);	Serial.println();
	position += (float)r * (float)containers / fullrotation;
	if (position > containers) position -= (float)containers;
	
	boolean result = rotate(r, true);
	saveposition();
	
	return result;
}

void delayandrefresh(int t) {
	long end = millis() + t;
	while (millis() < end)
		SoftwareServo::refresh(); 
}

void flush() {
	setcolor(128,0,200);

	servoopen.write(servoopenopen);
	delayandrefresh(500);	

	servodump.write(servodumpdown);
	delayandrefresh(600);
	servodump.write(servodumpup);

	delayandrefresh(800);
	servodump.write(servodumpdown);
	delayandrefresh(600);
	servodump.write(servodumpup);

	delayandrefresh(600);
	setcolor(0,0,0);
	servoopen.write(servoopenclosed);
	delayandrefresh(500);
}

void checkserial() {
	const int confirm = 13;
	int requestshandled = 0;
	if (Serial.available()) {
		while(Serial.available()) {
			requestshandled++;
			byte command = Serial.read();
			if (command != 105)
				setcolor(0,0,255);
			delay(20);
			setcolor(0,0,0);
			switch (command) {
				case 100: { // Move
					if (!Serial.available()) return;
					int pos = Serial.read();
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					Serial.write(14);
					if (!gotocontainer(pos))
						Serial.write(1);
					break;
				}
				case 101: { // Move relative
					if (!Serial.available()) return;
					int pos = Serial.read();
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					Serial.write(14);
					if (!skipcontainer(pos))
						Serial.write(1);
					break;
				}
				case 102: { // Flush
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					Serial.write(15);
					flush();
					break;
				}
				case 103: { // Move & Flush
					if (!Serial.available()) return;
					int pos = Serial.read();
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					Serial.write(14);
					if (!gotocontainer(pos)) {
						Serial.write(1);
						break;
					}
					Serial.write(15);
					flush();
					break;
				}
				case 104: { // Calibrate
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					findstart();
					if (!calibrated)
						Serial.write(1);
					break;
				}
				case 105: { // Set color
					if (!Serial.available()) return;
					int r = Serial.read();
					if (!Serial.available()) return;
					int g = Serial.read();
					if (!Serial.available()) return;
					int b = Serial.read();
					if (!Serial.available()) return;
					int t = Serial.read();
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					setcolor(r,g,b);
					customcolor = true;
					timeout = millis() + t * 100;
					break;
				}
				case 106: { // Get brightness
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					byte v = analogRead(pinbrightness) / 4;
					Serial.write(v);
					break;
				}
				case 107: { // Get position
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					byte v = (int)position;
					Serial.write(v);
					break;
				}	
				case 108: { // Get ping
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					break;
				}
				case 109: { // Get calibrated
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					if (calibrated) Serial.write(1);
						else Serial.write(0);
					break;
				}
				case 110: { // Set calibrated
					if (!Serial.available()) return;
					boolean v = Serial.read() == 1;
					if (Serial.read() != confirm) return;
					calibrated = v;
					break;
				}
				case 111: { // Get error state
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					Serial.write(errorstate);
					break;
				}
				case 112: { // Set error state
					if (!Serial.available()) return;
					if (Serial.read() != confirm) return;
					errorstate = false;
					break;
				}
				default: { // Red light
					requestshandled--;
					setcolor(255,0,0);
					delay(500);
					setcolor(0,0,0);
					while (Serial.available())
						Serial.read();
				}
			}
		}
		if (!errorstate && requestshandled != 0)
			Serial.write(confirm);
	}
}

void loop() {
	checkserial();	
	if (customcolor && timeout < millis()) {
		customcolor = false;
		setcolor(0,0,0);
	} else if (errorstate) {
		setcolor(millis() % 1000 < 200 ? 255 : 0, 0, 0); 
	}
}

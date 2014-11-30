import time
import serial
from thread import start_new_thread

class FishFeederStatus:
	READY = 0
	ERROR = 1
	BUSY = 2
	ROTATING = 3
	DUMPING = 4
	CALIBRATING = 5
	
	@staticmethod
	def getMessage(status):
		if (status == FishFeederStatus.READY):
			return "Ready"
		if (status == FishFeederStatus.ERROR):
			return "Error"
		if (status == FishFeederStatus.BUSY):
			return "Busy"
		if (status == FishFeederStatus.ROTATING):
			return "Rotating"
		if (status == FishFeederStatus.DUMPING):
			return "Dumping"
		if (status == FishFeederStatus.CALIBRATING):
			return "Calibrating"
			
class FishFeeder(object):
	def __init__(self):
		self.status = FishFeederStatus.READY
		self.position = 0
		self.start = 0
		self.currentposition = 0
		self.duration = 0
		self.speed = 0.325919
		self.timeleft = 0
		self.progress = 0
		self.moving = False
		self.maxprogress = 0
		self.onChangeStatus = None
		self.onChangeProgress = None
		self.ser = serial.Serial("/dev/ttyAMA0", 9600)
		self.ser.open();
		start_new_thread(self._seriallistener, ())
	
	def _wait(self):
		while (self.status != FishFeederStatus.READY and self.status != FishFeederStatus.ERROR):
			time.sleep(0.01)
	
	def flash(self,r,g,b,duration):
		self.status = FishFeederStatus.BUSY
		self.ser.write(chr(105))
		self.ser.write(chr(r))
		self.ser.write(chr(g))
		self.ser.write(chr(b))
		self.ser.write(chr(int(duration * 10.0)))
		self.ser.write(chr(13))
		self._wait()
	
	def flashHex(self, hex, duration = 1):
		_NUMERALS = '0123456789abcdefABCDEF'
		_HEXDEC = {v: int(v, 16) for v in (x+y for x in _NUMERALS for y in _NUMERALS)}
		LOWERCASE, UPPERCASE = 'x', 'X'

		if (hex[0] == '#'):
			hex = hex[1:7]
		self.flash(_HEXDEC[hex[0:2]], _HEXDEC[hex[2:4]], _HEXDEC[hex[4:6]], duration);
		
	def initializeMove(self, dest):
		dest = dest % 27
		if (dest < self.position):
			dest += 27
		self.startt = time.time()
		self.moving = True
		self.start = self.position
		self.currentposition = self.position
		self.position = dest
		self.timeleft = (self.position - self.start) / self.speed
		
	def moveTo(self, dest):
		self.initializeMove(dest)
		self.status = FishFeederStatus.BUSY
		self.ser.write(chr(100))
		self.ser.write(chr(dest))
		self.ser.write(chr(13))
		self._wait()
		
	def move(self, amount):
		self.initializeMove(self.position + amount)
		self.status = FishFeederStatus.BUSY
		self.ser.write(chr(101))
		self.ser.write(chr(amount))
		self.ser.write(chr(13))
		self._wait()

	def dump(self):
		self.status = FishFeederStatus.BUSY
		self.ser.write(chr(102))
		self.ser.write(chr(13))
		self._wait()
		
	def moveToAndDump(self, dest):
		self.initializeMove(dest)
		self.status = FishFeederStatus.BUSY
		self.ser.write(chr(103))
		self.ser.write(chr(dest))
		self.ser.write(chr(13))
		self._wait()
	
	def calibrate(self):
		self.status = FishFeederStatus.BUSY
		self.status = FishFeederStatus.BUSY
		self.ser.write(chr(104))
		self.ser.write(chr(13))
		self._wait()
	
	def getBrightness(self):
		self.ser.write(chr(106))
		self.ser.write(chr(13))
		result = ord(self.ser.read())
		self.status = FishFeederStatus.BUSY
		self._wait()
		return result
		
	def getPosition(self):
		self.ser.write(chr(107))
		self.ser.write(chr(13))
		result = ord(self.ser.read())
		self.status = FishFeederStatus.BUSY
		self._wait()
		return result
		
	#TODO getping
	
	def getCalibrated(self):
		self.ser.write(chr(109))
		self.ser.write(chr(13))
		result = ord(self.ser.read())
		self.status = FishFeederStatus.BUSY
		self._wait()
		self._wait()
		return result == 1

	def setCalibrated(self, value):
		self.status = FishFeederStatus.BUSY
		self.ser.write(chr(110))
		self.ser.write(chr((0,1)[value]))
		self.ser.write(chr(13))
		self._wait()
		
	def getErrorState(self):
		while (self.status != FishFeederStatus.READY):
			time.sleep(0.05)
		self.ser.write(chr(111))
		self.ser.write(chr(13))
		result = ord(self.ser.read())
		self.status = FishFeederStatus.BUSY
		self._wait()
		return result == 1
		
	def resetErrorState(self):
		self.status = FishFeederStatus.BUSY
		self.ser.write(chr(112))
		self.ser.write(chr(13))
		self._wait()
		
	def setOnChangeStatusListener(self, callback):
		self.onChangeStatus = callback
	
	def _setStatus(self, newstatus):
		if (newstatus == FishFeederStatus.READY):
			self.moving = False
		if (self.status == newstatus):
			return
		if (not (self.status == FishFeederStatus.BUSY and newstatus == FishFeederStatus.READY)):			
			if (not self.onChangeStatus is None):
				oldstatus = self.status
				self.status = newstatus
				self.onChangeStatus(oldstatus, newstatus)
		self.status = newstatus
			
	def setOnChangeProgressListener(self, callback):
		self.onChangeProgress = callback
	
	def _setProgress(self, newprogress):
		if (self.maxprogress != 0):
			self.currentposition = self.start + (self.position - self.start) * newprogress / self.maxprogress
			self.timeleft = (self.position - self.start) * (1.0 - newprogress) / self.speed
		self.progress = newprogress
		if (not self.onChangeProgress is None):
			self.onChangeProgress(newprogress)
		
	def _seriallistener(self):
		while (True):
			if (self.status != FishFeederStatus.READY):
				byte = ord(self.ser.read())
				if (byte == 1):
					self._setStatus(FishFeederStatus.ERROR)
				elif (byte == 13):
					self._setStatus(FishFeederStatus.READY)
				elif (byte == 14):
					self._setStatus(FishFeederStatus.ROTATING)
				elif (byte == 15):
					self._setStatus(FishFeederStatus.DUMPING)
				elif (byte == 16):
					self._setStatus(FishFeederStatus.CALIBRATING)
				elif (byte >= 20):
					byte -= 20
					if (self.maxprogress == 0):
						self.maxprogress = byte
					if (self.maxprogress != 0):						
						p = 1.0 * (self.maxprogress - byte) / self.maxprogress
						if (byte == 0):
							self.maxprogress = 0
							self.moving = False
							end = time.time()
							#print 'Speed: ' + str((self.position - self.start) / (end - self.startt))
						self._setProgress(p)
						
	def getSerializeable(self):
		result = {}
		result['position'] = self.position
		result['currentposition'] = self.currentposition
		result['start'] = self.start
		result['timeleft'] = self.timeleft
		result['moving'] = self.moving
		
		return result

if (__name__ == '__main__'):
	feeder = FishFeeder()
	# Test
from elro import RemoteSwitch
import FishTank
from subprocess import call
import RPi.GPIO as GPIO

class Lights(object):
	def __init__(self):
		Lights.instance = self
		self.callScript = True
		self.value = False
		if not self.callScript:
			key = [0,0,0,0,0]	
			pin = 11
			device = 1
			self.remoteswitch = RemoteSwitch(device = device, key=key, pin=pin)
		
		# LED for Debugging
		GPIO.setmode(GPIO.BOARD)
		self.ledpin = 16
		#GPIO.setmode(self.ledpin)
		GPIO.setup(self.ledpin, GPIO.OUT)
	
	def load(self, ini):
		section = 'lights'
		if not ini.has_section(section):
			print("error!")
			return
		self.value = ini.get(section,'value') == 'True'
	
	def save(self, ini):
		section = 'lights'
		if not ini.has_section(section):
			ini.add_section(section)
		ini.set(section,'value',str(self.value))
	
	def broadcast(self):
		#LED for Debugging
		GPIO.output(self.ledpin, self.value)
		if not self.callScript:
			if self.value:
				self.remoteswitch.switchOn()
			else: self.remoteswitch.switchOff()
		else:
			call(["python","/var/www/fishtank/server/elro.py", "1", "1" if self.value else "0"])
		
	def switch(self):
		self.value = not self.value				
		self.broadcast()
		FishTank.FishTank.instance.increaseVersion()
		
	def tick(self):
		return
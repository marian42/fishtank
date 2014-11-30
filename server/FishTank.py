import configparser
import datetime
import sys
import time

from FoodStore import *
from EventList import *
from Camera import *
from fishfeeder import *
from Lights import *

class FishTank(object):
	def __init__(self, inifilename, log):
		FishTank.instance = self
		self.version = 0
		self.saturation = 0
		self.saturationchanged = datetime.datetime.now()
		self.status = 'Ready'
		
		self.inifilename = inifilename
		self.log = log
		
		self.foodStore = FoodStore()
		self.eventList = EventList()
		self.camera = Camera(self)
		self.fishFeeder = FishFeeder()
		self.fishFeeder.position = self.fishFeeder.getPosition()
		self.fishFeeder.setOnChangeStatusListener(self.onFishFeederUpdate)
		self.lights = Lights()
		self.load()
	
	def save(self):
		status = configparser.ConfigParser()
		status.read(self.inifilename)
		
		section = 'status'
		if not status.has_section(section):
			status.add_section(section)
		
		status.set(section, 'saturation', str(self.saturation))
		status.set(section, 'saturationchanged', str(self.saturationchanged))
		status.set(section, 'version', str(self.version))
		status.set(section, 'cameracounter', str(self.camera.counter))
		
		self.foodStore.save(status)
		self.eventList.save(status)
		self.lights.save(status)
		
		with open(self.inifilename, 'w') as configfile:
			status.write(configfile)
			
	def load(self):
		status = configparser.ConfigParser()
		status.read(self.inifilename)
		
		self.foodStore.load(status)
		self.eventList.load(status)
		self.lights.load(status)
		
		section = 'status'
		if not status.has_section(section):
			print("error!")
			return
		self.saturation = float(status.get(section, 'saturation'))
		self.saturationchanged = datetime.datetime.strptime(status.get(section, 'saturationchanged'), "%Y-%m-%d %H:%M:%S.%f")
		self.version = status.getint(section, 'version') + 1
		self.camera.counter = status.getint(section,'cameracounter')
	
	def getSerializeable(self):
		result = {}
		result['container'] = self.foodStore.getSerializeable()
		result['event'] = self.eventList.getSerializeable()
		result['version'] = self.version
		result['saturation'] = self.saturation
		result['saturationchanged'] = time.mktime(self.saturationchanged.timetuple())
		result['log'] = self.log.getRecentEntries(15)
		result['imagecount'] = self.camera.counter
		result['status'] = self.status
		result['feeder'] = self.fishFeeder.getSerializeable()
		result['foodamount'] = self.getFoodAmount()
		result['autofeedamount'] = self.getAutoFeedAmount()
		nextEvent = self.getNextEvent()
		result['nexteventtype'] = nextEvent.type
		result['nexteventtime'] = time.mktime(nextEvent.getNextExecution().timetuple())		
		result['nextlighteventtime'] = time.mktime(self.getNextLightEvent().getNextExecution().timetuple())		
		result['lights'] = self.lights.value
		result['scheduling'] = self.eventList.enabled;
		return result
		
	def increaseVersion(self):
		self.version += 1
		
	def updateStatus(self, newStatus):
		self.status = newStatus
		self.increaseVersion()
		
	def onFishFeederUpdate(self, oldstatus, newstatus):
		if (newstatus == FishFeederStatus.CALIBRATING):
			self.log.write(message = 'Calibrating fish feeder.', level = 1, startedby = 'fishfeeder')
		self.status = FishFeederStatus.getMessage(newstatus)
		self.increaseVersion()
		
	def getSaturation(self):
		days = (datetime.datetime.now() - self.saturationchanged).seconds / (60.0 * 60.0 * 24.0)
		return max(0, self.saturation - days)
	
	def setSaturation(self, value):
		self.saturation = value
		self.saturationchanged = datetime.datetime.now()
		self.increaseVersion()
		
	def getFoodAmount(self):
		amount = 0
		for container in self.foodStore.container:
			if container.food != 0:
				amount += container.amount
		return amount
	
	def getAutoFeedAmount(self):
		candidates = set()
		for event in self.eventList.events:
			if event.type == 0:
				candidates = candidates.union(set(event.getContainerCandidates()))
		amount = 0
		for container in list(candidates):
			amount += container.amount
		return amount
			
	def getNextEvent(self):
		time = None
		result = None
		for event in self.eventList.events:
			if time == None:
				result = event
				time = event.getNextExecution()
			else:
				if (event.getNextExecution() < time):
					result = event
					time = event.getNextExecution()
		return result
		
	def getNextLightEvent(self):
		time = None
		result = None
		for event in self.eventList.events:
			if event.type == 1 and event.value != self.lights.value:
				if time == None:
					result = event
					time = event.getNextExecution()
				else:
					if (event.getNextExecution() < time):
						result = event
						time = event.getNextExecution()
		return result
		
	def tick(self):
		self.eventList.tick()
		self.lights.tick()
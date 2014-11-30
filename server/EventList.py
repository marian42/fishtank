from Event import *
import datetime

class EventList(object):
	names = ['Feed','Light','Take picture']
	
	def __init__(self):
		self.events = []
		self.enabled = True
		self.idcounter = 0
		self.today = datetime.datetime.today().date()
		
	def createEvent(self, type):
		if type == 0:
			return FeedEvent()
		elif type == 1:
			return LightEvent()
		elif type == 2:
			return PictureEvent()
		return None
		
	def load(self, ini):
		section = 'events'
		if not ini.has_section(section):
			print("error!")
			return
		self.idcounter = ini.getint(section,'idcounter')
		self.enabled = ini.getboolean(section,'enabled')
		count = ini.getint(section,'count')
		self.events = []
		for i in range(count):
			event = self.createEvent(ini.getint('event' + str(i),'type'))
			event.readFromIni(ini, 'event' + str(i))
			self.events.append(event)
	
	def save(self, ini):
		section = 'events'
		if not ini.has_section(section):
			ini.add_section(section)
		ini.set(section,'idcounter',str(self.idcounter))
		ini.set(section,'enabled',str(self.enabled))
		ini.set(section,'count',str(len(self.events)))
		i = 0
		for event in self.events:
			event.writeToIni(ini, 'event' + str(i))
			i += 1

	def getSerializeable(self):
		return [event.getSerializeable() for event in self.events]
		
	def update(self, params):
		id = int(params['event'])
		type = int(params['type'])
		
		event = self.createEvent(type)
		event.setDayInt(int(params['day']))
		event.hour = int(params['hour'])
		event.minute = int(params['minute'])
		event.executed = event.timePassed()
		
		if type == 0:
			event.setFoodInt(int(params['food']))
			event.maxSaturation = int(params['maxsaturation'])
			event.minAmount = int(params['minamount'])
			event.maxAmount = int(params['maxamount'])
		elif type == 1:
			event.value = params['value'] == 'true'
		
		if id == -1:
			event.id = self.idcounter
			self.idcounter += 1
			self.events.append(event)
		else:
			event.id = id
			success = False
			for i in range(len(self.events)):
				if self.events[i].id == id:
					self.events[i] = event
					success = True
			if not success:
				print "fail"
		return event
	
	def getEvent(self, id):
		for event in self.events:
			if event.id == id:
				return event
		return None
		
	def tick(self):
		if self.today != datetime.datetime.today().date():
			self.today = datetime.datetime.today().date()
			for event in self.events:
				event.executed = event.timePassed()
		if self.enabled:
			for event in self.events:
				event.tick()
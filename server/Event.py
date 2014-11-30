import datetime
import FishTank
import Log
import fishfeeder
import Lights

class Event(object):
	def __init__(self):
		self.day = [True for i in range(7)]
		self.minute = 0
		self.hour = 0
		self.type = None
		self.id = 0
		self.executed = False
		
	def getDayInt(self):
		result = 0
		for i in range(7):
			if self.day[i]:
				result += 2**i
		return result
		
	def setDayInt(self, value):
		if value == 0:
			for i in range(7):
				self.day[i] = True
			return
		for i in range(7):
			self.day[i] = value % 2 == 1
			value /= 2
		
	def writeToIni(self, ini, section):
		if not ini.has_section(section):
			ini.add_section(section)
		
		ini.set(section,'id',str(self.id))
		ini.set(section,'type',str(self.type))
		ini.set(section,'day',str(self.getDayInt()))
		ini.set(section,'hour',str(self.hour))
		ini.set(section,'minute',str(self.minute))
		
	def readFromIni(self, ini, section):
		if not ini.has_section(section):
			print("error!")
			return
		self.type = ini.getint(section, 'type')
		self.id = ini.getint(section, 'id')
		self.setDayInt(ini.getint(section, 'day'))
		self.hour = ini.getint(section, 'hour')
		self.minute = ini.getint(section, 'minute')
		self.executed = self.timePassed()
		
	def getSerializeable(self):
		result = {}
		result['day'] = self.getDayInt()
		result['minute'] = self.minute
		result['hour'] = self.hour
		result['type'] = self.type
		result['id'] = self.id
		result['status'] = self.getStatus()
		return result
	
	def getNextExecution(self, after = None):
		t = after if after != None else datetime.datetime.now()
		if (t.replace(hour = self.hour, minute = self.minute, second = 0) < t):
			t += datetime.timedelta(days = 1)
		t = t.replace(hour = self.hour, minute = self.minute, second = 0)
		while (not self.day[t.weekday()]):
			t += datetime.timedelta(days = 1)
		return t
		
	def doesTrigger(self):
		now = datetime.datetime.now()
		return self.day[now.weekday()]
		
	def getStatus(self):
		next = self.getNextExecution()
		return 'Next execution: ' + next.strftime("%d.%m.%Y %H:%M") + '<br>Currently would ' + ('' if self.doesTrigger() else 'not') + ' trigger<br>'
		
	def timePassed(self):
		return datetime.datetime.now().replace(hour = self.hour, minute = self.minute, second = 0) < datetime.datetime.now()
		
	def tick(self):
		if (self.executed):
			return
		if (self.timePassed()):
			if (self.day[datetime.datetime.now().weekday()]):
				self.tryExecute()
				FishTank.FishTank.instance.increaseVersion()
			self.executed = True
			
	def getName(self):
		raise Exception("Not implemented.")
			
	def tryExecute(self):
		try:
			self.execute()
		except:
			Log.Log.instance.write(message = 'Unexpected error while executing event (' + self.getName() + ')', level = 4, startedby = 'event');		

class FeedEvent(Event):
	def __init__(self):
		super(FeedEvent,self).__init__()
		self.food = [True for i in range(6)]
		self.maxSaturation = 1
		self.minAmount = 0
		self.maxAmount = 2
		self.type = 0
		self.id = 0
		
	def getFoodInt(self):
		result = 0
		for i in range(6):
			if self.food[i]:
				result += 2**i
		return result
		
	def setFoodInt(self, value):
		for i in range(6):
			self.food[i] = value % 2 == 1
			value /= 2
		
	def writeToIni(self, ini, section):
		super(FeedEvent,self).writeToIni(ini,section)
		ini.set(section,'food',str(self.getFoodInt()))
		ini.set(section,'maxSaturation',str(self.maxSaturation))
		ini.set(section,'minAmount',str(self.minAmount))
		ini.set(section,'maxAmount',str(self.maxAmount))
		
	def readFromIni(self, ini, section):
		super(FeedEvent,self).readFromIni(ini,section)
		self.setFoodInt(ini.getint(section, 'food'))
		self.maxSaturation = ini.getint(section,'maxSaturation')
		self.minAmount = ini.getint(section,'minAmount')
		self.maxAmount = ini.getint(section,'maxAmount')

	def getSerializeable(self):
		result = super(FeedEvent,self).getSerializeable()
		result['food'] = self.getFoodInt()
		result['maxSaturation'] = self.maxSaturation
		result['minAmount'] = self.minAmount
		result['maxAmount'] = self.maxAmount
		return result
	
	def getContainerCandidates(self):
		# TODO sort
		foodStore = FishTank.FishTank.instance.foodStore
		candidates = [container for container in foodStore.container if (container.food != 0 and container.amount != 0 and container.priority != 3 and self.food[container.food-1] and container.amount >= self.minAmount and container.amount <= self.maxAmount)]
		candidates = sorted(candidates, key = lambda container: (container.priority, container.index - FishTank.FishTank.instance.fishFeeder.position if container.index >= FishTank.FishTank.instance.fishFeeder.position else container.index - FishTank.FishTank.instance.fishFeeder.position + 27))
		return candidates
		
	def getNextExecution(self, after = None):
		t = after if after != None else datetime.datetime.now()
		t += datetime.timedelta(days = max(0, FishTank.FishTank.instance.getSaturation() - self.maxSaturation))
		return super(FeedEvent,self).getNextExecution(t)

	def doesTrigger(self):
		return super(FeedEvent,self).doesTrigger() and FishTank.FishTank.instance.getSaturation() < self.maxSaturation and len(self.getContainerCandidates()) != 0
	
	def getStatus(self):
		return super(FeedEvent,self).getStatus() + 'Container candidates: ' + ', '.join([str(container.index + 1) for container in self.getContainerCandidates()]) + '\n'
		
	def execute(self):
		self.executed = True
		if (FishTank.FishTank.instance.getSaturation() > self.maxSaturation):
			Log.Log.instance.write(message = 'Automatic feeding skipped because fish are not hungry (Saturation: ' + str(FishTank.FishTank.instance.getSaturation()) + ', ' + str(self.maxSaturation) + ' or lower required).', level = 1, startedby = 'event')
			return
		candidates = self.getContainerCandidates()
		if (len(candidates) == 0):
			Log.Log.instance.write(message = 'Automatic feeding failed because no matching food is available.', level = 3, startedby = 'event')
			return
		candidate = candidates[0]
		FishTank.FishTank.instance.fishFeeder.moveToAndDump(candidate.index)
		FishTank.FishTank.instance.updateStatus('Waiting...')
		time.sleep(7)
		imageId = FishTank.FishTank.instance.camera.takePicture();
		if (FishTank.FishTank.instance.fishFeeder.status == fishfeeder.FishFeederStatus.ERROR):
			Log.Log.instance.write(message = 'Automatic feeding failed (mechanical failure).', level = 3, image = imageId, startedby = 'event')
			return
			
		oldsaturation = FishTank.FishTank.instance.getSaturation()
		FishTank.FishTank.instance.setSaturation(oldsaturation + candidate.amount)
		Log.Log.instance.write(title= "Fed fish", message = 'Automatic feeding successful. Fed container ' + str(candidate.index + 1) + ' (Food ' + str(candidate.food) + '), Saturation: ' + "{0:.1f}".format(oldsaturation) + ' -> ' + "{0:.1f}".format(oldsaturation + candidate.amount) + ' (+' + "{0:.1f}".format(candidate.amount) + ')', level = 2, image = imageId, startedby = 'event')
		candidate.empty()
		FishTank.FishTank.instance.increaseVersion()
		
	def getName(self):
		return 'Feed Event'	
		
class LightEvent(Event):
	def __init__(self):
		super(LightEvent,self).__init__()
		self.value = True
		self.type = 1
		
	def writeToIni(self, ini, section):
		super(LightEvent,self).writeToIni(ini,section)
		ini.set(section,'value',str(self.value))
		
	def readFromIni(self, ini, section):
		super(LightEvent,self).readFromIni(ini,section)
		self.value = ini.get(section, 'value') == 'True'
		
	def getSerializeable(self):
		result = super(LightEvent,self).getSerializeable()
		result['value'] = self.value
		return result
		
	def execute(self):
		if (Lights.Lights.instance.value == self.value):
			Log.Log.instance.write(message = 'Turning light ' + ('on' if self.value else 'off') + ' skipped because it''s already ' + ('on' if self.value else 'off') + '.', level = 1, image = imageId, startedby = 'event')
			return
		Lights.Lights.instance.value = self.value
		Lights.Lights.instance.broadcast()
		Log.Log.instance.write(message = 'Turned light ' + ('on' if self.value else 'off') + '.', level = 1, startedby = 'event')
		
	def getName(self):
		return 'Light Event'
	
class PictureEvent(Event):
	def __init__(self):
		super(PictureEvent,self).__init__()
		self.type = 2
		
	def execute(self):					
		self.executed = True
		imageId = FishTank.FishTank.instance.camera.takePicture();
		Log.Log.instance.write(message = 'Took picture (automated)', level = 2, image = imageId, startedby = 'event')
	
	def getName(self):
		return 'Take Picture Event'
